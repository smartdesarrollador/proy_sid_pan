---
name: react-context-state
description: >
  Guía completa de gestión de estado global con Context API y TypeScript para proyectos escalables.
  Usar cuando se necesite: setup de Context con tipos seguros, patrones de reducers, múltiples contexts,
  custom hooks (useAuth, useTheme), optimización de re-renders, composición de providers, estado derivado,
  inicialización de estado, testing de contexts. Alternativa ligera a Redux/Zustand con patrones de producción.
---

# React Context State - Gestión de Estado con Context API + TypeScript

Guía completa para gestión de estado global con Context API, enfocada en type safety, performance y patrones de producción para aplicaciones medianas a grandes.

## 1. Setup Básico de Context - Type Safety

### Context Simple con Tipos Correctos

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Definir tipos del estado
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// 2. Crear Context con tipo y default undefined
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Provider Component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: UserContextType = {
    user,
    setUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 4. Custom hook para consumir el context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};
```

### Context con Default Value Seguro

```tsx
// ❌ Malo: Default value vacío requiere undefined en el tipo
const ThemeContext = createContext<{ theme: string } | undefined>(undefined);

// ✅ Bueno: Default value real evita undefined en el tipo
const defaultTheme = {
  theme: 'light',
  toggleTheme: () => console.warn('ThemeProvider not found'),
};

const ThemeContext = createContext(defaultTheme);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
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

// Hook más simple sin necesidad de verificar undefined
export const useTheme = () => useContext(ThemeContext);
```

## 2. Context + useReducer - Estado Complejo

### Pattern: Context con Reducer para Estado Complejo

```tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

// 1. Definir State y Actions
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' };

// 2. Reducer puro
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find((item) => item.id === action.payload.id);

      let newItems: CartItem[];
      if (existingItem) {
        newItems = state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }

      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );

      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };

    default:
      return state;
  }
};

// 3. Context Type con dispatch
interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  // Helper functions (opcional)
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// 4. Provider con useReducer
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Helper functions que wrappean dispatch
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const value: CartContextType = {
    state,
    dispatch,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// 5. Custom hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};
```

### Uso del Context con Reducer

```tsx
const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();

  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => addItem(product)}>Add to Cart</button>
    </div>
  );
};

const CartSummary = () => {
  const { state, clearCart } = useCart();

  return (
    <div>
      <h2>Cart ({state.itemCount} items)</h2>
      <p>Total: ${state.total.toFixed(2)}</p>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
};
```

## 3. Múltiples Contexts - Separación por Dominio

### Pattern: Context Splitting para Mejor Organización

```tsx
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setUser(user);
    localStorage.setItem('token', user.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// contexts/ThemeContext.tsx
type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'auto';
  });

  const isDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// contexts/NotificationContext.tsx
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { ...notification, id }]);

    // Auto-remove después de 5s
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
```

## 4. Custom Hooks para Contexts - Encapsulación de Lógica

### Pattern: Hooks que Combinan Múltiples Contexts

```tsx
// hooks/useCurrentUser.ts
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      addNotification({ type: 'error', message: 'Not authenticated' });
      return;
    }

    try {
      const updatedUser = await api.updateUser(user.id, data);
      // Actualizar user en AuthContext
      addNotification({ type: 'success', message: 'Profile updated' });
      return updatedUser;
    } catch (error) {
      addNotification({ type: 'error', message: 'Failed to update profile' });
    }
  };

  return {
    user,
    isAuthenticated,
    updateProfile,
  };
};

// hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}:${action}`;
    return hasPermission(permission);
  };

  return {
    hasPermission,
    hasRole,
    canAccess,
  };
};

// Uso en componentes
const ProfilePage = () => {
  const { user, updateProfile } = useCurrentUser();
  const { canAccess } = usePermissions();

  if (!canAccess('profile', 'edit')) {
    return <AccessDenied />;
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateProfile({ name: 'New Name' });
    }}>
      {/* form fields */}
    </form>
  );
};
```

## 5. Optimización de Re-renders - Performance Crítico

### Problem: Todos los Consumers Re-render

```tsx
// ❌ Problema: Cualquier cambio en el context value causa re-render de todos los consumers
const AppContext = createContext<{
  user: User | null;
  settings: Settings;
  notifications: Notification[];
  updateUser: (user: User) => void;
  updateSettings: (settings: Settings) => void;
} | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ❌ Problema: Este objeto se recrea en cada render
  const value = {
    user,
    settings,
    notifications,
    updateUser: setUser,
    updateSettings: setSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

### Solución 1: Split Contexts

```tsx
// ✅ Separar en múltiples contexts independientes
const UserContext = createContext<UserContextType | undefined>(undefined);
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Ahora los componentes solo se re-renderizan si su context específico cambia
const UserProfile = () => {
  const { user } = useUser(); // Solo re-render si user cambia
  return <div>{user?.name}</div>;
};

const SettingsPanel = () => {
  const { settings } = useSettings(); // Solo re-render si settings cambia
  return <div>{settings.theme}</div>;
};
```

### Solución 2: useMemo para Value

```tsx
// ✅ Memoizar el value para evitar re-creación
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  // Memoizar el value
  const value = useMemo(
    () => ({
      user,
      setUser,
      logout,
    }),
    [user, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
```

### Solución 3: State y Dispatch Separation

```tsx
// ✅ Separar state y dispatch en contexts diferentes
const CartStateContext = createContext<CartState | undefined>(undefined);
const CartDispatchContext = createContext<React.Dispatch<CartAction> | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
};

// Hooks separados
export const useCartState = () => {
  const context = useContext(CartStateContext);
  if (!context) throw new Error('useCartState must be used within CartProvider');
  return context;
};

export const useCartDispatch = () => {
  const context = useContext(CartDispatchContext);
  if (!context) throw new Error('useCartDispatch must be used within CartProvider');
  return context;
};

// Uso: Los componentes solo se re-renderizan si necesitan el state o dispatch
const CartSummary = () => {
  const { total } = useCartState(); // Solo re-render si state cambia
  return <div>Total: ${total}</div>;
};

const AddToCartButton = ({ item }: { item: CartItem }) => {
  const dispatch = useCartDispatch(); // NUNCA re-render (dispatch es estable)

  return (
    <button onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}>
      Add to Cart
    </button>
  );
};
```

## 6. Composición de Providers - ProviderComposer Utility

### Pattern: Evitar Provider Hell

```tsx
// ❌ Provider Hell
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <CartProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </CartProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

// ✅ Composer Utility
type Provider = React.ComponentType<{ children: ReactNode }>;

interface ComposeProvidersProps {
  providers: Provider[];
  children: ReactNode;
}

export const ComposeProviders = ({ providers, children }: ComposeProvidersProps) => {
  return (
    <>
      {providers.reduceRight((acc, Provider) => {
        return <Provider>{acc}</Provider>;
      }, children)}
    </>
  );
};

// Uso limpio
const App = () => {
  return (
    <ComposeProviders
      providers={[
        AuthProvider,
        ThemeProvider,
        NotificationProvider,
        CartProvider,
        SettingsProvider,
      ]}
    >
      <AppContent />
    </ComposeProviders>
  );
};
```

## 7. Estado Derivado y Selectores

### Pattern: Computed Values sin Re-renders

```tsx
interface StoreState {
  products: Product[];
  cart: CartItem[];
  filters: {
    category: string;
    priceRange: [number, number];
    search: string;
  };
}

const StoreContext = createContext<StoreState | undefined>(undefined);

// ✅ Custom hook con selector
export const useStoreSelector = <T,>(selector: (state: StoreState) => T): T => {
  const state = useContext(StoreContext);
  if (!state) throw new Error('useStoreSelector must be used within StoreProvider');

  return useMemo(() => selector(state), [state, selector]);
};

// Selectores específicos
export const useFilteredProducts = () => {
  return useStoreSelector((state) => {
    return state.products.filter((product) => {
      const matchesCategory =
        state.filters.category === 'all' || product.category === state.filters.category;

      const matchesPrice =
        product.price >= state.filters.priceRange[0] &&
        product.price <= state.filters.priceRange[1];

      const matchesSearch = product.name
        .toLowerCase()
        .includes(state.filters.search.toLowerCase());

      return matchesCategory && matchesPrice && matchesSearch;
    });
  });
};

export const useCartTotal = () => {
  return useStoreSelector((state) => {
    return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });
};

export const useCartItemCount = () => {
  return useStoreSelector((state) => {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  });
};

// Uso en componentes
const ProductList = () => {
  const products = useFilteredProducts(); // Solo re-render si filtered products cambia

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const CartIcon = () => {
  const itemCount = useCartItemCount(); // Solo re-render si item count cambia

  return (
    <div>
      🛒 {itemCount}
    </div>
  );
};
```

## 8. Inicialización de Estado - Lazy Init + Persistencia

### Pattern: Lazy Initialization con localStorage

```tsx
interface Settings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

const defaultSettings: Settings = {
  theme: 'light',
  language: 'en',
  notifications: true,
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // ✅ Lazy initialization - solo ejecuta una vez
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }
  });

  // Sincronizar con localStorage cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('settings');
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
    }),
    [settings, updateSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
```

### Pattern: Async Initialization (con Loading State)

```tsx
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize async
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await api.verifyToken(token);
          setState({ user, isLoading: false, isAuthenticated: true });
        } else {
          setState({ user: null, isLoading: false, isAuthenticated: false });
        }
      } catch (error) {
        console.error('Auth init failed:', error);
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await api.login(email, password);
    localStorage.setItem('token', user.token);
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout]
  );

  // Mostrar loading mientras se inicializa
  if (state.isLoading) {
    return <LoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

Ver `references/provider-patterns.md` para más patrones de composición de providers.
Ver `references/optimization-strategies.md` para técnicas avanzadas de optimización.
Ver `references/testing-contexts.md` para testing completo de contexts y providers.

## Resumen de Best Practices

| Pattern | Cuándo Usar | Beneficio |
|---------|-------------|-----------|
| Context Simple | Estado global simple (theme, locale) | Fácil setup, type-safe |
| Context + Reducer | Estado complejo con múltiples acciones | Lógica centralizada, testeable |
| Split Contexts | Diferentes dominios de estado | Evita re-renders innecesarios |
| State/Dispatch Separation | Estado que cambia frecuentemente | Componentes dispatch no re-renderizan |
| useMemo Value | Context value se recrea en cada render | Previene re-renders innecesarios |
| Custom Hooks | Lógica de context reutilizable | Encapsulación, DRY |
| Selectors | Valores derivados del estado | Solo re-render cuando valor derivado cambia |

## Reglas de Oro

1. **Type Safety Primero** - Siempre definir tipos para Context, nunca usar `any`
2. **Error Boundaries** - Throw error si context se usa fuera del Provider
3. **Custom Hooks** - Encapsular `useContext` en custom hooks (`useAuth`, `useTheme`)
4. **Memoizar Value** - Usar `useMemo` para context value para evitar re-creates
5. **Split por Dominio** - Separar contexts por responsabilidad (Auth, Theme, Cart)
6. **State/Dispatch Separation** - Separar state y dispatch para optimizar re-renders
7. **Lazy Initialization** - Usar función en `useState` para cálculos costosos (localStorage)
8. **No Sobre-Optimizar** - Medir antes de optimizar, no todos los contexts necesitan memoización
