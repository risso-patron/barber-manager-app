# M3 — Feedback & Data Components · Drop-in Package

Branch: continues M0 → M1 → M2 → M3.

## The core idea: one state machine

**`AsyncPane`** is the single feedback pattern. Every data surface (table, panel, strip) renders `loading | empty | error | denied | success` through it — no module ever hand-rolls a spinner, an empty div, or an error message again. `paneState()` derives the state from common query flags. This is what guarantees *no duplicated feedback patterns remain*.

All components: semantic tokens only (zero raw hex — brand-aware through BrandProvider automatically), composition-first APIs, WCAG AA (roles, aria-sort, sr-only deltas, keyboard row activation).

## Component APIs

**AsyncPane** — `state, skeleton, empty, error?, deniedSubject?, size, children` · **paneState({loading, error, denied, count})** helper.

**EmptyState** — `icon?, title, description?, action?, secondaryAction?, size: compact|page`. ORNO voice: "Sin citas hoy" + one forward action, never "No data found".

**ErrorPane** — `title?, description?, onRetry?, retryLabel?, size`. Defaults: "No pudimos cargar esta sección · Revisa tu conexión. Tus datos están a salvo." No codes, ever.
**PermissionDenied** — `subject?, size`. Quiet, explains who to ask — not an error, not alarming.

**Skeleton** + presets — `SkeletonRow / SkeletonList(rows) / SkeletonTable(rows) / SkeletonStat` shaped like real content, and **`Delayed(ms=300)`** so skeletons never flash on fast loads. Supersedes M2's minimal skeleton.tsx.

**DataTable&lt;T&gt;** — `columns: {key, header, cell, sortValue?, width?, align?, hideBelow?, numeric?}[], items, rowKey, state, empty, errorProps?, deniedSubject?, onRowClick?, rowActions?, rowHeight=64, aria-label`. Airy 64px rows, sticky header, client sort with `aria-sort`, actions cell isolated from row click, keyboard-activatable rows. **Virtualization-ready:** fixed `rowHeight` contract + `cell` renderers mean the internal map can become a windowed list with zero consumer changes.

**StatCard** — `label, value, deltaPct?, deltaHint?, extra?, href?, loading?`. Value formatting stays at the caller; delta renders arrow+color with sr-only context; `href` = tap-through to Análisis. **StatStrip** — responsive ≤4 grid. Replaces the 6 per-page `useMemo` stat rows.

**PanelCard** — `title, titleAccessory?, action?, footer?, state?, skeleton?, empty?, errorProps?, deniedSubject?, flush?, children`. Card with action slots + built-in AsyncPane — the composition unit for Tu día panels, CRM sections, POS summaries.

**useNotify()** — `notify({kind, title, description?, onUndo?, undoLabel})`. Toast v2 over the existing radix plumbing: success-with-Deshacer (6s), tinted icon per kind, Product Voice enforced by convention (technical details go to telemetry, never the toast).

## Files created (8)
`components/ui/`: async-pane.tsx · empty-state.tsx · error-pane.tsx · skeleton.tsx (replaces M2 minimal) · data-table.tsx · stat-card.tsx · panel-card.tsx · notify.tsx

## Files modified
None beyond the skeleton.tsx replacement. Existing pages migrate opportunistically (M3 provides the pieces; page-by-page adoption happens as modules are rebuilt in M4+/Phase 6 — no big-bang edits, app keeps working).

## Verification
- **No duplicated feedback:** the only loading/empty/error primitives in the codebase live in these 4 files; per-page spinners and ad-hoc empty divs are scheduled out as each page adopts AsyncPane.
- **Future-module coverage:** CRM = DataTable + PanelCard + StatStrip · POS = PanelCard + StatCard + notify(Deshacer) · Inventory = DataTable(rowActions) + StatusBadge + AsyncPane(denied) · Reports = StatCard(href) + DataTable + SkeletonStat. No module needs a new feedback or data pattern.
- **Tenant-aware:** every color is a semantic class; BrandProvider re-brands all of it with no edits.
- **Documented:** this README is the API reference; each file carries usage-note headers.

**Stop point: awaiting review before M4 — Scheduling Kit.**
