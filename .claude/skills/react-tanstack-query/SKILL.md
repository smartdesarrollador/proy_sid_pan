---
name: react-tanstack-query
description: >
  Guía completa de TanStack Query (React Query) v5 con TypeScript para gestión profesional de server state.
  Usar cuando se necesite: fetching data, caching, mutations, optimistic updates, infinite scroll, prefetching,
  invalidación de cache, dependent queries, suspense, o cualquier patrón de server state management.
  Incluye setup, mejores prácticas y patrones de producción con tipos estrictos.
---

# TanStack Query v5 - Server State Management con TypeScript

Guía completa para dominar TanStack Query v5 (React Query), la librería líder para gestión de server state en React con TypeScript.

## ¿Qué es TanStack Query?

TanStack Query es una librería para **server state management** que simplifica:
- **Fetching**: Obtener datos del servidor
- **Caching**: Almacenamiento inteligente con invalidación automática
- **Synchronization**: Mantener datos actualizados
- **Updates**: Mutaciones con optimistic updates y rollback
- **Pagination**: Infinite scroll y paginación tradicional
- **Prefetching**: Mejorar UX precargando datos

**Beneficios sobre fetch/axios directo:**
- ✅ Cache automático con invalidación inteligente
- ✅ Deduplicación de requests (evita llamadas duplicadas)
- ✅ Background refetching y polling
- ✅ Optimistic updates con rollback en error
- ✅ DevTools para debugging
- ✅ TypeScript first-class support
- ✅ Eliminación de boilerplate de loading/error/data

## Instalación y Setup Básico

```bash
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

### QueryClient Provider Setup

```tsx
// src/main.tsx o src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Crear QueryClient con configuración global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - cuánto tiempo los datos son "frescos"
      gcTime: 1000 * 60 * 10,   // 10 minutos (antes "cacheTime" en v4)
      retry: 1,                  // Reintentos en caso de error
      refetchOnWindowFocus: false, // No refetch al enfocar ventana
      refetchOnReconnect: true,    // Refetch al reconectar internet
    },
    mutations: {
      retry: 0, // No reintentar mutaciones por defecto
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* DevTools solo en desarrollo */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## useQuery - Fetching Data

### Básico: GET Request

```tsx
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
}

// Función de fetching (puede estar en un archivo separado)
const fetchUser = async (userId: number): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};

function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['user', userId],  // Key única para cache
    queryFn: () => fetchUser(userId),
  });

  // Estados de carga
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  // data es User, no User | undefined gracias a los checks
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
      {isFetching && <span>Updating in background...</span>}
    </div>
  );
}
```

### Query Keys - Sistema de Cache

```tsx
// ✅ Query keys deben ser arrays con identificadores únicos
useQuery({ queryKey: ['users'], queryFn: fetchUsers });
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });
useQuery({ queryKey: ['users', { status: 'active', page: 1 }], queryFn: fetchActiveUsers });

// ❌ Evitar:
useQuery({ queryKey: ['user'], queryFn: () => fetchUser(userId) }); // No único
useQuery({ queryKey: [userId], queryFn: () => fetchUser(userId) }); // Confuso sin namespace
```

**Reglas de Query Keys:**
1. Arrays jerárquicos: `['resource', id, params]`
2. Primitivos para IDs: `['user', 123]`
3. Objetos para filtros: `['users', { status: 'active' }]`
4. Namespace primero: `['users']` > `['user', 123]` > `['user', 123, 'posts']`

### Estados del Query

```tsx
const { data, isLoading, isPending, isError, isFetching, status } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

// isLoading: Primera vez cargando (no hay data en cache)
// isPending: Similar a isLoading (v5 renombró "loading" → "pending")
// isFetching: Cualquier fetch (incluye background refetch)
// isError: Ocurrió un error
// status: 'pending' | 'error' | 'success'
```

### Dependent Queries - Queries que Dependen de Otras

```tsx
function UserProjects({ userId }: { userId: number }) {
  // Query 1: Obtener usuario
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Query 2: Obtener proyectos del usuario (depende de user.companyId)
  const { data: projects } = useQuery({
    queryKey: ['projects', user?.companyId],
    queryFn: () => fetchProjects(user!.companyId),
    enabled: !!user?.companyId, // Solo ejecutar si existe companyId
  });

  return <ProjectList projects={projects} />;
}
```

### Conditional Queries con skipToken (v5)

```tsx
import { useQuery, skipToken } from '@tanstack/react-query';

function UserProjects({ userId }: { userId: number | undefined }) {
  // ✅ v5: Usar skipToken para queries condicionales con type safety
  const { data: projects } = useQuery({
    queryKey: ['projects', userId],
    queryFn: userId ? () => fetchProjects(userId) : skipToken,
  });

  // data es Projects | undefined (nunca arroja error si userId es undefined)
}
```

## useMutation - Create, Update, Delete

### Mutación Básica: POST/PUT/DELETE

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateUserInput {
  name: string;
  email: string;
}

const createUser = async (input: CreateUserInput): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      // Invalidar queries para refetch automático
      queryClient.invalidateQueries({ queryKey: ['users'] });
      console.log('User created:', newUser);
    },
    onError: (error: Error) => {
      console.error('Error creating user:', error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create User'}
      </button>
      {mutation.isError && <p>Error: {mutation.error.message}</p>}
      {mutation.isSuccess && <p>User created successfully!</p>}
    </form>
  );
}
```

### Optimistic Updates - Actualización UI Inmediata

```tsx
interface UpdateUserInput {
  id: number;
  name: string;
}

const updateUser = async (input: UpdateUserInput): Promise<User> => {
  const response = await fetch(`/api/users/${input.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update');
  return response.json();
};

function EditUserForm({ userId }: { userId: number }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateUser,

    // Antes de la mutación: Actualizar UI optimísticamente
    onMutate: async (newData) => {
      const queryKey = ['user', userId];

      // 1. Cancelar refetches para evitar override
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot del valor anterior (para rollback)
      const previousUser = queryClient.getQueryData<User>(queryKey);

      // 3. Actualizar cache optimísticamente
      queryClient.setQueryData<User>(queryKey, (old) => ({
        ...old!,
        name: newData.name,
      }));

      // 4. Retornar context con snapshot para rollback
      return { previousUser };
    },

    // Si hay error: Rollback
    onError: (error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(['user', userId], context.previousUser);
      }
      console.error('Update failed, rolled back:', error);
    },

    // Siempre refetch después (success o error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({ id: userId, name: 'New Name' });
    }}>
      {/* Form fields */}
    </form>
  );
}
```

## Query Invalidation - Actualizar Cache

```tsx
const queryClient = useQueryClient();

// Invalidar query específica
queryClient.invalidateQueries({ queryKey: ['user', 123] });

// Invalidar todas las queries de usuarios
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidar con predicado
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === 'users',
});

// Refetch inmediato
queryClient.refetchQueries({ queryKey: ['users'] });

// Actualizar cache manualmente (sin refetch)
queryClient.setQueryData(['user', 123], (old: User | undefined) => ({
  ...old!,
  name: 'Updated Name',
}));
```

## Paginación con useInfiniteQuery

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

interface UsersPage {
  users: User[];
  nextCursor: number | null;
}

const fetchUsersPage = async ({ pageParam = 0 }): Promise<UsersPage> => {
  const response = await fetch(`/api/users?cursor=${pageParam}&limit=10`);
  return response.json();
};

function InfiniteUserList() {
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

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'No more results'}
      </button>
    </div>
  );
}
```

## Prefetching - Mejorar UX

```tsx
import { useQueryClient } from '@tanstack/react-query';

function UserList() {
  const queryClient = useQueryClient();

  const handleMouseEnter = (userId: number) => {
    // Prefetch datos del usuario cuando hover sobre el card
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 60000, // Cache por 1 minuto
    });
  };

  return (
    <div>
      {users.map((user) => (
        <div
          key={user.id}
          onMouseEnter={() => handleMouseEnter(user.id)}
        >
          <Link to={`/users/${user.id}`}>{user.name}</Link>
        </div>
      ))}
    </div>
  );
}
```

## Suspense Support (v5)

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

function UserProfile({ userId }: { userId: number }) {
  // data NUNCA es undefined con useSuspenseQuery
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <div>{data.name}</div>; // No need for null checks
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

## DevTools - Debugging

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />

      {/* DevTools para inspeccionar queries, cache, mutations */}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="bottom-right"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
```

## Mejores Prácticas

### 1. Organizar Query Functions
```tsx
// src/api/users.ts
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getById: async (id: number): Promise<User> => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  create: async (input: CreateUserInput): Promise<User> => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
};
```

### 2. Custom Hooks para Queries
```tsx
// src/hooks/useUser.ts
export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getById(userId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Uso en componente
function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading } = useUser(userId);
  // ...
}
```

### 3. Error Handling Global
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx
        if (error instanceof Error && error.message.includes('404')) {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error) => {
        console.error('Query error:', error);
        // Mostrar toast global
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        // Mostrar toast de error
      },
    },
  },
});
```

## Referencias Adicionales

Para contenido detallado y ejemplos avanzados, consulta:

- **[Setup & Configuration](references/setup-configuration.md)** - QueryClient config, providers, staleTime vs gcTime
- **[Queries Patterns](references/queries-patterns.md)** - useQuery avanzado, parallel queries, polling
- **[Mutations Patterns](references/mutations-patterns.md)** - Mutaciones complejas, optimistic updates, rollback
- **[Advanced Features](references/advanced-features.md)** - Infinite queries, prefetching, SSR, streaming
- **[TypeScript Guide](references/typescript-guide.md)** - Tipos avanzados, inferencia, generics, error handling

## Migración desde v4 a v5

Principales cambios:
- `cacheTime` → `gcTime` (garbage collection time)
- `isLoading` → `isPending`
- Overloads removidos: siempre usar objeto único `useQuery({ ... })`
- `enabled: false` → `skipToken` para type safety
- Suspense estable: `useSuspenseQuery`

## Recursos Oficiales

- [Documentación Oficial](https://tanstack.com/query/v5/docs/framework/react/overview)
- [TypeScript Guide](https://tanstack.com/query/v5/docs/framework/react/typescript)
- [Migration Guide v4 → v5](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5)

---

**Resumen:** TanStack Query v5 elimina boilerplate, provee cache inteligente y optimistic updates con TypeScript first-class support. Perfecto para apps de producción que necesitan server state management robusto.
