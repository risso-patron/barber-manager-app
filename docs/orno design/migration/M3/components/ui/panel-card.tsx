"use client"

// ORNO UI Framework · M3 · Data
// PanelCard — Card + standard action slots. The composition unit for every
// module surface (Tu día panels, CRM record sections, POS summaries…).
// header action · footer action · full state machine via AsyncPane.

import * as React from "react"

import { cn } from "@/lib/utils"
import { AsyncPane, type PaneState } from "@/components/ui/async-pane"

export interface PanelCardProps {
  title: string
  /** Quiet count/status next to the title (Badge, number…). */
  titleAccessory?: React.ReactNode
  /** Right side of the header (Button size sm/md, link…). */
  action?: React.ReactNode
  /** Optional footer slot (e.g. "Ver todas"). */
  footer?: React.ReactNode
  /** Content state — defaults to success for static panels. */
  state?: PaneState
  skeleton?: React.ReactNode
  empty?: React.ReactNode
  errorProps?: { title?: string; description?: string; onRetry?: () => void }
  deniedSubject?: string
  /** Remove content padding (tables, lists that manage their own). */
  flush?: boolean
  children: React.ReactNode
  className?: string
}

export function PanelCard({
  title,
  titleAccessory,
  action,
  footer,
  state = "success",
  skeleton,
  empty,
  errorProps,
  deniedSubject,
  flush = false,
  children,
  className,
}: PanelCardProps) {
  return (
    <section className={cn("rounded-card border border-border bg-card", className)} aria-label={title}>
      <header className="flex items-center justify-between gap-4 px-7 pb-0 pt-6">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-foreground">
          {title}
          {titleAccessory}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn(flush ? "pt-4" : "p-7 pt-4")}>
        <AsyncPane
          state={state}
          skeleton={skeleton ?? null}
          empty={empty ?? null}
          error={errorProps}
          deniedSubject={deniedSubject}
          size="compact"
        >
          {children}
        </AsyncPane>
      </div>
      {footer && <footer className="border-t border-secondary px-7 py-4">{footer}</footer>}
    </section>
  )
}
