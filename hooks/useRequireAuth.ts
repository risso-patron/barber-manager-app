"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./useAuth"
import type { UserRole } from "@/lib/types"

/**
 * Hook to require authentication and optionally specific roles
 * Redirects to login if not authenticated or insufficient permissions
 * 
 * @param allowedRoles - Optional array of allowed roles. If not provided, any authenticated user is allowed.
 * @returns The authenticated user or null during loading
 * 
 * @example
 * ```tsx
 * function AdminPage() {
 *   const user = useRequireAuth(['admin'])
 *   
 *   if (!user) return <LoadingSpinner />
 *   
 *   return <AdminDashboard />
 * }
 * ```
 */
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.push("/auth/login")
      return
    }

    // Check role permissions if specified
    if (allowedRoles && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.includes(user.profile?.role as UserRole)
      
      if (!hasPermission) {
        // Redirect to appropriate dashboard based on role
        const dashboardMap: Record<string, string> = {
          admin: "/admin",
          employee: "/barber",
          barber: "/barber",
          client: "/client",
        }
        
        const redirectPath = dashboardMap[user.profile?.role || "client"] || "/dashboard"
        router.push(redirectPath)
      }
    }
  }, [user, isLoading, isAuthenticated, allowedRoles, router])

  return user
}
