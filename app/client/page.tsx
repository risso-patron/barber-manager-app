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

  const initials = (user.profile?.name || user.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const nextAppointment = appointments[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-xl font-bold shadow-lg">
                {initials}
              </div>
              <div>
                <p className="text-gray-400 text-sm">Bienvenido,</p>
                <h1 className="text-xl font-bold">{user.profile?.name || user.email}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              {(messages.filter(m => !m.is_read).length > 0 || gifts.filter(g => !g.is_redeemed).length > 0) && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {messages.filter(m => !m.is_read).length + gifts.filter(g => !g.is_redeemed).length}
                  </span>
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Next appointment banner */}
          {nextAppointment ? (
            <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs uppercase tracking-wide mb-1">Próxima cita</p>
                <p className="font-semibold">{nextAppointment.service}</p>
                <p className="text-gray-300 text-sm">
                  {new Date(nextAppointment.date).toLocaleDateString("es-ES", {
                    weekday: "long", day: "numeric", month: "long",
                  })} · {nextAppointment.time}
                </p>
              </div>
              <Scissors className="h-8 w-8 text-purple-400 opacity-60" />
            </div>
          ) : (
            <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs uppercase tracking-wide mb-1">Sin citas pendientes</p>
                <p className="text-gray-400 text-sm">Reserva tu próxima visita</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400 opacity-60" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Próximas</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-emerald-600">{pastAppointments.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Visitas</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-purple-600">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Productos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
            onClick={() => router.push("/client/book")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Reservar Cita
          </Button>
          <Button
            variant="outline"
            className="h-14"
            onClick={() => router.push("/client/appointments")}
          >
            <History className="mr-2 h-4 w-4" />
            Mis Citas
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Próximas Citas</CardTitle>
              <CardDescription>Citas confirmadas y pendientes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/client/appointments")}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((apt) => {
                  const cfg = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
                  return (
                    <div key={apt.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Scissors className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{apt.service}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />{apt.barber}
                          <span className="mx-1">·</span>
                          <Clock className="h-3 w-3" />{apt.time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(apt.date).toLocaleDateString("es-ES", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No tienes citas programadas</p>
                <Button size="sm" className="mt-3" onClick={() => router.push("/client/book")}>
                  Reservar ahora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-purple-600" />
              Productos Disponibles
            </CardTitle>
            <CardDescription>Productos de la barbería</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.product_name}</p>
                      {product.category && (
                        <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                      )}
                      <p className="text-xs text-green-700 font-semibold mt-0.5">${product.cost_per_unit.toFixed(2)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      product.quantity <= 3
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {product.quantity <= 3 ? "Últimas" : "Disponible"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Historial</CardTitle>
              <CardDescription>Servicios completados</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/client/history")}>
              <History className="mr-1 h-3 w-3" />
              Ver todo
            </Button>
          </CardHeader>
          <CardContent>
            {pastAppointments.length > 0 ? (
              <div className="space-y-3">
                {pastAppointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{apt.service}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {apt.barber} · {new Date(apt.date).toLocaleDateString("es-ES", {
                          day: "numeric", month: "short",
                        })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Star className="h-3 w-3 mr-1" />
                      Calificar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aún no tienes servicios completados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensajes & Regalos */}
        {(messages.length > 0 || gifts.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-500" />
                Mensajes y Regalos
                {(messages.filter(m => !m.is_read).length + gifts.filter(g => !g.is_redeemed).length) > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                    {messages.filter(m => !m.is_read).length + gifts.filter(g => !g.is_redeemed).length} nuevo{messages.filter(m => !m.is_read).length + gifts.filter(g => !g.is_redeemed).length !== 1 ? "s" : ""}
                  </span>
                )}
              </CardTitle>
              <CardDescription>Mensajes y regalos de tu barbería</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Messages */}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    m.is_read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Mail className={`h-4 w-4 mt-0.5 shrink-0 ${m.is_read ? "text-gray-400" : "text-blue-600"}`} />
                      <div className="flex-1 min-w-0">
                        {m.subject && <p className={`font-medium text-sm ${m.is_read ? "text-gray-600" : "text-blue-900"}`}>{m.subject}</p>}
                        <p className={`text-sm ${m.is_read ? "text-gray-500" : "text-blue-800"}`}>{m.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(m.created_at).toLocaleDateString("es-ES", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    {!m.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-blue-600 hover:bg-blue-100 shrink-0 h-7"
                        onClick={() => handleMarkRead(m.id)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Leído
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Gifts */}
              {gifts.map((g) => (
                <div
                  key={g.id}
                  className={`p-3 rounded-lg border ${
                    g.is_redeemed ? "bg-gray-50 border-gray-200 opacity-70" : "bg-purple-50 border-purple-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Gift className={`h-4 w-4 mt-0.5 shrink-0 ${g.is_redeemed ? "text-gray-400" : "text-purple-600"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium text-sm ${g.is_redeemed ? "text-gray-500" : "text-purple-900"}`}>{g.title}</p>
                        <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold tracking-widest ${
                          g.is_redeemed ? "bg-gray-200 text-gray-500" : "bg-purple-200 text-purple-800"
                        }`}>
                          {g.code}
                        </span>
                      </div>
                      {g.description && <p className="text-xs text-gray-600 mt-0.5">{g.description}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {GIFT_LABEL[g.gift_type] ?? g.gift_type}
                        {g.value !== null && g.value !== undefined && ` · ${g.gift_type === "discount_pct" ? `${g.value}% off` : `$${g.value}`}`}
                        {(g.service_name || g.product_name) && ` · ${g.service_name || g.product_name}`}
                      </p>
                      {g.is_redeemed ? (
                        <p className="text-xs text-green-600 mt-1 font-medium">✓ Canjeado</p>
                      ) : (
                        <p className="text-xs text-purple-700 mt-1">Presenta este código en la barbería para canjear</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
