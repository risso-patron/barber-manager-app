"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, Plus, Clock, DollarSign, Edit, Trash2 } from "lucide-react"
import { type Service, DEMO_SERVICES } from "@/lib/demo"
import { createBrowserClient } from "@supabase/ssr"
import { ServiceModal } from "@/components/admin/services/service-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ActionMenu, type ActionMenuAction } from "@/components/ui/action-menu"
import { StatCard, StatStrip } from "@/components/ui/stat-card"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { AsyncPane, paneState } from "@/components/ui/async-pane"
import { SkeletonList } from "@/components/ui/skeleton"
import { useNotify } from "@/components/ui/notify"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null

function buildServiceActions(
  service: Service,
  onEdit: (s: Service) => void,
  onDelete: (s: Service) => void,
): ActionMenuAction[][] {
  return [
    [{ label: "Editar", icon: Edit, onSelect: () => onEdit(service) }],
    [{ label: "Eliminar", icon: Trash2, tone: "danger", onSelect: () => onDelete(service) }],
  ]
}

export default function ServicesPage() {
  const user = useRequireAuth(["admin"])
  const notify = useNotify()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  // Load services — fallback to demo data when Supabase is not configured
  useEffect(() => {
    if (!supabase) {
      setServices(DEMO_SERVICES)
      setIsLoading(false)
      return
    }
    supabase.from("services").select("*").order("name").then(({ data }) => {
      if (data && data.length > 0) setServices(data)
      else setServices(DEMO_SERVICES)
      setIsLoading(false)
    })
  }, [])

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      return service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [services, searchTerm])

  // Statistics
  const stats = useMemo(() => {
    const avgPrice = services.length > 0
      ? services.reduce((sum, s) => sum + s.price, 0) / services.length
      : 0
    const avgDuration = services.length > 0
      ? services.reduce((sum, s) => sum + s.duration, 0) / services.length
      : 0

    return {
      total: services.length,
      avgPrice: avgPrice.toFixed(0),
      avgDuration: Math.round(avgDuration),
      totalRevenue: services.reduce((sum, s) => sum + s.price, 0),
    }
  }, [services])

  const handleCreateService = async (service: Omit<Service, "id">) => {
    if (!supabase) {
      setServices(prev => [{ ...service, id: `demo-svc-${Date.now()}` }, ...prev])
      setIsCreateModalOpen(false)
      notify({ title: "Servicio creado." })
      return
    }
    const { data, error } = await supabase.from("services").insert(service).select().single()
    if (!error && data) {
      setServices([data, ...services])
      notify({ title: "Servicio creado." })
    }
    setIsCreateModalOpen(false)
  }

  const handleUpdateService = async (service: Service | Omit<Service, "id">) => {
    const updatedService = service as Service
    if (!supabase) {
      setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s))
      setEditingService(null)
      notify({ title: "Servicio actualizado." })
      return
    }
    const { id, ...fields } = updatedService
    const { data, error } = await supabase.from("services").update(fields).eq("id", id).select().single()
    if (!error && data) {
      setServices(services.map(s => s.id === id ? data : s))
      notify({ title: "Servicio actualizado." })
    }
    setEditingService(null)
  }

  const handleDeleteService = async (id: string) => {
    if (!supabase) {
      setServices(prev => prev.filter(s => s.id !== id))
      setDeletingService(null)
      notify({ title: "Servicio eliminado." })
      return
    }
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (!error) {
      setServices(services.filter(s => s.id !== id))
      notify({ title: "Servicio eliminado." })
    }
    setDeletingService(null)
  }

  if (!user) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Servicios</h1>
          <p className="mt-1 text-[13px] text-ink-600">Administra los servicios ofrecidos en la barbería</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Statistics */}
      <StatStrip>
        <StatCard label="Total Servicios" value={stats.total} loading={isLoading} />
        <StatCard label="Precio Promedio" value={`$${stats.avgPrice}`} loading={isLoading} />
        <StatCard label="Duración Promedio" value={`${stats.avgDuration} min`} loading={isLoading} />
        <StatCard label="Valor Total Catálogo" value={`$${stats.totalRevenue}`} loading={isLoading} />
      </StatStrip>

      {/* Search */}
      <SearchInput
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder="Buscar por nombre o descripción…"
      />

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AsyncPane
          state={paneState({ loading: isLoading, count: filteredServices.length })}
          skeleton={<SkeletonList rows={6} className="col-span-full" />}
          empty={
            <EmptyState
              icon={Scissors}
              title="Sin servicios"
              description="Ajustá la búsqueda o creá un nuevo servicio para que aparezca aquí."
              action={
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="size-4" aria-hidden="true" />
                  Nuevo Servicio
                </Button>
              }
              className="col-span-full"
            />
          }
        >
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow duration-micro">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                      <Scissors className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                      {service.name}
                    </CardTitle>
                    {service.description && (
                      <CardDescription className="mt-1.5 text-[13px]">
                        {service.description}
                      </CardDescription>
                    )}
                  </div>
                  <ActionMenu
                    label={`Acciones de ${service.name}`}
                    groups={buildServiceActions(
                      service,
                      (s) => setEditingService(s),
                      (s) => setDeletingService(s),
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-ink-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink-600">Precio</span>
                    </div>
                    <span className="text-[15px] font-semibold text-foreground">${service.price}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-ink-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink-600">Duración</span>
                    </div>
                    <span className="text-[15px] font-semibold text-foreground">{service.duration} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </AsyncPane>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <ServiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateService}
        />
      )}

      {editingService && (
        <ServiceModal
          isOpen={!!editingService}
          onClose={() => setEditingService(null)}
          onSave={handleUpdateService}
          service={editingService}
        />
      )}

      {deletingService && (
        <ConfirmDialog
          open={!!deletingService}
          onOpenChange={(open) => {
            if (!open) setDeletingService(null)
          }}
          title="¿Eliminar este servicio?"
          description={
            <>
              <strong>{deletingService.name}</strong>. Esta acción no se puede deshacer: se eliminan
              todos los datos asociados.
            </>
          }
          confirmLabel="Sí, eliminar"
          cancelLabel="Mantener servicio"
          tone="danger"
          onConfirm={() => handleDeleteService(deletingService.id)}
        />
      )}
    </div>
  )
}
