/**
 * Script para crear usuarios demo en Supabase
 * Uso: node scripts/create-demo-users.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer variables de entorno desde .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim()
    env[key] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Usuarios demo con contraseñas que cumplen validación (8+ chars, mayúscula, minúscula, número)
const DEMO_USERS = [
  {
    email: 'admin@demo.com',
    password: 'Demo1234',
    name: 'Admin Demo',
    role: 'admin',
    phone: '+1234567890'
  },
  {
    email: 'barber@demo.com',
    password: 'Demo1234',
    name: 'Barbero Demo',
    role: 'employee',
    phone: '+1234567891'
  },
  {
    email: 'client@demo.com',
    password: 'Demo1234',
    name: 'Cliente Demo',
    role: 'client',
    phone: '+1234567892'
  }
]

async function createDemoUsers() {
  console.log('🚀 Creando usuarios demo en Supabase...\n')

  for (const user of DEMO_USERS) {
    console.log(`📝 Creando usuario: ${user.email}`)
    
    try {
      // Intentar crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            role: user.role,
            phone: user.phone
          },
          emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  Usuario ya existe: ${user.email}`)
        } else {
          console.error(`   ❌ Error: ${error.message}`)
        }
        continue
      }

      if (data.user) {
        console.log(`   ✅ Usuario creado exitosamente`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   🔑 Password: ${user.password}`)
        console.log(`   👤 Rol: ${user.role}`)
        console.log(`   🆔 ID: ${data.user.id}\n`)
      }
    } catch (err) {
      console.error(`   ❌ Error inesperado:`, err.message)
    }
  }

  console.log('\n✨ Proceso completado!\n')
  console.log('📋 Resumen de credenciales:')
  console.log('─────────────────────────────────────────')
  DEMO_USERS.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`)
  })
  console.log('─────────────────────────────────────────')
  console.log('\n💡 Puedes usar estas credenciales para iniciar sesión')
}

createDemoUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error fatal:', err)
    process.exit(1)
  })
