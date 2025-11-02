"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'
import type { EmployeePosition } from "@/lib/types"
import { getPositionBadge, getPositionDescription } from "@/lib/permissions"

interface Employee {
  id: string
  name: string
  role: 'admin' | 'barber' | 'secretary'
  employee_position?: EmployeePosition
  phone: string | null
  email: string
  is_active: boolean
  created_at: string
}

interface EmployeesViewProps {
  onEditEmployee?: (employee: Employee) => void
  onNewEmployee?: () => void
}

export function EmployeesView({ onEditEmployee, onNewEmployee }: EmployeesViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'barber' | 'secretary'>('all')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['barber', 'admin', 'secretary'])
      .order('created_at', { ascending: false })

    console.log('📊 EMPLOYEES VIEW - Data:', data)
    console.log('📊 EMPLOYEES VIEW - Error:', error)

    if (!error && data) {
      // Asegurar que is_active tenga un valor por defecto si no existe
      const employeesWithStatus = data.map(emp => ({
        ...emp,
        is_active: emp.is_active ?? true // Si no existe, por defecto es true
      }))
      setEmployees(employeesWithStatus)
    } else if (error) {
      console.error('❌ Error cargando barberos:', error)
    }
    setLoading(false)
  }

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    
    // Primero verificar el estado actual
    const { data: currentData, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('Error al verificar estado:', fetchError)
      toast.error('Error al verificar el estado del barbero')
      return
    }
    
    const newStatus = !currentData.is_active
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', id)

    if (!error) {
      toast.success(`Barbero ${newStatus ? 'activado' : 'desactivado'} correctamente`)
      loadEmployees()
    } else {
      console.error('Error al actualizar:', error)
      toast.error('Error al actualizar el estado del barbero')
    }
  }

  const changeRole = async (id: string, newRole: 'admin' | 'barber' | 'secretary') => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      barber: 'Barbero',
      secretary: 'Secretaria'
    }
    
    const confirmChange = window.confirm(
      `¿Estás seguro de cambiar el rol a ${roleLabels[newRole]}?`
    )
    if (!confirmChange) return

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', id)

    if (!error) {
      toast.success(`Rol actualizado a ${roleNames[newRole]}`)
      loadEmployees()
    } else {
      toast.error('Error al actualizar el rol')
    }
  }

  const deleteEmployee = async (id: string) => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de eliminar este barbero? Esta acción no se puede deshacer.'
    )
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Barbero eliminado correctamente')
      loadEmployees()
    } else {
      toast.error('Error al eliminar el barbero. Puede tener registros asociados.')
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (emp.role?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === 'all' ||
                         (filterActive === 'active' && emp.is_active) ||
                         (filterActive === 'inactive' && !emp.is_active)
    
    const matchesRole = filterRole === 'all' || emp.role === filterRole
    
    return matchesSearch && matchesFilter && matchesRole
  })

  const statsData = {
    total: employees.length,
    admins: employees.filter(e => e.role === 'admin').length,
    barbers: employees.filter(e => e.role === 'barber').length,
    secretaries: employees.filter(e => e.role === 'secretary').length,
    active: employees.filter(e => e.is_active).length
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
      {/* Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.total}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Administradores</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.admins}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Barberos</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.barbers}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Secretarias</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.secretaries}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Activos</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.active}</div>
        </div>
      </div>

      {/* Header con filtros */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
            💼 Gestión de Barberos
          </h2>
          <button
            onClick={onNewEmployee}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ➕ Nuevo Barbero
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email..."
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
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">👔 Todos los roles</option>
            <option value="admin">👑 Admin</option>
            <option value="barber">💼 Barbero</option>
            <option value="secretary">📋 Secretaria</option>
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">� Todos</option>
            <option value="active">✅ Activos</option>
            <option value="inactive">❌ Inactivos</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '1rem' }}>
          Mostrando {filteredEmployees.length} de {employees.length} barberos
        </div>
      </div>

      {/* Grid de Barberos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredEmployees.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
            <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '500' }}>No se encontraron barberos</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Prueba ajustando los filtros de búsqueda</p>
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
                border: employee.is_active ? '2px solid #10b981' : '2px solid #ef4444',
                transition: 'all 0.3s'
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
                  background: employee.role === 'admin'
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : employee.is_active 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  color: 'white',
                  marginRight: '1rem',
                  fontWeight: 'bold'
                }}>
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {employee.name}
                    {employee.role === 'admin' && <span style={{ fontSize: '1rem' }}>👑</span>}
                    {employee.role === 'secretary' && <span style={{ fontSize: '1rem' }}>📋</span>}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                    {employee.role === 'admin' ? 'Administrador' : employee.role === 'secretary' ? 'Secretaria' : 'Barbero'}
                  </p>
                  {/* Badge de posición */}
                  {employee.employee_position && (() => {
                    const badge = getPositionBadge(employee.employee_position)
                    return (
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: badge.bg,
                        color: badge.color,
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {badge.emoji} {badge.text}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Información de contacto */}
              <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📧 {employee.email}
                </div>
                {employee.phone && (
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📱 {employee.phone}
                  </div>
                )}
                {employee.employee_position && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem' }}>
                    💼 {getPositionDescription(employee.employee_position)}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  📅 Registrado: {new Date(employee.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Selector de rol */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', minWidth: '80px' }}>
                    Rol:
                  </label>
                  <select
                    value={employee.role}
                    onChange={(e) => changeRole(employee.id, e.target.value as any)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  >
                    <option value="barber">💼 Barbero</option>
                    <option value="secretary">📋 Secretaria</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>

                {/* Botones activar/eliminar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    onClick={() => toggleActiveStatus(employee.id, employee.is_active)}
                    style={{
                      padding: '0.75rem',
                      background: employee.is_active 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {employee.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                  </button>

                  {/* Botón eliminar */}
                  <button
                    onClick={() => deleteEmployee(employee.id)}
                    style={{
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
