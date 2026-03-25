

## Plano: Pastoralis Visível para Fiéis + Gestão Completa de Pastorais

### Contexto Atual
- Pastorais já existem no banco (`pastoral_groups`, `pastoral_members`, `pastoral_events`) com CRUD funcional para admins
- O fiel atualmente vê apenas calendário de agendamento + Jornada de Fé (sem acesso a Pastoralis)
- A tabela `pastoral_members` tem `person_name` e `role` (coordenador, vice, tesoureiro, secretário, membro)

### Mudanças Propostas

**1. Adicionar aba "Minhas Pastorais" na tela do Fiel** (`src/components/FielHome.tsx`)
- Nova aba/seção no FielHome mostrando as pastorais das quais o fiel é membro
- Vincular o fiel às pastorais usando a tabela `pastoral_members` (campo `person_id` já existe, será usado com o `auth.uid()`)
- Ao clicar numa pastoral, abre uma view com:
  - Nome, descrição e equipe (coordenador, vice, tesoureiro listados com destaque)
  - Calendário de eventos da pastoral (somente leitura para membros comuns)
  - Se o fiel for coordenador/vice: botão para criar/editar eventos

**2. Novo componente: `FielPastorais.tsx`**
- Lista as pastorais do fiel (busca `pastoral_members` onde `person_id = auth.uid()`)
- Submenu lateral/tabs com cada pastoral
- Dentro de cada pastoral:
  - **Equipe**: cards com coordenador, vice, tesoureiro e membros
  - **Calendário**: eventos da pastoral em formato timeline/lista, com datas futuras em destaque
  - **Ações do coordenador**: criar evento (se role = coordenador ou vice_coordenador)

**3. Vincular fiel à pastoral no cadastro** (`src/components/ProfileModal.tsx`)
- Adicionar campo multi-select "Minhas Pastorais" no modal de perfil do fiel
- Ao selecionar uma pastoral, cria registro em `pastoral_members` com `person_id = auth.uid()` e `role = 'membro'`
- Ao desmarcar, remove o registro

**4. RLS: Permitir fiel gerenciar sua própria participação**
- Nova policy em `pastoral_members`: fiel pode INSERT/DELETE onde `person_id = auth.uid()` e `role = 'membro'`
- Nova policy em `pastoral_events`: fiel pode INSERT onde é coordenador/vice do grupo (subquery em `pastoral_members`)
- Policies de SELECT já existem (tenant-scoped) e cobrem o fiel

**5. Coordenador pode criar eventos** (`PastoralGroups.tsx` ou novo componente)
- No `FielPastorais`, se o fiel tem role `coordenador` ou `vice_coordenador` no grupo, exibir botão "Novo Evento"
- Formulário simples: título, data/hora, descrição
- Insere em `pastoral_events`

### Fluxo do Usuário

```text
Fiel faz login → Tela FielHome
  ├── Calendário de Agendamentos (existente)
  ├── Minhas Pastorais (NOVO)
  │   ├── PLC Masculino ← clica
  │   │   ├── Equipe: Coordenador João, Vice Maria, Tesoureiro Pedro
  │   │   ├── Próximos Eventos: Reunião 28/03, Retiro 15/04
  │   │   └── [Se coordenador] Botão "Novo Evento"
  │   ├── Terço dos Homens
  │   └── Acolhida
  ├── Meus Agendamentos (existente)
  └── Jornada de Fé (existente)

Modal de Perfil:
  ├── Avatar, Nome, Telefone, Endereço, Senha (existente)
  └── Minhas Pastorais: [multi-select das pastorais do tenant] (NOVO)
```

### Arquivos Impactados

| Arquivo | Ação |
|---|---|
| `src/components/FielHome.tsx` | Adicionar seção/aba "Minhas Pastorais" |
| `src/components/FielPastorais.tsx` (novo) | Componente com lista de pastorais, equipe, calendário e ações de coordenador |
| `src/components/FielPastorais.css` (novo) | Estilos do componente |
| `src/components/ProfileModal.tsx` | Multi-select de pastorais |
| Migração SQL | RLS policies para fiel em `pastoral_members` (self-insert/delete) e `pastoral_events` (insert se coordenador) |

### Detalhes Técnicos

- **Vínculo**: usa `pastoral_members.person_id` (já existe na tabela) com `auth.uid()` para identificar o fiel
- **Roles na pastoral**: coordenador e vice podem criar eventos; demais só visualizam
- **Sem mudança de schema**: tabelas `pastoral_groups`, `pastoral_members`, `pastoral_events` já têm todas as colunas necessárias
- **Apenas novas RLS policies** para permitir que o fiel insira/remova sua própria participação e que coordenadores criem eventos

