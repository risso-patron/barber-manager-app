import { ArrowRight, CalendarCheck, Scissors } from "lucide-react"

import { Section } from "@/components/landing/shared/section"
import { LandingCta } from "@/components/landing/shared/landing-cta"
import { ImagePlaceholder } from "@/components/landing/shared/image-placeholder"
import { DEMO_CTA } from "@/components/landing/shared/content"
import { FloatingChip } from "./floating-chip"
import { HERO, HERO_CHIPS } from "./content"

// LAND-1A · Hero humano (blueprint §2): texto + foto editorial con
// chips de producto real (citas del día, ingresos, huecos sugeridos M4).

export function Hero() {
  return (
    <Section id="inicio" width="wide" innerClassName="flex flex-wrap items-center gap-10 pb-16 pt-12 md:pt-[72px] lg:flex-nowrap lg:gap-14 lg:pb-20">
      <div className="min-w-0 flex-1 basis-[380px]">
        <div className="mb-5 inline-flex h-[30px] items-center gap-2 rounded-full bg-sage-100 px-3.5 text-[12.5px] font-semibold text-sage-700">
          <Scissors className="size-3.5" aria-hidden="true" />
          {HERO.badge}
        </div>
        <h1 className="mb-5 text-balance text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[50px]">
          {HERO.title}
        </h1>
        <p className="mb-7 max-w-[460px] text-pretty text-[17px] leading-relaxed text-ink-600">
          {HERO.sub}
        </p>
        <div className="flex flex-wrap gap-3">
          <LandingCta href={DEMO_CTA.href} icon={ArrowRight}>
            {DEMO_CTA.label}
          </LandingCta>
          <LandingCta href={HERO.secondaryCta.href} variant="secondary">
            {HERO.secondaryCta.label}
          </LandingCta>
        </div>
      </div>

      <div className="relative min-w-0 flex-1 basis-[340px]">
        <div className="aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-modal shadow-overlay">
          <ImagePlaceholder hint={HERO.photoHint} />
        </div>

        {/* Chips: fila estática en mobile, flotantes sobre la foto en md+ */}
        <div className="mt-4 flex flex-col gap-2.5 md:contents">
          <FloatingChip className="md:absolute md:-left-5 md:top-6">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-sage-100 text-sage-700">
              <CalendarCheck className="size-4" aria-hidden="true" />
            </span>
            <span>
              <span className="nums block text-[15px] font-semibold text-foreground">{HERO_CHIPS.today.value}</span>
              <span className="block text-[11px] text-ink-400">{HERO_CHIPS.today.detail}</span>
            </span>
          </FloatingChip>

          <FloatingChip className="md:absolute md:-right-5 md:bottom-24">
            <span>
              <span className="block text-[11px] text-ink-400">{HERO_CHIPS.revenue.label}</span>
              <span className="nums block text-xl font-semibold tracking-[-0.01em] text-sage-700">
                {HERO_CHIPS.revenue.value}
              </span>
            </span>
          </FloatingChip>

          <FloatingChip className="md:absolute md:bottom-5 md:left-[-16px] md:right-14">
            <span className="size-2 shrink-0 rounded-full bg-sage-500 motion-safe:animate-pulse" aria-hidden="true" />
            <span className="text-[13px] font-semibold text-foreground">{HERO_CHIPS.next}</span>
          </FloatingChip>
        </div>
      </div>
    </Section>
  )
}
