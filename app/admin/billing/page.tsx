"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  CreditCard,
  Info,
  Check,
  Download,
  Loader2,
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

// ─── Design tokens (matches existing Ornō system) ───────────────────────────
const T = {
  card:    "#1A1A1A",
  border:  "#252525",
  text:    "#F0F0F0",
  muted:   "#8A8A8A",
  red:     "#E53935",
  teal:    "#00C896",
  font:    "var(--font-dm-sans), 'DM Sans', sans-serif",
}

// ─── Product pricing tiers — informational only, no real checkout yet ──────
const PLANS = [
  {
    name: "Starter", price: "$19", features: [
      "100 reservas/mes", "500 clientes", "Reportes básicos", "Soporte por email",
    ],
  },
  {
    name: "Pro", price: "$49", features: [
      "Reservas ilimitadas", "Clientes ilimitados", "Reportes avanzados",
      "Integraciones", "Soporte prioritario",
    ],
  },
  {
    name: "Enterprise", price: "$99", features: [
      "Todo en Pro", "Múltiples ubicaciones", "API personalizada",
      "Gestor de cuenta dedicado", "SLA garantizado",
    ],
  },
]

interface Subscription {
  id: string
  plan_name: string
  status: string
  price: number
  billing_cycle: string
  current_period_end: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  currency: string
  status: string
  issued_at: string
}

export default function BillingPage() {
  useRequireAuth(["admin", "manager"])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    Promise.all([
      supabase
        .from("subscriptions")
        .select("id, plan_name, status, price, billing_cycle, current_period_end")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id, invoice_number, amount, currency, status, issued_at")
        .order("issued_at", { ascending: false })
        .limit(10),
    ]).then(([{ data: sub }, { data: inv }]) => {
      if (sub) setSubscription(sub as Subscription)
      if (inv) setInvoices(inv as Invoice[])
      setIsLoading(false)
    })
  }, [])

  return (
    <div style={{ padding: "32px 40px", color: T.text, fontFamily: T.font, maxWidth: 980 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Facturación</h1>
        <p style={{ fontSize: 14, color: T.muted, marginTop: 4, margin: "4px 0 0" }}>
          Gestiona tu suscripción y pagos.
        </p>
      </div>

      {!supabase && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: `${T.muted}11`, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
        }}>
          <Info size={15} color={T.muted} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.muted }}>
            Modo demo — no hay datos de facturación reales para mostrar.
          </span>
        </div>
      )}

      {supabase && !isLoading && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(0,200,150,0.06)", border: `1px solid rgba(0,200,150,0.2)`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
        }}>
          <Info size={15} color={T.teal} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.muted }}>
            Todavía no hay un proveedor de pagos conectado. Esta sección refleja datos reales
            (probablemente vacíos) — no hay facturas ni tarjetas de fantasía.
          </span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 className="animate-spin" size={24} color={T.muted} />
        </div>
      ) : (
        <>
          {/* Current subscription */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Suscripción actual</div>
            {subscription ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{subscription.plan_name}</div>
                  <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                    ${subscription.price}/{subscription.billing_cycle === "monthly" ? "mes" : "año"} · {subscription.status}
                    {subscription.current_period_end && ` · próximo cobro ${new Date(subscription.current_period_end).toLocaleDateString("es-ES")}`}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: T.muted }}>
                Sin plan configurado todavía. Contactá a soporte para activar una suscripción.
              </p>
            )}
          </div>

          {/* Payment methods — no real provider yet, no fake cards */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={17} color={T.muted} />
              Métodos de pago
            </div>
            <p style={{ fontSize: 13, color: T.muted }}>
              La gestión de tarjetas estará disponible cuando se integre un proveedor de pagos real
              (Stripe o Mercado Pago — ver roadmap del proyecto).
            </p>
          </div>

          {/* Plan Comparator — informational only, no working checkout */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Planes disponibles</div>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
              Referencia de precios — cambiar de plan todavía no está conectado a un proveedor de pagos real.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {PLANS.map((plan) => (
                <div key={plan.name} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.text, marginBottom: 16 }}>
                    {plan.price}<span style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}>/mes</span>
                  </div>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <Check size={13} color={T.teal} style={{ marginTop: 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: T.muted }}>{f}</span>
                    </div>
                  ))}
                  <button
                    disabled
                    title="Próximamente — requiere un proveedor de pagos conectado"
                    style={{
                      width: "100%", marginTop: 16, padding: "10px",
                      background: "transparent", border: `1px solid ${T.border}`,
                      borderRadius: 8, color: T.muted, fontSize: 13, fontWeight: 600,
                      cursor: "not-allowed",
                    }}
                  >
                    Próximamente
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice History */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Historial de Facturación</div>
            {invoices.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: "24px 0" }}>
                Sin facturas emitidas todavía.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Fecha", "Factura", "Monto", "Estado", "Acción"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", fontSize: 11, color: T.muted,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        paddingBottom: 12, fontWeight: 500,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "14px 0", fontSize: 13, color: T.muted }}>
                        {new Date(inv.issued_at).toLocaleDateString("es-ES")}
                      </td>
                      <td style={{ padding: "14px 0", fontSize: 13, color: T.text }}>{inv.invoice_number}</td>
                      <td style={{ padding: "14px 0", fontSize: 13, fontWeight: 600 }}>
                        {inv.currency} ${inv.amount}
                      </td>
                      <td style={{ padding: "14px 0" }}>
                        <span style={{
                          background: `${T.teal}22`, color: T.teal,
                          fontSize: 11, fontWeight: 600,
                          borderRadius: 20, padding: "3px 10px",
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 0" }}>
                        {inv.status === "paid" && (
                          <button style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "none", border: "none",
                            color: T.muted, fontSize: 12, cursor: "pointer",
                          }}>
                            <Download size={13} /> Descargar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
