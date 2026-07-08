// ORNO UI Framework · M1 · Brand
// Square app mark ("O." monogram) for sidebar rails, shop selector, loading
// splash. SVG-first with typographic fallback, same swap rules as Logo.

import { brand } from "@/lib/brand"

export interface AppIconProps {
  /** Square size in px. Default 36. */
  size?: number
  /** mono renders single-ink. Default color. */
  variant?: "color" | "mono"
  /** Draw the warm card behind the mark. Default true. */
  framed?: boolean
  className?: string
}

export function AppIcon({ size = 36, variant = "color", framed = true, className }: AppIconProps) {
  const inner = brand.assetsReady ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "mono" ? brand.appIcon.mono : brand.appIcon.default}
      alt=""
      aria-hidden="true"
      style={{ width: size * 0.62, height: size * 0.62, display: "block" }}
    />
  ) : (
    <span
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: size * 0.58,
        fontWeight: 600,
        lineHeight: 1,
        color: brand.color.ink,
      }}
    >
      O<span style={{ color: variant === "mono" ? "inherit" : brand.color.red }}>.</span>
    </span>
  )

  if (!framed) return <span className={className}>{inner}</span>

  return (
    <span
      className={className}
      role="img"
      aria-label={brand.name}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.33),
        background: "#FFFFFF",
        border: "1px solid #E8E4DE",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {inner}
    </span>
  )
}
