"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { DEMO_APPOINTMENTS } from "@/lib/demo-appointments"

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
  barber?: { id: string; name: string } | null
  service?: { id: string; name: string } | null
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
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null)
  const [loyaltyTx, setLoyaltyTx] = useState<Array<{ id: string; points: number; type: string; description: string | null; created_at: string }>>([]) 

  useEffect(() => {
    if (!user) return
    if (!supabase) {
      const todayStr = new Date().toISOString().substring(0, 10)
      const upcoming = DEMO_APPOINTMENTS
        .filter(a => a.date >= todayStr && a.status !== "cancelled" && a.status !== "completed")
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .map(a => ({ id: a.id, service: a.serviceName, barber: a.employeeName, date: a.date, time: a.time, status: a.status as Appointment["status"] }))
      const past = DEMO_APPOINTMENTS
        .filter(a => a.date < todayStr || a.status === "completed" || a.status === "cancelled")
        .map(a => ({ id: a.id, service: a.serviceName, barber: a.employeeName, date: a.date, time: a.time, status: a.status as Appointment["status"] }))
      setAppointments(upcoming)
      setPastAppointments(past)
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
          service: a.service?.name || "",
          barber: a.barber?.name || "",
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

    // Loyalty points
    fetch("/api/loyalty")
      .then((r) => r.json())
      .then((d: { points?: number; transactions?: Array<{ id: string; points: number; type: string; description: string | null; created_at: string }> }) => {
        if (typeof d.points === "number") setLoyaltyPoints(d.points)
        if (Array.isArray(d.transactions)) setLoyaltyTx(d.transactions)
      })
      .catch(() => { /* non-critical */ })

  }, [user])

  if (!user) return null

  const handleLogout = async () => {
    localStorage.removeItem("currentUser")
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/")
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
    confirmed: "#E53935",
    pending:   "#F59E0B",
    completed: "#22C55E",
    cancelled: "#555555",
  }

  return (
    <div>
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
        .orno-action:hover { background: rgba(240,240,240,0.05) !important; }
        .orno-action:hover .orno-arrow { color: #E53935; transform: translateX(3px); }
        .orno-arrow { transition: color 0.16s, transform 0.16s; display: inline-block; }
      `}</style>

      <main style={{ padding: "24px 32px 80px" }}>

        <div className="pt-10 pb-2">
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(20px,3vw,28px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.01em" }}>
            Hola, {user.profile?.name || "bienvenido"}
          </p>
        </div>

        <div className="pt-4 pb-4">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>
            Próxima cita
          </p>
        </div>

        <div style={{ borderTop: "1px solid #252525", paddingTop: "28px", paddingBottom: "28px" }}>
          {nextAppointment ? (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.1, marginBottom: "8px", color: "#F0F0F0" }}>
                {nextAppointment.service}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#8A8A8A", letterSpacing: "0.04em" }}>
                {new Date(nextAppointment.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                {nextAppointment.time ? ` · ${nextAppointment.time}` : ""}
                {nextAppointment.barber ? ` · ${nextAppointment.barber}` : ""}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(22px,3vw,34px)", fontWeight: 300, color: "#555555", letterSpacing: "-0.01em" }}>
                Sin citas pendientes
              </p>
              <Link
                href="/client/book"
                className="orno-action"
                style={{ marginTop: "12px", display: "inline-block", fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#E53935", textDecoration: "none" }}
              >
                Reservar ahora →
              </Link>
            </div>
          )}
        </div>

        {/* ── Stats ─────────────────────────── */}
        <div className="grid grid-cols-3" style={{ borderTop: "1px solid #252525" }}>
          {[
            { value: String(appointments.length),     label: "Próximas" },
            { value: String(pastAppointments.length),  label: "Visitas" },
            { value: String(unreadCount > 0 ? unreadCount : pastAppointments.length + appointments.length), label: unreadCount > 0 ? "Sin leer" : "Total citas" },
          ].map((s, i) => (
            <div key={i} className="orno-row" style={{ padding: "24px 0", borderRight: i < 2 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "28px" : 0, paddingRight: i < 2 ? "28px" : 0 }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em", color: "#F0F0F0" }}>{s.value}</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Acciones ──────────────────────── */}
        <div className="pt-8 pb-3">
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>
            Acciones
          </p>
        </div>

        <div style={{ borderTop: "1px solid #252525" }}>
          {[
            { label: "Reservar cita", sub: "Elige servicio y horario", path: "/client/book" },
            { label: "Mis citas",     sub: "Próximas y pendientes",    path: "/client/appointments" },
            { label: "Historial",     sub: "Servicios completados",    path: "/client/history" },
          ].map((a, i) => (
            <Link
              key={i}
              href={a.path}
              className="orno-action orno-row"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "22px", fontWeight: 400, color: "#F0F0F0" }}>{a.label}</p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#555555", marginTop: "2px" }}>{a.sub}</p>
              </div>
              <span className="orno-arrow" style={{ fontSize: "18px", color: "#555555" }}>→</span>
            </Link>
          ))}
        </div>

        {/* ── Citas próximas ────────────────── */}
        {appointments.length > 0 && (
          <>
            <div className="pt-10 pb-3">
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>
                Agenda
              </p>
            </div>
            <div style={{ borderTop: "1px solid #252525" }}>
              {appointments.slice(0, 4).map((apt, i) => (
                <div key={apt.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "18px", paddingTop: "3px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "19px", fontWeight: 400, color: "#F0F0F0" }}>{apt.service}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "3px" }}>
                      {new Date(apt.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                      {apt.time ? ` · ${apt.time}` : ""}
                      {apt.barber ? ` · ${apt.barber}` : ""}
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", color: STATUS_DARK[apt.status] ?? "#555555", paddingTop: "3px", textTransform: "uppercase" }}>
                    {{ confirmed: "Confirmada", pending: "Pendiente", completed: "Completada", cancelled: "Cancelada" }[apt.status] ?? apt.status}
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
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>
                Mensajes y regalos
              </p>
            </div>
            <div style={{ borderTop: "1px solid #252525", marginBottom: "60px" }}>
              {messages.map((m) => (
                <div key={m.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ width: "3px", alignSelf: "stretch", background: m.is_read ? "#2E2E2E" : "#E53935", borderRadius: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    {m.subject && <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "#F0F0F0" }}>{m.subject}</p>}
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#8A8A8A", marginTop: "3px" }}>{m.message}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "6px" }}>
                      {new Date(m.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {!m.is_read && (
                    <button
                      onClick={() => handleMarkRead(m.id)}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", background: "none", border: "none", cursor: "pointer", paddingTop: "3px" }}
                    >
                      Leído
                    </button>
                  )}
                </div>
              ))}
              {gifts.map((g) => (
                <div key={g.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "20px", opacity: g.is_redeemed ? 0.45 : 1 }}>
                  <div style={{ width: "3px", alignSelf: "stretch", background: g.is_redeemed ? "#2E2E2E" : "#555555", borderRadius: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", color: "#F0F0F0" }}>{g.title}</p>
                    <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#8A8A8A", letterSpacing: "0.14em", marginTop: "4px" }}>{g.code}</p>
                    {g.description && <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#555555", marginTop: "3px" }}>{g.description}</p>}
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "4px" }}>
                      {g.is_redeemed ? "Canjeado" : "Presenta este código en la barbería"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Puntos de fidelidad ───────────── */}
        {loyaltyPoints !== null && (
          <>
            <div className="pt-10 pb-3">
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8A8A" }}>
                Fidelidad
              </p>
            </div>
            <div style={{ borderTop: "1px solid #252525", paddingTop: "24px", paddingBottom: "8px" }}>
              <div className="flex items-end gap-3 mb-1">
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(40px,6vw,64px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em", color: "#F0F0F0" }}>
                  {loyaltyPoints.toLocaleString("es-ES")}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8A8A", marginBottom: "10px" }}>
                  puntos
                </p>
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#555555" }}>
                Ganas 1 punto por cada dólar en servicios completados
              </p>
            </div>
            {loyaltyTx.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginBottom: "12px" }}>
                {loyaltyTx.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="orno-row" style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "12px", color: "#F0F0F0" }}>
                        {tx.description ?? (tx.type === "earn" ? "Cita completada" : tx.type === "redeem" ? "Canje" : "Ajuste")}
                      </p>
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "2px" }}>
                        {new Date(tx.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "13px", fontWeight: 500, color: tx.points > 0 ? "#22C55E" : "#E53935" }}>
                      {tx.points > 0 ? `+${tx.points}` : String(tx.points)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* bottom spacer */}
        <div style={{ height: "48px" }} />

      </main>
    </div>
  )
}

