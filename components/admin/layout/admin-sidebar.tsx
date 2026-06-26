"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  UserCheck,
  BarChart2,
  Settings,
  CreditCard,
  Plug,
  LogOut,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const navItems: NavItem[] = [
  { href: "/admin",               label: "Dashboard",      icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments",  label: "Citas",          icon: Calendar },
  { href: "/admin/employees",     label: "Empleados",      icon: Users },
  { href: "/admin/inventory",     label: "Inventario",     icon: Package },
  { href: "/admin/clients",       label: "Clientes",       icon: UserCheck },
  { href: "/admin/reports",       label: "Reportes",       icon: BarChart2 },
  { href: "/admin/billing",       label: "Facturación",    icon: CreditCard },
  { href: "/admin/integrations",  label: "Integraciones",  icon: Plug },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

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
        <Link href="/admin" style={{ textDecoration: "none" }}>
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
          Gestión de Salones
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

      {/* Divider + Settings + Logout */}
      <div style={{ padding: "0 12px 24px" }}>
        <div style={{ height: 1, background: "#252525", margin: "0 8px 12px" }} />
        <Link
          href="/admin/settings"
          className={linkClass(isActive("/admin/settings"))}
          style={{
            padding: "12px 20px",
            background: isActive("/admin/settings") ? "rgba(229,57,53,0.12)" : undefined,
            fontFamily: "var(--font-dm-sans), sans-serif",
          }}
        >
          {isActive("/admin/settings") && (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#E53935",
                position: "absolute",
                left: 8,
              }}
            />
          )}
          <Settings size={16} />
          <span>Configuración</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "12px 20px",
            marginTop: 2,
            background: "transparent",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            color: "#8A8A8A",
            fontSize: 13,
            fontFamily: "var(--font-dm-sans), sans-serif",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#252525"
            ;(e.currentTarget as HTMLButtonElement).style.color = "#E53935"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent"
            ;(e.currentTarget as HTMLButtonElement).style.color = "#8A8A8A"
          }}
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}