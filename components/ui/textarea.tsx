import * as React from "react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Forms

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          "flex min-h-[96px] w-full rounded-lg border bg-card px-4 py-3.5 text-[15px] leading-normal text-foreground transition-colors duration-micro ease-orno",
          "placeholder:text-ink-400",
          "focus-visible:outline-none focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:bg-secondary disabled:text-ink-300",
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
Textarea.displayName = "Textarea"

export { Textarea }
