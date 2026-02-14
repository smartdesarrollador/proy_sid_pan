# Types & Configuration

TypeScript y la configuración del entorno son parte crítica de la estructura.

## 1. Tipos Globales vs Locales

Los tipos deben estar cerca de donde se usan, no en un global gigantesco.

### Feature Types (Local)

Si un tipo (`User`) solo se usa en `features/auth`, ponlo ahí.

```typescript
// features/auth/types.ts
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user'; // Enum
}

// features/auth/services/authService.ts
import type { User } from '../types';
```

### Global Types (Shared)

Si un tipo (`APIResponse`, `Theme`) se cruza entre muchas features.

```typescript
// types/api.ts
export interface APIResponse<T> {
    data: T;
    error: string | null;
    meta?: { page: number; total: number };
}

// types/index.ts (Barrel para exportar todos)
export * from './api';
export * from './theme';
```

### `.d.ts` (Declaraciones)

Para tipos globales que **no** importas explícitamente (ej. variables de `window`, props de `ProcessEnv`).

```typescript
// src/global.d.ts
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: any;
    gtag?: (...args: any[]) => void;
  }
}

export {}; // Necesario para extender global
```

## 2. Configuración de Entorno (`env.ts`)

Nunca uses `process.env.NEXT_PUBLIC_API_URL` directamente en componentes. Centralízalo y valídalo con **Zod** o similar.

```typescript
// src/env.ts (o @t3-oss/env-nextjs)
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  
  // Secretos solo servidor
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

// Valida en tiempo de ejecución (build/runtime)
const env = envSchema.parse(process.env);

export const config = {
    api: {
        baseUrl: env.NEXT_PUBLIC_API_URL,
    },
    isDev: env.NODE_ENV === 'development',
};
```

**Uso:**

```typescript
// features/products/services/productService.ts
import { config } from '@/env'; // Importa configuración validada

export const getProducts = async () => {
  const res = await fetch(`${config.api.baseUrl}/products`); // Type-safe
  return res.json();
};
```

## 3. Constantes

Para valores mágicos (`timeout`, `regex`, `roles` permitidos).

```typescript
// src/lib/constants.ts
export const APP_NAME = 'My Awesome App';
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const; // 'as const' para readonly

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```
