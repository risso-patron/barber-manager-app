'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error);
    
    // En producción, podrías enviar el error a un servicio de tracking
    // ej: Sentry, LogRocket, etc.
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-center text-2xl">
            ¡Algo salió mal!
          </CardTitle>
          <CardDescription className="text-center">
            Ocurrió un error inesperado en la aplicación
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message || 'Error desconocido'}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* User-friendly message */}
          <p className="text-gray-600 text-center">
            No te preocupes, esto puede pasar. Intenta recargar la página o volver al inicio.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={reset}
              variant="default"
              className="flex-1"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>

          {/* Help text */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Si el problema persiste, contacta a soporte en{' '}
              <a 
                href="mailto:luisrissopa@gmail.com" 
                className="text-blue-600 hover:underline"
              >
                luisrissopa@gmail.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
