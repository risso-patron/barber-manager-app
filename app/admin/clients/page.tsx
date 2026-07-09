"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { StatCard, StatStrip } from "@/components/ui/stat-card"
import { ActionMenu, type ActionMenuAction } from "@/components/ui/action-menu"
import { Users, Plus, Edit, Trash2, Eye, Gift } from "lucide-react"
import type { Client } from "@/lib/demo"
import { DEMO_CLIENTS } from "@/lib/demo"
import { ClientModal } from "@/components/admin/clients/client-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AsyncPane, paneState } from "@/components/ui/async-pane"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton"
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

  /** Acciones por cliente — la lógica de negocio vive acá; ActionMenu solo la presenta. */
  const buildClientActions = (client: Client): ActionMenuAction[][] => [
    [
      { label: "Ver perfil", icon: Eye, href: `/admin/clients/${client.id}` },
      { label: "Editar", icon: Edit, onSelect: () => setEditingClient(client) },
      { label: "Puntos", icon: Gift, tone: "warning" as const, onSelect: () => setLoyaltyClient(client) },
    ],
    [{ label: "Eliminar", icon: Trash2, tone: "danger" as const, onSelect: () => setDeletingClient(client) }],
  ]

  if (!user) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-1 text-[13px] text-ink-600">Administra la base de datos de clientes</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Statistics */}
      <StatStrip>
        <StatCard label="Total clientes" value={stats.total} loading={isLoading} />
        <StatCard
          label="Nuevos este mes"
          value={stats.newThisMonth}
          deltaPct={Number(stats.growth)}
          deltaHint="vs. mes anterior"
          loading={isLoading}
        />
        <StatCard label="Clientes activos" value={stats.activeClients} loading={isLoading} />
        <StatCard label="Crecimiento" value={`${stats.growth}%`} loading={isLoading} />
      </StatStrip>

      {/* Search */}
      <SearchInput
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder="Buscar por nombre, email o teléfono…"
        className="w-full sm:w-96"
      />

      {/* Clients Table/Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            Clientes ({filteredClients.length})
            {totalPages > 1 && (
              <span className="ml-2 text-sm font-normal text-ink-600">
                — página {page + 1} de {totalPages}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AsyncPane
              state={paneState({ loading: isLoading, count: filteredClients.length })}
              skeleton={<SkeletonList rows={6} />}
              empty={
                <EmptyState
                  icon={Users}
                  title="No se encontraron clientes"
                  description="Ajusta la búsqueda o crea un cliente nuevo."
                  action={
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                      <Plus className="size-4" aria-hidden="true" />
                      Nuevo Cliente
                    </Button>
                  }
                  size="compact"
                />
              }
              size="compact"
            >
              <>
                {pagedClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-[14px] border border-border bg-card p-4 transition-shadow duration-micro hover:shadow-raised"
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

                    <ActionMenu
                      label={`Acciones del cliente ${client.name}`}
                      groups={buildClientActions(client)}
                    />
                  </div>
                ))}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="nums text-sm text-ink-600">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredClients.length)} de {filteredClients.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="secondary"
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
            </AsyncPane>
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
        <ConfirmDialog
          open={!!deletingClient}
          onOpenChange={(open) => {
            if (!open) setDeletingClient(null)
          }}
          title="¿Eliminar este cliente?"
          description={
            <>
              <strong>{deletingClient.name}</strong>. Esta acción no se puede deshacer: se eliminan sus
              datos y el historial de citas asociado.
            </>
          }
          confirmLabel="Sí, eliminar"
          cancelLabel="Mantener cliente"
          tone="danger"
          onConfirm={() => handleDeleteClient(deletingClient.id)}
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
