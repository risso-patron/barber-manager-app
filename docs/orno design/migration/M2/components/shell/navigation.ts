// ORNO UI Framework · M2 · Shell
// Navigation manifests — operational flow, not site structure.
// Ordered by "what does this role need right now": today first,
// then the day's work, then the business, then configuration.
//
// Future modules plug in by adding an entry — the shell never changes.
// `flag` gates unreleased modules without touching layout code.

import type { LucideIcon } from "lucide-react"
import {
  Sun,
  CalendarDays,
  ShoppingBag,
  Heart,
  Scissors,
  Users,
  Package,
  LineChart,
  Settings2,
  Clock,
  UserRound,
  History,
  Sparkles,
  Home,
  CalendarPlus,
} from "lucide-react"

export interface NavItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
  /** Optional live badge source, resolved by the shell (e.g. unconfirmed count). */
  badge?: "attention" | "waitlist"
  /** Feature flag key — item hidden unless enabled. */
  flag?: string
}

export interface NavSection {
  key: string
  /** Section label. Empty string = no heading (primary operational group). */
  label: string
  items: NavItem[]
}

export interface RoleNav {
  /** Sidebar sections, operational order. */
  sections: NavSection[]
  /** Mobile bottom bar: exactly 2 items + create + 1 item + "Más". */
  mobile: { primary: NavItem[]; overflow: NavItem[] }
  /** The role's creation verbs for the global "+ Nuevo" and mobile FAB. */
  createActions: Array<{ key: string; label: string; icon: LucideIcon; href?: string }>
  home: string
}

/* ── ADMIN — runs the shop ─────────────────────────────────────── */
const adminOps: NavItem[] = [
  { key: "today", label: "Tu día", href: "/admin", icon: Sun },
  { key: "agenda", label: "Agenda", href: "/admin/appointments", icon: CalendarDays },
  { key: "pos", label: "Caja", href: "/admin/pos", icon: ShoppingBag },
  { key: "clients", label: "Clientes", href: "/admin/clients", icon: Heart, badge: "attention" },
]
const adminBiz: NavItem[] = [
  { key: "services", label: "Servicios", href: "/admin/services", icon: Scissors },
  { key: "team", label: "Equipo", href: "/admin/employees", icon: Users },
  { key: "inventory", label: "Inventario", href: "/admin/inventory", icon: Package },
  { key: "reports", label: "Análisis", href: "/admin/reports", icon: LineChart },
]

export const ADMIN_NAV: RoleNav = {
  home: "/admin",
  sections: [
    { key: "ops", label: "", items: adminOps },
    { key: "biz", label: "Negocio", items: adminBiz },
    {
      key: "config",
      label: "",
      items: [{ key: "settings", label: "Configuración", href: "/admin/settings", icon: Settings2 }],
    },
  ],
  mobile: {
    primary: [adminOps[0], adminOps[1], adminOps[2]],
    overflow: [adminOps[3], ...adminBiz, { key: "settings", label: "Configuración", href: "/admin/settings", icon: Settings2 }],
  },
  createActions: [
    { key: "appointment", label: "Nueva cita", icon: CalendarPlus },
    { key: "sale", label: "Cobrar venta", icon: ShoppingBag },
    { key: "client", label: "Nuevo cliente", icon: UserRound },
    { key: "block", label: "Bloquear horario", icon: Clock },
  ],
}

/* ── EMPLOYEE — runs their chair ───────────────────────────────── */
const employeeOps: NavItem[] = [
  { key: "today", label: "Tu día", href: "/employee/dashboard", icon: Sun },
  { key: "agenda", label: "Mi agenda", href: "/employee/agenda", icon: CalendarDays },
  { key: "clock", label: "Fichaje", href: "/employee/fichaje", icon: Clock },
  { key: "stats", label: "Mi rendimiento", href: "/employee/stats", icon: Sparkles },
  { key: "history", label: "Historial", href: "/employee/historial", icon: History },
]

export const EMPLOYEE_NAV: RoleNav = {
  home: "/employee/dashboard",
  sections: [
    { key: "ops", label: "", items: employeeOps },
    {
      key: "config",
      label: "",
      items: [{ key: "profile", label: "Mi perfil", href: "/employee/perfil", icon: UserRound }],
    },
  ],
  mobile: {
    primary: [employeeOps[0], employeeOps[1], employeeOps[2]],
    overflow: [employeeOps[3], employeeOps[4], { key: "profile", label: "Mi perfil", href: "/employee/perfil", icon: UserRound }],
  },
  createActions: [{ key: "block", label: "Bloquear horario", icon: Clock }],
}

/* ── CLIENT — books and returns ────────────────────────────────── */
const clientOps: NavItem[] = [
  { key: "home", label: "Inicio", href: "/client", icon: Home },
  { key: "book", label: "Reservar", href: "/client/book", icon: CalendarPlus },
  { key: "appointments", label: "Mis citas", href: "/client/appointments", icon: CalendarDays },
  { key: "profile", label: "Mi perfil", href: "/client/profile", icon: UserRound },
]

export const CLIENT_NAV: RoleNav = {
  home: "/client",
  sections: [{ key: "ops", label: "", items: clientOps }],
  mobile: {
    primary: [clientOps[0], clientOps[1], clientOps[2]],
    overflow: [clientOps[3]],
  },
  createActions: [{ key: "book", label: "Reservar cita", icon: CalendarPlus, href: "/client/book" }],
}

export const NAV_BY_ROLE = { admin: ADMIN_NAV, employee: EMPLOYEE_NAV, client: CLIENT_NAV } as const
export type ShellRole = keyof typeof NAV_BY_ROLE
