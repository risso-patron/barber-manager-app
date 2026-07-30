# LAND-1 IMPLEMENTATION PLAN

> Plan de implementación de la Landing pública v1.2.
> Especificación fuente: `docs/orno design/v1.2 - Landing Barberia Humana.dc.html` (commit `3de35dd`).
> Política vigente (usuario, 2026-07-10): **la Landing representa el producto real** — ningún claim de funcionalidad inexistente; las opciones son bajar el copy, marcar "En desarrollo", o construir primero. Nunca prometer falso.
> Evidencia de producto: Product Readiness Report (2026-07-10) + auditoría general del proyecto.

---

## 1. Inventario completo de secciones del blueprint

| # | Sección | Estado | Motivo |
|---|---|---|---|
| 1 | Navbar sticky | **Adaptado** | CTA "Organizar mi barbería" → "Solicitar una demo" (LAND-0); `/login` → `/auth/login` (ruta real) |
| 2 | Hero (foto + 3 chips flotantes) | **Adaptado** | Copy del H1/sub es verdad verificada; solo cambia el CTA. Los 3 chips son features reales (citas del día, ingresos del día, `suggestGaps` del engine M4) |
| 3 | Franja de confianza | **Implementado igual** | Claims genéricos verdaderos (agenda clara, equipo alineado, ingresos visibles) |
| 4 | El problema (8 dolores) | **Implementado igual** | Describe dolores, no promete features |
| 5 | Solución (8 cards) | **Adaptado** | 6/8 verdad; card Inventario y card Alertas bajan su copy (ver §2) |
| 6 | Un día con ORNO (4 momentos) | **Implementado igual** | Los 4 momentos son flujos reales (revisar agenda, agenda por barbero, registrar cobro, cierre del día) |
| 7 | Módulos (10 cards) | **Adaptado** | 8 reales se quedan; Facturación y features futuras se mueven a la nueva sección "En desarrollo" (ver §2) |
| 8 | Dueño / Equipo / Cliente | **Adaptado leve** | Todos los puntos son verdad; se revisa punto por punto en la checklist de copy |
| 9 | Manifiesto (foto full-bleed) | **Implementado igual** | Copy aspiracional sin promesa funcional |
| 10 | Planes (3 cards con precios) | **Adaptado** | LAND-0: sin precios. Se reemplaza por banner "Planes — Próximamente · Contáctanos para conocer el plan adecuado" (ver §2) |
| 11 | Testimonios (3 quotes) | **Descartado** | Los testimonios del blueprint son ficticios (Luis M., Carolina P., Nico G. no existen). Regla 1: un testimonio inventado es una promesa falsa. Vuelve cuando existan clientes reales que lo firmen |
| 12 | FAQ (6 preguntas) | **Adaptado** | 4/6 requieren reescritura: eliminan referencias a planes con precio, "app móvil propia" y "crea tu cuenta gratis" (ver §2) |
| 13 | CTA final (fondo ink) | **Adaptado** | CTAs → "Solicitar una demo" + "Iniciar sesión" |
| 14 | Footer | **Adaptado** | Links reales: `/privacy`, `/terms`, `mailto:hola@orno.app`, `/auth/login`. Sin GitHub/MIT (la landing deja de hablarle a developers) |
| — | **"En desarrollo" (NUEVA)** | **Agregado** | Sección explícita exigida por LAND-0 para features futuras, separada de lo existente |

## 2. Adaptaciones de copy — qué cambia y por qué

### 2.1 CTA principal (global: navbar, hero, CTA final)
- ❌ "Organizar mi barbería" / "Crear mi barbería" — no existe onboarding SaaS (el registro actual crea `role: "client"`).
- ✅ **"Solicitar una demo"** → destino: `mailto:hola@orno.app` con subject prellenado (`?subject=Quiero una demo de ORNO`). Es el único flujo de contacto que ya existe (footer actual); no se inventa ninguno nuevo.
- ✅ Secundario: "Iniciar sesión" → `/auth/login`; "Ver cómo funciona" → `#como` (ancla interna).

### 2.2 Card Solución · Inventario
- ❌ "Se descuenta solo y avisa antes de que falte" — `app/api/pos/route.ts` no toca inventario; el aviso es solo indicador visual de `min_stock`.
- ✅ "Stock y movimientos registrados, con mínimos siempre a la vista." (verdad: inventario + inventory_movements + min_stock existen)
- El descuento automático va a "En desarrollo".

### 2.3 Card Solución · Alertas
- ❌ "Cancelaciones, stock bajo y cobros pendientes" — cobros pendientes no existe; stock bajo es visual, no notificación.
- ✅ "Recordatorios de citas para tus clientes, automáticos." (infraestructura real: `notification_queue` + edge function; se declara como capacidad del producto, no promesa de canal específico)

### 2.4 Módulos (10 → 8 reales + En desarrollo)
Quedan (copy verificado): Agenda · Citas · Clientes · Barberos · Caja/POS · Inventario (copy §2.2) · Dashboard ("Cómo va tu negocio, en una mirada") · Reservas online ("Tus clientes reservan desde un enlace, sin instalar nada" — reemplaza a la card "Integraciones", cuyo único claim real es este).
Se mueven a **En desarrollo**: Facturación (comprobantes) · Recordatorios por WhatsApp (hasta activar Twilio en producción) · Multi-sucursal · App móvil del equipo · Descuento automático de inventario · Recomendaciones de compra · IA.

### 2.5 Sección "En desarrollo" (nueva)
- Ubicación: después de Módulos, antes de Dueño/Equipo/Cliente.
- Diseño: mismas cards de módulo con badge `Próximamente` (Badge tint neutral del sistema visual) y opacidad reducida — visualmente separadas, imposible confundirlas con lo existente.
- Copy de cabecera: "Lo que viene — esto estamos construyendo."

### 2.6 Planes
- Se conserva el ancla `#planes` y el heading "Un plan para cada silla".
- Contenido: banner único (no 3 cards con precios): "Estamos definiendo los planes. Contáctanos y te ayudamos a encontrar el adecuado para tu barbería." + CTA "Solicitar una demo".
- Sin nombres de plan, sin precios, sin feature-lists por plan (el plan Cadena prometía multi-local/white-label inexistentes).

### 2.7 FAQ (6 → 6 reescritas)
| # | Blueprint | Acción |
|---|---|---|
| 1 | "¿Sirve para barberías pequeñas? … plan Silla gratis" | Reescribir: "Sí — ORNO funciona igual de bien para un barbero independiente que para un equipo completo." |
| 2 | "¿Varios empleados? … sin límite en Estudio y Cadena" | Reescribir sin planes: "Sí, sin límite de barberos. Cada uno con su horario y su agenda." (verdad) |
| 3 | "¿Citas e ingresos del día?" | Igual (verdad) |
| 4 | "¿Funciona desde el celular? … su propia app móvil" | Reescribir: "Sí — funciona en el navegador del celular, tanto para ti como para tu equipo." (web responsive es verdad; app móvil NO) |
| 5 | "¿Sin instalar nada?" | Igual (verdad) |
| 6 | "¿Puedo empezar con una demo? … crea tu cuenta gratis" | Reescribir: "Claro — escríbenos y te mostramos ORNO en acción con datos reales de una barbería." |

## 3. Componentes necesarios

Árbol nuevo (la Landing es producto independiente — no toca `components/ui/` ni módulos admin):

```
components/landing/
  shared/       Section.tsx (wrapper de ancho/padding/fondo alternado)
                SectionHeading.tsx (eyebrow + título + sub, center/left)
                LandingCta.tsx (CTA 52px primario/secundario sobre <Link>/<a>)
                ImagePlaceholder.tsx (slot de foto con tinte sage/beige + hint, LAND-1)
  nav/          LandingNav.tsx (sticky, blur; isla client solo para menú mobile)
  hero/         Hero.tsx · FloatingChip.tsx
  problem/      ProblemSection.tsx (grid 2-col de dolores)
  features/     SolutionGrid.tsx + FeatureCard.tsx (acentos sage/dustyblue/terracotta)
                ModulesGrid.tsx + ModuleCard.tsx
                ComingSoonGrid.tsx (En desarrollo — ModuleCard + badge Próximamente)
  workflow/     DayFlow.tsx + DayFlowRow.tsx (foto 96px + hora + título)
  audiences/    AudienceCards.tsx (Dueño/Equipo/Cliente)
  manifesto/    ManifestoBanner.tsx (foto full-bleed + gradiente + quote)
  pricing/      PricingSoon.tsx (banner Próximamente + CTA)
  faq/          FaqSection.tsx + FaqItem.tsx (details/summary nativo — cero JS)
  final-cta/    FinalCta.tsx (fondo ink)
  footer/       LandingFooter.tsx
```

Notas: carpeta `testimonials/` del árbol propuesto queda **omitida** (sección descartada §1.11); se crea cuando existan testimonios reales. Todo el copy vive en un `content.ts` por sección (datos separados de presentación, mismo patrón del blueprint con `renderVals`). Del framework se reutilizan **tokens, fuentes (ya cargadas en `app/layout.tsx`, Cormorant incluida) e iconos lucide** — los componentes visuales de landing son de landing: escala tipográfica y radios distintos al app shell (50px hero, cards 20-24px), no se fuerzan primitivos de formulario donde no hay formularios.

## 4. Assets necesarios

| Asset | Cantidad | LAND-1 | LAND-2 |
|---|---|---|---|
| Fotos editoriales (hero 4:5, problema 4:3, day-flow ×4 (96px), audiencias ×3 (16:10), manifiesto full-bleed) | ~10 | `ImagePlaceholder` con tinte cálido + descripción del hint del blueprint | Fotos definitivas (decisión pendiente: stock curado vs sesión propia) vía `next/image` |
| Wordmark "Ornō." | 1 | Texto Cormorant Garamond (ya cargada) — sin asset | — |
| Favicon / OG image | 1+1 | Favicon existente | OG image 1200×630 con tokens ORNO |
| Iconos | ~30 | `lucide-react` (instalado, tree-shaken) | — |

## 5. Roadmap de implementación y milestones

| Milestone | Alcance | Tamaño |
|---|---|---|
| **LAND-1a** | `components/landing/shared|nav|hero|problem|features|workflow` + `content.ts` por sección + `app/page.tsx` reescrito como Server Component consumiendo secciones 1-7 (+ En desarrollo) con placeholders | M |
| **LAND-1b** | `audiences|manifesto|pricing|faq|final-cta|footer` + **eliminación completa del legacy**: `page.module.css` (809 líneas) y todo el JSX viejo. Validación completa + Acceptance Report | M |
| **LAND-2** | SEO/metadata/OG/JSON-LD, fotos definitivas con `next/image`, auditoría Lighthouse + axe, ajuste responsive fino, ADR + sync Brain | S/M |

Un commit por milestone, aprobación por commit (convención del proyecto). El copy adaptado de §2 se congela en este plan — cualquier cambio de copy durante la implementación se trae de vuelta a aprobación, no se improvisa.

## 6. Criterios de aceptación (objetivos, verificables)

1. **Verdad de producto**: checklist §2 completa — cero ocurrencias de: precios, "app móvil", "multi-sucursal"/"varios locales", "white label"/"tu propia marca", "se descuenta solo", "recomendaciones de compra", "comprobantes por WhatsApp", "Organizar/Crear mi barbería", testimonios ficticios. Verificable por grep sobre `app/page.tsx` + `components/landing/`.
2. **Tokens**: grep paleta Tailwind cruda = 0, hex inline = 0, `style={{` = 0 en `components/landing/` + `app/page.tsx` (excepción documentada si un gradiente de foto lo exige — se resuelve con clase).
3. **Legacy extinto**: `app/page.module.css` eliminado; `git grep "page.module.css"` = 0.
4. **RSC**: `app/page.tsx` sin `"use client"`; islas client ≤ 1 (menú mobile). FAQ funciona sin JavaScript.
5. **Responsive**: sin scroll horizontal ni solapamientos en 390 / 768 / 1024 / 1440 (screenshots Playwright en el Acceptance Report).
6. **Accesibilidad**: navegación completa por teclado, focus visible, un solo `h1`, jerarquía de headings correcta, landmarks (`header/nav/main/footer`), targets ≥44px, `prefers-reduced-motion` respetado, axe sin errores críticos.
7. **Validación estándar**: type-check · lint · vitest verdes; smoke E2E (carga, anclas, CTA mailto, FAQ expande, login navega).
8. LAND-2 agrega: Lighthouse ≥ 90 en Performance/SEO/Accessibility/Best Practices (mobile), metadata OG completa, imágenes con `alt` real.

## 7. Estrategia responsive

Mobile-first con Tailwind. Traducción de los `flex-wrap + min-width` del blueprint a grid/flex con breakpoints: hero apila (texto → foto) bajo `lg`; chips flotantes se vuelven una fila estática bajo la foto en `<md` (flotar sobre foto en pantalla chica rompe legibilidad); grids de cards `1 → 2 → 3/4` columnas (`sm/md/xl`); day-flow con foto 96px mantiene fila con wrap del título; navbar colapsa links centrales en menú mobile (única isla client), CTAs siempre visibles; manifiesto reduce altura y aumenta el gradiente para contraste del texto en mobile.

## 8. Estrategia de performance

`app/page.tsx` como **Server Component** — HTML estático, cero fetch, cero Supabase. JS del cliente ≈ solo la isla del menú mobile. FAQ con `details/summary` (sin acordeón JS). Animaciones de entrada: CSS puro (`@keyframes` + `animation-timeline` no — compatibilidad; usar transición simple en carga o nada), gated por `prefers-reduced-motion`; el `orno-pulse` del chip del hero se conserva (CSS puro, decorativo-informativo). Fuentes ya optimizadas con `next/font` (self-host + swap). LAND-2: fotos con `next/image` (sizes correctos, `priority` solo el hero), OG estática. Presupuesto: LCP < 2.5s mobile, cero CLS (aspect-ratio reservado en todos los slots de imagen).

## 9. Estrategia SEO

Next Metadata API en `app/page.tsx`: `title` ("ORNO — La forma más simple de controlar tu barbería"), `description` (sub del hero), OpenGraph + Twitter card, `metadataBase`, canonical. HTML semántico: `h1` único (hero), secciones con `h2`, `<nav>`/`<main>`/`<footer>`. JSON-LD `SoftwareApplication` (solo propiedades verdaderas: sin `offers` mientras no haya precios; `FAQPage` schema con las 6 FAQ reescritas). `robots` permitido, sitemap si no existe (LAND-2). El copy en español coherente con el mercado objetivo; sin keyword stuffing — el blueprint ya escribe para humanos.

## 10. Estrategia de accesibilidad

WCAG AA (Constitution): contraste verificado por par de tokens usado (ink-primary sobre `#FAF9F7` y `#F4F2EE`; `#8A847A` solo en texto ≥ tamaño grande, como manda la Constitution); focus ring visible en todos los interactivos (mismo patrón `ring` del framework); FAQ con `details/summary` = teclado y screen reader nativos; chips flotantes del hero como contenido real (no `aria-hidden`) con orden de lectura lógico; imágenes con `alt` descriptivo real (LAND-2) y `alt=""` para las puramente decorativas; gradiente del manifiesto garantiza AA del texto sobre foto (overlay mínimo garantizado aunque la foto sea clara); `prefers-reduced-motion` desactiva pulse y entradas.

---

**Gate**: este plan requiere aprobación explícita antes de escribir una línea de código. Los cambios de copy (§2) quedan congelados como parte de la aprobación.
