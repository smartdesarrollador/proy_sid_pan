# Componentes Interactivos Accesibles

Patrones comunes de componentes siguiendo WAI-ARIA (Web Accessibility Initiative).

## 1. Modales (Dialog)

El patrón modal accesible es complejo:
*   **Role**: `dialog` o `alertdialog`.
*   **Focus**: Atrapa foco dentro, retorna foco al trigger al cerrar.
*   **ARIA**: `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
*   **Keyboard**: `Esc` debe cerrar.

**Recomendación:** Usa `@radix-ui/react-dialog` o `@headlessui/react`.

**Ejemplo Manual (simplificado):**

```tsx
function Modal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      prevFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus(); // Foco inicial al modal (div tabIndex=-1)
    } else {
       prevFocus.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      ref={modalRef}
      onKeyDown={handleKeyDown}
      className="modal-backdrop"
    >
      <div className="modal-content">
        <h2 id="modal-title">Título del Modal</h2>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
```

## 2. Acordeones (Accordion)

Patrón simple de header + panel expandible.
*   **Header**: `<button>` dentro de `<h3>` (opcional heading).
*   **Attributes**: `aria-expanded`, `aria-controls`.
*   **Panel**: `role="region"`, `aria-labelledby` (apuntando al botón).

```tsx
function AccordionItem({ title, children, isOpen, onClick }) {
  const contentID = useId();
  const triggerID = useId();

  return (
    <div className="accordion-item">
      <h3>
        <button
          id={triggerID}
          aria-expanded={isOpen}
          aria-controls={contentID}
          onClick={onClick}
          className="accordion-trigger"
        >
          {title}
        </button>
      </h3>
      <div
        id={contentID}
        role="region"
        aria-labelledby={triggerID}
        hidden={!isOpen}
        className="accordion-content"
      >
        {children}
      </div>
    </div>
  );
}
```

## 3. Dropdowns y Menús

Patrón para listas de acciones o navegación.
*   **Trigger**: Button con `aria-haspopup="true"` o `menu`.
*   **List**: `role="menu"` (si son acciones) o `list` (si son links).
*   **Items**: `role="menuitem"` o `a`.

**Navegación con Flechas (Arrow Up/Down):**
Los menús deben soportar navegación con flechas para ser 100% accesibles. Esto requiere `onKeyDown` para mover el foco programáticamente (`menuItemRef.current.focus()`).

**Recomendación:** `@radix-ui/react-dropdown-menu` maneja la compleja lógica de foco/flechas/cierre click-outside.
