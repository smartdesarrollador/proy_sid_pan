# Next.js Routing & Data Fetching Skill

Guía completa de Next.js App Router (v13+) con TypeScript para routing, data fetching y arquitectura server/client components.

## ¿Cuándo usar este skill?

Usa este skill cuando necesites ayuda con:

- ✅ **File-based routing**: Convenciones de carpetas, page.tsx, route segments, dynamic routes
- ✅ **Layouts**: layout.tsx, nested layouts, RootLayout, metadata compartido
- ✅ **Loading UI**: loading.tsx, Suspense boundaries, streaming, skeleton states
- ✅ **Error handling**: error.tsx, global-error.tsx, recovery UI
- ✅ **Server Components**: async components, data fetching directo, cuándo usarlos
- ✅ **Client Components**: 'use client', interactividad, hooks, event handlers
- ✅ **Route Handlers**: route.ts, API endpoints (GET, POST, PUT, DELETE)
- ✅ **Data fetching**: fetch con cache/revalidate, parallel/sequential requests
- ✅ **Dynamic routes**: generateStaticParams, [slug], [...slug], route groups
- ✅ **Navigation**: Link, useRouter, usePathname, redirect
- ✅ **Metadata & SEO**: generateMetadata, Open Graph, sitemap

## Contenido

### SKILL.md (Main)
Guía principal con ejemplos copy-paste listos para usar:
- File-based routing y convenciones
- Layouts anidados y UI persistente
- Loading y error handling
- Server Components vs Client Components
- Data fetching patterns (cache, revalidate, streaming)
- Route Handlers (API endpoints tipados)
- Navigation (Link, useRouter, redirect)
- Metadata y SEO
- Mejores prácticas de arquitectura y performance

### Referencias Detalladas

1. **[server-components.md](references/server-components.md)** - Deep dive en React Server Components
   - Async/await en componentes
   - Acceso a backend (DB, filesystem, secrets)
   - Composición con Client Components
   - Patrones de fetch optimizados

2. **[route-handlers.md](references/route-handlers.md)** - API endpoints con Next.js
   - CRUD completo tipado
   - Autenticación y autorización
   - Middleware patterns
   - Error handling y validación

3. **[data-fetching.md](references/data-fetching.md)** - Estrategias de data fetching
   - Cache strategies (force-cache, no-store, revalidate)
   - Parallel vs sequential requests
   - Streaming con Suspense
   - ISR (Incremental Static Regeneration)

4. **[dynamic-routes.md](references/dynamic-routes.md)** - Rutas dinámicas avanzadas
   - generateStaticParams para SSG
   - Catch-all routes ([...param])
   - Optional catch-all ([[...param]])
   - Route Groups (folder) para organización

5. **[metadata-seo.md](references/metadata-seo.md)** - SEO y metadatos
   - generateMetadata dinámico
   - Open Graph y Twitter Cards
   - JSON-LD structured data
   - Sitemap y robots.txt

## Versión Next.js

Este skill cubre **Next.js 14+** con App Router como estándar. Si usas Pages Router (antiguo), considera migrar a App Router para aprovechar Server Components y mejores patterns.

## Diferencias Clave vs Frameworks Similares

| Feature | Next.js App Router | React Router | Remix |
|---------|-------------------|--------------|-------|
| **Routing** | File-based (carpetas) | Config-based | File-based |
| **Data Fetching** | async/await en componentes | loaders | loaders |
| **Server Components** | ✅ Default | ❌ | ❌ (RSC experimental) |
| **SSR/SSG** | ✅ Built-in | ❌ (SPA only) | ✅ Built-in |
| **API Routes** | ✅ route.ts | ❌ | ✅ loaders/actions |
| **Streaming** | ✅ Suspense | ❌ | ✅ defer |

## Arquitectura Recomendada

```
app/
├── (auth)/              # Route Group (no afecta URL)
│   ├── login/
│   └── register/
├── (marketing)/
│   ├── page.tsx         # / (Home)
│   ├── about/
│   └── pricing/
├── dashboard/
│   ├── layout.tsx       # Layout compartido
│   ├── page.tsx
│   ├── settings/
│   └── users/
├── api/                 # API endpoints
│   ├── auth/
│   └── users/
└── components/
    ├── server/          # Server Components
    └── client/          # Client Components ('use client')
```

## Ejemplos de Uso

### Server Component con Data Fetching
```tsx
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // Revalidar cada 60s
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

### Client Component Interactivo
```tsx
// app/components/Counter.tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### Route Handler (API Endpoint)
```tsx
// app/api/posts/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());
  return NextResponse.json(posts);
}
```

## Mejores Prácticas

1. **Server Components First** - Usa 'use client' solo cuando necesites interactividad
2. **Colocación de Data Fetching** - Fetch en el componente más cercano que usa los datos
3. **Parallel Fetching** - Promise.all para requests independientes
4. **Streaming con Suspense** - Para UX optimizada sin bloquear página completa
5. **TypeScript Estricto** - Tipar params, metadata, API responses

## Recursos Externos

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)

## Licencia

Este skill es parte del proyecto y sigue la misma licencia.
