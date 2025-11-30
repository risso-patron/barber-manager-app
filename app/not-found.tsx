import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
          <CardDescription className="text-xl">
            Página no encontrada
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild variant="default">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir al Inicio
              </Link>
            </Button>
            
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t mt-6">
            <p className="text-sm text-gray-500 mb-3">
              ¿Necesitas ayuda? Prueba estos enlaces:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link 
                href="/auth/login" 
                className="text-sm text-blue-600 hover:underline"
              >
                Iniciar Sesión
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/book/demo" 
                className="text-sm text-blue-600 hover:underline"
              >
                Reservar Cita
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/terms" 
                className="text-sm text-blue-600 hover:underline"
              >
                Términos
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/privacy" 
                className="text-sm text-blue-600 hover:underline"
              >
                Privacidad
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
