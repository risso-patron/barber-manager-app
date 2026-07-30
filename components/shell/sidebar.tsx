"use client"

// ORNO UI Framework · M2 · Shell
// THE sidebar. Replaces admin-sidebar, employee-sidebar, client-sidebar and
// legacy layout/sidebar. Role differences live in navigation.ts manifests.
// Zero brand hex — everything is semantic tokens + BrandProvider.

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { AppIcon } from "@/components/ui/foundations/app-icon"
import { useBrand } from "@/components/shell/brand-provider"
import type { RoleNav } from "@/components/shell/navigation"

export interface SidebarProps {
  nav: RoleNav
  collapsed: boolean
  /** Shop name shown in the selector (single-location: just identity). */
  shopName?: string
  shopMeta?: string
  onShopClick?: () => void
  /** Slot for the user block pinned at the bottom (UserMenu). */
  footer?: React.ReactNode
  /** Live badge counts resolved by the app (e.g. { attention: 3 }). */
  badges?: Record<string, number>
}

export function Sidebar({ nav, collapsed, shopName, shopMeta, onShopClick, footer, badges }: SidebarProps) {
  const pathname = usePathname()
  const brand = useBrand()

  const isActive = (href: string) =>
    href === nav.home ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar transition-[width] duration-enter ease-orno",
        collapsed ? "w-[76px]" : "w-[264px]"
      )}
    >
      {/* Shop / brand block */}
      <div className="p-3 pb-1">
        <button
          type="button"
          onClick={onShopClick}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors duration-micro hover:bg-border/40",
            collapsed && "justify-center"
          )}
        >
          <AppIcon size={36} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-semibold text-foreground">
                {shopName ?? brand.name}
              </span>
              {shopMeta && <span className="block truncate text-xs text-muted-foreground">{shopMeta}</span>}
            </span>
          )}
        </button>
      </div>

      {/* Navigation — operational order from the manifest */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label="Principal">
        {nav.sections.map((section, i) => (
          <React.Fragment key={section.key}>
            {i > 0 &&
              (section.label && !collapsed ? (
                <div className="px-3.5 pb-2 pt-5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </div>
              ) : (
                <div className="mx-2.5 my-3 h-px bg-border" role="separator" />
              ))}
            {section.items.map((item) => {
              const active = isActive(item.href)
              const count = item.badge ? badges?.[item.badge] : undefined
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] transition-colors duration-micro ease-orno",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                      : "font-medium text-sidebar-foreground hover:bg-border/40 hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon size={19} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && typeof count === "number" && count > 0 && (
                    <span className="nums ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-card px-1.5 text-xs font-semibold text-sidebar-foreground">
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* User block */}
      {footer && <div className="border-t border-border p-3">{footer}</div>}
    </aside>
  )
}
