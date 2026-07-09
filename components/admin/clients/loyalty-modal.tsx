"use client"

// M3 · Fields migrated to Field/Input; dark hexes and solid red/green
// removed (Constitution: tinted semantics, never solid red). Keeps its
// M1 Dialog base: the icon title and mode-colored footer are behavior
// FormModal's standard shell doesn't model. Logic/fetch flow verbatim.
// CRM-2 · Textarea para motivo, notify() al completar, size-X, text-danger-text.

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
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/ui/field"
import { useNotify } from "@/components/ui/notify"
import { Gift, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Client } from "@/lib/demo"

interface Props {
  client: Client & { loyalty_points?: number }
  onClose: () => void
  onAdjusted: (newPoints: number) => void
}

export function LoyaltyModal({ client, onClose, onAdjusted }: Props) {
  const current = client.loyalty_points ?? 0
  const [mode, setMode] = useState<"add" | "subtract">("add")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notify = useNotify()

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

      const newBalance = data.new_balance ?? preview
      notify({
        kind: "success",
        title: mode === "add" ? "Puntos agregados." : "Puntos canjeados.",
        description: `Nuevo saldo: ${newBalance.toLocaleString("es-ES")} pts`,
      })
      onAdjusted(newBalance)
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
            <Gift className="size-5 text-warning-text" aria-hidden="true" />
            Puntos de Fidelidad — {client.name}
          </DialogTitle>
          <DialogDescription>
            Saldo actual: <strong>{current.toLocaleString("es-ES")} pts</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* Mode toggle */}
          <div className="flex overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setMode("add")}
              aria-pressed={mode === "add" ? "true" : "false"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-micro",
                mode === "add"
                  ? "bg-success-tint text-success-text"
                  : "bg-card text-ink-600 hover:bg-secondary"
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </button>
            <button
              type="button"
              onClick={() => setMode("subtract")}
              aria-pressed={mode === "subtract" ? "true" : "false"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors duration-micro",
                mode === "subtract"
                  ? "bg-danger-tint text-danger-text"
                  : "bg-card text-ink-600 hover:bg-secondary"
              )}
            >
              <Minus className="size-4" aria-hidden="true" />
              Canjear
            </button>
          </div>

          <Field label="Puntos" htmlFor="loyalty-amount">
            <Input
              id="loyalty-amount"
              type="number"
              min={1}
              max={mode === "subtract" ? current : undefined}
              placeholder="Ej. 50"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(null) }}
              required
            />
          </Field>

          <Field label="Motivo (opcional)" htmlFor="loyalty-desc">
            <Textarea
              id="loyalty-desc"
              placeholder={mode === "add" ? "Ej. Bono especial" : "Ej. Canje por descuento $10"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className="min-h-[72px]"
            />
          </Field>

          {/* Preview */}
          {isValid && (
            <p className="text-sm text-ink-600">
              Nuevo saldo:{" "}
              <span className={cn("font-semibold", preview < current ? "text-danger-text" : "text-success-text")}>
                {preview.toLocaleString("es-ES")} pts
              </span>
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-danger-text">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || loading}
              loading={loading}
              variant={mode === "subtract" ? "destructive" : "primary"}
            >
              {mode === "add" ? "Agregar puntos" : "Canjear puntos"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
