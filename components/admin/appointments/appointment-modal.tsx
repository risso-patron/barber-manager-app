"use client"

// M3 · Migrated onto FormModal + Field. Same props, same validation, same
// payloads. Native selects kept (ORNO-tokened) to preserve exact behavior.

import { useState, useEffect } from "react"
import { FormModal } from "@/components/ui/form-modal"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UserPlus, ChevronLeft } from "lucide-react"
import type { Appointment, Service, Employee, Client } from "@/lib/demo"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: Omit<Appointment, "id" | "createdAt"> | Appointment) => void
  appointment?: Appointment
  services: Service[]
  employees: Employee[]
  clients: Client[]
}

// Native select, ORNO-tokened (mirrors the Input primitive's surface).
const SELECT_CLS =
  "flex h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground transition-colors duration-micro ease-orno focus-visible:outline-none focus-visible:ring-[3px] focus-visible:border-primary focus-visible:ring-accent"

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment,
  services,
  employees,
  clients,
}: AppointmentModalProps) {
  // Sync form whenever the modal opens or the appointment being edited changes
  useEffect(() => {
    if (!isOpen) return
    setFormData({
      clientId: appointment?.clientId ?? "",
      clientName: appointment?.clientName ?? "",
      clientPhone: appointment?.clientPhone ?? "",
      employeeId: appointment?.employeeId ?? "",
      employeeName: appointment?.employeeName ?? "",
      serviceId: appointment?.serviceId ?? "",
      serviceName: appointment?.serviceName ?? "",
      date: appointment?.date ?? new Date().toISOString().split("T")[0]!,
      time: appointment?.time ?? "09:00",
      duration: appointment?.duration ?? 30,
      price: appointment?.price ?? 0,
      status: appointment?.status ?? "pending",
      notes: appointment?.notes ?? "",
    })
    setIsNewClient(false)
    setNewClientName("")
    setNewClientPhone("")
    setFormErrors({})
  }, [isOpen, appointment])

  const [formData, setFormData] = useState<{
    clientId: string; clientName: string; clientPhone: string
    employeeId: string; employeeName: string
    serviceId: string; serviceName: string
    date: string; time: string; duration: number; price: number
    status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
    notes: string
  }>({
    clientId: appointment?.clientId || "",
    clientName: appointment?.clientName || "",
    clientPhone: appointment?.clientPhone || "",
    employeeId: appointment?.employeeId || "",
    employeeName: appointment?.employeeName || "",
    serviceId: appointment?.serviceId || "",
    serviceName: appointment?.serviceName || "",
    date: (appointment?.date || new Date().toISOString().split('T')[0]) as string,
    time: appointment?.time || "09:00",
    duration: appointment?.duration || 30,
    price: appointment?.price || 0,
    status: appointment?.status || "pending",
    notes: appointment?.notes || "",
  })

  const [isNewClient, setIsNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const todayISO = new Date().toISOString().split("T")[0] as string

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setFormData({
        ...formData,
        clientId,
        clientName: client.name,
        clientPhone: client.phone,
      })
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (employee) {
      setFormData({
        ...formData,
        employeeId,
        employeeName: employee.name,
      })
    }
  }

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setFormData({
        ...formData,
        serviceId,
        serviceName: service.name,
        duration: service.duration,
        price: service.price,
      })
    }
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    const clientId = isNewClient ? "__new__" : formData.clientId
    if (!isNewClient && !clientId) errors.clientId = "Selecciona un cliente."
    if (isNewClient && !newClientName.trim()) errors.newClientName = "Ingresa el nombre del cliente."
    if (!formData.serviceId) errors.serviceId = "Selecciona un servicio."
    if (!formData.employeeId) errors.employeeId = "Selecciona un barbero."
    if (!formData.date) errors.date = "Selecciona una fecha válida."
    else if (!appointment && formData.date < todayISO!) errors.date = "La fecha no puede ser anterior a hoy."
    if (!formData.time) errors.time = "Selecciona una hora válida."
    if (formData.price <= 0) errors.price = "El precio debe ser mayor a 0."
    if (formData.duration <= 0) errors.duration = "La duración debe ser mayor a 0."
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const clientId = isNewClient ? "__new__" : formData.clientId
    const clientName = isNewClient ? newClientName : formData.clientName
    const clientPhone = isNewClient ? newClientPhone : formData.clientPhone

    const payload = { ...formData, clientId, clientName, clientPhone }

    if (appointment) {
      onSave({ ...payload, id: appointment.id, createdAt: appointment.createdAt })
    } else {
      onSave(payload)
    }
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={appointment ? "Editar Cita" : "Nueva Cita"}
      submitLabel={appointment ? "Guardar Cambios" : "Crear Cita"}
      onSubmit={handleSubmit}
      size="lg"
    >
      {/* Client Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="clientId">
            Cliente
            <span className="ml-1 text-ink-400" aria-hidden="true">*</span>
          </Label>
          <button
            type="button"
            onClick={() => {
              setIsNewClient(!isNewClient)
              setNewClientName("")
              setNewClientPhone("")
              setFormData({ ...formData, clientId: "", clientName: "", clientPhone: "" })
            }}
            className="flex items-center gap-1 text-[13px] font-medium text-sage-700 hover:text-sage-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {isNewClient ? (
              <><ChevronLeft className="h-3 w-3" /> Seleccionar existente</>
            ) : (
              <><UserPlus className="h-3 w-3" /> Nuevo cliente</>
            )}
          </button>
        </div>

        {isNewClient ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dustyblue/25 bg-dustyblue-tint p-3">
            <p className="text-[13px] font-medium text-dustyblue-text">Se creará un cliente nuevo al guardar</p>
            <Input
              placeholder="Nombre completo *"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              error={!!formErrors.newClientName}
            />
            {formErrors.newClientName && (
              <p role="alert" className="text-[13px] font-medium text-danger">{formErrors.newClientName}</p>
            )}
            <Input
              placeholder="Teléfono *"
              type="tel"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
            />
          </div>
        ) : (
          <>
            <select
              id="clientId"
              aria-label="Cliente"
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Seleccionar cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.phone}
                </option>
              ))}
            </select>
            {formErrors.clientId && (
              <p role="alert" className="text-[13px] font-medium text-danger">{formErrors.clientId}</p>
            )}
          </>
        )}
      </div>

      <Field label="Servicio" htmlFor="serviceId" required error={formErrors.serviceId}>
        <select
          id="serviceId"
          aria-label="Servicio"
          value={formData.serviceId}
          onChange={(e) => handleServiceChange(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">Seleccionar servicio</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>
              {service.name} - ${service.price} ({service.duration} min)
            </option>
          ))}
        </select>
      </Field>

      <Field label="Barbero" htmlFor="employeeId" required error={formErrors.employeeId}>
        <select
          id="employeeId"
          aria-label="Barbero"
          value={formData.employeeId}
          onChange={(e) => handleEmployeeChange(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">Seleccionar barbero</option>
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha" htmlFor="date" required error={formErrors.date}>
          <Input
            id="date"
            type="date"
            min={appointment ? undefined : todayISO}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={!!formErrors.date}
          />
        </Field>

        <Field label="Hora" htmlFor="time" required error={formErrors.time}>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            error={!!formErrors.time}
          />
        </Field>
      </div>

      {/* Duration and Price (read-only, auto-filled from service) */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Duración (minutos)" htmlFor="duration">
          <Input id="duration" type="number" value={formData.duration} readOnly />
        </Field>

        <Field label="Precio ($)" htmlFor="price">
          <Input id="price" type="number" value={formData.price} readOnly />
        </Field>
      </div>

      {/* Status (only for editing) */}
      {appointment && (
        <Field label="Estado" htmlFor="status">
          <select
            id="status"
            aria-label="Estado de la cita"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "confirmed" | "completed" | "cancelled" | "no_show" })}
            className={SELECT_CLS}
          >
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </Field>
      )}

      <Field label="Notas (opcional)" htmlFor="notes">
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Preferencias del cliente, observaciones especiales..."
        />
      </Field>
    </FormModal>
  )
}
