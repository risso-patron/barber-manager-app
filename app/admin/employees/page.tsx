"use client"

// EMP-1 · Employees sobre el framework ORNO: tokens en vez de ~30 hex inline,
// ActionMenu (adiós dropdown con hover en JS), StatStrip, SearchInput +
// NativeSelect, ClientAvatar con imagen, Alert persistente para contraseñas
// temporales (información operacional — nunca un toast) y notify() en CRUD.
// Queries, handlers, rutas API y permisos idénticos al legacy.

import { useState, useMemo, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { SearchInput } from "@/components/ui/search-input"
import { NativeSelect } from "@/components/ui/native-select"
import { StatCard, StatStrip } from "@/components/ui/stat-card"
import { ActionMenu, type ActionMenuAction } from "@/components/ui/action-menu"
import { useNotify } from "@/components/ui/notify"
import {
  Users,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Calendar,
  KeyRound,
  DollarSign,
  Copy,
} from "lucide-react"
import { DEMO_EMPLOYEES } from "@/lib/demo"
import { createBrowserClient } from "@supabase/ssr"
import { EmployeeModal } from "@/components/admin/employees/employee-modal"
import { ClientAvatar } from "@/components/admin/clients/client-identity"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AsyncPane, paneState } from "@/components/ui/async-pane"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonList } from "@/components/ui/skeleton"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createBrowserClient(supabaseUrl!, supabaseAnonKey!) : null

const BARBER_SPECIALTIES = ["barbero"]

function isBarber(emp: EmployeeWithSpecialty): boolean {
  return BARBER_SPECIALTIES.includes(emp.specialty || "")
}

type EmployeeWithSpecialty = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatar?: string
  avatar_url?: string
  specialty?: string | null
  commission_rate?: number | null
}

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "Todos los roles" },
  { value: "barberos", label: "Barberos" },
  { value: "staff", label: "Staff" },
]

/**
 * Contraseña temporal — información operacional, no un mensaje: persiste
 * hasta que el admin la copie y cierre. Caso canónico del futuro
 * InfoPanel/ResultCard de ORNO; mientras tanto, Alert persistente.
 */
function TempPasswordAlert({
  variant,
  title,
  name,
  password,
  note,
  onDismiss,
}: {
  variant: "success" | "info"
  title: string
  name: string
  password: string
  note: string
  onDismiss: () => void
}) {
  const notify = useNotify()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      notify({ title: "Contraseña copiada." })
    } catch {
      notify({ kind: "error", title: "No se pudo copiar.", description: "Seleccionala y copiala manualmente." })
    }
  }

  return (
    <Alert
      variant={variant}
      title={title}
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleCopy}>
            <Copy className="size-3.5" aria-hidden="true" />
            Copiar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Cerrar
          </Button>
        </div>
      }
    >
      <p>
        Contraseña temporal de <strong>{name}</strong>:{" "}
        <code className="rounded bg-card px-2 py-0.5 font-mono font-semibold text-foreground">
          {password}
        </code>
      </p>
      <p className="mt-1 text-xs">La contraseña solo se mostrará una vez. {note}</p>
    </Alert>
  )
}

export default function EmployeesPage() {
  const user = useRequireAuth(["admin"])
  const notify = useNotify()
  const [employees, setEmployees] = useState<EmployeeWithSpecialty[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [newEmployeePassword, setNewEmployeePassword] = useState<{ name: string; password: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | "barberos" | "staff">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithSpecialty | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeWithSpecialty | null>(null)
  const [resetPasswordResult, setResetPasswordResult] = useState<{ name: string; password: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleResetPassword = async (employee: EmployeeWithSpecialty) => {
    if (!supabase) {
      setResetPasswordResult({ name: employee.name, password: "demo-1234" })
      return
    }
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
      setIsLoading(false)
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
        setIsLoading(false)
      })
  }, [])

  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)

      const matchesRole =
        filterRole === "all" ||
        (filterRole === "barberos" && isBarber(emp)) ||
        (filterRole === "staff" && !isBarber(emp))

      return matchesSearch && matchesRole
    })
  }, [employees, searchTerm, filterRole])

  useEffect(() => { setPage(0) }, [searchTerm, filterRole])

  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE)
  const pagedEmployees = filteredEmployees.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Statistics
  const stats = useMemo(() => {
    const barbers = employees.filter(isBarber).length
    return {
      total: employees.length,
      barbers,
      employees: employees.length - barbers,
    }
  }, [employees])

  const handleCreateEmployee = async (employee: Omit<EmployeeWithSpecialty, "id">) => {
    setApiError(null)

    if (!supabase) {
      const newEmp: EmployeeWithSpecialty = {
        id: `demo-emp-${Date.now()}`,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        specialty: employee.specialty ?? null,
        avatar: employee.avatar || undefined,
        commission_rate: employee.commission_rate ?? null,
      }
      setEmployees(prev => [newEmp, ...prev])
      setNewEmployeePassword({ name: employee.name, password: "demo-1234" })
      setIsCreateModalOpen(false)
      return
    }

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
      notify({ title: "Cambios guardados." })
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
    if (!error && data) {
      setEmployees(employees.map(emp =>
        emp.id === id ? { ...data, avatar: data.avatar_url, specialty: data.specialty, commission_rate: data.commission_rate } : emp
      ))
      notify({ title: "Cambios guardados." })
    }
    setEditingEmployee(null)
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!supabase) {
      setEmployees(prev => prev.filter(emp => emp.id !== id))
      notify({ title: "Empleado eliminado." })
      setDeletingEmployee(null)
      return
    }
    const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setEmployees(employees.filter(emp => emp.id !== id))
      notify({ title: "Empleado eliminado." })
    }
    setDeletingEmployee(null)
  }

  /** Acciones por empleado — la lógica vive acá; ActionMenu solo la presenta. */
  const buildEmployeeActions = (employee: EmployeeWithSpecialty): ActionMenuAction[][] => [
    [
      { label: "Editar", icon: Edit, onSelect: () => setEditingEmployee(employee) },
      { label: "Ver Agenda", icon: Calendar, href: `/admin/appointments?employeeId=${encodeURIComponent(employee.id)}` },
      { label: "Resetear Clave", icon: KeyRound, tone: "warning" as const, onSelect: () => handleResetPassword(employee) },
    ],
    [{ label: "Eliminar", icon: Trash2, tone: "danger" as const, onSelect: () => setDeletingEmployee(employee) }],
  ]

  if (!user) return null

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Error de API — persistente hasta que el admin lo cierre */}
      {apiError && (
        <Alert
          variant="danger"
          title="Algo salió mal"
          action={
            <Button variant="ghost" size="sm" onClick={() => setApiError(null)}>
              Cerrar
            </Button>
          }
        >
          {apiError}
        </Alert>
      )}

      {/* Contraseña temporal del nuevo empleado */}
      {newEmployeePassword && (
        <TempPasswordAlert
          variant="success"
          title="Empleado creado"
          name={newEmployeePassword.name}
          password={newEmployeePassword.password}
          note="Compartila con el empleado para que pueda iniciar sesión."
          onDismiss={() => setNewEmployeePassword(null)}
        />
      )}

      {/* Resultado de reset de contraseña */}
      {resetPasswordResult && (
        <TempPasswordAlert
          variant="info"
          title="Contraseña reseteada"
          name={resetPasswordResult.name}
          password={resetPasswordResult.password}
          note="La anterior ya no sirve."
          onDismiss={() => setResetPasswordResult(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Empleados</h1>
          <p className="mt-1 text-[13px] text-ink-600">Administra barberos y personal de la barbería</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Statistics */}
      <StatStrip className="xl:grid-cols-3">
        <StatCard label="Total Empleados" value={stats.total} loading={isLoading} />
        <StatCard label="Barberos" value={stats.barbers} loading={isLoading} />
        <StatCard label="Staff" value={stats.employees} loading={isLoading} />
      </StatStrip>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Buscar por nombre, email o teléfono…"
          className="w-full sm:w-80"
        />
        <NativeSelect
          aria-label="Filtrar por rol"
          value={filterRole}
          onValueChange={(v) => setFilterRole(v as "all" | "barberos" | "staff")}
          options={ROLE_FILTER_OPTIONS}
          className="w-auto"
        />
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AsyncPane
          state={paneState({ loading: isLoading, count: filteredEmployees.length })}
          skeleton={<SkeletonList rows={6} className="col-span-full" />}
          empty={
            <EmptyState
              icon={Users}
              title="No se encontraron empleados"
              description="Ajusta la búsqueda o crea un empleado nuevo."
              action={
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="size-4" aria-hidden="true" />
                  Nuevo Empleado
                </Button>
              }
              size="compact"
              className="col-span-full"
            />
          }
          size="compact"
        >
          {pagedEmployees.map((employee) => (
            <Card key={employee.id} className="transition-shadow duration-micro hover:shadow-raised">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ClientAvatar name={employee.name} imageUrl={employee.avatar} />
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <Badge variant={isBarber(employee) ? "info" : "neutral"} className="mt-1">
                        {employee.specialty || "Empleado"}
                      </Badge>
                    </div>
                  </div>

                  <ActionMenu
                    label={`Acciones del empleado ${employee.name}`}
                    groups={buildEmployeeActions(employee)}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Mail className="size-4" aria-hidden="true" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Phone className="size-4" aria-hidden="true" />
                  <span>{employee.phone}</span>
                </div>
                {employee.commission_rate !== null && employee.commission_rate !== undefined && employee.commission_rate > 0 && (
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <DollarSign className="size-4" aria-hidden="true" />
                    <span className="nums">Comisión: {(employee.commission_rate * 100).toFixed(0)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </AsyncPane>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <span className="nums text-sm text-ink-600">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredEmployees.length)} de {filteredEmployees.length}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              ← Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Siguiente →
            </Button>
          </div>
        </div>
      )}

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
        <ConfirmDialog
          open={!!deletingEmployee}
          onOpenChange={(open) => {
            if (!open) setDeletingEmployee(null)
          }}
          title="¿Eliminar a este empleado?"
          description={
            <>
              <strong>{deletingEmployee.name}</strong>. Esta acción no se puede deshacer: se eliminan
              sus datos y asignaciones.
            </>
          }
          confirmLabel="Sí, eliminar"
          cancelLabel="Mantener empleado"
          tone="danger"
          onConfirm={() => handleDeleteEmployee(deletingEmployee.id)}
        />
      )}
    </div>
  )
}
