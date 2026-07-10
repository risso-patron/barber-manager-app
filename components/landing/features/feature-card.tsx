import type { LucideIcon } from "lucide-react"

import type { Accent } from "./content"

// LAND-1 · Card de la sección Solución: icono con tinte de acento + texto.

const ACCENTS: Record<Accent, string> = {
  sage: "bg-sage-100 text-sage-700",
  dustyblue: "bg-dustyblue-tint text-dustyblue-text",
  terracotta: "bg-terracotta-tint text-terracotta-text",
}

export function FeatureCard({
  icon: Icon,
  title,
  text,
  accent,
}: {
  icon: LucideIcon
  title: string
  text: string
  accent: Accent
}) {
  return (
    <div className="rounded-card border border-border bg-card p-6 transition-shadow duration-enter hover:shadow-raised">
      <span className={`mb-3 flex size-10 items-center justify-center rounded-xl ${ACCENTS[accent]}`}>
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="mb-1 text-[15px] font-semibold text-foreground">{title}</div>
      <div className="text-[13px] leading-normal text-ink-600">{text}</div>
    </div>
  )
}
