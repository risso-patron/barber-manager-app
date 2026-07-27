# 07 — Known Issues & Technical Debt

> Every item cites where it was verified. Severity is as assessed in source documents (`SECURITY-REPORT.md`, `docs/manuales/manual-sistema.md` §15) or, where none exists, assessed here directly against the code.

---

## R-1 E2E findings — added 2026-07-13 during Preview validation against the shared Supabase database

| Issue | Evidence |
|---|---|
| **Drift entre scripts documentados y enum desplegado**: `appointment_status` en la base viva incluye `no_show` además de `pending, confirmed, completed, cancelled` (los únicos declarados en `scripts/01-create-tables.sql`). Confirmado: `scripts/29-no-show-badge.sql:65` agrega el valor vía `ALTER TYPE public.appointment_status ADD VALUE 'no_show'`. No bloquea R-1: el scheduler (`lib/notifications/scheduler.ts`) solo filtra `status IN ('pending','confirmed')`, ninguno de los cuales se ve afectado. Verificado 2026-07-13 vía `pg_enum` contra la instancia real durante la validación C0 de la Fase C. | `pg_type`/`pg_enum` query contra Supabase real; `scripts/01-create-tables.sql:3`; `scripts/29-no-show-badge.sql:65` |
| **WhatsApp reminders descoped from R-1 — business-initiated messages require an approved Content Template, our code sends freeform `Body`.** Confirmed against Twilio's own docs: a proactive appointment reminder is a "Business-Initiated Session"; outside an open 24h customer-service window, WhatsApp requires `ContentSid`/`ContentVariables`, not free text — this is exactly [Twilio error 63016](https://www.twilio.com/docs/api/errors/63016). Decision (user, 2026-07-11): ship R-1 with reminders on email only (`business_settings.notifications.reminders.channels = ["email"]` — zero code change, the tenant-channel seam already supports this). Follow-up, NOT part of R-1: implement `ContentSid`-based sending in `lib/notifications/processor.ts`, upgrade the Twilio account from Trial (WhatsApp Sandbox caps at 5 joined numbers under Trial — unusable for real clients beyond that), provision a real WhatsApp Sender, and get a reminder template approved by Meta before re-enabling the `sms` channel for reminders. | `lib/notifications/processor.ts` (`deliverNotification`, WhatsApp branch); `lib/tenants.ts` (`normalizeReminderConfig`) |
| **Pre-existing defect, out of R-1 scope: booking confirmations have the identical WhatsApp template problem.** `app/api/bookings/public/route.ts:214` always sets `recipient_phone` on the `appointment_created` queue row regardless of tenant channel config — that confirmation is also business-initiated (the client hasn't messaged the business's WhatsApp first) and will hit the same Error 63016 in real use. This predates R-1 (inherited from the original, now-deleted edge function) — R-1's Acceptance Contract only covers the reminders pipeline, so this is NOT fixed here. Needs its own contract once the Content Template work above is prioritized. | `app/api/bookings/public/route.ts:214-230` |

## R-1 follow-ups (added 2026-07-10)

| Issue | Evidence |
|---|---|
| **`scripts/36-notification-queue-tenant.sql` not yet run against the live instance** — until it runs, the cron's upsert will fail (missing columns/index). First thing to execute before the E2E real. Rollback documented inside the script. | `scripts/36-notification-queue-tenant.sql`; [ADR-028](04_DECISIONS.md) |
| **`/api/notifications/send` is a stub that only does `console.log`** (Resend/Twilio integration exists only in comments) and has ONE real consumer: the reschedule flow. Users who reschedule get NO real notification today. Fix: make it enqueue into `notification_queue` (or call `deliverNotification` from `lib/notifications/processor.ts`) — deliberately out of R-1 scope to keep the blast radius contained. | `app/api/notifications/send/route.ts`; `app/api/appointments/[id]/reschedule/route.ts:244` |
| **Reminder config has no UI** — `reminders { enabled, offsetsHours, channels }` in `business_settings.notifications` is SQL-only for the beta (feature freeze). A settings surface belongs to [Product] post-0.9. | `lib/tenants.ts` (`normalizeReminderConfig`) |
| **`cleanup-old-appointments` cron removed as dead config** — the route never existed and no retention policy was ever defined. If appointment cleanup is ever needed, it starts as an [Operations] task with its own contract. | `vercel.json` (removed 2026-07-10); [ADR-028](04_DECISIONS.md) |
| **`bookings/public` confirmation rows don't set `tenant_id`/`appointment_id` columns yet** — they still put `appointment_id` only in `metadata`. Harmless today (single tenant, confirmations don't dedup), but when the tenants table lands, this producer must be updated to write the real columns like the ReminderScheduler does. | `app/api/bookings/public/route.ts:214` |
| **Rescheduled appointments never get a second reminder** — the dedup key is `(appointment_id, reminder_offset_hours)` and deliberately excludes date/time, so after a reschedule the already-used key blocks a new reminder for the new slot. Known R-1 design tradeoff (found in the pre-E2E review, 2026-07-10); compounded by the reschedule-notification stub above. Fixing it means either including a date component in the dedup key or clearing reminder rows on reschedule — both belong to a future contract, not R-1. | `lib/notifications/scheduler.ts` (dedup key); `scripts/36-notification-queue-tenant.sql` |
| **Retry after partial delivery failure can duplicate the successful channel** — if email sends but WhatsApp fails, the row returns to `pending` and the retry re-sends the email (up to 2 extra copies at `maxAttempts: 3`). Behavior ported 1:1 from the (deleted) edge function; per-channel delivery state is a future refinement. Similarly, a row whose channels are ALL skipped (no credentials / no message body) is marked `sent` without any real send — same parity decision. | `lib/notifications/processor.ts` (`deliverNotification`) |
| **`/api/test-notifications` is an unauthenticated GET that triggers real Resend/Twilio sends** (to `delivered@resend.dev` and `TWILIO_TEST_TO`). Useful as the credentials smoke-check in the R-1 E2E checklist, but it predates R-1 and has no auth/rate-limit gate of its own — anyone with the URL can burn Twilio credits. Candidate: require `CRON_SECRET` bearer like the cron route. | `app/api/test-notifications/route.ts` |
| **M1 seam note: `generateReminders` queries ALL appointments, not per-tenant** — correct today (single tenant), but when `appointments` gains `tenant_id` in the M1 migration, this query must add the tenant filter. The "only `getTenants()` changes" claim in ADR-028 covers tenant *discovery*; this query is the one other known M1 touch-point in the pipeline. | `lib/notifications/scheduler.ts` (`generateReminders`) |

## EMP-1 follow-ups (added 2026-07-09)

| Issue | Evidence |
|---|---|
| **`NativeSelect` en Inventory usa la constante local `SELECT_CLS`** — `components/admin/inventory/inventory-modal.tsx` quedó fuera del alcance de EMP-1 por decisión explícita ([ADR-025](04_DECISIONS.md)). Cuando Inventario reciba su Readiness Report, la migración a `NativeSelect` es un cambio mecánico de una línea. | `components/admin/inventory/inventory-modal.tsx:21` |
| **`DEMO_EMPLOYEES` desincronizados — encontrado durante EMP-1, no tocado por decisión**: `lib/demo-config.ts` (`DEMO_EMPLOYEES` con IDs `emp-001..003`, "Carlos Martínez", `@barberia.com`) y `lib/demo-appointments.ts` (`DEMO_EMPLOYEES` con IDs `e1..e3`/`demo-employee-001`, "Carlos Pérez", `@barbershop.com`) definen catálogos incompatibles. Misma deuda que el item "Two demo data catalogs are desynchronized" en la sección Low — se añade aquí para registrar que fue inspeccionada durante EMP-1 y deliberadamente excluida del alcance. | `lib/demo-config.ts`; `lib/demo-appointments.ts`; [ADR-025](04_DECISIONS.md) |

## Billing/Integrations Phase A follow-ups (added 2026-07-06)

| Issue | Evidence |
|---|---|
| **`scripts/35-add-billing-schema.sql` has not been confirmed run against any live instance** — unlike CRM Phase B/C, no user confirmation was given in this session. Until it's run, `/admin/billing` will show its honest "sin plan configurado" / "sin facturas" empty states against a live Supabase instance too (not just demo mode), since the tables won't exist yet in a fresh database, though the queries themselves are written not to error on a missing table's *absence of rows* — they will error if the tables don't exist at all. | `scripts/35-add-billing-schema.sql` |
| **No payment provider is integrated.** Billing shows real (empty) data but cannot process a real subscription, upgrade, or payment — the plan comparator's CTA is deliberately disabled. Provider choice (Stripe vs Mercado Pago) is still an open product decision, not a technical one this session could resolve unilaterally. | `app/admin/billing/page.tsx` |
| **10 of 11 listed integrations have zero backend work started** (Google Calendar, Stripe, Mercado Pago, OpenAI, Zapier, Mailchimp, Google Analytics, Slack, Instagram Business, HubSpot) — they are now honestly labeled "Próximamente" instead of fake-connected, but that's the extent of Phase A's scope for them. | `app/admin/integrations/page.tsx` |
| **A 4th independent demo-mode check exists**: `lib/env.ts` has its own `isDemoMode()` (`!NEXT_PUBLIC_SUPABASE_URL \|\| !NEXT_PUBLIC_SUPABASE_ANON_KEY`), found while researching Twilio env vars for this phase — in addition to the 3 already logged in [01_CURRENT_STATE.md §5](01_CURRENT_STATE.md). Not used by the Billing/Integrations pages (they use the same `hasSupabaseConfig` inline pattern as other admin pages), but it's live, exported code that could be picked up by future work. | `lib/env.ts:64-66` |
| **`notification_queue` has no explicit channel column** — the Integrations page's "real logs" query approximates "WhatsApp/SMS" by filtering on `recipient_phone IS NOT NULL`, since the table stores email and phone fields on the same row rather than a `channel` enum. If a future notification type sends both email and SMS on one row, this filter would still count it as a WhatsApp-relevant event. | `scripts/31-notification-queue.sql`; `app/admin/integrations/page.tsx` |

## Fixed — sidebar logout unreachable on short viewports (2026-07-06)

| Issue | Evidence |
|---|---|
| ~~**The `<nav>` inside `AdminSidebar`/`EmployeeSidebar`/`ClientSidebar` had no `overflow-y`, and each `<aside>` is `position: fixed` stretched to full viewport height.**~~ On a browser window shorter than the sidebar's total content (logo + nav items + Configuración + Cerrar sesión), the footer — including the "Cerrar sesión" button — rendered below the visible area with no scrollbar to reach it. The button existed in code all along; it just wasn't reachable. Found via a user screenshot at `localhost:3000/admin` where the sidebar visibly cut off right after "Configuración". | `components/admin/layout/admin-sidebar.tsx`, `components/employee/layout/employee-sidebar.tsx`, `components/client/layout/client-sidebar.tsx` — **Fixed 2026-07-06**: added `minHeight: 0` + `overflowY: "auto"` to each sidebar's `<nav>`, so only the nav item list scrolls internally while the logo header and the Configuración/Cerrar sesión footer stay pinned and always visible. Verified with a throwaway Playwright script against the dev server at a 650px-tall viewport — confirmed the logout button is visible with zero console errors. |
| **Same duplicated-layout root cause as the missing Application Shell** ([02_TARGET_ARCHITECTURE.md §4](02_TARGET_ARCHITECTURE.md)): this exact bug had to be fixed identically in 3 independently-implemented sidebar components. A shared shell would have meant fixing it once. | Not itself a new debt item — cross-referencing the existing gap this incident is evidence for. |

## Fixed — logout label inconsistency across the app (2026-07-06)

| Issue | Evidence |
|---|---|
| ~~**The logout action was labeled inconsistently across 5 independent implementations**~~ — `components/employee/layout/employee-bottom-nav.tsx` (mobile) said "Salir" while the desktop `EmployeeSidebar` said "Cerrar sesión"; `components/layout/sidebar.tsx` (generic `/dashboard` shell) and the orphaned `app/barber/page.tsx` both said "Cerrar Sesión" (capital S). Found via user report while testing the admin panel. | **Fixed 2026-07-06** — unified to "Cerrar sesión" (matching the majority convention already used in `AdminSidebar`, the fixed `EmployeeSidebar`/`ClientSidebar`, and `app/client/profile/page.tsx`) in `employee-bottom-nav.tsx`, `components/layout/sidebar.tsx`, and `app/barber/page.tsx`. |
| **Logout is still independently reimplemented in at least 7 places** (`AdminSidebar`, `EmployeeSidebar`, `EmployeeBottomNav`, `ClientSidebar`, `client/profile/page.tsx`, generic `components/layout/sidebar.tsx`, `app/barber/page.tsx`) — each with its own `handleLogout` calling `localStorage.removeItem` + `supabase.auth.signOut()` + redirect. Two more dead, never-rendered copies exist in `app/client/page.tsx:193` and `app/employee/dashboard/page.tsx:280` (unused `handleLogout`, flagged by ESLint `no-unused-vars`). This label fix treats the symptom; the underlying duplication is the same Application Shell gap noted above and isn't resolved by this fix. | `hooks/useAuth.tsx` already centralizes auth state — a shared `useLogout()` hook belongs there instead of being re-derived per component. |

## Role debt cleanup follow-ups (added 2026-07-06)

| Issue | Evidence |
|---|---|
| **`manager` remains a real Postgres enum value with real RLS policies** (`scripts/27-add-manager-role.sql`) that no application code exercises anymore after the cleanup in [ADR-003](04_DECISIONS.md). No migration was run to remove it — dropping a Postgres enum value requires recreating the type, and there was no live Supabase access this session. Undecided: formalize `manager` with a real signup/creation path, or write a follow-up migration to drop it from the enum and its RLS policies entirely. | `scripts/27-add-manager-role.sql` |
| **`e2e/employee.e2e.spec.ts` was updated to stop navigating to the deleted `/barber` route, but not verified by actually running it** — it requires `SUPABASE_SERVICE_ROLE_KEY` (not available this session) and already self-skips without it. The replacement assertions were derived by reading `app/employee/dashboard/page.tsx`'s real button/text labels, not by executing the test. | `e2e/employee.e2e.spec.ts`; `app/employee/dashboard/page.tsx` |
| **`lib/constants.ts` is a fully unused module** (zero imports anywhere in the app) that still had its own competing `USER_ROLES`/`ROUTES`/`DASHBOARD_BY_ROLE` — found and fixed as part of this cleanup, but the fact that a whole dead constants file with its own role model existed undetected is itself worth flagging. It also had a **pre-existing bug**, unrelated to roles, now fixed as a byproduct: `DASHBOARD_BY_ROLE.employee` pointed at `ROUTES.BARBER` instead of `ROUTES.EMPLOYEE`. | `lib/constants.ts` |

## CRM Phase C follow-ups (added 2026-07-06)

| Issue | Evidence |
|---|---|
| **`ClientTimelineCard` caps at 30 merged events with no pagination and no type filter** (can't view "only messages" or "only purchases", and older history beyond 30 events is invisible). | `components/admin/clients/client-timeline-card.tsx` |
| **WhatsApp actions on the client profile are not implemented** — the CRM scope requested a per-client "message via WhatsApp" action; this depends on `app/admin/integrations` (still a stub, [01_CURRENT_STATE.md §9](01_CURRENT_STATE.md)) rather than anything CRM-specific, so it was deliberately left out of Phase C rather than half-built against a non-existent integration. | `app/admin/integrations/page.tsx` |

## CRM Phase B follow-ups (added 2026-07-06)

| Issue | Evidence |
|---|---|
| ~~Scripts 32-34 had not been run against any live Supabase instance.~~ **Resolved 2026-07-06** — per user confirmation, scripts 32-34 were run against the live instance, in order. Not independently verified from this session (no Supabase credentials/access) — if Phase B/C features misbehave against real data, confirming the migration applied cleanly is the first thing to check. | `scripts/32-add-client-profile-fields.sql`, `scripts/33-add-memberships.sql`, `scripts/34-add-client-attachments.sql` |
| **Memberships have no edit/cancel UI** — `ClientMembershipsCard` only supports creating and listing; changing `status` (e.g. pausing or cancelling a plan) requires a direct DB edit today. | `components/admin/clients/client-memberships-card.tsx` |
| **Attachments have no delete UI** — once uploaded, a photo/document can't be removed from the client profile without going directly to Supabase Storage + the `client_attachments` table. | `components/admin/clients/client-attachments-card.tsx` |
| **`client_attachments` upload/list only works with real Supabase configured** — demo mode shows an explicit "requires Supabase" message rather than fabricating fake files, unlike most other demo-mode surfaces in this app which simulate data. This is a deliberate honesty choice, not an oversight, but it means this specific CRM feature can't be demoed without a real backend. | `components/admin/clients/client-attachments-card.tsx` |

## Fixed during CRM Phase A validation (2026-07-06)

| Issue | Evidence | Status |
|---|---|---|
| ~~**`pnpm type-check`/`pnpm build` failed project-wide** due to `createBrowserClient(supabaseUrl, supabaseAnonKey)` in `hooks/useRequireAuth.ts:65` receiving `string \| undefined` where `string` is required.~~ Runtime was safe (`hasSupabaseConfig` guard bails out earlier), but TypeScript couldn't follow the narrowing through the `isPlaceholder()` function call, so the whole project failed to type-check/build. Introduced in commit `eb1374a` (2026-07-01); silent for 5 days since this repo has no CI (`.github/workflows` doesn't exist) to catch it automatically. | `hooks/useRequireAuth.ts:65`; `next.config.mjs:7` (`typescript.ignoreBuildErrors: false`, so build genuinely failed, not just warned) | **Fixed 2026-07-06** — added non-null assertions (`supabaseUrl!`, `supabaseAnonKey!`), matching the existing convention used in `lib/demo-config.ts`-adjacent client pages. `pnpm type-check` and `pnpm build` (61/61 routes) now pass clean. |

**Open follow-up**: this repo has no CI pipeline at all — `type-check`/`lint`/`build` only run when a developer or agent runs them manually. Consider adding a CI workflow so a break like this is caught on push instead of discovered days later during an unrelated change.

## Critical

| Issue | Evidence |
|---|---|
| ~~**Secret rotation overdue since 2026-02-27**~~ — **Resolved 2026-07-07** (executed ~2026-06-30, per user confirmation): `TWILIO_AUTH_TOKEN`, `RESEND_API_KEY`, `CRON_SECRET` regenerated at Resend/Twilio and updated in Vercel production; `.env.local` updated on the user's personal laptop and on this machine — `pnpm validate-env` confirms all three pass here. Not independently verifiable by the agent (external dashboard/Vercel actions, no API access). Old values remain reachable via `git log`/`git show` on commits prior to `1fa6145` (2026-06-30) — purging git history was explicitly out of scope, see `openspec/changes/archive/2026-07-07-rotate-secrets/proposal.md`. | `docs/SECRET-ROTATION.md`, `SECURITY-REPORT.md`, `pnpm validate-env` output 2026-07-07 |
| ~~**`scripts/validate-env.js` has the three real secret values hardcoded in plaintext today**~~ — **Already fixed before this was flagged**: commit `1fa6145` (2026-06-30, same day as the security-doc audit that raised this) removed the `exposedSecrets` object and replaced it with pattern-based placeholder detection. Confirmed by reading the current file — zero hardcoded secret values. `SECURITY-REPORT.md:175` and `docs/SECRET-ROTATION.md:15` still described this as an open, current-file exposure as of 2026-07-07 — that language was stale and has been corrected in this pass. | `scripts/validate-env.js` (read 2026-07-07, clean) |
| **RLS policies never verified against a live Supabase instance.** All 31+ SQL scripts in `scripts/` define intended policy — none have been confirmed to behave correctly against real data in a running instance. | `docs/manuales/manual-sistema.md:394`, `docs/GO-LIVE-PLAN.md:19` |

## High

| Issue | Evidence |
|---|---|
| **Demo mode has zero server-side access control.** `middleware.ts` passes through entirely when Supabase env vars are unset; authorization is 100% client-side via `useRequireAuth` + `localStorage`, trivially editable from DevTools. Risk is high specifically if a demo deployment is ever mistaken for a production one. | `SECURITY-REPORT.md:191-195`; README "Limitaciones conocidas" |
| **`/admin/billing` has no payment backend** despite `/admin/integrations` UI implying real connections exist. Blocks any real monetization path. | README functionality table; `docs/GO-LIVE-PLAN.md:17,62,70`; confirmed by code (zero `supabase.`/`fetch(` calls in `app/admin/billing/page.tsx`) |

## Medium

| Issue | Evidence |
|---|---|
| ~~**`manager` and `barber` roles live in authorization code but outside the typed role model.**~~ | `hooks/useAuth.tsx`; `hooks/useRequireAuth.ts`; `middleware.ts`; 8 admin-page guards; 6+ API routes | **Fixed 2026-07-06** ([ADR-003](04_DECISIONS.md)) — all application code now matches the 3-role model exactly. `manager` remains a real Postgres enum value + RLS policies (`scripts/27-add-manager-role.sql`) that no app code exercises anymore; formalizing it with a real creation path, or removing it at the DB level too, is a separate, undecided follow-up — see below. |
| **No server-side CORS configuration confirmed on API routes.** | `SECURITY-REPORT.md:209-213` (unverified, not confirmed absent or present) |
| **No mandatory email verification flow found.** | `SECURITY-REPORT.md:199-205` |
| **`/admin/integrations` is a UI-only stub** — interactive, but zero real third-party connections (zero `supabase.`/`fetch(` calls in the page). | README; `docs/GO-LIVE-PLAN.md:18`; confirmed by code |
| **`docs/manuales/manual-sistema.md` §12 documents the wrong filenames for 3 SQL scripts.** The manual describes `27-add-multiservice-cart.sql` / `28-add-pos-tip-points.sql` / `29-appointment-no-show-status.sql`; the files that actually exist on disk are `27-add-manager-role.sql` / `28-add-tip-to-pos.sql` / `29-no-show-badge.sql`, with correspondingly different content (manager role + RLS helper, POS tip column, no-show tracking — not what the manual's descriptions for those three rows suggest). | Direct comparison of `docs/manuales/manual-sistema.md:1114-1116` against `scripts/27-*.sql`–`29-*.sql` |
| **Three uncoordinated color palettes exist** — the `[data-theme="orno-admin"]` CSS-variable block (`#0F0F0F`/`#E53935`), the plain-language palette in `ai/context/design-system.md` (`#0A0A0A`/`#E53935`, close but not identical), and the 2026-05 rebrand's hardcoded hex triplet (`#161412`/`#cc2222`/`#f0ebe3`) used directly in JSX on the landing page and client/employee dashboards. See [02_TARGET_ARCHITECTURE.md §1](02_TARGET_ARCHITECTURE.md). | `app/globals.css:100-129`; `ai/context/design-system.md`; commits `1cea13b`, `7a09427` |
| **`openspec/specs/reportes-dashboard.md` is 11 lines; `app/admin/reports/page.tsx` is 1209 lines.** The spec has never been updated to reflect what was actually built. | Direct file comparison |
| **`components/theme-provider.tsx` (next-themes wrapper) is dead code** — not imported anywhere outside its own file, while the actual theming mechanism in use is the CSS-variable block in `app/globals.css`. | Repo-wide import search |
| **`app/api/alerts_backup/` exists alongside `app/api/alerts/`** — looks like a backup left in the tree. **Needs Validation** on whether it's safe to delete (may still be referenced). | Directory listing of `app/api/` |

## Medium (CRM scoping findings, added 2026-07-05)

| Issue | Evidence | Status |
|---|---|---|
| ~~**Client identity (avatar + name + contact) is independently reimplemented in at least 3 places**~~ — `app/admin/clients/page.tsx`, `app/admin/clients/[id]/page.tsx`, and `app/admin/pos/page.tsx` each rendered their own initial-avatar + name/email/phone block with no shared component. | `app/admin/clients/page.tsx`; `app/admin/clients/[id]/page.tsx`; `app/admin/pos/page.tsx` | **Fixed 2026-07-05** — extracted `components/admin/clients/client-identity.tsx` (`ClientAvatar` + `ClientIdentity`), token-based, adopted in all three files. `app/admin/appointments/page.tsx`'s fourth, thinner representation (`clientName` string only) was deliberately **left untouched** — consolidating it would require reshaping the appointments data-fetch, which risks touching booking business logic outside this change's scope (see [06_CLAUDE_RULES.md §1](06_CLAUDE_RULES.md)). |
| **`app/api/clients/route.ts` has no `GET` and no `[id]` sub-route** — only `POST` (create) and `DELETE` are implemented server-side. Reads (client list) and updates (edit modal) go directly through the browser Supabase client from the page component, bypassing the API/service-role layer entirely — unlike `employees`/`clients`-adjacent modules that route writes through server-side API routes. | `app/api/clients/route.ts` (only `route.ts`, no `[id]/`); `app/admin/clients/page.tsx:60-64` (read), `:163-166` (update) | Open — not addressed in CRM Phase A. |
| ~~**"Total spent" shown on the client profile undercounts real spend**~~ — summed only completed-appointment service prices, excluding `pos_sales`. | `app/admin/clients/[id]/page.tsx`; `scripts/25-add-pos-system.sql:5-27` | **Fixed 2026-07-05** — profile now queries `pos_sales` for the client and adds it to the appointment total for a real combined CLV figure. |
| ~~**Client-list dropdown menu (`app/admin/clients/page.tsx`) and several stat-tile labels across `admin/clients` still use hardcoded `bg-white`/`text-gray-500` instead of semantic tokens**~~ — noticed while fixing the identity duplication above, left as-is to keep this change scoped to identity + CLV, not a full page retheme. | `app/admin/clients/page.tsx` (dropdown menu); `app/admin/clients/[id]/page.tsx` (stat tile labels) | **Fixed 2026-07-09** — resolved by the CRM framework migration ([ADR-024](04_DECISIONS.md)): dropdown replaced by `ActionMenu` (CRM-1, `14996d6`), all raw-palette colors across the module removed (CRM-2A/2B, `9ffcd4b`/`1f68cc9`; module-wide grep for the full Tailwind palette = 0). |
| **`ClientMembershipsCard` keeps a local `STATUS_LABEL` map using legacy Badge aliases (`default`/`secondary`/`outline`)** — membership statuses (not appointment statuses); Bible-compliant (visible text labels, aliases resolve to ORNO tints, zero raw colors), but the name collides with the extinct appointment `STATUS_LABEL` pattern and the aliases are deprecated in favor of semantic variants. Deliberately left out of CRM-4 (documentation-only closure, no refactors). | `components/admin/clients/client-memberships-card.tsx:26` | Open — one-line cosmetic rename/alias swap, candidate for any future pass touching that card (e.g. the memberships edit/cancel UI follow-up above). |

## Low

| Issue | Evidence |
|---|---|
| **Two demo data catalogs are desynchronized.** `lib/demo-config.ts` (`DEMO_EMPLOYEES` with IDs `emp-001..003`, e.g. "Carlos Martínez," `@barberia.com`) and `lib/demo-appointments.ts` (`DEMO_EMPLOYEES` with IDs `e1..e3`/`demo-employee-001`, e.g. "Carlos Pérez," `@barbershop.com`) define incompatible employee, service, and client fixtures — different IDs, names, prices, and even different `no_show` status label text ("No asistió" vs. "No se presentó"). Both files are actively imported across 44+ files, so this is a live inconsistency, not dead code. | Direct comparison of `lib/demo-config.ts` vs `lib/demo-appointments.ts` |
| **`/barber` is a functional but orphaned route.** `app/barber/` exists and is protected by `middleware.ts`, but `app/dashboard/page.tsx`'s role dispatcher maps the `barber` role to `/employee/dashboard` in both demo and Supabase branches — nothing ever routes a user to `/barber` through normal navigation. | `app/dashboard/page.tsx` lines ~28, ~65; `middleware.ts:50,95,117`; README lines 177, 202 |
| **Rate limiting is in-memory by default** — counters don't share across serverless instances unless Upstash Redis env vars are configured; falls back silently (with only a console warning) if they're absent in production. | `lib/rate-limit.ts:114-128`; `SECURITY-REPORT.md:58` |
| **No documented backup strategy for appointment data.** | `docs/GO-LIVE-PLAN.md:52,106` |
| **Temporary debug traces left in the demo auth endpoint/hook** after a diagnosis session; QA required a `pnpm dev` restart to pick up auth changes during testing. | `qa-analysis.md:51-52` |

## Local dev environment note (found 2026-07-07, unrelated to secret rotation)

| Issue | Evidence |
|---|---|
| **This machine's `.env.local` has placeholder Supabase credentials** (`NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui`, `SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui`) — `NEXT_PUBLIC_SUPABASE_URL` is a real project URL, but the two keys were never filled in on this specific laptop. Confirmed by user: unrelated to the `rotate-secrets` change, which targeted only Twilio/Resend/CRON — this is a separate, pre-existing local setup gap, deliberately left as-is per user decision. `TWILIO_ACCOUNT_SID` also fails its format check (`pnpm validate-env` warning, doesn't start with `AC`) — not investigated further this session. | `pnpm validate-env` output 2026-07-07 |

## Scope gaps (not bugs — simply not built)

- Online payments — not implemented anywhere.
- Push notifications — not implemented anywhere.

## Process note

`SECURITY-REPORT.md` itself documents that an earlier revision self-contradicted (listing rate limiting/CSP/logging as both "implemented" and "absent" in different sections) and had leaked real secret fragments in plaintext; both were corrected in the 2026-06-30 revision. Git history retains the older, exposed versions — this compounds the urgency of the secret-rotation item above, since those fragments remain reachable via `git log`/`git show` regardless of the current file state.

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md)
