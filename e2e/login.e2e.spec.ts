import test from '@playwright/test';

const { expect } = test;

test.describe('Login cliente - E2E', () => {
  test('Cliente puede iniciar sesión con credenciales demo', async ({ page }: any) => {
    // 1. Navegar a la página de login
    await page.goto('/auth/login');

    // 2. Esperar que el formulario esté listo
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 3. Ingresar credenciales del usuario demo cliente
    await page.fill('input[type="email"]', 'client@demo.com');
    await page.fill('input[type="password"]', 'Demo1234');

    // 4. Hacer submit
    await page.click('button[type="submit"]');

    // 5. Verificar que redirige al dashboard (demo login no usa Supabase)
    await expect(page).toHaveURL(/\/(dashboard|client)/, { timeout: 10000 });
  });
});
