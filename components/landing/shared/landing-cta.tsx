import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// LAND-1 · CTA de la Landing (identidad propia del marketing site — no es el
// Button del backoffice). Interno → next/link; mailto/anclas → <a>.

const VARIANTS = {
  primary: "bg-sage-500 text-white hover:bg-sage-600",
  secondary: "border border-border bg-card text-foreground hover:bg-surface-2",
  /** Para fondos ink (CTA final): borde y texto claros sobre oscuro. */
  "ghost-dark": "border border-surface/25 text-surface hover:bg-surface/10",
} as const

const SIZES = {
  sm: "h-10 px-4 text-[13.5px]",
  lg: "h-[52px] px-6 text-[15px]",
} as const

export function LandingCta({
  href,
  variant = "primary",
  size = "lg",
  icon: Icon,
  className,
  children,
}: {
  href: string
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  icon?: LucideIcon
  className?: string
  children: React.ReactNode
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-enter ease-orno",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent",
    VARIANTS[variant],
    SIZES[size],
    className
  )
  const content = (
    <>
      {children}
      {Icon && <Icon className="size-4" aria-hidden="true" />}
    </>
  )

  return href.startsWith("/") ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {content}
    </a>
  )
}
