"use client"

import { useState } from "react"
import {
  CreditCard,
  AlertTriangle,
  AlertCircle,
  Check,
  Download,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"

// ─── Design tokens (matches existing Ornō system) ───────────────────────────
const T = {
  bg:      "#161616",
  card:    "#1A1A1A",
  border:  "#252525",
  text:    "#F0F0F0",
  muted:   "#8A8A8A",
  red:     "#E53935",
  teal:    "#00C896",
  font:    "var(--font-dm-sans), 'DM Sans', sans-serif",
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const INVOICES = [
  { date: "15 Jun 2026", id: "INV-2026-015", amount: "$49", status: "Pagada" },
  { date: "15 May 2026", id: "INV-2026-014", amount: "$49", status: "Pagada" },
  { date: "15 Abr 2026", id: "INV-2026-013", amount: "$49", status: "Pagada" },
  { date: "15 Mar 2026", id: "INV-2026-012", amount: "$49", status: "Pagada" },
  { date: "15 Feb 2026", id: "INV-2026-011", amount: "$49", status: "Pagada" },
]

const PLANS = [
  {
    name: "Starter", price: "$19", features: [
      "100 reservas/mes", "500 clientes", "Reportes básicos", "Soporte por email",
    ], current: false,
  },
  {
    name: "Pro", price: "$49", features: [
      "Reservas ilimitadas", "Clientes ilimitados", "Reportes avanzados",
      "Integraciones", "Soporte prioritario",
    ], current: true,
  },
  {
    name: "Enterprise", price: "$99", features: [
      "Todo en Pro", "Múltiples ubicaciones", "API personalizada",
      "Gestor de cuenta dedicado", "SLA garantizado",
    ], current: false,
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, badge }: {
  label: string; value: string; sub?: string; badge?: string
}) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "20px 24px",
    }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{sub}</div>}
      {badge && (
        <span style={{
          display: "inline-block", marginTop: 6,
          background: `${T.teal}22`, color: T.teal,
          fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 10px",
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [cards, setCards] = useState([
    { id: "visa",   brand: "Visa",       last4: "4587", primary: true  },
    { id: "mc",     brand: "Mastercard", last4: "9182", primary: false },
  ])

  const setPrimary = (id: string) =>
    setCards((prev) => prev.map((c) => ({ ...c, primary: c.id === id })))

  const removeCard = (id: string) =>
    setCards((prev) => prev.filter((c) => c.id !== id))

  return (
    <div style={{
      padding: "32px 40px",
      color: T.text,
      fontFamily: T.font,
      maxWidth: 980,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Facturación</h1>
        <p style={{ fontSize: 14, color: T.muted, marginTop: 4, margin: "4px 0 0" }}>
          Gestiona tu suscripción y pagos.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Plan Actual"       value="PRO"             sub="$49/mes"   badge="Activa" />
        <StatCard label="Próximo cobro"     value="15 Julio"        sub="2026" />
        <StatCard label="Método de pago"    value="Visa terminada"  sub="en 4587" />
        <StatCard label="Facturas emitidas" value="24" />
      </div>

      {/* Alert Banners */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.25)",
          borderRadius: 10, padding: "12px 16px",
        }}>
          <AlertTriangle size={15} color="#FFB400" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#FFB400" }}>
            Pago próximo a vencer el 15 de Julio 2026
          </span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(229,57,53,0.08)", border: `1px solid rgba(229,57,53,0.25)`,
          borderRadius: 10, padding: "12px 16px",
        }}>
          <AlertCircle size={15} color={T.red} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.red }}>
            Tarjeta Mastercard ****9182 expira en 30 días
          </span>
        </div>
      </div>

      {/* Plan Info + Payment Methods */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Plan Info */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Plan Pro</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.teal, marginTop: 4 }}>
                $49<span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>/mes</span>
              </div>
            </div>
            <button style={{
              background: T.teal, color: "#000", fontWeight: 700, fontSize: 13,
              border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer",
            }}>
              Cambiar plan
            </button>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Incluye:</div>
          {["Reservas ilimitadas", "Clientes ilimitados", "Reportes avanzados", "Integraciones", "Soporte prioritario"].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: T.teal, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={10} color="#000" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Métodos de Pago</div>
          {cards.map((card) => (
            <div
              key={card.id}
              style={{
                border: `1px solid ${card.primary ? T.teal : T.border}`,
                borderRadius: 10, padding: "12px 16px", marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CreditCard size={18} color={card.primary ? T.teal : T.muted} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{card.brand}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>****{card.last4}</div>
                  {card.primary && (
                    <div style={{ fontSize: 11, color: T.teal, marginTop: 2 }}>Predeterminada</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!card.primary && (
                  <button
                    onClick={() => setPrimary(card.id)}
                    title="Hacer predeterminada"
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}
                  >
                    <Edit size={14} />
                  </button>
                )}
                <button
                  onClick={() => removeCard(card.id)}
                  title="Eliminar"
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button style={{
            width: "100%", background: "none",
            border: `1px dashed ${T.border}`, borderRadius: 10,
            padding: "10px", color: T.muted, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6,
          }}>
            <Plus size={14} /> Agregar método
          </button>
        </div>
      </div>

      {/* Plan Comparator */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Comparador de Planes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: `1px solid ${plan.current ? T.teal : T.border}`,
                borderRadius: 12, padding: 20, position: "relative",
                background: plan.current ? `${T.teal}08` : "transparent",
              }}
            >
              {plan.current && (
                <div style={{
                  position: "absolute", top: -12, left: "50%",
                  transform: "translateX(-50%)",
                  background: T.teal, color: "#000",
                  fontSize: 11, fontWeight: 700, borderRadius: 20,
                  padding: "2px 12px", whiteSpace: "nowrap",
                }}>
                  Plan Actual
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: plan.current ? T.teal : T.text, marginBottom: 16 }}>
                {plan.price}<span style={{ fontSize: 13, color: T.muted, fontWeight: 400 }}>/mes</span>
              </div>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <Check size={13} color={T.teal} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.muted }}>{f}</span>
                </div>
              ))}
              <button style={{
                width: "100%", marginTop: 16, padding: "10px",
                background: plan.current ? "transparent" : T.border,
                border: plan.current ? `1px solid ${T.border}` : "none",
                borderRadius: 8,
                color: plan.current ? T.muted : T.text,
                fontSize: 13, fontWeight: 600,
                cursor: plan.current ? "default" : "pointer",
              }}>
                {plan.current ? "Plan actual" : "Seleccionar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Historial de Facturación</div>
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
            {INVOICES.map((inv, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: "14px 0", fontSize: 13, color: T.muted }}>{inv.date}</td>
                <td style={{ padding: "14px 0", fontSize: 13, color: T.text }}>{inv.id}</td>
                <td style={{ padding: "14px 0", fontSize: 13, fontWeight: 600 }}>{inv.amount}</td>
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
                  <button style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none",
                    color: T.muted, fontSize: 12, cursor: "pointer",
                  }}>
                    <Download size={13} /> Descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}