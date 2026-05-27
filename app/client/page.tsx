"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  User,
  History,
  LogOut,
  Package,
  Scissors,
  ShoppingBag,
  Star,
  Bell,
  Gift,
  Mail,
  CheckCircle2,
} from "lucide-react"

interface Appointment {
  id: string
  service: string
  barber: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
}

interface Product {
  id: string
  product_name: string
  category: string | null
  quantity: number
  cost_per_unit: number
}

interface ClientMessage {
  id: string
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

interface ClientGift {
  id: string
  gift_type: string
  title: string
  description: string | null
  value: number | null
  service_name: string | null
  product_name: string | null
  code: string
  is_redeemed: boolean
  expires_at: string | null
  created_at: string
}

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time: string
  status: Appointment["status"]
  barber?: { id: string; name: string }[] | null
  service?: { id: string; name: string }[] | null
}

const GIFT_LABEL: Record<string, string> = {
  discount_pct:   "% Descuento",
  discount_fixed: "Descuento fijo",
  free_service:   "Servicio gratis",
  free_product:   "Producto gratis",
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

const STATUS_CONFIG: Record<"confirmed" | "pending" | "completed" | "cancelled", { label: string; color: string }> = {
  confirmed: { label: "Confirmada",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending:   { label: "Pendiente",   color: "bg-amber-100 text-amber-700 border-amber-200" },
  completed: { label: "Completada",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  cancelled: { label: "Cancelada",   color: "bg-red-100 text-red-700 border-red-200" },
}

export default function ClientDashboard() {
  const router = useRouter()
  const user = useRequireAuth(["client", "admin"])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [gifts, setGifts] = useState<ClientGift[]>([])

  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setAppointments([])
      setPastAppointments([])
      setProducts([])
      setMessages([])
      setGifts([])
      return
    }

    const today = new Date().toISOString().substring(0, 10)

    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status,
        barber:users!appointments_barber_id_fkey(id, name),
        service:services(id, name)`)
      .eq("client_id", user.id)
      .order("appointment_date", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return
        const all = (data as unknown as AppointmentRow[]).map((a) => ({
          id: a.id,
          service: a.service?.[0]?.name || "",
          barber: a.barber?.[0]?.name || "",
          date: a.appointment_date,
          time: a.appointment_time ?? undefined,
          status: a.status,
        }))
        setAppointments(all.filter(a =>
          a.date >= today && a.status !== "cancelled" && a.status !== "completed"
        ))
        setPastAppointments(all.filter(a =>
          a.date < today || a.status === "completed" || a.status === "cancelled"
        ))
      })

    supabase
      .from("inventory")
      .select("id, product_name, category, quantity, cost_per_unit")
      .gt("quantity", 0)
      .order("product_name")
      .then(({ data }) => {
        if (data) setProducts(data as Product[])
      })

    supabase
      .from("client_messages")
      .select("id, subject, message, is_read, created_at")
      .eq("to_client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setMessages(data as ClientMessage[])
      })

    supabase
      .from("client_gifts")
      .select("id, gift_type, title, description, value, service_name, product_name, code, is_redeemed, expires_at, created_at")
      .eq("to_client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setGifts(data as ClientGift[])
      })

  }, [user])

  if (!user) return null

  const handleLogout = async () => {
    localStorage.removeItem("currentUser")
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/auth/login")
  }

  const handleMarkRead = async (id: string) => {
    if (supabase) {
      await supabase.from("client_messages").update({ is_read: true }).eq("id", id)
    }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
  }

  const nextAppointment = appointments[0]
  const unreadCount = messages.filter(m => !m.is_read).length + gifts.filter(g => !g.is_redeemed).length

  const STATUS_DARK: Record<string, string> = {
    confirmed: "#cc2222",
    pending:   "rgba(240,235,227,0.45)",
    completed: "rgba(240,235,227,0.30)",
    cancelled: "rgba(240,235,227,0.20)",
  }

  return (
    <div style={{ minHeight: "100vh", background: "#161412", color: "#f0ebe3" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-row { animation: ornoFadeUp 0.4s ease both; }
        .orno-row:nth-child(1) { animation-delay: 0.05s; }
        .orno-row:nth-child(2) { animation-delay: 0.12s; }
        .orno-row:nth-child(3) { animation-delay: 0.19s; }
        .orno-row:nth-child(4) { animation-delay: 0.26s; }
        .orno-action { transition: background 0.16s; }
        .orno-action:hover { background: rgba(240,235,227,0.04) !important; }
        .orno-action:hover .orno-arrow { color: #cc2222; transform: translateX(3px); }
        .orno-arrow { transition: color 0.16s, transform 0.16s; display: inline-block; }
        .orno-exit:hover { color: #cc2222 !important; }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(240,235,227,0.12)" }}>
        <div className="max-w-4xl mx-auto px-8 pt-5 pb-0 flex items-center justify-between">
          <img src="/orno_logo.svg" alt="Ornō" style={{ height: "100px", width: "auto" }} />
          <div className="flex items-center gap-6">
            {unreadCount > 0 && (
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#cc2222", letterSpacing: "0.08em" }}>
                {unreadCount} nuevo{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(240,235,227,0.50)", letterSpacing: "0.04em" }}>
              {user.profile?.name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="orno-exit"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(240,235,227,0.38)", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none", padding: 0, transition: "color 0.2s" }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8">

        {/* ── Próxima cita ─────────────────── */}
        <div className="pt-10 pb-4">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,235,227,0.45)" }}>
            Próxima cita
          </p>
        </div>

        <div style={{ borderTop: "1px solid rgba(240,235,227,0.12)", paddingTop: "28px", paddingBottom: "28px" }}>
          {nextAppointment ? (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.1, marginBottom: "8px" }}>
                {nextAppointment.service}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(240,235,227,0.50)", letterSpacing: "0.04em" }}>
                {new Date(nextAppointment.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                {nextAppointment.time ? ` · ${nextAppointment.time}` : ""}
                {nextAppointment.barber ? ` · ${nextAppointment.barber}` : ""}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(22px,3vw,34px)", fontWeight: 300, color: "rgba(240,235,227,0.35)", letterSpacing: "-0.01em" }}>
                Sin citas pendientes
              </p>
              <button
                onClick={() => router.push("/client/book")}
                className="orno-action"
                style={{ marginTop: "12px", fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#cc2222", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                Reservar ahora →
              </button>
            </div>
          )}
        </div>

        {/* ── Stats ─────────────────────────── */}
        <div className="grid grid-cols-3" style={{ borderTop: "1px solid rgba(240,235,227,0.12)" }}>
          {[
            { value: String(appointments.length),     label: "Próximas" },
            { value: String(pastAppointments.length),  label: "Visitas" },
            { value: String(unreadCount),              label: "Sin leer" },
          ].map((s, i) => (
            <div key={i} className="orno-row" style={{ padding: "24px 0", borderRight: i < 2 ? "1px solid rgba(240,235,227,0.12)" : "none", paddingLeft: i > 0 ? "28px" : 0, paddingRight: i < 2 ? "28px" : 0 }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,235,227,0.45)", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Acciones ──────────────────────── */}
        <div className="pt-8 pb-3">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,235,227,0.45)" }}>
            Acciones
          </p>
        </div>

        <div style={{ borderTop: "1px solid rgba(240,235,227,0.12)" }}>
          {[
            { label: "Reservar cita", sub: "Elige servicio y horario", path: "/client/book" },
            { label: "Mis citas",     sub: "Próximas y pendientes",    path: "/client/appointments" },
            { label: "Historial",     sub: "Servicios completados",    path: "/client/history" },
          ].map((a, i) => (
            <button
              key={i}
              className="orno-action orno-row"
              onClick={() => router.push(a.path)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid rgba(240,235,227,0.07)", background: "transparent", border: "none", borderBottom: "1px solid rgba(240,235,227,0.07)", cursor: "pointer", textAlign: "left" }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "#f0ebe3" }}>{a.label}</p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(240,235,227,0.40)", marginTop: "2px" }}>{a.sub}</p>
              </div>
              <span className="orno-arrow" style={{ fontSize: "18px", color: "rgba(240,235,227,0.30)" }}>→</span>
            </button>
          ))}
        </div>

        {/* ── Citas próximas ────────────────── */}
        {appointments.length > 0 && (
          <>
            <div className="pt-10 pb-3">
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,235,227,0.45)" }}>
                Agenda
              </p>
            </div>
            <div style={{ borderTop: "1px solid rgba(240,235,227,0.12)" }}>
              {appointments.slice(0, 4).map((apt, i) => (
                <div key={apt.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(240,235,227,0.07)", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "rgba(240,235,227,0.28)", minWidth: "18px", paddingTop: "3px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "19px", fontWeight: 400, color: "#f0ebe3" }}>{apt.service}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(240,235,227,0.42)", marginTop: "3px" }}>
                      {new Date(apt.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                      {apt.time ? ` · ${apt.time}` : ""}
                      {apt.barber ? ` · ${apt.barber}` : ""}
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", color: STATUS_DARK[apt.status] ?? "rgba(240,235,227,0.35)", paddingTop: "3px", textTransform: "uppercase" }}>
                    {apt.status === "confirmed" ? "Conf." : apt.status === "pending" ? "Pend." : apt.status === "completed" ? "Ok" : "—"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Mensajes y regalos ────────────── */}
        {(messages.length > 0 || gifts.length > 0) && (
          <>
            <div className="pt-10 pb-3">
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,235,227,0.45)" }}>
                Mensajes y regalos
              </p>
            </div>
            <div style={{ borderTop: "1px solid rgba(240,235,227,0.12)", marginBottom: "60px" }}>
              {messages.map((m) => (
                <div key={m.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(240,235,227,0.07)", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ width: "3px", alignSelf: "stretch", background: m.is_read ? "rgba(240,235,227,0.10)" : "#cc2222", borderRadius: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    {m.subject && <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "#f0ebe3" }}>{m.subject}</p>}
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "rgba(240,235,227,0.55)", marginTop: "3px" }}>{m.message}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "rgba(240,235,227,0.28)", marginTop: "6px" }}>
                      {new Date(m.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {!m.is_read && (
                    <button
                      onClick={() => handleMarkRead(m.id)}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,235,227,0.38)", background: "none", border: "none", cursor: "pointer", paddingTop: "3px" }}
                    >
                      Leído
                    </button>
                  )}
                </div>
              ))}
              {gifts.map((g) => (
                <div key={g.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(240,235,227,0.07)", display: "flex", alignItems: "flex-start", gap: "20px", opacity: g.is_redeemed ? 0.45 : 1 }}>
                  <div style={{ width: "3px", alignSelf: "stretch", background: g.is_redeemed ? "rgba(240,235,227,0.10)" : "rgba(240,235,227,0.40)", borderRadius: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "#f0ebe3" }}>{g.title}</p>
                    <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "rgba(240,235,227,0.50)", letterSpacing: "0.14em", marginTop: "4px" }}>{g.code}</p>
                    {g.description && <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "rgba(240,235,227,0.40)", marginTop: "3px" }}>{g.description}</p>}
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "rgba(240,235,227,0.28)", marginTop: "4px" }}>
                      {g.is_redeemed ? "Canjeado" : "Presenta este código en la barbería"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* bottom spacer */}
        <div style={{ height: "48px" }} />

      </main>
    </div>
  )
}

