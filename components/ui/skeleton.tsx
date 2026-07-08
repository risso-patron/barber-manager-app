import { cn } from "@/lib/utils"

// ORNO UI Framework · M3 · Feedback
// Skeleton + shaped presets. Rule: skeletons mirror the real content's
// shape and only appear after 300ms (use <Delayed>).

import * as React from "react"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-secondary", className)} {...props} />
}

/** Avatar + two lines — client lists, team lists, activity. */
function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3.5 py-3", className)} aria-hidden="true">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-3.5 w-3/5 rounded-md" />
        <Skeleton className="h-3 w-2/5 rounded-md" />
      </div>
    </div>
  )
}

/** List of rows — default 4. */
function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

/** Table shape: header band + airy rows. */
function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-border bg-card", className)} role="status" aria-label="Cargando tabla">
      <div className="border-b border-border bg-background px-7 py-4">
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-secondary px-7 py-4 last:border-0">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 flex-1 rounded-md" />
          <Skeleton className="h-3.5 w-24 rounded-md max-md:hidden" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

/** Stat card shape. */
function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-border bg-card p-6", className)} aria-hidden="true">
      <Skeleton className="mb-3 h-3 w-2/5 rounded-md" />
      <Skeleton className="h-7 w-3/5 rounded-md" />
    </div>
  )
}

/** Renders children only after `ms` — spinnerless perception for fast loads. */
function Delayed({ ms = 300, children }: { ms?: number; children: React.ReactNode }) {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return show ? <>{children}</> : null
}

export { Skeleton, SkeletonRow, SkeletonList, SkeletonTable, SkeletonStat, Delayed }
