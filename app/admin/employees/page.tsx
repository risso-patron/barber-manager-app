"use client"

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Calendar,
  ArrowLeft,
  KeyRound,
  DollarSign
} from "lucide-react"
import { type Employee, DEMO_EMPLOYEES } from "@/lib/demo-appointments"
import { createBrowserClient } from "@supabase/ssr"
import { EmployeeModal } from "@/components/admin/employees/employee-modal"
import { DeleteConfirmModal } from "@/components/admin/employees/delete-confirm-modal"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const BARBER_SPECIALTIES = ["barbero"]

type EmployeeWithSpecialty = Employee & { specialty?: string | null; commission_rate?: number | null }

export default function EmployeesPage() {
  const router = useRouter()
  const user = useRequireAuth(["admin"])
  const [employees, setEmployees] = useState<EmployeeWithSpecialty[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [newEmployeePassword, setNewEmployeePassword] = useState<{ name: string; password: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "barberos" | "staff">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithSpecialty | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeWithSpecialty | null>(null)
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

  useEffect(() => {
    if (!supabase) {
      setEmployees(DEMO_EMPLOYEES)
      return
    }
    supabase
      .from("users")
      .select("id, name, email, phone, role, avatar_url, specialty, commission_rate")
      .neq("role", "client")
      .neq("role", "admin")
      .order("name")
      .then(({ data }) => {
        if (data) setEmployees(data.map(u => ({ ...u, avatar: u.avatar_url })))
      })
  }, [])

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)

      const specialty = emp.specialty || ""
      const matchesRole =
        filterRole === "all" ||
        (filterRole === "barberos" && BARBER_SPECIALTIES.includes(specialty)) ||
        (filterRole === "staff" && !BARBER_SPECIALTIES.includes(specialty))

      return matchesSearch && matchesRole
    })
  }, [employees, searchTerm, filterRole])

  // Statistics
  const stats = useMemo(() => {
    const barbers = employees.filter(emp => BARBER_SPECIALTIES.includes(emp.specialty || "")).length
    return {
      total: employees.length,
      barbers,
      employees: employees.length - barbers,
    }
  }, [employees])

  const handleCreateEmployee = async (employee: Omit<EmployeeWithSpecialty, "id">) => {
    setApiError(null)
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        specialty: employee.specialty || null,
        avatar_url: employee.avatar || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      setApiError(json.error || "Error al crear empleado")
      return
    }
    setEmployees([{ ...json.employee, avatar: json.employee.avatar_url }, ...employees])
    setNewEmployeePassword({ name: employee.name, password: json.tempPassword })
    setIsCreateModalOpen(false)
  }

  const handleUpdateEmployee = async (employee: Omit<EmployeeWithSpecialty, "id"> | EmployeeWithSpecialty) => {
    const updatedEmployee = employee as EmployeeWithSpecialty
    const { id, avatar, specialty, role, name, email, phone, commission_rate } = updatedEmployee
    if (!supabase) {
      setEmployees(employees.map(emp => emp.id === id ? { ...updatedEmployee } : emp))
      setEditingEmployee(null)
      return
    }
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        phone,
        role,
        specialty: specialty || null,
        avatar_url: avatar || null,
        commission_rate: commission_rate ?? null,
      })
      .eq("id", id)
      .select()
      .single()
    if (!error && data) setEmployees(employees.map(emp =>
      emp.id === id ? { ...data, avatar: data.avatar_url, specialty: data.specialty, commission_rate: data.commission_rate } : emp
    ))
    setEditingEmployee(null)
  }

  const handleDeleteEmployee = async (id: string) => {
    const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" })
    if (res.ok) setEmployees(employees.filter(emp => emp.id !== id))
    setDeletingEmployee(null)
  }

  if (!user) return null

  return (
    <div className="space-y-6" style={{ padding: 32 }}>
      {/* Error banner */}
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Contráseña temporal del nuevo empleado */}
      {newEmployeePassword && (
        <div style={{ padding: "14px 18px", background: "#0F2E1A", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, fontSize: 13 }}>
          <p style={{ fontWeight: 600, color: "#22C55E", marginBottom: 4 }}>✓ Empleado creado exitosamente</p>
          <p style={{ color: "#F0F0F0" }}>
            Contraseña temporal de <strong>{newEmployeePassword.name}</strong>:{" "}
            <code style={{ background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 4, fontFamily: "var(--font-dm-mono), monospace", color: "#22C55E" }}>{newEmployeePassword.password}</code>
          </p>
          <p style={{ color: "#8A8A8A", fontSize: 11, marginTop: 4 }}>Compartí esta contraseña con el empleado para que pueda iniciar sesión.</p>
          <button onClick={() => setNewEmployeePassword(null)} style={{ marginTop: 8, fontSize: 11, color: "#22C55E", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Cerrar</button>
        </div>
      )}

      {/* Resultado de reset de contraseña */}
      {resetPasswordResult && (
        <div style={{ padding: "14px 18px", background: "#1A1A2E", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 10, fontSize: 13 }}>
          <p style={{ fontWeight: 600, color: "#818CF8", marginBottom: 4 }}>🔑 Contraseña reseteada</p>
          <p style={{ color: "#F0F0F0" }}>
            Nueva contraseña temporal de <strong>{resetPasswordResult.name}</strong>:{" "}
            <code style={{ background: "rgba(129,140,248,0.15)", padding: "2px 8px", borderRadius: 4, fontFamily: "var(--font-dm-mono), monospace", color: "#818CF8" }}>{resetPasswordResult.password}</code>
          </p>
          <p style={{ color: "#8A8A8A", fontSize: 11, marginTop: 4 }}>Compartí esta contraseña con el empleado. La anterior ya no sirve.</p>
          <button onClick={() => setResetPasswordResult(null)} style={{ marginTop: 8, fontSize: 11, color: "#818CF8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Cerrar</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 22, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>Empleados</h1>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "#8A8A8A", marginTop: 4 }}>Administra barberos y personal de la barbería</p>
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
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Total Empleados</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.total}</p>
              </div>
              <Users className="h-7 w-7" style={{ color: "#E53935" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Barberos</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.barbers}</p>
              </div>
              <UserCheck className="h-7 w-7" style={{ color: "#22C55E" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: "#8A8A8A" }}>Staff</p>
                <p style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{stats.employees}</p>
              </div>
              <Users className="h-7 w-7" style={{ color: "#818CF8" }} />
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
            <Card key={employee.id} className="hover:shadow-lg transition-shadow" style={{ border: "1px solid #2E2E2E" }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: ["#1E3A5F","#1A3325","#3D1A1A","#2A1A3D","#1A2E3D"][parseInt(employee.id, 36) % 5] || "#1E3A5F", border: "2px solid #252525" }}
                    >
                      {employee.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        employee.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <Badge
                        variant={employee.specialty && ["Barbero","Estilista","Colorista"].includes(employee.specialty) ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {employee.specialty || "Empleado"}
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
                      <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg border z-50" style={{ background: "#1A1A1A", borderColor: "#2E2E2E" }}>
                        <div className="py-1">
                          <button
                            onClick={() => { setEditingEmployee(employee); setActiveDropdown(null) }}
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#F0F0F0" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#252525" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => { setActiveDropdown(null) }}
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#F0F0F0" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#252525" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                          >
                            <Calendar className="h-4 w-4" />
                            Ver Agenda
                          </button>
                          <button
                            onClick={() => handleResetPassword(employee)}
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2" style={{ color: "#F59E0B" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2A2000" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                          >
                            <KeyRound className="h-4 w-4" />
                            Resetear Clave
                          </button>
                          <div style={{ height: 1, background: "#252525", margin: "4px 0" }} />
                          <button
                            onClick={() => { setDeletingEmployee(employee); setActiveDropdown(null) }}
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 font-medium" style={{ color: "#EF4444" }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1F1212" }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
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
                <div className="flex items-center gap-2 text-sm" style={{ color: "#8A8A8A" }}>
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "#8A8A8A" }}>
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
                {employee.commission_rate != null && employee.commission_rate > 0 && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "#22C55E" }}>
                    <DollarSign className="h-4 w-4" />
                    <span>Comisión: {(employee.commission_rate * 100).toFixed(0)}%</span>
                  </div>
                )}
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
