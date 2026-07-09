// ORNO Scheduling Kit · M4 · Engine unit tests
// Cobertura mínima acordada en la Acceptance Review: minutesInTz,
// suggestGaps y detectConflict. Timezone fija (BA, UTC-3, sin DST)
// para resultados deterministas en cualquier máquina.

import { describe, it, expect } from "vitest"

import type { SchedAppointment, ScheduleBlock, ScheduleConfig } from "./types"
import { minutesInTz, suggestGaps, detectConflict, decodeMin, snap } from "./engine"

const TZ = "America/Argentina/Buenos_Aires"

const cfg: ScheduleConfig = {
  timezone: TZ,
  dayStartMin: 9 * 60, // 540
  dayEndMin: 20 * 60, // 1200
  snapMinutes: 15,
  pxPerMinute: 1.2,
}

function mkAppt(
  id: string,
  resourceId: string,
  start: string,
  end: string,
  state: SchedAppointment["state"] = "confirmed"
): SchedAppointment {
  return {
    id,
    locationId: "default",
    resourceId,
    clientName: `Cliente ${id}`,
    serviceName: "Corte",
    startsAt: `2026-07-09T${start}:00-03:00`,
    endsAt: `2026-07-09T${end}:00-03:00`,
    state,
  }
}

function mkBlock(id: string, resourceId: string, start: string, end: string): ScheduleBlock {
  return {
    id,
    resourceId,
    locationId: "default",
    startsAt: `2026-07-09T${start}:00-03:00`,
    endsAt: `2026-07-09T${end}:00-03:00`,
    label: "Almuerzo",
  }
}

describe("minutesInTz", () => {
  it("convierte un ISO con offset local a minutos desde medianoche en la tz", () => {
    expect(minutesInTz("2026-07-09T14:30:00-03:00", TZ)).toBe(14 * 60 + 30)
  })

  it("normaliza instantes UTC a la tz del schedule", () => {
    // 12:00Z = 09:00 en Buenos Aires (UTC-3)
    expect(minutesInTz("2026-07-09T12:00:00Z", TZ)).toBe(9 * 60)
  })

  it("el mismo instante da minutos distintos en tz distintas", () => {
    const iso = "2026-07-09T15:00:00-03:00" // 18:00Z
    expect(minutesInTz(iso, TZ)).toBe(15 * 60)
    expect(minutesInTz(iso, "UTC")).toBe(18 * 60)
  })

  it("medianoche exacta devuelve 0", () => {
    expect(minutesInTz("2026-07-09T00:00:00-03:00", TZ)).toBe(0)
  })
})

describe("suggestGaps", () => {
  it("día vacío: un único hueco que cubre toda la jornada", () => {
    const gaps = suggestGaps("r1", [], [], cfg)
    expect(gaps).toHaveLength(1)
    expect(decodeMin(gaps[0]!.startsAt)).toBe(cfg.dayStartMin)
    expect(decodeMin(gaps[0]!.endsAt)).toBe(cfg.dayEndMin)
    expect(gaps[0]!.minutes).toBe(cfg.dayEndMin - cfg.dayStartMin)
  })

  it("una cita parte el día en dos huecos", () => {
    const gaps = suggestGaps("r1", [mkAppt("a1", "r1", "10:00", "10:30")], [], cfg)
    expect(gaps).toHaveLength(2)
    expect([decodeMin(gaps[0]!.startsAt), decodeMin(gaps[0]!.endsAt)]).toEqual([540, 600])
    expect([decodeMin(gaps[1]!.startsAt), decodeMin(gaps[1]!.endsAt)]).toEqual([630, 1200])
  })

  it("descarta huecos menores a minMinutes", () => {
    // Hueco de 15 min entre 9:00 y 9:15 — con minMinutes 20 no aparece
    const gaps = suggestGaps("r1", [mkAppt("a1", "r1", "09:15", "12:00")], [], cfg, { minMinutes: 20 })
    expect(gaps).toHaveLength(1)
    expect(decodeMin(gaps[0]!.startsAt)).toBe(12 * 60)
  })

  it("ignora citas canceladas y no_show", () => {
    const gaps = suggestGaps(
      "r1",
      [mkAppt("a1", "r1", "10:00", "11:00", "cancelled"), mkAppt("a2", "r1", "12:00", "13:00", "no_show")],
      [],
      cfg
    )
    expect(gaps).toHaveLength(1)
    expect(gaps[0]!.minutes).toBe(660)
  })

  it("los bloqueos cuentan como ocupado", () => {
    const gaps = suggestGaps("r1", [], [mkBlock("b1", "r1", "13:00", "14:00")], cfg)
    expect(gaps).toHaveLength(2)
    expect(decodeMin(gaps[0]!.endsAt)).toBe(13 * 60)
    expect(decodeMin(gaps[1]!.startsAt)).toBe(14 * 60)
  })

  it("ignora citas de otros recursos", () => {
    const gaps = suggestGaps("r1", [mkAppt("a1", "r2", "10:00", "18:00")], [], cfg)
    expect(gaps).toHaveLength(1)
  })

  it("fitsService elige el servicio más largo que cabe en el hueco", () => {
    const services = [
      { name: "Barba", minutes: 20 },
      { name: "Corte", minutes: 30 },
      { name: "Combo", minutes: 60 },
    ]
    // Hueco de 40 min entre 9:00 y 9:40 → cabe Corte (30), no Combo (60)
    const gaps = suggestGaps("r1", [mkAppt("a1", "r1", "09:40", "19:00")], [], cfg, { services })
    expect(gaps[0]!.fitsService?.name).toBe("Corte")
  })

  it("nowMin descarta el pasado del día", () => {
    const gaps = suggestGaps("r1", [], [], cfg, { nowMin: 14 * 60 })
    expect(gaps).toHaveLength(1)
    expect(decodeMin(gaps[0]!.startsAt)).toBe(14 * 60)
  })
})

describe("detectConflict", () => {
  const appointments = [mkAppt("a1", "r1", "10:00", "11:00"), mkAppt("a2", "r1", "15:00", "16:00")]

  it("devuelve null cuando el horario está libre", () => {
    const conflict = detectConflict(
      { appointmentId: "x", resourceId: "r1", startMin: 12 * 60, endMin: 12 * 60 + 30 },
      appointments,
      [],
      cfg
    )
    expect(conflict).toBeNull()
  })

  it("detecta la colisión y reporta con quién se cruza", () => {
    const conflict = detectConflict(
      { appointmentId: "x", resourceId: "r1", startMin: 10 * 60 + 30, endMin: 11 * 60 + 30 },
      appointments,
      [],
      cfg
    )
    expect(conflict).not.toBeNull()
    expect(conflict!.collidesWith.map((c) => c.id)).toEqual(["a1"])
  })

  it("mover la propia cita sobre sí misma no es conflicto", () => {
    const conflict = detectConflict(
      { appointmentId: "a1", resourceId: "r1", startMin: 10 * 60, endMin: 11 * 60 },
      appointments,
      [],
      cfg
    )
    expect(conflict).toBeNull()
  })

  it("ignora citas canceladas y no_show como colisión", () => {
    const conflict = detectConflict(
      { appointmentId: "x", resourceId: "r1", startMin: 10 * 60, endMin: 11 * 60 },
      [mkAppt("a1", "r1", "10:00", "11:00", "cancelled")],
      [],
      cfg
    )
    expect(conflict).toBeNull()
  })

  it("un bloqueo produce conflicto sin collidesWith (colisión con bloqueo, no con cita)", () => {
    const conflict = detectConflict(
      { appointmentId: "x", resourceId: "r1", startMin: 13 * 60, endMin: 13 * 60 + 30 },
      [],
      [mkBlock("b1", "r1", "13:00", "14:00")],
      cfg
    )
    expect(conflict).not.toBeNull()
    expect(conflict!.collidesWith).toHaveLength(0)
  })

  it("propone hasta 3 alternativas libres, dentro de la jornada y sin solaparse", () => {
    const conflict = detectConflict(
      { appointmentId: "x", resourceId: "r1", startMin: 10 * 60, endMin: 11 * 60 },
      appointments,
      [],
      cfg
    )
    expect(conflict).not.toBeNull()
    expect(conflict!.alternatives.length).toBeGreaterThan(0)
    expect(conflict!.alternatives.length).toBeLessThanOrEqual(3)
    for (const alt of conflict!.alternatives) {
      const s = decodeMin(alt.startsAt)
      const e = decodeMin(alt.endsAt)
      expect(e - s).toBe(60) // conserva la duración
      expect(s).toBeGreaterThanOrEqual(cfg.dayStartMin)
      expect(e).toBeLessThanOrEqual(cfg.dayEndMin)
      expect(
        detectConflict({ appointmentId: "x", resourceId: "r1", startMin: s, endMin: e }, appointments, [], cfg)
      ).toBeNull()
    }
  })

  it("no propone alternativas en otros recursos (solo el mismo barbero)", () => {
    const conflict = detectConflict(
      { appointmentId: "x", resourceId: "r1", startMin: 10 * 60, endMin: 11 * 60 },
      appointments,
      [],
      cfg
    )
    for (const alt of conflict!.alternatives) {
      expect(alt.resourceId).toBe("r1")
    }
  })
})

describe("snap", () => {
  it("redondea al múltiplo de snapMinutes más cercano", () => {
    expect(snap(547, cfg)).toBe(540)
    expect(snap(553, cfg)).toBe(555)
  })
})
