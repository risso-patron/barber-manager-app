# Phase 9 — Onboarding Wizard · Implementation Specification

For Claude Code. Design source: `Phase 9 — Onboarding.dc.html` (frozen). Incorporates Readiness findings A1 (Login), A2 (setup checklist), A3 (Notifications inbox).

## 0. Scope

Owner-side first-run: signup → 5-step wizard → live booking link → Tu día with setup checklist. Also delivers the shared Login screen (all roles) and the Notifications inbox (owner shell). Works at 390px and desktop (centered 560px card).

## 1. Login (A1) — `/entrar`

`LoginScreen` [NEW]: BrandHero tile (logo from BrandConfig; ORNO default), one field (phone OR email, `inputmode` auto-detect), CTA "Enviarme el enlace de acceso" → magic link via WhatsApp/email. No passwords. After auth, route by role: owner→`/tu-dia`, employee→`/app/barbero`, customer→`/inicio`. Signup entry: "Crea tu barbería gratis" → `/crear`. States: sending (inline spinner in CTA), sent ("Revisa tu WhatsApp" + resend after 30s), invalid contact (inline, human copy), link expired (fresh field + explanation). Brand-driven 100% — this screen is white-label surface #1.

## 2. Wizard — `/crear`

`OnboardingWizard` [NEW] — 5 steps, one question each, ~5 min:

| # | Step | Component | Default / skip |
|---|---|---|---|
| 1 | Nombre | ShopNameStep — single input + live preview card (logo initial + `{slug}.orno.app`) | required (only required step) |
| 2 | Servicios | ServiceCatalogStep — pre-checked typical catalog w/ reference prices + "Otro servicio" | skip = "Los cargo después" |
| 3 | Equipo | TeamStep — "Solo yo" (valid, celebrated) vs "Somos un equipo" (name chips now, WhatsApp invites later) | skip = "Después" |
| 4 | Horario | HoursStep — 7 day-rows, typical hours pre-filled (Mar–Sáb on), switch per day | skip = "Usar horario típico" |
| 5 | Enlace | LaunchStep — success check, QR + link card, WhatsApp share / copy, AI note about deferred setup | terminal |

Rules (frozen): auto-save per step (optimistic, never a "Guardar" button) · progress persists (resume on re-entry, `wizard_state` per tenant) · every skip states its consequence · never asks for a card · Enter advances when the step is valid · header shows "Paso N de 5 · ~5 min" + 5-segment progressbar (`aria-valuenow`).

**State machine:** `NAME → SERVICES → TEAM → HOURS → LAUNCH`; back = header Atrás + browser back; network failure = step stored locally, silent retry, discreet banner (never blocks advancing); LAUNCH publishes the booking page even if steps 2–4 were skipped (defaults apply).

## 3. Setup checklist (A2) — `SetupChecklistCard` [NEW]

Lives at the top of Tu día until complete, then removes itself. Items: Servicios y precios · Horario · Enlace compartido · Invita a tu equipo · Dale tu marca. Progress ring (SVG, sage) + "faltan N pasos". Each row deep-links to its module; next best action highlighted (accent tint). Data: `setup_state` per tenant, updated by real events (sharing the link checks the item — not a manual checkbox). Dismissable? No — but collapses to a single row after 7 days.

## 4. Notifications inbox (A3) — `NotificationsPanel` [NEW]

Header bell → popover (desktop, M2 shell) / bottom sheet (mobile). Row = icon tile (semantic tint) + sentence (human Spanish, bold subject) + relative time + ONE action button (Ver/Agendar/Rellenar/Reponer…). Taxonomy = same as Tu día priority panel: reservas, check-ins, cancelaciones (action: Rellenar → gap flow), walk-in/free-slot messages from employees (B5), stock bajo, pagos pendientes. "Marcar todo leído". Badge dot on bell; count aria-label. Empty: "Todo tranquilo por aquí". Retention 30 days.

## 5. Components

New (8): LoginScreen, OnboardingWizard, WizardShell (header/progress/footer), ShopNameStep, ServiceCatalogStep, TeamStep, HoursStep, LaunchStep, SetupChecklistCard, NotificationsPanel.
Reused: M1 Button/Input/Switch/Badge · M3 Card/AsyncPane/toasts · BrandProvider (M0/M2) · orno-pop/orno-check motion (Phase 8 spec §6) · QR generation shared with Portal 6.5 domain card.

## 6. Accessibility

Progressbar `role="progressbar" aria-valuenow={step} aria-valuemax="5"`; step titles announced aria-live polite; day toggles are real `role="switch"` with day+hours label (never color-only); targets ≥48px; wizard fully keyboard operable (Tab through options, Enter advance, Esc none — no destructive close, progress always saved).

## 7. Copy (frozen)

"¿Cómo se llama tu barbería?" · "¿Qué servicios ofreces?" · "¿Quiénes cortan?" / "Solo yo, por ahora" · "¿Cuándo abres?" · "{Nombre} ya recibe reservas" · CTA final "Crear mi barbería" · login "Enviarme el enlace de acceso" / "Sin contraseñas…" · checklist "Tu puesta en marcha" / "Vas muy bien — faltan N pasos".
