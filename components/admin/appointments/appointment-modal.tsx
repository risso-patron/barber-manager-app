"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, UserPlus, ChevronLeft } from "lucide-react"
import type { Appointment, Service, Employee, Client } from "@/lib/demo-appointments"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: Omit<Appointment, "id" | "createdAt"> | Appointment) => void
  appointment?: Appointment
  services: Service[]
  employees: Employee[]
  clients: Client[]
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment,
  services,
  employees,
  clients,
}: AppointmentModalProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const clientId = isNewClient ? "__new__" : formData.clientId
    const clientName = isNewClient ? newClientName : formData.clientName
    const clientPhone = isNewClient ? newClientPhone : formData.clientPhone

    const payload = {
      ...formData,
      date: formData.date,
      clientId,
      clientName,
      clientPhone,
    }

    if (appointment) {
      onSave({ ...payload, id: appointment.id, createdAt: appointment.createdAt })
    } else {
      onSave(payload)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {appointment ? "Editar Cita" : "Nueva Cita"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId">Cliente *</Label>
              <button
                type="button"
                onClick={() => {
                  setIsNewClient(!isNewClient)
                  setNewClientName("")
                  setNewClientPhone("")
                  setFormData({ ...formData, clientId: "", clientName: "", clientPhone: "" })
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                {isNewClient ? (
                  <><ChevronLeft className="h-3 w-3" /> Seleccionar existente</>
                ) : (
                  <><UserPlus className="h-3 w-3" /> Nuevo cliente</>
                )}
              </button>
            </div>

            {isNewClient ? (
              <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Se creará un cliente nuevo al guardar</p>
                <Input
                  placeholder="Nombre completo *"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  placeholder="Teléfono *"
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
            ) : (
              <select
                id="clientId"
                aria-label="Cliente"
                required
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">Servicio *</Label>
            <select
              id="serviceId"
              aria-label="Servicio"
              required
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seleccionar servicio</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employeeId">Barbero *</Label>
            <select
              id="employeeId"
              aria-label="Barbero"
              required
              value={formData.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Seleccionar barbero</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          {/* Duration and Price (read-only, auto-filled from service) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Status (only for editing) */}
          {appointment && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                aria-label="Estado de la cita"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "confirmed" | "completed" | "cancelled" | "no_show" })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Preferencias del cliente, observaciones especiales..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {appointment ? "Guardar Cambios" : "Crear Cita"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
