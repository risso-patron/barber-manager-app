import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scissors, Package, Users, BarChart3, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">Barber Manager</h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            La solución completa para gestionar tu barbería. Administra citas, empleados, inventario y más desde una
            sola plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2 w-full sm:w-auto">
              <Link href="/reservar">
                <Clock className="h-5 w-5" />
                Reservar Cita
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white/80 hover:bg-white hover:text-slate-900 bg-white/5 backdrop-blur-sm w-full sm:w-auto">
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10 w-full sm:w-auto"
            >
              <Link href="/auth/register">Registrarse</Link>
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-4">
            ✨ Reserva tu cita en segundos sin necesidad de crear cuenta
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Scissors className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Gestión de Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Reserva y administra citas de manera eficiente con nuestro sistema intuitivo.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Users className="h-8 w-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Control de Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Gestiona horarios, asistencia y rendimiento de tu equipo de barberos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <Package className="h-8 w-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Controla tu stock de productos y recibe alertas de reposición automáticas.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-orange-400 mb-2" />
              <CardTitle className="text-white">Reportes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Analiza el rendimiento de tu negocio con reportes detallados y gráficas.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-white">¿Listo para modernizar tu barbería?</CardTitle>
              <CardDescription className="text-slate-300">
                Únete a cientos de barberos que ya confían en Barber Manager para gestionar su negocio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/register">Comenzar Gratis</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
