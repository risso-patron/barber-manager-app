"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Scissors,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react"
import {
  type Appointment,
  type AppointmentStatus
} from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import { AppointmentModal } from "@/components/admin/appointments/appointment-modal"
import { DeleteConfirmModal } from "@/components/admin/appointments/delete-confirm-modal"

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
}

export default function AppointmentsPage() {
  const user = useRequireAuth(["admin"])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all")
  const [filterDate, setFilterDate] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Load appointments from Supabase
  useEffect(() => {
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        created_at,
        client:users!appointments_client_id_fkey(id, name, phone),
        barber:users!appointments_barber_id_fkey(id, name),
        service:services(id, name, price, duration)
      `)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setAppointments(data.map((a: any) => ({
            id: a.id,
            clientId: a.client?.id || "",
            clientName: a.client?.name || "",
            clientPhone: a.client?.phone || "",
            employeeId: a.barber?.id || "",
            employeeName: a.barber?.name || "",
            serviceId: a.service?.id || "",
            serviceName: a.service?.name || "",
            date: a.appointment_date,
            time: a.appointment_time,
            duration: a.service?.duration || 0,
            price: a.service?.price || 0,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at,
          })))
        }
      })
  }, [])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = 
        apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || apt.status === filterStatus
      const matchesDate = !filterDate || apt.date === filterDate

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [appointments, searchTerm, filterStatus, filterDate])

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = appointments.filter(apt => apt.date === today)
    
    return {
      total: appointments.length,
      today: todayAppointments.length,
      pending: appointments.filter(apt => apt.status === "pending").length,
      confirmed: appointments.filter(apt => apt.status === "confirmed").length,
    }
  }, [appointments])

  const handleCreateAppointment = (appointment: Omit<Appointment, "id" | "createdAt">) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setAppointments([newAppointment, ...appointments])
    setIsCreateModalOpen(false)
  }

  const handleUpdateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(appointments.map(apt => 
      apt.id === updatedAppointment.id ? updatedAppointment : apt
    ))
    setEditingAppointment(null)
  }

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter(apt => apt.id !== id))
    setDeletingAppointment(null)
  }

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, status } : apt
    ))
    setActiveDropdown(null)
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
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
            <p className="text-gray-600 mt-1">Administra todas las citas de la barbería</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Citas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoy</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmadas</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, empleado o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | "all")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              placeholder="Filtrar por fecha"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Citas ({filteredAppointments.length})</CardTitle>
          <CardDescription>
            {filterDate ? `Mostrando citas para ${filterDate}` : "Mostrando todas las citas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron citas</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[appointment.status]}>
                          {STATUS_LABELS[appointment.status]}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{appointment.clientName}</p>
                            <p className="text-xs text-gray-600">{appointment.clientPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Scissors className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{appointment.serviceName}</p>
                            <p className="text-xs text-gray-600">
                              {appointment.duration} min · ${appointment.price}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{appointment.time}</p>
                            <p className="text-xs text-gray-600">{appointment.employeeName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notas:</span> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="relative ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveDropdown(activeDropdown === appointment.id ? null : appointment.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {activeDropdown === appointment.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setEditingAppointment(appointment)
                                setActiveDropdown(null)
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </button>

                            {appointment.status === "pending" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "confirmed")}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Confirmar
                              </button>
                            )}

                            {appointment.status === "confirmed" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "completed")}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                Marcar como completada
                              </button>
                            )}

                            {(appointment.status === "pending" || appointment.status === "confirmed") && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                                Cancelar
                              </button>
                            )}

                            <div className="border-t my-1"></div>

                            <button
                              onClick={() => {
                                setDeletingAppointment(appointment)
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {isCreateModalOpen && (
        <AppointmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateAppointment}
          services={DEMO_SERVICES}
          employees={DEMO_EMPLOYEES}
          clients={DEMO_CLIENTS}
        />
      )}

      {editingAppointment && (
        <AppointmentModal
          isOpen={!!editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSave={handleUpdateAppointment}
          appointment={editingAppointment}
          services={DEMO_SERVICES}
          employees={DEMO_EMPLOYEES}
          clients={DEMO_CLIENTS}
        />
      )}

      {deletingAppointment && (
        <DeleteConfirmModal
          isOpen={!!deletingAppointment}
          onClose={() => setDeletingAppointment(null)}
          onConfirm={() => handleDeleteAppointment(deletingAppointment.id)}
          appointmentInfo={`${deletingAppointment.clientName} - ${deletingAppointment.serviceName}`}
        />
      )}
    </div>
  )
}
