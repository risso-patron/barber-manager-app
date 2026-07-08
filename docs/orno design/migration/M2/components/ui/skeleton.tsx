import { cn } from "@/lib/utils"

// ORNO UI Framework · M2 (needed by layouts; full Skeleton presets arrive in M3)

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-secondary", className)} {...props} />
}

export { Skeleton }
