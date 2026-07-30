# ORNŌ — Brand Usage Rules
*Framework M1 · governs `components/ui/foundations/logo.tsx`, `app-icon.tsx`, `lib/brand.ts`*

## The mark
The Ornō wordmark: Cormorant Garamond 500, tracking −0.02em, ink `#26231F`, with the **ō accent in Ornō Red `#E53935`** — the only place red lives by default.

## Red discipline
`#E53935` is a signature, not a palette. Allowed: wordmark accent, app icon dot, rare brand moments (splash, receipt header). Forbidden: buttons, links, errors, charts, active states — those belong to sage and the semantic colors.

## Sizing
- Minimum height: **20px** on screen, 6mm in print. Below that, use the app icon instead.
- Defaults: sidebar 28px · auth screens 44px · marketing 56px+.
- Never stretch, recolor, outline, shadow, or italicize.

## Safe area
Clear space = **height of the "O" × 0.5** on all four sides. Nothing enters it — not badges, not borders, not text.

## Variants (canonical asset names, `/public/brand/`)
| File | Use |
|---|---|
| `logo-full-light.svg` | Color wordmark on light surfaces (default) |
| `logo-full-dark.svg` | Color wordmark on dark/photo surfaces |
| `logo-mono-light.svg` | Single ink `#26231F` — print, engraving, co-brand |
| `logo-mono-dark.svg` | Single white — dark mono contexts |
| `app-icon.svg` | Master square monogram ("O.") |
| `app-icon-mono.svg` | Mono monogram |

**SVG-first:** all masters are SVG. Raster only where platforms demand PNG (favicons, PWA, apple-touch).

## Swap protocol
Final brand art lands by (1) dropping the files above into `/public/brand/`, (2) flipping `brand.assetsReady = true` in `lib/brand.ts`. No component changes. Until then, `<Logo/>` and `<AppIcon/>` render the typographic fallback.

## Favicon set (`/public/favicon/`)
`favicon.ico` (16+32+48) · `favicon-16x16.png` · `favicon-32x32.png` · `apple-touch-icon.png` (180×180, opaque `#FAF9F7` bg, no rounding — iOS rounds it).

## PWA icon set (`/public/brand/`)
`app-icon-192.png` · `app-icon-512.png` · `app-icon-maskable-512.png` (art inside the inner 80% safe zone, bg `#FAF9F7` full-bleed). Declared in `public/site.webmanifest`; theme color `#FAF9F7`.

## Dark variants
Light is the product. Dark variants exist for photos, splash screens and the future dark theme — never mix themes in one view.
