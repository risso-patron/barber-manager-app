#!/usr/bin/env node

/**
 * Pre-deployment security checklist script
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const checks = [];
let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function check(name, fn, level = 'error') {
  checks.push({ name, fn, level });
}

// Check 1: Environment variables
check('Variables de entorno configuradas', () => {
  const envExample = path.join(__dirname, '..', '.env.example');
  const envLocal = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envLocal)) {
    return { pass: false, message: 'Archivo .env.local no encontrado' };
  }
  
  const envContent = fs.readFileSync(envLocal, 'utf8');
  
  if (envContent.includes('your-project') || envContent.includes('your-anon-key')) {
    return { pass: false, message: 'Variables de entorno contienen valores placeholder' };
  }
  
  return { pass: true, message: 'Variables de entorno configuradas' };
});

// Check 2: Demo code
check('Código demo eliminado', () => {
  const demoFiles = [
    path.join(__dirname, '..', 'lib', 'demo-auth.ts'),
    path.join(__dirname, '..', 'lib', 'demo-data.ts'),
    path.join(__dirname, '..', 'components', 'demo', 'demo-users.tsx'),
  ];
  
  const existingDemoFiles = demoFiles.filter(file => fs.existsSync(file));
  
  if (existingDemoFiles.length > 0) {
    return { 
      pass: false, 
      message: `Archivos demo encontrados: ${existingDemoFiles.map(f => path.basename(f)).join(', ')}` 
    };
  }
  
  return { pass: true, message: 'No hay archivos demo' };
}, 'warn');

// Check 3: localStorage usage
check('Sin uso de localStorage para auth', () => {
  const filesToCheck = [
    path.join(__dirname, '..', 'app', 'admin', 'page.tsx'),
    path.join(__dirname, '..', 'app', 'barber', 'page.tsx'),
    path.join(__dirname, '..', 'app', 'client', 'page.tsx'),
    path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx'),
  ];
  
  const filesWithLocalStorage = [];
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('localStorage.getItem("currentUser")') || 
          content.includes('localStorage.setItem("currentUser"')) {
        filesWithLocalStorage.push(path.basename(path.dirname(file)) + '/' + path.basename(file));
      }
    }
  });
  
  if (filesWithLocalStorage.length > 0) {
    return { 
      pass: false, 
      message: `localStorage usado en: ${filesWithLocalStorage.join(', ')}` 
    };
  }
  
  return { pass: true, message: 'No se usa localStorage para autenticación' };
});

// Check 4: Hardcoded credentials
check('Sin credenciales hardcodeadas', () => {
  const filesToCheck = [
    path.join(__dirname, '..', 'components', 'auth', 'login-form.tsx'),
    path.join(__dirname, '01-create-tables.sql'),
  ];
  
  const filesWithCreds = [];
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('admin123') || 
          content.includes('empleado123') || 
          content.includes('cliente123') ||
          content.includes('your-jwt-secret')) {
        filesWithCreds.push(path.basename(file));
      }
    }
  });
  
  if (filesWithCreds.length > 0) {
    return { 
      pass: false, 
      message: `Credenciales encontradas en: ${filesWithCreds.join(', ')}` 
    };
  }
  
  return { pass: true, message: 'No hay credenciales hardcodeadas' };
}, 'warn');

// Check 5: Package.json versions
check('Dependencias con versiones fijas', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const latestDeps = [];
  
  Object.entries(packageJson.dependencies).forEach(([name, version]) => {
    if (version === 'latest') {
      latestDeps.push(name);
    }
  });
  
  if (latestDeps.length > 0) {
    return { 
      pass: false, 
      message: `Dependencias con "latest": ${latestDeps.join(', ')}` 
    };
  }
  
  return { pass: true, message: 'Todas las dependencias tienen versión fija' };
}, 'warn');

// Check 6: .gitignore
check('.gitignore configurado correctamente', () => {
  const gitignore = path.join(__dirname, '..', '.gitignore');
  
  if (!fs.existsSync(gitignore)) {
    return { pass: false, message: '.gitignore no encontrado' };
  }
  
  const content = fs.readFileSync(gitignore, 'utf8');
  
  if (!content.includes('.env*.local')) {
    return { pass: false, message: '.gitignore no incluye .env*.local' };
  }
  
  return { pass: true, message: '.gitignore configurado correctamente' };
});

// Check 7: TypeScript strict mode
check('TypeScript modo estricto habilitado', () => {
  const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tsconfig.json'), 'utf8'));
  
  if (!tsconfig.compilerOptions.strict) {
    return { pass: false, message: 'strict mode no habilitado' };
  }
  
  if (!tsconfig.compilerOptions.forceConsistentCasingInFileNames) {
    return { pass: false, message: 'forceConsistentCasingInFileNames no habilitado' };
  }
  
  return { pass: true, message: 'TypeScript configurado correctamente' };
});

// Run all checks
log('\n🔍 Ejecutando verificaciones de seguridad pre-deployment...\n', colors.blue);

checks.forEach(({ name, fn, level }) => {
  const result = fn();
  
  if (result.pass) {
    log(`✅ ${name}: ${result.message}`, colors.green);
  } else {
    if (level === 'error') {
      log(`❌ ${name}: ${result.message}`, colors.red);
      hasErrors = true;
    } else {
      log(`⚠️  ${name}: ${result.message}`, colors.yellow);
      hasWarnings = true;
    }
  }
});

// Summary
log('\n' + '='.repeat(60), colors.blue);

if (hasErrors) {
  log('\n❌ FALLÓ: Se encontraron problemas críticos', colors.red);
  log('No desplegar a producción hasta resolver los errores.', colors.red);
  process.exit(1);
} else if (hasWarnings) {
  log('\n⚠️  ADVERTENCIA: Se encontraron problemas no críticos', colors.yellow);
  log('Revisa las advertencias antes de desplegar.', colors.yellow);
  process.exit(0);
} else {
  log('\n✅ ÉXITO: Todas las verificaciones pasaron', colors.green);
  log('El proyecto está listo para deployment.', colors.green);
  process.exit(0);
}
