// ORNO UI Framework · M0 · Foundations
// Lucide wrapper enforcing the Constitution's icon style:
// stroke 1.75 (softer than lucide's default 2), sizes 16 (inline) / 20 (nav).

import type { LucideIcon, LucideProps } from "lucide-react"

interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon
  /** 16 junto a texto · 20 en navegación. Default 16. */
  size?: 16 | 20 | number
}

export function Icon({ icon: LucideCmp, size = 16, strokeWidth = 1.75, ...rest }: IconProps) {
  return <LucideCmp size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />
}
