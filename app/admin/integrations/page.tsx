"use client"

import { useState, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Search, Clock, Info } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

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

type Status = "configured" | "not_configured" | "coming_soon"

interface Integration {
  name: string; category: string; description: string; status: Status; emoji: string
}

// Only WhatsApp has real backend infrastructure today (Twilio, notification_queue).
// Everything else is a real future integration, not yet started — never shown as "connected".
const BASE_INTEGRATIONS: Integration[] = [
  { name: "WhatsApp Business",  category: "Comunicación",   description: "Envía recordatorios automáticos por WhatsApp vía Twilio.", status: "not_configured", emoji: "💬" },
  { name: "Google Calendar",    category: "Comunicación",   description: "Sincroniza citas automáticamente.",         status: "coming_soon", emoji: "📅" },
  { name: "Stripe",             category: "Pagos",          description: "Recibe pagos online.",                      status: "coming_soon", emoji: "💳" },
  { name: "Mercado Pago",       category: "Pagos",          description: "Acepta pagos locales.",                     status: "coming_soon", emoji: "💰" },
  { name: "OpenAI",             category: "Automatización", description: "Automatiza respuestas y asistentes.",       status: "coming_soon", emoji: "🤖" },
  { name: "Zapier",             category: "Automatización", description: "Crea automatizaciones sin código.",         status: "coming_soon", emoji: "⚡" },
  { name: "Mailchimp",          category: "Marketing",      description: "Envía campañas de email marketing.",        status: "coming_soon", emoji: "📧" },
  { name: "Google Analytics",   category: "Analítica",      description: "Analiza el comportamiento de clientes.",    status: "coming_soon", emoji: "📊" },
  { name: "Slack",              category: "Comunicación",   description: "Recibe notificaciones en tu workspace.",    status: "coming_soon", emoji: "🔔" },
  { name: "Instagram Business", category: "Marketing",      description: "Gestiona mensajes directos.",               status: "coming_soon", emoji: "📷" },
  { name: "Twilio",             category: "Comunicación",   description: "Envía SMS a tus clientes.",                 status: "coming_soon", emoji: "📱" },
  { name: "HubSpot",            category: "Marketing",      description: "Sincroniza contactos y leads.",             status: "coming_soon", emoji: "🎯" },
]

interface NotificationLogEntry {
  id: string
  type: string
  status: string
  recipient_name: string | null
  created_at: string
}

function relativeTime(iso: string): string {
  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutesAgo < 60) return `Hace ${minutesAgo} min`
  const h = Math.floor(minutesAgo / 60)
  return `Hace ${h}h ${minutesAgo % 60}min`
}

function StatusBadge({ status }: { status: Status }) {
  const s = {
    configured:     { bg: `${T.teal}22`, color: T.teal,  label: "Configurado"    },
    not_configured: { bg: T.border,      color: T.muted, label: "No configurado" },
    coming_soon:    { bg: T.border,      color: T.muted, label: "Próximamente"   },
  }[status]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 10px" }}>
      {s.label}
    </span>
  )
}

function IntegrationCard({ item }: { item: Integration }) {
  const isConfigured = item.status === "configured"
  const isComingSoon = item.status === "coming_soon"
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{item.emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>{item.name}</div>
      <div style={{ marginBottom: 8 }}><StatusBadge status={item.status} /></div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 16, flex: 1 }}>{item.description}</div>
      <button
        disabled
        title={
          isComingSoon
            ? "Próximamente — todavía no hay trabajo de backend iniciado para esta integración"
            : isConfigured
              ? "Configurado vía variables de entorno del servidor"
              : "Requiere configurar TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM en el servidor"
        }
        style={{
          width: "100%",
          background: "transparent",
          border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "9px",
          color: T.muted,
          fontSize: 13, fontWeight: 600, cursor: "not-allowed",
          fontFamily: T.font,
        }}
      >
        {isComingSoon ? "Próximamente" : isConfigured ? "Configurado" : "No configurado"}
      </button>
    </div>
  )
}

export default function IntegrationsPage() {
  useRequireAuth(["admin"])
  const [whatsappConfigured, setWhatsappConfigured] = useState(false)
  const [logs, setLogs] = useState<NotificationLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    Promise.all([
      fetch("/api/integrations/status").then((r) => (r.ok ? r.json() : { whatsapp: false })),
      supabase
        .from("notification_queue")
        .select("id, type, status, recipient_name, created_at")
        .not("recipient_phone", "is", null)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([statusRes, { data: logRows }]) => {
      setWhatsappConfigured(Boolean(statusRes?.whatsapp))
      if (logRows) setLogs(logRows as NotificationLogEntry[])
      setIsLoading(false)
    })
  }, [])

  const integrations = useMemo(
    () => BASE_INTEGRATIONS.map((i) =>
      i.name === "WhatsApp Business"
        ? { ...i, status: (whatsappConfigured ? "configured" : "not_configured") as Status }
        : i
    ),
    [whatsappConfigured]
  )

  const configuredCount = integrations.filter((i) => i.status === "configured").length

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

      {!supabase && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: `${T.muted}11`, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
        }}>
          <Info size={15} color={T.muted} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.muted }}>
            Modo demo — el estado de las integraciones no se puede verificar sin Supabase configurado.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Integraciones configuradas</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{configuredCount} / 1 disponible hoy</div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Eventos recientes (WhatsApp)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text }}>{logs.length}</div>
        </div>
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
            <IntegrationCard key={item.name} item={item} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.muted, fontSize: 14 }}>
          No se encontraron integraciones para &quot;{search}&quot;
        </div>
      )}

      {/* Logs Recientes — real notification_queue entries, not fabricated */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          <Clock size={16} color={T.muted} />
          <span>Logs Recientes (WhatsApp)</span>
        </div>
        {isLoading ? (
          <p style={{ fontSize: 13, color: T.muted, padding: "12px 0" }}>Cargando…</p>
        ) : logs.length === 0 ? (
          <p style={{ fontSize: 13, color: T.muted, padding: "12px 0" }}>
            Sin eventos recientes. Los envíos por WhatsApp aparecerán acá una vez configurado Twilio.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 0", fontSize: 12, color: T.muted, width: 110 }}>{relativeTime(log.created_at)}</td>
                  <td style={{ padding: "12px 0", fontSize: 13, fontWeight: 600, color: T.text, width: 160 }}>{log.recipient_name ?? "—"}</td>
                  <td style={{ padding: "12px 0", fontSize: 13, color: T.muted }}>{log.type}</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontSize: 12, color: T.muted }}>{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
