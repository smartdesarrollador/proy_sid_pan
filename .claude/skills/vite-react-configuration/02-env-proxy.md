# Variables de Entorno y Proxy

Vite expone variables de entorno en tiempo de ejecución de manera segura y flexible, además de solucionar problemas de CORS con proxy.

## 1. Archivos `.env`

Vite carga automáticamente los archivos `.env` en la raíz del proyecto.

```bash
# .env (o .env.local) - Variables por defecto
VITE_APP_TITLE="Mi React App"
VITE_API_URL="http://localhost:8080/api"

# .env.production - Production override
VITE_API_URL="https://api.misecretapp.com/v1"
```

⚠️ Solo las variables prefijadas con **`VITE_`** se exponen al código cliente (`import.meta.env`).

### Acceso (`import.meta.env`)

```typescript
console.log(import.meta.env.VITE_APP_TITLE); // "Mi React App"
console.log(import.meta.env.PROD);           // true/false
console.log(import.meta.env.DEV);            // true/false
console.log(import.meta.env.MODE);           // "development" | "production"
```

## 2. Tipado de Environment Variables (`vite-env.d.ts`)

Para evitar `any` y autocompletar variables, extiende la interfaz `ImportMetaEnv`.

Crea o edita `src/vite-env.d.ts` (viene por defecto en templates React-TS).

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  readonly VITE_FEATURE_FLAG_NEWS: string; // 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Ahora `import.meta.env.` tendrá IntelliSense completo.

## 3. Proxy Configuration (`server.proxy`)

Evita problemas de CORS (`Access-Control-Allow-Origin`) durante desarrollo local redirigiendo las peticiones API al backend.

**`vite.config.ts`**:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend local (Spring, Node, Django)
        changeOrigin: true, // Modifica el header host al del target
        rewrite: (path) => path.replace(/^\/api/, ''), // Opcional: elimina /api del path
        secure: false, // Si el target es https con certificado self-signed
      },
      // Proxy para WebSockets
      '/socket.io': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
```

En producción, esto **NO** funciona (Vite dev server no existe). Debes configurar Nginx, Vercel Rewrites o llamar directamente a la API absoluta.

### Uso en Código

```typescript
// En desarrollo, llama a /api/users -> http://localhost:8080/users
const res = await fetch('/api/users'); 
```

En producción, asegúrate de usar la URL completa configurada en `.env.production`:

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || '/api'; // Fallback a relativo
const res = await fetch(`${BASE_URL}/users`);
```
