import { createHmac, timingSafeEqual } from "crypto"

// RH-002 · A1 — Token de un solo flujo para activar la cuenta de un invitado
// justo después de completar una reserva pública, sin depender únicamente
// del teléfono como prueba de identidad. Firmado con HMAC, sin almacenamiento
// adicional (la expiración corta es el único control de uso, por decisión
// explícita del Product Owner — no hay columna de "ya usado").

const EXPIRATION_MS = 15 * 60 * 1000 // 15 minutos

interface TokenPayload {
  uid: string
  phone: string
  exp: number
}

function getSecret(): string {
  const secret = process.env.BOOKING_ACTIVATION_SECRET
  if (!secret) throw new Error("BOOKING_ACTIVATION_SECRET no configurado")
  return secret
}

export function signActivationToken(uid: string, phone: string): string {
  const payload: TokenPayload = { uid, phone, exp: Date.now() + EXPIRATION_MS }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url")
  return `${encodedPayload}.${signature}`
}

export function verifyActivationToken(
  token: string,
  expected: { uid: string; phone: string }
): { valid: boolean; reason?: string } {
  const parts = token.split(".")
  if (parts.length !== 2) return { valid: false, reason: "Formato de token inválido" }
  const [encodedPayload, signature] = parts as [string, string]

  const expectedSignature = createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url")
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, reason: "Firma inválida" }
  }

  let payload: TokenPayload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"))
  } catch {
    return { valid: false, reason: "Payload inválido" }
  }

  if (Date.now() > payload.exp) return { valid: false, reason: "Token expirado" }
  if (payload.uid !== expected.uid || payload.phone !== expected.phone) {
    return { valid: false, reason: "Token no corresponde a este usuario" }
  }

  return { valid: true }
}
