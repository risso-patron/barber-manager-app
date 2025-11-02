export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      color: 'white'
    }}>
      {/* Header/Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          ✂️ Barber Manager
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/booking" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1.5rem',
            background: '#10b981',
            borderRadius: '0.5rem',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}>
            📅 Reservar Cita
          </a>
          <a href="/auth/login" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1.5rem',
            border: '1px solid white',
            borderRadius: '0.5rem',
            transition: 'all 0.3s'
          }}>
            Iniciar sesión
          </a>
          <a href="/auth/register" style={{
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}>
            Comenzar gratis
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          lineHeight: '1.2',
          textShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          Gestiona tu barbería con<br />
          <span style={{ color: '#60a5fa' }}>tranquilidad y eficiencia</span>
        </h1>
        <p style={{
          fontSize: '1.25rem',
          opacity: 0.9,
          maxWidth: '700px',
          margin: '0 auto 3rem',
          lineHeight: '1.6'
        }}>
          Barber Manager te ayuda a mantener tu inventario, contabilidad, 
          nómina de empleados y citas con clientes perfectamente organizados. 
          Todo en un solo lugar.
        </p>
        <a href="/auth/register" style={{
          display: 'inline-block',
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '1rem 3rem',
          borderRadius: '0.75rem',
          fontSize: '1.25rem',
          fontWeight: '600',
          textDecoration: 'none',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
          transition: 'all 0.3s'
        }}>
          Prueba gratis 30 días
        </a>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '3rem'
        }}>
          Todo lo que necesitas para tu barbería
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {[
            {
              icon: '📅',
              title: 'Gestión de Citas',
              desc: 'Sistema inteligente de reservas que sincroniza horarios de clientes y barberos en tiempo real.'
            },
            {
              icon: '👥',
              title: 'Control de Empleados',
              desc: 'Administra turnos, asistencias, nómina y rendimiento de tu equipo desde un solo panel.'
            },
            {
              icon: '📦',
              title: 'Inventario en Orden',
              desc: 'Controla productos, recibe alertas automáticas de stock bajo y optimiza tus compras.'
            },
            {
              icon: '�',
              title: 'Contabilidad Clara',
              desc: 'Registra ingresos, gastos y genera reportes financieros para tomar mejores decisiones.'
            },
            {
              icon: '�📊',
              title: 'Reportes Detallados',
              desc: 'Visualiza el rendimiento de tu negocio con gráficas y métricas clave actualizadas.'
            },
            {
              icon: '🔒',
              title: 'Datos Seguros',
              desc: 'Tu información protegida con encriptación de nivel empresarial y respaldos automáticos.'
            }
          ].map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '0.75rem',
                color: '#60a5fa'
              }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.6' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '3rem'
          }}>
            ¿Por qué elegir Barber Manager?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {[
              { stat: '99.9%', label: 'Disponibilidad' },
              { stat: '24/7', label: 'Soporte técnico' },
              { stat: '0', label: 'Costos ocultos' },
              { stat: '30 días', label: 'Prueba gratis' }
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.5rem' }}>
                  {item.stat}
                </div>
                <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem'
          }}>
            Empieza a gestionar tu barbería de forma profesional
          </h2>
          <p style={{
            fontSize: '1.15rem',
            opacity: 0.9,
            marginBottom: '2rem'
          }}>
            Únete a cientos de barberías que ya confían en nosotros
          </p>
          <a href="/auth/register" style={{
            display: 'inline-block',
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '1rem 3rem',
            borderRadius: '0.75rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(22, 163, 74, 0.4)',
            transition: 'all 0.3s'
          }}>
            Registrarse ahora - Es gratis
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '2rem',
        textAlign: 'center',
        opacity: 0.7
      }}>
        <p>© 2025 Barber Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
