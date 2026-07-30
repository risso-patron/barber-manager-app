"use client"

// ORNO UI Framework · M2 · Shell
// AppShell — the permanent workspace. One component, all roles.
// Composes Sidebar + Header + BottomNav + CommandPalette around the page.
// Pages need ZERO layout code: <AppShell role="admin">{page}</AppShell>.
//
// Responsive behavior (Constitution / Phase 3 spec):
//   ≥1280  full sidebar, collapsible to 76px rail (preference persisted)
//   1024–1279  rail by default
//   <1024  no sidebar; BottomNav + FAB

import * as React from "react"
import { useRouter } from "next/navigation"

import { Sidebar } from "@/components/shell/sidebar"
import { Header } from "@/components/shell/header"
import { BottomNav } from "@/components/shell/bottom-nav"
import { CommandPalette, type PaletteEntry } from "@/components/shell/command-palette"
import { NAV_BY_ROLE, type ShellRole } from "@/components/shell/navigation"

const COLLAPSE_KEY = "orno:sidebar-collapsed"

export interface AppShellProps {
  role: ShellRole
  children: React.ReactNode
  shopName?: string
  shopMeta?: string
  /** Header context label — defaults to the active nav item's label. */
  contextLabel?: string
  notificationCount?: number
  onOpenNotifications?: () => void
  /** Live sidebar badges (e.g. { attention: 3 }). */
  badges?: Record<string, number>
  /** Extra palette entries (clients, etc.) merged with nav + create actions. */
  paletteEntries?: PaletteEntry[]
  onPaletteQuery?: (q: string) => void
  /** Handle a create action chosen from header/FAB (key from navigation.ts). */
  onCreateAction?: (key: string) => void
  /** User block for the sidebar footer (UserMenu). */
  userSlot?: React.ReactNode
  /** Slot next to the context label (e.g. business status pill). */
  headerExtra?: React.ReactNode
}

export function AppShell({
  role,
  children,
  shopName,
  shopMeta,
  contextLabel,
  notificationCount,
  onOpenNotifications,
  badges,
  paletteEntries = [],
  onPaletteQuery,
  onCreateAction,
  userSlot,
  headerExtra,
}: AppShellProps) {
  const nav = NAV_BY_ROLE[role]
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  // Restore + persist collapse preference; auto-rail on tablet.
  React.useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY)
    if (saved !== null) setCollapsed(saved === "1")
    else if (window.innerWidth < 1280) setCollapsed(true)
  }, [])
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1")
      return !c
    })
  }

  // ⌘K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Palette = create actions + navigation + injected entries.
  const entries = React.useMemo<PaletteEntry[]>(
    () => [
      ...nav.createActions.map((a) => ({
        key: `create-${a.key}`,
        label: a.label,
        icon: a.icon,
        section: "actions" as const,
        onSelect: () => (a.href ? router.push(a.href) : onCreateAction?.(a.key)),
      })),
      ...nav.sections.flatMap((s) =>
        s.items.map((item) => ({
          key: `nav-${item.key}`,
          label: item.label,
          icon: item.icon,
          section: "nav" as const,
          onSelect: () => router.push(item.href),
        }))
      ),
      ...paletteEntries,
    ],
    [nav, paletteEntries, router, onCreateAction]
  )

  const primaryCreate = nav.createActions[0]

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="max-lg:hidden">
        <Sidebar
          nav={nav}
          collapsed={collapsed}
          shopName={shopName}
          shopMeta={shopMeta}
          badges={badges}
          footer={userSlot}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          contextLabel={contextLabel}
          onToggleSidebar={toggleCollapsed}
          onOpenPalette={() => setPaletteOpen(true)}
          onCreate={
            primaryCreate
              ? () => (primaryCreate.href ? router.push(primaryCreate.href) : onCreateAction?.(primaryCreate.key))
              : undefined
          }
          createLabel={primaryCreate?.label.split(" ")[0] === "Nueva" ? "Nuevo" : primaryCreate?.label}
          notificationCount={notificationCount}
          onOpenNotifications={onOpenNotifications}
        >
          {headerExtra}
        </Header>

        {/* Content container: 1200px centered, 40px padding (24 mobile).
            Full-bleed pages (Agenda) opt out with data-shell="full". */}
        <main className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0" data-shell-scroll>
          {children}
        </main>
      </div>

      <BottomNav
        nav={nav}
        onCreate={
          primaryCreate
            ? () => (primaryCreate.href ? router.push(primaryCreate.href) : onCreateAction?.(primaryCreate.key))
            : undefined
        }
        onMore={() => setPaletteOpen(true)}
      />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} entries={entries} onQuery={onPaletteQuery} />
    </div>
  )
}

/** Standard content container for pages. Full-bleed pages (Agenda) skip it. */
export function ShellContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-10 ${className ?? ""}`}>{children}</div>
}
