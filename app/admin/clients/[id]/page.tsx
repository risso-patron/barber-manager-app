"use client"

// CRM-2B · Perfil del cliente sobre el framework ORNO:
// AsyncPane + skeletons con forma (nunca spinner full-page, Bible §16),
// StatStrip/StatCard, StatusBadge (estado nunca solo por color, §12),
// Textarea del framework, notify() en vez de success+setTimeout,
// tokens semánticos (cero paleta cruda). Queries y handlers idénticos.

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { DEMO_APPOINTMENTS, getClientById } from "@/lib/demo"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge, type AppointmentStatus } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StatCard, StatStrip } from "@/components/ui/stat-card"
import { AsyncPane, paneState } from "@/components/ui/async-pane"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList, SkeletonRow, SkeletonStat } from "@/components/ui/skeleton"
import { useNotify } from "@/components/ui/notify"
import { ClientIdentity } from "@/components/admin/clients/client-identity"
import { ClientPreferencesCard } from "@/components/admin/clients/client-preferences-card"
import { ClientMembershipsCard } from "@/components/admin/clients/client-memberships-card"
import { ClientAttachmentsCard } from "@/components/admin/clients/client-attachments-card"
import { ClientTimelineCard } from "@/components/admin/clients/client-timeline-card"
import { ClientAIInsightsCard } from "@/components/admin/clients/client-ai-insights-card"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, Scissors, Save, Loader2, MessageSquare,
  Send, Gift, Sparkles, UserX,
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
  birthday: string | null
  allergies: string | null
  marketing_consent: boolean
  preferred_employee_id: string | null
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  service: { name: string; price: number; duration: number } | null
  barber: { name: string } | null
}

interface PosSale {
  id: string
  total: number
  payment_method: string
  created_at: string
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

// StatusBadge cubre los estados del sistema; cualquier valor fuera de este
// set cae a un Badge neutral con el texto crudo (mismo fallback que antes).
const KNOWN_STATUSES: ReadonlySet<string> = new Set<AppointmentStatus>([
  "pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show",
])

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const adminUser = useRequireAuth(["admin"])
  const notify = useNotify()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<ClientMessage[]>([])
  const [gifts, setGifts] = useState<ClientGift[]>([])
  const [posTotal, setPosTotal] = useState(0)
  const [posSales, setPosSales] = useState<PosSale[]>([])
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Message form state
  const [msgSubject, setMsgSubject] = useState("")
  const [msgText, setMsgText] = useState("")
  const [isSendingMsg, setIsSendingMsg] = useState(false)

  // Gift form state
  const [giftType, setGiftType] = useState<"discount_pct" | "discount_fixed" | "free_service" | "free_product">("discount_pct")
  const [giftTitle, setGiftTitle] = useState("")
  const [giftDesc, setGiftDesc] = useState("")
  const [giftValue, setGiftValue] = useState("")
  const [giftExtra, setGiftExtra] = useState("")
  const [isSendingGift, setIsSendingGift] = useState(false)

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
        birthday: null,
        allergies: null,
        marketing_consent: false,
        preferred_employee_id: null,
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
        { data: sales },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, email, phone, created_at, admin_notes, no_show_count, birthday, allergies, marketing_consent, preferred_employee_id")
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
        supabase
          .from("pos_sales")
          .select("id, total, payment_method, created_at")
          .eq("client_id", id)
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
      if (sales) {
        setPosSales(sales as PosSale[])
        setPosTotal(sales.reduce((sum, s) => sum + Number(s.total ?? 0), 0))
      }
      setIsLoading(false)
    }

    void loadProfile()
  }, [adminUser, id])

  const handleSaveNotes = async () => {
    if (!client) return
    setIsSaving(true)
    if (supabase) {
      await supabase.from("users").update({ admin_notes: notes || null }).eq("id", client.id)
    }
    setIsSaving(false)
    notify({ title: "Notas guardadas." })
  }

  const handleSendMessage = async () => {
    if (!adminUser || !msgText.trim()) return
    if (!supabase) {
      setMessages(prev => [{ id: `demo-${Date.now()}`, subject: msgSubject.trim() || null, message: msgText.trim(), is_read: false, created_at: new Date().toISOString() }, ...prev])
      setMsgText("")
      setMsgSubject("")
      notify({ title: "Mensaje enviado.", description: "El cliente lo verá en su portal." })
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
    notify({ title: "Mensaje enviado.", description: "El cliente lo verá en su portal." })
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
      setIsSendingGift(false)
      notify({ title: "Regalo enviado.", description: "Se generó un código único para el cliente." })
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
    notify({ title: "Regalo enviado.", description: "Se generó un código único para el cliente." })
  }

  // Stats
  // NOTE: appointments arrives ordered by appointment_date desc (query in loadProfile above).
  const completedAppts = appointments.filter(a => a.status === "completed")
  const apptSpent = completedAppts.reduce((sum, a) => sum + (a.service?.price ?? 0), 0)
  // Real CLV: completed appointments + POS purchases (register sales), not appointments alone.
  const totalSpent = apptSpent + posTotal
  const upcomingAppts = appointments.filter(
    a => a.status === "pending" || a.status === "confirmed"
  )
  const serviceCount = completedAppts.reduce<Record<string, number>>((acc, a) => {
    const name = a.service?.name ?? "Desconocido"
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  const favoriteService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]
  // completedAppts preserves the desc order from the query, so the first entry is the most recent.
  const lastVisit = completedAppts[0]?.appointment_date ?? null
  // upcomingAppts also inherits desc order — sort ascending to find the soonest one.
  const nextAppointment = [...upcomingAppts].sort(
    (a, b) => a.appointment_date.localeCompare(b.appointment_date)
  )[0]?.appointment_date ?? null
  // Visit frequency: average days between the client's first and most recent completed
  // appointment, spread across the number of visits in between. Needs at least 2 to mean anything.
  const visitFrequencyDays = (() => {
    if (completedAppts.length < 2) return null
    const datesAsc = [...completedAppts].map(a => a.appointment_date).sort()
    const first = new Date(datesAsc[0] + "T12:00:00")
    const last = new Date(datesAsc[datesAsc.length - 1] + "T12:00:00")
    const spanDays = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)
    return Math.round(spanDays / (datesAsc.length - 1))
  })()

  const formatShortDate = (date: string) =>
    new Date(date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })

  if (!adminUser) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Back */}
      <div>
        <Link href="/admin/clients">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a Clientes
          </Button>
        </Link>
      </div>

      <AsyncPane
        state={paneState({ loading: isLoading, count: client ? 1 : 0 })}
        skeleton={
          <div className="space-y-6">
            <SkeletonRow />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
              <SkeletonStat />
            </div>
            <SkeletonList rows={4} />
          </div>
        }
        empty={
          <EmptyState
            icon={UserX}
            title="Cliente no encontrado"
            description="El perfil que buscás no existe o fue eliminado."
            action={
              <Button variant="outline" onClick={() => router.back()}>
                Volver
              </Button>
            }
            size="page"
          />
        }
        size="page"
      >
        {client && (
          <div className="space-y-6">
            {/* Header */}
            <ClientIdentity
              size="lg"
              name={client.name}
              email={client.email.endsWith("@guest.barber") ? null : client.email}
              phone={client.phone}
              createdAt={client.created_at}
              noShowCount={client.no_show_count}
            />

            {/* Stats */}
            <StatStrip>
              <StatCard label="Total citas" value={appointments.length} />
              <StatCard
                label="Total gastado"
                value={`$${totalSpent.toFixed(0)}`}
                extra="Citas completadas + compras en tienda"
              />
              <StatCard label="Próximas citas" value={upcomingAppts.length} />
              <StatCard
                label="Servicio favorito"
                value={<span className="text-lg leading-snug">{favoriteService ? favoriteService[0] : "—"}</span>}
              />
              <StatCard
                label="Última visita"
                value={<span className="text-lg leading-snug">{lastVisit ? formatShortDate(lastVisit) : "—"}</span>}
              />
              <StatCard
                label="Próxima cita"
                value={<span className="text-lg leading-snug">{nextAppointment ? formatShortDate(nextAppointment) : "—"}</span>}
              />
              <StatCard
                label="Frecuencia de visita"
                value={<span className="text-lg leading-snug">{visitFrequencyDays !== null ? `Cada ${visitFrequencyDays} días` : "—"}</span>}
              />
            </StatStrip>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Appointment history */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Scissors className="size-4" aria-hidden="true" />
                      Historial de citas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointments.length === 0 ? (
                      <EmptyState
                        icon={Scissors}
                        title="Sin citas registradas"
                        description="Las citas del cliente van a aparecer acá."
                        size="compact"
                      />
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((appt) => (
                          <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{appt.service?.name ?? "—"}</p>
                                {KNOWN_STATUSES.has(appt.status) ? (
                                  <StatusBadge status={appt.status as AppointmentStatus} />
                                ) : (
                                  <Badge variant="neutral">{appt.status}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-ink-600 mt-0.5">
                                {new Date(appt.appointment_date + "T12:00:00").toLocaleDateString("es-ES", {
                                  weekday: "short", day: "numeric", month: "short", year: "numeric"
                                })} · {appt.appointment_time.slice(0, 5)} · {appt.barber?.name ?? "—"}
                              </p>
                            </div>
                            {(appt.service?.price !== null && appt.service?.price !== undefined) && (
                              <span className="nums text-sm font-semibold text-foreground ml-4">
                                ${appt.service.price}
                              </span>
                            )}
                          </div>
                        ))}
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
                      <MessageSquare className="size-4" aria-hidden="true" />
                      Notas del admin
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Preferencias, productos de interés, observaciones. Solo visibles para el admin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Textarea
                      rows={10}
                      className="resize-none"
                      placeholder="Ej: Le gusta el pompadour, interesado en pomada XYZ, cumpleaños en agosto..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                      className="w-full gap-2"
                    >
                      {isSaving ? (
                        <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Guardando…</>
                      ) : (
                        <><Save className="size-4" aria-hidden="true" />Guardar notas</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Send Message + Send Gift ── */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Send Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Send className="size-4 text-dustyblue-text" aria-hidden="true" />
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
                  <Textarea
                    rows={4}
                    className="resize-none"
                    placeholder="Escribe tu mensaje aquí…"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSendingMsg || !msgText.trim()}
                    className="w-full gap-2"
                  >
                    {isSendingMsg ? (
                      <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Enviando…</>
                    ) : (
                      <><Send className="size-4" aria-hidden="true" />Enviar mensaje</>
                    )}
                  </Button>
                  {messages.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                      <p className="text-xs text-muted-foreground font-medium">Mensajes enviados ({messages.length})</p>
                      {messages.map((m) => (
                        <div key={m.id} className="text-xs p-2 rounded-lg border border-border bg-background">
                          {m.subject && <p className="font-semibold">{m.subject}</p>}
                          <p className="text-ink-600 line-clamp-2">{m.message}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {new Date(m.created_at).toLocaleDateString("es-ES", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                            {m.is_read && <span className="ml-2 text-success-text">· Leído</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Send Gift */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gift className="size-4 text-lavender-text" aria-hidden="true" />
                    Enviar regalo / descuento
                  </CardTitle>
                  <CardDescription>Se genera un código único que el cliente puede canjear.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(["discount_pct", "discount_fixed", "free_service", "free_product"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setGiftType(t); setGiftExtra("") }}
                        aria-pressed={giftType === t}
                        className={cn(
                          "text-xs px-3 py-2 rounded-lg border transition-colors duration-micro",
                          giftType === t
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-ink-600 hover:bg-secondary"
                        )}
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
                    className="w-full gap-2"
                  >
                    {isSendingGift ? (
                      <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Enviando…</>
                    ) : (
                      <><Sparkles className="size-4" aria-hidden="true" />Enviar regalo</>
                    )}
                  </Button>
                  {gifts.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                      <p className="text-xs text-muted-foreground font-medium">Regalos enviados ({gifts.length})</p>
                      {gifts.map((g) => (
                        <div key={g.id} className={cn("text-xs p-2 rounded-lg border border-border bg-background", g.is_redeemed && "opacity-60")}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold truncate">{g.title}</p>
                            <span className={cn(
                              "shrink-0 px-1.5 py-0.5 rounded font-mono",
                              g.is_redeemed ? "bg-secondary text-ink-600" : "bg-lavender-tint text-lavender-text"
                            )}>
                              {g.code}
                            </span>
                          </div>
                          <p className="text-ink-600 mt-0.5">
                            {GIFT_TYPE_LABEL[g.gift_type as keyof typeof GIFT_TYPE_LABEL]?.label ?? g.gift_type}
                            {g.value !== null && g.value !== undefined && ` · ${g.gift_type === "discount_pct" ? `${g.value}%` : `$${g.value}`}`}
                            {g.is_redeemed && <span className="ml-1 text-success-text">· Canjeado</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── CRM Fase B: preferencias, membresías, adjuntos ── */}
            <div className="grid md:grid-cols-3 gap-6">
              <ClientPreferencesCard
                clientId={client.id}
                initial={{
                  birthday: client.birthday,
                  allergies: client.allergies,
                  marketingConsent: client.marketing_consent,
                  preferredEmployeeId: client.preferred_employee_id,
                }}
              />
              <ClientMembershipsCard clientId={client.id} adminUserId={adminUser?.id} />
              <ClientAttachmentsCard clientId={client.id} uploadedBy={adminUser?.id} />
            </div>

            {/* ── CRM Fase C: timeline unificado + AI Insights (placeholder) ── */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ClientTimelineCard
                  appointments={appointments}
                  messages={messages}
                  gifts={gifts}
                  posSales={posSales}
                />
              </div>
              <ClientAIInsightsCard />
            </div>
          </div>
        )}
      </AsyncPane>
    </div>
  )
}
