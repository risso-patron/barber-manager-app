import { z } from "zod"

/**
 * Environment variables validation schema
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Upstash Redis (rate limiting — opcional en dev/demo)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate and parse environment variables
 * @throws {z.ZodError} if validation fails
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      NODE_ENV: process.env.NODE_ENV,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:", error.flatten().fieldErrors)
      throw new Error("Invalid environment variables. Check your .env.local file.")
    }
    throw error
  }
}

/**
 * Check if app is in demo mode (Supabase not configured)
 */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

/**
 * Get validated environment variables
 */
export const env = validateEnv()
