"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// Componentes de UI del nuevo diseño
import { Stepper } from "@/components/booking/Stepper";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { BarberCard } from "@/components/booking/BarberCard";
import { Calendar } from "@/components/booking/Calendar";
import { TimeSlot } from "@/components/booking/TimeSlot";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

// Tipos (deberían venir de un archivo central de tipos)
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}

interface Barber {
  id: string;
  name: string;
  specialty?: string;
  avatar_url?: string;
  avg_rating?: number | null;
  total_ratings?: number | null;
}

// Pasos para el Stepper
const bookingSteps = [
  { id: "services", label: "Servicios" },
  { id: "barber", label: "Barbero" },
  { id: "datetime", label: "Fecha y Hora" },
  { id: "confirm", label: "Confirmar" },
];

// Configuración de Supabase (se mantiene igual)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null;

export default function ReservarPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estados para la selección del usuario
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Estados para los datos cargados
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  
  // Estados de carga y error
  const [isLoading, setIsLoading] = useState({ services: true, barbers: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Lógica para obtener datos iniciales (se mantiene igual)
  useEffect(() => {
    if (!supabase) {
      // Lógica de fallback si Supabase no está configurado (se mantiene)
      console.warn("Supabase no configurado, usando datos de demostración.");
      // Aquí iría la carga de datos de demostración si es necesario
      setIsLoading({ services: false, barbers: false });
      return;
    }

    const fetchInitialData = async () => {
      setIsLoading({ services: true, barbers: true });
      try {
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, name, description, price, duration")
          .eq("is_active", true)
          .order("name");
        if (servicesData) setAllServices(servicesData as Service[]);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, services: false }));
      }

      try {
        const { data: barbersData } = await supabase
          .from("users")
          .select("id, name, specialty, avatar_url") // Asumiendo que hay avatar_url
          .eq("role", "employee")
          .order("name");
        
        if (barbersData) {
          const { data: ratingsData } = await supabase
            .from("barber_avg_ratings")
            .select("barber_id, avg_rating, total_ratings");

          const ratingsMap = new Map(
            (ratingsData ?? []).map((r: { barber_id: string; avg_rating: number; total_ratings: number }) => [
              r.barber_id,
              { avg_rating: r.avg_rating, total_ratings: r.total_ratings },
            ])
          );

          setAllBarbers(
            (barbersData as Barber[]).map((b) => ({
              ...b,
              avg_rating: ratingsMap.get(b.id)?.avg_rating ?? null,
              total_ratings: ratingsMap.get(b.id)?.total_ratings ?? null,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching barbers:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, barbers: false }));
      }
    };

    fetchInitialData();
  }, []);

  // --- Handlers para la interacción del usuario ---

  const handleServiceSelect = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    goToNextStep();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTime(null); // Reset time when date changes
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    goToNextStep();
  };

  const handleConfirmBooking = async () => {
    if (!selectedBarber || !selectedDate || !selectedTime || selectedServices.length === 0) {
      setSubmitError("Por favor completa todos los pasos para continuar.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const appointmentDateTime = new Date(selectedDate);
    const [hours = 0, minutes = 0] = selectedTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const bookingData = {
      barberId: selectedBarber.id,
      serviceIds: selectedServices.map(s => s.id),
      appointmentTime: appointmentDateTime.toISOString(),
      totalPrice,
      totalDuration,
      // NOTA: Los datos del cliente (nombre, email) deben ser recuperados
      // del usuario autenticado o de un formulario en el paso de confirmación.
      // Por ahora, se omite para la lógica de reserva.
    };

    try {
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'El horario seleccionado ya no está disponible.');
      }

      // Si la reserva es exitosa, avanzamos al paso final
      goToNextStep();

      } catch (error: unknown) {
          console.error("Error al confirmar la reserva:", error)

          const message =
            error instanceof Error
            ? error.message
            : "No se pudo completar la reserva."

          setSubmitError(message)

    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Navegación entre pasos ---

  const goToNextStep = () => {
    if (currentStep < bookingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // --- Datos calculados ---

  const { totalDuration, totalPrice } = useMemo(() => {
    const duration = selectedServices.reduce((acc, s) => acc + s.duration, 0);
    const price = selectedServices.reduce((acc, s) => acc + s.price, 0);
    return { totalDuration: duration, totalPrice: price };
  }, [selectedServices]);

  // Horarios disponibles (lógica simplificada)
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];

  // --- Renderizado condicional de cada paso ---

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: // Selección de servicios
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Selecciona tus servicios</h2>
            {isLoading.services ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    icon={<></>} // Icono placeholder
                    name={service.name}
                    description={service.description || ""}
                    duration={`${service.duration}`}
                    price={`${service.price}`}
                    selected={selectedServices.some((s) => s.id === service.id)}
                    onClick={() => handleServiceSelect(service)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 1: // Selección de barbero
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Elige tu barbero</h2>
            {isLoading.barbers ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allBarbers.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    avatarUrl={barber.avatar_url || ""}
                    name={barber.name}
                    specialty={barber.specialty || "Especialista"}
                    rating={barber.avg_rating || 0}
                    reviewCount={barber.total_ratings || 0}
                    availability="Disponible" // Lógica de disponibilidad pendiente
                    selected={selectedBarber?.id === barber.id}
                    onClick={() => handleBarberSelect(barber)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case 2: // Selección de fecha y hora
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Elige fecha y hora</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => handleDateSelect(date)}
                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                className="rounded-md border"
              />
              {selectedDate && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 self-start">
                  {timeSlots.map((time) => (
                    <TimeSlot
                      key={time}
                      time={time}
                      selected={selectedTime === time}
                      onClick={() => handleTimeSelect(time)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 3: // Confirmación
        return (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Confirma tu reserva</h2>
            <p>Aquí se mostraría un resumen final y se pedirían los datos del cliente antes de confirmar.</p>
            {submitError && <p className="text-sm text-destructive text-center mt-4">{submitError}</p>}
          </div>
        );
      case 4: // Pantalla final
        return (
            <div className="text-center py-10">
                <h2 className="text-3xl font-bold text-primary mb-4">¡Reserva Confirmada!</h2>
                <p className="text-muted-foreground mb-8">Hemos guardado tu cita. Te enviaremos un recordatorio.</p>
                <Button onClick={() => router.push('/')}>Volver al inicio</Button>
            </div>
        )
      default:
        return null;
    }
  };

  const isNextButtonDisabled = () => {
    switch (currentStep) {
      case 0: return selectedServices.length === 0;
      case 1: return !selectedBarber;
      case 2: return !selectedTime;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Reserva tu Cita</h1>
          <p className="text-muted-foreground text-center text-sm md:text-base">Sigue los pasos para asegurar tu lugar.</p>
        </header>

        <Stepper steps={bookingSteps} currentStep={currentStep} className="max-w-3xl mx-auto mb-8 md:mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <main className="col-span-1 md:col-span-2">
            {renderCurrentStep()}
          </main>
          <aside className="col-span-1">
            <BookingSummary
              selectedServices={selectedServices}
              selectedBarber={selectedBarber}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              totalDuration={totalDuration}
              totalPrice={totalPrice}
              onConfirm={handleConfirmBooking}
              isConfirmDisabled={currentStep !== 3 || isSubmitting}
            />
          </aside>
        </div>

        <footer className="mt-8 md:mt-12 flex justify-between items-center gap-4">
            <div>
                {currentStep > 0 && currentStep < bookingSteps.length - 1 && (
                    <Button variant="ghost" onClick={goToPreviousStep}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Atrás
                    </Button>
                )}
            </div>
            <div>
                {currentStep < bookingSteps.length - 2 && (
                     <Button onClick={goToNextStep} disabled={isNextButtonDisabled()}>
                        Siguiente
                    </Button>
                )}
            </div>
        </footer>
      </div>
    </div>
  );
}