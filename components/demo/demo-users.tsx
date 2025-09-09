"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Briefcase, UserCheck, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

interface DemoUser {
  id: string
  name: string
  email: string
  password: string
  role: "admin" | "employee" | "client"
  description: string
  features: string[]
}

const demoUsers: DemoUser[] = [
  {
    id: "admin-demo",
    name: "Carlos Administrador",
    email: "admin@barbermanager.com",
    password: "admin123",
    role: "admin",
    description: "Acceso completo al sistema con todas las funcionalidades administrativas",
    features: [
      "Dashboard completo con métricas",
      "Gestión de empleados",
      "Control de inventario",
      "Reportes financieros",
      "Configuración del sistema",
      "Gestión de citas globales",
    ],
  },
  {
    id: "employee-demo",
    name: "María Barbera",
    email: "empleado@barbermanager.com",
    password: "empleado123",
    role: "employee",
    description: "Panel de empleado con herramientas para gestionar su trabajo diario",
    features: [
      "Agenda personal de citas",
      "Control de entrada/salida",
      "Estadísticas personales",
      "Gestión de pausas",
      "Historial de servicios",
      "Notificaciones de citas",
    ],
  },
  {
    id: "client-demo",
    name: "Juan Cliente",
    email: "cliente@barbermanager.com",
    password: "cliente123",
    role: "client",
    description: "Interfaz de cliente para reservar citas y ver historial",
    features: [
      "Reservar nuevas citas",
      "Ver citas programadas",
      "Historial de servicios",
      "Seleccionar barbero preferido",
      "Calificar servicios",
      "Gestionar perfil personal",
    ],
  },
]

export function DemoUsers() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-5 w-5" />
      case "employee":
        return <Briefcase className="h-5 w-5" />
      case "client":
        return <User className="h-5 w-5" />
      default:
        return <UserCheck className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "employee":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "client":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "employee":
        return "Empleado"
      case "client":
        return "Cliente"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Usuarios de Prueba</h2>
        <p className="text-gray-600">Utiliza estas credenciales para probar diferentes roles en la aplicación</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {demoUsers.map((user) => (
          <Card key={user.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getRoleIcon(user.role)}
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                </div>
                <Badge className={getRoleColor(user.role)}>{getRoleName(user.role)}</Badge>
              </div>
              <CardDescription>{user.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Credenciales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email:</p>
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(user.email, `${user.id}-email`)}>
                    {copiedField === `${user.id}-email` ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contraseña:</p>
                    <p className="text-sm text-gray-900 font-mono">{user.password}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(user.password, `${user.id}-password`)}
                  >
                    {copiedField === `${user.id}-password` ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Características */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Funcionalidades disponibles:</p>
                <ul className="space-y-1">
                  {user.features.map((feature, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de acceso rápido */}
              <Button
                className="w-full bg-transparent"
                variant="outline"
                onClick={() => {
                  // Auto-rellenar el formulario de login (si está disponible)
                  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
                  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement

                  if (emailInput && passwordInput) {
                    emailInput.value = user.email
                    passwordInput.value = user.password

                    // Disparar eventos para que React detecte los cambios
                    emailInput.dispatchEvent(new Event("input", { bubbles: true }))
                    passwordInput.dispatchEvent(new Event("input", { bubbles: true }))
                  }
                }}
              >
                Usar estas credenciales
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instrucciones */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Instrucciones de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Ejecuta el script SQL <code className="bg-blue-100 px-1 rounded">03-create-demo-users.sql</code> en
              Supabase
            </li>
            <li>Ve a la página de login de la aplicación</li>
            <li>Usa cualquiera de las credenciales de arriba para iniciar sesión</li>
            <li>Explora las diferentes funcionalidades según el rol seleccionado</li>
            <li>Puedes cambiar entre usuarios cerrando sesión y usando otras credenciales</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
