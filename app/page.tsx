import { LandingNav } from "@/components/landing/nav/landing-nav"
import { Hero } from "@/components/landing/hero/hero"
import { TrustStrip } from "@/components/landing/features/trust-strip"
import { ProblemSection } from "@/components/landing/problem/problem-section"
import { SolutionGrid } from "@/components/landing/features/solution-grid"
import { DayFlow } from "@/components/landing/workflow/day-flow"
import { AudienceCards } from "@/components/landing/audiences/audience-cards"
import { ModulesGrid } from "@/components/landing/features/modules-grid"
import { ComingSoonGrid } from "@/components/landing/features/coming-soon-grid"
import { ManifestoBanner } from "@/components/landing/manifesto/manifesto-banner"
import { PricingSoon } from "@/components/landing/pricing/pricing-soon"
import { FaqSection } from "@/components/landing/faq/faq-section"
import { FinalCta } from "@/components/landing/final-cta/final-cta"
import { LandingFooter } from "@/components/landing/footer/landing-footer"

// Landing pública v1.2 — representación oficial del estado del producto.
// Orden narrativo aprobado (2026-07-10): Hero → Confianza → Problema →
// Solución → Un día con ORNO → Audiencias (bloque "Cómo funciona") →
// Módulos → En desarrollo → Manifiesto → Planes (Próximamente) → FAQ →
// CTA → Footer. Server Component; única isla client: LandingNav.
// Spec: docs/orno design/v1.2 - Landing Barberia Humana.dc.html
// · Plan: docs/orno design/LAND-1 IMPLEMENTATION PLAN.md (copy congelado).

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <SolutionGrid />
        <DayFlow />
        <AudienceCards />
        <ModulesGrid />
        <ComingSoonGrid />
        <ManifestoBanner />
        <PricingSoon />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
