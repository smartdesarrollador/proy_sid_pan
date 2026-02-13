# Optimization Strategies - Técnicas Avanzadas de Performance

Guía completa de técnicas de optimización para React Context, análisis de re-renders, profiling y comparación con state managers.

## 1. Análisis de Re-render Issues

### Detectar Problemas con React DevTools Profiler

```tsx
// 1. Instalar React DevTools
// 2. Abrir Profiler tab
// 3. Start recording
// 4. Realizar acciones que sospechamos causan re-renders
// 5. Stop recording
// 6. Analizar el flamegraph

// ❌ Problema común: Context value se recrea en cada render
const MyProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>({});

  // ⚠️ Este objeto se recrea en cada render
  const value = {
    user,
    setUser,
    settings,
    setSettings,
  };

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

// ✅ Solución: Memoizar el value
const MyProviderOptimized = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>({});

  const value = useMemo(
    () => ({
      user,
      setUser,
      settings,
      setSettings,
    }),
    [user, settings] // Solo recrea si user o settings cambian
  );

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

### Custom Hook para Detectar Re-renders

```tsx
// Hook de debugging para detectar re-renders
export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
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
};

// Uso en componente
const ExpensiveComponent = ({ user, settings }: Props) => {
  useWhyDidYouUpdate('ExpensiveComponent', { user, settings });

  return <div>...</div>;
};
```

### Render Counter Hook

```tsx
export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
};

// Uso
const MyComponent = () => {
  const renderCount = useRenderCount('MyComponent');

  return (
    <div>
      <p>This component has rendered {renderCount} times</p>
    </div>
  );
};
```

## 2. Context Selectors - Render Solo lo Necesario

### Selector Pattern con use-context-selector

```tsx
// Instalar: npm install use-context-selector

import { createContext, useContextSelector } from 'use-context-selector';

interface StoreState {
  user: User | null;
  cart: CartItem[];
  notifications: Notification[];
  settings: Settings;
}

// Crear context con use-context-selector
const StoreContext = createContext<StoreState>({
  user: null,
  cart: [],
  notifications: [],
  settings: {},
});

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoreState>({
    user: null,
    cart: [],
    notifications: [],
    settings: {},
  });

  return <StoreContext.Provider value={state}>{children}</StoreContext.Provider>;
};

// ✅ Hook con selector - Solo re-render si el valor seleccionado cambia
export const useUser = () => {
  return useContextSelector(StoreContext, (state) => state.user);
};

export const useCartItemCount = () => {
  return useContextSelector(StoreContext, (state) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0)
  );
};

export const useUnreadNotifications = () => {
  return useContextSelector(StoreContext, (state) =>
    state.notifications.filter((n) => !n.read).length
  );
};

// Uso en componente - Solo re-render cuando cambia el valor seleccionado
const CartBadge = () => {
  const itemCount = useCartItemCount(); // Solo re-render si itemCount cambia

  return <div className="badge">{itemCount}</div>;
};

const UserAvatar = () => {
  const user = useUser(); // Solo re-render si user cambia

  return <img src={user?.avatar} alt={user?.name} />;
};
```

### DIY Selector Pattern (sin librería)

```tsx
// Implementación manual de selector pattern
export const createContextWithSelector = <T,>(defaultValue: T) => {
  const Context = createContext<T>(defaultValue);

  const useContextSelector = <S,>(selector: (state: T) => S): S => {
    const state = useContext(Context);
    const selectedRef = useRef<S>();
    const [, forceUpdate] = useReducer((s) => s + 1, 0);

    // Calcular valor seleccionado
    const selected = selector(state);

    // Solo forzar re-render si el valor seleccionado cambió
    useEffect(() => {
      if (selectedRef.current !== selected) {
        selectedRef.current = selected;
        forceUpdate();
      }
    });

    return selected;
  };

  return { Context, useContextSelector };
};

// Uso
interface AppState {
  count: number;
  user: User | null;
}

const { Context: AppContext, useContextSelector } = createContextWithSelector<AppState>({
  count: 0,
  user: null,
});

// Component solo re-render si count cambia
const Counter = () => {
  const count = useContextSelector((state) => state.count);
  return <div>{count}</div>;
};

// Component solo re-render si user cambia
const UserInfo = () => {
  const user = useContextSelector((state) => state.user);
  return <div>{user?.name}</div>;
};
```

## 3. Bailout Strategies - Prevenir Re-renders

### React.memo con Comparación Profunda

```tsx
// ❌ Problema: Props objetos causan re-renders
const UserCard = ({ user }: { user: User }) => {
  console.log('UserCard rendered');
  return <div>{user.name}</div>;
};

const ParentComponent = () => {
  const { user } = useAuth();

  // user es un objeto que cambia de referencia
  return <UserCard user={user} />;
};

// ✅ Solución 1: React.memo con comparación shallow
const UserCardMemo = React.memo(({ user }: { user: User }) => {
  console.log('UserCard rendered');
  return <div>{user.name}</div>;
});

// ✅ Solución 2: React.memo con comparación custom
const UserCardCustomMemo = React.memo(
  ({ user }: { user: User }) => {
    console.log('UserCard rendered');
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // Return true si props son iguales (no re-render)
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.user.name === nextProps.user.name
    );
  }
);
```

### useTransition para Updates No Urgentes

```tsx
import { useTransition, useState } from 'react';

const SearchResults = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value); // Actualización urgente (input)

    // Actualización no urgente (resultados)
    startTransition(() => {
      const filtered = expensiveFilter(value);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {results.map((result) => (
            <li key={result.id}>{result.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### useDeferredValue para Valores Derivados

```tsx
import { useDeferredValue, useMemo } from 'react';

const ProductList = () => {
  const [filter, setFilter] = useState('');
  const { products } = useProducts();

  // Diferir el valor del filtro (bajo priority)
  const deferredFilter = useDeferredValue(filter);

  // Filtrado con el valor diferido
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(deferredFilter.toLowerCase())
    );
  }, [products, deferredFilter]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter products..."
      />
      {/* Input es responsive, lista se actualiza después */}
      <ProductGrid products={filteredProducts} />
    </div>
  );
};
```

## 4. Técnicas de Memoización Avanzadas

### Memoizar Funciones Complejas

```tsx
// ❌ Malo: Función se recrea en cada render
const useSearchProducts = () => {
  const { products } = useProducts();
  const { filters } = useFilters();

  const searchProducts = (query: string) => {
    return products
      .filter((p) => p.name.includes(query))
      .filter((p) => matchesFilters(p, filters));
  };

  return { searchProducts };
};

// ✅ Bueno: Memoizar función con useCallback
const useSearchProductsOptimized = () => {
  const { products } = useProducts();
  const { filters } = useFilters();

  const searchProducts = useCallback(
    (query: string) => {
      return products
        .filter((p) => p.name.includes(query))
        .filter((p) => matchesFilters(p, filters));
    },
    [products, filters]
  );

  return { searchProducts };
};
```

### Memoizar Objetos de Configuración

```tsx
// ❌ Malo: Config se recrea en cada render
const DataTable = () => {
  const { data } = useData();

  const tableConfig = {
    columns: ['name', 'email', 'role'],
    sortable: true,
    filterable: true,
    pageSize: 20,
  };

  return <Table data={data} config={tableConfig} />;
};

// ✅ Bueno: Memoizar config
const DataTableOptimized = () => {
  const { data } = useData();

  const tableConfig = useMemo(
    () => ({
      columns: ['name', 'email', 'role'],
      sortable: true,
      filterable: true,
      pageSize: 20,
    }),
    [] // Config estático
  );

  return <Table data={data} config={tableConfig} />;
};

// ✅ Mejor: Config constante fuera del componente
const TABLE_CONFIG = {
  columns: ['name', 'email', 'role'],
  sortable: true,
  filterable: true,
  pageSize: 20,
} as const;

const DataTableBest = () => {
  const { data } = useData();
  return <Table data={data} config={TABLE_CONFIG} />;
};
```

## 5. Virtualización y Windowing

### React Virtual para Listas Grandes

```tsx
import { useVirtual } from 'react-virtual';

const VirtualList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    size: items.length,
    parentRef,
    estimateSize: useCallback(() => 50, []), // Altura estimada por item
    overscan: 5, // Render 5 items extra arriba/abajo
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.totalSize}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ItemCard item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 6. Comparación: Context API vs State Managers

### Context API + useReducer

```tsx
// Pros:
// ✅ Built-in, no dependencias externas
// ✅ Type-safe con TypeScript
// ✅ Menor bundle size
// ✅ Más control sobre optimizaciones

// Cons:
// ❌ Más boilerplate
// ❌ No devtools out-of-the-box
// ❌ Requiere optimizaciones manuales
// ❌ No middleware built-in

interface State {
  count: number;
  user: User | null;
}

type Action = { type: 'INCREMENT' } | { type: 'SET_USER'; payload: User };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
};

// ~50 lines de setup
```

### Zustand

```tsx
// Pros:
// ✅ Minimal boilerplate
// ✅ Built-in devtools
// ✅ Excelente performance
// ✅ Selector pattern built-in
// ✅ Middleware (persist, immer)

// Cons:
// ❌ +3kb bundle size
// ❌ Menos control fino sobre optimizaciones

import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface State {
  count: number;
  user: User | null;
  increment: () => void;
  setUser: (user: User) => void;
}

const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        count: 0,
        user: null,
        increment: () => set((state) => ({ count: state.count + 1 })),
        setUser: (user) => set({ user }),
      }),
      { name: 'app-storage' }
    )
  )
);

// ~15 lines de setup, más features
```

### Jotai

```tsx
// Pros:
// ✅ Atomic state (granular)
// ✅ Excelente performance
// ✅ TypeScript first
// ✅ Bottom-up approach

// Cons:
// ❌ +5kb bundle size
// ❌ Curva de aprendizaje (atoms)

import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const userAtom = atom<User | null>(null);

// Derived atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);

const Counter = () => {
  const [count, setCount] = useAtom(countAtom);
  const [doubleCount] = useAtom(doubleCountAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
};

// Atomic, granular, muy performante
```

### Redux Toolkit

```tsx
// Pros:
// ✅ Devtools excepcionales
// ✅ Time-travel debugging
// ✅ Middleware robusto (thunks, sagas)
// ✅ Community & ecosystem

// Cons:
// ❌ +40kb bundle size
// ❌ Más boilerplate
// ❌ Curva de aprendizaje alta

import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state) => {
      state.count += 1; // Immer built-in
    },
  },
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// ~30 lines de setup, máxima potencia
```

## 7. Métricas de Performance

### Benchmarking Re-renders

```tsx
// Hook para medir performance
export const usePerformanceMetrics = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const duration = performance.now() - startTime.current;

    console.log(`[${componentName}] Render #${renderCount.current} took ${duration.toFixed(2)}ms`);

    startTime.current = performance.now();
  });
};

// Uso
const ExpensiveComponent = () => {
  usePerformanceMetrics('ExpensiveComponent');

  // ... component logic
};
```

### Performance Budget

```tsx
// Definir budget de performance
const PERFORMANCE_BUDGET = {
  maxRenderTime: 16, // 60fps = 16ms per frame
  maxRenderCount: 5, // Max renders en 1 segundo
} as const;

export const usePerformanceBudget = (componentName: string) => {
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    renderTimes.current.push(duration);

    // Keep only last 5 renders
    if (renderTimes.current.length > 5) {
      renderTimes.current.shift();
    }

    // Check budget violations
    if (duration > PERFORMANCE_BUDGET.maxRenderTime) {
      console.warn(
        `[${componentName}] Render exceeded budget: ${duration.toFixed(2)}ms (budget: ${PERFORMANCE_BUDGET.maxRenderTime}ms)`
      );
    }

    const avgRenderTime =
      renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

    if (avgRenderTime > PERFORMANCE_BUDGET.maxRenderTime) {
      console.error(
        `[${componentName}] Average render time exceeded budget: ${avgRenderTime.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });
};
```

## Best Practices

1. **Measure First** - Siempre usar React DevTools Profiler antes de optimizar
2. **Split Contexts** - Separar contexts por dominio y frecuencia de updates
3. **Memoize Value** - Siempre memoizar context value con useMemo
4. **State/Dispatch Separation** - Separar para evitar re-renders de components que solo dispatch
5. **Selectors** - Usar selector pattern para valores derivados
6. **React.memo** - Memoizar componentes costosos que reciben props
7. **Virtual Lists** - Virtualizar listas grandes (> 100 items)
8. **Budget** - Definir performance budget y monitorearlo
9. **Don't Over-Optimize** - Solo optimizar cuando hay problema medible
10. **Consider Alternatives** - Si Context API es insuficiente, considerar Zustand/Jotai
