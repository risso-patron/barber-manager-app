"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { useDemoAuth } from "@/lib/demo-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Users } from "lucide-react"

interface LoginFormData {
  email: string
  password: string
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useDemoAuth()

  const message = searchParams.get("message")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await login(data.email, data.password)

      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Error de autenticación")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (email: string, password: string) => {
    setValue("email", email)
    setValue("password", password)
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Error en login demo")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para auto-rellenar credenciales
  const fillCredentials = (email: string, password: string) => {
    setValue("email", email)
    setValue("password", password)
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Barber Manager</CardTitle>
          <CardDescription>Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register("email", {
                  required: "El email es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "La contraseña es requerida",
                  minLength: {
                    value: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                })}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
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
              <Button variant="link" className="p-0" onClick={() => router.push("/auth/register")}>
                Regístrate aquí
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credenciales de prueba */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center text-sm">
            <Users className="h-4 w-4 mr-2" />
            Usuarios de Prueba - ¡Haz clic para probar!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-left h-auto p-3 bg-white hover:bg-blue-100 border border-red-200"
              onClick={() => handleDemoLogin("admin@barbermanager.com", "admin123")}
              disabled={isLoading}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-red-700">👑 Administrador</p>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <p className="text-xs text-gray-600">admin@barbermanager.com / admin123</p>
                <p className="text-xs text-red-600 mt-1">Dashboard completo, gestión total</p>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-left h-auto p-3 bg-white hover:bg-blue-100 border border-blue-200"
              onClick={() => handleDemoLogin("empleado@barbermanager.com", "empleado123")}
              disabled={isLoading}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-blue-700">💼 Empleado</p>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <p className="text-xs text-gray-600">empleado@barbermanager.com / empleado123</p>
                <p className="text-xs text-blue-600 mt-1">Agenda personal, control horario</p>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-left h-auto p-3 bg-white hover:bg-blue-100 border border-green-200"
              onClick={() => handleDemoLogin("cliente@barbermanager.com", "cliente123")}
              disabled={isLoading}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-green-700">👤 Cliente</p>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <p className="text-xs text-gray-600">cliente@barbermanager.com / cliente123</p>
                <p className="text-xs text-green-600 mt-1">Reservar citas, ver historial</p>
              </div>
            </Button>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs">
              <strong>¡Sistema Demo Listo!</strong> Haz clic en cualquier usuario para acceder instantáneamente. No
              necesitas Supabase configurado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
