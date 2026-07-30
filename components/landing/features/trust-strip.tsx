import { Section } from "@/components/landing/shared/section"
import { TRUST } from "./content"

// LAND-1A · Franja de confianza (blueprint §3).

export function TrustStrip() {
  return (
    <Section tinted width="narrow" innerClassName="py-10 text-center">
      <p className="mx-auto mb-5 max-w-[560px] text-balance text-base text-ink-600">{TRUST.text}</p>
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
        {TRUST.items.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="size-4 text-sage-700" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </Section>
  )
}
