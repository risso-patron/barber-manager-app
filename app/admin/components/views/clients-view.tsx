"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'
import { ClientProfileView } from './client-profile-view'

interface Client {
  id: string
  name: string | null
  email: string
  phone: string | null
  is_active: boolean
  created_at: string
}

interface ClientsViewProps {
  onNewClient?: () => void
}

export function ClientsView({ onNewClient }: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, is_active, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })

    console.log('📊 CLIENTS VIEW - Data:', data)
    console.log('📊 CLIENTS VIEW - Error:', error)

    if (!error && data) {
      // Asegurar que is_active tenga un valor por defecto
      const clientsWithStatus = data.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        is_active: client.is_active ?? true,
        created_at: client.created_at
      }))
      console.log('📊 CLIENTS MAPPED:', clientsWithStatus)
      setClients(clientsWithStatus)
    } else if (error) {
      console.error('❌ Error cargando clientes:', error)
    }
    setLoading(false)
  }

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()
    
    // Verificar el estado actual
    const { data: currentData, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('Error al verificar estado:', fetchError)
      toast.error('Error al verificar el estado del cliente')
      return
    }
    
    const newStatus = !currentData.is_active
    
    const { error } = await supabase
      .from('users')
      .update({ is_active: newStatus })
      .eq('id', id)

    if (!error) {
      toast.success(`Cliente ${newStatus ? 'activado' : 'desactivado'} correctamente`)
      loadClients()
    } else {
      console.error('Error al actualizar:', error)
      toast.error('Error al actualizar el estado del cliente')
    }
  }

  const deleteClient = async (id: string) => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.'
    )
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Cliente eliminado correctamente')
      loadClients()
    } else {
      toast.error('Error al eliminar el cliente. Puede tener registros asociados.')
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (client.phone || '').includes(searchTerm)
    
    const matchesFilter = filterActive === 'all' ||
                         (filterActive === 'active' && client.is_active) ||
                         (filterActive === 'inactive' && !client.is_active)
    
    return matchesSearch && matchesFilter
  })

  const statsData = {
    total: clients.length,
    active: clients.filter(c => c.is_active).length,
    inactive: clients.filter(c => !c.is_active).length,
    thisMonth: clients.filter(c => {
      const date = new Date(c.created_at)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  }

  // Si hay un cliente seleccionado, mostrar su perfil
  if (selectedClientId) {
    return <ClientProfileView clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Clientes</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.total}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Activos</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.active}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Inactivos</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.inactive}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Nuevos este mes</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{statsData.thisMonth}</div>
        </div>
      </div>

      {/* Header con filtros */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
            👥 Gestión de Clientes
          </h2>
          <button
            onClick={onNewClient}
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
            ➕ Nuevo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o teléfono..."
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
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">✨ Todos</option>
            <option value="active">✅ Activos</option>
            <option value="inactive">⏸️ Inactivos</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '1rem' }}>
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
      </div>

      {/* Grid de Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredClients.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '500' }}>No se encontraron clientes</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Prueba ajustando los filtros de búsqueda</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: client.is_active 
                  ? '0 4px 6px rgba(0,0,0,0.1)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
                border: client.is_active 
                  ? '2px solid #667eea' 
                  : '2px solid #e2e8f0',
                opacity: client.is_active ? 1 : 0.7,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedClientId(client.id)}
            >
              {/* Status badge */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontWeight: '600',
                  background: client.is_active 
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  {client.is_active ? '✅ Activo' : '⏸️ Inactivo'}
                </span>
              </div>

              {/* Avatar y nombre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0
                  }}
                >
                  {client.name?.[0]?.toUpperCase() || client.email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontWeight: '600', 
                    fontSize: '1.125rem', 
                    marginBottom: '0.25rem', 
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {client.name || client.email}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    📅 {new Date(client.created_at).toLocaleDateString('es-ES', { 
                      day: 'numeric',
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div style={{ 
                marginBottom: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '0.5rem'
              }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#475569', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span style={{ flexShrink: 0 }}>📧</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.email}</span>
                </div>
                {client.phone && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#475569', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem' 
                  }}>
                    <span style={{ flexShrink: 0 }}>📱</span>
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleActiveStatus(client.id, client.is_active)
                  }}
                  style={{
                    flex: '1',
                    minWidth: '140px',
                    padding: '0.75rem 1rem',
                    background: client.is_active 
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {client.is_active ? '⏸️ Desactivar' : '▶️ Activar'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteClient(client.id, client.name || client.email)
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
