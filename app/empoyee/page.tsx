import { AppointmentSystem } from "@/components/appointments/appointment-system"

export default function EmployeePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mi Área de Trabajo</h1>
        <p className="text-gray-600">Gestiona tu agenda y horarios de trabajo</p>
      </div>
      
      <AppointmentSystem />
    </div>
  )
}