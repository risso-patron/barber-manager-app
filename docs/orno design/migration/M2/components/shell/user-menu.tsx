"use client"

// ORNO UI Framework · M2 · Shell
// UserMenu — sidebar footer block: avatar, name, role; opens a popover with
// profile / preferences / theme (light active, dark promised) / sign out.
// Auth actions are injected — the shell never talks to Supabase.

import * as React from "react"
import { UserRound, SlidersHorizontal, LogOut, SunMedium } from "lucide-react"

import { cn } from "@/lib/utils"

export interface UserMenuProps {
  name: string
  roleLabel: string
  email?: string
  initials?: string
  collapsed?: boolean
  onProfile?: () => void
  onPreferences?: () => void
  onSignOut: () => void
}

export function UserMenu({ name, roleLabel, email, initials, collapsed, onProfile, onPreferences, onSignOut }: UserMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onEsc)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onEsc)
    }
  }, [open])

  const ini =
    initials ??
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-micro hover:bg-border/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed && "justify-center"
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-terracotta-tint text-sm font-semibold text-terracotta-text">
          {ini}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-[260px] animate-fade-up rounded-2xl border border-border bg-card p-2 shadow-overlay"
        >
          <div className="border-b border-secondary px-3 pb-3 pt-2">
            <p className="text-[14.5px] font-semibold text-foreground">{name}</p>
            {email && <p className="truncate text-[13px] text-muted-foreground">{email}</p>}
          </div>
          <div className="pt-1.5">
            {onProfile && <MenuItem icon={UserRound} label="Mi perfil" onClick={() => { setOpen(false); onProfile() }} />}
            {onPreferences && (
              <MenuItem icon={SlidersHorizontal} label="Preferencias" onClick={() => { setOpen(false); onPreferences() }} />
            )}
            <div role="presentation" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground">
              <SunMedium size={17} strokeWidth={1.75} className="text-ink-600" aria-hidden="true" />
              Tema
              <span className="ml-auto inline-flex gap-0.5 rounded-full bg-secondary p-[3px]">
                <span className="flex h-[26px] items-center rounded-full bg-card px-3 text-xs font-semibold shadow-raised">Claro</span>
                <span
                  className="flex h-[26px] cursor-not-allowed items-center rounded-full px-3 text-xs font-medium text-ink-300"
                  title="Disponible próximamente"
                >
                  Oscuro
                </span>
              </span>
            </div>
            <div className="mx-1 my-1 h-px bg-secondary" role="separator" />
            <MenuItem icon={LogOut} label="Cerrar sesión" destructive onClick={() => { setOpen(false); onSignOut() }} />
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-micro",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        destructive ? "text-danger-text hover:bg-danger-tint" : "text-foreground hover:bg-secondary"
      )}
    >
      <Icon size={17} strokeWidth={1.75} className={destructive ? undefined : "text-ink-600"} aria-hidden="true" />
      {label}
    </button>
  )
}
