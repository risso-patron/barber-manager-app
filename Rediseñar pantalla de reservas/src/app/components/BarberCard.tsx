import { Star, Calendar } from 'lucide-react';

interface BarberCardProps {
  avatar: string;
  name: string;
  specialty: string;
  rating: number;
  completedAppointments: number;
  availability: string;
  selected: boolean;
  onClick: () => void;
}

export function BarberCard({ avatar, name, specialty, rating, completedAppointments, availability, selected, onClick }: BarberCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-6 rounded-lg border text-left transition-all duration-300
        ${selected
          ? 'bg-card border-primary shadow-[0_0_20px_rgba(229,57,53,0.15)]'
          : 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:translate-y-[-2px]'
        }
      `}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`
          w-20 h-20 rounded-full overflow-hidden border-2 transition-colors
          ${selected ? 'border-primary' : 'border-border'}
        `}>
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full">
          <h3 className="text-lg font-medium text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{specialty}</p>

          <div className="flex items-center justify-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-medium text-foreground">{rating}</span>
            <span className="text-sm text-muted-foreground ml-1">
              ({completedAppointments.toLocaleString()} citas)
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{availability}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
