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

// ---------- GET /api/schedule-blocks?barber_id=&date= ----------------------
export async function GET(request: NextRequest) {
  return withRateLimit(request, apiLimiter, async () => {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    if (isDemoMode()) return NextResponse.json({ blocks: [] })

    const { searchParams } = new URL(request.url)
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
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
    }

    const parsed = blockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 })
    }

    if (isDemoMode()) return NextResponse.json({ success: true, id: "demo-block" })

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    const isPrivileged = ["admin", "manager"].includes(profile?.role ?? "")
    const barberId = parsed.data.barber_id ?? user.id

    if (!isPrivileged && barberId !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (parsed.data.start_time >= parsed.data.end_time) {
      return NextResponse.json({ error: "La hora de fin debe ser posterior a la hora de inicio" }, { status: 400 })
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
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get("id")
    if (!blockId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    if (isDemoMode()) return NextResponse.json({ success: true })

    const { error } = await supabase
      .from("schedule_blocks")
      .delete()
      .eq("id", blockId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  })
}
