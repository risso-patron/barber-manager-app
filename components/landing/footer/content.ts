// LAND-1B · Footer. Links solo a rutas y anclas EXISTENTES (regla: sin
// enlaces muertos). La línea de versión comunica transparencia de estado.

export const FOOTER = {
  tagline: "Sistema de gestión para barberías modernas.",
  version: "ORNO v1.2 · Estado del producto: Beta privada",
  copyright: "© 2026 Ornō. Todos los derechos reservados.",
  links: [
    { label: "Solución", href: "#funciones" },
    { label: "Cómo funciona", href: "#como" },
    { label: "Planes", href: "#planes" },
    { label: "FAQ", href: "#faq" },
    { label: "Iniciar sesión", href: "/auth/login" },
    { label: "Privacidad", href: "/privacy" },
    { label: "Términos", href: "/terms" },
    { label: "Contacto", href: "mailto:hola@orno.app" },
  ],
} as const
