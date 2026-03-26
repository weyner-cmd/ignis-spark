

# Auditoria Arquitetural IGNIS — Diagnóstico Completo

## 1. Auditoria de Duplicidade de Dados

### 1.1 Redundância entre `people` e `pastoral_members`

**Diagnostico:** A tabela `pastoral_members` armazena `person_name` como texto livre, sem foreign key para `people.id`. Isso cria duplicidade de nomes e impossibilita sincronização automática (se o fiel muda de nome em `people`, `pastoral_members` fica desatualizado).

**Risco:** Dados inconsistentes entre módulos. Relatórios cruzados (ex: "fiéis ativos em pastorais") exigem matching por string, sujeito a falha. Custo operacional de manutenção manual.

**Solucao Tecnica:** Tornar `person_id` NOT NULL em `pastoral_members` e usar como FK para `people.id`. Manter `person_name` como campo desnormalizado (cache) atualizado via trigger.

```sql
-- Migration
ALTER TABLE pastoral_members 
  ADD CONSTRAINT fk_pastoral_members_person 
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;

-- Trigger para manter person_name sincronizado
CREATE OR REPLACE FUNCTION sync_pastoral_member_name()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE pastoral_members SET person_name = NEW.name WHERE person_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_person_name_change
  AFTER UPDATE ON people FOR EACH ROW
  EXECUTE FUNCTION sync_pastoral_member_name();
```

### 1.2 `sacraments.subject_name` vs `people.name`

**Diagnostico:** Mesmo padrão — `subject_name` duplica o nome do fiel sem vínculo forte com `people`. O campo `subject_id` existe mas é nullable e sem FK constraint.

**Risco:** Certificados sacramentais podem exibir nome diferente do cadastro principal. Busca por histórico sacramental de uma pessoa depende de matching por UUID quando disponível, ou por string quando não.

**Solucao Tecnica:** Adicionar FK constraint em `subject_id → people.id` e manter `subject_name` como snapshot imutável (nome no momento do sacramento — justificável para registros canônicos).

```sql
ALTER TABLE sacraments
  ADD CONSTRAINT fk_sacraments_subject 
  FOREIGN KEY (subject_id) REFERENCES people(id) ON DELETE SET NULL;
```

### 1.3 Constraints Ausentes Criticas

**Diagnostico:** Nenhuma tabela possui UNIQUE constraint composta com `tenant_id`. Exemplos:
- `people` pode ter dois registros com mesmo CPF no mesmo tenant
- `pastoral_groups` pode ter nomes duplicados no mesmo tenant
- `staff` pode ter registros duplicados

**Solucao Tecnica:**
```sql
CREATE UNIQUE INDEX idx_people_cpf_tenant ON people(tenant_id, cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX idx_pastoral_groups_name_tenant ON pastoral_groups(tenant_id, name);
CREATE UNIQUE INDEX idx_staff_email_tenant ON staff(tenant_id, email) WHERE email IS NOT NULL;
```

### 1.4 Foreign Keys Ausentes nas Tabelas Principais

**Diagnostico:** Conforme o schema real do banco, **nenhuma tabela possui foreign keys** (confirmado pelo output "No foreign keys" em todas). As referências `tenant_id`, `sub_tenant_id`, `group_id` existem como colunas mas sem constraints de integridade.

**Risco:** Critico. Registros orfãos ao deletar tenants, groups ou sub_tenants. Deleção em cascata não funciona sem FKs reais.

**Solucao Tecnica:**
```sql
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_subtenant FOREIGN KEY (sub_tenant_id) REFERENCES sub_tenants(id) ON DELETE CASCADE;
ALTER TABLE sacraments ADD CONSTRAINT fk_sacraments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE people ADD CONSTRAINT fk_people_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE staff ADD CONSTRAINT fk_staff_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pastoral_groups ADD CONSTRAINT fk_pastoral_groups_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pastoral_members ADD CONSTRAINT fk_pastoral_members_group FOREIGN KEY (group_id) REFERENCES pastoral_groups(id) ON DELETE CASCADE;
ALTER TABLE pastoral_members ADD CONSTRAINT fk_pastoral_members_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pastoral_events ADD CONSTRAINT fk_pastoral_events_group FOREIGN KEY (group_id) REFERENCES pastoral_groups(id) ON DELETE CASCADE;
ALTER TABLE pastoral_events ADD CONSTRAINT fk_pastoral_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tithes ADD CONSTRAINT fk_tithes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE parish_assets ADD CONSTRAINT fk_parish_assets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
```

---

## 2. Auditoria de Logica Distribuida

### 2.1 Business Logic Leakage — Front-end processando regras do Back-end

**Diagnostico:** Multiplos casos criticos identificados:

| Local | Logica Vazada | Severidade |
|---|---|---|
| `api.ts:325-368` `getAvailableSlots` | Calculo de slots disponíveis (conflito de horário) roda inteiramente no client. Faz N+1 queries (uma por comunidade) e filtra no JS. | **Alta** |
| `api.ts:665-679` `getGlobalStats` | Busca TODAS as appointments e communities, depois faz `.filter()` no JS para agregar por tenant. | **Alta** |
| `AnalyticsDashboard.tsx:9-60` | Dados 100% hardcoded/mock. Nenhuma query real. | **Media** |
| `useDashboardKPIs.ts:41-126` | 5-8 queries paralelas por carregamento de dashboard, sem agregação server-side. | **Media** |
| `SacramentRegistry.tsx` | Busca TODOS os sacramentos do tenant e filtra por `type` no client (`filter(s => s.type === type)`). | **Media** |
| `Sidebar.tsx:82-92` `isItemVisible` | Logica de permissão de menu duplicada no front (deveria ser derivada do role + modules, mas hardcoda condições como `userLevel === 'matriz'`). | **Baixa** |

**Solucao Tecnica — getAvailableSlots:**
```sql
-- Database function para slots disponíveis
CREATE OR REPLACE FUNCTION get_available_slots(
  p_tenant_id uuid, p_date date, p_interval_min int DEFAULT 30
) RETURNS TABLE(slot_time time) AS $$
  WITH slots AS (
    SELECT generate_series(
      '06:00'::time, '20:00'::time, (p_interval_min || ' minutes')::interval
    ) AS t
  ),
  occupied AS (
    SELECT start_time::time AS s, end_time::time AS e
    FROM appointments
    WHERE tenant_id = p_tenant_id
      AND start_time::date = p_date
      AND status != 'cancelled'
  )
  SELECT s.t FROM slots s
  WHERE NOT EXISTS (
    SELECT 1 FROM occupied o WHERE s.t < o.e AND s.t + (p_interval_min || ' min')::interval > o.s
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Solucao Tecnica — getGlobalStats:**
```sql
CREATE OR REPLACE FUNCTION get_global_parish_stats()
RETURNS TABLE(id uuid, name text, communities_count bigint, active_appointments bigint, total_appointments bigint) AS $$
  SELECT t.id, t.name,
    (SELECT count(*) FROM sub_tenants WHERE tenant_id = t.id),
    (SELECT count(*) FROM appointments WHERE tenant_id = t.id AND status = 'confirmed'),
    (SELECT count(*) FROM appointments WHERE tenant_id = t.id)
  FROM tenants t WHERE t.status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 2.2 RBAC — Permissoes Espalhadas

**Diagnostico:** A logica de permissão esta fragmentada em **4 camadas** sem fonte unica de verdade:

1. **RLS Policies** — usam `get_my_role()` (correto, centralizado)
2. **Edge Functions** — `manage-user` e `create-parish-admin` re-verificam role via query ao `profiles` (duplicação da logica RLS)
3. **Front-end `App.tsx`** — `levelsByRole` (linhas 42-47) hardcoda quais roles podem acessar quais niveis
4. **Front-end `Sidebar.tsx`** — `isItemVisible` (linhas 82-92) hardcoda regras de visibilidade por item

**Risco:** Mudança de roles (ex: adicionar "padre" como nível) exige alterações em 4+ arquivos. O front-end pode exibir/esconder funcionalidades que o RLS permite ou bloqueia de forma inconsistente.

**Solucao Tecnica:**
- Criar uma tabela `role_permissions` ou retornar permissões do backend via RPC
- No front, consumir as permissões de um unico endpoint em vez de hardcodar

```sql
-- Exemplo: RPC que retorna capabilities do usuario
CREATE OR REPLACE FUNCTION get_my_permissions()
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'role', p.role,
    'tenant_id', p.tenant_id,
    'allowed_levels', CASE p.role
      WHEN 'super_admin' THEN '["super","matriz","comunidade","fiel"]'::jsonb
      WHEN 'matriz_admin' THEN '["matriz","comunidade","fiel"]'::jsonb
      WHEN 'comunidade_lead' THEN '["comunidade","fiel"]'::jsonb
      ELSE '["fiel"]'::jsonb
    END,
    'modules', COALESCE((SELECT active_modules FROM tenants WHERE id = p.tenant_id), ARRAY['missio','sacramenta','pastoralis'])
  )
  FROM profiles p WHERE p.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 3. Otimizacao e Melhorias

### 3.1 Estrategia de Caching por Tenant

**Diagnostico:** Cada navegação entre tabs refaz todas as queries (sem React Query, sem stale-time). O `README.md` menciona `@tanstack/react-query` mas o codigo usa `useState` + `useEffect` em todos os componentes.

**Risco:** Queries desnecessarias multiplicadas pelo numero de usuarios simultaneos por tenant.

**Solucao Tecnica:**
```text
Camada 1: React Query com staleTime por tipo de dado
  - Tenants/Communities: staleTime = 5min (muda raramente)
  - Appointments: staleTime = 30s (muda frequentemente)  
  - People/Sacraments: staleTime = 2min

Camada 2: Query keys incluem tenant_id
  - queryKey: ['appointments', tenantId, subTenantId, dateRange]
  - Troca de tenant invalida automaticamente o cache

Camada 3: Invalidacao via Realtime
  - Ao receber evento postgres_changes, invalidar query key correspondente
```

**Exemplo de refactoring:**
```typescript
// hooks/useAppointments.ts
export function useAppointments(tenantId: string, subTenantId: string, start: Date, end: Date) {
  return useQuery({
    queryKey: ['appointments', tenantId, subTenantId, start.toISOString(), end.toISOString()],
    queryFn: () => ignisApi.appointments.getByDateRange(tenantId, subTenantId, start, end),
    staleTime: 30_000,
    enabled: !!tenantId && !!subTenantId,
  });
}
```

### 3.2 Logs de Auditoria sem Degradacao de Performance

**Diagnostico:** Não existe nenhum sistema de audit trail. Ações criticas (deletar paroquia, mudar role, excluir sacramento) não são rastreadas.

**Solucao Tecnica:** Tabela de audit log com trigger generico async-safe:

```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  action text NOT NULL,        -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Particionar por mês para performance
CREATE INDEX idx_audit_tenant_date ON audit_log(tenant_id, created_at DESC);

-- Trigger generico (aplicar nas tabelas criticas)
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log(tenant_id, user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em tabelas criticas
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
CREATE TRIGGER audit_sacraments AFTER INSERT OR UPDATE OR DELETE ON sacraments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
CREATE TRIGGER audit_profiles AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
```

**Performance:** Triggers `AFTER` são non-blocking. O indice `(tenant_id, created_at DESC)` permite consultas eficientes. Particionar por mês (`audit_log_2026_03`) evita degradação com volume.

---

## 4. Resumo de Prioridades

| Prioridade | Item | Impacto |
|---|---|---|
| **P0** | Adicionar Foreign Keys em todas as tabelas | Integridade referencial |
| **P0** | UNIQUE constraints com tenant_id | Prevenir duplicatas |
| **P1** | Mover getAvailableSlots e getGlobalStats para DB functions | Reduzir N+1, reduzir trafego |
| **P1** | Implementar React Query com cache por tenant | Reduzir queries em 60-80% |
| **P2** | Centralizar RBAC via RPC em vez de hardcoding | Manutenibilidade |
| **P2** | Criar audit_log com triggers | Compliance e rastreabilidade |
| **P3** | Conectar AnalyticsDashboard/ReportsPanel ao banco | Substituir dados mock |

