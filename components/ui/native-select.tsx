import * as React from "react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Forms
// NativeSelect — the ONE native <select> of the system. Mirrors Input's
// surface (48px, radius 14, sage focus ring, danger error state) while
// keeping native semantics: `required` validation, keyboard, mobile pickers.
// Options go in via the `options` prop or as <option> children — both valid.

export interface NativeSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface NativeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Marks the field invalid: danger border + aria-invalid. Pair with <Field error>. */
  error?: boolean
  /** Convenience callback with the selected value; native onChange also fires. */
  onValueChange?: (value: string) => void
  /** Declarative options; alternatively pass <option> children. */
  options?: NativeSelectOption[]
  /** md = 48px (forms, same as Input) · sm = 40px (dense filters/toolbars). */
  size?: "sm" | "md"
}

const SIZE_CLS: Record<NonNullable<NativeSelectProps["size"]>, string> = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-4 text-[15px]",
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, error = false, onValueChange, onChange, options, size = "md", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={error || undefined}
        onChange={(e) => {
          onChange?.(e)
          onValueChange?.(e.target.value)
        }}
        className={cn(
          "flex w-full cursor-pointer rounded-lg border bg-card text-foreground transition-colors duration-micro ease-orno",
          "focus-visible:outline-none focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:bg-secondary disabled:text-ink-300",
          SIZE_CLS[size],
          error
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger-tint"
            : "border-border focus-visible:border-primary focus-visible:ring-accent",
          className
        )}
        {...props}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
    )
  }
)
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
