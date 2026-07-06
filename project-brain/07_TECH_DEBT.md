# 07 — Known Issues & Technical Debt

> Every item cites where it was verified. Severity is as assessed in source documents (`SECURITY-REPORT.md`, `docs/manuales/manual-sistema.md` §15) or, where none exists, assessed here directly against the code.

---

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
| **`manager` and `barber` roles live in authorization code but outside the typed role model.** `lib/types.ts`'s `UserRole` union has 3 values (`client`/`employee`/`admin`); `middleware.ts`, `hooks/useAuth.tsx` (`AuthUser.profile.role`), and `hooks/useRequireAuth.ts` (`DASHBOARD_MAP`) all branch on 5 values including `manager` and `barber`. `manager` has routing logic (`middleware.ts:78-85`) but no documented way to actually assign it to a real user — no signup or demo path creates a `manager` account. | `hooks/useAuth.tsx:21,34,192`; `hooks/useRequireAuth.ts:7-13`; `middleware.ts:78,95`; `app/api/appointments/admin/route.ts:29`; README "Roles disponibles" |
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
