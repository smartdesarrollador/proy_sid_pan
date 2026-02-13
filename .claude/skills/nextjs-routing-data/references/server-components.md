# Server Components Deep Dive

Guía completa de React Server Components en Next.js App Router con TypeScript y mejores prácticas de producción.

## ¿Qué son Server Components?

React Server Components (RSC) son componentes que se ejecutan **solo en el servidor** y envían HTML pre-renderizado al cliente.

### Diferencias Fundamentales

| Feature | Server Component | Client Component |
|---------|-----------------|------------------|
| **Directiva** | Default (sin 'use client') | 'use client' requerido |
| **Ejecución** | Solo servidor | Servidor + Cliente |
| **Data Fetching** | async/await directo | useEffect + fetch/TanStack Query |
| **React Hooks** | ❌ No (useState, useEffect) | ✅ Sí (todos los hooks) |
| **Browser APIs** | ❌ No (window, localStorage) | ✅ Sí (todos) |
| **Backend Access** | ✅ Sí (DB, filesystem, secrets) | ❌ No (solo APIs públicas) |
| **Bundle Size** | ✅ 0 KB (código no va al cliente) | ❌ KB enviados al cliente |
| **Event Handlers** | ❌ No (onClick, onChange) | ✅ Sí |

## Async Server Components

### Data Fetching Directo

```tsx
// app/posts/page.tsx (Server Component)
interface Post {
  id: number;
  title: string;
  content: string;
}

async function getPosts(): Promise<Post[]> {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // ISR: revalidar cada 60s
  });

  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }

  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

### Database Access Directo

```tsx
// app/users/page.tsx
import { db } from '@/lib/db'; // Prisma, Drizzle, etc.

async function getUsers() {
  const users = await db.user.findMany({
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
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Beneficio:** Acceso directo a DB sin exponer credenciales al cliente.

### Filesystem Access

```tsx
// app/docs/[slug]/page.tsx
import fs from 'fs/promises';
import path from 'path';

async function getDocContent(slug: string) {
  const filePath = path.join(process.cwd(), 'docs', `${slug}.md`);
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

export default async function DocPage({ params }: { params: { slug: string } }) {
  const content = await getDocContent(params.slug);

  return (
    <article>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

### Environment Variables (Secrets)

```tsx
// app/api-demo/page.tsx
async function getSecretData() {
  // Variables de entorno solo accesibles en servidor
  const apiKey = process.env.SECRET_API_KEY;

  const res = await fetch('https://api.example.com/secret', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return res.json();
}

export default async function ApiDemoPage() {
  const data = await getSecretData();

  return <div>Secret Data: {JSON.stringify(data)}</div>;
}
```

**Importante:** Nunca expongas secrets en Client Components.

## Composición Server + Client Components

### Patrón 1: Client Component Embebido

```tsx
// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react';
import Counter from './Counter'; // Client Component
import Analytics from './Analytics'; // Server Component

async function getStats() {
  const res = await fetch('https://api.example.com/stats', { cache: 'no-store' });
  return res.json();
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Server data */}
      <p>Total Users: {stats.totalUsers}</p>

      {/* Client Component para interactividad */}
      <Counter initialCount={0} />

      {/* Server Component con Suspense */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <Analytics />
      </Suspense>
    </div>
  );
}
```

```tsx
// app/dashboard/Counter.tsx (Client Component)
'use client';

import { useState } from 'react';

export default function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Patrón 2: Props Serializables

```tsx
// app/products/page.tsx (Server Component)
import ProductCard from './ProductCard'; // Client Component

interface Product {
  id: number;
  name: string;
  price: number;
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch('https://api.example.com/products');
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        // Pasar data serializable como props
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

```tsx
// app/products/ProductCard.tsx (Client Component)
'use client';

import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    setAdded(true);
    // Lógica de carrito
  };

  return (
    <div className="border p-4">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart} disabled={added}>
        {added ? 'Added' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

**Regla:** Solo puedes pasar props serializables (JSON) de Server a Client Components.

### Patrón 3: Server Component como Children

```tsx
// app/layout.tsx
import Sidebar from './components/Sidebar'; // Client Component
import UserProfile from './components/UserProfile'; // Server Component

async function getUser() {
  const res = await fetch('https://api.example.com/user', { cache: 'no-store' });
  return res.json();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <html lang="en">
      <body>
        <div className="flex">
          {/* Client Component recibe Server Component como children */}
          <Sidebar>
            <UserProfile user={user} />
          </Sidebar>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

```tsx
// app/components/Sidebar.tsx (Client Component)
'use client';

import { useState } from 'react';

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className={`w-64 bg-gray-800 ${isOpen ? 'block' : 'hidden'}`}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>

      {/* Server Component renderizado aquí */}
      {children}
    </aside>
  );
}
```

**Beneficio:** Client Component controla UI, Server Component fetch data.

## Parallel Data Fetching

### Promise.all - Requests Independientes

```tsx
// app/dashboard/page.tsx
async function getDashboardData() {
  // ✅ Paralelo: 3 requests simultáneos
  const [user, projects, notifications] = await Promise.all([
    fetch('https://api.example.com/user').then((r) => r.json()),
    fetch('https://api.example.com/projects').then((r) => r.json()),
    fetch('https://api.example.com/notifications').then((r) => r.json()),
  ]);

  return { user, projects, notifications };
}

export default async function DashboardPage() {
  const { user, projects, notifications } = await getDashboardData();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <ProjectsList projects={projects} />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
```

**Performance:** 3x más rápido que sequential fetching.

### Sequential Fetching - Requests Dependientes

```tsx
// app/users/[id]/posts/page.tsx
async function getUserPosts(userId: string) {
  // ❌ Sequential: waterfall (más lento)
  const user = await fetch(`https://api.example.com/users/${userId}`).then((r) => r.json());

  // Depende del resultado anterior
  const posts = await fetch(`https://api.example.com/users/${user.id}/posts`).then((r) =>
    r.json()
  );

  return { user, posts };
}

export default async function UserPostsPage({ params }: { params: { id: string } }) {
  const { user, posts } = await getUserPosts(params.id);

  return (
    <div>
      <h1>{user.name}'s Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

**Usar cuando:** Un request depende del resultado del anterior.

## Streaming con Suspense

### Streaming Progresivo

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

// Server Component lento
async function Analytics() {
  // Simular query lento
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const data = await fetch('https://api.example.com/analytics').then((r) => r.json());

  return (
    <div className="border p-4">
      <h2>Analytics</h2>
      <p>Views: {data.views}</p>
    </div>
  );
}

// Server Component rápido
async function QuickStats() {
  const data = await fetch('https://api.example.com/quick-stats').then((r) => r.json());

  return (
    <div className="border p-4">
      <h2>Quick Stats</h2>
      <p>Users: {data.users}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1>Dashboard</h1>

      {/* Renderiza inmediatamente (rápido) */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <QuickStats />
      </Suspense>

      {/* Renderiza después (lento, no bloquea QuickStats) */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <Analytics />
      </Suspense>
    </div>
  );
}
```

**Beneficio:** Página carga progresivamente (no espera al componente más lento).

### Múltiples Suspense Boundaries

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

async function UserInfo() {
  const user = await fetch('/api/user').then((r) => r.json());
  return <div>User: {user.name}</div>;
}

async function RecentActivity() {
  const activity = await fetch('/api/activity').then((r) => r.json());
  return <div>Activity: {activity.length} items</div>;
}

async function Notifications() {
  const notifications = await fetch('/api/notifications').then((r) => r.json());
  return <div>Notifications: {notifications.length}</div>;
}

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Cada sección carga independientemente */}
      <Suspense fallback={<Skeleton />}>
        <UserInfo />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <RecentActivity />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Notifications />
      </Suspense>
    </div>
  );
}

function Skeleton() {
  return <div className="animate-pulse bg-gray-200 h-32 rounded" />;
}
```

## Error Handling en Server Components

### Try-Catch en Async Components

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
    // Retornar data default o re-throw
    return [];
  }
}

export default async function PostsPage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return <div>No posts found</div>;
  }

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

### Error Boundary (error.tsx)

```tsx
// app/posts/error.tsx
'use client';

export default function PostsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border border-red-500 p-4">
      <h2>Failed to load posts</h2>
      <p>{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white">
        Retry
      </button>
    </div>
  );
}
```

## Cache Strategies

### force-cache (Default)

```tsx
// Cache indefinidamente (hasta next build)
async function getStaticData() {
  const res = await fetch('https://api.example.com/config', {
    cache: 'force-cache', // Default
  });
  return res.json();
}
```

### no-store (Dynamic)

```tsx
// Siempre fresh (no cache)
async function getDynamicData() {
  const res = await fetch('https://api.example.com/realtime', {
    cache: 'no-store', // Equivalente a getServerSideProps
  });
  return res.json();
}
```

### revalidate (ISR)

```tsx
// Revalidar cada N segundos
async function getRevalidatedData() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // ISR: revalidar cada 60s
  });
  return res.json();
}
```

### Route Segment Config

```tsx
// app/posts/page.tsx

// Configuración a nivel de ruta
export const revalidate = 60; // Revalidar cada 60s
export const dynamic = 'force-static'; // Forzar SSG
export const dynamicParams = true; // Permitir dynamic params

async function getPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  return <div>{/* render posts */}</div>;
}
```

## Mejores Prácticas

### ✅ Arquitectura
1. **Server Components por defecto** - Solo usar 'use client' cuando necesario
2. **Colocación de data fetching** - Fetch en el componente más cercano que usa los datos
3. **Parallel fetching** - Promise.all para requests independientes
4. **Streaming con Suspense** - Para mejor UX (no bloquear página completa)
5. **Composición adecuada** - Server Components como children de Client Components

### ✅ Performance
1. **Minimizar Client Components** - Reducir bundle size
2. **Evitar prop drilling** - Fetch data cerca de donde se usa
3. **Cache estratégico** - force-cache para data estática, revalidate para ISR
4. **Suspense boundaries** - Granulares para progressive rendering

### ✅ Type Safety
1. **Tipar responses** - Interfaces para data fetched
2. **Tipar props** - Interfaces para props entre Server/Client
3. **Validar runtime** - Usar Zod/Yup para validar API responses
4. **Type guards** - Para error handling

### ❌ Anti-Patterns

```tsx
// ❌ NO: useEffect en Server Component
export default async function BadPage() {
  useEffect(() => {}, []); // Error: no hooks en Server Components
}

// ❌ NO: onClick en Server Component
export default async function BadPage() {
  return <button onClick={() => {}}>Click</button>; // Error: no event handlers
}

// ❌ NO: Pasar funciones de Server a Client Component
export default async function BadPage() {
  const handleClick = () => console.log('click');
  return <ClientComponent onClick={handleClick} />; // Error: no serializable
}

// ❌ NO: Browser APIs en Server Component
export default async function BadPage() {
  const data = localStorage.getItem('key'); // Error: no window/localStorage
}
```

## Resumen

Server Components en Next.js App Router:
- ✅ async/await directo sin useEffect
- ✅ Acceso a backend (DB, filesystem, secrets)
- ✅ Bundle size 0 KB (código en servidor)
- ✅ SEO optimizado (HTML pre-renderizado)
- ✅ Streaming con Suspense para UX
- ✅ Composición flexible con Client Components

**Regla de oro:** Usa Server Components por defecto, 'use client' solo para interactividad.
