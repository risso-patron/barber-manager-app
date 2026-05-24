"use client"

import { useState, useEffect, useCallback, useContext, createContext } from "react"
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  onAuthStateChange,
  type SignUpData,
  type SignInData,
} from "@/lib/services/auth.service"

export interface AuthUser {
  id: string
  email: string
  profile?: {
    name: string
    role: "client" | "employee" | "admin"
    phone?: string
    avatar_url?: string
  }
}

export interface UseAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  signUp: (data: SignUpData) => Promise<boolean>
  signIn: (data: SignInData) => Promise<boolean>
  signOut: () => Promise<boolean>
  updateProfile: (data: any) => Promise<boolean>
  clearError: () => void
}

/**
 * Auth Context
 */
const AuthContext = createContext<UseAuthReturn | null>(null)

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthInternal()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Internal useAuth Hook
 */
function useAuthInternal(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    initAuth()

    // Subscribe to auth changes
    const { data } = onAuthStateChange((user) => {
      setUser(user)
    })

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [])

  /**
   * Handle sign up
   */
  const handleSignUp = useCallback(async (data: SignUpData) => {
    setError(null)
    setIsLoading(true)

    const response = await signUp(data)

    if (!response.success) {
      setError(response.error || "Sign up failed")
      setIsLoading(false)
      return false
    }

    setIsLoading(false)
    return true
  }, [])

  /**
   * Handle sign in
   */
  const handleSignIn = useCallback(async (data: SignInData) => {
    setError(null)
    setIsLoading(true)

    const response = await signIn(data)

    if (!response.success) {
      setError(response.error || "Sign in failed")
      setIsLoading(false)
      return false
    }

    setUser((response.data?.user as AuthUser | undefined) ?? null)
    setIsLoading(false)
    return true
  }, [])

  /**
   * Handle sign out
   */
  const handleSignOut = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    const response = await signOut()

    if (!response.success) {
      setError(response.error || "Sign out failed")
      setIsLoading(false)
      return false
    }

    setUser(null)
    setIsLoading(false)
    return true
  }, [])

  /**
   * Update user profile
   */
  const handleUpdateProfile = useCallback(async (data: any) => {
    setError(null)

    if (!user?.id) {
      setError("User not authenticated")
      return false
    }

    const response = await updateUserProfile(user.id, data)

    if (!response.success) {
      setError(response.error || "Update failed")
      return false
    }

    const updatedUser = await getCurrentUser()
    setUser(updatedUser)
    return true
  }, [user?.id])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    clearError,
  }
}

/**
 * useAuth Hook - for using outside AuthProvider
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}