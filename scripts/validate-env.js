#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Environment Validation Script
 * 
 * Valida que todas las variables de entorno requeridas estén configuradas
 * Ejecutar antes de deployment o después de rotar secrets
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log(colors.red, '❌', '.env.local no encontrado');
    log(colors.yellow, '⚠️ ', 'Copia .env.local.template a .env.local y configúralo');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      env[key] = value;
    }
  });

  return env;
}

function validateEnv(env) {
  let hasErrors = false;
  let hasWarnings = false;

  console.log('\n' + colors.cyan + '🔍 Validando variables de entorno...' + colors.reset + '\n');

  // Variables críticas
  const critical = {
    'NEXT_PUBLIC_SUPABASE_URL': {
      test: (v) => v && v.startsWith('https://'),
      message: 'URL de Supabase (debe empezar con https://)'
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
      test: (v) => v && v.length > 20 && !v.includes('tu_'),
      message: 'Anon key de Supabase'
    },
    'SUPABASE_SERVICE_ROLE_KEY': {
      test: (v) => v && v.length > 20 && !v.includes('tu_'),
      message: 'Service role key de Supabase'
    },
  };

  console.log(colors.blue + '📋 Variables Críticas (Supabase):' + colors.reset);
  for (const [key, { test, message }] of Object.entries(critical)) {
    const value = env[key];
    if (!value || !test(value)) {
      log(colors.red, '❌', `${key} - ${message}`);
      hasErrors = true;
    } else {
      log(colors.green, '✅', `${key}`);
    }
  }

  // Variables importantes
  const important = {
    'RESEND_API_KEY': {
      test: (v) => v && v.startsWith('re_') && !v.includes('NUEVA_KEY'),
      message: 'API key de Resend (debe empezar con re_)'
    },
    'TWILIO_ACCOUNT_SID': {
      test: (v) => v && v.startsWith('AC') && !v.includes('tu_'),
      message: 'Account SID de Twilio (debe empezar con AC)'
    },
    'TWILIO_AUTH_TOKEN': {
      test: (v) => v && v.length >= 20 && !v.includes('NUEVO_'),
      message: 'Auth token de Twilio'
    },
    'CRON_SECRET': {
      test: (v) => v && v.length >= 32 && !v.includes('NUEVO_'),
      message: 'Secret para proteger cron jobs (min 32 caracteres)'
    },
  };

  console.log('\n' + colors.blue + '📋 Variables Importantes (Integraciones):' + colors.reset);
  for (const [key, { test, message }] of Object.entries(important)) {
    const value = env[key];
    if (!value || !test(value)) {
      log(colors.yellow, '⚠️ ', `${key} - ${message}`);
      hasWarnings = true;
    } else {
      log(colors.green, '✅', `${key}`);
    }
  }

  // Variables opcionales
  const optional = {
    'EMAIL_FROM': {
      test: (v) => v && v.includes('@'),
      message: 'Email remitente'
    },
    'TWILIO_WHATSAPP_FROM': {
      test: (v) => v && v.includes('whatsapp:'),
      message: 'Número WhatsApp de Twilio'
    },
    'NEXT_PUBLIC_APP_URL': {
      test: (v) => v && (v.startsWith('http://') || v.startsWith('https://')),
      message: 'URL de la aplicación'
    },
  };

  console.log('\n' + colors.blue + '📋 Variables Opcionales:' + colors.reset);
  for (const [key, { test, message }] of Object.entries(optional)) {
    const value = env[key];
    if (!value || !test(value)) {
      log(colors.cyan, 'ℹ️ ', `${key} - ${message} (opcional)`);
    } else {
      log(colors.green, '✅', `${key}`);
    }
  }

  // Verificar secrets expuestos (los viejos que deben rotarse)
  console.log('\n' + colors.blue + '🔒 Verificando secrets expuestos:' + colors.reset);
  
  const exposedSecrets = {
    'RESEND_API_KEY': 're_jE4Rnrkv_KKPpYp2tpxYxVjymWTF2QT9w',
    'TWILIO_AUTH_TOKEN': '7050dd63b32c8d8ba3f97e6bf01b8e0b',
    'CRON_SECRET': 'barber_cron_secret_2024',
  };

  let hasExposedSecrets = false;
  for (const [key, exposedValue] of Object.entries(exposedSecrets)) {
    if (env[key] === exposedValue) {
      log(colors.red, '🚨', `${key} contiene un secret EXPUESTO - ¡ROTAR INMEDIATAMENTE!`);
      hasExposedSecrets = true;
    }
  }

  if (!hasExposedSecrets) {
    log(colors.green, '✅', 'No se detectaron secrets expuestos');
  }

  // Verificar .gitignore
  console.log('\n' + colors.blue + '📋 Verificando seguridad de archivos:' + colors.reset);
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignore.includes('.env*.local') || gitignore.includes('.env.local')) {
      log(colors.green, '✅', '.env.local está en .gitignore');
    } else {
      log(colors.red, '❌', '.env.local NO está en .gitignore - ¡PELIGRO!');
      hasErrors = true;
    }
  }

  // Verificar que .env.local no esté en git
  try {
    const { execSync } = require('child_process');
    const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' });
    
    if (trackedFiles.includes('.env.local')) {
      log(colors.red, '🚨', '.env.local está siendo tracked por Git - ¡REMOVER INMEDIATAMENTE!');
      console.log('\n' + colors.yellow + 'Para arreglarlo:' + colors.reset);
      console.log('  git rm --cached .env.local');
      console.log('  git commit -m "chore: Remove .env.local from git"');
      hasErrors = true;
    } else {
      log(colors.green, '✅', '.env.local no está en Git');
    }
  } catch (error) {
    log(colors.cyan, 'ℹ️ ', 'No se pudo verificar Git (puede no ser un repositorio)');
  }

  // Resultado final
  console.log('\n' + '='.repeat(60) + '\n');

  if (hasExposedSecrets) {
    log(colors.red, '🚨', 'SECRETS EXPUESTOS DETECTADOS');
    console.log('\n' + colors.yellow + 'Acción requerida:' + colors.reset);
    console.log('  1. Revisar docs/SECRET-ROTATION.md');
    console.log('  2. Rotar todos los secrets expuestos');
    console.log('  3. Ejecutar este script nuevamente\n');
    return 2;
  }

  if (hasErrors) {
    log(colors.red, '❌', 'Validación FALLIDA - Hay errores críticos');
    console.log('\n' + colors.yellow + 'Revisa los errores arriba y corrige la configuración.\n' + colors.reset);
    return 1;
  }

  if (hasWarnings) {
    log(colors.yellow, '⚠️ ', 'Validación PASÓ con advertencias');
    console.log('\n' + colors.cyan + 'Las funcionalidades con advertencias pueden no funcionar correctamente.\n' + colors.reset);
    return 0;
  }

  log(colors.green, '✅', 'Validación EXITOSA - Todas las variables están correctamente configuradas');
  console.log('');
  return 0;
}

// Ejecutar
const env = loadEnv();
if (env) {
  const exitCode = validateEnv(env);
  process.exit(exitCode);
} else {
  process.exit(1);
}
