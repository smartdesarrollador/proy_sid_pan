# Build & Deployment Optimization

Optimizar tu configuración de builds es crucial para escalar aplicaciones grandes.

## 1. Salida Standalone (`skip-output-trace`)

Para despliegues en contenedores (Docker), Next.js puede crear un bundle mínimo solo con los archivos necesarios.

**`next.config.mjs`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Crea .next/standalone/
  // Otros configs
};

export default nextConfig;
```

Esto reduce el tamaño de la imagen Docker de cientos de MBs a < 100MB generalmente. Copia `.next/standalone` y tu carpeta `public/` y `static/` a la imagen final.

## 2. Static Exports (`output: 'export'`) & `next.config.js`

Si no necesitas SSR ni API Routes, exporta como HTML/CSS/JS puro (SSG only).

**`next.config.mjs`:**

```javascript
const nextConfig = {
  output: 'export', // Genera 'out/' folder
  trailingSlash: true, // Importante para hosting estático
  images: { unoptimized: true }, // next/image no funciona sin servidor Node
};
```

Ideal para despliegue en CDN puros (S3, Cloudflare Pages, GitHub Pages). **Limitación**: No ISR, No API Routes dinámicas.

## 3. Mix Rendering (Páginas Estáticas + Dinámicas)

En el mismo proyecto puedes tener:

| Tipo | Ejemplo | Configuración |
| :--- | :--- | :--- |
| **SSG** | `/about`, `/contact` | Sin fetch dinámico. |
| **ISR** | `/blog/[slug]`, `/products` | `fetch(..., { next: { revalidate: 3600 } })`. |
| **SSR** | `/dashboard`, `/checkout` | `fetch(..., { cache: 'no-store' })` o `cookies()`. |

Next.js decide automáticamente en build time (`λ` lambda vs `○` static).

### Output Tracing

Next.js automáticamente traza dependencias (`node_modules`) usadas en cada página para solo incluirlas en la función serverless correspondiente. Esto reduce el "Cold Start" en Vercel/AWS Lambda.

## 4. Performance Monitoring

Vigila estas métricas en tus builds:

*   **Page Size**: Mantén el "First Load JS" por debajo de 100KB (ideal < 70KB).
    *   Usa `next/dynamic` para lazy loading de componentes cliente pesados.
    *   Mueve lógica de librerías grandes al servidor (Server Components).
*   **Build Time**: Si crece mucho, usa ISR o `dynamicParams: true` para generar menos páginas upfront.
*   **Bundle Analyzer**:
    ```bash
    npm install @next/bundle-analyzer
    ```
    Configura para ver qué módulos client-side están inflando tu app.
