import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Clock, X, UserX, Star } from "lucide-react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Data Display
// Tinted pills, radius 999. Constitution rule: estado NUNCA solo por color —
// use StatusBadge (icon + text) for appointment states.

const badgeVariants = cva(
  "inline-flex h-[26px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-ink-600",
        success: "bg-success-tint text-success-text",
        warning: "bg-warning-tint text-warning-text",
        danger: "bg-danger-tint text-danger-text",
        info: "bg-dustyblue-tint text-dustyblue-text",
        lavender: "bg-lavender-tint text-lavender-text",
        terracotta: "bg-terracotta-tint text-terracotta-text",
        outline: "border border-border bg-card text-ink-600",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

/* ── StatusBadge — appointment estados with mandatory icon + label ── */

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"

const STATUS: Record<AppointmentStatus, { label: string; variant: BadgeProps["variant"]; icon: React.ReactNode }> = {
  pending: { label: "Sin confirmar", variant: "warning", icon: <Clock aria-hidden="true" /> },
  confirmed: { label: "Confirmada", variant: "success", icon: <Check aria-hidden="true" /> },
  checked_in: { label: "En el local", variant: "info", icon: <Check aria-hidden="true" /> },
  in_progress: { label: "En curso", variant: "success", icon: <Star aria-hidden="true" /> },
  completed: { label: "Completada", variant: "neutral", icon: <Check aria-hidden="true" /> },
  cancelled: { label: "Cancelada", variant: "danger", icon: <X aria-hidden="true" /> },
  no_show: { label: "No vino", variant: "terracotta", icon: <UserX aria-hidden="true" /> },
}

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const s = STATUS[status]
  return (
    <Badge variant={s.variant} className={className}>
      {s.icon}
      {s.label}
    </Badge>
  )
}

export { Badge, badgeVariants }
