# Barber Manager — Centro de Documentación

**Versión:** 1.1 — Junio 2026  
**Aplicación:** Barber Manager App (Next.js 15 + Supabase)

---

## Manuales disponibles

| Manual | Dirigido a | Descripción |
|--------|-----------|-------------|
| [Manual del Administrador](manual-admin.md) | Dueño / gestor de la barbería | Gestión completa: citas, empleados, clientes, inventario, reportes y configuración |
| [Manual del Empleado / Barbero](manual-empleado.md) | Barberos y staff de la barbería | Gestión de la agenda personal, estado de trabajo y citas del día |
| [Manual del Cliente](manual-cliente.md) | Clientes de la barbería | Cómo reservar, cancelar, ver historial y usar beneficios |
| [Manual del Sistema](manual-sistema.md) | Desarrolladores y administradores técnicos | API, seguridad, variables de entorno, base de datos y despliegue |

---

## Novedades v1.1 (Junio 2026)

| # | Mejora | Afecta a |
|---|--------|----------|
| M1 | **Reagendamiento de citas** — los clientes pueden cambiar fecha/hora sin cancelar | Cliente |
| M2 | **Sistema de comisiones** — porcentaje de comisión por empleado, cálculo automático | Admin, Empleado |
| M3 | **Persistencia de jornada laboral** — el estado Trabajando/No trabajando sobrevive recargas | Empleado |
| M4 | **Recuperación de contraseña** — flujo completo de forgot/reset por email | Todos |
| M5 | **Sistema de calificaciones** — clientes califican citas completadas (1–5 ★) con reseña | Cliente |
| M6 | **Puntos de fidelidad** — 1 punto por cada dólar gastado; historial y ajuste manual admin | Cliente, Admin |
| M7 | **Punto de Venta (POS)** — ventas directas sin cita previa; también acumula puntos | Admin |
| M8 | **Alertas por baja calificación** — alertas automáticas cuando rating ≤ 2★ | Admin |

---

## Accesos rápidos

- **URL de producción:** configurar en `NEXT_PUBLIC_APP_URL`
- **Login:** `/auth/login`
- **Registro:** `/auth/register`
- **Reservas públicas:** `/reservar` o `/book/[slug]`

### Usuarios de demostración

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@demo.com` | `Demo1234` | Administrador |
| `barber@demo.com` | `Demo1234` | Empleado / Barbero |
| `client@demo.com` | `Demo1234` | Cliente |

> El modo demo funciona **sin Supabase configurado**. Los datos son ficticios y no se guardan.

---

## Estructura de roles

```
Administrador (/admin/*)
  └── Acceso total: citas, empleados, clientes, servicios, inventario,
       punto de venta, reportes, configuración, alertas de calificación

Empleado (/barber/*)
  └── Su agenda personal, citas del día, estado de jornada y comisiones

Cliente (/client/*)
  └── Sus citas, reagendamiento, calificaciones, puntos de fidelidad,
       historial, perfil, beneficios y mensajes

Público (sin login)
  └── /reservar — flujo de reserva sin cuenta
  └── /book/[slug] — reserva por enlace compartido
  └── /auth/forgot-password — recuperación de contraseña
```

## Matriz de permisos por rol

| Rol | Nivel de acceso | Funcionalidades principales |
|-----|----------------|-----------------------------|
| **Administrador** | CRUD total sobre todos los recursos | Gestión de citas (todas), empleados, clientes, servicios, inventario (CRUD), POS, reportes financieros, configuración del negocio, alertas de baja calificación, ajuste manual de puntos de fidelidad |
| **Empleado** | Operativo — solo sus propios datos | Ver y gestionar sus citas del día, cambiar estado de citas asignadas, registrar inicio/fin de jornada, ver sus estadísticas personales e ingresos del mes |
| **Cliente** | Usuario final — solo sus propios datos | Reservar citas (con o sin cuenta), reagendar, cancelar, calificar citas completadas, ver historial, acumular y consultar puntos de fidelidad, mensajes, perfil |
| **Público** | Solo lectura pública | Reservar sin cuenta (`/reservar`), reservar por enlace (`/book/[slug]`), recuperar contraseña |
