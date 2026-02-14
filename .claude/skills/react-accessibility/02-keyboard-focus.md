# Navegación por Teclado & Focus

La capacidad de usar todo el sitio solo con el teclado (Tab, Shift + Tab, Enter, Space, Arrows, Esc) es fundamental.

## 1. Gestión del Foco (`useRef`)

Controla programáticamente dónde está el foco (ej. abrir modal -> foco en botón de cerrar -> cerrar modal -> foco vuelve al botón que lo abrió).

```tsx
import { useRef, useEffect } from 'react';

function SearchModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus en el input al montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div role="dialog" aria-modal="true">
      <input ref={inputRef} type="search" placeholder="Search..." />
      <button ref={closeBtnRef} onClick={onClose}>Close</button>
    </div>
  );
}
```

## 2. Focus Trap (Modales y Drawer)

Impide que el usuario tabule "fuera" del modal mientras está abierto.

**Recomendación:** Usa `react-focus-lock` o librerías de componentes (Radix UI, Headless UI) que lo traen integrado.

**Implementación Manual (Simplificada):**

```typescript
useEffect(() => {
  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // Lógica para atrapar foco (first -> last -> first)
    // ...
  };
  
  document.addEventListener('keydown', handleTab);
  return () => document.removeEventListener('keydown', handleTab);
}, []);
```

## 3. Skip Links

Permite a usuarios de teclado saltar la navegación repetitiva e ir directo al contenido principal.

```tsx
// App.tsx
<body>
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:z-50">
    Saltar al contenido principal
  </a>
  
  <header>...</header>
  
  <main id="main-content" tabIndex={-1}>
    {/* tabIndex="-1" permite focus programático pero no por teclado */}
    <h1>Bienvenido</h1>
    ...
  </main>
</body>
```

## 4. Estilos de Focus Visibles

Nunca elimines el `outline` sin reemplazarlo.

**❌ MAL:**
```css
*:focus { outline: none; } /* Accesibilidad rota */
```

**✅ BIEN (Tailwind `ring` o custom CSS):**
```css
/* Custom focus indicator */
.btn:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

Usar `:focus-visible` asegura que el indicador solo aparezca para teclado, no mouse (experiencia mejorada).
