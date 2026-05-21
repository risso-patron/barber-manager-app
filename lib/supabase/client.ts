import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Running in demo mode.")
}

// Create and export the client with fallback for demo mode
export const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

// Export createClient function for compatibility
export function createClient() {
  if (!supabase) {
    throw new Error("Supabase client not available. Check environment variables.")
  }
  return supabase
}

// Default export
export default supabase
