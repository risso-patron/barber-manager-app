"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface Employee {
  id: string
  name: string
  role: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
}

export function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEmployees(data)
    }
    setLoading(false)
  }

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('employees')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      toast.success(`Empleado ${!currentStatus ? 'activado' : 'desactivado'} correctamente`)
      loadEmployees()
    } else {
      toast.error('Error al actualizar el estado del empleado')
    }
  }

  const deleteEmployee = async (id: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar este empleado?')
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Empleado eliminado correctamente')
      loadEmployees()
    } else {
      toast.error('Error al eliminar el empleado')
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === 'all' ||
                         (filterActive === 'active' && emp.is_active) ||
                         (filterActive === 'inactive' && !emp.is_active)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
          💼 Gestión de Empleados
        </h2>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, cargo o email..."
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
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            style={{
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">👥 Todos</option>
            <option value="active">✅ Activos</option>
            <option value="inactive">❌ Inactivos</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Total: {filteredEmployees.length} empleados
        </div>
      </div>

      {/* Grid de Empleados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredEmployees.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
            <p style={{ color: '#64748b' }}>No se encontraron empleados</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'relative',
                border: employee.is_active ? '2px solid #10b981' : '2px solid #ef4444'
              }}
            >
              {/* Badge de estado */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: employee.is_active ? '#d1fae5' : '#fee2e2',
                color: employee.is_active ? '#065f46' : '#991b1b'
              }}>
                {employee.is_active ? '✅ Activo' : '❌ Inactivo'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: employee.is_active 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  color: 'white',
                  marginRight: '1rem'
                }}>
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    {employee.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                    {employee.role}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                  <span>📧</span>
                  <span>{employee.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                  <span>📱</span>
                  <span>{employee.phone}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => toggleActiveStatus(employee.id, employee.is_active)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: employee.is_active ? '#fef3c7' : '#d1fae5',
                    color: employee.is_active ? '#92400e' : '#065f46',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  {employee.is_active ? '🔒 Desactivar' : '✅ Activar'}
                </button>
                <button
                  onClick={() => deleteEmployee(employee.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
