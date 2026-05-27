"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface LoginFormData {
  email: string
  password: string
}

export function LoginFormNew() {
  const router = useRouter()
  const { signIn, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    const success = await signIn(data)
    if (success) {
      router.push("/dashboard")
      router.refresh()
    }
  }

  const demoAccounts = [
    {
      email: "admin@barbermanager.com",
      password: "admin123",
      role: "👑 Administrador",
      desc: "Acceso completo al sistema",
    },
    {
      email: "empleado@barbermanager.com",
      password: "empleado123",
      role: "💼 Empleado",
      desc: "Agenda y estadísticas",
    },
    {
      email: "cliente@barbermanager.com",
      password: "cliente123",
      role: "👤 Cliente",
      desc: "Reservar citas",
    },
  ]

  const fillDemoAccount = (email: string, password: string) => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement

    if (emailInput && passwordInput) {
      emailInput.value = email
      passwordInput.value = password
      emailInput.dispatchEvent(new Event("change", { bubbles: true }))
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src="/orno_logo.svg" alt="Ornō" style={{ height: '48px', width: 'auto' }} />
          </div>
          <CardDescription>Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                disabled={isLoading || isSubmitting}
                {...register("email", {
                  required: "El email es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isLoading || isSubmitting}
                  {...register("password", {
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 6,
                      message: "Mínimo 6 caracteres",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting}
              size="lg"
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Demo Accounts Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-base">
            📋 Cuentas de Prueba
          </CardTitle>
          <CardDescription className="text-blue-700">
            Haz clic para auto-rellenar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {demoAccounts.map((account, idx) => (
            <button
              key={idx}
              onClick={() => fillDemoAccount(account.email, account.password)}
              disabled={isLoading || isSubmitting}
              className="w-full text-left p-3 bg-white hover:bg-blue-100 disabled:opacity-50 border border-blue-200 rounded-lg transition-colors"
            >
              <div>
                <p className="font-medium text-sm">{account.role}</p>
                <p className="text-xs text-gray-600">{account.email}</p>
                <p className="text-xs text-blue-600 mt-1">{account.desc}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}