# Build Optimization

Optimización avanzada del build de producción para reducir tamaño, mejorar carga inicial y dividir código eficientemente.

## 1. Estrategias de Rollup Options (`output.manualChunks`)

La clave para **Code Splitting** efectivo. Vite usa Rollup internamente.

Aquí te mostramos cómo separar grandes dependencias en sus propios chunks (`vendor.js` vs `index.js`).

**`vite.config.ts`**:

```typescript
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React y DOM juntos
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Librerías UI pesadas (MUI, AntD, Charts)
          if (id.includes('node_modules/@mui')) {
            return 'mui-vendor';
          }
          // Analytics, Sentry, Lodash
          if (id.includes('node_modules/lodash')) {
            return 'utils-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Ajustar warning (KB)
  },
  plugins: [
    // Genera stats.html para analizar bundle
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

Esto crea archivos separados: `react-vendor.js`, `mui-vendor.js`, etc.

**Ventaja**: Si cambias el código de tu UI pero no la versión de React, el usuario no tiene que volver a descargar `react-vendor.js` (cache hit).

## 2. Análisis del Bundle (`visualizer`)

Instala `rollup-plugin-visualizer`:
```bash
npm install -D rollup-plugin-visualizer
```

Al hacer `npm run build`, se abrirá un gráfico interactivo mostrando qué librerías ocupan más espacio. Esencial para detectar dependencias gigantes inesperadas.

## 3. Minificación y Source Maps

Vite usa `esbuild` para minificar (mucho más rápido que Terser), pero puedes personalizar.

```typescript
export default defineConfig({
  build: {
    minify: 'esbuild', // 'terser' es más lento pero 1-2% más pequeño
    sourcemap: false, // true para debug en producción (Sentry)
    target: 'esnext', // O 'es2015' para navegadores viejos
    cssCodeSplit: true, // CSS por chunk JS
  },
});
```

Si necesitas `terser` (para eliminar `console.log` en producción):

```bash
npm install -D terser
```

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## 4. Configuración del Servidor de Desarrollo (HTTPS)

Para APIs que requieren HTTPS o cookies seguras, usa `basicSsl` o certificados custom.

```bash
npm install -D @vitejs/plugin-basic-ssl
```

```typescript
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  server: {
    https: true,
    host: true, // Escucha en IP local (0.0.0.0) para probar en móvil
  },
  plugins: [
    basicSsl(),
  ],
});
```
