"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Forms
// Heights: lg 48 (default, Constitution) · md 40 · sm 34. Radius 14 (--radius).
// `default`/`outline` kept as aliases so legacy call-sites compile unchanged.
// `destructive` is now SOFT (tinted) — solid red buttons are banned by the Constitution.

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-micro ease-orno focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-sage-600",
        default: "bg-primary text-primary-foreground hover:bg-sage-600", // alias
        secondary: "border border-border bg-card text-foreground hover:bg-secondary",
        outline: "border border-border bg-card text-foreground hover:bg-secondary", // alias
        ghost: "text-ink-600 hover:bg-secondary hover:text-foreground",
        destructive: "border border-danger/25 bg-danger-tint text-danger-text hover:brightness-[0.97]",
        link: "text-sage-700 underline-offset-4 hover:underline",
      },
      size: {
        lg: "h-12 px-6 text-[15px] [&_svg]:size-[18px]",
        default: "h-12 px-6 text-[15px] [&_svg]:size-[18px]", // alias
        md: "h-10 px-[18px] text-sm [&_svg]:size-4",
        sm: "h-[34px] rounded-[10px] px-3.5 text-[13px] [&_svg]:size-3.5",
        icon: "h-12 w-12 [&_svg]:size-[18px]",
        "icon-md": "h-10 w-10 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Shows a spinner, disables the button, sets aria-busy. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
