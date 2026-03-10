

# Phase 0: Critical Fixes (DB + Code)

## Phase 0A: Database Migration

Single atomic migration with 3 parts:

### 1. Drop all RESTRICTIVE policies + recreate as PERMISSIVE

All 6 tables (`tenants`, `sub_tenants`, `profiles`, `appointments`, `sacraments`, `people`) — drop every existing policy, recreate with same logic but PERMISSIVE (Postgres default).

Key policy logic preserved:
- **tenants/sub_tenants**: authenticated can SELECT, super_admin can ALL
- **profiles**: own user can SELECT/UPDATE/INSERT + admins can SELECT tenant profiles
- **appointments/sacraments/people**: tenant members can SELECT, tenant members can INSERT, admins can ALL

### 2. Expand sacraments.type CHECK constraint

Drop existing `sacraments_type_check`, add new one with all 5 types: `baptism`, `marriage`, `confirmation`, `first_communion`, `anointing_of_sick`.

### 3. Re-enable auth trigger

```sql
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

The `handle_new_user()` function already exists and assigns default tenant + `fiel` role.

---

## Phase 0B: Application Code

### 1. Level Switcher restricted by role (`src/App.tsx`)

Add role-to-levels mapping:
```ts
const levelsByRole = {
  super_admin: ['super', 'matriz', 'comunidade', 'fiel'],
  matriz_admin: ['matriz', 'comunidade', 'fiel'],
  comunidade_lead: ['comunidade', 'fiel'],
  fiel: ['fiel'],
};
```

- Filter `<select>` options based on `profile.role`
- Set initial `currentLevel` based on role (not hardcoded `'super'`)
- If role changes and current level is no longer allowed, auto-reset

### 2. Edge Function `create-parish-admin` (`supabase/functions/create-parish-admin/index.ts`)

New edge function that receives `{ name, cnpj, diocese, adminName, adminEmail, adminPassword, modules }` and:
1. Creates tenant row with `active_modules`
2. Creates auth user via `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
3. Creates profile with `role: 'matriz_admin'` linked to new tenant
4. Creates default sub_tenant "Matriz Principal"
5. Returns `{ tenantId, userId }` or error

Uses `SUPABASE_SERVICE_ROLE_KEY` (already configured). Validates caller is `super_admin` via JWT.

### 3. Update OnboardingModal (`src/components/OnboardingModal.tsx`)

- Track selected modules in state (currently checkboxes are uncontrolled)
- Replace `ignisApi.tenants.create()` with `supabase.functions.invoke('create-parish-admin', { body: formData })`
- Replace `alert()` with `toast.success()` / `toast.error()`
- Pass all fields: name, cnpj, diocese, adminName, adminEmail, adminPassword, modules

---

## Validation Checklist
1. Fiel can SELECT their appointments
2. Admin can SELECT all tenant data
3. INSERT sacrament with `type='first_communion'` succeeds
4. New signup auto-creates profile row
5. Fiel sees only "Visão Fiel" in level switcher
6. OnboardingModal creates tenant + admin + sub_tenant atomically

