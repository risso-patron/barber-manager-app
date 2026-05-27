/**
 * Rate Limiting Utility
 *
 * Limita el número de requests por IP para prevenir:
 * - Ataques de fuerza bruta
 * - Spam de formularios
 * - Abuso de APIs
 *
 * Usa Upstash Redis cuando las credenciales están configuradas (producción/staging).
 * Fallback a Map en memoria cuando no lo están (desarrollo local / demo mode).
 */

// ─── Limiter en memoria (fallback) ───────────────────────────────────────────

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RequestRecord {
  count: number
  resetTime: number
}

class InMemoryRateLimiter {
  private requests: Map<string, RequestRecord> = new Map()
  readonly config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    setInterval(() => this.cleanup(), 60000)
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.config.windowMs })
      return { allowed: true, remaining: this.config.maxRequests - 1, resetIn: this.config.windowMs }
    }

    record.count++

    if (record.count > this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
    }

    return { allowed: true, remaining: this.config.maxRequests - record.count, resetIn: record.resetTime - now }
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) this.requests.delete(key)
    }
  }
}

// ─── Limiter Upstash (producción) ────────────────────────────────────────────

interface UpstashLimiterConfig {
  windowMs: number
  maxRequests: number
}

interface UpstashCheckResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

class UpstashRateLimiter {
  readonly config: UpstashLimiterConfig
  // Typed as any to avoid requiring @upstash/ratelimit types at compile time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private limiter: any = null

  constructor(config: UpstashLimiterConfig) {
    this.config = config
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getLimiter(): Promise<any> {
    if (this.limiter) return this.limiter
    const { Ratelimit } = await import("@upstash/ratelimit")
    const { Redis } = await import("@upstash/redis")
    this.limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(this.config.maxRequests, `${this.config.windowMs}ms`),
    })
    return this.limiter
  }

  async check(identifier: string): Promise<UpstashCheckResult> {
    const limiter = await this.getLimiter()
    const result = await limiter.limit(identifier)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetIn: result.reset - Date.now(),
    }
  }
}

// ─── Selección de backend ─────────────────────────────────────────────────────

type AnyLimiter = InMemoryRateLimiter | UpstashRateLimiter

function buildRateLimiter(config: RateLimitConfig): AnyLimiter {
  const hasUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)

  if (hasUpstash) {
    return new UpstashRateLimiter(config)
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[rate-limit] Rate limiter en memoria activo — no usar en producción. " +
      "Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN."
    )
  }

  return new InMemoryRateLimiter(config)
}

// ─── Instancias exportadas ────────────────────────────────────────────────────

export const loginLimiter = buildRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 })
export const apiLimiter = buildRateLimiter({ windowMs: 60 * 1000, maxRequests: 60 })
export const bookingLimiter = buildRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 10 })
export const strictLimiter = buildRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 })

/**
 * Helper para obtener IP del request
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwardedFor) {
    return (forwardedFor.split(',')[0] ?? forwardedFor).trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Middleware helper para aplicar rate limiting en API routes.
 * Compatible con limiters en memoria (sync) y Upstash (async).
 */
export async function withRateLimit(
  request: Request,
  limiter: AnyLimiter,
  handler: () => Promise<Response>
): Promise<Response> {
  const rawIp = getClientIP(request)
  const env = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'dev'
  const ip = `${env}:ip:${rawIp}`

  let result: { allowed: boolean; remaining: number; resetIn: number }

  if (limiter instanceof UpstashRateLimiter) {
    result = await limiter.check(ip)
  } else {
    result = (limiter as InMemoryRateLimiter).check(ip)
  }

  const { allowed, remaining, resetIn } = result

  if (!allowed) {
    if (typeof window === 'undefined') {
      const { logRateLimitExceeded } = await import('./security-logger')
      const url = new URL(request.url)
      logRateLimitExceeded(rawIp, url.pathname, limiter.config.maxRequests)
    }

    return new Response(
      JSON.stringify({
        error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
        retryAfter: Math.ceil(resetIn / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(resetIn / 1000).toString(),
          'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + resetIn).toISOString()
        }
      }
    )
  }

  const response = await handler()

  response.headers.set('X-RateLimit-Limit', limiter.config.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + resetIn).toISOString())

  return response
}

export default InMemoryRateLimiter
