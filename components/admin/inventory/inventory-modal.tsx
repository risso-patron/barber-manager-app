"use client"

// M3 · Migrated onto FormModal + Field. Same props, same validation, same
// payloads. Native select kept (ORNO-tokened) to preserve exact behavior.

import { useState, useEffect } from "react"
import { type InventoryItem } from "@/lib/demo"
import { FormModal } from "@/components/ui/form-modal"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TrendingUp } from "lucide-react"

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (item: Partial<InventoryItem>) => void
  item?: InventoryItem | null
}

// Native select, ORNO-tokened (mirrors the Input primitive's surface).
const SELECT_CLS =
  "flex h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground transition-colors duration-micro ease-orno focus-visible:outline-none focus-visible:ring-[3px] focus-visible:border-primary focus-visible:ring-accent"

export function InventoryModal({ isOpen, onClose, onSubmit, item }: InventoryModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "", category: "producto", quantity: 0, minStock: 0,
    price: 0, salePrice: null, sku: "", supplier: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name, category: item.category,
        quantity: item.quantity, minStock: item.minStock,
        price: item.price, salePrice: item.salePrice ?? null,
        sku: item.sku ?? "", supplier: item.supplier || ""
      })
    } else {
      setFormData({ name: "", category: "producto", quantity: 0, minStock: 0, price: 0, salePrice: null, sku: "", supplier: "" })
    }
    setErrors({})
  }, [item, isOpen])

  const margin = formData.price && formData.salePrice && formData.salePrice > 0
    ? (((formData.salePrice - formData.price) / formData.salePrice) * 100).toFixed(1)
    : null

  const profit = formData.price && formData.salePrice
    ? (formData.salePrice - formData.price).toFixed(2)
    : null

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name?.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.category) newErrors.category = "La categoría es requerida"
    if (formData.quantity === undefined || formData.quantity < 0) newErrors.quantity = "La cantidad debe ser mayor o igual a 0"
    if (!formData.minStock || formData.minStock <= 0) newErrors.minStock = "El stock mínimo debe ser mayor a 0"
    if (!formData.price || formData.price <= 0) newErrors.price = "El precio de costo debe ser mayor a 0"
    if (formData.salePrice !== null && formData.salePrice !== undefined && formData.salePrice > 0 && formData.salePrice < (formData.price ?? 0)) {
      newErrors.salePrice = "El precio de venta no puede ser menor al costo"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData)
      setFormData({ name: "", category: "producto", quantity: 0, minStock: 0, price: 0, salePrice: null, sku: "", supplier: "" })
    }
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={item ? "Editar Artículo" : "Nuevo Artículo"}
      submitLabel={item ? "Actualizar" : "Crear"}
      onSubmit={handleSubmit}
      size="md"
    >
      <div className="grid grid-cols-3 gap-3">
        <Field label="Nombre" htmlFor="inv-name" required error={errors.name} className="col-span-2">
          <Input
            id="inv-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Shampoo Profesional"
            error={!!errors.name}
          />
        </Field>
        <Field label="SKU" htmlFor="inv-sku">
          <Input
            id="inv-sku"
            value={formData.sku ?? ""}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Ej: SH-001"
          />
        </Field>
      </div>

      <Field label="Categoría" htmlFor="inv-category" required error={errors.category}>
        <select
          id="inv-category"
          aria-label="Categoría"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem["category"] })}
          className={SELECT_CLS}
        >
          <option value="producto">Producto</option>
          <option value="herramienta">Herramienta</option>
          <option value="suministro">Suministro</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cantidad" htmlFor="inv-quantity" required error={errors.quantity}>
          <Input
            id="inv-quantity"
            type="number" min="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            error={!!errors.quantity}
          />
        </Field>
        <Field label="Stock Mínimo" htmlFor="inv-minstock" required error={errors.minStock}>
          <Input
            id="inv-minstock"
            type="number" min="1"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
            error={!!errors.minStock}
          />
        </Field>
      </div>

      {/* Precios */}
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">Precios</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Costo unitario" htmlFor="inv-price" required error={errors.price}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="inv-price"
                type="number" min="0" step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="pl-8"
                placeholder="0.00"
                error={!!errors.price}
              />
            </div>
          </Field>
          <Field label="Precio de venta" htmlFor="inv-saleprice" error={errors.salePrice}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="inv-saleprice"
                type="number" min="0" step="0.01"
                value={formData.salePrice ?? ""}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value ? parseFloat(e.target.value) : null })}
                className="pl-8"
                placeholder="0.00"
                error={!!errors.salePrice}
              />
            </div>
          </Field>
        </div>
        {margin && profit && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-success/25 bg-success-tint px-3.5 py-2.5">
            <TrendingUp className="h-4 w-4 shrink-0 text-success-text" aria-hidden="true" />
            <div className="text-[12.5px]">
              <span className="font-semibold text-success-text">Margen: {margin}%</span>
              <span className="ml-2 text-ink-600">· Ganancia por unidad: </span>
              <span className="font-semibold text-success-text">${profit}</span>
            </div>
          </div>
        )}
      </div>

      <Field label="Proveedor" htmlFor="inv-supplier">
        <Input
          id="inv-supplier"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          placeholder="Ej: Beauty Supply Co."
        />
      </Field>
    </FormModal>
  )
}
