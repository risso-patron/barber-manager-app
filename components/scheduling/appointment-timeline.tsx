"use client"

// ORNO Scheduling Kit · M4 · AppointmentTimeline
// The composed engine surface. One component, three layouts:
//   variant="board"  — resource columns across a day (admin default)
//   variant="week"   — one resource, columns are days
//   variant="single" — one vertical column (employee day, mobile, client view)
//
// Everything is injected: data, states, callbacks. The timeline owns only
// geometry, interaction and rendering. Reusable by admin/employee/client/
// marketplace/WhatsApp/AI because it has NO data fetching and NO role logic.
//
// Performance: appointments render via React.memo cards; drag paints a
// single DragPreview overlay (no per-frame re-layout of cards); state
// changes are optimistic (onMove/onResize fire immediately).

import * as React from "react"

import { cn } from "@/lib/utils"
import { AsyncPane, type PaneState } from "@/components/ui/async-pane"
import { Skeleton } from "@/components/ui/skeleton"

import {
  DEFAULT_CONFIG,
  type SchedAppointment,
  type ScheduleBlock,
  type SchedResource,
  type ScheduleConfig,
  type ScheduleConflict,
} from "./types"
import { place, minutesInTz, minutesToLabel, suggestGaps, boardHeight } from "./engine"
import { useScheduleDnd } from "./use-schedule-dnd"
import { AppointmentCard } from "./appointment-card"
import { TimeRuler, TimelineGrid, CurrentTimeIndicator, AvailabilityOverlay } from "./timeline-grid"
import { GapSuggestion, DragPreview, ResourceColumnHeader } from "./gap-and-preview"
import { ConflictResolver } from "./queue-conflict-filters"

export interface AppointmentTimelineProps {
  variant?: "board" | "single"
  cfg?: Partial<ScheduleConfig>
  resources: SchedResource[]
  appointments: SchedAppointment[]
  blocks?: ScheduleBlock[]
  /** ISO now — injected for testability + tz correctness. */
  nowIso?: string
  state?: PaneState
  /** Services catalog powers gap labels ("ideal para Barba"). */
  services?: Array<{ name: string; minutes: number }>
  /** Optimistic commit callbacks. Rollback via your data layer + notify(Deshacer). */
  onMove?: (change: { appointmentId: string; resourceId: string; startMin: number; endMin: number; duplicate: boolean }) => void
  onSelect?: (appointment: SchedAppointment, anchor: { top: number; resourceIndex: number }) => void
  onCreateAt?: (resourceId: string, minute: number) => void
  onBookGap?: (resourceId: string, startMin: number) => void
  selectedId?: string | null
  /** Empty / error / denied panes from M3. */
  empty?: React.ReactNode
  errorProps?: { title?: string; description?: string; onRetry?: () => void }
  className?: string
}

export function AppointmentTimeline({
  variant = "board",
  cfg: cfgOverride,
  resources,
  appointments,
  blocks = [],
  nowIso,
  state = "success",
  services,
  onMove,
  onSelect,
  onCreateAt,
  onBookGap,
  selectedId,
  empty,
  errorProps,
  className,
}: AppointmentTimelineProps) {
  const cfg: ScheduleConfig = { ...DEFAULT_CONFIG, ...cfgOverride }
  const boardRef = React.useRef<HTMLDivElement>(null)
  const liveRef = React.useRef<HTMLDivElement>(null)
  const [conflict, setConflict] = React.useState<ScheduleConflict | null>(null)

  const nowMin = nowIso ? minutesInTz(nowIso, cfg.timezone) : -1

  const dnd = useScheduleDnd({
    appointments,
    blocks,
    resources,
    cfg,
    onCommit: (change) => onMove?.(change),
    onConflict: setConflict,
    announce: (msg) => {
      if (liveRef.current) liveRef.current.textContent = msg
    },
  })

  // Pointer tracking over the whole board: map x → resource, y → minutes.
  const onBoardPointerMove = (e: React.PointerEvent) => {
    if (!dnd.drag || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const gutter = 64
    const colWidth = (rect.width - gutter) / resources.length
    const colIdx = Math.min(Math.max(Math.floor((e.clientX - rect.left - gutter) / colWidth), 0), resources.length - 1)
    const min = (e.clientY - rect.top + (boardRef.current.parentElement?.scrollTop ?? 0) - 64) / cfg.pxPerMinute + cfg.dayStartMin
    dnd.update(min, resources[colIdx]?.id ?? null, e.altKey)
  }

  const visible = variant === "single" ? resources.slice(0, 1) : resources

  return (
    <div className={cn("relative", className)}>
      <div ref={liveRef} aria-live="polite" className="sr-only" />
      <AsyncPane
        state={state}
        skeleton={<TimelineSkeleton cfg={cfg} columns={visible.length} />}
        empty={empty ?? null}
        error={errorProps}
        size="page"
      >
        <div
          ref={boardRef}
          className="flex min-w-fit"
          onPointerMove={onBoardPointerMove}
          onPointerUp={() => dnd.drag && dnd.finish()}
          onPointerCancel={dnd.cancel}
        >
          {/* Gutter */}
          <div className="w-16 shrink-0 pt-16">
            <TimeRuler cfg={cfg} />
          </div>

          {visible.map((resource, ri) => {
            const appts = place(
              appointments.filter((a) => a.resourceId === resource.id),
              cfg
            )
            const blks = place(
              blocks.filter((b) => b.resourceId === resource.id),
              cfg
            )
            const gaps =
              onBookGap && services
                ? suggestGaps(resource.id, appointments, blocks, cfg, { services, nowMin: nowMin > 0 ? nowMin : undefined })
                : []
            const working = resource.workingHours?.map((w) => ({
              startMin: minutesInTz(w.startsAt, cfg.timezone),
              endMin: minutesInTz(w.endsAt, cfg.timezone),
            })) ?? [{ startMin: cfg.dayStartMin, endMin: cfg.dayEndMin }]

            return (
              <div key={resource.id} className="min-w-[240px] flex-1 border-l border-secondary">
                <ResourceColumnHeader resource={resource} />
                <TimelineGrid cfg={cfg} onCreateAt={onCreateAt ? (min) => onCreateAt(resource.id, min) : undefined}>
                  <AvailabilityOverlay cfg={cfg} workingIntervals={working} />

                  {blks.map(({ item, top, height }) => (
                    <div
                      key={item.id}
                      className="absolute inset-x-2 z-[4] flex items-center rounded-xl border border-border bg-[repeating-linear-gradient(-45deg,hsl(var(--secondary)),hsl(var(--secondary))_6px,hsl(var(--border))_6px,hsl(var(--border))_12px)] px-3"
                      style={{ top, height: height - 4 }}
                    >
                      <span className="truncate text-[13px] font-semibold text-ink-600">{item.label}</span>
                    </div>
                  ))}

                  {gaps.map((g, gi) => {
                    const s = Number(g.startsAt.slice(1))
                    const e = Number(g.endsAt.slice(1))
                    return (
                      <GapSuggestion
                        key={gi}
                        cfg={cfg}
                        startMin={s}
                        endMin={e}
                        label={g.fitsService ? `${g.minutes} min · ideal para ${g.fitsService.name}` : `${g.minutes} min libres`}
                        onBook={(min) => onBookGap!(resource.id, min)}
                      />
                    )
                  })}

                  {appts.map(({ item, top, height, startMin }) => {
                    const hidden = dnd.drag?.appointmentId === item.id && dnd.drag.mode === "move"
                    return (
                      <AppointmentCard
                        key={item.id}
                        clientName={item.clientName}
                        serviceLabel={item.serviceName}
                        timeLabel={minutesToLabel(startMin)}
                        state={item.state}
                        sync={item.sync}
                        paid={item.paid}
                        note={item.note}
                        height={height}
                        selected={selectedId === item.id}
                        onSelect={() => onSelect?.(item, { top, resourceIndex: ri })}
                        onPointerDownMove={onMove ? (e) => dnd.begin(item.id, "move", e) : undefined}
                        onPointerDownResize={onMove ? (e) => dnd.begin(item.id, "resize", e) : undefined}
                        onKeyDown={(e) => {
                          if (!onMove || !e.shiftKey) return
                          const map: Record<string, [number, number]> = {
                            ArrowUp: [-cfg.snapMinutes, 0],
                            ArrowDown: [cfg.snapMinutes, 0],
                            ArrowLeft: [0, -1],
                            ArrowRight: [0, 1],
                          }
                          const d = map[e.key]
                          if (d) {
                            e.preventDefault()
                            dnd.moveBy(item.id, d[0], d[1])
                          }
                        }}
                        style={{ top, height: height - 4, opacity: hidden ? 0.3 : undefined }}
                      />
                    )
                  })}

                  {dnd.drag && dnd.drag.resourceId === resource.id && (
                    <DragPreview
                      cfg={cfg}
                      startMin={dnd.drag.startMin}
                      endMin={dnd.drag.endMin}
                      invalid={dnd.drag.invalid}
                      duplicate={dnd.drag.duplicate}
                    />
                  )}

                  {nowMin > 0 && <CurrentTimeIndicator cfg={cfg} nowMin={nowMin} />}
                </TimelineGrid>
              </div>
            )
          })}
        </div>
      </AsyncPane>

      <ConflictResolver
        conflict={conflict}
        onClose={() => setConflict(null)}
        resourceName={(id) => resources.find((r) => r.id === id)?.name ?? ""}
        onPick={(alt) => {
          if (conflict) {
            onMove?.({
              appointmentId: conflict.attempted.appointmentId,
              resourceId: alt.resourceId,
              startMin: alt.startMin,
              endMin: alt.endMin,
              duplicate: false,
            })
          }
          setConflict(null)
        }}
      />
    </div>
  )
}

function TimelineSkeleton({ cfg, columns }: { cfg: ScheduleConfig; columns: number }) {
  return (
    <div className="flex" role="status" aria-label="Cargando agenda">
      <div className="w-16 shrink-0" />
      {Array.from({ length: Math.max(columns, 1) }).map((_, c) => (
        <div key={c} className="relative min-w-[240px] flex-1 border-l border-secondary px-2 pt-16" style={{ height: Math.min(boardHeight(cfg), 560) }}>
          <Skeleton className="absolute left-4 top-3 h-9 w-9 rounded-full" />
          {[80, 220, 340, 460].map((top, i) => (
            <Skeleton key={i} className="absolute inset-x-2 rounded-xl" style={{ top, height: 56 + ((c + i) % 3) * 18 }} />
          ))}
        </div>
      ))}
    </div>
  )
}
