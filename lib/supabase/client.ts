import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Please check your env settings.")
}

// Create and export the client
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Export createClient function for compatibility
export function createClient() {
  return supabase
}

// Default export
export default supabase
