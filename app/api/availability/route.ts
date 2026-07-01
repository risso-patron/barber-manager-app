import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

type AppointmentRow = {
  appointment_time: string
  service: { duration: number } | { duration: number }[] | null
}

type ScheduleBlockRow = {
  start_time: string
  end_time: string
}

function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number)
  if (h === undefined || m === undefined) throw new Error(`Formato de hora inválido: ${time}`)
  return h * 60 + m
}

function overlaps(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && e1 > s2
}

function generateSlots(
  serviceDuration: number,
  appointments: AppointmentRow[],
  blocks: ScheduleBlockRow[]
): string[] {
  const slots: string[] = []
  const startDay = 9 * 60  // 09:00
  const endDay = 18 * 60   // 18:00

  for (let slotStart = startDay; slotStart + serviceDuration <= endDay; slotStart += 30) {
    const slotEnd = slotStart + serviceDuration
    let occupied = false

    for (const apt of appointments) {
      const aptStart = timeToMinutes(apt.appointment_time)
      const aptDuration = Array.isArray(apt.service)
        ? apt.service[0]?.duration ?? 30
        : apt.service?.duration ?? 30
      if (overlaps(slotStart, slotEnd, aptStart, aptStart + aptDuration)) {
        occupied = true
        break
      }
    }
    if (occupied) continue

    for (const block of blocks) {
      const blockStart = timeToMinutes(block.start_time)
      const blockEnd = timeToMinutes(block.end_time)
      if (overlaps(slotStart, slotEnd, blockStart, blockEnd)) {
        occupied = true
        break
      }
    }

    if (!occupied) {
      const h = Math.floor(slotStart / 60)
      const m = slotStart % 60
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }
  }

  return slots
}

function generateDemoSlots(): string[] {
  const slots: string[] = []
  for (let min = 9 * 60; min < 18 * 60; min += 30) {
    const h = Math.floor(min / 60)
    const m = min % 60
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }
  return slots
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const barberId = searchParams.get("barberId")
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date")

  if (!barberId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Faltan parámetros requeridos: barberId, serviceId, date" },
      { status: 400 }
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Formato de fecha inválido. Use YYYY-MM-DD" },
      { status: 400 }
    )
  }

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Demo mode: devolver todos los horarios disponibles sin consultar BD
  if (!hasSupabaseConfig) {
    return NextResponse.json({
      date,
      barberId,
      serviceId,
      slots: generateDemoSlots(),
      mode: "demo" as const,
    })
  }

  try {
    const supabase = createAdminSupabaseClient()

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("duration")
      .eq("id", serviceId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    const [{ data: appointments }, { data: blocks }] = await Promise.all([
      supabase
        .from("appointments")
        .select("appointment_time, service:services(duration)")
        .eq("barber_id", barberId)
        .eq("appointment_date", date)
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("schedule_blocks")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("block_date", date),
    ])

    const slots = generateSlots(service.duration, appointments ?? [], blocks ?? [])

    return NextResponse.json({
      date,
      barberId,
      serviceId,
      slots,
      mode: "real" as const,
    })
  } catch (error) {
    console.error("[availability]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
