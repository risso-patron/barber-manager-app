import * as React from "react"

import { cn } from "@/lib/utils"

// LAND-1 · Sección base de la Landing. `tinted` alterna la franja cálida
// (surface-2 con bordes) del blueprint; el ancho replica sus contenedores.

const WIDTHS = {
  tight: "max-w-[760px]",
  narrow: "max-w-[1000px]",
  default: "max-w-[1200px]",
  wide: "max-w-[1280px]",
} as const

export function Section({
  id,
  tinted = false,
  width = "default",
  className,
  innerClassName,
  children,
}: {
  id?: string
  tinted?: boolean
  width?: keyof typeof WIDTHS
  className?: string
  innerClassName?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn(tinted && "border-y border-border bg-surface-2", className)}>
      <div className={cn("mx-auto px-6 md:px-8", WIDTHS[width], innerClassName)}>{children}</div>
    </section>
  )
}
