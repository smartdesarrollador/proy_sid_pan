---
name: react-api-authentication
description: >
  Guía completa de autenticación en React con TypeScript, JWT, protected routes y session management.
  Usar cuando se necesite: login/logout flow, JWT tokens, refresh tokens, protected routes, AuthContext,
  axios interceptors, role-based access, persistent authentication, integración con TanStack Query.
  Incluye seguridad, mejores prácticas y patrones de producción con tipos seguros.
---

# React API Authentication - JWT, Protected Routes & Session Management

Guía completa para implementar autenticación robusta en React con TypeScript, JWT tokens, refresh tokens y control de acceso basado en roles.

## ¿Qué Implementaremos?

Sistema completo de autenticación que incluye:
- ✅ **JWT Authentication**: Login/logout con tokens seguros
- ✅ **AuthContext**: Estado global de autenticación
- ✅ **Protected Routes**: Rutas que requieren autenticación
- ✅ **Refresh Tokens**: Renovación automática de sesión
- ✅ **Axios Interceptors**: Headers automáticos, retry en 401
- ✅ **Role-Based Access**: Control de acceso por roles
- ✅ **Persistent Sessions**: Auto-login al recargar
- ✅ **TanStack Query Integration**: Queries autenticadas

## JWT Basics - Almacenamiento Seguro

### ¿Qué es JWT?

JWT (JSON Web Token) es un estándar para transmitir información de forma segura entre cliente y servidor.

**Estructura:**
```
header.payload.signature
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Decoded Payload:**
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Almacenamiento de Tokens

| Opción | Seguridad | Pros | Contras | Recomendación |
|--------|-----------|------|---------|---------------|
| **localStorage** | ⚠️ Baja | Simple, persistente | Vulnerable a XSS | ❌ No recomendado |
| **sessionStorage** | ⚠️ Baja | Se limpia al cerrar | Vulnerable a XSS | ❌ No recomendado |
| **httpOnly Cookie** | ✅ Alta | Protegido contra XSS | Requiere backend config | ✅ **Recomendado** |
| **Memory (state)** | ✅ Alta | Muy seguro | Se pierde al recargar | ⚠️ Usar con refresh |

**Mejor práctica:** httpOnly cookies para production, localStorage solo para desarrollo/prototipo.

## AuthContext - Estado Global de Autenticación

### Tipos TypeScript

```tsx
// src/types/auth.types.ts
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'editor';
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUser: (user: User) => void;
}
```

### AuthContext Implementation

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthContextType, User, LoginCredentials, RegisterCredentials } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación al montar (persistent session)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Verificar token con backend
          const user = await verifyToken(token);
          setUser(user);
          setAccessToken(token);
        } catch (error) {
          // Token inválido o expirado
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);

      // Opcional: Guardar refresh token
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Opcional: Llamar endpoint de logout en backend
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
  };

  const register = async (credentials: RegisterCredentials) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Setup en App

```tsx
// src/main.tsx o src/App.tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

## Login/Logout Flow

### Login Component

```tsx
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full px-4 py-2 border rounded"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-4 py-2 border rounded"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### Logout Button

```tsx
// src/components/LogoutButton.tsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded"
    >
      Logout
    </button>
  );
}
```

## Axios Interceptors - Auto Headers & Token Refresh

### Axios Instance con Interceptors

```tsx
// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Manejar errores y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post('/api/auth/refresh', {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Guardar nuevo access token
        localStorage.setItem('accessToken', accessToken);

        // Reintentar request original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Uso de Axios Instance

```tsx
// src/services/userService.ts
import api from '../api/axios';
import type { User } from '../types/auth.types';

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
};
```

## Protected Routes

### ProtectedRoute Component

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user' | 'editor';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // No autenticado: redirect a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol si es requerido
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### Uso con React Router

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Role-Based Access Control (RBAC)

### usePermissions Hook

```tsx
// src/hooks/usePermissions.ts
import { useAuth } from '../contexts/AuthContext';

type Permission = 'create_user' | 'edit_user' | 'delete_user' | 'view_admin';

const rolePermissions: Record<string, Permission[]> = {
  admin: ['create_user', 'edit_user', 'delete_user', 'view_admin'],
  editor: ['edit_user'],
  user: [],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((perm) => hasPermission(perm));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((perm) => hasPermission(perm));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
```

### Conditional Rendering

```tsx
// src/components/Dashboard.tsx
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export default function Dashboard() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>

      {/* Mostrar solo si tiene permiso */}
      {hasPermission('create_user') && (
        <button>Create New User</button>
      )}

      {hasPermission('view_admin') && (
        <div>
          <h2>Admin Panel</h2>
          {/* Admin content */}
        </div>
      )}
    </div>
  );
}
```

## TanStack Query Integration

### Authenticated Queries

```tsx
// src/hooks/useAuthenticatedQuery.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

export function useAuthenticatedQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  const { isAuthenticated } = useAuth();

  return useQuery<TData, TError>({
    ...options,
    enabled: isAuthenticated && (options.enabled ?? true),
  });
}
```

### Example Usage

```tsx
// src/hooks/useProfile.ts
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { userService } from '../services/userService';

export const useProfile = () => {
  return useAuthenticatedQuery({
    queryKey: ['user', 'profile'],
    queryFn: userService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
```

### Logout Invalidation

```tsx
// src/contexts/AuthContext.tsx (actualizado)
import { useQueryClient } from '@tanstack/react-query';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Limpiar todas las queries al hacer logout
    queryClient.clear();
  };

  // ...resto del código
};
```

## Persistent Authentication Flow

```
1. App Load → Check localStorage for accessToken
             ↓
2. Token exists? → Verify with backend (/api/auth/verify)
             ↓                          ↓
3. Valid → Set user state       Invalid → Remove token, redirect login
             ↓
4. User logged in → Access protected routes
```

## Mejores Prácticas de Seguridad

1. ✅ **NUNCA guardar passwords** en estado o localStorage
2. ✅ **Usar HTTPS** en producción (obligatorio para tokens)
3. ✅ **httpOnly cookies** para tokens (si backend lo soporta)
4. ✅ **Short-lived access tokens** (5-15 min) + refresh tokens
5. ✅ **Logout en inactividad** (opcional, implementar con timer)
6. ✅ **Validar tokens** en backend en cada request
7. ✅ **Sanitizar inputs** antes de enviar credentials
8. ✅ **Rate limiting** en login endpoint (backend)

## Referencias Adicionales

Para contenido detallado y ejemplos avanzados, consulta:

- **[JWT Security](references/jwt-security.md)** - Almacenamiento seguro, XSS/CSRF protection
- **[Auth Context Advanced](references/auth-context-advanced.md)** - Reducers, multiple providers
- **[Refresh Token Pattern](references/refresh-token.md)** - Implementación completa de refresh
- **[Protected Routes Advanced](references/protected-routes.md)** - HOC, nested routes, redirects
- **[RBAC Implementation](references/rbac-implementation.md)** - Permissions, roles dinámicos
- **[TanStack Query Auth](references/tanstack-query-auth.md)** - Mutations autenticadas, optimistic updates

## Quick Start Template

```bash
# Instalar dependencias
npm install axios @tanstack/react-query react-router-dom

# Estructura de archivos
src/
├── api/
│   └── axios.ts              # Axios instance con interceptors
├── contexts/
│   └── AuthContext.tsx       # AuthProvider y useAuth hook
├── types/
│   └── auth.types.ts         # Tipos TypeScript
├── hooks/
│   ├── usePermissions.ts     # RBAC hook
│   └── useAuthenticatedQuery.ts
├── components/
│   └── ProtectedRoute.tsx    # Route guard
├── pages/
│   ├── LoginPage.tsx
│   └── Dashboard.tsx
└── services/
    └── userService.ts        # API calls
```

---

**Resumen:** Implementación completa de autenticación JWT con React + TypeScript, incluyendo login, logout, protected routes, refresh tokens, RBAC y integración con TanStack Query. Production-ready con seguridad y mejores prácticas.
