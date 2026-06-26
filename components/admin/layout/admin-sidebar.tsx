"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  UserCheck,
  BarChart2,
  Settings,
  Scissors,
  ShoppingCart,
  X,
} from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  exact?: boolean
}

const navItems: NavItem[] = [
  { href: "/admin",              label: "Dashboard",      icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Citas",          icon: Calendar },
  { href: "/admin/employees",    label: "Empleados",      icon: Users },
  { href: "/admin/services",     label: "Servicios",      icon: Scissors },
  { href: "/admin/inventory",    label: "Inventario",     icon: Package },
  { href: "/admin/pos",          label: "Punto de Venta", icon: ShoppingCart },
  { href: "/admin/clients",      label: "Clientes",       icon: UserCheck },
  { href: "/admin/reports",      label: "Reportes",       icon: BarChart2 },
]

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      // Move focus to close button when drawer opens
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Close drawer on route change (mobile)
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const sidebarContent = (
    <aside
      id="admin-sidebar"
      aria-label="Navegación principal"
      style={{
        width: 240,
        minWidth: 240,
        background: "#161616",
        borderRight: "1px solid #252525",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo + close button (close only visible on mobile) */}
      <div style={{ padding: "28px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
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
        </Link>

        {/* Close button — only visible on mobile via CSS */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="orno-sidebar-close"
          style={{
            background: "none",
            border: "none",
            color: "#8A8A8A",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#252525", margin: "0 0 12px" }} />

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 12px" }} aria-label="Módulos">
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

      {/* Divider + Settings */}
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
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Desktop: fixed sidebar ─────────────────────────────── */}
      <div className="orno-sidebar-desktop">
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          {sidebarContent}
        </div>
      </div>

      {/* ── Mobile: overlay + drawer ───────────────────────────── */}
      {isOpen && (
        <div className="orno-sidebar-mobile-overlay" aria-hidden="true" onClick={onClose} />
      )}
      <div
        className={`orno-sidebar-mobile-drawer${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {sidebarContent}
      </div>

      <style>{`
        /* ── Desktop ≥1024px ── */
        @media (min-width: 1024px) {
          .orno-sidebar-desktop { display: block; }
          .orno-sidebar-mobile-drawer { display: none; }
          .orno-sidebar-mobile-overlay { display: none; }
          .orno-sidebar-close { display: none !important; }
        }

        /* ── Mobile <1024px ── */
        @media (max-width: 1023px) {
          .orno-sidebar-desktop { display: none; }
          .orno-sidebar-close { display: flex !important; }

          .orno-sidebar-mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.65);
            z-index: 40;
          }

          .orno-sidebar-mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            overflow-y: auto;
          }

          .orno-sidebar-mobile-drawer.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
