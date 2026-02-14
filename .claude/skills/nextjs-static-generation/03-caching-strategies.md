# Caching & Fetching Strategies

Los datos determinan el comportamiento estático/dinámico. Aprende a controlar el cache `fetch` y `Cache-Control`.

## 1. Fetch Integration (Data Cache)

Next.js "cachea" las respuestas de `fetch` por defecto (`force-cache`).

### `cache: 'force-cache'` (Default)
Busca en la Data Cache. Si existe, la devuelve. Si no, fetch y guarda **indefinidamente**.
*   **Uso**: Generación Estática (SSG).

### `cache: 'no-store'`
Nunca busca en caché. Fetch nuevo en cada request.
*   **Uso**: Datos puramente dinámicos (SSR), usuarios logueados, datos muy volátiles.

### `next: { revalidate: N }`
Busca en caché. Si es vieja (> N segundos), devuelve stale y revalida en background.
*   **Uso**: ISR, Datos CMS semi-estáticos.

```typescript
async function getData() {
  const res = await fetch('https://api.example.com/products', {
    // Escenarios comunes:
    // SSG (default): cache: 'force-cache'
    // SSR: cache: 'no-store'
    // ISR: next: { revalidate: 3600 }
  });
  
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}
```

## 2. HTTP Caching (Headers)

Además de la Data Cache (servidor), controla la caché del **navegador** y **CDN**.

### Headers Default

Next.js añade automáticamente `Cache-Control` según el renderizado:

*   **Rutas Estáticas**: `s-maxage=31536000, stale-while-revalidate`
*   **Rutas Dinámicas**: `private, no-cache, no-store, max-age=0, must-revalidate`

### Custom Cache-Control

Puedes sobreescribir los headers en `next.config.js` o middleware, pero lo ideal es dejar que Next.js lo maneje basado en `fetch`.

## 3. Estrategias Mixtas (Hybrid Rendering)

Puedes tener una página estática con "agujeros" dinámicos.

### Component-Level Data Fetching

Si un componente hijo hace `fetch({ cache: 'no-store' })`, toda la ruta se vuelve dinámica (SSR), **a menos que** uses `Suspense`.

**Streaming SSR (Static Shell + Dynamic Content):**

```typescript
import { Suspense } from 'react';

// Shell estático (Layout + Headers) se sirve instantáneo
export default function Page() {
  return (
    <section>
      <h1>Mi Dashboard</h1>
      <Suspense fallback={<p>Cargando datos frescos...</p>}>
        {/* Este componente es dinámico pero no bloquea el shell */}
        <DynamicComponent />
      </Suspense>
      <StaticFooter />
    </section>
  );
}
```

*   **Ventaja**: TTFB súper bajo (como SSG).
*   **Contenido fresco**: Datos cargan en paralelo.
