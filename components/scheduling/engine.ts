// ORNO Scheduling Kit · M4 · Geometry engine
// Pure functions: time ⇄ pixels, snapping, overlap, gap discovery,
// conflict detection with alternatives. Fully unit-testable, no React, no DOM.

import type { SchedAppointment, ScheduleBlock, ScheduleConfig, ScheduleGap, ScheduleConflict } from "./types"

/** Minutes from local midnight for an ISO instant in the schedule's tz. */
export function minutesInTz(iso: string, timezone: string): number {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d)
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0)
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  return h * 60 + m
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${String(m).padStart(2, "0")}`
}

export const toPx = (min: number, cfg: ScheduleConfig) => (min - cfg.dayStartMin) * cfg.pxPerMinute
export const toMin = (px: number, cfg: ScheduleConfig) => px / cfg.pxPerMinute + cfg.dayStartMin
export const snap = (min: number, cfg: ScheduleConfig) => Math.round(min / cfg.snapMinutes) * cfg.snapMinutes
export const boardHeight = (cfg: ScheduleConfig) => toPx(cfg.dayEndMin, cfg)

export interface PlacedItem<T> {
  item: T
  top: number
  height: number
  startMin: number
  endMin: number
}

export function place<T extends { startsAt: string; endsAt: string }>(
  items: T[],
  cfg: ScheduleConfig
): Array<PlacedItem<T>> {
  return items.map((item) => {
    const startMin = minutesInTz(item.startsAt, cfg.timezone)
    const endMin = minutesInTz(item.endsAt, cfg.timezone)
    return { item, startMin, endMin, top: toPx(startMin, cfg), height: Math.max((endMin - startMin) * cfg.pxPerMinute, 18) }
  })
}

const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE

/** Free intervals ≥ minMinutes per resource, between appointments and blocks. */
export function suggestGaps(
  resourceId: string,
  appointments: SchedAppointment[],
  blocks: ScheduleBlock[],
  cfg: ScheduleConfig,
  opts: { minMinutes?: number; services?: Array<{ name: string; minutes: number }>; nowMin?: number } = {}
): ScheduleGap[] {
  const minMinutes = opts.minMinutes ?? 20
  const busy = [
    ...appointments.filter((a) => a.resourceId === resourceId && a.state !== "cancelled" && a.state !== "no_show"),
    ...blocks.filter((b) => b.resourceId === resourceId),
  ]
    .map((x) => ({ s: minutesInTz(x.startsAt, cfg.timezone), e: minutesInTz(x.endsAt, cfg.timezone) }))
    .sort((a, b) => a.s - b.s)

  const gaps: ScheduleGap[] = []
  let cursor = Math.max(cfg.dayStartMin, opts.nowMin ?? cfg.dayStartMin)
  for (const { s, e } of busy) {
    if (s - cursor >= minMinutes) gaps.push(mkGap(resourceId, cursor, s, opts.services))
    cursor = Math.max(cursor, e)
  }
  if (cfg.dayEndMin - cursor >= minMinutes) gaps.push(mkGap(resourceId, cursor, cfg.dayEndMin, opts.services))
  return gaps
}

function mkGap(
  resourceId: string,
  sMin: number,
  eMin: number,
  services?: Array<{ name: string; minutes: number }>
): ScheduleGap {
  const minutes = eMin - sMin
  const fits = services
    ?.filter((sv) => sv.minutes <= minutes)
    .sort((a, b) => b.minutes - a.minutes)[0]
  return {
    resourceId,
    minutes,
    startsAt: `@${sMin}`, // placeholder-min encoding; presentation uses minutes directly
    endsAt: `@${eMin}`,
    fitsService: fits,
  }
}

/** Validate a proposed move/resize. Returns null when free, or a conflict with nearest alternatives. */
export function detectConflict(
  proposal: { appointmentId: string; resourceId: string; startMin: number; endMin: number },
  appointments: SchedAppointment[],
  blocks: ScheduleBlock[],
  cfg: ScheduleConfig
): ScheduleConflict | null {
  const dur = proposal.endMin - proposal.startMin
  const busyOf = (resourceId: string) => [
    ...appointments
      .filter(
        (a) => a.resourceId === resourceId && a.id !== proposal.appointmentId && a.state !== "cancelled" && a.state !== "no_show"
      )
      .map((a) => ({ s: minutesInTz(a.startsAt, cfg.timezone), e: minutesInTz(a.endsAt, cfg.timezone), a })),
    ...blocks
      .filter((b) => b.resourceId === resourceId)
      .map((b) => ({ s: minutesInTz(b.startsAt, cfg.timezone), e: minutesInTz(b.endsAt, cfg.timezone), a: null as SchedAppointment | null })),
  ]

  const hits = busyOf(proposal.resourceId).filter((x) => overlaps(proposal.startMin, proposal.endMin, x.s, x.e))
  if (hits.length === 0) return null

  // Nearest free alternatives on the same resource: scan outward by snap.
  const alternatives: ScheduleConflict["alternatives"] = []
  const busy = busyOf(proposal.resourceId)
  for (let delta = cfg.snapMinutes; delta <= 240 && alternatives.length < 3; delta += cfg.snapMinutes) {
    for (const dir of [1, -1]) {
      const s = proposal.startMin + dir * delta
      const e = s + dur
      if (s < cfg.dayStartMin || e > cfg.dayEndMin) continue
      if (!busy.some((x) => overlaps(s, e, x.s, x.e))) {
        alternatives.push({ resourceId: proposal.resourceId, startsAt: `@${s}`, endsAt: `@${e}` })
        if (alternatives.length >= 3) break
      }
    }
  }

  return {
    attempted: {
      appointmentId: proposal.appointmentId,
      resourceId: proposal.resourceId,
      startsAt: `@${proposal.startMin}`,
      endsAt: `@${proposal.endMin}`,
    },
    collidesWith: hits.map((h) => h.a).filter(Boolean) as SchedAppointment[],
    alternatives,
  }
}

/** Decode the `@minutes` encoding used by gap/conflict results. */
export const decodeMin = (encoded: string): number =>
  encoded.startsWith("@") ? Number(encoded.slice(1)) : NaN
