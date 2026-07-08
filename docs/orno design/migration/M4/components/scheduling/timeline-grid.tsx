"use client"

// ORNO Scheduling Kit · M4 · Grid furniture
// TimeRuler + TimelineGrid + CurrentTimeIndicator + AvailabilityOverlay.
// Pure presentation over the geometry engine. Semantic tokens only.

import * as React from "react"

import { cn } from "@/lib/utils"
import type { ScheduleConfig } from "./types"
import { toPx, minutesToLabel, boardHeight } from "./engine"

/* ── TimeRuler — left gutter with hour labels ── */
export function TimeRuler({ cfg, className }: { cfg: ScheduleConfig; className?: string }) {
  const hours: number[] = []
  for (let m = Math.ceil(cfg.dayStartMin / 60) * 60; m <= cfg.dayEndMin; m += 60) hours.push(m)
  return (
    <div className={cn("relative w-16 shrink-0", className)} style={{ height: boardHeight(cfg) }} aria-hidden="true">
      {hours.map((m) => (
        <span
          key={m}
          className="nums absolute right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground"
          style={{ top: toPx(m, cfg) }}
        >
          {minutesToLabel(m)}
        </span>
      ))}
    </div>
  )
}

/* ── TimelineGrid — hour/half-hour lines + click/tap-to-create ── */
export function TimelineGrid({
  cfg,
  onCreateAt,
  children,
  className,
}: {
  cfg: ScheduleConfig
  /** Called with snapped minutes when the user clicks empty grid. */
  onCreateAt?: (minute: number) => void
  children?: React.ReactNode
  className?: string
}) {
  const lines: Array<{ m: number; major: boolean }> = []
  for (let m = Math.ceil(cfg.dayStartMin / 30) * 30; m <= cfg.dayEndMin; m += 30) {
    lines.push({ m, major: m % 60 === 0 })
  }
  return (
    <div
      className={cn("relative", className)}
      style={{ height: boardHeight(cfg) }}
      onDoubleClick={(e) => {
        if (!onCreateAt || e.target !== e.currentTarget) return
        const rect = e.currentTarget.getBoundingClientRect()
        const min = (e.clientY - rect.top) / cfg.pxPerMinute + cfg.dayStartMin
        onCreateAt(Math.round(min / cfg.snapMinutes) * cfg.snapMinutes)
      }}
    >
      {lines.map(({ m, major }) => (
        <div
          key={m}
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-x-0 h-px", major ? "bg-border" : "bg-secondary")}
          style={{ top: toPx(m, cfg) }}
        />
      ))}
      {children}
    </div>
  )
}

/* ── CurrentTimeIndicator — the now line with time chip ── */
export function CurrentTimeIndicator({ cfg, nowMin, label }: { cfg: ScheduleConfig; nowMin: number; label?: string }) {
  if (nowMin < cfg.dayStartMin || nowMin > cfg.dayEndMin) return null
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[15] flex -translate-y-1/2 items-center"
      style={{ top: toPx(nowMin, cfg) }}
      aria-hidden="true"
    >
      <span className="nums ml-1.5 inline-flex h-5 items-center rounded-full bg-foreground px-2 text-[11px] font-semibold text-background">
        {label ?? minutesToLabel(nowMin)}
      </span>
      <span className="h-0.5 flex-1 bg-foreground/80" />
    </div>
  )
}

/* ── AvailabilityOverlay — shades out-of-working-hours + blocked regions ── */
export function AvailabilityOverlay({
  cfg,
  workingIntervals,
  className,
}: {
  cfg: ScheduleConfig
  /** Working windows in minutes-from-midnight. Everything else shades. */
  workingIntervals: Array<{ startMin: number; endMin: number }>
  className?: string
}) {
  // Compute the complement of working hours within the visible day.
  const shaded: Array<{ s: number; e: number }> = []
  let cursor = cfg.dayStartMin
  const sorted = [...workingIntervals].sort((a, b) => a.startMin - b.startMin)
  for (const w of sorted) {
    if (w.startMin > cursor) shaded.push({ s: cursor, e: w.startMin })
    cursor = Math.max(cursor, w.endMin)
  }
  if (cursor < cfg.dayEndMin) shaded.push({ s: cursor, e: cfg.dayEndMin })

  return (
    <>
      {shaded.map(({ s, e }) => (
        <div
          key={s}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,hsl(var(--secondary))_6px,hsl(var(--secondary))_12px)] opacity-70",
            className
          )}
          style={{ top: toPx(s, cfg), height: (e - s) * cfg.pxPerMinute }}
        />
      ))}
    </>
  )
}
