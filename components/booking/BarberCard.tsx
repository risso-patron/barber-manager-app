"use client";

import * as React from "react";
import { Check, Star, Calendar } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const barberCardVariants = cva(
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

export interface BarberCardProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof barberCardVariants> {
  avatarUrl: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  availability: string;
}

const BarberCard = React.forwardRef<HTMLButtonElement, BarberCardProps>(
  (
    {
      className,
      selected,
      avatarUrl,
      name,
      specialty,
      rating,
      reviewCount,
      availability,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(barberCardVariants({ selected }), className)}
        ref={ref}
        {...props}
      >
        {selected && (
          <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <div className="flex flex-col items-center text-center gap-4">
          <Avatar className={`h-20 w-20 border-2 ${selected ? 'border-primary' : 'border-transparent'}`}>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="w-full">
            <h3 className="text-lg font-medium text-foreground mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{specialty}</p>

            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground ml-1">
                ({reviewCount.toLocaleString()} reseñas)
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-primary font-semibold">
              <Calendar className="w-4 h-4" />
              <span>{availability}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }
);
BarberCard.displayName = "BarberCard";

export { BarberCard, barberCardVariants };