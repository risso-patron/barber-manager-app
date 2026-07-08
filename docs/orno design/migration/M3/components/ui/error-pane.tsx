"use client"

// ORNO UI Framework · M3 · Feedback
// ErrorPane — pane-level failure. Human Spanish, no codes, always an exit.
// Panels fail in isolation; the shell never crashes whole.
// Also exports PermissionDenied — quiet, non-alarming, explains who to ask.

import * as React from "react"
import { CloudOff, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ErrorPaneProps {
  /** What failed, in the user's words: "No pudimos cargar tus citas". */
  title?: string
  /** Reassurance + cause in human terms. Default provided. */
  description?: string
  onRetry?: () => void
  retryLabel?: string
  /** compact = inside a card · page = full pane. */
  size?: "compact" | "page"
  className?: string
}

export function ErrorPane({
  title = "No pudimos cargar esta sección",
  description = "Revisa tu conexión. Tus datos están a salvo.",
  onRetry,
  retryLabel = "Reintentar",
  size = "page",
  className,
}: ErrorPaneProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "page" ? "px-8 py-16" : "px-6 py-10",
        className
      )}
    >
      <span className="mb-5 flex size-14 items-center justify-center rounded-[18px] bg-danger-tint text-danger-text">
        <CloudOff size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-[17px] font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-[360px] text-[14.5px] leading-relaxed text-ink-600">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="md" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export interface PermissionDeniedProps {
  /** What this area is, so the message stays informative: "el inventario". */
  subject?: string
  size?: "compact" | "page"
  className?: string
}

export function PermissionDenied({ subject = "esta sección", size = "page", className }: PermissionDeniedProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "page" ? "px-8 py-16" : "px-6 py-10",
        className
      )}
    >
      <span className="mb-5 flex size-14 items-center justify-center rounded-[18px] bg-secondary text-ink-600">
        <Lock size={26} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-[17px] font-semibold text-foreground">Tu cuenta no tiene acceso a {subject}</p>
      <p className="mt-1.5 max-w-[360px] text-[14.5px] leading-relaxed text-ink-600">
        Si lo necesitas para tu trabajo, pídele acceso a la persona dueña del negocio.
      </p>
    </div>
  )
}
