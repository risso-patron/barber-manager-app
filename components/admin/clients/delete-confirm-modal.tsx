"use client"

// M1 wrapper — same path, same exported name, same props; internals
// delegate to ConfirmDialog. Deleted after M2 when call-sites import
// ConfirmDialog directly.

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  clientName: string
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, clientName }: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="¿Eliminar este cliente?"
      description={
        <>
          <strong>{clientName}</strong>. Esta acción no se puede deshacer: se eliminan sus datos y el
          historial de citas asociado.
        </>
      }
      confirmLabel="Sí, eliminar"
      cancelLabel="Mantener cliente"
      tone="danger"
      onConfirm={onConfirm}
    />
  )
}
