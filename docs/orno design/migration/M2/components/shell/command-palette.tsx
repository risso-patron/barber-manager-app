"use client"

// ORNO UI Framework · M2 · Shell
// Command palette (⌘K / Ctrl+K). Actions first — it's an operational
// launcher, not just search. Data sources are injected; the shell owns
// only presentation and keyboard behavior.

import * as React from "react"
import { Search } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export interface PaletteEntry {
  key: string
  label: string
  hint?: string
  icon?: LucideIcon
  section: "actions" | "nav" | "clients"
  onSelect: () => void
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: PaletteEntry[]
  /** Async client search — called as the user types. */
  onQuery?: (q: string) => void
  placeholder?: string
}

const SECTION_LABEL = { actions: "Acciones", nav: "Ir a", clients: "Clientes" } as const

export function CommandPalette({ open, onOpenChange, entries, onQuery, placeholder = "Buscar clientes, acciones, pantallas…" }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("")
  const [activeIdx, setActiveIdx] = React.useState(0)

  const filtered = React.useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter((e) => e.label.toLowerCase().includes(q) || e.hint?.toLowerCase().includes(q))
  }, [entries, query])

  React.useEffect(() => setActiveIdx(0), [query, open])
  React.useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const sections = (["actions", "nav", "clients"] as const)
    .map((s) => ({ key: s, items: filtered.filter((e) => e.section === s) }))
    .filter((s) => s.items.length > 0)
  const flat = sections.flatMap((s) => s.items)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && flat[activeIdx]) {
      e.preventDefault()
      flat[activeIdx].onSelect()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[18vh] max-w-[600px] translate-y-0 gap-0 p-0 [&>button]:hidden"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement)?.querySelector("input")?.focus()
        }}
      >
        <DialogTitle className="sr-only">Buscar y ejecutar acciones</DialogTitle>
        <div className="flex items-center gap-3 border-b border-secondary px-5 py-4">
          <Search className="size-[19px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={flat[activeIdx] ? `palette-${flat[activeIdx].key}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              onQuery?.(e.target.value)
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="flex h-6 items-center rounded-md border border-border bg-background px-2 text-xs font-semibold text-muted-foreground">
            esc
          </kbd>
        </div>
        <div id="palette-list" role="listbox" className="max-h-[420px] overflow-y-auto p-2.5">
          {flat.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para «{query}». Prueba con otro nombre.
            </p>
          )}
          {sections.map((section) => (
            <React.Fragment key={section.key}>
              <div className="px-3.5 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {SECTION_LABEL[section.key]}
              </div>
              {section.items.map((entry) => {
                const idx = flat.indexOf(entry)
                const active = idx === activeIdx
                return (
                  <button
                    key={entry.key}
                    id={`palette-${entry.key}`}
                    role="option"
                    aria-selected={active}
                    type="button"
                    onClick={() => {
                      entry.onSelect()
                      onOpenChange(false)
                    }}
                    onMouseMove={() => setActiveIdx(idx)}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-[14.5px] transition-colors duration-micro",
                      active ? "bg-accent font-semibold text-accent-foreground" : "font-medium text-foreground"
                    )}
                  >
                    {entry.icon && (
                      <span
                        className={cn(
                          "flex size-[34px] shrink-0 items-center justify-center rounded-[11px]",
                          active ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-600"
                        )}
                      >
                        <entry.icon size={17} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {entry.label}
                      {entry.hint && <span className="ml-1.5 font-normal text-muted-foreground">· {entry.hint}</span>}
                    </span>
                  </button>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
