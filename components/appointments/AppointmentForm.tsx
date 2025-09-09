export const AppointmentForm = () => {
  const { user, addAppointment } = useAppStore();

  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'client') return;

    const newAppointment: Appointment = {
      id: uuidv4(),
      client_id: user.id,
      barber_id: barberId,
      service_id: serviceId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: 'pending',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addAppointment(newAppointment);

    // Reset
    setBarberId('');
    setServiceId('');
    setAppointmentDate('');
    setAppointmentTime('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Barbero</label>
        <input
          type="text"
          value={barberId}
          onChange={(e) => setBarberId(e.target.value)}
          className="input"
          placeholder="ID del barbero"
        />
      </div>

      <div>
        <label>Servicio</label>
        <input
          type="text"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="input"
          placeholder="ID del servicio"
        />
      </div>

      <div>
        <label>Fecha</label>
        <input
          type="date"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label>Hora</label>
        <input
          type="time"
          value={appointmentTime}
          onChange={(e) => setAppointmentTime(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label>Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input"
          placeholder="Notas opcionales"
        />
      </div>

      <button type="submit" className="btn btn-primary">Reservar cita</button>
    </form>
  );
};