# Custom Hooks Reference

Colección de custom hooks tipados, reutilizables y listos para usar en proyectos de React + TypeScript.

## useToggle - Boolean state simplificado

```tsx
import { useState, useCallback } from 'react';

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
      {isOpen && <div>Modal content</div>}
    </>
  );
};
```

## useClickOutside - Detectar clicks fuera de un elemento

```tsx
import { useEffect, RefObject } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element || element.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// Uso
const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  );
};
```

## useMediaQuery - Responsive design hooks

```tsx
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

// Uso
const ResponsiveComponent = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
};
```

## usePrevious - Obtener valor anterior de un state

```tsx
import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Uso
const Counter = () => {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {previousCount ?? 'N/A'}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
```

## useInterval - setInterval declarativo

```tsx
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Guardar el callback más reciente
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup del interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Uso
const Timer = () => {
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useInterval(
    () => {
      setCount(count + 1);
    },
    isRunning ? 1000 : null
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Pause' : 'Resume'}
      </button>
    </div>
  );
};
```

## useWindowSize - Dimensiones de ventana

```tsx
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Uso
const ResponsiveGrid = () => {
  const { width } = useWindowSize();

  const columns = width < 768 ? 1 : width < 1024 ? 2 : 3;

  return <div style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} />;
};
```

## useAsync - Manejo de operaciones async

```tsx
import { useState, useCallback } from 'react';

interface AsyncState<T> {
  loading: boolean;
  error: Error | null;
  data: T | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: immediate,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ loading: true, error: null, data: null });

      try {
        const data = await asyncFunction(...args);
        setState({ loading: false, error: null, data });
      } catch (error) {
        setState({
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
          data: null,
        });
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute, reset };
}

// Uso
const fetchUser = async (userId: number): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};

const UserProfile = ({ userId }: { userId: number }) => {
  const { loading, error, data, execute } = useAsync(() => fetchUser(userId));

  useEffect(() => {
    execute();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
};
```

## useForm - Manejo de formularios

```tsx
import { useState, ChangeEvent, FormEvent } from 'react';

interface UseFormReturn<T> {
  values: T;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (callback: (values: T) => void) => (e: FormEvent) => void;
  reset: () => void;
  setValues: (values: T) => void;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (callback: (values: T) => void) => (e: FormEvent) => {
    e.preventDefault();
    callback(values);
  };

  const reset = () => {
    setValues(initialValues);
  };

  return { values, handleChange, handleSubmit, reset, setValues };
}

// Uso
interface LoginForm {
  email: string;
  password: string;
}

const LoginComponent = () => {
  const { values, handleChange, handleSubmit, reset } = useForm<LoginForm>({
    email: '',
    password: '',
  });

  const onSubmit = (data: LoginForm) => {
    console.log('Form submitted:', data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};
```

## useCopyToClipboard - Copiar al portapapeles

```tsx
import { useState } from 'react';

type CopiedValue = string | null;

export function useCopyToClipboard(): [
  CopiedValue,
  (text: string) => Promise<void>
] {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);

  const copy = async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopiedText(null);
    }
  };

  return [copiedText, copy];
}

// Uso
const CopyButton = ({ text }: { text: string }) => {
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <button onClick={() => copy(text)}>
      {copiedText ? 'Copied!' : 'Copy'}
    </button>
  );
};
```

## useOnScreen - Detectar cuando un elemento es visible

```tsx
import { useState, useEffect, RefObject } from 'react';

export function useOnScreen<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  rootMargin: string = '0px'
): boolean {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isIntersecting;
}

// Uso
const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref, '100px');

  return (
    <div ref={ref}>
      {isVisible ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="placeholder">Loading...</div>
      )}
    </div>
  );
};
```

## useDebounceCallback - Debounce de funciones

```tsx
import { useRef, useCallback } from 'react';

export function useDebounceCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

// Uso
const SearchInput = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    console.log('Searching for:', value);
    // fetch(`/api/search?q=${value}`)
  };

  const debouncedSearch = useDebounceCallback(handleSearch, 500);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={onChange} />;
};
```

## useKeyPress - Detectar teclas presionadas

```tsx
import { useState, useEffect } from 'react';

export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

// Uso
const KeyPressExample = () => {
  const enterPressed = useKeyPress('Enter');
  const escapePressed = useKeyPress('Escape');

  return (
    <div>
      <p>Enter pressed: {enterPressed ? 'Yes' : 'No'}</p>
      <p>Escape pressed: {escapePressed ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

## Resumen de Hooks

| Hook | Propósito | Uso Principal |
|------|-----------|---------------|
| `useToggle` | Toggle boolean state | Modales, dropdowns, show/hide |
| `useClickOutside` | Detectar clicks externos | Cerrar dropdowns, modales |
| `useMediaQuery` | Responsive design | Mostrar/ocultar según tamaño |
| `usePrevious` | Valor anterior del state | Comparaciones, animaciones |
| `useInterval` | Temporizador declarativo | Timers, polling |
| `useWindowSize` | Dimensiones de ventana | Layouts responsive |
| `useAsync` | Operaciones async | API calls con estados |
| `useForm` | Manejo de formularios | Forms con validación |
| `useCopyToClipboard` | Copiar texto | Copy buttons |
| `useOnScreen` | Visibilidad de elemento | Lazy loading, animations |
| `useDebounceCallback` | Debounce de funciones | Search inputs |
| `useKeyPress` | Detectar teclas | Shortcuts, accesibilidad |
