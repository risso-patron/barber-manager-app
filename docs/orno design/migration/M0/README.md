# M0 — Design Tokens · Drop-in Package

Copy each file to the matching path in `barber-manager-app/`:

| Package file | Repo destination | Action |
|---|---|---|
| `app/globals.css` | `app/globals.css` | **Replace** |
| `tailwind.config.ts` | `tailwind.config.ts` | **Replace** |
| `app/layout.tsx` | `app/layout.tsx` | **Replace** |
| `lib/tokens.ts` | `lib/tokens.ts` | **New** |
| `components/ui/foundations/logo.tsx` | same | **New** |
| `components/ui/foundations/icon.tsx` | same | **New** |

## 1. What changed

- **`:root` semantic variables flipped** from cold neutral to the Constitution's warm light palette (bg `#FAF9F7`, card white, border `#E8E4DE`, primary sage `#5F9F77`, ring sage, destructive `#C24E42`, warm ink foregrounds). Same shadcn HSL convention — every existing `bg-primary` / `text-muted-foreground` consumer re-themes automatically, zero component edits.
- **`[data-theme="orno-admin"]` dark-shell block removed.** Pages that still set the attribute simply fall through to `:root` (light). Nothing breaks; the dark shell just stops existing.
- **`--radius` 0.5rem → 0.875rem (14px)**; new `rounded-card` (20) / `rounded-modal` (24) utilities.
- **Status/category/stock utility classes retokened** (`.orno-status-*`, `.orno-cat-*`, `.orno-stock-*`) to warm tinted-pill values — same class names, so appointment tables, inventory badges etc. keep working untouched.
- **Focus ring**: global `#E53935` outline → sage, per Constitution (red is brand-only).
- **Fonts**: Inter becomes `--font-sans` (body default). Cormorant Garamond stays (wordmark). DM Sans/DM Mono **stay loaded** during M0 because 6 components reference `var(--font-dm-sans)` directly — they migrate off it in M1, then the fonts get dropped.
- **Tailwind config extended** (additive): `sage` scale, muted accents (terracotta/beige/dustyblue/lavender), warm `ink` scale, semantic `success/warning/danger`, brand red as `brand`, shadows `resting/raised/overlay`, `ease-orno` + durations, `tabular-nums` plugin-free utility.
- **New foundations**: `<Logo />` (the one wordmark — replaces 5 inline copies in M2), `<Icon />` (lucide at stroke 1.75), `lib/tokens.ts` (typed constants for charts/canvas code that can't use CSS vars).

## 2. Modified files
`app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`.

## 3. Deleted components
None yet (M0 is tokens only). The `[data-theme="orno-admin"]` CSS block is deleted *within* globals.css.

## 4. Impact

- **No business logic, queries, permissions, or DB touched.** CSS + config + 3 tiny new files.
- The whole app turns warm-light in one commit. Screens built on semantic tokens (all `ui/*` primitives, most pages) look correct immediately.
- **Known visual debt surfaced, not created:** the ~120 hardcoded dark inline styles (4 sidebars, inventory-modal, bottom navs) will look wrong-on-light until M1/M2 replaces them — this is the forcing function. If you want a softer landing, apply M0 on a branch and merge together with M1+M2.
- `next/font` Geist imports kept (Geist Mono still referenced); Inter added via `next/font/google`.

## 5. Verify after applying
1. `npm run dev` — app renders light warm everywhere.
2. Check `/admin/appointments` badges (should be tinted pills, readable).
3. Tab through a form — focus ring is sage.
4. No TypeScript errors from `lib/tokens.ts` imports (it's unused until M1 — safe).

**Stop point: awaiting your approval to proceed to M1.**
