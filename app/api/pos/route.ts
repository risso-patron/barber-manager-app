import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"
import { withRateLimit, strictLimiter } from "@/lib/rate-limit"
import { isDemoMode } from "@/lib/demo-config"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ----------- Zod schema ----------------------------------------------------

const posItemSchema = z.object({
  item_type: z.enum(["service", "product"]),
  item_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
})

const posSaleSchema = z.object({
  client_id: z.string().uuid().optional(),
  payment_method: z.enum(["cash", "card", "transfer"]),
  discount: z.number().min(0).default(0),
  redeem_points: z.number().int().min(0).default(0),
  tip: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
  items: z.array(posItemSchema).min(1, "Debe incluir al menos un ítem"),
})

// ----------- Demo data ------------------------------------------------------

const DEMO_SALES = [
  {
    id: "demo-1",
    client_id: null,
    payment_method: "cash",
    subtotal: 40,
    discount: 0,
    total: 40,
    notes: null,
    created_at: new Date(Date.now() - 3600_000).toISOString(),
    items: [
      { id: "di-1", item_type: "service", name: "Corte Clásico", price: 15, quantity: 1, subtotal: 15 },
      { id: "di-2", item_type: "product", name: "Pomada Mate", price: 25, quantity: 1, subtotal: 25 },
    ],
  },
]

// ----------- GET /api/pos?from=&to=&limit= ----------------------------------

export async function GET(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    if (isDemoMode()) return NextResponse.json({ sales: DEMO_SALES })

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!["admin", "manager"].includes(profile?.role ?? "")) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)

    const admin = createAdminSupabaseClient()
    let query = admin
      .from("pos_sales")
      .select(`
        id, client_id, payment_method, subtotal, discount, total, notes, created_at,
        client:users!pos_sales_client_id_fkey(id, name),
        items:pos_sale_items(id, item_type, item_id, name, price, quantity, subtotal)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (from) query = query.gte("created_at", from)
    if (to)   query = query.lte("created_at", to)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ sales: data ?? [] })
  })
}

// ----------- POST /api/pos --------------------------------------------------

export async function POST(request: NextRequest) {
  return withRateLimit(request, strictLimiter, async () => {
    const body: unknown = await request.json()
    const parsed = posSaleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 })
    }

    if (isDemoMode()) {
      return NextResponse.json({ success: true, sale_id: "demo-new" })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
    if (!["admin", "manager"].includes(profile?.role ?? "")) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const { items, discount, redeem_points, tip, ...saleData } = parsed.data

    // Redemption constants (must match frontend POINT_VALUE)
    const POINT_VALUE = 0.1
    const redemptionAmt = saleData.client_id && redeem_points > 0
      ? parseFloat((redeem_points * POINT_VALUE).toFixed(2))
      : 0

    // Compute totals
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    const total = Math.max(0, subtotal - discount - redemptionAmt)

    const admin = createAdminSupabaseClient()

    // Insert sale header
    const { data: sale, error: saleErr } = await admin
      .from("pos_sales")
      .insert({
        ...saleData,
        discount,
        tip: parseFloat(tip.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        created_by: user.id,
      })
      .select("id")
      .single()

    if (saleErr || !sale) {
      return NextResponse.json({ error: saleErr?.message ?? "Error al crear la venta" }, { status: 500 })
    }

    // Insert line items
    const lineItems = items.map((it) => ({
      sale_id: sale.id,
      item_type: it.item_type,
      item_id: it.item_id ?? null,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      subtotal: parseFloat((it.price * it.quantity).toFixed(2)),
    }))

    const { error: itemsErr } = await admin.from("pos_sale_items").insert(lineItems)
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    // Loyalty redemption: deduct points and record transaction (Item 10)
    if (redeem_points > 0 && saleData.client_id) {
      const { data: clientRow } = await admin
        .from("users")
        .select("loyalty_points")
        .eq("id", saleData.client_id)
        .single()

      const currentPoints = clientRow?.loyalty_points ?? 0
      const newPoints = Math.max(0, currentPoints - redeem_points)

      await Promise.all([
        admin.from("users").update({ loyalty_points: newPoints }).eq("id", saleData.client_id!),
        admin.from("loyalty_transactions").insert({
          user_id: saleData.client_id,
          points: -redeem_points,
          type: "redeemed",
          description: `Canje en POS — venta ${sale.id}`,
        }),
      ])
    }

    revalidatePath("/admin/pos")
    return NextResponse.json({ success: true, sale_id: sale.id, total })
  })
}
