# Phase 7 — Employee Experience · Implementation Specification

For Claude Code. No interpretation required — every component, state and interaction is specified. Design source: `Phase 7 — App del barbero.dc.html` (frozen baseline).

## 0. Scope & principles

Mobile-first PWA surface for role `employee` (barber). Three screens + one sheet. **Hard exclusions:** no POS, no inventory, no business analytics, no settings beyond availability. If a feature doesn't help serve the next client faster, it is out of scope.

Route root: `/app/barbero` (guards: session role = employee; owners see their admin app).
Breakpoints: designed at 390px; layout is a single column up to 767px; ≥768px centers content in a 480px column (tablet in the backroom). Never a desktop layout.

## 1. Component hierarchy

```
EmployeeShell                       [NEW — thin wrapper, consumes BrandProvider]
├─ EmployeeHeader                   [NEW] greeting + date summary + avatar
├─ <Outlet>
│  ├─ MyDayScreen                   [NEW]
│  │  ├─ NowCard                    [NEW] (wraps M3 Card + M1 Button)
│  │  ├─ NextUpStrip                [NEW]
│  │  ├─ CompactApptRow             [NEW] (list item, reuses AppointmentState tokens from M4)
│  │  ├─ FreeSlotHint               [NEW] (reuses GapSuggestion logic from M4 engine — suggestGaps)
│  │  └─ AsyncPane                  [REUSED M3] loading/empty/error/denied
│  ├─ AgendaScreen                  [REUSED M4] AppointmentTimeline variant="single",
│  │                                 resource = self, read + move-own only
│  ├─ ClientsScreen                 [REUSED M5-CRM] ClientList (search + rows), read-only,
│  │                                 no segments, no bulk marketing
│  └─ MyStuffScreen                 [NEW]
│     ├─ EarningsCard               [NEW] (M3 Card + MetricRow)
│     ├─ MyWeekCard                 [NEW]
│     ├─ CraftFeedbackCard         [NEW] (insight tone — never ranking vs. peers)
│     └─ BlockTimeSheet             [NEW] (M1 Dialog as bottom sheet)
├─ ClientPeekSheet                  [NEW — the key surface; opens from any appointment]
└─ EmployeeTabBar                   [NEW] (4 tabs; reuses M2 MobileTabBar pattern)
```

All components consume semantic tokens only (BrandConfig-compatible). Icons: lucide, stroke 1.75.

## 2. New component APIs

### NowCard
```ts
{ appointment: SchedAppointment; clientNote?: string; elapsedMin: number;
  onComplete(): void; onPhoto(): void; onAddNote(): void; onOpenClient(): void }
```
States: `in_progress` (sage ring + orno-pulse animation), `checked_in` (button = "Empezar servicio"), `none` (renders NextUpStrip promoted to hero). Complete → optimistic; fires `onComplete` immediately, then shows RebookPrompt toast ("¿Le reservo la próxima? vie 1 ago 15:00") for 8s.

### ClientPeekSheet (bottom sheet, 80% height, drag-to-dismiss)
```ts
{ appointment: SchedAppointment; client: { name, initials, note?, lastVisitGapDays?,
  cadenceDays?, photos: string[] }; onStart(): void; onNotifyRunningLate(): void;
  onMove(): void; onClose(): void }
```
Content order (fixed): identity row → chair note (warning-tint) → rhythm insight (secondary-tint) → last-cut photos (72px thumbs, tap = lightbox) → primary action → secondary grid. Primary action by state: pending/confirmed→"Empezar servicio" disabled until checked_in? NO — enabled always (front desk may skip check-in); checked_in→"Empezar servicio"; in_progress→"Terminé".

### EmployeeTabBar
Tabs: Mi día (sun) · Agenda (calendar-days) · Clientes (heart) · Lo mío (circle-user-round). Height 56px + safe-area inset. Active = primary-deep + 600 weight. Badge dot on Mi día when a client checks in.

### MyWeekCard rows
`{ day, workingLabel | 'Día libre', apptCount, isToday }` — today = accent-tint + border, day off = dashed. Footer button opens BlockTimeSheet: date picker + range + reason (free text) → creates a `ScheduleBlock` **request** (owner approves if policy requires; state `pending` shown dashed).

### EarningsCard
Weekly commissions + tips + cut count, vs **own** previous week only. Data comes precomputed from the API — no client-side math. Amounts `nums` tabular.

## 3. Interactions

- Tap any appointment row/card → ClientPeekSheet.
- NowCard buttons ≥48px; all tab targets ≥48px.
- Photo: `onPhoto` opens camera capture → uploads to client timeline (background, offline-queued).
- Move own appointment (AgendaScreen): long-press drag via M4 `useScheduleDnd`; conflicts via M4 ConflictResolver. Cannot move other barbers' appointments (resource locked to self).
- "Avisar que estoy libre" (FreeSlotHint) → posts a note to front desk / owner notification. One tap, toast confirm, no form.
- Pull-to-refresh on MyDayScreen.

## 4. States (every screen)

| State | Treatment |
|---|---|
| Loading | Skeletons shaped like NowCard + 3 rows; only after 300ms; never blank |
| Empty (day off) | "Hoy no trabajas — que lo disfrutes 🙌" + next working day |
| Empty (no appts) | "Silla libre por ahora" + [Avisar disponibilidad] |
| Error | M3 ErrorPane, module-scoped: "No pudimos cargar tu día · Reintentar" |
| Offline | Today cached (IndexedDB); actions queue with per-card "se guardará al conectar" chip (M4 sync overlay pattern); banner only if >5min offline |
| Permission-denied | M3 DeniedPane (should not occur if routing correct) |

Appointment visual states: reuse M4 `AppointmentCard` STATE_CLS exactly (pending amber / confirmed sage / checked_in dusty-blue / in_progress pulse / completed muted 60% / cancelled struck / no_show danger-tint).

## 5. Accessibility

- All interactive targets ≥48×48px; text ≥13px, body 14–15px.
- Sheet: `role="dialog" aria-modal`, focus-trapped, Esc + drag + scrim tap dismiss, focus returns to invoker.
- Toggles/tabs: proper `role="switch"`/`role="tab"` + aria-checked/selected.
- Live updates ("Lucas ya llegó") announced via one polite aria-live region in EmployeeShell.
- Color never sole carrier: every state chip has a text label. Contrast per frozen tokens (`warning-text #8F6A1F`, `danger-text #A93F34` on tints).
- Reduced motion: disable orno-pulse + sheet spring under `prefers-reduced-motion`.

## 6. Reuse map

| Reused as-is | From |
|---|---|
| AsyncPane, Card, Skeleton, ErrorPane, EmptyState, notify/toasts | M3 |
| Button, Dialog(→bottom-sheet variant), Badge, Avatar | M1 |
| BrandProvider, semantic tokens, MobileTabBar pattern | M0/M2 |
| AppointmentTimeline(single), AppointmentCard, useScheduleDnd, suggestGaps, ConflictResolver, sync overlays | M4 |
| ClientList rows (read-only) | CRM (M5) |

New components: EmployeeShell, EmployeeHeader, EmployeeTabBar, MyDayScreen, NowCard, NextUpStrip, CompactApptRow, FreeSlotHint, MyStuffScreen, EarningsCard, MyWeekCard, CraftFeedbackCard, BlockTimeSheet, ClientPeekSheet, RebookPrompt. **15 total, all token-driven, no business logic inside** (data + mutations injected via hooks; Supabase queries live in the existing data layer, untouched).

## 7. Copy (frozen)

Greeting "Hola, {nombre}" · summary "{día} · {n} citas · terminas {hora}" · complete "Terminé" · start "Empezar servicio" · late "«Ya te atiendo»" · earnings "Esta semana llevas" · week "Mi semana" · block "Pedir día libre o bloquear horas" · feedback headline pattern: positive craft observation, never comparison to teammates.
