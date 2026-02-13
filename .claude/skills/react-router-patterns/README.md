# React Router Patterns Skill

Guía completa de React Router v6.4+ con TypeScript para routing y navegación en aplicaciones React (non-Next.js).

## Qué Incluye Este Skill

### Core Features
- ✅ **Setup & Configuration**: BrowserRouter vs Data Router (createBrowserRouter)
- ✅ **Nested Routes**: Layouts compartidos, Outlet, jerarquías complejas
- ✅ **Dynamic Routes**: Parámetros de URL (useParams), tipado de params
- ✅ **Navigation**: Link, NavLink, useNavigate programático
- ✅ **Loaders & Actions (v6.4+)**: Data fetching y mutations sin useState
- ✅ **Protected Routes**: Auth guards, role-based routing
- ✅ **Search Params**: Query strings, filtros, paginación en URL
- ✅ **Error Handling**: errorElement, 404 pages, error boundaries
- ✅ **Code Splitting**: Lazy loading de routes, Suspense, optimización

### Data Router Patterns (v6.4+)
- 🚀 **Loaders**: Fetch data antes de renderizar
- 🚀 **Actions**: Handle forms sin useState/useEffect
- 🚀 **Defer**: Streaming data para UX optimizada
- 🚀 **Revalidation**: Auto-refresh después de mutations
- 🚀 **Optimistic UI**: useNavigation para loading states

## Estructura de Archivos

```
react-router-patterns/
├── SKILL.md                              # Guía principal con ejemplos esenciales
├── README.md                             # Este archivo
└── references/
    ├── loaders-actions.md                # Data router patterns completo
    ├── nested-routes.md                  # Layouts y Outlet (próximamente)
    ├── protected-routes.md               # Auth guards (próximamente)
    └── search-params.md                  # Query strings (próximamente)
```

## Instalación

```bash
npm install react-router-dom
```

## Setup Rápido

### Data Router (v6.4+ Recomendado)

```tsx
// src/main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'users/:userId',
        element: <UserProfile />,
        loader: userLoader,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

### Loader & Action Example

```tsx
// Loader: Fetch data antes de renderizar
export const userLoader = async ({ params }: LoaderFunctionArgs) => {
  const user = await fetch(`/api/users/${params.userId}`).then(r => r.json());
  return { user };
};

// Action: Handle form submissions
export const createUserAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const user = await createUser(formData);
  return redirect(`/users/${user.id}`);
};

// Component
function UserProfile() {
  const { user } = useLoaderData() as { user: User };
  return <div>{user.name}</div>;
}
```

## Casos de Uso

### ¿Cuándo Usar Este Skill?

- ✅ Implementar routing en SPA (Single Page App)
- ✅ Nested routes con layouts compartidos
- ✅ Data fetching antes de renderizar (loaders)
- ✅ Forms sin useState (actions)
- ✅ Protected routes con auth
- ✅ URL state (search params para filtros/paginación)
- ✅ Error handling por ruta
- ✅ Code splitting de routes

### ¿Qué NO Cubre Este Skill?

- ❌ Next.js routing (usa file-based routing)
- ❌ Remix routing (similar pero con diferencias)
- ❌ Server-side rendering (React Router es client-side)

## Comparativa de Versiones

### v6.0 (Legacy BrowserRouter)

```tsx
// Patrón antiguo: BrowserRouter + useEffect
function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

### v6.4+ (Data Router)

```tsx
// Patrón moderno: loader function
export const userLoader = async ({ params }) => {
  return await fetchUser(params.userId);
};

function UserProfile() {
  const user = useLoaderData();
  return <div>{user.name}</div>; // No loading state needed
}
```

**Beneficios v6.4+:**
- ✅ Menos boilerplate (sin useState, useEffect)
- ✅ Data cargada antes de renderizar
- ✅ Mejor UX (menos loading spinners)
- ✅ Type-safe con TypeScript
- ✅ Actions para mutations sin useState

## Ejemplos de Código

### Nested Routes con Layout

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

// RootLayout.tsx
function RootLayout() {
  return (
    <div>
      <Header />
      <Outlet /> {/* Renderiza children */}
      <Footer />
    </div>
  );
}
```

### Protected Routes

```tsx
const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
]);

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

### Search Params - Filtros y Paginación

```tsx
function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category');
  const page = Number(searchParams.get('page')) || 1;

  const handleFilter = (newCategory: string) => {
    setSearchParams({ category: newCategory, page: '1' });
    // URL: /products?category=electronics&page=1
  };

  return (
    <div>
      <select onChange={(e) => handleFilter(e.target.value)}>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
    </div>
  );
}
```

### Error Handling

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [...],
  },
]);

function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return <div>Unexpected error</div>;
}
```

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

const router = createBrowserRouter([
  {
    path: 'dashboard',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    ),
  },
]);
```

## Best Practices

### ✅ Arquitectura
1. Usar **Data Router** (createBrowserRouter) en lugar de BrowserRouter
2. **Loaders** para data fetching (no useEffect)
3. **Actions** para mutations (no useState + fetch)
4. **Layouts anidados** con Outlet para compartir UI
5. **Code splitting** para rutas grandes

### ✅ TypeScript
1. Tipar params con interfaces específicas
2. Tipar loaders con tipos de retorno explícitos
3. Tipar actions con ActionFunctionArgs
4. Type guards en error handling

### ✅ Performance
1. Lazy load rutas no críticas
2. Parallel loaders con Promise.all
3. Defer para data no crítica
4. Search params para estado en URL

### ✅ UX
1. Loading states con useNavigation
2. Optimistic UI con navigation.formData
3. Error boundaries por ruta
4. 404 pages con catch-all route

## Migración desde v6.0 a v6.4+

### Antes (v6.0)

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="users/:userId" element={<UserProfile />} />
    </Route>
  </Routes>
</BrowserRouter>
```

### Después (v6.4+)

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'users/:userId',
        element: <UserProfile />,
        loader: userLoader, // Nueva feature
      },
    ],
  },
]);

<RouterProvider router={router} />
```

## Testing

```tsx
// src/__tests__/router.test.tsx
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { render } from '@testing-library/react';

test('renders user profile', async () => {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/users/123'],
  });

  render(<RouterProvider router={router} />);

  // Assertions...
});
```

## Recursos Adicionales

- [React Router v6.4+ Docs](https://reactrouter.com/en/main)
- [Data Router Tutorial](https://reactrouter.com/en/main/guides/data-libs)
- [Migración Guide](https://reactrouter.com/en/main/upgrading/v6)

---

**Última actualización:** 2026-02-13
**Versión de React Router:** v6.4+
