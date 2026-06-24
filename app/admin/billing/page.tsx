"use client"

import {
 Card,
 CardContent,
 CardHeader,
 CardTitle
} from "@/components/ui/card"

export default function BillingPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#F0F0F0"
        }}
      >
        Facturación
      </h1>

      <p
        style={{
          color: "#8A8A8A",
          marginTop: 4
        }}
      >
        Control de ventas y pagos
      </p>

      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Hoy</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              $1,240
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas Mes</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              $18,420
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Promedio</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              $32
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Propinas</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              $210
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}