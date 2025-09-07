"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Database, Play } from "lucide-react"

export function SetupInstructions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">⚠️ Configuración Requerida</h1>
          <p className="mt-2 text-gray-600">Necesitas ejecutar los scripts SQL antes de usar la aplicación</p>
        </div>

        <Alert variant="destructive">
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> Las tablas de la base de datos no existen. Debes ejecutar los scripts SQL primero.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Ir a Supabase SQL Editor
              </CardTitle>
              <CardDescription>Abre el editor SQL en tu proyecto de Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a
                  href="https://supabase.com/dashboard/project/gfvcyiyzcldcchlarlgk/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir SQL Editor
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Ejecutar Script de Creación
              </CardTitle>
              <CardDescription>Copia y pega el script SQL para crear las tablas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Ve al archivo <code className="bg-gray-100 px-1 rounded">scripts/01-create-tables.sql</code> en el
                  proyecto, copia todo el contenido y pégalo en el SQL Editor de Supabase.
                </AlertDescription>
              </Alert>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                <p className="text-green-400">-- Ejemplo del script:</p>
                <p>CREATE TYPE user_role AS ENUM ('client', 'employee', 'admin');</p>
                <p>CREATE TABLE public.users (</p>
                <p className="ml-4">id UUID REFERENCES auth.users(id) PRIMARY KEY,</p>
                <p className="ml-4">name VARCHAR(100) NOT NULL,</p>
                <p className="ml-4">email VARCHAR(255) UNIQUE NOT NULL,</p>
                <p className="ml-4">role user_role NOT NULL DEFAULT 'client',</p>
                <p className="ml-4">phone VARCHAR(20),</p>
                <p className="ml-4">...</p>
                <p>);</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  3
                </span>
                Ejecutar el Script
              </CardTitle>
              <CardDescription>Haz clic en "Run" para ejecutar el script</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Play className="h-4 w-4" />
                <AlertDescription>
                  Después de pegar el script, haz clic en el botón <strong>"Run"</strong> en la esquina inferior derecha
                  del editor SQL.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  4
                </span>
                Probar el Registro
              </CardTitle>
              <CardDescription>Una vez ejecutado el script, podrás registrar usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Después de ejecutar el script exitosamente, regresa a la página de registro y podrás crear tu cuenta
                  sin problemas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
