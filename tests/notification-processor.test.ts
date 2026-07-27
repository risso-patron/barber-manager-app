import { describe, it, expect, vi } from "vitest"
import {
  canSendNotification,
  deliverNotification,
  claimNotification,
  reclaimStale,
  type DeliveryEnv,
  type QueueRow,
} from "@/lib/notifications/processor"
import { DEFAULT_TENANT_ID } from "@/lib/tenants"

const fullEnv: DeliveryEnv = {
  resendApiKey: "re_test",
  resendFromEmail: "noreply@orno.app",
  twilioAccountSid: "AC_test",
  twilioAuthToken: "token_test",
  twilioWhatsappFrom: "whatsapp:+14155238886",
}

const baseRow: QueueRow = {
  id: "n1",
  type: "reminder",
  tenant_id: DEFAULT_TENANT_ID,
  recipient_phone: "+507 6111-1111",
  recipient_email: "luis@example.com",
  recipient_name: "Luis",
  message_sms: "Recordatorio SMS",
  message_email: "Recordatorio email",
  subject_email: "⏰ Recordatorio de tu cita",
  attempts: 0,
  metadata: null,
}

function okFetch() {
  return vi.fn(
    async (_url: RequestInfo | URL, _init?: RequestInit) => new Response("{}", { status: 200 })
  )
}

describe("canSendNotification — seam de cuotas", () => {
  it("hoy siempre permite; el pipeline no conoce planes ni créditos", async () => {
    const decision = await canSendNotification(DEFAULT_TENANT_ID)
    expect(decision.allowed).toBe(true)
  })

  it("tolera tenant_id null (filas legadas anteriores al script 36)", async () => {
    const decision = await canSendNotification(null)
    expect(decision.allowed).toBe(true)
  })
})

describe("deliverNotification", () => {
  it("envía email vía Resend y WhatsApp vía Twilio cuando todo está configurado", async () => {
    const fetchFn = okFetch()
    const result = await deliverNotification(baseRow, fullEnv, fetchFn)

    expect(fetchFn).toHaveBeenCalledTimes(2)
    const [emailUrl] = fetchFn.mock.calls[0]!
    const [twilioUrl, twilioInit] = fetchFn.mock.calls[1]!
    expect(String(emailUrl)).toContain("api.resend.com")
    expect(String(twilioUrl)).toContain("api.twilio.com")
    // Normaliza el destino al formato whatsapp: de Twilio
    expect(String((twilioInit as RequestInit).body)).toContain("whatsapp%3A%2B507")
    expect(result.email).toBe("sent")
    expect(result.whatsapp).toBe("sent")
  })

  it("omite canales sin credenciales sin lanzar error", async () => {
    const fetchFn = okFetch()
    const result = await deliverNotification(baseRow, {}, fetchFn)
    expect(fetchFn).not.toHaveBeenCalled()
    expect(result.email).toBe("skipped")
    expect(result.whatsapp).toBe("skipped")
  })

  it("propaga el error si un canal intentado falla", async () => {
    const fetchFn = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("resend")) return new Response("boom", { status: 500 })
      return new Response("{}", { status: 200 })
    })
    await expect(deliverNotification(baseRow, fullEnv, fetchFn)).rejects.toThrow(/Resend/)
  })

  it("no llama a Resend si la fila no tiene email", async () => {
    const fetchFn = okFetch()
    const result = await deliverNotification(
      { ...baseRow, recipient_email: null, message_email: null },
      fullEnv,
      fetchFn
    )
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result.email).toBe("skipped")
    expect(result.whatsapp).toBe("sent")
  })
})

describe("claimNotification — compare-and-swap contra doble envío", () => {
  function fakeDb(claimedRows: Array<{ id: string }>) {
    const update = vi.fn()
    const chain = {
      update: (payload: unknown) => {
        update(payload)
        return chain
      },
      eq: () => chain,
      select: async () => ({ data: claimedRows, error: null }),
    }
    return { db: { from: () => chain }, update }
  }

  it("devuelve true cuando este worker ganó la fila e incrementa attempts", async () => {
    const { db, update } = fakeDb([{ id: "n1" }])
    const claimed = await claimNotification(db as never, "n1", 0, "2026-07-10T14:00:00.000Z")
    expect(claimed).toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "processing",
        attempts: 1,
        processing_at: "2026-07-10T14:00:00.000Z",
      })
    )
  })

  it("devuelve false cuando otro worker la tomó primero (0 filas afectadas)", async () => {
    const { db } = fakeDb([])
    const claimed = await claimNotification(db as never, "n1", 0, "2026-07-10T14:00:00.000Z")
    expect(claimed).toBe(false)
  })
})

describe("reclaimStale — filas atascadas en processing por un worker muerto", () => {
  function recordingDb() {
    const updates: Array<{ payload: unknown; filters: string[] }> = []
    function chain(payload: unknown) {
      const filters: string[] = []
      const c = {
        eq: (col: string, val: unknown) => {
          filters.push(`eq:${col}=${val}`)
          return c
        },
        lt: (col: string, val: unknown) => {
          filters.push(`lt:${col}=${val}`)
          return c
        },
        gte: (col: string, val: unknown) => {
          filters.push(`gte:${col}=${val}`)
          return c
        },
        then: (resolve: (v: { error: null }) => void) => {
          updates.push({ payload, filters })
          resolve({ error: null })
        },
      }
      return c
    }
    return { db: { from: () => ({ update: chain }) }, updates }
  }

  it("con intentos restantes vuelve a pending; sin intentos restantes muere como failed (nunca zombie)", async () => {
    const { db, updates } = recordingDb()
    await reclaimStale(db as never, "2026-07-10T13:45:00.000Z", 3)

    expect(updates).toHaveLength(2)
    // Recuperables: pending para reintento
    expect(updates[0]!.payload).toEqual({ status: "pending" })
    expect(updates[0]!.filters).toContain("eq:status=processing")
    expect(updates[0]!.filters).toContain("lt:attempts=3")
    // Agotadas: failed con motivo — jamás quedan pending invisibles al fetch
    expect(updates[1]!.payload).toEqual(
      expect.objectContaining({ status: "failed", error_message: expect.stringContaining("interrumpido") })
    )
    expect(updates[1]!.filters).toContain("gte:attempts=3")
  })
})
