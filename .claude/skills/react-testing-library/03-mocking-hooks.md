# Mocking y Hooks

Testing moderno evita mocks cuando es posible para no acoplarse a detalles, pero **MSW** es esencial para mocking de red.

## 1. Mock de API con MSW (Mock Service Worker)

Intercepta las peticiones de red reales (fetch, axios) a nivel de servidor (node) o service worker (browser), devolviendo respuestas controladas.

**Instalación:**
```bash
npm install -D msw
```

**Setup Básico:**
Crea `src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.example.com/user', () => {
    return HttpResponse.json({ name: 'John Doe' });
  }),
  
  http.post('https://api.example.com/login', async ({ request }) => {
    const { username } = await request.json() as { username: string };
    
    if (username === 'admin') return HttpResponse.json({ token: 'abc-123' });
    
    return new HttpResponse('Unauthorized', { status: 401 });
  }),
];
```

**Integración en Tests (Setup Server):**

`src/setupTests.ts` (Vitest/Jest Setup):
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

// Arrancar servidor antes de tests
beforeAll(() => server.listen());

// Resetear handlers entre tests (para mocks específicos en un test)
afterEach(() => server.resetHandlers());

// Apagar al terminar
afterAll(() => server.close());
```

## 2. Mocking de Componentes y Módulos

A veces necesitas mockear un componente pesado (gráfico, mapa) o un hook externo.

**Mock de Componente (Jest/Vitest):**
```typescript
import { render } from '@testing-library/react';

// Si usas Vitest
vi.mock('./components/HeavyChart', () => ({
  default: () => <div data-testid="mock-chart">Chart goes here</div>,
}));

test('renderiza el dashboard con gráfico simulado', () => {
  render(<Dashboard />);
  expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
});
```

**Spy en Funciones (Prop callbacks):**
```typescript
// Jest: jest.fn() / Vitest: vi.fn()
const handleSubmit = vi.fn();

render(<Form onSubmit={handleSubmit} />);
await user.click(screen.getByRole('button'));

expect(handleSubmit).toHaveBeenCalledWith({ name: 'Test' });
```

## 3. Testing de Custom Hooks (`renderHook`)

Para hooks puros que no renderizan UI directa (lógica de negocio).

`npm install -D @testing-library/react-hooks` **(Deprecated en RTL v13+, ahora es parte de @testing-library/react)**

**Uso Moderno (v13+):**
```typescript
import { renderHook, act } from '@testing-library/react';
import useCounter from './hooks/useCounter';

test('incrementa el contador', () => {
  const { result } = renderHook(() => useCounter(0));

  expect(result.current.count).toBe(0);

  // Todo cambio de estado DEBE ir dentro de `act`
  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```
