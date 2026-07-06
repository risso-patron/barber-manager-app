# 05 — Roadmap

> **Scope**: "Completed" below is verified against git history and code ([08_CHANGELOG.md](08_CHANGELOG.md) has the full detail). "Planned" reflects the target architecture in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md), `ai/context/roadmap.md`, and this planning session — none of it is built. Where "planned" applies to a module that is already functional today, that's called out explicitly so this document doesn't contradict [01_CURRENT_STATE.md](01_CURRENT_STATE.md).

---

## Completed

Real phase taxonomy, as it exists in git history (full detail in [08_CHANGELOG.md](08_CHANGELOG.md)) — there is no historical "M0–M4"; that label is reserved for the planned scheme below (see [ADR-014](04_DECISIONS.md)).

- **FASE 1** — base structure, admin/employee/client dashboards, full CRUD (appointments/employees/services/clients/inventory/reports/settings), initially on `localStorage`.
- **Auth migration** — moved from `localStorage` to Supabase Auth + RLS, then reintroduced demo mode as a deliberate fallback ([ADR-001](04_DECISIONS.md), [ADR-002](04_DECISIONS.md)).
- **FASE 1 – Paridad Crítica** — public booking link without login, Email/WhatsApp notification APIs, QR share page.
- **Security hardening** — rate limiting, input validation/XSS/SQLi detection, security headers, security logging, environment validation.
- **Hybrid booking system** — login-based and no-registration booking coexisting, optional signup modal.
- **Testing infrastructure** — Vitest + Testing Library + Playwright, first e2e/unit/integration suites, openspec specs introduced.
- **Full Supabase wiring** — every core module (appointments, employees, services, inventory, clients) connected to real Supabase data, replacing `localStorage`.
- **Visual rebrand** — ORNO dark editorial identity ([ADR-007](04_DECISIONS.md)).
- **Auth unification** — resolved the dual Supabase/localStorage auth conflict ([ADR-006](04_DECISIONS.md), verified complete).
- **"M1-M8" feature pack** (single commit, `14bb85a`) — rescheduling, employee commissions, attendance/work-status tracking, password recovery, appointment ratings, loyalty points, POS, low-rating alerts. (Reminder: this is historical labeling unrelated to the M0–M4 scheme below — see [ADR-014](04_DECISIONS.md).)
- **v1.2 Items 9–19** — POS checkout/loyalty/tips, cache revalidation + pagination, notification queue, Resend/Twilio notification Edge Function.
- **FASE 1-3 audit** — booking wizard, auth security, UX and accessibility review (client-side).
- **Admin panel audit** — accessibility fixes, demo-data consistency pass.
- **QA smoke testing** — role-based Playwright smoke suite (`qa-analysis.md`).
- **Auth flow hardening** — demo login and middleware flow fixes.
- **FASE 5** — dynamic availability connected to schedule blocks (D1), consistent employee badges and demo banners in blocks (D2+D3) — the most recent work, still in progress on this exact seam.

## Current status by module (see [01_CURRENT_STATE.md §9](01_CURRENT_STATE.md#9-module-status-verified-by-code-not-just-by-claim) for evidence)

✅ Functional today: Citas/Booking, Empleados, Clientes, Inventario, POS, Reportes, Fidelización.
🔴 Stub: Facturación (Billing), Integraciones.

---

## Planned

### M0–M4 — target architecture milestones (proposed, `Needs Validation` — see [ADR-014](04_DECISIONS.md))

| Milestone | Scope | Depends on |
|---|---|---|
| **M0** | Stabilization: rotate overdue secrets, verify RLS on a live instance, resolve `manager`/`barber` role debt | — |
| **M1** | Tenant schema migration (`tenant_id` across all tables, tenant-aware RLS) | M0 |
| **M2** | Design Constitution, Semantic Design Tokens completion, BrandProvider | M0 |
| **M3** | Application Shell unification (replacing 4 independent layouts) | M2 |
| **M4** | Scheduling Engine consolidation, White-Label launch | M1, M2, M3 |

This grouping is a strawman proposed in this planning session — it must be explicitly ratified before being treated as a committed plan.

### M5 / M6 and beyond — `Needs Validation`, no scope defined yet

Named in the original planning ask but not yet scoped against the codebase or `ai/context/roadmap.md`. Do not treat "M5"/"M6" as meaning anything specific until scoped — they are placeholders for whatever comes after M4.

### Feature-area roadmap

| Area | Current state | Planned direction |
|---|---|---|
| **CRM** | Scoped 2026-07-05 (see below). More built out than plain CRUD: `app/admin/clients/[id]/page.tsx` already has profile + appointment history + admin notes + client messages + gifts/discounts + loyalty. Still missing photos, documents, allergies, birthday, preferred barber, marketing consent, memberships, unified timeline, true CLV/avg-ticket/visit-frequency. | See **M5 — CRM** section below. **Not yet approved for implementation.** |
| **POS** | ✅ Functional (`app/admin/pos`, `pos_sales`/`pos_sale_items`). | Planned work here is *enhancement*, not new build — e.g. deeper reporting integration. |
| **Inventory** | ✅ Functional, but `ai/context/current-state.md`-adjacent risk notes flag stock-movement traceability as not fully end-to-end. | Harden traceability, formalize multi-tenant isolation once M1 lands. |
| **Reports** | ✅ Functional (`app/admin/reports`, 1209 lines) but the corresponding spec (`openspec/specs/reportes-dashboard.md`) is far thinner than the implementation. | Bring spec in line with implementation; extend analytics depth. |
| **Billing** | 🔴 Stub, no payment provider integrated. | Real Billing Engine — see [ADR entry / target architecture §13](02_TARGET_ARCHITECTURE.md). |
| **Integrations** | 🟡 Stub UI, no real third-party connections. | Real integrations — WhatsApp, Google Calendar, Email, per `ai/context/roadmap.md` "Fase 2." |
| **AI** | Not implemented. | Future, scope undefined — see [02_TARGET_ARCHITECTURE.md §14](02_TARGET_ARCHITECTURE.md). |
| **Marketing** | Not implemented, no prior art in `ai/context/` docs. | New capability — scope **Needs Validation**. |
| **White Label** | Not implemented. | See [ADR-011](04_DECISIONS.md), [ADR-012](04_DECISIONS.md); depends on BrandProvider + TenantProvider. |
| **Enterprise** | Not implemented, no prior art in `ai/context/` docs. | New tier — scope **Needs Validation** (likely maps to the "chains/franchises" future customer tier in [03_PRODUCT.md](03_PRODUCT.md)). |

### From `ai/context/roadmap.md` (existing internal vision doc)

- **Fase 2**: automations, WhatsApp, Google Calendar, Email, OpenAI integration.
- **Fase 3**: Marketplace, public API, White Label, franchise support.

These predate this Project Brain and are folded into the M0–M4-and-beyond scheme above rather than tracked as a separate parallel roadmap — `ai/context/roadmap.md` should be considered superseded by this document going forward (see [09_DOCUMENTATION_INDEX.md](09_DOCUMENTATION_INDEX.md)).

---

## M5 — CRM (scoping pass, 2026-07-05 — **not yet approved for implementation**)

Full analysis and duplication findings: [07_TECH_DEBT.md](07_TECH_DEBT.md). Sequencing decision pending: [ADR-016](04_DECISIONS.md).

**Requested field vs. current state**:

| Field | Status |
|---|---|
| Customer Profile | Exists — `app/admin/clients/[id]/page.tsx` |
| Appointment History | Exists |
| Services History | Partially exists (derived from appointments only) |
| Products Purchased | Data exists (`pos_sales`/`pos_sale_items`), **not surfaced** on profile |
| Loyalty Program | Exists — real trigger-based points on appointments and POS |
| Memberships | Missing — no table anywhere |
| Notes | Exists — single `admin_notes` field |
| Photos | Missing |
| Documents | Missing |
| Allergies | Missing |
| Preferred Barber | Missing (only "favorite service" computed client-side) |
| Birthday | Missing |
| WhatsApp actions | Partially exists (integration-level only, no per-client action) |
| Marketing permissions | Missing |
| Customer Timeline | Missing — appointments/messages/gifts render as separate, unmerged cards |
| Customer Lifetime Value | Partially exists — `totalSpent` sums completed appointments only, **excludes POS purchases** |
| Average Ticket | Missing |
| Visit Frequency | Missing |
| Last Visit | Partially exists (derivable, not surfaced as a stat) |
| Next Appointment | Partially exists (count shown, not the date itself) |
| AI Insights | Missing, no placeholder anywhere yet |

**Proposed phased migration strategy** (draft — requires approval before any implementation):

- **Phase A — consolidate, no schema change**: extract the client-card/avatar pattern duplicated across `app/admin/clients/page.tsx`, `app/admin/clients/[id]/page.tsx`, and `app/admin/pos/page.tsx` into one shared component; surface `pos_sales` data on the profile page; compute true CLV (appointments + POS) and average ticket from existing tables; add explicit "Last Visit" / "Next Appointment" stats from data already queried.
- **Phase B — additive schema, new columns/tables**: `birthday`, `allergies`, `preferred_employee_id`, `marketing_consent` on `users` (no `tenant_id` needed here — `users` migrates as a whole table under M1); a `memberships` table and a `client_photos`/`client_documents` table, both carrying a dormant, unused `tenant_id` column from day one per [ADR-016](04_DECISIONS.md). All additive, no destructive changes to existing tables.
- **Phase C — aggregation/UX**: unified chronological timeline merging appointments, messages, gifts, POS sales; visit-frequency calculation; AI Insights placeholder (explicitly marked non-functional until [02_TARGET_ARCHITECTURE.md §14](02_TARGET_ARCHITECTURE.md) is scoped).

**Resolved** (2026-07-05, [ADR-016](04_DECISIONS.md)): Phase B tables are forward-compatible with an unused `tenant_id` column; CRM UI proceeds now on the current `orno-admin` tokens as a provisional baseline, to be re-themed if/when the Design Constitution (ADR-008) is ratified with a different palette. Phase A implementation may proceed.

**Phase A — shipped 2026-07-05** ([ADR-017](04_DECISIONS.md)): shared `ClientIdentity`/`ClientAvatar` component (`components/admin/clients/client-identity.tsx`) replacing 3 duplicated implementations; real CLV combining appointments + `pos_sales`; explicit "Última visita"/"Próxima cita" stats on the client profile. Follow-ups deferred to a later pass, tracked in [07_TECH_DEBT.md](07_TECH_DEBT.md): `admin/appointments` client representation left unconsolidated (booking-logic blast radius), a few hardcoded-style spots (dropdown menu, stat-tile labels) left untouched to keep this change scoped.

**Phase B — shipped 2026-07-06** ([ADR-018](04_DECISIONS.md)): SQL migrations authored (not yet run against any live instance) — `scripts/32-add-client-profile-fields.sql` (birthday, allergies, preferred_employee_id, marketing_consent on `users`), `scripts/33-add-memberships.sql` (`memberships` table), `scripts/34-add-client-attachments.sql` (`client_attachments` table + first-ever use of Supabase Storage in this codebase, private `client-attachments` bucket). UI: `ClientPreferencesCard`, `ClientMembershipsCard`, `ClientAttachmentsCard` wired into the client profile page. Follow-ups tracked in [07_TECH_DEBT.md](07_TECH_DEBT.md): no edit/cancel UI for memberships yet (create + list only), no delete UI for attachments, someone with real Supabase access still needs to actually run scripts 32-34 before this is usable outside demo mode.

**Phase C — shipped 2026-07-06** ([ADR-019](04_DECISIONS.md)): `ClientTimelineCard` merging appointments/messages/gifts/POS sales into one chronological feed (client-side, no new queries beyond widening the existing `pos_sales` select); a "Frecuencia de visita" stat tile; `ClientAIInsightsCard`, a deliberate static placeholder linking to [02_TARGET_ARCHITECTURE.md §14](02_TARGET_ARCHITECTURE.md) rather than fabricating output. This closes the M5 CRM scope as originally requested, with one caveat: **WhatsApp actions** remain integration-level only (`app/admin/integrations`, still a stub per [01_CURRENT_STATE.md §9](01_CURRENT_STATE.md)) — no per-client "message via WhatsApp" button exists, since that depends on Integrations shipping, not on CRM work. Follow-ups tracked in [07_TECH_DEBT.md](07_TECH_DEBT.md): timeline caps at 30 events with no pagination or type filtering.

M5 CRM (Phases A-C) is now feature-complete. Scripts 32-34 have been run against the live Supabase instance (per user confirmation, 2026-07-06) — pending items are only the open follow-ups listed in [07_TECH_DEBT.md](07_TECH_DEBT.md).

---

## Priorities (near-term, before any M0–M4 work starts)

These come directly from [01_CURRENT_STATE.md §10](01_CURRENT_STATE.md#10-current-priorities-in-order-per-readme--docsgo-live-planmd--manual-15) and are effectively M0's real content:

1. Rotate overdue secrets (critical).
2. Resolve `manager`/`barber` role debt.
3. Verify RLS against a live Supabase instance.
4. Decide the fate of `/admin/billing` and `/admin/integrations`.
5. Unify the two divergent demo data catalogs.

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) · [04_DECISIONS.md](04_DECISIONS.md) · [08_CHANGELOG.md](08_CHANGELOG.md)
