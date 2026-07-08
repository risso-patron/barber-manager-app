// ORNO UI Framework · M1 · Brand
// The single Ornō wordmark. SVG-first: renders /public/brand/ assets when
// brand.assetsReady is true; typographic fallback otherwise. Swapping final
// brand art requires only dropping files — no code changes anywhere.

import Link from "next/link"
import { brand } from "@/lib/brand"

export type LogoVariant = "full" | "mono"
export type LogoTheme = "light" | "dark"

export interface LogoProps {
  /** full = color wordmark · mono = single ink. Default full. */
  variant?: LogoVariant
  /** Background it sits on. Default light. */
  theme?: LogoTheme
  /** Rendered height in px. Min 20 (legibility floor). Default 28. */
  height?: number
  /** Wrap in a link (e.g. "/admin"). */
  href?: string
  className?: string
}

export function Logo({ variant = "full", theme = "light", height = 28, href, className }: LogoProps) {
  const h = Math.max(20, height)
  const src = brand.logo[variant][theme]

  const mark = brand.assetsReady ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={brand.name} style={{ height: h, width: "auto", display: "block" }} className={className} />
  ) : (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: h,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        color:
          variant === "mono"
            ? theme === "dark"
              ? "#FFFFFF"
              : brand.color.ink
            : theme === "dark"
              ? "#FFFFFF"
              : brand.color.ink,
        whiteSpace: "nowrap",
      }}
    >
      Orn
      <span style={{ color: variant === "mono" ? "inherit" : brand.color.red }}>ō</span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "inline-flex" }} aria-label={`${brand.name} — inicio`}>
        {mark}
      </Link>
    )
  }
  return mark
}
