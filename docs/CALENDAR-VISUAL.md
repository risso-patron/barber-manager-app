# 📅 Calendar Visual - Documentación

## Descripción

El Calendar Visual es un componente interactivo que muestra todas las citas de la barbería en un calendario visual, permitiendo una mejor gestión y visualización de las reservas.

## Características

### ✨ Funcionalidades principales:

1. **Múltiples vistas:**
   - 📆 **Vista Mensual** - Visualiza todo el mes
   - 📅 **Vista Semanal** - Enfoque semanal detallado
   - 📋 **Vista Diaria** - Detalles del día específico
   - 📑 **Vista Agenda** - Lista ordenada de citas

2. **Interactividad:**
   - Click en cualquier cita para ver detalles completos
   - Navegación fluida entre fechas
   - Cambio rápido entre vistas
   - Modal con información detallada de cada cita

3. **Información visual:**
   - Códigos de color por estado:
     - 🟡 **Amarillo** - Pendiente
     - 🔵 **Azul** - Confirmada
     - 🟢 **Verde** - Completada
     - 🔴 **Rojo** - Cancelada

4. **Gestión de estados:**
   - Cambiar estado de cita directamente desde el modal
   - Actualización en tiempo real
   - Confirmación visual con toast notifications

## Tecnologías utilizadas

- **react-big-calendar** (v1.19.4) - Librería de calendario
- **date-fns** - Manejo de fechas y localización en español
- **Supabase** - Consultas a la base de datos
- **React Hooks** - Estado y efectos

## Estructura de archivos

```
app/admin/components/views/
├── calendar-view.tsx    # Componente principal del calendario
└── calendar.css         # Estilos personalizados
```

## Uso

### En el Dashboard Admin:

1. Navega a la pestaña **"Calendario"** 📅
2. El calendario carga automáticamente todas las citas
3. Usa los controles para:
   - **Anterior/Siguiente** - Navegar entre períodos
   - **Hoy** - Volver a la fecha actual
   - **Mes/Semana/Día/Agenda** - Cambiar vista

### Ver detalles de una cita:

1. **Click** en cualquier evento del calendario
2. Se abre un modal con:
   - Información del cliente (nombre, email)
   - Barbero asignado
   - Servicio (nombre, precio, duración)
   - Fecha y hora
   - Notas (si las hay)
   - Estado actual

### Cambiar estado de cita:

1. Abre el modal de la cita
2. En la sección "Estado", click en el botón deseado:
   - **Pendiente** 🟡
   - **Confirmada** 🔵
   - **Completada** 🟢
   - **Cancelada** 🔴
3. El estado se actualiza automáticamente

## Consulta a la base de datos

El calendario hace una consulta JOIN para obtener datos relacionados:

```typescript
const { data } = await supabase
  .from('appointments')
  .select(`
    *,
    clients:client_id (name, email),
    barbers:barber_id (name),
    services:service_id (name, price, duration)
  `)
  .order('appointment_date', { ascending: true })
  .order('appointment_time', { ascending: true })
```

## Localización

El calendario está completamente traducido al español:
- Nombres de meses y días
- Mensajes de interfaz
- Formato de fechas

## Estilos personalizados

Los estilos en `calendar.css` incluyen:
- Tema personalizado con colores del dashboard
- Headers mejorados
- Eventos con bordes redondeados
- Hover effects
- Scrollbar personalizado
- Responsive design

## Rendimiento

- **Memoización** de eventos con `useMemo`
- **Callbacks optimizados** con `useCallback`
- Actualización eficiente del estado
- Carga única de datos al montar

## Próximas mejoras sugeridas

- [ ] Drag & drop para mover citas
- [ ] Click en espacio vacío para crear nueva cita
- [ ] Filtro por barbero
- [ ] Filtro por estado
- [ ] Vista de recursos (múltiples barberos)
- [ ] Exportar calendario a PDF
- [ ] Sincronización con Google Calendar

## Troubleshooting

### El calendario no carga:
- Verifica la conexión a Supabase
- Revisa las políticas RLS de la tabla `appointments`
- Comprueba la consola del navegador

### Los eventos no aparecen:
- Confirma que hay citas en la base de datos
- Verifica que las fechas sean válidas
- Revisa el formato de `appointment_date` y `appointment_time`

### Errores de formato de fecha:
- Asegúrate que `appointment_date` sea tipo DATE
- `appointment_time` debe ser tipo TIME
- El componente espera formato ISO

## Integración

El calendario está integrado en:
- `/admin` - Dashboard de administrador
- Pestaña "Calendario" en la navegación
- Importado en `app/admin/page.tsx`
- Registrado en `tabs-navigation.tsx`

---

**Implementado:** 2 de noviembre de 2025
**Versión:** 1.0.0
**Estado:** ✅ Completado
