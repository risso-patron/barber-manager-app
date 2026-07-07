"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Eye,
  Gift,
  Loader2,
} from "lucide-react"
import type { Client } from "@/lib/demo"
import { DEMO_CLIENTS } from "@/lib/demo"
import { ClientModal } from "@/components/admin/clients/client-modal"
import { DeleteConfirmModal } from "@/components/admin/clients/delete-confirm-modal"
import { LoyaltyModal } from "@/components/admin/clients/loyalty-modal"
import { ClientIdentity } from "@/components/admin/clients/client-identity"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

export default function ClientsPage() {
  const user = useRequireAuth(["admin"])
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [loyaltyClient, setLoyaltyClient] = useState<Client | null>(null)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const PAGE_SIZE = 25

  // Load clients from Supabase (or demo data)
  useEffect(() => {
    if (!user) return
    if (!supabase) {
      setClients(DEMO_CLIENTS.map(c => ({ ...c, email: c.email ?? "", isActive: true })))
      setIsLoading(false)
      return
    }
    supabase
      .from("users")
      .select("id, name, email, phone, created_at, loyalty_points, no_show_count")
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setClients(data.map((u: { id: string; name: string; email: string; phone: string | null; created_at: string; loyalty_points?: number; no_show_count?: number }) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          createdAt: u.created_at,
          isActive: true,
          loyalty_points: u.loyalty_points ?? 0,
          no_show_count: u.no_show_count ?? 0,
        })))
        setIsLoading(false)
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

  // Reset page when search changes
  useEffect(() => { setPage(0) }, [searchTerm])

  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE)
  const pagedClients = filteredClients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
    if (!supabase) {
      setClients(prev => [{
        ...client,
        id: `demo-cli-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isActive: true,
      }, ...prev])
      setIsCreateModalOpen(false)
      return
    }
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
    if (!supabase) {
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c))
      setEditingClient(null)
      return
    }
    await supabase
      .from("users")
      .update({ name: updatedClient.name, email: updatedClient.email, phone: updatedClient.phone })
      .eq("id", updatedClient.id)
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c))
    setEditingClient(null)
  }

  const handleDeleteClient = async (id: string) => {
    if (!supabase) {
      setClients(prev => prev.filter(c => c.id !== id))
      setDeletingClient(null)
      return
    }
    const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setClients(clients.filter(c => c.id !== id))
    }
    setDeletingClient(null)
  }

  if (!user) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
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
          <CardTitle>
            Listado de Clientes ({filteredClients.length})
            {totalPages > 1 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — página {page + 1} de {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron clientes</p>
              </div>
            ) : (
              <>
                {pagedClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow"
                  >
                    <ClientIdentity
                      name={client.name}
                      email={client.email}
                      phone={client.phone}
                      createdAt={client.createdAt}
                      isActive={client.isActive !== false}
                      loyaltyPoints={(client as Client & { loyalty_points?: number }).loyalty_points}
                      noShowCount={(client as Client & { no_show_count?: number }).no_show_count}
                      className="flex-1"
                    />

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

                            <button
                              onClick={() => {
                                setLoyaltyClient(client)
                                setActiveDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-amber-700"
                            >
                              <Gift className="h-4 w-4" />
                              Puntos
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
                ))}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredClients.length)} de {filteredClients.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Siguiente →
                    </Button>
                  </div>
                </div>
              )}
              </>
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
      {loyaltyClient && (
        <LoyaltyModal
          client={loyaltyClient as Client & { loyalty_points?: number }}
          onClose={() => setLoyaltyClient(null)}
          onAdjusted={(newPoints) => {
            setClients((prev) =>
              prev.map((c) =>
                c.id === loyaltyClient.id
                  ? { ...c, loyalty_points: newPoints } as Client & { loyalty_points: number }
                  : c
              )
            )
            setLoyaltyClient(null)
          }}
        />
      )}
    </div>
  )
}
