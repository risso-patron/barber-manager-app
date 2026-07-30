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
import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Forms
// THE CRUD modal shell. Replaces the 6 hand-rolled entity modals' scaffolding
// (appointment/client/employee/inventory/service/loyalty). Business logic and
// form state stay in the feature component; this owns overlay, header, submit
// footer, loading, scroll and a11y.

export interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Form fields — compose with <Field> + Input/Select/Textarea. */
  children: React.ReactNode
  submitLabel?: string
  cancelLabel?: string
  /** Disables inputs' footer + spinner on submit button. */
  loading?: boolean
  /** Called on footer submit AND native form submit (Enter). */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  /** sm 480 · md 560 (default) · lg 680 */
  size?: "sm" | "md" | "lg"
  /** Replace the default footer entirely (rare). */
  footer?: React.ReactNode
}

const SIZES = { sm: "max-w-[480px]", md: "max-w-[560px]", lg: "max-w-[680px]" }

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  loading = false,
  onSubmit,
  size = "md",
  footer,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className={cn(SIZES[size], "max-h-[90vh] gap-0 overflow-hidden p-0")}>
        <DialogHeader className="border-b border-secondary p-8 pb-5">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit(e)
          }}
          className="flex min-h-0 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-8 pt-6">
            <div className="flex flex-col gap-5">{children}</div>
          </div>
          <DialogFooter className="border-t border-secondary p-6 px-8">
            {footer ?? (
              <>
                <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
                  {cancelLabel}
                </Button>
                <Button type="submit" loading={loading}>
                  {submitLabel}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
