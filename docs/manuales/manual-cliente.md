# Manual del Cliente

**Barber Manager App — Versión 1.1**  
**Perfil:** Cliente de la barbería  
**Acceso:** Puede usar la app con o sin cuenta registrada

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
13. [Beneficios: Regalos y cupones](#13-beneficios-regalos-y-cupones)
14. [Mensajes](#14-mensajes)
15. [Preguntas frecuentes](#15-preguntas-frecuentes)

---

## 1. Registrarme como cliente

Si es la primera vez que usás la app, podés crear tu cuenta para gestionar tus citas, ver tu historial y recibir beneficios.

### Pasos para registrarse

1. Ir a `/auth/register`
2. Completar el formulario:

| Campo | Obligatorio | Detalles |
|-------|------------|---------|
| Nombre completo | Sí | Mínimo 3 caracteres |
| Email | Sí | Dirección de correo válida; no puede estar ya registrada |
| Contraseña | Sí | Mínimo 8 caracteres, debe incluir mayúscula, minúscula y número |
| Confirmar contraseña | Sí | Debe coincidir con la contraseña |
| Teléfono | No | Útil para que la barbería te contacte |
| Rol | — | Se asigna automáticamente como **Cliente** |

3. Hacer clic en **Registrarme**
4. Se muestra el modal de **Términos y Condiciones**
5. Leer los términos y hacer clic en **Aceptar** para continuar
6. Serás redirigido al login — ingresar con tu email y contraseña recién creados

> **Consejo:** Usá un email al que tengas acceso fácil desde el celular para recibir las notificaciones de tus citas.

---

## 2. Iniciar sesión

1. Ir a `/auth/login`
2. Ingresar tu **email** y **contraseña**
3. Hacer clic en **Iniciar sesión**
4. El sistema detecta que sos cliente y te lleva a `/client`

### Olvidé mi contraseña

1. En la pantalla de login, hacer clic en **¿Olvidaste tu contraseña?**
2. Ingresar tu email y hacer clic en **Enviar instrucciones**
3. Revisar tu correo y hacer clic en el enlace de restablecimiento
4. Ingresar la nueva contraseña (mínimo 8 caracteres, mayúscula, minúscula y número)
5. Confirmar la nueva contraseña y hacer clic en **Guardar nueva contraseña**
6. El sistema te redirige al login para que ingreses con tu nueva contraseña

---

## 3. Mi panel de cliente

**Ruta:** `/client`

Al ingresar, tu panel muestra una vista general con:

| Sección | Descripción |
|---------|-------------|
| Mi perfil | Resumen con tu nombre, email y teléfono. Botón para editar. |
| Próximas citas | Lista de tus citas confirmadas o pendientes |
| Historial | Acceso rápido a tus citas pasadas |
| Puntos de fidelidad | Saldo de puntos acumulados y últimas transacciones |
| Beneficios / Regalos | Códigos de regalo o cupones disponibles para vos |
| Mensajes | Bandeja de mensajes de la barbería |
| Mi carrito | Productos disponibles para comprar |

---

## 4. Reservar una cita (con cuenta)

**Ruta:** `/client/book`

El flujo de reserva guiado tiene **4 pasos**:

### Paso 1: Elegí el servicio

- Se muestran todos los servicios activos de la barbería
- Cada tarjeta indica: **nombre**, **descripción**, **precio** y **duración**
- Hacer clic en el servicio que querés → queda seleccionado (se resalta)

### Paso 2: Elegí el barbero

- Se muestran todos los empleados disponibles
- Cada tarjeta muestra la foto, nombre y especialidad
- Hacer clic en el barbero de tu preferencia

### Paso 3: Elegí fecha y hora

- Se muestra un calendario con los días disponibles
- Al seleccionar una fecha, aparecen los **horarios disponibles** para ese día
- Los horarios están basados en el horario de atención configurado por la barbería
- Hacer clic en el horario que te convenga

### Paso 4: Confirmá los datos

Revisar y completar:

| Campo | Obligatorio | Notas |
|-------|------------|-------|
| Nombre | Sí | Pre-completado con tu nombre de perfil |
| Teléfono | Sí | Pre-completado si lo cargaste en tu perfil |
| Email | Sí | Pre-completado con tu email |
| Notas adicionales | No | Podés dejar indicaciones especiales al barbero |

Hacer clic en **Confirmar reserva**.

### Confirmación

Al confirmar exitosamente:
- La cita queda registrada con estado **Pendiente**
- Aparece en tu lista de próximas citas
- La barbería la verá en su panel de administración

---

## 5. Reservar una cita (sin cuenta)

**Ruta:** `/reservar` o `/book/[slug]` (enlace compartido por la barbería)

Si no tenés cuenta o no querés crear una, podés reservar directamente desde el enlace público de la barbería.

### El flujo es idéntico (4 pasos), con una diferencia en el Paso 4:

**Paso 4: Tus datos de contacto**

| Campo | Obligatorio | Notas |
|-------|------------|-------|
| Nombre completo | Sí | |
| Teléfono | Sí | Para que la barbería te confirme |
| Email | Sí | Para recibir la confirmación |
| ¿Querés crear una cuenta? | No | Checkbox opcional — te ahorra los datos para la próxima vez |

### ¿Crear cuenta al reservar?

Si hacés clic en **"Crear cuenta"** durante la reserva:
- Se abre un modal invitándote a registrarte
- Podés crearte la cuenta en ese momento o seleccionar **"Luego"**
- Elegir **"Luego"** no cancela ni afecta tu reserva

---

## 6. Gestionar mis citas

**Ruta:** `/client/appointments`

Desde esta sección podés ver y gestionar todas tus citas.

### Próximas citas

Lista de citas con estado **Pendiente** o **Confirmada**:

| Columna | Descripción |
|---------|-------------|
| Servicio | Qué servicio reservaste |
| Barbero | A quién le reservaste |
| Fecha | Día de la cita |
| Hora | Horario de la cita |
| Estado | Pendiente / Confirmada |

Acciones disponibles:
- **Reagendar** — ver sección 7
- **Cancelar** — ver sección 8

### Citas completadas

Lista de citas con estado **Completada** (ya fueron atendidas) o **Cancelada**.

---

## 7. Reagendar una cita

> **Disponible para:** citas en estado **Pendiente** o **Confirmada** cuya fecha aún no haya pasado.

Si necesitás cambiar la fecha u hora de una cita **sin cancelarla**, podés reagendarla:

1. Ir a `/client/appointments`
2. Localizar la cita que querés reagendar
3. Hacer clic en **Reagendar**
4. Se abre el modal de reagendamiento con:
   - Selector de **nueva fecha** (mínimo: mañana)
   - Selector de **nueva hora** (formato 24hs)
5. Hacer clic en **Confirmar reagendamiento**
6. La cita se actualiza con la nueva fecha/hora y el estado permanece igual

> **Nota:** Si la nueva fecha es anterior a hoy el sistema rechazará el cambio.

---

## 8. Cancelar una cita

> **Importante:** Solo podés cancelar citas que aún **no hayan pasado** y que estén en estado Pendiente o Confirmada.

### Pasos para cancelar

1. Ir a `/client/appointments` o usar el botón **Cancelar** en tu panel de inicio
2. Localizar la cita que querés cancelar
3. Hacer clic en **Cancelar**
4. Se abre un modal de confirmación con el siguiente campo:

| Campo | Obligatorio | Notas |
|-------|------------|-------|
| Motivo de cancelación | No | Podés explicar el motivo (texto libre) |

5. Hacer clic en **Confirmar cancelación** (o **No cancelar** para cerrar sin cambios)
6. La cita cambia a estado **Cancelada**

> **Nota sobre fees de cancelación:** Si la barbería tiene configurado un cargo por cancelación, este se informará en el modal antes de confirmar.

---

## 9. Calificar una cita

Una vez que tu cita queda con estado **Completada**, podés dejar una calificación y reseña para la barbería.

### Cómo calificar

1. Ir al **historial de citas** (`/client/history`) o al panel principal
2. Localizar la cita completada
3. Hacer clic en **Calificar** (o el ícono de estrella)
4. Se abre el modal de calificación:

| Campo | Obligatorio | Notas |
|-------|------------|-------|
| Calificación | Sí | Escala de 1 a 5 estrellas (★★★★★) |
| Reseña / comentario | No | Texto libre, máximo 500 caracteres |

5. Hacer clic en **Enviar calificación**

> Cada cita se puede calificar **una sola vez**. Una vez enviada, la calificación no se puede editar.

> Las calificaciones de 1–2★ generan una **alerta interna** que el administrador verá en su dashboard para dar seguimiento.

---

## 10. Historial de citas

**Ruta:** `/client/history`

Muestra todas tus citas pasadas con estadísticas personales.

### Estadísticas de tu historial

| Métrica | Qué mide |
|---------|---------|
| Total de citas | Cantidad total de citas que hiciste |
| Citas completadas | Cuántas se realizaron exitosamente |
| Total gastado | Suma de los servicios completados |
| Calificación promedio | Promedio de tus ratings (si los hay) |

### Búsqueda y filtros

| Filtro | Opciones |
|--------|---------|
| Búsqueda | Por nombre del servicio o del barbero |
| Estado | Todas / Completadas / Canceladas / Pendientes |

### Detalle de cada cita en el historial

Cada tarjeta muestra:
- ✓ Ícono de completada (verde) o el estado que corresponda
- **Servicio** realizado
- **Barbero** que te atendió
- **Fecha** de la cita
- **Hora**
- **Monto** pagado
- **Notas** del administrador o barbero (si las hay)
- **Calificación** que dejaste (si ya calificaste)

---

## 11. Puntos de fidelidad

**Sección:** Fidelidad en el panel de cliente

Acumulás **1 punto por cada dólar** gastado en citas completadas o en compras directas en la barbería (POS).

### Ver tu saldo

En tu panel de cliente, la sección **Fidelidad** muestra:
- Tu saldo actual de puntos (número grande)
- La descripción: “Ganás 1 punto por cada dólar gastado en citas y compras”
- Las últimas 5 transacciones con delta verde (ganaste) o rojo (canjeaste)

### Tipos de transacciones

| Tipo | Signo | Descripción |
|------|-------|-------------|
| Completado | +Nº | Puntos ganados por una cita completada |
| POS | +Nº | Puntos ganados por una compra directa |
| Ajuste | +Nº | Puntos agregados manualmente por el admin |
| Canje | −Nº | Puntos restados al canjear un beneficio |

> El canje de puntos por beneficios (descuentos, productos) lo gestiona el administrador de la barbería directamente.

---

## 12. Mi perfil

Desde el panel de cliente → sección **Mi perfil** → botón **"Ver perfil completo"**:

- **Nombre completo** — editable
- **Email** — de solo lectura (no se puede cambiar desde la app)
- **Teléfono** — editable

Para editar, hacer clic en **Editar** → modificar los campos → **Guardar**.

---

## 13. Beneficios: Regalos y cupones

**Sección:** Mi carrito / Ofertas en el panel de cliente

La barbería puede enviarte **códigos de regalo o cupones de descuento** personalizados.

### Ver mis beneficios

En el panel de cliente → tarjeta **"Beneficios / Regalos"**:
- Muestra el código del regalo o cupón activo
- Fecha de vencimiento (si aplica)

### Canjear un cupón

1. Hacer clic en **"Canjear"**
2. Ingresar el código recibido (o usar el que ya está cargado)
3. Confirmar el canje

> La disponibilidad de esta feature depende de la configuración de la barbería.

---

## 14. Mensajes

**Sección:** Mensajes en el panel de cliente

La barbería puede enviarte mensajes directos (recordatorios, promociones, avisos).

### Ver mensajes

En el panel de cliente → tarjeta **"Mensajes"** → **"Ver mensajes"**:
- Lista de mensajes ordenados por fecha
- Los mensajes no leídos se muestran con un contador
- Hacer clic en un mensaje para leerlo completo

---

## 15. Preguntas frecuentes

**¿Puedo reservar sin tener cuenta?**  
Sí. Usá el enlace público de la barbería (`/reservar` o el link que te compartieron) para reservar sin registrarte.

**¿Puedo cambiar la hora de una cita ya reservada?**  
Sí. Desde `/client/appointments`, localizá la cita y hacé clic en **Reagendar**. Podés cambiar fecha y hora siempre que la cita esté en estado Pendiente o Confirmada y la fecha no haya pasado.

**¿Cómo sé si mi reserva fue confirmada?**  
Al hacer la reserva queda con estado **Pendiente**. La barbería la confirmará y el estado cambiará a **Confirmada**. Podés verificarlo en `/client/appointments`.

**Olvidé mi contraseña, ¿qué hago?**  
En la pantalla de login hacé clic en **¿Olvidaste tu contraseña?**, ingresá tu email y seguí las instrucciones que llegarán a tu correo.

**¿Para qué sirven los puntos de fidelidad?**  
Acumulás 1 punto por cada dólar gastado. Los puntos se canjean por beneficios (descuentos, productos) a discreción de la barbería. Podés ver tu saldo y el historial en tu panel.

**¿Mis datos están seguros?**  
Sí. La aplicación utiliza Supabase con cifrado en tránsito (HTTPS) y Row Level Security (RLS) en la base de datos, lo que significa que solo vos podés ver tus propias citas.

**¿Puedo tener más de una cuenta?**  
Técnicamente sí, pero no es recomendable. El historial y los puntos de fidelidad están atados a cada cuenta individualmente.

**¿La app funciona en el celular?**  
Sí. La aplicación es responsive y funciona en Chrome, Safari y Firefox en dispositivos móviles.

**¿Qué hago si no puedo iniciar sesión?**  
Verificá que el email y la contraseña sean correctos. Si olvidaste la contraseña usá el flujo de recuperación desde el login.
