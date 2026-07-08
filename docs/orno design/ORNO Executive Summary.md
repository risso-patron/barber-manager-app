# ORNO — Executive Summary
*Design Program v1.0 · Frozen July 8, 2026*

## What ORNO has become

A white-label **barbershop operating system**, designed end to end: three complete user ecosystems (Owner, Employee, Customer), a SaaS platform around them (plans, add-ons, brand studio, domains), a production-grade component framework (M0–M4, including a headless scheduling engine), and a complete onboarding that takes a new shop from zero to its first booking in ~5 minutes. Every screen, state and word is specified; Claude Code can implement without interpreting.

## The design philosophy

Warm, calm, premium, human. Light warm surfaces, sage as the operational color, red reserved for the brand mark. The software disappears behind the work: operational information before analytics, sentences before charts, one click to act, empty space treated as bookable inventory. Never redesign to be prettier — every decision must improve usability, clarity, trust or productivity.

## Major product differentiators

1. **The Agenda as a workbench** — barber columns, drag-anything with human conflict resolution, smart gaps that sell themselves, walk-in queue. A whole business day managed from one screen.
2. **A scheduling *engine*, not a calendar** — the same headless core powers admin, employee, customer, WhatsApp booking and the AI assistant.
3. **Role-honest surfaces** — the barber's app has zero admin; the customer never feels software; the owner sees decisions, not dashboards.
4. **White-label to the bone** — one BrandConfig repaints app, booking, emails, WhatsApp and PDFs; ORNO is merely the default brand.
5. **AI as a whisper** — one dismissible, actionable sentence per screen, sourced from real signals.

## Principles that must never change

- Red = brand mark only. Sage = operation. No hardcoded hex anywhere.
- Human Spanish; "Tu día", never "Dashboard".
- Interaction never waits for animation; failures are module-scoped; everything optimistic with Deshacer.
- WCAG AA, ≥44px targets, state never color-only, keyboard parity with drag.
- Employees are compared only to themselves. Customers are never guilt-tripped.
- Extend, never fork; no duplicate components; no redesign of frozen work.

## Implementation priorities for Claude Code

1. Merge the M0–M4 framework (tokens with B1/B2 corrections, primitives, shell, feedback/data kit, scheduling engine).
2. Login + Onboarding Wizard + Notifications inbox (Phase 9 spec — the door and day one).
3. Agenda page on the M4 kit (the flagship), then Tu día.
4. Caja → CRM → Inventario → Análisis.
5. Employee PWA (Phase 7 spec) and Customer booking (Phase 8 spec).
6. Portal SaaS + Estudio de marca.
Rules throughout: never touch Supabase queries/permissions/DB; app working after every step; Readiness items B1–B6 are requirements, not suggestions.

---

**The ORNO Design Program is hereby frozen as ORNO Design v1.0.** Future work proceeds through v1.1, v1.2, v2.0 — never by redesigning completed work. Reference of record: `ORNO Design Bible v1.0.md`.
