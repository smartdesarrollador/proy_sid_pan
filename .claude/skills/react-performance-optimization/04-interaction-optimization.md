# Optimización de Interacciones

Las interacciones del usuario (escribir, scroll, resize) pueden disparar demasiados eventos, saturando el main thread.

## Debounce vs Throttle

*   **Debounce**: Ejecuta la función *después* de que se detienen los eventos por un tiempo (ej. Autocompletar).
*   **Throttle**: Ejecuta la función *como máximo* una vez cada X tiempo (ej. Scroll listener).

## Custom Hooks: useDebounce

**1. Input de Búsqueda (Problema)**:
```tsx
const SearchInput = ({ onChange }) => (
  // Dispara 'onChange' en cada pulsación -> API call en cada letra
  <input onChange={(e) => onChange(e.target.value)} />
);
```

**2. Solución con `useDebounce`**:
```tsx
import { useState, useEffect } from 'react';

// Hook Genérico
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Seteamos un timer cada vez que el valor cambia
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelamos el timer anterior si value cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Uso en Componente
export const SearchWithDebounce = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

  useEffect(() => {
    if (debouncedSearchTerm) {
      console.log('Realizando búsqueda API:', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]); // Solo se dispara tras 500ms de inactividad

  return <input onChange={(e) => setSearchTerm(e.target.value)} />;
};
```

**Métricas:**
*   Sin debounce: 10 API calls para escribir "React Perf".
*   Con debounce (500ms): 1 API call al terminar de escribir.

## useThrottle para Scroll/Resize

```tsx
import { useRef, useEffect, useCallback } from 'react';

function useThrottle(callback: (...args: any[]) => void, delay: number) {
  const lastRun = useRef<number>(Date.now());

  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
}

// Uso
const ScrollComponent = () => {
  const handleScroll = useThrottle(() => {
    console.log('Scroll event processed', window.scrollY);
  }, 100); // Máximo 10fps de logs

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <div style={{ height: '200vh' }}>Scroll me</div>;
};
```
