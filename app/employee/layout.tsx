"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { EmployeeSidebar } from "@/components/employee/layout/employee-sidebar"
import { EmployeeBottomNav } from "@/components/employee/layout/employee-bottom-nav"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useRequireAuth(["employee", "admin"])

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
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <EmployeeSidebar />
      </div>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          overflowY: "auto",
        }}
        className="lg:ml-[240px]"
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      <EmployeeBottomNav />

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
