import { Check } from 'lucide-react';

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepperProps {
  steps: Step[];
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-4 max-w-3xl mx-auto mb-12">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex items-center gap-3 flex-1">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
              ${step.active
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                : step.completed
                  ? 'bg-transparent border-primary text-primary'
                  : 'bg-transparent border-border text-muted-foreground'
              }
            `}>
              {step.completed ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`
              text-sm font-medium transition-colors whitespace-nowrap
              ${step.active
                ? 'text-foreground'
                : step.completed
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }
            `}>
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div className="flex-1 h-[2px] mx-4 relative overflow-hidden bg-border">
              <div
                className={`
                  absolute inset-y-0 left-0 bg-primary transition-all duration-500
                  ${step.completed ? 'w-full' : 'w-0'}
                `}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
