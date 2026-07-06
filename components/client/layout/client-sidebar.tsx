"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, CalendarPlus, CalendarDays, Clock, User, LogOut } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

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
  { href: "/client/profile",      label: "Mi perfil", icon: User },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function ClientSidebar() {
  const pathname = usePathname()
  const router = useRouter()

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

  const handleLogout = async () => {
    localStorage.removeItem("currentUser")
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
      await supabase.auth.signOut()
    }
    router.push("/auth/login")
  }

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
          Portal cliente
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#252525", margin: "0 0 12px" }} />

      {/* Nav — scrolls internally so the footer (logout) stays reachable on short viewports */}
      <nav aria-label="Navegación principal desktop" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 12px" }}>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={linkClass(active)}
              style={{ padding: "10px 16px", marginBottom: 2, display: "flex" }}
            >
              <Icon size={16} />
              <span style={{ marginLeft: 10 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: "#252525", margin: "0 12px" }} />

      {/* Logout */}
      <div style={{ padding: "12px 12px 24px" }}>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex items-center gap-2.5 rounded-lg transition-all duration-150 text-[#8A8A8A] hover:bg-[#252525] hover:text-[#E53935]"
          style={{
            width: "100%",
            padding: "10px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 13,
            textAlign: "left",
            minHeight: 44,
          }}
        >
          <LogOut size={16} />
          <span style={{ marginLeft: 10 }}>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
