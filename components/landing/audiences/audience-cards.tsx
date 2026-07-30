import { Check } from "lucide-react"

import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { ImagePlaceholder } from "@/components/landing/shared/image-placeholder"
import { AUDIENCES } from "./content"

// LAND-1B · Audiencias (blueprint §8): qué gana cada rol con ORNO.

export function AudienceCards() {
  return (
    <Section id="como" innerClassName="py-16 md:py-[88px]">
      <SectionHeading title={AUDIENCES.title} className="mb-12" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {AUDIENCES.cards.map((card) => (
          <div key={card.title} className="overflow-hidden rounded-card border border-border bg-card">
            <div className="aspect-[16/10] w-full">
              <ImagePlaceholder hint={card.imgHint} />
            </div>
            <div className="p-6">
              <div className="mb-3 text-base font-semibold text-foreground">{card.title}</div>
              <ul className="flex flex-col gap-2">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13.5px] leading-snug text-ink-600">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-sage-700" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
