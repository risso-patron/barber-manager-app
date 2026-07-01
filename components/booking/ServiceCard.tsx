"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const serviceCardVariants = cva(
  "relative w-full p-6 rounded-lg border text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      selected: {
        true: "bg-card border-primary shadow-[0_0_20px_rgba(204,34,34,0.15)]",
        false:
          "bg-card border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

const iconContainerVariants = cva("p-3 rounded-lg transition-colors", {
  variants: {
    selected: {
      true: "bg-primary/10 text-primary",
      false: "bg-secondary text-muted-foreground",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

export interface ServiceCardProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof serviceCardVariants> {
  icon: React.ReactNode;
  name: string;
  description: string;
  duration: string;
  price: string;
}

const ServiceCard = React.forwardRef<HTMLButtonElement, ServiceCardProps>(
  (
    {
      className,
      selected,
      icon,
      name,
      description,
      duration,
      price,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(serviceCardVariants({ selected }), className)}
        ref={ref}
        {...props}
      >
        {selected && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className={cn(iconContainerVariants({ selected }))}>{icon}</div>

          <div className="flex-1">
            <h3 className="text-lg font-medium text-foreground mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {description}
            </p>

            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{duration} min</span>
                <span className="text-lg font-semibold text-primary">
                ${price}
                </span>
            </div>
          </div>
        </div>
      </button>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard, serviceCardVariants };
