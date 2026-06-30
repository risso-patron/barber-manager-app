"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { maskPhone } from "@/lib/utils"
import { DEMO_APPOINTMENTS, getClientById } from "@/lib/demo-appointments"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, Mail, Phone, Calendar, Scissors,
  DollarSign, TrendingUp, Save, Loader2, MessageSquare,
  Clock, Send, Gift, CheckCircle2, Sparkles, XCircle,
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

interface ClientProfile {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  admin_notes: string | null
  no_show_count: number
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  service: { name: string; price: number; duration: number } | null
  barber: { name: string } | null
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

const GIFT_TYPE_LABEL: Record<"discount_pct" | "discount_fixed" | "free_service" | "free_product", { label: string; icon: string }> = {
  discount_pct:   { label: "% Descuento",     icon: "%" },
  discount_fixed: { label: "Descuento fijo $", icon: "$" },
  free_service:   { label: "Servicio gratis",  icon: "✂" },
  free_product:   { label: "Producto gratis",  icon: "🎁" },
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendiente",       color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmada",      color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completada",      color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada",       color: "bg-red-100 text-red-800" },
  no_show:   { label: "No se presentó",  color: "bg-orange-100 text-orange-800" },
}

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const adminUser = useRequireAuth(["admin", "manager"])
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [gifts, setGifts] = useState<ClientGift[]>([])
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Message form state
  const [msgSubject, setMsgSubject] = useState("")
  const [msgText, setMsgText] = useState("")
  const [isSendingMsg, setIsSendingMsg] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState(false)

  // Gift form state
  const [giftType, setGiftType] = useState<"discount_pct" | "discount_fixed" | "free_service" | "free_product">("discount_pct")
  const [giftTitle, setGiftTitle] = useState("")
  const [giftDesc, setGiftDesc] = useState("")
  const [giftValue, setGiftValue] = useState("")
  const [giftExtra, setGiftExtra] = useState("")
  const [isSendingGift, setIsSendingGift] = useState(false)
  const [giftSuccess, setGiftSuccess] = useState(false)

  useEffect(() => {
    if (!adminUser) return

    if (!supabase) {
      const demoClient = getClientById(id) ?? { id, name: "Cliente Demo", email: "demo@demo.com", phone: undefined, createdAt: new Date().toISOString() }
      setClient({
        id: demoClient.id,
        name: demoClient.name,
        email: demoClient.email,
        phone: demoClient.phone ?? null,
        created_at: demoClient.createdAt ?? new Date().toISOString(),
        admin_notes: null,
        no_show_count: 0,
      })
      const clientAppts = DEMO_APPOINTMENTS.filter(a => a.clientId === id).map(a => ({
        id: a.id,
        appointment_date: a.date,
        appointment_time: a.time,
        status: a.status,
        service: { name: a.serviceName, price: a.price, duration: a.duration },
        barber: { name: a.employeeName },
      }))
      setAppointments(clientAppts)
      setIsLoading(false)
      return
    }

    const loadProfile = async () => {
      const [
        { data: profile },
        { data: appts },
        { data: msgs },
        { data: gfs },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, email, phone, created_at, admin_notes, no_show_count")
          .eq("id", id)
          .single(),
        supabase
          .from("appointments")
          .select(`id, appointment_date, appointment_time, status,
            service:services(name, price, duration),
            barber:users!appointments_barber_id_fkey(name)`)
          .eq("client_id", id)
          .order("appointment_date", { ascending: false })
          .limit(20),
        supabase
          .from("client_messages")
          .select("id, subject, message, is_read, created_at")
          .eq("to_client_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("client_gifts")
          .select("id, gift_type, title, description, value, service_name, product_name, code, is_redeemed, expires_at, created_at")
          .eq("to_client_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      if (profile) {
        setClient(profile as ClientProfile)
        setNotes(profile.admin_notes || "")
      }
      if (appts) setAppointments(appts as unknown as Appointment[])
      if (msgs)  setMessages(msgs as ClientMessage[])
      if (gfs)   setGifts(gfs as ClientGift[])
      setIsLoading(false)
    }

    void loadProfile()
  }, [adminUser, id])

  const handleSaveNotes = async () => {
    if (!client) return
    setIsSaving(true)
    setSaveSuccess(false)
    if (supabase) {
      await supabase.from("users").update({ admin_notes: notes || null }).eq("id", client.id)
    }
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const handleSendMessage = async () => {
    if (!adminUser || !msgText.trim()) return
    if (!supabase) {
      setMessages(prev => [{ id: `demo-${Date.now()}`, subject: msgSubject.trim() || null, message: msgText.trim(), is_read: false, created_at: new Date().toISOString() }, ...prev])
      setMsgText("")
      setMsgSubject("")
      setMsgSuccess(true)
      setTimeout(() => setMsgSuccess(false), 2500)
      return
    }
    setIsSendingMsg(true)
    const { data } = await supabase
      .from("client_messages")
      .insert({
        from_admin_id: adminUser.id,
        to_client_id: id,
        subject: msgSubject.trim() || null,
        message: msgText.trim(),
      })
      .select("id, subject, message, is_read, created_at")
      .single()
    if (data) setMessages(prev => [data as ClientMessage, ...prev])
    setMsgText("")
    setMsgSubject("")
    setIsSendingMsg(false)
    setMsgSuccess(true)
    setTimeout(() => setMsgSuccess(false), 2500)
  }

  const handleSendGift = async () => {
    if (!adminUser || !giftTitle.trim()) return
    setIsSendingGift(true)
    const payload: Record<string, unknown> = {
      from_admin_id: adminUser.id,
      to_client_id: id,
      gift_type: giftType,
      title: giftTitle.trim(),
      description: giftDesc.trim() || null,
    }
    if (giftValue) payload.value = parseFloat(giftValue)
    if (giftType === "free_service") payload.service_name = giftExtra.trim() || null
    if (giftType === "free_product") payload.product_name = giftExtra.trim() || null

    if (!supabase) {
      setGifts(prev => [{ id: `demo-${Date.now()}`, gift_type: giftType, title: giftTitle.trim(), description: giftDesc.trim() || null, value: giftValue ? parseFloat(giftValue) : null, service_name: null, product_name: null, code: "", is_redeemed: false, expires_at: null, created_at: new Date().toISOString() } as ClientGift, ...prev])
      setGiftTitle(""); setGiftDesc(""); setGiftValue(""); setGiftExtra("")
      setIsSendingGift(false); setGiftSuccess(true)
      setTimeout(() => setGiftSuccess(false), 2500)
      return
    }

    const { data } = await supabase
      .from("client_gifts")
      .insert(payload)
      .select("id, gift_type, title, description, value, service_name, product_name, code, is_redeemed, expires_at, created_at")
      .single()
    if (data) setGifts(prev => [data as ClientGift, ...prev])
    setGiftTitle("")
    setGiftDesc("")
    setGiftValue("")
    setGiftExtra("")
    setIsSendingGift(false)
    setGiftSuccess(true)
    setTimeout(() => setGiftSuccess(false), 2500)
  }

  // Stats
  const completedAppts = appointments.filter(a => a.status === "completed")
  const totalSpent = completedAppts.reduce((sum, a) => sum + (a.service?.price ?? 0), 0)
  const upcomingAppts = appointments.filter(
    a => a.status === "pending" || a.status === "confirmed"
  )
  const serviceCount = completedAppts.reduce<Record<string, number>>((acc, a) => {
    const name = a.service?.name ?? "Desconocido"
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  const favoriteService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]

  if (!adminUser) return null

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Cliente no encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Back */}
      <div>
        <Link href="/admin/clients">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a Clientes
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          {client.no_show_count > 0 && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                <XCircle className="h-3 w-3" />
                {client.no_show_count} no-show{client.no_show_count > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {client.email.endsWith("@guest.barber") ? (
                <span className="text-gray-400 italic">Sin email registrado</span>
              ) : client.email}
            </span>
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {adminUser?.role === "manager" ? maskPhone(client.phone) : client.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Cliente desde {new Date(client.created_at).toLocaleDateString("es-ES", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total citas</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
              <Scissors className="h-7 w-7 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total gastado</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(0)}</p>
              </div>
              <DollarSign className="h-7 w-7 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Próximas citas</p>
                <p className="text-2xl font-bold">{upcomingAppts.length}</p>
              </div>
              <Clock className="h-7 w-7 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Servicio favorito</p>
                <p className="text-sm font-bold leading-tight mt-1">
                  {favoriteService ? favoriteService[0] : "—"}
                </p>
              </div>
              <TrendingUp className="h-7 w-7 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Appointment history */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scissors className="h-4 w-4" />
                Historial de citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Sin citas registradas
                </p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt) => {
                    const st = STATUS_LABEL[appt.status] ?? { label: appt.status, color: "bg-gray-100 text-gray-700" }
                    return (
                      <div key={appt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{appt.service?.name ?? "—"}</p>
                            <Badge className={`text-xs px-2 py-0 ${st.color}`}>
                              {st.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(appt.appointment_date + "T12:00:00").toLocaleDateString("es-ES", {
                              weekday: "short", day: "numeric", month: "short", year: "numeric"
                            })} · {appt.appointment_time.slice(0, 5)} · {appt.barber?.name ?? "—"}
                          </p>
                        </div>
                        {(appt.service?.price !== null && appt.service?.price !== undefined) && (
                          <span className="text-sm font-semibold text-green-700 ml-4">
                            ${appt.service.price}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin notes */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Notas del admin
              </CardTitle>
              <CardDescription className="text-xs">
                Preferencias, productos de interés, observaciones. Solo visibles para el admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <textarea
                className="w-full border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={10}
                placeholder={`Ej: Le gusta el pompadour, interesado en pomada XYZ, cumpleaños en agosto...`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="w-full gap-2"
                variant={saveSuccess ? "outline" : "default"}
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Guardando…</>
                ) : saveSuccess ? (
                  <><Save className="h-4 w-4 text-green-600" /><span className="text-green-600">Guardado</span></>
                ) : (
                  <><Save className="h-4 w-4" />Guardar notas</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Send Message + Send Gift ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Send Message */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-700">
              <Send className="h-4 w-4" />
              Enviar mensaje al cliente
            </CardTitle>
            <CardDescription>El cliente verá el mensaje en su portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Asunto (opcional)"
              value={msgSubject}
              onChange={(e) => setMsgSubject(e.target.value)}
            />
            <textarea
              className="w-full border rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Escribe tu mensaje aquí…"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSendingMsg || !msgText.trim()}
              className="w-full gap-2"
              variant={msgSuccess ? "outline" : "default"}
            >
              {isSendingMsg ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Enviando…</>
              ) : msgSuccess ? (
                <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-green-600">Enviado</span></>
              ) : (
                <><Send className="h-4 w-4" />Enviar mensaje</>
              )}
            </Button>
            {messages.length > 0 && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                <p className="text-xs text-gray-400 font-medium">Mensajes enviados ({messages.length})</p>
                {messages.map((m) => (
                  <div key={m.id} className="text-xs p-2 bg-gray-50 rounded border">
                    {m.subject && <p className="font-semibold">{m.subject}</p>}
                    <p className="text-gray-600 line-clamp-2">{m.message}</p>
                    <p className="text-gray-400 mt-0.5">
                      {new Date(m.created_at).toLocaleDateString("es-ES", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                      {m.is_read && <span className="ml-2 text-green-600">· Leído</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Gift */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-purple-700">
              <Gift className="h-4 w-4" />
              Enviar regalo / descuento
            </CardTitle>
            <CardDescription>Se genera un código único que el cliente puede canjear.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(["discount_pct", "discount_fixed", "free_service", "free_product"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setGiftType(t); setGiftExtra("") }}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    giftType === t
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                  }`}
                >
                  {GIFT_TYPE_LABEL[t].icon} {GIFT_TYPE_LABEL[t].label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Título del regalo (ej: ¡Feliz cumpleaños!)"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={giftDesc}
              onChange={(e) => setGiftDesc(e.target.value)}
            />
            {(giftType === "discount_pct" || giftType === "discount_fixed") && (
              <Input
                type="number"
                min="0"
                placeholder={giftType === "discount_pct" ? "Porcentaje (ej: 20)" : "Monto fijo (ej: 10)"}
                value={giftValue}
                onChange={(e) => setGiftValue(e.target.value)}
              />
            )}
            {giftType === "free_service" && (
              <Input
                placeholder="Nombre del servicio gratis"
                value={giftExtra}
                onChange={(e) => setGiftExtra(e.target.value)}
              />
            )}
            {giftType === "free_product" && (
              <Input
                placeholder="Nombre del producto gratis"
                value={giftExtra}
                onChange={(e) => setGiftExtra(e.target.value)}
              />
            )}
            <Button
              onClick={handleSendGift}
              disabled={isSendingGift || !giftTitle.trim()}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              variant={giftSuccess ? "outline" : "default"}
            >
              {isSendingGift ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Enviando…</>
              ) : giftSuccess ? (
                <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-green-600">Regalo enviado</span></>
              ) : (
                <><Sparkles className="h-4 w-4" />Enviar regalo</>
              )}
            </Button>
            {gifts.length > 0 && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                <p className="text-xs text-gray-400 font-medium">Regalos enviados ({gifts.length})</p>
                {gifts.map((g) => (
                  <div key={g.id} className={`text-xs p-2 rounded border ${g.is_redeemed ? "bg-gray-50 opacity-60" : "bg-purple-50"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{g.title}</p>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded font-mono ${g.is_redeemed ? "bg-gray-200 text-gray-500" : "bg-purple-200 text-purple-800"}`}>
                        {g.code}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5">
                      {GIFT_TYPE_LABEL[g.gift_type as keyof typeof GIFT_TYPE_LABEL]?.label ?? g.gift_type}
                      {g.value !== null && g.value !== undefined && ` · ${g.gift_type === "discount_pct" ? `${g.value}%` : `$${g.value}`}`}
                      {g.is_redeemed && <span className="ml-1 text-green-600">· Canjeado</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
