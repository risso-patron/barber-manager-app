import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { updateCommissionRateSchema } from "@/lib/schemas"
import { isDemoMode } from "@/lib/demo-config"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRateLimit(request, strictLimiter, async () => {
    const { id } = params

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID de empleado inválido" }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
    }

    const parsed = updateCommissionRateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    // MODO DEMO
    if (isDemoMode()) {
      return NextResponse.json({ success: true })
    }

    // Auth: only admins
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

    const adminClient = createAdminSupabaseClient()
    const { error } = await adminClient
      .from("users")
      .update({ commission_rate: parsed.data.commission_rate })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar comisión:", error.message)
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  })
}
