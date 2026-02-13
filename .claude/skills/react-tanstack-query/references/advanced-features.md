# Advanced Features - TanStack Query v5

Características avanzadas de TanStack Query: infinite queries, prefetching, SSR, streaming y optimización de performance.

## useInfiniteQuery - Infinite Scroll & Load More

### Básico: Infinite Scroll

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

interface UsersPage {
  users: User[];
  nextCursor: number | null;
  hasMore: boolean;
}

const fetchUsersPage = async ({ pageParam = 0 }): Promise<UsersPage> => {
  const response = await fetch(`/api/users?cursor=${pageParam}&limit=20`);
  const data = await response.json();

  return {
    users: data.users,
    nextCursor: data.nextCursor,
    hasMore: data.hasMore,
  };
};

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: fetchUsersPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Renderizar todas las páginas */}
      {data?.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ))}

      {/* Botón Load More */}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'No more users'}
      </button>
    </div>
  );
}
```

### Auto Infinite Scroll - Intersection Observer

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

function AutoInfiniteScroll() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: fetchUsersPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Auto-fetch cuando el elemento está visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ))}

      {/* Trigger element */}
      <div ref={ref}>
        {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Scroll for more' : 'End of list'}
      </div>
    </div>
  );
}
```

### Bi-Directional Infinite Scroll

```tsx
interface MessagesPage {
  messages: Message[];
  nextCursor: number | null;
  prevCursor: number | null;
}

function ChatMessages() {
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = useInfiniteQuery({
    queryKey: ['messages'],
    queryFn: ({ pageParam = 0 }) => fetchMessages(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor,
    initialPageParam: 0,
  });

  return (
    <div>
      {/* Load older messages */}
      <button
        onClick={() => fetchPreviousPage()}
        disabled={!hasPreviousPage}
      >
        Load Older
      </button>

      {/* Render all pages */}
      {data?.pages.map((page) =>
        page.messages.map((msg) => <Message key={msg.id} message={msg} />)
      )}

      {/* Load newer messages */}
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
        Load Newer
      </button>
    </div>
  );
}
```

### Refetch All Pages

```tsx
function RefreshableInfiniteList() {
  const queryClient = useQueryClient();

  const { data, refetch } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: fetchUsersPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  const handleRefresh = () => {
    // Refetch todas las páginas cargadas
    refetch();
  };

  const handleReset = () => {
    // Resetear a primera página
    queryClient.setQueryData(['users', 'infinite'], (data) => ({
      pages: data?.pages.slice(0, 1) || [],
      pageParams: data?.pageParams.slice(0, 1) || [],
    }));
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      <button onClick={handleReset}>Reset to Page 1</button>
      {/* List */}
    </div>
  );
}
```

## Prefetching - Mejorar UX

### Hover Prefetch

```tsx
function UserList({ users }: { users: User[] }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = (userId: number) => {
    // Prefetch datos del usuario al hacer hover
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 60000, // Mantener en cache por 1min
    });
  };

  return (
    <div>
      {users.map((user) => (
        <Link
          key={user.id}
          to={`/users/${user.id}`}
          onMouseEnter={() => handleMouseEnter(user.id)}
        >
          {user.name}
        </Link>
      ))}
    </div>
  );
}
```

### Prefetch on Mount

```tsx
function Dashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch datos que el usuario probablemente verá
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: fetchNotifications,
    });

    queryClient.prefetchQuery({
      queryKey: ['user-stats'],
      queryFn: fetchUserStats,
    });
  }, [queryClient]);

  return <div>{/* Dashboard content */}</div>;
}
```

### Prefetch Next Page (Pagination)

```tsx
function PaginatedList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),
  });

  // Prefetch página siguiente automáticamente
  useEffect(() => {
    if (data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: ['users', page + 1],
        queryFn: () => fetchUsers(page + 1),
      });
    }
  }, [page, data, queryClient]);

  return <div>{/* Render list */}</div>;
}
```

### Conditional Prefetch

```tsx
function SmartPrefetch({ userId }: { userId: number }) {
  const queryClient = useQueryClient();

  const handlePrefetch = () => {
    // Solo prefetch si no está en cache o es stale
    const cachedData = queryClient.getQueryData(['user', userId]);

    if (!cachedData) {
      queryClient.prefetchQuery({
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId),
      });
    }
  };

  return (
    <button onMouseEnter={handlePrefetch}>
      View User Profile
    </button>
  );
}
```

## Suspense - React 18+

### useSuspenseQuery (v5)

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

function UserProfile({ userId }: { userId: number }) {
  // data NUNCA es undefined con useSuspenseQuery
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // No need for loading state or null checks
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

### useSuspenseInfiniteQuery

```tsx
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

function InfiniteList() {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: fetchUsersPage,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // data siempre está definido
  return (
    <div>
      {data.pages.map((page) =>
        page.users.map((user) => <UserCard key={user.id} user={user} />)
      )}
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InfiniteList />
    </Suspense>
  );
}
```

### Multiple Suspense Queries

```tsx
function Dashboard() {
  // Todas suspenden, pero se pueden combinar
  const { data: user } = useSuspenseQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const { data: projects } = useSuspenseQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return (
    <div>
      <UserSection user={user} />
      <ProjectsSection projects={projects} />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

## Server-Side Rendering (SSR)

### Next.js App Router (v13+) - Hydration

```tsx
// app/users/[id]/page.tsx
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

async function UserPage({ params }: { params: { id: string } }) {
  const queryClient = new QueryClient();

  // Prefetch en el servidor
  await queryClient.prefetchQuery({
    queryKey: ['user', params.id],
    queryFn: () => fetchUser(Number(params.id)),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfile userId={Number(params.id)} />
    </HydrationBoundary>
  );
}

// app/users/[id]/UserProfile.tsx (Client Component)
'use client';

function UserProfile({ userId }: { userId: number }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    // Data ya está en cache desde SSR
  });

  return <div>{data?.name}</div>;
}
```

### Next.js Pages Router - getServerSideProps

```tsx
// pages/users/[id].tsx
import {
  dehydrate,
  QueryClient,
  useQuery,
  HydrationBoundary,
} from '@tanstack/react-query';

export async function getServerSideProps({ params }) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['user', params.id],
    queryFn: () => fetchUser(params.id),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}

export default function UserPage({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <UserProfile />
    </HydrationBoundary>
  );
}
```

### Remix - Loader Integration

```tsx
// routes/users.$id.tsx
import { useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { useQuery } from '@tanstack/react-query';

export async function loader({ params }: LoaderArgs) {
  const user = await fetchUser(params.id);
  return json({ user });
}

export default function UserRoute() {
  const { user: initialUser } = useLoaderData<typeof loader>();

  const { data: user } = useQuery({
    queryKey: ['user', initialUser.id],
    queryFn: () => fetchUser(initialUser.id),
    initialData: initialUser,
    staleTime: 60000,
  });

  return <div>{user.name}</div>;
}
```

## Streaming & React Server Components (Next.js 14+)

```tsx
// app/users/page.tsx (Server Component)
import { QueryClient } from '@tanstack/react-query';

async function UsersPage() {
  const queryClient = new QueryClient();

  // Fetch en el servidor
  const users = await queryClient.fetchQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Pasar directamente a Client Component
  return <UserList initialUsers={users} />;
}

// UserList.tsx (Client Component)
'use client';

function UserList({ initialUsers }: { initialUsers: User[] }) {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    initialData: initial Users,
  });

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Optimistic Updates Avanzados

### Optimistic with Multiple Queries

```tsx
const updateUserMutation = useMutation({
  mutationFn: updateUser,

  onMutate: async (updatedUser) => {
    // Cancelar queries relacionadas
    await queryClient.cancelQueries({ queryKey: ['users'] });
    await queryClient.cancelQueries({ queryKey: ['user', updatedUser.id] });

    // Snapshot
    const previousUsers = queryClient.getQueryData<User[]>(['users']);
    const previousUser = queryClient.getQueryData<User>(['user', updatedUser.id]);

    // Actualizar múltiples caches optimísticamente
    queryClient.setQueryData<User[]>(['users'], (old) =>
      old?.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );

    queryClient.setQueryData<User>(['user', updatedUser.id], (old) => ({
      ...old!,
      ...updatedUser,
    }));

    return { previousUsers, previousUser };
  },

  onError: (error, variables, context) => {
    // Rollback de ambas queries
    if (context?.previousUsers) {
      queryClient.setQueryData(['users'], context.previousUsers);
    }
    if (context?.previousUser) {
      queryClient.setQueryData(['user', variables.id], context.previousUser);
    }
  },

  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
  },
});
```

## Query Cancellation - AbortController

```tsx
const fetchUser = async (userId: number, signal?: AbortSignal): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`, { signal });
  return response.json();
};

function UserProfile({ userId }: { userId: number }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: ({ signal }) => fetchUser(userId, signal),
  });

  return <div>{data?.name}</div>;
}

// La query se cancela automáticamente si:
// 1. El componente se desmonta
// 2. El userId cambia (nueva query, cancela la anterior)
// 3. Se llama a queryClient.cancelQueries()
```

## Performance Tips

### Memoize Query Keys

```tsx
// ❌ Malo: Crea nuevo array en cada render
function Component({ userId, filters }: Props) {
  const { data } = useQuery({
    queryKey: ['users', userId, filters], // Nuevo array cada render
    queryFn: () => fetchUsers(userId, filters),
  });
}

// ✅ Bueno: Memoizar query key
function Component({ userId, filters }: Props) {
  const queryKey = useMemo(
    () => ['users', userId, filters] as const,
    [userId, filters]
  );

  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchUsers(userId, filters),
  });
}
```

### Structural Sharing - Automático

```tsx
// TanStack Query hace structural sharing por defecto
// Si la nueva data es igual a la anterior, no re-renderiza

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  // structuralSharing: true (default)
});

// Incluso si fetchUsers retorna nuevo array,
// si los usuarios son iguales, no hay re-render
```

### Remove Unused Queries

```tsx
// Configurar gcTime agresivo para queries que no se usan
const { data } = useQuery({
  queryKey: ['temp-data'],
  queryFn: fetchTempData,
  gcTime: 0, // Eliminar de cache inmediatamente
});

// O limpiar manualmente
queryClient.removeQueries({ queryKey: ['temp-data'] });
```

## Resumen de Features Avanzadas

| Feature | Uso | Hook/API |
|---------|-----|----------|
| Infinite Scroll | Paginación infinita | `useInfiniteQuery` |
| Prefetching | Mejorar UX | `queryClient.prefetchQuery()` |
| Suspense | React 18+ suspense | `useSuspenseQuery` |
| SSR | Server-side rendering | `dehydrate()`, `HydrationBoundary` |
| Cancellation | Cancelar requests | `AbortSignal` automático |
| Optimistic Updates | UI inmediata | `onMutate`, `onError` |
| Structural Sharing | Performance automática | Enabled por defecto |

---

**Siguiente:** [TypeScript Guide](./typescript-guide.md) para tipos avanzados y type safety.
