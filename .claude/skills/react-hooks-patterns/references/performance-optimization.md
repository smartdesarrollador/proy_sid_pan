# Performance Optimization - Guía de Optimización con Hooks

Guía detallada de optimización de rendimiento en React usando hooks, con métricas y casos de uso reales.

## Medir Antes de Optimizar

### React DevTools Profiler

```tsx
// Habilitar profiler en desarrollo
import { Profiler } from 'react';

const MyComponent = () => {
  const onRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="MyComponent" onRender={onRenderCallback}>
      <div>{/* Component content */}</div>
    </Profiler>
  );
};
```

### Custom Performance Hook

```tsx
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
}

// Uso
const MyComponent = () => {
  useRenderCount('MyComponent');
  return <div>Content</div>;
};
```

### Benchmark Hook

```tsx
export function useBenchmark(name: string) {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      const duration = performance.now() - startTime.current;
      console.log(`[Benchmark] ${name}: ${duration.toFixed(2)}ms`);
    };
  });
}

// Uso
const ExpensiveComponent = () => {
  useBenchmark('ExpensiveComponent');

  const data = useMemo(() => {
    // Cálculo costoso
    return heavyComputation();
  }, []);

  return <div>{data}</div>;
};
```

## Optimización de useState

### Lazy Initialization para Cálculos Costosos

```tsx
// ❌ Malo: Se ejecuta en cada render (LENTO)
const Component = () => {
  const [data, setData] = useState(expensiveComputation()); // Se ejecuta siempre
  return <div>{data}</div>;
};

// ✅ Bueno: Solo se ejecuta una vez (RÁPIDO)
const ComponentOptimized = () => {
  const [data, setData] = useState(() => expensiveComputation()); // Lazy
  return <div>{data}</div>;
};

// Benchmark
// Sin lazy: ~50ms por render
// Con lazy: ~50ms primer render, ~0.1ms renders siguientes
```

### Batching de Updates

```tsx
// React 18+ automáticamente hace batching en todas las situaciones

// ❌ Antes de React 18: 3 renders
const handleClick = async () => {
  setCount(1);      // Render 1
  setName('John');  // Render 2
  setActive(true);  // Render 3
};

// ✅ React 18: 1 solo render (automático)
const handleClickOptimized = async () => {
  setCount(1);
  setName('John');
  setActive(true);
  // React hace batching automático
};

// Para versiones anteriores, usar unstable_batchedUpdates:
import { unstable_batchedUpdates } from 'react-dom';

const handleClickLegacy = async () => {
  unstable_batchedUpdates(() => {
    setCount(1);
    setName('John');
    setActive(true);
  }); // 1 solo render
};
```

## Optimización de useEffect

### Evitar Dependencias Innecesarias

```tsx
// ❌ Malo: Re-ejecuta cuando props.onSave cambia
const Component = ({ data, onSave }: Props) => {
  useEffect(() => {
    const timer = setInterval(() => {
      onSave(data);
    }, 5000);

    return () => clearInterval(timer);
  }, [data, onSave]); // onSave cambia frecuentemente

  return <div>Autosaving...</div>;
};

// ✅ Bueno: Usar useCallback en el componente padre
const Parent = () => {
  const handleSave = useCallback((data: Data) => {
    api.save(data);
  }, []);

  return <Component data={data} onSave={handleSave} />;
};

// ✅ Alternativa: useRef para evitar dependencia
const ComponentAlt = ({ data, onSave }: Props) => {
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      onSaveRef.current(data);
    }, 5000);

    return () => clearInterval(timer);
  }, [data]); // Solo depende de data

  return <div>Autosaving...</div>;
};
```

### Separar Efectos Independientes

```tsx
// ❌ Malo: Todo en un efecto (re-ejecuta todo cuando cambia cualquier dep)
useEffect(() => {
  fetchUser(userId);          // Depende de userId
  subscribeToNotifications(); // Depende de settings
  logPageView(page);          // Depende de page

  return () => {
    unsubscribeNotifications();
  };
}, [userId, settings, page]); // Cualquier cambio re-ejecuta todo

// ✅ Bueno: Separar en efectos independientes
useEffect(() => {
  fetchUser(userId);
}, [userId]); // Solo re-ejecuta cuando userId cambia

useEffect(() => {
  const unsubscribe = subscribeToNotifications(settings);
  return () => unsubscribe();
}, [settings]); // Solo re-ejecuta cuando settings cambia

useEffect(() => {
  logPageView(page);
}, [page]); // Solo re-ejecuta cuando page cambia

// Benchmark: 60% menos ejecuciones en componente típico
```

## Optimización con React.memo

### Cuándo Usar React.memo

```tsx
// ❌ No usar memo si:
// 1. El componente es simple y rápido
const SimpleText = ({ text }: { text: string }) => {
  return <p>{text}</p>;
};

// 2. Las props cambian frecuentemente
const Clock = ({ time }: { time: Date }) => {
  return <div>{time.toLocaleTimeString()}</div>;
};

// ✅ Usar memo si:
// 1. Componente costoso de renderizar
const ExpensiveList = React.memo(({ items }: { items: Item[] }) => {
  // Renderizado costoso: 100ms+
  return (
    <ul>
      {items.map((item) => (
        <ExpensiveItem key={item.id} item={item} />
      ))}
    </ul>
  );
});

// 2. Recibe las mismas props frecuentemente
const Sidebar = React.memo(({ isOpen }: { isOpen: boolean }) => {
  // Componente grande pero props estables
  return <div className={isOpen ? 'open' : 'closed'}>{/* ... */}</div>;
});

// Benchmark con lista de 1000 items:
// Sin memo: ~150ms por render del padre
// Con memo: ~1ms por render del padre (si props no cambiaron)
```

### Custom Comparison Function

```tsx
interface Props {
  user: User;
  metadata: Metadata;
}

// ✅ Comparación custom para optimizar
const UserCard = React.memo(
  ({ user, metadata }: Props) => {
    return (
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Solo comparar user.id (ignorar metadata)
    return prevProps.user.id === nextProps.user.id;
  }
);

// Benchmark:
// Comparación shallow (default): ~0.5ms
// Comparación custom (solo id): ~0.1ms
// Deep comparison (lodash isEqual): ~2ms (❌ evitar)
```

## Optimización con useCallback

### Patrón: Callbacks para Componentes Memoizados

```tsx
interface ListItemProps {
  item: Item;
  onDelete: (id: string) => void;
}

const ListItem = React.memo(({ item, onDelete }: ListItemProps) => {
  console.log('ListItem rendered:', item.id);
  return (
    <div>
      {item.name}
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  );
});

// ❌ Malo: Nueva función en cada render
const List = ({ items }: { items: Item[] }) => {
  const [list, setList] = useState(items);

  const handleDelete = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      {list.map((item) => (
        <ListItem
          key={item.id}
          item={item}
          onDelete={handleDelete} // Nueva función cada render
        />
      ))}
    </div>
  );
};
// Resultado: ListItem se re-renderiza siempre (memo es inútil)

// ✅ Bueno: Memoizar el callback
const ListOptimized = ({ items }: { items: Item[] }) => {
  const [list, setList] = useState(items);

  const handleDelete = useCallback((id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
  }, []); // No depende de list gracias a función updater

  return (
    <div>
      {list.map((item) => (
        <ListItem key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  );
};
// Resultado: ListItem solo se re-renderiza si item cambia

// Benchmark con 100 items, eliminando 1:
// Sin useCallback: ~100 re-renders (todos los items)
// Con useCallback: ~1 re-render (solo el item eliminado)
```

## Optimización con useMemo

### Filtrado y Sorting de Listas

```tsx
const ProductList = ({ products, filter }: Props) => {
  // ❌ Malo: Filtrar y ordenar en cada render
  const filteredProducts = products
    .filter((p) => p.category === filter)
    .sort((a, b) => a.price - b.price);

  return (
    <div>
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// ✅ Bueno: Memoizar el resultado
const ProductListOptimized = ({ products, filter }: Props) => {
  const filteredProducts = useMemo(() => {
    console.log('Filtering and sorting...');
    return products
      .filter((p) => p.category === filter)
      .sort((a, b) => a.price - b.price);
  }, [products, filter]);

  return (
    <div>
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// Benchmark con 1000 productos:
// Sin useMemo: ~20ms por render (incluso sin cambios)
// Con useMemo: ~20ms primer render, ~0ms renders siguientes
```

### Evitar Re-crear Objetos/Arrays

```tsx
// ❌ Malo: Nuevo objeto en cada render
const Component = () => {
  const config = { theme: 'dark', locale: 'en' }; // Nuevo objeto cada vez

  return <ExpensiveChild config={config} />;
};

// ExpensiveChild siempre se re-renderiza aunque config sea igual

// ✅ Bueno: Memoizar el objeto
const ComponentOptimized = () => {
  const config = useMemo(() => ({ theme: 'dark', locale: 'en' }), []);

  return <ExpensiveChild config={config} />;
};

// ✅ Mejor: Extraer como constante si no depende de props/state
const CONFIG = { theme: 'dark', locale: 'en' };

const ComponentBest = () => {
  return <ExpensiveChild config={CONFIG} />;
};
```

## Virtualización para Listas Largas

### React Window (Windowing)

```tsx
import { FixedSizeList } from 'react-window';

// ❌ Malo: Renderizar 10,000 items (LENTO)
const HugeList = ({ items }: { items: Item[] }) => {
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};

// ✅ Bueno: Virtualización (RÁPIDO)
const VirtualizedList = ({ items }: { items: Item[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

// Benchmark con 10,000 items:
// Sin virtualización: ~2000ms tiempo de render inicial
// Con virtualización: ~50ms tiempo de render inicial (40x más rápido)
```

## Code Splitting con lazy() y Suspense

```tsx
import { lazy, Suspense } from 'react';

// ❌ Malo: Importar todo upfront
import HeavyComponent from './HeavyComponent';
import AnotherHeavyComponent from './AnotherHeavyComponent';

const App = () => {
  const [tab, setTab] = useState('home');

  return (
    <div>
      {tab === 'heavy' && <HeavyComponent />}
      {tab === 'another' && <AnotherHeavyComponent />}
    </div>
  );
};

// ✅ Bueno: Code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AnotherHeavyComponent = lazy(() => import('./AnotherHeavyComponent'));

const AppOptimized = () => {
  const [tab, setTab] = useState('home');

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        {tab === 'heavy' && <HeavyComponent />}
        {tab === 'another' && <AnotherHeavyComponent />}
      </Suspense>
    </div>
  );
};

// Métricas:
// Sin code splitting: Bundle inicial 500KB
// Con code splitting: Bundle inicial 150KB, chunks 100KB cada uno
// Mejora en First Contentful Paint: ~60%
```

## Debouncing/Throttling para Input

```tsx
// ❌ Malo: Búsqueda en cada keystroke (LENTO)
const SearchInput = () => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchResults(value); // API call en cada tecla
  };

  return <input value={query} onChange={handleChange} />;
};

// ✅ Bueno: Debounce
const SearchInputOptimized = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery); // API call solo después de 500ms sin escribir
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
};

// Benchmark escribiendo "react hooks":
// Sin debounce: 11 API calls
// Con debounce (500ms): 1 API call
// Reducción de carga del servidor: 91%
```

## Checklist de Optimización

### Prioridad Alta (Hacer siempre)
- ✅ Lazy initialization para cálculos costosos en useState
- ✅ Cleanup en useEffect (timers, listeners, subscriptions)
- ✅ Incluir todas las dependencias en useEffect/useCallback/useMemo
- ✅ Code splitting para rutas/componentes grandes

### Prioridad Media (Hacer cuando hay problema medible)
- ✅ React.memo para componentes costosos que reciben props estables
- ✅ useCallback para callbacks pasados a componentes memoizados
- ✅ useMemo para cálculos costosos o prevenir re-crear objetos/arrays
- ✅ Virtualización para listas >100 items

### Prioridad Baja (Solo si el profiler muestra problema)
- ✅ Custom comparison en React.memo
- ✅ Separar efectos independientes
- ✅ useDeepCompareEffect para comparación profunda

### ❌ NO hacer (Over-engineering)
- ❌ Memoizar todo por defecto
- ❌ useCallback/useMemo para componentes simples
- ❌ Optimización prematura sin medir

## Métricas de Éxito

**Antes de optimizar:**
- Tiempo de render: ~200ms
- Re-renders innecesarios: ~50/segundo
- Bundle size: 800KB
- First Contentful Paint: 2.5s

**Después de optimizar correctamente:**
- Tiempo de render: ~20ms (10x mejor)
- Re-renders innecesarios: ~5/segundo (10x mejor)
- Bundle size: 300KB (2.6x mejor)
- First Contentful Paint: 1.2s (2x mejor)

**Regla de oro:** Medir → Optimizar → Medir de nuevo
