import { motion } from 'motion/react';
import { Check, Calendar, Clock, User, MapPin } from 'lucide-react';

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  barber: string;
  date: string;
  time: string;
  services: string[];
}

export function ConfirmationModal({ visible, onClose, barber, date, time, services }: ConfirmationModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-card border border-border rounded-lg max-w-lg w-full p-8"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-4 shadow-lg shadow-success/30"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>¡Reserva Confirmada!</h2>
          <p className="text-muted-foreground">Tu cita ha sido agendada exitosamente</p>
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Barbero</p>
              <p className="text-foreground font-medium">{barber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="text-foreground font-medium">{date}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hora</p>
              <p className="text-foreground font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{time}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ubicación</p>
              <p className="text-foreground font-medium">Ornó Barbería - Centro</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Servicios reservados:</p>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span className="text-sm text-foreground">{service}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground">
            Hemos enviado un correo de confirmación con todos los detalles de tu cita.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
        >
          Entendido
        </button>
      </motion.div>
    </div>
  );
}
