"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarPlus, CalendarDays, Clock } from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: "/client",              label: "Inicio",    icon: Home,         exact: true },
  { href: "/client/book",         label: "Reservar",  icon: CalendarPlus },
  { href: "/client/appointments", label: "Mis citas", icon: CalendarDays },
  { href: "/client/history",      label: "Historial", icon: Clock },
]

export function ClientSidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
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
      className="hidden lg:flex flex-col"
      style={{
        width: 240,
        minWidth: 240,
        background: "#161616",
        borderRight: "1px solid #252525",
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
        <Link href="/client" style={{ textDecoration: "none" }}>
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
          Mi cuenta
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#252525", margin: "0 0 12px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(active)}
              style={{ padding: "10px 16px", marginBottom: 2, display: "flex" }}
            >
              <Icon size={16} />
              <span style={{ marginLeft: 10 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
