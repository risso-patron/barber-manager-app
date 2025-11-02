# Sistema de Roles - Instrucciones de Configuración

## 📋 Pasos para implementar el sistema de roles

### 1. Ejecutar el script SQL en Supabase

Ve a tu proyecto en Supabase:
1. Abre **SQL Editor**
2. Crea una nueva query
3. Pega el contenido del archivo `scripts/03-add-roles.sql`
4. Ejecuta la query

O bien, copia y pega este código:

```sql
## 1. Verificar el Esquema de la Base de Datos

**IMPORTANTE**: La tabla `users` ya tiene la columna `role` con tipo ENUM `user_role` que incluye:
- `'client'` - Clientes que reservan citas
- `'employee'` - Empleados/barberos
- `'admin'` - Administradores

No necesitas ejecutar ninguna migración de esquema porque el rol ya existe.

## 2. Asignar Roles de Admin

Solo necesitas actualizar qué usuarios tienen rol de `'admin'`:

1. Abre tu proyecto en **Supabase**
2. Ve a **SQL Editor**
3. Ejecuta este comando para asignar admin al primer usuario empleado:

```sql
-- Actualizar el primer usuario como admin (ajusta el email según necesites)
UPDATE users 
SET role = 'admin' 
WHERE email LIKE '%admin%' OR id = (SELECT id FROM users WHERE role IN ('employee', 'admin') ORDER BY created_at LIMIT 1);
```
```

## 3. Verificar los Roles

Verifica que los roles estén asignados correctamente:

```sql
SELECT id, name, email, role FROM users WHERE role IN ('admin', 'employee');
```

Deberías ver:
- Al menos un usuario con `role = 'admin'`
- Los demás empleados con `role = 'employee'`
- Los clientes NO aparecen en esta consulta (tienen `role = 'client'`)

### 4. Asignar Admin Manualmente (Opcional)

Si necesitas cambiar el admin o asignar más admins:

```sql
-- Cambiar un usuario específico a admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'tu-email@ejemplo.com';

-- Cambiar un admin de vuelta a employee
UPDATE users 
SET role = 'employee' 
WHERE email = 'empleado@ejemplo.com';
```

## 🔐 Cómo funciona el sistema de roles

### Roles disponibles:
- **`admin`**: Acceso completo al dashboard de administración (`/admin`)
- **`employee`**: Acceso solo al dashboard de empleado (`/employee`)

### Flujo de autenticación:

1. **Login**: 
   - Usuario ingresa email y contraseña
   - Sistema verifica credenciales
   - Busca el rol del empleado en la BD
   - Redirige a `/admin` o `/employee` según el rol

2. **Protección de rutas** (middleware):
   - Si no estás autenticado → redirige a `/auth/login`
   - Si eres employee e intentas acceder a `/admin` → redirige a `/employee`
   - Si estás en `/auth/login` y ya estás autenticado → redirige según tu rol

3. **Verificación en cliente**:
   - La página `/admin` verifica que seas admin
   - Si no lo eres, te redirige a `/employee`

## 🧪 Prueba del sistema

### Como Admin:
1. Login con email de admin
2. Deberías ser redirigido a `/admin`
3. Verás el dashboard completo

### Como Employee:
1. Login con email de empleado
2. Deberías ser redirigido a `/employee`
3. Verás solo tu dashboard personal
4. Si intentas ir a `/admin`, serás redirigido a `/employee`

## 🛠️ Troubleshooting

### "No me redirige correctamente"
- Verifica que el campo `role` existe en la tabla `employees`
- Asegúrate de que tu usuario tiene un rol asignado
- Limpia cookies y vuelve a hacer login

### "Todos pueden acceder a /admin"
- Verifica que el middleware esté funcionando
- Revisa que `middleware.ts` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo

### "No puedo hacer login"
- Verifica que el empleado existe en la tabla `employees`
- El email debe coincidir exactamente
- Verifica que el usuario existe en Supabase Auth

## 📝 Archivo modificados

- ✅ `scripts/03-add-roles.sql` - Script de migración
- ✅ `lib/roles.ts` - Utilidades para manejo de roles
- ✅ `middleware.ts` - Middleware de autenticación y redirección
- ✅ `components/auth/login-form.tsx` - Login con redirección por rol
- ✅ `app/admin/page.tsx` - Protección de página admin
