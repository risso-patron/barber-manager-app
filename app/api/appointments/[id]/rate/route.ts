import { NextRequest, NextResponse } from "next/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { submitRatingSchema } from "@/lib/schemas"
import { isDemoMode } from "@/lib/demo-config"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, strictLimiter, async () => {
    const { id } = await params

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID de cita inválido" }, { status: 400 })
    }

    // Parse + validate body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 })
    }

    const parsed = submitRatingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { rating, review_text } = parsed.data

    // MODO DEMO
    if (isDemoMode()) {
      return NextResponse.json({ success: true, message: "Calificación guardada (modo demo)" })
    }

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Fetch appointment to validate ownership + status
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, client_id, status, rating")
      .eq("id", id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // Only the client who owns the appointment can rate it
    if (appointment.client_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Only completed appointments can be rated
    if (appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Solo se pueden calificar citas completadas" },
        { status: 409 }
      )
    }

    // Write via admin client (bypasses RLS for safety)
    const adminClient = createAdminSupabaseClient()
    const { error: updateError } = await adminClient
      .from("appointments")
      .update({
        rating,
        review_text: review_text ?? null,
      })
      .eq("id", id)

    if (updateError) {
      console.error("Error al guardar calificación:", updateError.message)
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }

    // Low-rating alert (belt-and-suspenders: the DB trigger handles the normal case)
    if (rating <= 2) {
      const { data: apt } = await adminClient
        .from("appointments")
        .select("client_id, employee_id")
        .eq("id", id)
        .single()

      if (apt) {
        await adminClient.from("low_rating_alerts").insert({
          appointment_id: id,
          client_id: apt.client_id,
          employee_id: apt.employee_id,
          rating,
          review_text: review_text ?? null,
        })
      }
    }

    return NextResponse.json({ success: true })
  })
}
