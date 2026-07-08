# Phase 8 — Customer Experience · Implementation Specification

For Claude Code. Design source: `Phase 8 — App del cliente.dc.html` (frozen). White-label demo brand: "Barbería Central" (terracotta) — proves zero ORNO dependency.

## 0. Scope & architecture

Public, mobile-first surface at the tenant's booking domain (`{slug}.orno.app` or custom domain). **No login wall**: identity = phone number, verified by WhatsApp magic link only when managing an existing appointment. Everything brand-driven via `BrandConfig` (M0/M2) resolved server-side from the domain — zero ORNO tokens in any component.

Routes:
```
/                → LandingScreen (brand, trust, services, CTA)
/reservar        → BookingFlow (steps as query state, not routes — back button steps back)
/cita/{token}    → AppointmentPass (tokenized; no auth needed)
/inicio          → CustomerHome (recognized returning client via cookie/magic link)
/perfil          → CustomerProfile
```

Breakpoints: single column ≤767px (primary); ≥768px centers a 480px column. Never desktop chrome.

## 1. Component hierarchy

```
CustomerShell                    [NEW] BrandProvider + theme injection + brand header
├─ LandingScreen                 [NEW]
│  ├─ BrandHero                  [NEW] cover photo, logo tile, name (brand display font)
│  ├─ TrustRow                   [NEW] rating, reviews, open-until, address
│  ├─ ServiceMenuList            [NEW] read-only price list
│  └─ PolicyRow                  [NEW] cancel policy + reminder promise
├─ BookingFlow                   [NEW] 4-step conversation + confirm
│  ├─ StepHeader                 [NEW] back + title + 4-segment progress
│  ├─ ServiceStep → OptionCardList        [NEW generic]
│  ├─ BarberStep  → OptionCardList (avatar variant + "El primero libre")
│  ├─ DayStep     → DayGrid      [NEW] 8 days, availability dot, usual-day ring
│  │  └─ AiHintBanner            [NEW] "Sueles venir los viernes…" (dismissible)
│  ├─ TimeStep    → TimeSlotGrid [REUSED M4 TimeSlotPicker over suggestGaps/engine]
│  ├─ ConfirmStep                [NEW] summary rows + PhoneField + CTA
│  └─ BookedScreen               [NEW] success check + AppointmentPass inline
├─ AppointmentPass               [NEW — the wallet card]
├─ CustomerHome                  [NEW]
│  ├─ AppointmentPass (compact)
│  ├─ LoyaltyStampCard           [NEW] 10 stamps, gift on #10
│  ├─ AiHintBanner (rebook whisper)
│  └─ VisitHistoryList           [NEW] rows + "Repetir" per row
└─ CustomerProfile               [NEW]
   ├─ IdentityCard, PreferenceChips [NEW], CommPrefsList (M1 Switch), PaymentMethodsCard (future, disabled)
```

## 2. Booking flow — state diagram

```
LANDING ─Reservar→ SERVICE ─pick→ BARBER ─pick→ DAY ─pick→ TIME ─pick→ CONFIRM
   ▲                  ▲______back___▲____back___▲___back___▲___back______│
   │                                                                     ├─ phone valid + submit → BOOKING (async)
RETURNING client on LANDING sees "¿Repetimos tu habitual?" → jumps to CONFIRM prefilled
BOOKING ─ok→ BOOKED (pass + WhatsApp send)
BOOKING ─slot_taken→ SLOT_CONFLICT (inline: "se acaba de ocupar" + 3 nearest via M4 detectConflict alternatives) → TIME
BOOKING ─network_fail→ retry ×2 auto → RETRY_PROMPT (selection persisted in sessionStorage)
```
Every `pick` auto-advances (no "Siguiente" buttons). Back = header arrow AND browser back (history.pushState per step).

## 3. Appointment management

AppointmentPass actions: **Mover** (reopens TimeStep scoped to same service/barber; old slot held until new confirmed), **Calendario** (.ics download), **Compartir** (native share sheet), overflow → **Cancelar** (confirm dialog stating the policy; free >2h before, warns inside window). All work from the tokenized `/cita/{token}` URL without login. Reschedule/cancel fire WhatsApp confirmations automatically.

## 4. States

| Surface | Loading | Empty | Error | Offline |
|---|---|---|---|---|
| Landing | brand paints instantly (SSR/cache); services skeleton rows | — | full ErrorPane + retry | cached read-only |
| TimeStep | slot-shaped skeletons | "Ese día está completo" + next 3 free days as buttons | inline retry | requires connection — honest banner |
| Confirm | inline spinner in CTA, never modal | — | slot_taken / retry flows (§2) | queue NOT allowed (booking needs server) |
| Home | pass from cache instantly | no upcoming → hero = booking CTA; no history → section hidden | module-scoped panes | pass fully readable offline (it's a pass) |

## 5. Accessibility

Targets ≥48px (option cards ≥64px). Progress bar `role="progressbar" aria-valuenow`. Steps announce title via aria-live polite. DayGrid: `role="grid"`, disabled days `aria-disabled` + visibly dimmed + dot removed (not color-only). Phone input `inputmode="tel" autocomplete="tel"`. Focus rings brand-primary at 3px tint. Contrast: brand accents validated at save-time in Estudio de marca (block publish if text-on-tint <4.5:1 — the studio computes `*-deep` text tones). Reduced motion: pop/check animations off.

## 6. Motion spec

- Step transition: 200ms `cubic-bezier(0.2,0,0,1)` fade+4px rise (orno-pop). No horizontal slides.
- Success check: 300ms scale 0.6→1.08→1 (orno-check).
- Switches: 150ms knob. Nothing exceeds 300ms; interaction never waits for animation.

## 7. Design tokens required (all from BrandConfig)

`brand.primary`, `brand.primaryHover`, `brand.primaryTint`, `brand.primaryDeep` (computed), `brand.accent`, `brand.bg`, `brand.displayFont`, `radius.button|card|pill` (tier per freeze review), plus the frozen neutral/ink/semantic set from M0. **No component may reference a hex.** Sage remains only inside ORNO-the-default-brand's config.

## 8. Reuse map

Reused: BrandProvider + tokens (M0/M2) · Button, Switch, Dialog/bottom-sheet, Badge, Avatar (M1) · AsyncPane, Skeleton, ErrorPane, toasts (M3) · scheduling engine `suggestGaps`/`detectConflict` + TimeSlotPicker (M4) · AiHintBanner pattern (CRM/Phase 6 insight banner — extract to shared).
New (16): CustomerShell, LandingScreen, BrandHero, TrustRow, ServiceMenuList, PolicyRow, BookingFlow, StepHeader, OptionCardList, DayGrid, ConfirmStep, BookedScreen, AppointmentPass, CustomerHome, LoyaltyStampCard, VisitHistoryList, PreferenceChips (+ CustomerProfile assembly). All presentation-only; data via hooks; Supabase untouched.

## 9. AI assistance rules (frozen)

One whisper max per screen; always dismissible; always sentence-first with a one-tap action; sourced from real signals (cadence, usual day/slot, favorite barber). Copy patterns: "Sueles venir los {día} a la {franja}" · "Después de esta cita te tocaría el {fecha} — ¿te la dejamos apalabrada con {barbero}?" · "{Barbero} tiene libre {día}". Never notifications-by-default; promos opt-in only (max 1/month, stated in the toggle hint).

## 10. Copy (frozen)

CTA "Reservar turno" · trust "Sin registrarte · confirmación por WhatsApp" · steps "¿Qué te hacemos? / ¿Con quién? / ¿Qué día? / ¿A qué hora? / Confirma tu cita" · phone label "Tu WhatsApp — para confirmarte la cita" · success "¡Listo! Te esperamos" · conflict "Uy, ese horario se acaba de ocupar" · fastest barber "El primero libre".
