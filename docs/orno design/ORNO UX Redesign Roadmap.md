# ORNÓ — UX/UI Redesign Roadmap
*Lead Product Designer brief · v1.1 · July 2026*

---

## 0. Design Personality (direction change — approved)

ORNÓ moves away from the dark developer-dashboard aesthetic. New personality: **warm, calm, premium, approachable** — Apple, Airbnb, Notion; not enterprise software.

What this means concretely:

- **Light, warm-neutral surfaces** as the default: warm off-whites and soft warm grays, not pure white, never cold slate. Depth via subtle warm tint shifts, not dark panels.
- **Ornó red evolves** from alarm-red accent-on-black to a refined signature color used sparingly on a calm canvas — more Airbnb Rausch than error red. Exact value set by the Design Constitution.
- **Serif brand voice stays** (Cormorant/Playfair for titles and brand moments) — it's the premium ingredient; body UI stays humanist sans.
- **Soft elevation returns:** on light surfaces, gentle shadows and hairline borders replace border-only dark elevation.
- **Rounded, generous, unhurried:** larger touch targets, more whitespace, fewer lines. Data density where it earns it (agenda, tables), air everywhere else.
- **Tone of voice:** human Spanish, warm and direct — "Tu día" not "Dashboard".

All token/component work in Phase 1–2 is built on this personality. Pending: **ORNÓ Design Constitution** (owner-provided) will lock final values before Phase 1 deliverables are considered final.

---

## 1. Product Vision

**ORNÓ is the operating system of the barbershop.** Not a booking tool with extras — the single surface where the owner runs the day, the barber runs their chair, and the client runs their loyalty.

The benchmark isn't other barbershop software (Booksy, Fresha, Squire). It's Linear's speed, Stripe's clarity, Apple's restraint. The product should feel *inevitable*: every screen answers "what should I do right now?" before the user asks.

Positioning in one line: **"Tu barbería, en piloto automático."**

## 2. UX Vision

Five principles, in priority order:

1. **Today first.** Every role lands on *now*: today's agenda, today's revenue, today's chair. Historical data is one click away, never the default.
2. **One-hand operable.** The admin is standing, phone in hand, clippers in the other. Every core action (confirm, cobrar, reagendar) must work on mobile with the thumb.
3. **Zero dead ends.** Every empty state, error, and loading moment moves the user forward with a single suggested action.
4. **Calm density.** Dark Premium means quiet surfaces and loud data — big numbers (DM Mono), small chrome. No decoration that doesn't inform.
5. **Speed as a feature.** Optimistic UI everywhere. Booking a walk-in should take <5 seconds. Command palette (⌘K) for admins.

## 3. Information Architecture

Current: 10 flat sidebar items + orphaned Settings/Share + legacy `/dashboard` and `/barber` routes.

Proposed — group by *job*, not by *database table*:

**Admin**
- **Hoy** (dashboard — the command center)
- **Agenda** (calendar: citas + bloqueos + walk-ins) ← absorbs "Citas"
- **Caja** (POS + facturación del día) ← merges POS + billing daily ops
- **Clientes** (CRM: list, detail, loyalty, reseñas)
- **Negocio** (group: Servicios, Empleados, Inventario)
- **Análisis** (Reportes)
- **Configuración** (Settings, Integraciones, Suscripción, Compartir link)

**Empleado**: Hoy · Agenda · Clientes (assigned) · Mi rendimiento · Fichaje · Perfil
**Cliente**: Inicio · Reservar · Mis citas · Perfil (history + loyalty folded in)

Kill `/dashboard` and `/barber` routes. One layout per role, period.

## 4. Navigation Improvements

- **Sidebar (desktop admin):** grouped sections with labels; collapsible to icon rail; active state = red text + subtle left indicator (keep current pattern, it's good).
- **Global "+ Nuevo" button** in the top bar: nueva cita, walk-in, venta, cliente — the 4 creation verbs, everywhere.
- **⌘K command palette:** jump to client, create appointment, navigate. This is the Linear move that makes power users evangelists.
- **Mobile admin/employee:** bottom tab bar (Hoy, Agenda, +, Caja, Más) — not a hamburger drawer for primary nav.
- **Breadcrumb-free:** depth never exceeds 2 levels; back = one tap.

## 5. Screen Priorities

Ranked by (business impact × current weakness):

| P | Screen | Why |
|---|--------|-----|
| P0 | **Agenda / Calendar** | Core of a scheduling product; today it's a list. Day/week views, drag-reschedule, barber columns. |
| P0 | **Admin Dashboard "Hoy"** | First screen every morning; today it's stat cards, should be a live control room. |
| P0 | **Public booking flow** | Revenue front door; polish + guest→account conversion. |
| P1 | **Onboarding wizard** | Self-serve activation: negocio → horarios → servicios → equipo → link. |
| P1 | **POS / Caja** | Checkout of an appointment in ≤3 taps; tie to inventory. |
| P1 | **Client detail (CRM)** | The relationship record: history, LTV, notes, no-show risk. |
| P2 | Empleado "Hoy" | Chair-side view: next client, timeline, quick complete. |
| P2 | Inventario v2 | Movements, alerts (blocked on backend phases — design ahead). |
| P2 | Cliente app home | Loyalty, rebooking nudge ("¿mismo corte que siempre?"). |
| P3 | Reportes, Configuración, Integraciones | Solid but not differentiating. |

## 6. User Journey Improvements

- **Booking (client):** collapse Stepper anxiety — show running summary persistently; pre-select last barber+service for returning clients ("Repetir mi último corte" = 1 tap); WhatsApp confirmation deep-link.
- **Morning open (admin):** land on Hoy → see gaps, unconfirmed citas, low-stock alerts → one-tap "recordar por WhatsApp" for unconfirmed.
- **Walk-in (admin/employee):** dedicated fast path: pick barber → pick service → cobrar. No client form required.
- **Checkout:** cita completada → POS pre-filled with the service → add products → cobrar → loyalty points auto-applied.
- **No-show recovery:** automatic flag on client record; gentle re-engagement flow.
- **New business (owner):** signup → wizard → shareable booking link + QR in <10 minutes.

## 7. Design System Improvements

Rebuilt on the new warm/light personality (§0):

- **Tokens, enforced:** one canonical token set replaces the current drift (code mixes #161616/#252525/#8A8A8A with documented #111111/#A1A1AA). New set: warm-neutral surface scale (paper → card → raised), warm ink scale for text, one signature red, semantic greens/ambers — final values from the Design Constitution.
- **Type scale:** Cormorant/Playfair reserved for page titles + brand moments only; humanist sans 13/14/16 for UI; mono for every number, price, time.
- **Red discipline:** signature red = primary action + active state + brand. Never for errors (separate semantic red), never decorative. Red should feel scarce.
- **Elevation:** soft warm shadows + hairline borders on light surfaces; 2–3 tiers max (resting, raised, overlay).
- **Radius:** 16 cards / 12 controls / 999 pills, applied consistently.

## 8. Component Library

Current `components/ui` has 12 primitives. Needed additions, in build order:

1. **Calendar grid** (day/week, barber columns, drag) — flagship
2. **Time-slot picker** (unified: booking flow + admin reschedule)
3. **Data table** (sort, filter, sticky header, row actions) — clients, inventory, reports
4. **Command palette**
5. **Stat card v2** (value + trend + sparkline + tap-through)
6. **Bottom sheet** (mobile modal pattern)
7. **Toast/inline alert system** (one pattern, not three)
8. **Empty-state, skeleton, and error primitives** (see 11–13)
9. **Client chip/avatar-row** (appears in agenda, POS, CRM)
10. **Currency/number input** (POS)

Modals today are per-module copies (4 delete-confirm-modal.tsx files) — consolidate to one confirm primitive.

## 9. Accessibility Improvements

- **Contrast audit:** current #8A8A8A secondary text fails AA (≈3.6:1). On the new light surfaces, all text tokens are defined to pass AA at their smallest use (4.5:1 body, 3:1 large).
- Focus states: visible ring (red 2px offset) on every interactive element — currently inconsistent.
- Full keyboard path for booking flow and agenda.
- Touch targets ≥44px (current sidebar rows and time slots need checking).
- `aria-live` for optimistic updates and toasts; existing drawer focus-trap pattern is good — extend it to all modals.
- Don't encode status by color alone: pair estado badges with icon/text.

## 10. Mobile Experience

The truth: **admins and barbers will use this on phones 80% of the time.**

- Admin/employee mobile = bottom tabs + FAB, not shrunk desktop.
- Agenda on mobile: vertical day timeline (one barber) with horizontal barber switcher.
- POS designed mobile-first: big keypad, big total.
- Client experience: PWA-quality — installable, fast, booking in ≤4 taps.
- Employee fichaje: one giant button, geolocation-friendly, works offline-optimistic.

## 11. Empty States

Every empty state = illustration-free, one line of copy + one action:

- Agenda vacía → "Sin citas hoy" + [Compartir tu link de reservas]
- Clientes vacío → [Importar contactos] / [Crear primera cita]
- Inventario vacío → [Añadir primer producto]
- Reportes sin datos → mini-preview of what it will look like + "Los datos aparecen con tu primera venta"
- First-run states are onboarding, not voids: the dashboard on day 1 shows the setup checklist (horarios ✓, servicios ✓, link compartido ✗).

## 12. Loading States

- **Skeletons, not spinners,** for every list/card surface — shaped like the real content.
- Optimistic writes: creating a cita appears instantly, reconciles in background, rolls back with a toast on failure.
- Route-level: keep layout static, skeleton only the content pane.
- Never block the whole screen; never show a spinner for <300ms operations (delay skeleton appearance).

## 13. Error States

- Three tiers: **inline field error** (form), **toast** (recoverable action), **pane-level error card** (failed load: message + [Reintentar]).
- Human copy in Spanish, no codes: "No pudimos guardar la cita. Revisa tu conexión." + retry.
- Conflict errors are special-cased: double-booking shows *which* slot conflicts and offers nearest alternatives.
- Global error boundary keeps the sidebar alive — never a full-page crash.

## 14. Dashboard Strategy

Rebuild "Hoy" as a **control room**, not a stats page:

- **Top strip:** hoy — ingresos, citas, ocupación % (vs. mismo día semana pasada).
- **Center: live timeline** of today's appointments across barbers — the pulse.
- **Right rail: "Necesita tu atención"** — unconfirmed citas, low ratings, low stock, empleados sin fichar. Each item is actionable in place.
- Monthly/deep metrics live in Análisis, not here.
- Empty morning slots surfaced as opportunity: "3 huecos hoy — comparte tu link."

## 15. Calendar Strategy

The flagship. Requirements:

- Views: **Día (columns per barber)** — the default; Semana (one barber); Lista (mobile fallback).
- Drag to reschedule, drag edge to extend, click-empty-slot to create.
- Bloqueos (schedule-blocks API exists) drawn as hatched regions.
- Color = estado (pendiente/confirmada/completada), never barber; barber = column.
- Walk-in button always visible.
- Realtime: two admins see the same board (Supabase realtime).
- Density target: 12h day visible without scroll on desktop; 15-min granularity.

## 16. CRM Strategy

Turn the client list into a **relationship engine**:

- **Client detail = the record:** citas, gasto total, servicio habitual, barbero habitual, notas privadas ("le gusta la 2 a los lados"), rating history, no-show count.
- **Segments, not filters:** "Frecuentes", "En riesgo (>45 días)", "Nuevos este mes", "No-show reincidente".
- Loyalty visible on the record and at POS ("le faltan 2 cortes para el gratis").
- Re-engagement action per segment: WhatsApp template one-tap (Fase 2 integration, design now).
- Notes are gold for barbershops — make them prominent, not buried.

## 17. POS Strategy

- **Two entry points:** cobrar una cita (pre-filled) and venta rápida (walk-in/producto).
- Flow: items → descuento/propina → método de pago → recibo (WhatsApp/print).
- Product sale decrements inventory (the transactional base the CTO review demands — design assumes it).
- Corte de caja diario: apertura, cierre, arqueo — one screen.
- Mobile-first layout; barber-facing simplified mode (solo sus servicios).

## 18. Employee Experience

The barber's app is a **companion, not an admin-lite**:

- **Hoy:** vertical timeline of my chair; next client card (name, service, notes, "es nuevo") pinned on top.
- One-tap actions: completar, no vino, cobrar (if permitted).
- **Mi rendimiento:** cortes, ingresos generados, rating promedio, propinas — gamified lightly (weekly personal best), never leaderboard-shaming.
- Fichaje reduced to one button + history.
- Disponibilidad self-service: bloquear horas, pedir días — feeds admin approval.

## 19. Customer Experience

- **Booking link is the storefront:** shop profile (foto, servicios, precios, ubicación, reseñas) → book. This page sells; treat it like a landing page.
- Returning client home = **one card: "Tu próxima cita"** or **"¿Reservamos? Tu último corte fue hace 3 semanas."**
- Rebooking in 2 taps (repeat last service + barber).
- Loyalty progress visible (X/Y cortes).
- Post-cita: rating prompt (exists) → good rating asks for Google review, bad rating goes privately to admin (alert flow exists — connect them).
- Recordatorios: 24h + 2h antes, con confirmar/reagendar en el mensaje.

## 20. Long-term Roadmap

**Fase A — Foundation (design now):** tokens reconciled · component library core · IA/nav restructure · Hoy dashboard · Agenda calendar · booking flow polish · empty/loading/error system.

**Fase B — Operations:** POS v2 + corte de caja · Inventario v2 (movements, post-backend) · onboarding wizard · CRM segments · employee app v2.

**Fase C — Growth:** WhatsApp automations · recordatorios inteligentes · Google Calendar sync · shop landing/reviews · plan/subscription management UI · multi-sucursal.

**Fase D — Moat:** analytics con benchmarks del sector · IA (predicción de no-show, sugerencia de precios, huecos inteligentes) · marketplace/API · white label para cadenas.

---

### Approved execution order

**Phase 1 — Foundation:** design tokens · color system · typography · spacing · elevation · border radius · iconography · motion principles

**Phase 2 — Component Library:** buttons · inputs · cards · tables · modals · calendar components · navigation components · empty states · loading states · error states

**Phase 3 — Application Shell:** sidebar · header · command palette · notifications · search · user menu

**Phase 4 — Admin Dashboard ("Hoy")**

**Phase 5 — Agenda Calendar** (flagship experience)

**Phase 6 — Core Modules:** CRM · POS · Inventory · Reports · Billing · Settings

**Phase 7 — Employee Experience**

**Phase 8 — Customer Experience** (app + public booking)

**Phase 9 — Onboarding Wizard**

Gate: Phase 1 starts after the ORNÓ Design Constitution is provided.
