# Loaders & Actions - Data Router Patterns

Guía completa de loaders y actions en React Router v6.4+, el patrón moderno para data fetching y mutations sin useState.

## ¿Por Qué Loaders y Actions?

### Antes (React Router v6.0)

```tsx
// ❌ Patrón antiguo: useEffect + fetch
function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.name}</div>;
}
```

### Ahora (React Router v6.4+ con Loaders)

```tsx
// ✅ Patrón moderno: loader function
export const userLoader = async ({ params }: LoaderFunctionArgs): Promise<User> => {
  const response = await fetch(`/api/users/${params.userId}`);
  if (!response.ok) throw new Response('Not found', { status: 404 });
  return response.json();
};

function UserProfile() {
  const user = useLoaderData() as User;
  return <div>{user.name}</div>; // Data ya cargada, no loading/error states
}
```

**Beneficios:**
- ✅ Data cargada **antes** de renderizar componente
- ✅ Eliminación de loading/error boilerplate
- ✅ Mejor UX (menos flashes de loading)
- ✅ Código más limpio y testeable
- ✅ Type-safe con TypeScript

## Loaders - Data Fetching

### Loader Function Signature

```tsx
import { LoaderFunctionArgs } from 'react-router-dom';

interface LoaderData {
  user: User;
  posts: Post[];
}

export const myLoader = async ({
  params,   // Parámetros de URL (:userId)
  request,  // Request object (URL, headers, etc.)
}: LoaderFunctionArgs): Promise<LoaderData> => {
  // Fetch data aquí
  return { user, posts };
};
```

### Acceder a Params

```tsx
// Route: /users/:userId/posts/:postId
export const postLoader = async ({ params }: LoaderFunctionArgs) => {
  const { userId, postId } = params;

  const post = await fetch(`/api/users/${userId}/posts/${postId}`).then((r) => r.json());

  return { post };
};

// Component
function PostDetail() {
  const { post } = useLoaderData() as { post: Post };
  return <div>{post.title}</div>;
}
```

### Acceder a Search Params

```tsx
// URL: /products?category=electronics&page=2
export const productsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const page = url.searchParams.get('page') || '1';

  const products = await fetch(
    `/api/products?category=${category}&page=${page}`
  ).then((r) => r.json());

  return { products, category, page: Number(page) };
};

function ProductsList() {
  const { products, category, page } = useLoaderData() as {
    products: Product[];
    category: string;
    page: number;
  };

  return (
    <div>
      <h1>Category: {category}</h1>
      <p>Page: {page}</p>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

### Parallel Data Loading

```tsx
// Cargar múltiples recursos en paralelo
export const dashboardLoader = async (): Promise<DashboardData> => {
  const [user, projects, notifications, stats] = await Promise.all([
    fetch('/api/user').then((r) => r.json()),
    fetch('/api/projects').then((r) => r.json()),
    fetch('/api/notifications').then((r) => r.json()),
    fetch('/api/stats').then((r) => r.json()),
  ]);

  return { user, projects, notifications, stats };
};

// Component
function Dashboard() {
  const { user, projects, notifications, stats } = useLoaderData() as DashboardData;

  return (
    <div>
      <UserSection user={user} />
      <ProjectsList projects={projects} />
      <NotificationsBell notifications={notifications} />
      <StatsWidget stats={stats} />
    </div>
  );
}
```

### Error Handling en Loaders

```tsx
export const userLoader = async ({ params }: LoaderFunctionArgs): Promise<User> => {
  const response = await fetch(`/api/users/${params.userId}`);

  // Throw Response para error handling
  if (response.status === 404) {
    throw new Response('User not found', { status: 404 });
  }

  if (response.status === 403) {
    throw new Response('Forbidden', { status: 403 });
  }

  if (!response.ok) {
    throw new Error('Failed to load user');
  }

  return response.json();
};

// Error boundary recibe el error
function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return <div>Unexpected error</div>;
}
```

### Loaders con Autenticación

```tsx
// src/loaders/protectedLoader.ts
export const protectedLoader = async ({ request }: LoaderFunctionArgs) => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // Redirect a login si no está autenticado
    throw redirect('/login');
  }

  try {
    const user = await fetch('/api/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((r) => r.json());

    return { user };
  } catch (error) {
    // Token inválido, redirect a login
    throw redirect('/login');
  }
};

// Router config
{
  path: 'dashboard',
  element: <Dashboard />,
  loader: protectedLoader,
}
```

### Conditional Loaders

```tsx
// Loader que carga data solo si es necesario
export const userLoader = async ({ params, request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const includeProjects = url.searchParams.get('projects') === 'true';

  const user = await fetch(`/api/users/${params.userId}`).then((r) => r.json());

  if (includeProjects) {
    const projects = await fetch(`/api/users/${params.userId}/projects`).then((r) => r.json());
    return { user, projects };
  }

  return { user, projects: null };
};
```

## Actions - Mutations

### Action Function Signature

```tsx
import { ActionFunctionArgs } from 'react-router-dom';

export const myAction = async ({
  params,   // Parámetros de URL
  request,  // Request con formData
}: ActionFunctionArgs) => {
  const formData = await request.formData();

  // Procesar mutation
  const result = await createResource(formData);

  // Retornar data o redirect
  return { success: true, data: result };
  // O: return redirect('/success');
};
```

### CREATE - POST Request

```tsx
// src/actions/createUserAction.ts
export const createUserAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const user = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    role: formData.get('role') as string,
  };

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message };
    }

    const newUser = await response.json();

    // Redirect a la página del nuevo usuario
    return redirect(`/users/${newUser.id}`);
  } catch (error) {
    return { error: 'Failed to create user' };
  }
};

// Router config
{
  path: 'users/new',
  element: <CreateUserPage />,
  action: createUserAction,
}
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
      <input name="name" required placeholder="Name" />
      <input name="email" type="email" required placeholder="Email" />

      <select name="role">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

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

### UPDATE - PUT Request

```tsx
// src/actions/updateUserAction.ts
export const updateUserAction = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const { userId } = params;

  const updates = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  };

  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    return { error: 'Failed to update user' };
  }

  // Redirect de vuelta a la página del usuario
  return redirect(`/users/${userId}`);
};

// Form
function EditUserPage() {
  const user = useLoaderData() as User;
  const actionData = useActionData() as { error?: string };

  return (
    <Form method="put">
      <input name="name" defaultValue={user.name} required />
      <input name="email" defaultValue={user.email} required />

      <button type="submit">Update User</button>

      {actionData?.error && <div>{actionData.error}</div>}
    </Form>
  );
}
```

### DELETE - DELETE Request

```tsx
// src/actions/deleteUserAction.ts
export const deleteUserAction = async ({ params }: ActionFunctionArgs) => {
  const { userId } = params;

  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    return { error: 'Failed to delete user' };
  }

  // Redirect a lista de usuarios después de delete
  return redirect('/users');
};

// Component con delete button
function UserProfile() {
  const user = useLoaderData() as User;
  const { submit } = useSubmit();

  const handleDelete = () => {
    if (confirm(`Delete ${user.name}?`)) {
      submit(null, { method: 'delete' });
    }
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={handleDelete}>Delete User</button>
    </div>
  );
}

// Router
{
  path: 'users/:userId',
  element: <UserProfile />,
  loader: userLoader,
  action: deleteUserAction,
}
```

### Multiple Actions en una Ruta

```tsx
// Usar intent field para diferenciar acciones
export const userAction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case 'update':
      return updateUser(params.userId!, formData);

    case 'delete':
      return deleteUser(params.userId!);

    case 'archive':
      return archiveUser(params.userId!);

    default:
      throw new Error('Invalid intent');
  }
};

// Component
function UserActions() {
  return (
    <div>
      <Form method="post">
        <input type="hidden" name="intent" value="update" />
        <input name="name" />
        <button type="submit">Update</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="intent" value="archive" />
        <button type="submit">Archive</button>
      </Form>
    </div>
  );
}
```

## useNavigation - Loading States

### Optimistic UI

```tsx
import { useNavigation } from 'react-router-dom';

function CreateTaskForm() {
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';
  const isLoading = navigation.state === 'loading';

  // Access form data durante submit (optimistic UI)
  const optimisticTask = navigation.formData?.get('title');

  return (
    <div>
      <Form method="post">
        <input name="title" required />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </button>
      </Form>

      {isSubmitting && optimisticTask && (
        <div className="opacity-50">
          Creating task: {optimisticTask}...
        </div>
      )}

      {isLoading && <div>Redirecting...</div>}
    </div>
  );
}
```

## Revalidation - Auto Refresh

```tsx
// Después de una action, React Router automáticamente re-ejecuta loaders
// para actualizar la UI con data fresca

// Ejemplo: Después de crear un task, la lista se actualiza automáticamente

export const tasksLoader = async () => {
  const tasks = await fetch('/api/tasks').then((r) => r.json());
  return { tasks };
};

export const createTaskAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const task = await createTask(formData);

  // Después del redirect, tasksLoader se re-ejecuta automáticamente
  return redirect('/tasks');
};

// Router
{
  path: 'tasks',
  element: <TasksList />,
  loader: tasksLoader,
}
{
  path: 'tasks/new',
  element: <CreateTaskPage />,
  action: createTaskAction,
}
```

### Manual Revalidation

```tsx
import { useRevalidator } from 'react-router-dom';

function TasksList() {
  const { tasks } = useLoaderData() as { tasks: Task[] };
  const { revalidate } = useRevalidator();

  const handleRefresh = () => {
    revalidate(); // Re-ejecutar loader manualmente
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

## Defer - Streaming Data

### Defer para UX Optimizada

```tsx
import { defer, Await } from 'react-router-dom';
import { Suspense } from 'react';

// Loader con defer (streaming)
export const dashboardLoader = async () => {
  // Data crítica: esperar
  const user = await fetch('/api/user').then((r) => r.json());

  // Data no crítica: no esperar (streaming)
  const projectsPromise = fetch('/api/projects').then((r) => r.json());
  const statsPromise = fetch('/api/stats').then((r) => r.json());

  return defer({
    user, // Ya resuelto
    projects: projectsPromise, // Promise sin resolver
    stats: statsPromise, // Promise sin resolver
  });
};

// Component
function Dashboard() {
  const data = useLoaderData() as {
    user: User;
    projects: Promise<Project[]>;
    stats: Promise<Stats>;
  };

  return (
    <div>
      {/* User ya está disponible */}
      <h1>Welcome, {data.user.name}</h1>

      {/* Projects se cargan con Suspense */}
      <Suspense fallback={<div>Loading projects...</div>}>
        <Await resolve={data.projects}>
          {(projects) => <ProjectsList projects={projects} />}
        </Await>
      </Suspense>

      {/* Stats se cargan con Suspense */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <Await resolve={data.stats}>
          {(stats) => <StatsWidget stats={stats} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Mejores Prácticas

1. ✅ **Loaders para GET**, actions para POST/PUT/DELETE
2. ✅ **Throw Response** en loaders para errores HTTP
3. ✅ **Redirect** después de mutations exitosas
4. ✅ **useNavigation** para loading states
5. ✅ **Parallel fetching** con Promise.all
6. ✅ **Defer** para data no crítica
7. ✅ **Revalidation** automática después de actions
8. ✅ **Type safety** con interfaces para loader/action data

---

**Resumen:** Loaders y actions eliminan boilerplate de useState + useEffect, proveen mejor UX y type safety. Son el patrón moderno para data fetching en React Router v6.4+.
