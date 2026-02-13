# Provider Patterns - Patrones Avanzados de Composición

Guía de patrones avanzados para composición de providers, HOCs, factories y multi-tenancy.

## 1. Provider Composer Utility - Versión Avanzada

### Composer con Props Forwarding

```tsx
type ProviderWithProps<P = any> = React.ComponentType<P & { children: ReactNode }>;

interface ProviderConfig {
  provider: ProviderWithProps;
  props?: Record<string, any>;
}

interface ComposeProvidersProps {
  providers: (ProviderWithProps | ProviderConfig)[];
  children: ReactNode;
}

export const ComposeProviders = ({ providers, children }: ComposeProvidersProps) => {
  return (
    <>
      {providers.reduceRight((acc, config) => {
        // Si es un provider simple
        if (typeof config === 'function') {
          const Provider = config;
          return <Provider>{acc}</Provider>;
        }

        // Si es un provider con props
        const { provider: Provider, props = {} } = config;
        return <Provider {...props}>{acc}</Provider>;
      }, children)}
    </>
  );
};

// Uso con props
const App = () => {
  return (
    <ComposeProviders
      providers={[
        AuthProvider,
        { provider: ThemeProvider, props: { defaultTheme: 'dark' } },
        { provider: I18nProvider, props: { locale: 'es', fallback: 'en' } },
        NotificationProvider,
      ]}
    >
      <AppContent />
    </ComposeProviders>
  );
};
```

## 2. Provider Factory Pattern

### Factory para Crear Providers Reutilizables

```tsx
// Factory genérico para crear providers
export const createContextProvider = <T,>(options: {
  name: string;
  initialState: T;
  reducer?: (state: T, action: any) => T;
  actions?: (dispatch: React.Dispatch<any>) => Record<string, (...args: any[]) => void>;
}) => {
  const { name, initialState, reducer, actions } = options;

  const Context = createContext<
    | {
        state: T;
        dispatch?: React.Dispatch<any>;
        actions?: Record<string, (...args: any[]) => void>;
      }
    | undefined
  >(undefined);

  const Provider = ({ children }: { children: ReactNode }) => {
    let state: T;
    let dispatch: React.Dispatch<any> | undefined;

    if (reducer) {
      [state, dispatch] = useReducer(reducer, initialState);
    } else {
      [state] = useState(initialState);
    }

    const contextActions = dispatch && actions ? actions(dispatch) : undefined;

    const value = useMemo(
      () => ({
        state,
        dispatch,
        actions: contextActions,
      }),
      [state, dispatch, contextActions]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useContextHook = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${name} must be used within ${name}Provider`);
    }
    return context;
  };

  return { Provider, useContext: useContextHook, Context };
};

// Uso del factory
interface CounterState {
  count: number;
}

type CounterAction = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'RESET' };

const counterReducer = (state: CounterState, action: CounterAction): CounterState => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
};

const counterActions = (dispatch: React.Dispatch<CounterAction>) => ({
  increment: () => dispatch({ type: 'INCREMENT' }),
  decrement: () => dispatch({ type: 'DECREMENT' }),
  reset: () => dispatch({ type: 'RESET' }),
});

const {
  Provider: CounterProvider,
  useContext: useCounter,
} = createContextProvider<CounterState>({
  name: 'Counter',
  initialState: { count: 0 },
  reducer: counterReducer,
  actions: counterActions,
});

// Uso en componente
const CounterDisplay = () => {
  const { state, actions } = useCounter();

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={actions?.increment}>+</button>
      <button onClick={actions?.decrement}>-</button>
      <button onClick={actions?.reset}>Reset</button>
    </div>
  );
};
```

## 3. Conditional Providers

### Providers que se Montan Condicionalmente

```tsx
interface ConditionalProviderProps {
  condition: boolean;
  Provider: React.ComponentType<{ children: ReactNode }>;
  fallback?: ReactNode;
  children: ReactNode;
}

export const ConditionalProvider = ({
  condition,
  Provider,
  fallback,
  children,
}: ConditionalProviderProps) => {
  if (!condition) {
    return <>{fallback || children}</>;
  }

  return <Provider>{children}</Provider>;
};

// Uso: Solo montar AuthProvider si hay token
const App = () => {
  const hasToken = Boolean(localStorage.getItem('token'));

  return (
    <ConditionalProvider
      condition={hasToken}
      Provider={AuthProvider}
      fallback={<LoginPage />}
    >
      <Dashboard />
    </ConditionalProvider>
  );
};
```

### Feature Flag Provider

```tsx
interface FeatureFlagProviderProps {
  features: Record<string, boolean>;
  children: ReactNode;
}

interface FeatureFlagContextType {
  isEnabled: (feature: string) => boolean;
  features: Record<string, boolean>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider = ({ features, children }: FeatureFlagProviderProps) => {
  const isEnabled = useCallback(
    (feature: string): boolean => {
      return features[feature] ?? false;
    },
    [features]
  );

  const value = useMemo(() => ({ isEnabled, features }), [isEnabled, features]);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export const useFeatureFlag = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  return context;
};

// Uso con conditional provider
const App = () => {
  const { isEnabled } = useFeatureFlag();

  return (
    <ConditionalProvider
      condition={isEnabled('new-dashboard')}
      Provider={NewDashboardProvider}
      fallback={<OldDashboard />}
    >
      <NewDashboard />
    </ConditionalProvider>
  );
};
```

## 4. Nested Context Pattern - Context Hierarchy

### Parent-Child Context Relationship

```tsx
// Parent context
interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);

  const value = useMemo(
    () => ({ organization, setOrganization }),
    [organization]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error('useOrganization must be used within OrganizationProvider');
  return context;
};

// Child context que depende del parent
interface TeamContextType {
  team: Team | null;
  setTeam: (team: Team) => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const { organization } = useOrganization(); // Depende del parent context
  const [team, setTeam] = useState<Team | null>(null);

  // Reset team cuando cambia organization
  useEffect(() => {
    if (!organization) {
      setTeam(null);
    }
  }, [organization]);

  const value = useMemo(() => ({ team, setTeam }), [team]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeam must be used within TeamProvider');
  return context;
};

// Uso: Hierarchy required
const App = () => {
  return (
    <OrganizationProvider>
      <TeamProvider>
        <UserProvider>
          <Dashboard />
        </UserProvider>
      </TeamProvider>
    </OrganizationProvider>
  );
};
```

## 5. Multi-Tenant Providers

### Tenant-Scoped Context

```tsx
interface Tenant {
  id: string;
  name: string;
  settings: Record<string, any>;
}

interface TenantContextType {
  tenant: Tenant | null;
  switchTenant: (tenantId: string) => Promise<void>;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const switchTenant = useCallback(async (tenantId: string) => {
    setIsLoading(true);
    try {
      const tenantData = await api.getTenant(tenantId);
      setTenant(tenantData);
      localStorage.setItem('currentTenantId', tenantId);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load tenant on mount
  useEffect(() => {
    const tenantId = localStorage.getItem('currentTenantId');
    if (tenantId) {
      switchTenant(tenantId);
    }
  }, [switchTenant]);

  const value = useMemo(
    () => ({ tenant, switchTenant, isLoading }),
    [tenant, switchTenant, isLoading]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};

// Tenant-specific data provider
interface TenantDataProviderProps {
  children: ReactNode;
}

export const TenantDataProvider = ({ children }: TenantDataProviderProps) => {
  const { tenant, isLoading } = useTenant();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (tenant) {
      // Fetch tenant-specific data
      api.getTenantData(tenant.id).then(setData);
    } else {
      setData(null);
    }
  }, [tenant]);

  if (isLoading || !tenant) {
    return <LoadingScreen />;
  }

  return <TenantDataContext.Provider value={data}>{children}</TenantDataContext.Provider>;
};
```

## 6. HOC Pattern vs Hooks

### HOC para Context (Legacy)

```tsx
// ❌ Old pattern: HOC (menos type-safe, más verbose)
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
};

// Uso
const ProfilePage = withAuth(({ auth }: { auth: AuthContextType }) => {
  return <div>{auth.user?.name}</div>;
});

// ✅ Modern pattern: Custom hooks (más limpio, type-safe)
export const useRequireAuth = () => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      // Redirect to login
      window.location.href = '/login';
    }
  }, [auth.isAuthenticated]);

  return auth;
};

// Uso más limpio
const ProfilePage = () => {
  const auth = useRequireAuth();
  return <div>{auth.user?.name}</div>;
};
```

## 7. Provider with Portal Pattern

### Modal Provider con Portal

```tsx
import { createPortal } from 'react-dom';

interface Modal {
  id: string;
  content: ReactNode;
  onClose: () => void;
}

interface ModalContextType {
  openModal: (content: ReactNode) => string;
  closeModal: (id: string) => void;
  closeAll: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modals, setModals] = useState<Modal[]>([]);

  const openModal = useCallback((content: ReactNode): string => {
    const id = crypto.randomUUID();

    const closeHandler = () => {
      setModals((prev) => prev.filter((m) => m.id !== id));
    };

    setModals((prev) => [...prev, { id, content, onClose: closeHandler }]);
    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
  }, []);

  const value = useMemo(
    () => ({ openModal, closeModal, closeAll }),
    [openModal, closeModal, closeAll]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {createPortal(
        <>
          {modals.map((modal) => (
            <div key={modal.id} className="modal-overlay">
              <div className="modal-content">
                {modal.content}
                <button onClick={modal.onClose}>Close</button>
              </div>
            </div>
          ))}
        </>,
        document.body
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};

// Uso
const MyComponent = () => {
  const { openModal } = useModal();

  const handleOpen = () => {
    openModal(
      <div>
        <h2>Modal Title</h2>
        <p>Modal content here</p>
      </div>
    );
  };

  return <button onClick={handleOpen}>Open Modal</button>;
};
```

## 8. Provider with Subscription Pattern

### Context con Event Subscriptions

```tsx
type EventCallback<T = any> = (data: T) => void;

interface EventBusContextType {
  subscribe: <T = any>(event: string, callback: EventCallback<T>) => () => void;
  publish: <T = any>(event: string, data: T) => void;
  unsubscribe: (event: string, callback: EventCallback) => void;
}

const EventBusContext = createContext<EventBusContextType | undefined>(undefined);

export const EventBusProvider = ({ children }: { children: ReactNode }) => {
  const subscribers = useRef<Map<string, Set<EventCallback>>>(new Map());

  const subscribe = useCallback(<T = any>(event: string, callback: EventCallback<T>) => {
    if (!subscribers.current.has(event)) {
      subscribers.current.set(event, new Set());
    }

    subscribers.current.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.current.get(event)?.delete(callback);
    };
  }, []);

  const publish = useCallback(<T = any>(event: string, data: T) => {
    const callbacks = subscribers.current.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }, []);

  const unsubscribe = useCallback((event: string, callback: EventCallback) => {
    subscribers.current.get(event)?.delete(callback);
  }, []);

  const value = useMemo(
    () => ({ subscribe, publish, unsubscribe }),
    [subscribe, publish, unsubscribe]
  );

  return <EventBusContext.Provider value={value}>{children}</EventBusContext.Provider>;
};

export const useEventBus = () => {
  const context = useContext(EventBusContext);
  if (!context) throw new Error('useEventBus must be used within EventBusProvider');
  return context;
};

// Custom hook para subscriptions
export const useEventSubscription = <T = any>(
  event: string,
  callback: EventCallback<T>
) => {
  const { subscribe } = useEventBus();

  useEffect(() => {
    const unsubscribe = subscribe(event, callback);
    return unsubscribe;
  }, [event, callback, subscribe]);
};

// Uso
const NotificationListener = () => {
  useEventSubscription('notification', (data: { message: string; type: string }) => {
    console.log('Notification received:', data);
  });

  return null;
};

const SendNotificationButton = () => {
  const { publish } = useEventBus();

  return (
    <button
      onClick={() =>
        publish('notification', { message: 'Hello!', type: 'success' })
      }
    >
      Send Notification
    </button>
  );
};
```

## Best Practices

1. **Composition over Nesting**: Usar `ComposeProviders` para evitar provider hell
2. **Props Forwarding**: Permitir pasar props a providers cuando sea necesario
3. **Conditional Mounting**: Solo montar providers cuando sean necesarios
4. **Factory Pattern**: Crear factories para providers reutilizables
5. **Tenant Isolation**: Aislar datos por tenant en aplicaciones multi-tenant
6. **Portal Pattern**: Usar portals para modals, toasts, y overlays
7. **Event Bus**: Implementar pub/sub pattern para eventos cross-component
8. **Hierarchy**: Establecer jerarquías claras (Org → Team → User)
