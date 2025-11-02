"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  min_stock: number
}

export function InventoryModal({ isOpen, onClose, onSuccess }: InventoryModalProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: '',
    min_stock: 0
  })

  useEffect(() => {
    if (isOpen) {
      loadInventory()
    }
  }, [isOpen])

  const loadInventory = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('inventory')
        .insert({
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          min_stock: formData.min_stock
        })

      if (error) throw error

      toast.success('Producto agregado correctamente')
      await loadInventory()
      setShowAddForm(false)
      resetForm()
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error
      toast.success('Cantidad actualizada correctamente')
      await loadInventory()
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la cantidad')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', quantity: 0, unit: '', min_stock: 0 })
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
            Gestión de Inventario
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                marginBottom: '1.5rem'
              }}
            >
              + Agregar Producto
            </button>
          )}

          {showAddForm && (
            <form onSubmit={handleAddItem} style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Nuevo Producto
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Unidad *
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    placeholder="ej: ml, g, pcs"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Cantidad inicial *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Stock mínimo *
                  </label>
                  <input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    background: loading ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Agregando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Producto
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                    Stock
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                    Mín.
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                    Estado
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLowStock = item.quantity <= item.min_stock
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        {item.min_stock} {item.unit}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: isLowStock ? '#fee2e2' : '#d1fae5',
                          color: isLowStock ? '#dc2626' : '#059669'
                        }}>
                          {isLowStock ? '⚠️ Bajo' : '✓ OK'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity === 0}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: item.quantity === 0 ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {items.length === 0 && !showAddForm && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#64748b',
                fontSize: '0.875rem'
              }}>
                No hay productos en el inventario. Agrega el primero.
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
