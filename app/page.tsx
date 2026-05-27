'use client'

import React from 'react'
import Link from 'next/link'
import { useEffect } from 'react'
import styles from './page.module.css'

const FEATURES = [
  { icon: '📅', title: 'Citas en tiempo real',    desc: 'Calendario interactivo con reservas instantáneas. Sin doble agenda, sin llamadas, sin caos.' },
  { icon: '👥', title: 'Gestión de empleados',    desc: 'Control de horarios, agenda diaria y estadísticas individuales para cada miembro del equipo.' },
  { icon: '📦', title: 'Control de inventario',   desc: 'Productos, movimientos e historial de stock. Sabe cuándo reponer antes de quedarte sin nada.' },
  { icon: '📊', title: 'Reportes y métricas',     desc: 'Ingresos, ocupación y tendencias en un dashboard limpio. Toma decisiones con datos, no con intuición.' },
  { icon: '🔐', title: 'Seguridad por rol',       desc: 'Row Level Security con Supabase. Cada usuario ve exactamente lo que le corresponde, nada más.' },
  { icon: '⚙️', title: 'Configuración total',     desc: 'Servicios, precios, horarios y preferencias del negocio. Adaptado a tu barbería, no al revés.' },
]

const STATS = [
  { num: '3',   sup: '×',  label: 'Roles de acceso' },
  { num: '100', sup: '%',  label: 'Datos en tiempo real' },
  { num: '0',   sup: '$',  label: 'Para empezar' },
  { num: 'MIT', sup: '',   label: 'Licencia open source' },
]

const APPOINTMENTS = [
  { initials: 'JR', cls: styles.av1, name: 'Juan Rodríguez', service: 'Corte + barba',      time: '10:00' },
  { initials: 'ML', cls: styles.av2, name: 'Marco López',    service: 'Corte clásico',      time: '10:30' },
  { initials: 'CR', cls: styles.av3, name: 'Carlos Ruiz',    service: 'Afeitado · navaja',  time: '11:15' },
]

const BARS = [
  { h: 45, label: 'L', active: false },
  { h: 62, label: 'M', active: false },
  { h: 38, label: 'X', active: false },
  { h: 70, label: 'J', active: false },
  { h: 55, label: 'V', active: true  },
  { h: 80, label: 'S', active: false },
  { h: 20, label: 'D', active: false },
]

const NAV_ITEMS = ['Dashboard', 'Citas', 'Empleados', 'Inventario', 'Clientes', 'Reportes', 'Configuración']

const METRICS = [
  { label: 'Citas hoy',  value: '12',  delta: '↑ 3 vs ayer',     red: true  },
  { label: 'Ingresos',   value: '$840', delta: '↑ 18% semana',   red: false },
  { label: 'Empleados',  value: '4',   delta: '3 activos hoy',   red: false },
  { label: 'Clientes',   value: '247', delta: '↑ 12 este mes',   red: false },
]

const ROLES = [
  {
    tag: 'Administrador', tagCls: styles.tagAdmin, featured: true,
    name: 'Control total',
    desc: 'Visión completa del negocio. Desde los ingresos hasta el último producto en stock.',
    items: ['Dashboard general', 'Gestión de empleados', 'Control de inventario', 'Reportes financieros', 'Configuración de servicios'],
  },
  {
    tag: 'Empleado', tagCls: styles.tagEmp, featured: false,
    name: 'Tu agenda, clara',
    desc: 'Todo lo que necesitas para tu día de trabajo, sin distracciones ni información innecesaria.',
    items: ['Agenda diaria', 'Control de entrada y salida', 'Gestión de pausas', 'Estadísticas personales'],
  },
  {
    tag: 'Cliente', tagCls: styles.tagClient, featured: false,
    name: 'Reserva sin llamar',
    desc: 'Elige barbero, servicio y hora desde el celular. Sin esperas, sin fricción.',
    items: ['Reserva de citas online', 'Selección de barbero', 'Historial de servicios', 'Sistema de feedback'],
  },
]

const TECH = ['Next.js 15', 'TypeScript 5', 'Supabase', 'Tailwind CSS', 'Zustand', 'Row Level Security', 'Vercel']

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).setAttribute('data-visible', 'true')
            }, i * 80)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll(`.${styles.fadeIn}`).forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.gridBg} aria-hidden="true" />

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <a href="#" className={styles.navLogo}>
          <div className={styles.navLogoMark} />
          <span className={styles.navLogoText}>Orn<span className={styles.red}>ō</span></span>
        </a>
        <div className={styles.navLinks}>
          <a href="#features">Funciones</a>
          <a href="#roles">Roles</a>
          <a href="#tech">Tecnología</a>
          <a href="#cta">Precios</a>
        </div>
        <div className={styles.navCta}>
          <Link href="/auth/login" className={styles.btnGhost}>Iniciar sesión</Link>
          <Link href="/auth/register" className={styles.btnPrimary}>Empezar gratis</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroBadge}>
          <div className={styles.heroBadgeDot} />
          Gestión para profesionales del estilo
        </div>
        <h1 className={styles.heroTitle}>
          Donde el orden<br />
          <em>se vuelve arte</em>
          <span className={styles.line2}>para tu negocio</span>
        </h1>
        <p className={styles.heroSub}>
          Citas, empleados e inventario en una plataforma elegante.
          Construida para barberías, salones y espacios de belleza que quieren operar con precisión.
        </p>
        <div className={styles.heroActions}>
          <Link href="/auth/register" className={styles.btnPrimary}>Comenzar gratis →</Link>
          <a href="#features" className={styles.btnGhost}>Ver funciones</a>
        </div>

        {/* Product mockup */}
        <div className={styles.mockupWrap}>
          <div className={styles.mockupGlow} aria-hidden="true" />
          <div className={styles.mockupBrowser}>
            <div className={styles.browserBar}>
              <div className={styles.browserDots}>
                <div className={`${styles.browserDot} ${styles.d1}`} />
                <div className={`${styles.browserDot} ${styles.d2}`} />
                <div className={`${styles.browserDot} ${styles.d3}`} />
              </div>
              <div className={styles.browserUrl}>app.orno.app/dashboard</div>
            </div>
            <div className={styles.dashboard}>
              <div className={styles.dashSidebar}>
                <div className={styles.dashLogo}>
                  <div className={styles.dashLogoText}>Orn<span className={styles.red}>ō</span></div>
                </div>
                {NAV_ITEMS.map((item, i) => (
                  <div key={item} className={`${styles.dashNavItem} ${i === 0 ? styles.active : ''}`}>
                    <div className={styles.navDot} />
                    {item}
                  </div>
                ))}
              </div>
              <div className={styles.dashMain}>
                <div className={styles.dashHeader}>
                  <div className={styles.dashTitle}>Panel general</div>
                  <div className={styles.dashDate}>Hoy · 24 Mayo 2026</div>
                </div>
                <div className={styles.dashMetrics}>
                  {METRICS.map((m) => (
                    <div key={m.label} className={styles.metric}>
                      <div className={styles.metricLabel}>{m.label}</div>
                      <div className={`${styles.metricValue} ${m.red ? styles.red : ''}`}>{m.value}</div>
                      <div className={styles.metricDelta}>{m.delta}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.dashGrid2}>
                  <div className={styles.dashPanel}>
                    <div className={styles.panelTitle}>Próximas citas</div>
                    {APPOINTMENTS.map((a) => (
                      <div key={a.name} className={styles.apptItem}>
                        <div className={`${styles.apptAvatar} ${a.cls}`}>{a.initials}</div>
                        <div className={styles.apptInfo}>
                          <div className={styles.apptName}>{a.name}</div>
                          <div className={styles.apptService}>{a.service}</div>
                        </div>
                        <div className={styles.apptTime}>{a.time}</div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.dashPanel}>
                    <div className={styles.panelTitle}>Ingresos · esta semana</div>
                    <div className={styles.barChart}>
                      {BARS.map((b) => (
                        <div key={b.label} className={styles.barCol}>
                          <div
                            className={`${styles.bar} ${b.active ? styles.barActive : ''}`}
                            style={{ ["--bar-h" as string]: `${b.h}px` } as React.CSSProperties}
                          />
                          <div className={styles.barLabel}>{b.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.statsSection}>
        <div className={`${styles.statsGrid} ${styles.fadeIn}`}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statNum}>{s.num}<span>{s.sup}</span></div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.fadeIn}>
          <div className={styles.sectionEyebrow}>Funcionalidades</div>
          <h2 className={styles.sectionTitle}>Todo lo que necesitas,<br /><em>sin lo que no</em></h2>
        </div>
        <div className={`${styles.featuresGrid} ${styles.fadeIn}`}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className={styles.rolesSection} id="roles">
        <div className={styles.rolesInner}>
          <div className={styles.fadeIn}>
            <div className={styles.sectionEyebrow}>Acceso por rol</div>
            <h2 className={styles.sectionTitle}>Una plataforma,<br /><em>tres experiencias</em></h2>
          </div>
          <div className={`${styles.rolesGrid} ${styles.fadeIn}`}>
            {ROLES.map((r) => (
              <div key={r.tag} className={`${styles.roleCard} ${r.featured ? styles.featured : ''}`}>
                <span className={`${styles.roleTag} ${r.tagCls}`}>{r.tag}</span>
                <div className={styles.roleName}>{r.name}</div>
                <div className={styles.roleDesc}>{r.desc}</div>
                <ul className={styles.roleFeatures}>
                  {r.items.map((item) => (
                    <li key={item}>
                      <div className={styles.checkDot} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH ── */}
      <section className={styles.techSection} id="tech">
        <div className={`${styles.techLabel} ${styles.fadeIn}`}>Stack tecnológico</div>
        <div className={`${styles.techPills} ${styles.fadeIn}`}>
          {TECH.map((t) => (
            <div key={t} className={styles.techPill}>
              <div className={styles.techDot} />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection} id="cta">
        <div className={styles.ctaGlow} aria-hidden="true" />
        <div className={`${styles.ctaEyebrow} ${styles.fadeIn}`}>Empieza hoy</div>
        <h2 className={`${styles.ctaTitle} ${styles.fadeIn}`}>Tu negocio,<br /><em>en su mejor versión</em></h2>
        <p className={`${styles.ctaSub} ${styles.fadeIn}`}>Gratis para empezar. Sin tarjeta de crédito. Listo en minutos.</p>
        <div className={`${styles.ctaActions} ${styles.fadeIn}`}>
          <Link href="/auth/register" className={styles.btnPrimary}>Crear cuenta gratis →</Link>
          <Link href="/reservar" className={styles.btnGhost}>Ver demo en vivo</Link>
        </div>
        <div className={`${styles.ctaNote} ${styles.fadeIn}`}>MIT License · Open source · Desplegable en Vercel</div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Orn<span className={styles.red}>ō</span></div>
        <div className={styles.footerLinks}>
          <a href="https://github.com/risso-patron/barber-manager-app" target="_blank" rel="noopener noreferrer">GitHub</a>
          <Link href="/privacy">Privacidad</Link>
          <Link href="/terms">Términos</Link>
          <a href="mailto:hola@orno.app">Contacto</a>
        </div>
        <div className={styles.footerBadge}>
          <div className={styles.footerDot} />
          v1.0 · MIT License
        </div>
      </footer>
    </div>
  )
}
