import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// LAND-1 · Card de módulo. `soon` = variante "En desarrollo": título + badge
// Próximamente, opacidad reducida, sin texto descriptivo (copy congelado).

export function ModuleCard({
  icon: Icon,
  title,
  text,
  badge,
  soon = false,
}: {
  icon: LucideIcon
  title: string
  text?: string
  badge?: string
  soon?: boolean
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card px-5 py-4", soon && "opacity-75")}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-[17px] shrink-0 text-sage-700" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[14.5px] font-semibold leading-snug text-foreground">{title}</span>
        {badge && (
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-surface-2 px-2.5 text-[11px] font-semibold text-ink-600">
            {badge}
          </span>
        )}
      </div>
      {text && <div className="mt-1.5 text-[13px] leading-normal text-ink-600">{text}</div>}
    </div>
  )
}
