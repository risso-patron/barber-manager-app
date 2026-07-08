"use client"

// ORNO UI Framework · M2 · Shell
// PageHeader — title area INSIDE content (headers stay quiet).
// Answers "¿Dónde estoy?" + "¿Qué puedo hacer?" in one block.

import * as React from "react"

export interface PageHeaderProps {
  title: string
  /** One human line of context — why this screen matters today. */
  subtitle?: string
  /** Right-aligned actions (Buttons). */
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-ink-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  )
}
