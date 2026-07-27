import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { getTenants } from "@/lib/tenants"
import { generateReminders } from "@/lib/notifications/scheduler"
import { processQueue } from "@/lib/notifications/processor"

// GET /api/cron/send-reminders — invocado por Vercel Cron (vercel.json).
//
// Único punto de entrada del pipeline de notificaciones (R-1, ADR-028).
// Dos responsabilidades separadas por diseño que hoy conviven en el mismo
// endpoint: ReminderScheduler (descubre y encola) y NotificationProcessor
// (procesa la cola y envía). El día que necesiten escalar por separado se
// dividen sin romper contratos.
//
// La lógica es independiente de la cadencia: cada tick calcula la ventana
// "due" por tenant y el dedup vive en la DB — pasar de tick diario (Hobby)
// a horario (Pro) es solo editar el schedule, no tocar código.

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  // Demo mode / entorno sin DB: dry-run explícito, cero efectos.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[cron/send-reminders] Demo mode — dry run sin base de datos")
    return NextResponse.json({
      success: true,
      dryRun: true,
      tenants: [],
      queue: { total: 0, sent: 0, failed: 0, skipped: 0 },
    })
  }

  try {
    const db = createAdminSupabaseClient()
    const now = new Date()

    // ── ReminderScheduler: descubrir y encolar por tenant ──────────────────
    const tenants = await getTenants(db)
    const generation = []
    for (const tenant of tenants) {
      try {
        const result = await generateReminders(db, tenant, now)
        generation.push({ tenantId: tenant.id, timezone: tenant.timezone, ...result })
      } catch (err) {
        // Un tenant con error no debe frenar a los demás ni al procesamiento.
        console.error(`[cron/send-reminders] Error generando para ${tenant.id}:`, err)
        generation.push({ tenantId: tenant.id, timezone: tenant.timezone, error: String(err) })
      }
    }

    // ── NotificationProcessor: procesar la cola pendiente ──────────────────
    const queue = await processQueue(db, { now })

    if (queue.failed > 0) {
      console.error("[cron/send-reminders] Tick con fallos:", JSON.stringify({ generation, queue }))
    }
    return NextResponse.json({ success: true, dryRun: false, tenants: generation, queue })
  } catch (err) {
    console.error("[cron/send-reminders] Error fatal:", err)
    return NextResponse.json(
      { success: false, error: "Error procesando recordatorios" },
      { status: 500 }
    )
  }
}
