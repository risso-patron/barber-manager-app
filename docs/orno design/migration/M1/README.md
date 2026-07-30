# M1 — UI Primitives · Drop-in Package

Sequence: **M0 → M1 → M2 on one branch; merge only when all three work together** (per your instruction). All files copy to the matching paths in `barber-manager-app/`.

## 1. Component inventory (this milestone)

**Forms:** Button · Input · Textarea · Select · Label · Field · CurrencyInput · SearchInput · FormModal · ConfirmDialog
**Data display:** Card (+Header/Title/Description/Content/Footer) · Badge · StatusBadge
**Feedback:** Alert (InlineAlert) · Dialog (base)
**Brand:** Logo · AppIcon · `lib/brand.ts` manifest · BRAND.md rules · site.webmanifest

All primitives: TypeScript types, WCAG AA (contrast, aria wiring, 44px+ targets), keyboard support (radix + native), disabled states, loading where applicable (Button, ConfirmDialog, FormModal), error states where applicable (Input, Textarea, Select, Field), flat Storybook-ready props.

## 2. Props per primitive

- **Button** — `variant: primary|secondary|ghost|destructive|link` (+`default`/`outline` legacy aliases) · `size: lg(48)|md(40)|sm(34)|icon|icon-md` (+`default` alias) · `loading` · `asChild` · native button props. Destructive is now tinted-soft (Constitution: no solid red).
- **Input / Textarea** — native props + `error: boolean` (danger border/ring + `aria-invalid`).
- **Select** — unchanged shadcn/radix API; trigger adds `error`. 48px trigger, overlay shadow content.
- **Label** — unchanged shadcn API.
- **Field** — `label, htmlFor, required, help, error, children`. Wires ids/aria, renders error copy with icon (`role="alert"`).
- **Card** — shadcn API + `interactive: boolean` (hover shadow-raised).
- **Badge** — `variant: neutral|success|warning|danger|info|lavender|terracotta|outline`.
- **StatusBadge** — `status: pending|confirmed|checked_in|in_progress|completed|cancelled|no_show` → icon + Spanish label (estado never color-only).
- **Alert** — `variant: info|success|warning|danger|neutral` · `title` · `action` (+ legacy AlertTitle/AlertDescription exports).
- **Dialog** — unchanged shadcn API, retokened (radius 24, warm scrim, 44px close).
- **ConfirmDialog** — `open, onOpenChange, title, description, confirmLabel, cancelLabel="Volver", tone: danger|default, loading, onConfirm`.
- **FormModal** — `open, onOpenChange, title, description, children, submitLabel="Guardar", cancelLabel, loading, onSubmit, size: sm|md|lg, footer?`.
- **CurrencyInput** — Input props + `symbol="$"`. String value, decimal keyboard, tabular nums.
- **SearchInput** — `value, onValueChange, shortcutHint?` + input props. Esc/× clears.
- **Logo** — `variant: full|mono` · `theme: light|dark` · `height≥20 (default 28)` · `href?`. SVG-first via `brand.assetsReady`, typographic fallback until final art lands.
- **AppIcon** — `size=36, variant: color|mono, framed=true`.

## 3. Files created (16)
`components/ui/`: button, input, textarea, select, label, field, card, badge, alert, dialog, confirm-dialog, form-modal, currency-input, search-input (.tsx)
`components/ui/foundations/`: logo.tsx, app-icon.tsx (supersede M0 versions)
`lib/brand.ts` · `public/site.webmanifest` · `BRAND.md`

## 4. Files modified (replace in repo)
The 10 existing `components/ui/*` primitives are **replaced in place** (same paths, same or superset APIs — imports keep compiling). Plus one exemplar feature migration: `components/admin/appointments/delete-confirm-modal.tsx` → thin wrapper over ConfirmDialog, identical exported API. Replicate the wrapper pattern for the other 4 delete-confirm copies (5-minute mechanical edits; each keeps its own prop names).

## 5. Scheduled for deletion after M2
- 5× `delete-confirm-modal.tsx` wrappers (call-sites move to ConfirmDialog directly)
- 4× sidebars (`admin/layout/admin-sidebar`, `employee/layout/employee-sidebar`, `client/layout/client-sidebar`, `layout/sidebar`) + `layout/footer`
- 2× bottom navs (employee, client)
- Legacy `/dashboard` and `/barber` route trees
- 6× entity modal *shells* (bodies refactor onto FormModal + Field; business logic/queries stay verbatim)
- DM Sans / DM Mono font loads in `app/layout.tsx` (after the 6 `var(--font-dm-sans)` references migrate)

## Brand — architecture for the future identity
Logo/AppIcon read canonical asset paths from `lib/brand.ts`; final art ships by dropping SVGs into `/public/brand/` and flipping `assetsReady: true` — zero component changes. Rules (sizing, safe area, mono, red discipline, favicon + PWA sets) in `BRAND.md`.

## Guarantees
No Supabase queries, permissions, or DB touched. No duplicate components: new primitives replace, never coexist (legacy aliases live inside the same file). App compiles and runs at every step.

**Stop point: awaiting approval for M2 — Application Shell.**
