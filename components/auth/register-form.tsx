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
  const [isNetworkError, setIsNetworkError] = useState(false)
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
    // Verificar si ya aceptó términos
    const consent = localStorage.getItem('userConsent');
    if (!consent) {
      // Mostrar modal de términos
      setPendingFormData(data);
      setShowTermsModal(true);
      return;
    }

    // Proceder con el registro
    await processRegistration(data);
  };

  const handleTermsAccept = async () => {
    setShowTermsModal(false);
    if (pendingFormData) {
      await processRegistration(pendingFormData);
      setPendingFormData(null);
    }
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    setPendingFormData(null);
    setError('Debes aceptar los términos para crear una cuenta');
  };

  const processRegistration = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    setIsNetworkError(false)

    try {
      // Check if we're in a preview environment
      const isPreview =
        window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("preview")

      if (isPreview) {
        // Simulate successful registration in preview mode
        setError(
          "Modo de demostración: El registro se ha simulado exitosamente. En producción, esto crearía una cuenta real.",
        )
        setTimeout(() => {
          router.push("/auth/login?demo=true")
        }, 2000)
        return
      }

      const supabase = createClient()

      // Test connection first
      const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)

      if (testError && testError.message.includes("Failed to fetch")) {
        throw new Error("NETWORK_ERROR")
      }

      // Sign up with Supabase Auth with metadata
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
        if (authError.message.includes("Failed to fetch") || authError.message.includes("NetworkError")) {
          throw new Error("NETWORK_ERROR")
        }
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
            role: "client",
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
    } catch (err: unknown) {
      console.error("Registration error:", err)
      const errMsg = err instanceof Error ? err.message : undefined
      if (errMsg === "NETWORK_ERROR" || errMsg?.includes("Failed to fetch")) {
        setIsNetworkError(true)
        setError(
          "Error de conexión. Esto puede ocurrir en el modo de vista previa. En producción, la aplicación funcionará correctamente.",
        )
      } else {
        setError("Error inesperado. Intenta nuevamente.")
      }
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
        {isNetworkError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo de Vista Previa:</strong> Esta es una demostración. En producción, la aplicación se conectará
              correctamente a Supabase.
            </AlertDescription>
          </Alert>
        )}

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
            <Alert variant={isNetworkError ? "default" : "destructive"}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNetworkError ? "Simular Registro" : "Crear Cuenta"}
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
