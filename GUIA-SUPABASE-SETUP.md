# 🚀 Guía Rápida: Configurar Supabase (5-10 minutos)

## Opción 1: Crear un Nuevo Proyecto en Supabase

### Paso 1: Crear Cuenta/Proyecto
1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project" o "Sign in"
3. Crea una cuenta (puedes usar GitHub)
4. Haz clic en "New Project"

### Paso 2: Configurar el Proyecto
Completa el formulario:
- **Name**: `barber-manager` (o el nombre que prefieras)
- **Database Password**: Genera una contraseña segura (¡guárdala!)
- **Region**: Elige el más cercano a ti (ejemplo: `South America (São Paulo)`)
- **Pricing Plan**: Free (suficiente para desarrollo)

Haz clic en "Create new project" y espera 1-2 minutos.

### Paso 3: Obtener las Credenciales

Una vez creado el proyecto:

1. En el menú lateral, ve a **Settings** ⚙️ (abajo a la izquierda)
2. Haz clic en **API**
3. Verás dos valores importantes:

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
**Copia este valor completo**

#### Project API keys
Busca la sección "Project API keys" y copia el **anon public**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```
**Copia toda la key (es muy larga, como 200+ caracteres)**

---

## Paso 4: Configurar Variables de Entorno

### Opción A: Editar manualmente

1. Abre el archivo `.env.local` en tu proyecto
2. Reemplaza los valores placeholder:

```env
# ANTES (con placeholders)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# DESPUÉS (con tus valores reales)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Opción B: Usar comando rápido

Abre una terminal en el proyecto y ejecuta:

```bash
# Esto te ayudará a configurar las variables
notepad .env.local
```

O si prefieres VS Code:
```bash
code .env.local
```

---

## Paso 5: Configurar la Base de Datos

### 5.1 Ejecutar Scripts SQL

1. En Supabase Dashboard, ve a **SQL Editor** en el menú lateral
2. Haz clic en **New query**
3. Copia y pega el contenido de cada archivo (en orden):

#### Script 1: Crear Tablas
```sql
-- Contenido de: scripts/01-create-tables.sql
```
- Abre `scripts/01-create-tables.sql` en tu proyecto
- Copia TODO el contenido
- Pégalo en el SQL Editor de Supabase
- Haz clic en **Run** (o presiona Ctrl+Enter)
- Espera el mensaje de éxito ✅

#### Script 2: Datos Iniciales
```sql
-- Contenido de: scripts/02-seed-data.sql
```
- Repite el proceso con `scripts/02-seed-data.sql`
- Ejecuta

#### Script 3: Usuarios Demo (OPCIONAL)
```sql
-- Contenido de: scripts/03-create-demo-users.sql
```
- Solo si quieres datos de prueba
- Repite el proceso con `scripts/03-create-demo-users.sql`

### 5.2 Verificar que Todo Funcionó

En el menú lateral de Supabase:
1. Ve a **Table Editor**
2. Deberías ver estas tablas:
   - ✅ users
   - ✅ services
   - ✅ appointments
   - ✅ inventory
   - ✅ inventory_movements
   - ✅ time_logs
   - ✅ business_settings

Si ves todas las tablas, ¡perfecto! ✅

---

## Paso 6: Probar la Configuración

### En tu terminal del proyecto:

```bash
# 1. Verificar que las variables estén bien configuradas
npm run predeploy
```

Deberías ver:
```
✅ Variables de entorno configuradas
✅ Código demo eliminado
✅ Sin uso de localStorage para auth
✅ Sin credenciales hardcodeadas
✅ Dependencias con versiones fijas
✅ .gitignore configurado correctamente
✅ TypeScript modo estricto habilitado

============================================================
✅ ÉXITO: Todas las verificaciones pasaron
El proyecto está listo para deployment.
```

### Iniciar el proyecto:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🎯 Verificación Rápida

- [ ] Proyecto Supabase creado
- [ ] Project URL copiada
- [ ] Anon Key copiada
- [ ] `.env.local` actualizado con valores reales
- [ ] Scripts SQL ejecutados (01, 02, 03)
- [ ] Tablas creadas en Supabase
- [ ] `npm run predeploy` pasa todos los checks
- [ ] `npm run dev` inicia sin errores

---

## ❓ Problemas Comunes

### Error: "Invalid Supabase URL"
- ✅ Verifica que copiaste la URL completa (debe empezar con `https://`)
- ✅ No debe tener espacios al inicio o final

### Error: "Invalid API key"
- ✅ Verifica que copiaste la key **anon public** (no la service_role)
- ✅ La key es muy larga (~200 caracteres)
- ✅ Debe empezar con `eyJ`

### Error: "Missing environment variables"
- ✅ Reinicia el servidor (`Ctrl+C` y `npm run dev`)
- ✅ Verifica que el archivo se llame `.env.local` (no `.env.local.txt`)

### No aparecen las tablas en Supabase
- ✅ Revisa el SQL Editor por errores
- ✅ Ejecuta los scripts en orden (01, 02, 03)
- ✅ Verifica que aparezca "Success" después de cada ejecución

---

## 🚀 Siguiente Paso

Una vez que `npm run predeploy` pase todos los checks:

1. Crea una cuenta de usuario en el registro
2. Prueba el login
3. Verifica que se redirija al dashboard correcto según tu rol
4. ¡Listo para desarrollo! 🎉

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Verifica cada paso de esta guía
2. Revisa los errores en la consola del navegador (F12)
3. Revisa los logs en la terminal donde corre `npm run dev`

---

**Tiempo estimado total: 5-10 minutos** ⏱️

¡Éxito! 🎉
