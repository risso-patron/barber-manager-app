import { X } from "lucide-react"

import { Section } from "@/components/landing/shared/section"
import { ImagePlaceholder } from "@/components/landing/shared/image-placeholder"
import { PROBLEM, PROBLEMS } from "./content"

// LAND-1A · El problema (blueprint §4): dolores reales + foto lateral.

export function ProblemSection() {
  return (
    <Section id="problema" width="wide" innerClassName="flex flex-wrap items-center gap-10 py-16 md:py-[88px] lg:flex-nowrap lg:gap-14">
      <div className="min-w-0 flex-1 basis-[340px]">
        <h2 className="mb-3.5 text-balance text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[32px]">
          {PROBLEM.title}
        </h2>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-600">{PROBLEM.sub}</p>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[13.5px] leading-snug text-ink-600">
              <X className="mt-0.5 size-3.5 shrink-0 text-danger-text" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 flex-1 basis-[340px]">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-card shadow-raised">
          <ImagePlaceholder hint={PROBLEM.photoHint} />
        </div>
      </div>
    </Section>
  )
}
