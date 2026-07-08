"use client"

// M3 · Migrated onto FormModal + Field. Same props, same validation,
// same onSave payloads — only the modal shell and inputs changed.

import { useState, useEffect } from "react"
import { FormModal } from "@/components/ui/form-modal"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Service } from "@/lib/demo"

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Service | Omit<Service, "id">) => void
  service?: Service
}

export function ServiceModal({ isOpen, onClose, onSave, service }: ServiceModalProps) {
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

  const handleSubmit = () => {
    if (!validateForm()) return

    const serviceData = {
      name: formData.name.trim(),
      description: formData.description.trim() || "",
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
    }

    if (service) {
      onSave({ ...serviceData, id: service.id, category: service.category, isActive: service.isActive })
    } else {
      onSave({ ...serviceData, category: "other", isActive: true })
    }
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={service ? "Editar Servicio" : "Nuevo Servicio"}
      submitLabel={service ? "Guardar Cambios" : "Crear Servicio"}
      onSubmit={handleSubmit}
      size="sm"
    >
      <Field label="Nombre del Servicio" htmlFor="name" required error={errors.name || undefined}>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="ej. Corte Clásico"
          error={!!errors.name}
        />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="description">
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="ej. Corte tradicional con máquina y tijera"
        />
      </Field>

      <Field label="Precio ($)" htmlFor="price" required error={errors.price || undefined}>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="ej. 150"
          error={!!errors.price}
        />
      </Field>

      <Field label="Duración (minutos)" htmlFor="duration" required error={errors.duration || undefined}>
        <Input
          id="duration"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="ej. 30"
          error={!!errors.duration}
        />
      </Field>
    </FormModal>
  )
}
