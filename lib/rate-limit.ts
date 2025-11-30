/**
 * Rate Limiting Utility
 * 
 * Limita el número de requests por IP para prevenir:
 * - Ataques de fuerza bruta
 * - Spam de formularios
 * - Abuso de APIs
 * 
 * Usa Map en memoria (para producción usar Redis/Upstash)
 */

interface RateLimitConfig {
  windowMs: number  // Ventana de tiempo en ms
  maxRequests: number  // Máximo de requests en la ventana
}

interface RequestRecord {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config

    // Cleanup de registros viejos cada minuto
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Verifica si un request está dentro del límite
   * @param identifier - IP o user ID
   * @returns true si está permitido, false si excede el límite
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now()
    const record = this.requests.get(identifier)

    // Primera request o ventana expiró
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetIn: this.config.windowMs
      }
    }

    // Incrementar contador
    record.count++

    // Verificar si excede el límite
    if (record.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: record.resetTime - now
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetIn: record.resetTime - now
    }
  }

  /**
   * Resetea el contador para un identificador
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Limpia registros expirados
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      totalIPs: this.requests.size,
      config: this.config
    }
  }
}

// Instancias predefinidas para diferentes endpoints
export const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5 // 5 intentos de login
})

export const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 60 // 60 requests por minuto
})

export const bookingLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10 // 10 reservas por hora
})

export const strictLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10 // 10 requests por minuto
})

/**
 * Helper para obtener IP del request
 */
export function getClientIP(request: Request): string {
  // Vercel/Next.js headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * Middleware helper para aplicar rate limiting en API routes
 */
export async function withRateLimit(
  request: Request,
  limiter: RateLimiter,
  handler: () => Promise<Response>
): Promise<Response> {
  const ip = getClientIP(request)
  const { allowed, remaining, resetIn } = limiter.check(ip)

  if (!allowed) {
    // Log rate limit exceeded (importar dinámicamente para evitar ciclos)
    if (typeof window === 'undefined') {
      const { logRateLimitExceeded } = await import('./security-logger')
      const url = new URL(request.url)
      logRateLimitExceeded(ip, url.pathname, limiter['config'].maxRequests)
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
          'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + resetIn).toISOString()
        }
      }
    )
  }

  const response = await handler()

  // Añadir headers de rate limit a la respuesta
  response.headers.set('X-RateLimit-Limit', limiter['config'].maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + resetIn).toISOString())

  return response
}

export default RateLimiter
