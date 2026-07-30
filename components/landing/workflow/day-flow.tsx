import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { ImagePlaceholder } from "@/components/landing/shared/image-placeholder"
import { DAY_FLOW } from "./content"

// LAND-1A · Un día con ORNO (blueprint §6): la rutina real, 4 momentos.

export function DayFlow() {
  return (
    <Section id="barberias" innerClassName="py-16 md:py-[88px]">
      <SectionHeading eyebrow={DAY_FLOW.eyebrow} title={DAY_FLOW.title} className="mb-12" />
      <div className="flex flex-col">
        {DAY_FLOW.steps.map((step) => (
          <div key={step.time} className="flex items-center gap-5 border-b border-border py-6 md:gap-7">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl md:size-24">
              <ImagePlaceholder hint={step.imgHint} className="[&_span]:hidden" />
            </div>
            <div className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-400 md:w-[90px]">
              {step.time}
            </div>
            <div className="min-w-0 flex-1 text-base font-semibold text-foreground md:text-[16.5px]">
              {step.title}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
