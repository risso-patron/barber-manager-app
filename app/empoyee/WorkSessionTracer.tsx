'use client';

import { useAppStore } from '@/lib/store';
import { TimeLog } from '@/lib/types';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const WorkSessionTracker = () => {
  const { user } = useAppStore();
  const [log, setLog] = useState<TimeLog | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleCheckIn = () => {
    setLog({
      id: uuidv4(),
      employee_id: user?.id || '',
      date: today,
      time_in: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  };

  const handleBreakStart = () => {
    if (log) setLog({ ...log, break_start: new Date().toISOString() });
  };

  const handleBreakEnd = () => {
    if (log) setLog({ ...log, break_end: new Date().toISOString() });
  };

  const handleCheckOut = () => {
    if (log) {
      const timeOut = new Date().toISOString();
      const totalHours = calculateHours(log.time_in!, timeOut, log.break_start, log.break_end);
      setLog({ ...log, time_out: timeOut, total_hours: totalHours });
    }
  };

  const calculateHours = (
    start: string,
    end: string,
    breakStart?: string,
    breakEnd?: string
  ): number => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const breakDuration =
      breakStart && breakEnd
        ? new Date(breakEnd).getTime() - new Date(breakStart).getTime()
        : 0;
    const total = endTime - startTime - breakDuration;
    return Math.round(total / (1000 * 60 * 60) * 100) / 100; // horas con decimales
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Registro de jornada</h2>

      {!log?.time_in && (
        <button onClick={handleCheckIn} className="btn btn-primary">
          Check-in
        </button>
      )}

      {log?.time_in && !log?.break_start && (
        <button onClick={handleBreakStart} className="btn btn-secondary">
          Iniciar break
        </button>
      )}

      {log?.break_start && !log?.break_end && (
        <button onClick={handleBreakEnd} className="btn btn-secondary">
          Terminar break
        </button>
      )}

      {log?.time_in && !log?.time_out && (
        <button onClick={handleCheckOut} className="btn btn-danger">
          Check-out
        </button>
      )}

      {log?.total_hours && (
        <p className="text-sm text-gray-600">
          Total trabajado hoy: <strong>{log.total_hours} horas</strong>
        </p>
      )}
    </div>
  );
};