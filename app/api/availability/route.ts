import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
type AppointmentAvailability = {
  appointment_time: string
  service:
    | {
        duration: number
      }
    | {
        duration: number
      }[]
    | null
}

type ScheduleBlockAvailability = {
  start_time: string
  end_time: string
}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const barberId = searchParams.get("barberId")
    const serviceId = searchParams.get("serviceId")
    const date = searchParams.get("date")

    if (!barberId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      )
    }

    const { data: service } = await supabase
      .from("services")
      .select("duration")
      .eq("id", serviceId)
      .single()

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    const duration = service.duration

    const { data: appointments } = await supabase
      .from("appointments")
      .select(`
        appointment_time,
        service:services(duration)
      `)
      .eq("barber_id", barberId)
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed"])

    const { data: blocks } = await supabase
      .from("schedule_blocks")
      .select("start_time,end_time")
      .eq("barber_id", barberId)
      .eq("block_date", date)

    const slots = generateAvailableSlots(
      duration,
      appointments || [],
      blocks || []
    )

    return NextResponse.json({
      success: true,
      slots
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)

  if (h === undefined || m === undefined) {
    throw new Error(`Invalid time format: ${time}`)
  }

  return h * 60 + m
}

function overlaps(
  start1: number,
  end1: number,
  start2: number,
  end2: number
) {
  return start1 < end2 && end1 > start2
}

function generateAvailableSlots(
  serviceDuration: number,
  appointments: AppointmentAvailability[],
  blocks: ScheduleBlockAvailability[]
) {
  const available: string[] = []

  const startDay = 9 * 60
  const endDay = 18 * 60

  for (
    let slotStart = startDay;
    slotStart + serviceDuration <= endDay;
    slotStart += 30
  ) {
    const slotEnd = slotStart + serviceDuration

    let occupied = false

    for (const apt of appointments) {
      const aptStart = timeToMinutes(
        apt.appointment_time.substring(0, 5)
      )

      const aptDuration = Array.isArray(apt.service)
      ? apt.service[0]?.duration ?? 30
      : apt.service?.duration ?? 30

      const aptEnd = aptStart + aptDuration

      if (
        overlaps(
          slotStart,
          slotEnd,
          aptStart,
          aptEnd
        )
      ) {
        occupied = true
        break
      }
    }

    if (occupied) continue

    for (const block of blocks) {
      const blockStart = timeToMinutes(
        block.start_time.substring(0, 5)
      )

      const blockEnd = timeToMinutes(
        block.end_time.substring(0, 5)
      )

      if (
        overlaps(
          slotStart,
          slotEnd,
          blockStart,
          blockEnd
        )
      ) {
        occupied = true
        break
      }
    }

    if (!occupied) {
      const hour = Math.floor(slotStart / 60)
      const minute = slotStart % 60

      available.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      )
    }
  }

  return available
}