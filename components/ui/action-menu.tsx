"use client"

// ORNO UI Framework · ActionMenu
// EL menú de acciones por fila — único en todo el sistema (ADR-023: sin
// dropdowns artesanales, sin variantes locales por módulo).
//
// Genérico por contrato: recibe acciones y no conoce ningún dominio
// (citas, clientes, POS…). El componente es dueño de accesibilidad,
// navegación por teclado, focus management, click-outside, posicionamiento
// (Radix DropdownMenu) y tokens ORNO. El comportamiento de negocio vive
// en el consumidor, que arma los grupos de acciones.

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type ActionMenuTone = "default" | "info" | "warning" | "danger"

export interface ActionMenuAction {
  label: string
  icon?: LucideIcon
  /** Handler de la acción. Ignorado si hay `href`. */
  onSelect?: () => void
  /** Navegación: el ítem se renderiza como enlace. */
  href?: string
  /** Tono visual semántico — nunca un color de dominio. */
  tone?: ActionMenuTone
  disabled?: boolean
}

const TONE_CLS: Record<ActionMenuTone, string> = {
  default: "text-foreground focus:bg-secondary",
  info: "text-dustyblue-text focus:bg-dustyblue-tint",
  warning: "text-warning-text focus:bg-warning-tint",
  danger: "text-danger-text focus:bg-danger-tint",
}

export interface ActionMenuProps {
  /** Etiqueta accesible del trigger: "Acciones de la cita". */
  label: string
  /** Grupos de acciones; entre grupos se dibuja un separador. */
  groups: ActionMenuAction[][]
  align?: "start" | "end"
  /** Trigger propio (asChild). Por defecto: botón ghost con ⋮. */
  children?: React.ReactNode
  className?: string
}

export function ActionMenu({ label, groups, align = "end", children, className }: ActionMenuProps) {
  const visibleGroups = groups.filter((g) => g.length > 0)
  if (visibleGroups.length === 0) return null

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon-md" aria-label={label}>
            <MoreVertical aria-hidden="true" />
          </Button>
        )}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-50 min-w-[13rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-overlay",
            "animate-fade-up",
            className
          )}
        >
          {visibleGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />}
              {group.map((action) => {
                const Icon = action.icon
                const itemCls = cn(
                  "flex w-full cursor-pointer select-none items-center gap-2 px-4 py-2 text-left text-sm outline-none transition-colors duration-micro",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  TONE_CLS[action.tone ?? "default"]
                )
                return action.href ? (
                  <DropdownMenuPrimitive.Item key={action.label} asChild disabled={action.disabled}>
                    <Link href={action.href} className={itemCls}>
                      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                      {action.label}
                    </Link>
                  </DropdownMenuPrimitive.Item>
                ) : (
                  <DropdownMenuPrimitive.Item
                    key={action.label}
                    disabled={action.disabled}
                    onSelect={() => action.onSelect?.()}
                    className={itemCls}
                  >
                    {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                    {action.label}
                  </DropdownMenuPrimitive.Item>
                )
              })}
            </React.Fragment>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
