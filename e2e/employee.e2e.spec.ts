import test from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const { expect } = test;

// Setup Supabase client for DB operations (bypass UI)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseKey!, { auth: { persistSession: false } })
  : null;

test.describe('Flujo de Empleado - E2E', () => {
  let employeeId: string;
  let testEmail: string;
  let testPass: string;
  let testClientName: string;

  test.beforeAll(async ({ }, testInfo) => {
    if (!hasSupabaseConfig) {
      testInfo.skip(true, 'Supabase credentials not configured — skipping employee E2E');
      return;
    }
    if (!supabase) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const db = supabase!;
    // Generar credenciales únicas para cada worker/test para evitar colisiones en paralelo
    const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    testEmail = `employee${uniqueId}@example.com`;
    testPass = 'TestPass123!';
    testClientName = `Cliente E2E ${uniqueId}`;

    // Create auth user
    const { data, error } = await db.auth.admin.createUser({
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
    const { error: insertErr } = await db.from('users').insert({
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
    const { data: services } = await db.from('services').select('id').limit(1);
    const serviceId = services?.[0]?.id;
    if (!serviceId) {
      throw new Error('No hay servicios disponibles para asociar al empleado de prueba');
    }
    const { error: esErr } = await db.from('employee_services').insert({ employee_id: employeeId, service_id: serviceId });
    if (esErr && esErr.code !== '23505') console.error("Error inserting employee_service:", esErr);
    
    // 2. Create a pending appointment for today so they have something to "Completar"
    const today = new Date().toISOString().split('T')[0];
    
    // Insert a fresh confirmed appointment
    await db.from('appointments').insert({
      barber_id: employeeId,
      appointment_date: today,
      appointment_time: '12:00',
      status: 'confirmed',
      client_name: testClientName,
      client_phone: uniqueId.slice(0, 10)
    });
  });

  test.afterAll(async () => {
    // Cleanup
    if (!supabase || !employeeId) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const db = supabase!;
    if (employeeId) {
      await db.from('appointments').delete().eq('barber_id', employeeId);
      await db.from('employee_services').delete().eq('employee_id', employeeId);
      await db.from('users').delete().eq('id', employeeId);
      await db.auth.admin.deleteUser(employeeId);
    }
  });

  test('Empleado puede iniciar sesión, ver dashboard y completar una cita', async ({ page }) => {
    // 1. Iniciar sesión
    await page.goto('/auth/login');
    await expect(page.getByText('Inicia sesión en tu cuenta')).toBeVisible();
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPass);
    await page.click('button[type="submit"]');

    // 2. Redirección automática y carga del workspace de empleado
    await expect(page).toHaveURL(/\/(dashboard|barber)/, { timeout: 15000 });
    await page.goto('/barber');
    await expect(page.getByText('Mi Espacio de Trabajo')).toBeVisible({ timeout: 15000 });

    // 3. Gestión de Jornada (Clock in / Clock out)
    const btnIniciarJornada = page.getByRole('button', { name: /Marcar Entrada/i });
    if (await btnIniciarJornada.isVisible()) {
      await btnIniciarJornada.click();
      await expect(page.getByText('Jornada Activa')).toBeVisible();
    }
    
    // 4. Gestión de citas
    await expect(page.getByText(testClientName)).toBeVisible();
    
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
