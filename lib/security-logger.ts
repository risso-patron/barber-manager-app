/**
 * Security Monitoring & Logging
 * 
 * Logging de eventos de seguridad para auditoría y detección de amenazas
 */

export enum SecurityEventType {
  // Autenticación
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGIN_BLOCKED = 'auth.login.blocked',
  LOGOUT = 'auth.logout',
  
  // Rate Limiting
  RATE_LIMIT_HIT = 'security.rate_limit.hit',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  
  // Validación
  VALIDATION_FAILED = 'security.validation.failed',
  SQL_INJECTION_ATTEMPT = 'security.sql_injection.attempt',
  XSS_ATTEMPT = 'security.xss.attempt',
  
  // Acceso
  UNAUTHORIZED_ACCESS = 'security.access.unauthorized',
  FORBIDDEN_RESOURCE = 'security.access.forbidden',
  
  // Datos sensibles
  SECRET_EXPOSED = 'security.secret.exposed',
  CONFIG_CHANGED = 'security.config.changed',
  
  // API
  API_KEY_INVALID = 'security.api.key_invalid',
  API_ABUSE = 'security.api.abuse',
}

export interface SecurityEvent {
  type: SecurityEventType
  timestamp: string
  ip: string
  userId?: string
  userAgent?: string
  path: string
  method?: string
  metadata?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class SecurityLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log de evento de seguridad
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    // En desarrollo, log a consola
    if (this.isDevelopment) {
      this.logToConsole(fullEvent)
    }

    // En producción, enviar a servicio de logging
    // TODO: Integrar con Axiom, Datadog, o similar
    if (!this.isDevelopment) {
      this.logToService(fullEvent)
    }

    // Alertas para eventos críticos
    if (fullEvent.severity === 'critical') {
      this.sendAlert(fullEvent)
    }
  }

  private logToConsole(event: SecurityEvent): void {
    const emoji = this.getSeverityEmoji(event.severity)
    const color = this.getSeverityColor(event.severity)
    
    console.log(
      `${color}${emoji} [SECURITY] ${event.type}${this.resetColor}`,
      {
        ip: event.ip,
        path: event.path,
        userId: event.userId,
        metadata: event.metadata,
      }
    )
  }

  private async logToService(event: SecurityEvent): Promise<void> {
    // TODO: Implementar integración con servicio de logging
    // Ejemplos:
    
    // Axiom
    // await axiom.ingest('security-events', [event])
    
    // Datadog
    // await datadog.log(event)
    
    // Por ahora, solo log local
    console.warn('[SECURITY]', JSON.stringify(event))
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    // TODO: Enviar alerta a:
    // - Slack/Discord webhook
    // - Email al equipo de seguridad
    // - PagerDuty para on-call
    
    console.error('🚨 CRITICAL SECURITY EVENT:', event)
    
    // Ejemplo de webhook a Slack:
    // if (process.env.SLACK_WEBHOOK_URL) {
    //   await fetch(process.env.SLACK_WEBHOOK_URL, {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       text: `🚨 Critical Security Event: ${event.type}`,
    //       blocks: [
    //         {
    //           type: 'section',
    //           text: { type: 'mrkdwn', text: `*${event.type}*` }
    //         },
    //         {
    //           type: 'section',
    //           fields: [
    //             { type: 'mrkdwn', text: `*IP:*\n${event.ip}` },
    //             { type: 'mrkdwn', text: `*Path:*\n${event.path}` },
    //           ]
    //         }
    //       ]
    //     })
    //   })
    // }
  }

  private getSeverityEmoji(severity: SecurityEvent['severity']): string {
    const emojis = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔴',
      critical: '🚨',
    }
    return emojis[severity]
  }

  private getSeverityColor(severity: SecurityEvent['severity']): string {
    const colors = {
      low: '\x1b[36m',     // Cyan
      medium: '\x1b[33m',  // Yellow
      high: '\x1b[31m',    // Red
      critical: '\x1b[35m', // Magenta
    }
    return colors[severity]
  }

  private resetColor = '\x1b[0m'

  /**
   * Shortcuts para tipos comunes de eventos
   */
  loginSuccess(ip: string, userId: string, userAgent?: string): void {
    this.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      severity: 'low',
      ip,
      userId,
      userAgent,
      path: '/api/auth/login',
      method: 'POST',
    })
  }

  loginFailed(ip: string, email: string, userAgent?: string): void {
    this.log({
      type: SecurityEventType.LOGIN_FAILED,
      severity: 'medium',
      ip,
      userAgent,
      path: '/api/auth/login',
      method: 'POST',
      metadata: { email },
    })
  }

  rateLimitExceeded(ip: string, path: string, limit: number): void {
    this.log({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'high',
      ip,
      path,
      metadata: { limit },
    })
  }

  sqlInjectionAttempt(ip: string, path: string, input: string): void {
    this.log({
      type: SecurityEventType.SQL_INJECTION_ATTEMPT,
      severity: 'critical',
      ip,
      path,
      metadata: { 
        input: input.substring(0, 100), // Truncar para no loggear todo
        inputLength: input.length,
      },
    })
  }

  xssAttempt(ip: string, path: string, input: string): void {
    this.log({
      type: SecurityEventType.XSS_ATTEMPT,
      severity: 'critical',
      ip,
      path,
      metadata: { 
        input: input.substring(0, 100),
        inputLength: input.length,
      },
    })
  }

  unauthorizedAccess(ip: string, path: string, userId?: string): void {
    this.log({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: 'high',
      ip,
      userId,
      path,
    })
  }

  /**
   * Genera reporte de eventos de seguridad
   */
  async generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number
    bySeverity: Record<SecurityEvent['severity'], number>
    byType: Record<string, number>
    topIPs: Array<{ ip: string; count: number }>
  }> {
    // TODO: Implementar query a servicio de logging
    // Por ahora retornar estructura vacía
    return {
      totalEvents: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byType: {},
      topIPs: [],
    }
  }
}

// Export singleton
export const securityLogger = new SecurityLogger()

// Export helpers
export function logLoginSuccess(ip: string, userId: string, userAgent?: string) {
  securityLogger.loginSuccess(ip, userId, userAgent)
}

export function logLoginFailed(ip: string, email: string, userAgent?: string) {
  securityLogger.loginFailed(ip, email, userAgent)
}

export function logRateLimitExceeded(ip: string, path: string, limit: number) {
  securityLogger.rateLimitExceeded(ip, path, limit)
}

export function logSqlInjectionAttempt(ip: string, path: string, input: string) {
  securityLogger.sqlInjectionAttempt(ip, path, input)
}

export function logXssAttempt(ip: string, path: string, input: string) {
  securityLogger.xssAttempt(ip, path, input)
}

export function logUnauthorizedAccess(ip: string, path: string, userId?: string) {
  securityLogger.unauthorizedAccess(ip, path, userId)
}
