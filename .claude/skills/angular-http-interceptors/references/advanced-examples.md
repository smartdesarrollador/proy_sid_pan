# Ejemplos Avanzados de Interceptores

Casos de uso avanzados y patrones para interceptores HTTP en Angular.

## 1. Refresh Token Interceptor

Interceptor que refresca automáticamente el token cuando expira.

```typescript
// src/app/core/interceptors/refresh-token.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '@core/services/token.service';

/**
 * Interceptor que refresca el token automáticamente cuando recibe un 401
 * e intenta de nuevo la request original con el nuevo token
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 y no es la request de refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Intentar refrescar el token
        return tokenService.refreshToken().pipe(
          switchMap((authResponse) => {
            // Token refrescado exitosamente, reintentar request original
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authResponse.accessToken}`
              }
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            // Si falla el refresh, limpiar tokens y propagar error
            tokenService.clearTokens();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
```

**Configuración**:

```typescript
provideHttpClient(
  withInterceptors([
    authInterceptor,
    refreshTokenInterceptor, // Después de auth interceptor
    errorInterceptor,
  ])
)
```

## 2. Cache Interceptor Avanzado

Interceptor con cache configurable y estrategias de invalidación.

```typescript
// src/app/core/interceptors/cache.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap, shareReplay } from 'rxjs';
import { CacheService } from '@core/services/cache.service';

/**
 * Interceptor de cache para requests GET
 * Soporta diferentes estrategias de cache
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  // Solo cachear requests GET
  if (req.method !== 'GET') {
    return next(req);
  }

  // Verificar si la URL debe ser cacheada
  const cacheConfig = cacheService.getCacheConfig(req.url);
  if (!cacheConfig.enabled) {
    return next(req);
  }

  // Verificar cache
  const cachedResponse = cacheService.get(req.url);
  if (cachedResponse && !cacheService.isExpired(req.url)) {
    console.log(`✅ Cache HIT: ${req.url}`);
    return of(cachedResponse.clone());
  }

  console.log(`❌ Cache MISS: ${req.url}`);

  // Request no está en cache, hacerla y cachear resultado
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cacheService.set(req.url, event.clone(), cacheConfig.ttl);
      }
    }),
    shareReplay(1) // Compartir resultado entre suscriptores
  );
};
```

```typescript
// src/app/core/services/cache.service.ts
import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live en milisegundos
}

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();

  // Configuración de cache por patrón de URL
  private cachePatterns: Map<RegExp, CacheConfig> = new Map([
    [/\/api\/config/, { enabled: true, ttl: 3600000 }],    // 1 hora
    [/\/api\/users\/\d+$/, { enabled: true, ttl: 300000 }], // 5 minutos
    [/\/api\/static/, { enabled: true, ttl: 86400000 }],    // 24 horas
  ]);

  getCacheConfig(url: string): CacheConfig {
    for (const [pattern, config] of this.cachePatterns.entries()) {
      if (pattern.test(url)) {
        return config;
      }
    }
    return { enabled: false, ttl: 0 };
  }

  get(url: string): HttpResponse<any> | null {
    const entry = this.cache.get(url);
    return entry ? entry.response : null;
  }

  set(url: string, response: HttpResponse<any>, ttl: number): void {
    this.cache.set(url, {
      response,
      timestamp: Date.now(),
      ttl
    });
  }

  isExpired(url: string): boolean {
    const entry = this.cache.get(url);
    if (!entry) return true;

    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  delete(url: string): void {
    this.cache.delete(url);
  }

  deletePattern(pattern: RegExp): void {
    for (const url of this.cache.keys()) {
      if (pattern.test(url)) {
        this.cache.delete(url);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidar cache cuando se hacen mutaciones
  invalidateAfterMutation(url: string): void {
    // Ejemplo: Si se crea/actualiza un usuario, invalidar lista de usuarios
    if (url.includes('/api/users')) {
      this.deletePattern(/\/api\/users/);
    }
  }
}
```

## 3. Request Deduplication Interceptor

Evita requests duplicadas simultáneas.

```typescript
// src/app/core/interceptors/deduplication.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, Subject, tap } from 'rxjs';

/**
 * Servicio para manejar deduplicación de requests
 */
class RequestDeduplicationService {
  private pendingRequests = new Map<string, Subject<HttpResponse<any>>>();

  hasPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  getPending(key: string): Observable<HttpResponse<any>> {
    return this.pendingRequests.get(key)!.asObservable();
  }

  setPending(key: string): Subject<HttpResponse<any>> {
    const subject = new Subject<HttpResponse<any>>();
    this.pendingRequests.set(key, subject);
    return subject;
  }

  complete(key: string, response: HttpResponse<any>): void {
    const subject = this.pendingRequests.get(key);
    if (subject) {
      subject.next(response);
      subject.complete();
      this.pendingRequests.delete(key);
    }
  }

  error(key: string, error: any): void {
    const subject = this.pendingRequests.get(key);
    if (subject) {
      subject.error(error);
      this.pendingRequests.delete(key);
    }
  }
}

/**
 * Interceptor que deduplica requests idénticas simultáneas
 */
export const deduplicationInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo deduplic requests GET
  if (req.method !== 'GET') {
    return next(req);
  }

  const deduplicationService = new RequestDeduplicationService();
  const requestKey = `${req.method}:${req.urlWithParams}`;

  // Si ya hay una request pendiente para esta URL
  if (deduplicationService.hasPending(requestKey)) {
    console.log(`⚡ Deduplicando request: ${req.url}`);
    return deduplicationService.getPending(requestKey);
  }

  // Crear nueva request pendiente
  const subject = deduplicationService.setPending(requestKey);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          deduplicationService.complete(requestKey, event);
        }
      },
      error: (error) => {
        deduplicationService.error(requestKey, error);
      }
    })
  );
};
```

## 4. Rate Limiting Interceptor

Limita la cantidad de requests por tiempo.

```typescript
// src/app/core/interceptors/rate-limit.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { throwError, timer, mergeMap } from 'rxjs';

/**
 * Servicio para rate limiting
 */
class RateLimitService {
  private requestCounts = new Map<string, number[]>();
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 minuto

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requestCounts.get(key) || [];

    // Filtrar requests dentro de la ventana de tiempo
    const recentRequests = requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Registrar nueva request
    recentRequests.push(now);
    this.requestCounts.set(key, recentRequests);
    return true;
  }

  getWaitTime(key: string): number {
    const requests = this.requestCounts.get(key) || [];
    if (requests.length === 0) return 0;

    const oldestRequest = Math.min(...requests);
    const waitTime = this.timeWindow - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }
}

/**
 * Interceptor de rate limiting
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const rateLimitService = new RateLimitService();
  const key = `${req.method}:${req.url}`;

  if (!rateLimitService.canMakeRequest(key)) {
    const waitTime = rateLimitService.getWaitTime(key);
    console.warn(`⏱️ Rate limit alcanzado. Esperar ${waitTime}ms`);

    return throwError(() => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Demasiadas requests. Intente en ${Math.ceil(waitTime / 1000)}s`,
      waitTime
    }));
  }

  return next(req);
};
```

## 5. Timeout Interceptor

Agrega timeout a todas las requests.

```typescript
// src/app/core/interceptors/timeout.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, catchError, throwError } from 'rxjs';

/**
 * Interceptor que agrega timeout a las requests
 */
export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  // Timeout por defecto: 30 segundos
  const defaultTimeout = 30000;

  // URLs con timeout custom
  const timeoutConfig = new Map<RegExp, number>([
    [/\/api\/upload/, 120000],    // 2 minutos para uploads
    [/\/api\/export/, 180000],    // 3 minutos para exports
    [/\/api\/reports/, 60000],    // 1 minuto para reportes
  ]);

  // Determinar timeout para esta request
  let requestTimeout = defaultTimeout;
  for (const [pattern, customTimeout] of timeoutConfig.entries()) {
    if (pattern.test(req.url)) {
      requestTimeout = customTimeout;
      break;
    }
  }

  return next(req).pipe(
    timeout(requestTimeout),
    catchError((error) => {
      if (error.name === 'TimeoutError') {
        console.error(`⏰ Timeout después de ${requestTimeout}ms: ${req.url}`);
        return throwError(() => ({
          code: 'TIMEOUT',
          message: `La solicitud excedió el tiempo límite de ${requestTimeout / 1000}s`,
          url: req.url
        }));
      }
      return throwError(() => error);
    })
  );
};
```

## 6. Mock Data Interceptor (Testing)

Interceptor para simular respuestas durante desarrollo.

```typescript
// src/app/core/interceptors/mock.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Mock data responses
 */
const mockResponses: Map<RegExp, any> = new Map([
  [/\/api\/users$/, {
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ]
  }],
  [/\/api\/users\/(\d+)$/, (matches: RegExpMatchArray) => ({
    data: {
      id: parseInt(matches[1]),
      name: 'John Doe',
      email: 'john@example.com'
    }
  })],
]);

/**
 * Interceptor para mock data durante desarrollo
 */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo habilitar en desarrollo
  if (!environment.useMocks) {
    return next(req);
  }

  // Buscar mock para esta URL
  for (const [pattern, mockData] of mockResponses.entries()) {
    const matches = req.url.match(pattern);
    if (matches) {
      console.log(`🎭 Mock response: ${req.url}`);

      const data = typeof mockData === 'function'
        ? mockData(matches)
        : mockData;

      return of(
        new HttpResponse({
          status: 200,
          body: data
        })
      ).pipe(
        delay(500) // Simular latencia de red
      );
    }
  }

  // No hay mock, hacer request real
  return next(req);
};
```

## 7. Analytics Interceptor

Registra métricas de requests para analytics.

```typescript
// src/app/core/interceptors/analytics.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: Date;
}

class AnalyticsService {
  trackRequest(metrics: RequestMetrics): void {
    // Enviar a servicio de analytics (Google Analytics, Mixpanel, etc.)
    console.log('📊 Analytics:', metrics);

    // Ejemplo con Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'http_request', {
        event_category: 'API',
        event_label: `${metrics.method} ${metrics.url}`,
        value: metrics.duration,
        custom_dimension_1: metrics.status.toString(),
      });
    }
  }
}

/**
 * Interceptor para tracking de analytics
 */
export const analyticsInterceptor: HttpInterceptorFn = (req, next) => {
  const analyticsService = new AnalyticsService();
  const startTime = Date.now();

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          analyticsService.trackRequest({
            url: req.url,
            method: req.method,
            duration,
            status: event.status,
            success: true,
            timestamp: new Date()
          });
        }
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        analyticsService.trackRequest({
          url: req.url,
          method: req.method,
          duration,
          status: error.status || 0,
          success: false,
          timestamp: new Date()
        });
      }
    })
  );
};
```

## 8. Compression Interceptor

Comprime requests grandes antes de enviarlas.

```typescript
// src/app/core/interceptors/compression.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor que comprime el body de requests grandes
 */
export const compressionInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo comprimir POST/PUT con body grande
  if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !req.body) {
    return next(req);
  }

  const bodySize = JSON.stringify(req.body).length;
  const compressionThreshold = 1024; // 1KB

  if (bodySize > compressionThreshold) {
    // En producción, usar una librería de compresión real (pako, lz-string, etc.)
    console.log(`🗜️ Comprimiendo request de ${bodySize} bytes`);

    // Aquí iría la lógica de compresión real
    const compressedReq = req.clone({
      setHeaders: {
        'Content-Encoding': 'gzip'
      },
      // body: compressedBody
    });

    return next(compressedReq);
  }

  return next(req);
};
```

## Configuración Completa de Interceptores

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { loggingInterceptor } from '@core/interceptors/logging.interceptor';
import { mockInterceptor } from '@core/interceptors/mock.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { deduplicationInterceptor } from '@core/interceptors/deduplication.interceptor';
import { cacheInterceptor } from '@core/interceptors/cache.interceptor';
import { compressionInterceptor } from '@core/interceptors/compression.interceptor';
import { timeoutInterceptor } from '@core/interceptors/timeout.interceptor';
import { rateLimitInterceptor } from '@core/interceptors/rate-limit.interceptor';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';
import { retryInterceptor } from '@core/interceptors/retry.interceptor';
import { refreshTokenInterceptor } from '@core/interceptors/refresh-token.interceptor';
import { analyticsInterceptor } from '@core/interceptors/analytics.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        // 1. Mock data (solo desarrollo)
        mockInterceptor,

        // 2. Logging
        loggingInterceptor,

        // 3. Analytics
        analyticsInterceptor,

        // 4. Autenticación
        authInterceptor,

        // 5. Deduplicación
        deduplicationInterceptor,

        // 6. Cache
        cacheInterceptor,

        // 7. Compresión
        compressionInterceptor,

        // 8. Timeout
        timeoutInterceptor,

        // 9. Rate limiting
        rateLimitInterceptor,

        // 10. Loading state
        loadingInterceptor,

        // 11. Retry logic
        retryInterceptor,

        // 12. Refresh token
        refreshTokenInterceptor,

        // 13. Error handling (último)
        errorInterceptor,
      ])
    ),
  ]
};
```

## Best Practices para Interceptores Avanzados

1. **Orden correcto**: El orden importa, planifica cuidadosamente
2. **Condicionales**: Usa condicionales para aplicar lógica selectivamente
3. **Performance**: Evita operaciones costosas en interceptores
4. **Debugging**: Agrega logs para facilitar debugging
5. **Testing**: Testa cada interceptor individualmente
6. **Configuración**: Usa servicios para configuración dinámica
7. **Composición**: Combina interceptores pequeños en lugar de uno grande
8. **Documentación**: Documenta el propósito y comportamiento de cada interceptor
