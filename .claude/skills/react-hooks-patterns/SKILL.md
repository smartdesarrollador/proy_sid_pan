---
name: react-hooks-patterns
description: >
  Guía completa de patrones avanzados de React hooks con TypeScript para proyectos de producción.
  Usar cuando se necesiten patrones de useState, useEffect, useCallback, useMemo, useRef, useReducer,
  custom hooks, composición de hooks, optimización de rendimiento, o evitar anti-patterns comunes.
  Incluye ejemplos probados en producción con TypeScript strict.
---

# React Hooks Patterns - Patrones Avanzados con TypeScript

Guía completa de patrones avanzados de React hooks, enfocada en casos de uso reales, optimización y mejores prácticas probadas en producción.

## 1. useState - Patrones Avanzados

### Lazy Initialization

```tsx
// ❌ Malo: Cálculo costoso se ejecuta en cada render
const [data, setData] = useState(expensiveComputation());

// ✅ Bueno: Lazy initialization - solo se ejecuta una vez
const [data, setData] = useState(() => expensiveComputation());

// Ejemplo real: Leer de localStorage solo una vez
const [user, setUser] = useState<User | null>(() => {
  try {
    const item = localStorage.getItem('user');
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
    return null;
  }
});
```

### Functional Updates - Evitar stale closures

```tsx
// ❌ Malo: Puede usar valor stale en callbacks async
const [count, setCount] = useState(0);

const handleClick = () => {
  setTimeout(() => {
    setCount(count + 1); // count puede estar desactualizado
  }, 1000);
};

// ✅ Bueno: Usar función updater para obtener valor actual
const handleClickCorrect = () => {
  setTimeout(() => {
    setCount((prevCount) => prevCount + 1); // Siempre usa valor actual
  }, 1000);
};

// Caso de uso real: Múltiples updates en el mismo evento
const handleMultipleUpdates = () => {
  // ❌ Malo: Solo incrementa 1 vez
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);

  // ✅ Bueno: Incrementa 3 veces
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
};
```

### Estado de Objetos Complejos

```tsx
interface FormState {
  name: string;
  email: string;
  age: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const [form, setForm] = useState<FormState>({
  name: '',
  email: '',
  age: 0,
  preferences: {
    theme: 'light',
    notifications: true,
  },
});

// ❌ Malo: Mutar el estado directamente
form.name = 'John'; // NO hacer esto
setForm(form);

// ✅ Bueno: Update parcial inmutable
const updateField = (field: keyof FormState, value: any) => {
  setForm((prev) => ({
    ...prev,
    [field]: value,
  }));
};

// ✅ Mejor: Update de objetos anidados
const updatePreference = (key: keyof FormState['preferences'], value: any) => {
  setForm((prev) => ({
    ...prev,
    preferences: {
      ...prev.preferences,
      [key]: value,
    },
  }));
};

// ✅ Patrón de reset
const resetForm = () => {
  setForm({
    name: '',
    email: '',
    age: 0,
    preferences: {
      theme: 'light',
      notifications: true,
    },
  });
};
```

### Arrays - Add, Update, Delete

```tsx
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const [todos, setTodos] = useState<Todo[]>([]);

// Agregar item
const addTodo = (text: string) => {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    completed: false,
  };
  setTodos((prev) => [...prev, newTodo]);
};

// Agregar al inicio
const addTodoAtStart = (text: string) => {
  setTodos((prev) => [newTodo, ...prev]);
};

// Actualizar item
const toggleTodo = (id: string) => {
  setTodos((prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};

// Eliminar item
const deleteTodo = (id: string) => {
  setTodos((prev) => prev.filter((todo) => todo.id !== id));
};

// Reordenar (drag & drop)
const reorderTodos = (startIndex: number, endIndex: number) => {
  setTodos((prev) => {
    const result = Array.from(prev);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  });
};
```

## 2. useEffect - Patrones Correctos

### Dependencias Correctas

```tsx
// ❌ Malo: Omitir dependencias causa bugs
useEffect(() => {
  fetchUser(userId); // userId debe estar en dependencias
}, []);

// ✅ Bueno: Incluir todas las dependencias
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// ⚠️ Caso especial: Función estable con useCallback
const fetchUser = useCallback(async (id: number) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}, []); // fetchUser es estable

useEffect(() => {
  fetchUser(userId);
}, [userId, fetchUser]); // Incluir fetchUser aunque sea estable
```

### Cleanup Functions - Evitar memory leaks

```tsx
// ✅ Cleanup de timers
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('Delayed action');
  }, 1000);

  return () => clearTimeout(timer); // Cleanup
}, []);

// ✅ Cleanup de intervals
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(interval);
}, []);

// ✅ Cleanup de event listeners
useEffect(() => {
  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// ✅ Cleanup de subscriptions
useEffect(() => {
  const subscription = dataSource.subscribe(setData);
  return () => subscription.unsubscribe();
}, []);
```

### Async/Await Pattern - Evitar race conditions

```tsx
// ❌ Malo: useEffect no puede ser async directamente
useEffect(async () => {
  const data = await fetchData(); // Error: useEffect no retorna Promise
  setData(data);
}, []);

// ✅ Bueno: Async function dentro de useEffect
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setData(data);
    } catch (error) {
      setError(error);
    }
  };

  fetchData();
}, []);

// ✅ Mejor: Con AbortController para evitar race conditions
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal,
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error);
      }
    }
  };

  fetchData();

  return () => controller.abort(); // Cancelar fetch si component unmounts
}, []);

// ✅ Con flag para evitar setState en unmounted component
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    const data = await fetch('/api/data').then((r) => r.json());
    if (isMounted) {
      setData(data);
    }
  };

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);
```

### Evitar Infinite Loops

```tsx
// ❌ Peligro: Loop infinito - obj cambia en cada render
const [data, setData] = useState({ count: 0 });

useEffect(() => {
  setData({ count: data.count + 1 }); // Crea nuevo objeto → trigger effect → loop
}, [data]);

// ✅ Solución 1: Dependencia específica
useEffect(() => {
  setData({ count: data.count + 1 });
}, [data.count]); // Solo re-ejecuta si count cambia

// ✅ Solución 2: Función updater
useEffect(() => {
  setData((prev) => ({ count: prev.count + 1 }));
}, []); // Sin dependencias si solo quieres ejecutar una vez

// ❌ Peligro: Array/object creado inline como dependencia
useEffect(() => {
  fetchData(filters);
}, [{ status: 'active' }]); // Nuevo objeto cada render → loop

// ✅ Solución: Usar valores primitivos
const [status, setStatus] = useState('active');

useEffect(() => {
  fetchData({ status });
}, [status]);

// ✅ O usar useMemo para objetos complejos
const filters = useMemo(() => ({ status: 'active', page: 1 }), []);

useEffect(() => {
  fetchData(filters);
}, [filters]);
```

### Separar Concerns - Un efecto por responsabilidad

```tsx
// ❌ Malo: Múltiples responsabilidades en un efecto
useEffect(() => {
  fetchUser(userId);
  subscribeToNotifications(userId);
  logPageView(userId);

  return () => {
    unsubscribeNotifications();
  };
}, [userId]);

// ✅ Bueno: Separar en múltiples efectos
useEffect(() => {
  fetchUser(userId);
}, [userId]);

useEffect(() => {
  const unsubscribe = subscribeToNotifications(userId);
  return () => unsubscribe();
}, [userId]);

useEffect(() => {
  logPageView(userId);
}, [userId]);
```

## 3. useCallback - Memoización de Funciones

### Cuándo Usar useCallback

```tsx
// ❌ NO usar si el componente hijo no está memoizado
const Parent = () => {
  const [count, setCount] = useState(0);

  // Innecesario: Child no está memoizado
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />;
};

const Child = ({ onClick }: { onClick: () => void }) => {
  return <button onClick={onClick}>Click</button>;
};

// ✅ Usar cuando el hijo está memoizado
const ChildMemoized = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Click</button>;
});

const ParentOptimized = () => {
  const [count, setCount] = useState(0);

  // Necesario: Evita re-render de ChildMemoized
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <ChildMemoized onClick={handleClick} />
    </>
  );
};
```

### Dependencias Correctas

```tsx
// ❌ Malo: Dependencias faltantes
const [filter, setFilter] = useState('');

const handleSearch = useCallback(() => {
  fetchData(filter); // filter debe estar en dependencias
}, []);

// ✅ Bueno: Incluir todas las dependencias
const handleSearchCorrect = useCallback(() => {
  fetchData(filter);
}, [filter]);

// ✅ Alternativa: Usar función updater para evitar dependencias
const [items, setItems] = useState<Item[]>([]);

const addItem = useCallback((newItem: Item) => {
  setItems((prev) => [...prev, newItem]); // No depende de items
}, []); // Array vacío es correcto
```

### useCallback con Valores Externos

```tsx
interface Props {
  onSave: (data: FormData) => void;
  userId: number;
}

const Form = ({ onSave, userId }: Props) => {
  const [data, setData] = useState<FormData>({});

  // ❌ Malo: onSave de props debe estar en dependencias
  const handleSubmit = useCallback(() => {
    onSave(data);
  }, [data]);

  // ✅ Bueno: Incluir props en dependencias
  const handleSubmitCorrect = useCallback(() => {
    onSave(data);
  }, [data, onSave]);

  // ⚠️ Problema: Si onSave cambia frecuentemente, useCallback es inútil
  // Solución: El componente padre debe memoizar onSave
};

// Componente padre debe hacer esto:
const Parent = () => {
  const handleSave = useCallback((data: FormData) => {
    api.save(data);
  }, []); // Memoizar la función

  return <Form onSave={handleSave} userId={1} />;
};
```

## 4. useMemo - Optimización de Cálculos

### Cuándo Usar useMemo

```tsx
// ❌ NO usar para cálculos simples (overhead > beneficio)
const total = useMemo(() => a + b, [a, b]); // Innecesario

// ✅ Usar para cálculos costosos
const expensiveResult = useMemo(() => {
  return items
    .filter((item) => item.active)
    .map((item) => heavyComputation(item))
    .reduce((sum, val) => sum + val, 0);
}, [items]);

// ✅ Usar para evitar re-crear objetos/arrays
const filters = useMemo(
  () => ({
    status: 'active',
    category: selectedCategory,
    dateRange: { from: startDate, to: endDate },
  }),
  [selectedCategory, startDate, endDate]
);

// ✅ Usar para optimizar renderizado de componentes hijos
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

return <ExpensiveList items={sortedItems} />;
```

### useMemo vs useCallback

```tsx
// useMemo: Memoiza el RESULTADO de una función
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// useCallback: Memoiza la FUNCIÓN misma
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Son equivalentes:
useCallback(fn, deps) === useMemo(() => fn, deps);

// Ejemplo práctico - diferencia
const Parent = () => {
  const [count, setCount] = useState(0);

  // useMemo: Calcula y memoiza el resultado
  const doubleCount = useMemo(() => {
    console.log('Computing double');
    return count * 2;
  }, [count]);

  // useCallback: Memoiza la función
  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  return (
    <>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={increment}>Increment</button>
    </>
  );
};
```

### Evitar Sobre-Optimización

```tsx
// ❌ Malo: Memoizar todo innecesariamente
const Component = () => {
  const name = useMemo(() => 'John', []); // Innecesario
  const isActive = useMemo(() => true, []); // Innecesario
  const handleClick = useCallback(() => {}, []); // Solo útil si Child está memoizado

  return <div>{name}</div>;
};

// ✅ Bueno: Solo memoizar cuando hay beneficio medible
const ComponentOptimized = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('');

  // Memoizar solo el filtrado costoso
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return <List items={filteredItems} />;
};
```

## 5. useRef - Referencias y Valores Mutables

### DOM Refs

```tsx
// ✅ Ref para elementos HTML
const InputWithFocus = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
};

// ✅ Múltiples refs con useRef callback
const MultipleInputs = () => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <>
      {[0, 1, 2].map((i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
        />
      ))}
    </>
  );
};
```

### Valores Mutables sin Re-render

```tsx
// ✅ Almacenar valores que NO deben trigger re-render
const TimerComponent = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [count, setCount] = useState(0);

  const startTimer = () => {
    if (intervalRef.current) return; // Ya está corriendo

    intervalRef.current = setInterval(() => {
      setCount((prev) => prev + 1);
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
    <>
      <p>Count: {count}</p>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </>
  );
};
```

### Previous Value Pattern

```tsx
// ✅ Guardar valor anterior del state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Uso
const Counter = () => {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount ?? 'N/A'}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
```

### Evitar Stale Closures con Refs

```tsx
// ❌ Problema: Closure stale en event listener
const BadExample = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handleClick = () => {
      console.log('Count:', count); // Siempre imprime 0
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []); // count no está en dependencias

  return <button onClick={() => setCount(count + 1)}>Increment</button>;
};

// ✅ Solución: Usar ref para valor actual
const GoodExample = () => {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  useEffect(() => {
    countRef.current = count; // Actualizar ref en cada render
  });

  useEffect(() => {
    const handleClick = () => {
      console.log('Count:', countRef.current); // Siempre imprime valor actual
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return <button onClick={() => setCount(count + 1)}>Increment</button>;
};
```

## 6. useReducer - State Complejo

### Cuándo Preferir useReducer sobre useState

```tsx
// ✅ Usar useReducer cuando:
// 1. Estado tiene múltiples sub-valores relacionados
// 2. Múltiples formas de actualizar el estado
// 3. Lógica de update compleja
// 4. Necesitas testing fácil (reducer es función pura)

interface State {
  data: User[] | null;
  loading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { data: User[]; hasMore: boolean } }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'NEXT_PAGE' }
  | { type: 'RESET' };

const initialState: State = {
  data: null,
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        data: state.data
          ? [...state.data, ...action.payload.data]
          : action.payload.data,
        hasMore: action.payload.hasMore,
      };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'NEXT_PAGE':
      return { ...state, page: state.page + 1 };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

const DataList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchData = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await fetch(`/api/users?page=${state.page}`);
      const data = await response.json();
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: { data, hasMore: data.length > 0 },
      });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: error as Error });
    }
  };

  return (
    <div>
      {state.loading && <p>Loading...</p>}
      {state.error && <p>Error: {state.error.message}</p>}
      {state.data && <List items={state.data} />}
      {state.hasMore && (
        <button onClick={() => dispatch({ type: 'NEXT_PAGE' })}>
          Load More
        </button>
      )}
    </div>
  );
};
```

### Action Creators Pattern

```tsx
// ✅ Crear action creators para type safety
const userActions = {
  fetchStart: (): Action => ({ type: 'FETCH_START' }),

  fetchSuccess: (data: User[], hasMore: boolean): Action => ({
    type: 'FETCH_SUCCESS',
    payload: { data, hasMore },
  }),

  fetchError: (error: Error): Action => ({
    type: 'FETCH_ERROR',
    payload: error,
  }),

  nextPage: (): Action => ({ type: 'NEXT_PAGE' }),

  reset: (): Action => ({ type: 'RESET' }),
};

// Uso con action creators
const Component = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchData = async () => {
    dispatch(userActions.fetchStart());
    try {
      const data = await api.getUsers();
      dispatch(userActions.fetchSuccess(data, true));
    } catch (error) {
      dispatch(userActions.fetchError(error as Error));
    }
  };
};
```

Ver `references/custom-hooks-library.md` para más custom hooks reutilizables.
Ver `references/anti-patterns.md` para patrones a evitar.
Ver `references/performance-optimization.md` para guías de optimización detalladas.

## Resumen de Cuándo Usar Cada Hook

| Hook | Cuándo Usar | Cuándo NO Usar |
|------|-------------|----------------|
| `useState` | Estado simple, valores independientes | Estado complejo con múltiples relacionados |
| `useEffect` | Side effects, subscriptions, DOM manipulation | Transformar datos para render |
| `useCallback` | Pasar callbacks a componentes memoizados | Componentes no memoizados |
| `useMemo` | Cálculos costosos, evitar re-crear objetos | Cálculos simples (a + b) |
| `useRef` | DOM refs, valores mutables sin re-render | Estado que debe trigger re-render |
| `useReducer` | Estado complejo, múltiples acciones | Estado simple con 1-2 valores |

## Reglas de Oro

1. **Siempre incluir todas las dependencias** en useEffect/useCallback/useMemo
2. **Usar función updater** cuando el nuevo state depende del anterior
3. **Cleanup en useEffect** para timers, listeners, subscriptions
4. **AbortController** para fetch en useEffect
5. **No sobre-optimizar** - medir antes de memoizar
6. **Un efecto por responsabilidad** - separar concerns
7. **Lazy initialization** para cálculos costosos en useState
8. **useReducer** para estado complejo con múltiples acciones
