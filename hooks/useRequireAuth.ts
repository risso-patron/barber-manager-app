"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

const DASHBOARD_MAP: Record<string, string> = {
  admin: "/admin",
  manager: "/admin",
  employee: "/employee/dashboard",
  barber: "/barber",
  client: "/client",
}

export function useRequireAuth(allowedRoles?: string[]) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // --- DEMO MODE (sin Supabase) ---
    if (!supabaseUrl || !supabaseAnonKey) {
      const currentUserStr = localStorage.getItem("currentUser")
      if (!currentUserStr) {
        router.replace("/auth/login")
        return
      }
      try {
        const currentUser = JSON.parse(currentUserStr)
        if (allowedRoles?.length && !allowedRoles.includes(currentUser.role)) {
          router.replace(DASHBOARD_MAP[currentUser.role] || "/auth/login")
          return
        }
        setUser(currentUser)
      } catch {
        localStorage.removeItem("currentUser")
        router.replace("/auth/login")
      }
      return
    }

    // --- SUPABASE MODE ---
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

    const checkSession = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()

      if (error || !authUser) {
        router.replace("/auth/login")
        return
      }

      // Get role from users table
      const { data: profile } = await supabase
        .from("users")
        .select("role, name, phone, avatar_url, specialty")
        .eq("id", authUser.id)
        .single()

      const role = profile?.role || "client"

      if (allowedRoles?.length && !allowedRoles.includes(role)) {
        router.replace(DASHBOARD_MAP[role] || "/auth/login")
        return
      }

      setUser({ id: authUser.id, email: authUser.email, role, specialty: profile?.specialty ?? null, profile })
    }

    checkSession()

    // Reaccionar a cambios de sesión (logout desde otra pestaña, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/")
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return user
}
