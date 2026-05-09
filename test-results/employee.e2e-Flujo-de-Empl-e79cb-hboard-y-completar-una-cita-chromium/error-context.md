# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: employee.e2e.spec.ts >> Flujo de Empleado - E2E >> Empleado puede iniciar sesión, ver dashboard y completar una cita
- Location: e2e\employee.e2e.spec.ts:81:7

# Error details

```
Error: LOGIN FAILED: Credenciales inválidas
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { createClient } from '@supabase/supabase-js';
  3   | 
  4   | // Setup Supabase client for DB operations (bypass UI)
  5   | const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  6   | const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  7   | const supabase = createClient(supabaseUrl, supabaseKey, {
  8   |   auth: { persistSession: false }
  9   | });
  10  | 
  11  | test.describe('Flujo de Empleado - E2E', () => {
  12  |   let employeeId: string;
  13  |   let testEmail: string;
  14  |   let testPass: string;
  15  | 
  16  |   test.beforeAll(async () => {
  17  |     // Generar credenciales únicas para cada worker/test para evitar colisiones en paralelo
  18  |     const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  19  |     testEmail = `employee${uniqueId}@example.com`;
  20  |     testPass = 'TestPass123!';
  21  | 
  22  |     // Create auth user
  23  |     const { data, error } = await supabase.auth.admin.createUser({
  24  |       email: testEmail,
  25  |       password: testPass,
  26  |       email_confirm: true,
  27  |       user_metadata: { name: 'Empleado Test' }
  28  |     });
  29  |     
  30  |     if (error && error.message.indexOf('already registered') === -1) {
  31  |       throw error;
  32  |     }
  33  |     
  34  |     employeeId = data.user!.id;
  35  | 
  36  |     // Ensure they are in the public.users table as an employee
  37  |     const { error: insertErr } = await supabase.from('users').insert({
  38  |       id: employeeId,
  39  |       email: testEmail,
  40  |       name: 'Empleado Test',
  41  |       role: 'employee',
  42  |       phone: uniqueId.slice(0, 10)
  43  |     });
  44  |     if (insertErr) {
  45  |       console.error("Error inserting user:", insertErr);
  46  |       throw insertErr;
  47  |     }
  48  |     
  49  |     // Ensure the employee offers at least one service so they can receive appointments
  50  |     const { data: services } = await supabase.from('services').select('id').limit(1);
  51  |     if (services && services.length > 0) {
  52  |       const serviceId = services[0].id;
  53  |       const { error: esErr } = await supabase.from('employee_services').insert({ employee_id: employeeId, service_id: serviceId });
  54  |       if (esErr && esErr.code !== '23505') console.error("Error inserting employee_service:", esErr);
  55  |     }
  56  |     
  57  |     // 2. Create a pending appointment for today so they have something to "Completar"
  58  |     const today = new Date().toISOString().split('T')[0];
  59  |     
  60  |     // Insert a fresh confirmed appointment
  61  |     await supabase.from('appointments').insert({
  62  |       barber_id: employeeId,
  63  |       appointment_date: today,
  64  |       appointment_time: '12:00',
  65  |       status: 'confirmed',
  66  |       client_name: `Cliente E2E ${uniqueId}`,
  67  |       client_phone: uniqueId.slice(0, 10)
  68  |     });
  69  |   });
  70  | 
  71  |   test.afterAll(async () => {
  72  |     // Cleanup
  73  |     if (employeeId) {
  74  |       await supabase.from('appointments').delete().eq('barber_id', employeeId);
  75  |       await supabase.from('employee_services').delete().eq('employee_id', employeeId);
  76  |       await supabase.from('users').delete().eq('id', employeeId);
  77  |       await supabase.auth.admin.deleteUser(employeeId);
  78  |     }
  79  |   });
  80  | 
  81  |   test('Empleado puede iniciar sesión, ver dashboard y completar una cita', async ({ page }) => {
  82  |     // 1. Iniciar sesión
  83  |     await page.goto('/auth/login');
  84  |     await expect(page.getByText('Inicia sesión en tu cuenta')).toBeVisible();
  85  |     
  86  |     await page.fill('input[type="email"]', 'admin@demo.com');
  87  |     await page.fill('input[type="password"]', 'Demo1234');
  88  |     await page.click('button[type="submit"]');
  89  |     
  90  |     // Wait for network idle or 5 seconds to see what happened
  91  |     await page.waitForTimeout(5000);
  92  | 
  93  |     console.log("URL AFTER 5s:", page.url());
  94  |     const pageText = await page.innerText('body');
  95  |     console.log("PAGE TEXT:", pageText);
  96  | 
  97  |     if (pageText.includes('Credenciales inválidas')) {
> 98  |       throw new Error("LOGIN FAILED: Credenciales inválidas");
      |             ^ Error: LOGIN FAILED: Credenciales inválidas
  99  |     }
  100 | 
  101 |     // 2. Redirección automática al dashboard (/barber)
  102 |     await expect(page.getByText('Mi Espacio de Trabajo')).toBeVisible({ timeout: 10000 });
  103 |     await expect(page.getByText('Empleado Test')).toBeVisible();
  104 | 
  105 |     // 3. Gestión de Jornada (Clock in / Clock out)
  106 |     const btnIniciarJornada = page.getByRole('button', { name: /Marcar Entrada/i });
  107 |     if (await btnIniciarJornada.isVisible()) {
  108 |       await btnIniciarJornada.click();
  109 |       await expect(page.getByText('Jornada Activa')).toBeVisible();
  110 |     }
  111 |     
  112 |     // 4. Gestión de citas
  113 |     await expect(page.getByText(`Cliente E2E ${uniqueId}`)).toBeVisible();
  114 |     
  115 |     // El estado inicial creado fue 'confirmed', así que el botón debe ser "Iniciar"
  116 |     const btnIniciar = page.locator('button:has-text("Iniciar")').first();
  117 |     await expect(btnIniciar).toBeVisible();
  118 |     await btnIniciar.click();
  119 | 
  120 |     // Luego debe cambiar a "Completar" (estado in-progress)
  121 |     const btnCompletar = page.locator('button:has-text("Completar")').first();
  122 |     await expect(btnCompletar).toBeVisible({ timeout: 5000 });
  123 |     await btnCompletar.click();
  124 | 
  125 |     // Verificar que la cita pasa a completada (aparece el badge de Completada)
  126 |     await expect(page.getByText('Completada')).toBeVisible({ timeout: 5000 });
  127 |     await expect(btnCompletar).toBeHidden();
  128 |   });
  129 | });
  130 | 
```