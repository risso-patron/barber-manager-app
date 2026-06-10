import { useState } from 'react';
import { Scissors, Sparkles, Zap, Star, Check, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ServiceCard } from './components/ServiceCard';
import { BarberCard } from './components/BarberCard';
import { TimeSlot } from './components/TimeSlot';
import { BookingSummary } from './components/BookingSummary';
import { Stepper } from './components/Stepper';
import { Calendar } from './components/Calendar';
import { OrnoLogo } from './components/OrnoLogo';
import { ConfirmationModal } from './components/ConfirmationModal';

interface Service {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  duration: string;
  price: string;
}

interface Barber {
  id: string;
  avatar: string;
  name: string;
  specialty: string;
  rating: number;
  completedAppointments: number;
  availability: string;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loyaltyPoints] = useState(245);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const services: Service[] = [
    {
      id: '1',
      icon: <Scissors className="w-6 h-6" />,
      name: 'Corte Clásico',
      description: 'Corte tradicional con tijera y máquina',
      duration: '30',
      price: '15'
    },
    {
      id: '2',
      icon: <Sparkles className="w-6 h-6" />,
      name: 'Fade Premium',
      description: 'Degradado profesional con acabado impecable',
      duration: '45',
      price: '25'
    },
    {
      id: '3',
      icon: <Star className="w-6 h-6" />,
      name: 'Barba & Bigote',
      description: 'Perfilado y arreglo con navaja caliente',
      duration: '25',
      price: '12'
    },
    {
      id: '4',
      icon: <Zap className="w-6 h-6" />,
      name: 'Tratamiento Capilar',
      description: 'Hidratación profunda y masaje relajante',
      duration: '30',
      price: '20'
    }
  ];

  const barbers: Barber[] = [
    {
      id: '1',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      name: 'Miguel Santos',
      specialty: 'Fade Specialist',
      rating: 4.9,
      completedAppointments: 1200,
      availability: 'Disponible hoy'
    },
    {
      id: '2',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      name: 'Carlos Mendoza',
      specialty: 'Classic Cuts',
      rating: 4.8,
      completedAppointments: 980,
      availability: 'Disponible mañana'
    },
    {
      id: '3',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      name: 'Javier Ruiz',
      specialty: 'Beard Expert',
      rating: 4.9,
      completedAppointments: 1450,
      availability: 'Disponible hoy'
    },
    {
      id: '4',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      name: 'Roberto Silva',
      specialty: 'Premium Stylist',
      rating: 5.0,
      completedAppointments: 2100,
      availability: 'Disponible hoy'
    }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30'
  ];

  const steps = [
    { label: 'Servicio', completed: currentStep > 0, active: currentStep === 0 },
    { label: 'Barbero', completed: currentStep > 1, active: currentStep === 1 },
    { label: 'Fecha y Hora', completed: currentStep > 2, active: currentStep === 2 },
    { label: 'Confirmación', completed: currentStep > 3, active: currentStep === 3 }
  ];

  const handleServiceToggle = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmBooking = () => {
    setShowConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setCurrentStep(0);
    setSelectedServices([]);
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const totalDuration = selectedServices.reduce((acc, service) => acc + parseInt(service.duration), 0);
  const totalPrice = selectedServices.reduce((acc, service) => acc + parseFloat(service.price), 0);

  return (
    <div className="dark min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <OrnoLogo />

        <div className="text-center mb-12">
          <h1 className="text-5xl mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Reservar cita</h1>
          <p className="text-lg text-muted-foreground">Selecciona tus servicios y agenda tu próxima visita</p>
        </div>

        <Stepper steps={steps} />

        {currentStep > 0 && (
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Selecciona tus servicios</h2>
                <div className="grid grid-cols-1 gap-4">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      icon={service.icon}
                      name={service.name}
                      description={service.description}
                      duration={`${service.duration} min`}
                      price={service.price}
                      selected={selectedServices.some(s => s.id === service.id)}
                      onClick={() => handleServiceToggle(service)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Selecciona tu barbero</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {barbers.map((barber) => (
                    <BarberCard
                      key={barber.id}
                      avatar={barber.avatar}
                      name={barber.name}
                      specialty={barber.specialty}
                      rating={barber.rating}
                      completedAppointments={barber.completedAppointments}
                      availability={barber.availability}
                      selected={selectedBarber?.id === barber.id}
                      onClick={() => setSelectedBarber(barber)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Selecciona fecha y hora</h2>

                <div className="mb-6">
                  <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>

                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h3 className="text-lg font-medium mb-4">Horarios disponibles</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {timeSlots.map((time) => (
                        <TimeSlot
                          key={time}
                          time={time}
                          selected={selectedTime === time}
                          onClick={() => setSelectedTime(time)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Confirma tu reserva</h2>

                <div className="bg-card border border-border rounded-lg p-8 mb-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-3">Servicios</h3>
                      {selectedServices.map((service, index) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <div>
                            <p className="text-foreground font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
                          </div>
                          <p className="text-foreground font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                            ${service.price}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-sm text-muted-foreground mb-3">Detalles</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Barbero</span>
                          <span className="text-foreground font-medium">{selectedBarber?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha</span>
                          <span className="text-foreground font-medium">{selectedDate && formatDate(selectedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hora</span>
                          <span className="text-foreground font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duración total</span>
                          <span className="text-foreground font-medium">{totalDuration} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-foreground">Total</span>
                        <span className="text-3xl font-semibold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {loyaltyPoints > 0 && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-foreground font-medium">Tienes {loyaltyPoints} puntos disponibles</h3>
                        <p className="text-sm text-muted-foreground">Puedes aplicar un descuento del 10%</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-4 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
                >
                  Confirmar Reserva
                </button>
              </motion.div>
            )}
          </div>

          <div>
            <BookingSummary
              services={selectedServices.map(s => ({ name: s.name, duration: `${s.duration} min`, price: s.price }))}
              barber={selectedBarber?.name}
              date={selectedDate ? formatDate(selectedDate) : undefined}
              time={selectedTime || undefined}
              onContinue={handleContinue}
              continueLabel={currentStep === 0 ? 'Continuar' : currentStep === 1 ? 'Continuar' : currentStep === 2 ? 'Continuar' : undefined}
              continueDisabled={
                (currentStep === 0 && selectedServices.length === 0) ||
                (currentStep === 1 && !selectedBarber) ||
                (currentStep === 2 && (!selectedDate || !selectedTime))
              }
            />
          </div>
        </div>

        <ConfirmationModal
          visible={showConfirmation}
          onClose={handleCloseConfirmation}
          barber={selectedBarber?.name || ''}
          date={selectedDate ? formatDate(selectedDate) : ''}
          time={selectedTime || ''}
          services={selectedServices.map(s => s.name)}
        />
      </div>
    </div>
  );
}