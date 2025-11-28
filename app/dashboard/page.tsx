"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(true)

  useEffect(() => {
    // Verificar si hay usuario logueado en localStorage
    const currentUser = localStorage.getItem("currentUser")
    
    if (!currentUser) {
      // No hay usuario, redirigir al login
      router.replace("/login")
      return
    }

    try {
      const user = JSON.parse(currentUser)
      const role = user.role

      // Redirigir según el rol
      if (role === "admin") {
        router.replace("/admin")
      } else if (role === "employee" || role === "barber") {
        router.replace("/barber")
      } else if (role === "client") {
        router.replace("/client")
      } else {
        // Rol desconocido, redirigir al login
        localStorage.removeItem("currentUser")
        router.replace("/login")
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("currentUser")
      router.replace("/login")
    }
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
