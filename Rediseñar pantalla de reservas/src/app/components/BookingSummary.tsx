import { Calendar, Clock, User, Scissors } from 'lucide-react';

interface Service {
  name: string;
  duration: string;
  price: string;
}

interface BookingSummaryProps {
  services: Service[];
  barber?: string;
  date?: string;
  time?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}

export function BookingSummary({
  services,
  barber,
  date,
  time,
  onContinue,
  continueLabel = 'Continuar',
  continueDisabled = false
}: BookingSummaryProps) {
  const totalDuration = services.reduce((acc, service) => {
    const minutes = parseInt(service.duration);
    return acc + minutes;
  }, 0);

  const totalPrice = services.reduce((acc, service) => {
    const price = parseFloat(service.price);
    return acc + price;
  }, 0);

  return (
    <div className="sticky top-8 bg-card border border-border rounded-lg p-6">
      <h3 className="text-xl font-medium text-foreground mb-6">Resumen de Reserva</h3>

      <div className="space-y-4 mb-6">
        {services.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Scissors className="w-4 h-4" />
              <span>Servicios</span>
            </div>
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between items-center pl-6">
                  <span className="text-sm text-foreground">{service.name}</span>
                  <span className="text-sm text-muted-foreground">${service.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {barber && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="w-4 h-4" />
              <span>Barbero</span>
            </div>
            <p className="text-sm text-foreground pl-6">{barber}</p>
          </div>
        )}

        {date && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>Fecha</span>
            </div>
            <p className="text-sm text-foreground pl-6">{date}</p>
          </div>
        )}

        {time && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span>Hora</span>
            </div>
            <p className="text-sm text-foreground pl-6" style={{ fontFamily: 'var(--font-mono)' }}>{time}</p>
          </div>
        )}
      </div>

      {services.length > 0 && (
        <>
          <div className="border-t border-border pt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Duración total</span>
              <span className="text-sm text-foreground">{totalDuration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-foreground">Precio total</span>
              <span className="text-2xl font-semibold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {onContinue && (
            <button
              onClick={onContinue}
              disabled={continueDisabled}
              className={`
                w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
                ${continueDisabled
                  ? 'bg-primary/50 text-white cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20'
                }
              `}
            >
              {continueLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
