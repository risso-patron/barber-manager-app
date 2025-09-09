import { AppointmentSystem } from "@/components/appointments/appointment-system"

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header contextual */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600">Gestión completa de citas, empleados y servicios</p>
      </div>
      
      {/* Sistema de citas */}
      <AppointmentSystem />
    </div>
  )
}