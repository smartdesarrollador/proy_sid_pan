# HTML Semántico & ARIA

La base de la accesibilidad es usar el HTML nativo correctamente. Si usas el elemento adecuado, obtienes el 80% de la accesibilidad (teclado, roles, focus) gratis.

## 1. Tags Nativos vs Divs

### Botones y Enlaces

*   **`<button>`**: Acciones en la misma página (abrir modal, submit, toggle).
    *   Soporta `Enter` y `Space` nativamente.
    *   Recibe foco.
*   **`<a>`**: Navegación a otra página o ancla (`href`).
    *   Soporta `Enter`.

**❌ MAL (Accessibility Fail):**
```tsx
// No accesible por teclado, role incorrecto
<div onClick={submitForm} className="btn">Enviar</div>
```

**✅ BIEN (Nativo):**
```tsx
<button onClick={submitForm} className="btn">Enviar</button>
```

### Landmarks (Regiones)

Ayudan a los lectores de pantalla a saltar secciones.

*   `<header>` (banner)
*   `<nav>` (navigation)
*   `<main>` (main)
*   `<footer>` (contentinfo)
*   `<aside>` (complementary)
*   `<section>` (region con `aria-label`/`aria-labelledby`)

```tsx
<header>
  <nav aria-label="Menú principal">...</nav>
</header>
<main>
  <h1>Título Principal</h1>
  <section aria-labelledby="news-heading">
    <h2 id="news-heading">Noticias</h2>
    ...
  </section>
</main>
```

## 2. Atributos ARIA (Roles, Labels, State)

Usa ARIA solo cuando el HTML nativo no sea suficiente ("Primera regla de ARIA").

### `aria-label` vs `aria-labelledby`

*   **`aria-label="Cerrar"`**: Cuando no hay texto visible (ej. icono "X").
*   **`aria-labelledby="modal-title"`**: Cuando el texto ya existe en otro elemento.

```tsx
// Botón con icono, necesita label
<button aria-label="Cerrar menú">
  <IconX />
</button>

// Modal referenciando su título
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirmar Eliminación</h2>
  ...
</div>
```

### Estados y Propiedades

*   **`aria-expanded={true|false}`**: Para menús desplegables, acordeones.
*   **`aria-controls="id-del-panel"`**: Indica qué elemento controla este botón.
*   **`aria-current="page"`**: Indica el enlace activo en navegación.
*   **`aria-hidden="true"`**: Oculta elementos decorativos a screen readers.

```tsx
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <button
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-controls="menu-dropdown"
    >
      Opciones
    </button>
    
    <ul id="menu-dropdown" hidden={!isOpen}>
      <li><a href="/profile">Perfil</a></li>
    </ul>
  </>
);
```

### Roles

Sobreescriben la semántica nativa (úsalo con cuidado).

```tsx
// Convierte un div en un botón (necesitas manejar teclado manualmente)
<div role="button" tabIndex={0} onKeyDown={handleKey}>Click me</div>

// Alert (anuncia inmediatamente)
<div role="alert">Error de conexión</div>
```
