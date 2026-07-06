"use client"

import { useState, useCallback } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar"
import { Menu } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useRequireAuth(["admin"])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  if (!user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0F0F0F",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid #2E2E2E",
              borderTopColor: "#E53935",
              animation: "orno-spin 0.8s linear infinite",
              margin: "0 auto",
            }}
          />
          <p
            style={{
              marginTop: 16,
              fontFamily: "var(--font-dm-sans), sans-serif",
              color: "#8A8A8A",
              fontSize: 13,
            }}
          >
            Verificando permisos...
          </p>
        </div>
        <style>{`@keyframes orno-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      data-theme="orno-admin"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0F0F0F",
        color: "#F0F0F0",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="orno-admin-body">
        {/* ── Mobile header ─────────────────────────────────────── */}
        <header className="orno-mobile-header" aria-label="Cabecera de administración">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="orno-hamburger"
          >
            <Menu size={20} color="#F0F0F0" />
          </button>
          <span
            style={{
              fontFamily: "var(--font-cormorant), 'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#F0F0F0" }}>Orn</span>
            <span style={{ color: "#E53935" }}>ō</span>
          </span>
          {/* Spacer so logo stays centered */}
          <div style={{ width: 36 }} aria-hidden="true" />
        </header>

        {/* ── Page content ──────────────────────────────────────── */}
        <main id="main-content" style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes orno-spin { to { transform: rotate(360deg); } }

        /* ── Scrollbar ─── */
        [data-theme="orno-admin"] ::-webkit-scrollbar { width: 6px; height: 6px; }
        [data-theme="orno-admin"] ::-webkit-scrollbar-track { background: #0F0F0F; }
        [data-theme="orno-admin"] ::-webkit-scrollbar-thumb { background: #2E2E2E; border-radius: 3px; }
        [data-theme="orno-admin"] ::-webkit-scrollbar-thumb:hover { background: #3A3A3A; }

        /* ── Desktop ≥1024px ── */
        @media (min-width: 1024px) {
          .orno-admin-body {
            margin-left: 240px;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }
          .orno-mobile-header { display: none; }
        }

        /* ── Mobile <1024px ── */
        @media (max-width: 1023px) {
          .orno-admin-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            width: 100%;
          }
          .orno-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            height: 52px;
            background: #161616;
            border-bottom: 1px solid #252525;
            position: sticky;
            top: 0;
            z-index: 30;
            flex-shrink: 0;
          }
          .orno-hamburger {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
            color: #F0F0F0;
            transition: background 0.15s;
          }
          .orno-hamburger:hover { background: #252525; }
          .orno-hamburger:focus-visible {
            outline: 2px solid #E53935;
            outline-offset: 2px;
          }
        }
      `}</style>
    </div>
  )
}
