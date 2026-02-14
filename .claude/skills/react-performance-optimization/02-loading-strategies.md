# Estrategias de Carga (Loading Strategies)

La optimización del bundle inicial es crucial para reducir el LCP (Largest Contentful Paint) y mejorar la experiencia en dispositivos móviles.

## 1. Code Splitting

Divide tu aplicación en chunks más pequeños que se cargan bajo demanda.

### React.lazy y Suspense

Carga componentes de forma diferida.

**Antes (Import estático):**
```tsx
import HeavyComponent from './HeavyComponent'; // 🔴 Se carga en el bundle principal
```

**Después (Carga diferida):**
```tsx
import React, { Suspense } from 'react';

// ✅ Se descarga solo cuando se necesita
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<div>Cargando...</div>}>
    <HeavyComponent />
  </Suspense>
);
```

### Route-Based Splitting

Divide el código por rutas de navegación.

```tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./routes/Home'));
const Settings = lazy(() => import('./routes/Settings'));

const App = () => (
  <Router>
    <Suspense fallback={<div>Cargando páginas...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  </Router>
);
```

**Métricas Reales:**
*   **Initial Bundle Size:** Reducción de 2.5MB a 400KB al cargar `Settings` en chunk separado.
*   **LCP:** Reducción de 3.2s a 1.1s.

## 2. Lazy Loading de Imágenes

Carga imágenes solo cuando entran en el viewport.

### Intersection Observer Pattern

```tsx
import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Deja de observar una vez cargada
        }
      });
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} style={{ minHeight: '200px', backgroundColor: '#eee' }}>
      {isVisible ? <img src={src} alt={alt} /> : null}
    </div>
  );
};
```

**Native Lazy Loading:**
```tsx
<img src="large-image.jpg" loading="lazy" alt="Optimized" />
```
*Soporte nativo en la mayoría de navegadores modernos.*

## 3. Bundle Analysis

### Herramientas
*   **webpack-bundle-analyzer**: Visualiza el tamaño de cada módulo en tu bundle final.
*   **source-map-explorer**: Analiza el código fuente a partir de los source maps.

### Identificar Bloat
1.  **Duplicate Dependencies**: Usa `yarn why <package>` o `npm explain <package>` para ver por qué se incluye una librería.
2.  **Large Dependencies**: Reemplaza librerías grandes (ej. `moment.js` -> `date-fns`) o importa solo lo necesario (`lodash` -> `lodash/debounce`).

**Ejemplo de Optimización (Lodash):**

**Antes (Import completo):**
```tsx
import _ from 'lodash'; // 🔴 Importa toda la librería (70KB+)
_.debounce(...)
```

**Después (Tree Shaking friendly):**
```tsx
import debounce from 'lodash/debounce'; // ✅ Importa solo la función (2KB)
```
