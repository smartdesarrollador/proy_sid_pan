# Formularios & Feedback

Accesibilidad en formularios con enfoque en validación y live regions.

## 1. Validación de Formularios y Mensajes de Error

Usa ARIA para conectar inputs, mensajes de error y descripciones.

```tsx
function Input({ label, error, helperText, ...props }: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className="input-field">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        // Conecta error y helper text
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        // Marca input como inválido
        aria-invalid={!!error}
        // Marca campo como obligatorio
        aria-required={props.required}
        {...props}
      />
      
      {helperText && !error && (
        <span id={helperId} className="helper-text">{helperText}</span>
      )}

      {error && (
        <span id={errorId} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

## 2. Live Regions (`aria-live`)

Notifica a los screen readers de cambios dinámicos sin mover el foco.

*   `aria-live="polite"` (Alertas no críticas, espera al final de la frase).
*   `aria-live="assertive"` (Alertas críticas, interrumpe al lector).

```tsx
function Notification({ message, type }: { message: string, type: 'info' | 'error' }) {
    if (!message) return null;

    return (
        <div 
           // Usa 'status' (implica polite) o 'alert' (implica assertive)
           role={type === 'error' ? 'alert' : 'status'}
           className={`notification ${type}`}
        >
            {message}
        </div>
    );
}
```

**Ejemplo de Loading State Accesible:**
```tsx
<button aria-disabled={isLoading} onClick={handleSubmit}>
  {isLoading ? 'Guardando...' : 'Guardar'}
  <span className="sr-only" aria-live="polite">
      {isLoading ? 'Cargando, por favor espere' : ''}
  </span>
</button>
```

## 3. Feedback Visual (Color)

Nunca uses **solo color** para transmitir información (ej. borde rojo en input inválido). Añade icono (⚠️) o texto ("Campo requerido").

**Contraste (WCAG AA):**
Ratio mínimo 4.5:1 para texto normal, 3:1 para texto grande/UI components.
