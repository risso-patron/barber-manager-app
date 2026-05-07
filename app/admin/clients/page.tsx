"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Plus, 
  Search, 
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Eye
} from "lucide-react"
import type { Client } from "@/lib/demo-appointments"
import { ClientModal } from "@/components/admin/clients/client-modal"
import { DeleteConfirmModal } from "@/components/admin/clients/delete-confirm-modal"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClientsPage() {
  const user = useRequireAuth(["admin"])
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Load clients from Supabase
  useEffect(() => {
    if (!user) return
    supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setClients(data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          createdAt: u.created_at,
          isActive: true,
        })))
      })
  }, [user])

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const searchLower = searchTerm.toLowerCase()
      return client.name.toLowerCase().includes(searchLower) ||
             client.email.toLowerCase().includes(searchLower) ||
             client.phone.includes(searchTerm)
    })
  }, [clients, searchTerm])

  // Statistics
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    const newThisMonth = clients.filter(c => {
      const createdDate = new Date(c.createdAt || "2024-01-01")
      return createdDate >= thisMonth
    }).length

    const newLastMonth = clients.filter(c => {
      const createdDate = new Date(c.createdAt || "2024-01-01")
      return createdDate >= lastMonth && createdDate < thisMonth
    }).length

    const growth = newLastMonth > 0 
      ? ((newThisMonth - newLastMonth) / newLastMonth * 100).toFixed(0)
      : "0"
    
    return {
      total: clients.length,
      newThisMonth,
      newLastMonth,
      growth,
      activeClients: clients.filter(c => c.isActive !== false).length,
    }
  }, [clients])

  const handleCreateClient = async (client: Omit<Client, "id">) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: client.name, phone: client.phone, email: client.email }),
    })
    if (res.ok) {
      const { client: created } = await res.json()
      setClients([{
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone || "",
        createdAt: new Date().toISOString(),
        isActive: true,
      }, ...clients])
    }
    setIsCreateModalOpen(false)
  }

  const handleUpdateClient = async (client: Client | Omit<Client, "id">) => {
    const updatedClient = client as Client
    await supabase
      .from("users")
      .update({ name: updatedClient.name, email: updatedClient.email, phone: updatedClient.phone })
      .eq("id", updatedClient.id)
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c))
    setEditingClient(null)
  }

  const handleDeleteClient = async (id: string) => {
    await supabase.from("users").delete().eq("id", id)
    setClients(clients.filter(c => c.id !== id))
    setDeletingClient(null)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">Administra la base de datos de clientes</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nuevos este Mes</p>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold">{stats.activeClients}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crecimiento</p>
                <p className="text-2xl font-bold">{stats.growth}%</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${Number(stats.growth) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table/Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron clientes</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  {/* Client Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        {client.isActive !== false ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                        {client.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Cliente desde {new Date(client.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveDropdown(activeDropdown === client.id ? null : client.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {activeDropdown === client.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-50">
                        <div className="py-1">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            onClick={() => setActiveDropdown(null)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver perfil
                          </Link>

                          <button
                            onClick={() => {
                              setEditingClient(client)
                              setActiveDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>

                          <div className="border-t my-1"></div>

                          <button
                            onClick={() => {
                              setDeletingClient(client)
                              setActiveDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {isCreateModalOpen && (
        <ClientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateClient}
        />
      )}

      {editingClient && (
        <ClientModal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleUpdateClient}
          client={editingClient}
        />
      )}

      {deletingClient && (
        <DeleteConfirmModal
          isOpen={!!deletingClient}
          onClose={() => setDeletingClient(null)}
          onConfirm={() => handleDeleteClient(deletingClient.id)}
          clientName={deletingClient.name}
        />
      )}
    </div>
  )
}
