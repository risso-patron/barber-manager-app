"use client"

// ORNO UI Framework · M3 · Data
// DataTable — the one table for CRM, Inventory, Reports, Billing.
// Airy rows (≥64px), sticky header, sortable columns, row actions slot,
// full state machine via AsyncPane, virtualization-ready contract.
//
// Virtualization: rows render through `renderRow(item)`; when a dataset
// grows, swap the internal map for a windowed list (fixed rowHeight prop
// already in the API) without touching any consumer.

import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { AsyncPane, type PaneState } from "@/components/ui/async-pane"
import { SkeletonTable } from "@/components/ui/skeleton"

export interface DataColumn<T> {
  key: string
  header: string
  /** Cell renderer. */
  cell: (item: T) => React.ReactNode
  /** Enables client-side sort with this accessor. */
  sortValue?: (item: T) => string | number
  /** Column width (CSS grid track). Default "1fr". */
  width?: string
  align?: "left" | "right"
  /** Hide below this breakpoint. */
  hideBelow?: "md" | "lg"
  /** Numbers get tabular figures automatically. */
  numeric?: boolean
}

export interface DataTableProps<T> {
  columns: Array<DataColumn<T>>
  items: T[]
  rowKey: (item: T) => string
  state?: PaneState
  empty: React.ReactNode
  errorProps?: { title?: string; description?: string; onRetry?: () => void }
  deniedSubject?: string
  onRowClick?: (item: T) => void
  /** Right-aligned actions cell (kept out of row click). */
  rowActions?: (item: T) => React.ReactNode
  /** Fixed row height in px — the future virtualization contract. Default 64. */
  rowHeight?: number
  "aria-label": string
  className?: string
}

export function DataTable<T>({
  columns,
  items,
  rowKey,
  state = "success",
  empty,
  errorProps,
  deniedSubject,
  onRowClick,
  rowActions,
  rowHeight = 64,
  className,
  ...aria
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null)

  const sorted = React.useMemo(() => {
    if (!sort) return items
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return items
    return [...items].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir
    })
  }, [items, sort, columns])

  const tracks = [...columns.map((c) => c.width ?? "1fr"), ...(rowActions ? ["max-content"] : [])].join(" ")
  const hideCls = { md: "max-md:hidden", lg: "max-lg:hidden" }

  return (
    <div className={cn("overflow-hidden rounded-card border border-border bg-card", className)}>
      <AsyncPane
        state={state}
        skeleton={<SkeletonTable className="border-0" />}
        empty={empty}
        error={errorProps}
        deniedSubject={deniedSubject}
        size="compact"
      >
        <div role="table" {...aria}>
          {/* Header */}
          <div
            role="row"
            className="sticky top-0 z-10 grid items-center gap-4 border-b border-border bg-background px-7 py-3.5"
            style={{ gridTemplateColumns: tracks }}
          >
            {columns.map((col) => {
              const active = sort?.key === col.key
              const sortable = !!col.sortValue
              return (
                <button
                  key={col.key}
                  role="columnheader"
                  aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : undefined}
                  type="button"
                  disabled={!sortable}
                  onClick={() =>
                    sortable &&
                    setSort((s) => (s?.key === col.key ? (s.dir === 1 ? { key: col.key, dir: -1 } : null) : { key: col.key, dir: 1 }))
                  }
                  className={cn(
                    "flex items-center gap-1 text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground",
                    col.align === "right" && "justify-end",
                    col.hideBelow && hideCls[col.hideBelow],
                    sortable && "cursor-pointer hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  )}
                >
                  {col.header}
                  {active && (sort!.dir === 1 ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                </button>
              )
            })}
            {rowActions && <span aria-hidden="true" />}
          </div>

          {/* Rows */}
          {sorted.map((item) => (
            <div
              key={rowKey(item)}
              role="row"
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                  e.preventDefault()
                  onRowClick(item)
                }
              }}
              className={cn(
                "grid items-center gap-4 border-b border-secondary px-7 last:border-0",
                onRowClick &&
                  "cursor-pointer transition-colors duration-micro hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              )}
              style={{ gridTemplateColumns: tracks, minHeight: rowHeight }}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  role="cell"
                  className={cn(
                    "min-w-0 text-[14.5px] text-foreground",
                    col.numeric && "nums",
                    col.align === "right" && "text-right",
                    col.hideBelow && hideCls[col.hideBelow]
                  )}
                >
                  {col.cell(item)}
                </div>
              ))}
              {rowActions && (
                <div role="cell" className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  {rowActions(item)}
                </div>
              )}
            </div>
          ))}
        </div>
      </AsyncPane>
    </div>
  )
}
