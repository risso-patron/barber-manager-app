"use client"

import {
 Card,
 CardContent,
 CardHeader,
 CardTitle
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

export default function IntegrationsPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#F0F0F0"
        }}
      >
        Integraciones
      </h1>

      <p
        style={{
          color: "#8A8A8A",
          marginTop: 4
        }}
      >
        Servicios externos conectados
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-6">

        <Card>
          <CardHeader>
            <CardTitle>Supabase</CardTitle>
          </CardHeader>

          <CardContent>
            <Badge>Conectado</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
          </CardHeader>

          <CardContent>
            <Badge variant="secondary">
              Pendiente
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>

          <CardContent>
            <Badge>
              Conectado
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
          </CardHeader>

          <CardContent>
            <Badge variant="destructive">
              Desconectado
            </Badge>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}