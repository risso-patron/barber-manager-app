"use client"

import { useState, useEffect } from "react"
import { type InventoryItem } from "@/lib/demo-appointments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, TrendingUp } from "lucide-react"

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (item: Partial<InventoryItem>) => void
  item?: InventoryItem | null
}

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
      setFormData({ name: "", category: "producto", quantity: 0, minStock: 0, price: 0, salePrice: null, sku: "", supplier: "" })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div style={{ background: "#1A1A1A", border: "1px solid #2E2E2E", borderRadius: 14 }} className="max-w-lg w-full max-h-[90vh] overflow-y-auto">

        <div style={{ borderBottom: "1px solid #2E2E2E" }} className="flex justify-between items-center px-6 py-4">
          <h2 style={{ color: "#F0F0F0", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 17, fontWeight: 600 }}>
            {item ? "Editar Artículo" : "Nuevo Artículo"}
          </h2>
          <button onClick={onClose} style={{ color: "#8A8A8A", background: "none", border: "none", cursor: "pointer" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Shampoo Profesional"
                style={{ background: "#111", borderColor: errors.name ? "#E53935" : "#2E2E2E", color: "#F0F0F0" }}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label style={{ color: "#8A8A8A", fontSize: 12 }}>SKU</Label>
              <Input
                value={formData.sku ?? ""}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ej: SH-001"
                style={{ background: "#111", borderColor: "#2E2E2E", color: "#F0F0F0" }}
              />
            </div>
          </div>

          <div>
            <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Categoría *</Label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem["category"] })}
              style={{ background: "#111", borderColor: errors.category ? "#E53935" : "#2E2E2E", color: "#F0F0F0", width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid", fontSize: 14 }}
            >
              <option value="producto">Producto</option>
              <option value="herramienta">Herramienta</option>
              <option value="suministro">Suministro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Cantidad *</Label>
              <Input
                type="number" min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                style={{ background: "#111", borderColor: errors.quantity ? "#E53935" : "#2E2E2E", color: "#F0F0F0" }}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Stock Mínimo *</Label>
              <Input
                type="number" min="1"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                style={{ background: "#111", borderColor: errors.minStock ? "#E53935" : "#2E2E2E", color: "#F0F0F0" }}
              />
              {errors.minStock && <p className="text-red-500 text-xs mt-1">{errors.minStock}</p>}
            </div>
          </div>

          <div style={{ background: "#111", border: "1px solid #2E2E2E", borderRadius: 10, padding: 16 }}>
            <p style={{ color: "#8A8A8A", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Precios</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Costo unitario *</Label>
                <div className="relative">
                  <span style={{ position: "absolute", left: 10, top: 9, color: "#8A8A8A", fontSize: 13 }}>$</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    style={{ background: "#161616", borderColor: errors.price ? "#E53935" : "#2E2E2E", color: "#F0F0F0", paddingLeft: 24 }}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Precio de venta</Label>
                <div className="relative">
                  <span style={{ position: "absolute", left: 10, top: 9, color: "#8A8A8A", fontSize: 13 }}>$</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={formData.salePrice ?? ""}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value ? parseFloat(e.target.value) : null })}
                    style={{ background: "#161616", borderColor: errors.salePrice ? "#E53935" : "#2E2E2E", color: "#F0F0F0", paddingLeft: 24 }}
                    placeholder="0.00"
                  />
                </div>
                {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice}</p>}
              </div>
            </div>
            {margin && profit && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#0F2E1A", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#22C55E", flexShrink: 0 }} />
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: "#22C55E", fontWeight: 600 }}>Margen: {margin}%</span>
                  <span style={{ color: "#8A8A8A", marginLeft: 8 }}>· Ganancia por unidad: </span>
                  <span style={{ color: "#22C55E", fontWeight: 600 }}>${profit}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label style={{ color: "#8A8A8A", fontSize: 12 }}>Proveedor</Label>
            <Input
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Ej: Beauty Supply Co."
              style={{ background: "#111", borderColor: "#2E2E2E", color: "#F0F0F0" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" style={{ borderColor: "#2E2E2E", color: "#8A8A8A" }}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" style={{ background: "#E53935", color: "#fff", border: "none" }}>
              {item ? "Actualizar" : "Crear"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}