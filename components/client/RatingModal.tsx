"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { submitRatingSchema, type SubmitRatingInput } from "@/lib/schemas"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Star, Loader2, AlertCircle, CheckCircle } from "lucide-react"

interface Appointment {
  id: string
  serviceName: string
  employeeName: string
  date: string
  rating?: number | null
  review_text?: string | null
}

interface RatingModalProps {
  appointment: Appointment
  onSuccess: (rating: number, reviewText?: string) => void
}

const STAR_LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"]

export function RatingModal({ appointment, onSuccess }: RatingModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  const hasRating = Boolean(appointment.rating)

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SubmitRatingInput>({
    resolver: zodResolver(submitRatingSchema),
    defaultValues: {
      rating: appointment.rating ?? 0,
      review_text: appointment.review_text ?? "",
    },
  })

  const selectedRating = watch("rating")

  const onSubmit = async (data: SubmitRatingInput) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setServerError(json.error || "Error al guardar la calificación")
        return
      }

      setSubmitted(true)
      onSuccess(data.rating, data.review_text)

      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        reset()
      }, 1500)
    } catch {
      setServerError("Error de red. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      setServerError(null)
      setSubmitted(false)
      reset({
        rating: appointment.rating ?? 0,
        review_text: appointment.review_text ?? "",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={hasRating ? "secondary" : "outline"}>
          <Star className={`h-4 w-4 mr-1 ${hasRating ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {hasRating ? `${appointment.rating}★ Editar` : "Calificar"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {hasRating ? "Editar calificación" : "Calificar servicio"}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">{appointment.serviceName}</span>
          {" · "}
          {appointment.employeeName}
          {" · "}
          {new Date(appointment.date).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })}
        </div>

        {submitted ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Gracias por tu calificación!
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Star selector */}
            <div className="space-y-2">
              <Label>Tu calificación</Label>
              <Controller
                name="rating"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-1" onMouseLeave={() => setHoveredStar(0)}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (hoveredStar || field.value)
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredStar(star)}
                          className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none"
                          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              active
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              {(hoveredStar > 0 || selectedRating > 0) && (
                <p className="text-sm text-muted-foreground">
                  {STAR_LABELS[hoveredStar || selectedRating]}
                </p>
              )}
              {errors.rating && (
                <p className="text-sm text-destructive">{errors.rating.message}</p>
              )}
            </div>

            {/* Optional comment */}
            <div className="space-y-2">
              <Label htmlFor="review_text">
                Comentario <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="review_text"
                placeholder="Cuéntanos tu experiencia..."
                rows={3}
                disabled={isLoading}
                {...register("review_text")}
              />
              {errors.review_text && (
                <p className="text-sm text-destructive">{errors.review_text.message}</p>
              )}
            </div>

            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || selectedRating === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
