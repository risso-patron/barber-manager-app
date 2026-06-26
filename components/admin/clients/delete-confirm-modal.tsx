"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  clientName: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-client-title"
        className="w-full max-w-md"
      >
        <CardHeader>
          <CardTitle id="delete-client-title" className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar al cliente <strong>{clientName}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer. Se eliminarán todos los datos y el historial de citas asociados.
          </p>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={onConfirm} className="flex-1">
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
