# Data & Async Patterns

`Suspense` no solo espera código, también espera datos. La forma moderna de hacerlo es con librerías `Suspense-enabled` como **TanStack Query** o mediante **Async Components** (en React Server Components).

## 1. Suspense para Data Fetching (TanStack Query)
TanStack Query v5 maneja automáticamente el estado `suspend` si habilitas `suspense: true` o usas `useSuspenseQuery`.

### Basic Suspense Query

**Hook Custom con suspense:**
```tsx
import { useSuspenseQuery } from '@tanstack/react-query';

export const useUserData = (userId: string) => {
  // ⚡ useSuspenseQuery lanzará una excepción (suspenderá) si no hay datos en caché.
  // Nunca retorna `isLoading` o `error` (porque Suspense y ErrorBoundary los manejan).
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) throw new Error('User fetch failed');
      return res.json();
    },
  });

  return data; // `data` siempre está definido aquí
};
```

**Uso en Componente:**
```tsx
import { useUserData } from './hooks/useUserData';

// Componente síncrono en apariencia
const UserProfile = ({ userId }: { userId: string }) => {
  const user = useUserData(userId); // Suspende aquí si es necesario

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

**Consumo:**
```tsx
<ErrorBoundary fallback={<div>Error cargando usuario</div>}>
  <Suspense fallback={<UserSkeleton />}>
    <UserProfile userId="123" />
  </Suspense>
</ErrorBoundary>
```

## 2. Async Components (React Server Components)

En Next.js (App Router), los componentes pueden ser marcados como `async`. Esto permite hacer fetch directamente en el servidor.

**Server Component (page.tsx):**
```tsx
// ✅ Componente async nativo (RSC)
export default async function Page({ params }: { params: { id: string } }) {
  // El componente se suspende aquí en el servidor
  const data = await fetch(`https://api.example.com/posts/${params.id}`).then(res => res.json());

  return (
    <main>
      <h1>{data.title}</h1>
      <p>{data.body}</p>
    </main>
  );
}
```

## 3. Nested Suspense (Render-as-you-fetch)

Patrón para iniciar fetch de múltiples recursos en paralelo pero mostrarlos progresivamente.

**Ejemplo: Feed y Sidebar**

No esperes a que *ambos* terminen. Muestra el Sidebar tan pronto llegue, aunque el Feed siga cargando.

```tsx
// Layout.tsx
export default function Layout() {
  return (
    <div className="layout">
      <nav>
        {/* Sidebar carga rápido */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </nav>

      <main>
        {/* Feed carga lento */}
        <Suspense fallback={<FeedSkeleton />}>
          <NewsFeed />
        </Suspense>
      </main>
    </div>
  );
}
```

### Composition Pattern (Granular Loading)

Si un componente hijo hace su propio fetch, puedes envolverlo en su propio `Suspense`.

```tsx
const Post = ({ id }) => {
  const post = usePost(id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      
      {/* Comentarios suspenden independientemente del post principal */}
      <Suspense fallback={<p>Cargando comentarios...</p>}>
        <Comments postId={id} />
      </Suspense>
    </article>
  );
};
```
