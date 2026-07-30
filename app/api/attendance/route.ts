import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { isDemoMode } from "@/lib/demo"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"

// POST /api/attendance — clock-in: creates an open attendance log for the authenticated employee
export async function POST(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    if (isDemoMode()) {
      return NextResponse.json({
        id: "demo-attendance-id",
        check_in: new Date().toISOString(),
      })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminClient = createAdminSupabaseClient()

    // Close any accidentally open sessions before opening a new one
    await adminClient
      .from("attendance_logs")
      .update({ check_out: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("check_out", null)

    const { data, error } = await adminClient
      .from("attendance_logs")
      .insert({ user_id: user.id })
      .select("id, check_in")
      .single()

    if (error) {
      return NextResponse.json({ error: "Error al registrar entrada" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  })
}

// GET /api/attendance — admin: list all logs; employee: get own open session
export async function GET(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    if (isDemoMode()) {
      return NextResponse.json([])
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const adminClient = createAdminSupabaseClient()
    const url = new URL(request.url)

    if (caller?.role === "admin") {
      // Admin: return all logs (optionally filtered)
      const employeeId = url.searchParams.get("employee_id")
      const dateFrom = url.searchParams.get("from")
      const dateTo = url.searchParams.get("to")

      let query = adminClient
        .from("attendance_logs")
        .select("id, user_id, check_in, check_out, users(name)")
        .order("check_in", { ascending: false })
        .limit(200)

      if (employeeId) query = query.eq("user_id", employeeId)
      if (dateFrom)   query = query.gte("check_in", dateFrom)
      if (dateTo)     query = query.lte("check_in", dateTo)

      const { data, error } = await query
      if (error) return NextResponse.json({ error: "Error al consultar registros" }, { status: 500 })
      return NextResponse.json(data)
    }

    // Employee: return their current open session
    const { data, error } = await adminClient
      .from("attendance_logs")
      .select("id, check_in")
      .eq("user_id", user.id)
      .is("check_out", null)
      .order("check_in", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: "Error al consultar sesión" }, { status: 500 })
    return NextResponse.json(data)
  })
}
