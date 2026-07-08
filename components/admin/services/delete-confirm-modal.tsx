"use client"

// M1 wrapper — same path, same exported name, same props; internals
// delegate to ConfirmDialog. Deleted after M2 when call-sites import
// ConfirmDialog directly.

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  serviceName: string
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, serviceName }: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="¿Eliminar este servicio?"
      description={
        <>
          <strong>{serviceName}</strong>. Esta acción no se puede deshacer: se eliminan todos los datos
          asociados.
        </>
      }
      confirmLabel="Sí, eliminar"
      cancelLabel="Mantener servicio"
      tone="danger"
      onConfirm={onConfirm}
    />
  )
}
