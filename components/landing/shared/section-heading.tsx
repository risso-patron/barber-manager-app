import { cn } from "@/lib/utils"

// LAND-1 · Cabecera de sección: eyebrow opcional + h2 + sub opcional.

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
  className,
}: {
  eyebrow?: string
  title: string
  sub?: string
  align?: "center" | "left"
  className?: string
}) {
  return (
    <div className={cn("max-w-[620px]", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-sage-700">
          {eyebrow}
        </div>
      )}
      <h2 className="text-balance text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[32px]">
        {title}
      </h2>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{sub}</p>}
    </div>
  )
}
