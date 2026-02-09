# Testing de Interceptores HTTP

Guía completa para testing de interceptores en Angular.

## Setup de Testing

### Configuración Base

```typescript
// Imports necesarios
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
```

## 1. Testing Auth Interceptor

```typescript
// auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from '@core/services/token.service';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        TokenService
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add Authorization header when token exists', () => {
    const mockToken = 'mock-jwt-token';
    spyOn(tokenService, 'getToken').and.returnValue(mockToken);

    httpClient.get('/api/users').subscribe();

    const req = httpTesting.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush([]);
  });

  it('should not add Authorization header when token does not exist', () => {
    spyOn(tokenService, 'getToken').and.returnValue(null);

    httpClient.get('/api/users').subscribe();

    const req = httpTesting.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush([]);
  });

  it('should exclude login endpoint', () => {
    spyOn(tokenService, 'getToken').and.returnValue('token');

    httpClient.post('/auth/login', {}).subscribe();

    const req = httpTesting.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
  });
});
```

## 2. Testing Error Interceptor

```typescript
// error.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { TokenService } from '@core/services/token.service';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let router: Router;
  let tokenService: TokenService;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', ['removeToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: TokenService, useValue: tokenServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should handle 401 error and redirect to login', () => {
    httpClient.get('/api/users').subscribe({
      next: () => fail('should have failed with 401 error'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        expect(tokenService.removeToken).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
      }
    });

    const req = httpTesting.expectOne('/api/users');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 404 error', () => {
    httpClient.get('/api/users/999').subscribe({
      next: () => fail('should have failed with 404 error'),
      error: (error: any) => {
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('Recurso no encontrado');
      }
    });

    const req = httpTesting.expectOne('/api/users/999');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle 500 error', () => {
    httpClient.get('/api/users').subscribe({
      next: () => fail('should have failed with 500 error'),
      error: (error: any) => {
        expect(error.code).toBe('SERVER_ERROR');
        expect(error.message).toBe('Error interno del servidor');
      }
    });

    const req = httpTesting.expectOne('/api/users');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should handle network error', () => {
    httpClient.get('/api/users').subscribe({
      next: () => fail('should have failed with network error'),
      error: (error: any) => {
        expect(error.code).toBe('CLIENT_ERROR');
      }
    });

    const req = httpTesting.expectOne('/api/users');
    req.error(new ProgressEvent('error'));
  });
});
```

## 3. Testing Loading Interceptor

```typescript
// loading.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '@core/services/loading.service';

describe('LoadingInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        LoadingService
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    httpTesting.verify();
    loadingService.reset();
  });

  it('should show loading during request', () => {
    expect(loadingService.loading()).toBe(false);

    httpClient.get('/api/users').subscribe();

    // Loading debe estar activo
    expect(loadingService.loading()).toBe(true);

    const req = httpTesting.expectOne('/api/users');
    req.flush([]);

    // Loading debe estar inactivo después de completar
    expect(loadingService.loading()).toBe(false);
  });

  it('should hide loading on error', () => {
    httpClient.get('/api/users').subscribe({
      error: () => {}
    });

    expect(loadingService.loading()).toBe(true);

    const req = httpTesting.expectOne('/api/users');
    req.error(new ProgressEvent('error'));

    // Loading debe ocultarse incluso en error
    expect(loadingService.loading()).toBe(false);
  });

  it('should handle multiple simultaneous requests', () => {
    httpClient.get('/api/users').subscribe();
    httpClient.get('/api/posts').subscribe();

    expect(loadingService.getActiveRequestsCount()).toBe(2);
    expect(loadingService.loading()).toBe(true);

    const req1 = httpTesting.expectOne('/api/users');
    req1.flush([]);

    // Aún hay una request activa
    expect(loadingService.getActiveRequestsCount()).toBe(1);
    expect(loadingService.loading()).toBe(true);

    const req2 = httpTesting.expectOne('/api/posts');
    req2.flush([]);

    // Ahora todas terminaron
    expect(loadingService.getActiveRequestsCount()).toBe(0);
    expect(loadingService.loading()).toBe(false);
  });

  it('should exclude specified URLs', () => {
    httpClient.get('/api/polling').subscribe();

    // Polling no debe activar loading
    expect(loadingService.loading()).toBe(false);

    const req = httpTesting.expectOne('/api/polling');
    req.flush({});
  });
});
```

## 4. Testing Retry Interceptor

```typescript
// retry.interceptor.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { retryInterceptor } from './retry.interceptor';

describe('RetryInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should retry on 500 error', fakeAsync(() => {
    let attempts = 0;

    httpClient.get('/api/users').subscribe({
      error: () => {
        expect(attempts).toBe(3); // Original + 2 retries
      }
    });

    // Simular 3 intentos fallidos
    for (let i = 0; i < 3; i++) {
      tick(1000); // Esperar delay de retry
      const req = httpTesting.expectOne('/api/users');
      attempts++;
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    }
  }));

  it('should not retry on 404 error', () => {
    let attempts = 0;

    httpClient.get('/api/users/999').subscribe({
      error: () => {
        expect(attempts).toBe(1); // Solo 1 intento
      }
    });

    const req = httpTesting.expectOne('/api/users/999');
    attempts++;
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should not retry POST requests', () => {
    let attempts = 0;

    httpClient.post('/api/users', {}).subscribe({
      error: () => {
        expect(attempts).toBe(1); // Solo 1 intento
      }
    });

    const req = httpTesting.expectOne('/api/users');
    attempts++;
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });

  it('should succeed after retry', fakeAsync(() => {
    let attempts = 0;
    const mockData = [{ id: 1, name: 'User' }];

    httpClient.get('/api/users').subscribe({
      next: (data) => {
        expect(data).toEqual(mockData);
        expect(attempts).toBe(2); // Falló una vez, luego éxito
      }
    });

    // Primer intento: error
    tick(0);
    const req1 = httpTesting.expectOne('/api/users');
    attempts++;
    req1.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Segundo intento: éxito
    tick(1000);
    const req2 = httpTesting.expectOne('/api/users');
    attempts++;
    req2.flush(mockData);
  }));
});
```

## 5. Testing Múltiples Interceptores

```typescript
// multiple-interceptors.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { loggingInterceptor } from './logging.interceptor';
import { TokenService } from '@core/services/token.service';

describe('Multiple Interceptors', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            loggingInterceptor,
            authInterceptor
          ])
        ),
        provideHttpClientTesting(),
        TokenService
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should execute interceptors in correct order', () => {
    const mockToken = 'test-token';
    spyOn(tokenService, 'getToken').and.returnValue(mockToken);
    spyOn(console, 'group');
    spyOn(console, 'log');
    spyOn(console, 'groupEnd');

    httpClient.get('/api/users').subscribe();

    const req = httpTesting.expectOne('/api/users');

    // Verificar que logging se ejecutó primero
    expect(console.group).toHaveBeenCalled();

    // Verificar que auth agregó el header
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    req.flush([]);

    // Verificar que logging completó
    expect(console.groupEnd).toHaveBeenCalled();
  });
});
```

## 6. Testing Token Service

```typescript
// token.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TokenService, AuthResponse } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TokenService
      ]
    });

    service = TestBed.inject(TokenService);
    httpTesting = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('Token Storage', () => {
    it('should store and retrieve token', () => {
      const token = 'test-token';
      service.setToken(token);
      expect(service.getToken()).toBe(token);
    });

    it('should remove token', () => {
      service.setToken('test-token');
      service.removeToken();
      expect(service.getToken()).toBeNull();
    });

    it('should check if token exists', () => {
      expect(service.hasToken()).toBe(false);
      service.setToken('test-token');
      expect(service.hasToken()).toBe(true);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token', () => {
      const refreshToken = 'refresh-token';
      const mockResponse: AuthResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      service.setRefreshToken(refreshToken);

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.getToken()).toBe('new-access-token');
      });

      const req = httpTesting.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should clear tokens on refresh failure', () => {
      service.setToken('old-token');
      service.setRefreshToken('refresh-token');

      service.refreshToken().subscribe({
        error: () => {
          expect(service.getToken()).toBeNull();
          expect(service.getRefreshToken()).toBeNull();
        }
      });

      const req = httpTesting.expectOne('/api/auth/refresh');
      req.error(new ProgressEvent('error'));
    });
  });
});
```

## Best Practices de Testing

1. **Cleanup**: Siempre limpiar después de cada test
2. **Verify**: Usar `httpTesting.verify()` para detectar requests pendientes
3. **Spies**: Usar spies para verificar llamadas a servicios
4. **FakeAsync**: Usar `fakeAsync` y `tick` para tests con delays
5. **Isolation**: Testear cada interceptor de forma aislada
6. **Integration**: Testear combinaciones de interceptores
7. **Coverage**: Asegurar cobertura de todos los casos de error
8. **Mocks**: Mockear dependencias externas

## Comandos de Testing

```bash
# Run tests
ng test

# Run with coverage
ng test --code-coverage

# Run specific test file
ng test --include='**/*auth.interceptor.spec.ts'

# Watch mode
ng test --watch
```
