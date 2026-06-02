# Manual del Administrador

**Barber Manager App — Versión 1.1**  
**Perfil:** Administrador (dueño o gestor de la barbería)  
**Ruta de acceso:** `/admin`

---

## Tabla de contenidos

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Panel principal (Dashboard)](#2-panel-principal-dashboard)
3. [Gestión de citas](#3-gestión-de-citas)
4. [Gestión de empleados](#4-gestión-de-empleados)
5. [Gestión de servicios](#5-gestión-de-servicios)
6. [Gestión de clientes](#6-gestión-de-clientes)
7. [Inventario](#7-inventario)
8. [Punto de Venta (POS)](#8-punto-de-venta-pos)
9. [Reportes](#9-reportes)
10. [Compartir enlace de reservas](#10-compartir-enlace-de-reservas)
11. [Configuración del negocio](#11-configuración-del-negocio)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. Acceso al sistema

### Iniciar sesión

1. Abrir el navegador y navegar a `/auth/login`
2. Ingresar **email** y **contraseña** del administrador
3. Hacer clic en **Iniciar sesión**
4. El sistema detecta el rol `admin` y redirige automáticamente a `/admin`

### Requisitos de la contraseña

- Mínimo **8 caracteres**, máximo 50
- Al menos **1 letra mayúscula**
- Al menos **1 letra minúscula**
- Al menos **1 número**

### Olvidé mi contraseña

1. En la pantalla de login, hacer clic en **¿Olvidaste tu contraseña?**
2. Ingresar el email del administrador y hacer clic en **Enviar instrucciones**
3. Revisar el correo y hacer clic en el enlace de restablecimiento
4. Ingresar la nueva contraseña (mínimo 8 caracteres, mayúscula, minúscula y número)
5. Al confirmar, el sistema redirige al login

### Cerrar sesión

Hacer clic en el ícono de usuario en la barra superior → **Cerrar sesión**. La sesión también se invalida automáticamente cuando el token de Supabase expira.

---

## 2. Panel principal (Dashboard)

**Ruta:** `/admin`

Al ingresar, el dashboard muestra una vista general del negocio con **8 tarjetas de métricas** en tiempo real:

| Tarjeta | Qué muestra |
|---------|-------------|
| Total de citas | Suma histórica de todas las citas registradas |
| Citas de hoy | Citas programadas para el día actual |
| Total de empleados | Empleados registrados en el sistema |
| Empleados activos | Empleados con estado activo |
| Total de clientes | Clientes únicos registrados |
| Clientes nuevos este mes | Clientes que se registraron en el mes en curso |
| Ingresos mensuales | Suma de servicios de citas completadas en el mes |
| Citas pendientes | Citas aún no confirmadas ni atendidas |

> **Modo demo:** Si el sistema no tiene Supabase configurado, el dashboard muestra datos ficticios: 14 citas, 3 empleados, 24 clientes, $840 mensuales.

### Alertas de calificación (sección inferior)

El panel muestra automáticamente las **alertas de baja calificación** pendientes de revisión.

- Las calificaciones de **1★** se muestran con franja roja
- Las calificaciones de **2★** se muestran con franja ámbar
- Cada alerta muestra: estrellas, nombre del cliente, reseña (si la hay), empleado involucrado y fecha
- Si no hay alertas pendientes se muestra “Sin alertas pendientes” en gris

> Para resolver alertas: ir a `/api/alerts` o usar el botón de resolver en cada alerta.

### Navegación lateral

El menú lateral izquierdo da acceso a todas las secciones:

- **Dashboard** — Panel principal
- **Citas** — Gestión de turnos
- **Empleados** — Alta y administración de staff
- **Servicios** — Catálogo de servicios
- **Clientes** — Base de clientes
- **Inventario** — Stock y productos
- **Punto de Venta** — Ventas directas sin cita previa
- **Reportes** — Estadísticas y gráficos
- **Compartir** — Enlace de reservas públicas
- **Configuración** — Datos del negocio

---

## 3. Gestión de citas

**Ruta:** `/admin/appointments`

Esta sección permite ver, crear, editar y eliminar todas las citas de la barbería.

### Vista de la tabla

La tabla muestra todas las citas con las columnas:

- **Cliente** — Nombre del cliente
- **Empleado** — Barbero o staff asignado
- **Servicio** — Servicio a realizar
- **Fecha y hora** — Fecha programada
- **Estado** — Badge con color según el status

### Filtros y búsqueda

| Filtro | Opciones |
|--------|---------|
| Búsqueda de texto | Por nombre de cliente, barbero o servicio |
| Estado | Todos / Pendiente / Confirmada / Completada / Cancelada |
| Fecha | Selector de rango de fechas |

### Crear una nueva cita

1. Hacer clic en el botón **+ Nueva Cita** (arriba a la derecha)
2. Se abre el modal de creación con los siguientes campos:

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Cliente | Selector o "Nuevo cliente" | Sí | Puede crear un cliente nuevo directamente desde aquí (nombre + teléfono) |
| Empleado / Barbero | Selector | Sí | Lista los usuarios con rol `employee` |
| Servicio | Selector | Sí | Al seleccionar, se autocompletan duración y precio |
| Fecha | Selector de fecha | Sí | Formato YYYY-MM-DD. Fecha mínima: hoy |
| Hora | Selector de hora | Sí | Formato 24hs (HH:MM) |
| Estado inicial | Selector | Sí | Por defecto: **Pendiente** |
| Notas | Texto libre | No | Máximo 500 caracteres |

3. Revisar los datos y hacer clic en **Guardar**
4. La cita aparece inmediatamente en la tabla

### Editar una cita existente

1. Localizar la cita en la tabla
2. Hacer clic en el **menú de tres puntos** (⋮) al final de la fila
3. Seleccionar **Editar**
4. Modificar los campos necesarios
5. Hacer clic en **Guardar**

### Eliminar una cita

1. Menú (⋮) → **Eliminar**
2. Confirmar la acción en el diálogo de confirmación

> **Advertencia:** La eliminación es permanente. Si solo se quiere anular una cita, usar el cambio de estado a **Cancelada** en lugar de eliminar.

### Cambiar el estado de una cita

Los estados posibles son:

| Estado | Color | Significado |
|--------|-------|------------|
| Pendiente | Amarillo | Cita creada, no confirmada |
| Confirmada | Azul | El cliente o admin confirmó |
| Completada | Verde | Servicio realizado exitosamente |
| Cancelada | Rojo | Cita anulada (con razón opcional) |

Cambio de estado desde la tabla: menú (⋮) → seleccionar el nuevo estado.

---

## 4. Gestión de empleados

**Ruta:** `/admin/employees`

### Vista general

Muestra todos los empleados con:
- **Estadísticas:** Total empleados / Barberos / Staff / Activos / Por especialidad
- **Tabla:** Nombre, email, teléfono, especialidad, estado

### Filtros

| Filtro | Opciones |
|--------|---------|
| Búsqueda | Por nombre, email o teléfono |
| Rol/tipo | Todos / Barberos / Staff |

### Crear un nuevo empleado

1. Hacer clic en **+ Nuevo Empleado**
2. Completar el formulario:

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Nombre completo | Texto | Sí | Mínimo 1 carácter, máximo 100 |
| Email | Email | Sí | Debe ser único en el sistema |
| Teléfono | Teléfono | Sí | Formato internacional aceptado |
| Especialidad / Puesto | Selector | Sí | Ver lista de especialidades disponibles abajo |
| Porcentaje de comisión | Número (%) | Sí | 0–100%. Define qué % del precio del servicio cobra el empleado |
| Avatar | Selector | No | 15 avatares generados por DiceBear |

**Especialidades disponibles:**
- Barbero
- Estilista
- Colorista
- Manicurista
- Pedicurista
- Masajista
- Cosmetóloga/o
- Depilación
- Maquillador/a
- Recepcionista
- Cajero/a
- Vendedor/a
- Encargado/a
- Asistente
- Otro

3. Al guardar, el sistema:
   - Crea el usuario en Supabase Auth con **contraseña temporal** (formato: `Barber{código}!`)
   - Crea el perfil en la tabla `users`
   - Muestra la contraseña temporal **una única vez** — anotarla o comunicarla al empleado inmediatamente

> **Importante:** La contraseña temporal solo se muestra una vez. Si no se anota, hay que resetearla.

### Editar un empleado

Menú (⋮) → **Editar** → modificar los campos → **Guardar**.

No se puede editar el email desde aquí. Para cambiar email, se requiere gestión directa en Supabase.

### Resetear contraseña de un empleado

1. Menú (⋮) → **Resetear contraseña**
2. El sistema genera una nueva contraseña temporal
3. La contraseña se muestra **una única vez** en pantalla
4. Comunicarla al empleado para que la cambie en su primer acceso

### Eliminar un empleado

1. Menú (⋮) → **Eliminar**
2. Confirmar en el diálogo
3. El sistema elimina el usuario de Supabase Auth y su perfil

> **Advertencia:** Esta acción elimina el acceso del empleado pero **no** elimina las citas ya registradas a su nombre.

---

## 5. Gestión de servicios

**Ruta:** `/admin/services`

### Vista general

Muestra el catálogo de servicios con:
- **Estadísticas:** Total de servicios / Precio promedio / Duración promedio / Ingresos totales estimados
- **Tabla:** Nombre, descripción, precio, duración, estado

### Búsqueda

Filtro de texto libre: por nombre o descripción del servicio.

### Crear un servicio

1. Hacer clic en **+ Nuevo Servicio**
2. Completar el formulario:

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Nombre | Texto | Sí | Mínimo 2, máximo 100 caracteres |
| Descripción | Texto largo | No | Máximo 500 caracteres |
| Precio | Número | Sí | Mayor a 0; se muestra con formato moneda |
| Duración | Número (minutos) | Sí | Entero positivo; ej: 30, 45, 60 |
| Activo | Toggle | Sí | Activo = visible para reservas. Por defecto: activo |

3. Hacer clic en **Guardar**

### Editar un servicio

Menú (⋮) → **Editar** → realizar cambios → **Guardar**.

> Si se desactiva un servicio (toggle **Activo = No**), deja de aparecer en el flujo de reservas para clientes y en los selectores de nueva cita.

### Eliminar un servicio

Menú (⋮) → **Eliminar** → confirmar.

> **Precaución:** Eliminar un servicio no elimina las citas históricas que lo tienen asignado.

---

## 6. Gestión de clientes

**Ruta:** `/admin/clients`

### Vista general

Muestra la base de clientes con:
- **Estadísticas:** Total clientes / Nuevos este mes / Nuevos mes pasado / % de crecimiento
- **Tabla:** Nombre, email, teléfono, fecha de registro, estado

### Búsqueda

Filtro por: nombre, email o teléfono.

### Crear un cliente

1. Hacer clic en **+ Nuevo Cliente**
2. Completar los datos básicos: nombre, email, teléfono
3. **Guardar**

> También es posible crear un cliente directamente al crear una cita (sección 3).

### Ver detalles de un cliente

Menú (⋮) → **Ver** → se abre una vista con el historial de citas del cliente.

### Gestionar puntos de fidelidad de un cliente

Cada cliente acumula **1 punto por cada dólar** gastado en citas completadas y en ventas POS.

Para ver o ajustar los puntos:

1. En la tabla de clientes, la columna **Puntos** muestra el saldo actual con una etiqueta ámbar
2. Menú (⋮) → **Puntos** → se abre el modal de fidelidad
3. Seleccionar la acción:
   - **Agregar puntos** — para bonificar manualmente
   - **Restar puntos** — para canjear un beneficio o corregir un error
4. Ingresar la cantidad (número entero) y una descripción opcional
5. El modal muestra el saldo actual y el nuevo saldo proyectado antes de confirmar
6. Hacer clic en **Confirmar** — el ajuste se aplica de inmediato y queda registrado en el historial de transacciones del cliente

### Editar un cliente

Menú (⋮) → **Editar** → modificar datos → **Guardar**.

### Eliminar un cliente

Menú (⋮) → **Eliminar** → confirmar.

---

## 7. Inventario

**Ruta:** `/admin/inventory`

### Vista general

Gestiona el stock de productos, herramientas y suministros. Incluye:
- **Estadísticas:** Total items / Stock bajo / Agotados / Valor total del inventario
- **Tabla:** Producto, categoría, cantidad actual, stock mínimo, costo unitario, proveedor, estado

### Filtros

| Filtro | Opciones |
|--------|---------|
| Búsqueda | Por nombre del producto o proveedor |
| Categoría | Todos / Suministro / Producto / Herramienta |
| Estado de stock | Todos / Disponible / Bajo stock / Agotado |

**Definición de estados:**
- **Disponible:** cantidad > stock mínimo
- **Bajo stock:** cantidad ≤ stock mínimo (y > 0)
- **Agotado:** cantidad = 0

### Crear un ítem de inventario

1. Hacer clic en **+ Nuevo Item**
2. Completar el formulario:

| Campo | Tipo | Obligatorio | Notas |
|-------|------|------------|-------|
| Nombre del producto | Texto | Sí | Mínimo 2, máximo 100 caracteres |
| Categoría | Selector | Sí | Suministro / Producto / Herramienta |
| Cantidad | Número | Sí | Mayor o igual a 0 |
| Stock mínimo | Número | Sí | Mayor o igual a 0. Por defecto: 5 |
| Proveedor | Texto | No | Máximo 100 caracteres |
| Costo unitario | Número | No | Mayor a 0; formato moneda |

3. **Guardar**

### Editar un ítem

Menú (⋮) → **Editar** → realizar cambios → **Guardar**.

### Registrar un movimiento de stock

Cuando se recibe mercadería o se consume stock:

1. Menú (⋮) → **Registrar movimiento** (o botón dedicado en la tabla)
2. Ingresar la cantidad a sumar o restar
3. Indicar el tipo de movimiento: entrada / salida
4. **Confirmar**

La cantidad disponible se actualiza automáticamente.

### Eliminar un ítem

Menú (⋮) → **Eliminar** → confirmar.

### Productos demo predefinidos

En modo demo el sistema carga 8 ítems de ejemplo:
- Shampoo, cera para cabello, tijeras profesionales, máquina de corte, toallas, cuchillas de afeitar, gel para barba, aceite para barba

## 8. Punto de Venta (POS)

**Ruta:** `/admin/pos`

Permite registrar **ventas directas** de productos y servicios sin necesidad de crear una cita. Ideal para venta de productos en mostrador, servicios pagados en el momento o cualquier transacción rápida.

### Interfaz

La pantalla está dividida en dos paneles:

**Panel izquierdo — Catálogo:**
- Pestañas **Servicios** y **Productos** para filtrar el catálogo
- Campo de búsqueda para filtrar por nombre
- Grid de tarjetas clickeables; al hacer clic en una se agrega al carrito

**Panel derecho — Carrito:**
- Lista de ítems con controles de cantidad (+/−) y botón de eliminar
- Selector de **cliente** (opcional) — si se elige un cliente, la venta acumula puntos de fidelidad
- Si hay cliente seleccionado: muestra puntos actuales y cuántos ganará con esta venta
- Campo de **descuento** ($) aplicado sobre el subtotal
- Selector de **método de pago:** Efectivo / Tarjeta / Transferencia
- Campo de **notas** opcionales
- Resumen: subtotal, descuento, **total**
- Botón **"Cobrar $X.XX"** para registrar la venta

### Registrar una venta

1. Navegar a `/admin/pos` desde la barra lateral (icono carrito — "Punto de Venta")
2. Hacer clic en los servicios o productos del catálogo para agregarlos
3. Ajustar cantidades con los botones +/−
4. Seleccionar el cliente si lo hay (opcional)
5. Elegir el método de pago
6. Aplicar descuento si corresponde
7. Hacer clic en **"Cobrar"**
8. El sistema muestra una confirmación verde con el total cobrado
9. El carrito se limpia automáticamente para la siguiente venta

### Puntos de fidelidad en POS

Si se selecciona un cliente en la venta, el sistema asigna automáticamente **1 punto por cada dólar** del total de la venta (la misma regla que las citas).

---

## 9. Reportes

**Ruta:** `/admin/reports`

### Vista general

Panel de análisis con gráficos interactivos y métricas de rendimiento del negocio.

### Controles disponibles

| Control | Descripción |
|---------|-------------|
| Período | Tabs: Hoy / Esta semana / Este mes / Este año |
| Empleado | Filtrar todos los gráficos por un empleado específico |
| Botón Sincronizar | Fuerza una nueva consulta a la base de datos |

La pantalla muestra la **última sincronización** (timestamp).

### Gráficos disponibles

**1. Ingresos por día (gráfico de barras)**
- Eje X: Fechas del período seleccionado
- Eje Y: Monto en $ por día
- Permite identificar los días de mayor facturación

**2. Estado de citas (gráfico circular)**
- Distribución porcentual: Pendiente / Confirmada / Completada / Cancelada
- Útil para detectar tasa de cancelaciones y de no-shows

**3. Ingresos por empleado (gráfico de barras)**
- Eje X: Nombre de cada empleado
- Eje Y: Total $ generado en el período
- Permite evaluar rendimiento individual

**4. Servicios más solicitados (gráfico circular)**
- Distribución % de cada servicio en el período
- Útil para decidir qué servicios potenciar o discontinuar

**5. Tendencia de ingresos (gráfico de línea)**
- Compara el período actual vs el período anterior
- Ayuda a detectar crecimiento o caída

### Métricas principales (tarjetas)

| Métrica | Qué mide |
|---------|---------|
| Ingresos totales del período | Suma de todos los servicios completados |
| Total de citas completadas | Cantidad de atenciones realizadas |
| Total de clientes activos | Clientes que tuvieron citas en el período |
| Citas canceladas | Cantidad y % sobre el total |

---

## 10. Compartir enlace de reservas

**Ruta:** `/admin/share`

Permite generar un enlace personalizado para que los clientes reserven sin necesidad de que el administrador los cargue manualmente.

### Configurar el slug del enlace

1. Ingresar el **nombre del slug** en el campo de texto
   - Ejemplo: `mi-barberia-premium`
   - El enlace resultante será: `https://[tu-dominio]/reservar/mi-barberia-premium`
2. El cambio se guarda automáticamente

### Opciones para compartir

| Acción | Descripción |
|--------|-------------|
| Copiar enlace | Copia la URL completa al portapapeles |
| WhatsApp | Abre WhatsApp con mensaje pre-cargado con el enlace |
| Facebook | Abre el compositor de Facebook con el enlace |
| Twitter / X | Abre el compositor de Twitter con el enlace |
| Ver página | Abre el enlace de reservas en una nueva pestaña |

### Código QR

La página genera automáticamente un **código QR** de alta resolución del enlace. Opciones:
- **Descargar como PNG** — para imprimir y colocar en la barbería

---

## 11. Configuración del negocio

**Ruta:** `/admin/settings`

Organizada en 4 pestañas:

### Pestaña 1: Negocio

Datos generales de la barbería:

| Campo | Tipo | Notas |
|-------|------|-------|
| Nombre de la barbería | Texto | Se muestra en emails y página de reservas |
| Email de contacto | Email | Para notificaciones del sistema |
| Teléfono | Teléfono | Se muestra a los clientes |
| Dirección | Texto | |
| Ciudad | Texto | |
| País | Texto | |
| Sitio web | URL | Opcional |
| Descripción | Texto largo | Se muestra en la página pública de reservas |

### Pestaña 2: Horarios

Configurar los horarios de atención por día de la semana:

| Día | Configuración |
|-----|--------------|
| Lunes a Domingo | Hora de apertura / Hora de cierre / Toggle "Abierto" |

**Valores por defecto:**
- Lunes a Viernes: 09:00 — 18:00 (abierto)
- Sábado: 10:00 — 16:00 (abierto)
- Domingo: 10:00 — 14:00 (abierto)

Si un día se marca como **cerrado**, no aparecerá disponible en el flujo de reservas.

### Pestaña 3: Notificaciones

Toggles de activación/desactivación por tipo de notificación:

| Notificación | Descripción |
|-------------|-------------|
| Notificaciones por email | Habilita el envío general de emails |
| Notificaciones SMS | Habilita el envío de SMS (requiere integración externa) |
| Recordatorios de cita | Email/SMS automático antes de la cita |
| Alertas de cancelación | Notificación cuando un cliente cancela |
| Resumen diario | Email con el resumen del día |
| Reporte semanal | Email con el reporte de la semana |

### Pestaña 4: Pagos

| Campo | Tipo | Notas |
|-------|------|-------|
| Acepta efectivo | Toggle | |
| Acepta tarjeta | Toggle | |
| Acepta transferencia | Toggle | |
| Moneda | Selector | USD, ARS, EUR, etc. |
| Tasa de impuesto | Número (%) | Se aplica al cálculo de reportes |
| Fee de cancelación | Número ($) | Monto que se cobra al cancelar |

### Guardar cambios

Hacer clic en **Guardar configuración** al final de la pestaña activa. El sistema muestra un mensaje de confirmación.

---

## 12. Preguntas frecuentes

**¿Por qué veo datos ficticios al entrar?**  
El sistema está en **modo demo**. Esto ocurre cuando las variables de entorno de Supabase no están configuradas. Los datos son de prueba y no se guardan.

**¿Puedo tener múltiples administradores?**  
Sí. Crear un usuario desde `/auth/register` y asignarle el rol `admin` en la tabla `users` de Supabase directamente.

**¿Qué pasa si un empleado olvida su contraseña?**  
Ir a `/admin/employees` → menú del empleado → **Resetear contraseña**. Se genera una contraseña temporal que deberá compartirse con el empleado.

**¿Las citas eliminadas se pueden recuperar?**  
No. La eliminación es permanente. Se recomienda **cancelar** las citas en lugar de eliminarlas para mantener el historial.

**¿Los cambios en configuración se aplican de inmediato?**  
Sí, en la mayoría de los casos. Los cambios de horario pueden tardar en reflejarse en el flujo de reservas si hay caché activa.
