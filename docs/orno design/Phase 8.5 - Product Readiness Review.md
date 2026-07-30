# Phase 8.5 — Product Readiness Review
*Audit of Phases 1–8 as if launching commercially next month · July 2026*

Method: every frozen deliverable re-reviewed against the Design Constitution, the M0–M4 framework contracts, and the question **"would a new barbershop owner trust this with their business tomorrow?"**

**Overall verdict: the three ecosystems (Owner / Employee / Customer) are coherent, Constitution-compliant, and implementable from the existing specs. Nothing blocks Phase 9. 14 findings below — 3 Critical, 6 Important, 5 Nice to Have. All Criticals are *missing workflows*, not design flaws.**

---

## A. Critical (must exist before commercial launch)

### A1 · No Login / Auth experience is designed
**Why it matters:** every role enters through a door we never drew. It's also the first brand-propagation surface (the Estudio preview shows a login mock, but no real spec exists).
**Solution:** one white-label login screen (phone/email + magic link, no passwords by default), role-routed after auth (owner→Tu día, employee→Mi día, customer→Inicio). Reuses BrandHero + M1 inputs. **Effort: S (1 screen + spec, all components exist).**

### A2 · No "day one with zero data" path for the OWNER app
**Why it matters:** we designed empty states per module, but the *cross-module* first-run journey (no services, no team, no hours) is exactly what Phase 9 must land on — and the modules currently assume a configured shop.
**Solution:** Phase 9 Onboarding Wizard (already planned) + "setup checklist" card on Tu día that persists until services/hours/team/booking-link are done. **Effort: covered by Phase 9 — this finding defines its acceptance criteria.**

### A3 · Notifications center is referenced but never designed
**Why it matters:** Phase 3 shell has a bell; Phase 4–8 generate events (check-ins, cancellations, low stock, pending payments) with no designed destination. Operationally the owner needs one inbox of "what needs me".
**Solution:** a single Notifications panel (M2 shell popover / mobile sheet) reusing the Priority Panel item pattern from Tu día — same taxonomy, same actions, deep links. **Effort: S–M.**

## B. Important

### B1 · Warning/danger text-token drift (from freeze review)
Constitution `#B98A2E`/`#C24E42` vs. used `#8F6A1F`/`#A93F34` on tints. **Solution (frozen):** surface vs. `-text` tone pairs in M0 tokens. **Effort: XS (token file only).**

### B2 · Radius tiering codification
14px Constitution buttons vs. 12px medium buttons in modules. **Solution (frozen):** 14 large / 12 medium, encoded in M1 Button. **Effort: XS.**

### B3 · AiHintBanner exists as 3 near-identical ad-hoc patterns
CRM insights, Inventory recommendations, Customer whispers share sentence-first + one action + dismiss, but were drawn independently. **Solution:** extract one `AiHint` component (tone prop: insight/suggestion/whisper); rule "one per screen, always dismissible" moves into the component. **Effort: S.**

### B4 · Payment states are binary but partial payments exist in POS
AppointmentCard shows paid/pending `$` chip; Caja designed split/partial flows. A partially-paid cita has no chip state. **Solution:** third chip state (half-filled `$`, warning tone, title "Pago parcial · resta $X"). **Effort: XS.**

### B5 · Employee ↔ front-desk communication is one-directional
"Avisar que estoy libre" and "«Ya te atiendo»" send messages, but no surface shows the *receiving* side (front desk/owner). **Solution:** these land in the A3 Notifications inbox + as transient chips on the Agenda walk-in rail. **Effort: S (pattern exists once A3 lands).**

### B6 · Cancellation policy is promised but has no owner-side setting
Customer flow states "cancela gratis hasta 2 h antes"; no Settings surface defines that window. **Solution:** one row in Configuración → Reservas (slider: window; toggle: deposit when payments launch). **Effort: XS–S.**

## C. Nice to have

- **C1 · Week view for multi-barber day** (Agenda has día/semana-per-barber; a multi-barber week is a future power view). Effort M — defer.
- **C2 · Client photos consent copy** — one line at photo capture ("solo lo ve tu barbería"). Effort XS.
- **C3 · Printable day sheet** (some shops still pin the day at the counter). Reuses Agenda single variant. Effort S.
- **C4 · Sound/haptic on check-in** for the employee app (feel of the shop). Effort XS, behind a toggle.
- **C5 · Estudio de marca contrast guard** is specified (Phase 8 spec §5) but should also gate logo-on-cover legibility. Effort S.

## D. What was checked and found sound

- **UX consistency**: one action-sheet pattern, one insight pattern, one pass/card pattern across all three apps ✓
- **Navigation/IA**: owner 9-module rail (matches approved IA), employee 4 tabs, customer 3 surfaces — no orphan screens ✓
- **Mobile-first**: employee + customer designed at 390px; owner modules degrade to tablet with bottom-sheet substitutions per specs ✓
- **Accessibility**: AA text pairs frozen (B1 formalizes), ≥44/48px targets, keyboard parity on Agenda, aria-live patterns specified ✓
- **White-label**: Phase 8 shipped in a non-ORNO brand; BrandConfig contract covers app/booking/emails/WhatsApp/PDF; no hardcoded hex in framework components ✓
- **Tokens/components**: every screen maps to M0–M4 + the 30 named new components in Phase 7/8 specs; no duplicates beyond B3 ✓
- **Motion**: everything ≤300ms, one easing curve, reduced-motion specified ✓
- **Error/loading/empty/offline**: per-module panes, module-scoped failures, offline-first employee day + customer pass ✓
- **SaaS/multi-tenant**: Portal 6.5 covers subscription, add-ons, domains, team, brand studio; locationId threaded through the scheduling engine ✓

**Recommendation: fix A1 + A3 as small design addenda inside Phase 9 (the wizard ends at the login/first-day moment anyway); B-items are implementation-time token/component work already documented. Proceed to Phase 9 after approval.**
