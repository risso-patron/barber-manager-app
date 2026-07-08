"use client"

// ORNO Scheduling Kit · M4 · GapSuggestion + DragPreview + ResourceColumn

import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ScheduleConfig, SchedResource } from "./types"
import { toPx, minutesToLabel } from "./engine"

/* ── GapSuggestion — empty space as bookable opportunity ── */
export interface GapSuggestionProps {
  cfg: ScheduleConfig
  startMin: number
  endMin: number
  /** "30 min · ideal para Barba" — computed by suggestGaps + services. */
  label: string
  onBook: (startMin: number) => void
}

export function GapSuggestion({ cfg, startMin, endMin, label, onBook }: GapSuggestionProps) {
  return (
    <button
      type="button"
      onClick={() => onBook(startMin)}
      className={cn(
        "absolute inset-x-2 z-[5] flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-ink-300/60 bg-background/50",
        "text-xs font-medium text-muted-foreground transition-colors duration-micro",
        "hover:border-primary hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      style={{ top: toPx(startMin, cfg) + 2, height: (endMin - startMin) * cfg.pxPerMinute - 8 }}
      aria-label={`Hueco libre de ${endMin - startMin} minutos a las ${minutesToLabel(startMin)}. ${label}`}
    >
      <Plus className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

/* ── DragPreview — the ghost during drag/resize ── */
export function DragPreview({
  cfg,
  startMin,
  endMin,
  invalid,
  duplicate,
}: {
  cfg: ScheduleConfig
  startMin: number
  endMin: number
  invalid: boolean
  duplicate: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-2 z-30 rounded-xl border-2",
        invalid ? "border-danger bg-danger-tint/70" : "border-primary bg-accent/80"
      )}
      style={{ top: toPx(startMin, cfg), height: (endMin - startMin) * cfg.pxPerMinute }}
    >
      <span
        className={cn(
          "nums absolute -top-6 left-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold shadow-raised",
          invalid ? "bg-danger text-white" : "bg-foreground text-background"
        )}
      >
        {minutesToLabel(startMin)} – {minutesToLabel(endMin)}
        {duplicate && " · duplicar"}
        {invalid && " · ocupado"}
      </span>
    </div>
  )
}

/* ── ResourceColumn — sticky header for a barber/chair/day column ── */
export function ResourceColumnHeader({ resource, meta }: { resource: SchedResource; meta?: string }) {
  const ini =
    resource.initials ??
    resource.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  return (
    <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground">
        {ini}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14.5px] font-semibold text-foreground">{resource.name}</p>
        {(meta ?? resource.subtitle) && <p className="truncate text-xs text-muted-foreground">{meta ?? resource.subtitle}</p>}
      </div>
    </div>
  )
}
