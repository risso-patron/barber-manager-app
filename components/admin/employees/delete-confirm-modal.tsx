"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  employeeName: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-emp-title"
        className="bg-white rounded-lg max-w-md w-full p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 id="delete-emp-title" className="text-lg font-semibold text-gray-900 mb-2">
              Eliminar Empleado
            </h3>
            <p className="text-gray-600 mb-1">
              ¿Estás seguro de que deseas eliminar a este empleado?
            </p>
            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
              {employeeName}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Esta acción no se puede deshacer. Se eliminarán todos sus datos y asignaciones.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
