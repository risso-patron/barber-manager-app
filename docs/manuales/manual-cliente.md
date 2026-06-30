# Manual del Cliente

**Ornō — v0.1.0**
**Perfil:** Cliente de la barbería
**Acceso:** Con cuenta (`/client/*`) o sin cuenta, vía enlace público (`/reservar`, `/book/[slug]`)

> Auditado y corregido contra el código real el 2026-06-30. Esta revisión corrige varias afirmaciones desactualizadas: la reserva con varios servicios a la vez solo existe en el flujo **sin cuenta**, no en el panel de cliente logueado; los regalos no se "canjean" desde la app (se presentan en persona); las calificaciones sí se pueden editar; y el modal de creación de cuenta aparece después de confirmar la reserva, no durante el flujo.

---

## Tabla de contenidos

1. [Registrarme como cliente](#1-registrarme-como-cliente)
2. [Iniciar sesión](#2-iniciar-sesión)
3. [Mi panel de cliente](#3-mi-panel-de-cliente)
4. [Reservar una cita (con cuenta)](#4-reservar-una-cita-con-cuenta)
5. [Reservar una cita (sin cuenta)](#5-reservar-una-cita-sin-cuenta)
6. [Gestionar mis citas](#6-gestionar-mis-citas)
7. [Reagendar una cita](#7-reagendar-una-cita)
8. [Cancelar una cita](#8-cancelar-una-cita)
9. [Calificar una cita](#9-calificar-una-cita)
10. [Historial de citas](#10-historial-de-citas)
11. [Puntos de fidelidad](#11-puntos-de-fidelidad)
12. [Mi perfil](#12-mi-perfil)
13. [Regalos recibidos](#13-regalos-recibidos)
14. [Mensajes](#14-mensajes)
15. [Preguntas frecuentes](#15-preguntas-frecuentes)

---

## 1. Registrarme como cliente

1. Ir a `/auth/register`
2. Completar: Nombre completo (mín. 3 caracteres), Email, Contraseña (mín. 8, con mayúscula/minúscula/número), Confirmar contraseña, Teléfono (opcional). El rol se asigna automáticamente como **Cliente**
3. **Registrarme**
4. Aceptar el modal de Términos y Condiciones
5. Te redirige al login para ingresar con tus credenciales recién creadas

---

## 2. Iniciar sesión

1. Ir a `/auth/login`
2. Ingresar email y contraseña → **Iniciar sesión**
3. El sistema te lleva a `/client`

### Olvidé mi contraseña

En login, **¿Olvidaste tu contraseña?** → ingresar email → seguir el enlace recibido por correo → definir nueva contraseña.

---

## 3. Mi panel de cliente

**Ruta:** `/client`

> Nota técnica: esta sección acepta sesiones con rol `client` **o `admin`** (`useRequireAuth(["client", "admin"])`) — un administrador puede entrar al panel de cliente sin que esto forme parte de un flujo de uso documentado para administradores.

El panel principal muestra:

| Sección | Qué contiene |
|---|---|
| Mi perfil | Resumen de nombre, email, teléfono |
| Próximas citas | Tus citas pendientes o confirmadas |
| Fidelidad | Saldo de puntos y últimas transacciones — ver §11 |
| Regalos | Códigos de regalo enviados por la barbería — ver §13 |
| Mensajes | Mensajes enviados por la barbería, con contador de no leídos — ver §14 |

### Navegación

Barra lateral en escritorio / barra inferior en móvil, con 5 accesos: **Inicio · Reservar · Mis citas · Historial · Mi perfil**. No existen páginas separadas para Regalos o Mensajes — ambos son widgets dentro del panel de Inicio, no secciones de navegación propias.

---

## 4. Reservar una cita (con cuenta)

**Ruta:** `/client/book`

⚠️ **Esta reserva es de un solo servicio por cita** — a diferencia del flujo sin cuenta (§5), acá no hay carrito multi-servicio. Si querés reservar varios servicios en un solo turno, usá el enlace público de §5.

### Paso 1: Elegí el servicio

Se muestran los servicios activos (nombre, descripción, precio, duración). Hacer clic en uno lo selecciona (selección única, no acumulable).

### Paso 2: Elegí el barbero

Tarjetas con foto, nombre y especialidad de cada empleado disponible.

### Paso 3: Elegí fecha y hora

Calendario con días disponibles; al elegir una fecha aparecen los horarios libres según el horario de atención configurado por la barbería.

### Paso 4: Confirmá

Formulario pre-completado con tu nombre, teléfono y email (editable), más un campo opcional de notas para el barbero. **Confirmar reserva** crea la cita en estado **Pendiente**, visible de inmediato en tu lista de próximas citas y en el panel del administrador.

---

## 5. Reservar una cita (sin cuenta)

**Ruta:** `/reservar` o `/book/[slug]` (enlace compartido por la barbería)

Mismo flujo de 4 pasos que §4, con dos diferencias importantes:

- **Paso 1 permite elegir varios servicios** en la misma reserva (carrito multi-servicio, con total acumulado y duración total) — esto es exclusivo de este flujo sin cuenta.
- **Paso 4** pide tus datos de contacto (nombre, teléfono, email) porque no hay perfil pre-cargado.

### Modal de creación de cuenta

Después de confirmar la reserva (no durante el flujo), aparece un modal invitándote a crear una cuenta para gestionar tus citas más fácilmente. El botón para omitirlo dice **"Tal vez después"** — omitirlo no afecta la reserva ya confirmada.

---

## 6. Gestionar mis citas

**Ruta:** `/client/appointments`

Dos pestañas:

- **Próximas:** citas en estado Pendiente o Confirmada, con acciones **Reagendar** (§7) y **Cancelar** (§8)
- **Pasadas:** citas Completadas o Canceladas (solo consulta)

Columnas mostradas: servicio, barbero, fecha, hora, estado.

---

## 7. Reagendar una cita

Disponible para citas Pendiente o Confirmada cuya fecha aún no pasó.

1. `/client/appointments` → localizar la cita → **Reagendar**
2. Modal con selector de nueva fecha (mínimo: **mañana**, no se puede elegir hoy ni una fecha pasada) y nueva hora
3. **Confirmar reagendamiento** — la cita mantiene su estado, solo cambian fecha/hora

---

## 8. Cancelar una cita

Disponible para citas Pendiente o Confirmada que aún no pasaron.

1. `/client/appointments` → localizar la cita → **Cancelar**
2. Modal con campo opcional de motivo, y una nota fija de política: *"Por favor cancela con al menos 24 horas de anticipación para evitar cargos."*
3. **Confirmar cancelación**

> Esta advertencia es un texto genérico de 24 horas — **no muestra el monto real configurado por la barbería** en `/admin/settings` (fee de cancelación). Si necesitás saber el monto exacto, consultá directamente con la barbería.

---

## 9. Calificar una cita

Disponible una vez que la cita queda en estado **Completada**.

1. Ir al historial (`/client/history`) o al panel principal → localizar la cita completada → **Calificar**
2. Modal: calificación de 1 a 5 estrellas (obligatoria) + reseña de texto libre, **hasta 1000 caracteres** (opcional)
3. **Enviar calificación**

> A diferencia de versiones anteriores de este manual: **sí podés volver a editar tu calificación** después de enviarla — el botón cambia a "★ Editar" sobre una cita ya calificada.

Las calificaciones de 1-2★ generan una alerta interna que el administrador ve en su dashboard.

---

## 10. Historial de citas

**Ruta:** `/client/history`

### Estadísticas mostradas

Total de citas · Total gastado (citas completadas) · Calificación promedio (solo sobre citas que calificaste) · Cantidad de canceladas · Servicio favorito · Barbero favorito.

### Filtros

Búsqueda por servicio o barbero + filtro por estado.

### Cada tarjeta del historial muestra

Estado, servicio, barbero, fecha, hora, monto, y tu calificación si ya la dejaste.

---

## 11. Puntos de fidelidad

Acumulás **1 punto por cada dólar** gastado en citas completadas o en compras directas en la barbería.

En el panel de Inicio, la sección **Fidelidad** muestra tu saldo y tus últimas 5 transacciones, cada una etiquetada como:

| Etiqueta mostrada | Significa |
|---|---|
| Cita completada | Puntos ganados por una cita completada |
| Canje | Puntos descontados al usar un beneficio |
| Ajuste | Cambio manual hecho por el administrador |

> Corrige una afirmación anterior: no existe una categoría "POS" visible para el cliente — las compras directas en mostrador suman puntos, pero en tu historial aparecen bajo las mismas etiquetas de arriba.

El canje de puntos por descuentos lo gestiona el administrador desde su panel (no hay una pantalla de autocanje para el cliente).

---

## 12. Mi perfil

**Ruta:** `/client/profile`

- **Nombre** — editable
- **Teléfono** — editable
- **Email** — de solo lectura, con la nota "El email no se puede cambiar desde aquí"

**Editar** → modificar → **Guardar**.

---

## 13. Regalos recibidos

La barbería puede enviarte códigos de regalo o beneficio desde su panel (ver `manual-admin.md §7`): % de descuento, descuento fijo, servicio gratis o producto gratis.

En el panel de Inicio, la tarjeta **Regalos** muestra el código (en formato monoespaciado), su descripción y si ya fue marcado como canjeado.

> ⚠️ Corrige una afirmación anterior: **no hay un botón "Canjear" ni un campo para ingresar el código desde la app.** El código se muestra para que lo **presentes en persona en la barbería**; quien lo marca como canjeado es el administrador desde su panel, no vos.

---

## 14. Mensajes

La barbería puede enviarte mensajes (recordatorios, promociones, avisos) desde su panel (ver `manual-admin.md §7`).

En el panel de Inicio, la tarjeta **Mensajes** muestra la lista ordenada por fecha, con un contador de mensajes no leídos. Hacer clic en un mensaje lo abre y lo marca como **Leído**.

---

## 15. Preguntas frecuentes

**¿Puedo reservar sin tener cuenta?**
Sí, en `/reservar` o el enlace que te compartieron. Es además la única forma de reservar **varios servicios en una sola cita** — ver §5.

**¿Por qué en mi panel solo puedo reservar un servicio a la vez?**
Es una limitación real del flujo logueado (`/client/book`) frente al flujo público (`/reservar`), que sí soporta varios servicios. Si necesitás combinar servicios, usá el enlace público aunque tengas cuenta.

**¿Puedo cambiar la hora de una cita ya reservada?**
Sí, con **Reagendar** desde `/client/appointments`, mientras la cita esté Pendiente o Confirmada y la fecha no haya pasado. La fecha mínima seleccionable es mañana.

**¿Puedo corregir una calificación que ya envié?**
Sí, podés editarla en cualquier momento desde el historial o el panel principal.

**¿Cómo canjeo un código de regalo?**
Mostrándolo en la barbería — no hay forma de canjearlo desde la app.

**¿Mis datos están seguros?**
La aplicación usa Supabase con HTTPS y Row Level Security (RLS) definida en scripts SQL. Su aplicación efectiva contra una instancia real no fue verificada de forma independiente en esta auditoría — ver `docs/manuales/manual-sistema.md §15`.

**¿La app funciona en el celular?**
Sí, es responsive.

**¿Qué hago si no puedo iniciar sesión?**
Verificá tu email y contraseña. Si la olvidaste, usá el flujo de recuperación desde el login.
