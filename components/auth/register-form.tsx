"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsModal } from "@/components/auth/terms-modal"
import { Loader2, AlertCircle, ChevronRight } from "lucide-react"

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
    const consent = localStorage.getItem('userConsent');
    if (!consent) {
      setPendingFormData(data);
      setShowTermsModal(true);
      return;
    }
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
      const isPreview =
        window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("preview")

      if (isPreview) {
        setError(
          "Modo de demostración: El registro se ha simulado exitosamente. En producción, esto crearía una cuenta real.",
        )
        setTimeout(() => {
          router.push("/auth/login?demo=true")
        }, 2000)
        return
      }

      const supabase = createClient()

      const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)

      if (testError && testError.message.includes("Failed to fetch")) {
        throw new Error("NETWORK_ERROR")
      }

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
        try {
          const { error: profileError } = await supabase.from("users").insert({
            id: authData.user.id,
            name: data.name,
            email: data.email,
            role: "client",
            phone: data.phone || null,
          })

          if (profileError && !profileError.message.includes("duplicate key")) {
            console.error("Profile creation error:", profileError)
          }
        } catch (profileErr) {
          console.error("Profile creation failed:", profileErr)
        }

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
      
      <Card className="border border-[#252525] bg-[#161616] shadow-xl w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[#F0F0F0]">Crear Cuenta</h1>
          <CardDescription className="text-[#8A8A8A]">
            Únete a Ornō hoy mismo
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {isNetworkError && (
            <Alert className="bg-yellow-950/30 border-yellow-900/50">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200 text-sm">
                <strong>Modo de Vista Previa:</strong> Esta es una demostración. En producción funcionará correctamente.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#F0F0F0]">
                Nombre Completo
              </Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                className="bg-[#0E0E0E] border-[#252525] text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:border-[#E53935] focus:ring-[#E53935]"
                {...register("name", {
                  required: "El nombre es requerido",
                  minLength: {
                    value: 2,
                    message: "El nombre debe tener al menos 2 caracteres",
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-[#E53935]">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#F0F0F0]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="bg-[#0E0E0E] border-[#252525] text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:border-[#E53935] focus:ring-[#E53935]"
                {...register("email", {
                  required: "El email es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido",
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-[#E53935]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#F0F0F0]">
                Teléfono <span className="text-[#8A8A8A]">(Opcional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                className="bg-[#0E0E0E] border-[#252525] text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:border-[#E53935] focus:ring-[#E53935]"
                {...register("phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#F0F0F0]">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-[#0E0E0E] border-[#252525] text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:border-[#E53935] focus:ring-[#E53935]"
                {...register("password", {
                  required: "La contraseña es requerida",
                  minLength: {
                    value: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-[#E53935]">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#F0F0F0]">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-[#0E0E0E] border-[#252525] text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:border-[#E53935] focus:ring-[#E53935]"
                {...register("confirmPassword", {
                  required: "Confirma tu contraseña",
                  validate: (value) => value === password || "Las contraseñas no coinciden",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-[#E53935]">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <Alert className={isNetworkError ? "bg-yellow-950/30 border-yellow-900/50" : "bg-red-950/30 border-red-900/50"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className={isNetworkError ? "text-yellow-200" : "text-red-200"}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#E53935] text-white hover:bg-[#D32F2F] transition-colors font-medium group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  {isNetworkError ? "Simular Registro" : "Crear Cuenta"}
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#252525]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#161616] text-[#8A8A8A]">O</span>
            </div>
          </div>

          <p className="text-center text-sm text-[#8A8A8A]">
            ¿Ya tienes cuenta?{" "}
            <Button 
              variant="ghost" 
              className="p-0 text-[#E53935] hover:text-[#F0F0F0] h-auto font-medium"
              onClick={() => router.push("/auth/login")}
            >
              Inicia sesión aquí
            </Button>
          </p>
        </CardContent>
      </Card>
    </>
  )
}