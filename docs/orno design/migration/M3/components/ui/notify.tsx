"use client"

// ORNO UI Framework · M3 · Feedback
// Toast v2 — optimistic-UI companion. Success with Deshacer, human copy only.
// Thin wrapper over the existing radix toast plumbing; feature code calls
// notify() and never touches toast internals.
//
// Copy rules (Product Voice):
//   ✓ "Cita guardada. Le avisamos a Julián por WhatsApp."
//   ✗ "Error 500" / "Request failed" / "Undefined"
// Technical details go to console/telemetry, NEVER to the toast.

import * as React from "react"
import { Check, CircleAlert, Info } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export type NotifyKind = "success" | "error" | "info"

export interface NotifyOptions {
  kind?: NotifyKind
  /** Main sentence, human Spanish. */
  title: string
  /** Optional second sentence. */
  description?: string
  /** Renders a "Deshacer" button wired to this callback (6s window). */
  onUndo?: () => void
  undoLabel?: string
}

const ICON: Record<NotifyKind, React.ReactNode> = {
  success: <Check className="size-4" aria-hidden="true" />,
  error: <CircleAlert className="size-4" aria-hidden="true" />,
  info: <Info className="size-4" aria-hidden="true" />,
}

const ICON_CLS: Record<NotifyKind, string> = {
  success: "bg-success-tint text-success-text",
  error: "bg-danger-tint text-danger-text",
  info: "bg-dustyblue-tint text-dustyblue-text",
}

export function useNotify() {
  const { toast } = useToast()

  return React.useCallback(
    ({ kind = "success", title, description, onUndo, undoLabel = "Deshacer" }: NotifyOptions) => {
      toast({
        duration: onUndo ? 6000 : 4000,
        description: (
          <div className="flex items-center gap-3">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${ICON_CLS[kind]}`}>
              {ICON[kind]}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-medium text-foreground">{title}</span>
              {description && <span className="text-ink-600"> {description}</span>}
            </span>
            {onUndo && (
              <Button variant="ghost" size="sm" className="shrink-0 text-sage-700" onClick={onUndo}>
                {undoLabel}
              </Button>
            )}
          </div>
        ),
      })
    },
    [toast]
  )
}
