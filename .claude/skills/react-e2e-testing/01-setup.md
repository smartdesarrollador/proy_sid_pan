# Setup y Configuración (Playwright)

Playwright es actualmente el framework E2E más robusto gracias a su velocidad, soporte multi-tab/iframe nativo y potentes herramientas de trace.

## 1. Quick Start con Playwright

Para un proyecto React (Vite o Next.js) existente:

```bash
npm init playwright@latest
# Opciones recomendadas:
# - TypeScript: Yes
# - Save tests in: e2e (para separar de tests unitarios src)
# - Add GitHub Actions: Yes
```

## 2. Configuración (`playwright.config.ts`)

Configuración optimizada para CI y desarrollo local.

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true, // Ejecución paralela total (requiere tests aislados)
  forbidOnly: !!process.env.CI, // Falla si olvidaste .only en CI
  retries: process.env.CI ? 2 : 0, // Reintenta 2 veces en CI por flakiness
  workers: process.env.CI ? 1 : undefined, // 1 worker en CI gratis para estabilidad
  reporter: [
    ['html'], // Reporte visual local
    ['list'], // Output consola
    process.env.CI ? ['github'] : ['list'], // Annotations en PRs
  ],
  
  use: {
    /* Base URL para usar caminos relativos en tests */
    baseURL: 'http://localhost:3000',

    /* Trazas completas solo en fallo (súper útil para debugging) */
    trace: 'on-first-retry',
    
    /* Capturas de pantalla solo si falla */
    screenshot: 'only-on-failure',
    
    /* Vídeo solo si falla (pesado) */
    video: 'retain-on-failure',
  },

  /* Configurar navegador y dispositivos móviles */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Arrancar servidor web local antes de tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## 3. Playwright vs Cypress

| Característica | Playwright | Cypress |
| :--- | :--- | :--- |
| **Velocidad** | Muy alta (Parallel execution por defecto) | Media (Secuencial por defecto) |
| **Soporte Navegador** | Multi-browser real (Chrome, FireFox, WebKit) | Chrome, FF (soporte limitado WebKit) |
| **Sintaxis** | `await page.click()` (Promise-based) | `cy.get().click()` (Chained commands) |
| **Multi-tab/Iframe** | Nativo y sencillo | Complejo / Limitado |
| **Network Intercept** | Potente y flexible (`page.route`) | Bueno (`cy.intercept`) |
| **Debugging** | Trace Viewer (Time travel debugging) | Time Travel en UI |

**Recomendación**: Usa **Playwright** para proyectos nuevos por modernidad y estabilidad. Usa **Cypress** si tu equipo ya tiene mucha experiencia en él y no requieres testing complejo (multi-tab).

### Ejemplo Básico (Playwright)

`e2e/example.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/React App/);
});
```
