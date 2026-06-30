import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { withRateLimit, apiLimiter } from "@/lib/rate-limit"
import { isDemoMode } from "@/lib/demo-config"
import { z } from "zod"

const blockSchema = z.object({
  barber_id: z.string().uuid().optional(), // admin/manager puede indicar otro barbero
  block_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora de inicio inválida"),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/, "Hora de fin inválida"),
  reason:     z.string().min(1).max(200).default("Bloqueo"),
  block_type: z.enum(["break", "absence", "personal", "vacation"]).default("break"),
})

// Almacén en memoria para modo demo (sin persistencia real, se reinicia con el servidor)
type DemoBlock = {
  id: string
  barber_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string
  block_type: "break" | "absence" | "personal" | "vacation"
}
const demoBlocks: DemoBlock[] = []

// ---------- GET /api/schedule-blocks?barber_id=&date= ----------------------
export async function GET(request: NextRequest) {
  return withRateLimit(request, apiLimiter, async () => {
    const { searchParams } = new URL(request.url)

    if (isDemoMode()) {
      const barberId = searchParams.get("barber_id") ?? "demo-employee-001"
      const date = searchParams.get("date")
      let blocks = demoBlocks.filter(b => b.barber_id === barberId)
      if (date) blocks = blocks.filter(b => b.block_date === date)
      return NextResponse.json({ blocks })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const barberId = searchParams.get("barber_id") ?? user.id
    const date = searchParams.get("date")

    // Employees can only query their own blocks
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    const isPrivileged = ["admin", "manager"].includes(profile?.role ?? "")
    if (!isPrivileged && barberId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    let query = supabase
      .from("schedule_blocks")
      .select("id, barber_id, block_date, start_time, end_time, reason, block_type, created_at")
      .eq("barber_id", barberId)
      .order("block_date")
      .order("start_time")

    if (date) query = query.eq("block_date", date)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ blocks: data ?? [] })
  })
}

// ---------- POST /api/schedule-blocks --------------------------------------
export async function POST(request: NextRequest) {
  return withRateLimit(request, apiLimiter, async () => {
    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
    }

    const parsed = blockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 })
    }

    if (parsed.data.start_time >= parsed.data.end_time) {
      return NextResponse.json({ error: "La hora de fin debe ser posterior a la hora de inicio" }, { status: 400 })
    }

    if (isDemoMode()) {
      const id = `demo-block-${Date.now()}`
      demoBlocks.push({
        id,
        barber_id:  parsed.data.barber_id ?? "demo-employee-001",
        block_date: parsed.data.block_date,
        start_time: parsed.data.start_time,
        end_time:   parsed.data.end_time,
        reason:     parsed.data.reason,
        block_type: parsed.data.block_type,
      })
      return NextResponse.json({ success: true, id })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    const isPrivileged = ["admin", "manager"].includes(profile?.role ?? "")
    const barberId = parsed.data.barber_id ?? user.id

    if (!isPrivileged && barberId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("schedule_blocks")
      .insert({
        barber_id:  barberId,
        block_date: parsed.data.block_date,
        start_time: parsed.data.start_time,
        end_time:   parsed.data.end_time,
        reason:     parsed.data.reason,
        block_type: parsed.data.block_type,
        created_by: user.id,
      })
      .select("id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  })
}

// ---------- DELETE /api/schedule-blocks?id= --------------------------------
export async function DELETE(request: NextRequest) {
  return withRateLimit(request, apiLimiter, async () => {
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get("id")
    if (!blockId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    if (isDemoMode()) {
      const index = demoBlocks.findIndex(b => b.id === blockId)
      if (index !== -1) demoBlocks.splice(index, 1)
      return NextResponse.json({ success: true })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { error } = await supabase
      .from("schedule_blocks")
      .delete()
      .eq("id", blockId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  })
}
