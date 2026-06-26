"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { DEMO_USERS } from "@/lib/demo-config"

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  const lower = value.toLowerCase()
  return (
    lower.includes("tu_") ||
    lower.includes("pega_aqui") ||
    lower.includes("aqui_") ||
    lower.includes("your-") ||
    lower.includes("your_")
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig =
  !isDemoMode &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

function tryDemoLogin(data: LoginInput): { ok: boolean; role?: string; userName?: string } {
  const demoUser = Object.values(DEMO_USERS).find(
    (user) => user.email.toLowerCase() === data.email.toLowerCase() && user.password === data.password,
  )

  if (!demoUser) {
    return { ok: false }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        profile: {
          name: demoUser.name,
          role: demoUser.role,
          phone: demoUser.phone,
          avatar_url: demoUser.avatar_url,
        },
      }),
    )
  }

  return { ok: true, role: demoUser.role, userName: demoUser.name }
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const msg = params.get("message")
    if (msg) setMessage(msg)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    if (isDemoMode || !supabase) {
      const demoLogin = tryDemoLogin(data)
      if (demoLogin.ok) {
        const roleMap: Record<string, string> = {
          admin: "/admin", manager: "/admin",
          employee: "/employee/dashboard", barber: "/barber", client: "/client",
        }
        router.push(roleMap[demoLogin.role ?? ""] || "/auth/login")
        router.refresh()
        setIsLoading(false)
        return
      }

      setError("Credenciales inválidas para modo demo.")
      setIsLoading(false)
      return
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError("Credenciales inválidas. Verifica tu email y contraseña.")
        setIsLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("No se pudo conectar con Supabase. Revisa la configuración del entorno.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img src="/orno_logo.svg" alt="Ornō" style={{ height: '48px', width: 'auto' }} />
          </div>
          <CardDescription>Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSupabaseConfig && process.env.NODE_ENV === "development" && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Modo demo activo. Configura las variables de Supabase en <code>.env.local</code> para habilitar autenticación real.
              </AlertDescription>
            </Alert>
          )}

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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password", {
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres",
                    },
                  })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm text-muted-foreground h-auto"
                onClick={() => router.push("/auth/forgot-password")}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Button variant="link" className="p-0" onClick={() => router.push("/auth/register")}>
                Regístrate aquí
              </Button>
            </p>
            {process.env.NODE_ENV === "development" && !hasSupabaseConfig && (
              <div className="text-xs text-gray-400 mt-4 space-y-1 border border-dashed border-gray-200 rounded p-2">
                <p className="font-medium text-gray-500">Demo (solo visible en desarrollo)</p>
                <p>admin@demo.com / Demo1234</p>
                <p>client@demo.com / Demo1234</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
