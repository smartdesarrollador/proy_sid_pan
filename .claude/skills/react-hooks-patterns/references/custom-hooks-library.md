# Custom Hooks Library - Biblioteca Completa

Colección completa de custom hooks reutilizables y probados en producción, con TypeScript strict mode.

## Data Fetching Hooks

### useFetch - Fetch con estados completos

```tsx
interface UseFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(
  url: string,
  options?: UseFetchOptions
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: T = await response.json();
      setData(result);
      options?.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, options?.method, options?.body]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Uso
const UserProfile = ({ userId }: { userId: number }) => {
  const { data, loading, error, refetch } = useFetch<User>(
    `/api/users/${userId}`
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>{data.name}</h2>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

### useInfiniteScroll - Paginación infinita

```tsx
interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<T[]>;
  pageSize?: number;
  threshold?: number;
}

interface UseInfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 20,
  threshold = 0.8,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchFn(page);

      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFn, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Auto-load initial data
  useEffect(() => {
    if (data.length === 0 && !loading) {
      loadMore();
    }
  }, []);

  return { data, loading, error, hasMore, loadMore, reset };
}

// Uso
const InfiniteList = () => {
  const { data, loading, hasMore, loadMore } = useInfiniteScroll({
    fetchFn: async (page) => {
      const response = await fetch(`/api/items?page=${page}`);
      return response.json();
    },
    pageSize: 20,
  });

  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

## State Management Hooks

### useLocalStorage - Persistencia con localStorage

```tsx
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const remove = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, remove];
}

// Uso
const Settings = () => {
  const [theme, setTheme, removeTheme] = useLocalStorage<'light' | 'dark'>(
    'theme',
    'light'
  );

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <button onClick={removeTheme}>Reset</button>
    </div>
  );
};
```

### useSessionStorage - Similar a useLocalStorage

```tsx
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
```

### useUndoRedo - Historial de cambios

```tsx
interface UseUndoRedoResult<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newState: T) => void;
}

export function useUndoRedo<T>(initialState: T): UseUndoRedoResult<T> {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setStateWithHistory = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const resolvedState =
        newState instanceof Function ? newState(state) : newState;

      setHistory((prev) => [...prev.slice(0, currentIndex + 1), resolvedState]);
      setCurrentIndex((prev) => prev + 1);
      setState(resolvedState);
    },
    [state, currentIndex]
  );

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setState(history[currentIndex - 1]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setState(history[currentIndex + 1]);
    }
  }, [currentIndex, history]);

  const reset = useCallback((newState: T) => {
    setState(newState);
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  return {
    state,
    setState: setStateWithHistory,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    reset,
  };
}

// Uso
const TextEditor = () => {
  const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo('');

  return (
    <div>
      <textarea
        value={state}
        onChange={(e) => setState(e.target.value)}
      />
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </div>
  );
};
```

## UI/UX Hooks

### useDebounce - Debounce de valores

```tsx
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Uso
const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Hacer búsqueda solo cuando el usuario para de escribir
      fetch(`/api/search?q=${debouncedSearch}`)
        .then((res) => res.json())
        .then(setResults);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
};
```

### useThrottle - Throttle de valores

```tsx
export function useThrottle<T>(value: T, limit: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
}

// Uso en scroll handler
const ScrollTracker = () => {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 200);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <div>Scroll position: {throttledScrollY}</div>;
};
```

### useToggle - Toggle boolean con extras

```tsx
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}

// Uso
const Modal = () => {
  const [isOpen, toggleOpen, setIsOpen] = useToggle(false);

  return (
    <>
      <button onClick={toggleOpen}>Toggle</button>
      <button onClick={() => setIsOpen(true)}>Open</button>
      <button onClick={() => setIsOpen(false)}>Close</button>
      {isOpen && <div>Modal content</div>}
    </>
  );
};
```

### useMediaQuery - Responsive queries

```tsx
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

// Uso con breakpoints predefinidos
const useBreakpoints = () => ({
  isMobile: useMediaQuery('(max-width: 768px)'),
  isTablet: useMediaQuery('(min-width: 769px) and (max-width: 1024px)'),
  isDesktop: useMediaQuery('(min-width: 1025px)'),
  isDark: useMediaQuery('(prefers-color-scheme: dark)'),
  isReducedMotion: useMediaQuery('(prefers-reduced-motion: reduce)'),
});

const ResponsiveComponent = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();

  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
};
```

## Performance Hooks

### useDeepCompareEffect - Deep comparison para objetos

```tsx
import { useEffect, useRef } from 'react';
import { isEqual } from 'lodash'; // o usar implementación custom

export function useDeepCompareEffect(
  callback: React.EffectCallback,
  dependencies: React.DependencyList
) {
  const currentDependenciesRef = useRef<React.DependencyList>();

  if (!isEqual(currentDependenciesRef.current, dependencies)) {
    currentDependenciesRef.current = dependencies;
  }

  useEffect(callback, [currentDependenciesRef.current]);
}

// Uso
const Component = ({ filters }: { filters: FilterObject }) => {
  useDeepCompareEffect(() => {
    // Solo se ejecuta si filters cambió de verdad (deep comparison)
    fetchData(filters);
  }, [filters]);
};
```

### useWhyDidYouUpdate - Debug de re-renders

```tsx
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, any> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Uso
const MyComponent = (props: Props) => {
  useWhyDidYouUpdate('MyComponent', props);
  // ...
};
```

## Form Hooks

### useForm - Manejo completo de formularios

```tsx
interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);
      setTouched(allTouched);

      // Validate
      const validationErrors = validate ? validate(values) : {};
      setErrors(validationErrors);

      // Submit if no errors
      if (Object.keys(validationErrors).length === 0) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validate, onSubmit]
  );

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
  };
}

// Uso
interface LoginForm {
  email: string;
  password: string;
}

const LoginComponent = () => {
  const form = useForm<LoginForm>({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginForm, string>> = {};
      if (!values.email) errors.email = 'Required';
      if (!values.password) errors.password = 'Required';
      return errors;
    },
    onSubmit: async (values) => {
      await api.login(values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        value={form.values.email}
        onChange={(e) => form.handleChange('email', e.target.value)}
        onBlur={() => form.handleBlur('email')}
      />
      {form.touched.email && form.errors.email && (
        <span>{form.errors.email}</span>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
};
```

## Resumen de Custom Hooks

| Hook | Use Case | Complejidad |
|------|----------|-------------|
| `useFetch` | Data fetching con estados | Media |
| `useInfiniteScroll` | Paginación infinita | Alta |
| `useLocalStorage` | Persistencia en localStorage | Baja |
| `useUndoRedo` | Historial de cambios | Media |
| `useDebounce` | Optimizar inputs | Baja |
| `useThrottle` | Limitar ejecución | Media |
| `useToggle` | Boolean states | Baja |
| `useMediaQuery` | Responsive design | Baja |
| `useDeepCompareEffect` | Effect con objetos | Media |
| `useWhyDidYouUpdate` | Debug de re-renders | Baja |
| `useForm` | Manejo de formularios | Alta |

Todos los hooks siguen las reglas de hooks de React y están tipados con TypeScript strict mode.
