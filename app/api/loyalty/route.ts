import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { adjustLoyaltySchema } from "@/lib/schemas"
import { isDemoMode } from "@/lib/demo"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"

// GET /api/loyalty?user_id=... — get points balance + recent transactions
export async function GET(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    if (isDemoMode()) {
      return NextResponse.json({ points: 120, transactions: [] })
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
    const targetId = url.searchParams.get("user_id") ?? user.id

    // Non-admin clients can only read their own data
    if (caller?.role !== "admin" && targetId !== user.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const [pointsResult, txResult] = await Promise.all([
      adminClient.from("users").select("loyalty_points").eq("id", targetId).single(),
      adminClient
        .from("loyalty_transactions")
        .select("id, points, type, description, created_at")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      points: pointsResult.data?.loyalty_points ?? 0,
      transactions: txResult.data ?? [],
    })
  })
}

// POST /api/loyalty — admin adjusts points manually
export async function POST(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
    }

    // Demo primero, como en GET: los ids demo ('c1'…) no son UUID, así que
    // el schema estricto de abajo aplica únicamente a Supabase real.
    if (isDemoMode()) {
      return NextResponse.json({ success: true })
    }

    const parsed = adjustLoyaltySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 422 }
      )
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

    if (caller?.role !== "admin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { user_id, points, description } = parsed.data
    const adminClient = createAdminSupabaseClient()

    // Fetch current balance to prevent negative total
    const { data: target } = await adminClient
      .from("users")
      .select("loyalty_points")
      .eq("id", user_id)
      .single()

    const current = target?.loyalty_points ?? 0
    if (current + points < 0) {
      return NextResponse.json(
        { error: "El ajuste dejaría el saldo en negativo" },
        { status: 422 }
      )
    }

    const type = points > 0 ? "adjustment" : "redeem"

    const [updateResult, txResult] = await Promise.all([
      adminClient
        .from("users")
        .update({ loyalty_points: current + points })
        .eq("id", user_id),
      adminClient.from("loyalty_transactions").insert({
        user_id,
        points,
        type,
        description: description ?? (points > 0 ? "Ajuste manual (+)" : "Canje manual"),
        created_by: user.id,
      }),
    ])

    if (updateResult.error || txResult.error) {
      return NextResponse.json({ error: "Error al actualizar puntos" }, { status: 500 })
    }

    return NextResponse.json({ success: true, new_balance: current + points })
  })
}
