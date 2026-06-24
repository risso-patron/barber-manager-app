"use client"

//import { AuditTable } from "@/components/admin/audit/audit-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Shield,
  AlertTriangle,
  Activity,
  UserCheck
} from "lucide-react"

export default function AuditPage() {
  return (
    <div style={{ padding: 32 }}>
      <div className="mb-6">
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#F0F0F0",
          }}
        >
          Auditoría y Seguridad
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "#8A8A8A",
            marginTop: 4,
          }}
        >
          Registro de actividad, accesos y eventos críticos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Eventos Hoy</CardTitle>
          </CardHeader>
<CardContent className="flex items-center justify-between">
  <div className="text-2xl font-bold">128</div>
  <Activity className="h-5 w-5 text-zinc-500" />
</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
  <div className="text-2xl font-bold">128</div>
  <Activity className="h-5 w-5 text-zinc-500" />
</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
  <div className="text-2xl font-bold">128</div>
  <Activity className="h-5 w-5 text-zinc-500" />
</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Críticos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
  <div className="text-2xl font-bold">128</div>
  <Activity className="h-5 w-5 text-zinc-500" />
</CardContent>
        </Card>
      </div>
    </div>
  )
}