"use client"

// ORNO UI Framework · M2 · Shell
// THE mobile bottom bar. Replaces employee-bottom-nav and client-bottom-nav.
// 2 items + center create + 1 item + "Más". Thumb-first, ≥44px targets.

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import type { NavItem, RoleNav } from "@/components/shell/navigation"

export interface BottomNavProps {
  nav: RoleNav
  onCreate?: () => void
  onMore?: () => void
}

export function BottomNav({ nav, onCreate, onMore }: BottomNavProps) {
  const pathname = usePathname()
  const [a, b, c] = nav.mobile.primary
  const isActive = (href: string) =>
    href === nav.home ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  const Item = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-colors duration-micro",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "font-semibold text-accent-foreground" : "font-medium text-muted-foreground"
        )}
      >
        <item.icon size={21} strokeWidth={1.75} aria-hidden="true" />
        {item.label}
      </Link>
    )
  }

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 lg:hidden"
    >
      {a ? <Item item={a} /> : <span />}
      {b ? <Item item={b} /> : <span />}
      <div className="flex items-start justify-center">
        <button
          type="button"
          onClick={onCreate}
          aria-label="Crear"
          className="-mt-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-overlay transition-transform duration-micro active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-[22px]" aria-hidden="true" />
        </button>
      </div>
      {c ? <Item item={c} /> : <span />}
      <button
        type="button"
        onClick={onMore}
        className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Menu size={21} strokeWidth={1.75} aria-hidden="true" />
        Más
      </button>
    </nav>
  )
}
