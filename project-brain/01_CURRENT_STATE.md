# 01 — Current State

> **Scope**: This document describes ORNO exactly as it exists in the repository today, on branch `work/cambios-personales`, verified against source code, SQL migrations, and git history. Nothing in this document is aspirational. For the intended future architecture, see [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md). Any claim that could not be independently verified from code is explicitly marked **Needs Validation**.

---

## 1. Where is ORNO today?

ORNO is a **single-tenant** barbershop/salon management application (Next.js + Supabase), currently in **active MVP development**, `v0.1.0` per `package.json`, **not deployed to production**. It runs in two interchangeable modes:

| Mode | Trigger | Data | Access control |
|---|---|---|---|
| **Demo mode** | `NEXT_PUBLIC_SUPABASE_URL` unset or contains `"demo"` (`lib/demo-config.ts:211-214`) | Hardcoded in-memory fixtures (`lib/demo-config.ts`, `lib/demo-appointments.ts`, `lib/demo-blocks-store.ts`) | 100% client-side (`localStorage`), bypassable from DevTools |
| **Production mode** | Real Supabase env vars present | Postgres via Supabase, RLS policies from `scripts/*.sql` | `middleware.ts` + RLS, **never verified against a live instance** |

Both modes are fully wired into every business module. Demo mode is not a stripped-down preview — it's a parallel data path that exists throughout the codebase, which is itself a source of duplication (see [07_TECH_DEBT.md](07_TECH_DEBT.md)).

There is **no multi-tenant schema**: a repo-wide search for `tenant_id`/`business_id` across all 31 SQL migrations in `scripts/` returns zero matches. `business_settings` (from `scripts/19-business-settings-rls-and-seed.sql`) is a flat key-value table with no business foreign key. ORNO today manages **one business per deployment**, not many businesses under one tenant-scoped instance. Any documentation or vision material that describes ORNO as "multi-tenant white-label SaaS" is describing the **target**, not the current build — see [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) and [03_PRODUCT.md](03_PRODUCT.md).

---

## 2. Stack

- **Framework**: Next.js 15.2.4 (App Router), React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 3.4, hardcoded design values (no token layer — see §6)
- **UI primitives**: shadcn/ui (`components.json`, style `default`, base color `neutral`) over Radix UI — 12 primitives in `components/ui/` (alert, avatar, badge, button, card, dialog, input, label, select, separator, textarea, toast)
- **Backend**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — Postgres + Auth + RLS
- **State**: Zustand
- **Forms/validation**: React Hook Form + Zod
- **Notifications**: Resend (email) + Twilio (WhatsApp) via `notification_queue` table (`scripts/31-notification-queue.sql`) processed by a Supabase Edge Function (`supabase/functions/process-notification-queue`)
- **Rate limiting**: dual backend in `lib/rate-limit.ts` — `UpstashRateLimiter` (Redis) when `UPSTASH_REDIS_REST_URL`/`TOKEN` are set, `InMemoryRateLimiter` (Map-based) fallback otherwise; logs a warning if running in-memory under `NODE_ENV=production`
- **Reports/export**: Recharts, jsPDF, XLSX
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e)
- **Package manager**: pnpm 10.14.0 (pinned via `packageManager`)

---

## 3. Application structure (`app/`)

Route segments and their nature (Server vs Client Component, verified via `"use client"` directives):

| Segment | Purpose | Component type |
|---|---|---|
| `app/admin/*` | Admin dashboard — appointments, billing, clients, employees, integrations, inventory, pos, reports, services, settings, share (12 pages) | Client (all pages + layout) |
| `app/employee/*` | Employee dashboard — appointments, history, profile, schedule, stats, time-tracking | Client (all pages + layout) |
| `app/client/*` | Client self-service portal — appointments, book, history, profile | Client (all pages + layout) |
| `app/auth/*` | Login, register, forgot/reset password | Mostly Client; `app/auth/register/page.tsx` is a thin Server wrapper |
| `app/barber/*` | Legacy employee dashboard | Client — **orphaned**, see §7 |
| `app/reservar/page.tsx` | Public booking, no account required | Client, reads demo fixtures directly |
| `app/book/[slug]/page.tsx` | Public per-shop booking link | Client |
| `app/dashboard/*` | Role dispatcher | Client |
| `app/api/*` | 24 route handlers: appointments (+cancel/rate/reschedule/admin/form-data), attendance, auth (activate/callback/forgot-password/login), availability, bookings/public, clients, dashboard/stats, employees (+commission), inventory, loyalty, notifications (queue/send), pos, reports, schedule-blocks, test-notifications | Route handlers |
| `app/layout.tsx`, `app/page.tsx`, `app/providers.tsx` | Root shell, landing page, provider composition | Root layout is Server; landing page and providers are Client |

**Almost every page-level route is a Client Component.** Server Components are the exception, not the norm.

**Dead code found in `app/api/`**: `alerts_backup/` — a backup route left in the tree alongside the real `alerts/` route. Needs Validation on whether it's safe to delete (see [07_TECH_DEBT.md](07_TECH_DEBT.md)).

### Layout composition — no shared shell

There is **no central "Application Shell."** Each role tree owns its layout independently:

- `app/providers.tsx` composes exactly one provider at the root: `AuthProvider` (`hooks/useAuth.tsx`). No theme provider, no brand/tenant provider.
- `components/theme-provider.tsx` (wraps `next-themes`) **exists but is dead code** — not imported anywhere outside its own file.
- `app/dashboard/layout.tsx`, `app/admin/layout.tsx`, `app/employee/layout.tsx`, `app/client/layout.tsx` each implement **their own** auth guard and **their own** sidebar component (`components/admin/layout/admin-sidebar.tsx`, `components/employee/layout/employee-sidebar.tsx`, `components/client/layout/*`, plus the generic `components/layout/sidebar.tsx` used only by `app/dashboard`).

This is the concrete gap that a future Application Shell / BrandProvider / TenantProvider would need to close — see [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md).

**Correction on theming** (verified directly in `app/globals.css`, not just inferred): there **is** a real, scoped semantic-token block — `[data-theme="orno-admin"]` (`app/globals.css:100-129`) — defining `--background`, `--card`, `--primary` (`#E53935`), `--secondary`, `--muted`, `--border`, `--sidebar-*`, etc. as HSL CSS custom properties, consumed by Tailwind color aliases in `tailwind.config.ts` (`background: 'hsl(var(--background))'`, etc.). All three role layouts — `app/admin/layout.tsx:58`, `app/employee/layout.tsx:55`, `app/client/layout.tsx:27` — apply `data-theme="orno-admin"`, so the token scope **is** shared across admin/employee/client today, just under a name that only makes sense for the admin tree. The real debt is duplication, not absence: each of those three layout files **also** re-hardcodes the same literal hex values (`#0F0F0F`, `#2E2E2E`, `#3A3A3A`) a second time in inline `style` props and embedded `<style>` blocks (scrollbar theming) instead of only referencing the CSS variables already defined once in `globals.css`. A separate, generic shadcn default light/dark token set also exists at the top of `globals.css` (lines 15-56) and appears superseded by the `orno-admin` block for any screen that sets the attribute. `components/theme-provider.tsx` (next-themes wrapper) is unrelated to this token system and remains dead code.

---

## 4. `components/` organization

```
components/
├── theme-provider.tsx      (dead code — unused)
├── admin/                  appointments/, clients/, employees/, inventory/, services/, layout/ (admin-sidebar.tsx)
├── auth/                   login-form, register-form, terms-modal
├── booking/                BarberCard, BookingSummary, Calendar, ServiceCard, Stepper, TimeSlot, signup-prompt-modal
├── client/                 RatingModal, RescheduleModal, cancel-appointment-modal, layout/
├── dashboard/               stats-card.tsx
├── employee/                layout/ (employee-sidebar, employee-bottom-nav)
├── layout/                  footer.tsx, sidebar.tsx (generic dashboard shell only)
└── ui/                      12 shadcn/Radix primitives
```

Organization is domain-first (admin/employee/client/auth/booking), which is a reasonable pattern to preserve — see [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md) on not duplicating components across these folders.

---

## 5. `lib/` and `hooks/` — business logic

- **`lib/types.ts`**: canonical `UserRole = "client" | "employee" | "admin"` — the **official 3-role model**.
- **`lib/auth.ts`**: server-side helpers (`getCurrentUser`, `requireAuth`, `requireRole`) — always go through the real Supabase server client, no demo branch here.
- **`lib/demo-config.ts`**: demo fixtures — `DEMO_USERS` (5 fixed accounts), `DEMO_SERVICES`, `DEMO_EMPLOYEES` (role hardcoded to `'barber'`), `DEMO_BUSINESS_SETTINGS`, and `isDemoMode()`.
- **`lib/demo-appointments.ts`** and **`lib/demo-blocks-store.ts`**: a **second, independent** set of demo fixtures (employees, services, clients, appointments) with different IDs, names, and prices than `demo-config.ts`. Both files are actively imported across 44+ files. See [07_TECH_DEBT.md](07_TECH_DEBT.md) for the exact divergence.
- **Demo-mode detection is not centralized.** Three different implementations coexist:
  1. `isDemoMode()` in `lib/demo-config.ts:211-214`
  2. Inline env-var checks, e.g. `app/dashboard/layout.tsx:30-33`, `app/api/bookings/public/route.ts:55-57` (also checks `SUPABASE_SERVICE_ROLE_KEY`)
  3. `hooks/useRequireAuth.ts:35-36` — a third variant using `NEXT_PUBLIC_DEMO_MODE === "true"` or placeholder-value detection
- **`hooks/useAuth.tsx`**: Context-based auth (`AuthProvider`). Its `AuthUser.profile.role` type is `"client" | "employee" | "admin" | "manager"` — **a 4th role not present in `lib/types.ts`**. Exposes `isAdmin`, `isManager`, `isEmployee`, `isClient`.
- **`hooks/useRequireAuth.ts`**: client-side route guard (dual demo/Supabase mode). Its `DASHBOARD_MAP` covers **5 roles**: `admin→/admin`, `manager→/admin`, `employee→/employee/dashboard`, `barber→/barber`, `client→/client`.

**Net state**: the type system declares 3 roles; live authorization code (`middleware.ts`, `useAuth`, `useRequireAuth`) actually handles 5 (`client`, `employee`, `admin`, `manager`, `barber`). This is real, live inconsistency — not a documentation gap. See [07_TECH_DEBT.md](07_TECH_DEBT.md).

---

## 6. Authentication & authorization (`middleware.ts`)

- **Demo bypass** (lines 4-20): if `NODE_ENV === "development"` **and** a `demo-role` cookie is present, middleware short-circuits on simple `/admin`, `/client`, `/employee` prefix checks and skips the Supabase session logic entirely. This bypass is scoped to `development` only — in `production` the Supabase path always runs.
- **Production path** (lines 22-111): dynamically imports `createServerClient`; if Supabase env vars are missing, **fails open** (passes the request through unauthenticated) and logs an error.
- **Protected routes**: `/dashboard`, `/admin`, `/employee`, `/barber`, `/client`. Unauthenticated users are redirected to `/auth/login`.
- **Role gating**: role is fetched from the `users` table by id; on query error, non-`/dashboard` paths redirect to `/dashboard`. `admin` has full `/admin` access; `manager` is blocked from `/admin/settings`, `/admin/reports`, `/admin/employees` but allowed elsewhere under `/admin`; `/employee`/`/barber` allow `employee`, `barber`, or `admin`; `/client` allows `client` or `admin`.

There is no formal, documented **Design Constitution** and no **RLS verified in a live Supabase instance** today. A partial semantic-token layer does exist for color (see §3 correction above), but spacing, radii, and typography are still set ad hoc per component, and the 2026-05 rebrand commits (`1cea13b`, `7a09427`) introduced a *third* palette (`#161412` / `#cc2222` / `#f0ebe3`) directly in JSX for the landing page, client dashboard, and employee dashboard — independent of both the `orno-admin` CSS-variable palette and the plain-language palette documented in `ai/context/design-system.md` (`#0A0A0A` / `#E53935`). **Needs Validation**: which of these three palettes is canonical is not resolved in code today — see [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) and [07_TECH_DEBT.md](07_TECH_DEBT.md). RLS policies exist only as SQL scripts whose effective behavior against real data has not been confirmed (`docs/manuales/manual-sistema.md` explicitly caveats this).

---

## 7. Booking & availability logic (current — not a "Scheduling Engine")

No module in the codebase is named or architected as a distinct scheduling engine. What exists is plain slot generation + conflict filtering in `app/api/availability/route.ts`:

- Business hours are **hardcoded constants** (`OPEN_MINS = 9*60`, `CLOSE_MINS = 19*60`, `SLOT_STEP = 30`), disconnected from `DEMO_BUSINESS_SETTINGS.schedule` in `lib/demo-config.ts` — the demo "business hours" configuration UI and the actual slot generator do not talk to each other.
- `generateSlots()` produces every 30-minute-aligned slot within business hours; `overlaps()` does simple interval-overlap arithmetic.
- Demo path filters `DEMO_APPOINTMENTS` + the in-memory `demoBlocksStore`; Supabase path queries `appointments` (joined with `services.duration`) and `schedule_blocks` in parallel — and **fails open** (returns all slots unfiltered) on any DB error.
- Appointment creation (`app/api/appointments/route.ts`) does **not** re-check availability server-side — it trusts the client already called `/api/availability`.
- A **second, parallel** booking path exists for public shareable links: `app/api/bookings/public/route.ts` — its own demo-mode check, its own client find-or-create logic, its own admin Supabase client. It duplicates rather than reuses the logic in `app/api/appointments/route.ts`.

The most recent work on this path (`FASE 5 D1`, commit `5b3085a`) connected dynamic availability to schedule blocks — this is real, current progress on this exact seam. See [08_CHANGELOG.md](08_CHANGELOG.md).

---

## 8. Data model (Supabase / Postgres)

31 sequential SQL scripts in `scripts/`, applied in numeric order (`00-reset-database.sql` through `31-notification-queue.sql`). Core tables: `users` (extends `auth.users`), `services`, `appointments`, `inventory`, `inventory_movements`, `time_logs`, `business_settings`, plus later additions — `attendance_logs`, `employee_commissions`, `loyalty_transactions`, `pos_sales`/`pos_sale_items`, `low_rating_alerts`, `schedule_blocks`, `notification_queue`.

RLS is enabled per table with policies keyed on `auth.uid()` compared against `client_id`/`barber_id`/`employee_id`, plus an admin/manager check via a `get_my_role()` helper (introduced in `scripts/27-add-manager-role.sql`). **No `tenant_id`/`business_id` column exists anywhere** — confirming the single-tenant conclusion in §1.

**2026-07-06 update**: three additional scripts exist (`32-add-client-profile-fields.sql`, `33-add-memberships.sql`, `34-add-client-attachments.sql`, part of CRM Phase B — [ADR-018](04_DECISIONS.md)). Script 34 also declares this project's first Supabase Storage bucket (`client-attachments`, private). **Per user confirmation (2026-07-06), scripts 32-34 have been run against the live Supabase instance** — the new `users` columns, `memberships`, `client_attachments`, and the `client-attachments` bucket now exist in the real database. This was not independently verified against the live instance in this session (no credentials/access available) — recorded as reported by the user, the only party with Supabase dashboard access. If CRM Phase B/C features misbehave in production mode, confirming the migration applied cleanly (column types, RLS policies present, bucket created) is the first thing to check.

**Needs Validation**: `docs/manuales/manual-sistema.md` §12 documents scripts 27–29 under filenames that don't match what's actually on disk (manual describes `27-add-multiservice-cart.sql` / `28-add-pos-tip-points.sql` / `29-appointment-no-show-status.sql`; the real files are `27-add-manager-role.sql` / `28-add-tip-to-pos.sql` / `29-no-show-badge.sql`). The manual needs a correction pass — see [07_TECH_DEBT.md](07_TECH_DEBT.md).

---

## 9. Module status (verified by code, not just by claim)

| Module | Route | Status | Evidence |
|---|---|---|---|
| Citas / Booking | `app/admin/appointments`, `app/api/appointments*` | ✅ Functional | Direct Supabase calls + `/api/appointments/admin` |
| Empleados | `app/admin/employees`, `app/api/employees` | ✅ Functional | Server-side admin Supabase client via API route |
| Clientes | `app/admin/clients`, `app/api/clients` | ✅ Functional | Same pattern. Deeper capability than plain CRUD: `app/admin/clients/[id]/page.tsx` has a profile view with appointment history, admin notes, client messages, gifts/discounts, and (as of the CRM Phase A pass, [ADR-017](04_DECISIONS.md)) a combined appointments+POS CLV figure and last/next-visit stats. Client identity (avatar/name/contact) is now a shared component, `components/admin/clients/client-identity.tsx`, reused across the client list, profile, and POS — see [05_ROADMAP.md](05_ROADMAP.md#m5--crm-scoping-pass-2026-07-05--not-yet-approved-for-implementation) |
| Inventario | `app/admin/inventory` | ✅ Functional | Direct Supabase calls |
| POS | `app/admin/pos` | ✅ Functional | Backed by `pos_sales`/`pos_sale_items` |
| Reportes | `app/admin/reports` | ✅ Functional | Direct Supabase calls (1209-line page; spec in `openspec/specs/reportes-dashboard.md` is much thinner than the implementation — see [07_TECH_DEBT.md](07_TECH_DEBT.md)) |
| Fidelización / Loyalty | `app/api/loyalty` | ✅ Functional | `loyalty_transactions` table |
| **Facturación / Billing** | `app/admin/billing` | 🔴 **Stub** | Zero `supabase.`/`fetch(` calls in the page — UI only, no persistence |
| **Integraciones** | `app/admin/integrations` | 🟡 **Stub** | Zero `supabase.`/`fetch(` calls — interactive UI, no real third-party connections |

---

## 10. Current priorities (in order, per README + `docs/GO-LIVE-PLAN.md` + manual §15)

1. **Rotate overdue secrets** — critical, overdue since 2026-02-27, plaintext values still committed in `scripts/validate-env.js` (see [07_TECH_DEBT.md](07_TECH_DEBT.md)).
2. Resolve the `manager`/`barber` role inconsistency (formalize or remove from live authorization code).
3. Verify RLS policies against a real, live Supabase instance.
4. Decide the fate of `/admin/billing` and `/admin/integrations` (complete, hide, or mark "coming soon").
5. Unify the two desynchronized demo data catalogs.
6. Online payments and push notifications — not started, scope gap not a bug.

## 11. Known risks (summary — full list in [07_TECH_DEBT.md](07_TECH_DEBT.md))

- Secret rotation overdue with real values still in plaintext in a tracked file — **critical**.
- RLS never verified live — **critical if used with real customer data**.
- Demo-mode access control is 100% client-side and trivially bypassable — **high if a demo deployment is mistaken for production**.
- `manager`/`barber` roles live in authorization code but outside the typed role model — **medium, latent bug surface**.
- Two divergent demo data catalogs — **low, data-integrity/confusion risk**.

---

**Related**: [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) · [07_TECH_DEBT.md](07_TECH_DEBT.md) · [08_CHANGELOG.md](08_CHANGELOG.md)
