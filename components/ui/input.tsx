import * as React from "react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Forms
// 48px, radius 14, sage focus ring. `error` switches the ring/border to danger.

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid: danger border + aria-invalid. Pair with <Field error>. */
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-12 w-full rounded-lg border bg-card px-4 text-[15px] text-foreground transition-colors duration-micro ease-orno",
          "placeholder:text-ink-400",
          "focus-visible:outline-none focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:bg-secondary disabled:text-ink-300",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          error
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger-tint"
            : "border-border focus-visible:border-primary focus-visible:ring-accent",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
