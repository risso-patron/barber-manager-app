"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { type Appointment, type AppointmentStatus, getAppointmentsByEmployee, APPOINTMENT_STATUS_LABELS } from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#818CF8",
  completed: "#22C55E",
  cancelled: "#8A8A8A",
  no_show: "#E53935",
}

export default function EmployeeHistoryPage() {
  const user = useRequireAuth(["employee", "admin"])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [search, setSearch] = useState("")

  const loadAppointments = useCallback(async (employeeId: string, employeeName?: string) => {
    if (!supabase) {
      setAppointments(getAppointmentsByEmployee(employeeId))
      return
    }
    const { data } = await supabase
      .from("appointments")
      .select(`id, appointment_date, appointment_time, status, notes, created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        service:services(id, name, price, duration)`)
      .eq("barber_id", employeeId)
      .order("appointment_date", { ascending: false })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAppointments((data as any[]).map((a) => ({
        id: a.id,
        clientId: a.client?.id || "",
        clientName: a.client?.name || "",
        clientPhone: a.client?.phone || "",
        employeeId,
        employeeName: employeeName || "Empleado",
        serviceId: a.service?.id || "",
        serviceName: a.service?.name || "",
        date: a.appointment_date,
        time: a.appointment_time,
        duration: a.service?.duration || 0,
        price: a.service?.price || 0,
        status: a.status,
        notes: a.notes || undefined,
        createdAt: a.created_at,
      })))
    }
  }, [])

  useEffect(() => {
    if (!user) return
    void loadAppointments(user.id, (user as { name?: string }).name)
  }, [user, loadAppointments])

  const todayDate = new Date().toISOString().split("T")[0]

  const pastAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.date < todayDate! || apt.status === "completed" || apt.status === "cancelled" || apt.status === "no_show")
      .filter((apt) => !search || apt.clientName.toLowerCase().includes(search.toLowerCase()) || apt.serviceName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
  }, [appointments, todayDate, search])

  if (!user) return null

  return (
    <div style={{ padding: "24px 32px 80px" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-row { animation: ornoFadeUp 0.3s ease both; }
        .orno-search { background: #111 !important; border: 1px solid #2E2E2E !important; color: #F0F0F0 !important; }
        .orno-search::placeholder { color: #555555 !important; }
      `}</style>

      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Historial</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>Citas pasadas</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por cliente o servicio..."
        className="orno-search"
        style={{ width: "100%", maxWidth: "320px", padding: "8px 12px", borderRadius: "4px", fontFamily: "var(--font-dm-sans)", fontSize: "12px", marginBottom: "16px" }}
      />

      <div style={{ height: "1px", background: "#252525", marginBottom: "8px" }} />

      {pastAppointments.length === 0 ? (
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#555555", padding: "24px 0" }}>Sin citas en el historial</p>
      ) : (
        pastAppointments.map((apt, i) => (
          <div key={apt.id} className="orno-row" style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
            <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "18px", paddingTop: "3px" }}>{String(i + 1).padStart(2, "0")}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "18px", fontWeight: 400, color: "#F0F0F0" }}>
                  {new Date(apt.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })} · {apt.clientName}
                </p>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: STATUS_COLOR[apt.status] }}>
                  {APPOINTMENT_STATUS_LABELS[apt.status]}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "3px" }}>
                {apt.serviceName} · {apt.status === "completed" ? `$${apt.price}` : "—"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
