"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // --- DEMO MODE ---
    if (!supabaseUrl || !supabaseAnonKey) {
      const currentUser = localStorage.getItem("currentUser")
      if (!currentUser) {
        router.replace("/auth/login")
        return
      }
      try {
        const user = JSON.parse(currentUser)
        const role = user.profile?.role || user.role
        const destinations: Record<string, string> = {
          admin: "/admin",
          employee: "/employee/dashboard",
          client: "/client",
        }
        router.replace(destinations[role] || "/auth/login")
      } catch {
        localStorage.removeItem("currentUser")
        router.replace("/auth/login")
      }
      return
    }

    // --- SUPABASE MODE ---
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

    const redirect = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.replace("/auth/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error leyendo perfil:", profileError.message)
      }

      const role = profile?.role || "client"
      const destinations: Record<string, string> = {
        admin: "/admin",
        manager: "/admin",
        employee: "/employee/dashboard",
        barber: "/employee/dashboard",
        client: "/client",
      }

      router.replace(destinations[role] || "/auth/login")
    }

    redirect()
  }, [router])

  return null
}
