#!/usr/bin/env node

/*
 * Supply chain hardening audit (Node.js/NPM/PNPM - 2026 baseline)
 *
 * Checks:
 * - .npmrc secure consumption defaults
 * - package.json dependency pinning posture
 * - publishing safety controls
 */

const fs = require("fs")
const path = require("path")

const root = process.cwd()
const npmrcPath = path.join(root, ".npmrc")
const packagePath = path.join(root, "package.json")

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function parseNpmrc(text) {
  const map = new Map()
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const idx = line.indexOf("=")
      if (idx === -1) return
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(value)
    })
  return map
}

function isExactVersion(spec) {
  return /^\d+\.\d+\.\d+([-.][0-9A-Za-z.]+)?$/.test(spec)
}

function printResult(ok, msg) {
  const icon = ok ? "PASS" : "FAIL"
  console.log(`[${icon}] ${msg}`)
}

function collectDeps(pkg) {
  return {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
    ...(pkg.optionalDependencies || {}),
    ...(pkg.peerDependencies || {}),
  }
}

function run() {
  const npmrcRaw = readText(npmrcPath)
  const npmrc = parseNpmrc(npmrcRaw)
  const pkg = readJson(packagePath)

  let failed = 0

  if (!pkg) {
    console.error("[FAIL] package.json no encontrado")
    process.exit(1)
  }

  console.log("Supply Chain Audit (2026 Defense-in-Depth)\n")

  // Layer 1: Secure consumption
  const ignoreScripts = (npmrc.get("ignore-scripts") || [])[0] === "true"
  printResult(ignoreScripts, "ignore-scripts=true")
  if (!ignoreScripts) failed++

  const saveExact = (npmrc.get("save-exact") || [])[0] === "true"
  printResult(saveExact, "save-exact=true")
  if (!saveExact) failed++

  const deps = collectDeps(pkg)
  const latestSpecs = Object.entries(deps).filter(([, spec]) => spec === "latest")
  const nonExactSpecs = Object.entries(deps).filter(([, spec]) => !isExactVersion(spec))

  printResult(latestSpecs.length === 0, "No se usa 'latest' en dependencias")
  if (latestSpecs.length > 0) {
    latestSpecs.forEach(([name]) => console.log(`  - latest: ${name}`))
    failed++
  }

  printResult(nonExactSpecs.length === 0, "Todas las dependencias estan pineadas a version exacta")
  if (nonExactSpecs.length > 0) {
    console.log(`  - Encontradas ${nonExactSpecs.length} dependencias no exactas (ej: ^, ~, >=, workspace)`)
  }

  // Layer 2: PNPM hardening
  const minReleaseAge = (npmrc.get("minimum-release-age") || [])[0] === "4320"
  printResult(minReleaseAge, "minimum-release-age=4320")
  if (!minReleaseAge) failed++

  const strictDepBuilds = (npmrc.get("strict-dep-builds") || [])[0] === "true"
  printResult(strictDepBuilds, "strict-dep-builds=true")
  if (!strictDepBuilds) failed++

  const allowBuilds = npmrc.get("only-built-dependencies[]") || []
  printResult(allowBuilds.length > 0, "allow-list de compilacion (only-built-dependencies[])")
  if (allowBuilds.length === 0) failed++

  // Layer 3: Secure publishing posture
  const isPrivate = pkg.private === true
  printResult(isPrivate, "package.json private=true (bloquea publicacion accidental)")

  const hasFilesAllowList = Array.isArray(pkg.files) && pkg.files.length > 0
  printResult(hasFilesAllowList || isPrivate, "allow-list de archivos (files) o paquete privado")
  if (!hasFilesAllowList && !isPrivate) failed++

  const hasPublishConfig = !!pkg.publishConfig
  printResult(hasPublishConfig || isPrivate, "publishConfig definido (o no requerido por private=true)")

  console.log("\nRecomendaciones operativas:")
  console.log("- Usa NPQ antes de instalar: npx -y npq <paquete>")
  console.log("- Usa wrapper SFW si tu equipo lo tiene estandarizado")
  console.log("- Para publicar, usa OIDC + Provenance en GitHub Actions y exige 2FA/Passkeys")

  if (process.argv.includes("--preinstall") && failed > 0) {
    console.error("\nBloqueado: la auditoria de supply chain detecto incumplimientos.")
    process.exit(1)
  }

  process.exit(failed > 0 ? 1 : 0)
}

run()
