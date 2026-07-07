"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { Service } from "@/lib/demo"

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Service | Omit<Service, "id">) => void
  service?: Service
}

export function ServiceModal({ isOpen, onClose, onSave, service }: ServiceModalProps) {
  const fieldClassName = "bg-[#1A1A1A] text-[#F0F0F0] placeholder:text-[#666666] border border-[#2E2E2E] focus:border-[#E53935] focus-visible:border-[#E53935]"

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    duration: "",
  })

  // Initialize form with service data when editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        price: service.price.toString(),
        duration: service.duration.toString(),
      })
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
      })
    }
  }, [service])

  const validateForm = () => {
    const newErrors = {
      name: "",
      price: "",
      duration: "",
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0"
    }

    const duration = parseInt(formData.duration)
    if (!formData.duration || isNaN(duration) || duration <= 0) {
      newErrors.duration = "La duración debe ser mayor a 0"
    }

    setErrors(newErrors)
    return !newErrors.name && !newErrors.price && !newErrors.duration
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const serviceData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
    }

    if (service) {
      onSave({ ...serviceData, id: service.id })
    } else {
      onSave(serviceData)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <Card role="dialog" aria-modal="true" aria-labelledby="service-modal-title" className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle id="service-modal-title">{service ? "Editar Servicio" : "Nuevo Servicio"}</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar modal">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Servicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Corte Clásico"
                className={fieldClassName}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ej. Corte tradicional con máquina y tijera"
                className={fieldClassName}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="ej. 150"
                className={fieldClassName}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duración (minutos) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="ej. 30"
                className={fieldClassName}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {service ? "Guardar Cambios" : "Crear Servicio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
