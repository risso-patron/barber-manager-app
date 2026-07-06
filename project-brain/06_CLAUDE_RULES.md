# 06 — Claude Rules (Operating Manual)

> This is the permanent operating manual for any AI agent (Claude or otherwise) working on this codebase. Read this **and** [09_DOCUMENTATION_INDEX.md](09_DOCUMENTATION_INDEX.md) before writing any code. When a rule here conflicts with a convenience shortcut, the rule wins.

---

## 0. Before coding

- **Always check Project Brain first.** Read [01_CURRENT_STATE.md](01_CURRENT_STATE.md) for what's real, [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) for what's intended, and [07_TECH_DEBT.md](07_TECH_DEBT.md) for known landmines, before touching a file you haven't worked in this session.
- **Stop if architecture conflicts.** If a request implies contradicting a decision recorded in [04_DECISIONS.md](04_DECISIONS.md) or an item marked `Planned` in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md), stop and surface the conflict instead of silently picking a side.
- **Never present `Planned` as `Implemented`.** If you're asked to document, explain, or build against BrandProvider, TenantProvider, the Design Constitution, or any other item marked `Planned` in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md), say explicitly that it doesn't exist yet — do not write code or docs that imply otherwise.
- **Verify vocabulary before using it.** This repository's history contains a documented case (this Project Brain itself) of vocabulary — "BrandProvider," "M0-M4," "Design Constitution" — being assumed to exist and not existing in code. Grep before asserting.

## 1. Component and logic reuse

- **Never duplicate components.** Check `components/admin/`, `components/employee/`, `components/client/`, `components/booking/`, `components/ui/` before writing a new one — this codebase already has a documented pattern of parallel, diverging implementations (two demo data catalogs, three demo-mode checks, two booking API paths — see [07_TECH_DEBT.md](07_TECH_DEBT.md)). Don't add a fourth.
- **Preserve business logic.** Do not refactor booking, availability, RLS-dependent, or role-gating logic as a side effect of an unrelated change. These are the highest-blast-radius areas in the codebase (`middleware.ts`, `app/api/availability/route.ts`, `app/api/appointments/route.ts`, `lib/auth.ts`).
- **Prefer composition over duplication.** When the same layout/guard logic is needed in a new role tree, this is a signal to accelerate the Application Shell work ([ADR-010](04_DECISIONS.md)), not to write a fifth copy of an auth-guard-plus-sidebar layout.

## 2. Design system discipline

- **Semantic tokens only, where they exist.** The `[data-theme="orno-admin"]` CSS-variable block in `app/globals.css` is the one real token system in this codebase today. Reference `hsl(var(--primary))`-style tokens through the Tailwind aliases in `tailwind.config.ts` — do not add a fourth hardcoded hex palette on top of the three that already exist (see [01_CURRENT_STATE.md §6](01_CURRENT_STATE.md)).
- **Follow the Design Constitution once it exists.** Until [ADR-008](04_DECISIONS.md) is ratified, treat `ai/context/design-system.md`'s palette (`#0A0A0A`/`#E53935`) as closest to canonical, since it matches the real CSS-variable block — but flag any new screen's color choices for review rather than assuming.
- **Accessibility first.** The FASE 1-3 audit (commit `f88af4a`) and admin audit already found and fixed accessibility issues once — don't reintroduce low-contrast text, missing focus states, or unlabeled interactive elements. `*:focus-visible` has a global outline rule in `app/globals.css:95-98` — don't override it away.

## 3. Roles and auth

- **Do not extend `manager` or `barber`.** They are legacy roles kept alive in `middleware.ts`, `hooks/useAuth.tsx`, and `hooks/useRequireAuth.ts` for backward compatibility only ([ADR-003](04_DECISIONS.md)). The canonical model is `client` / `employee` / `admin` (`lib/types.ts`). If a task seems to require a new role, that's a signal to raise the role-cleanup priority, not to add a 6th role.
- **Do not add a fourth demo-mode check.** Three independent implementations already exist ([07_TECH_DEBT.md](07_TECH_DEBT.md)). If you need to check demo mode, use `isDemoMode()` from `lib/demo-config.ts` and, if you find another inline check nearby, flag it for consolidation rather than adding your own variant.
- **Do not assume demo mode is a security boundary.** It isn't — access control in demo mode is 100% client-side and intentionally bypassable. Never reuse demo-mode logic as a stand-in for real authorization.

## 4. Data model

- **No tenant assumptions yet.** The schema is single-tenant today — there is no `tenant_id`/`business_id` column anywhere. Do not write queries or RLS policies that assume tenant scoping exists; that's M1 work ([ADR-011](04_DECISIONS.md)), not yet started.
- **RLS changes are high-stakes.** Any change to `scripts/*.sql` RLS policies must be additive/numbered following the existing `NN-description.sql` convention, and should be flagged for the RLS-verification priority in [01_CURRENT_STATE.md §10](01_CURRENT_STATE.md), since these policies have never been checked against a live instance.

## 5. Security

- **Never commit real secrets.** `scripts/validate-env.js` already has a documented, unresolved incident of hardcoded plaintext secrets — do not repeat this pattern anywhere, and flag it if you encounter it again elsewhere.
- **Treat fail-open behavior as a bug, not a pattern.** `middleware.ts` (missing Supabase config) and `app/api/availability/route.ts` (DB error) both currently fail open. Don't copy this pattern into new code; if refactoring either file, prefer failing closed and raise it explicitly rather than silently fixing it as a drive-by (it may be intentional for demo-mode ergonomics — verify with the user before changing).

## 6. General engineering discipline (inherited from global rules)

- Conventional commits only; no AI attribution in commit messages.
- Never build after changes unless explicitly asked.
- Verify technical claims against code before stating them — this entire Project Brain exists because an initial request described architecture that turned out not to exist; the correction process (grep, git log, read the actual files) is the standard to hold every future claim to.
- If the user is wrong about something in the codebase, say so with evidence (file:line), the same way this Project Brain's creation surfaced the BrandProvider/TenantProvider/M0-M4 mismatch.
- If you are unsure whether something exists, say "let me verify" and check before answering.

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) · [07_TECH_DEBT.md](07_TECH_DEBT.md)
