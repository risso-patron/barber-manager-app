"use client"

import { useState, useMemo } from "react"
import { Search, Settings, Clock, CheckCircle } from "lucide-react"

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  card:   "#1A1A1A",
  border: "#252525",
  text:   "#F0F0F0",
  muted:  "#8A8A8A",
  teal:   "#00C896",
  font:   "var(--font-dm-sans), 'DM Sans', sans-serif",
}

const CATEGORIES = ["Todos", "Comunicación", "Pagos", "Automatización", "Marketing", "Analítica"]

type Status = "connected" | "disconnected" | "available"

interface Integration {
  name: string; category: string; description: string; status: Status; emoji: string
}

const INITIAL_INTEGRATIONS: Integration[] = [
  { name: "WhatsApp Business",  category: "Comunicación",   description: "Envía recordatorios automáticos.",         status: "connected",    emoji: "💬" },
  { name: "Google Calendar",    category: "Comunicación",   description: "Sincroniza citas automáticamente.",         status: "disconnected", emoji: "📅" },
  { name: "Stripe",             category: "Pagos",          description: "Recibe pagos online.",                      status: "connected",    emoji: "💳" },
  { name: "Mercado Pago",       category: "Pagos",          description: "Acepta pagos locales.",                     status: "available",    emoji: "💰" },
  { name: "OpenAI",             category: "Automatización", description: "Automatiza respuestas y asistentes.",       status: "available",    emoji: "🤖" },
  { name: "Zapier",             category: "Automatización", description: "Crea automatizaciones sin código.",         status: "available",    emoji: "⚡" },
  { name: "Mailchimp",          category: "Marketing",      description: "Envía campañas de email marketing.",        status: "available",    emoji: "📧" },
  { name: "Google Analytics",   category: "Analítica",      description: "Analiza el comportamiento de clientes.",    status: "available",    emoji: "📊" },
  { name: "Slack",              category: "Comunicación",   description: "Recibe notificaciones en tu workspace.",    status: "available",    emoji: "🔔" },
  { name: "Instagram Business", category: "Marketing",      description: "Gestiona mensajes directos.",               status: "available",    emoji: "📷" },
  { name: "Twilio",             category: "Comunicación",   description: "Envía SMS a tus clientes.",                 status: "available",    emoji: "📱" },
  { name: "HubSpot",            category: "Marketing",      description: "Sincroniza contactos y leads.",             status: "available",    emoji: "🎯" },
]

const ALL_LOGS = [
  { minutesAgo: 28, integration: "WhatsApp Business", event: "Mensaje enviado",  status: "success" },
  { minutesAgo: 45, integration: "Stripe",            event: "Pago recibido",    status: "success" },
  { minutesAgo: 62, integration: "WhatsApp Business", event: "Mensaje enviado",  status: "success" },
  { minutesAgo: 89, integration: "Stripe",            event: "Pago procesando",  status: "pending" },
]

function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `Hace ${minutesAgo} min`
  const h = Math.floor(minutesAgo / 60)
  return `Hace ${h}h ${minutesAgo % 60}min`
}

function StatusBadge({ status }: { status: Status }) {
  const s = {
    connected:    { bg: `${T.teal}22`, color: T.teal,  label: "Conectado"    },
    disconnected: { bg: T.border,      color: T.muted, label: "Sin conectar" },
    available:    { bg: T.border,      color: T.muted, label: "Disponible"   },
  }[status]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 10px" }}>
      {s.label}
    </span>
  )
}

function IntegrationCard({ item, onToggle }: { item: Integration; onToggle: (name: string) => void }) {
  const isConnected = item.status === "connected"
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{item.emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>{item.name}</div>
      <div style={{ marginBottom: 8 }}><StatusBadge status={item.status} /></div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 16, flex: 1 }}>{item.description}</div>
      <button
        onClick={() => onToggle(item.name)}
        style={{
          width: "100%",
          background: isConnected ? "transparent" : T.teal,
          border: isConnected ? `1px solid ${T.border}` : "none",
          borderRadius: 8, padding: "9px",
          color: isConnected ? T.muted : "#000",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontFamily: T.font,
        }}
      >
        {isConnected ? <><Settings size={13} /> Configurar</> : "Conectar"}
      </button>
    </div>
  )
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [search, setSearch] = useState("")

  const activeCount = integrations.filter((i) => i.status === "connected").length

  const connectedNames = useMemo(
    () => new Set(integrations.filter(i => i.status === "connected").map(i => i.name)),
    [integrations]
  )

  const visibleLogs = useMemo(
    () => ALL_LOGS.filter(l => connectedNames.has(l.integration)),
    [connectedNames]
  )

  const toggle = (name: string) =>
    setIntegrations((prev) =>
      prev.map((i) => i.name === name ? { ...i, status: i.status === "connected" ? "available" : "connected" } : i)
    )

  const filtered = integrations.filter((i) => {
    const matchCat    = activeCategory === "Todos" || i.category === activeCategory
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                        i.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ padding: "32px 40px", color: T.text, fontFamily: T.font, maxWidth: 980 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Integraciones</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "4px 0 0" }}>Conecta Ornō con tus herramientas favoritas.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Integraciones activas", value: String(activeCount) },
          { label: "Eventos recientes",     value: String(visibleLogs.length) },
          { label: "Errores detectados",    value: "0 ✓", color: T.teal },
          { label: "Tiempo promedio",       value: activeCount > 0 ? "—" : "—" },
        ].map((card) => (
          <div key={card.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color ?? T.text }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} color={T.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar integraciones..."
          style={{
            width: "100%", background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "10px 14px 10px 40px",
            color: T.text, fontSize: 13, outline: "none",
            boxSizing: "border-box", fontFamily: T.font,
          }}
        />
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              background: active ? T.teal : T.card,
              border: `1px solid ${active ? T.teal : T.border}`,
              borderRadius: 8, padding: "6px 14px",
              color: active ? "#000" : T.muted,
              fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: "pointer", fontFamily: T.font,
            }}>
              {cat}
            </button>
          )
        })}
      </div>

      {/* Integration Cards Grid */}
      {filtered.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {filtered.map((item) => (
            <IntegrationCard key={item.name} item={item} onToggle={toggle} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.muted, fontSize: 14 }}>
          No se encontraron integraciones para &quot;{search}&quot;
        </div>
      )}

      {/* Logs Recientes */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          <Clock size={16} color={T.muted} />
          <span>Logs Recientes</span>
        </div>
        {visibleLogs.length === 0 ? (
          <p style={{ fontSize: 13, color: T.muted, padding: "12px 0" }}>
            Sin eventos recientes. Conecta una integración para ver actividad.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {visibleLogs.map((log, i) => (
                <tr key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 0", fontSize: 12, color: T.muted, width: 110 }}>{relativeTime(log.minutesAgo)}</td>
                  <td style={{ padding: "12px 0", fontSize: 13, fontWeight: 600, color: T.text, width: 160 }}>{log.integration}</td>
                  <td style={{ padding: "12px 0", fontSize: 13, color: T.muted }}>{log.event}</td>
                  <td style={{ padding: "12px 0", textAlign: "right" }}>
                    {log.status === "success" ? (
                      <CheckCircle size={16} color={T.teal} />
                    ) : (
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `2px solid #FFB400`, borderTopColor: "transparent",
                        display: "inline-block", animation: "spin 1s linear infinite",
                      }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

    </div>
  )
}