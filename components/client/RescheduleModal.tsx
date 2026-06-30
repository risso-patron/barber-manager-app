"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CalendarClock, Loader2 } from "lucide-react"

interface Appointment {
  id: string
  serviceName: string
  employeeName: string
  date: string
  time?: string
  status: string
}

interface RescheduleModalProps {
  appointment: Appointment
  onSuccess: (updatedDate: string, updatedTime: string) => void
}

export function RescheduleModal({ appointment, onSuccess }: RescheduleModalProps) {
  const [open, setOpen] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // La fecha mínima es mañana
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newDate || !newTime) {
      setError("La nueva fecha y hora son obligatorias.")
      return
    }

    // Demo mode: actualizar localmente sin llamada a la API
    if (!supabase) {
      onSuccess(newDate, newTime)
      handleOpenChange(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: newDate,
          appointment_time: newTime,
          reason: reason.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "No se pudo reprogramar la cita.")
        return
      }

      onSuccess(newDate, newTime)
      setOpen(false)
      setNewDate("")
      setNewTime("")
      setReason("")
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setError(null)
      setNewDate("")
      setNewTime("")
      setReason("")
    }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarClock className="h-4 w-4" />
          Reprogramar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reprogramar cita</DialogTitle>
          <DialogDescription>
            <span className="block">
              <strong>{appointment.serviceName}</strong> con {appointment.employeeName}
            </span>
            <span className="text-xs text-muted-foreground">
              Actualmente: {new Date(appointment.date).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {appointment.time ? ` a las ${appointment.time}` : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Nueva fecha</Label>
              <Input
                id="reschedule-date"
                type="date"
                min={minDate}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">Nueva hora</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reschedule-reason">
              Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="reschedule-reason"
              placeholder="Ej: Compromiso de trabajo inesperado..."
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !newDate || !newTime}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reprogramando...
                </>
              ) : (
                "Confirmar cambio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
