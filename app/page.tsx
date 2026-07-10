import { LandingNav } from "@/components/landing/nav/landing-nav"
import { Hero } from "@/components/landing/hero/hero"
import { TrustStrip } from "@/components/landing/features/trust-strip"
import { ProblemSection } from "@/components/landing/problem/problem-section"
import { SolutionGrid } from "@/components/landing/features/solution-grid"
import { DayFlow } from "@/components/landing/workflow/day-flow"
import { ModulesGrid } from "@/components/landing/features/modules-grid"
import { ComingSoonGrid } from "@/components/landing/features/coming-soon-grid"

// LAND-1A · Landing pública v1.2 — secciones 1-7 del blueprint + "En desarrollo".
// Server Component: cero JS de cliente salvo la isla LandingNav (menú mobile).
// LAND-1B agrega: audiencias (#como), manifiesto, planes (#planes), FAQ (#faq),
// CTA final y footer. Spec: docs/orno design/v1.2 - Landing Barberia Humana.dc.html
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
        <ModulesGrid />
        <ComingSoonGrid />
      </main>
    </div>
  )
}
