import { AppointmentSystem } from "@/components/appointments/appointment-system"

export default function ClientPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mis Servicios</h1>
        <p className="text-gray-600">Reserva citas y gestiona tus servicios</p>
      </div>
      
      <AppointmentSystem />
    </div>
  )

}import { AppointmentForm } from "@/components/appointment-system/AppointmentForm";

export default function ClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reservar una cita</h1>
      <AppointmentForm />
    </div>
  );
}