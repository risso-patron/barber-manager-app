# 02 — Target Architecture

> **Scope**: This document describes the architecture ORNO is **intentionally moving toward**. Nothing here should be read as already implemented. Every item carries a **Status** tag (`Planned`, `Designed`, `In Progress`, `Implemented`) and a pointer to the concrete gap in today's code (see [01_CURRENT_STATE.md](01_CURRENT_STATE.md)) that it needs to close. This document was introduced on 2026-07-05, at the same time this Project Brain was created — it is a forward statement of intent, not a record of decisions already executed. Where the target requires a specific numeric scope (e.g. exactly which changes belong to "M2"), that scope is marked **Needs Validation** until ratified by the team.

---

## Why this document exists separately from Current State

A verification pass across the entire codebase and git history (all local and remote branches) confirmed that terms like *BrandProvider*, *TenantProvider*, *AsyncPane*, *Application Shell*, *Scheduling Engine*, and *Design Constitution* do not exist anywhere in the repository today. Rather than retrofit history to make them sound implemented, this document names them explicitly as **targets**, cross-referenced against the real gap in current code that each one is meant to fill.

---

## 1. Design Constitution — `Status: Planned`

**Gap it closes**: today, visual identity is defined in three uncoordinated places — the `[data-theme="orno-admin"]` CSS-variable block in `app/globals.css` (dark, `#E53935` red primary), the plain-language palette in `ai/context/design-system.md` (`#0A0A0A` background, `#E53935` primary — largely consistent with the CSS block), and the 2026-05 rebrand commits that hardcode a third palette (`#161412` / `#cc2222` / `#f0ebe3`) directly in JSX on the landing page and client/employee dashboards. There is no single ratified document that says which one is canonical, nor rules for typography, spacing, radii, motion, or component states beyond the one-page skeleton in `ai/context/design-system.md`.

**Decision**: ORNO adopts a single **Design Constitution** — one authoritative document defining color, type, spacing, radius, elevation, motion, and component-state rules for the entire product, superseding `ai/context/design-system.md` and reconciling the three palettes above into one. No screen ships without conforming to it.

**Needs Validation**: which of the three existing palettes (CSS-variable `orno-admin`, `ai/context/design-system.md`, or the 2026-05 rebrand hex triplet) becomes canonical, or whether a fourth, deliberately chosen palette replaces all three.

---

## 2. Warm Design System — `Status: Planned`

**Gap it closes**: the current visual language is described internally as "Dark Premium" (`ai/context/project.md`), cool/dark by default. The 2026-05 rebrand's `#f0ebe3` (cream) and `#161412` (near-black warm brown) hex values are the only evidence in code of a warmer palette direction, and they were applied inconsistently (3 files) rather than systematically.

**Decision**: the product's visual direction shifts from generic "dark SaaS" toward a warmer, editorial tone consistent with a premium barbershop/salon brand — building on the undocumented direction already visible in the 2026-05 rebrand commits rather than inventing a new one from scratch.

**Needs Validation**: full warm palette (beyond the two hex values already in code), and whether "Dark Premium" (per `ai/context/project.md`) and "Warm" are the same direction or a deliberate pivot away from it.

---

## 3. Semantic Design Tokens — `Status: In Progress`

**Gap it closes**: unlike the other items in this document, a semantic token *scaffold* already exists — `app/globals.css` defines `--background`, `--card`, `--primary`, `--secondary`, `--muted`, `--border`, `--sidebar-*` as HSL custom properties, consumed via Tailwind color aliases (`tailwind.config.ts`), and scoped consistently across admin, employee, and client layouts via `data-theme="orno-admin"`. What's missing: (a) the scope is misnamed for non-admin trees, (b) three layout files re-hardcode the same literal hex values a second time instead of only referencing the tokens, (c) no tokens exist yet for spacing, typography, or radius — only color, (d) the 2026-05 rebrand hex values bypass the token system entirely.

**Decision**: extend the existing CSS-variable token layer to spacing/type/radius, rename the scope away from `orno-admin` to something tenant/brand-neutral, and eliminate every duplicate hardcoded hex value in favor of the tokens that already exist.

---

## 4. Application Shell — `Status: Planned`

**Gap it closes**: today there is no shared layout shell. `app/admin/layout.tsx`, `app/employee/layout.tsx`, `app/client/layout.tsx`, and `app/dashboard/layout.tsx` each independently implement their own auth guard and their own sidebar component. `app/providers.tsx` composes only `AuthProvider` at the root — no shared chrome, no theme provider (the existing `components/theme-provider.tsx` is unused dead code).

**Decision**: introduce a single Application Shell component that owns cross-cutting chrome (sidebar/nav composition, auth-guard wiring, theming) and is configured per role instead of reimplemented per role.

---

## 5. BrandProvider — `Status: Planned`

**Gap it closes**: no brand/theming injection point exists anywhere in the provider tree today (`app/providers.tsx` wraps only `AuthProvider`).

**Decision**: a `BrandProvider` will inject per-deployment brand theming (logo, palette, name) into the token layer described in §3, so a given ORNO instance can present a barbershop's own brand rather than the fixed ORNO identity — this is the mechanism the White-Label strategy (§7) depends on.

**Needs Validation**: exact API surface; where brand config is sourced from (a table? a config file per deployment?) is undefined until the White-Label and Multi-Tenant items below are scoped.

---

## 6. TenantProvider — `Status: Planned`

**Gap it closes**: the database schema has **zero** tenant/business-scoping columns today — a repo-wide search of all 31 SQL migrations for `tenant_id`/`business_id` returns nothing, and `business_settings` is a flat singleton table. There is no tenant context anywhere in the React tree.

**Decision**: introduce a `TenantProvider` and the corresponding schema changes (tenant-scoped foreign keys on every business table, tenant-aware RLS policies) required to let one ORNO deployment serve multiple independent businesses. This is the largest single gap between current state and the multi-tenant vision described in [03_PRODUCT.md](03_PRODUCT.md) — it is a schema migration across every table in §8 of [01_CURRENT_STATE.md](01_CURRENT_STATE.md), not a UI-layer change.

---

## 7. White-Label Architecture — `Status: Planned`

**Gap it closes**: none — no white-label mechanism exists in code (no per-tenant branding, no custom domains, no configurable identity). Depends on BrandProvider (§5) and TenantProvider (§6).

**Decision**: once tenant isolation and brand injection exist, expose them together as a white-label offering — each barbershop/salon can run ORNO under its own brand and (eventually) domain.

---

## 8. Multi-Tenant SaaS Architecture — `Status: Planned`

**Gap it closes**: as established in [01_CURRENT_STATE.md §1](01_CURRENT_STATE.md#1-where-is-orno-today), ORNO today is single-tenant — one deployment, one business. This is the umbrella initiative that TenantProvider (§6) and the schema migration it requires belong to.

**Decision**: evolve ORNO from "one deployment per business" to "one deployment serving many businesses," with data isolation enforced at the RLS layer using a tenant key on every table.

**Needs Validation**: whether tenant isolation is enforced purely via RLS (`tenant_id = current_tenant()`-style policies) or via a hybrid of RLS + separate schemas/databases per large tenant — not yet decided.

---

## 9. Scheduling Engine — `Status: Planned`

**Gap it closes**: today's availability logic ([01_CURRENT_STATE.md §7](01_CURRENT_STATE.md#7-booking--availability-logic-current--not-a-scheduling-engine)) is a single route handler (`app/api/availability/route.ts`) with hardcoded business hours disconnected from the business-settings UI, a duplicate, unrelated booking path for public links (`app/api/bookings/public/route.ts`), and no server-side re-validation of availability at appointment-creation time.

**Decision**: consolidate slot generation, conflict detection, and appointment creation behind one shared scheduling abstraction — config-driven business hours (reading real per-business settings instead of hardcoded constants), a single code path for both authenticated and public booking, and a server-side availability re-check on write.

---

## 10. AsyncPane — `Status: Planned` — **Needs Validation**

No evidence of this concept exists anywhere in the codebase or in any design document reviewed (`ai/context/design-system.md` lists Modal and Drawer as component types, not "AsyncPane"). Before this can move to `Designed`, its intended behavior needs to be specified: is it a loading-state wrapper for panels/drawers, a Suspense-boundary pattern, or a specific UI primitive? Flagging as a name introduced in this planning round with no prior art in this repo — define it before building it.

---

## 11. UI Primitives — `Status: In Progress`

**Gap it closes**: unlike most items above, this one has real current progress — shadcn/ui + Radix UI already provide 12 primitives in `components/ui/` (alert, avatar, badge, button, card, dialog, input, label, select, separator, textarea, toast), consistently used as the base layer across admin/employee/client component folders.

**Decision**: continue growing this primitive set (calendar, table, chart primitives are referenced as needed in `ai/context/design-system.md` but not all exist yet in `components/ui/`) rather than introducing a second, competing primitive system.

---

## 12. Migration M0–M4 — `Status: Planned` — **Needs Validation on exact scope**

**Important distinction**: git history contains no "M0–M4" sequence. The only numeric-migration-shaped label in history is a single commit, `14bb85a "feat: implement M1-M8 feature pack"`, whose own M1–M8 labels refer to eight unrelated features shipped in one commit (rescheduling, commissions, attendance, password recovery, ratings, loyalty, POS, low-rating alerts) — not a phased migration plan, and not the same M-numbering being introduced here. The real historical phase taxonomy is `FASE 1` through `FASE 5` (see [08_CHANGELOG.md](08_CHANGELOG.md)).

`M0–M4`, as used in this document, is a **new forward-looking milestone naming scheme** for the target-architecture work above, introduced starting with this Project Brain. A strawman grouping, proposed here for validation rather than treated as decided:

| Milestone | Proposed scope | Status |
|---|---|---|
| M0 | Stabilize current state: rotate secrets, verify RLS live, resolve `manager`/`barber` role debt (see [07_TECH_DEBT.md](07_TECH_DEBT.md)) | Planned — **Needs Validation** |
| M1 | Tenant schema: `tenant_id` migration across all tables, tenant-aware RLS | Planned — **Needs Validation** |
| M2 | Design Constitution + Semantic Tokens completion + BrandProvider | Planned — **Needs Validation** |
| M3 | Application Shell unification (single shell replacing 4 independent layouts) | Planned — **Needs Validation** |
| M4 | Scheduling Engine consolidation + White-Label launch | Planned — **Needs Validation** |

This grouping is a proposal only. It must be explicitly ratified (or replaced) before being treated as authoritative — see the corresponding ADR in [04_DECISIONS.md](04_DECISIONS.md).

---

## 13. Future Billing Engine — `Status: Planned`

**Gap it closes**: `app/admin/billing` is a confirmed UI-only stub today — zero Supabase or fetch calls in the page ([01_CURRENT_STATE.md §9](01_CURRENT_STATE.md#9-module-status-verified-by-code-not-just-by-claim)). No payment provider (Stripe, Mercado Pago, or otherwise) is integrated anywhere in the codebase.

**Decision**: replace the stub with a real billing engine — subscription plans (per `ai/context/business.md`'s SaaS-by-subscription model), invoicing, and a real payment provider integration.

**Needs Validation**: payment provider choice; whether billing is tenant-level (charging each barbershop for their ORNO subscription) or also needs to support the barbershop charging its own end clients (point-of-sale payments) — these are two different billing surfaces and the current `ai/context/business.md` does not distinguish them.

---

## 14. AI Architecture — `Status: Planned` (Future)

**Gap it closes**: `ai/context/roadmap.md` lists "IA" under status "Futuro" with no further detail. No AI-related code, prompt, or integration exists in the repository today.

**Decision**: deferred beyond M0–M4. Scope not yet defined.

**Needs Validation**: everything — use cases, model provider, whether it's a client-facing feature (e.g. AI scheduling assistant) or an internal admin tool (e.g. AI-generated reports).

---

## Summary status table

| Item | Status |
|---|---|
| UI Primitives (shadcn/Radix) | In Progress |
| Semantic Design Tokens (color) | In Progress |
| Design Constitution | Planned |
| Warm Design System | Planned |
| Application Shell | Planned |
| BrandProvider | Planned |
| TenantProvider | Planned |
| White-Label Architecture | Planned |
| Multi-Tenant SaaS Architecture | Planned |
| Scheduling Engine | Planned |
| AsyncPane | Planned — needs spec |
| Migration M0–M4 | Planned — needs ratification |
| Billing Engine | Planned |
| AI Architecture | Planned (Future) |

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [04_DECISIONS.md](04_DECISIONS.md) · [05_ROADMAP.md](05_ROADMAP.md)
