"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// ORNO UI Framework · M1 · Forms
// Field = label + control + help + error as ONE accessible unit.
// Wires htmlFor/id/aria-describedby; error copy is always explained in words.
//
// <Field label="Teléfono" required error={errors.phone} help="Como aparece en WhatsApp.">
//   <Input id="phone" error={!!errors.phone} ... />
// </Field>

export interface FieldProps {
  label: string
  /** id of the control inside — also used for help/error ids. */
  htmlFor?: string
  required?: boolean
  /** Muted guidance below the control. */
  help?: string
  /** Error message. Presence switches the field to its error state. */
  error?: string
  children: React.ReactNode
  className?: string
}

export function Field({ label, htmlFor, required, help, error, children, className }: FieldProps) {
  const helpId = htmlFor ? `${htmlFor}-help` : undefined
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ml-1 text-ink-400" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-danger">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="text-[13px] text-ink-400">
          {help}
        </p>
      ) : null}
    </div>
  )
}
