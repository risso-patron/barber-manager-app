"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setClients(data)
    }
    setLoading(false)
  }

  const deleteClient = async (id: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de eliminar este cliente?')
    if (!confirmDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (!error) {
      toast.success('Cliente eliminado correctamente')
      loadClients()
    } else {
      toast.error('Error al eliminar el cliente')
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

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
          👥 Gestión de Clientes
        </h2>

        {/* Búsqueda */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Total: {filteredClients.length} clientes
        </div>
      </div>

      {/* Grid de Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredClients.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ color: '#64748b' }}>No se encontraron clientes</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white',
                  marginRight: '1rem'
                }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    {client.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                  <span>📧</span>
                  <span>{client.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                  <span>📱</span>
                  <span>{client.phone}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.location.href = `tel:${client.phone}`}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#dbeafe',
                    color: '#1e40af',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  📞 Llamar
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
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
