# Advanced TypeScript Patterns for React

Patrones avanzados de TypeScript específicos para React, incluyendo utility types, generics complejos, y técnicas avanzadas de tipado.

## Utility Types Avanzados

### Partial Deep - Partial recursivo

```tsx
// Utility type para hacer todos los campos opcionales recursivamente
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Uso
interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  database: {
    url: string;
    poolSize: number;
  };
}

// Ahora puedes actualizar parcialmente cualquier nivel
const updateConfig = (updates: DeepPartial<Config>) => {
  // updates puede ser { server: { port: 3000 } } sin especificar todo
};
```

### Extract y Exclude - Filtrar union types

```tsx
// Extract: extraer tipos que coincidan con una condición
type Status = 'active' | 'inactive' | 'pending' | 'archived';
type ActiveStatus = Extract<Status, 'active' | 'pending'>; // 'active' | 'pending'

// Exclude: excluir tipos
type NonActiveStatus = Exclude<Status, 'active'>; // 'inactive' | 'pending' | 'archived'

// Ejemplo práctico
interface Event {
  type: 'click' | 'hover' | 'focus' | 'blur';
  target: HTMLElement;
}

type MouseEvent = Extract<Event['type'], 'click' | 'hover'>; // 'click' | 'hover'
type FocusEvent = Exclude<Event['type'], 'click' | 'hover'>; // 'focus' | 'blur'
```

### ReturnType y Parameters - Inferir de funciones

```tsx
// ReturnType: obtener tipo de retorno de una función
const fetchUser = async (id: number) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json() as { id: number; name: string };
};

type User = Awaited<ReturnType<typeof fetchUser>>; // { id: number; name: string }

// Parameters: obtener tipos de parámetros
type FetchUserParams = Parameters<typeof fetchUser>; // [number]

// Ejemplo práctico
const useApiCall = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T
) => {
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null);

  const execute = async (...args: Parameters<T>) => {
    const result = await apiFunction(...args);
    setData(result);
  };

  return { data, execute };
};
```

### Record con keys dinámicas

```tsx
// Record básico
type UserRoles = Record<string, boolean>;

// Record con keys específicas
type Permissions = Record<'read' | 'write' | 'delete', boolean>;

// Record con tipos complejos
type EntityMap<T> = Record<string | number, T>;

interface User {
  id: number;
  name: string;
}

const usersById: EntityMap<User> = {
  1: { id: 1, name: 'Alice' },
  2: { id: 2, name: 'Bob' },
};

// Patrón normalization (Redux style)
interface NormalizedData<T> {
  byId: Record<string | number, T>;
  allIds: (string | number)[];
}

const normalizeArray = <T extends { id: string | number }>(
  items: T[]
): NormalizedData<T> => {
  return {
    byId: items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string | number, T>),
    allIds: items.map((item) => item.id),
  };
};
```

### Mapped Types - Transformar tipos

```tsx
// Hacer todos los campos readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Hacer todos los campos nullable
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Ejemplo práctico: prefixar keys
type Prefixed<T, Prefix extends string> = {
  [K in keyof T as `${Prefix}${Capitalize<string & K>}`]: T[K];
};

interface User {
  name: string;
  age: number;
}

type PrefixedUser = Prefixed<User, 'user'>; // { userName: string; userAge: number }
```

### Conditional Types - Tipos condicionales

```tsx
// T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false

// Ejemplo práctico: diferentes props según tipo
type ButtonProps<T extends 'button' | 'link'> = {
  label: string;
} & (T extends 'button'
  ? {
      onClick: () => void;
    }
  : {
      href: string;
    });

const Button = <T extends 'button' | 'link'>(props: ButtonProps<T>) => {
  // TypeScript sabe que si type='button', onClick existe
  // y si type='link', href existe
};

// Uso
<Button<'button'> label="Click" onClick={() => {}} />
<Button<'link'> label="Go" href="/path" />
```

## Discriminated Unions - Union types discriminadas

```tsx
// Patrón muy útil para states complejos
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

const DataComponent = <T,>({ state }: { state: RequestState<T> }) => {
  // TypeScript infiere automáticamente los campos disponibles
  switch (state.status) {
    case 'idle':
      return <div>Ready to fetch</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>Data: {JSON.stringify(state.data)}</div>;
    case 'error':
      return <div>Error: {state.error.message}</div>;
  }
};

// Ejemplo avanzado: Actions type-safe (Redux/useReducer)
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      // TypeScript sabe que action.payload es User
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      // TypeScript sabe que action.payload es boolean
      return { ...state, loading: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};
```

## Generics Avanzados en Componentes

### Componente genérico con constraints

```tsx
// T debe tener al menos id y name
interface HasId {
  id: string | number;
}

interface ListProps<T extends HasId> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onSelect?: (item: T) => void;
  keyExtractor?: (item: T) => string | number;
}

function List<T extends HasId>({
  items,
  renderItem,
  onSelect,
  keyExtractor = (item) => item.id,
}: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)} onClick={() => onSelect?.(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Uso con diferentes tipos
interface User extends HasId {
  name: string;
  email: string;
}

interface Product extends HasId {
  name: string;
  price: number;
}

<List<User>
  items={users}
  renderItem={(user) => <div>{user.name}</div>}
  onSelect={(user) => console.log(user.email)}
/>

<List<Product>
  items={products}
  renderItem={(product) => <div>{product.name} - ${product.price}</div>}
/>
```

### Generic form component

```tsx
interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  children: (props: {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    handleChange: (field: keyof T, value: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
  }) => React.ReactNode;
}

function Form<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  children,
}: FormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate?.(values) || {};
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(values);
    }
  };

  return <>{children({ values, errors, handleChange, handleSubmit })}</>;
}

// Uso
interface LoginForm {
  email: string;
  password: string;
}

<Form<LoginForm>
  initialValues={{ email: '', password: '' }}
  onSubmit={(values) => console.log(values)}
  validate={(values) => {
    const errors: Partial<Record<keyof LoginForm, string>> = {};
    if (!values.email) errors.email = 'Required';
    if (!values.password) errors.password = 'Required';
    return errors;
  }}
>
  {({ values, errors, handleChange, handleSubmit }) => (
    <form onSubmit={handleSubmit}>
      <input
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}

      <input
        type="password"
        value={values.password}
        onChange={(e) => handleChange('password', e.target.value)}
      />
      {errors.password && <span>{errors.password}</span>}

      <button type="submit">Submit</button>
    </form>
  )}
</Form>
```

## Type Guards - Narrowing

```tsx
// Type predicate
interface User {
  type: 'user';
  name: string;
  email: string;
}

interface Admin {
  type: 'admin';
  name: string;
  permissions: string[];
}

type Person = User | Admin;

// Type guard con 'is'
function isAdmin(person: Person): person is Admin {
  return person.type === 'admin';
}

const Component = ({ person }: { person: Person }) => {
  if (isAdmin(person)) {
    // TypeScript sabe que person es Admin aquí
    return <div>Admin with {person.permissions.length} permissions</div>;
  }

  // TypeScript sabe que person es User aquí
  return <div>User: {person.email}</div>;
};

// Type guard para null/undefined
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Uso
const users: (User | null)[] = [
  { type: 'user', name: 'Alice', email: 'alice@example.com' },
  null,
  { type: 'user', name: 'Bob', email: 'bob@example.com' },
];

const validUsers = users.filter(isDefined); // User[] (sin null)
```

## Patrones de Props Avanzados

### Props con discriminated union

```tsx
// Button puede ser primario o con link
type ButtonProps =
  | {
      variant: 'primary';
      onClick: () => void;
    }
  | {
      variant: 'link';
      href: string;
      target?: '_blank' | '_self';
    };

const Button: React.FC<ButtonProps & { children: React.ReactNode }> = (
  props
) => {
  if (props.variant === 'primary') {
    return <button onClick={props.onClick}>{props.children}</button>;
  }

  return (
    <a href={props.href} target={props.target}>
      {props.children}
    </a>
  );
};

// Uso
<Button variant="primary" onClick={() => {}}>Click</Button>
<Button variant="link" href="/about" target="_blank">About</Button>
```

### Polymorphic components (as prop)

```tsx
type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<E>;

function Box<E extends React.ElementType = 'div'>({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Uso - TypeScript infiere los props correctos
<Box>Default div</Box>
<Box as="button" onClick={() => {}}>Button</Box>
<Box as="a" href="/about">Link</Box>
<Box as="h1">Heading</Box>
```

### Forwarded refs con types

```tsx
interface InputProps {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} {...props} />
        {error && <span className="error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Uso
const Parent = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return <Input ref={inputRef} label="Name" />;
};
```

## Context con Reducers (type-safe)

```tsx
// State
interface State {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// Actions
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'LOGOUT' };

// Reducer
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, user: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
};

// Context
interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const UserContext = createContext<ContextValue | undefined>(undefined);

// Provider
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    loading: false,
    error: null,
  });

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be within UserProvider');
  return context;
};

// Actions creators (type-safe)
export const userActions = {
  fetchStart: (): Action => ({ type: 'FETCH_START' }),
  fetchSuccess: (user: User): Action => ({ type: 'FETCH_SUCCESS', payload: user }),
  fetchError: (error: Error): Action => ({ type: 'FETCH_ERROR', payload: error }),
  logout: (): Action => ({ type: 'LOGOUT' }),
};

// Uso
const Component = () => {
  const { state, dispatch } = useUser();

  const handleFetch = async () => {
    dispatch(userActions.fetchStart());
    try {
      const user = await fetchUser();
      dispatch(userActions.fetchSuccess(user));
    } catch (error) {
      dispatch(userActions.fetchError(error as Error));
    }
  };

  return <div>{state.user?.name}</div>;
};
```

## Template Literal Types

```tsx
// Generar tipos a partir de strings
type Color = 'red' | 'blue' | 'green';
type Size = 'sm' | 'md' | 'lg';

// Combinar
type ColoredSize = `${Color}-${Size}`; // 'red-sm' | 'red-md' | 'red-lg' | ...

// Evento handlers tipados
type EventName = 'click' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`; // 'onClick' | 'onFocus' | 'onBlur'

// Uso práctico
type CSSProperties = {
  [K in `${'margin' | 'padding'}${'-top' | '-right' | '-bottom' | '-left' | ''}`]?: string;
};

// Resultado: marginTop, marginRight, paddingTop, paddingRight, etc.
```

## Resumen de Patrones

| Patrón | Uso | Beneficio |
|--------|-----|-----------|
| DeepPartial | Updates parciales en objetos anidados | Flexibilidad sin perder type safety |
| Discriminated Unions | States complejos, actions | Exhaustive checking, no errores |
| Generics con constraints | Componentes reutilizables | Reutilización + type safety |
| Type Guards | Narrowing de unions | Código más seguro y legible |
| Polymorphic components | Componentes que cambian de elemento | Máxima flexibilidad |
| Template Literals | Generar tipos dinámicos | DRY en definiciones de tipos |
