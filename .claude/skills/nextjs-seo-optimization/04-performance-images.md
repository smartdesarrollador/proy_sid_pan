# Performance & Images

El rendimiento (Core Web Vitals) afecta directamente al ranking de búsqueda.

## 1. Optimización de Imágenes (`next/image`)

Evita el LCP (Largest Contentful Paint) pobre usando el componente nativo.

### LCP Optimization

Si tienes una imagen "Above the fold" (visible al cargar), dálle prioridad.

```typescript
import Image from 'next/image';

export default function Hero() {
  return (
    <section>
      <h1>Título Importante</h1>
      <Image
        src="/hero-image.jpg"
        alt="Descripción clara para SEO y accesibilidad"
        width={1200}
        height={600}
        priority // 🔥 Crucial: Carga inmediatamente (mejora LCP)
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={80} // Reduce tamaño sin perder calidad visual
      />
    </section>
  );
}
```

### Lazy Loading (Default)

Para imágenes "Below the fold" (no visibles inicialmente), Next.js las carga perezosamente (`lazy`) por defecto, ahorrando ancho de banda. No necesitas hacer nada extra, solo no uses `priority`.

## 2. Core Web Vitals (CWV)

Métricas que Google observa:

| Métrica | Qué Mide | Meta | Optimización Clave |
| :--- | :--- | :--- | :--- |
| **LCP** | Velocidad de Carga (Principal) | < 2.5s | Optimizar imágenes, evitar bloqueos de JS/CSS. |
| **FID/INP** | Interactividad | < 200ms | Reducir JS en main thread, usar `React.lazy`. |
| **CLS** | Estabilidad Visual | < 0.1 | Definir dimensiones (`width`/`height`) en img/video, evitar anuncios que empujan contenido. |

### Medición en Producción

Usa el hook `useReportWebVitals` (Next.js 14).

```typescript
// app/web-vitals.ts
'use client';
 
import { useReportWebVitals } from 'next/web-vitals';
 
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Envía métricas a Analytics (ej. Google Analytics 4)
    console.log(metric); 
  });
  return null;
}
```

## 3. Font Optimization (`next/font`)

Evita **CLS** (Cumulative Layout Shift) causado por FOUT (Flash of Unstyled Text) usando `next/font`.

```typescript
import { Inter } from 'next/font/google';

// Carga optimizada, self-hosted automático por Next.js
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Muestra texto fallback inmediatamente
});

export default function Layout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```
