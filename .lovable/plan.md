

# Plan: Fix 13 Bugs + Address Product Improvements

This is a large batch. I'll prioritize the bugs first (B1-B13), then tackle select improvements. Given scope, I'll group related fixes.

---

## Phase 1: Critical Context Bugs (B1, B13, B10)

**B1 — Governança abre com tenant errado**
- In `ParishesTable.tsx`, the GovernanceModal receives `selectedTenant` which is the row clicked, not the active context tenant. This is actually correct behavior (clicking a row to manage that parish). However, if the intent is to always use the *active* tenant context, I'll verify with the code. Looking at lines 136-139 of ParishesTable, it sets `selectedTenant` to the clicked `parish` row — this is the expected behavior for a table of parishes. The bug may be that the user expects the Governança button to use `activeTenant` from context instead. **Fix:** Change GovernanceModal to use `activeTenant` from TenantContext when opened from ParishesTable, OR clarify the UI so it's obvious which parish is being managed.

**B13 — Modal "Editar" abre com dados erradas**
- Same root cause: `EditParishModal` receives `selectedTenant.id` from the table row click. The `loadParish` function correctly fetches by `parishId`. This should work correctly. Need to verify if `selectedTenant` state is stale. **Fix:** Ensure `selectedTenant` is set immediately before opening the modal (already the case). The issue might be that `selectedTenant` persists from a previous click. Will add state reset in `onClose`.

**B10 — Logo upload não atualiza visualmente**
- In `EditParishModal.tsx` line 101, `setLogoPreview(URL.createObjectURL(file))` correctly shows preview. After save, `finalLogoUrl` is set. The issue: the preview is local but the ParishesTable doesn't refresh the logo. Also, the modal closes on save, so next open should reload. **Fix:** After upload, set `logoPreview` to the new public URL from storage.

## Phase 2: Navigation & Layout (B3, B4, B5, B8, B9)

**B3 — Breadcrumbs não clicáveis**
- Currently breadcrumbs are display-only. **Fix:** Add `onClick` callback prop to `Breadcrumbs`. First item ("IGNIS") navigates to `home` tab. Intermediate items navigate to the appropriate level/tab. Last item is not clickable (current page).

**B4 — Dashboard de Infraestrutura dentro de Configurações**
- Currently `activeTab === 'settings'` renders `<UserManagement />`. The page title says "Dashboard de Infraestrutura" but that's the header for the `super` level, not settings-specific. The `SystemHealth` component renders under `home` tab. **Fix:** The title is level-based, not tab-based. Change the page title to be tab-aware so "Configurações" shows "Gestão de Usuários" instead of "Dashboard de Infraestrutura".

**B5 — Gestão de Usuários como aba separada no sidebar**
- Currently under `settings`. **Fix:** Add a new nav item `{ icon: UserCog, label: 'Usuários', id: 'users' }` visible only for `super_admin`. Move `UserManagement` from `settings` tab to `users` tab. Keep `settings` for actual settings (if any) or remove it.

**B8 — Agenda do Padre visível para Super Admin**
- Sidebar line 48: `if (item.id === 'priest-agenda') return userLevel === 'super' || userLevel === 'matriz'`. **Fix:** Remove `'super'` so it only shows for `matriz`.

**B9 — Relatórios não aparecem no sidebar**
- Sidebar filter: `reports` must be in `activeTenant.active_modules`. Default `active_modules` is `['missio', 'sacramenta', 'pastoralis']` — `reports` is not included. **Fix:** Always show `reports` for `super` and `matriz` levels, similar to how `priest-agenda` and `global-map` are handled.

## Phase 3: Visual & Data Fixes (B6, B7, B12)

**B6 — Cards KPI muito grandes**
- `stat-value` is `font-size: 32px`, `stat-card` has `padding: 24px`, `minmax(240px, 1fr)`. **Fix:** Reduce `stat-value` to 24px, padding to 16px, min-width to 180px for denser cards.

**B7 — SystemHealth cards hardcoded**
- Remove the `SystemHealth` component from the super admin home view entirely. It shows fake infra data (uptime, latency, CPU, regions) that's irrelevant for parish managers. Replace with a summary card showing real data (total parishes, total communities, recent activity).

**B12 — Paleta modo claro inconsistente**
- `SystemHealth` cards use `var(--surface)` and `var(--border)` which should adapt to theme. If they don't, the CSS variables in the light theme override need to cover these. **Fix:** Audit `SystemHealth.css` and ensure all color references use theme variables. Since B7 removes SystemHealth, this is partially resolved. For remaining components, ensure `.glass` and card backgrounds use proper theme tokens.

## Phase 4: Governance Access (B2)

**B2 — Governança restrita ao Super Admin**
- The GovernanceModal itself has no role check. It's accessed via ParishesTable which is only rendered for `super` level. **Fix:** For `matriz` level, add governance access to `CommunitiesManager` (which is visible at matriz level), allowing `matriz_admin` to manage their own communities' transfers.

## Phase 5: Dashboard Differentiation (B11)

**B11 — Dashboard igual nos módulos**
- `AnalyticsDashboard` is only used in `MatrizDashboard`. The three modules (Sacramenta, Missio, Pastoralis) don't currently embed it — they have their own views. However, if the same analytics component appears in multiple places, **Fix:** Pass a `domain` prop to `AnalyticsDashboard` to query domain-specific data, or remove it from non-Missio contexts.

---

## Files to modify:

| File | Changes |
|------|---------|
| `src/components/Sidebar.tsx` | B5: Add "Usuários" nav item; B8: Remove priest-agenda from super; B9: Always show reports for super/matriz; Show user profile from auth context |
| `src/App.tsx` | B4: Tab-aware page titles; B5: Move UserManagement to `users` tab; B7: Remove SystemHealth from home; B3: Pass tab navigation to Breadcrumbs |
| `src/components/Breadcrumbs.tsx` | B3: Add onClick navigation, accept `onNavigate` + `activeTab` props |
| `src/App.css` | B6: Smaller stat cards |
| `src/components/SystemHealth.tsx` | B7: Remove or replace with real summary widget |
| `src/components/ParishesTable.tsx` | B1/B13: Ensure correct tenant context for modals |
| `src/components/EditParishModal.tsx` | B10: Update logoPreview with public URL after upload |
| `src/components/Governance/GovernanceModal.tsx` | B2: No changes needed (access control is in routing) |
| `src/index.css` | B12: Ensure light theme variables cover all surfaces |

---

## Estimated changes: ~10 files, no database migrations needed.

This plan addresses all 13 bugs. The product improvements (M1-M5) are larger features that should be tackled separately after bugs are resolved.

