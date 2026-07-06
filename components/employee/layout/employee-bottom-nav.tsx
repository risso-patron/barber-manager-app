"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, CalendarCheck, Calendar, BarChart3, User, LogOut } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const bottomItems = [
  { href: "/employee/dashboard", label: "Inicio",   icon: LayoutDashboard, exact: true },
  { href: "/employee/schedule",  label: "Agenda",   icon: CalendarCheck },
  { href: "/employee/schedule?tab=week", label: "Semana", icon: Calendar },
  { href: "/employee/stats",     label: "Stats",    icon: BarChart3 },
  { href: "/employee/profile",   label: "Perfil",   icon: User },
]

export function EmployeeBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

  const handleLogout = async () => {
    localStorage.removeItem("currentUser")
    if (supabase) await supabase.auth.signOut()
    router.push("/")
  }

  const isActive = (href: string, exact?: boolean) => {
    const base = href.split("?")[0]!
    if (exact) return pathname === base
    return pathname.startsWith(base)
  }

  return (
    <nav
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
      <button
        onClick={handleLogout}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: "6px 8px",
          borderRadius: 8,
          minHeight: 44,
          flex: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#8A8A8A",
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: 10,
        }}
      >
        <LogOut size={20} />
        <span>Cerrar sesión</span>
      </button>
    </nav>
  )
}
