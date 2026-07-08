# M4 — Scheduling Kit · The Engine

Branch: M0 → M1 → M2 → M3 → **M4**. This is the flagship milestone.

## Architecture: engine, not calendar

Three layers, strictly separated:

1. **`engine.ts` + `types.ts` — pure logic, zero React/DOM.** Time⇄pixel geometry, tz-aware minute math (`minutesInTz` over IANA timezones), snapping, gap discovery (`suggestGaps` — knows which *service* fits), conflict detection with nearest-alternative search (`detectConflict`). Fully unit-testable. This layer is what the **WhatsApp bot and AI assistant consume directly** — "find me a 40-min slot with Nico" is one `suggestGaps` call, no UI involved.
2. **`use-schedule-dnd.ts` — headless interaction.** Pointer-unified drag/resize (mouse = touch), snap-live proposals, ⌥-duplicate, invalid-drop detection *during* the drag, and `moveBy()` for full keyboard parity (⇧↑↓ = shift by snap, ⇧←→ = change resource). No rendering.
3. **Presentation components** — thin, memoized, semantic-tokens-only, composed by `AppointmentTimeline`.

Because layers 1–2 have no role logic and no data fetching, the same engine powers **admin** (board), **employee** (single, read-mostly), **client** (availability→TimeSlotPicker), **marketplace** (multi-location via `locationId`), **WhatsApp** (headless), **AI** (headless).

## Components delivered

| Component | File | Notes |
|---|---|---|
| AppointmentCard | appointment-card.tsx | All 7 appointment states + 3 sync overlays; density-aware; memo |
| AppointmentTimeline | appointment-timeline.tsx | The composed surface; `variant: board \| single` |
| TimelineGrid | timeline-grid.tsx | Lines + double-click/tap-to-create |
| TimeRuler | timeline-grid.tsx | Hour gutter |
| CurrentTimeIndicator | timeline-grid.tsx | Now line + chip |
| AvailabilityOverlay | timeline-grid.tsx | Shades non-working hours (complement math) |
| GapSuggestion | gap-and-preview.tsx | "30 min · ideal para Barba" → book in place |
| DragPreview | gap-and-preview.tsx | Ghost + live time chip; red when invalid |
| ResourceColumn | gap-and-preview.tsx | Sticky header (barber today, room/station tomorrow) |
| WalkInQueue | queue-conflict-filters.tsx | Waiting list, elapsed time, drag-to-assign |
| ConflictResolver | queue-conflict-filters.tsx | Human dialog: who it collides with + 3 nearest free slots, one tap |
| ScheduleFilters | queue-conflict-filters.tsx | Resource/service/state chips |

## The 14 states — where each lives
Loading → `TimelineSkeleton` (shaped columns) via AsyncPane · Empty → injected `empty` (EmptyState, grid still drawn) · Error → ErrorPane per board · Offline/Syncing/Conflict → per-card `sync` overlays (quiet chips, never blocking) · Pending/Confirmed/Checked-in/In-progress/Completed/Cancelled/No-show → `AppointmentCard state` · Blocked → hatched block regions.

## Interaction requirements — how they're met
- **Keyboard**: cards are focusable buttons; Enter opens actions; ⇧-arrows move/re-assign with the same conflict pipeline as drag; changes announced via `aria-live`.
- **Touch**: pointer events + `touch-none` on cards; 44px+ effective targets; single variant for phones.
- **Drag/resize**: live snapped ghost, invalid-drop shading, ⌥-duplicate.
- **Multi-select ready**: selection is external (`selectedId` prop) — lifting to `selectedIds: Set` requires no internal change.
- **Virtualization ready**: columns render absolutely-positioned children from `place()`; windowing = filter placed items to the scroll viewport before mapping (data contract already position-based).
- **Timezone ready**: all instants ISO-with-offset; display math via per-schedule IANA tz.
- **Multi-location ready**: `locationId` on every entity; a location switch is a filter.

## Performance model
Interaction first: drag paints ONE absolutely-positioned DragPreview per frame — cards never re-layout mid-drag (the dragged card just dims). Commits are optimistic: `onMove` fires immediately; your data layer reconciles and rolls back with `notify({onUndo})` on failure. Cards are `React.memo`. No animation gates any action.

## Files created (8)
`components/scheduling/`: types.ts · engine.ts · use-schedule-dnd.ts · appointment-card.tsx · appointment-timeline.tsx · timeline-grid.tsx · gap-and-preview.tsx · queue-conflict-filters.tsx

## Files modified / deleted
None — the kit is additive. The admin Agenda page rebuild (consuming this kit per the Phase 5 design) is the first task after this review; the old list-based Citas page retires then.

## Not included by design
Data fetching, Supabase queries, permissions — the engine is headless; the page layer owns data (per migration rules).

**Stop point: M4 dedicated review. CRM / POS / Inventory begin only after your approval.**
