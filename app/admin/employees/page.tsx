"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Plus, 
  Search, 
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  ArrowLeft,
  KeyRound
} from "lucide-react"
import { type Employee } from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"
import { EmployeeModal } from "@/components/admin/employees/employee-modal"
import { DeleteConfirmModal } from "@/components/admin/employees/delete-confirm-modal"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmployeesPage() {
  const user = useRequireAuth(["admin"])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [newEmployeePassword, setNewEmployeePassword] = useState<{ name: string; password: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "barberos" | "staff">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [resetPasswordResult, setResetPasswordResult] = useState<{ name: string; password: string } | null>(null)

  const handleResetPassword = async (employee: Employee) => {
    setActiveDropdown(null)
    const res = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employee.id }),
    })
    const json = await res.json()
    if (res.ok) {
      setResetPasswordResult({ name: employee.name, password: json.tempPassword })
    } else {
      setApiError(json.error || "Error al resetear contraseña")
    }
  }

  // Load employees from Supabase
  useEffect(() => {
    supabase
      .from("users")
      .select("id, name, email, phone, role, avatar_url, specialty")
      .neq("role", "client")
      .neq("role", "admin")
      .order("name")
      .then(({ data }) => {
        if (data) setEmployees(data.map(u => ({ ...u, avatar: u.avatar_url })))
      })
  }, [])

  const BARBER_SPECIALTIES = ["Barbero", "Estilista", "Colorista"]

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)

      const specialty = (emp as any).specialty || ""
      const matchesRole =
        filterRole === "all" ||
        (filterRole === "barberos" && BARBER_SPECIALTIES.includes(specialty)) ||
        (filterRole === "staff" && !BARBER_SPECIALTIES.includes(specialty))

      return matchesSearch && matchesRole
    })
  }, [employees, searchTerm, filterRole])

  // Statistics
  const stats = useMemo(() => {
    const barbers = employees.filter(emp => BARBER_SPECIALTIES.includes((emp as any).specialty || "")).length
    return {
      total: employees.length,
      barbers,
      employees: employees.length - barbers,
    }
  }, [employees])

  const handleCreateEmployee = async (employee: Omit<Employee, "id">) => {
    setApiError(null)
    const emp = employee as any
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        specialty: emp.specialty || null,
        avatar_url: emp.avatar || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setApiError(json.error || "Error al crear empleado")
      return
    }
    setEmployees([{ ...json.employee, avatar: json.employee.avatar_url }, ...employees])
    setNewEmployeePassword({ name: emp.name, password: json.tempPassword })
    setIsCreateModalOpen(false)
  }

  const handleUpdateEmployee = async (employee: Omit<Employee, "id"> | Employee) => {
    const updatedEmployee = employee as Employee
    const { id, avatar, ...fields } = updatedEmployee as any
    const { data, error } = await supabase
      .from("users")
      .update({
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        role: fields.role,
        specialty: fields.specialty || null,
        avatar_url: avatar || null,
      })
      .eq("id", id)
      .select()
      .single()
    if (!error && data) setEmployees(employees.map(emp =>
      emp.id === id ? { ...data, avatar: data.avatar_url, specialty: data.specialty } : emp
    ))
    setEditingEmployee(null)
  }

  const handleDeleteEmployee = async (id: string) => {
    const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" })
    if (res.ok) setEmployees(employees.filter(emp => emp.id !== id))
    setDeletingEmployee(null)
  }

  if (!user) return null

  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Contraseña temporal del nuevo empleado */}
      {newEmployeePassword && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm">
          <p className="font-semibold text-green-800 mb-1">✓ Empleado creado exitosamente</p>
          <p className="text-green-700">
            Contraseña temporal de <strong>{newEmployeePassword.name}</strong>:{" "}
            <code className="bg-green-100 px-2 py-0.5 rounded font-mono">{newEmployeePassword.password}</code>
          </p>
          <p className="text-green-600 text-xs mt-1">Compartí esta contraseña con el empleado para que pueda iniciar sesión.</p>
          <button onClick={() => setNewEmployeePassword(null)} className="mt-2 text-xs text-green-700 underline">Cerrar</button>
        </div>
      )}

      {/* Resultado de reset de contraseña */}
      {resetPasswordResult && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <p className="font-semibold text-blue-800 mb-1">🔑 Contraseña reseteada</p>
          <p className="text-blue-700">
            Nueva contraseña temporal de <strong>{resetPasswordResult.name}</strong>:{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">{resetPasswordResult.password}</code>
          </p>
          <p className="text-blue-600 text-xs mt-1">Compartí esta contraseña con el empleado. La anterior ya no sirve.</p>
          <button onClick={() => setResetPasswordResult(null)} className="mt-2 text-xs text-blue-700 underline">Cerrar</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
            <p className="text-gray-600 mt-1">Administra barberos y personal de la barbería</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Empleados</p>
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
                <p className="text-sm text-gray-600">Barberos</p>
                <p className="text-2xl font-bold">{stats.barbers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-2xl font-bold">{stats.employees}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              aria-label="Filtrar por rol"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as "all" | "barberos" | "staff")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="barberos">Barberos</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron empleados</p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        employee.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <Badge
                        variant={(employee as any).specialty && ["Barbero","Estilista","Colorista"].includes((employee as any).specialty) ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {(employee as any).specialty || "Empleado"}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveDropdown(activeDropdown === employee.id ? null : employee.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {activeDropdown === employee.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setEditingEmployee(employee)
                              setActiveDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>

                          <button
                            onClick={() => {
                              // TODO: Ver agenda del empleado
                              setActiveDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Calendar className="h-4 w-4" />
                            Ver Agenda
                          </button>

                          <button
                            onClick={() => handleResetPassword(employee)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 flex items-center gap-2 text-yellow-700"
                          >
                            <KeyRound className="h-4 w-4" />
                            Resetear Clave
                          </button>

                          <div className="border-t my-1"></div>

                          <button
                            onClick={() => {
                              setDeletingEmployee(employee)
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

              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <EmployeeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateEmployee}
        />
      )}

      {editingEmployee && (
        <EmployeeModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleUpdateEmployee}
          employee={editingEmployee}
        />
      )}

      {deletingEmployee && (
        <DeleteConfirmModal
          isOpen={!!deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={() => handleDeleteEmployee(deletingEmployee.id)}
          employeeName={deletingEmployee.name}
        />
      )}
    </div>
  )
}
