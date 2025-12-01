"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Lock, Gift, Star, History, X } from "lucide-react"

interface SignupPromptModalProps {
  isOpen: boolean
  onClose: () => void
  guestData: {
    name: string
    email?: string
    phone: string
  }
}

export function SignupPromptModal({ isOpen, onClose, guestData }: SignupPromptModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validations
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (!guestData.email) {
      setError("Necesitas un email para crear una cuenta")
      return
    }

    setIsCreating(true)

    try {
      // TODO: Integrar con Supabase cuando esté configurado
      // Por ahora, simular registro en modo demo
      
      const newUser = {
        id: `user-${Date.now()}`,
        email: guestData.email,
        name: guestData.name,
        phone: guestData.phone,
        role: "client",
        profile: {
          name: guestData.name,
          role: "client",
          phone: guestData.phone,
          avatar_url: null,
        }
      }

      // Guardar usuario en localStorage (demo mode)
      localStorage.setItem("currentUser", JSON.stringify(newUser))

      // Migrar citas de invitado a cuenta
      const guestAppointments = JSON.parse(localStorage.getItem("guestAppointments") || "[]")
      const userAppointments = guestAppointments.filter((apt: any) => 
        apt.phone === guestData.phone || apt.email === guestData.email
      )
      localStorage.setItem("userAppointments", JSON.stringify(userAppointments))

      // Limpiar citas de invitado migradas
      const remainingGuest = guestAppointments.filter((apt: any) => 
        apt.phone !== guestData.phone && apt.email !== guestData.email
      )
      localStorage.setItem("guestAppointments", JSON.stringify(remainingGuest))

      // Redirigir al dashboard del cliente
      router.push("/client")
    } catch (err) {
      setError("Error al crear la cuenta. Intenta nuevamente.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleSkip = () => {
    onClose()
    // Opcional: redirigir a inicio
    router.push("/")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-blue-600" />
            ¡Crea tu cuenta y obtén beneficios!
          </DialogTitle>
          <DialogDescription>
            Convierte tu reserva en una cuenta y disfruta de estas ventajas
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <History className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Historial de citas</p>
              <p className="text-xs text-gray-600">Ve todas tus citas pasadas y futuras</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Star className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Programa de puntos</p>
              <p className="text-xs text-gray-600">Acumula puntos y obtén descuentos</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Perfil personalizado</p>
              <p className="text-xs text-gray-600">Guarda tus preferencias y datos</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {/* Pre-filled data */}
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={guestData.name}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={guestData.email || ""}
              disabled={!!guestData.email}
              required
              className={guestData.email ? "bg-gray-50" : ""}
            />
            {!guestData.email && (
              <p className="text-xs text-red-600 mt-1">
                Necesitas agregar un email para crear tu cuenta
              </p>
            )}
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
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              disabled={isCreating || !guestData.email}
              className="w-full gap-2"
            >
              <User className="h-4 w-4" />
              {isCreating ? "Creando cuenta..." : "Crear mi cuenta gratis"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost" 
              onClick={handleSkip}
              className="w-full gap-2 text-gray-600"
            >
              <X className="h-4 w-4" />
              Tal vez después
            </Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center">
          Al crear una cuenta aceptas nuestros términos y condiciones
        </p>
      </DialogContent>
    </Dialog>
  )
}
