

## Plano: Visão do Fiel — Agendamento por Disponibilidade + Perfil Completo

### 1. Ocultar Sidebar para o Fiel
- Em `src/App.tsx`: não renderizar `<Sidebar>`, `mobile-menu-btn`, `sidebar-overlay` e `<header>` quando `currentLevel === 'fiel'`
- Em `src/App.css`: classe `.level-fiel .main-content` ocupa 100% da largura

### 2. Redesenhar FielHome (tela principal do fiel)
**Arquivo:** `src/components/FielHome.tsx` + `FielHome.css`

- **Header compacto**: avatar clicável (abre perfil), saudação, nome da paróquia, botão logout
- **Calendário mensal**: dias com horários disponíveis destacados; clicar num dia mostra slots vagos
- **Lista de slots vagos**: intervalos de 30min (6h–20h) não ocupados na agenda do padre; botão "Agendar" abre o wizard pré-preenchido
- **Meus Agendamentos**: próximos compromissos do fiel com status
- **Jornada de Fé**: seção de sacramentos mantida

### 3. API de Slots Disponíveis
**Arquivo:** `src/services/api.ts`

- Novo método `ignisApi.appointments.getAvailableSlots(tenantId, date)` que busca appointments do dia e retorna intervalos de 30min livres entre 6h–20h

### 4. Perfil do Fiel — Campos Adicionais
**Migração de banco**: adicionar colunas `phone` e `address` à tabela `profiles`

**Arquivo:** `src/components/ProfileModal.tsx` + `ProfileModal.css`

O modal já suporta avatar, nome e senha. Será expandido com:
- **Telefone/WhatsApp** (novo campo)
- **Endereço** (novo campo)
- Todos editáveis e salvos na tabela `profiles`

### 5. RLS
As políticas atuais de `profiles` já permitem `UPDATE` do próprio registro (`profiles_update_own`), então os novos campos serão editáveis sem mudança de RLS. A policy `appointments_insert_tenant` já permite o fiel criar agendamentos.

### Fluxo do Usuário

```text
Fiel faz login → Tela cheia (sem sidebar)
  ├── Header: Avatar (abre perfil) + "Salve Maria, [Nome]!" + Sair
  ├── Calendário Mensal (dias com horários livres em destaque)
  │   └── Clica num dia → Lista de slots vagos do padre
  │       └── "Agendar" → Wizard pré-preenchido
  ├── Meus Agendamentos (status: pendente/confirmado)
  ├── Jornada de Fé (sacramentos)
  └── Modal de Perfil: avatar, nome, telefone, endereço, senha
```

### Arquivos Impactados

| Arquivo | Ação |
|---|---|
| `src/App.tsx` | Condicionar sidebar/header para `!== 'fiel'` |
| `src/App.css` | Full-width para nível fiel |
| `src/components/FielHome.tsx` | Redesenho completo com calendário + slots |
| `src/components/FielHome.css` | Novos estilos |
| `src/services/api.ts` | Método `getAvailableSlots()` |
| `src/components/ProfileModal.tsx` | Campos telefone e endereço |
| Migração SQL | `ALTER TABLE profiles ADD COLUMN phone text, ADD COLUMN address text` |

