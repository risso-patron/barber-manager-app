import { test, expect } from '@playwright/test';

test.describe('Reserva de cita - E2E', () => {
  test('Cliente puede reservar una cita exitosa', async ({ page }) => {
    await page.goto('http://localhost:3000/reservar');
    await page.fill('input[name="fecha"]', '2099-12-31');
    await page.fill('input[name="hora"]', '10:00');
    await page.selectOption('select[name="servicio"]', { label: 'Corte' });
    await page.click('button[type="submit"]');
    await expect(page.getByText(/confirmación|reserva exitosa/i)).toBeVisible();
  });

  test('No permite reservar en horario ocupado', async ({ page }) => {
    await page.goto('http://localhost:3000/reservar');
    await page.fill('input[name="fecha"]', '2099-12-31');
    await page.fill('input[name="hora"]', '10:00');
    await page.selectOption('select[name="servicio"]', { label: 'Corte' });
    await page.click('button[type="submit"]');
    // Intentar reservar el mismo horario otra vez
    await page.reload();
    await page.fill('input[name="fecha"]', '2099-12-31');
    await page.fill('input[name="hora"]', '10:00');
    await page.selectOption('select[name="servicio"]', { label: 'Corte' });
    await page.click('button[type="submit"]');
    await expect(page.getByText(/ocupado|no disponible|error/i)).toBeVisible();
  });
});
