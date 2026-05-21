"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
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
        const currentUser = JSON.parse(currentUserStr)
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user.role || "client"} userName={user.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
        <Footer />
      </main>
    </div>
  )
}
