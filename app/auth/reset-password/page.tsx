"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createBrowserClient } from "@supabase/ssr"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setServerError(null)

    // MODO DEMO — sin Supabase configurado
    if (!supabase) {
      await new Promise((r) => setTimeout(r, 800))
      setSuccess(true)
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      // El caso más común es sesión expirada (el link ya se usó o pasaron >1 hora)
      if (
        error.message.toLowerCase().includes("session") ||
        error.message.toLowerCase().includes("expired") ||
        error.message.toLowerCase().includes("invalid")
      ) {
        setServerError(
          "El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo desde la pantalla de login."
        )
      } else {
        setServerError(error.message)
      }
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Redirigir al login tras 3 segundos
    setTimeout(() => {
      router.push(
        "/auth/login?message=" +
          encodeURIComponent("Contraseña actualizada. Inicia sesión con tu nueva contraseña.")
      )
    }, 3000)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src="/orno_logo.svg" alt="Ornō" className="h-12 w-auto" />
          </div>
          <CardTitle className="text-xl">Nueva contraseña</CardTitle>
          <CardDescription>
            Elige una contraseña segura para tu cuenta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Contraseña actualizada correctamente! Serás redirigido al inicio de sesión en
                  unos segundos.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => router.push("/auth/login")}>
                Ir al inicio de sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Requisitos visuales */}
              <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">La contraseña debe tener:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Mínimo 8 caracteres</li>
                  <li>Al menos una mayúscula (A-Z)</li>
                  <li>Al menos una minúscula (a-z)</li>
                  <li>Al menos un número (0-9)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {serverError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
