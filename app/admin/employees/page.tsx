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
  ArrowLeft
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
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "barber" | "employee">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Load employees from Supabase
  useEffect(() => {
    supabase
      .from("users")
      .select("id, name, email, phone, role, avatar_url, specialty")
      .in("role", ["employee", "barber"])
      .order("name")
      .then(({ data }) => {
        if (data) setEmployees(data.map(u => ({ ...u, avatar: u.avatar_url })))
      })
  }, [])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)
      
      const matchesRole = filterRole === "all" || emp.role === filterRole

      return matchesSearch && matchesRole
    })
  }, [employees, searchTerm, filterRole])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: employees.length,
      barbers: employees.filter(emp => emp.role === "barber").length,
      employees: employees.filter(emp => emp.role === "employee").length,
    }
  }, [employees])

  const handleCreateEmployee = async (employee: Omit<Employee, "id">) => {
    const emp = employee as any
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        specialty: emp.specialty || null,
        avatar_url: emp.avatar || null,
      })
      .select()
      .single()
    if (!error && data) setEmployees([{ ...data, avatar: data.avatar_url, specialty: data.specialty }, ...employees])
    setIsCreateModalOpen(false)
  }

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
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
    const { error } = await supabase.from("users").delete().eq("id", id)
    if (!error) setEmployees(employees.filter(emp => emp.id !== id))
    setDeletingEmployee(null)
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
              onChange={(e) => setFilterRole(e.target.value as "all" | "barber" | "employee")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="barber">Barberos</option>
              <option value="employee">Staff</option>
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
                        variant={employee.role === "barber" ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {(employee as any).specialty || (employee.role === "barber" ? "Barbero" : "Staff")}
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
