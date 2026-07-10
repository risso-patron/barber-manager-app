import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { ModuleCard } from "./module-card"
import { MODULES } from "./content"

// LAND-1A · Módulos (blueprint §7): los 8 módulos REALES del producto.
// Facturación y demás features futuras viven en "En desarrollo" (plan §2.4).

export function ModulesGrid() {
  return (
    <Section id="modulos" tinted innerClassName="py-16 md:py-20">
      <SectionHeading title={MODULES.title} className="mb-11" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.cards.map((card) => (
          <ModuleCard key={card.title} {...card} />
        ))}
      </div>
    </Section>
  )
}
