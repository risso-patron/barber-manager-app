"use client"

import type React from "react"
import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/layout/sidebar"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user.profile?.role || "client"} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
