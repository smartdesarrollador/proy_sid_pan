# Flujos Críticos y Aserciones

El corazón de E2E es simular los flujos más importantes para el negocio.

## 1. Testing de Login y Registro

A menudo es el primer flujo que debe funcionar.

### Buenas Prácticas de Login en E2E
*   **No loguees en UI por cada test**: Es lento.
*   **Usa `storageState`**: Loguéate una vez, guarda las cookies/localStorage, y reutiliza el estado en el resto de tests.
*   **Mockea el Login**: Si tu backend lo permite, inyecta el token directamente.

### Login Reutilizable (`global-setup.ts`)

```typescript
// playwright.config.ts -> globalSetup: './global-setup'
import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.getByLabel('User').fill('testuser');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  
  // Esperar a redirigir
  await page.waitForURL('**/dashboard');
  
  // Guardar estado (cookies, local storage)
  await page.context().storageState({ path: 'storageState.json' });
  await browser.close();
}

export default globalSetup;
```

**Usar en Configuración:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    storageState: 'storageState.json', // Todos los tests inician logueados
  },
});
```

## 2. Testing de Operaciones CRUD

Simula la creación, edición y borrado de un ítem. Es crucial limpiar los datos creados (teardown) o usar una base de datos de test efímera.

### Ejemplo: Crear un Producto

```typescript
test('create new product flows correctly', async ({ page }) => {
  await page.goto('/products/new');

  // Input fields
  await page.getByLabel('Product Name').fill('Test Product 101');
  await page.getByLabel('Price').fill('99.99');
  
  // Select dropdown
  await page.getByRole('combobox', { name: 'Category' }).selectOption('Eletronics');

  // Submit
  await page.getByRole('button', { name: 'Create Product' }).click();

  // Aserciones
  // 1. Toast de éxito
  await expect(page.getByText('Product created successfully')).toBeVisible();
  
  // 2. Redirección
  await expect(page).toHaveURL(/\/products\/\d+/); // Regex para ID dinámico
  
  // 3. Datos visibles
  await expect(page.getByRole('heading', { name: 'Test Product 101' })).toBeVisible();
});
```

## 3. Aserciones y Auto-Wait

Playwright espera automáticamente (auto-wait) a que los elementos estén "accionables" (visibles, habilitados, estables) antes de interactuar.

### Aserciones Comunes (Web-First Assertions)

Estas aserciones reintentan automáticamente hasta que pasan o timeout (5s).

*   `await expect(locator).toBeVisible()`
*   `await expect(locator).toHaveText(/regex/)`
*   `await expect(locator).toHaveAttribute('class', /active/)`
*   `await expect(locator).toHaveCount(3)` (Para listas)
*   `await expect(page).toHaveURL(/dashboard/)`
*   `await expect(page).toHaveTitle('My App')`

### Aserciones Visuales (Snapshot Testing)
Compara píxel por píxel con una "imagen base" aprobada.

```typescript
test('landing page visual regression', async ({ page }) => {
  await page.goto('/');
  
  // Toma screenshot y compara con `landing-page-visual-regression-chromium.png`
  await expect(page).toHaveScreenshot({ maxDiffPixels: 100 }); 
});
```
