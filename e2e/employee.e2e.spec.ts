import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase client for DB operations (bypass UI)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

test.describe('Flujo de Empleado - E2E', () => {
  let employeeId: string;
  let testEmail: string;
  let testPass: string;

  test.beforeAll(async () => {
    // Generar credenciales únicas para cada worker/test para evitar colisiones en paralelo
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    testEmail = `employee${uniqueId}@example.com`;
    testPass = 'TestPass123!';

    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPass,
      email_confirm: true,
      user_metadata: { name: 'Empleado Test' }
    });
    
    if (error && error.message.indexOf('already registered') === -1) {
      throw error;
    }
    
    employeeId = data.user!.id;

    // Ensure they are in the public.users table as an employee
    const { error: insertErr } = await supabase.from('users').insert({
      id: employeeId,
      email: testEmail,
      name: 'Empleado Test',
      role: 'employee',
      phone: uniqueId.slice(0, 10)
    });
    if (insertErr) {
      console.error("Error inserting user:", insertErr);
      throw insertErr;
    }
    
    // Ensure the employee offers at least one service so they can receive appointments
    const { data: services } = await supabase.from('services').select('id').limit(1);
    if (services && services.length > 0) {
      const serviceId = services[0].id;
      const { error: esErr } = await supabase.from('employee_services').insert({ employee_id: employeeId, service_id: serviceId });
      if (esErr && esErr.code !== '23505') console.error("Error inserting employee_service:", esErr);
    }
    
    // 2. Create a pending appointment for today so they have something to "Completar"
    const today = new Date().toISOString().split('T')[0];
    
    // Insert a fresh confirmed appointment
    await supabase.from('appointments').insert({
      barber_id: employeeId,
      appointment_date: today,
      appointment_time: '12:00',
      status: 'confirmed',
      client_name: `Cliente E2E ${uniqueId}`,
      client_phone: uniqueId.slice(0, 10)
    });
  });

  test.afterAll(async () => {
    // Cleanup
    if (employeeId) {
      await supabase.from('appointments').delete().eq('barber_id', employeeId);
      await supabase.from('employee_services').delete().eq('employee_id', employeeId);
      await supabase.from('users').delete().eq('id', employeeId);
      await supabase.auth.admin.deleteUser(employeeId);
    }
  });

  test('Empleado puede iniciar sesión, ver dashboard y completar una cita', async ({ page }) => {
    // 1. Iniciar sesión
    await page.goto('/auth/login');
    await expect(page.getByText('Inicia sesión en tu cuenta')).toBeVisible();
    
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'Demo1234');
    await page.click('button[type="submit"]');
    
    // Wait for network idle or 5 seconds to see what happened
    await page.waitForTimeout(5000);

    console.log("URL AFTER 5s:", page.url());
    const pageText = await page.innerText('body');
    console.log("PAGE TEXT:", pageText);

    if (pageText.includes('Credenciales inválidas')) {
      throw new Error("LOGIN FAILED: Credenciales inválidas");
    }

    // 2. Redirección automática al dashboard (/barber)
    await expect(page.getByText('Mi Espacio de Trabajo')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Empleado Test')).toBeVisible();

    // 3. Gestión de Jornada (Clock in / Clock out)
    const btnIniciarJornada = page.getByRole('button', { name: /Marcar Entrada/i });
    if (await btnIniciarJornada.isVisible()) {
      await btnIniciarJornada.click();
      await expect(page.getByText('Jornada Activa')).toBeVisible();
    }
    
    // 4. Gestión de citas
    await expect(page.getByText(`Cliente E2E ${uniqueId}`)).toBeVisible();
    
    // El estado inicial creado fue 'confirmed', así que el botón debe ser "Iniciar"
    const btnIniciar = page.locator('button:has-text("Iniciar")').first();
    await expect(btnIniciar).toBeVisible();
    await btnIniciar.click();

    // Luego debe cambiar a "Completar" (estado in-progress)
    const btnCompletar = page.locator('button:has-text("Completar")').first();
    await expect(btnCompletar).toBeVisible({ timeout: 5000 });
    await btnCompletar.click();

    // Verificar que la cita pasa a completada (aparece el badge de Completada)
    await expect(page.getByText('Completada')).toBeVisible({ timeout: 5000 });
    await expect(btnCompletar).toBeHidden();
  });
});
