# M2 — Application Shell · Drop-in Package

Branch sequence continues: **M0 → M1 → M2, merge together.**

## What changed

The shell is now **one permanent workspace**, organized by operational flow ("what does the operator need right now"): today first (Tu día), then the day's work (Agenda, Caja), then relationships (Clientes), then the business (Servicios/Equipo/Inventario/Análisis), then Configuración. Navigation is data (`navigation.ts` manifests) — future modules are an array entry, never a redesign.

**Multi-brand ready:** `BrandProvider` injects identity + semantic tokens as CSS variables. **Zero shell components reference an ORNO color** — ORNO is just the default `BrandConfig`. White-label = pass a different config; sidebar, header, bottom nav, palette all re-brand via `bg-primary`/`bg-sidebar`/`ring` semantics, and Logo/AppIcon read assets from the brand context. Verified: no raw hex in `components/shell/` (the only hex anywhere is inside `ORNO_BRAND` and M0 foundations, by design).

## Files created (12)
- `components/shell/`: brand-provider.tsx · navigation.ts · app-shell.tsx · sidebar.tsx · header.tsx · bottom-nav.tsx · command-palette.tsx · page-header.tsx · user-menu.tsx
- `components/ui/skeleton.tsx` (minimal; presets land in M3)
- Replaced: `app/admin/layout.tsx`, `app/employee/layout.tsx`, `app/client/layout.tsx` — **auth guards preserved verbatim** (`useRequireAuth` roles unchanged); creation verbs route to existing flows via query params; sign-out delegates to the existing flow.

## Deleted components (now safe — nothing imports them)
- `components/admin/layout/admin-sidebar.tsx`
- `components/employee/layout/employee-sidebar.tsx` + `employee-bottom-nav.tsx`
- `components/client/layout/client-sidebar.tsx` + `client-bottom-nav.tsx`
- `components/layout/sidebar.tsx` + `components/layout/footer.tsx`
- Route trees `app/dashboard/**` and `app/barber/**` (legacy duplicates of /admin and /employee — verify no inbound links, then delete; interim option: redirect stubs)
- The 5 `delete-confirm-modal.tsx` wrappers from M1 can also go once call-sites import `ConfirmDialog`

## Impact
- **Navigation exists in exactly one place.** 4 sidebars + 2 bottom navs → 1 + 1, fed by 3 role manifests.
- **Pages need zero layout code**: they render inside AppShell; standard pages wrap content in `<ShellContainer>` (1200px, 40px padding) + `<PageHeader>`; full-bleed screens (Agenda) simply don't.
- ⌘K palette ships in the shell: create actions + navigation for every role, extensible with client search via `paletteEntries`.
- Sidebar collapse persisted (localStorage), auto-rail on tablet, BottomNav+FAB <1024px, safe-area padding.
- No queries/permissions/DB touched. `useRequireAuth`, demo-mode, business logic all intact.

## Verification checklist (run after applying)
1. **No duplicate nav:** `grep -r "admin-sidebar\|employee-sidebar\|client-sidebar\|bottom-nav" app/ components/` → only `components/shell/bottom-nav` remains.
2. **Legacy isolated:** `app/dashboard` + `app/barber` have no imports from the new shell; delete or stub them.
3. **Pluggability:** every `app/admin/*/page.tsx` renders inside the shell with no custom layout code (pages that had their own headers should adopt `PageHeader` opportunistically — cosmetic, not blocking).
4. **White-label:** create a test `BrandConfig` with different tokens, pass to `BrandProvider` in one layout → whole workspace re-brands; no shell file edited.
5. ⌘K opens the palette; sidebar collapse survives reload; mobile shows bottom bar with working FAB.

**Stop point: awaiting review before M3 — Feedback & Data components.**
