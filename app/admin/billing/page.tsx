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
  useRequireAuth(["admin"])
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
    <div className="max-w-[980px] px-10 py-8 text-foreground">
      {/* Header */}
      <div className="mb-7">
        <h1 className="m-0 text-[28px] font-semibold">Facturación</h1>
        <p className="mt-1 text-sm text-ink-600">
          Gestiona tu suscripción y pagos.
        </p>
      </div>

      {!supabase && (
        <div className="mb-6 flex items-center gap-2.5 rounded-[10px] border border-border bg-secondary px-4 py-3">
          <Info size={15} className="shrink-0 text-ink-600" />
          <span className="text-[13px] text-ink-600">
            Modo demo — no hay datos de facturación reales para mostrar.
          </span>
        </div>
      )}

      {supabase && !isLoading && (
        <div className="mb-6 flex items-center gap-2.5 rounded-[10px] border border-success/20 bg-success-tint px-4 py-3">
          <Info size={15} className="shrink-0 text-success-text" />
          <span className="text-[13px] text-ink-600">
            Todavía no hay un proveedor de pagos conectado. Esta sección refleja datos reales
            (probablemente vacíos) — no hay facturas ni tarjetas de fantasía.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-[60px]">
          <Loader2 className="animate-spin text-ink-600" size={24} />
        </div>
      ) : (
        <>
          {/* Current subscription */}
          <div className="mb-5 rounded-xl border border-border bg-card p-6">
            <div className="mb-4 text-base font-semibold">Suscripción actual</div>
            {subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">{subscription.plan_name}</div>
                  <div className="mt-1 text-[13px] text-ink-600">
                    ${subscription.price}/{subscription.billing_cycle === "monthly" ? "mes" : "año"} · {subscription.status}
                    {subscription.current_period_end && ` · próximo cobro ${new Date(subscription.current_period_end).toLocaleDateString("es-ES")}`}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-ink-600">
                Sin plan configurado todavía. Contactá a soporte para activar una suscripción.
              </p>
            )}
          </div>

          {/* Payment methods — no real provider yet, no fake cards */}
          <div className="mb-5 rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold">
              <CreditCard size={17} className="text-ink-600" />
              Métodos de pago
            </div>
            <p className="text-[13px] text-ink-600">
              La gestión de tarjetas estará disponible cuando se integre un proveedor de pagos real
              (Stripe o Mercado Pago — ver roadmap del proyecto).
            </p>
          </div>

          {/* Plan Comparator — informational only, no working checkout */}
          <div className="mb-5 rounded-xl border border-border bg-card p-6">
            <div className="mb-1 text-lg font-semibold">Planes disponibles</div>
            <p className="mb-5 text-xs text-ink-600">
              Referencia de precios — cambiar de plan todavía no está conectado a un proveedor de pagos real.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <div key={plan.name} className="rounded-xl border border-border p-5">
                  <div className="mb-2 text-base font-bold">{plan.name}</div>
                  <div className="mb-4 text-2xl font-bold text-foreground">
                    {plan.price}<span className="text-[13px] font-normal text-ink-600">/mes</span>
                  </div>
                  {plan.features.map((f) => (
                    <div key={f} className="mb-2 flex items-start gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-success-text" />
                      <span className="text-xs text-ink-600">{f}</span>
                    </div>
                  ))}
                  <button
                    disabled
                    title="Próximamente — requiere un proveedor de pagos conectado"
                    className="mt-4 w-full cursor-not-allowed rounded-lg border border-border bg-transparent p-2.5 text-[13px] font-semibold text-ink-600"
                  >
                    Próximamente
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice History */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5 text-lg font-semibold">Historial de Facturación</div>
            {invoices.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-600">
                Sin facturas emitidas todavía.
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Fecha", "Factura", "Monto", "Estado", "Acción"].map((h) => (
                      <th key={h} className="pb-3 text-left text-[11px] font-medium uppercase tracking-wider text-ink-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border">
                      <td className="py-3.5 text-[13px] text-ink-600">
                        {new Date(inv.issued_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3.5 text-[13px] text-foreground">{inv.invoice_number}</td>
                      <td className="py-3.5 text-[13px] font-semibold">
                        {inv.currency} ${inv.amount}
                      </td>
                      <td className="py-3.5">
                        <span className="rounded-full bg-success-tint px-2.5 py-0.5 text-[11px] font-semibold text-success-text">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {inv.status === "paid" && (
                          <button className="flex items-center gap-1.5 border-none bg-transparent text-xs text-ink-600 cursor-pointer">
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
