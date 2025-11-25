"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DASHBOARD_BY_ROLE } from "@/lib/constants"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    // Redirigir según el rol del usuario
    const role = user.profile?.role
    if (role && role in DASHBOARD_BY_ROLE) {
      const dashboardPath = DASHBOARD_BY_ROLE[role as keyof typeof DASHBOARD_BY_ROLE]
      router.push(dashboardPath)
    } else {
      // Fallback para roles desconocidos
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

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
