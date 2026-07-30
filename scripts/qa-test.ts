import { chromium, Browser, Page } from "playwright"
import * as fs from "fs"

const BASE_URL = "http://localhost:3000"
const REPORT: string[] = []

function log(msg: string) {
  console.log(msg)
  REPORT.push(msg)
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.waitForLoadState("networkidle")

  const inputs = await page.locator("input").all()
  log(`  Inputs encontrados: ${inputs.length}`)
  for (const input of inputs) {
    const type = await input.getAttribute("type")
    const name = await input.getAttribute("name")
    const placeholder = await input.getAttribute("placeholder")
    log(`    input type="${type}" name="${name}" placeholder="${placeholder?.slice(0, 30)}"`)
  }

  await page.locator('#email, input[type="email"], input[name="email"]').first().fill(email)
  await page.locator('#password, input[type="password"], input[name="password"]').first().fill(password)

  const buttons = await page.locator("button").all()
  log(`  Botones encontrados: ${buttons.length}`)
  for (const btn of buttons) {
    const text = await btn.textContent()
    const type = await btn.getAttribute("type")
    log(`    button type="${type}" text="${text?.trim().slice(0, 30)}"`)
  }

  await page.locator('button[type="submit"], button:has-text("Iniciar Sesión")').first().click()
  await page.waitForTimeout(1500)

  const loginErrorVisible = await page.locator("text=Credenciales inválidas").first().isVisible().catch(() => false)
  const currentUser = await page.evaluate(() => window.localStorage.getItem("currentUser"))
  const hasDemoSession = Boolean(currentUser)
  const currentUrl = page.url()

  log(
    `  Estado login: ${hasDemoSession ? "OK (demo-session)" : loginErrorVisible ? "ERROR (credenciales)" : "SIN CONFIRMACION"}`,
  )

  return currentUrl
}

async function logout(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.waitForTimeout(1000)
}

async function checkPage(page: Page, url: string, label: string) {
  try {
    await page.goto(url)
    await page.waitForLoadState("networkidle")
    const finalUrl = page.url()
    const title = await page.title()
    const redirected = !finalUrl.includes(url.replace(BASE_URL, ""))
    if (redirected) {
      log(`  REDIRECCION [${label}] -> ${finalUrl}`)
    } else {
      log(`  OK [${label}] — ${title}`)
    }
  } catch (e) {
    log(`  FALLO [${label}] — ${e}`)
  }
}

async function testAdmin(browser: Browser) {
  log("\n=== ROL: ADMIN ===")
  const page = await browser.newPage()

  const landingUrl = await login(page, "admin@demo.com", "Demo1234")
  log(`Login admin -> ${landingUrl}`)

  const routes: Array<[string, string]> = [
    ["/admin", "Dashboard"],
    ["/admin/appointments", "Citas"],
    ["/admin/clients", "Clientes"],
    ["/admin/employees", "Empleados"],
    ["/admin/inventory", "Inventario"],
    ["/admin/reports", "Reportes"],
    ["/admin/pos", "POS"],
    ["/admin/services", "Servicios"],
    ["/admin/settings", "Configuracion"],
    ["/admin/billing", "Billing"],
    ["/admin/integrations", "Integraciones"],
  ]

  for (const [path, label] of routes) {
    await checkPage(page, `${BASE_URL}${path}`, label)
  }

  log("\n  -- Test: boton nueva cita --")
  await page.goto(`${BASE_URL}/admin/appointments`)
  await page.waitForLoadState("networkidle")
  const newBtn = page.locator("button:has-text('Nueva')")
  log(`  Boton nueva cita: ${await newBtn.count() > 0 ? "PRESENTE" : "NO ENCONTRADO"}`)

  await logout(page)
  await page.close()
}

async function testCliente(browser: Browser) {
  log("\n=== ROL: CLIENTE ===")
  const page = await browser.newPage()
  const landingUrl = await login(page, "client@demo.com", "Demo1234")
  log(`Login cliente -> ${landingUrl}`)

  const routes: Array<[string, string]> = [
    ["/client", "Dashboard cliente"],
    ["/client/appointments", "Mis citas"],
    ["/client/history", "Historial"],
    ["/client/profile", "Perfil"],
    ["/reservar", "Reservar turno"],
  ]

  for (const [path, label] of routes) {
    await checkPage(page, `${BASE_URL}${path}`, label)
  }

  await logout(page)
  await page.close()
}

async function testEmpleado(browser: Browser) {
  log("\n=== ROL: EMPLEADO ===")
  const page = await browser.newPage()
  const landingUrl = await login(page, "employee@demo.com", "Demo1234")
  log(`Login empleado -> ${landingUrl}`)

  const routes: Array<[string, string]> = [
    ["/employee/dashboard", "Dashboard"],
    ["/employee/schedule", "Horario"],
    ["/employee/time-tracking", "Control horario"],
    ["/employee/stats", "Estadisticas"],
    ["/employee/profile", "Perfil"],
    ["/employee/appointments", "Citas"],
  ]

  for (const [path, label] of routes) {
    await checkPage(page, `${BASE_URL}${path}`, label)
  }

  await logout(page)
  await page.close()
}

async function main() {
  log("ORNO QA REPORT")
  log(`Fecha: ${new Date().toLocaleString("es-ES")}`)
  log(`URL: ${BASE_URL}`)
  log("=".repeat(50))

  const browser = await chromium.launch({ headless: true })

  try {
    await testAdmin(browser)
    await testCliente(browser)
    await testEmpleado(browser)
  } catch (e) {
    log(`\nERROR GENERAL: ${e}`)
  } finally {
    await browser.close()
  }

  log("\n" + "=".repeat(50))
  log("FIN DEL REPORTE")
  fs.writeFileSync("qa-report.txt", REPORT.join("\n"))
  console.log("\nReporte guardado en qa-report.txt")
}

main()