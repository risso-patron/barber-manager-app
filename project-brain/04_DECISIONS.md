# 04 — Architecture Decision Records

> Each ADR states **Context**, **Decision**, **Consequences**, and **Status**. `Status: Implemented` means verified in code today. `Status: Planned` means approved as direction but not yet built — these correspond 1:1 to items in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md). Do not read a `Planned` status as "in the codebase."

---

### ADR-001 — Supabase as backend, auth, and database provider

**Context**: The project began (commits `01edef5`–`dd91147`, Sept 2025) as a fully client-side app using `localStorage` for both data and auth. This does not scale past a single-browser demo and has no real security boundary.

**Decision**: Adopt Supabase (Postgres + Auth + Row Level Security + Storage) as the backend for production mode, introduced in commit `8d6b555` ("Migrar autenticación de localStorage a Supabase") and wired progressively across every module through Dec 2025–Feb 2026.

**Consequences**: Real persistence and a real auth boundary become possible; RLS becomes the primary data-isolation mechanism (see ADR-009). Cost: two data paths now must be maintained side by side, because demo mode was reintroduced days later (ADR-002) rather than removed.

**Status**: Implemented.

---

### ADR-002 — Demo mode as a first-class fallback, not just a preview

**Context**: `8d6b555` initially removed all demo/localStorage code. Five days later, commit `c496a24` reintroduced `localStorage`-based demo auth as a deliberate fallback so the app runs with zero Supabase configuration.

**Decision**: Keep two fully parallel operating modes — demo (client-side, hardcoded fixtures) and production (Supabase) — selected automatically based on whether `NEXT_PUBLIC_SUPABASE_URL` is configured.

**Consequences**: Lowers the barrier to running/evaluating ORNO with zero setup, which is valuable for demos and early sales. Cost, confirmed in code: three different, uncoordinated implementations of "are we in demo mode?" now exist (`lib/demo-config.ts:211-214`, inline checks in `app/dashboard/layout.tsx` and `app/api/bookings/public/route.ts`, and a third variant in `hooks/useRequireAuth.ts`), and demo-mode access control is 100% client-side and bypassable — see [07_TECH_DEBT.md](07_TECH_DEBT.md).

**Status**: Implemented (with acknowledged debt).

---

### ADR-003 — Three-role canonical model (client / employee / admin)

**Context**: Early commits used ad hoc roles including `barber` and later `manager` (commit `27-add-manager-role.sql`, `5579961` "sistema de roles de empleado (barbero/cajero/recepcionista/gerente)"). The project's stated official model, per `lib/types.ts` and `openspec/specs/auth-roles.md`, is 3 roles.

**Decision**: `client`, `employee`, `admin` are the only supported roles going forward. `manager` and `barber` are legacy and not to be extended.

**Consequences**: The type system (`lib/types.ts`) reflects 3 roles, but live authorization code — `middleware.ts`, `hooks/useAuth.tsx`, `hooks/useRequireAuth.ts` — still branches on 5 roles including `manager` and `barber`. This decision has not been fully executed in code; the cleanup is tracked in [07_TECH_DEBT.md](07_TECH_DEBT.md) and is priority #2 in [01_CURRENT_STATE.md §10](01_CURRENT_STATE.md#10-current-priorities-in-order-per-readme--docsgo-live-planmd--manual-15).

**Status**: Decided, **partially implemented** — cleanup pending.

---

### ADR-004 — shadcn/ui + Radix UI as the UI primitive layer

**Context**: The project needed a component primitive layer (buttons, dialogs, inputs, etc.) rather than hand-rolling every interactive element.

**Decision**: Standardize on shadcn/ui (copy-in component generator, configured in `components.json`) built on Radix UI primitives.

**Consequences**: 12 primitives exist in `components/ui/` today, consistently reused across admin/employee/client/auth/booking component folders. This is the one target-architecture item ([02_TARGET_ARCHITECTURE.md §11](02_TARGET_ARCHITECTURE.md)) already `In Progress` rather than purely `Planned`.

**Status**: Implemented (ongoing — primitive set still growing).

---

### ADR-005 — Persistent rate limiting via Upstash Redis, with in-memory fallback

**Context**: The original rate limiter (`Map`-based, in-process) resets on every serverless cold start, making it ineffective in a multi-instance/serverless deployment (Vercel). Identified and fixed in the `openspec/changes/archive/2026-05-27-backend-produccion` change.

**Decision**: Use `@upstash/ratelimit` against Upstash Redis when `UPSTASH_REDIS_REST_URL`/`TOKEN` are configured; fall back to the in-memory limiter (with a logged warning in production) when they are not.

**Consequences**: Rate limiting is correct in a real serverless deployment as long as Upstash is configured; without it, the app is exposed to the same weakness this ADR was meant to fix — this is a deploy-time configuration risk, not a code gap.

**Status**: Implemented.

---

### ADR-006 — Unify the two parallel auth systems

**Context**: Supabase cookie-based auth and `localStorage` demo auth (ADR-002) had diverged enough to cause redirect loops and crashes in production mode. Addressed by the `openspec/changes/archive/2026-05-27-unificar-auth` change.

**Decision**: Introduce `<AuthProvider>` at the root (`app/providers.tsx`), fix the `/login` → `/auth/login` redirect bug, deprecate `useRequireAuth`'s `localStorage` path when running in Supabase mode, and remove dead code (`login-form-new.tsx`, client-side `auth.admin.deleteUser()` calls).

**Consequences**: This is the one ADR in this log with an explicit, verifiable completion record — `openspec/changes/archive/2026-05-27-unificar-auth/verify-report.md` reports "✅ PASS — Sin issues críticos," 10/10 tasks complete, one pre-existing non-critical warning noted (a `console.error` left in `middleware.ts`).

**Status**: Implemented — verified complete.

---

### ADR-007 — ORNO visual rebrand (dark, editorial identity)

**Context**: The app initially had no distinct visual identity beyond default shadcn styling.

**Decision**: Apply an ORNO-specific dark visual identity, executed in two commits: `1cea13b` (admin editorial redesign, logo, favicons, dark theme, May 2026) and `7a09427` (extend the same system to client/employee dashboards).

**Consequences**: Produced the `[data-theme="orno-admin"]` CSS-variable block in `app/globals.css` (`#0F0F0F` background, `#E53935` primary) applied across all three role trees — real, working scoped theming (see [01_CURRENT_STATE.md §3 correction](01_CURRENT_STATE.md)). However, the same two commits also hardcoded a *different* palette (`#161412` / `#cc2222` / `#f0ebe3`) directly in JSX on the landing page and client/employee dashboards, which does not match the CSS-variable palette. This ADR's execution is real but left the palette question unresolved — see ADR-008 and [02_TARGET_ARCHITECTURE.md §1](02_TARGET_ARCHITECTURE.md).

**Status**: Implemented — inconsistently. Reconciliation is the subject of ADR-008.

---

### ADR-008 — Design Constitution, Warm Design System, and Semantic Design Tokens (extended)

**Context**: ADR-007 left three uncoordinated palette definitions in place (CSS-variable `orno-admin`, `ai/context/design-system.md`, and the 2026-05 rebrand hex triplet), and no document defines typography, spacing, radius, motion, or component-state rules beyond the one-page skeleton in `ai/context/design-system.md`.

**Decision**: Approved direction (this planning session, 2026-07-05) — ratify one Design Constitution superseding all three current palette sources, extend the existing CSS-variable token layer (already `In Progress`, see ADR-004-adjacent finding) to spacing/type/radius, and lean into the warmer palette direction the 2026-05 rebrand pointed at but didn't finish.

**Consequences**: Blocks Application Shell (ADR-010) and BrandProvider (ADR-011) work, since both need a settled token layer to build on. No code changes yet.

**Status**: Planned — see [02_TARGET_ARCHITECTURE.md §§1-3](02_TARGET_ARCHITECTURE.md).

---

### ADR-009 — Row Level Security as the data-isolation mechanism

**Context**: With Supabase as the backend (ADR-001), some mechanism must prevent one authenticated user from reading/writing another's data.

**Decision**: Enforce isolation via Postgres RLS policies (31 sequential SQL scripts in `scripts/`), keyed on `auth.uid()` compared against `client_id`/`barber_id`/`employee_id`, plus a `get_my_role()` helper for admin/manager checks.

**Consequences**: The policies exist and are internally consistent with the single-tenant schema. They have **never been verified against a live Supabase instance** — `docs/manuales/manual-sistema.md` explicitly caveats this, and it is the #3 current priority in [01_CURRENT_STATE.md §10](01_CURRENT_STATE.md#10-current-priorities-in-order-per-readme--docsgo-live-planmd--manual-15). This ADR also has a direct consequence for ADR-012 (Multi-Tenant): today's RLS policies have no tenant key to scope against, since no `tenant_id`/`business_id` column exists anywhere in the schema.

**Status**: Implemented — **unverified in production**.

---

### ADR-010 — Application Shell (headless layout composition)

**Context**: `app/admin/layout.tsx`, `app/employee/layout.tsx`, `app/client/layout.tsx`, and `app/dashboard/layout.tsx` each independently reimplement auth guarding and sidebar composition. No shared shell exists; `components/theme-provider.tsx` (next-themes) is dead code, unused anywhere.

**Decision**: Approved direction — build one Application Shell that owns cross-cutting chrome, configured per role rather than duplicated per role, following a headless-composition approach (shell owns behavior/structure, each role supplies its own content/nav config).

**Consequences**: Removes duplicated auth-guard and sidebar logic across 4 files; is a prerequisite for BrandProvider (ADR-011) to have one place to inject brand theming into.

**Status**: Planned — see [02_TARGET_ARCHITECTURE.md §4](02_TARGET_ARCHITECTURE.md).

---

### ADR-011 — BrandProvider and TenantProvider

**Context**: No brand-injection or tenant-context mechanism exists in the provider tree (`app/providers.tsx` composes only `AuthProvider`), and the schema has no tenant key (see ADR-009 consequence).

**Decision**: Approved direction — introduce `BrandProvider` (per-deployment brand theming, layered on the token system from ADR-008) and `TenantProvider` (tenant context + the schema migration required to scope every table to a tenant).

**Consequences**: `TenantProvider` is the larger of the two — it requires a migration touching every table listed in [01_CURRENT_STATE.md §8](01_CURRENT_STATE.md#8-data-model-supabase--postgres), not just a new React context. This is the anchor decision behind the Multi-Tenant / White-Label roadmap items in [05_ROADMAP.md](05_ROADMAP.md).

**Status**: Planned — see [02_TARGET_ARCHITECTURE.md §§5-6](02_TARGET_ARCHITECTURE.md).

---

### ADR-012 — Multi-Tenant SaaS strategy and White-Label offering

**Context**: `ai/context/business.md` names white-label and franchise support as future revenue lines. Today's schema and deployment model are single-tenant ([01_CURRENT_STATE.md §1](01_CURRENT_STATE.md#1-where-is-orno-today)).

**Decision**: Approved direction — evolve to one deployment serving many businesses (multi-tenant), with per-tenant branding (white-label) layered on top via BrandProvider/TenantProvider (ADR-011).

**Consequences**: This is a schema-and-RLS-level change, not a cosmetic one — every RLS policy from ADR-009 needs a tenant-scoping clause added. Sequencing this before or after the primary/secondary customer tiers in [03_PRODUCT.md](03_PRODUCT.md) need it is an open question — those tiers are naturally single-business today and don't strictly require multi-tenancy to be served.

**Status**: Planned — see [02_TARGET_ARCHITECTURE.md §§7-8](02_TARGET_ARCHITECTURE.md).

---

### ADR-013 — Scheduling Engine consolidation

**Context**: Availability logic lives in one route (`app/api/availability/route.ts`) with hardcoded business hours disconnected from the business-settings UI; a second, unrelated code path exists for public booking links (`app/api/bookings/public/route.ts`); appointment creation does not re-validate availability server-side.

**Decision**: Approved direction — consolidate into one scheduling abstraction shared by both authenticated and public booking flows, config-driven from real business-hours settings, with a server-side availability check on write.

**Consequences**: Removes the fail-open behavior currently present on DB error in the availability route, and removes the duplicate logic between the two booking paths.

**Status**: Planned — see [02_TARGET_ARCHITECTURE.md §9](02_TARGET_ARCHITECTURE.md).

---

### ADR-014 — Migration naming scheme "M0–M4"

**Context**: No historical M0–M4 migration sequence exists in this repository. The only M-numbered artifact in git history is commit `14bb85a` ("M1-M8 feature pack"), whose M1–M8 labels refer to eight unrelated features shipped in a single commit, not a phased plan. This ADR exists to prevent that historical commit from being confused with the new scheme below.

**Decision**: Adopt "M0–M4" as the milestone naming scheme for the target-architecture initiatives in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md), going forward from 2026-07-05. Proposed (not yet ratified) grouping: M0 stabilization, M1 tenant schema, M2 design system/branding, M3 shell unification, M4 scheduling + white-label launch.

**Consequences**: Until ratified, any reference to "M0-M4" in planning documents should be read as this new scheme, never as a claim about work already completed — no work under this scheme has started as of this writing.

**Status**: Planned — proposed grouping **Needs Validation** (see [02_TARGET_ARCHITECTURE.md §12](02_TARGET_ARCHITECTURE.md)).

---

### ADR-015 — Headless architecture for shared logic

**Context**: Business logic (booking rules, role gating, availability) is currently entangled with presentation across several Client Components rather than isolated in reusable, UI-agnostic modules.

**Decision**: Approved direction — favor headless composition (logic/state hooks and services decoupled from rendering) for the Application Shell (ADR-010) and Scheduling Engine (ADR-013), rather than embedding business rules directly inside page components as is common in the current codebase.

**Consequences**: Improves testability and reuse across admin/employee/client trees; requires discipline during the M2–M4 migration work not to reintroduce the current pattern.

**Status**: Planned.

---

### ADR-016 — CRM module (M5) sequencing relative to M0–M4 — `Status: Resolved (2026-07-05)`

**Context**: On 2026-07-05, work was requested to begin "M5 — CRM" directly, with instructions to reuse M1–M4 deliverables, respect the Design Constitution, use only semantic tokens, and avoid database changes "unless absolutely necessary." Verification against this Project Brain found: M0–M4 have not started (all `Planned`, unratified per [ADR-014](04_DECISIONS.md)); the Design Constitution has no ratified palette (per [ADR-008](04_DECISIONS.md)); and the requested CRM feature set (photos, documents, memberships, allergies, birthday, marketing consent) has no supporting schema today and cannot be built without additive database changes ([05_ROADMAP.md — M5 section](05_ROADMAP.md)).

**Decision**: Resolved with two explicit rulings:
1. **Schema forward-compatibility**: new Phase B tables (`memberships`, `client_photos`/`client_documents`) are created with an unused `tenant_id` column from day one (nullable, no FK to a `tenants` table yet, since none exists — see [ADR-011](04_DECISIONS.md)). New columns added to the existing `users` table (`birthday`, `allergies`, `preferred_employee_id`, `marketing_consent`) do **not** individually need `tenant_id` — `users` itself will be migrated as a whole table when M1 lands. This avoids a second schema migration pass on the *new* CRM tables specifically when M1 is eventually built.
2. **Design tokens**: the CRM UI is built now, referencing the existing `[data-theme="orno-admin"]` CSS-variable tokens (`app/globals.css:100-129`) as an explicitly **provisional** baseline. This is not a ratification of ADR-008 — if the Design Constitution later picks a different canonical palette, CRM screens are expected to be re-themed along with the rest of the app, not treated as exempt.

**Consequences**: CRM (M5) proceeds ahead of M0/M1/M2/M3 rather than waiting for them. This means: (a) the `manager`/`barber` role cleanup, secret rotation, and live RLS verification (M0) remain outstanding while new surface area is added on top of the current auth model — new CRM RLS policies must still follow the existing (unverified) pattern in `scripts/*.sql`; (b) CRM tables carry a dormant `tenant_id` column that does nothing until M1 defines what a tenant actually is — do not add filtering logic against it prematurely; (c) any future Design Constitution change implies a CRM re-theming pass, tracked as a known follow-up, not a surprise.

**Status**: Resolved — implementation of Phase A may proceed under these terms.

---

### ADR-017 — CRM Phase A implementation (client identity consolidation + real CLV)

**Context**: Following [ADR-016](04_DECISIONS.md)'s resolution, CRM Phase A (no schema change) was implemented on 2026-07-05: the client avatar/name/contact block duplicated across `app/admin/clients/page.tsx`, `app/admin/clients/[id]/page.tsx`, and `app/admin/pos/page.tsx` ([07_TECH_DEBT.md](07_TECH_DEBT.md)), and the undercounted "Total gastado" figure that excluded POS purchases.

**Decision**: Extracted `components/admin/clients/client-identity.tsx` (`ClientAvatar`, `ClientIdentity`), built on semantic tokens (`bg-primary`, `text-foreground`, `text-muted-foreground`, `Badge` variants) per the provisional-tokens ruling in ADR-016, and adopted it in all three files. Added a `pos_sales` query to the client profile page and combined it with completed-appointment revenue for a real CLV figure, plus explicit "Última visita" / "Próxima cita" stat tiles computed from data already fetched. `app/admin/appointments/page.tsx`'s thinner client representation was deliberately left unconsolidated — reshaping it touches appointment data-fetching, which [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md) flags as high-blast-radius business logic outside this change's scope.

**Consequences**: The three touched pages now visually consume the `orno-admin` token system for client-identity rendering for the first time (previously hardcoded Tailwind grays/blues/ambers, inconsistent with the dark theme already applied at the layout level via `data-theme="orno-admin"`). Remaining hardcoded styling in the same files (dropdown menu background, stat-tile label colors) was intentionally left untouched to keep this change's blast radius contained — tracked in [07_TECH_DEBT.md](07_TECH_DEBT.md). No database changes were made in this phase.

**Status**: Implemented (2026-07-05).

---

### ADR-018 — CRM Phase B implementation (profile fields, memberships, Storage-backed attachments)

**Context**: Following [ADR-016](04_DECISIONS.md)'s resolution and Phase A ([ADR-017](04_DECISIONS.md)), CRM Phase B was implemented on 2026-07-06: `birthday`, `allergies`, `preferred_employee_id`, `marketing_consent` on `users`; a `memberships` table; and a `client_attachments` table backed by Supabase Storage — all additive, authored as `scripts/32-add-client-profile-fields.sql`, `scripts/33-add-memberships.sql`, `scripts/34-add-client-attachments.sql`, following the project's existing "numbered SQL script run manually in the Supabase SQL Editor" convention (see `README.md`). These scripts were **authored, not executed** against any live instance — no Supabase credentials were available or used in this session, consistent with treating schema changes as high-stakes ([06_CLAUDE_RULES.md §4](06_CLAUDE_RULES.md)).

**Decision**:
1. New `users` columns need no new RLS policies — the existing row-level "own profile" policies (scripts 01/04/10/11/27) already cover them, the same way `admin_notes` (script 12) is covered.
2. `memberships` and `client_attachments` follow the `get_my_role()` RLS pattern established in script 27, with admin+manager write access. `memberships` allows clients to read their own rows (mirroring `client_messages`/`client_gifts`, script 16); `client_attachments` does **not** — photos/documents are admin/manager-only with no client self-service access, a deliberately more restrictive default than the messages/gifts precedent.
3. `client_attachments` is backed by a new **private** Supabase Storage bucket (`client-attachments`) — the first real use of Supabase Storage in this codebase (`avatar_url` on `users`, script 01, never actually wired to Storage). RLS on `storage.objects` mirrors the metadata table's role gating.
4. Both new tables carry a dormant, unused `tenant_id` column per the Phase A/B sequencing ruling in [ADR-016](04_DECISIONS.md).
5. New UI (`ClientPreferencesCard`, `ClientMembershipsCard`, `ClientAttachmentsCard`, all in `components/admin/clients/`) talks to Supabase directly from the client, matching the existing direct-browser-client pattern already used for `admin_notes`/`client_messages`/`client_gifts` on the same profile page — not a new pattern, and not routed through `app/api/clients/route.ts` (which itself lacks `GET`/`[id]`, per [07_TECH_DEBT.md](07_TECH_DEBT.md)).

**Consequences**: The client profile page (`app/admin/clients/[id]/page.tsx`) now has 7 cards total. `client_attachments` upload/list only functions with real Supabase configured — demo mode shows an explicit "requires Supabase" message rather than fabricating fake files. Memberships have no edit/cancel UI yet (create + list only) — tracked as a Phase B follow-up in [07_TECH_DEBT.md](07_TECH_DEBT.md). No data migration or backfill was needed since the project is pre-production ([01_CURRENT_STATE.md §1](01_CURRENT_STATE.md)).

**Status**: Implemented (2026-07-06) — schema authored and, per user confirmation, run against the live Supabase instance (not independently verified from this session); UI implemented and validated (`type-check`/`lint`/`build` all pass).

---

### ADR-019 — CRM Phase C implementation (unified timeline, visit frequency, AI Insights placeholder)

**Context**: Following Phase A ([ADR-017](04_DECISIONS.md)) and Phase B ([ADR-018](04_DECISIONS.md)), Phase C — the last item in the M5 CRM scope from [05_ROADMAP.md](05_ROADMAP.md) — was implemented on 2026-07-06: a unified chronological timeline, a visit-frequency metric, and an AI Insights slot.

**Decision**:
1. `ClientTimelineCard` (`components/admin/clients/client-timeline-card.tsx`) merges appointments, `client_messages`, `client_gifts`, and `pos_sales` — all data already fetched by the profile page for other cards — into one client-side sorted feed. No new queries beyond widening the existing `pos_sales` select from `total` only to full rows (`id, total, payment_method, created_at`).
2. Visit frequency is computed as the average number of days between the client's first and most recent **completed** appointment, divided across the visit count in between — requires at least 2 completed appointments to display; otherwise shows "—" rather than a misleading number.
3. `ClientAIInsightsCard` (`components/admin/clients/client-ai-insights-card.tsx`) is a **deliberate, static placeholder** — no data fetching, no fabricated output. [02_TARGET_ARCHITECTURE.md §14](02_TARGET_ARCHITECTURE.md) marks AI Architecture as `Planned (Future)` with no scope defined; this card exists only to reserve the layout slot and links back to that section, per [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md)'s "never present Planned as Implemented."

**Consequences**: The client profile page (`app/admin/clients/[id]/page.tsx`) now has 9 cards total across Phases A-C. This closes the M5 CRM scope as originally requested (Customer Profile, Appointment/Services History, Products Purchased, Loyalty, Memberships, Notes, Photos, Documents, Allergies, Preferred Barber, Birthday, WhatsApp actions*, Marketing permissions, Timeline, CLV, Visit Frequency, Last/Next Visit, AI Insights placeholder) — *WhatsApp actions remain partially covered at the integration level only (`app/admin/integrations`), no per-client "message via WhatsApp" button was added, since that depends on the Integrations module moving off its current stub status ([01_CURRENT_STATE.md §9](01_CURRENT_STATE.md)), not on CRM Phase C.

**Status**: Implemented (2026-07-06) — `type-check`/`lint`/`build` all pass. Schema for this phase (none — Phase C is UI/aggregation only, no new tables) required no scripts.

---

### ADR-020 — Billing/Integrations Phase A: stop fabricating data before building real providers

**Context**: `app/admin/billing/page.tsx` and `app/admin/integrations/page.tsx` were confirmed, by reading both files in full, to render **100% invented data** — hardcoded fake invoices (`INV-2026-015`), fake credit cards (Visa/Mastercard with fantasy numbers), a fake "Stripe: Conectado" status with zero Stripe code anywhere, and fake event logs ("Pago recibido hace 45 min"). This is materially different from the CRM's "thin CRUD" gap — it's actively misleading UI, and Billing additionally touches real money, which this project has never processed.

**Decision** (user-approved 2026-07-06, mirroring the CRM Phase A pattern):
1. **Billing**: replace fabricated invoices/cards/plan-status with real (likely-empty) queries against new `subscriptions`/`invoices` tables (`scripts/35-add-billing-schema.sql`, admin-only RLS — not even manager, matching `employee_commissions`' precedent). No payment provider is chosen or integrated in this phase — that decision (Stripe vs Mercado Pago) remains open, per [02_TARGET_ARCHITECTURE.md §13](02_TARGET_ARCHITECTURE.md). The plan comparator (Starter/Pro/Enterprise) stays as informational pricing, with its CTA disabled and labeled "Próximamente" rather than pretending to process a plan change.
2. **Integrations**: of the 11 listed integrations, only WhatsApp (via Twilio) has real backend infrastructure (`notification_queue`, script 31; Twilio calls in `app/api/appointments/[id]/cancel/route.ts` and the `process-notification-queue` Edge Function). A new server-only route, `app/api/integrations/status/route.ts`, reports whether `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_WHATSAPP_FROM` are set (booleans only, never the secret values) so the WhatsApp card shows real "Configurado"/"No configurado" status. WhatsApp has no "Conectar" button — it's an env-var-based integration, not a clickable OAuth flow, so a button implying an in-app action would itself be dishonest. The other 10 integrations are marked "Próximamente" with disabled buttons — no fake "Conectar" action. The fake event log was replaced with a real query against `notification_queue` (entries with a non-null `recipient_phone`, as a proxy for WhatsApp/SMS-channel sends — the table has no explicit channel column).

**Consequences**: Both pages now show mostly-empty states in a fresh database — this is the correct, honest behavior, not a regression. A user configuring Twilio env vars will see the WhatsApp card and its logs light up with real data immediately, with no code change needed. Choosing a payment provider and building a real subscription/checkout flow remains fully open — this ADR deliberately stops short of that decision.

**Status**: Implemented (2026-07-06) — schema authored, not run against any live instance in this session (unlike CRM Phase B, no confirmation yet that scripts 35 has been applied — see [07_TECH_DEBT.md](07_TECH_DEBT.md)). `type-check`/`lint`/`build` all pass.

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) · [07_TECH_DEBT.md](07_TECH_DEBT.md)
