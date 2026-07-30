"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// ORNO UI Framework · M1 · Forms
// THE confirm modal. Replaces the 5 per-module delete-confirm-modal copies.
// Human copy rules: title is a question, confirm restates the verb,
// cancel keeps the noun ("Mantener cita" — never bare "Cancelar" next to a
// destructive "Cancelar cita").

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Question form: "¿Eliminar el servicio Corte clásico?" */
  title: string
  /** Consequence in human words: what happens, who gets notified. */
  description?: React.ReactNode
  /** Restates the verb: "Sí, eliminar". */
  confirmLabel: string
  /** Keeps the noun: "Mantener servicio". Default "Volver". */
  cancelLabel?: string
  /** danger = destructive soft button. default = primary sage. */
  tone?: "danger" | "default"
  /** Disables buttons + spinner while the action runs. */
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Volver",
  tone = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
