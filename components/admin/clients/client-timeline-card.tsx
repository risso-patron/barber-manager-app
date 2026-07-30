"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Scissors, MessageSquare, Gift, ShoppingCart } from "lucide-react"

interface TimelineAppointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  service: { name: string; price: number } | null
}

interface TimelineMessage {
  id: string
  subject: string | null
  message: string
  created_at: string
}

interface TimelineGift {
  id: string
  title: string
  created_at: string
}

interface TimelinePosSale {
  id: string
  total: number
  created_at: string
}

interface Props {
  appointments: TimelineAppointment[]
  messages: TimelineMessage[]
  gifts: TimelineGift[]
  posSales: TimelinePosSale[]
}

type TimelineEvent = {
  id: string
  date: Date
  icon: typeof Scissors
  iconClassName: string
  title: string
  subtitle?: string
}

export function ClientTimelineCard({ appointments, messages, gifts, posSales }: Props) {
  const events: TimelineEvent[] = [
    ...appointments.map((a): TimelineEvent => ({
      id: `appt-${a.id}`,
      date: new Date(`${a.appointment_date}T${a.appointment_time}`),
      icon: Scissors,
      iconClassName: "text-sage-600",
      title: a.service?.name ?? "Cita",
      subtitle: a.status,
    })),
    ...messages.map((m): TimelineEvent => ({
      id: `msg-${m.id}`,
      date: new Date(m.created_at),
      icon: MessageSquare,
      iconClassName: "text-dustyblue-text",
      title: m.subject ?? "Mensaje enviado",
      subtitle: m.message,
    })),
    ...gifts.map((g): TimelineEvent => ({
      id: `gift-${g.id}`,
      date: new Date(g.created_at),
      icon: Gift,
      iconClassName: "text-lavender-text",
      title: g.title,
      subtitle: "Regalo / descuento",
    })),
    ...posSales.map((s): TimelineEvent => ({
      id: `pos-${s.id}`,
      date: new Date(s.created_at),
      icon: ShoppingCart,
      iconClassName: "text-warning-text",
      title: `Compra en tienda — $${s.total}`,
      subtitle: "Venta POS",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline del cliente</CardTitle>
        <CardDescription className="text-xs">
          Citas, mensajes, regalos y compras en una sola línea de tiempo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin actividad registrada</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {events.slice(0, 30).map((event) => {
              const Icon = event.icon
              return (
                <div key={event.id} className="flex items-start gap-3">
                  <Icon className={`size-4 mt-0.5 shrink-0 ${event.iconClassName}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    {event.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {event.date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
