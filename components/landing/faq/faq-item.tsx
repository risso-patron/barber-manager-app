import { ChevronDown } from "lucide-react"

// LAND-1 · Ítem de FAQ sobre <details>/<summary> nativo: teclado, screen
// reader y toggle sin una línea de JavaScript.

export function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-border bg-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown
          className="size-[17px] shrink-0 text-ink-400 transition-transform duration-enter group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-5 pb-5 text-sm leading-relaxed text-ink-600">{a}</div>
    </details>
  )
}
