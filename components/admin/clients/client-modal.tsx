"use client"

// M3 · Migrated onto FormModal + Field. Same props, same validation,
// same onSave payloads — only the modal shell and inputs changed.

import { useState, useEffect } from "react"
import { FormModal } from "@/components/ui/form-modal"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Client } from "@/lib/demo"

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (client: Client | Omit<Client, "id">) => void
  client?: Client
}

export function ClientModal({ isOpen, onClose, onSave, client }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
  })

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Initialize form with client data when editing
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive !== false,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        isActive: true,
      })
    }
  }, [client])

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "El teléfono debe tener 10 dígitos"
    }

    setErrors(newErrors)
    return !newErrors.name && !newErrors.email && !newErrors.phone
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const clientData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      isActive: formData.isActive,
    }

    if (client) {
      onSave({
        ...clientData,
        id: client.id,
        createdAt: client.createdAt,
      })
    } else {
      onSave(clientData)
    }
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={client ? "Editar Cliente" : "Nuevo Cliente"}
      submitLabel={client ? "Guardar Cambios" : "Crear Cliente"}
      onSubmit={handleSubmit}
      size="sm"
    >
      <Field label="Nombre Completo" htmlFor="name" required error={errors.name || undefined}>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="ej. Juan Pérez"
          error={!!errors.name}
        />
      </Field>

      <Field label="Email" htmlFor="email" required error={errors.email || undefined}>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="ej. juan@example.com"
          error={!!errors.email}
        />
      </Field>

      <Field label="Teléfono" htmlFor="phone" required error={errors.phone || undefined}>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="ej. 1234567890"
          error={!!errors.phone}
        />
      </Field>

      {/* Active Status */}
      {client && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            aria-label="Cliente activo"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="size-4 rounded border-border accent-[hsl(var(--primary))]"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Cliente activo
          </Label>
        </div>
      )}
    </FormModal>
  )
}
