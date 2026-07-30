import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Info, CircleCheck, TriangleAlert, CircleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Feedback
// InlineAlert — quiet tinted panel with icon, optional title and action.

const alertVariants = cva(
  "relative flex w-full gap-3 rounded-card border p-4 text-sm leading-relaxed [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "border-dustyblue/25 bg-dustyblue-tint text-dustyblue-text",
        success: "border-success/25 bg-success-tint text-success-text",
        warning: "border-warning/25 bg-warning-tint text-warning-text",
        danger: "border-danger/25 bg-danger-tint text-danger-text",
        neutral: "border-border bg-secondary text-ink-600",
        destructive: "border-danger/25 bg-danger-tint text-danger-text", // alias (legacy shadcn → danger)
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  neutral: Info,
  destructive: CircleAlert, // alias (legacy shadcn → danger)
} as const

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  /** Optional action rendered on the right (e.g. a small Button). */
  action?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "neutral", title, action, children, ...props }, ref) => {
    const IconCmp = ICONS[variant ?? "neutral"]
    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        <IconCmp aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {title && <p className="mb-0.5 font-semibold text-foreground">{title}</p>}
          {children}
        </div>
        {action && <div className="shrink-0 self-center">{action}</div>}
      </div>
    )
  }
)
Alert.displayName = "Alert"

// Legacy API compatibility (shadcn)
const AlertTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("mb-0.5 font-semibold text-foreground", className)} {...p} />
)
const AlertDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div className={cn("text-sm", className)} {...p} />
)

export { Alert, AlertTitle, AlertDescription }
