import { NextRequest, NextResponse } from "next/server"
import { isDemoMode } from "@/lib/demo-config"
import { DEMO_APPOINTMENTS } from "@/lib/demo-appointments"
import { demoBlocksStore } from "@/lib/demo-blocks-store"
import { withRateLimit, apiLimiter } from "@/lib/rate-limit"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const OPEN_MINS  = 9 * 60   // 09:00
const CLOSE_MINS = 19 * 60  // 19:00 — slots must end by this
const SLOT_STEP  = 30       // every 30 min

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h! * 60 + (m ?? 0)
}

function minsToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart
}

function generateSlots(duration: number): string[] {
  const slots: string[] = []
  for (let t = OPEN_MINS; t + duration <= CLOSE_MINS; t += SLOT_STEP) {
    slots.push(minsToTime(t))
  }
  return slots
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, apiLimiter, async () => {
    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get("barber_id")
    const date     = searchParams.get("date")
    const durParam = searchParams.get("duration")

    if (!barberId || !date || !durParam) {
      return NextResponse.json({ error: "barber_id, date y duration son requeridos" }, { status: 400 })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" }, { status: 400 })
    }

    const duration = parseInt(durParam, 10)
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: "duration debe ser un número positivo" }, { status: 400 })
    }

    const allSlots = generateSlots(duration)

    if (isDemoMode()) {
      const apts = DEMO_APPOINTMENTS.filter(
        a => a.employeeId === barberId &&
             a.date === date &&
             (a.status === "pending" || a.status === "confirmed")
      )
      const blocks = demoBlocksStore.filter(
        b => b.barber_id === barberId && b.block_date === date
      )

      const available = allSlots.filter(slot => {
        const slotStart = timeToMins(slot)
        const slotEnd   = slotStart + duration
        const hitApt   = apts.some(a => overlaps(slotStart, slotEnd, timeToMins(a.time), timeToMins(a.time) + a.duration))
        const hitBlock = blocks.some(b => overlaps(slotStart, slotEnd, timeToMins(b.start_time), timeToMins(b.end_time)))
        return !hitApt && !hitBlock
      })

      return NextResponse.json({ available })
    }

    // Supabase mode
    try {
      const supabase = await createServerSupabaseClient()

      const [{ data: apts }, { data: blocks }] = await Promise.all([
        supabase
          .from("appointments")
          .select("appointment_time, services(duration)")
          .eq("barber_id", barberId)
          .eq("appointment_date", date)
          .in("status", ["pending", "confirmed"]),
        supabase
          .from("schedule_blocks")
          .select("start_time, end_time")
          .eq("barber_id", barberId)
          .eq("block_date", date),
      ])

      const available = allSlots.filter(slot => {
        const slotStart = timeToMins(slot)
        const slotEnd   = slotStart + duration

        const hitApt = (apts ?? []).some((a: { appointment_time: string; services: { duration: number } | { duration: number }[] | null }) => {
          const svc = Array.isArray(a.services) ? a.services[0] : a.services
          return overlaps(slotStart, slotEnd, timeToMins(a.appointment_time), timeToMins(a.appointment_time) + (svc?.duration ?? 30))
        })

        const hitBlock = (blocks ?? []).some((b: { start_time: string; end_time: string }) =>
          overlaps(slotStart, slotEnd, timeToMins(b.start_time), timeToMins(b.end_time))
        )

        return !hitApt && !hitBlock
      })

      return NextResponse.json({ available })
    } catch {
      // Fallback: all slots if DB call fails
      return NextResponse.json({ available: allSlots })
    }
  })
}
