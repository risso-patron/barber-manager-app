"use client"

// ORNO UI Framework · M3 · Data
// StatCard + StatStrip — the essential-metrics pattern for every module.
// Replaces the 6 per-page `const stats = useMemo` ad-hoc rows.
// No large charts here by design: value + delta + optional inline extra.

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { SkeletonStat } from "@/components/ui/skeleton"

export interface StatCardProps {
  /** Human label: "Ingresos de hoy". */
  label: string
  /** Formatted value: "$36.500". Formatting happens at the caller. */
  value: React.ReactNode
  /** Signed delta vs. comparable period, e.g. +8. Renders arrow + color. */
  deltaPct?: number
  /** What the delta compares to: "vs. viernes pasado". */
  deltaHint?: string
  /** Quiet inline extra: "· 4 completadas", a progress bar, etc. */
  extra?: React.ReactNode
  /** Navigate on click — deep metrics live in Análisis, not here. */
  href?: string
  loading?: boolean
  className?: string
}

export function StatCard({ label, value, deltaPct, deltaHint, extra, href, loading, className }: StatCardProps) {
  if (loading) return <SkeletonStat className={className} />

  const body = (
    <>
      <p className="mb-1.5 text-[13px] font-medium text-ink-600">{label}</p>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="nums text-[26px] font-semibold tracking-tight text-foreground">{value}</span>
        {typeof deltaPct === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[13px] font-semibold",
              deltaPct >= 0 ? "text-success-text" : "text-danger-text"
            )}
            title={deltaHint}
          >
            {deltaPct >= 0 ? <TrendingUp className="size-[15px]" aria-hidden="true" /> : <TrendingDown className="size-[15px]" aria-hidden="true" />}
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct}%<span className="sr-only"> {deltaHint}</span>
          </span>
        )}
      </div>
      {extra && <div className="mt-2 text-[13px] text-muted-foreground">{extra}</div>}
    </>
  )

  const cls = cn(
    "block rounded-card border border-border bg-card p-6 text-left",
    href && "transition-shadow duration-micro ease-orno hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className
  )

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/** Responsive strip of StatCards. Constitution: essentials only (≤4). */
export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>
}
