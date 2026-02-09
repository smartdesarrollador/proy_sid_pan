---
name: angular-http-interceptors
description: >
  Interceptores HTTP completos para Angular standalone applications. Usar cuando se necesite
  implementar autenticación JWT, manejo centralizado de errores HTTP, loading states globales,
  retry logic, logging de requests/responses, o configurar múltiples interceptores. Incluye
  token service, error handling tipado, loading state service, y configuración con provideHttpClient.
  Código plug-and-play listo para proyectos Angular que consumen APIs REST.
---

# Angular HTTP Interceptors - Implementación Completa

Interceptores HTTP funcionales standalone para manejo de autenticación, errores, loading, retry y logging.

## Índice de Interceptores

1. **Auth Interceptor** - Agregar JWT tokens a requests
2. **Error Interceptor** - Manejo centralizado de errores HTTP
3. **Loading Interceptor** - States globales de carga
4. **Retry Interceptor** - Retry automático de peticiones fallidas
5. **Logging Interceptor** - Log de requests/responses
6. **Token Service** - Gestión de tokens JWT
7. **Loading Service** - Estado global de loading
8. **Error Types** - Interfaces tipadas para errores

## Quick Start

### 1. Estructura de Archivos

```
src/app/core/
├── interceptors/
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   ├── loading.interceptor.ts
│   ├── retry.interceptor.ts
│   └── logging.interceptor.ts
├── services/
│   ├── token.service.ts
│   └── loading.service.ts
└── models/
    └── http-error.model.ts
```

### 2. Configuración en app.config.ts

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

// Interceptors
import { loggingInterceptor } from '@core/interceptors/logging.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';
import { retryInterceptor } from '@core/interceptors/retry.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loggingInterceptor,    // 1. Primero: logging de entrada
        authInterceptor,       // 2. Agregar auth headers
        loadingInterceptor,    // 3. Activar loading state
        retryInterceptor,      // 4. Retry logic
        errorInterceptor,      // 5. Último: manejo de errores
      ])
    ),
  ]
};
```

**⚠️ Orden Importante**: Los interceptors se ejecutan en orden de declaración para requests,
y en orden inverso para responses.

## 1. Auth Interceptor (JWT)

Agrega automáticamente el token JWT a todas las requests.

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@core/services/token.service';

/**
 * Interceptor de autenticación que agrega el token JWT a los headers
 * de todas las requests HTTP (excepto las excluidas).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);

  // URLs que no requieren token
  const excludedUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

  if (shouldExclude) {
    return next(req);
  }

  // Obtener token
  const token = tokenService.getToken();

  if (!token) {
    return next(req);
  }

  // Clonar request y agregar Authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
```

**Uso**: Se aplica automáticamente. No requiere código adicional.

## 2. Error Interceptor

Maneja errores HTTP de forma centralizada con lógica específica por código de error.

```typescript
// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '@core/services/token.service';
import { HttpError } from '@core/models/http-error.model';

/**
 * Interceptor de errores que maneja diferentes tipos de errores HTTP
 * y ejecuta acciones específicas según el código de estado.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error desconocido';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente o de red
        errorMessage = `Error: ${error.error.message}`;
        errorCode = 'CLIENT_ERROR';
        console.error('Error del cliente:', error.error.message);
      } else {
        // Error del lado del servidor
        errorMessage = error.error?.message || error.message;

        switch (error.status) {
          case 400:
            errorCode = 'BAD_REQUEST';
            errorMessage = 'Solicitud incorrecta';
            break;

          case 401:
            errorCode = 'UNAUTHORIZED';
            errorMessage = 'No autorizado. Inicie sesión nuevamente';
            tokenService.removeToken();
            router.navigate(['/auth/login']);
            break;

          case 403:
            errorCode = 'FORBIDDEN';
            errorMessage = 'No tiene permisos para acceder a este recurso';
            break;

          case 404:
            errorCode = 'NOT_FOUND';
            errorMessage = 'Recurso no encontrado';
            break;

          case 500:
            errorCode = 'SERVER_ERROR';
            errorMessage = 'Error interno del servidor';
            break;

          case 503:
            errorCode = 'SERVICE_UNAVAILABLE';
            errorMessage = 'Servicio no disponible. Intente más tarde';
            break;

          case 0:
            errorCode = 'NETWORK_ERROR';
            errorMessage = 'Error de conexión. Verifique su red';
            break;

          default:
            errorCode = `HTTP_${error.status}`;
            errorMessage = `Error HTTP ${error.status}: ${error.statusText}`;
        }

        console.error(`Error HTTP ${error.status}:`, errorMessage);
      }

      // Crear objeto de error tipado
      const httpError: HttpError = {
        code: errorCode,
        message: errorMessage,
        status: error.status,
        url: req.url,
        timestamp: new Date(),
        details: error.error
      };

      // Mostrar notificación al usuario (opcional)
      // this.notificationService.showError(errorMessage);

      return throwError(() => httpError);
    })
  );
};
```

**Uso en componentes**:

```typescript
this.http.get<User[]>('/api/users').subscribe({
  next: (users) => console.log(users),
  error: (error: HttpError) => {
    console.error(`[${error.code}] ${error.message}`);
    // Manejar error específico
  }
});
```

## 3. Loading Interceptor

Activa/desactiva un estado global de loading durante las peticiones HTTP.

```typescript
// src/app/core/interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';

/**
 * Interceptor que gestiona el estado global de loading
 * mostrando/ocultando un spinner durante las peticiones HTTP.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Excluir requests que no deberían mostrar loading
  const excludedUrls = ['/api/polling', '/api/notifications'];
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

  if (shouldExclude) {
    return next(req);
  }

  // Incrementar contador de requests activas
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Decrementar contador cuando termine (éxito o error)
      loadingService.hide();
    })
  );
};
```

**Uso en componente**:

```typescript
@Component({
  selector: 'app-root',
  template: `
    @if (isLoading()) {
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    }
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  private loadingService = inject(LoadingService);
  isLoading = this.loadingService.loading;
}
```

## 4. Retry Interceptor

Reintenta automáticamente peticiones fallidas con backoff exponencial.

```typescript
// src/app/core/interceptors/retry.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer } from 'rxjs';

/**
 * Interceptor que implementa retry logic con backoff exponencial
 * para peticiones HTTP fallidas.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const maxRetries = 2;
  const retryDelay = 1000; // 1 segundo

  // Solo hacer retry en métodos seguros (GET)
  if (req.method !== 'GET') {
    return next(req);
  }

  // URLs que no deberían hacer retry
  const excludedUrls = ['/auth/login', '/auth/register'];
  const shouldExclude = excludedUrls.some(url => req.url.includes(url));

  if (shouldExclude) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Solo hacer retry en errores de red o 5xx
        if (error.status >= 500 || error.status === 0) {
          const delay = retryDelay * Math.pow(2, retryCount - 1); // Backoff exponencial
          console.log(`Retry ${retryCount}/${maxRetries} después de ${delay}ms`);
          return timer(delay);
        }

        // No hacer retry para otros errores
        throw error;
      }
    })
  );
};
```

**Comportamiento**:
- Solo retry en requests GET (idempotentes)
- Solo retry en errores 5xx o errores de red
- Backoff exponencial: 1s, 2s, 4s...
- Máximo 2 reintentos

## 5. Logging Interceptor

Registra todas las peticiones y respuestas HTTP para debugging.

```typescript
// src/app/core/interceptors/logging.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * Interceptor de logging que registra todas las requests y responses
 * para propósitos de debugging y monitoreo.
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();

  console.group(`🌐 HTTP ${req.method} ${req.url}`);
  console.log('📤 Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers.keys().reduce((acc, key) => {
      acc[key] = req.headers.get(key);
      return acc;
    }, {} as Record<string, string | null>),
    body: req.body
  });

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const elapsedTime = Date.now() - startTime;
          console.log('📥 Response:', {
            status: event.status,
            statusText: event.statusText,
            body: event.body,
            elapsedTime: `${elapsedTime}ms`
          });
          console.groupEnd();
        }
      },
      error: (error) => {
        const elapsedTime = Date.now() - startTime;
        console.error('❌ Error:', {
          status: error.status,
          message: error.message,
          elapsedTime: `${elapsedTime}ms`
        });
        console.groupEnd();
      }
    })
  );
};
```

**Output en consola**:
```
🌐 HTTP GET /api/users
  📤 Request: { method: 'GET', url: '/api/users', ... }
  📥 Response: { status: 200, body: [...], elapsedTime: '145ms' }
```

## 6. Token Service

Servicio para gestión de tokens JWT con refresh automático.

Ver implementación completa en `references/token-service.md`.

```typescript
// Resumen de métodos principales
class TokenService {
  getToken(): string | null
  setToken(token: string): void
  removeToken(): void
  refreshToken(): Observable<string>
  isTokenExpired(): boolean
  getTokenExpirationDate(): Date | null
}
```

## 7. Loading Service

Servicio para estado global de loading con signal.

Ver implementación completa en `references/loading-service.md`.

```typescript
// Resumen de métodos principales
class LoadingService {
  loading: Signal<boolean>
  show(): void
  hide(): void
  reset(): void
}
```

## 8. HTTP Error Model

Interface tipada para errores HTTP.

```typescript
// src/app/core/models/http-error.model.ts
export interface HttpError {
  code: string;
  message: string;
  status: number;
  url: string;
  timestamp: Date;
  details?: any;
}

export type HttpErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'CLIENT_ERROR'
  | 'UNKNOWN_ERROR';
```

## Orden de Interceptores - Best Practices

El orden de los interceptores es crítico. Aquí está el orden recomendado:

```typescript
provideHttpClient(
  withInterceptors([
    loggingInterceptor,    // 1️⃣ Primero: log de entrada
    authInterceptor,       // 2️⃣ Agregar headers de autenticación
    loadingInterceptor,    // 3️⃣ Activar loading
    retryInterceptor,      // 4️⃣ Retry logic
    errorInterceptor,      // 5️⃣ Último: manejar errores
  ])
)
```

**Explicación del flujo**:

**Request (orden normal):**
1. Logging interceptor → Registra request
2. Auth interceptor → Agrega token
3. Loading interceptor → Activa spinner
4. Retry interceptor → Configura retry
5. Error interceptor → Pasa
6. → Request va al servidor

**Response (orden inverso):**
1. Error interceptor → Maneja errores primero
2. Retry interceptor → Decide si hacer retry
3. Loading interceptor → Desactiva spinner
4. Auth interceptor → Pasa
5. Logging interceptor → Registra response

## Ejemplo de Uso Completo

```typescript
// src/app/features/users/users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
    // ✅ Auth interceptor agrega token automáticamente
    // ✅ Loading interceptor muestra spinner
    // ✅ Retry interceptor reintenta si falla
    // ✅ Error interceptor maneja errores
    // ✅ Logging interceptor registra todo
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

```typescript
// Uso en componente
@Component({
  selector: 'app-users',
  template: `
    @if (isLoading()) {
      <p>Cargando usuarios...</p>
    }

    @if (error()) {
      <div class="error">{{ error()?.message }}</div>
    }

    @if (users()) {
      <ul>
        @for (user of users(); track user.id) {
          <li>{{ user.name }} - {{ user.email }}</li>
        }
      </ul>
    }
  `
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private loadingService = inject(LoadingService);

  users = signal<User[]>([]);
  error = signal<HttpError | null>(null);
  isLoading = this.loadingService.loading;

  ngOnInit(): void {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.error.set(null);
      },
      error: (error: HttpError) => {
        this.error.set(error);
        console.error('Error al cargar usuarios:', error);
      }
    });
  }
}
```

## Configuraciones Avanzadas

### Interceptor Condicional

```typescript
// Solo aplicar interceptor a ciertas URLs
export const conditionalInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/')) {
    // Aplicar lógica
    const modifiedReq = req.clone({ /* ... */ });
    return next(modifiedReq);
  }
  return next(req);
};
```

### Headers Personalizados

```typescript
// Agregar headers custom
export const customHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const modifiedReq = req.clone({
    setHeaders: {
      'X-App-Version': '1.0.0',
      'X-Request-ID': crypto.randomUUID()
    }
  });
  return next(modifiedReq);
};
```

### Cache Interceptor (Básico)

```typescript
// Cache simple para GET requests
const cache = new Map<string, HttpResponse<any>>();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  const cachedResponse = cache.get(req.url);
  if (cachedResponse) {
    return of(cachedResponse.clone());
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(req.url, event.clone());
      }
    })
  );
};
```

## Testing de Interceptores

```typescript
// users.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from '@core/interceptors/auth.interceptor';

describe('UsersService with Auth Interceptor', () => {
  let httpTesting: HttpTestingController;
  let service: UsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        UsersService
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UsersService);
  });

  it('should add Authorization header', () => {
    service.getUsers().subscribe();

    const req = httpTesting.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toContain('Bearer');
  });
});
```

## Referencias Completas

- **Token Service completo**: Ver `references/token-service.md`
- **Loading Service completo**: Ver `references/loading-service.md`
- **Ejemplos avanzados**: Ver `references/advanced-examples.md`
- **Testing**: Ver `references/testing-interceptors.md`

## Checklist de Implementación

- [ ] Crear carpeta `core/interceptors/`
- [ ] Implementar auth.interceptor.ts
- [ ] Implementar error.interceptor.ts
- [ ] Implementar loading.interceptor.ts
- [ ] Implementar retry.interceptor.ts
- [ ] Implementar logging.interceptor.ts
- [ ] Crear TokenService en `core/services/`
- [ ] Crear LoadingService en `core/services/`
- [ ] Crear HttpError interface en `core/models/`
- [ ] Configurar interceptors en app.config.ts en el orden correcto
- [ ] Agregar manejo de errores en componentes
- [ ] Configurar loading spinner en app.component
- [ ] Probar flujo completo de autenticación
- [ ] Probar manejo de errores (401, 403, 500, red)
- [ ] Verificar retry logic con network throttling

## Troubleshooting

**Problema**: Token no se agrega a las requests

```typescript
// Solución: Verificar que TokenService esté retornando el token
const token = tokenService.getToken();
console.log('Token:', token); // Debug
```

**Problema**: Loading spinner no se oculta

```typescript
// Solución: Verificar que finalize() se ejecute
return next(req).pipe(
  finalize(() => {
    console.log('Request finalizado'); // Debug
    loadingService.hide();
  })
);
```

**Problema**: Retry infinito

```typescript
// Solución: Agregar condición para detener retry
retry({
  count: maxRetries,
  delay: (error, retryCount) => {
    if (error.status < 500) {
      throw error; // Detener retry
    }
    return timer(1000);
  }
})
```
