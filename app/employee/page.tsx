import { AppointmentSystem } from "@/components/appointments/appointment-system"
import { WorkSessionTracker } from "@/components/employee/work-session-tracker"

export default function EmployeePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mi área de trabajo</h1>
        <p className="text-gray-600">Gestiona tu agenda diaria y mantén el control de tus horarios</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <AppointmentSystem />
        <WorkSessionTracker />
      </div>
    </div>
  )
}
