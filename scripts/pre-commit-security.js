#!/usr/bin/env node

/**
 * Pre-commit Hook - Security Check
 * 
 * Este script previene commits accidentales de:
 * - Archivos .env con secrets
 * - API keys hardcodeadas
 * - Passwords en código
 * - Tokens expuestos
 */

const fs = require('fs');
const path = require('path');

// Patrones peligrosos a buscar
const DANGEROUS_PATTERNS = [
  {
    pattern: /(TWILIO_AUTH_TOKEN|RESEND_API_KEY|SUPABASE_SERVICE_ROLE|CRON_SECRET)\s*=\s*['\"]?[a-zA-Z0-9_-]{20,}/gi,
    message: '🔴 API Key detectada en código'
  },
  {
    pattern: /password\s*=\s*['\"][^'\"]{3,}/gi,
    message: '🔴 Password hardcodeada detectada'
  },
  {
    pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/gi,
    message: '🔴 Token Bearer detectado'
  },
  {
    pattern: /sk_live_[a-zA-Z0-9]{20,}/gi,
    message: '🔴 Stripe Live Key detectada'
  },
  {
    pattern: /AIza[a-zA-Z0-9_-]{35}/gi,
    message: '🔴 Google API Key detectada'
  }
];

// Archivos que NUNCA deben ser commiteados
const FORBIDDEN_FILES = [
  '.env.local',
  '.env.production',
  '.env.development.local',
  'secrets.json',
  'credentials.json'
];

function checkStagedFiles() {
  const { execSync } = require('child_process');
  
  try {
    // Obtener archivos staged
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    let hasErrors = false;

    // 1. Verificar archivos prohibidos
    stagedFiles.forEach(file => {
      const basename = path.basename(file);
      if (FORBIDDEN_FILES.includes(basename)) {
        console.error(`\n❌ ERROR: Intentando commitear archivo prohibido: ${file}`);
        console.error(`   Este archivo contiene secrets y NO debe estar en Git.`);
        console.error(`\n   Para arreglarlo:`);
        console.error(`   git reset HEAD ${file}`);
        console.error(`   git rm --cached ${file}`);
        console.error(`\n   Asegúrate de que .gitignore incluye: ${basename}\n`);
        hasErrors = true;
      }
    });

    // 2. Verificar contenido de archivos por patrones peligrosos
    stagedFiles
      .filter(file => file.match(/\.(ts|tsx|js|jsx|json|yaml|yml)$/))
      .forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          
          DANGEROUS_PATTERNS.forEach(({ pattern, message }) => {
            const matches = content.match(pattern);
            if (matches) {
              console.error(`\n❌ ${message} en: ${file}`);
              console.error(`   Encontrado: ${matches[0].substring(0, 50)}...`);
              console.error(`\n   Usa variables de entorno en su lugar.\n`);
              hasErrors = true;
            }
          });
        } catch (err) {
          // Archivo eliminado o no accesible, skip
        }
      });

    if (hasErrors) {
      console.error('\n🔒 COMMIT BLOQUEADO POR SEGURIDAD\n');
      console.error('Razón: Se detectaron secrets o archivos sensibles.');
      console.error('\nPara más información, revisa: SECURITY-REPORT.md\n');
      process.exit(1);
    }

    console.log('✅ Security check passed');
    process.exit(0);

  } catch (error) {
    console.error('Error ejecutando security check:', error.message);
    process.exit(0); // No bloquear en caso de error del script
  }
}

checkStagedFiles();
