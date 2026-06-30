"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  type Appointment,
  type AppointmentStatus,
  getAppointmentsByEmployee,
  APPOINTMENT_STATUS_LABELS,
  getNextStatusActions,
} from "@/lib/demo-appointments"
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

export default function EmployeeAppointmentsPage() {
  const user = useRequireAuth(["employee", "admin"])
  const [appointments, setAppointments] = useState<Appointment[]>([])

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
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })

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

  const activeAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.date >= todayDate! && apt.status !== "cancelled" && apt.status !== "no_show")
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [appointments, todayDate])

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    if (supabase) {
      await supabase.from("appointments").update({ status: newStatus }).eq("id", id)
    }
    setAppointments((prev) => prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)))
  }

  if (!user) return null

  return (
    <div style={{ padding: "24px 32px 80px" }}>
      <style>{`
        @keyframes ornoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .orno-row { animation: ornoFadeUp 0.3s ease both; }
        .orno-action { transition: color 0.15s, border-color 0.15s; cursor: pointer; }
        .orno-action:hover { color: #F0F0F0 !important; border-color: #555 !important; }
      `}</style>

      <div className="pt-8 pb-3">
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>Mis citas</p>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A8A", marginTop: "4px" }}>Gestión de citas activas</p>
      </div>
      <div style={{ height: "1px", background: "#252525", marginBottom: "24px" }} />

      {activeAppointments.length === 0 ? (
        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "20px", fontWeight: 300, color: "#555555", padding: "24px 0" }}>Sin citas activas</p>
      ) : (
        activeAppointments.map((apt, i) => {
          const actions = getNextStatusActions(apt.status)
          return (
            <div key={apt.id} className="orno-row" style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: "18px" }}>
              <span style={{ fontFamily: "var(--font-dm-mono)", fontSize: "11px", color: "#555555", minWidth: "18px", paddingTop: "3px" }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "19px", fontWeight: 400, color: "#F0F0F0" }}>
                    {new Date(apt.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {apt.time} · {apt.clientName}
                  </p>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: STATUS_COLOR[apt.status], border: `1px solid ${STATUS_COLOR[apt.status]}`, padding: "3px 8px", borderRadius: "2px" }}>
                    {APPOINTMENT_STATUS_LABELS[apt.status]}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", color: "#8A8A8A", marginTop: "4px" }}>
                  {apt.serviceName} · {apt.duration} min · ${apt.price}
                  {apt.clientPhone && ` · ${apt.clientPhone}`}
                </p>
                {apt.notes && (
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#555555", marginTop: "4px", fontStyle: "italic" }}>{apt.notes}</p>
                )}
                {actions.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        className="orno-action"
                        onClick={() => handleStatusChange(apt.id, action.status)}
                        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", background: "none", border: "1px solid #2E2E2E", padding: "5px 12px", borderRadius: "2px" }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
