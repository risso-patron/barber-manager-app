"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CancelAppointmentModal } from "@/components/client/cancel-appointment-modal"
import { DEMO_APPOINTMENTS } from "@/lib/demo-appointments"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { 
  Calendar, 
  Clock, 
  User,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft
} from "lucide-react"

interface Appointment {
  id: string
  serviceName: string
  employeeName: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  duration: number
  notes?: string
}

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time: string
  status: Appointment["status"]
  notes?: string | null
  barber?: { id: string; name: string } | null
  service?: { id: string; name: string; duration?: number; price?: number } | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

export default function ClientAppointmentsPage() {
  const router = useRouter()
  const user = useRequireAuth(["client"])
  const { toasts, removeToast, success, error } = useToast()
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")

  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setAppointments(DEMO_APPOINTMENTS.map(a => ({
        id: a.id,
        serviceName: a.serviceName,
        employeeName: a.employeeName,
        date: a.date,
        time: a.time,
        status: a.status,
        duration: a.duration,
        notes: a.notes,
      })))
      return
    }

    supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes,
        barber:users!appointments_barber_id_fkey(id, name),
        service:services(id, name, price, duration)`)
      .eq("client_id", user.id)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        if (data) setAppointments((data as unknown as AppointmentRow[]).map((a) => ({
          id: a.id,
          serviceName: a.service?.name || "",
          employeeName: a.barber?.name || "",
          date: a.appointment_date,
          time: a.appointment_time ?? undefined,
          status: a.status,
          duration: a.service?.duration || 0,
          notes: a.notes || "",
        })))
      })
  }, [user])

  const { upcoming, past } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcoming = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate >= today && apt.status !== "cancelled" && apt.status !== "completed"
    }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    
    const past = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate < today || apt.status === "completed" || apt.status === "cancelled"
    }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    
    return { upcoming, past }
  }, [appointments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200"
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "confirmed": return <Calendar className="h-4 w-4" />
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completada"
      case "confirmed": return "Confirmada"
      case "pending": return "Pendiente"
      case "cancelled": return "Cancelada"
      default: return status
    }
  }

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment)
    setCancelModalOpen(true)
  }

  const handleCancelConfirm = async (reason: string) => {
    if (!appointmentToCancel || !user) return

    // Demo mode: actualizar estado localmente
    if (!supabase) {
      setAppointments(prev => prev.map(a =>
        a.id === appointmentToCancel.id ? { ...a, status: "cancelled" as const } : a
      ))
      success("Cita cancelada exitosamente (modo demo)")
      setCancelModalOpen(false)
      setAppointmentToCancel(null)
      return
    }

    // Verificar sesión activa antes de intentar actualizar
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      error("Tu sesión expiró. Por favor vuelve a iniciar sesión.")
      setCancelModalOpen(false)
      setAppointmentToCancel(null)
      return
    }

    // Cancelar directamente en Supabase — .select() permite detectar si actualizó 0 filas
    const { data: updatedRows, error: dbError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentToCancel.id)
      .eq("client_id", authUser.id)
      .select("id")

    if (dbError) {
      console.error("Error cancelando cita:", dbError)
      error("No se pudo cancelar la cita. Intenta de nuevo.")
      setCancelModalOpen(false)
      setAppointmentToCancel(null)
      return
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.error("RLS bloqueó la cancelación o la cita no existe. authUser.id:", authUser.id, "appointmentId:", appointmentToCancel.id)
      error("No se pudo cancelar la cita. Verifica que la cita te pertenece.")
      setCancelModalOpen(false)
      setAppointmentToCancel(null)
      return
    }

    // Actualizar estado local inmediatamente
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentToCancel.id ? { ...apt, status: "cancelled" as const } : apt
      )
    )
    success("Cita cancelada exitosamente.")
    setCancelModalOpen(false)
    setAppointmentToCancel(null)

    // Notificaciones en background (opcional, no bloquea si falla)
    fetch(`/api/appointments/${appointmentToCancel.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        clientName: user.profile?.name || user.email,
        clientEmail: user.email,
        appointment: {
          date: appointmentToCancel.date,
          time: appointmentToCancel.time,
          serviceName: appointmentToCancel.serviceName,
          employeeName: appointmentToCancel.employeeName,
        },
      }),
    }).catch(() => { /* notificaciones opcionales */ })
  }

  if (!user) return null

  const statusLabel: Record<string, string> = {
    confirmed: "Conf.",
    pending:   "Pend.",
    completed: "Ok",
    cancelled: "—",
  }
  const statusColor: Record<string, string> = {
    confirmed: "#22C55E",
    pending:   "#F59E0B",
    completed: "#8A8A8A",
    cancelled: "#E53935",
  }
  const displayList = activeTab === "upcoming" ? upcoming : past

  return (
    <div style={{ padding: "24px 32px 80px" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-row { animation: ornoFadeUp 0.35s ease both; }
        .orno-row:nth-child(1) { animation-delay: 0.04s; }
        .orno-row:nth-child(2) { animation-delay: 0.10s; }
        .orno-row:nth-child(3) { animation-delay: 0.16s; }
        .orno-row:nth-child(4) { animation-delay: 0.22s; }
        .orno-row:nth-child(5) { animation-delay: 0.28s; }
        .orno-btn { transition: background 0.15s, color 0.15s; }
        .orno-btn:hover { background: rgba(240,240,240,0.06) !important; }
      `}</style>

      {/* Header */}
      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Mis citas</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>Próximas y pasadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderTop: "1px solid #252525", marginBottom: "32px" }}>
        {[
          { value: String(upcoming.length),           label: "Próximas" },
          { value: String(past.length),               label: "Pasadas" },
          { value: String(upcoming.filter(a => a.status === "confirmed").length), label: "Confirmadas" },
          { value: String(upcoming.filter(a => a.status === "pending").length),   label: "Pendientes" },
        ].map((s, i) => (
          <div key={i} className="orno-row" style={{ padding: "20px 0", borderRight: i < 3 ? "1px solid #252525" : "none", paddingLeft: i > 0 ? "20px" : 0, paddingRight: i < 3 ? "20px" : 0 }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 300, lineHeight: 1, color: "#F0F0F0" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #252525", marginBottom: "24px" }}>
        {(["upcoming", "past"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
              background: "none", border: "none", padding: "12px 0", cursor: "pointer",
              color: activeTab === tab ? "#F0F0F0" : "#555555",
              borderBottom: activeTab === tab ? "1px solid #E53935" : "1px solid transparent",
              marginBottom: "-1px", transition: "color 0.15s",
            }}
          >
            {tab === "upcoming" ? `Próximas (${upcoming.length})` : `Pasadas (${past.length})`}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <button
            className="orno-btn"
            onClick={() => router.push("/client/book")}
            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#E53935", background: "none", border: "1px solid rgba(229,57,53,0.3)", padding: "8px 14px", cursor: "pointer", borderRadius: "4px" }}
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ borderTop: "1px solid #252525" }}>
        {displayList.length === 0 ? (
          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#555555", padding: "24px 0" }}>
            {activeTab === "upcoming" ? "Sin citas próximas" : "Sin citas pasadas"}
          </p>
        ) : (
          displayList.map((apt, i) => (
            <div key={apt.id} className="orno-row" style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
              <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "18px", paddingTop: "3px" }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 400, color: "#F0F0F0" }}>
                    {apt.serviceName}
                  </p>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor[apt.status] ?? "#555555" }}>
                    {statusLabel[apt.status] ?? apt.status}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "3px" }}>
                  {new Date(apt.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" })}
                  {apt.time ? ` · ${apt.time}` : ""}
                  {apt.employeeName ? ` · ${apt.employeeName}` : ""}
                  {apt.duration ? ` · ${apt.duration} min` : ""}
                </p>
                {apt.notes && (
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "3px", fontStyle: "italic" }}>{apt.notes}</p>
                )}
                {activeTab === "upcoming" && apt.status !== "cancelled" && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <button
                      className="orno-btn"
                      onClick={() => router.push("/client/book")}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", background: "none", border: "1px solid #2E2E2E", padding: "5px 12px", cursor: "pointer" }}
                    >
                      Reagendar
                    </button>
                    <button
                      className="orno-btn"
                      onClick={() => handleCancelClick(apt)}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", background: "none", border: "none", padding: "5px 0", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#E53935")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#555555")}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {activeTab === "upcoming" && past.length > 0 && (
        <button
          className="orno-btn"
          onClick={() => setActiveTab("past")}
          style={{ marginTop: "24px", fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Ver historial ({past.length}) →
        </button>
      )}

      {appointmentToCancel && (
        <CancelAppointmentModal
          isOpen={cancelModalOpen}
          onClose={() => { setCancelModalOpen(false); setAppointmentToCancel(null) }}
          onConfirm={handleCancelConfirm}
          appointmentDetails={{
            serviceName: appointmentToCancel.serviceName,
            date: appointmentToCancel.date,
            time: appointmentToCancel.time,
            employeeName: appointmentToCancel.employeeName,
          }}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/client")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mis Citas</h1>
            <p className="text-muted-foreground">Gestiona tus citas próximas y pasadas</p>
          </div>
        </div>
        <Button onClick={() => router.push("/client/book")}>
          <Calendar className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Próximas Citas ({upcoming.length})</CardTitle>
          <CardDescription>Tus citas programadas</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No tienes citas próximas
              </p>
              <Button onClick={() => router.push("/client/book")} variant="outline">
                Reservar una Cita
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((apt) => (
                <div key={apt.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{apt.serviceName}</h3>
                        <Badge className={`flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)}
                          {getStatusText(apt.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(apt.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{apt.time} ({apt.duration} minutos)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{apt.employeeName}</span>
                        </div>
                        {apt.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <span className="font-medium">Nota:</span> {apt.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {apt.status !== "cancelled" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleCancelClick(apt)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Historial ({past.length})</CardTitle>
          <CardDescription>Tus citas anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tienes citas anteriores</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.slice(0, 10).map((apt) => (
                <div key={apt.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{apt.serviceName}</h4>
                        <Badge variant="outline" className={getStatusColor(apt.status)}>
                          {getStatusText(apt.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(apt.date).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {apt.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.employeeName}
                        </span>
                      </div>
                    </div>
                    {apt.status === "completed" && (
                      <Button size="sm" variant="outline">
                        Calificar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {past.length > 10 && (
                <Button variant="link" className="w-full" onClick={() => router.push("/client/history")}>
                  Ver todas las citas anteriores ({past.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Appointment Modal */}
      {appointmentToCancel && (
        <CancelAppointmentModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false)
            setAppointmentToCancel(null)
          }}
          onConfirm={handleCancelConfirm}
          appointmentDetails={{
            serviceName: appointmentToCancel.serviceName,
            date: appointmentToCancel.date,
            time: appointmentToCancel.time,
            employeeName: appointmentToCancel.employeeName
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
