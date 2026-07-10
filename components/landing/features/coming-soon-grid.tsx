import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { ModuleCard } from "./module-card"
import { COMING_SOON } from "./content"

// LAND-1A · En desarrollo (plan §2.5): features futuras, explícitamente
// separadas de lo existente. Regla 1: nunca vender una función inexistente.

export function ComingSoonGrid() {
  return (
    <Section id="en-desarrollo" innerClassName="py-16 md:py-[88px]">
      <SectionHeading title={COMING_SOON.title} className="mb-12" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COMING_SOON.items.map((item) => (
          <ModuleCard key={item.title} {...item} badge={COMING_SOON.badge} soon />
        ))}
      </div>
    </Section>
  )
}
