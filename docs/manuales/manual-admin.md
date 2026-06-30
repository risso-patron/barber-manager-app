# Manual del Administrador

**Ornō — v0.1.0**
**Perfil:** Administrador (dueño o gestor de la barbería)
**Ruta de acceso:** `/admin/*`

> Auditado y corregido contra el código real el 2026-06-30. Esta revisión reemplaza afirmaciones desactualizadas de versiones anteriores del manual (especialidades de empleado, flujo de inventario, contraseñas temporales) y agrega dos secciones que faltaban por completo: **Facturación** y **Configuración → Integraciones**, ambas en estado incompleto — ver §12 y §13.

---

## Tabla de contenidos

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Panel principal (Dashboard)](#2-panel-principal-dashboard)
3. [Gestión de citas](#3-gestión-de-citas)
4. [Gestión de empleados](#4-gestión-de-empleados)
5. [Gestión de servicios](#5-gestión-de-servicios)
6. [Gestión de clientes](#6-gestión-de-clientes)
7. [Ficha de cliente: notas, mensajes y regalos](#7-ficha-de-cliente-notas-mensajes-y-regalos)
8. [Inventario](#8-inventario)
9. [Punto de Venta (POS)](#9-punto-de-venta-pos)
10. [Reportes](#10-reportes)
11. [Compartir enlace de reservas](#11-compartir-enlace-de-reservas)
12. [Facturación — funcionalidad incompleta](#12-facturación--funcionalidad-incompleta)
13. [Integraciones — funcionalidad parcial](#13-integraciones--funcionalidad-parcial)
14. [Configuración del negocio](#14-configuración-del-negocio)
15. [Preguntas frecuentes](#15-preguntas-frecuentes)

---

## 1. Acceso al sistema

### Iniciar sesión

1. Ir a `/auth/login`
2. Ingresar **email** y **contraseña** del administrador
3. Clic en **Iniciar sesión**
4. El sistema detecta el rol `admin` y redirige a `/admin`

### Requisitos de la contraseña

- Mínimo 8 caracteres, máximo 50
- Al menos 1 mayúscula, 1 minúscula y 1 número

### Olvidé mi contraseña

1. En login, clic en **¿Olvidaste tu contraseña?**
2. Ingresar el email → **Enviar instrucciones**
3. Abrir el enlace recibido por correo y definir la nueva contraseña

### Cerrar sesión

Botón **Cerrar sesión** en la parte inferior de la barra lateral.

> Nota técnica: el layout de `/admin/*` acepta sesiones con rol `admin` **o `manager`**. `manager` no es un rol oficial del sistema (no tiene cuenta demo ni vía de registro — ver [manual-sistema.md §6](manual-sistema.md#6-autenticación-y-roles)), pero si alguna vez se asigna manualmente en la base de datos, varias páginas internas (Citas, Clientes, Inventario, POS) también lo aceptan, mientras que otras (Empleados, Servicios, Reportes, Configuración, Compartir, Facturación) están restringidas únicamente a `admin`. Esta inconsistencia es deuda técnica conocida, no un control de acceso diseñado a propósito.

---

## 2. Panel principal (Dashboard)

**Ruta:** `/admin`

### Tarjetas de métricas (4)

| Tarjeta | Qué muestra |
|---|---|
| Ingresos del mes | Suma de servicios completados en el mes en curso |
| Citas hoy | Cantidad de citas programadas para hoy |
| Clientes | Total de clientes, con variación "+X este mes" |
| Empleados activos | Cantidad de empleados con estado activo |

### Accesos rápidos a módulos

Grid de tarjetas con acceso directo a Citas (con contador de pendientes), Empleados (con contador de activos), Servicios, Inventario, Punto de Venta, Reportes y Configuración.

### Actividad reciente

Lista de las últimas 3 citas registradas, con formato `{estado} · {cliente} · {servicio} · {fecha} {hora}`.

### Alertas

- Alertas de calificación baja (1★ con franja roja, 2★ con franja ámbar): estrellas, cliente, reseña, empleado involucrado, fecha
- Contador de no-show por cliente
- Aviso de citas pendientes de confirmar

> **Modo demo:** sin Supabase configurado, las tarjetas muestran datos ficticios fijos.

### Navegación lateral

Orden real del menú (de arriba a abajo): **Dashboard → Citas → Empleados → Servicios → Inventario → Punto de Venta → Clientes → Reportes → Facturación → Integraciones**, y al pie, separado por una línea divisoria: **Configuración** y **Cerrar sesión**.

> ⚠️ **"Compartir" no está en el menú lateral.** La página existe y es funcional (`/admin/share`), pero solo se accede escribiendo la URL directamente — ver §11.

---

## 3. Gestión de citas

**Ruta:** `/admin/appointments` — acceso: `admin`, `manager`.

### Vista de tabla y filtros

| Filtro | Opciones |
|---|---|
| Búsqueda de texto | Por cliente, empleado o servicio |
| Estado | Todos / Pendiente / Confirmada / Completada / Cancelada |
| Fecha | Selector de fecha puntual |
| Empleado | Se puede llegar pre-filtrado desde "Ver Agenda" de un empleado |

Dos modos de vista: **lista** (tabla) y **semana** (grilla de 7 días).

### Crear una cita

1. **+ Nueva Cita** → modal con: Cliente (selector o alta rápida), Empleado, Servicio (autocompleta duración y precio), Fecha, Hora, Estado inicial (por defecto Pendiente), Notas (opcional, máx. 500 caracteres)
2. **Guardar**

### Cambiar el estado de una cita

Las transiciones disponibles dependen del estado actual, desde el menú (⋮) de cada fila:

| Estado actual | Acciones disponibles |
|---|---|
| Pendiente | ✅ Confirmar · ❌ Cancelar |
| Confirmada | ✅ Marcar como completada · 💳 Cobrar en POS · ⏰ No se presentó · ❌ Cancelar |
| Completada | 💳 Cobrar en POS |
| Cancelada / No-show | Solo Editar o Eliminar |

> **Consejo:** usar **No-show** en vez de Cancelar cuando el cliente simplemente no aparece — distingue ausencias de cancelaciones voluntarias en los reportes.

### Eliminar una cita

Menú (⋮) → **Eliminar** → confirmar. **La eliminación es permanente** — para anular sin perder el historial, usar el cambio de estado a Cancelada.

### Ir al POS desde una cita

Menú (⋮) → **Cobrar en POS** (disponible en citas confirmadas o completadas) abre el Punto de Venta con cliente y servicio pre-cargados.

### Paginación

25 citas por página, con **Anterior / Siguiente** e indicador "X–Y de N". Cambiar cualquier filtro vuelve la tabla a la página 1.

---

## 4. Gestión de empleados

**Ruta:** `/admin/employees` — acceso: solo `admin`.

### Vista general

Estadísticas (Total empleados / Barberos / Staff) + grilla de tarjetas (1 columna en mobile, 3 en desktop) con avatar, nombre, especialidad, email, teléfono y comisión (si está configurada).

### Filtros

Búsqueda por nombre/email/teléfono + filtro por rol (Todos / Barberos / Staff).

### Crear un empleado

**+ Nuevo Empleado** abre un formulario con estos campos exactos:

| Campo | Tipo | Obligatorio | Notas |
|---|---|:---:|---|
| Nombre completo | Texto | Sí | |
| Email | Email | Sí | |
| Teléfono | Teléfono | Sí | |
| Especialidad / Puesto | Selector | Sí | Solo 4 opciones reales — ver tabla abajo |
| Comisión | Número (%) | No | 0–100%, sobre el precio del servicio. Por defecto 0 (sin comisión) |
| Avatar | Selector visual | No | Grilla de **15 avatares prediseñados** (DiceBear `avataaars`), no se puede subir uno propio ni pegar una URL |

**Especialidades reales (solo 4 — corrige listas anteriores con 15 opciones, que no existen en el código):**

| Especialidad | Rol interno asignado | Qué ve ese empleado |
|---|---|---|
| Barbero / Estilista | `employee` | Su agenda, citas del día, control horario y sus estadísticas |
| Recepcionista | `employee` | Agenda completa, gestión de clientes y citas |
| Cajero/a | `employee` | Agenda completa e inventario de productos |
| Gerente | `employee` | Acceso completo: agenda, clientes, inventario y estadísticas |

Las 4 opciones asignan el mismo rol de sistema (`employee`); la especialidad es solo una etiqueta descriptiva, **no cambia los permisos reales de acceso a rutas** (esos los controla `useRequireAuth`, no este campo).

Al guardar, el sistema crea el usuario en Supabase Auth con una contraseña temporal con formato `Barber` + 8 caracteres aleatorios + `!` (ej. `Barberx7k2p9qz!`), la muestra **una única vez** en pantalla, y crea el perfil en la tabla `users`. En modo demo, la contraseña mostrada es siempre el valor fijo `demo-1234` (no se genera ninguna real).

> **Importante:** anotar o comunicar la contraseña temporal de inmediato — no se vuelve a mostrar.

### Editar un empleado

Menú (⋮) → **Editar** → modificar campos → **Guardar**. El email no es editable desde acá.

### Resetear contraseña

Menú (⋮) → **Resetear contraseña** → se genera una nueva con el mismo formato `Barber{aleatorio}!` y se muestra una única vez.

### Eliminar un empleado

Menú (⋮) → **Eliminar** → confirmar. Elimina el usuario de Supabase Auth y su perfil, pero **no** borra las citas ya registradas a su nombre.

---

## 5. Gestión de servicios

**Ruta:** `/admin/services` — acceso: solo `admin`.

Estadísticas (Total / Precio promedio / Duración promedio / Valor total) + grilla de tarjetas con nombre, descripción, precio y duración.

### Crear / editar un servicio

| Campo | Tipo | Obligatorio |
|---|---|:---:|
| Nombre | Texto | Sí |
| Descripción | Texto largo | No |
| Precio | Número | Sí |
| Duración (minutos) | Número | Sí |

Menú (⋮) → Editar/Eliminar. Eliminar un servicio no borra las citas históricas que lo tienen asignado.

---

## 6. Gestión de clientes

**Ruta:** `/admin/clients` — acceso: `admin`, `manager`.

### Vista general

4 tarjetas (Total / Nuevos este mes / Activos / Crecimiento %) + lista con avatar, nombre, badge de puntos de fidelidad, badge de no-show (si tiene), email, teléfono y antigüedad.

### Crear un cliente

**+ Nuevo Cliente** → Nombre (obligatorio), Email y Teléfono (opcionales) → **Guardar**. También se puede crear un cliente al vuelo desde el alta de una cita (§3).

### Gestionar puntos de fidelidad

El cliente acumula 1 punto por cada dólar gastado (citas completadas + ventas POS).

Menú (⋮) → **Puntos** → modal con acción **Agregar** o **Restar**, cantidad, descripción opcional, y vista previa del saldo proyectado antes de confirmar.

### Editar / eliminar

Menú (⋮) → Editar o Eliminar → confirmar.

### Paginación

25 clientes por página. Cambiar el filtro de búsqueda reinicia a la página 1.

---

## 7. Ficha de cliente: notas, mensajes y regalos

**Ruta:** `/admin/clients/[id]` — acceso: `admin`, `manager`. Se llega desde **Ver perfil** en el menú (⋮) de la lista de clientes.

> Esta página no estaba documentada en versiones anteriores del manual. Tiene funcionalidad real, separada de la edición básica de §6.

### Cabecera y métricas

Datos de contacto, antigüedad, badge de no-show, y 4 tarjetas: total de citas, total gastado, próximas citas, servicio favorito.

### Historial de citas

Lista (hasta 20 más recientes) con servicio, estado, fecha, hora, barbero y precio.

### Notas internas del administrador

Cuadro de texto libre (ej. preferencias del cliente, cumpleaños) con botón **Guardar**. Se persiste en la columna `admin_notes` de la tabla `users` — **requiere Supabase configurado**, no funciona en modo demo.

### Enviar mensaje

Campo de asunto (opcional) + mensaje (obligatorio) → **Enviar**. Debajo se listan los últimos 20 mensajes enviados, con estado "Leído"/no leído.

### Enviar regalo / beneficio

Selector de tipo: **% Descuento**, **$ Descuento fijo**, **Servicio gratis** o **Producto gratis**, con título obligatorio, descripción opcional y el valor o nombre correspondiente según el tipo. Al enviarlo se genera un código de canje y queda listado abajo (últimos 20), con su estado "Canjeado" o pendiente.

> No se verificó en esta auditoría cómo ni dónde el cliente ve o canjea estos mensajes/regalos desde su propio panel — queda como punto a confirmar en una futura revisión del manual del cliente.

---

## 8. Inventario

**Ruta:** `/admin/inventory` — acceso: `admin`, `manager`.

### Vista general

4 tarjetas (Total artículos / Stock bajo / Agotados / Valor total) + tabla con nombre, categoría, cantidad, stock mínimo, costo, precio de venta, margen, proveedor y estado.

### Filtros

| Filtro | Opciones |
|---|---|
| Búsqueda | Por nombre o proveedor |
| Categoría | Todas / Productos / Herramientas / Suministros |
| Estado | Todos / Disponible / Stock bajo / Agotado |

**Definición de estados:** Disponible = cantidad ≥ stock mínimo · Bajo = 0 < cantidad < stock mínimo · Agotado = cantidad = 0.

### Crear / editar un ítem

| Campo | Tipo | Obligatorio |
|---|---|:---:|
| Nombre | Texto | Sí |
| Categoría | Selector (producto/herramienta/suministro) | Sí |
| Cantidad | Número | Sí |
| Stock mínimo | Número | Sí |
| Costo unitario | Número | No |
| Precio de venta | Número | No |
| SKU | Texto | No |
| Proveedor | Texto | No |

### Reabastecer stock

> ⚠️ Corrige una afirmación anterior: **no existe un formulario para registrar movimientos de entrada/salida con cantidad personalizada.** Lo que hay es un botón **Reabastecer**, visible solo en ítems con estado Bajo o Agotado, que al hacer clic **suma automáticamente el doble del stock mínimo configurado** a la cantidad actual y actualiza la fecha de "último reabastecimiento". No se puede elegir cuánto sumar.

### Eliminar un ítem

Menú (⋮) → Eliminar → confirmar.

### Paginación

20 ítems por página.

---

## 9. Punto de Venta (POS)

**Ruta:** `/admin/pos` — acceso: `admin`, `manager`.

Permite registrar ventas directas de productos y servicios sin cita previa.

### Catálogo (panel izquierdo)

Pestañas Servicios/Productos, buscador, grilla de tarjetas clickeables que agregan al carrito.

### Carrito y cobro (panel derecho)

- Ítems con controles de cantidad (+/−) y eliminar
- Cliente (opcional) — al seleccionarlo se muestran sus puntos actuales y la proyección de puntos a ganar (o a descontar, si se canjean)
- Canje de puntos: checkbox visible solo si el cliente tiene puntos y el carrito no está vacío. Tasa: **$0.10 por punto**
- Descuento ($) sobre el subtotal
- Propina ($) — se suma al total y se registra por separado, **no genera puntos de fidelidad**
- Método de pago: Efectivo / Tarjeta / Transferencia
- Notas opcionales
- Resumen: Subtotal, Descuento, Puntos canjeados, Total, Propina
- Botón **"Cobrar $X"** — al confirmar muestra "✓ Venta registrada correctamente" y limpia el carrito

> Si se llega desde una cita vía "Cobrar en POS" (§3), el cliente y el servicio quedan pre-cargados automáticamente. La venta se envía al endpoint `/api/pos`.

---

## 10. Reportes

**Ruta:** `/admin/reports` — acceso: solo `admin`.

### Controles

Botones de período (Hoy / Semana / Mes / Año), filtro por empleado, y exportación: **Excel** (librería `xlsx`) y **PDF** (`jspdf` + `jspdf-autotable`) — ambos exportan los datos ya filtrados.

### Métricas principales (4 tarjetas)

Ingresos totales (con ticket promedio) · Citas completadas (con tasa de completitud) · Clientes únicos (con tasa de retención) · Duración promedio.

### Gráficos

- **Ingresos diarios** (barras, últimos 14 días)
- **Distribución de servicios** (torta, por ingresos)
- **Tendencia de ingresos** (línea, período actual vs. anterior)

### Comparativos

Variación porcentual de ingresos y de cantidad de citas vs. el período anterior.

### Rankings

- **Servicios más rentables** — por ingresos generados
- **Rendimiento por empleado** — por ingresos y ticket promedio

### Liquidación de comisiones

Tabla solo para empleados con comisión configurada (§4): ingreso bruto, % de comisión, monto a liquidar por empleado, con fila de totales. Esta es la única pantalla del sistema donde se ve el cálculo de comisiones consolidado.

### Calificaciones

Promedio general (5 estrellas), distribución por puntaje, y promedio por barbero.

---

## 11. Compartir enlace de reservas

**Ruta:** `/admin/share` — acceso: solo `admin`. **No tiene entrada en el menú lateral** (ver §2) — se accede escribiendo la URL directamente.

### Configurar el slug

Campo de texto para el slug (ej. `mi-barberia`); el enlace resultante es `/book/[slug]`. El cambio se guarda automáticamente.

### Compartir

Copiar enlace, WhatsApp, Facebook, Twitter/X, o **Ver Página de Reservas** (abre el enlace en una pestaña nueva).

### Código QR

Se genera automáticamente (300×300) con botón **Descargar QR Code** (PNG) para imprimir.

---

## 12. Facturación — funcionalidad incompleta

**Ruta:** `/admin/billing` — acceso: solo `admin`.

🔴 **Esta sección es un stub.** Existe en el menú lateral y tiene una interfaz completa, pero **no tiene ninguna conexión real**: no llama a ninguna API, no usa Supabase, y todos sus datos (plan actual, próximo cobro, tarjetas guardadas, facturas) son valores fijos cargados en el código (`useState` con datos de ejemplo). Cualquier cambio que hagas (cambiar tarjeta primaria, eliminar una tarjeta) se pierde al recargar la página, y los siguientes botones **no hacen nada**: "Cambiar plan", "Agregar método" y "Descargar" (factura).

### Qué muestra (todo de ejemplo, no real)

- 4 tarjetas: Plan actual (Pro, $49/mes), Próximo cobro, Método de pago, Facturas emitidas
- Comparador de 3 planes (Starter / Pro / Enterprise)
- Lista de métodos de pago de ejemplo (Visa, Mastercard)
- Historial de 5 facturas de ejemplo, todas marcadas "Pagada"

**Recomendación pendiente:** decidir el destino de esta pantalla antes de cualquier salida a producción — completarla con un proveedor de pagos real (ninguno está integrado hoy, ver `docs/manuales/manual-sistema.md §15`), ocultarla del menú hasta que esté lista, o marcarla explícitamente como "Próximamente" en la UI para no confundir a un administrador real.

---

## 13. Integraciones — funcionalidad parcial

**Ruta:** `/admin/integrations` — acceso: en el código actual **no tiene `useRequireAuth` configurado explícitamente**; cualquier sesión válida puede llegar a la URL aunque esté fuera del menú esperado para otros roles. Debería restringirse a `admin` igual que el resto del panel.

🟡 **Esta sección es parcial.** La interfaz es interactiva (se puede "conectar" o "configurar" cada integración) pero **ninguna conexión es real**: no hay OAuth, no se guardan API keys, no hay llamadas a los proveedores listados, y el estado de cada integración (conectada/disponible/desconectada) es local — se pierde al recargar la página.

### Integraciones listadas (12, todas simuladas)

| Categoría | Integraciones |
|---|---|
| Comunicación | WhatsApp Business, Google Calendar, Slack, Twilio |
| Pagos | Stripe, Mercado Pago |
| Automatización | OpenAI, Zapier |
| Marketing | Mailchimp, Instagram Business, HubSpot |
| Analítica | Google Analytics |

El registro de "eventos recientes" que se ve en esta pantalla también es de ejemplo (datos fijos de WhatsApp y Stripe), no actividad real.

> Nota: aunque esta pantalla no tiene integraciones reales, **WhatsApp (Twilio) y email (Resend) sí están realmente integrados en el sistema** a través de la cola de notificaciones del backend (ver `docs/manuales/manual-sistema.md`) — son dos cosas distintas. Esta pantalla de Integraciones no controla ni refleja esa integración real.

**Recomendación pendiente:** restringir el acceso a `admin`, y luego decidir si esta pantalla se conecta a proveedores reales (Stripe para pagos, Google Calendar para sincronización) o se retira hasta tener ese trabajo planificado.

---

## 14. Configuración del negocio

**Ruta:** `/admin/settings` — acceso: solo `admin`.

### Pestaña Negocio

Nombre, email, teléfono, sitio web, dirección, ciudad, país, descripción.

### Pestaña Horarios

Por cada día de la semana: toggle Abierto/Cerrado + hora de apertura y cierre.

### Pestaña Notificaciones

Canales: Email, SMS. Tipos: recordatorios de cita (24h antes), alertas de cancelación, resumen diario, reporte semanal.

### Pestaña Pagos

Métodos aceptados (Efectivo/Tarjeta/Transferencia — toggles), moneda (USD/EUR/MXN/COP/ARS), tasa de impuesto (%), fee de cancelación ($).

### Guardar

Botón **Guardar Cambios** arriba a la derecha. Muestra confirmación verde al guardar o error en rojo si falla. **En modo demo, el guardado es solo visual — no persiste.**

---

## 15. Preguntas frecuentes

**¿Por qué veo datos ficticios al entrar?**
El sistema está en modo demo (Supabase no configurado). Los datos no se guardan.

**¿Puedo tener más de un administrador?**
Sí, asignando el rol `admin` a un usuario en la tabla `users` de Supabase.

**¿Las especialidades de empleado cambian lo que puede ver cada uno?**
No directamente. La especialidad es una etiqueta descriptiva; el control de acceso real depende del rol de sistema (`employee`/`admin`), no del texto de la especialidad.

**¿Las citas eliminadas se pueden recuperar?**
No, es permanente. Usar "Cancelar" para conservar el historial.

**¿Facturación e Integraciones realmente cobran o conectan algo?**
No. Ambas son interfaces de demostración sin backend real — ver §12 y §13.

**¿Por qué no encuentro "Compartir" en el menú?**
No está enlazado en la barra lateral por una omisión del código, no por diseño. La URL `/admin/share` funciona igual — ver §11.
