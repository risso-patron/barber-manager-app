# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.e2e.spec.ts >> Reserva de cita - E2E >> Cliente puede completar el flujo de reserva exitosamente
- Location: e2e\booking.e2e.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/¡Reserva Confirmada!/i)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/¡Reserva Confirmada!/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - button "Volver al inicio" [ref=e5] [cursor=pointer]:
        - img
        - text: Volver al inicio
      - heading "Reserva tu cita" [level=1] [ref=e6]
      - paragraph [ref=e7]: Proceso simple en 4 pasos
    - generic [ref=e8]:
      - generic [ref=e9]: 1. Servicio
      - img [ref=e10]
      - generic [ref=e12]: 2. Barbero
      - img [ref=e13]
      - generic [ref=e15]: 3. Fecha/Hora
      - img [ref=e16]
      - generic [ref=e18]: 4. Contacto
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]:
          - img [ref=e22]
          - text: Tus datos de contacto
        - generic [ref=e24]: Solo necesitamos tu nombre y teléfono para confirmar tu cita
      - generic [ref=e26]:
        - generic [ref=e27]:
          - text: Nombre completo *
          - textbox "Nombre completo *" [ref=e28]:
            - /placeholder: Juan Pérez
            - text: Usuario Test 119519
        - generic [ref=e29]:
          - text: Teléfono / WhatsApp *
          - textbox "Teléfono / WhatsApp *" [ref=e30]:
            - /placeholder: +507 6456-0263
            - text: "+1555119519"
          - paragraph [ref=e31]: Te enviaremos un recordatorio por WhatsApp
        - generic [ref=e32]:
          - text: Email (opcional)
          - textbox "Email (opcional)" [ref=e33]:
            - /placeholder: tu@email.com
            - text: test119519@example.com
        - generic [ref=e35]:
          - heading "Resumen de tu cita:" [level=4] [ref=e36]
          - list [ref=e37]:
            - listitem [ref=e38]:
              - text: 📋
              - strong [ref=e39]: "Servicio:"
              - text: Corte + Barba
            - listitem [ref=e40]:
              - text: 💈
              - strong [ref=e41]: "Barbero:"
              - text: Barbero Demo
            - listitem [ref=e42]:
              - text: 📅
              - strong [ref=e43]: "Fecha:"
              - text: jueves, 21 de mayo de 2026
            - listitem [ref=e44]:
              - text: 🕐
              - strong [ref=e45]: "Hora:"
              - text: 09:00
            - listitem [ref=e46]:
              - text: 💰
              - strong [ref=e47]: "Precio:"
              - text: $28
        - generic [ref=e48]:
          - button "Atrás" [ref=e49] [cursor=pointer]:
            - img
            - text: Atrás
          - button "Guardando..." [disabled]:
            - img
            - text: Guardando...
  - button "Open Next.js Dev Tools" [ref=e55] [cursor=pointer]:
    - img [ref=e56]
  - alert [ref=e59]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Reserva de cita - E2E', () => {
  4  |   test('Cliente puede completar el flujo de reserva exitosamente', async ({ page }) => {
  5  |     // 1. Navegar a la página de reserva
  6  |     await page.goto('/reservar');
  7  |     
  8  |     // Esperar a que los servicios carguen
  9  |     await expect(page.getByText('Elige el servicio que deseas')).toBeVisible();
  10 |     
  11 |     // 2. Seleccionar primer servicio (ej: Corte Clásico o cualquier card)
  12 |     // Usamos el texto de una de las cards de servicio esperadas del seed
  13 |     const serviceCard = page.locator('h3:has-text("Corte")').first();
  14 |     await serviceCard.click();
  15 |     
  16 |     // 3. Seleccionar Barbero
  17 |     await expect(page.getByText('Selecciona tu barbero')).toBeVisible();
  18 |     // Seleccionar primer barbero disponible
  19 |     const barberCard = page.locator('h3').first();
  20 |     await barberCard.click();
  21 |     
  22 |     // 4. Seleccionar Fecha y Hora
  23 |     await expect(page.getByText('Selecciona fecha y hora')).toBeVisible();
  24 |     
  25 |     // Seleccionar la primera fecha disponible
  26 |     const dateButton = page.locator('div:has(> label:has-text("Selecciona una fecha")) button').first();
  27 |     await expect(dateButton).toBeVisible({ timeout: 10000 });
  28 |     await dateButton.click();
  29 |     
  30 |     // Seleccionar la primera hora disponible
  31 |     const timeButton = page.locator('div:has(> label:has-text("Selecciona una hora")) button').first();
  32 |     await expect(timeButton).toBeVisible({ timeout: 10000 });
  33 |     await timeButton.click();
  34 |     
  35 |     // 5. Completar información de contacto
  36 |     await expect(page.getByText('Tus datos de contacto')).toBeVisible();
  37 |     
  38 |     // Generar datos únicos para evitar conflictos en múltiples ejecuciones
  39 |     const uniqueId = Date.now().toString().slice(-6);
  40 |     await page.fill('input[name="name"]', `Usuario Test ${uniqueId}`);
  41 |     await page.fill('input[name="email"]', `test${uniqueId}@example.com`);
  42 |     await page.fill('input[name="phone"]', `+1555${uniqueId}`);
  43 |     
  44 |     // 6. Confirmar reserva
  45 |     await page.click('button:has-text("Confirmar Reserva")');
  46 |     
  47 |     // 7. Verificar éxito
  48 |     // Esperamos a que la petición a la API termine (puede tardar un par de segundos)
> 49 |     await expect(page.getByText(/¡Reserva Confirmada!/i)).toBeVisible({ timeout: 15000 });
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  50 |   });
  51 | });
  52 | 
  53 | 
```