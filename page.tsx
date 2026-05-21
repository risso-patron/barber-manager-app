import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Scissors, Calendar, Users, BarChart3, Clock, Star, TrendingUp, Shield, ChevronRight, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .font-display { font-family: 'Playfair Display', serif; }
        .font-serif-light { font-family: 'Cormorant Garamond', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        .gold { color: #c9a84c; }
        .gold-gradient { background: linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gold-border { border-color: #c9a84c; }
        .gold-bg { background-color: #c9a84c; }

        .noise-bg {
          position: relative;
        }
        .noise-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }

        .hero-glow {
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,168,76,0.15) 0%, transparent 70%);
        }

        .card-hover {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(201,168,76,0.5);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.2);
        }

        .btn-gold {
          background: linear-gradient(135deg, #c9a84c, #e8c96a);
          color: #0a0a0a;
          font-weight: 600;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-gold:hover {
          background: linear-gradient(135deg, #e8c96a, #f0d080);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201,168,76,0.35);
        }

        .btn-outline-gold {
          border: 1px solid rgba(201,168,76,0.6);
          color: #c9a84c;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
        }
        .btn-outline-gold:hover {
          background: rgba(201,168,76,0.1);
          border-color: #c9a84c;
        }

        .divider-gold {
          height: 1px;
          background: linear-gradient(90deg, transparent, #c9a84c, transparent);
        }

        .stat-number {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 900;
          background: linear-gradient(135deg, #c9a84c, #f0d080);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .scissors-icon {
          animation: rotate-scissors 8s linear infinite;
        }
        @keyframes rotate-scissors {
          0%, 90% { transform: rotate(0deg); }
          95% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }

        .fade-up {
          animation: fadeUp 0.8s ease forwards;
          opacity: 0;
        }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.25s; }
        .fade-up-3 { animation-delay: 0.4s; }
        .fade-up-4 { animation-delay: 0.55s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .line-accent {
          display: inline-block;
          width: 48px;
          height: 2px;
          background: #c9a84c;
          vertical-align: middle;
          margin-right: 12px;
        }

        .testimonial-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.07);
        }

        .pricing-featured {
          background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.05));
          border-color: rgba(201,168,76,0.4) !important;
        }

        .nav-blur {
          backdrop-filter: blur(20px);
          background: rgba(10,10,10,0.85);
          border-bottom: 1px solid rgba(201,168,76,0.1);
        }
      `}</style>

      {/* NAV */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50 font-body">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 gold scissors-icon" />
            <span className="font-display text-lg tracking-wide">Barber<span className="gold">Manager</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <button className="btn-outline-gold px-4 py-2 rounded-lg text-sm">Iniciar Sesión</button>
            </Link>
            <Link href="/auth/register">
              <button className="btn-gold px-4 py-2 rounded-lg text-sm">Comenzar Gratis</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="noise-bg hero-glow relative pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">

          <div className="fade-up fade-up-1 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 font-body mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Más de 500 barberías ya confían en nosotros
          </div>

          <h1 className="fade-up fade-up-2 font-display text-6xl md:text-8xl font-black leading-[0.9] mb-6 tracking-tight">
            Tu barbería,<br />
            <span className="gold-gradient italic">al siguiente nivel</span>
          </h1>

          <p className="fade-up fade-up-3 font-serif-light text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            La plataforma profesional para gestionar citas, empleados e inventario. Diseñada para barberías que se toman en serio su negocio.
          </p>

          <div className="fade-up fade-up-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/reservar">
              <button className="btn-gold flex items-center gap-2 px-8 py-4 rounded-xl text-base">
                <Clock className="h-5 w-5" />
                Reservar Cita Ahora
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="btn-outline-gold flex items-center gap-2 px-8 py-4 rounded-xl text-base">
                Probar Gratis 14 Días
              </button>
            </Link>
          </div>

          <p className="font-body text-xs text-zinc-600 mt-5">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="divider-gold mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Barberías activas" },
              { value: "12K+", label: "Citas gestionadas" },
              { value: "98%", label: "Satisfacción" },
              { value: "3min", label: "Setup inicial" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="stat-number">{stat.value}</div>
                <div className="font-body text-sm text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="divider-gold mt-12" />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm gold tracking-widest uppercase mb-4">
              <span className="line-accent"></span>Características
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Todo lo que necesitas,<br />
              <span className="gold-gradient italic">nada que sobre</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Scissors className="h-7 w-7" />,
                title: "Gestión de Citas",
                desc: "Reservas en tiempo real, recordatorios automáticos y calendario interactivo para tu equipo.",
                color: "text-amber-400",
              },
              {
                icon: <Users className="h-7 w-7" />,
                title: "Control de Equipo",
                desc: "Horarios, asistencia y rendimiento de cada barbero en un solo panel.",
                color: "text-emerald-400",
              },
              {
                icon: <Calendar className="h-7 w-7" />,
                title: "Inventario Inteligente",
                desc: "Stock en tiempo real con alertas automáticas antes de que te quedes sin productos.",
                color: "text-sky-400",
              },
              {
                icon: <BarChart3 className="h-7 w-7" />,
                title: "Reportes & Analytics",
                desc: "Métricas clave, ingresos por servicio y tendencias para decisiones inteligentes.",
                color: "text-violet-400",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-hover bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 font-body"
              >
                <div className={`${f.color} mb-4`}>{f.icon}</div>
                <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES SECTION */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm gold tracking-widest uppercase mb-4">
              <span className="line-accent"></span>Para cada rol
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Una plataforma,<br />
              <span className="gold-gradient italic">tres experiencias</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: "Cliente",
                emoji: "💈",
                perks: ["Reserva citas en segundos", "Elige tu barbero favorito", "Historial de servicios", "Notificaciones de recordatorio"],
                cta: "Reservar ahora",
                href: "/reservar",
              },
              {
                role: "Barbero",
                emoji: "✂️",
                perks: ["Agenda diaria clara", "Control de entrada/salida", "Estadísticas personales", "Gestión de pausas"],
                cta: "Área de empleados",
                href: "/auth/login",
                featured: true,
              },
              {
                role: "Administrador",
                emoji: "📊",
                perks: ["Dashboard completo", "Reportes financieros", "Gestión de inventario", "Control total del negocio"],
                cta: "Ver dashboard",
                href: "/auth/login",
              },
            ].map((r) => (
              <div
                key={r.role}
                className={`card-hover rounded-2xl p-8 border font-body ${
                  r.featured
                    ? "pricing-featured"
                    : "bg-zinc-900/40 border-zinc-800"
                }`}
              >
                <div className="text-3xl mb-3">{r.emoji}</div>
                {r.featured && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs gold-bg text-black font-semibold mb-3">
                    Más popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold mb-5">{r.role}</h3>
                <ul className="space-y-3 mb-8">
                  {r.perks.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 gold flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={r.href}>
                  <button className={`w-full py-3 rounded-xl text-sm font-medium ${r.featured ? "btn-gold" : "btn-outline-gold"}`}>
                    {r.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm gold tracking-widest uppercase mb-4">
              <span className="line-accent"></span>Testimonios
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Lo que dicen<br />
              <span className="gold-gradient italic">nuestros clientes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Carlos Mendoza",
                role: "Dueño — Barbería El Clásico",
                text: "Desde que uso Barber Manager, mis citas se triplicaron. El sistema de reservas es increíblemente fácil para mis clientes.",
                stars: 5,
              },
              {
                name: "Roberto Silva",
                role: "Barbero Senior — StyleCut",
                text: "Mi agenda diaria está siempre clara. Ya no pierdo tiempo coordinando por WhatsApp. Todo está en la app.",
                stars: 5,
              },
              {
                name: "Miguel Torres",
                role: "Administrador — Barbería Torres",
                text: "Los reportes financieros me ayudaron a identificar qué servicios eran más rentables. Aumenté mis ingresos un 40%.",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="testimonial-card card-hover rounded-2xl p-6 font-body">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-5 font-serif-light text-base italic">
                  "{t.text}"
                </p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-sm gold tracking-widest uppercase mb-4">
              <span className="line-accent"></span>Precios
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              Inversión que<br />
              <span className="gold-gradient italic">se paga sola</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                plan: "Starter",
                price: "$0",
                period: "para siempre",
                perks: ["1 barbero", "50 citas/mes", "Dashboard básico", "Soporte por email"],
                cta: "Empezar gratis",
                href: "/auth/register",
              },
              {
                plan: "Pro",
                price: "$29",
                period: "por mes",
                perks: ["Hasta 5 barberos", "Citas ilimitadas", "Reportes avanzados", "Inventario completo", "Soporte prioritario"],
                cta: "Comenzar prueba",
                href: "/auth/register",
                featured: true,
              },
              {
                plan: "Business",
                price: "$79",
                period: "por mes",
                perks: ["Barberos ilimitados", "Multi-sucursal", "API acceso", "Manager dedicado", "Onboarding personalizado"],
                cta: "Contactar ventas",
                href: "/auth/register",
              },
            ].map((p) => (
              <div
                key={p.plan}
                className={`card-hover rounded-2xl p-8 border font-body ${
                  p.featured ? "pricing-featured" : "bg-zinc-900/40 border-zinc-800"
                }`}
              >
                {p.featured && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs gold-bg text-black font-semibold mb-4">
                    Recomendado
                  </span>
                )}
                <h3 className="font-display text-xl font-bold mb-1">{p.plan}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="font-display text-4xl font-black gold">{p.price}</span>
                </div>
                <p className="text-zinc-500 text-xs mb-6">{p.period}</p>
                <ul className="space-y-3 mb-8">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle className="h-4 w-4 gold flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link href={p.href}>
                  <button className={`w-full py-3 rounded-xl text-sm font-medium ${p.featured ? "btn-gold" : "btn-outline-gold"}`}>
                    {p.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="divider-gold mb-16" />
          <Scissors className="h-10 w-10 gold mx-auto mb-6 scissors-icon" />
          <h2 className="font-display text-5xl md:text-6xl font-black mb-6">
            ¿Listo para<br />
            <span className="gold-gradient italic">transformar</span> tu barbería?
          </h2>
          <p className="font-body text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            Únete a cientos de barberos que ya están creciendo con Barber Manager. Setup en 3 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <button className="btn-gold flex items-center gap-2 px-10 py-4 rounded-xl text-base">
                Comenzar Gratis
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/reservar">
              <button className="btn-outline-gold flex items-center gap-2 px-10 py-4 rounded-xl text-base">
                <Clock className="h-5 w-5" />
                Reservar Cita
              </button>
            </Link>
          </div>
          <p className="font-body text-xs text-zinc-600 mt-5">14 días gratis · Sin tarjeta de crédito · Cancela cuando quieras</p>
          <div className="divider-gold mt-16" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 font-body text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 gold" />
            <span>Barber<span className="gold">Manager</span> © 2025</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
