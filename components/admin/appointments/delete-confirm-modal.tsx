"use client"

// EXEMPLAR MIGRATION · M1
// components/admin/appointments/delete-confirm-modal.tsx
//
// Same file path, same exported name, same props — call-sites untouched.
// Internals delegate to the ConfirmDialog primitive. Replicate this pattern
// for the other 4 delete-confirm copies (clients/employees/inventory/services),
// keeping each module's prop names. All 5 wrappers are deleted after M2 when
// call-sites import ConfirmDialog directly.

import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  appointmentInfo: string
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, appointmentInfo }: DeleteConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="¿Eliminar esta cita?"
      description={
        <>
          {appointmentInfo}. Esta acción no se puede deshacer y el horario quedará libre.
        </>
      }
      confirmLabel="Sí, eliminar"
      cancelLabel="Mantener cita"
      tone="danger"
      onConfirm={onConfirm}
    />
  )
}
