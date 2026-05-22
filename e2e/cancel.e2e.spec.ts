import test from '@playwright/test';

const { expect } = test;

// Usuario demo cliente — coincide con demo-config.ts
const DEMO_CLIENT = {
  id: 'demo-client-001',
  email: 'client@demo.com',
  role: 'client',
  profile: {
    name: 'Juan Pérez',
    role: 'client',
    phone: '+1234567892',
    avatar_url: null,
  },
};

test.describe('Cancelación de cita - E2E', () => {
  test('Cliente puede cancelar una cita desde su panel', async ({ page }: any) => {
    // 1. Simular sesión demo estableciendo localStorage antes de navegar
    await page.addInitScript((user: typeof DEMO_CLIENT) => {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }, DEMO_CLIENT);

    // 2. Navegar a la página de citas del cliente
    await page.goto('/client/appointments');

    // 3. Esperar que la página cargue (heading único h1)
    await expect(page.getByRole('heading', { name: 'Mis Citas' })).toBeVisible({ timeout: 10000 });

    // 4. Esperar que las citas demo carguen y aparezca el botón de cancelar
    const cancelButton = page.locator('button:has-text("Cancelar")').first();
    await expect(cancelButton).toBeVisible({ timeout: 15000 });
    await cancelButton.click();

    // 5. Verificar que el modal de cancelación aparece
    await expect(page.getByText('Cancelar Cita')).toBeVisible({ timeout: 5000 });

    // 6. Confirmar la cancelación (sin motivo para simplificar)
    await page.click('button:has-text("Confirmar Cancelación")');

    // 7. Verificar que la cita aparece como cancelada (badge/texto "Cancelada")
    await expect(page.getByText('Cancelada').first()).toBeVisible({ timeout: 10000 });
  });
});
