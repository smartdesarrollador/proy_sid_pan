# Setup y Path Aliases

Vite es la herramienta de desarrollo frontend moderna más rápida, utilizando ESBuild para bundles de desarrollo.

## 1. Vite Setup Inicial

Para crear un nuevo proyecto React con TypeScript:

```bash
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
```

### Estructura Recomendada

```
my-react-app/
├── public/                 # Assets estáticos (favicon.ico, manifest.json)
├── src/
│   ├── assets/             # Assets procesados por Vite (imágenes importadas)
│   ├── components/         # Componentes UI
│   ├── hooks/
│   ├── App.tsx             # Componente raíz
│   ├── main.tsx            # Punto de entrada
│   └── vite-env.d.ts       # Tipos de env y assets
├── .env                    # Variables de entorno
├── index.html              # Entry point HTML
├── package.json            # Scripts y dependencias
├── tsconfig.json           # Configuración TypeScript
├── tsconfig.node.json      # Config para vite.config.ts
└── vite.config.ts          # Configuración Vite
```

## 2. Configuración Básica (`vite.config.ts`)

La configuración por defecto es mínima. Vamos a añadir el plugin de React y configurar el servidor.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Puerto fijo (default 5173)
    open: true, // Abrir navegador al iniciar
  },
  resolve: {
    alias: {
      // Necesario para imports limpios como '@/components/Button'
      '@': '/src',
    },
  },
});
```

Asegúrate de instalar `@types/node` si usas `path` para alias más robustos:
```bash
npm install -D @types/node
```

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## 3. Path Aliases (`tsconfig.json`)

Para que TypeScript entienda los alias (`@/`), debes sincronizar `tsconfig.json` (o `tsconfig.app.json` en versiones recientes).

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    // ... otras opciones
  }
}
```

Ahora puedes importar componentes limpiamente:

```typescript
// ✅ Correcto
import { Button } from '@/components/ui/Button';

// ❌ Evitar (Relative hell)
import { Button } from '../../components/ui/Button';
```
