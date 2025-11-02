"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"
import type { Appointment } from "@/lib/types"

export function AppointmentForm() {
  const { user, addAppointment } = useAppStore()
  const [barberId, setBarberId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user || user.role !== "client") {
      return
    }

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      client_id: user.id,
      barber_id: barberId,
      service_id: serviceId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: "pending",
      notes: notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addAppointment(newAppointment)
    setBarberId("")
    setServiceId("")
    setAppointmentDate("")
    setAppointmentTime("")
    setNotes("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="barberId">Barbero</Label>
          <Input
            id="barberId"
            value={barberId}
            onChange={(event) => setBarberId(event.target.value)}
            placeholder="ID del barbero"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceId">Servicio</Label>
          <Input
            id="serviceId"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            placeholder="ID del servicio"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Fecha</Label>
          <Input
            id="appointmentDate"
            type="date"
            value={appointmentDate}
            onChange={(event) => setAppointmentDate(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointmentTime">Hora</Label>
          <Input
            id="appointmentTime"
            type="time"
            value={appointmentTime}
            onChange={(event) => setAppointmentTime(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notas opcionales para la cita"
          className="h-24 w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-500"
        />
      </div>

      <Button type="submit" className="w-full md:w-auto">
        Reservar cita
      </Button>
    </form>
  )
}

export default AppointmentForm
