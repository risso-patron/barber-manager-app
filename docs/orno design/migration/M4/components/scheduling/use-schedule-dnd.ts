"use client"

// ORNO Scheduling Kit · M4 · Drag/resize engine (headless hook)
// Pointer-events based (mouse + touch unified). Interaction-first:
// the ghost follows the pointer via transform (no re-layout per frame),
// commit is optimistic, conflicts resolve via detectConflict.
// Keyboard parity: moveBy() implements ⇧↑↓/←→ without any pointer.

import * as React from "react"

import type { SchedAppointment, ScheduleBlock, ScheduleConfig, ScheduleConflict } from "./types"
import { detectConflict, minutesInTz, snap } from "./engine"

export interface DragState {
  appointmentId: string
  mode: "move" | "resize"
  /** Live proposal while dragging. */
  resourceId: string
  startMin: number
  endMin: number
  /** True while pointer is over an invalid drop. */
  invalid: boolean
  /** ⌥ held — duplicate instead of move. */
  duplicate: boolean
}

export interface UseScheduleDndArgs {
  appointments: SchedAppointment[]
  blocks: ScheduleBlock[]
  resources: Array<{ id: string }>
  cfg: ScheduleConfig
  /** Optimistic commit. Return a promise; rollback on reject is the caller's. */
  onCommit: (change: {
    appointmentId: string
    resourceId: string
    startMin: number
    endMin: number
    duplicate: boolean
  }) => void
  onConflict: (conflict: ScheduleConflict) => void
  /** Announce for aria-live: "Cita de Marcos movida a 13:00 con Rama". */
  announce?: (message: string) => void
}

export function useScheduleDnd({ appointments, blocks, resources, cfg, onCommit, onConflict, announce }: UseScheduleDndArgs) {
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const dragRef = React.useRef<DragState | null>(null)
  dragRef.current = drag

  const begin = React.useCallback(
    (appointmentId: string, mode: "move" | "resize", e: React.PointerEvent) => {
      const appt = appointments.find((a) => a.id === appointmentId)
      if (!appt) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      const startMin = minutesInTz(appt.startsAt, cfg.timezone)
      const endMin = minutesInTz(appt.endsAt, cfg.timezone)
      setDrag({ appointmentId, mode, resourceId: appt.resourceId, startMin, endMin, invalid: false, duplicate: e.altKey })
    },
    [appointments, cfg]
  )

  /** Board calls this on pointermove with board-relative coordinates. */
  const update = React.useCallback(
    (minAtPointer: number, resourceIdAtPointer: string | null, altKey: boolean) => {
      setDrag((d) => {
        if (!d) return d
        const dur = d.endMin - d.startMin
        let next: DragState
        if (d.mode === "move") {
          const s = Math.min(Math.max(snap(minAtPointer - dur / 2, cfg), cfg.dayStartMin), cfg.dayEndMin - dur)
          next = { ...d, startMin: s, endMin: s + dur, resourceId: resourceIdAtPointer ?? d.resourceId, duplicate: altKey }
        } else {
          const e = Math.min(Math.max(snap(minAtPointer, cfg), d.startMin + cfg.snapMinutes), cfg.dayEndMin)
          next = { ...d, endMin: e }
        }
        next.invalid = !!detectConflict(
          { appointmentId: d.appointmentId, resourceId: next.resourceId, startMin: next.startMin, endMin: next.endMin },
          appointments,
          blocks,
          cfg
        )
        return next
      })
    },
    [appointments, blocks, cfg]
  )

  const finish = React.useCallback(() => {
    const d = dragRef.current
    setDrag(null)
    if (!d) return
    const conflict = detectConflict(
      { appointmentId: d.appointmentId, resourceId: d.resourceId, startMin: d.startMin, endMin: d.endMin },
      appointments,
      blocks,
      cfg
    )
    if (conflict) {
      onConflict(conflict)
      return
    }
    onCommit({ appointmentId: d.appointmentId, resourceId: d.resourceId, startMin: d.startMin, endMin: d.endMin, duplicate: d.duplicate })
  }, [appointments, blocks, cfg, onCommit, onConflict])

  const cancel = React.useCallback(() => setDrag(null), [])

  /** Keyboard parity: shift by snap (⇧↑↓) or switch resource (⇧←→). */
  const moveBy = React.useCallback(
    (appointmentId: string, deltaMin: number, deltaResource: number) => {
      const appt = appointments.find((a) => a.id === appointmentId)
      if (!appt) return
      const s = minutesInTz(appt.startsAt, cfg.timezone) + deltaMin
      const e = minutesInTz(appt.endsAt, cfg.timezone) + deltaMin
      const idx = resources.findIndex((r) => r.id === appt.resourceId)
      const nextResource = resources[Math.min(Math.max(idx + deltaResource, 0), resources.length - 1)]?.id ?? appt.resourceId
      if (s < cfg.dayStartMin || e > cfg.dayEndMin) return
      const conflict = detectConflict(
        { appointmentId, resourceId: nextResource, startMin: s, endMin: e },
        appointments,
        blocks,
        cfg
      )
      if (conflict) {
        onConflict(conflict)
        return
      }
      onCommit({ appointmentId, resourceId: nextResource, startMin: s, endMin: e, duplicate: false })
      announce?.(`Cita movida`)
    },
    [appointments, blocks, resources, cfg, onCommit, onConflict, announce]
  )

  return { drag, begin, update, finish, cancel, moveBy }
}
