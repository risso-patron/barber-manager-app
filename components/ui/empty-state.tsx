"use client"

// ORNO UI Framework · M3 · Feedback
// EmptyState — one line of ORNO voice + ONE action. Never a void, never
// technical. Composition: pass icon, title, description, action(s).

import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: LucideIcon
  /** Short, human, in ORNO voice: "Sin citas hoy" — never "No data found". */
  title: string
  /** One forward-looking line: what will fill this + how. */
  description?: string
  /** Primary action (Button). */
  action?: React.ReactNode
  /** Secondary, quieter action. */
  secondaryAction?: React.ReactNode
  /** compact = inside cards/panels · page = full pane. */
  size?: "compact" | "page"
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, size = "page", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "page" ? "px-8 py-16" : "px-6 py-10",
        className
      )}
    >
      {Icon && (
        <span className="mb-5 flex size-14 items-center justify-center rounded-[18px] bg-accent text-accent-foreground">
          <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <p className="text-[17px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1.5 max-w-[360px] text-[14.5px] leading-relaxed text-ink-600">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
