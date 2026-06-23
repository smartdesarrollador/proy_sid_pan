# Testing — feature del Admin Panel

Stack: Vitest + React Testing Library + MSW + jest-axe. Setup global en `src/test/setup.ts`
(ya configura `axios.defaults.adapter='http'`, `ResizeObserver`, jest-axe, MSW con `onUnhandledRequest:'bypass'`).
El catálogo de gotchas viene de los PASOS 5-21 — son errores que reaparecen en CADA feature nueva.

## Plantilla de test de página

Dos enfoques en el repo: (a) `vi.mock` de los hooks (rápido, sin red), o (b) MSW (integración). El más
usado para páginas es `vi.mock` de los hooks de la feature:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import <X>Page from '../<X>Page'

vi.mock('../hooks/use<Xs>', () => ({
  use<Xs>: () => ({ <recurso>: [{ id: '1', name: 'Demo', status: 'active', created_at: '2026-01-01' }], isLoading: false }),
}))
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true }),   // ajustar para probar gating
}))

describe('<X>Page', () => {
  it('renderiza los registros', () => {
    render(<<X>Page />)
    expect(screen.getByText('Demo')).toBeInTheDocument()
  })
})
```

> Si la página usa `react-router` (navigate) o stores, envolver en los providers necesarios o
> mockearlos como en las features existentes (`clients`, `support`).

## Catálogo de gotchas recurrentes (revisar SIEMPRE)

| Gotcha | Causa | Fix |
|--------|-------|-----|
| `getByText('X')` lanza "multiple elements" | El texto aparece en el badge Y en un filtro/select | `expect(screen.getAllByText('X').length).toBeGreaterThan(0)` |
| Título del modal duplica el botón que lo abre | Mismo texto en botón y heading | Buscar por `getByPlaceholderText` del input, o `getByRole('dialog')` |
| Aserción síncrona falla en componente `lazy` | `React.lazy()` resuelve async → el contenido no está en el render síncrono | NO lazy-cargar componentes aserados en tests síncronos; solo lazy lo condicional (modales de stats) |
| `ResizeObserver is not defined` (Recharts) | jsdom no lo trae | Ya mockeado en `setup.ts` como **clase** (no `vi.fn()`). Si se re-mockea local, usar clase |
| `react-virtual` lista vacía en tests | `getScrollElement()` da altura 0 en jsdom → `getVirtualItems()` = [] | Fallback: renderizar todas las filas cuando `virtualItems.length===0 && rows.length>0` |
| Zod `invalid_type_error` no aplica | Zod v4 cambió la API | Usar `z.number({ error: 'mensaje' })` (NO `invalid_type_error`) |
| `mutate(id)` → assert falla con `expect.any(Object)` | La mutación se llama solo con el id, sin callbacks | `expect(fn).toHaveBeenCalledWith(id)` sin segundo arg |
| Búsqueda en test no encuentra match | El string no es substring real del campo | Usar un substring que exista de verdad (p.ej. `view_custom` ∈ `view_customuser`) |
| MSW no intercepta / ECONNREFUSED | URL del handler ≠ URL del cliente (slash/host) | Handler con URL completa `http://localhost:8000/api/v1/...` y misma slash que el código (LL-060) |
| a11y: heading-order / empty `<th>` / select sin label | WCAG en jest-axe | `<h2>` en cards (no `<h3>` tras `<h1>`); columna de acciones con nombre ('Acciones', no vacía); `aria-label` en selects e icon-buttons |

## Accesibilidad (si la feature añade test de a11y)

```tsx
import { axe } from 'jest-axe'
import { axeConfig } from '@/test/setup'   // RunOptions con color-contrast desactivado

it('sin violaciones a11y', async () => {
  const { container } = render(<<X>Page />)
  expect(await axe(container, axeConfig)).toHaveNoViolations()
})
```
> `axeConfig` es un `RunOptions` crudo (no `configureAxe()`). Modales: `role="dialog"
> aria-modal="true" aria-labelledby="<x>-modal-title"` + `useFocusTrap`.

## Verificación final (paso 7 del workflow)

```bash
cd apps/frontend_admin
npm run typecheck && npm test && npm run build
```
Los tres deben pasar. El `build` corre `tsc` estricto y bloquea por errores que el dev server tolera
(ver `lessons-learned` LL-079: is_staff en mocks, slug vs subdomain, zodResolver, casts de mocks).
