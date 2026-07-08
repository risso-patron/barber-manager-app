"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

// ORNO UI Framework · M1 · Forms
// Search field: leading icon, Escape/button to clear, optional kbd hint.

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string
  onValueChange: (value: string) => void
  /** Keyboard hint shown at right when empty (e.g. "/"). */
  shortcutHint?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onValueChange, shortcutHint, placeholder = "Buscar…", ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-4 size-[17px] text-ink-400" aria-hidden="true" />
        <input
          ref={ref}
          type="search"
          role="searchbox"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.stopPropagation()
              onValueChange("")
            }
          }}
          className={cn(
            "h-12 w-full rounded-lg border border-border bg-secondary pl-11 pr-10 text-[15px] text-foreground transition-colors duration-micro ease-orno",
            "placeholder:text-ink-400",
            "focus-visible:border-primary focus-visible:bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent",
            "[&::-webkit-search-cancel-button]:hidden",
            className
          )}
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onValueChange("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 flex size-8 items-center justify-center rounded-lg text-ink-400 hover:bg-border/50 hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : shortcutHint ? (
          <kbd
            aria-hidden="true"
            className="absolute right-3.5 flex h-[22px] items-center rounded-md border border-border bg-background px-1.5 text-xs font-semibold text-ink-400"
          >
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
