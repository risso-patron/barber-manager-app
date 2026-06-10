"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4 w-full", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  {
                    "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30": isActive,
                    "bg-transparent border-primary text-primary": isCompleted,
                    "bg-transparent border-border text-muted-foreground": !isActive && !isCompleted,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors whitespace-nowrap hidden md:inline",
                  {
                    "text-foreground": isActive,
                    "text-primary": isCompleted,
                    "text-muted-foreground": !isActive && !isCompleted,
                  }
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-px bg-border relative">
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                  style={{ width: isCompleted ? "100%" : "0%" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}