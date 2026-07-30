import { Section } from "@/components/landing/shared/section"
import { SectionHeading } from "@/components/landing/shared/section-heading"
import { LandingCta } from "@/components/landing/shared/landing-cta"
import { DEMO_CTA } from "@/components/landing/shared/content"
import { PRICING } from "./content"

// LAND-1B · Planes: un solo bloque honesto — la experiencia comercial
// todavía no existe y la Landing no genera expectativas sobre ella.

export function PricingSoon() {
  return (
    <Section id="planes" tinted innerClassName="py-16 text-center md:py-[88px]">
      <SectionHeading eyebrow={PRICING.eyebrow} title={PRICING.title} sub={PRICING.text} />
      <div className="mt-8 flex justify-center">
        <LandingCta href={DEMO_CTA.href}>{DEMO_CTA.label}</LandingCta>
      </div>
    </Section>
  )
}
