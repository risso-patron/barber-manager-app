# Manual del Empleado / Barbero

**Barber Manager App — Versión 1.1**  
**Perfil:** Empleado / Barbero  
**Ruta de acceso:** `/barber` (redirige automáticamente desde `/dashboard` si el rol es `employee`)

---

## Tabla de contenidos

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Panel del empleado (Dashboard)](#2-panel-del-empleado-dashboard)
3. [Estado de trabajo](#3-estado-de-trabajo)
4. [Mis citas del día](#4-mis-citas-del-día)
5. [Gestionar el estado de una cita](#5-gestionar-el-estado-de-una-cita)
6. [Estadísticas personales y comisiones](#6-estadísticas-personales-y-comisiones)
7. [Preguntas frecuentes](#7-preguntas-frecuentes)

---

## 1. Acceso al sistema

### Iniciar sesión

1. Abrir el navegador y navegar a `/auth/login`
2. Ingresar el **email** y la **contraseña** que el administrador te proporcionó
3. Hacer clic en **Iniciar sesión**
4. El sistema detecta el rol `employee` y redirige automáticamente a `/barber`

### Primera sesión con contraseña temporal

Si el administrador te entregó una contraseña temporal (formato `Barber{código}!`):
1. Ingresar con esa contraseña
2. Cambiar la contraseña desde el perfil lo antes posible

### Olvidé mi contraseña

1. En la pantalla de login, hacer clic en **¿Olvidaste tu contraseña?**
2. Ingresar tu email y hacer clic en **Enviar instrucciones**
3. Revisar el correo y hacer clic en el enlace de restablecimiento
4. Ingresar la nueva contraseña y confirmarla
5. Al guardar, el sistema redirige al login

Si no recordas el email de tu cuenta, contactá al administrador.

### Cerrar sesión

Clic en el ícono de usuario en la barra superior → **Cerrar sesión**.

> **Importante:** Si usás una computadora compartida, siempre cerrá sesión al terminar tu turno.

---

## 2. Panel del empleado (Dashboard)

**Ruta:** `/barber`

Al ingresar, verás tu panel personal que muestra únicamente **tus propias citas** — no las de otros empleados.

### Lo que verás en el dashboard

- **Botón de estado de trabajo** — iniciar o terminar tu jornada
- **4 tarjetas de métricas** — estadísticas del día y del mes
- **Lista de citas del día** — todas las citas asignadas a vos hoy

---

## 3. Estado de trabajo

### Comenzar a trabajar

Al inicio de tu jornada, hacer clic en el botón **"Comience a trabajar"**.

- El botón cambia a **"Termine de trabajar"**
- Se registra la hora de inicio en la base de datos
- El estado se mantiene aunque recargues la página o cierres y vuelvas a abrir el navegador

### Terminar de trabajar

Al finalizar tu jornada, hacer clic en **“Termine de trabajar”**.

- Se registra la hora de fin en la base de datos
- El estado se borra del dashboard

> **Nota:** A partir de la versión 1.1 el estado de trabajo se guarda en la base de datos. Si cerraste la pestaña y volvés a entrar, el sistema recupera automáticamente si ya estabas trabajando.

---

## 4. Mis citas del día

La lista central del dashboard muestra todas las citas asignadas a **vos** para **el día de hoy**.

### Columnas de la tabla

| Columna | Descripción |
|---------|-------------|
| Hora | Horario de la cita en formato 24hs |
| Cliente | Nombre del cliente que va a venir |
| Servicio | Qué servicio se va a realizar |
| Precio | Precio del servicio |
| Estado | Badge de color según el estado actual |

### Estados posibles

| Estado | Color | Significado |
|--------|-------|------------|
| Pendiente | Amarillo | Cita creada pero no confirmada |
| Confirmada | Azul | La cita está confirmada |
| Completada | Verde | Servicio realizado |
| Cancelada | Rojo | La cita fue cancelada |

### Acceder a los detalles de una cita

Hacer clic en cualquier cita → se abre un **modal de detalle** con:
- Nombre completo del cliente
- Teléfono del cliente (para contacto)
- Servicio a realizar y su descripción
- Precio
- Notas especiales del administrador o del cliente
- Estado actual

---

## 5. Gestionar el estado de una cita

Cada cita tiene acciones disponibles según su estado actual:

### Confirmar una cita

Cuando una cita llega en estado **Pendiente**:
1. Localizar la cita en la lista del día
2. Hacer clic en la acción **Confirmar**
3. El estado cambia a **Confirmada**

Esto le indica al cliente y al administrador que la cita fue vista y aceptada.

### Marcar una cita como completada

Cuando terminás de atender al cliente:
1. Localizar la cita en la lista
2. Hacer clic en **Completar**
3. El estado cambia a **Completada** y aparece en verde

Este paso es importante porque el sistema usa las citas completadas para calcular los **ingresos del mes** y los **reportes del administrador**.

### Marcar como no-show

Si el cliente no se presentó a su cita:
1. Localizar la cita
2. Hacer clic en **No show** o **Cancelar**
3. El estado cambia a **Cancelada**

---

## 6. Estadísticas personales y comisiones

Las 4 tarjetas en la parte superior del dashboard muestran tus métricas:

| Tarjeta | Qué muestra |
|---------|-------------|
| Citas totales hoy | Cantidad de citas que tenés programadas hoy |
| Citas completadas hoy | Cuántas ya marcaste como completadas |
| Citas totales esta semana | Total de tu semana actual |
| Ingresos este mes | Suma de los servicios que completaste este mes |

Los datos se cargan automáticamente al abrir el dashboard y corresponden **solo a tus citas**.

### Comisiones

Cada empleado tiene un **porcentaje de comisión** configurado por el administrador. Cuando una cita asignada a vos pasa a estado **Completada**, el sistema calcula automáticamente tu comisión:

> `comisión = precio del servicio × porcentaje de comisión / 100`

Por ejemplo, si el servicio cuesta $30 y tu comisión es del 40%, ganás $12 por esa cita.

Los ingresos que se muestran en tu dashboard son el **precio total del servicio** (no la comisión). Para ver el detalle de comisiones, contactá al administrador.

---

## 7. Preguntas frecuentes

**¿Puedo ver las citas de otro barbero?**  
No. El sistema solo te muestra las citas asignadas a tu usuario. Para ver citas de otros empleados, se necesita acceso de administrador.

**¿Puedo crear o cancelar citas desde mi panel?**  
No directamente. La creación y cancelación de citas la maneja el administrador o el propio cliente. Podés cambiar el estado de tus citas (confirmar, completar, no-show) pero no crear ni eliminar.

**¿Qué hago si una cita no aparece en mi lista?**  
Puede ser que la cita esté asignada a otro empleado. Consultá con el administrador para que verifique la asignación.

**¿Los ingresos que veo son mis comisiones?**  
No, son el total del precio del servicio. Tu comisión se calcula automáticamente como `precio × tu % de comisión`. Para ver el detalle, contactá al administrador.

**¿Por qué al recargar la página el estado de "trabajando" no se pierde?**  
A partir de la versión 1.1 el estado de jornada laboral se guarda en la base de datos y se recupera automáticamente al volver a ingresar.

**¿Puedo usar la app desde el celular?**  
Sí. La aplicación es responsive y funciona en móvil. Se recomienda usar el navegador Chrome o Safari actualizados.
