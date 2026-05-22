import { createBrowserClient } from "@supabase/ssr"
import { DEMO_USERS } from "@/lib/demo-config"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Demo mode enabled if Supabase is not configured
const isDemoMode = !supabaseUrl || !supabaseAnonKey

const supabase = isDemoMode 
  ? null 
  : createBrowserClient(supabaseUrl, supabaseAnonKey)

export interface SignUpData {
  email: string
  password: string
  name: string
  phone?: string
  role?: "client" | "employee"
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Sign up new user
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role || "client",
        },
      },
    })

    if (authError) {
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: "User creation failed",
      }
    }

    // 2. Create user profile in database
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role || "client",
    })

    if (profileError) {
      // Delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: "Failed to create user profile",
      }
    }

    return {
      success: true,
      data: {
        user: authData.user,
        message: "Check your email to confirm your account",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sign in user
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    console.log("🔍 Auth Service - isDemoMode:", isDemoMode)
    console.log("🔍 Auth Service - Supabase URL:", supabaseUrl)
    console.log("🔍 Auth Service - Email:", data.email)
    
    // Demo mode authentication
    if (isDemoMode) {
    console.log("🎭 Modo DEMO activado")
    console.log("👥 DEMO_USERS:", DEMO_USERS)
    
    // Convert DEMO_USERS object to array
    const demoUsersArray = Object.values(DEMO_USERS)
    
    const demoUser = demoUsersArray.find(
      (user) => user.email === data.email && user.password === data.password
    )

    console.log("🔎 Usuario demo encontrado:", demoUser)
    
    if (!demoUser) {
      console.log("❌ No se encontró usuario demo con esas credenciales")
      return {
        success: false,
        error: "Credenciales inválidas. Por favor, verifica tu email y contraseña.",
      }
    }

      // Store demo user in localStorage
      const userProfile = {
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        profile: {
          name: demoUser.name,
          role: demoUser.role,
          phone: demoUser.phone,
          avatar_url: demoUser.avatar_url,
        },
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(userProfile))
        console.log("💾 Usuario guardado en localStorage:", userProfile)
      }

      return {
        success: true,
        data: {
          user: userProfile,
          profile: userProfile.profile,
        },
      }
    }

    console.log("🔐 Autenticando con Supabase...")
    // Supabase authentication
    const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      console.log("❌ Error de Supabase:", authError)
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Sign in failed",
      }
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase!
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      return {
        success: false,
        error: "User profile not found",
      }
    }

    return {
      success: true,
      data: {
        user: authData.user,
        profile: userProfile,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    // Demo mode - clear localStorage
    if (isDemoMode) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUser")
      }
      return {
        success: true,
        data: { message: "Signed out successfully" },
      }
    }

    // Supabase mode
    const { error } = await supabase!.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: { message: "Signed out successfully" },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get current user session
 */
export async function getSession() {
  try {
    // Demo mode - no session tracking
    if (isDemoMode) {
      return null
    }

    // Supabase mode
    const {
      data: { session },
      error,
    } = await supabase!.auth.getSession()

    if (error) {
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    // Demo mode - get user from localStorage
    if (isDemoMode) {
      if (typeof window === "undefined") {
        return null
      }
      const storedUser = localStorage.getItem("currentUser")
      return storedUser ? JSON.parse(storedUser) : null
    }

    // Supabase mode
    const {
      data: { user },
      error,
    } = await supabase!.auth.getUser()

    if (error || !user) {
      return null
    }

    // Get user profile
    const { data: userProfile } = await supabase!
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    return {
      ...user,
      profile: userProfile,
    }
  } catch {
    return null
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    // Demo mode - return from localStorage
    if (isDemoMode) {
      if (typeof window === "undefined") return null
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) return null
      const user = JSON.parse(storedUser)
      return user.profile
    }

    // Supabase mode
    const { data, error } = await supabase!
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string
    phone?: string
    avatar_url?: string
  }
) {
  try {
    // Demo mode - update localStorage
    if (isDemoMode) {
      if (typeof window === "undefined") {
        return { success: false, error: "Cannot update in server context" }
      }
      const storedUser = localStorage.getItem("currentUser")
      if (!storedUser) {
        return { success: false, error: "User not found" }
      }
      const user = JSON.parse(storedUser)
      user.profile = { ...user.profile, ...updates }
      localStorage.setItem("currentUser", JSON.stringify(user))
      return { success: true, data: user.profile }
    }

    // Supabase mode
    const { data, error } = await supabase!
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: { message: "Password updated successfully" },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: { message: "Check your email for password reset link" },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Subscribe to auth changes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onAuthStateChange(callback: (user: any | null) => void) {
  // Demo mode - no real-time auth changes
  if (isDemoMode) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }
  }

  // Supabase mode
  return supabase!.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await getUserProfile(session.user.id)
      callback({
        ...session.user,
        profile,
      })
    } else {
      callback(null)
    }
  })
}

export default supabase || null