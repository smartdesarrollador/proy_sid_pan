---
name: react-router-patterns
description: >
  Guía completa de React Router v6.4+ con TypeScript para navegación y routing en aplicaciones React.
  Usar cuando se necesite: setup de routing, nested routes, dynamic routes, navigation, loaders/actions,
  protected routes, search params, error handling, code splitting, layouts compartidos.
  Incluye data router patterns, tipos estrictos y arquitectura escalable para producción.
---

# React Router Patterns - v6.4+ con TypeScript

Guía completa para implementar routing en React con React Router v6.4+, data router patterns (loaders/actions), TypeScript y arquitectura escalable.

## ¿Qué es React Router v6.4+?

React Router v6.4+ introdujo **Data Routers** con features avanzadas:
- ✅ **Loaders**: Fetch data antes de renderizar componente
- ✅ **Actions**: Manejar formularios (POST/PUT/DELETE) sin useState
- ✅ **Error Boundaries**: Error handling automático por ruta
- ✅ **Defer**: Streaming de data para UX optimizada
- ✅ **Type Safety**: TypeScript first-class support

**Diferencia con Next.js:** React Router es para SPAs (Single Page Apps), Next.js es para SSR/SSG.

## Instalación

```bash
npm install react-router-dom
```

## Setup Básico - BrowserRouter

### App Router (v6.4+ Recomendado)

```tsx
// src/main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'users/:userId',
        element: <UserProfile />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
```

### Legacy BrowserRouter (v6.0)

```tsx
// src/App.tsx (legacy approach)
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="users/:userId" element={<UserProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Nested Routes - Layouts Compartidos

### Layout con Outlet

```tsx
// src/components/Layout.tsx
import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/users">Users</Link>
      </nav>

      <main>
        {/* Outlet renderiza las rutas hijas */}
        <Outlet />
      </main>

      <footer>Footer compartido</footer>
    </div>
  );
}
```

### Estructura Jerárquica

```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardLayout />, // Layout anidado
        children: [
          {
            index: true,
            element: <DashboardHome />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);

export default router;
```

**Resultado de URLs:**
- `/` → RootLayout > HomePage
- `/dashboard` → RootLayout > DashboardLayout > DashboardHome
- `/dashboard/settings` → RootLayout > DashboardLayout > SettingsPage

## Dynamic Routes - Parámetros

### useParams - Tipado Seguro

```tsx
// src/pages/UserProfile.tsx
import { useParams } from 'react-router-dom';

// Definir tipos de params
interface UserParams {
  userId: string;
}

export default function UserProfile() {
  const { userId } = useParams<UserParams>();

  // TypeScript sabe que userId es string | undefined
  if (!userId) {
    return <div>Invalid user ID</div>;
  }

  return (
    <div>
      <h1>User Profile #{userId}</h1>
    </div>
  );
}
```

### Múltiples Parámetros

```tsx
// Router config
{
  path: 'projects/:projectId/tasks/:taskId',
  element: <TaskDetail />,
}

// Component
interface TaskParams {
  projectId: string;
  taskId: string;
}

function TaskDetail() {
  const { projectId, taskId } = useParams<TaskParams>();

  return (
    <div>
      Project: {projectId}, Task: {taskId}
    </div>
  );
}
```

## Navigation - Link y useNavigate

### Link Component

```tsx
import { Link } from 'react-router-dom';

function UsersList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <Link to={`/users/${user.id}`}>{user.name}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### NavLink - Active State

```tsx
import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
        }
      >
        Home
      </NavLink>

      <NavLink
        to="/about"
        style={({ isActive }) => ({
          color: isActive ? 'blue' : 'black',
          fontWeight: isActive ? 'bold' : 'normal',
        })}
      >
        About
      </NavLink>
    </nav>
  );
}
```

### useNavigate - Navegación Programática

```tsx
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await login(credentials);

      // Navigate después de login exitoso
      navigate('/dashboard');

      // Navigate con replace (no agregar a history)
      navigate('/dashboard', { replace: true });

      // Navigate con state
      navigate('/dashboard', {
        state: { message: 'Login successful' },
      });

      // Navigate hacia atrás
      navigate(-1);
    } catch (error) {
      console.error('Login failed');
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

## Loaders - Data Fetching (v6.4+)

### Loader Function Tipada

```tsx
// src/loaders/userLoader.ts
import { LoaderFunctionArgs } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
}

export const userLoader = async ({ params }: LoaderFunctionArgs): Promise<User> => {
  const { userId } = params;

  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Response('User not found', { status: 404 });
  }

  return response.json();
};

// Router config
const router = createBrowserRouter([
  {
    path: 'users/:userId',
    element: <UserProfile />,
    loader: userLoader,
  },
]);
```

### useLoaderData - Acceder a Data

```tsx
// src/pages/UserProfile.tsx
import { useLoaderData } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UserProfile() {
  // Data ya está cargada (no undefined, no loading state)
  const user = useLoaderData() as User;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Parallel Loaders

```tsx
// Loader que carga múltiples recursos
export const dashboardLoader = async (): Promise<DashboardData> => {
  const [user, projects, stats] = await Promise.all([
    fetch('/api/user').then((r) => r.json()),
    fetch('/api/projects').then((r) => r.json()),
    fetch('/api/stats').then((r) => r.json()),
  ]);

  return { user, projects, stats };
};

// Component
function Dashboard() {
  const { user, projects, stats } = useLoaderData() as DashboardData;

  return (
    <div>
      <UserSection user={user} />
      <ProjectsList projects={projects} />
      <StatsWidget stats={stats} />
    </div>
  );
}
```

## Actions - Form Handling (v6.4+)

### Action Function Tipada

```tsx
// src/actions/createUserAction.ts
import { ActionFunctionArgs, redirect } from 'react-router-dom';

export const createUserAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const user = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  };

  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    return { error: 'Failed to create user' };
  }

  const newUser = await response.json();

  // Redirect después de crear
  return redirect(`/users/${newUser.id}`);
};

// Router config
const router = createBrowserRouter([
  {
    path: 'users/new',
    element: <CreateUserPage />,
    action: createUserAction,
  },
]);
```

### Form Component con Action

```tsx
// src/pages/CreateUserPage.tsx
import { Form, useActionData, useNavigation } from 'react-router-dom';

export default function CreateUserPage() {
  const actionData = useActionData() as { error?: string };
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <input name="name" required />
      <input name="email" type="email" required />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>

      {actionData?.error && (
        <div className="error">{actionData.error}</div>
      )}
    </Form>
  );
}
```

## Protected Routes

### ProtectedRoute Component

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect a login, guardando la ubicación original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
```

### Router con Protected Routes

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        // Protected routes wrapper
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
      {
        // Admin only routes
        element: <ProtectedRoute requiredRole="admin" />,
        children: [
          {
            path: 'admin',
            element: <AdminPanel />,
          },
        ],
      },
    ],
  },
]);
```

## Search Params - Query Strings

### useSearchParams

```tsx
import { useSearchParams } from 'react-router-dom';

function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer query params
  const category = searchParams.get('category'); // ?category=electronics
  const page = Number(searchParams.get('page')) || 1;

  // Actualizar query params
  const handleFilterChange = (newCategory: string) => {
    setSearchParams({ category: newCategory, page: '1' });
    // URL: /products?category=electronics&page=1
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  return (
    <div>
      <select onChange={(e) => handleFilterChange(e.target.value)}>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <Pagination page={page} onPageChange={handlePageChange} />
    </div>
  );
}
```

## Error Handling

### Error Element

```tsx
// src/pages/ErrorPage.tsx
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  );
}

// Router config
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      // ...routes
    ],
  },
]);
```

### 404 Not Found

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ...otras rutas
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

function NotFoundPage() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  );
}
```

## Code Splitting - Lazy Loading

### Lazy Routes

```tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<div>Loading Dashboard...</div>}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'users/:userId',
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <UserProfile />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<div>Loading Admin Panel...</div>}>
            <AdminPanel />
          </Suspense>
        ),
      },
    ],
  },
]);
```

### Wrapper Component para Lazy Routes

```tsx
// src/components/LazyRoute.tsx
import { Suspense, ComponentType } from 'react';

interface LazyRouteProps {
  Component: ComponentType<any>;
  fallback?: React.ReactNode;
}

export function LazyRoute({ Component, fallback = <div>Loading...</div> }: LazyRouteProps) {
  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
}

// Uso en router
const router = createBrowserRouter([
  {
    path: 'dashboard',
    element: <LazyRoute Component={lazy(() => import('./pages/Dashboard'))} />,
  },
]);
```

## Router Configuration Tipada

### Type-Safe Router

```tsx
// src/types/router.types.ts
export interface RouteParams {
  userId?: string;
  projectId?: string;
  taskId?: string;
}

export interface RouteState {
  from?: string;
  message?: string;
}

// src/router.tsx
import { createBrowserRouter, RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
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
];

const router = createBrowserRouter(routes);

export default router;
```

## Mejores Prácticas

### ✅ Arquitectura
1. **Usar Data Router** (createBrowserRouter) en lugar de BrowserRouter
2. **Loaders para fetching** en lugar de useEffect en componentes
3. **Actions para mutations** en lugar de useState + fetch
4. **Layouts anidados** con Outlet para compartir UI
5. **Code splitting** para rutas grandes (admin, dashboard)

### ✅ TypeScript
1. **Tipar params** con interfaces específicas
2. **Tipar loaders** con tipos de retorno explícitos
3. **Tipar actions** con ActionFunctionArgs
4. **Type guards** en error handling (isRouteErrorResponse)

### ✅ Performance
1. **Lazy load** rutas no críticas
2. **Parallel loaders** para múltiples requests
3. **Prefetch** con `<Link prefetch>` (experimental)
4. **Search params** para estado en URL (filtros, paginación)

### ✅ UX
1. **Loading states** con useNavigation
2. **Optimistic UI** con useNavigation.formData
3. **Error boundaries** por ruta con errorElement
4. **404 pages** con catch-all route (`path: '*'`)

## Referencias Adicionales

Para contenido detallado y ejemplos avanzados, consulta:

- **[Setup & Basics](references/setup-basics.md)** - Configuración, BrowserRouter vs Data Router
- **[Nested Routes](references/nested-routes.md)** - Layouts, Outlet, jerarquías complejas
- **[Loaders & Actions](references/loaders-actions.md)** - Data fetching, form handling, defer
- **[Protected Routes](references/protected-routes.md)** - Auth guards, role-based routing
- **[Search Params](references/search-params.md)** - Query strings, filtros, paginación

---

**Resumen:** React Router v6.4+ con Data Router patterns (loaders/actions) elimina boilerplate, provee type safety y optimiza UX. Perfecto para SPAs de producción con TypeScript.
