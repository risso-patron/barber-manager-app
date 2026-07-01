"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const timeSlotVariants = cva(
  "px-4 py-3 rounded-lg border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20",
        false:
          "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
      },
      isDisabled: {
        true: "bg-secondary/50 border-border text-muted-foreground",
      }
    },
    compoundVariants: [
      {
        selected: true,
        isDisabled: true,
        className: "bg-secondary/50 border-border text-muted-foreground shadow-none",
      },
    ],
    defaultVariants: {
      selected: false,
      isDisabled: false,
    },
  }
);

export interface TimeSlotProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof timeSlotVariants> {
  time: string;
}

const TimeSlot = React.forwardRef<HTMLButtonElement, TimeSlotProps>(
  ({ className, selected, isDisabled, time, ...props }, ref) => {
    return (
      <button
        className={cn(timeSlotVariants({ selected, isDisabled }), className)}
        ref={ref}
        disabled={!!isDisabled}
        {...props}
      >
        <span className="font-medium">{time}</span>
      </button>
    );
  }
);
TimeSlot.displayName = "TimeSlot";

export { TimeSlot, timeSlotVariants };