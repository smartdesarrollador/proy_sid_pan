# Interacciones y Asincronía

Testing Library no solo verifica que las cosas existan, sino que permite interactuar con ellas.

## 1. user-event vs fireEvent

**`@testing-library/user-event`** simula interacciones humanas reales de forma más precisa que **`fireEvent`**.
*   **Recomendación**: Siempre usa `user-event` salvo casos muy específicos.

### Ejemplo de Diferencias

**`fireEvent.click()`**:
> Dispara un evento `click` directo en el elemento. No simula focus, no click en elementos deshabilitados (incluso si tienen `pointer-events: none`).

**`userEvent.click()`**:
> Dispara una secuencia completa: `hover` -> `pointerdown` -> `focus` -> `pointerup` -> `click`.
> Si el botón está `disabled`, el evento NO se dispara, igual que en un navegador real.

### Setup de `user-event` v14+

Siempre llama a `userEvent.setup()` al inicio del test (o en `beforeEach`).

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

test('permite al usuario iniciar sesión', async () => {
  // 1. Setup
  const user = userEvent.setup();
  render(<LoginForm />);

  // 2. Interactuar
  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'test@example.com');

  const passwordInput = screen.getByLabelText(/password/i);
  await user.type(passwordInput, 'password123');

  const submitButton = screen.getByRole('button', { name: /entrar/i });
  await user.click(submitButton);

  // 3. Assert (Esperar resultado)
  expect(await screen.findByText(/bienvenido/i)).toBeInTheDocument();
});
```

### Eventos Comunes

*   `user.click(element)`
*   `user.dblClick(element)`
*   `user.type(element, text)`
*   `user.clear(element)` (Borrar input)
*   `user.selectOptions(element, value)` (Select dropdown)
*   `user.upload(element, file)` (Input file)
*   `user.tab()` (Navegación con teclado) — **Crucial para a11y**

## 2. Testing Asíncrono

React actualiza el DOM de forma asíncrona muchas veces (efectos, promesas).

### waitFor

Espera a que una *expectativa* se cumpla dentro de un timeout por defecto (1000ms).

```typescript
import { waitFor } from '@testing-library/react';

test('muestra mensaje de error si la API falla', async () => {
  // ... simular error de API
  
  await waitFor(() => {
    // Esta aserción se reintentará hasta que pase o expire el tiempo
    expect(screen.getByRole('alert')).toHaveTextContent(/error de red/i);
  });
});
```

**⚠️ Cuándo NO usar `waitFor`:**
*   Para esperar elementos que aparecen: Usa `findByRole` (es un wrapper de `waitFor` + `getByRole`).
*   Para interacciones de usuario: `userEvent` ya es asíncrono y espera lo necesario (en v14).

### Testing de Loading States

```typescript
test('muestra spinner mientras carga y luego la lista', async () => {
  render(<UserList />);

  // 1. Verificar spinner inicial
  expect(screen.getByLabelText(/cargando/i)).toBeInTheDocument();

  // 2. Esperar que desaparezca el spinner (opcional, pero buena práctica si bloquea)
  await waitFor(() => {
    expect(screen.queryByLabelText(/cargando/i)).not.toBeInTheDocument();
  });

  // 3. Verificar que aparecieron los items (findBy espera asíncronamente)
  const items = await screen.findAllByRole('listitem');
  expect(items).toHaveLength(3);
});
```
