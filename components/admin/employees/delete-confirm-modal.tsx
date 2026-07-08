"use client"

// M1 wrapper — same path, same exported name, same props; internals
// delegate to ConfirmDialog. Deleted after M2 when call-sites import
// ConfirmDialog directly.

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  employeeName: string
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, employeeName }: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="¿Eliminar a este empleado?"
      description={
        <>
          <strong>{employeeName}</strong>. Esta acción no se puede deshacer: se eliminan sus datos y
          asignaciones.
        </>
      }
      confirmLabel="Sí, eliminar"
      cancelLabel="Mantener empleado"
      tone="danger"
      onConfirm={onConfirm}
    />
  )
}
