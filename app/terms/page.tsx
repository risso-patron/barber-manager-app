import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio | Barber Manager',
  description: 'Términos y condiciones de uso de Barber Manager',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Términos de Servicio
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Última actualización: Noviembre 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              1. Aceptación de Términos
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Al acceder y usar Barber Manager ("la Aplicación"), aceptas estos términos en su totalidad. 
              Si no estás de acuerdo, no debes usar la Aplicación.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Barber Manager es una plataforma SaaS de gestión para barberías que incluye:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Sistema de reserva de citas</li>
              <li>Gestión de empleados y barberos</li>
              <li>Control de inventario</li>
              <li>Reportes y analytics</li>
              <li>Notificaciones automáticas por email y WhatsApp</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              3. Elegibilidad
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Debes tener al menos 18 años</li>
              <li>Si eres propietario de barbería, representas que tienes autoridad legal</li>
              <li>Los clientes aceptan estas condiciones al registrarse</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              4. Responsabilidades del Usuario
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Barberías (Administradores):
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                  <li>Mantener credenciales de acceso seguras</li>
                  <li>Ser responsables de toda actividad en tu cuenta</li>
                  <li>Cumplir leyes laborales y de protección de datos</li>
                  <li>Verificar identidad de clientes antes de procesar pagos</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">
                  Clientes:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                  <li>Proporcionar información exacta al reservar</li>
                  <li>Cancelar citas con anticipación razonable</li>
                  <li>No usar datos de otros usuarios</li>
                  <li>Respetar políticas de cancelación de la barbería</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              5. Limitación de Responsabilidad
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Barber Manager se proporciona "tal cual". No somos responsables por:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Pérdida de datos (recomendamos mantener backups propios)</li>
              <li>Caída temporal de servicios (aunque trabajamos para minimizarla)</li>
              <li>Conflictos entre barbero y cliente</li>
              <li>Información inexacta proporcionada por usuarios</li>
            </ul>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3 font-medium">
              Máxima responsabilidad: Reembolso del mes de servicio pagado.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              6. Prohibiciones
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              No puedes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Acceder sin autorización a cuentas ajenas</li>
              <li>Usar scrapers o bots automatizados</li>
              <li>Enviar spam o malware</li>
              <li>Violar derechos de propiedad intelectual</li>
              <li>Revender acceso a terceros</li>
              <li>Usar la app para servicios ilegales</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              7. Suspensión de Cuenta
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Podemos suspender el acceso sin previo aviso si:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Violas estos términos</li>
              <li>Se detecta actividad fraudulenta</li>
              <li>Incumplimiento de pagos (después de 30 días)</li>
              <li>Violación de leyes aplicables</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              8. Cambios a los Términos
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Nos reservamos el derecho de modificar estos términos. Notificaremos cambios significativos 
              con 30 días de anticipación. El uso continuado de la aplicación después de los cambios 
              constituye la aceptación de los nuevos términos.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              9. Ley Aplicable
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Estos términos se rigen por las leyes de la jurisdicción donde opera la barbería. 
              Para disputas, ambas partes aceptan arbitraje como primer recurso.
            </p>
          </section>

          {/* Contact Section */}
          <section className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Contacto
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Email:</strong>{' '}
                <a href="mailto:luisrissopa@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  luisrissopa@gmail.com
                </a>
              </p>
              <p className="text-slate-700 dark:text-slate-300 mt-2">
                <strong>Responsable Legal:</strong> Jorge Luis Risso Patron
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p>Versión 1.0 • Noviembre 2025</p>
            <p className="mt-2">
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Ver Política de Privacidad
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
