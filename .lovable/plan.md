

# Correção: Usuários sem tenant_id não aparecem na Gestão de Usuários

## Problema
- 4 de 7 perfis têm `tenant_id = NULL`
- O componente `UserManagement` filtra `.eq('tenant_id', activeTenant.id)`, ocultando esses usuários
- O trigger `handle_new_user` usa `SELECT id FROM tenants WHERE status = 'active' LIMIT 1`, que pode retornar NULL se não existia tenant ou se o `LIMIT 1` é não-determinístico

## Solução em 2 partes

### 1. Correção de dados existentes (Migration)
Atribuir os 4 perfis órfãos ao tenant correto via SQL:
- **Weyner de Souza Cardoso** (super_admin) → manter sem tenant (super_admin gerencia todos)
- **Willes Junior** (fiel) → precisa de tenant para funcionar
- **Paróquia São João Teste** (matriz_admin) → precisa de tenant

Uma migration que atribui o primeiro tenant ativo a perfis com `tenant_id IS NULL AND role != 'super_admin'`.

```sql
UPDATE profiles 
SET tenant_id = (SELECT id FROM tenants WHERE status = 'active' ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL AND role NOT IN ('super_admin');
```

### 2. Melhoria no UserManagement para super_admin
Na tela de Gestão de Usuários, quando o usuário é `super_admin`, mostrar também perfis com `tenant_id IS NULL` como "Sem Paróquia" para que possam ser atribuídos.

**Arquivo:** `src/components/UserManagement.tsx`
- Adicionar indicador visual para usuários sem tenant
- Permitir que super_admin veja e reatribua esses perfis

### 3. Proteção no trigger
Melhorar `handle_new_user` para usar `ORDER BY created_at` e garantir determinismo:
```sql
SELECT id INTO default_tenant_id 
FROM public.tenants 
WHERE status = 'active' 
ORDER BY created_at ASC 
LIMIT 1;
```

## Detalhes Técnicos
- Migration SQL para corrigir dados existentes
- Edição de `UserManagement.tsx` para incluir filtro de perfis órfãos
- Atualização da function `handle_new_user` para ser determinística

