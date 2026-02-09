# Security Best Practices - JWT Authentication

Mejores prácticas de seguridad para sistemas de autenticación JWT en Angular.

## 1. Token Storage

### ❌ NO HACER

```typescript
// NUNCA almacenar tokens en cookies sin httpOnly
document.cookie = `access_token=${token}`;

// NUNCA exponer tokens en URLs
this.router.navigate(['/dashboard'], { queryParams: { token } });

// NUNCA almacenar tokens en código
const token = 'hardcoded-token-123';
```

### ✅ HACER

```typescript
// Usar localStorage/sessionStorage según "Remember Me"
class TokenService {
  saveTokens(accessToken: string, refreshToken: string, rememberMe = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', accessToken);
    storage.setItem('refresh_token', refreshToken);
  }
}

// Para aplicaciones ultra-sensibles, considerar almacenamiento in-memory
class InMemoryTokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  saveTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
```

## 2. Token Lifecycle

### Token Expiration

```typescript
// SIEMPRE verificar expiración antes de usar
function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000;
  const now = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return now >= expirationTime - bufferTime;
}

// Usar buffer de 60 segundos para prevenir race conditions
if (isTokenExpired(token, 60)) {
  await refreshToken();
}
```

### Auto-Refresh Strategy

```typescript
// Refresh 2 minutos antes de expiración
startAutoRefresh(): void {
  const token = this.getAccessToken();
  if (!token) return;

  const expiresIn = getTokenExpirationTime(token);
  const refreshTime = Math.max((expiresIn - 120) * 1000, 0);

  if (refreshTime > 0) {
    this.autoRefreshSubscription = timer(refreshTime)
      .pipe(switchMap(() => this.refreshToken()))
      .subscribe();
  }
}
```

## 3. Request Security

### HTTPS Only

```typescript
// environment.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com', // SIEMPRE https en producción
  requireHttps: true
};

// HTTP Interceptor para forzar HTTPS
export const httpsEnforcerInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('https://') && environment.requireHttps) {
    console.error('SECURITY: Attempted HTTP request in production', req.url);
    throw new Error('HTTPS required');
  }
  return next(req);
};
```

### CORS Configuration

```typescript
// Backend debe tener CORS configurado correctamente
// Django/DRF ejemplo:
/*
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
    "https://www.example.com",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
]
*/

// Angular: NO necesita configuración CORS (se maneja en backend)
```

## 4. XSS Protection

### Sanitize User Input

```typescript
import { DomSanitizer } from '@angular/platform-browser';

@Component({...})
export class UserProfileComponent {
  private sanitizer = inject(DomSanitizer);

  // NUNCA usar innerHTML con datos de usuario sin sanitizar
  displayUserBio(bio: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, bio) || '';
  }

  // Para URLs
  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.sanitize(SecurityContext.URL, url) || '';
  }
}
```

### Content Security Policy (CSP)

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
">
```

## 5. Password Security

### Client-Side Validation

```typescript
function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const requirements = {
    minLength: value.length >= 12, // Mínimo 12 caracteres
    hasUpperCase: /[A-Z]/.test(value),
    hasLowerCase: /[a-z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
  };

  const isValid = Object.values(requirements).every(req => req);

  return isValid ? null : { passwordStrength: requirements };
}
```

### NEVER Send Plain Passwords

```typescript
// ❌ NUNCA
const loginData = {
  email: 'user@example.com',
  password: btoa('mypassword') // Base64 NO es encriptación!
};

// ✅ CORRECTO - Enviar plain text sobre HTTPS
const loginData = {
  email: 'user@example.com',
  password: 'mypassword' // HTTPS encripta el transporte
};

// El backend DEBE hashear con bcrypt/argon2
```

## 6. Session Security

### Session Timeout

```typescript
@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos
  private timeoutId?: number;

  startMonitoring(): void {
    this.resetTimeout();

    // Reiniciar timeout en actividad del usuario
    fromEvent(document, 'mousemove').pipe(
      throttleTime(1000)
    ).subscribe(() => this.resetTimeout());

    fromEvent(document, 'keypress').pipe(
      throttleTime(1000)
    ).subscribe(() => this.resetTimeout());
  }

  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.handleTimeout();
    }, this.TIMEOUT_DURATION);
  }

  private handleTimeout(): void {
    // Logout automático
    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { reason: 'session_timeout' }
    });
  }
}
```

### Prevent Concurrent Sessions

```typescript
// Backend debe implementar:
// 1. Invalidar tokens anteriores al hacer login
// 2. Limitar sesiones activas por usuario
// 3. Tracking de device IDs

// Frontend: Agregar device fingerprint
function getDeviceFingerprint(): string {
  const data = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return btoa(JSON.stringify(data));
}

// Enviar en login request
login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>('/auth/login', {
    ...credentials,
    deviceFingerprint: getDeviceFingerprint()
  });
}
```

## 7. API Security

### Rate Limiting (Client-Side Awareness)

```typescript
// Implementar backoff en caso de 429 (Too Many Requests)
export const rateLimitRetryInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 429) {
        const retryAfter = error.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

        return timer(delay).pipe(
          switchMap(() => next(req))
        );
      }
      return throwError(() => error);
    })
  );
};
```

### Request Validation

```typescript
// Validar datos antes de enviar
function validateLoginRequest(data: any): data is LoginRequest {
  return (
    typeof data.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    typeof data.password === 'string' &&
    data.password.length >= 8
  );
}

login(credentials: any): Observable<AuthResponse> {
  if (!validateLoginRequest(credentials)) {
    return throwError(() => new Error('Invalid login data'));
  }

  return this.http.post<AuthResponse>('/auth/login', credentials);
}
```

## 8. Secrets Management

### Environment Variables

```typescript
// .env (NUNCA commitar)
VITE_API_URL=https://api.example.com
VITE_API_KEY=secret-key-here

// environment.ts (valores por defecto seguros)
export const environment = {
  production: false,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // NUNCA incluir API keys del cliente en el código
  // Las API keys deben ser server-side
};

// .gitignore
.env
.env.local
.env.*.local
```

## 9. Audit Logging

### Track Security Events

```typescript
@Injectable({ providedIn: 'root' })
export class SecurityAuditService {
  logAuthEvent(event: 'login' | 'logout' | 'token_refresh' | 'password_change', metadata?: any): void {
    const auditLog = {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      metadata
    };

    // Enviar al backend
    this.http.post('/api/audit/auth', auditLog).subscribe({
      error: (err) => console.error('Failed to log audit event', err)
    });
  }
}

// Usar en AuthService
login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>('/auth/login', credentials).pipe(
    tap(response => {
      if (response.success) {
        this.securityAudit.logAuthEvent('login', {
          email: credentials.email,
          rememberMe: credentials.rememberMe
        });
      }
    })
  );
}
```

## 10. Dependency Security

### Package Auditing

```bash
# Audit regularmente
npm audit

# Fix vulnerabilities automáticamente
npm audit fix

# Para vulnerabilities críticas
npm audit fix --force

# Usar Dependabot (GitHub) o Snyk para monitoring continuo
```

### Update Strategy

```json
// package.json - Usar versiones exactas para production
{
  "dependencies": {
    "@angular/core": "19.0.0",  // Exacto, no "^19.0.0"
    "@angular/common": "19.0.0"
  }
}
```

## Security Checklist

- [ ] HTTPS en producción
- [ ] Tokens en storage seguro (no cookies sin httpOnly)
- [ ] Auto-refresh de tokens implementado
- [ ] Buffer de expiración (60s)
- [ ] Password strength validation
- [ ] XSS protection (sanitización)
- [ ] CSRF protection (si aplica)
- [ ] Content Security Policy configurado
- [ ] Session timeout implementado
- [ ] Rate limiting awareness
- [ ] Audit logging de eventos de seguridad
- [ ] Dependency auditing regular
- [ ] Environment variables para secrets
- [ ] CORS configurado correctamente (backend)
- [ ] Error messages que no filtran información sensible
- [ ] Input validation en cliente y servidor
- [ ] Device fingerprinting (opcional)
- [ ] Concurrent session handling
- [ ] Security headers configurados (backend)
- [ ] Regular security updates

## Common Vulnerabilities to Avoid

### 1. Token Leakage

❌ **NUNCA**:
- Logear tokens en console
- Enviar tokens en query params
- Almacenar tokens en código
- Exponer tokens en error messages

### 2. Insecure Direct Object References (IDOR)

```typescript
// ❌ NO CONFIAR EN IDs del cliente
deleteUser(userId: string): Observable<void> {
  return this.http.delete<void>(`/users/${userId}`); // Backend debe verificar permisos
}

// ✅ Backend DEBE verificar
/*
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    if request.user.id != user_id and not request.user.is_admin:
        return Response(status=403)
    ...
*/
```

### 3. Mass Assignment

```typescript
// ❌ Enviar objeto completo del form
updateProfile(formValue: any): Observable<User> {
  return this.http.put<User>('/user/profile', formValue);
}

// ✅ Enviar solo campos permitidos
updateProfile(data: UpdateProfileRequest): Observable<User> {
  const allowedFields: UpdateProfileRequest = {
    firstName: data.firstName,
    lastName: data.lastName,
    avatar: data.avatar
    // NO incluir: role, isAdmin, etc.
  };
  return this.http.put<User>('/user/profile', allowedFields);
}
```
