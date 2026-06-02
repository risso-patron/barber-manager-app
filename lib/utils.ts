import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Enmascara un número de teléfono para vistas de encargado.
 * Muestra solo los últimos 4 dígitos: ***-***-XXXX
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  return `***-***-${digits.slice(-4)}`
}
