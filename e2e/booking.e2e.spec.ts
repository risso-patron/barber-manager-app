import test from '@playwright/test';

const { expect } = test;

test.describe('Reserva de cita - E2E', () => {
  test('Cliente puede completar el flujo de reserva exitosamente', async ({ page }: any) => {
    // 1. Navegar a la página de reserva
    await page.goto('/reservar');
    
    // Esperar a que los servicios carguen
    await expect(page.getByText('Elige el servicio que deseas')).toBeVisible();
    
    // 2. Seleccionar primer servicio (ej: Corte Clásico o cualquier card)
    // Usamos el texto de una de las cards de servicio esperadas del seed
    const serviceCard = page.locator('h3:has-text("Corte")').first();
    await serviceCard.click();
    
    // 3. Seleccionar Barbero
    await expect(page.getByText('Selecciona tu barbero')).toBeVisible();
    // Seleccionar primer barbero disponible
    const barberCard = page.locator('h3').first();
    await barberCard.click();
    
    // 4. Seleccionar Fecha y Hora
    await expect(page.getByText('Selecciona fecha y hora')).toBeVisible();
    
    // Seleccionar la primera fecha disponible
    const dateButton = page.locator('div:has(> label:has-text("Selecciona una fecha")) button').first();
    await expect(dateButton).toBeVisible({ timeout: 10000 });
    await dateButton.click();
    
    // Seleccionar la primera hora disponible
    const timeButton = page.locator('div:has(> label:has-text("Selecciona una hora")) button').first();
    await expect(timeButton).toBeVisible({ timeout: 10000 });
    await timeButton.click();
    
    // 5. Completar información de contacto
    await expect(page.getByText('Tus datos de contacto')).toBeVisible();
    
    // Generar datos únicos para evitar conflictos en múltiples ejecuciones
    const uniqueId = Date.now().toString().slice(-6);
    await page.fill('input[name="name"]', `Usuario Test ${uniqueId}`);
    await page.fill('input[name="email"]', `test${uniqueId}@example.com`);
    await page.fill('input[name="phone"]', `+1555${uniqueId}`);
    
    // 6. Confirmar reserva
    const bookingResponsePromise = page.waitForResponse(
      (response: any) =>
        response.url().includes('/api/bookings/public') &&
        response.request().method() === 'POST',
      { timeout: 20000 }
    );

    await page.click('button:has-text("Confirmar Reserva")');
    const bookingResponse = await bookingResponsePromise;
    expect(bookingResponse.ok()).toBeTruthy();
    
    // 7. Verificar éxito
    await expect(page.getByRole('heading', { name: /¡Reserva Confirmada!/i })).toBeVisible({ timeout: 20000 });
  });
});

