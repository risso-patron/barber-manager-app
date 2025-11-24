# 🤖 PROMPT DE TRASPASO - Barber Manager App

## 📋 CONTEXTO DEL PROYECTO

Estás trabajando en **Barber Manager App**, una aplicación de gestión para barberías construida con:
- **Frontend**: Next.js 15.2.4 + TypeScript + React
- **Backend**: Supabase (PostgreSQL)
- **Emails**: Resend (configurado en modo desarrollo)
- **Estilos**: Tailwind CSS + estilos inline
- **Estado**: React hooks (useState, useEffect)

**Usuario**: Luis (luisrissopa@gmail.com) - Desarrollador del proyecto
**Repositorio**: barber-manager-app (GitHub: Luisitorisso/barber-manager-app)
**Branch actual**: master
**Branch por defecto**: main

---

## 🎯 ESTADO ACTUAL DEL PROYECTO

### ✅ Funcionalidades Completadas (Últimas Sesiones)

#### 1. **Sistema de Edición de Citas** (Commits recientes)
- **Admin Dashboard**: Modal completo para editar citas
  - Archivo: `app/admin/components/edit-appointment-modal.tsx` (370 líneas)
  - Permite editar: barbero, servicio, fecha, hora, estado, notas
  - Botón "✏️ Editar" en tabla de citas (`appointments-view.tsx`)
  - Integrado en `app/admin/page.tsx`

- **Cliente Dashboard**: Modal de autogestión de citas
  - Archivo: `app/client/page.tsx` (modificado)
  - Cliente puede editar: servicio, barbero, fecha, hora, notas
  - Restricción: Solo citas confirmadas/pendientes (no canceladas/completadas)
  - Botón "✏️ Editar Cita" junto a "🗑️ Cancelar Cita"

#### 2. **Sistema de Emails con Resend** (Último commit)
- **Modo Desarrollo**: Todos los emails van a `luisrissopa@gmail.com`
  - Variable: `NODE_ENV=development`
  - Asunto incluye destinatario original: `[DEV - Para: cliente@email.com]`
- **Archivo**: `app/api/send-email/route.ts`
- **Tipos de email**: 
  - `appointment-confirmation`: Nueva cita creada
  - `appointment-confirmed`: Cita confirmada por admin
  - `appointment-cancelled`: Cita cancelada
  - `appointment-completed`: Cita completada
- **Solución implementada**: Error 403 de Resend resuelto con modo desarrollo

#### 3. **Migración Employee → Barber**
- Tipos actualizados: `'barber'` en lugar de `'employee'`
- Rutas: `/barber` en lugar de `/employee`
- Carpeta renombrada: `app/barber/` (antes `app/employee/`)
- Base de datos: Campo `employee_position` con valores: `'barbero'`, `'dueno'`, `'recepcionista'`

#### 4. **Terminología Española**
- "Secretaria" → "Asistente" (completado)
- "Recepcionista" → "Asistente" (completado)
- Componente: `edit-employee-modal.tsx` (restaurado de commit 73e3b11)

---

## 🗂️ ESTRUCTURA ACTUAL DEL PROYECTO

### Archivos Clave Recién Modificados:

```
app/
├── admin/
│   ├── page.tsx                          # Dashboard admin (integra todos los modales)
│   └── components/
│       ├── edit-appointment-modal.tsx    # NUEVO - Modal edición citas (admin)
│       ├── employee-management-modal.tsx # Gestión de barberos/asistentes
│       ├── edit-employee-modal.tsx       # Editar perfiles de empleados
│       └── views/
│           └── appointments-view.tsx     # Tabla citas con botón editar
│
├── client/
│   └── page.tsx                          # Dashboard cliente (con edición de citas)
│
├── api/
│   └── send-email/
│       └── route.ts                      # API emails con modo desarrollo
│
├── barber/                               # (Renombrado de employee/)
│   └── page.tsx                          # Dashboard barbero
│
└── ...

docs/
└── EMAIL-SETUP.md                        # Documentación emails actualizada

.env.example                               # Variables de entorno actualizadas
```

---

## 🔧 CONFIGURACIÓN DE ENTORNO

### Variables Requeridas (.env.local):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_supabase

# Resend (Emails)
RESEND_API_KEY=re_tu_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
NODE_ENV=development  # Modo desarrollo = emails a luisrissopa@gmail.com
```

### Base de Datos (Supabase):
- **Tablas principales**: `users`, `appointments`, `services`, `inventory`
- **Script ejecutado**: `05-add-employee-position.sql`
- **Usuario admin**: luisrissopa@gmail.com (role='admin', employee_position='dueno')
- **RLS**: Políticas configuradas para cada rol

---

## 📊 BASE DE DATOS - ESQUEMA IMPORTANTE

### Tabla `appointments`:
```sql
- id (uuid)
- client_id (uuid) → FK a users
- barber_id (uuid) → FK a users
- service_id (uuid) → FK a services
- appointment_date (date)
- appointment_time (time)
- status (text): 'pending', 'confirmed', 'completed', 'cancelled'
- notes (text, nullable)
- created_at (timestamp)
```

### Tabla `users`:
```sql
- id (uuid)
- email (text)
- name (text)
- phone (text)
- role (user_role): 'admin', 'barber', 'client'
- employee_position (employee_position): 'barbero', 'dueno', 'recepcionista', NULL
- is_active (boolean)
- created_at (timestamp)
```

### Tabla `services`:
```sql
- id (uuid)
- name (text)
- price (numeric)
- duration (integer) # en minutos
- is_active (boolean)
```

---

## 🐛 PROBLEMAS CONOCIDOS Y SOLUCIONES

### 1. Error 403 de Resend
- **Problema**: "You can only send testing emails to your own email address"
- **Solución**: Implementado modo desarrollo (emails a luisrissopa@gmail.com)
- **Producción**: Requiere dominio verificado en Resend

### 2. Error de compilación en employee-management-modal.tsx
- **Problema**: Syntax error en commit 7136464
- **Solución**: Restaurado desde commit 73e3b11
- **Prevención**: Cache de Next.js (.next/) puede requerir limpieza

### 3. Database schema mismatch
- **Problema**: Columna `employee_position` faltante
- **Solución**: Ejecutar script en Supabase SQL Editor (no solo commit)
- **Aprendizaje**: Verificar schema después de cada migración

---

## 🎨 PATRONES DE CÓDIGO ESTABLECIDOS

### 1. Modales:
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  data?: any // datos específicos del modal
}

// Uso de estilos inline (no Tailwind en modales)
// Gradientes púrpura para acciones principales
// Botones con emojis: ✏️ (editar), 🗑️ (eliminar), ✓ (confirmar)
```

### 2. Estados de Modales (admin/page.tsx):
```typescript
const [showEditModal, setShowEditModal] = useState(false)
const [selectedItem, setSelectedItem] = useState<any>(null)

const handleEdit = (item: any) => {
  setSelectedItem(item)
  setShowEditModal(true)
}
```

### 3. API Calls con Supabase:
```typescript
const { data, error } = await supabase
  .from('tabla')
  .select('columnas')
  .eq('filtro', valor)

if (!error && data) {
  // Éxito
  toast.success('Mensaje de éxito')
} else {
  // Error
  toast.error('Mensaje de error')
  console.error('Error detallado:', error)
}
```

---

## 📝 COMMITS RECIENTES (Últimos 3)

1. **82071cf** - `fix: Implementar modo desarrollo para emails - Soluciona error 403 de Resend`
   - Archivos: `app/api/send-email/route.ts`, `docs/EMAIL-SETUP.md`

2. **c432b57** - `feat: Permitir a clientes editar servicio y notas en citas - Mayor flexibilidad de autogestión`
   - Archivos: `app/client/page.tsx`

3. **fd7d84a** - `feat: Agregar funcionalidad de edición de citas - Admin y Cliente pueden cambiar barbero, fecha y hora`
   - Archivos: `app/admin/components/edit-appointment-modal.tsx`, `app/admin/components/views/appointments-view.tsx`, `app/admin/page.tsx`, `app/client/page.tsx`

---

## 🚀 PRÓXIMAS TAREAS SUGERIDAS

### Prioridad Alta:
1. **Verificar funcionamiento de emails** en desarrollo
   - Crear una cita y confirmar que llegue email a luisrissopa@gmail.com
   
2. **Probar edición de citas** (admin y cliente)
   - Verificar que todos los campos se actualicen correctamente
   - Confirmar que toast notifications funcionen

### Prioridad Media:
3. **Mejorar validaciones** en modales de edición
   - Validar que la fecha no sea en el pasado
   - Validar que la hora sea dentro del horario laboral
   - Prevenir reservas duplicadas

4. **Dashboard de barbero** (`app/barber/page.tsx`)
   - Agregar funcionalidad para ver sus propias citas
   - Permitir marcar citas como completadas

### Prioridad Baja:
5. **Refactorizar estilos** a CSS modules
   - Reducir warnings de "CSS inline styles"
   - Crear archivos .module.css para componentes

6. **Tests unitarios**
   - Componentes de modales
   - API routes
   - Funciones de utilidad

---

## 💡 INFORMACIÓN IMPORTANTE PARA CONTINUAR

### Comandos Útiles:
```bash
# Desarrollo
npm run dev

# Limpiar cache si hay errores
rmdir /S /Q .next

# Git
git status
git add -A
git commit -m "mensaje en español"
git push origin master

# Verificar errores
# En VS Code: Problems panel (Ctrl+Shift+M)
```

### Linting:
- **Warnings CSS inline**: Ignorables (patrón establecido del proyecto)
- **Errores TypeScript**: Deben resolverse antes de commit
- **Next.js compilation**: Debe ser exitosa

### Estilo de Commits:
- **feat:** Nueva funcionalidad
- **fix:** Corrección de bugs
- **docs:** Cambios en documentación
- **refactor:** Refactorización sin cambios funcionales
- **style:** Cambios de formato/estilos
- Mensajes en español

---

## 🔐 ROLES Y PERMISOS

### Admin (luisrissopa@gmail.com):
- ✅ Ver todas las citas
- ✅ Crear/editar/eliminar citas
- ✅ Gestionar barberos y asistentes
- ✅ Gestionar inventario
- ✅ Cambiar estados de citas
- ✅ Ver estadísticas completas

### Barber:
- ✅ Ver sus propias citas
- ✅ Ver información de clientes
- ❌ No puede crear/editar citas
- ❌ No puede gestionar inventario

### Client:
- ✅ Ver sus propias citas
- ✅ Crear nuevas citas
- ✅ Editar sus citas (servicio, barbero, fecha, hora, notas)
- ✅ Cancelar sus citas
- ❌ No puede cambiar estado (solo admin)

---

## 📞 CONTACTO Y PREFERENCIAS DEL USUARIO

**Usuario**: Luis
**Email**: luisrissopa@gmail.com
**Preferencias**:
- ✅ Mensajes y commits en español
- ✅ Documentación detallada
- ✅ Soluciones paso a paso
- ✅ Explicaciones completas con emojis
- ✅ Tablas comparativas para mostrar cambios

**Contexto de Trabajo**:
- Windows (cmd.exe como shell)
- VS Code como editor
- Git configurado localmente
- Supabase configurado y funcionando

---

## 🎯 OBJETIVO PRINCIPAL DEL PROYECTO

Crear una aplicación completa de gestión de barberías que permita:
1. **Clientes**: Reservar y gestionar sus citas fácilmente
2. **Barberos**: Ver su calendario y citas asignadas
3. **Administradores**: Control total de operaciones
4. **Sistema de notificaciones**: Emails automáticos para cada cambio de estado
5. **Gestión de inventario**: Control de productos y servicios

---

## 🏁 CÓMO EMPEZAR

1. **Lee este documento completo** para entender el contexto
2. **Revisa los últimos commits** para ver cambios recientes
3. **Verifica el estado actual**: `git status` y `npm run dev`
4. **Pregunta al usuario** qué quiere trabajar ahora
5. **Sigue los patrones establecidos** en los archivos existentes
6. **Commits frecuentes** con mensajes descriptivos en español

---

## 📚 ARCHIVOS DE REFERENCIA IMPORTANTES

- `lib/types.ts`: Tipos TypeScript del proyecto
- `lib/roles.ts`: Lógica de autenticación y roles
- `app/admin/hooks/use-dashboard-stats.ts`: Hook para estadísticas
- `middleware.ts`: Redirecciones según rol
- `scripts/`: Scripts SQL de base de datos

---

## ⚠️ NOTAS FINALES

- **NO hay errores de compilación actualmente** - Solo warnings CSS
- **Base de datos está sincronizada** con el código
- **Emails funcionando** en modo desarrollo
- **Git está 2 commits adelante** de origin/master (push pendiente si el usuario lo solicita)
- **Terminología establecida**: Barbero (no empleado), Asistente (no secretaria/recepcionista)

---

**¡Listo para continuar! 🚀**

El proyecto está en un estado estable y funcional. Pregunta al usuario qué funcionalidad quiere desarrollar a continuación o si necesita resolver algún problema específico.
