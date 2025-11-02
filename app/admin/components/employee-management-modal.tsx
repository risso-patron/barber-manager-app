"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'
import type { EmployeePosition } from "@/lib/types"

interface EmployeeManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EmployeeManagementModal({ isOpen, onClose, onSuccess }: EmployeeManagementModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'barber' as 'barber' | 'secretary' | 'admin',
    employee_position: 'barbero' as EmployeePosition
  })

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      })

      if (authError) throw authError

      // Insertar en tabla users
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.role,
            employee_position: formData.employee_position,
            is_active: true
          })

        if (dbError) throw dbError
      }

      const roleNames: Record<string, string> = {
        admin: 'Administrador',
        barber: 'Barbero',
        secretary: 'Asistente',
      }
      
      toast.success(`${roleNames[formData.role]} agregado correctamente`)
      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el empleado')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: 'barber', employee_position: 'barbero' })
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
        maxWidth: '800px',
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
            ➕ Agregar Nuevo Empleado
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

          <form onSubmit={handleAddEmployee} style={{
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Nuevo Empleado
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Nombre completo *
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    Rol *
                  </label>
                                    <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="barber">💼 Barbero</option>
                    <option value="secretary">📋 Asistente</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Posición *
                  </label>
                  <select
                    value={formData.employee_position}
                    onChange={(e) => setFormData({ ...formData, employee_position: e.target.value as EmployeePosition })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="barbero">✂️ Barbero (registra citas y ventas)</option>
                    <option value="dueno">👔 Dueño (contabilidad y compras)</option>
                    <option value="recepcionista">📞 Recepcionista (apoyo en limpieza)</option>
                  </select>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    {formData.employee_position === 'barbero' && '• Puede registrar citas y ventas'}
                    {formData.employee_position === 'dueno' && '• Acceso a contabilidad y compras'}
                    {formData.employee_position === 'recepcionista' && '• Apoyo en limpieza ligera'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    Contraseña temporal *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
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
                  {loading ? 'Creando...' : 'Crear Empleado'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
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
