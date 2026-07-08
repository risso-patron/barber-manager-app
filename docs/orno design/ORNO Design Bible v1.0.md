# ORNO Design Bible v1.0
*The canonical design reference · Frozen July 8, 2026 · Every future designer, developer and AI agent follows this document*

Sources of record: Design Constitution (`CLAUDE.md`) · Phases 1–9 (`Phase N — *.dc.html` + Implementation Specs 7/8/9) · `migration/M0–M4` · `ORNO Product Blueprint v1.0.md` · `Phase 8.5 — Product Readiness Review.md`. Where documents conflict, this Bible wins; where this Bible is silent, the Constitution wins.

---

## 1. Product Vision

ORNO is the operating system of a barbershop, sold as white-label SaaS. Not a dashboard, not management software — a calm workbench that disappears behind the work. Every screen exists to help someone serve the next client, fill the next chair, or make the next decision. The goal for every screen: **"I could use this all day."**

## 2. Design Constitution (verbatim authority)

Mission: the most beautiful, intuitive and enjoyable barbershop SaaS on the market. Users feel calm, confident and in control.

Personality: **warm · elegant · premium · human · minimal · approachable · professional.** Never cold, corporate or intimidating. Reference: Apple, Airbnb, Notion — never cyberpunk, developer dashboards or enterprise software.

Final rule: **never redesign only to make something prettier.** Every visual decision must improve usability, clarity, trust or productivity.

## 3. Design Principles

1. Every screen answers: Where am I? What should I do? What deserves my attention? What happens next?
2. Operational over analytical — decisions before statistics.
3. One click to act: common verbs never hide behind menus.
4. Empty space is inventory (gaps are bookable), not decoration.
5. Sentence first, chart second: insights lead, visualizations support.
6. Interaction never waits for animation.
7. Failures are module-scoped — one panel fails, the app never does.
8. Optimistic everything: act instantly, reconcile in background, Deshacer in the toast.
9. If a feature doesn't help the user's actual job, it doesn't exist on their surface.

## 4. Brand Philosophy

Ornō wordmark: Cormorant Garamond + red dot `#E53935`. **Red is signature only** — logo and rare brand moments; never interface color, never errors. Product color is sage. Voice: human Spanish — "Tu día" not Dashboard, "Equipo" not Manage Employees, "¡Listo! Te esperamos". Emojis only in celebratory moments (day off, launch), never in operational UI.

## 5. White-label Architecture

`BrandConfig` = { name, logo/icon SVGs, primary (+hover/tint/deep computed), accent palette, display font, radius tier, light/dark pref }. Resolved domain→tenant→config, injected once by `BrandProvider` as semantic CSS tokens.

Propagates to: app UI, login, booking site, customer portal/pass, emails, WhatsApp templates, PDF invoices, reports. **Law: no component references a hex. ORNO's colors exist only in the default BrandConfig.** Estudio de marca (Portal 6.5) edits with live preview; publish gated by an AA contrast guard.

## 6. Information Architecture

Tenant → locations → team (owner/manager/employee) → customers. Owner modules (approved order): Tu día · Agenda ⭐ · Clientes · Caja · Inventario · Análisis · Equipo · Configuración, plus Portal SaaS (Cuenta · Estudio de marca · Plan). Employee: 4 tabs. Customer: landing → booking → tokenized pass (+ optional Inicio/Perfil).

## 7. Navigation Maps

- **Owner**: M2 shell — sidebar 264px ↔ 76px rail (ONE component, two states); mobile bottom tabs. ⌘K = global command palette; `/` = focus in-page search (distinct roles, frozen). Bell → Notifications inbox. Shop selector for multi-location. User menu → Portal.
- **Employee**: Mi día · Agenda (self, single column) · Clientes (read-only) · Lo mío. ClientPeekSheet from any cita.
- **Customer**: `/` → `/reservar` (service → professional → time → confirm) → `/cita/{token}` pass without auth · `/inicio` · `/perfil`. Login `/entrar` (magic link) routes all roles.

## 8. User Ecosystems

**Owner/Administrator** — desktop-first, tablet-ready. Home = Tu día: NOW timeline, priority panel (every alert carries its action), quick actions, 4-metric snapshot max, team status, human activity feed, one AI suggestion. Agenda is the flagship: barber columns, 8 appointment states, drag/resize/duplicate with ConflictResolver, smart gaps, walk-in rail, keyboard parity. Caja starts from appointments awaiting charge (never invoice-first). Inventario is alert-driven. Análisis is a decision center (insight sentences first). Administrator = owner minus billing/brand (role-gated rows, same surfaces).

**Employee (barber)** — mobile PWA, zero admin. Mi día: NOW card (chair note pinned, giant "Terminé"), next-up strip, compact rest-of-day, free-slot hint. Lo mío: own earnings vs own past week (never a leaderboard), week + day-off request, craft feedback as encouragement. Hard exclusions: no caja, no inventory, no analytics, no settings.

**Customer** — booking should feel like Apple Wallet/Uber/Airbnb, never software. Minimal typing (phone + name once), tokenized pass instead of forced accounts, reschedule/cancel/add-to-calendar/WhatsApp from the pass. AI whispers ("parece que toca corte") — helpful, never pushy.

**SaaS Platform (owner-of-the-business)** — Portal 6.5: account, businesses, team, connected services, domains; Estudio de marca; plans **Silla / Estudio / Cadena** + add-ons (WhatsApp, IA, extra barbers, extra location) with live next-invoice math. Trials never require a card.

## 9. Component System

- **M0** tokens (→ §10) · **M1** primitives: Button, Input, Select, Switch, Checkbox, Radio, Badge, Avatar, Dialog (+bottom-sheet), Tooltip, Tabs, Kbd, Brand components (Logo/AppIcon/favicon/PWA — asset-swappable).
- **M2** shell: AppShell, Sidebar, Header, CommandPalette, MobileTabBar, BrandProvider.
- **M3** feedback/data: AsyncPane (loading/empty/error/success/denied), Card (+action slots), Table (virtualization-ready), MetricRow, EmptyState, ErrorPane, Skeleton, notify (+onUndo).
- **M4** scheduling engine — three layers: pure `engine.ts` (tz math, `suggestGaps`, `detectConflict`) → headless `useScheduleDnd` (pointer+keyboard parity) → 12 presentation components composed by `AppointmentTimeline` (board/single). Consumed headlessly by WhatsApp booking and AI.
- **Phases 7/8/9** additions per their specs (15 + 17 + 8 components).
- **To extract at implementation**: `AiHint` (one component, tones insight/suggestion/whisper — Readiness B3).
- Laws: composition over specialization · no duplicates · no isolated UI · props over forks.

## 10. Design Tokens (canonical values)

Surfaces: bg `#FAF9F7` · secondary `#F4F2EE` · card `#FFFFFF` · border `#E8E4DE`.
Primary sage: `#5F9F77` · hover `#4C8862` · tint `#EAF2ED` · deep text `#3E7354`.
Accents (muted, sparing): terracotta `#C57B57` · beige `#CBB595` · dusty blue `#7E9BB4` (tint `#EAEFF4`, text `#4A6B87`) · lavender `#A79CC0`.
Ink: `#26231F` / `#57534B` / `#8A847A` (tertiary = large text only).
Semantic: success `#4E8A64` (tint `#EAF2ED`) · warning `#B98A2E` (**text-on-tint `#8F6A1F`**, tint `#F7EFDD`/`#FFF9EE`) · danger `#C24E42` (**text-on-tint `#A93F34`**, tint `#FBF3F2`). Surface/text tone pairs are the frozen resolution of drift findings B1.
ORNO red `#E53935`: brand mark only.
Type: Inter (fallback Manrope); headings 600, −0.02em; body 15px; numbers always `tabular-nums`; Cormorant Garamond = wordmark + brand display only.
Radius (B2 frozen): 14px large buttons/inputs · 12px medium controls · 20px cards · 24px modals · 999px pills.
Shadows: resting `0 1px 2px rgba(38,35,31,.04), 0 4px 16px rgba(38,35,31,.05)` · overlay `0 16px 48px rgba(38,35,31,.14)`.
Spacing: 8-point grid; whitespace is a feature.

## 11. Motion System

150–250ms · `cubic-bezier(0.2,0,0,1)` · named: orno-pop (sheet/menu entry), orno-pulse (in-progress only), orno-check (success), skeleton shimmer. Fast, subtle, meaningful — never decorative. Interaction never waits for animation. `prefers-reduced-motion` disables pulse/springs everywhere.

## 12. Accessibility

WCAG AA floor. Targets ≥44px (≥48px on employee/customer mobile). Visible sage focus rings. Full keyboard nav (Agenda: ↑↓ cita, ←→ barbero, Enter acciones, ⇧-arrows move via the same conflict pipeline as drag, N nueva). State never color-only — always a text label. aria-live for live changes ("Cita de Marcos movida a 13:00 con Rama"). Real roles: switch/tab/dialog/progressbar. Contrast: use `-text` tones on tints.

## 13. AI Interaction Principles

Sentence-first · max one whisper per screen · always dismissible · one-tap action attached · sourced from real signals only (rhythm, gaps, stock, cadence) · never intrusive, never guilt, promos opt-in (≤1/month). AI books through the same headless engine as humans — no separate logic.

## 14. Mobile-first Principles

Employee + customer surfaces are designed at 390px first. One-handed: primary actions in thumb reach, bottom sheets over modals, tabs ≤4. Minimal typing; pickers and defaults over forms. Owner app degrades desktop→tablet with bottom-sheet substitutions.

## 15. Responsive Rules

Owner: desktop ≥1280 full sidebar · 1024–1279 rail 76px + 220px agenda columns, walk-in rail → bottom sheet · <1024 mobile tabs + single-column agenda. Employee/customer: single column to 767px; ≥768 centers a 480px column — never a desktop layout. Cards are density-aware (hide detail rows below height thresholds), never truncate the client name.

## 16. Empty / Loading / Error / Offline

- **Empty**: warm, specific, actionable — Product Voice ("Silla libre por ahora", "Todo tranquilo por aquí"); the structure (grid/list) still renders.
- **Loading**: skeletons shaped like the real content, in real positions, only after 300ms; never a blank screen, never a full-page spinner.
- **Error**: module-scoped ErrorPane, human copy + Reintentar; never technical language, never a dead app.
- **Offline**: read from cache always; actions queue with per-item "se guardará al conectar" chips; banner only past 5 min. Sync states (syncing/offline/conflict) are quiet per-card chips.
- **Permission-denied**: DeniedPane, polite, links to whoever can help.
Every data surface handles all five — enforced by AsyncPane.

## 17. Product Copy Guidelines

Human Spanish, warm and direct. Address the user as "tú". Verbs on buttons ("Terminé", "Cobrar", "Rellenar"). Numbers tabular, prices localized. Never: Dashboard, Manage, Submit, Error 500, jerga técnica. Celebrate honestly ("Vas muy bien — faltan 2 pasos"), never flatter emptily. Comparisons for employees are always self-vs-self.

## 18. Implementation Rules for Claude Code

1. Never break business logic; never change Supabase queries, permissions or the database.
2. Semantic tokens only; BrandConfig is the single source of color/type/radius.
3. Incremental replacement — the app works after every step; no duplicate components, ever.
4. Apply frozen corrections: B1 warning/danger `-text` tones · B2 radius tiers in M1 Button · B3 extract AiHint · B4 partial-payment chip · B5 employee messages land in Notifications · B6 cancellation-window setting in Configuración → Reservas.
5. One Sidebar component (both states) · ⌘K global vs `/` in-page (frozen roles).
6. Build order: M0→M4 framework merge → Login + Onboarding + Notifications (Phase 9 spec) → Agenda page on the M4 kit → Tu día → Caja/CRM/Inventario/Análisis → Employee PWA (Phase 7 spec) → Customer booking (Phase 8 spec) → Portal 6.5.
7. Data layer owns fetching; components receive data + callbacks. Optimistic mutations with toast Deshacer.

## 19. Future Expansion Guidelines

New capability → new spec referencing this Bible; never redesign frozen work (Constitution final rule applies). Extend, don't fork: new modules plug into the M2 shell; new scheduling surfaces consume the M4 engine; new roles get their own surface following §8's pattern (design for their job, exclude everything else). Roadmap order (Blueprint §9): Notifications v2 → booking payments → multi-location ops → marketplace → public API → dark theme (tokens ready) → conversational AI. Versioning: additive = v1.x; a change to Constitution-level rules requires v2.0 and explicit owner approval.

## 20. Version History

- **v1.0 · July 8, 2026 — FROZEN.** Phases 1–9 complete: Constitution → Foundations → Components → Shell → Tu día → Agenda → CRM/Caja/Inventario/Análisis → Portal SaaS → Employee → Customer → Readiness Review + Blueprint → Onboarding. Framework M0–M4 implemented in `migration/`. Known implementation requirements: Readiness B1–B6.
- Future: v1.1+ incremental, v2.0 only for Constitution-level change. Never redesign completed work.
