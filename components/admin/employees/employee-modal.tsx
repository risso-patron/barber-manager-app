"use client"

// M3 · Migrated onto FormModal + Field. Same props, same payloads, same
// native-select validation semantics (radix Select deferred: swapping would
// drop the native `required` behavior — that's a business-rule change).

import { useState } from "react"
import { FormModal } from "@/components/ui/form-modal"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

interface EmployeeWithCommission {
  id?: string
  name: string
  email: string
  phone: string
  role: string
  avatar?: string
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

// Native select, ORNO-tokened (mirrors the Input primitive's surface).
const SELECT_CLS =
  "flex h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground transition-colors duration-micro ease-orno focus-visible:outline-none focus-visible:ring-[3px] focus-visible:border-primary focus-visible:ring-accent"

export function EmployeeModal({ isOpen, onClose, onSave, employee }: EmployeeModalProps) {
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

  const handleSubmit = () => {
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

  const selectedSpec = SPECIALTIES.find(s => s.value === formData.specialty)

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={employee ? "Editar Empleado" : "Nuevo Empleado"}
      submitLabel={employee ? "Guardar Cambios" : "Crear Empleado"}
      onSubmit={handleSubmit}
      size="md"
    >
      <Field label="Nombre Completo" htmlFor="name" required>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Roberto Gómez"
        />
      </Field>

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="roberto@barbershop.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Teléfono" htmlFor="phone" required>
        <Input
          id="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="555-0200"
          autoComplete="tel"
        />
      </Field>

      <Field label="Especialidad / Puesto" htmlFor="specialty" required help={selectedSpec?.desc}>
        <select
          id="specialty"
          aria-label="Especialidad"
          required
          value={formData.specialty}
          onChange={(e) => handleSpecialtyChange(e.target.value)}
          className={SELECT_CLS}
        >
          {SPECIALTIES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Comisión (% sobre servicio, opcional)"
        htmlFor="commission_rate"
        help={
          formData.commission_rate > 0
            ? `En una cita de $100 → comisión $${formData.commission_rate.toFixed(2)}`
            : "Sin comisión configurada"
        }
      >
        <div className="relative">
          <Input
            id="commission_rate"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={formData.commission_rate}
            onChange={(e) =>
              setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })
            }
            className="pr-9"
            placeholder="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
      </Field>

      {/* Avatar — 15 presets */}
      <div className="flex flex-col gap-3">
        <Label>Avatar</Label>
        <div className="grid grid-cols-5 gap-3">
          {PRESET_AVATARS.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setFormData({ ...formData, avatar: url })}
              className={`relative mx-auto block size-14 overflow-hidden rounded-full border-2 transition-all ${
                formData.avatar === url
                  ? "border-primary ring-2 ring-ring ring-offset-2"
                  : "border-border hover:border-ink-300"
              }`}
            >
              <img src={url} alt={`Avatar ${i + 1}`} className="h-full w-full bg-secondary object-cover" />
              {formData.avatar === url && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        {!formData.avatar && (
          <p className="text-[13px] text-ink-400">Seleccioná un avatar (opcional)</p>
        )}
      </div>
    </FormModal>
  )
}
