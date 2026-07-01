"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  Scissors,
  Loader2,
} from "lucide-react"
import { DEMO_SERVICES, DEMO_EMPLOYEES, DEMO_APPOINTMENTS } from "@/lib/demo-appointments"
import { TimeSlot } from "@/components/booking/TimeSlot"

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
}

interface Employee {
  id: string
  name: string
  role?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

type BookingStep = "service" | "barber" | "datetime" | "confirm"
const STEPS: BookingStep[] = ["service", "barber", "datetime", "confirm"]

const DEMO_MODE_SERVICES: Service[] = DEMO_SERVICES.map(s => ({
  id: s.id, name: s.name, description: s.description, price: s.price, duration: s.duration,
}))

const DEMO_MODE_EMPLOYEES: Employee[] = DEMO_EMPLOYEES.map(e => ({
  id: e.id, name: e.name, role: e.role,
}))


export default function BookAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rescheduleId = searchParams.get("reschedule")
  const user = useRequireAuth(["client"])

  const [step, setStep] = useState<BookingStep>("service")
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedBarber, setSelectedBarber] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [notes, setNotes] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isReschedule, setIsReschedule] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Load services, employees, prefill reschedule data
  useEffect(() => {
    if (!supabase) {
      setServices(DEMO_MODE_SERVICES)
      setEmployees(DEMO_MODE_EMPLOYEES)
      setIsDemoMode(true)
      setIsLoading(false)

      if (rescheduleId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apt = DEMO_APPOINTMENTS.find((a: any) => a.id === rescheduleId)
        if (apt) {
          setSelectedService(apt.serviceId)
          setSelectedBarber(apt.employeeId)
          setIsReschedule(true)
          setStep("datetime")
        }
      }
      return
    }

    Promise.all([
      supabase
        .from("services")
        .select("id, name, description, price, duration")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("users")
        .select("id, name, role")
        .eq("role", "employee")
        .order("name"),
    ]).then(([servicesRes, employeesRes]) => {
      const svcData = servicesRes.data as Service[] | null
      const empData = employeesRes.data as Employee[] | null
      setServices(svcData && svcData.length > 0 ? svcData : DEMO_MODE_SERVICES)
      setEmployees(empData && empData.length > 0 ? empData : DEMO_MODE_EMPLOYEES)
      setIsLoading(false)

      if (rescheduleId) {
        supabase
          .from("appointments")
          .select("service_id, barber_id")
          .eq("id", rescheduleId)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedService(data.service_id || "")
              setSelectedBarber(data.barber_id || "")
              setIsReschedule(true)
              setStep("datetime")
            }
          })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleId])

  // Fetch available slots when service + barber + date are all selected
  useEffect(() => {
    if (!selectedService || !selectedBarber || !selectedDate) {
      setAvailableSlots([])
      setAvailabilityError(null)
      return
    }

    setIsLoadingAvailability(true)
    setAvailabilityError(null)
    setSelectedTime("")

    const params = new URLSearchParams({
      barberId: selectedBarber,
      serviceId: selectedService,
      date: selectedDate,
    })

    fetch(`/api/availability?${params}`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then(data => {
        setAvailableSlots(Array.isArray(data.slots) ? data.slots : [])
      })
      .catch(() => {
        setAvailabilityError("No pudimos cargar los horarios. Intenta nuevamente.")
        setAvailableSlots([])
      })
      .finally(() => {
        setIsLoadingAvailability(false)
      })
  }, [selectedService, selectedBarber, selectedDate])

  const handleSubmit = async () => {
    if (!user || !service || !barber) return
    setIsSubmitting(true)
    setSubmitError(null)

    if (!supabase) {
      await new Promise(res => setTimeout(res, 600))
      setIsSubmitting(false)
      const msg = isReschedule ? "Cita reagendada en modo demo." : "Cita reservada en modo demo."
      router.push(`/client/appointments?success=${encodeURIComponent(msg)}`)
      return
    }

    const res = await fetch("/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barbershop: "barber-manager",
        clientId: user.id,
        clientName: user.profile?.name || user.email,
        clientPhone: user.profile?.phone || "0000000000",
        clientEmail: user.email,
        serviceId: service.id,
        serviceName: service.name,
        employeeId: barber.id,
        employeeName: barber.name,
        date: selectedDate,
        time: selectedTime,
        duration: service.duration,
        price: service.price,
        notes: notes || undefined,
        rescheduleId: rescheduleId || undefined,
      }),
    })

    const result = await res.json()
    setIsSubmitting(false)

    if (!res.ok || !result.success) {
      setSubmitError(result.error || "Error al crear la cita. Intenta nuevamente.")
      return
    }

    const msg = isReschedule ? "Cita reagendada exitosamente." : "Cita reservada exitosamente."
    router.push(`/client/appointments?success=${encodeURIComponent(msg)}`)
  }

  const canContinue = () => {
    switch (step) {
      case "service":  return selectedService !== ""
      case "barber":   return selectedBarber !== ""
      case "datetime": return selectedDate !== "" && selectedTime !== ""
      case "confirm":  return true
      default:         return false
    }
  }

  const stepHint = () => {
    switch (step) {
      case "service":  return selectedService === "" ? "Selecciona un servicio para continuar." : ""
      case "barber":   return selectedBarber === "" ? "Selecciona un barbero para continuar." : ""
      case "datetime": return !selectedDate ? "Selecciona una fecha para continuar." : !selectedTime ? "Selecciona una hora para continuar." : ""
      default:         return ""
    }
  }

  const service = services.find(s => s.id === selectedService)
  const barber = employees.find(e => e.id === selectedBarber)
  const todayISO = new Date().toISOString().slice(0, 10)
  const currentIndex = STEPS.indexOf(step)
  const goNext = () => { const next = STEPS[currentIndex + 1]; if (next) setStep(next) }
  const goPrev = () => { const prev = STEPS[currentIndex - 1]; if (prev) setStep(prev) }

  if (!user) return null

  return (
    <div style={{ padding: "24px 24px 80px", fontFamily: "var(--font-dm-sans)" }}>
      <style>{`
        .orno-slot:hover:not(:disabled) { border-color: #555555 !important; }
        .orno-card:hover { border-color: #555555 !important; }
      `}</style>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 16, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => step === "service" ? router.push("/client") : goPrev()}
            aria-label="Volver"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "none", border: "1px solid #2E2E2E",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#8A8A8A", flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(22px,3vw,30px)", fontWeight: 300, color: "#F0F0F0", letterSpacing: "-0.02em" }}>
              {isReschedule ? "Reagendar cita" : "Reservar cita"}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", marginTop: 2 }}>
              {step === "service"  && "Selecciona el servicio"}
              {step === "barber"   && "Elige tu barbero"}
              {step === "datetime" && "Fecha y hora"}
              {step === "confirm"  && "Confirma los detalles"}
            </p>
          </div>
        </div>

        {/* Demo banner */}
        {isDemoMode && (
          <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: 6, padding: "10px 16px", marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: "#8A8A8A" }}>
              Modo demo — los cambios no se guardan en base de datos.
            </p>
          </div>
        )}

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
          {STEPS.map((s, i) => {
            const LABELS: Record<BookingStep, string> = {
              service: "Servicio", barber: "Barbero", datetime: "Fecha/Hora", confirm: "Confirmar",
            }
            const isActive = i === currentIndex
            const isCompleted = i < currentIndex
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600,
                    background: isCompleted ? "#22C55E" : isActive ? "#E53935" : "#1A1A1A",
                    color: isCompleted || isActive ? "#fff" : "#555555",
                    border: isCompleted || isActive ? "none" : "1px solid #2E2E2E",
                  }}>
                    {isCompleted ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span
                    className="hidden sm:inline"
                    style={{
                      fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: isActive ? "#F0F0F0" : isCompleted ? "#22C55E" : "#555555",
                    }}
                  >
                    {LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: i < currentIndex ? "#22C55E" : "#252525", margin: "0 8px" }} />
                )}
              </div>
            )
          })}
        </div>

        {/* ─── Step: Service ─── */}
        {step === "service" && (
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0F0F0", marginBottom: 20 }}>
              Selecciona un servicio
            </p>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "#E53935" }} />
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {services.map((svc) => {
                  const selected = selectedService === svc.id
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      className={selected ? undefined : "orno-card"}
                      onClick={() => setSelectedService(svc.id)}
                      style={{
                        background: selected ? "#1A1A1A" : "#111",
                        border: `1px solid ${selected ? "#E53935" : "#2E2E2E"}`,
                        borderRadius: 8, padding: "20px",
                        textAlign: "left", cursor: "pointer",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400, color: "#F0F0F0", marginBottom: 6 }}>
                            {svc.name}
                          </p>
                          {svc.description && (
                            <p style={{ fontSize: 12, color: "#8A8A8A", marginBottom: 12 }}>{svc.description}</p>
                          )}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#8A8A8A", background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: 4, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock size={11} /> {svc.duration} min
                            </span>
                            <span style={{ fontSize: 11, color: "#22C55E", background: "#0F2A1A", border: "1px solid #1A3A1A", borderRadius: 4, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                              <DollarSign size={11} /> ${svc.price}
                            </span>
                          </div>
                        </div>
                        {selected && (
                          <CheckCircle size={20} style={{ color: "#E53935", flexShrink: 0, marginLeft: 12, marginTop: 2 }} />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Step: Barber ─── */}
        {step === "barber" && (
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0F0F0", marginBottom: 20 }}>
              Elige tu barbero
            </p>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {employees.map((emp) => {
                const selected = selectedBarber === emp.id
                return (
                  <button
                    key={emp.id}
                    type="button"
                    className={selected ? undefined : "orno-card"}
                    onClick={() => setSelectedBarber(emp.id)}
                    style={{
                      background: selected ? "#1A1A1A" : "#111",
                      border: `1px solid ${selected ? "#E53935" : "#2E2E2E"}`,
                      borderRadius: 8, padding: "20px",
                      textAlign: "left", cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "#E53935", color: "#FFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400,
                        flexShrink: 0,
                      }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 19, fontWeight: 400, color: "#F0F0F0" }}>
                          {emp.name}
                        </p>
                        <p style={{ fontSize: 11, color: "#555555", textTransform: "capitalize", marginTop: 2 }}>
                          {emp.role}
                        </p>
                      </div>
                    </div>
                    {selected && (
                      <CheckCircle size={18} style={{ color: "#E53935", flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Step: Date & Time ─── */}
        {step === "datetime" && (
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0F0F0", marginBottom: 24 }}>
              Fecha y hora
            </p>
            <div style={{ display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <div>
                <label htmlFor="date" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", display: "block", marginBottom: 8 }}>
                  Selecciona una fecha
                </label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime("") }}
                  min={todayISO}
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: "#111", border: "1px solid #2E2E2E",
                    borderRadius: 6, color: "#F0F0F0", fontSize: 14,
                    outline: "none", colorScheme: "dark",
                  }}
                />
                {selectedDate && selectedDate < todayISO && (
                  <p style={{ fontSize: 11, color: "#E53935", marginTop: 6 }}>La fecha no puede ser anterior a hoy.</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8A8A", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  Hora disponible
                  {isLoadingAvailability && <Loader2 size={11} className="animate-spin" style={{ color: "#555555" }} />}
                </label>

                {(!selectedService || !selectedBarber || !selectedDate) ? (
                  <p style={{ fontSize: 12, color: "#555555" }}>
                    Selecciona un servicio, barbero y fecha para ver horarios disponibles.
                  </p>
                ) : isLoadingAvailability ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                    <Loader2 size={22} className="animate-spin" style={{ color: "#E53935" }} />
                  </div>
                ) : availabilityError ? (
                  <p style={{ fontSize: 12, color: "#E53935" }}>{availabilityError}</p>
                ) : availableSlots.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#555555" }}>
                    No hay horarios disponibles para esta fecha.
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {availableSlots.map((time) => (
                      <TimeSlot
                        key={time}
                        time={time}
                        selected={selectedTime === time}
                        onClick={() => setSelectedTime(time)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step: Confirm ─── */}
        {step === "confirm" && (
          <div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 400, color: "#F0F0F0", marginBottom: 24 }}>
              {isReschedule ? "Confirma el reagendamiento" : "Confirma tu cita"}
            </p>
            <div style={{ background: "#111", border: "1px solid #252525", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555555", padding: "14px 20px", borderBottom: "1px solid #252525" }}>
                Resumen
              </p>
              {[
                {
                  icon: <Scissors size={15} style={{ color: "#E53935" }} />,
                  label: "Servicio",
                  value: service?.name ?? "",
                  sub: service ? `${service.duration} min · $${service.price}` : undefined,
                },
                {
                  icon: <User size={15} style={{ color: "#E53935" }} />,
                  label: "Barbero",
                  value: barber?.name ?? "",
                  sub: undefined,
                },
                {
                  icon: <Calendar size={15} style={{ color: "#E53935" }} />,
                  label: "Fecha y hora",
                  value: selectedDate
                    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })
                    : "",
                  sub: selectedTime ? `a las ${selectedTime}` : undefined,
                },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 14, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ paddingTop: 2 }}>{row.icon}</div>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", marginBottom: 4 }}>{row.label}</p>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 18, color: "#F0F0F0" }}>{row.value}</p>
                    {row.sub && <p style={{ fontSize: 11, color: "#8A8A8A", marginTop: 2 }}>{row.sub}</p>}
                  </div>
                </div>
              ))}
              <div style={{ padding: "16px 20px" }}>
                <label htmlFor="notes" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", display: "block", marginBottom: 8 }}>
                  Notas adicionales (opcional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: "#0A0A0A", border: "1px solid #2E2E2E",
                    borderRadius: 6, color: "#F0F0F0", fontSize: 13,
                    resize: "none", outline: "none",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                  rows={3}
                  placeholder="Ej: Prefiero un corte conservador..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {step !== "service" && (
              <button
                type="button"
                onClick={goPrev}
                style={{
                  minHeight: 44, padding: "0 20px",
                  background: "none", border: "1px solid #2E2E2E",
                  borderRadius: 6, color: "#8A8A8A", cursor: "pointer",
                  fontSize: 12, letterSpacing: "0.06em",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={() => step === "confirm" ? handleSubmit() : goNext()}
              disabled={!canContinue() || isSubmitting}
              style={{
                flex: 1, minHeight: 44,
                background: (!canContinue() || isSubmitting) ? "#1A1A1A" : "#E53935",
                border: "none", borderRadius: 6,
                color: (!canContinue() || isSubmitting) ? "#3A3A3A" : "#fff",
                cursor: (!canContinue() || isSubmitting) ? "not-allowed" : "pointer",
                fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "var(--font-dm-sans)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s",
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Guardando...</>
              ) : (
                step === "confirm"
                  ? (isReschedule ? "Confirmar reagendamiento" : "Confirmar reserva")
                  : "Continuar"
              )}
            </button>
          </div>
          {!canContinue() && stepHint() && (
            <p style={{ fontSize: 11, color: "#555555", textAlign: "center" }}>{stepHint()}</p>
          )}
          {submitError && (
            <p style={{ fontSize: 12, color: "#E53935", textAlign: "center" }}>{submitError}</p>
          )}
        </div>

      </div>
    </div>
  )
}
