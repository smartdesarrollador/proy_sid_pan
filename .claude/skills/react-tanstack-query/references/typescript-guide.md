# TypeScript Guide - TanStack Query v5

Guía completa de TypeScript con TanStack Query v5: tipos seguros, inferencia, generics y error handling.

## Type Inference - Tipado Automático

### Inferencia Automática desde queryFn

```tsx
// ✅ Tipo se infiere automáticamente desde queryFn
const { data } = useQuery({
  queryKey: ['user', 123],
  queryFn: async (): Promise<User> => {
    const response = await fetch('/api/users/123');
    return response.json();
  },
});

// data es User | undefined automáticamente
data?.name; // TypeScript sabe que es string
```

### Tipos Explícitos

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

// Especificar tipos explícitamente
const { data, error } = useQuery<User, Error>({
  queryKey: ['user'],
  queryFn: fetchUser,
});

// data: User | undefined
// error: Error | null
```

## API Types - Responses y Requests

### Definir Tipos de API

```tsx
// src/types/api.types.ts

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'editor';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

export interface PageParam {
  page: number;
  limit: number;
}

// API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Error types
export interface APIError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}
```

### Typed Fetch Functions

```tsx
// src/api/users.ts
import type { User, CreateUserInput, PaginatedResponse } from '../types/api.types';

export const usersApi = {
  getById: async (id: number): Promise<User> => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  getAll: async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getPaginated: async (page: number, limit: number): Promise<PaginatedResponse<User>> => {
    const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch users');
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

  update: async (id: number, input: UpdateUserInput): Promise<User> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete user');
  },
};
```

## Custom Hooks con Tipos

### useQuery Hook Tipado

```tsx
// src/hooks/useUser.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import type { User } from '../types/api.types';

// Custom hook con tipo explícito
export const useUser = (
  userId: number,
  options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<User, Error>({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getById(userId),
    ...options,
  });
};

// Uso
function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // TypeScript sabe que user es User (no undefined)
  return <div>{user.name}</div>;
}
```

### useMutation Hook Tipado

```tsx
// src/hooks/useCreateUser.ts
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import type { User, CreateUserInput } from '../types/api.types';

export const useCreateUser = (
  options?: Omit<
    UseMutationOptions<User, Error, CreateUserInput>,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, CreateUserInput>({
    mutationFn: usersApi.create,
    onSuccess: (data, variables, context) => {
      // data: User
      // variables: CreateUserInput
      // context: unknown
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    ...options,
  });
};

// Uso
function CreateUserForm() {
  const createUser = useCreateUser({
    onSuccess: (user) => {
      console.log('Created user:', user.name); // Type-safe
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({
      name: 'John',
      email: 'john@example.com',
      password: 'secret',
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Generic Query Hooks

### Factory Pattern

```tsx
// src/hooks/useResource.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

// Generic hook para cualquier recurso
export function useResource<TData, TError = Error>(
  resourceName: string,
  resourceId: number | string,
  fetcher: (id: number | string) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: [resourceName, resourceId],
    queryFn: () => fetcher(resourceId),
    ...options,
  });
}

// Uso genérico
function UserProfile({ userId }: { userId: number }) {
  const { data } = useResource<User>('user', userId, usersApi.getById);
  return <div>{data?.name}</div>;
}

function ProjectPage({ projectId }: { projectId: number }) {
  const { data } = useResource<Project>('project', projectId, projectsApi.getById);
  return <div>{data?.title}</div>;
}
```

### useList Hook Genérico

```tsx
// src/hooks/useList.ts
export function useList<TData, TError = Error>(
  resourceName: string,
  fetcher: () => Promise<TData[]>,
  options?: Omit<UseQueryOptions<TData[], TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData[], TError>({
    queryKey: [resourceName],
    queryFn: fetcher,
    ...options,
  });
}

// Uso
function UsersList() {
  const { data: users } = useList<User>('users', usersApi.getAll);
  return <div>{users?.map((u) => u.name)}</div>;
}
```

## Error Handling Tipado

### Custom Error Types

```tsx
// src/types/errors.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'APIError';
  }

  static fromResponse(response: Response, data?: any): APIError {
    return new APIError(
      response.status,
      data?.message || response.statusText,
      data?.errors
    );
  }
}

export class ValidationError extends APIError {
  constructor(errors: Record<string, string[]>) {
    super(422, 'Validation failed', errors);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends APIError {
  constructor() {
    super(401, 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}
```

### Typed Error Handling

```tsx
// src/api/users.ts con error handling tipado
export const usersApi = {
  getById: async (id: number): Promise<User> => {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new UnauthorizedError();
      }

      if (response.status === 422) {
        throw new ValidationError(data.errors || {});
      }

      throw APIError.fromResponse(response, data);
    }

    return response.json();
  },
};

// Uso con type narrowing
function UserProfile({ userId }: { userId: number }) {
  const { data, error } = useQuery<User, APIError>({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getById(userId),
  });

  if (error) {
    if (error instanceof ValidationError) {
      return <ValidationErrors errors={error.errors!} />;
    }

    if (error instanceof UnauthorizedError) {
      return <div>Please login to continue</div>;
    }

    return <div>Error: {error.message}</div>;
  }

  return <div>{data?.name}</div>;
}
```

## Query Key Factories

### Type-Safe Query Keys

```tsx
// src/api/queryKeys.ts
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: number) => [...queryKeys.projects.all, id] as const,
  },
} as const;

// Uso
useQuery({
  queryKey: queryKeys.users.detail(123),
  queryFn: () => usersApi.getById(123),
});

// Invalidación type-safe
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(123) });
```

## Select Tipado

```tsx
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Select con tipo de retorno diferente
const { data: fullName } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => usersApi.getById(userId),
  select: (user): string => `${user.firstName} ${user.lastName}`,
});

// fullName es string, no User

// Select con tipo explícito
const { data: userEmails } = useQuery({
  queryKey: ['users'],
  queryFn: usersApi.getAll,
  select: (users): string[] => users.map((u) => u.email),
});

// userEmails es string[]
```

## Pagination Tipada

```tsx
interface PaginatedResponse<T> {
  data: T[];
  nextCursor: number | null;
}

const { data } = useInfiniteQuery<PaginatedResponse<User>, Error>({
  queryKey: ['users', 'infinite'],
  queryFn: async ({ pageParam = 0 }): Promise<PaginatedResponse<User>> => {
    const response = await fetch(`/api/users?cursor=${pageParam}`);
    return response.json();
  },
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  initialPageParam: 0,
});

// data.pages: PaginatedResponse<User>[]
// data.pages[0].data: User[]
```

## Query Options Types

```tsx
// Extender opciones con custom config
interface CustomQueryOptions<TData, TError = Error>
  extends UseQueryOptions<TData, TError> {
  showToast?: boolean;
  logErrors?: boolean;
}

function useCustomQuery<TData, TError = Error>(
  options: CustomQueryOptions<TData, TError>
) {
  const { showToast, logErrors, ...queryOptions } = options;

  return useQuery<TData, TError>({
    ...queryOptions,
    onError: (error) => {
      if (logErrors) {
        console.error('Query error:', error);
      }
      if (showToast) {
        toast.error(error instanceof Error ? error.message : 'Error');
      }
      options.onError?.(error);
    },
  });
}

// Uso
const { data } = useCustomQuery<User>({
  queryKey: ['user', 123],
  queryFn: () => usersApi.getById(123),
  showToast: true,
  logErrors: true,
});
```

## Best Practices

1. ✅ **Siempre definir tipos para API responses**
2. ✅ **Usar inferencia de tipos cuando sea posible**
3. ✅ **Custom error types para error handling específico**
4. ✅ **Query key factories para consistency**
5. ✅ **Generic hooks para reutilización**
6. ✅ **Type narrowing en error handling**
7. ✅ **`as const` en query keys para literales**
8. ✅ **Omit utility type para custom hook options**

---

**Resumen:** TanStack Query v5 con TypeScript ofrece type safety completo, inferencia automática y patrones genéricos para queries/mutations reutilizables.
