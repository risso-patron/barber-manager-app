"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: "client" | "employee"
  phone?: string
}

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<"client" | "employee">("client")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>()
  const password = watch("password")

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Sign up with Supabase Auth with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: selectedRole,
            phone: data.phone || null,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Try to create user profile manually if trigger doesn't work
        try {
          const { error: profileError } = await supabase.from("users").insert({
            id: authData.user.id,
            name: data.name,
            email: data.email,
            role: selectedRole,
            phone: data.phone || null,
          })

          // Ignore error if user already exists (trigger worked)
          if (profileError && !profileError.message.includes("duplicate key")) {
            console.error("Profile creation error:", profileError)
          }
        } catch (profileErr) {
          console.error("Profile creation failed:", profileErr)
        }

        // Show success message and redirect
        router.push("/auth/login?message=Registro exitoso. Revisa tu email para confirmar tu cuenta.")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>Regístrate en Barber Manager</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              {...register("name", {
                required: "El nombre es requerido",
                minLength: {
                  value: 2,
                  message: "El nombre debe tener al menos 2 caracteres",
                },
              })}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

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
            <Label htmlFor="phone">Teléfono (Opcional)</Label>
            <Input id="phone" type="tel" placeholder="+1234567890" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Usuario</Label>
            <Select value={selectedRole} onValueChange={(value: "client" | "employee") => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="employee">Empleado</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword", {
                required: "Confirma tu contraseña",
                validate: (value) => value === password || "Las contraseñas no coinciden",
              })}
            />
            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cuenta
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Button variant="link" className="p-0" onClick={() => router.push("/auth/login")}>
              Inicia sesión aquí
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
