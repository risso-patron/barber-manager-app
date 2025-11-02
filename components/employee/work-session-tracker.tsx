"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import type { TimeLog } from "@/lib/types"

interface TrackerState extends TimeLog {
  time_in?: string
  break_start?: string
  break_end?: string
  time_out?: string
  total_hours?: number
}

export function WorkSessionTracker() {
  const { user } = useAppStore()
  const [log, setLog] = useState<TrackerState | null>(null)

  if (!user || (user.role !== "employee" && user.role !== "admin")) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
        Inicia sesión con una cuenta de empleado para registrar tu jornada laboral.
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]

  const handleCheckIn = () => {
    setLog({
      id: crypto.randomUUID(),
      employee_id: user.id,
      date: today,
      created_at: new Date().toISOString(),
      time_in: new Date().toISOString(),
    })
  }

  const handleBreakStart = () => {
    setLog((current) => (current ? { ...current, break_start: new Date().toISOString() } : current))
  }

  const handleBreakEnd = () => {
    setLog((current) => (current ? { ...current, break_end: new Date().toISOString() } : current))
  }

  const handleCheckOut = () => {
    setLog((current) => {
      if (!current?.time_in) {
        return current
      }

      const timeOut = new Date().toISOString()
      const totalHours = calculateHours(current.time_in, timeOut, current.break_start, current.break_end)

      return {
        ...current,
        time_out: timeOut,
        total_hours: totalHours,
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Registro de jornada</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Controla tus horas de entrada, descansos y salida para mantener un historial preciso.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!log?.time_in && (
          <Button onClick={handleCheckIn} className="w-full sm:w-auto">
            Iniciar jornada
          </Button>
        )}

        {log?.time_in && !log?.break_start && (
          <Button onClick={handleBreakStart} variant="outline" className="w-full sm:w-auto">
            Registrar descanso
          </Button>
        )}

        {log?.break_start && !log?.break_end && (
          <Button onClick={handleBreakEnd} variant="outline" className="w-full sm:w-auto">
            Terminar descanso
          </Button>
        )}

        {log?.time_in && !log?.time_out && (
          <Button onClick={handleCheckOut} variant="destructive" className="w-full sm:w-auto">
            Finalizar jornada
          </Button>
        )}
      </div>

      {log && (
        <div className="space-y-2 rounded-md bg-gray-50 p-3 text-sm dark:bg-slate-800/60">
          <p className="font-medium text-gray-900 dark:text-slate-100">Resumen del día</p>
          <ul className="space-y-1 text-gray-600 dark:text-slate-300">
            <li>
              <span className="font-semibold">Entrada:</span> {formatTime(log.time_in)}
            </li>
            {log.break_start && (
              <li>
                <span className="font-semibold">Inicio descanso:</span> {formatTime(log.break_start)}
              </li>
            )}
            {log.break_end && (
              <li>
                <span className="font-semibold">Fin descanso:</span> {formatTime(log.break_end)}
              </li>
            )}
            {log.time_out && (
              <li>
                <span className="font-semibold">Salida:</span> {formatTime(log.time_out)}
              </li>
            )}
            {typeof log.total_hours === "number" && (
              <li>
                <span className="font-semibold">Total trabajado:</span> {log.total_hours} horas
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function calculateHours(start: string, end: string, breakStart?: string, breakEnd?: string): number {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  const breakDuration =
    breakStart && breakEnd ? new Date(breakEnd).getTime() - new Date(breakStart).getTime() : 0
  const totalMilliseconds = endTime - startTime - breakDuration

  return Math.max(0, Math.round((totalMilliseconds / (1000 * 60 * 60)) * 100) / 100)
}

function formatTime(value?: string) {
  if (!value) return "-"
  return new Date(value).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default WorkSessionTracker
