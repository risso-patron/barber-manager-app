# ORNO Product Blueprint v1.0
*Master design reference · July 2026 · For Claude Code and future contributors*

Frozen sources: Phases 1–8 (`Phase N — *.dc.html`), Implementation Specs (Phases 7–8), `migration/M0–M4`, Design Constitution (`CLAUDE.md`), Readiness Review (Phase 8.5).

---

## 1. What ORNO is

A white-label barbershop operating system sold as SaaS. One codebase, three ecosystems:

| Role | Surface | Home | Job to be done |
|---|---|---|---|
| **Owner/Admin** | Web app (desktop-first, tablet-ready) | Tu día | Run the business: agenda, caja, clientes, inventario, análisis |
| **Employee (barber)** | Mobile PWA | Mi día | Serve the next client faster; zero admin |
| **Customer** | Public booking site + tokenized pass | Inicio / booking link | Book, move, remember appointments with near-zero effort |

ORNO itself is just the **default brand**. Every tenant re-brands via BrandConfig (Estudio de marca).

## 2. Navigation maps

**Owner** (M2 shell: sidebar 264px ↔ 76px rail; mobile bottom tabs):
Tu día · Agenda ⭐ · Clientes · Caja · Inventario · Análisis · Equipo · Configuración — plus ⌘K command palette (global), `/` (in-page search), bell → Notifications inbox (Readiness A3), shop selector (multi-location), user menu → Portal SaaS (Cuenta/Estudio/Plan).

**Employee** (4 tabs): Mi día · Agenda (single-column, self only) · Clientes (read-only) · Lo mío. Sheet: ClientPeek from any cita.

**Customer**: `/` landing → `/reservar` (4-step conversation) → `/cita/{token}` pass (no auth) · `/inicio` · `/perfil`.

## 3. Feature map (designed + specified)

- **Scheduling** ⭐: barber-column day board, week view, 8 appointment states, drag/resize/duplicate with conflict resolver, smart gaps ("30 min · ideal para Barba"), walk-in queue, keyboard parity, per-column failure isolation.
- **Tu día**: decision dashboard — NOW timeline, priority panel, quick actions, 4-metric snapshot, team status, human activity feed, AI suggestions.
- **CRM**: client list w/ segments + tags, profile timeline (visits/compras/notas/fotos), rhythm insights, WhatsApp actions, loyalty, membership.
- **Caja (POS)**: checkout begins from appointments awaiting charge; products, tips, discounts, membership benefits, split/partial payments, WhatsApp receipt, commissions, inventory deduction, CRM auto-update.
- **Inventario**: alert-driven (reorder today), purchase recommendations, movements, product performance, suppliers, transfer-ready.
- **Análisis**: insight-first decision center — every section starts with a human sentence, chart second.
- **Portal SaaS (6.5)**: account, businesses, team, connected services, domains, notifications; **Estudio de marca** (live-preview white-label); plans (Silla/Estudio/Cadena) + add-ons (WhatsApp, IA, extra barbers, locations) with live invoice math.
- **Employee app (7)** and **Customer experience (8)**: per their Implementation Specs.

## 4. Component ecosystem

- **M0 tokens**: warm surfaces `#FAF9F7/#F4F2EE/#FFF`, borders `#E8E4DE`, sage primary `#5F9F77` (hover `#4C8862`, tint `#EAF2ED`, deep `#3E7354`), accents terracotta/beige/dusty-blue/lavender, ink `#26231F/#57534B/#8A847A`, semantic success/warning/danger **+ `-text` tones `#8F6A1F`/`#A93F34` (Readiness B1)**. Radius: 14 buttons-large / 12 medium / 20 cards / 24 modals / 999 pills (B2). Shadows near-invisible; overlay `0 16px 48px rgba(38,35,31,.14)`. Inter body / Cormorant Garamond wordmark+brand display. Motion: 150–250ms, `cubic-bezier(0.2,0,0,1)`, reduced-motion respected.
- **M1 primitives**: Button, Input, Select, Switch, Checkbox, Radio, Badge, Avatar, Dialog (+bottom-sheet variant), Tooltip, Tabs, Kbd + **Brand components** (Logo, AppIcon, favicon/PWA sets — swappable assets, no code change).
- **M2 shell**: AppShell, Sidebar (both states, one component), Header, CommandPalette, MobileTabBar, BrandProvider.
- **M3 feedback/data**: AsyncPane (loading/empty/error/success/denied), Card (+action slots), Table (virtualization-ready), MetricRow, EmptyState, ErrorPane, Skeleton, notify/toasts (with onUndo).
- **M4 scheduling engine**: pure `engine.ts` (tz math, suggestGaps, detectConflict) + headless `useScheduleDnd` + 12 presentation components. Consumed by admin/employee/customer/WhatsApp/AI.
- **Phase 7/8 additions**: 15 employee + 17 customer components (see the two Implementation Specs).
- **Shared to extract**: `AiHint` (one component, three tones — Readiness B3).

## 5. White-label architecture

`BrandConfig` = { name, logo/icon SVGs, primary(+hover/tint/deep computed), accent palette, display font, radius tier, light/dark pref }. Resolved per tenant (domain → tenant → config), injected once by BrandProvider as semantic CSS tokens. Propagates to: app UI, login, booking site, customer portal, emails, WhatsApp templates, PDF invoices, reports. **Rule: no component references a hex; ORNO colors exist only in the default config.** Estudio de marca edits it with live preview; publish is gated by an AA contrast guard.

## 6. SaaS architecture (experience level)

Tenant = business owner account → N locations → team members (roles: owner/manager/employee) → customers (per tenant). Plans: **Silla** (1 chair) / **Estudio** (team) / **Cadena** (multi-location). Add-ons: WhatsApp Business, IA, extra barbers, extra location — toggled in Portal with live next-invoice estimate. Trial → paid; invoices; booking domain (`{slug}.orno.app` or custom). API keys marked "Pronto" (future).

## 7. AI capabilities (frozen rules)

Sentence-first, one whisper max per screen, always dismissible, one-tap action, sourced from real signals only. Surfaces: Tu día suggestions (gaps, unconfirmed, low stock) · CRM rhythm/win-back · Inventario reorder recommendations · Análisis insights · Customer rebook whisper + usual-day hints · WhatsApp/AI booking via headless scheduling engine. Never intrusive; promos opt-in (max 1/month).

## 8. Brand architecture

Ornō wordmark: Cormorant Garamond + red `#E53935` dot — **red is signature-only** (logo, rare brand moments), never interface, never errors. Product personality: warm, elegant, premium, human, minimal, approachable. Voice: human Spanish ("Tu día", "Equipo", "¡Listo! Te esperamos").

## 9. Future roadmap (post-launch order)

1. **Phase 9 Onboarding Wizard** (next — includes Login + setup checklist per Readiness A1/A2)
2. Notifications inbox (A3) · 3. Payments in booking (deposits, saved cards) · 4. Multi-location ops (transfers, consolidated Análisis, Recursos view) · 5. Marketplace/discovery · 6. Public API + integrations · 7. Dark theme (tokens ready) · 8. AI assistant conversational surface.

## 10. Implementation ground rules (unchanged)

Never break business logic · never change Supabase queries/permissions/DB · incremental replacement, app working after every step · semantic tokens only · composition over specialization · every data surface handles loading/empty/error/success/denied · WCAG AA · interaction never waits for animation.
