// LAND-1 · Hero. Copy CONGELADO (blueprint v1.2 + plan §2.1).

export const HERO = {
  badge: "Hecho para barberías reales",
  title: "La forma más simple de controlar tu barbería.",
  sub: "Citas, barberos, clientes, ingresos e inventario en un solo lugar. No más WhatsApp, libretas ni memoria.",
  secondaryCta: { label: "Ver cómo funciona", href: "#como" },
  photoHint:
    "Barbero profesional atendiendo a un cliente en una barbería boutique moderna, luz cálida, estilo editorial",
} as const

export const HERO_CHIPS = {
  today: { value: "8 citas hoy", detail: "3 barberos activos" },
  revenue: { label: "Generado hoy", value: "$420" },
  next: "Próximo cliente en 15 min · hueco libre detectado a las 15:00",
} as const
