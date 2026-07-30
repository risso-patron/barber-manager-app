"use client"

// ORNO UI Framework · M2 · Shell
// Header — the action strip. 64px, sticky, translucent. Holds what the
// operator might need RIGHT NOW: search/palette, create, notifications.
// Page titles do NOT live here (they belong to PageHeader in content).

import * as React from "react"
import { PanelLeft, Plus, Bell, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface HeaderProps {
  /** Short context label (current section), shown left. */
  contextLabel?: string
  onToggleSidebar?: () => void
  onOpenPalette?: () => void
  onCreate?: () => void
  createLabel?: string
  notificationCount?: number
  onOpenNotifications?: () => void
  /** Extra slot (e.g. shop status pill). */
  children?: React.ReactNode
}

export function Header({
  contextLabel,
  onToggleSidebar,
  onOpenPalette,
  onCreate,
  createLabel = "Nuevo",
  notificationCount = 0,
  onOpenNotifications,
  children,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur-md">
      {onToggleSidebar && (
        <Button variant="ghost" size="icon-md" onClick={onToggleSidebar} aria-label="Contraer menú" className="max-lg:hidden">
          <PanelLeft aria-hidden="true" />
        </Button>
      )}
      {contextLabel && <span className="text-sm font-semibold text-foreground">{contextLabel}</span>}
      {children}
      <div className="flex-1" />

      {onOpenPalette && (
        <button
          type="button"
          onClick={onOpenPalette}
          className={cn(
            "flex h-[42px] w-[300px] items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 text-left transition-all duration-micro ease-orno",
            "hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "max-md:w-[42px] max-md:justify-center max-md:px-0"
          )}
        >
          <Search className="size-[17px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-sm text-muted-foreground max-md:hidden">Buscar o ir a…</span>
          <kbd className="flex h-[22px] items-center gap-1 rounded-md border border-border bg-background px-1.5 text-xs font-semibold text-muted-foreground max-md:hidden">
            ⌘K
          </kbd>
        </button>
      )}

      {onCreate && (
        <Button size="md" onClick={onCreate}>
          <Plus aria-hidden="true" />
          <span className="max-sm:hidden">{createLabel}</span>
        </Button>
      )}

      {onOpenNotifications && (
        <Button
          variant="secondary"
          size="icon-md"
          onClick={onOpenNotifications}
          aria-label={notificationCount > 0 ? `Notificaciones, ${notificationCount} sin leer` : "Notificaciones"}
          className="relative"
        >
          <Bell aria-hidden="true" />
          {notificationCount > 0 && (
            <span aria-hidden="true" className="absolute right-2.5 top-2 size-2 rounded-full border-2 border-card bg-terracotta" />
          )}
        </Button>
      )}
    </header>
  )
}
