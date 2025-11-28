"use client"

import { useState, useEffect } from "react"
import { type InventoryItem } from "@/lib/demo-appointments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (item: Partial<InventoryItem>) => void
  item?: InventoryItem | null
}

export function InventoryModal({ isOpen, onClose, onSubmit, item }: InventoryModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    category: "producto",
    quantity: 0,
    minStock: 0,
    price: 0,
    supplier: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        minStock: item.minStock,
        price: item.price,
        supplier: item.supplier || ""
      })
    } else {
      setFormData({
        name: "",
        category: "producto",
        quantity: 0,
        minStock: 0,
        price: 0,
        supplier: ""
      })
    }
    setErrors({})
  }, [item, isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.category) {
      newErrors.category = "La categoría es requerida"
    }

    if (formData.quantity === undefined || formData.quantity < 0) {
      newErrors.quantity = "La cantidad debe ser mayor o igual a 0"
    }

    if (formData.minStock === undefined || formData.minStock <= 0) {
      newErrors.minStock = "El stock mínimo debe ser mayor a 0"
    }

    if (formData.price === undefined || formData.price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
      setFormData({
        name: "",
        category: "producto",
        quantity: 0,
        minStock: 0,
        price: 0,
        supplier: ""
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {item ? "Editar Artículo" : "Nuevo Artículo"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Shampoo Profesional"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="category">Categoría *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem["category"] })}
              className={`w-full px-3 py-2 border rounded-md ${errors.category ? "border-red-500" : ""}`}
            >
              <option value="producto">Producto</option>
              <option value="herramienta">Herramienta</option>
              <option value="suministro">Suministro</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <Label htmlFor="minStock">Stock Mínimo *</Label>
              <Input
                id="minStock"
                type="number"
                min="1"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className={errors.minStock ? "border-red-500" : ""}
              />
              {errors.minStock && <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="price">Precio *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className={`pl-7 ${errors.price ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <Label htmlFor="supplier">Proveedor</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Ej: Beauty Supply Co."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {item ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
