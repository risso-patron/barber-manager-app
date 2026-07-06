# 08 — Changelog

> Chronological project history reconstructed from `git log` on branch `work/cambios-personales` (154 commits, first commit 2025-09-07, latest 2026-07-03). This is the factual record referenced by [05_ROADMAP.md](05_ROADMAP.md)'s "Completed" section and by [ADR-014](04_DECISIONS.md) (which explains why "M0–M4" is *not* a historical label).

---

| Date | Commit | Phase / Milestone | Summary |
|---|---|---|---|
| 2025-09-07/09 | `01edef5`, `dd91147` | Bootstrap | Initial repository; first functional `localStorage`-based version. |
| 2025-11-24 | `6ec0ab1` | **FASE 1** | "Estructura base y dashboards implementados" — base structure, admin/employee/client dashboards. |
| 2025-11-24→28 | `2384d6b`, `d6830cf`, `a588642`, `8f40418` | FASE 1 (cont.) | Full CRUD: appointments/employees/services/clients, inventory, reports/settings, missing sidebar routes — still `localStorage`-only. |
| 2025-11-25 | `8d6b555` | Auth migration | "Migrar autenticación de localStorage a Supabase y eliminar código demo" — strict TypeScript, security middleware, Zod validation, centralized error handling. Demo mode was removed here, then reintroduced days later (`c496a24`). |
| 2025-11-25 | `7f26d35` | Auth debug | RLS policy fixes, `useAuth.tsx` rename, "WIP: Debugging login issues." |
| 2025-11-28 | `0d6e354` | **FASE 1 – Paridad Crítica** | Public booking link (no login), Email/WhatsApp notification APIs, QR share page, Resend/Twilio scaffolding. |
| 2025-11-30 | `c496a24` | Security hardening | Rate limiting, input validation/XSS/SQLi detection, security headers (CSP/HSTS/X-Frame-Options), security logging, environment validation, 7 security docs; fixed `/login`→`/auth/login` routing; **re-introduced demo mode** with `localStorage` auth as a fallback ([ADR-002](04_DECISIONS.md)). |
| 2025-11-30 | `a02acc0` | Hybrid booking system | "Sistema de reservas híbrido" — login-based + no-registration booking + optional signup modal. |
| 2025-11-30 → 2026-04-24 | `84451d5`, `2fdf431` | Testing infrastructure | Vitest + Testing Library + Playwright setup; unit/integration/e2e tests, openspec specs, timezone bugfix. |
| Dec 2025 – Feb 2026 | `efd9619` … `5510d33` | Supabase wiring | Middleware enabled; dashboard/auth/routing connected to real Supabase; appointments, employees, services, inventory, clients progressively migrated off `localStorage`; multiple `fix:` commits for RLS bypass via service-role API routes. |
| 2026-05 | `1cea13b` | Visual rebrand | "Orno design system" — admin editorial redesign, logo, favicons, dark theme ([ADR-007](04_DECISIONS.md)). |
| 2026-05 | `7a09427` | Rebrand extension | Applied the same visual system to client/employee dashboards. |
| 2026-05-27 | `d6fb558` | Auth unification | "unificar sistema de auth" — corresponds to the `openspec/changes/archive/2026-05-27-unificar-auth` change ([ADR-006](04_DECISIONS.md), verified complete). |
| 2026-05-31 | `5579961` | Role experimentation | "sistema de roles de empleado (barbero/cajero/recepcionista/gerente)" — precursor to today's `manager`/`barber` role tech debt ([07_TECH_DEBT.md](07_TECH_DEBT.md)). |
| 2026-06-01 | `14bb85a` | **"M1-M8 feature pack"** | One commit shipping 8 unrelated features: M1 rescheduling, M2 commissions, M3 attendance/work-status, M4 password recovery, M5 ratings, M6 loyalty points, M7 POS, M8 low-rating alerts. **Not** a phased migration plan — see [ADR-014](04_DECISIONS.md) for why this must not be confused with the M0–M4 target scheme in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md). |
| 2026-06 | `2063afc` … `0530949` | v1.2 Items 9–19 | Explicitly numbered items: POS checkout/loyalty/tips (9-15), cache revalidation + pagination (16-17), notification queue (18), Resend/Twilio notification Edge Function (19). |
| 2026-06-29 | `f88af4a` | **FASE 1-3 audit** | "audit FASE 1-3 — booking wizard, auth security, UX y accesibilidad" (client-side). |
| 2026-06-29 | `69a8806`, `ab28d03`, `aa7dfbb`, `cadc018` | Admin audit | Admin panel audit, C5/D2 fixes, accessibility, demo-data consistency. |
| 2026-06-30 | (documentation revision, no code commit) | Security documentation correction | `SECURITY-REPORT.md`, `docs/GO-LIVE-PLAN.md`, `docs/EXECUTIVE-SUMMARY.md` revised against real code; corrected a prior self-contradiction (rate limiting/CSP/logging listed as both present and absent) and removed leaked plaintext secret fragments from the current revision (older versions remain in git history — see [07_TECH_DEBT.md](07_TECH_DEBT.md)). |
| 2026-07-01 | `46225e8` | QA | "smoke test de roles con playwright" → produced `qa-analysis.md`. |
| 2026-07-02 | `d4809b7` | Auth hardening | "harden demo login and middleware flow." |
| 2026-07-02 | `033fe16` | UI fix | Admin modal form contrast fix in dark theme. |
| 2026-07-03 | `fc80f3e` | **FASE 5 D2+D3** | "badges consistentes y banner demo en bloqueos" — employee schedule-block UI consistency. |
| 2026-07-03 | `5b3085a` | **FASE 5 D1** | "disponibilidad dinámica conectada con bloqueos" — booking availability wired to schedule blocks. Latest commit as of this writing. |
| 2026-07-05 | *(this session)* | **Project Brain created** | This documentation set (`project-brain/`) established as the permanent knowledge base; explicit separation of Current State vs. Target Architecture adopted after verifying that several architecture terms in the original request (BrandProvider, TenantProvider, AsyncPane, Application Shell, Scheduling Engine, Design Constitution, M0–M4) did not exist in the codebase or git history — see [ADR-014](04_DECISIONS.md). |
| 2026-07-05 | *(this session)* | **CRM Phase A** | Client-identity duplication (list/profile/POS) consolidated into `components/admin/clients/client-identity.tsx`; client profile CLV now includes `pos_sales`; added "Última visita"/"Próxima cita" stats. See [ADR-016](04_DECISIONS.md), [ADR-017](04_DECISIONS.md). |
| 2026-07-06 | *(this session)* | **Validation workflow adopted + pre-existing type bug fixed** | User established a standing rule: run `pnpm type-check`/`pnpm lint`/`pnpm build` after every implementation, stop and report on any error before touching unrelated code, never auto-commit. First run surfaced a pre-existing, unrelated type error in `hooks/useRequireAuth.ts:65` (from commit `eb1374a`, 2026-07-01) that had been silently breaking `type-check`/`build` for 5 days with no CI to catch it. Fixed with non-null assertions after explicit approval — see [07_TECH_DEBT.md](07_TECH_DEBT.md). |

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [04_DECISIONS.md](04_DECISIONS.md) · [05_ROADMAP.md](05_ROADMAP.md)
