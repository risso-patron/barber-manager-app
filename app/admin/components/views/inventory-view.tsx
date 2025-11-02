"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface InventoryItem {
  id: string
  product_name: string
  quantity: number
  min_stock: number
  supplier?: string
  cost_per_unit?: number
  created_at: string
  updated_at: string
}

export function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('product_name', { ascending: true })

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) return

    const supabase = createClient()
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      toast.success('Cantidad actualizada correctamente')
      loadInventory()
    } else {
      toast.error('Error al actualizar la cantidad')
    }
  }

  const deleteItem = async (id: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar este producto?')
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Producto eliminado correctamente')
      loadInventory()
    } else {
      toast.error('Error al eliminar el producto')
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.supplier?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const lowStockItems = items.filter(item => item.quantity <= item.min_stock)

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Sin Stock', color: '#dc2626', bg: '#fee2e2' }
    if (item.quantity <= item.min_stock) return { label: 'Stock Bajo', color: '#f59e0b', bg: '#fef3c7' }
    return { label: 'Stock OK', color: '#10b981', bg: '#d1fae5' }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    )
  }

  return (
    <div>
      {/* Alertas de Stock Bajo */}
      {lowStockItems.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e' }}>
              Productos con Stock Bajo
            </h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {lowStockItems.map(item => (
              <span key={item.id} style={{ 
                padding: '0.375rem 0.75rem',
                background: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#92400e'
              }}>
                {item.product_name} ({item.quantity} uds)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
          📦 Gestión de Inventario
        </h2>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: '1',
              minWidth: '250px',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Total: {filteredItems.length} productos
        </div>
      </div>

      {/* Grid de Productos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ color: '#64748b' }}>No se encontraron productos</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const status = getStockStatus(item)
            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem', paddingRight: '4rem' }}>
                  {item.product_name}
                </h3>

                {/* Estado del stock */}
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: status.bg,
                  color: status.color,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  {status.label}
                </div>

                {/* Cantidad */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    <span>Cantidad Actual</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.quantity} uds</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b' }}>
                    <span>Stock Mínimo</span>
                    <span style={{ fontWeight: '600' }}>{item.min_stock} uds</span>
                  </div>
                </div>

                {/* Controles */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      padding: '0.5rem',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      padding: '0.5rem',
                      background: '#d1fae5',
                      color: '#065f46',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Última actualización */}
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', textAlign: 'center' }}>
                  Actualizado: {new Date(item.last_updated).toLocaleDateString('es-ES')}
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Eliminar Producto
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
