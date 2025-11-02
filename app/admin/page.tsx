import { AppointmentSystem } from "@/components/appointments/appointment-system"

export default function AdminPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="text-gray-600">Gestión completa de citas, empleados y servicios</p>
      </div>

      <AppointmentSystem />
    </div>
  )
}
