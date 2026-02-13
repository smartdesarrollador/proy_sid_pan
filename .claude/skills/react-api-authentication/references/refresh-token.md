# Refresh Token Pattern - Auto Token Renewal

Implementación completa de refresh tokens para mantener sesiones activas sin interrupción del usuario.

## ¿Qué son los Refresh Tokens?

**Problema:** Access tokens de corta duración (5-15min) expiran rápido, obligando al usuario a re-loguearse constantemente.

**Solución:** Usar dos tipos de tokens:
- **Access Token:** Corta duración (15min), se envía en cada request
- **Refresh Token:** Larga duración (7 días), se usa solo para renovar access token

## Flow Completo

```
1. Login → Backend retorna { accessToken, refreshToken }
              ↓
2. Frontend guarda ambos tokens (localStorage o cookies)
              ↓
3. Requests usan accessToken en Authorization header
              ↓
4. Access token expira (401 response)
              ↓
5. Frontend usa refreshToken para obtener nuevo accessToken
              ↓
6. Retry request original con nuevo accessToken
              ↓
7. Si refresh token expira → Logout y redirect a login
```

## Backend Implementation (Referencia)

### Generate Tokens

```ts
// Backend - Express + JWT example
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m', // 15 minutos
  });
};

const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d', // 7 días
  });
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validar credentials
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.validatePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Opcional: Guardar refresh token en DB para poder invalidarlo
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

// Refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

    // Opcional: Verificar si el token está en la DB y no ha sido revocado
    const tokenRecord = await RefreshToken.findOne({
      where: { token: refreshToken, userId: decoded.userId },
    });

    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generar nuevo access token
    const payload: TokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const newAccessToken = generateAccessToken(payload);

    // Opcional: Rotar refresh token (generar nuevo)
    const newRefreshToken = generateRefreshToken(payload);

    await RefreshToken.update(
      { token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { where: { id: tokenRecord.id } }
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});
```

## Frontend Implementation

### Axios Interceptor con Refresh Token

```tsx
// src/api/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Agregar access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Manejar 401 y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si NO es 401, rechazar error inmediatamente
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Si ya intentamos refresh, rechazar
    if (originalRequest._retry) {
      // Logout user y redirect a login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Si ya estamos refreshing, agregar request a la cola
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Marcar request como retry
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      processQueue(new Error('No refresh token'), null);
      isRefreshing = false;
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Llamar endpoint de refresh
      const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Guardar nuevos tokens
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // Procesar cola de requests pendientes
      processQueue(null, accessToken);

      // Reintentar request original
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout
      processQueue(refreshError, null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
```

### AuthContext con Refresh Token

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al montar
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('Failed to refresh token on mount:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;

      localStorage.setItem('accessToken', accessToken);

      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;

      setUser(userData);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Opcional: Llamar endpoint de logout en backend
    api.post('/auth/logout').catch(console.error);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Token Rotation Strategy

### Refresh Token Rotation (Best Practice)

```tsx
// Backend - Rotar refresh token en cada uso
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.body;

  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

    // Verificar que el token no haya sido usado ya (rotation)
    const tokenRecord = await RefreshToken.findOne({
      where: { token: oldRefreshToken, used: false },
    });

    if (!tokenRecord) {
      // Token ya fue usado o revocado → posible ataque
      // Revocar todos los tokens del usuario
      await RefreshToken.update(
        { used: true },
        { where: { userId: decoded.userId } }
      );

      return res.status(401).json({ message: 'Token reuse detected' });
    }

    // Marcar token viejo como usado
    await RefreshToken.update({ used: true }, { where: { id: tokenRecord.id } });

    // Generar NUEVOS tokens
    const newAccessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);

    // Guardar nuevo refresh token
    await RefreshToken.create({
      userId: decoded.userId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      used: false,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});
```

**Beneficios de Rotation:**
- ✅ Previene reuso de tokens robados
- ✅ Detecta tokens comprometidos
- ✅ Limita ventana de ataque
- ✅ Permite revocación automática en caso de ataque

## Proactive Token Refresh

### Refresh Antes de Expiración

```tsx
// src/hooks/useTokenRefresh.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { decodeJWT } from '../utils/jwt';

export const useTokenRefresh = () => {
  const { refreshAccessToken } = useAuth();
  const refreshTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const scheduleTokenRefresh = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const decoded = decodeJWT(accessToken);
      if (!decoded) return;

      const expiresAt = decoded.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Refresh 5 minutos ANTES de expirar
      const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

      if (refreshTime > 0) {
        refreshTimerRef.current = setTimeout(async () => {
          try {
            await refreshAccessToken();
            scheduleTokenRefresh(); // Re-schedule después de refresh
          } catch (error) {
            console.error('Failed to refresh token:', error);
          }
        }, refreshTime);
      }
    };

    scheduleTokenRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshAccessToken]);
};

// Uso en App
function App() {
  useTokenRefresh(); // Auto-refresh tokens proactivamente

  return <Routes>...</Routes>;
}
```

## Silent Refresh Pattern

### Refresh sin Interrupción

```tsx
// src/api/axios.ts
// Interceptor que hace refresh silencioso sin afectar UX

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Si ya hay un refresh en progreso, esperar a que termine
      if (refreshPromise) {
        try {
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Iniciar nuevo refresh
      refreshPromise = (async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const response = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          return accessToken;
        } finally {
          refreshPromise = null; // Limpiar promise
        }
      })();

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Error Handling

### Manejar Refresh Failures

```tsx
// src/components/RefreshErrorBoundary.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function RefreshErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasRefreshError, setHasRefreshError] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const handleRefreshError = (event: CustomEvent) => {
      console.error('Refresh token error:', event.detail);
      setHasRefreshError(true);

      // Auto-logout después de 3 segundos
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 3000);
    };

    window.addEventListener('auth:refresh-error', handleRefreshError as EventListener);

    return () => {
      window.removeEventListener('auth:refresh-error', handleRefreshError as EventListener);
    };
  }, [logout]);

  if (hasRefreshError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Session Expired</h1>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Disparar evento en axios interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ... refresh logic ...

    if (refreshFailed) {
      window.dispatchEvent(
        new CustomEvent('auth:refresh-error', {
          detail: { error: 'Refresh token expired' },
        })
      );
    }

    return Promise.reject(error);
  }
);
```

## Testing Refresh Token

```tsx
// src/api/__tests__/axios.test.ts
import { describe, it, expect, vi } from 'vitest';
import api from '../axios';
import MockAdapter from 'axios-mock-adapter';

describe('Axios Refresh Token Interceptor', () => {
  const mock = new MockAdapter(api);

  it('should refresh token and retry request on 401', async () => {
    const refreshToken = 'valid-refresh-token';
    const newAccessToken = 'new-access-token';

    localStorage.setItem('refreshToken', refreshToken);

    // Mock 401 response
    mock.onGet('/protected').replyOnce(401);

    // Mock refresh endpoint
    mock.onPost('/auth/refresh').reply(200, {
      accessToken: newAccessToken,
    });

    // Mock retry con nuevo token
    mock.onGet('/protected').reply(200, { data: 'success' });

    const response = await api.get('/protected');

    expect(response.data).toEqual({ data: 'success' });
    expect(localStorage.getItem('accessToken')).toBe(newAccessToken);
  });

  it('should logout on refresh failure', async () => {
    localStorage.setItem('refreshToken', 'invalid-token');

    mock.onGet('/protected').reply(401);
    mock.onPost('/auth/refresh').reply(401);

    await expect(api.get('/protected')).rejects.toThrow();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
```

## Mejores Prácticas

1. ✅ **Access token corto (5-15min), refresh token largo (7 días)**
2. ✅ **Rotar refresh tokens** en cada uso (prevenir reuso)
3. ✅ **Refresh proactivo** (5min antes de expirar)
4. ✅ **Cola de requests** durante refresh (evitar múltiples refreshes)
5. ✅ **Logout automático** si refresh falla
6. ✅ **Guardar refresh tokens en DB** (permite revocación)
7. ✅ **Detectar token reuse** (posible ataque)
8. ✅ **Silent refresh** (sin afectar UX)

---

**Resumen:** Refresh tokens mantienen sesiones activas sin pedir re-login, mejorando UX. Implementar con rotation, proactive refresh y silent refresh para máxima seguridad y mejor experiencia.
