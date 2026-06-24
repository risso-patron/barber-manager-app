"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import Image from "next/image"
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

function tryDemoLogin(data: LoginInput): { ok: boolean; userName?: string } {
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

  return { ok: true, userName: demoUser.name }
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

    if (!supabase) {
      const demoLogin = tryDemoLogin(data)
      if (demoLogin.ok) {
        router.push("/dashboard")
        router.refresh()
        setIsLoading(false)
        return
      }

      setError("Credenciales inválidas para modo demo. Revisa email y contraseña.")
      setIsLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      const demoLogin = tryDemoLogin(data)
      if (demoLogin.ok) {
        router.push("/dashboard")
        router.refresh()
        setIsLoading(false)
        return
      }

      setError("Credenciales inválidas. Por favor, verifica tu email y contraseña.")
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <Card className="border border-[#252525] bg-[#161616] shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <Image 
            src="/orno_logo.svg" 
            alt="Ornō" 
            width={120} 
            height={48}
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F0]">Inicia Sesión</h1>
          <CardDescription className="text-[#8A8A8A]">
            Accede a tu cuenta de Ornō
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!hasSupabaseConfig && (
          <Alert className="bg-blue-950/30 border-blue-900/50">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              Modo demo activo. Usa las credenciales de demostración abajo.
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="bg-green-950/30 border-green-900/50">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="password" className="text-[#F0F0F0]">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-[#0E0E0E] border-[#252525] text-[#F0F0F0] placeholder:text-[#8A8A8A] focus:border-[#E53935] focus:ring-[#E53935] pr-10"
                {...register("password", {
                  required: "La contraseña es requerida",
                  minLength: {
                    value: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#F0F0F0] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-[#E53935]">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <Alert className="bg-red-950/30 border-red-900/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#E53935] text-white hover:bg-[#D32F2F] transition-colors font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesión
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              className="p-0 text-sm text-[#8A8A8A] hover:text-[#F0F0F0] h-auto"
              onClick={() => router.push("/auth/forgot-password")}
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#252525]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#161616] text-[#8A8A8A]">O</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm text-[#8A8A8A]">
            ¿No tienes cuenta?{" "}
            <Button 
              variant="ghost" 
              className="p-0 text-[#E53935] hover:text-[#F0F0F0] h-auto font-medium"
              onClick={() => router.push("/auth/register")}
            >
              Regístrate aquí
            </Button>
          </p>

          <div className="mt-6 p-3 bg-[#0E0E0E] border border-[#252525] rounded-lg space-y-2">
            <p className="text-xs font-medium text-[#E53935]">💡 Credenciales Demo</p>
            <div className="space-y-1 text-xs text-[#8A8A8A]">
              <p><span className="text-[#F0F0F0]">Admin:</span> admin@demo.com</p>
              <p><span className="text-[#F0F0F0]">Contraseña:</span> Demo1234</p>
              <hr className="border-[#252525] my-2" />
              <p><span className="text-[#F0F0F0]">Cliente:</span> client@demo.com</p>
              <p><span className="text-[#F0F0F0]">Contraseña:</span> Demo1234</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}