"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useRequireAuth(["admin", "manager"])

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
      <AdminSidebar />
      <main
        style={{
          marginLeft: 240,
          flex: 1,
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
      <style>{`
        @keyframes orno-spin { to { transform: rotate(360deg); } }
        [data-theme="orno-admin"] ::-webkit-scrollbar { width: 6px; height: 6px; }
        [data-theme="orno-admin"] ::-webkit-scrollbar-track { background: #0F0F0F; }
        [data-theme="orno-admin"] ::-webkit-scrollbar-thumb { background: #2E2E2E; border-radius: 3px; }
        [data-theme="orno-admin"] ::-webkit-scrollbar-thumb:hover { background: #3A3A3A; }
      `}</style>
    </div>
  )
}
