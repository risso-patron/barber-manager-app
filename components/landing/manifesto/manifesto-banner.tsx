import { ImagePlaceholder } from "@/components/landing/shared/image-placeholder"
import { MANIFESTO } from "./content"

// LAND-1B · Manifiesto (blueprint §9): foto full-bleed con quote. El overlay
// ink garantiza contraste AA del texto aunque la foto (o el placeholder
// de LAND-1) sea clara.

export function ManifestoBanner() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-16 md:px-8 md:py-[88px]">
      <div className="relative h-[420px] overflow-hidden rounded-modal md:h-[460px]">
        <div className="absolute inset-0">
          <ImagePlaceholder hint={MANIFESTO.photoHint} className="[&_span]:hidden" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-900/80 via-ink-900/45 to-ink-900/10"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center px-7 md:px-14">
          <div className="max-w-[480px]">
            <h2 className="mb-3.5 text-balance text-[24px] font-semibold leading-snug tracking-[-0.02em] text-surface md:text-[30px]">
              {MANIFESTO.title}
            </h2>
            <p className="text-[15px] leading-relaxed text-surface/85">{MANIFESTO.sub}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
