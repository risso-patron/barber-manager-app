# Manual del Empleado

**Ornō — v0.1.0**
**Perfil:** Empleado de la barbería
**Ruta de acceso:** `/employee/*` (el dispatcher de `/dashboard` redirige acá si tu rol es `employee`)

> Nota de precisión: versiones anteriores de este manual afirmaban que `/barber` y `/employee` son "rutas alias activas". **Eso no es correcto.** `/barber` es un dashboard antiguo, separado en el código, que ya no forma parte del flujo de navegación (nadie te redirige ahí). Este manual documenta exclusivamente el módulo vigente, `/employee/*`. Detalle técnico en [manual-sistema.md §7](manual-sistema.md#7-middleware-y-control-de-acceso).
>
> Auditado contra el código real el 2026-06-29.

---

## Tabla de contenidos

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Inicio (Dashboard)](#2-inicio-dashboard)
3. [Mi agenda — vista del día](#3-mi-agenda--vista-del-día)
4. [Calendario — vista semanal](#4-calendario--vista-semanal)
5. [Bloqueos de agenda](#5-bloqueos-de-agenda)
6. [Control de jornada (Time Tracking)](#6-control-de-jornada-time-tracking)
7. [Estadísticas](#7-estadísticas)
8. [Perfil](#8-perfil)
9. [Historial y Mis citas (páginas adicionales)](#9-historial-y-mis-citas-páginas-adicionales)
10. [Preguntas frecuentes](#10-preguntas-frecuentes)

---

## 1. Acceso al sistema

### Iniciar sesión

1. Ir a `/auth/login`
2. Ingresar tu **email** y **contraseña**
3. Hacer clic en **Iniciar sesión**
4. El sistema detecta tu rol `employee` y te redirige a `/employee/dashboard`

### Olvidé mi contraseña

1. En la pantalla de login, clic en **¿Olvidaste tu contraseña?**
2. Ingresar tu email → **Enviar instrucciones**
3. Abrir el enlace recibido por correo y definir una nueva contraseña

### Cerrar sesión

Botón de cierre de sesión en la barra lateral.

---

## 2. Inicio (Dashboard)

**Ruta:** `/employee/dashboard` — primera pantalla que ves al ingresar.

- **Jornada laboral:** botón para iniciar/finalizar tu turno, con cronómetro (HH:MM:SS) mientras estás trabajando. Esto guarda tu hora de inicio vía la API de asistencia.
- **4 tarjetas de métricas:** citas hoy (con desglose confirmadas/pendientes), citas de la semana, total completadas (histórico), ingresos de hoy.
- **Agenda de hoy:** lista numerada de tus citas del día con hora, cliente, estado, servicio, duración y precio. Las citas en estado **Confirmada** muestran botones **Completar** y **Cancelar**.
- **Próximas citas:** lista de tus próximas 5 citas (sin acciones, solo consulta).
- **Rendimiento:** clientes atendidos, ingresos totales, calificación promedio (si tenés reseñas).
- **Comisiones del mes:** si tenés un porcentaje de comisión configurado, se muestra tu comisión acumulada y tu tasa.
- **Notificaciones recientes:** hasta 5 eventos en tiempo real cuando hay cambios en tus citas (requiere Supabase configurado).

---

## 3. Mi agenda — vista del día

**Ruta:** `/employee/schedule` (pestaña **Día**, la que abre por defecto).

- 4 tarjetas: total de citas, confirmadas, completadas, ingresos del día seleccionado.
- Lista de citas de ese día (mismo formato que el dashboard). Esta vista es de **solo consulta** — los cambios de estado se hacen desde el dashboard o desde "Mis citas" (ver §9).
- Navegación: **← Anterior** / **Siguiente →** y botón **Ir a hoy** (aparece si estás viendo una fecha pasada).

---

## 4. Calendario — vista semanal

**Ruta:** `/employee/schedule?tab=week` (pestaña **Semana**).

Grilla de 7 días (lunes a domingo) con franja horaria de 08:00 a 20:00. Cada cita aparece como un bloque de color según su estado:

| Color | Estado |
|---|---|
| Azul | Confirmada |
| Verde | Completada |
| Amarillo | Pendiente |
| Naranja | No se presentó |
| Rojo/atenuado | Cancelada |
| Oscuro/mate | Bloqueo de agenda |

Pasar el mouse sobre un bloque muestra hora, servicio y cliente.

---

## 5. Bloqueos de agenda

**Ruta:** `/employee/schedule?tab=blocks` (pestaña **Bloqueos**).

Permite marcar tramos en los que no estás disponible — el sistema no los ofrece como horario libre en las reservas.

### Crear un bloqueo (panel izquierdo "Nuevo bloqueo")

| Campo | Obligatorio | Notas |
|---|:---:|---|
| Fecha | Sí | No se puede elegir una fecha pasada |
| Tipo | Sí | Descanso, Ausencia, Personal o Vacaciones |
| Hora inicio | Sí | Formato 24hs |
| Hora fin | Sí | Debe ser posterior a la hora de inicio |
| Motivo | No | Texto libre, máx. 200 caracteres |

Botón **+ Agregar bloqueo** para guardar.

### Bloqueos registrados (panel derecho)

Lista ordenada por fecha/hora con tipo, motivo y un botón de papelera para eliminar cada bloqueo. Los administradores también pueden ver y eliminar tus bloqueos desde su panel.

> Nota técnica: esta página acepta el rol `employee`, `admin` **y `manager`** en su control de acceso (`useRequireAuth`), pese a que `manager` no es un rol oficial del sistema ni tiene usuarios asignables — ver [manual-sistema.md §6](manual-sistema.md#6-autenticación-y-roles).

---

## 6. Control de jornada (Time Tracking)

**Ruta:** `/employee/time-tracking` — **no está en el menú lateral**, se accede por URL directa.

⚠️ **Importante:** esta página implementa **su propio sistema de fichaje**, separado del botón de jornada que ya viste en el Dashboard (§2). Son dos sistemas distintos que no están integrados entre sí: el del Dashboard guarda en la tabla `attendance_logs` vía `/api/attendance`; esta página lee y escribe en una tabla distinta, `time_logs`, directamente contra Supabase (no tiene fallback de modo demo). Usar ambos a la vez puede generar registros de jornada inconsistentes. Hasta que esto se unifique, se recomienda fichar siempre desde el mismo lugar.

### Qué muestra

- **Tarjeta de estado actual** (verde = trabajando, amarillo = en pausa, gris = sin iniciar), con botones:
  - Sin iniciar → **Iniciar Jornada**
  - Trabajando → **Tomar Pausa** y **Finalizar Jornada**
  - En pausa → **Reanudar** y **Finalizar Jornada**
- Mientras la sesión está activa: tiempo trabajado, cantidad de pausas tomadas, estado (Activo/En Pausa).
- **5 tarjetas de resumen:** horas hoy, esta semana, este mes, promedio por día, pausas del mes/semana.
- **Historial de jornadas:** últimas 30 jornadas completadas, con rango horario, duración total y detalle de pausas.

---

## 7. Estadísticas

**Ruta:** `/employee/stats`.

- **4 KPIs:** completados (histórico), ingresos generados (+ ticket promedio), clientes únicos, calificación promedio.
- **3 tarjetas de actividad:** citas de hoy, de la semana, del mes.
- **Gráfico de barras:** top 5 servicios por ingresos.
- **Servicios destacados:** ranking de tus servicios más realizados, con ingresos por servicio.
- **Mejor día:** el día de la semana con más servicios e ingresos.
- **Feedback:** últimas 5 reseñas de clientes (calificación + comentario), si las hay.
- **Rendimiento:** eficiencia (% de citas completadas), clientes únicos, ticket promedio.

---

## 8. Perfil

**Ruta:** `/employee/profile`.

- **Tarjeta de identidad:** avatar, nombre, email, badge de rol.
- **Formulario editable:** nombre, teléfono, URL de avatar (el email no es editable). Botón **Guardar cambios**.
- **En modo demo:** el formulario aparece en modo solo lectura con el aviso "Modo demo — vista de solo lectura. Los cambios no se guardan."

---

## 9. Historial y Mis citas (páginas adicionales)

Estas dos páginas existen y son funcionales, pero **no aparecen en el menú lateral** — se accede por URL directa:

- **`/employee/history`** — buscador de citas pasadas (completadas, canceladas o no-show) por nombre de cliente o servicio.
- **`/employee/appointments`** — lista de tus citas activas/próximas con acciones de cambio de estado: **Confirmar**, **No se presentó** y **Cancelar** para citas pendientes; **Completar**, **No se presentó** y **Cancelar** para citas confirmadas.

---

## 10. Preguntas frecuentes

**¿Puedo ver las citas de otro empleado?**
No. Cada vista te muestra únicamente las citas asignadas a tu usuario.

**¿Por qué hay dos lugares para fichar mi jornada (Dashboard y Time Tracking)?**
Es una inconsistencia conocida del sistema — son dos funcionalidades implementadas por separado que no comparten datos. Usá siempre la misma para evitar registros duplicados o incompletos. Ver nota en §6.

**¿Los ingresos que veo son mi comisión?**
No, son el precio total del servicio. Tu comisión se calcula como `precio × tu % de comisión` y se muestra aparte en el Dashboard, si tenés un porcentaje configurado.

**¿Puedo crear o cancelar una cita de cero?**
No. La creación de citas la maneja el administrador o el cliente. Vos podés cambiar el estado de las citas ya asignadas a vos.

**¿Qué es `/barber`?**
Es una pantalla anterior del sistema, con una jornada y agenda propias, que ya no forma parte de la navegación normal. Si llegaste ahí por un enlace viejo, usá `/employee/dashboard` en su lugar.

**¿Puedo usar esto desde el celular?**
Sí, todas las páginas del módulo de empleado son responsive.
