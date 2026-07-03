"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gift, Plus, Minus } from "lucide-react"
import type { Client } from "@/lib/demo-appointments"

interface Props {
  client: Client & { loyalty_points?: number }
  onClose: () => void
  onAdjusted: (newPoints: number) => void
}

export function LoyaltyModal({ client, onClose, onAdjusted }: Props) {
  const fieldClassName = "bg-[#1A1A1A] text-[#F0F0F0] placeholder:text-[#666666] border border-[#2E2E2E] focus:border-[#E53935] focus-visible:border-[#E53935]"

  const current = client.loyalty_points ?? 0
  const [mode, setMode] = useState<"add" | "subtract">("add")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = parseInt(amount, 10)
  const isValid = !isNaN(parsed) && parsed > 0
  const delta = mode === "subtract" ? -parsed : parsed
  const preview = isValid ? current + delta : current

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    if (mode === "subtract" && parsed > current) {
      setError("No hay suficientes puntos para este canje")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: client.id,
          points: delta,
          description: description || undefined,
        }),
      })

      const data = (await res.json()) as { success?: boolean; new_balance?: number; error?: string }

      if (!res.ok) {
        setError(data.error ?? "Error al ajustar puntos")
        return
      }

      onAdjusted(data.new_balance ?? preview)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" />
            Puntos de Fidelidad — {client.name}
          </DialogTitle>
          <DialogDescription>
            Saldo actual: <strong>{current.toLocaleString("es-ES")} pts</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                mode === "add"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
            <button
              type="button"
              onClick={() => setMode("subtract")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                mode === "subtract"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Minus className="h-4 w-4" />
              Canjear
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="loyalty-amount">Puntos</Label>
            <Input
              id="loyalty-amount"
              type="number"
              min={1}
              max={mode === "subtract" ? current : undefined}
              placeholder="Ej. 50"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(null) }}
              className={fieldClassName}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="loyalty-desc">Motivo (opcional)</Label>
            <Input
              id="loyalty-desc"
              placeholder={mode === "add" ? "Ej. Bono especial" : "Ej. Canje por descuento $10"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className={fieldClassName}
            />
          </div>

          {/* Preview */}
          {isValid && (
            <p className="text-sm text-gray-600">
              Nuevo saldo:{" "}
              <span className={`font-semibold ${preview < current ? "text-red-600" : "text-green-600"}`}>
                {preview.toLocaleString("es-ES")} pts
              </span>
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || loading}
              className={mode === "subtract" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {loading ? "Guardando…" : mode === "add" ? "Agregar puntos" : "Canjear puntos"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
