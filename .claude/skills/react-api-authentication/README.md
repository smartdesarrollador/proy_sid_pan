# React API Authentication Skill

Guía completa de autenticación en React con TypeScript, JWT, protected routes y session management.

## Qué Incluye Este Skill

### Core Features
- ✅ **JWT Authentication**: Login/logout con tokens seguros
- ✅ **AuthContext & Provider**: Estado global de autenticación
- ✅ **Protected Routes**: Rutas que requieren autenticación
- ✅ **Refresh Token Pattern**: Renovación automática de sesión
- ✅ **Axios Interceptors**: Headers automáticos, retry en 401
- ✅ **Role-Based Access Control (RBAC)**: Permisos por roles
- ✅ **Persistent Sessions**: Auto-login al recargar app
- ✅ **TanStack Query Integration**: Queries autenticadas, invalidación al logout

### Seguridad
- 🔒 Almacenamiento seguro de tokens (httpOnly cookies vs localStorage)
- 🔒 Protección contra XSS y CSRF
- 🔒 Token expiration y auto-logout
- 🔒 Refresh token rotation
- 🔒 Silent refresh pattern

## Estructura de Archivos

```
react-api-authentication/
├── SKILL.md                              # Guía principal con ejemplos esenciales
├── README.md                             # Este archivo
└── references/
    ├── jwt-security.md                   # Seguridad JWT, almacenamiento, XSS/CSRF
    ├── refresh-token.md                  # Refresh token pattern completo
    ├── auth-context-advanced.md          # AuthContext avanzado (próximamente)
    ├── protected-routes.md               # Protected routes avanzado (próximamente)
    ├── rbac-implementation.md            # RBAC completo (próximamente)
    └── tanstack-query-auth.md            # TanStack Query + Auth (próximamente)
```

## Uso Rápido

### 1. Instalación de Dependencias

```bash
npm install axios @tanstack/react-query react-router-dom
```

### 2. Setup Básico

```tsx
// src/main.tsx
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
    </QueryClientProvider>
  );
}
```

### 3. Usar en Componentes

```tsx
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Casos de Uso

### ¿Cuándo Usar Este Skill?

- ✅ Implementar login/logout en React app
- ✅ Proteger rutas que requieren autenticación
- ✅ Manejar JWT tokens de forma segura
- ✅ Implementar refresh tokens para sesiones largas
- ✅ Control de acceso basado en roles (admin, user, editor)
- ✅ Integrar autenticación con TanStack Query
- ✅ Manejar expiración de tokens y auto-logout

### ¿Qué NO Cubre Este Skill?

- ❌ Implementación del backend (solo referencias de ejemplo)
- ❌ OAuth/Social login (Google, Facebook, etc.)
- ❌ Multi-factor authentication (2FA/MFA)
- ❌ Passwordless authentication (magic links, WebAuthn)

## Patrones de Autenticación Soportados

### 1. localStorage + Refresh Token (Development)
- Rápido de implementar
- Fácil de debuggear
- ⚠️ Vulnerable a XSS

### 2. httpOnly Cookies (Production Recomendado)
- ✅ Seguro contra XSS
- Requiere backend configuration
- Mejor para production

### 3. Memory + Refresh Token (High Security)
- Access token en memoria (se pierde al reload)
- Refresh token en localStorage
- Balance perfecto seguridad/UX

## Ejemplos de Código

### Login Flow Completo

```tsx
// 1. Usuario ingresa credentials
// 2. Frontend envía POST /api/auth/login
// 3. Backend valida y retorna { user, accessToken, refreshToken }
// 4. Frontend guarda tokens y user en state/localStorage
// 5. Usuario accede a rutas protegidas

const { login } = useAuth();

await login({ email: 'user@example.com', password: 'secret' });
// Usuario ahora autenticado, puede acceder a rutas protegidas
```

### Protected Route

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

### Axios con Auto Token

```tsx
// axios interceptor agrega token automáticamente
import api from './api/axios';

// No necesitas agregar headers manualmente
const user = await api.get('/users/me');
// Authorization: Bearer <token> se agrega automáticamente
```

### Refresh Token Automático

```tsx
// Si access token expira (401 response):
// 1. Interceptor detecta 401
// 2. Usa refresh token para obtener nuevo access token
// 3. Reintentar request original con nuevo token
// 4. Usuario no nota nada (silent refresh)

// Configurado automáticamente en axios.ts
```

## Best Practices

### ✅ Seguridad
- Usar HTTPS siempre en production
- Access tokens cortos (5-15min)
- Refresh tokens largos (7 días)
- Rotar refresh tokens en cada uso
- Sanitizar inputs del usuario
- Validar tokens en backend

### ✅ UX
- Mostrar loading durante auth check
- Auto-redirect a login si token expira
- Mensajes de error claros
- Silent refresh (sin interrumpir usuario)
- Remember me (opcional)

### ✅ Performance
- Memoizar funciones de auth
- Lazy load rutas protegidas
- Cache user data con TanStack Query
- Evitar re-renders innecesarios de AuthContext

## Flujos Completos

### Flow 1: Primer Login

```
User → LoginPage → submit credentials
         ↓
    POST /api/auth/login
         ↓
    Backend valida → retorna { user, accessToken, refreshToken }
         ↓
    Frontend guarda en localStorage + state
         ↓
    Redirect a /dashboard
         ↓
    ProtectedRoute verifica isAuthenticated
         ↓
    Render Dashboard
```

### Flow 2: Reload de Página

```
User reloads page
         ↓
    AuthProvider useEffect
         ↓
    Check localStorage for refreshToken
         ↓
    POST /api/auth/refresh { refreshToken }
         ↓
    Backend retorna nuevo accessToken
         ↓
    Frontend actualiza state con user + accessToken
         ↓
    User sigue autenticado (sin re-login)
```

### Flow 3: Token Expiration

```
User hace request → GET /api/users
         ↓
    Axios agrega Authorization: Bearer <accessToken>
         ↓
    Backend retorna 401 (token expired)
         ↓
    Axios interceptor detecta 401
         ↓
    Usa refreshToken para obtener nuevo accessToken
         ↓
    Reintentar GET /api/users con nuevo token
         ↓
    Success (usuario no nota nada)
```

## Testing

```tsx
// src/__tests__/AuthContext.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

describe('AuthContext', () => {
  it('should login user and store tokens', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await result.current.login({ email: 'test@example.com', password: 'password' });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
    });
  });
});
```

## Recursos Adicionales

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com/en/main)
- [JWT.io](https://jwt.io/) - JWT decoder

## Contribuciones

Para mejorar este skill:
1. Agregar ejemplos de OAuth/Social login
2. Agregar 2FA/MFA patterns
3. Agregar ejemplos con GraphQL
4. Agregar tests más completos

---

**Última actualización:** 2026-02-13
