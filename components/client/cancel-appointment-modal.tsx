"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, X } from "lucide-react"

interface CancelAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  appointmentDetails: {
    serviceName: string
    date: string
    time: string
    employeeName: string
  }
}

export function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  appointmentDetails
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(reason)
      setReason("")
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason("")
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="relative z-10 w-full max-w-lg mx-4 shadow-xl"
      >
        <CardHeader className="relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle id="cancel-modal-title" className="text-xl">Cancelar Cita</CardTitle>
              <CardDescription>Esta acción no se puede deshacer</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Appointment Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              Detalles de la Cita:
            </h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Servicio:</span> {appointmentDetails.serviceName}</p>
              <p><span className="font-medium">Fecha:</span> {new Date(appointmentDetails.date + "T12:00:00").toLocaleDateString("es-ES", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}</p>
              <p><span className="font-medium">Hora:</span> {appointmentDetails.time}</p>
              <p><span className="font-medium">Barbero:</span> {appointmentDetails.employeeName}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Política de Cancelación</p>
              <p>Por favor cancela con al menos 24 horas de anticipación para evitar cargos.</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="cancel-reason" className="block text-sm font-medium mb-2">
              Motivo de Cancelación (Opcional)
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Tengo un compromiso urgente..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-slate-500 mt-1">{reason.length}/200 caracteres</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
              style={{ minHeight: 44 }}
            >
              Mantener Cita
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1"
              style={{ minHeight: 44 }}
            >
              {isSubmitting ? "Cancelando..." : "Confirmar Cancelación"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
