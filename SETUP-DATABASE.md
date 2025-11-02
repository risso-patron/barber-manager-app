# 🗄️ Configuración de Base de Datos - Barber Manager

## Paso 1: Acceder a Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto o crea uno nuevo

## Paso 2: Ejecutar Scripts SQL

### Opción A: Editor SQL de Supabase (Recomendado)

1. En el panel izquierdo, haz clic en **SQL Editor**
2. Haz clic en **+ New query**
3. Copia y pega el contenido completo de `scripts/01-create-tables.sql`
4. Haz clic en **Run** (o presiona Ctrl+Enter)
5. Espera a que termine (verás "Success. No rows returned")

6. Crea una **nueva query**
7. Copia y pega el contenido de `scripts/02-seed-data.sql`
8. Haz clic en **Run**

### Opción B: Usando CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db reset
supabase db push
```

## Paso 3: Verificar que todo funcione

### Verificar tablas creadas:

1. Ve a **Table Editor** en el panel izquierdo
2. Deberías ver estas tablas:
   - ✅ users
   - ✅ services
   - ✅ appointments
   - ✅ inventory
   - ✅ inventory_movements
   - ✅ time_logs
   - ✅ business_settings
   - ✅ financial_transactions
   - ✅ employee_commissions
   - ✅ customer_loyalty

### Verificar datos de prueba:

1. Abre la tabla **services** → deberías ver 5 servicios
2. Abre la tabla **business_settings** → deberías ver configuraciones
3. Abre la tabla **inventory** → deberías ver 5 productos

## Paso 4: Obtener credenciales

1. Ve a **Project Settings** → **API**
2. Copia estos valores:

```env
# Crea un archivo .env.local en la raíz del proyecto
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## Paso 5: Configurar autenticación

1. Ve a **Authentication** → **Providers**
2. Habilita **Email** (ya debería estar habilitado)
3. Opcional: configura **Google**, **Facebook**, etc.

## Paso 6: Crear primer usuario Admin

### Método 1: Desde el código (después de registrarte)

1. Regístrate normalmente en la app
2. Ve a Supabase → **Table Editor** → **users**
3. Busca tu usuario y cambia el campo `role` de `client` a `admin`

### Método 2: Desde SQL Editor

```sql
-- Primero regístrate en la app, luego ejecuta esto reemplazando el email:
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'tu-email@ejemplo.com';
```

## 🎯 Estructura de la Base de Datos

### Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| `users` | Usuarios del sistema (clientes, empleados, admin) |
| `services` | Servicios ofrecidos (cortes, barba, etc.) |
| `appointments` | Citas agendadas |
| `inventory` | Productos en stock |
| `inventory_movements` | Historial de movimientos de inventario |
| `time_logs` | Registro de asistencia de empleados |
| `financial_transactions` | Ingresos y gastos (contabilidad) |
| `employee_commissions` | Comisiones de empleados |
| `customer_loyalty` | Puntos de lealtad de clientes |
| `business_settings` | Configuraciones del negocio |

### Flujo automático al completar una cita:

Cuando una cita cambia a estado `completed`:
1. ✅ Se crea automáticamente una transacción financiera (ingreso)
2. ✅ Se calcula y registra la comisión del barbero (40% por defecto)
3. ✅ Todo se registra con la fecha actual

## 🔐 Seguridad (RLS - Row Level Security)

Todas las tablas tienen políticas de seguridad:

- **Clientes**: Solo ven sus propias citas y datos
- **Empleados**: Ven sus citas, horarios y comisiones
- **Admins**: Acceso completo a todo

## 🚀 Próximos Pasos

Después de configurar la base de datos:

1. ✅ Configurar variables de entorno (`.env.local`)
2. ⏳ Probar el sistema de autenticación
3. ⏳ Crear el dashboard principal
4. ⏳ Implementar módulos (citas, empleados, inventario, contabilidad)

## ⚠️ Troubleshooting

### Error: "relation does not exist"
→ Asegúrate de ejecutar primero `01-create-tables.sql`

### Error: "permission denied"
→ Revisa que las políticas RLS estén correctamente configuradas

### No aparecen las tablas
→ Verifica que estás viendo el esquema `public` en Table Editor

### El trigger no funciona
→ Asegúrate de que el usuario tenga permisos en `auth.users`

