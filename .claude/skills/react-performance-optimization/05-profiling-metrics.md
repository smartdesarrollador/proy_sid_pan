# Profiling y Métricas (Web Vitals)

Medir es el paso cero de cualquier optimización. Sin datos, estás adivinando.

## 1. Web Vitals

**LCP (Largest Contentful Paint)**: Medida de velocidad de carga. < 2.5s es bueno.
**FID (First Input Delay)**: Interactividad. < 100ms es bueno.
**CLS (Cumulative Layout Shift)**: Estabilidad visual. < 0.1 es bueno.

### Medición (`web-vitals` library)

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);
  // (navigator.sendBeacon) envía datos asíncronamente al backend
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    // Fallback
    fetch('/analytics', { body, method: 'POST', keepalive: true });
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
}

// En tu index.tsx:
reportWebVitals();
```

## 2. React DevTools Profiler

Permite grabar una interacción y ver qué componentes renderizaron y por qué.

### Cómo usar
1.  Abre DevTools -> Pestaña **Profiler**.
2.  Haz click en grabar (círculo azul).
3.  Realiza la acción en la UI.
4.  Detén la grabación.
5.  Revisa el **Flamegraph**.

### Métricas Clave en Flamegraph
*   **Barra Gris**: El componente NO renderizó. (Excelente).
*   **Barra de Color (Verde/Amarillo)**: El componente renderizó. Cuanto más tarda, más amarillo.
*   **"Why did this render?"**: Pasa el mouse sobre el componente para ver la razón (ej. "Hooks changed", "Props changed: style").

### Example Analysis
**Problema Detectado**: `HeaderComponent` se renderiza cada vez que escribo en el `FilterInput`.
**Razón**: El componente padre está pasando una prop `onSearch` que es una función nueva en cada render (falta `useCallback`).

**Solución**: Envolver la función `handleSearch` en `useCallback` en el padre.

## 3. Identificar Re-renders Innecesarios

Instala la extensión "React Developer Tools" y activa la opción **"Highlight updates when components render"** en sus ajustes.

**Visualización**:
*   Cada vez que un componente se actualiza, parpadea con un borde de color.
*   Si escribes en un input y **toda la página** parpadea, tienes un problema de re-renderizado global.

## 4. Performance Budget

Establece límites estrictos en tu CI/CD.

```json
// package.json (usando bundlesize)
{
  "bundlesize": [
    {
      "path": "./build/static/js/*.js",
      "maxSize": "150 kB"
    },
    {
      "path": "./build/static/css/*.css",
      "maxSize": "50 kB"
    }
  ],
  "scripts": {
    "check-size": "bundlesize"
  }
}
```
Métrica real: Si un PR aumenta el tamaño del bundle por encima del límite, el build falla.
