import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { isDemoMode } from "@/lib/demo-config"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"

// PATCH /api/attendance/[id] — clock-out: closes an open attendance session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRateLimit(request, strictLimiter, async () => {
    const { id } = params

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID de sesión inválido" }, { status: 400 })
    }

    if (isDemoMode()) {
      return NextResponse.json({ success: true, check_out: new Date().toISOString() })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminClient = createAdminSupabaseClient()
    const checkOut = new Date().toISOString()

    // Only allow closing own session (or admin closing any)
    const { data: session } = await adminClient
      .from("attendance_logs")
      .select("user_id, check_out")
      .eq("id", id)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    const { data: caller } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const isOwner = session.user_id === user.id
    const isAdmin = caller?.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    if (session.check_out !== null) {
      return NextResponse.json({ error: "La sesión ya está cerrada" }, { status: 409 })
    }

    const { error } = await adminClient
      .from("attendance_logs")
      .update({ check_out: checkOut })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Error al registrar salida" }, { status: 500 })
    }

    return NextResponse.json({ success: true, check_out: checkOut })
  })
}
