# 💈 Ornō

Sistema de gestión para barberías: citas, empleados, clientes, inventario y punto de venta.

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)
![Version](https://img.shields.io/badge/version-0.1.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Estado actual

**Proyecto en desarrollo activo (`v0.1.0` en `package.json`), no en producción.**

| Aspecto | Estado |
|---|---|
| Modo demo (sin backend) | ✅ Funcional — datos hardcodeados, sin persistencia real |
| Modo producción (Supabase) | 🟡 Implementado en código, **no verificado en una instancia real** durante esta auditoría |
| Citas, empleados, clientes, inventario, POS, fidelidad, alertas | ✅ Funcionales |
| Facturación (`/admin/billing`) | 🔴 Stub — UI completa, sin persistencia ni cobro real |
| Integraciones (`/admin/integrations`) | 🟡 Parcial — UI interactiva, sin conexiones reales a terceros |
| Seguridad | 7/10 según `SECURITY-REPORT.md` — **rotación de secrets pendiente y vencida** |

No asumas que "está en el código" significa "está verificado en producción". Ver [Limitaciones conocidas](#limitaciones-conocidas) abajo.

## Stack técnico

- **Framework:** Next.js 15.2.4 (App Router) + React 19 + TypeScript 5.9
- **Estilos:** Tailwind CSS 3.4
- **Backend:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — Postgres + Auth + RLS
- **Estado:** Zustand
- **Formularios/validación:** React Hook Form + Zod
- **Notificaciones:** Resend (email) + Twilio (WhatsApp) vía cola asíncrona y Edge Function
- **Rate limiting:** Upstash Redis (con fallback en memoria)
- **Reportes/exportación:** Recharts, jsPDF, XLSX
- **Testing:** Vitest + Testing Library (unitarios), Playwright (e2e)
- **Gestor de paquetes:** pnpm (fijado en `10.14.0` vía `packageManager`)

## Requisitos previos

- Node.js 18.x o superior
- pnpm 10.x (`corepack enable` si no lo tenés instalado)
- Cuenta de Supabase (free tier alcanza) — **solo necesaria para modo producción**, el modo demo no la requiere

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/risso-patron/barber-manager-app.git
cd barber-manager-app

# Instalar dependencias
pnpm install

# Modo demo: no requiere configuración adicional
pnpm dev
```

Para modo producción con Supabase real:

```bash
cp .env.example .env.local
# Completar .env.local con tus credenciales de Supabase (ver sección siguiente)

# Ejecutar los scripts SQL en orden desde el SQL Editor de Supabase
# Ver docs/manuales/manual-sistema.md §12 para el orden exacto

pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Para modo producción | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Para modo producción | Clave pública anónima |
| `SUPABASE_SERVICE_ROLE_KEY` | Para modo producción | Clave de servicio — **solo server-side, nunca exponer al cliente** |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Opcional | Rate limiting persistente (sin esto, usa memoria en proceso — no apto para serverless multi-instancia) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Opcional | Envío de emails de notificación |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | Opcional | Notificaciones por WhatsApp |

Si `NEXT_PUBLIC_SUPABASE_URL` no está configurada (o está vacía), la app **arranca automáticamente en modo demo**.

Validar variables antes de deploy: `pnpm validate-env`. Tabla completa con tipos y defaults en [docs/manuales/manual-sistema.md §2](docs/manuales/manual-sistema.md#2-variables-de-entorno).

## Comandos disponibles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo (Turbopack) en localhost:3000
pnpm build            # Build de producción
pnpm start            # Servidor de producción (requiere build previo)

# Calidad de código
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
pnpm format           # Prettier (write)
pnpm format:check     # Prettier (check only)

# Testing
pnpm test             # Tests unitarios (Vitest)
pnpm test:watch       # Vitest en modo watch
pnpm test:coverage    # Vitest con cobertura
pnpm test:e2e         # Tests end-to-end (Playwright) — requiere `pnpm dev` corriendo

# Seguridad y entorno
pnpm validate-env             # Valida variables de entorno
pnpm security-check           # Chequeo de seguridad (pre-commit-security.js)
pnpm security:supply-chain    # Auditoría de cadena de suministro
pnpm setup-hooks               # Configura git hooks de seguridad
pnpm predeploy                 # Checklist completo pre-deploy (env + security + types + lint)
```

## Estructura general

```
app/                    # Next.js App Router
├── admin/               # Rutas exclusivas de administrador
├── employee/            # Rutas de empleado (módulo actual)
├── barber/               # Dashboard de empleado legacy (huérfano, ver limitaciones)
├── client/               # Rutas de cliente autenticado
├── auth/                 # Login, registro, recuperación de contraseña
├── reservar/, book/      # Reserva pública sin cuenta
├── dashboard/             # Dispatcher: redirige según rol
└── api/                   # API routes server-side
components/               # Componentes React por dominio (admin, employee, client, auth, ui)
lib/                      # Lógica de negocio: supabase/, auth.ts, demo-config.ts, types.ts, rate-limit.ts
hooks/                    # useAuth, useRequireAuth
middleware.ts             # Control de acceso por rol (solo activo con Supabase configurado)
scripts/                  # 31 scripts SQL versionados + scripts de seguridad/CI
docs/                     # Documentación (manuales, seguridad)
e2e/, tests/              # Playwright y Vitest
```

Detalle completo en [docs/manuales/manual-sistema.md §4](docs/manuales/manual-sistema.md#4-arquitectura-general).

## Roles disponibles

El modelo oficial son **3 roles**: `client`, `employee`, `admin` (definidos en `lib/types.ts` y `openspec/specs/auth-roles.md`).

| Rol | Acceso |
|---|---|
| **Cliente** | Reserva de citas, historial, calificaciones, puntos de fidelidad |
| **Empleado** | Agenda diaria, control de jornada laboral, estadísticas, comisiones |
| **Administrador** | Todo lo anterior + gestión de empleados/clientes, inventario, POS, reportes, alertas |

⚠️ El código de rutas (`middleware.ts`, `useRequireAuth.ts`) todavía referencia dos roles adicionales fuera de este modelo (`manager`, `barber`) que son deuda técnica heredada, no funcionalidades soportadas activamente. Detalle completo en [docs/manuales/manual-sistema.md §6](docs/manuales/manual-sistema.md#6-autenticación-y-roles).

## Credenciales demo

Solo válidas en modo demo (sin Supabase configurado). Todas usan password `Demo1234`:

| Email | Rol | Nombre |
|---|---|---|
| `admin@demo.com` | admin | Admin Demo |
| `employee@demo.com` | employee | Sofía Ramírez |
| `barber@demo.com` | barber* | Carlos Martínez |
| `client@demo.com` | client | Juan Pérez |
| `vincent@ornodemo.com` | client | Vincent |

\* `barber` no es un rol oficial del sistema (ver sección anterior) pero es una cuenta demo real y funcional.

## Rutas principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Pública | Landing |
| `/reservar`, `/book/[slug]` | Pública | Reserva sin cuenta |
| `/auth/login`, `/auth/register` | Pública | Autenticación |
| `/dashboard` | Cualquier sesión | Dispatcher, redirige según rol |
| `/admin/*` | admin | Panel de administración |
| `/employee/*` | employee, admin | Panel de empleado (módulo vigente) |
| `/client/*` | client | Panel de cliente |
| `/barber` | employee, admin | Dashboard de empleado legacy — accesible pero fuera del flujo de navegación principal |

## Estado de funcionalidades

| Funcionalidad | Estado |
|---|---|
| Registro, login, reserva de citas, selección de empleado, historial | ✅ |
| Calificaciones de citas (1-5 estrellas) | ✅ |
| Notificaciones por email/WhatsApp (cola asíncrona + Edge Function) | ✅ |
| Agenda diaria, control de jornada (clock in/out), bloqueos de agenda | ✅ |
| Estadísticas y comisiones por empleado | ✅ |
| Gestión de empleados y clientes (admin) | ✅ |
| Control de inventario | ✅ |
| Punto de venta (POS) con descuentos y puntos de fidelidad | ✅ |
| Alertas de calificación baja | ✅ |
| Reportes y exportación (PDF/Excel) | ✅ |
| Recuperación de contraseña | ✅ |
| Facturación (`/admin/billing`) | 🔴 Stub — sin persistencia real |
| Integraciones con terceros (`/admin/integrations`) | 🟡 UI sin conexiones reales |
| Pagos online | 🔴 No implementado |

## Limitaciones conocidas

- **Rotación de secrets vencida** — ver `docs/SECRET-ROTATION.md`. Esto es lo más urgente del proyecto en este momento.
- **Roles `manager` y `barber`** siguen referenciados en código de rutas pese a que el modelo oficial es de 3 roles — ver `docs/manuales/manual-sistema.md §6`.
- **`/barber` es una ruta huérfana**: funcional pero sin entrada en el flujo de navegación real (el dispatcher nunca redirige ahí).
- **Middleware bypaseado en modo demo**: sin Supabase configurado, el control de acceso por rol es 100% client-side y evadible editando `localStorage`. No confundir demo con producción.
- **RLS no verificado en runtime**: las políticas existen como scripts SQL; su aplicación efectiva en una instancia real no fue confirmada en esta auditoría documental.
- **Dos catálogos de datos demo desincronizados** (`lib/demo-config.ts` vs `lib/demo-appointments.ts`).
- **Facturación e integraciones** aparentan estar terminadas en la UI pero no lo están.

Detalle técnico completo en [docs/manuales/manual-sistema.md §15](docs/manuales/manual-sistema.md#15-limitaciones-técnicas-y-roadmap-recomendado).

## Próximos pasos

1. Rotar los secrets pendientes (urgente).
2. Resolver los roles `manager`/`barber` (formalizar o eliminar).
3. Verificar RLS contra una instancia real de Supabase.
4. Decidir el destino de `/admin/billing` e `/admin/integrations` (completar, ocultar o marcar como "próximamente" en la UI).
5. Unificar los catálogos de datos demo.
6. Implementar pagos online y notificaciones push (no iniciado).

## Documentación interna

- [docs/manuales/INDEX.md](docs/manuales/INDEX.md) — índice de todos los manuales
- [docs/manuales/manual-sistema.md](docs/manuales/manual-sistema.md) — arquitectura técnica completa
- [docs/manuales/manual-admin.md](docs/manuales/manual-admin.md) — manual de administrador
- [docs/manuales/manual-empleado.md](docs/manuales/manual-empleado.md) — manual de empleado
- [docs/manuales/manual-cliente.md](docs/manuales/manual-cliente.md) — manual de cliente
- [docs/EXECUTIVE-SUMMARY.md](docs/EXECUTIVE-SUMMARY.md) — resumen ejecutivo
- [docs/GO-LIVE-PLAN.md](docs/GO-LIVE-PLAN.md) — plan de salida a producción
- [SECURITY-REPORT.md](SECURITY-REPORT.md) — auditoría de seguridad completa (fuente autoritativa)
- [docs/SECRET-ROTATION.md](docs/SECRET-ROTATION.md) — procedimiento de rotación de secrets
- [docs/SECURITY-CHECKLIST.md](docs/SECURITY-CHECKLIST.md) — checklist pre-deploy

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: add some feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## Soporte

Para soporte y preguntas, abre un issue en el repositorio o contacta al equipo de desarrollo.
