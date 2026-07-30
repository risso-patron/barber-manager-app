// LAND-1 · Contenido compartido de la Landing.
// Copy CONGELADO (LAND-1 Implementation Plan §2 — cambios requieren aprobación).

/** CTA principal (LAND-0): flujo de contacto existente, sin onboarding SaaS. */
export const DEMO_CTA = {
  label: "Solicitar una demo",
  href: "mailto:hola@orno.app?subject=Quiero%20una%20demo%20de%20ORNO",
} as const

export const LOGIN_CTA = {
  label: "Iniciar sesión",
  href: "/auth/login",
} as const
