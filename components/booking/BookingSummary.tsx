"use client";

import * as React from "react";
import { Calendar, Clock, User, Scissors, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Placeholder types - these should be replaced with actual types from the project
interface Service {
  id: string;
  name: string;
  price: number;
}

interface Barber {
  id: string;
  name: string;
}

interface BookingSummaryProps {
  selectedServices: Service[];
  selectedBarber: Barber | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  totalPrice: number;
  loyaltyPoints?: number;
  onConfirm: () => void;
  isConfirmDisabled?: boolean;
  className?: string;
}

export function BookingSummary({
  selectedServices,
  selectedBarber,
  selectedDate,
  selectedTime,
  totalDuration,
  totalPrice,
  loyaltyPoints,
  onConfirm,
  isConfirmDisabled = false,
  className,
}: BookingSummaryProps) {
  return (
    <div className={cn("sticky top-8 bg-card border border-border rounded-lg p-6", className)}>
      <h3 className="text-xl font-medium text-foreground mb-6">Resumen de Reserva</h3>

      <div className="space-y-4 mb-6">
        {selectedServices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Scissors className="w-4 h-4" />
              <span>Servicios</span>
            </div>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between items-center pl-6">
                  <span className="text-sm text-foreground">{service.name}</span>
                  <span className="text-sm text-muted-foreground">${service.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedBarber && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="w-4 h-4" />
              <span>Barbero</span>
            </div>
            <p className="text-sm text-foreground pl-6">{selectedBarber.name}</p>
          </div>
        )}

        {selectedDate && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>Fecha</span>
            </div>
            <p className="text-sm text-foreground pl-6">
              {selectedDate.toLocaleDateString("es-ES", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {selectedTime && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span>Hora</span>
            </div>
            <p className="text-sm font-medium text-foreground pl-6">{selectedTime}</p>
          </div>
        )}
      </div>

      {selectedServices.length > 0 && (
        <>
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Duración total</span>
              <span className="text-sm font-medium text-foreground">{totalDuration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-foreground">Precio total</span>
              <span className="text-2xl font-semibold text-primary">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}

      {loyaltyPoints && loyaltyPoints > 0 && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary"/>
            <p className="text-sm text-primary-foreground">
                Acumularás <span className="font-bold">{loyaltyPoints}</span> puntos con esta reserva.
            </p>
        </div>
      )}

      <Button
        onClick={onConfirm}
        disabled={isConfirmDisabled}
        className="w-full mt-6"
        size="lg"
      >
        Confirmar Reserva
      </Button>
    </div>
  );
}