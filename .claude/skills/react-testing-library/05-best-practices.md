# Mejores Prácticas

Un código bien testeado es aquel donde los cambios internos (refactoring) NO rompen los tests.

## 1. Estructura AAA (Arrange-Act-Assert)

Mantén tus tests legibles separando claramente las fases.

```typescript
test('permite al usuario añadir un item al carrito', async () => {
  // 1. Arrange (Preparar)
  const product = { id: '1', name: 'Zapatos', price: 99 };
  render(<ProductPage product={product} />);
  const user = userEvent.setup();

  // 2. Act (Actuar)
  const addToCartButton = screen.getByRole('button', { name: /añadir al carrito/i });
  await user.click(addToCartButton);

  // 3. Assert (Verificar)
  expect(screen.getByText(/1 item añadido/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /ver carrito/i })).toBeEnabled();
});
```

## 2. Qué Testear y Qué NO Testear

**👍 TESTEA:**
*   **Comportamiento del usuario**: Click en botón -> Abre modal.
*   **Efectos visuales**: Aparece un spinner, mensaje de error.
*   **Accesibilidad básica**: Labels correctos, roles semánticos.
*   **Integración**: Formulario envía datos correctos a la API (mockeada).

**👎 NO TESTEES:**
*   **Detalles de implementación**: `component.state.isOpen === true`.
*   **Librerías de terceros**: Si `react-select` funciona bien (eso ya lo testearon ellos). Testea *tu* uso de ella.
*   **Tipos de datos estáticos**: TypeScript ya valida que `user.name` sea string.

## 3. Evitar Falsos Positivos

Un falso positivo ocurre cuando un test pasa pero la funcionalidad está rota, o viceversa (falso negativo: funcionalidad OK, test falla por detalle irrelevante).

**Ejemplo de Falso Positivo (Usando selectores frágiles):**

```typescript
// ❌ Frágil: Si cambias el HTML de <div> a <span>, el test rompe aunque funcione igual.
// O si cambias la clase CSS.
const title = container.querySelector('.page-title');
expect(title.textContent).toBe('Dashboard');
```

**Solución (Usando Roles):**

```typescript
// ✅ Robusto: Si cambias <h1> a <h2> o <div> (con role="heading"), sigue pasando.
// Lo importante es la semántica y el contenido visible.
const title = screen.getByRole('heading', { name: /dashboard/i });
expect(title).toBeInTheDocument();
```

## 4. Coverage

No persigas el 100% de coverage ciegamente.
*   **Line Coverage**: Poco útil. Puedes ejecutar una línea sin verificar nada.
*   **Branch Coverage**: Más útil (testear if/else).
*   **Use Case Coverage**: Lo más importante. ¿Cubriste los flujos principales (happy path + errores comunes)?

**Configuración recomendada en `package.json` o `vitest.config.ts`:**
```json
"coverage": {
  "provider": "v8", // o "istanbul"
  "reporter": ["text", "json", "html"],
  "exclude": [
    "node_modules/",
    "src/setupTests.ts",
    "**/*.d.ts",
    "**/index.ts" // Archivos barril suelen bajar coverage innecesariamente
  ]
}
```
