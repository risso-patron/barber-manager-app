"use client"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { ClientSidebar } from "@/components/client/layout/client-sidebar"
import { ClientBottomNav } from "@/components/client/layout/client-bottom-nav"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useRequireAuth(["client", "admin"])

  if (!user) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}
      >
        <div style={{ width: "32px", height: "32px", border: "2px solid #E53935", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555555" }}>Cargando</p>
      </div>
    )
  }

  return (
    <div data-theme="orno-admin" style={{ minHeight: "100vh", background: "#0F0F0F" }}>
      <ClientSidebar />
      <main
        className="lg:ml-[240px]"
        style={{ minHeight: "100vh", scrollbarWidth: "thin", scrollbarColor: "#2E2E2E #0F0F0F" }}
      >
        {children}
      </main>
      <ClientBottomNav />
    </div>
  )
}

