# Anti-Patterns - Patrones a Evitar

Guía de anti-patterns comunes con React hooks y sus soluciones correctas.

## useState Anti-Patterns

### ❌ Anti-Pattern: Mutar el estado directamente

```tsx
// ❌ MAL: Mutar el array directamente
const [items, setItems] = useState<Item[]>([]);

const addItem = (item: Item) => {
  items.push(item); // Mutación directa
  setItems(items); // React no detecta el cambio
};

// ✅ BIEN: Crear nuevo array inmutable
const addItemCorrect = (item: Item) => {
  setItems([...items, item]); // Nuevo array
};

// O mejor con función updater
const addItemBest = (item: Item) => {
  setItems((prev) => [...prev, item]);
};
```

### ❌ Anti-Pattern: Múltiples useState relacionados

```tsx
// ❌ MAL: Estado fragmentado
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  try {
    const result = await api.get();
    setData(result);
    setLoading(false);
  } catch (err) {
    setError(err);
    setLoading(false);
  }
};

// ✅ BIEN: Usar useReducer para estado complejo
interface State {
  data: Data | null;
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Data }
  | { type: 'FETCH_ERROR'; payload: Error };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, {
  data: null,
  loading: false,
  error: null,
});
```

### ❌ Anti-Pattern: Derivar estado cuando no es necesario

```tsx
// ❌ MAL: Guardar valores derivados en estado
const [items, setItems] = useState<Item[]>([]);
const [filteredItems, setFilteredItems] = useState<Item[]>([]);

useEffect(() => {
  setFilteredItems(items.filter((item) => item.active));
}, [items]);

// ✅ BIEN: Calcular en cada render (es rápido)
const [items, setItems] = useState<Item[]>([]);
const filteredItems = items.filter((item) => item.active);

// ✅ MEJOR: Memoizar solo si es costoso
const filteredItems = useMemo(
  () => items.filter((item) => item.active),
  [items]
);
```

## useEffect Anti-Patterns

### ❌ Anti-Pattern: Omitir dependencias

```tsx
// ❌ MAL: userId debería estar en dependencias
const [user, setUser] = useState(null);

useEffect(() => {
  fetchUser(userId); // userId no está en dependencias
}, []); // ESLint warning!

// ✅ BIEN: Incluir todas las dependencias
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

### ❌ Anti-Pattern: No hacer cleanup

```tsx
// ❌ MAL: Sin cleanup, memory leak
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
}, []); // Timer nunca se limpia

// ✅ BIEN: Cleanup function
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(timer);
}, []);
```

### ❌ Anti-Pattern: useEffect síncrono para efectos secundarios async

```tsx
// ❌ MAL: useEffect directamente async
useEffect(async () => {
  const data = await fetchData(); // Error de TypeScript
  setData(data);
}, []);

// ✅ BIEN: Función async dentro
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData();
    setData(data);
  };
  loadData();
}, []);

// ✅ MEJOR: Con AbortController
useEffect(() => {
  const controller = new AbortController();

  const loadData = async () => {
    try {
      const data = await fetchData({ signal: controller.signal });
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  };

  loadData();

  return () => controller.abort();
}, []);
```

### ❌ Anti-Pattern: setState en cada render

```tsx
// ❌ MAL: Loop infinito
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(count + 1); // Sin dependencias → ejecuta en cada render → loop
});

// ✅ BIEN: Ejecutar solo una vez
useEffect(() => {
  setCount(1);
}, []); // Solo al montar

// O con dependencia específica
useEffect(() => {
  setCount(propValue);
}, [propValue]);
```

### ❌ Anti-Pattern: Dependencias object/array inline

```tsx
// ❌ MAL: Nuevo objeto en cada render → loop
useEffect(() => {
  fetchData({ status: 'active' }); // Nuevo objeto cada vez
}, [{ status: 'active' }]);

// ✅ BIEN: Extraer a constante fuera del componente
const FILTER = { status: 'active' };

useEffect(() => {
  fetchData(FILTER);
}, [FILTER]);

// ✅ O usar valores primitivos
const [status] = useState('active');

useEffect(() => {
  fetchData({ status });
}, [status]);

// ✅ O usar useMemo
const filter = useMemo(() => ({ status: 'active' }), []);

useEffect(() => {
  fetchData(filter);
}, [filter]);
```

## useCallback/useMemo Anti-Patterns

### ❌ Anti-Pattern: Memoizar todo innecesariamente

```tsx
// ❌ MAL: Sobre-optimización sin beneficio
const Component = () => {
  const [count, setCount] = useState(0);

  // Innecesario: Child no está memoizado
  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  // Innecesario: Cálculo trivial
  const doubled = useMemo(() => count * 2, [count]);

  return (
    <div>
      <p>{doubled}</p>
      <ChildNotMemoized onClick={increment} />
    </div>
  );
};

// ✅ BIEN: Solo memoizar cuando hay beneficio
const ComponentOptimized = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  // Cálculo trivial, no memoizar
  const doubled = count * 2;

  return (
    <div>
      <p>{doubled}</p>
      <ChildMemoized onClick={increment} />
    </div>
  );
};

const ChildMemoized = React.memo(({ onClick }: Props) => {
  return <button onClick={onClick}>Click</button>;
});
```

### ❌ Anti-Pattern: useCallback con dependencias faltantes

```tsx
// ❌ MAL: userId debe estar en dependencias
const handleSave = useCallback(() => {
  api.save(userId, data); // userId y data no están en deps
}, []);

// ✅ BIEN: Incluir todas las dependencias
const handleSaveCorrect = useCallback(() => {
  api.save(userId, data);
}, [userId, data]);

// ⚠️ Problema: Si data cambia frecuentemente, useCallback es inútil
// Solución: Usar función updater para evitar dependencias
const [items, setItems] = useState([]);

const addItem = useCallback((item) => {
  setItems((prev) => [...prev, item]); // No depende de items
}, []); // Array vacío es correcto
```

### ❌ Anti-Pattern: useMemo para efectos secundarios

```tsx
// ❌ MAL: useMemo no es para side effects
const result = useMemo(() => {
  localStorage.setItem('key', value); // Side effect!
  return value;
}, [value]);

// ✅ BIEN: useEffect para side effects
useEffect(() => {
  localStorage.setItem('key', value);
}, [value]);
```

## useRef Anti-Patterns

### ❌ Anti-Pattern: Usar ref cuando necesitas re-render

```tsx
// ❌ MAL: Usar ref para estado que afecta UI
const countRef = useRef(0);

const increment = () => {
  countRef.current += 1; // No trigger re-render
};

return <p>{countRef.current}</p>; // No se actualiza

// ✅ BIEN: Usar useState para estado que afecta UI
const [count, setCount] = useState(0);

const increment = () => {
  setCount((c) => c + 1); // Trigger re-render
};

return <p>{count}</p>; // Se actualiza
```

### ❌ Anti-Pattern: Modificar ref.current en render

```tsx
// ❌ MAL: Modificar ref en render (side effect)
const Component = () => {
  const renderCount = useRef(0);
  renderCount.current += 1; // Side effect durante render

  return <div>Renders: {renderCount.current}</div>;
};

// ✅ BIEN: Modificar en useEffect
const ComponentCorrect = () => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
  });

  return <div>Renders: {renderCount.current}</div>;
};
```

## useReducer Anti-Patterns

### ❌ Anti-Pattern: Reducer impuro (con side effects)

```tsx
// ❌ MAL: Side effects en el reducer
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_ITEM':
      localStorage.setItem('items', JSON.stringify(state.items)); // Side effect!
      return { ...state, items: [...state.items, action.payload] };
    default:
      return state;
  }
};

// ✅ BIEN: Side effects en useEffect
const [state, dispatch] = useReducer(reducer, initialState);

useEffect(() => {
  localStorage.setItem('items', JSON.stringify(state.items));
}, [state.items]);
```

### ❌ Anti-Pattern: Mutar el estado en reducer

```tsx
// ❌ MAL: Mutar el estado
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_ITEM':
      state.items.push(action.payload); // Mutación!
      return state;
    default:
      return state;
  }
};

// ✅ BIEN: Retornar nuevo estado inmutable
const reducerCorrect = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    default:
      return state;
  }
};
```

## Custom Hooks Anti-Patterns

### ❌ Anti-Pattern: Custom hook que no sigue reglas de hooks

```tsx
// ❌ MAL: No empieza con "use"
function myCustomLogic() {
  const [state, setState] = useState(0); // Error: hooks solo en componentes/hooks
  return state;
}

// ✅ BIEN: Nombre empieza con "use"
function useCustomLogic() {
  const [state, setState] = useState(0);
  return state;
}
```

### ❌ Anti-Pattern: Hook que retorna JSX

```tsx
// ❌ MAL: Hook no debe retornar JSX
function useUserCard(user: User) {
  return <div>{user.name}</div>; // Esto debe ser un componente
}

// ✅ BIEN: Hook retorna datos, componente retorna JSX
function useUser(userId: number) {
  const [user, setUser] = useState<User | null>(null);
  // ... fetch logic
  return user;
}

const UserCard = ({ userId }: { userId: number }) => {
  const user = useUser(userId);
  return <div>{user?.name}</div>;
};
```

### ❌ Anti-Pattern: Llamar hooks condicionalmente

```tsx
// ❌ MAL: Hook dentro de condicional
const Component = ({ shouldFetch }: { shouldFetch: boolean }) => {
  if (shouldFetch) {
    const data = useFetch('/api/data'); // Error: violación reglas de hooks
  }

  return <div>...</div>;
};

// ✅ BIEN: Hook siempre se llama, lógica condicional dentro
const ComponentCorrect = ({ shouldFetch }: { shouldFetch: boolean }) => {
  const { data } = useFetch(shouldFetch ? '/api/data' : null);

  return <div>...</div>;
};

// O implementar el hook para aceptar la condición
function useFetch(url: string | null) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!url) return; // Condicional dentro del hook

    fetch(url).then(setData);
  }, [url]);

  return data;
}
```

## Performance Anti-Patterns

### ❌ Anti-Pattern: Re-crear callbacks en cada render

```tsx
// ❌ MAL: Nueva función en cada render
const Parent = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <ExpensiveChild onUpdate={() => console.log('updated')} />
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

// ExpensiveChild se re-renderiza en cada incremento, aunque no debería
const ExpensiveChild = React.memo(({ onUpdate }: Props) => {
  // Expensive computation
  return <div>Child</div>;
});

// ✅ BIEN: Memoizar el callback
const ParentOptimized = () => {
  const [count, setCount] = useState(0);

  const handleUpdate = useCallback(() => {
    console.log('updated');
  }, []);

  return (
    <div>
      <ExpensiveChild onUpdate={handleUpdate} />
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
```

### ❌ Anti-Pattern: Pasar objetos inline a componentes memoizados

```tsx
// ❌ MAL: Nuevo objeto en cada render
const Parent = () => {
  return <Child config={{ theme: 'dark', size: 'md' }} />;
};

const Child = React.memo(({ config }: Props) => {
  // Se re-renderiza siempre porque config es nuevo objeto
  return <div>Child</div>;
});

// ✅ BIEN: Memoizar el objeto
const ParentOptimized = () => {
  const config = useMemo(() => ({ theme: 'dark', size: 'md' }), []);

  return <Child config={config} />;
};

// ✅ MEJOR: Pasar props primitivas
const ParentBest = () => {
  return <Child theme="dark" size="md" />;
};

const ChildBest = React.memo(({ theme, size }: Props) => {
  return <div>Child</div>;
});
```

## Resumen de Anti-Patterns

| Anti-Pattern | Problema | Solución |
|--------------|----------|----------|
| Mutar estado | React no detecta cambios | Inmutabilidad |
| Omitir dependencias | Bugs con valores stale | Incluir todas las deps |
| Sin cleanup | Memory leaks | return cleanup function |
| Memoizar todo | Overhead innecesario | Medir antes de optimizar |
| Hooks condicionales | Violación reglas | Siempre llamar hooks |
| Reducer impuro | Side effects inesperados | Reducer puro + useEffect |
| Ref para UI state | No re-render | useState |
| Derivar estado | Sincronización compleja | Calcular en render |

**Regla de oro:** Seguir las reglas de hooks y las advertencias de ESLint.
