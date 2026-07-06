# 03 — Product

> **Scope**: This document explains what ORNO is as a business and product, independent of implementation status. It draws from `ai/context/business.md` and `ai/context/project.md` (the existing internal vision documents) and from the founder's own framing in this planning session. Where the vision describes capabilities not yet built, that is noted explicitly and cross-referenced to [01_CURRENT_STATE.md](01_CURRENT_STATE.md) / [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) — this document is about intent, not build status.

---

## What ORNO is

ORNO is a SaaS platform for managing barbershops and salons. It is explicitly **not** framed internally as just a booking system — `ai/context/business.md` states it directly: *"No es únicamente un sistema de reservas. Es el centro operativo del negocio"* ("It is not just a booking system. It is the business's operating center"). The product's job is to replace the fragmented toolchain a typical independent barbershop runs on today — WhatsApp for client communication, a paper or Excel agenda, a separate POS, and no real reporting — with one coherent system.

## The problem it solves

Per `ai/context/business.md`, barbershops today juggle: WhatsApp, physical agendas, Excel, POS terminals, calendars, and social media, in combination. The stated consequences are: lost clients, cancellations, disorganization, lack of metrics, and administrative errors. ORNO's premise is that centralizing all of this into one platform removes those failure modes directly, rather than adding "yet another tool" to the pile.

## Vision

Per `ai/context/project.md`: *become the leading platform for barbershops and salons in Latin America*, offering something modern, elegant, intuitive, and highly scalable. The product is expected to communicate quality, simplicity, and professionalism in every screen — this is a stated product requirement, not a nice-to-have (`ai/context/project.md`: "No desarrollar pantallas únicamente funcionales... Cada pantalla debe transmitir calidad").

## Mission

Help barbershops and salons: increase revenue, reduce cancellations, optimize scheduling, retain clients (loyalty), manage staff, control inventory, automate operational processes, and get real business metrics — all from one platform (`ai/context/project.md`).

## Target customers

| Tier | Definition | Source |
|---|---|---|
| **Primary** | Independent barbershops, 1–5 employees | `ai/context/business.md`, `ai/context/project.md` |
| **Secondary** | Mid-size barbershops, 5–20 employees | same |
| **Future** | Chains/franchises, beauty salons, spas, aesthetic centers | same |

This matches the current build's shape: today's data model is single-business ([01_CURRENT_STATE.md §1](01_CURRENT_STATE.md#1-where-is-orno-today)), which fits the primary/secondary tiers as-is. Serving the "future" tier as a single SaaS operator (rather than one deployment per chain) is exactly what the Multi-Tenant / White-Label target architecture in [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) is meant to unlock — it is not required to serve today's primary/secondary tiers, since those are naturally single-business.

## Core philosophy — the "Golden Rule"

`ai/context/project.md` frames every feature decision through five questions, to be asked **before** implementation begins:

1. Does it add real business value?
2. Is it scalable?
3. Can it be reused?
4. Does it respect the architecture?
5. Does it improve the user experience?

If any answer is "no," the implementation should be reconsidered before starting. `ai/context/business.md` states the same rule more narrowly for feature proposals: every new feature must answer *"¿Qué problema del negocio resuelve?"* ("What business problem does this solve?"). This is the philosophy encoded operationally in [06_CLAUDE_RULES.md](06_CLAUDE_RULES.md).

## Product positioning & competitive advantage

**Named competitors** (`ai/context/business.md`): Booksy, Fresha, Boulevard, Vagaro, Square Appointments.

**Stated differentiators**: premium experience, automation, artificial intelligence, modern architecture, superior UX, scalability.

Read against the current build, two of these differentiators are real *today* and three are *aspirational*:

- **Modern architecture** — real: Next.js 15 / React 19 / Supabase is a genuinely current stack ([01_CURRENT_STATE.md §2](01_CURRENT_STATE.md#2-stack)).
- **Superior UX** — partially real: a deliberate visual identity exists (the `orno-admin` token scaffold, the 2026-05 rebrand), though inconsistently applied — see [02_TARGET_ARCHITECTURE.md §§1-3](02_TARGET_ARCHITECTURE.md).
- **Premium experience** — in progress, tied to the Design Constitution target.
- **Automation** — largely aspirational today. Real automation that exists: async notification queue (email/WhatsApp via `notification_queue` + Edge Function). Automations like Google Calendar sync or WhatsApp-driven booking flows are listed under `ai/context/roadmap.md`'s "Fase 2," not built.
- **Artificial intelligence** — aspirational only; zero AI code exists in the repository today ([02_TARGET_ARCHITECTURE.md §14](02_TARGET_ARCHITECTURE.md)).

## Why ORNO exists

Restated plainly: the barbershop/salon SMB segment is underserved by tools that are either too generic (calendar apps), too narrow (booking-only apps like Booksy/Fresha), or too disconnected from day-to-day operations (Excel, WhatsApp, paper). ORNO's bet is to be the single operational system of record for a barbershop — booking, staff, inventory, POS, loyalty, and reporting together — with a product quality bar (visual polish, speed, professionalism) that the primary/secondary target segment doesn't typically get from vertical SaaS at this price point.

## Business model

SaaS, subscription-based (monthly/annual). Each business manages its own data — today, that isolation is physical (one deployment per business, [01_CURRENT_STATE.md §1](01_CURRENT_STATE.md#1-where-is-orno-today)); the vision is for it to become logical (multi-tenant, one deployment, RLS-enforced isolation, per [02_TARGET_ARCHITECTURE.md §8](02_TARGET_ARCHITECTURE.md)). Longer-term revenue lines mentioned in `ai/context/business.md`: marketplace, public API, white-label, franchise support — all `Planned`/`Future`, none implemented (see [05_ROADMAP.md](05_ROADMAP.md)).

---

**Related**: [01_CURRENT_STATE.md](01_CURRENT_STATE.md) · [02_TARGET_ARCHITECTURE.md](02_TARGET_ARCHITECTURE.md) · [05_ROADMAP.md](05_ROADMAP.md)
