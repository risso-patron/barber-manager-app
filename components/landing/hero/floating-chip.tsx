import * as React from "react"

import { cn } from "@/lib/utils"

// LAND-1 · Chip de producto del hero: flota sobre la foto en md+,
// se apila como fila estática en mobile (el padre decide con md:contents).

export function FloatingChip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 shadow-raised",
        className
      )}
    >
      {children}
    </div>
  )
}
