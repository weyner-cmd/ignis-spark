# Ignis - Sistema de Gestão Pastoral

Este documento contém o planejamento base e Roadmap para a construção do **Ignis**, focado na gestão sacramental e paroquial.

## Roadmap & Planejamento Revisado

### FASE 0 — FUNDAÇÃO (bloqueante)
- [x] **[0.1]** Auth Supabase validado (login, logout, refresh token)
- [x] **[0.2]** RLS policies revisadas
- [x] **[0.3]** Tipografia Cinzel + Lato aplicada globalmente
- [x] **[0.4]** React Query configurado
- [x] **[0.5]** Schema Supabase atualizado (status 'remarcado', celebrant_name)

### FASE 1 — MVP MISSIO PONTA A PONTA
- [x] **[M1]** Visão Diária refatorada com design da referência
- [x] **[M4]** Switcher de visões (Abas)
- [x] **[M5]** Formulário de agendamento (Drawer Modal) com máscara WhatsApp e dropdown de Padre
- [x] **[M4b]** Filtros (Comunidades, etc.)
- [x] **[M6]** Modal de detalhes de Agendamento + permissões por perfil
- [x] Testes de integração (CRUD de appointments via Supabase)

### FASE 2 — EXPANSÃO MISSIO + OUTROS MÓDULOS
- [x] **[M2]** Visão Semanal
- [x] **[M3]** Visão Mensal
- [x] Modelagem e tela Sacramenta conectado ao backend
- [x] Modelagem e tela Pastoralis conectado ao backend
- [ ] Polimento visual contínuo

### FASE 3 — PRODUÇÃO
- [ ] Responsividade + acessibilidade (WCAG)
- [ ] Error boundaries + toast notifications
- [ ] CI/CD (GitHub Actions → Vercel/Netlify)
- [ ] Testes E2E (Playwright)

---

## Stack
- Vite + React + TypeScript
- @tanstack/react-query
- lucide-react (Icons)
- Lovable Cloud / Supabase (Auth, RLS, Database, Edge Functions)
- date-fns
- recharts
- react-hot-toast

## Banco de Dados
Tabelas criadas com RLS ativo:
- `tenants` — Paróquias
- `sub_tenants` — Comunidades / Capelas
- `profiles` — Perfis de usuário (auto-criados no signup)
- `appointments` — Agendamentos (Missio)
- `sacraments` — Batismos, Matrimônios, Crismas (Sacramenta)
- `people` — Diretório de fiéis (Pastoralis)
