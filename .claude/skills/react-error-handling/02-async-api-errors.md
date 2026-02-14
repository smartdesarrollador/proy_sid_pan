# Async & API Error Handling

El manejo de erros asíncronos requiere estrategias diferentes a Error Boundaries.

## 1. Errores Asíncronos (try/catch)

Los Error Boundaries no capturan errores en:
*   Event handlers (`onSubmit`, `onClick`).
*   Código asíncrono (`setTimeout`, `requestAnimationFrame`).
*   Server Side Rendering (SSR).

```typescript
// ✅ Correcto: try/catch en effect
useEffect(() => {
  const fetchData = async () => {
    try {
      await api.get('/data');
    } catch (error) {
       setError(error);
    }
  };
  fetchData();
}, []);
```

## 2. API Error Handling (Axios Interceptors)

Centraliza el manejo de errores de red (401, 500) usando interceptores.

```typescript
// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo global de errores comunes
    if (error.response?.status === 401) {
      // Redirigir a Login o renovar token
      window.location.href = '/login';
    }
    
    // Normalizar Mensajes de Error
    const message = error.response?.data?.message || 'Error de red inesperado';
    
    // Propagar error normalizado
    return Promise.reject(new Error(message));
  }
);

export default api;
```

## 3. Tipado de Errores API

Define una interfaz para las respuestas de error de tu backend.

```typescript
interface ApiErrorResponse {
  statusCode: number;
  message: string;
  code?: string; // Código interno de error (e.g. USER_NOT_FOUND)
}

// Hook personalizado para manejar errores de API
function useApiError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiErrorResponse;
      return data.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error desconocido';
}
```

## 4. React Query Error Handling (Integration)

`TanStack Query` maneja estados de error (`isError`, `error`) de forma elegante.

**Configuración Global:**

```typescript
// lib/react-query.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reintentar 1 vez antes de fallar
      onError: (error) => {
        // Logging global
        console.error('Global Query Error:', error);
        toast.error('Error al cargar datos');
      },
    },
    mutations: {
        onError: (error) => {
             toast.error('Error al guardar datos');
        }
    }
  },
});
```

**Uso en Componente:**

```typescript
const { data, isError, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});

if (isError) {
  // Muestra mensaje amigable
  return <div className="error-box">Error: {error.message}</div>;
}
```

### Usar Error Boundaries con React Query

Puedes configurar `useQueryErrorBoundary: true` para que los errores de fetch "exploten" hacia el Error Boundary más cercano (útil para errores fatales).

```typescript
const { data } = useQuery({
  queryKey: ['criticalData'],
  queryFn: fetchCriticalData,
  useErrorBoundary: true, // Propaga error al boundary superior
});
```
