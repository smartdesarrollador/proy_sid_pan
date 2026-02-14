# Contexto y Patrones Avanzados

Para tests más complejos donde el componente depende de un `Provider` global (Theme, Auth, Router).

## 1. Custom Render (Providers Globales)

En lugar de envolver cada componente en cada test, crea un helper `customRender` que los inyecte automáticamente.

**Archivo de utilidades (`test-utils.tsx`):**
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from './contexts/Theme';
import { AuthProvider } from './contexts/Auth';
import { MemoryRouter } from 'react-router-dom';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter> {/* Mueve providers obligatorios aquí */}
          {children}
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

// Re-exporta todo de testing-library
export * from '@testing-library/react';

// Sobre-escribe render original
export { customRender as render };
```

**Uso Simplificado en Tests:**
```typescript
import { render, screen } from '../test-utils'; // Importa nuestra versión custom
import { Dashboard } from './Dashboard';

test('renderiza el dashboard con tema y usuario (autenticado por el provider)', async () => {
  render(<Dashboard />); // ¡Ya tiene AuthProvider y ThemeProvider!
  
  // Testea como usuario real
  const welcome = await screen.findByText(/hola/i);
  expect(welcome).toBeInTheDocument();
  expect(welcome).toHaveStyle('color: var(--primary)');
});
```

## 2. Testing de Context (Auth, Theme)

Para contextos muy ligados a lógica (ej. Auth), puedes testear el **Hook de consumo** (`useAuth`) o el **Componente consumidor**.

**Hook Approach (Testing de la Lógica):**
```typescript
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './contexts/Auth';

test('inicia sesión y guarda token', async () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const { result } = renderHook(() => useAuth(), { wrapper });

  await act(async () => {
    await result.current.login('user', 'pass');
  });

  expect(result.current.user).toEqual({ name: 'User' });
  expect(localStorage.getItem('token')).toBe('abc-123');
});
```

## 3. Testing de Accesibilidad

Un buen test con RTL ya cubre mucha a11y (si usas `getByRole`). Para una validación más profunda del DOM renderizado, usa **`jest-axe`**.

**Instalación:**
```bash
npm install -D jest-axe
```

**Setup (`setupTests.ts`):**
```typescript
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

**Test de Accesibilidad:**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginForm } from './LoginForm';

test('el formulario no tiene violaciones de accesibilidad', async () => {
  const { container } = render(<LoginForm />);
  
  // Analiza el HTML renderizado buscando errores comunes (faltan labels, contraste bajo, role inválido)
  const results = await axe(container);
  
  expect(results).toHaveNoViolations();
});
```
