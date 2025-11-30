import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full opacity-20 animate-ping" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900">
          Cargando...
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Preparando tu experiencia
        </p>
      </div>
    </div>
  );
}
