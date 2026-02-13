# Testing Contexts - Guía Completa de Testing

Guía completa de testing para React Context con @testing-library/react, mock providers, custom hooks y performance testing.

## 1. Setup de Testing

### Configuración Base

```bash
# Instalar dependencias
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
```

```tsx
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});

// src/test/setup.ts
import '@testing-library/jest-dom';
```

## 2. Testing de Providers

### Test Básico de Provider

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

interface User {
  id: number;
  name: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};

// Test component
const UserDisplay = () => {
  const { user } = useUser();
  return <div>{user ? user.name : 'No user'}</div>;
};

describe('UserProvider', () => {
  it('should provide user context to children', () => {
    render(
      <UserProvider>
        <UserDisplay />
      </UserProvider>
    );

    expect(screen.getByText('No user')).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    // Mock console.error para no ensuciar output
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<UserDisplay />);
    }).toThrow('useUser must be used within UserProvider');

    consoleError.mockRestore();
  });
});
```

### Testing de Updates

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const UserUpdater = () => {
  const { user, setUser } = useUser();

  return (
    <div>
      <p data-testid="user-name">{user?.name || 'No user'}</p>
      <button onClick={() => setUser({ id: 1, name: 'John Doe' })}>
        Set User
      </button>
    </div>
  );
};

describe('UserProvider updates', () => {
  it('should update user when setUser is called', async () => {
    const user = userEvent.setup();

    render(
      <UserProvider>
        <UserUpdater />
      </UserProvider>
    );

    expect(screen.getByTestId('user-name')).toHaveTextContent('No user');

    await user.click(screen.getByText('Set User'));

    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
  });
});
```

## 3. Testing de Custom Hooks con Context

### Testing de Hook con renderHook

```tsx
describe('useUser hook', () => {
  it('should return user context', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toBeNull();
  });

  it('should update user', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.setUser({ id: 1, name: 'Jane Doe' });
    });

    expect(result.current.user).toEqual({ id: 1, name: 'Jane Doe' });
  });
});
```

### Testing de Hook Complejo con Reducer

```tsx
interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'CLEAR' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const newItems = [...state.items, action.payload];
      const total = newItems.reduce((sum, item) => sum + item.price, 0);
      return { items: newItems, total };

    case 'REMOVE_ITEM':
      const filtered = state.items.filter((item) => item.id !== action.payload);
      const newTotal = filtered.reduce((sum, item) => sum + item.price, 0);
      return { items: filtered, total: newTotal };

    case 'CLEAR':
      return { items: [], total: 0 };

    default:
      return state;
  }
};

const CartContext = createContext<
  { state: CartState; dispatch: React.Dispatch<CartAction> } | undefined
>(undefined);

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>;
};

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

describe('CartProvider with reducer', () => {
  it('should add item to cart', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { id: 1, name: 'Product 1', price: 10 },
      });
    });

    expect(result.current.state.items).toHaveLength(1);
    expect(result.current.state.total).toBe(10);
  });

  it('should remove item from cart', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { id: 1, name: 'Product 1', price: 10 },
      });
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { id: 2, name: 'Product 2', price: 20 },
      });
    });

    expect(result.current.state.items).toHaveLength(2);

    act(() => {
      result.current.dispatch({ type: 'REMOVE_ITEM', payload: 1 });
    });

    expect(result.current.state.items).toHaveLength(1);
    expect(result.current.state.total).toBe(20);
  });

  it('should clear cart', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { id: 1, name: 'Product 1', price: 10 },
      });
    });

    expect(result.current.state.items).toHaveLength(1);

    act(() => {
      result.current.dispatch({ type: 'CLEAR' });
    });

    expect(result.current.state.items).toHaveLength(0);
    expect(result.current.state.total).toBe(0);
  });
});
```

## 4. Mock Providers para Tests

### Mock Provider Simple

```tsx
// Mock provider para testing
interface MockUserProviderProps {
  user?: User | null;
  children: ReactNode;
}

export const MockUserProvider = ({ user = null, children }: MockUserProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  return (
    <UserContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Uso en tests
describe('UserProfile component', () => {
  it('should display user name', () => {
    const mockUser = { id: 1, name: 'Test User' };

    render(
      <MockUserProvider user={mockUser}>
        <UserProfile />
      </MockUserProvider>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should display login prompt when no user', () => {
    render(
      <MockUserProvider user={null}>
        <UserProfile />
      </MockUserProvider>
    );

    expect(screen.getByText('Please login')).toBeInTheDocument();
  });
});
```

### Mock Provider con Spy Functions

```tsx
import { vi } from 'vitest';

interface MockAuthProviderProps {
  user?: User | null;
  login?: (email: string, password: string) => Promise<void>;
  logout?: () => void;
  children: ReactNode;
}

export const MockAuthProvider = ({
  user = null,
  login = vi.fn(),
  logout = vi.fn(),
  children,
}: MockAuthProviderProps) => {
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Uso en tests
describe('LoginForm', () => {
  it('should call login function on submit', async () => {
    const mockLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <MockAuthProvider login={mockLogin}>
        <LoginForm />
      </MockAuthProvider>
    );

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Login'));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

### Test Helper para Múltiples Providers

```tsx
// test-utils.tsx
import { render as rtlRender, RenderOptions } from '@testing-library/react';

interface AllProvidersProps {
  children: ReactNode;
  user?: User | null;
  theme?: 'light' | 'dark';
}

const AllProviders = ({ children, user = null, theme = 'light' }: AllProvidersProps) => {
  return (
    <MockAuthProvider user={user}>
      <MockThemeProvider theme={theme}>
        <MockNotificationProvider>{children}</MockNotificationProvider>
      </MockThemeProvider>
    </MockAuthProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  theme?: 'light' | 'dark';
}

export const render = (ui: React.ReactElement, options?: CustomRenderOptions) => {
  const { user, theme, ...renderOptions } = options || {};

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllProviders user={user} theme={theme}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';

// Uso en tests
import { render, screen } from './test-utils';

describe('Dashboard', () => {
  it('should render dashboard for logged in user', () => {
    const mockUser = { id: 1, name: 'Test User' };

    render(<Dashboard />, { user: mockUser, theme: 'dark' });

    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
  });
});
```

## 5. Integration Tests con Múltiples Contexts

### Testing de Interacción entre Contexts

```tsx
describe('Multi-context integration', () => {
  it('should sync user data across contexts', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <UserProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </UserProvider>
      </AuthProvider>
    );

    // Login
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByText('Login'));

    // Verificar que user está en AuthContext
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });

    // Verificar que settings cargaron para el user
    await waitFor(() => {
      expect(screen.getByText('Theme: dark')).toBeInTheDocument();
    });
  });
});
```

## 6. Testing de Performance y Re-renders

### Testing de Re-renders Innecesarios

```tsx
import { renderHook } from '@testing-library/react';

describe('Context re-render optimization', () => {
  it('should not re-render when unrelated state changes', () => {
    const renderSpy = vi.fn();

    const TestComponent = () => {
      renderSpy();
      const { user } = useUser(); // Solo depende de user
      return <div>{user?.name}</div>;
    };

    const { rerender } = render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Cambiar estado no relacionado (settings)
    act(() => {
      // Trigger settings update (no debería re-render TestComponent)
    });

    rerender(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // TestComponent NO debería re-renderizar
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
```

### Performance Testing

```tsx
import { performance } from 'perf_hooks';

describe('Context performance', () => {
  it('should render within performance budget', () => {
    const startTime = performance.now();

    render(
      <AppProvider>
        <LargeComponentTree />
      </AppProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Render debe ser < 16ms (60fps)
    expect(renderTime).toBeLessThan(16);
  });

  it('should handle 1000 updates efficiently', () => {
    const { result } = renderHook(() => useCounter(), {
      wrapper: CounterProvider,
    });

    const startTime = performance.now();

    act(() => {
      for (let i = 0; i < 1000; i++) {
        result.current.increment();
      }
    });

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // 1000 updates deben ser < 100ms
    expect(updateTime).toBeLessThan(100);
    expect(result.current.count).toBe(1000);
  });
});
```

## 7. Snapshot Testing

### Snapshot de Context State

```tsx
describe('CartProvider snapshots', () => {
  it('should match snapshot with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.state).toMatchSnapshot();
  });

  it('should match snapshot with items in cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    act(() => {
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { id: 1, name: 'Product 1', price: 10 },
      });
      result.current.dispatch({
        type: 'ADD_ITEM',
        payload: { id: 2, name: 'Product 2', price: 20 },
      });
    });

    expect(result.current.state).toMatchSnapshot();
  });
});
```

## 8. Testing de Async Initialization

### Testing de Context con Async Load

```tsx
describe('AuthProvider async initialization', () => {
  it('should show loading state initially', () => {
    render(
      <AuthProvider>
        <div>Content</div>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load user from token', async () => {
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-token');

    // Mock API call
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ id: 1, name: 'Test User' }),
    });

    render(
      <AuthProvider>
        <UserDisplay />
      </AuthProvider>
    );

    // Wait for async initialization
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should handle initialization error', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-token');

    global.fetch = vi.fn().mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <UserDisplay />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });
  });
});
```

## 9. Testing de LocalStorage Persistence

### Testing de Persistencia

```tsx
describe('Settings persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load settings from localStorage', () => {
    const savedSettings = { theme: 'dark', language: 'es' };
    localStorage.setItem('settings', JSON.stringify(savedSettings));

    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    expect(result.current.settings).toEqual(savedSettings);
  });

  it('should save settings to localStorage', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    act(() => {
      result.current.updateSettings({ theme: 'dark' });
    });

    const saved = localStorage.getItem('settings');
    expect(JSON.parse(saved!)).toMatchObject({ theme: 'dark' });
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage error
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useSettings(), { wrapper: SettingsProvider });

    // Should fall back to default settings
    expect(result.current.settings).toEqual(defaultSettings);

    consoleError.mockRestore();
  });
});
```

## Best Practices

1. **Use Mock Providers** - Crear mock providers para facilitar testing
2. **Test Error Boundaries** - Verificar que errors se manejan correctamente
3. **Test Async Operations** - Usar waitFor para async initialization
4. **Test Persistence** - Verificar que localStorage funciona correctamente
5. **Test Performance** - Medir render times y updates
6. **Test Integration** - Verificar interacción entre múltiples contexts
7. **Snapshot Testing** - Usar snapshots para state complejo
8. **Mock External Dependencies** - Mock API calls, localStorage, etc.
9. **Test Re-renders** - Verificar que optimizaciones funcionan
10. **Custom Test Utils** - Crear helpers para setup común de tests
