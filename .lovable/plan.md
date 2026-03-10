

# Plano de Deploy — Ignis Sistema de Gestão Pastoral

## Correção Importante

O checklist menciona `NEXT_PUBLIC_SUPABASE_URL` e Vercel/Next.js, mas este projeto usa **Vite + React** (não Next.js) e está no **Lovable Cloud**. O deploy é diferente e mais simples.

---

## Passo 1: Verificar Build (2 min)

O projeto já compila via `vite build`. Basta confirmar que o preview está funcionando sem erros no console. Não há necessidade de rodar `npm run build` localmente — o Lovable faz isso automaticamente.

## Passo 2: Variáveis de Ambiente

As variáveis do projeto são gerenciadas automaticamente pelo Lovable Cloud:

| Variável | Status |
|----------|--------|
| `VITE_SUPABASE_URL` | ✅ Configurada automaticamente |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Configurada automaticamente |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Secret existe |
| `ZAPI_INSTANCE_ID` | ❌ Não configurado (WhatsApp não funcionará) |
| `ZAPI_TOKEN` | ❌ Não configurado (WhatsApp não funcionará) |

**Ação necessária:** Se quiser WhatsApp ativo em produção, configurar os secrets Z-API antes do deploy.

## Passo 3: Deploy

No Lovable, o deploy é feito pelo botão **Publish** (canto superior direito do editor):

1. Clicar em **Publish**
2. Confirmar o deploy
3. O app fica disponível na URL `*.lovable.app`

Backend (edge functions, migrações) já está deployado automaticamente. O Publish aplica apenas o frontend.

**Alternativa GitHub:** Se o repositório está conectado ao GitHub, pode-se fazer deploy em qualquer plataforma (Netlify, Vercel, Cloudflare Pages) apontando para o repo. As variáveis de ambiente precisariam ser configuradas manualmente nessas plataformas usando o prefixo `VITE_` (não `NEXT_PUBLIC_`).

## Passo 4: Validação Pós-Deploy

Após publicar, verificar:

1. **Site carrega** — URL `.lovable.app` sem erros
2. **Login funciona** — Email/senha, dashboard carrega
3. **Agenda Visual** — Grid de horários, filtro por status, busca por nome
4. **Realtime** — Agendamento criado aparece sem refresh
5. **KPIs** — Dados reais do banco (não hardcoded)
6. **Tema** — Toggle claro/escuro persiste após reload
7. **Mobile** — Layout responsivo em celular

## Domínio Customizado (Opcional)

Se quiser um domínio próprio (ex: `ignis.suaparquia.com.br`):
- Project Settings → Domains → Conectar domínio customizado
- Requer plano pago do Lovable

