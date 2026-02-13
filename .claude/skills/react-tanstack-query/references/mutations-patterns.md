# Mutations Patterns - TanStack Query v5

Patrones avanzados de useMutation para crear, actualizar y eliminar datos con optimistic updates y gestión de errores.

## useMutation Básico

### POST - Create

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateUserInput {
  name: string;
  email: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const createUser = async (input: CreateUserInput): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
};

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUser,

    onSuccess: (newUser) => {
      // Opción 1: Invalidar queries para refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Opción 2: Actualizar cache manualmente
      queryClient.setQueryData<User[]>(['users'], (old) => [...(old || []), newUser]);
    },

    onError: (error) => {
      console.error('Error creating user:', error);
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

      {mutation.isError && (
        <div className="error">Error: {mutation.error.message}</div>
      )}

      {mutation.isSuccess && (
        <div className="success">User created: {mutation.data.name}</div>
      )}
    </form>
  );
}
```

### PUT - Update

```tsx
interface UpdateUserInput {
  id: number;
  name: string;
  email: string;
}

const updateUser = async (input: UpdateUserInput): Promise<User> => {
  const response = await fetch(`/api/users/${input.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to update user');
  }

  return response.json();
};

function EditUserForm({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateUser,

    onSuccess: (updatedUser) => {
      // Actualizar cache del usuario específico
      queryClient.setQueryData(['user', updatedUser.id], updatedUser);

      // Invalidar lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    mutation.mutate({
      id: user.id,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" defaultValue={user.name} required />
      <input name="email" defaultValue={user.email} type="email" required />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

### DELETE - Remove

```tsx
const deleteUser = async (userId: number): Promise<void> => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
};

function UserCard({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteUser,

    onSuccess: () => {
      // Opción 1: Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // Opción 2: Actualizar cache removiendo el usuario
      queryClient.setQueryData<User[]>(['users'], (old) =>
        old?.filter((u) => u.id !== user.id)
      );
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure?')) {
      mutation.mutate(user.id);
    }
  };

  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={handleDelete} disabled={mutation.isPending}>
        {mutation.isPending ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
```

## Optimistic Updates - Actualización UI Inmediata

### Optimistic Update Pattern

```tsx
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const toggleTodo = async (id: number): Promise<Todo> => {
  const response = await fetch(`/api/todos/${id}/toggle`, {
    method: 'PATCH',
  });
  return response.json();
};

function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: toggleTodo,

    // 1. onMutate: Ejecutar ANTES de la mutación
    onMutate: async (todoId) => {
      // Cancelar refetches para evitar sobrescribir optimistic update
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // Snapshot del valor anterior (para rollback)
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Actualizar cache optimísticamente
      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map((t) =>
          t.id === todoId ? { ...t, completed: !t.completed } : t
        )
      );

      // Retornar context para rollback
      return { previousTodos };
    },

    // 2. onError: Si falla, hacer rollback
    onError: (error, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
      console.error('Failed to toggle todo:', error);
    },

    // 3. onSettled: Siempre refetch después (success o error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => mutation.mutate(todo.id)}
        disabled={mutation.isPending}
      />
      <span>{todo.text}</span>
    </div>
  );
}
```

### Optimistic Create

```tsx
const createTodo = async (text: string): Promise<Todo> => {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return response.json();
};

function TodoForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTodo,

    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Crear todo optimista con ID temporal
      const optimisticTodo: Todo = {
        id: Date.now(), // ID temporal
        text,
        completed: false,
      };

      queryClient.setQueryData<Todo[]>(['todos'], (old) => [
        ...(old || []),
        optimisticTodo,
      ]);

      return { previousTodos };
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },

    onSuccess: (newTodo) => {
      // Reemplazar todo optimista con el real del servidor
      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map((todo) => (todo.id === Date.now() ? newTodo : todo))
      );
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('text') as HTMLInputElement;
        mutation.mutate(input.value);
        input.value = '';
      }}
    >
      <input name="text" required />
      <button type="submit">Add Todo</button>
    </form>
  );
}
```

### Optimistic Delete

```tsx
const deleteTodo = async (id: number): Promise<void> => {
  const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete');
};

function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteTodo,

    onMutate: async (todoId) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Remover optimísticamente
      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.filter((t) => t.id !== todoId)
      );

      return { previousTodos };
    },

    onError: (error, variables, context) => {
      // Restaurar si falla
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },
  });

  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={() => mutation.mutate(todo.id)}>Delete</button>
    </div>
  );
}
```

## Mutation Side Effects

### onMutate, onSuccess, onError, onSettled

```tsx
const mutation = useMutation({
  mutationFn: createUser,

  // Ejecuta ANTES de la mutación
  onMutate: async (variables) => {
    console.log('Starting mutation with:', variables);
    // Cancelar queries, crear snapshot, optimistic update
    return { context: 'data' }; // Context pasado a otros callbacks
  },

  // Ejecuta si la mutación tiene ÉXITO
  onSuccess: (data, variables, context) => {
    console.log('Mutation succeeded:', data);
    toast.success('User created successfully!');
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },

  // Ejecuta si la mutación FALLA
  onError: (error, variables, context) => {
    console.error('Mutation failed:', error);
    toast.error(`Failed to create user: ${error.message}`);
    // Rollback usando context
  },

  // Ejecuta SIEMPRE (success o error)
  onSettled: (data, error, variables, context) => {
    console.log('Mutation settled');
    // Cleanup, refetch final
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Global Mutation Callbacks

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onSuccess: (data, variables, context) => {
        console.log('Global mutation success');
      },
      onError: (error, variables, context) => {
        console.error('Global mutation error:', error);
        toast.error('Something went wrong!');
      },
    },
  },
});
```

## Multiple Mutations - Secuencia

### Sequential Mutations

```tsx
function CreateProjectWithTasks() {
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: createProject,
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
  });

  const handleCreate = async () => {
    try {
      // 1. Crear proyecto
      const project = await createProjectMutation.mutateAsync({
        name: 'New Project',
      });

      // 2. Crear tareas para el proyecto
      await createTaskMutation.mutateAsync({
        projectId: project.id,
        title: 'Task 1',
      });

      await createTaskMutation.mutateAsync({
        projectId: project.id,
        title: 'Task 2',
      });

      // 3. Invalidar queries al final
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast.success('Project and tasks created!');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createProjectMutation.isPending || createTaskMutation.isPending}
    >
      Create Project with Tasks
    </button>
  );
}
```

### Parallel Mutations

```tsx
function BulkUpdate() {
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
  });

  const handleBulkUpdate = async (users: User[]) => {
    try {
      // Ejecutar mutaciones en paralelo
      const promises = users.map((user) =>
        updateUserMutation.mutateAsync({
          id: user.id,
          name: `${user.name} (updated)`,
        })
      );

      await Promise.all(promises);

      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`${users.length} users updated!`);
    } catch (error) {
      toast.error('Some updates failed');
    }
  };

  return (
    <button onClick={() => handleBulkUpdate(selectedUsers)}>
      Update Selected
    </button>
  );
}
```

## mutate vs mutateAsync

### mutate - Fire and Forget

```tsx
function Component() {
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      console.log('Success:', data);
    },
  });

  const handleClick = () => {
    // Fire and forget - no espera resultado
    mutation.mutate({ name: 'John', email: 'john@example.com' });

    // Este código se ejecuta INMEDIATAMENTE (no espera mutación)
    console.log('Mutation triggered');
  };
}
```

### mutateAsync - Await Result

```tsx
function Component() {
  const mutation = useMutation({
    mutationFn: createUser,
  });

  const handleClick = async () => {
    try {
      // Espera resultado de la mutación
      const newUser = await mutation.mutateAsync({
        name: 'John',
        email: 'john@example.com',
      });

      // Este código se ejecuta DESPUÉS de la mutación
      console.log('User created:', newUser);
      navigate(`/users/${newUser.id}`);
    } catch (error) {
      console.error('Failed:', error);
    }
  };
}
```

## Invalidation Strategies

### Invalidate Specific Query

```tsx
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // Invalidar query específica
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Invalidate Multiple Queries

```tsx
const mutation = useMutation({
  mutationFn: deleteUser,
  onSuccess: () => {
    // Invalidar múltiples queries
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  },
});
```

### Invalidate with Predicate

```tsx
const mutation = useMutation({
  mutationFn: updateProject,
  onSuccess: (updatedProject) => {
    // Invalidar todas las queries que empiecen con 'projects'
    queryClient.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === 'projects' &&
        query.queryKey[1] === updatedProject.id,
    });
  },
});
```

### Refetch Immediately

```tsx
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // Invalidar Y refetch inmediato
    queryClient.refetchQueries({ queryKey: ['users'] });
  },
});
```

### Manual Cache Update (Sin Invalidación)

```tsx
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: (newUser) => {
    // Actualizar cache manualmente (más rápido, no refetch)
    queryClient.setQueryData<User[]>(['users'], (old) => [
      ...(old || []),
      newUser,
    ]);
  },
});
```

## Error Handling Avanzado

### Custom Error Class

```tsx
class APIError extends Error {
  constructor(
    public statusCode: number,
    public errors: Record<string, string[]>
  ) {
    super('API Error');
  }
}

const createUser = async (input: CreateUserInput): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new APIError(response.status, errorData.errors || {});
  }

  return response.json();
};

function CreateUserForm() {
  const mutation = useMutation({
    mutationFn: createUser,
  });

  if (mutation.error instanceof APIError) {
    return (
      <div>
        <h3>Validation Errors:</h3>
        <ul>
          {Object.entries(mutation.error.errors).map(([field, errors]) => (
            <li key={field}>
              {field}: {errors.join(', ')}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
```

### Retry Failed Mutations

```tsx
const mutation = useMutation({
  mutationFn: createUser,
  retry: 2, // Reintentar 2 veces en caso de error
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### Reset Mutation State

```tsx
function Component() {
  const mutation = useMutation({
    mutationFn: createUser,
  });

  return (
    <div>
      {mutation.isError && (
        <div>
          <p>Error: {mutation.error.message}</p>
          <button onClick={() => mutation.reset()}>
            Clear Error
          </button>
        </div>
      )}
    </div>
  );
}
```

## Resumen de Callbacks

| Callback | Cuándo se Ejecuta | Parámetros |
|----------|-------------------|------------|
| `onMutate` | ANTES de la mutación | `(variables)` |
| `onSuccess` | Mutación EXITOSA | `(data, variables, context)` |
| `onError` | Mutación FALLÓ | `(error, variables, context)` |
| `onSettled` | SIEMPRE (success o error) | `(data, error, variables, context)` |

## Mejores Prácticas

1. ✅ **Usar optimistic updates** para mejor UX (toggle, delete)
2. ✅ **Siempre cancelar queries** en `onMutate` antes de optimistic update
3. ✅ **Guardar snapshot** para rollback en caso de error
4. ✅ **Invalidar queries** en `onSuccess` o `onSettled`
5. ✅ **mutateAsync** para secuencias de mutaciones
6. ✅ **mutate** para fire-and-forget (crear, actualizar simple)
7. ✅ **No reintentar** mutaciones por defecto (solo queries)
8. ✅ **Reset mutation** después de mostrar error al usuario

---

**Siguiente:** [Advanced Features](./advanced-features.md) para infinite queries, prefetching y SSR.
