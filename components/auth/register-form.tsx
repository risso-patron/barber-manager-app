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
import { TermsModal } from "@/components/auth/terms-modal"
import { Loader2, AlertCircle } from "lucide-react"

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
}

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<RegisterFormData | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>()
  const password = watch("password")

  const onSubmit = async (data: RegisterFormData) => {
    const consent = localStorage.getItem("userConsent")
    if (!consent) {
      setPendingFormData(data)
      setShowTermsModal(true)
      return
    }
    await processRegistration(data)
  }

  const handleTermsAccept = async () => {
    setShowTermsModal(false)
    if (pendingFormData) {
      await processRegistration(pendingFormData)
      setPendingFormData(null)
    }
  }

  const handleTermsDecline = () => {
    setShowTermsModal(false)
    setPendingFormData(null)
    setError("Debes aceptar los términos para crear una cuenta")
  }

  const processRegistration = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    // Sin Supabase configurado: redirigir con mensaje en lugar de mostrar error técnico
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      router.push(
        "/auth/login?message=" +
          encodeURIComponent(
            "El registro no está disponible en modo demo. Iniciá sesión con las credenciales de prueba."
          )
      )
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: "client",
            phone: data.phone || null,
          },
        },
      })

      if (authError) {
        setError("No se pudo crear la cuenta. Verificá que el email no esté ya registrado.")
        return
      }

      if (authData.user) {
        try {
          await supabase.from("users").insert({
            id: authData.user.id,
            name: data.name,
            email: data.email,
            role: "client",
            phone: data.phone || null,
          })
        } catch {
          // El trigger de Supabase puede haber creado el perfil antes — ignorar
        }
        router.push("/auth/login?message=Registro exitoso. Revisa tu email para confirmar tu cuenta.")
      }
    } catch {
      setError("Error de conexión. Verificá tu conexión a internet e intentá nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>Regístrate en Ornō</CardDescription>
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
                  minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres" },
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
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", {
                  required: "La contraseña es requerida",
                  minLength: { value: 6, message: "La contraseña debe tener al menos 6 caracteres" },
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
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
    </>
  )
}
