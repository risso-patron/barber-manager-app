"use client"

// M1 wrapper — same path, same exported name, same props; internals
// delegate to ConfirmDialog. Deleted after M2 when call-sites import
// ConfirmDialog directly.

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="¿Eliminar este artículo?"
      description={
        <>
          <strong>{itemName}</strong>. Esta acción no se puede deshacer.
        </>
      }
      confirmLabel="Sí, eliminar"
      cancelLabel="Mantener artículo"
      tone="danger"
      onConfirm={onConfirm}
    />
  )
}
