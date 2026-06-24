"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const logs = [
  {
    id: 1,
    user: "Luis Risso",
    action: "Inicio de sesión",
    module: "Auth",
    level: "Info",
    date: "2026-06-12 08:00",
  },
  {
    id: 2,
    user: "Admin",
    action: "Eliminó un cliente",
    module: "Clientes",
    level: "Warning",
    date: "2026-06-12 09:15",
  },
  {
    id: 3,
    user: "Sistema",
    action: "Error de conexión",
    module: "Supabase",
    level: "Critical",
    date: "2026-06-12 09:30",
  },
]

export function AuditTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos Recientes</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3">Fecha</th>
                <th className="text-left py-3">Usuario</th>
                <th className="text-left py-3">Acción</th>
                <th className="text-left py-3">Módulo</th>
                <th className="text-left py-3">Nivel</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-zinc-900"
                >
                  <td className="py-3">{log.date}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.module}</td>
                  <td>{log.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}