"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input, type InputProps } from "@/components/ui/input"

// ORNO UI Framework · M1 · Forms
// Money input: $ prefix, decimal keyboard, tabular numbers.
// Value is a string to preserve user typing; parse at the business layer.

export interface CurrencyInputProps extends Omit<InputProps, "type" | "inputMode"> {
  /** Currency symbol. Default "$". */
  symbol?: string
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, symbol = "$", ...props }, ref) => (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ink-400"
      >
        {symbol}
      </span>
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn("nums pl-9", className)}
        {...props}
      />
    </div>
  )
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
