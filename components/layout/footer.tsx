import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <img src="/orno_logo.svg" alt="Ornō" style={{ height: '32px', width: 'auto' }} className="mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sistema de gestión profesional para barberías modernas.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Producto
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/book/demo" 
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Reservar Cita
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/terms" 
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a 
                  href="mailto:luisrissopa@gmail.com"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  luisrissopa@gmail.com
                </a>
              </li>
              <li>Soporte 24/7</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © {currentYear} Ornō. Todos los derechos reservados.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Desarrollado por Jorge Luis Risso Patron
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
