"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Gift, Star, History, X, Loader2, CheckCircle, Bell } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

interface SignupPromptModalProps {
  isOpen: boolean
  onClose: () => void
  guestData: {
    name: string
    email?: string
    phone: string
  }
  /** Emitido por POST /api/bookings/public al completar la reserva (RH-002 · A1). */
  activationToken: string
}

export function SignupPromptModal({ isOpen, onClose, guestData, activationToken }: SignupPromptModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState(guestData.email || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const isFakeEmail = !guestData.email

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un email válido")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    // 1. Activar la cuenta (poner contraseña, actualizar email si era el fake)
    const res = await fetch("/api/auth/activate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: guestData.phone, email, password, token: activationToken }),
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      setError(result.error || "Error al crear la cuenta. Intenta nuevamente.")
      setIsLoading(false)
      return
    }

    // 2. Auto-login (si hay Supabase configurado)
    if (supabase) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password,
      })

      if (loginError) {
        setError("Cuenta activada, pero hubo un problema al iniciar sesión. Intenta desde la pantalla de login.")
        setIsLoading(false)
        return
      }
    }

    setSuccess(true)
    setIsLoading(false)

    // 3. Redirigir al dashboard del cliente
    setTimeout(() => {
      router.push("/client")
    }, 1500)
  }

  const handleSkip = () => {
    onClose()
    router.push("/")
  }

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">¡Bienvenido, {guestData.name.split(" ")[0]}!</h2>
            <p className="text-muted-foreground text-sm">
              Tu cuenta está activa. Redirigiendo a tu panel…
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-blue-600" />
            ¡Tu cita está confirmada!
          </DialogTitle>
          <DialogDescription>
            Crea tu cuenta gratis y gestiona todo desde tu panel
          </DialogDescription>
        </DialogHeader>

        {/* Benefits — el pitch de ventas */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-3 mb-2">
          <div className="flex items-start gap-3">
            <History className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Ve todas tus citas</p>
              <p className="text-xs text-gray-600">Historial completo, próximas reservas y cancelaciones fáciles</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Notificaciones y recordatorios</p>
              <p className="text-xs text-gray-600">Te avisamos antes de tu cita para que no la olvides</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Ofertas exclusivas</p>
              <p className="text-xs text-gray-600">Accede a promociones y descuentos solo para clientes registrados</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Reserva en segundos</p>
              <p className="text-xs text-gray-600">Tus datos guardados, próxima cita con un clic</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleActivate} className="space-y-3">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={guestData.name}
              disabled
              className="bg-gray-50 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">
              Email{isFakeEmail && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isFakeEmail}
              required
              placeholder="tu@email.com"
              className={`mt-1 ${!isFakeEmail ? "bg-gray-50" : ""}`}
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" disabled={isLoading} className="w-full gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Creando cuenta…</>
              ) : (
                <><User className="h-4 w-4" />Activar mi cuenta gratis</>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="w-full gap-2 text-gray-500"
            >
              <X className="h-4 w-4" />
              Tal vez después
            </Button>
          </div>
        </form>

        <p className="text-xs text-gray-400 text-center">
          Al crear una cuenta aceptas nuestros{" "}
          <a href="/terms" className="underline">términos y condiciones</a>
        </p>
      </DialogContent>
    </Dialog>
  )
}
