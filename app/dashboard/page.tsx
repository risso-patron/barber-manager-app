"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

export default function DashboardPage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(true)

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
          employee: "/barber",
          barber: "/barber",
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
        employee: "/barber",
        barber: "/barber",
        client: "/client",
      }

      router.replace(destinations[role] || "/auth/login")
    }

    redirect()
  }, [router])

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-white text-lg">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  )
}
