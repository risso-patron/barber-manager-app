"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, CheckCircle } from "lucide-react"
import Link from "next/link"

// Usuarios de demo
const DEMO_USERS = [
  {
    email: "admin@barbermanager.com",
    password: "admin123",
    name: "Carlos Administrador",
    role: "admin",
    description: "Dashboard completo, gestión total",
    color: "red",
  },
  {
    email: "empleado@barbermanager.com",
    password: "empleado123",
    name: "María Barbera",
    role: "employee",
    description: "Agenda personal, control horario",
    color: "blue",
  },
  {
    email: "cliente@barbermanager.com",
    password: "cliente123",
    name: "Juan Cliente",
    role: "client",
    description: "Reservar citas, ver historial",
    color: "green",
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Verificar credenciales
      const user = DEMO_USERS.find((u) => u.email === email && u.password === password)

      if (user) {
        // Guardar usuario en localStorage
        localStorage.setItem("currentUser", JSON.stringify(user))
        
        // Simular delay mínimo
        await new Promise((resolve) => setTimeout(resolve, 300))
        
        // Redirigir al dashboard
        window.location.href = "/dashboard"
      } else {
        setError("Credenciales inválidas. Usa uno de los usuarios de prueba.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error en login:", err)
      setError("Error al iniciar sesión. Intenta de nuevo.")
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoUser: (typeof DEMO_USERS)[0]) => {
    setIsLoading(true)
    setError("")
    
    try {
      // Guardar usuario en localStorage
      localStorage.setItem("currentUser", JSON.stringify(demoUser))
      
      // Simular delay mínimo
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Redirigir al dashboard
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("Error en demo login:", err)
      setError("Error al iniciar sesión. Intenta de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Barber Manager</CardTitle>
            <CardDescription>Inicia sesión en tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usuarios de prueba */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center text-sm">
              <Users className="h-4 w-4 mr-2" />
              Usuarios de Prueba - ¡Haz clic para probar!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              {DEMO_USERS.map((user, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className={`justify-start text-left h-auto p-3 bg-white hover:bg-blue-100 border border-${user.color}-200`}
                  onClick={() => handleDemoLogin(user)}
                  disabled={isLoading}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-${user.color}-700`}>
                        {user.role === "admin" && "👑"} {user.role === "employee" && "💼"}{" "}
                        {user.role === "client" && "👤"} {user.name}
                      </p>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <p className="text-xs text-gray-600">
                      {user.email} / {user.password}
                    </p>
                    <p className={`text-xs text-${user.color}-600 mt-1`}>{user.description}</p>
                  </div>
                </Button>
              ))}
            </div>

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-xs">
                <strong>¡Sistema Demo Listo!</strong> Haz clic en cualquier usuario para acceder instantáneamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
