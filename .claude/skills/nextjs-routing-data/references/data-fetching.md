# Data Fetching Strategies

Guía completa de patrones de data fetching en Next.js App Router con Server Components, cache strategies y optimización de performance.

## Cache Strategies

Next.js App Router tiene 4 estrategias de cache principales para `fetch()`:

### 1. force-cache (Default - SSG)

```tsx
// app/posts/page.tsx
async function getPosts() {
  // ✅ Default: cache indefinidamente (Static Site Generation)
  const res = await fetch('https://api.example.com/posts', {
    cache: 'force-cache', // Default, opcional
  });

  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

**Cuándo usar:**
- ✅ Data que **NO cambia** (documentación, páginas de marketing)
- ✅ Data que cambia **muy poco** (productos, categorías)
- ✅ Mejor performance (página se genera en build time)

**Resultado:**
- Página se pre-renderiza en `next build`
- HTML estático servido desde CDN
- **Ultra rápido** (no fetch en runtime)

### 2. no-store (Dynamic - SSR)

```tsx
// app/dashboard/page.tsx
async function getUserData() {
  // Siempre fresh, no cache (equivalente a getServerSideProps)
  const res = await fetch('https://api.example.com/user', {
    cache: 'no-store',
  });

  return res.json();
}

export default async function DashboardPage() {
  const user = await getUserData();
  return <div>Welcome, {user.name}</div>;
}
```

**Cuándo usar:**
- ✅ Data **personalizada** por usuario (dashboard, perfil)
- ✅ Data **real-time** (stock, precios, notificaciones)
- ✅ Data **sensible** que no debe cachearse

**Resultado:**
- Fetch en **cada request**
- HTML generado en runtime (SSR)
- Siempre data actualizada

### 3. revalidate (ISR - Incremental Static Regeneration)

```tsx
// app/blog/page.tsx
async function getPosts() {
  // Revalidar cada 60 segundos (ISR)
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  });

  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

**Cuándo usar:**
- ✅ Data que cambia **periódicamente** (blog, noticias, productos)
- ✅ Balance entre **performance y freshness**
- ✅ Tráfico alto con data que cambia moderadamente

**Resultado:**
- Primera request: página estática servida desde cache
- Background revalidation cada N segundos
- Usuarios ven data cached (rápido), se actualiza en background

**Configuraciones comunes:**
- `revalidate: 60` - 1 minuto (noticias)
- `revalidate: 3600` - 1 hora (blog)
- `revalidate: 86400` - 1 día (documentación)

### 4. Route Segment Config

```tsx
// app/posts/page.tsx

// ✅ Configuración a nivel de ruta (aplica a todos los fetch)
export const revalidate = 60; // ISR cada 60s
export const dynamic = 'force-static'; // Forzar SSG
export const dynamicParams = true; // Permitir dynamic params

async function getPosts() {
  // No necesita especificar cache aquí
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

**Opciones de `dynamic`:**
- `'auto'` (default) - Decide automáticamente
- `'force-static'` - Forzar SSG (error si usa `no-store`)
- `'force-dynamic'` - Forzar SSR (todas las requests en runtime)
- `'error'` - Error si intenta usar dynamic data

## Parallel vs Sequential Fetching

### ❌ Sequential Fetching (Waterfall)

```tsx
// app/dashboard/page.tsx

// ❌ Waterfall: cada fetch espera al anterior
async function getDashboardData() {
  const user = await fetch('/api/user').then((r) => r.json());

  // Espera a que user termine
  const posts = await fetch('/api/posts').then((r) => r.json());

  // Espera a que posts termine
  const comments = await fetch('/api/comments').then((r) => r.json());

  return { user, posts, comments };
}

// Total: 300ms + 200ms + 150ms = 650ms
```

**Problema:** Requests en serie (uno después del otro) → **MUY LENTO**.

### ✅ Parallel Fetching (Promise.all)

```tsx
// app/dashboard/page.tsx

// ✅ Paralelo: todos los requests al mismo tiempo
async function getDashboardData() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then((r) => r.json()),
    fetch('/api/posts').then((r) => r.json()),
    fetch('/api/comments').then((r) => r.json()),
  ]);

  return { user, posts, comments };
}

// Total: max(300ms, 200ms, 150ms) = 300ms (3x más rápido!)
```

**Beneficio:** Requests paralelos → **RÁPIDO**.

**Cuándo usar:**
- ✅ Requests **independientes** (no dependen entre sí)
- ✅ Múltiples endpoints

### ✅ Sequential cuando es necesario

```tsx
// app/users/[id]/posts/page.tsx

// ✅ Sequential: posts depende de user.id
async function getUserPosts(userId: string) {
  const user = await fetch(`/api/users/${userId}`).then((r) => r.json());

  // NECESITA user.id del request anterior
  const posts = await fetch(`/api/users/${user.id}/posts`).then((r) => r.json());

  return { user, posts };
}
```

**Cuándo usar:**
- ✅ Request **depende** del resultado anterior
- ✅ No se puede paralelizar

## Streaming con Suspense

### Suspense Boundaries

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

// Componente lento (3 segundos)
async function SlowComponent() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const data = await fetch('/api/slow-data').then((r) => r.json());
  return <div>Slow Data: {data.value}</div>;
}

// Componente rápido (100ms)
async function FastComponent() {
  const data = await fetch('/api/fast-data').then((r) => r.json());
  return <div>Fast Data: {data.value}</div>;
}

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Renderiza INMEDIATAMENTE (no espera a SlowComponent) */}
      <Suspense fallback={<div>Loading fast data...</div>}>
        <FastComponent />
      </Suspense>

      {/* Renderiza DESPUÉS (streaming) */}
      <Suspense fallback={<div>Loading slow data...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

**Beneficio:**
- ✅ FastComponent renderiza en 100ms
- ✅ SlowComponent NO bloquea FastComponent
- ✅ Progressive rendering (mejor UX)

### Múltiples Suspense - Streaming Progresivo

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

async function UserInfo() {
  const user = await fetch('/api/user', { cache: 'no-store' }).then((r) => r.json());
  return <div>User: {user.name}</div>;
}

async function Analytics() {
  const data = await fetch('/api/analytics', { cache: 'no-store' }).then((r) => r.json());
  return <div>Analytics: {data.views} views</div>;
}

async function RecentActivity() {
  const activity = await fetch('/api/activity', { cache: 'no-store' }).then((r) => r.json());
  return <div>Activity: {activity.length} events</div>;
}

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Cada sección carga independientemente */}
      <Suspense fallback={<Skeleton />}>
        <UserInfo />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Analytics />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-200 h-32 rounded" />;
}
```

**Flujo:**
1. HTML inicial con 3 skeletons
2. UserInfo termina → reemplaza skeleton 1
3. Analytics termina → reemplaza skeleton 2
4. RecentActivity termina → reemplaza skeleton 3

**UX:** Usuario ve contenido progresivamente (no pantalla en blanco).

## Error Handling en Data Fetching

### Try-Catch Pattern

```tsx
// app/posts/page.tsx
async function getPosts() {
  try {
    const res = await fetch('https://api.example.com/posts');

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch posts:', error);

    // Opción 1: Retornar data default
    return [];

    // Opción 2: Re-throw para error boundary
    // throw error;
  }
}

export default async function PostsPage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return <div>No posts available</div>;
  }

  return <div>{/* render posts */}</div>;
}
```

### Error Boundary (error.tsx)

```tsx
// app/posts/error.tsx
'use client';

export default function PostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="border border-red-500 p-4">
      <h2 className="text-red-600">Failed to load posts</h2>
      <p className="text-gray-600">{error.message}</p>

      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
```

## Request Deduplication

Next.js automáticamente **deduplica** requests idénticos:

```tsx
// app/layout.tsx
async function getUser() {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}

export default async function Layout({ children }) {
  const user = await getUser(); // Request 1

  return (
    <div>
      <Header user={user} />
      {children}
    </div>
  );
}

// app/page.tsx
async function getUser() {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}

export default async function HomePage() {
  const user = await getUser(); // Request 2 (DEDUPLICADO!)

  return <div>Welcome, {user.name}</div>;
}
```

**Resultado:** Solo **1 request** a `/api/user` (automático por Next.js).

**Cuándo funciona:**
- ✅ Mismo URL
- ✅ Mismo método (GET)
- ✅ Mismas opciones de cache
- ✅ Durante el mismo render

## Revalidation Strategies

### On-Demand Revalidation

```tsx
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Validar secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Revalidar path específico
  revalidatePath('/blog');

  // O revalidar por tag
  revalidateTag('posts');

  return NextResponse.json({ revalidated: true });
}
```

```tsx
// app/blog/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }, // Tag para on-demand revalidation
  });
  return res.json();
}
```

**Trigger revalidation:**
```bash
curl -X POST https://myapp.com/api/revalidate?secret=MY_SECRET
```

### Time-based Revalidation

```tsx
// app/news/page.tsx

// Revalidar cada 5 minutos
export const revalidate = 300;

async function getNews() {
  const res = await fetch('https://api.example.com/news');
  return res.json();
}

export default async function NewsPage() {
  const news = await getNews();
  return <div>{/* render news */}</div>;
}
```

## Database Queries (Direct Access)

### Prisma Example

```tsx
// app/users/page.tsx
import { prisma } from '@/lib/prisma';

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <h1>Users</h1>
      {users.map((user) => (
        <div key={user.id}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}
```

**Beneficio:** Acceso directo a DB desde Server Components (no necesitas API route).

### Caching DB Queries

```tsx
// app/posts/page.tsx
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const getPosts = unstable_cache(
  async () => {
    return await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },
  ['posts'], // Cache key
  { revalidate: 60, tags: ['posts'] } // Revalidar cada 60s
);

export default async function PostsPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

## Preloading Pattern

```tsx
// app/users/[id]/page.tsx
import { preload } from 'react-dom';

async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

async function getUserPosts(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}/posts`);
  return res.json();
}

export default async function UserPage({ params }: { params: { id: string } }) {
  // Preload posts mientras user carga
  preload(`https://api.example.com/users/${params.id}/posts`, {
    as: 'fetch',
  });

  const user = await getUser(params.id);
  const posts = await getUserPosts(params.id);

  return (
    <div>
      <h1>{user.name}</h1>
      <PostsList posts={posts} />
    </div>
  );
}
```

## Mejores Prácticas

### ✅ Cache Strategy Selection

| Data Type | Strategy | Config |
|-----------|----------|--------|
| **Estática** (docs, landing) | SSG | `cache: 'force-cache'` |
| **Periódica** (blog, noticias) | ISR | `next: { revalidate: 60 }` |
| **Personalizada** (dashboard) | SSR | `cache: 'no-store'` |
| **Real-time** (stock, chat) | SSR + polling | `cache: 'no-store'` |

### ✅ Performance
1. **Parallel fetching** - Promise.all para requests independientes
2. **Suspense boundaries** - Streaming progresivo para UX
3. **Request deduplication** - Automático en Next.js
4. **Preloading** - Para mejorar perceived performance
5. **Database indexes** - Para queries rápidas

### ✅ Error Handling
1. **Try-catch** - Para errores de fetch/DB
2. **Error boundaries** - error.tsx para componentes
3. **Fallback data** - Retornar array vacío o data default
4. **Logging** - console.error para debugging

### ✅ Type Safety
1. **Tipar responses** - Interfaces para data fetched
2. **Validación runtime** - Zod/Yup para API responses
3. **Type guards** - Para error handling
4. **Prisma types** - Generated types desde schema

## Resumen

Data fetching en Next.js App Router:
- ✅ **force-cache**: SSG (estático, ultra rápido)
- ✅ **revalidate**: ISR (balance performance/freshness)
- ✅ **no-store**: SSR (siempre fresh, personalizado)
- ✅ **Parallel fetching**: Promise.all (3x más rápido)
- ✅ **Streaming**: Suspense (progressive rendering, mejor UX)
- ✅ **Direct DB access**: Desde Server Components (no API routes)
- ✅ **Request deduplication**: Automático (1 request compartido)

**Patrón recomendado:** Server Components + parallel fetching + Suspense boundaries.
