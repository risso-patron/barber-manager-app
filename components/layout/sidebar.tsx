"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Package, BarChart3, Settings, LogOut, Menu, Clock, Scissors, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  userRole: "client" | "employee" | "admin"
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user, setUser } = useAppStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/auth/login")
  }

  const getMenuItems = () => {
    const baseItems = [{ href: "/dashboard", label: "Dashboard", icon: BarChart3 }]

    switch (userRole) {
      case "client":
        return [
          ...baseItems,
          { href: "/client/appointments", label: "Mis Citas", icon: Calendar },
          { href: "/client/book", label: "Reservar Cita", icon: Scissors },
          { href: "/client/history", label: "Historial", icon: Clock },
        ]
      case "employee":
        return [
          ...baseItems,
          { href: "/employee/schedule", label: "Mi Agenda", icon: Calendar },
          { href: "/employee/time-tracking", label: "Control Horario", icon: Clock },
          { href: "/employee/stats", label: "Estadísticas", icon: BarChart3 },
        ]
      case "admin":
        return [
          ...baseItems,
          { href: "/admin/appointments", label: "Citas", icon: Calendar },
          { href: "/admin/employees", label: "Empleados", icon: Users },
          { href: "/admin/inventory", label: "Inventario", icon: Package },
          { href: "/admin/reports", label: "Reportes", icon: BarChart3 },
          { href: "/admin/settings", label: "Configuración", icon: Settings },
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()

  return (
    <div
      className={cn(
        "bg-slate-900 text-white h-screen flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h1 className="text-xl font-bold">Barber Manager</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{userRole}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white",
            isCollapsed && "justify-center",
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  )
}
