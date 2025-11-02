"use client"

import { AppointmentForm } from "./appointment-form"
import { useAppStore } from "@/lib/store"

interface AppointmentSystemProps {
  onAppointmentCreated?: () => void
}

export function AppointmentSystem({ onAppointmentCreated }: AppointmentSystemProps = {}) {
  const { appointments } = useAppStore()

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Reservar una cita</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Completa el formulario para crear una nueva reserva con tu barbero de confianza.
        </p>
        <AppointmentForm onSuccess={onAppointmentCreated} />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Citas recientes</h3>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Aún no tienes citas registradas. Cuando crees una, aparecerá en esta lista.
          </p>
        ) : (
          <ul className="space-y-2">
            {appointments.map((appointment) => (
              <li
                key={appointment.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {appointment.appointment_date} · {appointment.appointment_time}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {appointment.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  Servicio: {appointment.service_id || "Sin especificar"}
                </p>
                {appointment.notes && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Notas: {appointment.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AppointmentSystem
