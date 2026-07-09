"use client"

// ORNO Scheduling Kit · M4 · AppointmentCard
// One card, every state (pending/confirmed/checked_in/in_progress/completed/
// cancelled/no_show) + sync overlays (syncing/offline/conflict). Semantic
// tokens only. Density-aware: hides detail rows below height thresholds.

import * as React from "react"
import { StickyNote, CloudOff, RefreshCw, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AppointmentState, SyncState } from "./types"

const STATE_CLS: Record<AppointmentState, { card: string; time: string; badge: string; badgeLabel: string }> = {
  pending: { card: "bg-warning-tint border-l-warning", time: "text-warning-text", badge: "bg-card text-warning-text", badgeLabel: "Sin confirmar" },
  confirmed: { card: "bg-accent border-l-primary", time: "text-accent-foreground", badge: "bg-card text-accent-foreground", badgeLabel: "Confirmada" },
  checked_in: { card: "bg-dustyblue-tint border-l-dustyblue", time: "text-dustyblue-text", badge: "bg-card text-dustyblue-text", badgeLabel: "En el local" },
  in_progress: { card: "bg-accent border-l-primary ring-1 ring-primary", time: "text-accent-foreground", badge: "bg-primary text-primary-foreground", badgeLabel: "En curso" },
  completed: { card: "bg-secondary border-l-ink-300 opacity-75", time: "text-muted-foreground", badge: "bg-card text-ink-600", badgeLabel: "Completada" },
  cancelled: { card: "bg-card border-l-border border-dashed opacity-60", time: "text-muted-foreground", badge: "bg-secondary text-muted-foreground", badgeLabel: "Cancelada" },
  no_show: { card: "bg-danger-tint border-l-danger opacity-90", time: "text-danger-text", badge: "bg-card text-danger-text", badgeLabel: "No vino" },
}

export interface AppointmentCardProps {
  clientName: string
  serviceLabel?: string
  timeLabel: string
  state: AppointmentState
  sync?: SyncState
  paid?: boolean
  note?: string
  /** Rendered height in px — drives density. */
  height?: number
  selected?: boolean
  onSelect?: (e: React.MouseEvent | React.KeyboardEvent) => void
  /** Drag handles — wired by the board. */
  onPointerDownMove?: (e: React.PointerEvent) => void
  onPointerDownResize?: (e: React.PointerEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  cancelledStrike?: boolean
  className?: string
  style?: React.CSSProperties
}

export const AppointmentCard = React.memo(function AppointmentCard({
  clientName,
  serviceLabel,
  timeLabel,
  state,
  sync = "synced",
  paid,
  note,
  height = 72,
  selected,
  onSelect,
  onPointerDownMove,
  onPointerDownResize,
  onKeyDown,
  className,
  style,
}: AppointmentCardProps) {
  const S = STATE_CLS[state]
  const short = height < 46
  const tiny = height < 70

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${clientName}, ${serviceLabel ?? ""}, ${timeLabel}, ${S.badgeLabel}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.(e)
        }
        onKeyDown?.(e)
      }}
      onPointerDown={onPointerDownMove}
      className={cn(
        "group absolute inset-x-2 touch-none select-none overflow-hidden rounded-xl border border-transparent border-l-[3px] px-3 py-2 text-left",
        "cursor-grab active:cursor-grabbing",
        "transition-shadow duration-micro hover:shadow-raised",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        S.card,
        selected && "z-20 ring-2 ring-ring",
        className
      )}
      style={style}
    >
      <div className="flex items-baseline justify-between gap-2">
        {/* Bible §15: nunca truncar el nombre del cliente — hasta 2 líneas. */}
        <span className={cn("line-clamp-2 break-words text-[13.5px] font-semibold text-foreground", state === "cancelled" && "line-through decoration-ink-300")}>
          {clientName}
        </span>
        <span className={cn("nums shrink-0 text-[11.5px] font-semibold", S.time)}>{timeLabel}</span>
      </div>

      {!short && serviceLabel && <p className="mt-px truncate text-xs text-ink-600">{serviceLabel}</p>}

      {!tiny && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold", S.badge)}>{S.badgeLabel}</span>
          {typeof paid === "boolean" && (
            <span
              title={paid ? "Cobrada" : "Cobro pendiente"}
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                paid ? "bg-success-tint text-success-text" : "bg-warning-tint text-warning-text"
              )}
            >
              $
            </span>
          )}
          {note && <StickyNote className="size-[13px] text-muted-foreground" aria-hidden="true" />}
        </div>
      )}

      {/* Sync overlays — quiet, never blocking. */}
      {sync !== "synced" && (
        <span
          className={cn(
            "absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-card/90",
            sync === "conflict" ? "text-danger-text" : "text-muted-foreground"
          )}
          title={sync === "syncing" ? "Guardando…" : sync === "offline" ? "Sin conexión — se guardará al volver" : "Conflicto de versión"}
        >
          {sync === "syncing" && <RefreshCw className="size-3 animate-spin" aria-hidden="true" />}
          {sync === "offline" && <CloudOff className="size-3" aria-hidden="true" />}
          {sync === "conflict" && <TriangleAlert className="size-3" aria-hidden="true" />}
        </span>
      )}

      {/* Resize handle */}
      {onPointerDownResize && state !== "completed" && state !== "cancelled" && state !== "no_show" && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation()
            onPointerDownResize(e)
          }}
          className="absolute inset-x-0 bottom-0 flex h-2.5 cursor-ns-resize items-end justify-center pb-0.5 opacity-0 transition-opacity duration-micro group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        >
          <span className="h-[3px] w-6 rounded-full bg-foreground/15" />
        </div>
      )}
    </div>
  )
})
