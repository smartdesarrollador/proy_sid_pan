---
name: react-typescript-foundations
description: >
  Guía de fundamentos de React con TypeScript para proyectos escalables y reutilizables.
  Usar cuando se trabaje con componentes funcionales, hooks tipados, custom hooks, patrones
  de composición, manejo de eventos, optimización, o cuando se necesiten mejores prácticas
  de TypeScript con React. Incluye ejemplos copy-paste listos para usar.
---

# React + TypeScript Foundations

Guía práctica de fundamentos de React con TypeScript, enfocada en patrones reutilizables y mejores prácticas para proyectos escalables.

## 1. Setup Inicial de Componentes Funcionales

### Props básicas con TypeScript

```tsx
// Props interface - siempre exportar para reutilización
export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

// Componente funcional con props tipadas
export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {label}
    </button>
  );
};
```

### Props con children

```tsx
// Children como ReactNode (más flexible)
interface CardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, footer }) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

// Children tipado con elementos específicos
interface ListProps {
  children: React.ReactElement<ItemProps> | React.ReactElement<ItemProps>[];
}

export const List: React.FC<ListProps> = ({ children }) => {
  return <ul className="list">{children}</ul>;
};
```

### Props con eventos tipados

```tsx
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = '',
  type = 'text',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="input"
    />
  );
};
```

## 2. Hooks Fundamentales Tipados

### useState con tipos inferidos y explícitos

```tsx
import { useState } from 'react';

// Tipo inferido (simple)
const [count, setCount] = useState(0); // number
const [name, setName] = useState(''); // string

// Tipo explícito (necesario para objetos complejos)
interface User {
  id: number;
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null);

// Arrays tipados
const [items, setItems] = useState<string[]>([]);
const [users, setUsers] = useState<User[]>([]);

// Estado complejo con tipo explícito
interface FormState {
  username: string;
  email: string;
  isValid: boolean;
}

const [form, setForm] = useState<FormState>({
  username: '',
  email: '',
  isValid: false,
});

// Update parcial con spread
setForm((prev) => ({ ...prev, username: 'new value' }));
```

### useEffect tipado

```tsx
import { useEffect } from 'react';

// Efecto básico con cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('Delayed action');
  }, 1000);

  // Cleanup function
  return () => clearTimeout(timer);
}, []); // Dependency array vacío = solo en mount

// Efecto con dependencias tipadas
useEffect(() => {
  if (userId) {
    fetchUser(userId);
  }
}, [userId]); // Se ejecuta cuando userId cambia

// Efecto async con AbortController
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: controller.signal,
      });
      const data: User = await response.json();
      setUser(data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    }
  };

  fetchData();

  return () => controller.abort();
}, [userId]);
```

### useContext tipado

```tsx
import { createContext, useContext, useState } from 'react';

// 1. Define el tipo del contexto
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// 2. Crea el contexto con tipo y valor por defecto undefined
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Custom hook para usar el contexto (con validación)
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// 5. Uso en componentes
const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Current: {theme}</button>;
};
```

### useRef tipado

```tsx
import { useRef, useEffect } from 'react';

// Ref para elementos HTML
const InputWithFocus = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // null check antes de usar
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
};

// Ref para valores mutables (no trigger re-render)
const Timer = () => {
  const countRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      console.log(countRef.current);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer(); // Cleanup
  }, []);

  return (
    <div>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
};
```

## 3. Custom Hooks Reutilizables

### useLocalStorage - Persistencia de estado

```tsx
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Estado inicial desde localStorage o valor por defecto
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // Sincronizar con localStorage cuando cambia el valor
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Uso
const MyComponent = () => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [settings, setSettings] = useLocalStorage('settings', {
    theme: 'light',
    lang: 'en',
  });

  return <div>User: {user?.name}</div>;
};
```

### useFetch - Data fetching con estados

```tsx
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: T = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}

// Uso
interface User {
  id: number;
  name: string;
}

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

### useDebounce - Optimización de inputs

```tsx
import { useState, useEffect } from 'react';

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

// Uso en un search input
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // Hacer búsqueda solo cuando el usuario para de escribir
      console.log('Searching for:', debouncedSearch);
      // fetch(`/api/search?q=${debouncedSearch}`)
    }
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
};
```

Ver `references/hooks-reference.md` para más custom hooks (useToggle, useClickOutside, useMediaQuery, etc.)

## 4. Patrones de Composición

### Render Props Pattern

```tsx
interface RenderPropsProps<T> {
  data: T[];
  render: (item: T) => React.ReactNode;
  loading?: boolean;
}

function DataList<T>({ data, render, loading }: RenderPropsProps<T>) {
  if (loading) return <div>Loading...</div>;

  return <div className="list">{data.map(render)}</div>;
}

// Uso
const App = () => {
  const users: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];

  return (
    <DataList
      data={users}
      render={(user) => <div key={user.id}>{user.name}</div>}
    />
  );
};
```

### Children as Function (Render Props alternativo)

```tsx
interface ToggleProps {
  children: (
    isOpen: boolean,
    toggle: () => void
  ) => React.ReactNode;
}

const Toggle: React.FC<ToggleProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return <>{children(isOpen, toggle)}</>;
};

// Uso
const App = () => (
  <Toggle>
    {(isOpen, toggle) => (
      <div>
        <button onClick={toggle}>{isOpen ? 'Hide' : 'Show'}</button>
        {isOpen && <div>Content here</div>}
      </div>
    )}
  </Toggle>
);
```

### Component Composition (HOC alternative con composición)

```tsx
// En vez de HOC, usar composición con children
interface ContainerProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ title, children, actions }) => (
  <div className="container">
    <div className="header">
      <h2>{title}</h2>
      {actions && <div className="actions">{actions}</div>}
    </div>
    <div className="content">{children}</div>
  </div>
);

// Uso con composición
const UserProfile = () => (
  <Container
    title="User Profile"
    actions={
      <>
        <button>Edit</button>
        <button>Delete</button>
      </>
    }
  >
    <div>Profile content here</div>
  </Container>
);
```

## 5. Manejo de Eventos y Refs

### Tipos de eventos comunes

```tsx
const EventsExample = () => {
  // Input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  // Button click
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Clicked');
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitted');
  };

  // Key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter pressed');
    }
  };

  // Focus events
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('Focused');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
      />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
};
```

### Refs tipadas para elementos HTML

```tsx
import { useRef } from 'react';

const RefExamples = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const scrollToDiv = () => {
    divRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <input ref={inputRef} />
      <div ref={divRef}>Content</div>
      <button ref={buttonRef} onClick={focusInput}>
        Focus Input
      </button>
    </>
  );
};
```

## 6. Tipos Avanzados Útiles

### Generics en componentes

```tsx
// Componente genérico que funciona con cualquier tipo de dato
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string | number;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
}: SelectProps<T>) {
  return (
    <select
      value={value ? getValue(value) : ''}
      onChange={(e) => {
        const selected = options.find(
          (opt) => getValue(opt).toString() === e.target.value
        );
        if (selected) onChange(selected);
      }}
    >
      {options.map((option) => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Uso con diferentes tipos
interface User {
  id: number;
  name: string;
}

const UserSelect = () => {
  const users: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  const [selected, setSelected] = useState<User | null>(null);

  return (
    <Select
      options={users}
      value={selected}
      onChange={setSelected}
      getLabel={(user) => user.name}
      getValue={(user) => user.id}
    />
  );
};
```

### Utility Types

```tsx
// Partial - todos los campos opcionales
interface User {
  id: number;
  name: string;
  email: string;
}

const updateUser = (id: number, updates: Partial<User>) => {
  // updates puede tener solo algunos campos de User
};

// Pick - seleccionar campos específicos
type UserBasic = Pick<User, 'id' | 'name'>; // { id: number; name: string }

// Omit - excluir campos
type UserWithoutId = Omit<User, 'id'>; // { name: string; email: string }

// Required - todos los campos requeridos
interface PartialUser {
  id?: number;
  name?: string;
}
type CompleteUser = Required<PartialUser>; // { id: number; name: string }

// Record - objeto con claves tipadas
type UserRecord = Record<number, User>; // { [key: number]: User }

// Ejemplo práctico combinando utility types
interface FormData {
  username: string;
  email: string;
  password: string;
}

// Crear un tipo para el formulario de edición (sin password)
type EditFormData = Omit<FormData, 'password'>;

// Crear un tipo para actualización parcial
type UpdateFormData = Partial<FormData>;

const EditForm = () => {
  const [data, setData] = useState<EditFormData>({
    username: '',
    email: '',
  });

  return <form>{/* ... */}</form>;
};
```

Ver `references/advanced-patterns.md` para más utility types y patrones avanzados.

## 7. Mejores Prácticas

### Naming Conventions

```tsx
// Componentes: PascalCase
export const UserCard = () => {};

// Props interfaces: NombreComponenteProps
export interface UserCardProps {
  user: User;
}

// Custom hooks: useCamelCase
export const useUserData = () => {};

// Constantes: UPPER_SNAKE_CASE
const MAX_ITEMS = 100;

// Handlers: handleAction
const handleClick = () => {};
const handleSubmit = () => {};
```

### File Organization

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx          # Componente
│   │   │   ├── Button.types.ts     # Interfaces/types
│   │   │   ├── Button.styles.ts    # Estilos (si usa styled-components)
│   │   │   └── index.ts            # Export
│   │   └── Input/
│   └── features/
│       └── UserProfile/
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useFetch.ts
│   └── index.ts
├── types/
│   ├── user.types.ts
│   ├── api.types.ts
│   └── index.ts
└── utils/
    └── helpers.ts
```

### Export Patterns

```tsx
// Button/Button.tsx
export interface ButtonProps {
  label: string;
}

export const Button: React.FC<ButtonProps> = ({ label }) => {
  return <button>{label}</button>;
};

// Button/index.ts - Re-export para imports limpios
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Uso
import { Button, ButtonProps } from '@/components/common/Button';
```

## 8. Optimización

### React.memo - Prevenir re-renders innecesarios

```tsx
interface ItemProps {
  id: number;
  name: string;
  onClick: (id: number) => void;
}

// Memoizar componente que recibe props que no cambian frecuentemente
export const Item = React.memo<ItemProps>(({ id, name, onClick }) => {
  console.log('Rendering item:', id);
  return <div onClick={() => onClick(id)}>{name}</div>;
});

// Custom comparison function (opcional)
const areEqual = (prevProps: ItemProps, nextProps: ItemProps) => {
  return prevProps.id === nextProps.id && prevProps.name === nextProps.name;
};

export const ItemOptimized = React.memo<ItemProps>(
  ({ id, name, onClick }) => {
    return <div onClick={() => onClick(id)}>{name}</div>;
  },
  areEqual
);
```

### useCallback - Memoizar funciones

```tsx
import { useCallback, useState } from 'react';

const ParentComponent = () => {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<string[]>([]);

  // ❌ Malo: Se crea nueva función en cada render
  const handleBadClick = (id: number) => {
    console.log('Clicked', id);
  };

  // ✅ Bueno: useCallback memoiza la función
  const handleClick = useCallback((id: number) => {
    console.log('Clicked', id);
  }, []); // Dependencias vacías = función nunca cambia

  const handleAdd = useCallback(
    (item: string) => {
      setItems((prev) => [...prev, item]);
    },
    [] // No depende de items porque usa función updater
  );

  return (
    <div>
      <Item onClick={handleClick} />
    </div>
  );
};
```

### useMemo - Memoizar valores calculados

```tsx
import { useMemo, useState } from 'react';

const ExpensiveComponent = ({ items }: { items: number[] }) => {
  // ❌ Malo: Se recalcula en cada render
  const total = items.reduce((sum, item) => sum + item, 0);

  // ✅ Bueno: Solo recalcula cuando items cambia
  const memoizedTotal = useMemo(() => {
    console.log('Calculating total');
    return items.reduce((sum, item) => sum + item, 0);
  }, [items]);

  // Uso con filtros complejos
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter((item) => item > parseInt(filter || '0'));
  }, [items, filter]);

  return <div>Total: {memoizedTotal}</div>;
};
```

**Cuándo usar optimización:**

- `React.memo`: Componentes que renderizan frecuentemente con las mismas props
- `useCallback`: Funciones pasadas como props a componentes memoizados
- `useMemo`: Cálculos costosos que dependen de valores específicos

**Cuándo NO usar:**

- En componentes simples (overhead > beneficio)
- Si las props cambian frecuentemente
- En valores simples y rápidos de calcular

## 9. Error Handling

### Try-catch en componentes

```tsx
const DataFetcher = () => {
  const [data, setData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: User = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    };

    fetchData();
  }, []);

  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return <div>{data.name}</div>;
};
```

### Optional chaining y nullish coalescing

```tsx
interface User {
  name: string;
  address?: {
    street?: string;
    city?: string;
  };
}

const UserAddress = ({ user }: { user: User | null }) => {
  // Optional chaining (?.) - evita errores si user o address es null/undefined
  const city = user?.address?.city;

  // Nullish coalescing (??) - valor por defecto solo si es null/undefined
  const displayCity = user?.address?.city ?? 'Unknown City';

  // Combinado con arrays
  const firstItem = user?.items?.[0];

  return (
    <div>
      <p>City: {displayCity}</p>
      <p>Street: {user?.address?.street ?? 'N/A'}</p>
    </div>
  );
};
```

### Error Boundary (class component - necesario para error boundaries)

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Uso
const App = () => (
  <ErrorBoundary fallback={<div>Custom error UI</div>}>
    <MyComponent />
  </ErrorBoundary>
);
```

## 10. Componentes Comunes con Props Flexibles

Ver `references/component-examples.md` para ejemplos completos de:

- **Button**: Variantes, tamaños, icons, loading state
- **Input**: Text, email, password, validation, error states
- **Card**: Header, body, footer, con composición flexible
- **Modal**: Overlay, animations, keyboard handling
- **Table**: Genérico con sorting, filtering
- **Form**: Validación, submission, error handling

## Recursos Adicionales

- `references/hooks-reference.md` - Custom hooks avanzados
- `references/advanced-patterns.md` - Utility types y patrones complejos
- `references/component-examples.md` - Componentes completos listos para usar

## Tips Finales

1. **TypeScript strict mode**: Siempre activar `strict: true` en tsconfig.json
2. **Props opcionales**: Usar `?` y valores por defecto en destructuring
3. **Interfaces vs Types**: Preferir `interface` para props, `type` para unions/intersections
4. **Evitar `any`**: Usar `unknown` si realmente no conoces el tipo, y hacer type narrowing
5. **Generic components**: Útiles para listas, selects, tablas reutilizables
6. **Custom hooks**: Extraer lógica reutilizable, siempre empezar con `use`
7. **Optimización**: Solo cuando sea necesario, medir antes de optimizar
8. **Error handling**: Siempre manejar estados de error y loading
9. **Naming**: Consistencia en nombres de funciones, componentes y archivos
10. **Composición > HOCs**: Preferir composición de componentes sobre Higher-Order Components

---

**Modo de uso recomendado:**

1. Para setup de componentes básicos: Secciones 1-2
2. Para hooks reutilizables: Sección 3 + `references/hooks-reference.md`
3. Para patrones avanzados: Secciones 4, 6 + `references/advanced-patterns.md`
4. Para componentes completos: Sección 10 + `references/component-examples.md`
5. Para optimización: Sección 8 (solo cuando sea necesario)
