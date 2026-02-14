# CI/CD y Debugging

Configura tu pipeline para que Playwright se ejecute en cada PR y debugging local.

## 1. Integración con GitHub Actions

Carga automáticamente (si eliges "Add GitHub Actions" en el init de Playwright) un archivo `.github/workflows/playwright.yml`.

### Workflow Optimizado (`.github/workflows/e2e.yml`)

```yaml
name: Playwright Tests
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Instalar navegadores Playwright (solo binarios necesarios)
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      # Ejecutar tests (headless por defecto en CI)
      - name: Run Playwright tests
        run: npx playwright test

      # Guardar reporte (solo si falla, o siempre si quieres histórico)
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Ejecución en Paralelo (Sharding)

Para suites grandes, divide los tests en múltiples runners ("shards").

En GitHub Actions, usa una matriz para ejecutar 1/3, 2/3, 3/3 en paralelo.

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3] # Ejecutar 3 jobs paralelos (shards)
        shardTotal: [3]
    steps:
      # ... (steps anteriores)
      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

## 2. Debugging con Trace Viewer

Playwright Trace Viewer es una herramienta GUI imprescindible. Te muestra capturas de pantalla, requests de red y consola **paso a paso** para cada acción del test.

### Activación Local

Si un test falla en CI, descarga el `playwright-report` (artifact) y ábrelo localmente. Los reportes HTML incluyen el trace embebido.

**Para debuggear localmente:**
```bash
# Ejecutar tests y generar reporte con trace
npx playwright test --trace on

# Abrir el último reporte
npx playwright show-report
```

### Debugging Interactivo (VS Code Extension)

1.  Instala la extensión "Playwright Test for VSCode".
2.  Pon un breakpoint en tu código (`await page.pause()` o punto rojo en el editor).
3.  Click derecho en el test -> "Debug Test".
4.  Se abrirá un navegador controlado donde puedes inspeccionar el DOM en tiempo real.

### Video Recording

Configura `video: 'retain-on-failure'` en `playwright.config.ts`.
Si un test falla en CI, tendrás un `.webm` mostrando exactamente qué pasó.

**Nota**: El vídeo es pesado. Úsalo con cuidado en CI si tienes límites de almacenamiento/ancho de banda.
