// LAND-1A · Franja de confianza, Solución, Módulos y En desarrollo.
// Copy CONGELADO: blueprint v1.2 verbatim salvo las adaptaciones aprobadas
// del plan §2.2 (Inventario), §2.3 (Alertas), §2.4 (Módulos) y §2.5 (En desarrollo).
// Las cards "En desarrollo" llevan SOLO título + badge — cero copy inventado.

import type { LucideIcon } from "lucide-react"
import {
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Heart,
  Link2,
  MessageCircle,
  Package,
  PackageMinus,
  Receipt,
  Scissors,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react"

export type Accent = "sage" | "dustyblue" | "terracotta"

export const TRUST = {
  text: "Diseñado para barberías que ya no quieren manejar todo por WhatsApp, libretas o memoria.",
  items: [
    { icon: CalendarDays, label: "Agenda clara" },
    { icon: Users, label: "Equipo alineado" },
    { icon: TrendingUp, label: "Ingresos visibles" },
  ],
} as const

export const SOLUTION = {
  title: "ORNO convierte el movimiento diario de tu barbería en control.",
  cards: [
    { icon: CalendarDays, title: "Agenda organizada", text: "Citas visibles por día y por barbero, sin cruces.", accent: "sage" },
    { icon: Users, title: "Barberos asignados", text: "Cada uno sabe a quién atiende y a qué hora.", accent: "dustyblue" },
    { icon: Heart, title: "Clientes registrados", text: "Historial, notas y preferencias de cada visita.", accent: "terracotta" },
    { icon: TrendingUp, title: "Ingresos monitoreados", text: "Sabes cuánto entró hoy, sin sumar a mano.", accent: "sage" },
    { icon: Package, title: "Inventario controlado", text: "Stock y movimientos registrados, con mínimos siempre a la vista.", accent: "terracotta" },
    { icon: Bell, title: "Alertas importantes", text: "Recordatorios de citas para tus clientes, automáticos.", accent: "dustyblue" },
    { icon: Receipt, title: "Cobros registrados", text: "Cada servicio, propina y producto queda anotado.", accent: "sage" },
    { icon: ShieldCheck, title: "Operación más profesional", text: "Tu barbería se ve — y se siente — más ordenada.", accent: "dustyblue" },
  ],
} as const satisfies { title: string; cards: readonly { icon: LucideIcon; title: string; text: string; accent: Accent }[] }

export const MODULES = {
  title: "Todo lo que tu barbería necesita",
  cards: [
    { icon: CalendarDays, title: "Agenda", text: "El día completo, por barbero." },
    { icon: CalendarCheck, title: "Citas", text: "Reservas, reprogramaciones y confirmaciones." },
    { icon: Heart, title: "Clientes", text: "Historial y preferencias de cada uno." },
    { icon: Scissors, title: "Barberos", text: "Horarios y agendas del equipo." },
    { icon: CircleDollarSign, title: "Caja / POS", text: "Cobra el servicio y los productos." },
    { icon: Package, title: "Inventario", text: "Stock y movimientos registrados, con mínimos siempre a la vista." },
    { icon: Sun, title: "Dashboard", text: "Cómo va tu negocio, en una mirada." },
    { icon: Link2, title: "Reservas online", text: "Tus clientes reservan desde un enlace, sin instalar nada." },
  ],
} as const satisfies { title: string; cards: readonly { icon: LucideIcon; title: string; text: string }[] }

export const COMING_SOON = {
  title: "Lo que viene — esto estamos construyendo.",
  badge: "Próximamente",
  items: [
    { icon: Receipt, title: "Facturación" },
    { icon: MessageCircle, title: "Recordatorios por WhatsApp" },
    { icon: Building2, title: "Multi-sucursal" },
    { icon: Smartphone, title: "App móvil del equipo" },
    { icon: PackageMinus, title: "Descuento automático de inventario" },
    { icon: ShoppingCart, title: "Recomendaciones de compra" },
    { icon: Sparkles, title: "IA" },
  ],
} as const satisfies { title: string; badge: string; items: readonly { icon: LucideIcon; title: string }[] }
