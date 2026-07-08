"use client"

// Single sign-out flow for the three portals (M2 shell).
// Verbatim port of the legacy sidebar handlers: clear the demo/local
// session and close the Supabase session when configured. The caller
// redirects (router.push("/auth/login")), same as the legacy sidebars.

import { createBrowserClient } from "@supabase/ssr"

export async function signOut(): Promise<void> {
  localStorage.removeItem("currentUser")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    await supabase.auth.signOut()
  }
}
