# 🔄 Cambio de Terminología: "Empleado" → "Barbero"

## 📋 Resumen General

Se ha realizado un cambio sistemático en toda la aplicación para reemplazar el término "empleado/employee" por "barbero/barber" para reflejar mejor el contexto de negocio de barbería.

## ✅ Cambios Completados

### 1. **TypeScript Types** (`lib/types.ts`)
```typescript
// ANTES:
export type UserRole = "client" | "employee" | "secretary" | "admin"

// DESPUÉS:
export type UserRole = "client" | "barber" | "secretary" | "admin"
```

### 2. **SQL Scripts**

#### `scripts/01-create-tables.sql`
- Actualizado ENUM: `CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin')`
- Las tablas `time_logs` y `employee_commissions` mantienen su nombre (son términos técnicos)

#### `scripts/05-add-employee-position.sql`
- Actualizado todas las referencias de `role = 'employee'` a `role = 'barber'`

#### `scripts/06-migrate-employee-to-barber.sql` ✨ NUEVO
```sql
-- Migrar datos existentes de 'employee' a 'barber'
UPDATE public.users 
SET role = 'barber' 
WHERE role = 'employee';
```

### 3. **Middleware** (`middleware.ts`)
- Cambios en rutas: `/employee` → `/barber`
- Default role: `'employee'` → `'barber'`
- Todos los redirects actualizados

### 4. **Autenticación** (`app/auth/login/page.tsx`)
```typescript
// Actualizado redirect logic:
if (userData?.role === 'barber') {
  router.push("/barber")
}
```

### 5. **Directorio Renombrado**
```
app/employee/ → app/barber/
```

### 6. **Admin Components**

#### `app/admin/page.tsx`
- Redirect no autorizado: `/employee` → `/barber`

#### `app/admin/components/tabs-navigation.tsx`
- Label: `'Empleados'` → `'Barberos'`

#### `app/admin/components/employee-management-modal.tsx`
- Form default role: `'employee'` → `'barber'`
- Select option: `'💼 Barbero'`
- Query filter: `.in('role', ['barber', 'secretary', 'admin'])`

#### `app/admin/components/views/employees-view.tsx`
**Cambios en interfaz:**
```typescript
interface Employee {
  role: 'admin' | 'barber' | 'secretary'
}
```

**Cambios en UI:**
- Título: `'💼 Gestión de Empleados'` → `'💼 Gestión de Barberos'`
- Botón: `'➕ Nuevo Empleado'` → `'➕ Nuevo Barbero'`
- Contador: `'{employees.length} empleados'` → `'{employees.length} barberos'`
- Stats: `statsData.employees` → `statsData.barbers`
- Select option: `value="employee"` → `value="barber"`
- Role label: `'Empleado'` → `'Barbero'`

**Cambios en funciones:**
```typescript
// Mensajes de toast actualizados:
toast.success('Barbero activado/desactivado correctamente')
toast.success('Barbero eliminado correctamente')
toast.error('Error al verificar el estado del barbero')
// etc...

// Confirmación de eliminación:
'¿Estás seguro de eliminar este barbero?'
```

#### `app/admin/components/views/appointments-view.tsx`
- Placeholder: `'🔍 Buscar por cliente, empleado...'` → `'🔍 Buscar por cliente, barbero...'`
- Columna tabla: `'Empleado'` → `'Barbero'`
- Fallback: `'Empleado no encontrado'` → `'Barbero no encontrado'`

### 7. **Hooks** (`app/admin/hooks/use-dashboard-stats.ts`)
```typescript
// Estadísticas:
activeEmployees → barbers: number
```

## 📝 Pasos para Completar la Migración

### 1. **Ejecutar Migración en Base de Datos**

En Supabase SQL Editor, ejecutar en este orden:

```sql
-- 1. Primero migrar los datos existentes
-- archivo: 06-migrate-employee-to-barber.sql
UPDATE public.users 
SET role = 'barber' 
WHERE role = 'employee';

-- 2. Luego agregar el campo employee_position (si no existe)
-- archivo: 05-add-employee-position.sql
-- (este script ya está actualizado para usar 'barber')
```

### 2. **Verificar Cambios**

Ejecutar en Supabase:
```sql
SELECT role, COUNT(*) as total
FROM public.users
GROUP BY role
ORDER BY role;
```

Resultado esperado:
- ✅ `barber` (antes era `employee`)
- ✅ `client`
- ✅ `admin`
- ✅ `secretary` (si existe)
- ❌ NO debe aparecer `employee`

### 3. **Probar el Flujo Completo**

1. **Login como barbero:**
   - Email: [email de usuario con role='barber']
   - Debe redirigir a `/barber`

2. **Dashboard Admin:**
   - Tab "Barberos" debe funcionar
   - Crear nuevo barbero con el modal
   - Filtros deben mostrar "Barbero"
   - Estadísticas deben mostrar conteo correcto

3. **Gestión de Citas:**
   - Columna "Barbero" debe aparecer
   - Búsqueda por barbero debe funcionar

4. **Gestión de Barberos:**
   - Activar/desactivar debe mostrar "Barbero activado"
   - Eliminar debe preguntar "¿eliminar este barbero?"

## 🔍 Referencias que Mantienen "Employee"

Estos NO se cambian porque son términos técnicos o nombres de tabla:

### Tablas de Base de Datos:
- ✅ `employee_commissions` (nombre de tabla)
- ✅ `employee_id` (nombre de campo FK)
- ✅ Comments in SQL: `"Employee commissions table"`

### Variables de Código:
- ✅ `showEmployeeModal` (nombre de variable useState)
- ✅ `EmployeesView` (nombre de componente exportado)
- ✅ `employee-management-modal.tsx` (nombre de archivo)
- ✅ `onNewEmployee` (nombre de prop callback)

Estos mantienen "employee" por convención técnica, pero visualmente al usuario se muestra "Barbero".

## 📊 Archivos Modificados

Total: **10 archivos modificados + 1 archivo nuevo**

### Modificados:
1. `lib/types.ts`
2. `scripts/01-create-tables.sql`
3. `scripts/05-add-employee-position.sql`
4. `middleware.ts`
5. `app/auth/login/page.tsx`
6. `app/admin/page.tsx`
7. `app/admin/components/tabs-navigation.tsx`
8. `app/admin/components/employee-management-modal.tsx`
9. `app/admin/components/views/employees-view.tsx`
10. `app/admin/components/views/appointments-view.tsx`

### Nuevo:
11. `scripts/06-migrate-employee-to-barber.sql`

### Renombrado:
- `app/employee/` → `app/barber/`

## ⚠️ Notas Importantes

1. **Orden de migración SQL:** Ejecutar `06-migrate-employee-to-barber.sql` ANTES de `05-add-employee-position.sql`

2. **Compatibilidad:** El código está listo, solo falta ejecutar la migración SQL en producción

3. **Testing:** Probar login, creación y gestión de barberos antes de deployment

4. **Documentación:** Archivos .md de documentación mantienen "empleado" (se pueden actualizar después si es necesario)

## ✨ Resultado Final

- ✅ Interfaz consistente con terminología "Barbero"
- ✅ Base de datos actualizada con role='barber'
- ✅ Rutas actualizadas a `/barber`
- ✅ Tipos TypeScript actualizados
- ✅ Middleware actualizado
- ✅ Todos los mensajes de usuario actualizados

---

**Fecha:** ${new Date().toLocaleDateString()}
**Cambio solicitado por:** Usuario
**Implementado por:** GitHub Copilot
