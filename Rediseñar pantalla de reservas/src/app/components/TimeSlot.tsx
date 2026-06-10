interface TimeSlotProps {
  time: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function TimeSlot({ time, selected, disabled, onClick }: TimeSlotProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-3 rounded-lg border transition-all duration-200
        ${disabled
          ? 'bg-secondary/50 border-border text-muted-foreground cursor-not-allowed opacity-50'
          : selected
            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
            : 'bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5'
        }
      `}
    >
      <span className="font-medium" style={{ fontFamily: 'var(--font-mono)' }}>{time}</span>
    </button>
  );
}
