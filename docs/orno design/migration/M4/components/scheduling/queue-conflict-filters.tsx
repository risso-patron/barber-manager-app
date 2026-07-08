"use client"

// ORNO Scheduling Kit · M4 · WalkInQueue + ConflictResolver + ScheduleFilters

import * as React from "react"
import { GripVertical, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { WalkInEntry, ScheduleConflict } from "./types"
import { decodeMin, minutesToLabel } from "./engine"

/* ── WalkInQueue — waiting clients, draggable onto gaps ── */
export interface WalkInQueueProps {
  entries: WalkInEntry[]
  /** Elapsed-minute formatter injected so the queue re-renders on a clock tick. */
  nowIso: string
  onAdd?: () => void
  onDragStart?: (entry: WalkInEntry, e: React.PointerEvent) => void
  onAssign?: (entry: WalkInEntry) => void
  className?: string
}

export function WalkInQueue({ entries, nowIso, onAdd, onDragStart, onAssign, className }: WalkInQueueProps) {
  const waitedMin = (arrivedAt: string) => Math.max(0, Math.round((+new Date(nowIso) - +new Date(arrivedAt)) / 60000))
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {entries.map((w) => {
        const waited = waitedMin(w.arrivedAt)
        return (
          <div
            key={w.id}
            onPointerDown={(e) => onDragStart?.(w, e)}
            className="flex cursor-grab touch-none items-center gap-2.5 rounded-[14px] border border-border bg-card px-3.5 py-3 transition-shadow duration-micro hover:shadow-raised active:cursor-grabbing"
          >
            <GripVertical className="size-3.5 shrink-0 text-ink-300" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-foreground">{w.name}</p>
              {w.serviceName && <p className="truncate text-xs text-ink-600">{w.serviceName}</p>}
            </div>
            <span className={cn("nums shrink-0 text-[11.5px] font-semibold", waited >= 10 ? "text-warning-text" : "text-ink-600")}>
              {waited} min
            </span>
            {onAssign && (
              <Button variant="secondary" size="sm" onClick={() => onAssign(w)}>
                Asignar
              </Button>
            )}
          </div>
        )
      })}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-ink-300/60 text-[13px] font-semibold text-ink-600 transition-colors duration-micro hover:border-primary hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-[15px]" aria-hidden="true" />
          Añadir walk-in
        </button>
      )}
    </div>
  )
}

/* ── ConflictResolver — human dialog, nearest alternatives, one tap ── */
export interface ConflictResolverProps {
  conflict: ScheduleConflict | null
  onClose: () => void
  onPick: (alt: { resourceId: string; startMin: number; endMin: number }) => void
  resourceName: (id: string) => string
}

export function ConflictResolver({ conflict, onClose, onPick, resourceName }: ConflictResolverProps) {
  if (!conflict) return null
  const names = conflict.collidesWith.map((c) => c.clientName).join(", ")
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ese horario está ocupado</DialogTitle>
          <DialogDescription>
            {names ? `Se cruza con la cita de ${names}.` : "Se cruza con un bloqueo."} Estos horarios cercanos están libres:
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {conflict.alternatives.map((alt, i) => {
            const s = decodeMin(alt.startsAt)
            const e = decodeMin(alt.endsAt)
            return (
              <Button
                key={i}
                variant={i === 0 ? "primary" : "secondary"}
                onClick={() => onPick({ resourceId: alt.resourceId, startMin: s, endMin: e })}
                className="justify-between"
              >
                <span className="nums">
                  {minutesToLabel(s)} – {minutesToLabel(e)}
                </span>
                <span className="text-sm font-medium opacity-80">{resourceName(alt.resourceId)}</span>
              </Button>
            )
          })}
          {conflict.alternatives.length === 0 && (
            <p className="py-2 text-sm text-ink-600">No hay huecos cercanos hoy. Prueba otro barbero u otro día.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Dejar como estaba
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── ScheduleFilters — toolbar filter row (resource / service / state) ── */
export interface FilterOption {
  value: string
  label: string
}

export interface ScheduleFiltersProps {
  resources: FilterOption[]
  services?: FilterOption[]
  states?: FilterOption[]
  value: { resource?: string; service?: string; state?: string }
  onChange: (next: ScheduleFiltersProps["value"]) => void
  className?: string
}

export function ScheduleFilters({ resources, services, states, value, onChange, className }: ScheduleFiltersProps) {
  const Chip = ({
    label,
    options,
    current,
    set,
  }: {
    label: string
    options: FilterOption[]
    current?: string
    set: (v?: string) => void
  }) => (
    <select
      aria-label={label}
      value={current ?? ""}
      onChange={(e) => set(e.target.value || undefined)}
      className={cn(
        "h-[38px] cursor-pointer rounded-xl border border-border bg-card px-3.5 text-[13.5px] font-medium text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        current && "border-primary bg-accent text-accent-foreground"
      )}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <Chip label="Todos los barberos" options={resources} current={value.resource} set={(v) => onChange({ ...value, resource: v })} />
      {services && <Chip label="Servicio" options={services} current={value.service} set={(v) => onChange({ ...value, service: v })} />}
      {states && <Chip label="Estado" options={states} current={value.state} set={(v) => onChange({ ...value, state: v })} />}
    </div>
  )
}
