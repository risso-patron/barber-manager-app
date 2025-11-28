"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Hook to require authentication and optionally specific roles
 * Redirects to login if not authenticated or insufficient permissions
 * DEMO VERSION - Uses localStorage instead of Supabase
 * 
 * @param allowedRoles - Optional array of allowed roles. If not provided, any authenticated user is allowed.
 * @returns The authenticated user or null during loading
 */
export function useRequireAuth(allowedRoles?: string[]) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage
    const currentUserStr = localStorage.getItem("currentUser")
    
    if (!currentUserStr) {
      // No user logged in, redirect to login
      router.replace("/login")
      return
    }

    try {
      const currentUser = JSON.parse(currentUserStr)
      
      // Check role permissions if specified
      if (allowedRoles && allowedRoles.length > 0) {
        const hasPermission = allowedRoles.includes(currentUser.role)
        
        if (!hasPermission) {
          // Redirect to appropriate dashboard based on role
          const dashboardMap: Record<string, string> = {
            admin: "/admin",
            employee: "/barber",
            barber: "/barber",
            client: "/client",
          }
          
          const redirectPath = dashboardMap[currentUser.role] || "/login"
          router.replace(redirectPath)
          return
        }
      }
      
      // User is authenticated and has permission
      setUser(currentUser)
      setIsLoading(false)
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("currentUser")
      router.replace("/login")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  return user
}
