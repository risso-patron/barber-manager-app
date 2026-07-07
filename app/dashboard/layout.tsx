"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"
import { Loader2 } from "lucide-react"

interface DashboardUser {
  role?: string
  name?: string
  profile?: {
    role?: string
    name?: string
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      // Demo mode
      const currentUserStr = localStorage.getItem("currentUser")
      if (!currentUserStr) {
        router.replace("/auth/login")
        return
      }
      try {
        const currentUser = JSON.parse(currentUserStr) as DashboardUser
        setUser(currentUser)
        setIsLoading(false)
      } catch {
        localStorage.removeItem("currentUser")
        router.replace("/auth/login")
      }
      return
    }

    // Supabase mode
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) {
        router.replace("/auth/login")
        return
      }
      setUser(authUser)
      setIsLoading(false)
    })
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="flex flex-col items-center gap-6">
          <img src="/orno_logo.svg" alt="Ornō" style={{ height: "80px", width: "auto" }} />
          <div style={{ width: "1px", height: "36px", background: "rgba(240,235,227,0.12)" }} />
          <div className="animate-spin" style={{ width: "26px", height: "26px", borderRadius: "50%", border: "2px solid rgba(204,34,34,0.2)", borderTopColor: "#cc2222" }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={(user.profile?.role || user.role || "client") as "admin" | "employee" | "client"} userName={user.profile?.name || user.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
        <Footer />
      </main>
    </div>
  )
}
