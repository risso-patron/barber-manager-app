# 07 — Known Issues & Technical Debt

> Every item cites where it was verified. Severity is as assessed in source documents (`SECURITY-REPORT.md`, `docs/manuales/manual-sistema.md` §15) or, where none exists, assessed here directly against the code.

---

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
| **Secret rotation overdue since 2026-02-27** — Twilio Auth Token, Resend API Key, CRON Secret exposed in git history. | `SECURITY-REPORT.md:26,166`, `docs/SECRET-ROTATION.md` |
| **`scripts/validate-env.js` has the three real secret values hardcoded in plaintext today**, in a tracked file (introduced in commit `9aaf6dd`, 2026-06-23), compounding the rotation urgency since the exposure is current, not just historical. | `SECURITY-REPORT.md:175` |
| **RLS policies never verified against a live Supabase instance.** All 31 SQL scripts in `scripts/` define intended policy — none have been confirmed to behave correctly against real data in a running instance. | `docs/manuales/manual-sistema.md:394`, `docs/GO-LIVE-PLAN.md:19` |

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
| **Client-list dropdown menu (`app/admin/clients/page.tsx`) and several stat-tile labels across `admin/clients` still use hardcoded `bg-white`/`text-gray-500` instead of semantic tokens** — noticed while fixing the identity duplication above, left as-is to keep this change scoped to identity + CLV, not a full page retheme. | `app/admin/clients/page.tsx` (dropdown menu); `app/admin/clients/[id]/page.tsx` (stat tile labels) | Open — candidate for the next CRM UI pass or for M2 (Design Constitution rollout). |

## Low

| Issue | Evidence |
|---|---|
| **Two demo data catalogs are desynchronized.** `lib/demo-config.ts` (`DEMO_EMPLOYEES` with IDs `emp-001..003`, e.g. "Carlos Martínez," `@barberia.com`) and `lib/demo-appointments.ts` (`DEMO_EMPLOYEES` with IDs `e1..e3`/`demo-employee-001`, e.g. "Carlos Pérez," `@barbershop.com`) define incompatible employee, service, and client fixtures — different IDs, names, prices, and even different `no_show` status label text ("No asistió" vs. "No se presentó"). Both files are actively imported across 44+ files, so this is a live inconsistency, not dead code. | Direct comparison of `lib/demo-config.ts` vs `lib/demo-appointments.ts` |
| **`/barber` is a functional but orphaned route.** `app/barber/` exists and is protected by `middleware.ts`, but `app/dashboard/page.tsx`'s role dispatcher maps the `barber` role to `/employee/dashboard` in both demo and Supabase branches — nothing ever routes a user to `/barber` through normal navigation. | `app/dashboard/page.tsx` lines ~28, ~65; `middleware.ts:50,95,117`; README lines 177, 202 |
| **Rate limiting is in-memory by default** — counters don't share across serverless instances unless Upstash Redis env vars are configured; falls back silently (with only a console warning) if they're absent in production. | `lib/rate-limit.ts:114-128`; `SECURITY-REPORT.md:58` |
| **No documented backup strategy for appointment data.** | `docs/GO-LIVE-PLAN.md:52,106` |
| **Temporary debug traces left in the demo auth endpoint/hook** after a diagnosis session; QA required a `pnpm dev` restart to pick up auth changes during testing. | `qa-analysis.md:51-52` |

## Scope gaps (not bugs — simply not built)

- Online payments — not implemented anywhere.
- Push notifications — not implemented anywhere.

## Process note

`SECURITY-REPORT.md` itself documents that an earlier revision self-contradicted (listing rate limiting/CSP/logging as both "implemented" and "absent" in different sections) and had leaked real secret fragments in plaintext; both were corrected in the 2026-06-30 revision. Git history retains the older, exposed versions — this compounds the urgency of the secret-rotation item above, since those fragments remain reachable via `git log`/`git show` regardless of the current file state.

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md)
