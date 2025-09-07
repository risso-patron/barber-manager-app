import { createServerSupabaseClient } from "./supabase/server"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions")
  }
  return user
}
