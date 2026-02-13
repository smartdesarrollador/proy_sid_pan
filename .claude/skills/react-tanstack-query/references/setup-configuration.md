# Setup & Configuration - TanStack Query v5

Guía detallada de configuración y setup de TanStack Query v5 con TypeScript.

## Instalación

```bash
# Core package
npm install @tanstack/react-query

# DevTools (solo desarrollo)
npm install -D @tanstack/react-query-devtools

# ESLint plugin (opcional pero recomendado)
npm install -D @tanstack/eslint-plugin-query
```

## QueryClient - Configuración Global

### Configuración Básica

```tsx
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración para useQuery
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10,   // 10 minutos (v4: cacheTime)
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Configuración para useMutation
      retry: 0,
    },
  },
});
```

### Configuración de Producción Recomendada

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache & Stale Time
      staleTime: 1000 * 60 * 5,  // Datos frescos por 5min
      gcTime: 1000 * 60 * 30,     // Mantener en cache 30min

      // Retry Logic
      retry: (failureCount, error) => {
        // No reintentar errores 4xx
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('404') ||
            errorMessage.includes('401') ||
            errorMessage.includes('403')
          ) {
            return false;
          }
        }
        // Máximo 2 reintentos para otros errores
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch Behavior
      refetchOnMount: 'stale',     // Solo refetch si data es stale
      refetchOnWindowFocus: false,  // Desactivado para evitar fetches innecesarios
      refetchOnReconnect: true,     // Refetch al recuperar conexión
      refetchInterval: false,       // No polling por defecto

      // Network Mode
      networkMode: 'online',        // Solo fetch con conexión
    },

    mutations: {
      retry: 0, // No reintentar mutaciones por defecto
      networkMode: 'online',

      // Global error handler
      onError: (error) => {
        console.error('Mutation error:', error);
        // Integrar con sistema de notificaciones
      },
    },
  },

  // Logger para debugging (desarrollo)
  logger: {
    log: (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(...args);
      }
    },
    warn: (...args) => {
      console.warn(...args);
    },
    error: (...args) => {
      console.error(...args);
    },
  },
});
```

## QueryClientProvider Setup

### Setup Básico en React

```tsx
// src/main.tsx (Vite) o src/index.tsx (CRA)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Setup con Next.js App Router (v13+)

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // IMPORTANTE: Crear queryClient dentro del componente para evitar compartir entre usuarios
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// app/layout.tsx
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Setup con Remix

```tsx
// app/root.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Outlet } from '@remix-run/react';

export default function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

## staleTime vs gcTime (antes cacheTime)

### Diferencias Clave

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: Cuánto tiempo los datos son "frescos"
      // - Durante este tiempo, NO se refetch en background
      // - Componentes usan data del cache sin refetch
      staleTime: 1000 * 60 * 5, // 5 minutos

      // gcTime: Cuánto tiempo mantener datos inactivos en cache
      // - Tiempo que la data permanece en memoria después de no usarse
      // - Cuando expira, la data se elimina del cache (garbage collected)
      gcTime: 1000 * 60 * 30, // 30 minutos
    },
  },
});
```

### Ejemplos Prácticos

```tsx
// Configuración 1: Datos muy dinámicos (chat messages)
useQuery({
  queryKey: ['messages'],
  queryFn: fetchMessages,
  staleTime: 0,         // Siempre stale, refetch en cada mount
  gcTime: 1000 * 60,     // Mantener 1min en cache
});

// Configuración 2: Datos estáticos (lista de países)
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: Infinity,   // Nunca stale, no refetch
  gcTime: Infinity,      // Mantener en cache para siempre
});

// Configuración 3: Datos semi-estáticos (perfil de usuario)
useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 1000 * 60 * 10,  // Fresh por 10min
  gcTime: 1000 * 60 * 30,      // En cache por 30min
});

// Configuración 4: Datos en tiempo real (stock prices)
useQuery({
  queryKey: ['stock', symbol],
  queryFn: () => fetchStock(symbol),
  staleTime: 0,              // Siempre refetch
  refetchInterval: 5000,     // Polling cada 5s
  gcTime: 1000 * 30,          // Solo mantener 30s
});
```

### Timeline Ejemplo

```
User monta componente → Fetch inicial → Data fresh (staleTime)
   0s                      1s             1s - 5min
                                          ↓
                           User navega away → Data en cache (gcTime)
                           5min                5min - 35min
                                               ↓
                           Data removed (garbage collected)
                           35min
```

## Configuración por Query (Override Global)

```tsx
// Global config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000 },
  },
});

// Override en query específica
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 300000, // 5min (sobrescribe global)
  gcTime: 600000,    // 10min
  retry: 3,          // 3 reintentos
});
```

## Múltiples QueryClients (Casos Avanzados)

```tsx
// Client 1: Datos de usuario (cache largo)
const userQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
    },
  },
});

// Client 2: Datos en tiempo real (cache corto)
const realtimeQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 30,
      refetchInterval: 5000,
    },
  },
});

// Providers anidados
function App() {
  return (
    <QueryClientProvider client={userQueryClient}>
      <UserSection />
      <QueryClientProvider client={realtimeQueryClient}>
        <RealtimeSection />
      </QueryClientProvider>
    </QueryClientProvider>
  );
}
```

## Persistencia de Cache (LocalStorage/SessionStorage)

```tsx
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Persister usando localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 horas
    },
  },
});

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <YourApp />
    </PersistQueryClientProvider>
  );
}
```

## DevTools Configuration

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />

      {/* Configuración avanzada de DevTools */}
      <ReactQueryDevtools
        initialIsOpen={false}           // Cerrado por defecto
        position="bottom-right"         // Posición del botón
        buttonPosition="bottom-right"   // Posición del toggle
        panelPosition="bottom"          // Posición del panel
        toggleButtonProps={{
          style: {
            marginLeft: '5.5rem',       // Custom styles
          },
        }}
        errorTypes={[
          { name: 'Error', initializer: (query) => new Error('...') },
        ]}
      />
    </QueryClientProvider>
  );
}
```

## ESLint Plugin (Recomendado)

```bash
npm install -D @tanstack/eslint-plugin-query
```

```json
// .eslintrc.json
{
  "extends": [
    "plugin:@tanstack/eslint-plugin-query/recommended"
  ]
}
```

Detecta errores comunes:
- ✅ Dependencias faltantes en query keys
- ✅ Uso incorrecto de hooks
- ✅ Queries sin queryKey
- ✅ Mutaciones sin onError/onSuccess

## Variables de Entorno

```bash
# .env
VITE_API_BASE_URL=https://api.example.com
VITE_QUERY_STALE_TIME=300000
VITE_QUERY_GC_TIME=600000
```

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME) || 60000,
      gcTime: Number(import.meta.env.VITE_QUERY_GC_TIME) || 300000,
    },
  },
});
```

## Testing Setup

```tsx
// src/test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No reintentar en tests
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Silenciar errores en tests
    },
  });
}

export function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Uso en test
import { renderWithClient } from './test/utils';

test('renders user data', async () => {
  renderWithClient(<UserProfile userId={1} />);
  // ...assertions
});
```

## Resumen de Opciones de Configuración

| Opción | Default | Descripción |
|--------|---------|-------------|
| `staleTime` | `0` | Tiempo que data es "fresh" |
| `gcTime` | `5 * 60 * 1000` | Tiempo antes de eliminar cache |
| `retry` | `3` | Número de reintentos |
| `retryDelay` | `attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)` | Delay entre reintentos |
| `refetchOnMount` | `true` | Refetch al montar componente |
| `refetchOnWindowFocus` | `true` | Refetch al enfocar ventana |
| `refetchOnReconnect` | `true` | Refetch al reconectar internet |
| `refetchInterval` | `false` | Polling interval (milisegundos) |
| `enabled` | `true` | Habilitar/deshabilitar query |
| `networkMode` | `'online'` | Modo de red: 'online' \| 'always' \| 'offlineFirst' |

## Mejores Prácticas

1. ✅ **Un QueryClient por app** (salvo casos avanzados)
2. ✅ **staleTime según frecuencia de cambios** (datos estáticos: Infinity, tiempo real: 0)
3. ✅ **gcTime > staleTime** (mantener cache más tiempo del que es fresh)
4. ✅ **Desactivar refetchOnWindowFocus** en producción (molesto para usuarios)
5. ✅ **Configurar retry solo para errores de red** (no para 4xx)
6. ✅ **Usar DevTools en desarrollo** (debugging y optimización)
7. ✅ **ESLint plugin** para detectar errores comunes
8. ✅ **Diferente config en tests** (retry: false, gcTime: Infinity)

---

**Siguiente:** [Queries Patterns](./queries-patterns.md) para patrones avanzados de useQuery.
