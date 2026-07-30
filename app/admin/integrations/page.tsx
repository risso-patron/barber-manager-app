"use client"

import { useState, useMemo, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Search, Clock, Info } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

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
    configured:     { className: "bg-success-tint text-success-text", label: "Configurado"    },
    not_configured: { className: "bg-secondary text-ink-600",         label: "No configurado" },
    coming_soon:    { className: "bg-secondary text-ink-600",         label: "Próximamente"   },
  }[status]
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.className}`}>
      {s.label}
    </span>
  )
}

function IntegrationCard({ item }: { item: Integration }) {
  const isConfigured = item.status === "configured"
  const isComingSoon = item.status === "coming_soon"
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-2.5 text-[28px]">{item.emoji}</div>
      <div className="mb-1.5 text-[15px] font-semibold text-foreground">{item.name}</div>
      <div className="mb-2"><StatusBadge status={item.status} /></div>
      <div className="mb-4 flex-1 text-[13px] text-ink-600">{item.description}</div>
      <button
        disabled
        title={
          isComingSoon
            ? "Próximamente — todavía no hay trabajo de backend iniciado para esta integración"
            : isConfigured
              ? "Configurado vía variables de entorno del servidor"
              : "Requiere configurar TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM en el servidor"
        }
        className="w-full cursor-not-allowed rounded-lg border border-border bg-transparent p-2.5 text-[13px] font-semibold text-ink-600"
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
    <div className="max-w-[980px] px-10 py-8 text-foreground">

      {/* Header */}
      <div className="mb-7">
        <h1 className="m-0 text-[28px] font-semibold">Integraciones</h1>
        <p className="mt-1 text-sm text-ink-600">Conecta Ornō con tus herramientas favoritas.</p>
      </div>

      {!supabase && (
        <div className="mb-6 flex items-center gap-2.5 rounded-[10px] border border-border bg-secondary px-4 py-3">
          <Info size={15} className="shrink-0 text-ink-600" />
          <span className="text-[13px] text-ink-600">
            Modo demo — el estado de las integraciones no se puede verificar sin Supabase configurado.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-ink-600">Integraciones configuradas</div>
          <div className="text-[28px] font-bold text-foreground">{configuredCount} / 1 disponible hoy</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-ink-600">Eventos recientes (WhatsApp)</div>
          <div className="text-[28px] font-bold text-foreground">{logs.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3.5">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar integraciones..."
          className="box-border w-full rounded-[10px] border border-border bg-card py-2.5 pl-10 pr-3.5 text-[13px] text-foreground outline-none"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                active
                  ? "rounded-lg border border-success/25 bg-success-tint px-3.5 py-1.5 text-[13px] font-bold text-success-text"
                  : "rounded-lg border border-border bg-card px-3.5 py-1.5 text-[13px] text-ink-600"
              }
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Integration Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((item) => (
            <IntegrationCard key={item.name} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-[60px] text-center text-sm text-ink-600">
          No se encontraron integraciones para &quot;{search}&quot;
        </div>
      )}

      {/* Logs Recientes — real notification_queue entries, not fabricated */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2 text-base font-semibold">
          <Clock size={16} className="text-ink-600" />
          <span>Logs Recientes (WhatsApp)</span>
        </div>
        {isLoading ? (
          <p className="py-3 text-[13px] text-ink-600">Cargando…</p>
        ) : logs.length === 0 ? (
          <p className="py-3 text-[13px] text-ink-600">
            Sin eventos recientes. Los envíos por WhatsApp aparecerán acá una vez configurado Twilio.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={i === 0 ? "" : "border-t border-border"}>
                  <td className="w-[110px] py-3 text-xs text-ink-600">{relativeTime(log.created_at)}</td>
                  <td className="w-40 py-3 text-[13px] font-semibold text-foreground">{log.recipient_name ?? "—"}</td>
                  <td className="py-3 text-[13px] text-ink-600">{log.type}</td>
                  <td className="py-3 text-right text-xs text-ink-600">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
