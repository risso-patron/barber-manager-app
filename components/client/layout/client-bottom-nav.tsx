"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarPlus, CalendarDays, Clock, User } from "lucide-react"

const bottomItems = [
  { href: "/client",              label: "Inicio",    icon: Home,         exact: true },
  { href: "/client/book",         label: "Reservar",  icon: CalendarPlus },
  { href: "/client/appointments", label: "Citas",     icon: CalendarDays },
  { href: "/client/history",      label: "Historial", icon: Clock },
  { href: "/client/profile",      label: "Perfil",    icon: User },
]

export function ClientBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Navegación principal mobile"
      className="lg:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1A1A1A",
        borderTop: "1px solid #2E2E2E",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 4px",
        zIndex: 20,
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {bottomItems.map((item) => {
        const active = isActive(item.href, item.exact)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 8px",
              borderRadius: 8,
              minHeight: 44,
              flex: 1,
              textDecoration: "none",
              color: active ? "#E53935" : "#8A8A8A",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 10,
              transition: "color 0.15s",
            }}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
