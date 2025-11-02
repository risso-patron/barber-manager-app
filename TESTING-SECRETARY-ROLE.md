# 🔧 INSTRUCCIONES DE PRUEBA - Rol Secretary y Fix Activar/Inactivar

## ✅ Cambios Realizados

### 1. **Agregado Rol "Secretary" (Secretaria)**
   - ✅ Actualizado `lib/types.ts` - UserRole incluye 'secretary'
   - ✅ Actualizado `middleware.ts` - Secretarias van a /employee
   - ✅ Actualizado `employees-view.tsx` - Filtros, estadísticas y selector de rol
   - ✅ Actualizado `employee-management-modal.tsx` - Crear empleados con rol secretary
   - ✅ Creado script SQL `scripts/05-add-secretary-role.sql`

### 2. **Arreglado Botón Activar/Desactivar**
   - ✅ Mejorada función `toggleActiveStatus` con verificación previa del estado
   - ✅ Agregados console.log para debugging
   - ✅ Mejor manejo de errores

### 3. **Mejorada UI de Gestión de Empleados**
   - ✅ Reemplazado botón toggle de rol por selector dropdown (employee/secretary/admin)
   - ✅ Agregada tarjeta de estadísticas para Secretarias
   - ✅ Agregado filtro por rol "secretary" en el selector
   - ✅ Iconos distintivos por rol (👑 Admin, 💼 Empleado, 📋 Secretaria)

---

## 🚀 PASOS PARA PROBAR

### **Paso 1: Ejecutar Script SQL en Supabase**

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el siguiente script:

```sql
-- Script para agregar el rol de "secretary" (secretaria/asistente)

-- 1. Agregar el nuevo valor al enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretary';

-- 2. Verificar que existe la columna is_active
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Actualizar usuarios existentes que no tienen is_active
UPDATE users 
SET is_active = true 
WHERE is_active IS NULL;

-- 4. Verificar los roles disponibles
SELECT enum_range(NULL::user_role);

-- 5. Ver usuarios con sus roles
SELECT id, name, email, role, is_active 
FROM users 
ORDER BY role, name;
```

3. Verifica que no haya errores

---

### **Paso 2: Recargar la Aplicación**

En tu terminal, reinicia el servidor de desarrollo:

```cmd
# Si está corriendo, presiona Ctrl+C y luego:
npm run dev
# o
pnpm dev
```

---

### **Paso 3: Probar las Nuevas Funcionalidades**

#### 🧪 **Test 1: Crear un Empleado con Rol Secretary**

1. Ve a `http://localhost:3000/auth/login`
2. Inicia sesión como admin (`luisrissopa@gmail.com`)
3. Ve a la pestaña **"Employees"** (Empleados)
4. Click en **"➕ Nuevo Empleado"**
5. Llena el formulario:
   - Nombre: "María López"
   - Email: "maria@test.com"
   - Rol: **📋 Secretaria** ← NUEVO
   - Contraseña: "test123"
6. Click en "Agregar"
7. Verifica que aparece en la lista con el icono 📋

#### 🧪 **Test 2: Cambiar Rol de un Empleado**

1. En la lista de empleados, busca un empleado existente
2. En su tarjeta, usa el **selector de Rol** (dropdown)
3. Cambia el rol a "📋 Secretaria"
4. Confirma el cambio
5. Verifica que:
   - El rol se actualiza
   - Las estadísticas se actualizan
   - Aparece el icono 📋 en su nombre

#### 🧪 **Test 3: Activar/Desactivar Empleado (BUG FIX)**

1. Busca un empleado que esté **Activo**
2. Click en **"⏸️ Desactivar"**
3. Verifica que:
   - Aparece mensaje de éxito
   - El botón cambia a **"▶️ Activar"**
   - La estadística de "Activos" disminuye en 1
4. Vuelve a activarlo
5. Verifica que todo funciona correctamente

#### 🧪 **Test 4: Filtros y Estadísticas**

1. Usa el filtro de **Rol**:
   - Selecciona "📋 Secretaria"
   - Verifica que solo aparecen secretarias
2. Verifica las tarjetas de estadísticas:
   - **Total**: Todos los empleados
   - **Administradores**: Solo admins
   - **Empleados**: Solo employees
   - **Secretarias**: Solo secretaries ← NUEVO
   - **Activos**: Solo activos
3. Prueba combinaciones de filtros (rol + estado + búsqueda)

#### 🧪 **Test 5: Middleware y Accesos**

1. **Cierra sesión** (logout)
2. Inicia sesión como la secretaria creada (`maria@test.com` / `test123`)
3. Verifica que:
   - Te redirige a `/employee` (dashboard de empleado)
   - **NO** puede acceder a `/admin`
4. Inicia sesión como empleado regular
5. Verifica lo mismo (no puede acceder a `/admin`)

---

## 🐛 SI ALGO NO FUNCIONA

### **Problema: "is_active" no existe**

**Solución:**
```sql
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
UPDATE users SET is_active = true WHERE is_active IS NULL;
```

### **Problema: "secretary" no es un valor válido**

**Solución:**
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretary';
```

### **Problema: Botón activar/desactivar no hace nada**

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña de empleados
3. Click en activar/desactivar
4. Mira los errores en consola
5. Verifica que la columna `is_active` existe en Supabase

---

## 📊 VERIFICACIÓN FINAL

✅ **Checklist:**

- [ ] Script SQL ejecutado sin errores
- [ ] Puedo crear empleados con rol "secretary"
- [ ] El selector de rol muestra 3 opciones (employee/secretary/admin)
- [ ] Puedo cambiar roles entre los 3 tipos
- [ ] El botón activar/desactivar funciona correctamente
- [ ] Las estadísticas muestran conteos correctos
- [ ] Los filtros funcionan para los 3 roles
- [ ] Los iconos se muestran correctamente (👑💼📋)
- [ ] Secretarias no pueden acceder a /admin
- [ ] Secretarias van a /employee al hacer login

---

## 📝 NOTAS

- **Secretarias tienen los mismos permisos que empleados** (acceso a /employee)
- Si quieres que tengan permisos diferentes, tendrás que crear un dashboard especial `/secretary`
- La jerarquía actual es: **Admin > Secretary > Employee**
- Pero secretary y employee tienen el mismo nivel de acceso por ahora

---

¿Algún problema? Déjame saber qué error ves y lo arreglamos! 🚀
