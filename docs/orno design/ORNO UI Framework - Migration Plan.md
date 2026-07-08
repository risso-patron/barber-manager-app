# ORNO UI Framework — Component Inventory & Migration Plan
*v1.0 · July 2026 · Lead Product Designer*

Basis: full audit of `barber-manager-app/components/**` and `app/**`. Governed by the ORNO Design Constitution.

---

## Part A — Audit Findings

### A1. Inventory (39 components found)

**`components/ui` (12 primitives)** — shadcn/radix-based: alert, avatar, badge, button, card, dialog, input, label, select, separator, textarea, toast. Styled via Tailwind semantic tokens (`bg-primary`, `bg-destructive`) that map to the OLD dark theme.

**Module components (27)** — admin (12: 6 CRUD modals + 5 delete-confirm copies + admin-sidebar), auth (3), booking (7), client (5), employee (2), layout (3: legacy sidebar/footer), dashboard (1: stats-card), theme-provider.

### A2. Duplication detected

| Pattern | Copies | Evidence |
|---|---|---|
| Delete-confirm modal | **5** | appointments, clients, employees, inventory, services — identical logic, drifted styles (one is even light-themed while the app is dark) |
| Sidebar | **4** | admin-sidebar, employee-sidebar, client-sidebar, legacy `layout/sidebar` — same structure, copy-pasted inline styles |
| Bottom nav | **2** | employee + client, near-identical |
| CRUD entity modal | **6** | appointment/client/employee/inventory/service/loyalty modals — same shell (overlay, header, form, footer) rebuilt each time |
| Stats card row | **7** | `const stats = useMemo` in 6 admin pages + dashboard stats-card — computed and rendered ad hoc per page |
| Logo mark | **5** | Ornō wordmark re-implemented inline in every sidebar + footer |

### A3. Inline styles

~120 `style={{ }}` occurrences concentrated in: all 4 sidebars, both bottom navs, inventory-modal (30+ hardcoded hex values: `#1A1A1A`, `#2E2E2E`, `#8A8A8A`, `#E53935`), employee delete-modal (`zIndex: 9999` hack). Three styling systems coexist: Tailwind tokens, Tailwind utilities with raw hex, and inline style objects. **The design system doc exists but nothing enforces it.**

### A4. Repeated page-level patterns (currently unextracted)

Page header (title + subtitle + primary action) · stats strip · filter toolbar (search + selects) · entity table with row actions · demo-mode data fallback embedded in every page · loading spinner per page · per-module empty states.

---

## Part B — The ORNO UI Framework

Component taxonomy. Names in Spanish where they face content, English for primitives. All styled exclusively from Foundations tokens — zero raw hex outside `foundations/`.

### 1. Foundations `ui/foundations`
- **tokens.ts / globals.css** — CSS variables from the Constitution: surfaces (`--bg`, `--bg-2`, `--card`, `--border`), sage scale, accents, semantic, warm ink scale, radius (14/20/24/999), shadows (resting/raised/overlay), motion (120/200/250ms, one curve), type scale, 8pt spacing
- **Icon** — lucide wrapper, stroke 1.75, sizes 16/20
- **Logo** — the single Ornō wordmark component (kills 5 copies)
- **ThemeProvider** — light default; dark = future token remap

### 2. Layout `ui/layout`
- **AppShell** (sidebar + header + content, per Phase 3) · **PageHeader** (title, subtitle, actions) · **Section** · **CardGrid** · **Toolbar** (filters+search row) · **BottomSheet** (mobile)

### 3. Navigation `ui/nav`
- **Sidebar** (one, role-configured by nav manifest) · **SidebarItem** · **BottomNav** (one, role-configured) · **SegmentedTabs** · **Breadcrumbs** · **CommandPalette** (⌘K) · **ShopSelector** · **UserMenu** · **NotificationsPopover**

### 4. Forms `ui/forms`
- **Button** (primary/secondary/ghost/destructive-soft; heights 48/40/34) · **Input** · **Textarea** · **Select** · **SearchInput** · **Label + Field** (label+control+help+error as one unit) · **CurrencyInput** · **PhoneInput** · **Checkbox/Switch** · **FormModal** (the one CRUD modal shell) · **ConfirmDialog** (the one delete/confirm modal)

### 5. Feedback `ui/feedback`
- **Toast** (with Deshacer) · **InlineAlert** · **EmptyState** (icon+line+action) · **Skeleton** (+ presets: list, table, timeline) · **ErrorPane** (retry) · **Spinner** (rare, >300ms only) · **ProgressBar**

### 6. Data Display `ui/data`
- **DataTable** (airy rows, sort/filter, sticky header, row actions) · **StatCard** + **StatStrip** · **Badge** (estado siempre icono+texto) · **Avatar** + **AvatarStack** · **ClientChip** · **KeyValueList** · **Sparkline**

### 7. Scheduling `ui/scheduling` — flagship kit
- **CalendarBoard** (day/week grid engine) · **BarberColumn** · **AppointmentCard** (8 states) · **NowLine** · **GapSlot** · **BlockedRegion** · **TimeSlotPicker** (shared: booking público + admin) · **DatePickerStrip** · **WalkInRail** · **AppointmentActionSheet** · **DragLayer** (move/resize/duplicate + conflict shake)

### 8. Commerce `ui/commerce`
- **POSCart** · **ProductGrid** · **Keypad** · **PaymentMethodPicker** · **DiscountTipRow** · **ReceiptView** (WhatsApp/print) · **CashDrawerSummary** (corte de caja) · **StockBadge** · **MovementRow** (inventario v2)

### 9. CRM `ui/crm`
- **ClientCard** · **ClientRecord** (header: LTV, habitual, no-show risk) · **VisitTimeline** · **NotesPanel** (prominent) · **LoyaltyProgress** · **SegmentPill** ("Frecuentes", "En riesgo >45d") · **RatingStars** · **WhatsAppTemplateButton**

### 10. Employee `ui/employee`
- **ChairTimeline** (my day) · **NextClientCard** · **FichajeButton** (one giant target + history) · **PerformancePanel** · **AvailabilityEditor** (bloqueos self-service)

### 11. Reports `ui/reports`
- **MetricCard** (value+trend+tap-through) · **PeriodPicker** · **BarList** · **TrendChart** (quiet, one accent) · **ComparisonRow** · **ExportButton**

---

## Part C — Verdict on every existing component

**KEEP (structure) — 6** *(logic/markup sound; restyle to new tokens)*
- `ui/toast` — good queue + a11y; retoken, add Deshacer
- `ui/dialog`, `ui/label`, `ui/separator`, `ui/avatar` — thin, fine
- `booking/Stepper` — solid a11y; restyle, add persistent summary

**REFACTOR — 14** *(keep API, rebuild internals on tokens)*
- `ui/button` → new variants/heights (48/40/34, radius 14); kill `destructive` solid-red → destructive-soft
- `ui/input`, `ui/textarea`, `ui/select` → 48px, radius 14, sage focus ring; wrap in **Field**
- `ui/card` → radius 20, resting/raised elevation
- `ui/badge` → estado pills (icon+text, tinted bgs)
- `ui/alert` → InlineAlert tiers
- `booking/Calendar`, `booking/TimeSlot` → become **TimeSlotPicker** (shared)
- `booking/ServiceCard`, `booking/BarberCard`, `booking/BookingSummary` → retoken, keep flow
- `auth/login-form`, `auth/register-form` → Field-based, light theme
- `dashboard/stats-card` → **StatCard** with trend + tap-through

**REPLACE — 13** *(rebuild on framework; migrate usages)*
- 5× `delete-confirm-modal` → **ConfirmDialog** (one)
- 6× entity modals (appointment/client/employee/inventory/service/loyalty) → **FormModal** + Field composition (inventory-modal's 30+ hardcoded dark hex dies here)
- `admin-sidebar`, `employee-sidebar`, `client-sidebar` → **Sidebar** (one, nav manifest per role)
- `employee-bottom-nav`, `client-bottom-nav` → **BottomNav** (one)

**DELETE — 4**
- `layout/sidebar` (legacy `/dashboard` route) · `layout/footer` (rebuild inside new public landing later) · `booking/signup-prompt-modal` (guest→account conversion moves into confirmation screen, Phase 8) · demo-mode blocks inside pages (move to a `useDemoData` provider — not UI)

**KEEP AS-IS — 2**
- `theme-provider` (becomes token host) · `auth/terms-modal` (content modal, retoken only)

Net effect: **39 components → ~24 survive as 17 framework pieces**, plus the new kits (Scheduling, Commerce, CRM, Employee, Reports) that don't exist today.

---

## Part D — Migration Roadmap

**M0 · Foundations (1 sprint)** — Ship `tokens.css` + tailwind config mapped to Constitution values; Logo, Icon, ThemeProvider. Old screens keep working (tokens flip `bg-primary` from red/dark to sage/light — expect visual churn only on `ui/*` consumers).
- *Exit: zero raw hex in `ui/`; light theme renders.*

**M1 · Core primitives (1–2 sprints)** — Refactor Button/Input/Select/Card/Badge/Field; build ConfirmDialog + FormModal; migrate the 11 modal copies to them. Delete the 5 delete-confirm files.
- *Exit: one modal shell in the codebase; modals count 11→2.*

**M2 · Shell (1 sprint)** — AppShell, Sidebar, BottomNav, PageHeader, Toolbar, CommandPalette, NotificationsPopover. Kill `/dashboard` + `/barber` legacy routes and `layout/sidebar`. All three roles mount the same shell with role manifests.
- *Exit: 4 sidebars → 1; new IA live (Phase 3 design).*

**M3 · Feedback + Data (1 sprint)** — EmptyState, Skeleton presets, ErrorPane, Toast v2, DataTable, StatStrip. Replace the 6 per-page `useMemo` stat rows and per-page spinners.
- *Exit: every list has skeleton + empty + error; tables share DataTable.*

**M4 · Scheduling kit (2–3 sprints, flagship)** — CalendarBoard + cards + drag + gaps + WalkInRail + TimeSlotPicker. Rebuild admin Agenda (Phase 5 design) and swap the booking flow's picker to the shared one.
- *Exit: Citas list retired; the calendar is the day's workbench.*

**M5 · Commerce + CRM kits (2 sprints)** — POS pieces + ClientRecord family. Powers Phase 6 screens.

**M6 · Employee + Reports kits (1–2 sprints)** — Powers Phases 7–8.

Rules for the whole migration: no new screen may import from `components/admin|client|employee` legacy folders; every PR that touches a page must migrate that page's primitives; storybook-style gallery page (`/design`) documents each framework piece as it lands.

---

*Approve this framework (or amend the taxonomy/verdicts) and M0 begins.*
