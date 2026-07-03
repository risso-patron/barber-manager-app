"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Check } from "lucide-react"
import type { Employee } from "@/lib/demo-appointments"

interface EmployeeWithCommission extends Employee {
  specialty?: string | null
  commission_rate?: number | null
}

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (employee: Omit<EmployeeWithCommission, "id"> | EmployeeWithCommission) => void
  employee?: EmployeeWithCommission
}

// Los 4 niveles de acceso del sistema — determinan qué ve cada empleado
const SPECIALTIES = [
  { label: "Barbero / Estilista", value: "barbero",       role: "employee" as const, desc: "Ve su agenda, citas del día, control horario y sus estadísticas" },
  { label: "Recepcionista",       value: "recepcionista", role: "employee" as const, desc: "Ve agenda completa, gestiona clientes y citas" },
  { label: "Cajero/a",            value: "cajero",        role: "employee" as const, desc: "Ve agenda completa e inventario de productos" },
  { label: "Gerente",             value: "gerente",       role: "employee" as const, desc: "Acceso completo: agenda, clientes, inventario y estadísticas" },
]

const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Avery",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Destiny",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Gabe",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Hunter",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Isabella",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Kate",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Liam",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Nate",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Olivia",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Parker",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Quinn",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Ryan",
]

export function EmployeeModal({ isOpen, onClose, onSave, employee }: EmployeeModalProps) {
  const fieldClassName = "bg-[#1A1A1A] text-[#F0F0F0] placeholder:text-[#666666] border border-[#2E2E2E] focus:border-[#E53935] focus-visible:border-[#E53935]"

  const defaultSpecialty = (employee as { specialty?: string } | undefined)?.specialty || "barbero"
  const defaultRole = SPECIALTIES.find(s => s.value === defaultSpecialty)?.role || "employee"

  const [formData, setFormData] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    role: defaultRole,
    specialty: defaultSpecialty,
    avatar: employee?.avatar || "",
    commission_rate: employee?.commission_rate !== null && employee?.commission_rate !== undefined
      ? parseFloat((employee.commission_rate * 100).toFixed(2))
      : 0,
  })

  const handleSpecialtyChange = (value: string) => {
    const spec = SPECIALTIES.find(s => s.value === value)!
    setFormData({ ...formData, specialty: value, role: spec.role })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      commission_rate: formData.commission_rate > 0
        ? parseFloat((formData.commission_rate / 100).toFixed(4))
        : null,
    }
    if (employee) {
      onSave({ ...payload, id: employee.id })
    } else {
      onSave(payload)
    }
  }

  if (!isOpen) return null

  const selectedSpec = SPECIALTIES.find(s => s.value === formData.specialty)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-lg w-full flex flex-col max-h-[90vh]">
        {/* Header fijo */}
        <div className="border-b px-6 py-4 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-bold">
            {employee ? "Editar Empleado" : "Nuevo Empleado"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scroll body */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Roberto Gómez"
                className={fieldClassName}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="roberto@barbershop.com"
                autoComplete="email"
                className={fieldClassName}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-0200"
                autoComplete="tel"
                className={fieldClassName}
              />
            </div>

            {/* Especialidad */}
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad / Puesto *</Label>
              <select
                id="specialty"
                aria-label="Especialidad"
                required
                value={formData.specialty}
                onChange={(e) => handleSpecialtyChange(e.target.value)}
                className={`flex h-10 w-full rounded-md px-3 py-2 text-sm ${fieldClassName}`}
              >
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {selectedSpec && (
                <p className="text-xs text-gray-500">{selectedSpec.desc}</p>
              )}
            </div>

            {/* Comisión */}
            <div className="space-y-2">
              <Label htmlFor="commission_rate">
                Comisión{" "}
                <span className="text-muted-foreground font-normal">(% sobre servicio, opcional)</span>
              </Label>
              <div className="relative">
                <input
                  id="commission_rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={formData.commission_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })
                  }
                  className={`flex h-10 w-full rounded-md px-3 py-2 pr-8 text-sm ${fieldClassName}`}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-gray-400">
                {formData.commission_rate > 0
                  ? `En una cita de $100 → comisión $${formData.commission_rate.toFixed(2)}`
                  : "Sin comisión configurada"}
              </p>
            </div>

            {/* Avatar — 15 presets */}
            <div className="space-y-3">
              <Label>Avatar</Label>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: url })}
                    className={`relative rounded-full overflow-hidden border-2 transition-all w-14 h-14 mx-auto block ${
                      formData.avatar === url
                        ? "border-black ring-2 ring-black ring-offset-2"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover bg-gray-100" />
                    {formData.avatar === url && (
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {!formData.avatar && (
                <p className="text-xs text-gray-400">Seleccioná un avatar (opcional)</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {employee ? "Guardar Cambios" : "Crear Empleado"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
