

# Plano: Itens Faltantes da Phase 1 Optimization

## Itens Pendentes (do checklist)

| Item | Status | Ação |
|------|--------|------|
| Melhoria 4: WhatsApp no check-in | ⚠️ Parcial | Enviar notificação ao fazer check-in |
| Melhoria 5: Google Calendar | ❌ Recusado | Não implementar |
| Melhoria 6: Preferência de tema salva | ⚠️ Parcial | Persistir escolha claro/escuro |

---

## 1. WhatsApp no Check-in (Melhoria 4)

**Problema:** A notificação WhatsApp já é enviada ao criar agendamento (em `AppointmentModal`), mas **não** é enviada quando o Padre faz check-in na `PriestAgenda`.

**Solução:** Em `PriestAgenda.tsx`, na função `handleCheckIn`, após `updateStatus`, chamar `ignisApi.notifications.sendWhatsAppConfirmation(appointment.id)` com try/catch silencioso (falha não bloqueia check-in).

**Nota:** Os secrets Z-API (`ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`) **não estão configurados** no projeto. A Edge Function `send-whatsapp` existe mas depende desses secrets. Precisarei solicitar que você configure essas credenciais para que funcione de fato. Sem elas, a chamada será feita mas retornará erro silencioso.

---

## 2. Persistência de Tema (Melhoria 6)

**Problema:** O tema escuro está otimizado visualmente, mas a preferência do usuário não é salva.

**Solução:** 
- Adicionar coluna `theme_preference` (text, default `'dark'`) à tabela `profiles`
- Criar um toggle de tema no header/sidebar
- Ao trocar tema, salvar no `profiles` e aplicar classe CSS (`data-theme="light"` ou `data-theme="dark"` no `<html>`)
- Ao fazer login, carregar preferência do perfil e aplicar

**Alternativa simples (sem DB):** Usar `localStorage` para persistir. Mais rápido, sem migração, funciona offline. Recomendo esta abordagem.

---

## Resumo de Entregas

1. **Adicionar chamada WhatsApp no `handleCheckIn`** — 1 arquivo (`PriestAgenda.tsx`)
2. **Persistência de tema via localStorage** — 2-3 arquivos (hook `useTheme`, integração no layout, toggle no header)

Tempo estimado: ~30 minutos.

