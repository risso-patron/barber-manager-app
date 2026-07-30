// ORNO UI Framework · M0 · Foundations
// The single Ornō wordmark. Replaces the 5 inline copies
// (admin/employee/client/legacy sidebars + footer) during M2.

import Link from "next/link"

interface LogoProps {
  /** Wordmark font size in px. Default 28. */
  size?: number
  /** Wrap in a link to this href (e.g. "/admin"). */
  href?: string
  className?: string
}

export function Logo({ size = 28, href, className }: LogoProps) {
  const mark = (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        color: "#26231F",
      }}
    >
      Orn<span style={{ color: "#E53935" }}>ō</span>
    </span>
  )
  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }} aria-label="Ornō — inicio">
        {mark}
      </Link>
    )
  }
  return mark
}
