# Testing Avanzado (API Mocking & Visual)

E2E tradicionalmente usa la API real, pero las APIs mockeadas en Playwright permiten probar escenarios imposibles de reproducir (fallos de servidor, respuestas lentas) y aceleran la suite.

## 1. API Mocking (Intercept Requests)

Intercepta requests y fuerza respuestas controladas.

### `page.route` (Interceptar una ruta específica)

```typescript
test('shows error message when API fails (500)', async ({ page }) => {
  // 1. Interceptar todas las llamadas a /api/products
  await page.route('**/api/products', async (route) => {
    // 2. Responder con un error fake
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Internal Server Error' }),
    });
  });

  // 3. Navegar a la página que hace esa llamada
  await page.goto('/products');

  // 4. Aserción del estado de error visual
  await expect(page.getByRole('alert')).toHaveText('Error loading products: Internal Server Error');
});
```

### Modificar Respuesta (Spy/Modify)
Útil para inyectar datos de prueba en una respuesta real.

```typescript
test('displays special promotion banner based on API flag', async ({ page }) => {
  await page.route('**/api/user/me', async (route) => {
    const response = await route.fetch(); // Hace la llamada real
    const json = await response.json();
    
    // Modifica solo el flag que nos interesa
    json.features.promoBannerEnabled = true;
    
    await route.fulfill({ response, json });
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Special Promotion!')).toBeVisible();
});
```

## 2. Testing de Estados de Carga

Playwright es tan rápido que a veces no ves los loading states. Puedes forzar lentitud.

```typescript
test('shows skeleton loader while fetching data', async ({ page }) => {
  await page.route('**/api/heavy-data', async (route) => {
    // Retrasar respuesta 2 segundos artificialmente
    await new Promise(f => setTimeout(f, 2000));
    await route.fulfill({ json: [] });
  });

  await page.goto('/analytics');
  
  // Verificar que el skeleton está visible
  await expect(page.locator('.skeleton-loader')).toBeVisible();
  
  // Verificar que desaparece después
  await expect(page.locator('.skeleton-loader')).toBeHidden({ timeout: 10000 });
});
```

## 3. Visual Regression Testing

Comparar screenshots para detectar cambios de UI no intencionados.

### Snapshot de Elemento
No captures toda la página si solo te importa un componente.

```typescript
test('button robust styles', async ({ page }) => {
  await page.goto('/components/button');
  const button = page.getByRole('button', { name: 'Primary' });

  // Compara solo el botón, ignorando el resto de la página
  await expect(button).toHaveScreenshot('primary-button.png');
});
```

### Percy / Chromatic (Integración Externa)
Herramientas SaaS como Percy o Chromatic gestionan mejor los snapshots visuales a escala (historico, review UI, múltiples browsers). Playwright se integra fácilmente.

**Ejemplo Percy:**
```bash
npm install --save-dev @percy/playwright
```
```typescript
import percySnapshot from '@percy/playwright';

test('visual check home', async ({ page }) => {
  await page.goto('/');
  await percySnapshot(page, 'Home Page');
});
```
