import { ArrowRight } from "lucide-react"

import { Logo } from "@/components/ui/foundations/logo"
import { LandingCta } from "@/components/landing/shared/landing-cta"
import { DEMO_CTA, LOGIN_CTA } from "@/components/landing/shared/content"
import { FINAL_CTA } from "./content"

// LAND-1B · CTA final (blueprint §13): el cierre de la historia sobre ink.

export function FinalCta() {
  return (
    <section className="bg-ink-900">
      <div className="mx-auto max-w-[720px] px-6 py-16 text-center md:px-8 md:py-[88px]">
        <div className="mb-4 flex justify-center">
          <Logo theme="dark" height={30} />
        </div>
        <h2 className="mb-3.5 text-balance text-[28px] font-semibold leading-tight tracking-[-0.02em] text-surface md:text-[34px]">
          {FINAL_CTA.title}
        </h2>
        <p className="mb-8 text-[15px] leading-relaxed text-ink-300">{FINAL_CTA.sub}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <LandingCta href={DEMO_CTA.href} icon={ArrowRight}>
            {DEMO_CTA.label}
          </LandingCta>
          <LandingCta href={LOGIN_CTA.href} variant="ghost-dark">
            {LOGIN_CTA.label}
          </LandingCta>
        </div>
      </div>
    </section>
  )
}
