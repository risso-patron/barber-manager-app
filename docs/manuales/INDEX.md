# Barber Manager — Centro de Documentación

**Versión:** 1.0 — Mayo 2026  
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
  └── Acceso total: citas, empleados, clientes, servicios, inventario, reportes, configuración

Empleado (/barber/*)
  └── Solo su agenda personal y citas asignadas a él

Cliente (/client/*)
  └── Sus propias citas, historial, perfil y reservas

Público (sin login)
  └── /reservar — flujo de reserva sin cuenta
  └── /book/[slug] — reserva por enlace compartido
```
