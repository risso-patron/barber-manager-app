"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Package, BarChart3, Settings, LogOut, Menu, Clock, Scissors, User, Share2, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  userRole: "client" | "employee" | "admin" | "manager"
  userName?: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Auto-collapse en mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768
      setIsMobile(isMobileDevice)
      setIsCollapsed(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
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
          { href: "/employee/profile", label: "Mi Perfil", icon: User },
        ]
      case "admin":
        return [
          ...baseItems,
          { href: "/admin/appointments", label: "Citas", icon: Calendar },
          { href: "/admin/employees", label: "Empleados", icon: Users },
          { href: "/admin/services", label: "Servicios", icon: Scissors },
          { href: "/admin/inventory", label: "Inventario", icon: Package },
          { href: "/admin/pos", label: "Punto de Venta", icon: ShoppingCart },
          { href: "/admin/reports", label: "Reportes", icon: BarChart3 },
          { href: "/admin/share", label: "Compartir", icon: Share2 },
          { href: "/admin/settings", label: "Configuración", icon: Settings },
        ]
      case "manager":
        return [
          ...baseItems,
          { href: "/admin/appointments", label: "Citas", icon: Calendar },
          { href: "/admin/inventory", label: "Inventario", icon: Package },
          { href: "/admin/clients", label: "Clientes", icon: Users },
          { href: "/admin/pos", label: "Punto de Venta", icon: ShoppingCart },
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()

  return (
    <div
      className={cn(
        "bg-[#0E0E0E] text-[#F0F0F0] h-screen flex flex-col transition-all duration-300 border-r border-[#252525]",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#252525]">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Image 
              src="/orno_logo.svg" 
              alt="Ornō" 
              width={112} 
              height={28}
              priority
            />
          )}
          {isCollapsed && (
            <div className="text-[#E53935] font-bold text-lg mx-auto">Ō</div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#F0F0F0] hover:bg-[#161616]"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[#252525]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#252525] rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-[#8A8A8A]" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium text-[#F0F0F0]">{userName || "Usuario"}</p>
              <p className="text-xs text-[#8A8A8A] capitalize">{userRole}</p>
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
                    isActive 
                      ? "bg-[#E53935] text-[#F0F0F0]" 
                      : "text-[#8A8A8A] hover:bg-[#161616] hover:text-[#F0F0F0]",
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#252525]">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-[#8A8A8A] hover:bg-[#161616] hover:text-[#F0F0F0]",
            isCollapsed && "justify-center",
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3 text-sm">Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  )
}