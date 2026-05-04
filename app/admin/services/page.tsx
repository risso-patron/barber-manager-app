"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  Scissors, 
  Plus, 
  Search, 
  Clock,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  ArrowLeft
} from "lucide-react"
import { type Service } from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"
import { ServiceModal } from "@/components/admin/services/service-modal"
import { DeleteConfirmModal } from "@/components/admin/services/delete-confirm-modal"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ServicesPage() {
  const user = useRequireAuth(["admin"])
  const [services, setServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Load services from Supabase
  useEffect(() => {
    supabase.from("services").select("*").order("name").then(({ data }) => {
      if (data) setServices(data)
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
    const { data, error } = await supabase.from("services").insert(service).select().single()
    if (!error && data) setServices([data, ...services])
    setIsCreateModalOpen(false)
  }

  const handleUpdateService = async (updatedService: Service) => {
    const { id, ...fields } = updatedService
    const { data, error } = await supabase.from("services").update(fields).eq("id", id).select().single()
    if (!error && data) setServices(services.map(s => s.id === id ? data : s))
    setEditingService(null)
  }

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (!error) setServices(services.filter(s => s.id !== id))
    setDeletingService(null)
  }

  if (!user) return null

  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-600 mt-1">Administra los servicios ofrecidos en la barbería</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Servicios</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Scissors className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-bold">${stats.avgPrice}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Duración Promedio</p>
                <p className="text-2xl font-bold">{stats.avgDuration} min</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">${stats.totalRevenue}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron servicios</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-blue-600" />
                      {service.name}
                    </CardTitle>
                    {service.description && (
                      <CardDescription className="mt-2">
                        {service.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveDropdown(activeDropdown === service.id ? null : service.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {activeDropdown === service.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setEditingService(service)
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
                              setDeletingService(service)
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
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Precio</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">${service.price}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Duración</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">{service.duration} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
        <DeleteConfirmModal
          isOpen={!!deletingService}
          onClose={() => setDeletingService(null)}
          onConfirm={() => handleDeleteService(deletingService.id)}
          serviceName={deletingService.name}
        />
      )}
    </div>
  )
}
