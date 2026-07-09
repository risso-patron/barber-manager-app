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

**Consequences (original, 2026-07-05)**: The type system (`lib/types.ts`) reflects 3 roles, but live authorization code — `middleware.ts`, `hooks/useAuth.tsx`, `hooks/useRequireAuth.ts` — still branches on 5 roles including `manager` and `barber`. This decision has not been fully executed in code; the cleanup is tracked in [07_TECH_DEBT.md](07_TECH_DEBT.md) and is priority #2 in [01_CURRENT_STATE.md §10](01_CURRENT_STATE.md#10-current-priorities-in-order-per-readme--docsgo-live-planmd--manual-15).

**Cleanup executed (2026-07-06)**: `barber` was never a real Postgres enum value (only `client`/`employee`/`admin` exist in `scripts/01-create-tables.sql`) — it existed solely in demo fixtures (`lib/demo-config.ts`, `lib/demo-appointments.ts`) and in ~15 files of live routing/auth code. Fixed: demo fixtures now assign `role: 'employee'` (the `barber@demo.com` login still works, just resolves correctly); `middleware.ts`, `hooks/useAuth.tsx`, `hooks/useRequireAuth.ts`, `components/layout/sidebar.tsx`, `components/auth/login-form.tsx`, `app/dashboard/page.tsx`, and `lib/constants.ts` no longer branch on either role; all 8 `useRequireAuth(["admin", "manager"])` admin-page guards became `useRequireAuth(["admin"])`; 6 API routes (`clients`, `pos`, `loyalty`, `schedule-blocks`, `appointments/admin`, `appointments/[id]/reschedule`, `alerts`, `integrations/status`) dropped `manager` from their role checks; two now-dead `maskPhone`-for-manager branches were removed; `app/admin/employees/page.tsx`'s `isBarber()` now checks the `specialty` field instead of the nonexistent `role === "barber"`. The orphaned `/barber` route (`app/barber/`) and two dead duplicate routes (`backup/alerts_old/`, `backup/alerts_backup/`, `app/api/alerts_backup/`) were deleted. `manager` remains a real Postgres enum value with real RLS policies (`scripts/27-add-manager-role.sql`) — this ADR deliberately did **not** touch the database (no live Supabase access this session, and dropping a Postgres enum value requires recreating the type); those policies are now inert artifacts until a future decision either formalizes `manager` with a real creation path or removes it at the DB level too. One e2e test (`e2e/employee.e2e.spec.ts`) was updated to stop asserting against the deleted `/barber` page — **not verified by actually running it**, since it requires Supabase credentials not available this session.

**Status**: **Implemented** (application-code layer, 2026-07-06). DB-level `manager` enum/RLS cleanup remains a separate, undecided follow-up — see [07_TECH_DEBT.md](07_TECH_DEBT.md).

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

**Original proposed grouping (2026-07-05, superseded)**: M0 = stabilization, M1 = tenant schema, M2 = design system/branding, M3 = shell unification, M4 = scheduling + white-label launch. That grouping mixed product-architecture milestones with framework-implementation milestones and was explicitly marked "Needs Validation."

**Decision (ratified 2026-07-08)**: The `ORNO Design Bible v1.0` (frozen 2026-07-08, `docs/orno design/ORNO Design Bible v1.0.md`) supersedes the original proposed grouping. M0–M4 are now the **ORNO Framework component milestones** — fully specified, with production-ready drop-in packages in `docs/orno design/migration/`:

| Milestone | Scope | Package location | Status |
|---|---|---|---|
| **M0** | Design Tokens — warm palette, CSS variables, `tailwind.config.ts`, `lib/tokens.ts`, `Logo`/`Icon` foundations | `docs/orno design/migration/M0/` | Ready to apply |
| **M1** | UI Primitives — 16 components (`Button`, `Input`, `Field`, `FormModal`, `ConfirmDialog`, `StatusBadge`, `CurrencyInput`, `SearchInput`, `Logo`, `AppIcon`, `lib/brand.ts`, etc.) | `docs/orno design/migration/M1/` | Ready to apply |
| **M2** | Application Shell — `AppShell`, `Sidebar` (one component, two states), `BrandProvider`, `CommandPalette`, `BottomNav`, `Header`; replaces 4 independent layouts | `docs/orno design/migration/M2/` | Ready to apply |
| **M3** | Feedback & Data — `AsyncPane`, `DataTable`, `PanelCard`, `StatCard`, `EmptyState`, `ErrorPane`, `Skeleton`, `notify` (toasts with `onUndo`) | `docs/orno design/migration/M3/` | Ready to apply |
| **M4** | Scheduling Engine — pure `engine.ts` (tz math, `suggestGaps`, `detectConflict`) + headless `useScheduleDnd` + 12 presentation components (`AppointmentTimeline`, `AppointmentCard`, etc.) | `docs/orno design/migration/M4/` | Ready to apply |

Apply order: **M0 → M1 → M2 on one branch; M3 → M4 on the same branch or next; merge only when all work together** (per M2 README).

The product-architecture milestones originally described (tenant schema, white-label, scheduling engine consolidation) remain in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) and are addressed by the M0–M4 framework above (M2 = Application Shell, M4 = Scheduling Engine) or deferred (tenant schema = still `Planned`, depends on M0–M4 being live first).

**Consequences**: The "Until ratified" disclaimer no longer applies. Any reference to "M0–M4" in this codebase means the framework milestones above. The historical commit `14bb85a`'s internal "M1–M8" labels remain a separate, unrelated naming — do not confuse them. The first implementation task is creating branch `feat/orno-framework-m0-m1-m2` and applying the three packages together (see Engineering Readiness Report, Sprint 1 plan).

**Status**: **Approved — ratified 2026-07-08** by owner confirmation that `ORNO Design Bible v1.0` (frozen same date) supersedes the original "Needs Validation" grouping. Drop-in packages are implementation-ready; no further design approval required before applying.

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

### ADR-021 — ORNO M2 Application Shell: single AppShell + BrandProvider replace the four independent layouts

**Context**: The three portal layouts (`app/admin`, `app/employee`, `app/client`) plus the legacy `/dashboard` tree each carried their own sidebar/bottom-nav and their own styling (admin and employee: hardcoded dark `#0F0F0F` with `#E53935` as an interface color — a direct Design Constitution violation). Design detail lives in `docs/orno design/ORNO Design Bible v1.0.md` (not duplicated here).

**Decision**: One `AppShell` (`components/shell/`) renders all three portals; navigation is data (`components/shell/navigation.ts`, one manifest per role — the single source of portal navigation); `BrandProvider` is the single source of branding (ORNO exists only as the default `BrandConfig`; white-label = pass a different config, zero shell edits). Sign-out is centralized in `lib/sign-out.ts` (verbatim port of the legacy sidebar handlers).

**Repo-specific corrections vs the M2 drop-in package** (the package's claims were verified, not trusted):
1. Auth guards restored to the repo's real matrix — admin `["admin"]` (package reintroduced the dead `manager` role removed in FASE 5), employee `["employee","admin"]`, client `["client","admin"]` (package dropped admin access). This matrix matches `middleware.ts` server-side authorization exactly.
2. Package sign-out dispatched `CustomEvent("orno:signout")` with no listener anywhere — replaced with the real flow.
3. Package navigation pointed at four nonexistent routes (`/employee/agenda|fichaje|historial|perfil`) and omitted `/admin/billing`, `/admin/integrations`, `/client/history` — fixed to real routes with full page reachability.

**Constraint (permanent)**: next/font variable classes MUST live on `<html>`, not `<body>` — `globals.css` resolves `--font-sans: var(--font-inter)` at `:root`, and custom properties resolve `var()` where declared; on `<body>` the chain computes invalid and the entire app falls back to the browser serif (this was live in production styling M0→M2).

**Consequences**: The five orphaned legacy nav components (`components/{admin,employee,client}/layout/*-sidebar|*-bottom-nav`) were deleted in the follow-up cleanup commit after a repo-wide zero-reference verification; `components/layout/sidebar.tsx` survives only as a dependency of the legacy `/dashboard` tree. The `/dashboard` middleware fallback was subsequently migrated and the tree deleted — see ADR-022. `components/layout/footer.tsx` is still imported by live routes (`app/book/[slug]`, `app/auth/layout.tsx`) — not shell-related, migrates separately. Page bodies keep their own legacy styling until Design Bible Phases 4–9.

**Status**: Implemented (2026-07-08), pending commit approval. `type-check`/`lint` pass; verified in-browser (all three portals, ⌘K palette, mobile bottom nav + FAB, sign-out, WCAG AA contrast on shell chrome).

---

### ADR-022 — Role-based routing consolidated in lib/routes.ts; legacy /dashboard role-router deleted

**Context**: `app/dashboard/page.tsx` was never a dashboard — it was a client-side role router (read session → map role → redirect). The role→home map was duplicated in four places (`app/dashboard/page.tsx`, `useRequireAuth`'s `DASHBOARD_MAP`, `login-form`'s `ROLE_MAP`, `navigation.ts` `home` fields), and `middleware.ts` redirected role mismatches to `/dashboard` even in the six (of seven) branches where it already knew the role.

**Decision** (user-approved 2026-07-08, "Alternativa A"): `lib/routes.ts` is the single source of role routing — `ROLE_HOME` + `roleHome(role)`, edge-safe pure constants. The middleware redirects mismatches directly to the offender's portal home; `/dashboard` stays in the matcher only as an edge redirect for legacy bookmarks; the `roleError` branch (role query fails) now passes the request through and lets the client-side guard (`useRequireAuth`) decide — the same decider the legacy router delegated to, minus the hop. All four duplicated maps now import from `lib/routes.ts`. `app/dashboard/**` and `components/layout/sidebar.tsx` (its only consumer) deleted.

**Multi-tenant path**: when tenants land, `roleHome(role)` becomes `roleHome(role, tenant)` in this one file; the middleware already resolves per-request Supabase state, so tenant resolution slots in without new architecture.

**Consequences**: Authorization model unchanged (same checks, same roles, same matcher). Wrong-portal navigation now lands on the user's own home in one hop with no legacy-shell flash. Only behavior delta: on a transient role-query failure the user sees the guard skeleton instead of a redirect bounce. Verified in-browser across 7 redirect flows (no session, role mismatch ×3, legacy bookmarks ×2, admin cross-portal access).

**Status**: Implemented (2026-07-08) — commits `50119d7` (consolidation) + `b822311` (deletion). `type-check`/`lint` pass.

---

### ADR-023 — Agenda admin reconstruida sobre el M4 Scheduling Kit; la Agenda es la implementación canónica del framework

**Context**: `app/admin/appointments/page.tsx` (880 líneas) era list-first con una week view de solo lectura, estilada con hex dark hardcodeado (`#1A1A1A`, `#E53935` como color de interfaz — violación de la Constitution). El M4 Scheduling Kit (`components/scheduling/`, commit `0e38952`) pasó una Acceptance Review dedicada contra la Design Bible v1.0, la página legacy y la capa de datos real; el usuario aprobó 8 decisiones que gobiernan esta reconstrucción.

**Decision** (usuario, 2026-07-09): la Agenda tiene dos representaciones de la MISMA fuente de datos/filtros/permisos — Board M4 por barbero (default, operación diaria: drag optimista con Deshacer, huecos sugeridos, bloqueos, línea de ahora) y Lista (búsqueda histórica, auditoría, paginación). Sustitución de infraestructura, no reescritura funcional: mismas queries con joins, mismas rutas API, mismos handlers CRUD, mismo RLS (mover = el mismo `update({barber_id, appointment_date, appointment_time})` que ya ejercía la edición). Commit `1e18b82`.

**Divergencias modelo-de-datos ↔ kit (resueltas sin tocar la DB)**:
1. La DB guarda `appointment_date` + `appointment_time` naive sin `end_time` (duración = `service.duration`) → mapping en la página con `cfg.timezone` = tz del navegador (round-trip identidad); **resize deshabilitado** (`allowResize=false` — nuevo prop del kit): no hay dónde persistir duración por cita.
2. Los 5 estados de la DB son subconjunto estricto de los 7 del kit → pass-through directo; `checked_in`/`in_progress` son contrato futuro (requieren migración aprobada).
3. Walk-ins, working hours y `variant="week"` (prometido en comentarios del package, no implementado) quedan como contratos documentados.

**Correcciones al package en la adopción**: import roto de `DEFAULT_CONFIG` (estaba en `./types`, no `./engine`), `endMin` sin uso, `announce()` genérico → enriquecido ("Cita de Julián movida a las 13:00 con Nicolás." — Bible §12), `truncate` en nombre de cliente → `line-clamp-2` (Bible §15). El engine tiene 20 tests unitarios (`engine.test.ts`: `minutesInTz`, `suggestGaps`, `detectConflict`, `snap`).

**Regla derivada (usuario)**: la Agenda es la implementación canónica del framework M4. CRM/POS/Inventario migran con exactamente los mismos componentes y patrones; si un componente necesita evolucionar, evoluciona primero en el framework y todos los módulos consumen la nueva versión — nunca soluciones locales, nunca forks.

**Consequences**: la week view legacy desapareció dentro del rewrite (el board es su superset funcional). Huérfanos verificados y eliminados en el cleanup: `components/dashboard/stats-card.tsx` (cero referencias; resto del árbol `/dashboard` borrado en ADR-022) y las 5 clases `.orno-status-*` de `globals.css` (su único consumidor era el `STATUS_COLORS` de la página legacy; `.orno-cat-*` sigue vivo en inventory). Nota de naming: el `MetricRow` de la Bible §9 se llama `StatCard`/`StatStrip` en el repo. Fix colateral: `appointment_time` se normaliza a `HH:MM` al cargar (Postgres devuelve `HH:MM:SS`, que rompía el `<input type="time">` del modal de edición).

**Status**: Implemented (2026-07-09) — commit `1e18b82` (rebuild) + cleanup en commit posterior. `type-check`/`lint`/`vitest` pass. Pendiente: recorrido manual del usuario (drag, undo, estados, CRUD, POS, toggle, responsive, teclado, performance) antes de declarar la Agenda aprobada y arrancar CRM.

---

### ADR-024 — Módulo CRM (Clientes) migrado al framework ORNO; primera adopción completa post-Agenda

**Context**: `app/admin/clients` era el primer módulo en migrar bajo la regla de ADR-023 ("el framework evoluciona primero, los módulos consumen — nunca forks locales"). Readiness Report previo (2026-07-09) identificó: lista híbrida (ya usaba `AsyncPane`/`ClientIdentity` pero con 4 stat cards artesanales, search y dropdown a mano), perfil pre-ORNO (733 líneas: `Loader2` full-page violando Bible §16, `STATUS_LABEL` color-only violando §12, azul/púrpura como colores de interfaz violando la Constitution, 3 textareas crudos, feedback `success + setTimeout`), y 5 usos de colores raw en sub-componentes.

**Decision** (usuario, 2026-07-09): migración por milestones con aprobación por commit, presentación solamente — queries, mutaciones, rutas API, permisos y RLS byte-idénticos (verificado filtrando el diff por `supabase|.from(|select|update|insert|fetch(|useRequireAuth|/api/` → 0 líneas). Única evolución de framework: `ActionMenu` (CRM-0, `3fb0dc7`), adoptado primero por la Agenda y consumido después por CRM.

**Commits del baseline**: CRM-0 `3fb0dc7` (ActionMenu al framework) → CRM-1 `14996d6` (lista: StatStrip/StatCard, SearchInput, ActionMenu) → CRM-2A `9ffcd4b` (badges semánticos, `notify()` en CRUD, Textarea, tokens en lista/identity/loyalty-modal) → CRM-2B `1f68cc9` (perfil íntegro: AsyncPane page-level + skeletons con forma, EmptyState, 7 StatCards, StatusBadge con fallback neutral, `notify()` ×4, 3 Textarea, acentos a tokens sancionados) → hotfix `22bda7c` (POST `/api/loyalty` resuelve demo antes del schema UUID — bug pre-existente: los ids demo `'c1'…` no son UUID y el `safeParse` corría antes del branch `isDemoMode()`; el fix imita al GET del mismo endpoint y preserva el 400 de body malformado y el flujo real completo). CRM-3 (extracción de AiHint, opcional por Bible §9) deliberadamente NO ejercida: `ClientAIInsightsCard` sigue siendo placeholder estático.

**Deuda extinta (métricas)**: colores de paleta cruda 52→0 (grep repo-scoped sobre `app/admin/clients` + `components/admin/clients` = 0), stat cards artesanales 11→0, spinner full-page 1→0, `setTimeout` como feedback 4→0, textareas crudos 3→0, dropdowns artesanales 1→0, mapas de estado color-only 1→0.

**Validación**: `type-check`/`lint`/`vitest 26/26` en cada milestone + smoke E2E Playwright (11 pasos, modo demo forzado con `NEXT_PUBLIC_SUPABASE_URL=` vacío): login, lista, navegación lista↔perfil, 7 StatCards, notas/mensaje/regalo/puntos con toast, cliente inexistente, búsqueda vacía — 11/11 PASS, 0 console errors. Modo Supabase real verificado a nivel SSR/ruta/middleware; recorrido manual interactivo en real a cargo del usuario (única parte con credenciales).

**Excepción documentada**: `client-memberships-card.tsx:26` conserva un `STATUS_LABEL` propio (estados de membresía, no de citas) con aliases legacy del Badge (`default`/`secondary`/`outline`). No viola la Bible (labels de texto visibles, aliases mapean a tints ORNO, cero colores raw); renombrarlo o canonizar los aliases es refactor cosmético fuera del alcance de CRM-4 — registrado en [07_TECH_DEBT.md](07_TECH_DEBT.md).

**Consequences**: el CRM habla el idioma del sistema — una máquina de estados de datos (`AsyncPane`), un canal de feedback (`notify()`), un vocabulario de estados (`StatusBadge`, el mismo de la Agenda), un patrón de métricas (`StatCard`). Huérfanos: **ninguno** — la migración editó in place; los 8 componentes de `components/admin/clients/` tienen consumidores (`ClientAvatar` también lo usa POS), verificado por búsqueda de referencias. Sin archivos eliminados en CRM-4.

**Status**: Implemented (2026-07-09) — CRM-4 es este cierre documental (ADR + sync del Brain, sin cambios funcionales ni visuales). El módulo CRM queda oficialmente cerrado; siguiente dominio: POS o Inventario según hoja de ruta, previo Readiness Report.

---

### ADR-025 — Módulo Empleados migrado al framework ORNO; NativeSelect evoluciona como primitivo del framework; TempPasswordAlert como patrón de credencial temporal

**Context**: `app/admin/employees/page.tsx` y `components/admin/employees/employee-modal.tsx` funcionaban antes de esta migración sobre primitivas ad hoc: selects nativos con una constante local `SELECT_CLS`, avatar de empleado con lógica `if (imageUrl)` inline, y contraseña temporal gestionada con `toast()` — un patrón incorrecto para información operacional que el admin necesita copiar antes de cerrar. La regla de ADR-023 ("el framework evoluciona primero, los módulos consumen — nunca forks locales") requería que el framework recibiera ambas primitivas antes del consumo.

**Decision** (usuario, 2026-07-09): migración de presentación solamente — queries, mutaciones, rutas API, permisos y RLS byte-idénticos. El framework recibió primero `NativeSelect` (FW-1, `354681c`) y `ClientAvatar.imageUrl`; EMP-1 (`ba197f8`) consumió ambos en Empleados y, como efecto colateral, en el modal de Agenda (primer consumidor de `NativeSelect` fuera del módulo original — primera prueba de regresión del framework).

**Commits del baseline**: FW-1 `354681c` (NativeSelect al framework + ClientAvatar.imageUrl) → EMP-1 `ba197f8` (Empleados + modal de Agenda: NativeSelect, ClientAvatar.imageUrl, TempPasswordAlert).

**Decisiones clave**:

1. **NativeSelect como componente del framework, no constante compartida**: `SELECT_CLS` existía en `inventory-modal.tsx` como constante local — el selector nativo merece ser un primitivo del framework para garantizar consistencia de tokens ORNO entre módulos. Inventario conserva la constante local por quedar fuera del alcance de EMP-1; deuda registrada en [07_TECH_DEBT.md](07_TECH_DEBT.md).

2. **ClientAvatar.imageUrl como prop aditiva, no bifurcación**: antes de FW-1, `ClientAvatar` no tenía prop `imageUrl` — el employee-modal renderizaba su propio `<img>` condicional. Añadir `imageUrl` al componente existente respeta la regla ADR-023: el componente evoluciona en el framework y todos los consumidores (CRM, POS, Empleados) se benefician sin fork.

3. **TempPasswordAlert como panel persistente, no toast**: la contraseña temporal es información operacional, no una notificación efímera — el admin necesita verla, copiarla y cerrarla manualmente. Un `Alert` persistente con acción "Copiar" es el patrón correcto. Props: todos primitivos (`variant: "success"|"info"`, `title: string`, `name: string`, `password: string`, `note: string`, `onDismiss: () => void`), sin dependencia de tipos, rutas ni lógica del dominio Empleados. Candidato a promoverse al framework como `CredentialPanel` en una evolución futura explícita; el naming `variant`/`onDismiss` (vs `tone`/`onClose`) es convención interna, no acoplamiento — un rename debe hacerse como evolución del framework con todos los consumidores en el mismo commit, no mezclado en un milestone de cierre documental.

4. **DEMO_EMPLOYEES fuera del alcance**: `lib/demo-config.ts` y `lib/demo-appointments.ts` definen dos catálogos de empleados demo desincronizados — IDs, nombres, emails y campos incompatibles. Esta es deuda de datos, no de interfaz; no tocarla en EMP-1 fue la decisión correcta. Registrado en [07_TECH_DEBT.md](07_TECH_DEBT.md) como deuda explícita.

**Verificación pre-commit (EMP-1)**: `type-check` limpio, `lint` solo warnings pre-existentes, 26/26 tests verdes. Greps repo-wide: `SELECT_CLS` únicamente en Inventory, hex colors en `app/admin/employees` + `components/admin/employees` = 0, inline styles = 0, `activeDropdown` únicamente en Services.

**Consequences**: Empleados habla el idioma del sistema — `NativeSelect` reemplaza el `<select>` ad hoc con tokens ORNO garantizados, `ClientAvatar` es el componente canónico para avatares en cualquier contexto, y la contraseña temporal tiene un patrón correcto y reutilizable. La Agenda adoptó `NativeSelect` en su modal como efecto colateral: si el framework se rompe en ese primitivo, la Agenda lo detecta antes de que el bug se propague. `activeDropdown` queda aislado en Services — el Readiness Report de Services abrirá ese dominio como el último con esa familia de deuda técnica.

**Status**: Implemented (2026-07-09) — EMP-2 es este cierre documental (ADR + sync del Brain, sin cambios funcionales ni visuales). El módulo Empleados queda oficialmente cerrado; siguiente dominio: Services, previo Readiness Report.

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) · [07_TECH_DEBT.md](07_TECH_DEBT.md)
