import { Check } from 'lucide-react';

interface ServiceCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  duration: string;
  price: string;
  selected: boolean;
  onClick: () => void;
}

export function ServiceCard({ icon, name, description, duration, price, selected, onClick }: ServiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-6 rounded-lg border text-left transition-all duration-300
        ${selected
          ? 'bg-card border-primary shadow-[0_0_20px_rgba(229,57,53,0.15)]'
          : 'bg-card border-border hover:border-primary/50 hover:shadow-lg hover:translate-y-[-2px]'
        }
      `}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-lg transition-colors
          ${selected ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}
        `}>
          {icon}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{duration}</span>
            <span className="text-lg font-semibold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
              ${price}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
