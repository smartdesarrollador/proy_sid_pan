# Queries Patterns - TanStack Query v5

Patrones avanzados de useQuery para casos de uso reales en producción.

## Parallel Queries - Múltiples Queries Independientes

```tsx
function Dashboard() {
  // Ejecutar múltiples queries en paralelo
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const analyticsQuery = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  // Manejar estados de carga combinados
  if (userQuery.isLoading || projectsQuery.isLoading || analyticsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (userQuery.isError) return <div>Error loading user</div>;
  if (projectsQuery.isError) return <div>Error loading projects</div>;

  return (
    <div>
      <UserSection user={userQuery.data} />
      <ProjectsSection projects={projectsQuery.data} />
      <AnalyticsSection analytics={analyticsQuery.data} />
    </div>
  );
}
```

### useQueries - Dinámico con Arrays

```tsx
import { useQueries } from '@tanstack/react-query';

function MultiUserProfiles({ userIds }: { userIds: number[] }) {
  // Crear queries dinámicamente desde array
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  // Verificar si todas las queries completaron
  const isLoading = userQueries.some((query) => query.isLoading);
  const isError = userQueries.some((query) => query.isError);

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div>Error loading some users</div>;

  return (
    <div>
      {userQueries.map((query, index) => (
        <UserCard key={userIds[index]} user={query.data} />
      ))}
    </div>
  );
}
```

### Combine Hook Pattern

```tsx
// Custom hook para combinar queries relacionadas
interface DashboardData {
  user: User;
  projects: Project[];
  analytics: Analytics;
  isLoading: boolean;
  isError: boolean;
}

function useDashboard(): DashboardData {
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const analyticsQuery = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  return {
    user: userQuery.data!,
    projects: projectsQuery.data!,
    analytics: analyticsQuery.data!,
    isLoading: userQuery.isLoading || projectsQuery.isLoading || analyticsQuery.isLoading,
    isError: userQuery.isError || projectsQuery.isError || analyticsQuery.isError,
  };
}

// Uso simplificado
function Dashboard() {
  const { user, projects, analytics, isLoading, isError } = useDashboard();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <div>
      <UserSection user={user} />
      <ProjectsSection projects={projects} />
      <AnalyticsSection analytics={analytics} />
    </div>
  );
}
```

## Dependent Queries - Queries en Secuencia

### enabled Option - Query Condicional

```tsx
function UserProjects({ userId }: { userId: number }) {
  // Query 1: Obtener usuario
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Query 2: Obtener proyectos (solo si user.companyId existe)
  const { data: projects } = useQuery({
    queryKey: ['projects', user?.companyId],
    queryFn: () => fetchProjects(user!.companyId),
    enabled: !!user?.companyId, // Solo ejecutar si existe companyId
  });

  return <div>{/* Render projects */}</div>;
}
```

### skipToken Pattern (v5 - Type Safe)

```tsx
import { useQuery, skipToken } from '@tanstack/react-query';

function UserProjects({ userId }: { userId: number | undefined }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: userId ? () => fetchUser(userId) : skipToken,
  });

  // TypeScript sabe que user puede ser undefined
  const { data: projects } = useQuery({
    queryKey: ['projects', user?.companyId],
    queryFn: user?.companyId
      ? () => fetchProjects(user.companyId)
      : skipToken,
  });

  return <div>{/* Render */}</div>;
}
```

### Cascading Queries

```tsx
function UserHierarchy({ userId }: { userId: number }) {
  // Nivel 1: Usuario
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Nivel 2: Departamento del usuario
  const { data: department } = useQuery({
    queryKey: ['department', user?.departmentId],
    queryFn: () => fetchDepartment(user!.departmentId),
    enabled: !!user?.departmentId,
  });

  // Nivel 3: Manager del departamento
  const { data: manager } = useQuery({
    queryKey: ['user', department?.managerId],
    queryFn: () => fetchUser(department!.managerId),
    enabled: !!department?.managerId,
  });

  if (!user) return <div>Loading user...</div>;
  if (!department) return <div>Loading department...</div>;
  if (!manager) return <div>Loading manager...</div>;

  return (
    <div>
      <p>User: {user.name}</p>
      <p>Department: {department.name}</p>
      <p>Manager: {manager.name}</p>
    </div>
  );
}
```

## Polling - Auto Refetch

### Interval Polling

```tsx
// Polling cada 5 segundos
function StockPrice({ symbol }: { symbol: string }) {
  const { data: price, dataUpdatedAt } = useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockPrice(symbol),
    refetchInterval: 5000, // Refetch cada 5s
    staleTime: 0,          // Siempre stale para permitir refetch
  });

  return (
    <div>
      <p>Price: ${price}</p>
      <p>Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
    </div>
  );
}
```

### Conditional Polling - Solo cuando visible

```tsx
function LiveDashboard() {
  const [isActive, setIsActive] = useState(true);

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: isActive ? 10000 : false, // Polling solo si isActive
  });

  return (
    <div>
      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Pause' : 'Resume'} Polling
      </button>
      <Dashboard data={data} />
    </div>
  );
}
```

### Smart Polling - Adaptativo según error/success

```tsx
function AdaptivePolling() {
  const { data, isError } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    refetchInterval: (query) => {
      // Si hay error, polling más lento
      if (query.state.status === 'error') {
        return 30000; // 30s
      }
      // Si éxito, polling normal
      return 5000; // 5s
    },
  });
}
```

## Pagination - Páginas Tradicionales

### Basic Pagination

```tsx
function UserList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),
    placeholderData: keepPreviousData, // Mantener data anterior mientras carga nueva
  });

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {data?.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      <div>
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={isPlaceholderData || !data?.hasMore}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Prefetch Next Page

```tsx
function PaginatedList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers(page),
  });

  // Prefetch página siguiente
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

## Select - Transformar Data

### Basic Transformation

```tsx
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

function UserFullName({ userId }: { userId: number }) {
  // Transformar data antes de retornar
  const { data: fullName } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    select: (user) => `${user.firstName} ${user.lastName}`,
  });

  return <div>{fullName}</div>; // string, no User
}
```

### Filter and Sort

```tsx
interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

function ProductList() {
  const { data: availableProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    select: (products) =>
      products
        .filter((p) => p.inStock)
        .sort((a, b) => a.price - b.price),
  });

  return (
    <div>
      {availableProducts?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Memoized Select - Performance

```tsx
function FilteredUsers({ status }: { status: 'active' | 'inactive' }) {
  // ❌ Malo: select crea nueva función en cada render
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: (users) => users.filter((u) => u.status === status),
  });

  // ✅ Bueno: Memoizar select con useCallback
  const selectFiltered = useCallback(
    (users: User[]) => users.filter((u) => u.status === status),
    [status]
  );

  const { data: filteredUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: selectFiltered,
  });
}
```

## placeholderData - UX Optimization

### Show Old Data While Refetching

```tsx
import { keepPreviousData } from '@tanstack/react-query';

function SearchResults({ query }: { query: string }) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAPI(query),
    placeholderData: keepPreviousData, // Mostrar resultados anteriores mientras carga
  });

  return (
    <div>
      {isPlaceholderData && <div>Updating...</div>}
      <Results data={data} />
    </div>
  );
}
```

### Initial Placeholder Data

```tsx
function UserProfile({ userId }: { userId: number }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    placeholderData: {
      // Placeholder mientras carga
      id: userId,
      name: 'Loading...',
      email: 'loading@example.com',
    },
  });

  return <div>{user.name}</div>; // Muestra "Loading..." inmediatamente
}
```

## initialData - Seed Cache

### Set Initial Data from Props

```tsx
function UserProfile({ userId, initialUser }: { userId: number; initialUser?: User }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    initialData: initialUser, // Usar data inicial si está disponible
    staleTime: 5 * 60 * 1000,
  });

  return <div>{user.name}</div>;
}
```

### Hydrate from Server (SSR)

```tsx
// Server-side
export async function getServerSideProps() {
  const user = await fetchUser(1);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      initialUser: user,
    },
  };
}

// Client-side
function Page({ initialUser }: { initialUser: User }) {
  const { data: user } = useQuery({
    queryKey: ['user', 1],
    queryFn: () => fetchUser(1),
    initialData: initialUser,
    staleTime: Infinity, // No refetch si ya tenemos data de SSR
  });
}
```

## Error Handling Avanzado

### Retry Logic Condicional

```tsx
const { data, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  retry: (failureCount, error) => {
    // No reintentar en errores 4xx (client errors)
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('404') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')
      ) {
        return false; // No reintentar
      }
    }
    // Reintentar hasta 3 veces para errores de red
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### Error Boundary Integration

```tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <UserProfile userId={1} />
    </ErrorBoundary>
  );
}

function UserProfile({ userId }: { userId: number }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    useErrorBoundary: true, // Throw error to boundary
  });

  return <div>{data.name}</div>;
}
```

### Custom Error Types

```tsx
class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const fetchUser = async (userId: number): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    throw new APIError(
      response.status,
      `Failed to fetch user: ${response.statusText}`
    );
  }

  return response.json();
};

function UserProfile({ userId }: { userId: number }) {
  const { data, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (error instanceof APIError) {
    if (error.statusCode === 404) {
      return <div>User not found</div>;
    }
    if (error.statusCode === 403) {
      return <div>Access denied</div>;
    }
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{data?.name}</div>;
}
```

## Meta Data - Contexto Adicional

```tsx
const { data, failureCount, failureReason } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  meta: {
    errorMessage: 'Failed to load user profile',
    showToast: true,
  },
});

// Acceder a meta desde global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error, query) => {
        const meta = query.meta as { errorMessage?: string; showToast?: boolean };
        if (meta?.showToast) {
          toast.error(meta.errorMessage || error.message);
        }
      },
    },
  },
});
```

## Resumen de Patrones

| Patrón | Caso de Uso | Hook/Opción |
|--------|-------------|-------------|
| Parallel Queries | Múltiples queries independientes | Múltiples `useQuery` |
| Dynamic Queries | Array dinámico de queries | `useQueries` |
| Dependent Queries | Query depende de otra | `enabled` o `skipToken` |
| Polling | Auto-refetch periódico | `refetchInterval` |
| Pagination | Páginas tradicionales | `keepPreviousData` |
| Transform Data | Filtrar/ordenar/mapear | `select` |
| Placeholder Data | Mostrar data antigua mientras carga | `placeholderData` |
| Initial Data | Seed cache con data de SSR/props | `initialData` |
| Error Handling | Retry condicional, error boundaries | `retry`, `useErrorBoundary` |
| Metadata | Contexto adicional para queries | `meta` |

---

**Siguiente:** [Mutations Patterns](./mutations-patterns.md) para mutaciones avanzadas y optimistic updates.
