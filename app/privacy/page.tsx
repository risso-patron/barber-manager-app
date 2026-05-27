import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Ornō',
  description: 'Cómo protegemos y manejamos tus datos personales',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Política de Privacidad
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
              1. Responsable de Datos
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Ornō</strong> es responsable de proteger tus datos personales. 
              Actuamos como procesador de datos bajo acuerdos de Procesamiento de Datos con cada barbería.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              2. Datos que Recolectamos
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">
                  De Clientes:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                  <li>Nombre, teléfono, email</li>
                  <li>Historial de citas y servicios</li>
                  <li>Preferencias de corte y notas del barbero</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">
                  De Empleados/Barberos:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                  <li>Nombre, email, teléfono</li>
                  <li>Horarios y control de asistencia</li>
                  <li>Rendimiento y estadísticas de trabajo</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">
                  De Administradores:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4">
                  <li>Email, teléfono, información de facturación</li>
                  <li>Datos de inventario y servicios</li>
                  <li>Información empresarial de la barbería</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              3. Propósito del Uso
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-green-700 dark:text-green-400 mb-2">
                  ✅ Usamos datos para:
                </h3>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                  <li>• Procesar citas y reservas</li>
                  <li>• Enviar confirmaciones y recordatorios</li>
                  <li>• Gestionar nómina de empleados</li>
                  <li>• Cumplir obligaciones legales y fiscales</li>
                  <li>• Mejorar seguridad de la plataforma</li>
                  <li>• Generar reportes anónimos de negocio</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">
                  ❌ NO usamos datos para:
                </h3>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-sm">
                  <li>• Vigilancia de usuarios</li>
                  <li>• Venta a terceros sin consentimiento</li>
                  <li>• Publicidad personalizada</li>
                  <li>• Perfiles de riesgo discriminatorios</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              4. Almacenamiento y Seguridad
            </h2>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong>Servidor:</strong> Supabase (PostgreSQL alojado en servidores seguros)</p>
              <p><strong>Encriptación:</strong> SSL/TLS en tránsito, encriptación en reposo</p>
              <p><strong>Backups:</strong> Automáticos diarios, retenidos 30 días</p>
              <p><strong>Acceso:</strong> Solo personal autorizado con contraseña fuerte</p>
              <p><strong>Cumplimiento:</strong> Compatible con GDPR y CCPA</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              5. Derechos del Usuario
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Según GDPR y CCPA, tienes derecho a:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Acceso</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Solicita una copia de tus datos en formato legible. 
                  Contacto: <a href="mailto:luisrissopa@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">luisrissopa@gmail.com</a>
                  <br />Respuesta garantizada en 30 días.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Corrección</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Edita datos incorrectos directamente en tu perfil o solicita ayuda al administrador.
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Eliminación (&quot;Derecho al Olvido&quot;)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  • Clientes: Pueden solicitar borrado total 30 días después de última cita<br />
                  • Empleados: Datos laborales retenidos 7 años (obligación fiscal)<br />
                  • Datos financieros: Retenidos 10 años (requisito legal)
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Portabilidad</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Exporta tus datos en formato CSV o JSON cuando lo necesites.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Objeción</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Rechaza ciertos usos de tus datos (excepto los legalmente requeridos).
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              6. Compartir Datos
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Los datos se comparten solo con:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Tercero</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Razón</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Tipo de Datos</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Supabase</td>
                    <td className="px-4 py-2">Hosting/almacenamiento</td>
                    <td className="px-4 py-2">Todos (encriptados)</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Resend/Twilio</td>
                    <td className="px-4 py-2">Notificaciones</td>
                    <td className="px-4 py-2">Email, teléfono, nombre</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Autoridades</td>
                    <td className="px-4 py-2">Orden legal</td>
                    <td className="px-4 py-2">Lo requerido legalmente</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 font-medium mt-4">
              ❌ NO vendemos ni compartimos datos con fines de marketing.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              7. Retención de Datos
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Tipo de Dato</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Período</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">Motivo</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 dark:text-slate-400">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Perfil activo</td>
                    <td className="px-4 py-2">Mientras uses app</td>
                    <td className="px-4 py-2">Necesario para servicio</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Citas completadas</td>
                    <td className="px-4 py-2">3 años</td>
                    <td className="px-4 py-2">Referencia histórica</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Registros de empleado</td>
                    <td className="px-4 py-2">7 años post-salida</td>
                    <td className="px-4 py-2">Requisito laboral</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2">Logs de seguridad</td>
                    <td className="px-4 py-2">90 días</td>
                    <td className="px-4 py-2">Detección de fraude</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              8. Cookies y Tracking
            </h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li><strong>Sesión:</strong> Cookie técnica para mantener login (necesaria)</li>
              <li><strong>Preferencias:</strong> Guarda idioma y tema (funcional)</li>
              <li><strong>Analítica:</strong> Solo datos agregados anónimos</li>
              <li><strong>No vendemos perfiles:</strong> Solo agregamos datos anónimos para mejorar el servicio</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              9. Seguridad de Datos
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Medidas implementadas:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li>Encriptación end-to-end para datos sensibles</li>
              <li>Validación de entrada (prevenir SQL injection)</li>
              <li>Rate limiting (prevenir ataques de fuerza bruta)</li>
              <li>Auditoría de acceso (quién accedió qué, cuándo)</li>
              <li>Actualizaciones de seguridad regulares</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              10. Violación de Datos
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              Si ocurre una violación de seguridad:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
              <li><strong>Notificamos en 48 horas</strong> a usuarios afectados</li>
              <li><strong>Reportamos a autoridades</strong> (si la ley lo requiere)</li>
              <li><strong>Explicamos medidas correctivas</strong> implementadas</li>
              <li><strong>Ofrecemos soporte</strong> a usuarios afectados</li>
            </ol>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              11. Cambios a esta Política
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Notificaremos cambios significativos con 30 días de anticipación. Cambios menores se 
              actualizan sin aviso previo. Consulta la fecha &quot;Última actualización&quot; al inicio de esta página.
            </p>
          </section>

          {/* Contact Section */}
          <section className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Contacto y Solicitudes
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg space-y-3">
              <div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Preguntas sobre Privacidad:</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Email:{' '}
                  <a href="mailto:luisrissopa@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    luisrissopa@gmail.com
                  </a>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Respuesta garantizada en 5 días hábiles
                </p>
              </div>

              <div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Solicitudes de Acceso/Eliminación:</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Email:{' '}
                  <a href="mailto:luisrissopa@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    luisrissopa@gmail.com
                  </a>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Responsable de Protección de Datos:</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Jorge Luis Risso Patron
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p>Versión 1.0 • Noviembre 2025</p>
            <p className="mt-2">
              <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Ver Términos de Servicio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
