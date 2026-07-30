import { Image as ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// LAND-1 · Slot de fotografía editorial. Estático (cero bloqueo de render);
// LAND-2 lo reemplaza por next/image con las fotos definitivas. El `hint`
// conserva la descripción del blueprint para guiar la selección de assets.

export function ImagePlaceholder({ hint, className }: { hint: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={hint}
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-sage-50 to-beige-tint",
        className
      )}
    >
      <div className="flex max-w-[240px] flex-col items-center gap-2 p-4 text-center">
        <ImageIcon className="size-6 text-ink-300" aria-hidden="true" />
        <span className="text-xs leading-snug text-ink-400">{hint}</span>
      </div>
    </div>
  )
}
