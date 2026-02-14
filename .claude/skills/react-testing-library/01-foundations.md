# Fundamentos y Queries

React Testing Library (RTL) fomenta buenas prácticas de testing probando la aplicación de la misma manera que lo haría un usuario.

## 1. Filosofía
> "The more your tests resemble the way your software is used, the more confidence they can give you." - Kent C. Dodds

*   No testes detalles de implementación (nombres de funciones internas, estados, tipos de props).
*   Testea **comportamiento observable**: lo que el usuario ve y con lo que interactúa.

## 2. Setup (Jest/Vitest)

Para un proyecto con TypeScript, asegúrate de tener las dependencias correctas.

### Vitest (Recomendado hoy en día)
Es más rápido y compatible con Vite.

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**`vitest.config.ts`**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true, // Para usar 'describe', 'it', 'expect' sin importar
    setupFiles: './src/setupTests.ts',
  },
});
```

**`src/setupTests.ts`**:
```typescript
import '@testing-library/jest-dom'; // Extiende expect con matchers como .toBeInTheDocument()
```

## 3. Tipos de Queries: getBy vs queryBy vs findBy

Elegir la query correcta es el 80% del éxito en RTL.

| Prefijo | Síncrono/Async | Lanza Error (si no encuentra) | Retorna Null (si no encuentra) | Uso Principal |
| :--- | :--- | :--- | :--- | :--- |
| **getBy...** | Síncrono | ✅ Sí | ❌ No | Verificar elementos que **deben** existir. |
| **queryBy...** | Síncrono | ❌ No | ✅ Sí | Verificar elementos que **NO** deben existir. |
| **findBy...** | Asíncrono (Promise) | ✅ Sí (tras timeout) | ❌ No | Esperar elementos que aparecerán **asíncronamente**. |

### Sufijos (Prioridad de Selección)

Siempre prefiere las queries accesibles:

1.  **`...ByRole`**: La mejor opción. Tal como lo ve un lector de pantalla (`button`, `heading`, `link`, `textbox`).
    *   `getByRole('button', { name: /enviar/i })`
2.  **`...ByLabelText`**: Para inputs de formularios.
    *   `getByLabelText(/nombre de usuario/i)`
3.  **`...ByPlaceholderText`**: Si no hay label (menos ideal).
4.  **`...ByText`**: Para contenido no interactivo (divs, spans).
5.  **`...ByTestId`**: ÚLTIMO RECURSO. Úsalo solo si no puedes seleccionar por rol o texto.
    *   `getByTestId('custom-element')`

### Ejemplos Prácticos

**Verificar que un botón existe:**
```typescript
// ✅ Correcto (Accesible)
const button = screen.getByRole('button', { name: /guardar/i });
expect(button).toBeInTheDocument();

// ❌ Incorrecto (Detalle de implementación, frágil)
const button = container.querySelector('.btn-primary');
```

**Verificar que un elemento NO existe (ej. modal cerrado):**
```typescript
// ✅ queryBy retorna null si no lo encuentra
const modal = screen.queryByRole('dialog');
expect(modal).not.toBeInTheDocument();

// ❌ getBy lanzaría un error aquí, fallando el test inmediatamente
```

**Esperar que aparezca un mensaje de éxito (Async):**
```typescript
// ✅ findBy reintenta hasta que el elemento aparece o expira el timeout (1000ms default)
const successMessage = await screen.findByText(/guardado exitosamente/i);
expect(successMessage).toBeVisible();
```
