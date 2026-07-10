import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { FeatureCard } from "./feature-card"
import { SOLUTION } from "./content"

// LAND-1A · Solución (blueprint §5): 8 capacidades reales del producto.

export function SolutionGrid() {
  return (
    <Section id="funciones" tinted innerClassName="py-16 md:py-[88px]">
      <SectionHeading title={SOLUTION.title} className="mb-11" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SOLUTION.cards.map((card) => (
          <FeatureCard key={card.title} {...card} />
        ))}
      </div>
    </Section>
  )
}
