# ORNO — Project Instructions

## Design Constitution (highest priority — overrides existing UI)

ORNO is a barbershop management SaaS. Personality: **warm, elegant, premium, human, minimal, approachable**. Never cold, corporate, or intimidating. Reference: Apple, Airbnb, Notion. NOT dark dashboards or enterprise software.

### Tokens (canonical)
- Background: `#FAF9F7` (warm off-white) · Secondary bg: `#F4F2EE` · Cards: `#FFFFFF` · Borders: `#E8E4DE`
- Primary: soft sage green `#5F9F77` (hover `#4C8862`, tint `#EAF2ED`, deep text `#3E7354`)
- Accents (muted, sparing): terracotta `#C57B57` · warm beige `#CBB595` · dusty blue `#7E9BB4` · muted lavender `#A79CC0`
- ORNO Red `#E53935` = signature brand mark only (logo accent, rare brand moments). NEVER the interface color, never errors.
- Semantic: success `#4E8A64` · warning `#B98A2E` · danger `#C24E42`
- Ink (warm): `#26231F` primary · `#57534B` secondary · `#8A847A` tertiary (large text only)

### Type
Inter (fallback Manrope). Headings: Inter 600, -0.02em tracking, elegant. Body 15px, comfortable. Numbers: tabular-nums. Cormorant Garamond only for the Ornō wordmark.

### Geometry & elevation
8-point grid, generous whitespace. Radius: buttons/inputs 14px · cards 20px · modals 24px · pills 999px. Shadows: nearly invisible — `0 1px 2px rgba(38,35,31,.04), 0 4px 16px rgba(38,35,31,.05)`; overlays `0 16px 48px rgba(38,35,31,.14)`.

### Rules
- UX writing: human Spanish ("Tu día" not "Dashboard", "Equipo" not "Manage Employees")
- Every screen answers: Where am I? What should I do? What deserves attention? What happens next?
- WCAG AA, ≥44px targets, visible focus rings, keyboard nav
- Animations fast/subtle/meaningful (150–250ms), never decorative
- Tables airy with large row height; buttons large and rounded; forms minimal with clear error copy
- Everything reusable — no isolated UI
- Never redesign just to be prettier: every decision must improve usability, clarity, trust or productivity

### Approved phase order
1 Tokens/Foundations · 2 Component Library · 3 App Shell · 4 Dashboard "Tu día" · 5 Agenda Calendar (flagship) · 6 CRM/POS/Inventory/Reports/Billing/Settings · 7 Employee · 8 Customer · 9 Onboarding Wizard

Source codebase is mounted at `barber-manager-app/` (Next.js + Supabase, lucide icons). Full roadmap: `ORNO UX Redesign Roadmap.md`.
