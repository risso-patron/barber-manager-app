"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  Lock,
  BarChart3,
  User,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: "/employee/dashboard", label: "Inicio",          icon: LayoutDashboard, exact: true },
  { href: "/employee/schedule",  label: "Mi agenda",       icon: CalendarCheck },
  { href: "/employee/schedule?tab=week",   label: "Calendario",    icon: Calendar },
  { href: "/employee/schedule?tab=blocks", label: "Bloqueos",      icon: Lock },
  { href: "/employee/stats",     label: "Estadísticas",    icon: BarChart3 },
  { href: "/employee/profile",   label: "Perfil",           icon: User },
]

export function EmployeeSidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    const base = href.split("?")[0]!
    if (exact) return pathname === base
    return pathname.startsWith(base)
  }

  const linkClass = (active: boolean) =>
    [
      "flex items-center gap-2.5 rounded-lg relative transition-all duration-150",
      "no-underline text-[13px]",
      active
        ? "text-[#E53935] font-medium"
        : "text-[#8A8A8A] font-normal hover:bg-[#252525] hover:text-[#F0F0F0]",
    ].join(" ")

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "#161616",
        borderRight: "1px solid #252525",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 28px 20px" }}>
        <Link href="/employee/dashboard" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "var(--font-cormorant), 'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#F0F0F0" }}>Orn</span>
            <span style={{ color: "#E53935" }}>ō</span>
          </span>
        </Link>
        <div
          style={{
            fontSize: 10,
            color: "#555555",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginTop: 2,
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          Mi espacio
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#252525", margin: "0 0 12px" }} />

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(active)}
              style={{
                padding: "12px 20px",
                background: active ? "rgba(229,57,53,0.12)" : undefined,
                marginBottom: 2,
                fontFamily: "var(--font-dm-sans), sans-serif",
              }}
            >
              {active && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#E53935",
                    position: "absolute",
                    left: 8,
                    flexShrink: 0,
                  }}
                />
              )}
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
