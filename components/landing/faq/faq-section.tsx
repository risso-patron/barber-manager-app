import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { FaqItem } from "./faq-item"
import { FAQ } from "./content"

// LAND-1B · FAQ (blueprint §12, copy adaptado §2.7).

export function FaqSection() {
  return (
    <Section id="faq" width="tight" innerClassName="py-16 md:py-[88px]">
      <SectionHeading title={FAQ.title} className="mb-9" />
      <div className="flex flex-col gap-2.5">
        {FAQ.items.map((item) => (
          <FaqItem key={item.q} {...item} />
        ))}
      </div>
    </Section>
  )
}
