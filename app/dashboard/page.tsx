"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, AlertTriangle, Package, BarChart3, LogOut } from "lucide-react"

interface User {
  email: string
  name: string
  role: string
  description: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay usuario logueado
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      setUser(userData)
      
      // Redirigir según el rol
      if (userData.role === "admin") {
        router.push("/admin")
      } else if (userData.role === "employee" || userData.role === "barber") {
        router.push("/barber")
      } else if (userData.role === "client") {
        router.push("/client")
      }
    } else {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  const getStatsForRole = () => {
    switch (user.role) {
      case "admin":
        return [
          { title: "Citas Totales", value: 156, icon: Calendar, description: "Total de citas registradas" },
          { title: "Empleados", value: 4, icon: Users, description: "Barberos registrados" },
          { title: "Stock Bajo", value: 2, icon: AlertTriangle, description: "Productos con stock bajo" },
          { title: "Servicios", value: 8, icon: Package, description: "Servicios disponibles" },
        ]
      case "employee":
        return [
          { title: "Mis Citas", value: 23, icon: Calendar, description: "Citas asignadas a mí" },
          { title: "Hoy", value: 5, icon: Clock, description: "Citas para hoy" },
          { title: "Completadas", value: 18, icon: BarChart3, description: "Servicios completados" },
          { title: "Pendientes", value: 3, icon: AlertTriangle, description: "Citas por confirmar" },
        ]
      case "client":
        return [
          { title: "Mis Citas", value: 8, icon: Calendar, description: "Total de mis citas" },
          { title: "Próximas", value: 2, icon: Clock, description: "Citas programadas" },
          { title: "Completadas", value: 6, icon: BarChart3, description: "Servicios recibidos" },
          { title: "Servicios", value: 8, icon: Package, description: "Servicios disponibles" },
        ]
      default:
        return []
    }
  }

  const stats = getStatsForRole()

  const getRoleIcon = () => {
    switch (user.role) {
      case "admin":
        return "👑"
      case "employee":
        return "💼"
      case "client":
        return "👤"
      default:
        return "👤"
    }
  }

  const getRoleName = () => {
    switch (user.role) {
      case "admin":
        return "Administrador"
      case "employee":
        return "Empleado"
      case "client":
        return "Cliente"
      default:
        return user.role
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Barber Manager</h1>
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-lg">{getRoleIcon()}</span>
                <span className="text-sm font-medium text-gray-700">{getRoleName()}</span>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">¡Bienvenido, {user.name}!</h2>
            <p className="text-gray-600">Dashboard {getRoleName()} - Sistema Demo Completamente Funcional</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Role-specific content */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades Disponibles</CardTitle>
                <CardDescription>Lo que puedes hacer con tu rol actual</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {user.role === "admin" && (
                    <>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Gestionar todas las citas
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Administrar empleados
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Control de inventario
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Reportes y estadísticas
                      </li>
                    </>
                  )}
                  {user.role === "employee" && (
                    <>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Ver mi agenda personal
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Control de horarios
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Estadísticas personales
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Gestionar mis citas
                      </li>
                    </>
                  )}
                  {user.role === "client" && (
                    <>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Reservar nuevas citas
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Ver mis citas programadas
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Historial de servicios
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Calificar servicios
                      </li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">🎉 Sistema Demo Activo</CardTitle>
                <CardDescription className="text-green-700">
                  Estás usando la versión de demostración completamente funcional
                </CardDescription>
              </CardHeader>
              <CardContent className="text-green-800">
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>✅ Autenticación:</strong> Sistema de login funcional
                  </p>
                  <p className="text-sm">
                    <strong>✅ Roles:</strong> Admin, Empleado y Cliente
                  </p>
                  <p className="text-sm">
                    <strong>✅ Datos realistas:</strong> Estadísticas y métricas
                  </p>
                  <p className="text-sm">
                    <strong>✅ Navegación:</strong> Dashboard personalizado por rol
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-green-300">
                  <p className="text-xs text-green-700">
                    <strong>Usuario actual:</strong> {user.email}
                  </p>
                  <p className="text-xs text-green-700">
                    <strong>Rol:</strong> {getRoleName()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Prueba diferentes usuarios para ver distintas funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem(
                      "currentUser",
                      JSON.stringify({
                        email: "admin@barbermanager.com",
                        name: "Carlos Administrador",
                        role: "admin",
                        description: "Dashboard completo, gestión total",
                      }),
                    )
                    window.location.reload()
                  }}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  👑 Cambiar a Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem(
                      "currentUser",
                      JSON.stringify({
                        email: "empleado@barbermanager.com",
                        name: "María Barbera",
                        role: "employee",
                        description: "Agenda personal, control horario",
                      }),
                    )
                    window.location.reload()
                  }}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  💼 Cambiar a Empleado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem(
                      "currentUser",
                      JSON.stringify({
                        email: "cliente@barbermanager.com",
                        name: "Juan Cliente",
                        role: "client",
                        description: "Reservar citas, ver historial",
                      }),
                    )
                    window.location.reload()
                  }}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  👤 Cambiar a Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
