# Testing Authentication - Angular JWT Auth

Guía completa para testing de componentes y servicios de autenticación.

## 1. Testing AuthService

### Setup y Mocks

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  const mockAuthResponse = {
    success: true,
    data: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 900,
      tokenType: 'Bearer' as const,
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    }
  };

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'saveTokens',
      'getAccessToken',
      'getRefreshToken',
      'clearTokens',
      'isAccessTokenValid',
      'isRefreshTokenValid'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya requests pendientes
  });

  describe('login', () => {
    it('should login successfully and save tokens', (done) => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      };

      service.login(credentials).subscribe(response => {
        expect(response.success).toBe(true);
        expect(tokenService.saveTokens).toHaveBeenCalledWith(
          'mock-access-token',
          'mock-refresh-token',
          true
        );
        expect(service.isAuthenticated()).toBe(true);
        expect(service.currentUser()?.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/auth/login'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      service.login(credentials).subscribe({
        error: error => {
          expect(error.status).toBe(401);
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/auth/login'));
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should set loading state during login', (done) => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      expect(service.isLoading()).toBe(false);

      service.login(credentials).subscribe(() => {
        expect(service.isLoading()).toBe(false);
        done();
      });

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(req => req.url.includes('/auth/login'));
      req.flush(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should clear tokens and navigate to login', () => {
      service.logout();

      expect(tokenService.clearTokens).toHaveBeenCalled();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should notify backend on logout', () => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

      service.logout();

      const req = httpMock.expectOne(req => req.url.includes('/auth/logout'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
      req.flush({});
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', (done) => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

      const mockRefreshResponse = {
        accessToken: 'new-access-token',
        expiresIn: 900
      };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockRefreshResponse);
        expect(tokenService.updateAccessToken).toHaveBeenCalledWith('new-access-token');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/auth/refresh'));
      expect(req.request.method).toBe('POST');
      req.flush(mockRefreshResponse);
    });

    it('should logout on refresh failure', (done) => {
      tokenService.getRefreshToken.and.returnValue('expired-refresh-token');

      service.refreshToken().subscribe(response => {
        expect(response).toBeNull();
        expect(tokenService.clearTokens).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/auth/refresh'));
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
```

## 2. Testing Components

### LoginComponent Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = {
      snapshot: {
        queryParams: {}
      }
    };

    authServiceSpy.isLoading = jasmine.createSpy().and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();

    emailControl?.setValue('valid@example.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should validate password min length', () => {
    const passwordControl = component.loginForm.get('password');

    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBeTrue();

    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBeFalse();
  });

  it('should call authService.login on valid submit', () => {
    const mockResponse = {
      success: true,
      data: { /* mock data */ }
    };

    authService.login.and.returnValue(of(mockResponse));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    });
  });

  it('should navigate to dashboard on successful login', () => {
    const mockResponse = {
      success: true,
      data: { /* mock data */ }
    };

    authService.login.and.returnValue(of(mockResponse));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on login failure', () => {
    const mockError = {
      error: {
        message: 'Invalid credentials'
      }
    };

    authService.login.and.returnValue(throwError(() => mockError));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrong-password',
      rememberMe: false
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    component.loginForm.setValue({
      email: 'invalid-email',
      password: '123',
      rememberMe: false
    });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component.loginForm.get('email')?.touched).toBeTrue();
    expect(component.loginForm.get('password')?.touched).toBeTrue();
  });
});
```

## 3. Testing Guards

### AuthGuard Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';
import { signal } from '@angular/core';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    route = {} as ActivatedRouteSnapshot;
    state = { url: '/dashboard' } as RouterStateSnapshot;
  });

  it('should allow access when authenticated', () => {
    authService.isAuthenticated = signal(true) as any;

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect when not authenticated', () => {
    authService.isAuthenticated = signal(false) as any;

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/dashboard' } }
    );
  });
});
```

## 4. Testing Interceptors

### JWT Interceptor Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { TokenService } from '@core/services/token.service';

describe('jwtInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let tokenService: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'getAccessToken',
      'getRefreshToken',
      'isRefreshTokenValid'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenService, useValue: tokenServiceSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header with token', () => {
    tokenService.getAccessToken.and.returnValue('mock-access-token');

    httpClient.get('/api/protected').subscribe();

    const req = httpMock.expectOne('/api/protected');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-access-token');
    req.flush({});
  });

  it('should not add Authorization header for public endpoints', () => {
    httpClient.post('/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should handle 401 and attempt token refresh', () => {
    tokenService.getAccessToken.and.returnValue('expired-token');
    tokenService.getRefreshToken.and.returnValue('refresh-token');
    tokenService.isRefreshTokenValid.and.returnValue(true);

    httpClient.get('/api/protected').subscribe({
      next: () => {},
      error: () => {}
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Esperar refresh request
    const refreshReq = httpMock.expectOne(req => req.url.includes('/auth/refresh'));
    refreshReq.flush({ accessToken: 'new-token', expiresIn: 900 });

    // Retry request original
    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ data: 'success' });
  });
});
```

## 5. Integration Tests

### E2E Login Flow

```typescript
describe('Authentication Flow', () => {
  it('should complete full login flow', () => {
    // 1. Visitar página de login
    cy.visit('/auth/login');

    // 2. Llenar formulario
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.get('#rememberMe').check();

    // 3. Submit
    cy.get('button[type="submit"]').click();

    // 4. Verificar navegación a dashboard
    cy.url().should('include', '/dashboard');

    // 5. Verificar que el token está en localStorage
    cy.window().then((window) => {
      const token = window.localStorage.getItem('access_token');
      expect(token).to.not.be.null;
    });

    // 6. Verificar que el usuario está autenticado
    cy.get('[data-testid="user-menu"]').should('contain', 'Test User');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/auth/login');

    cy.get('#email').type('test@example.com');
    cy.get('#password').type('wrong-password');
    cy.get('button[type="submit"]').click();

    cy.get('[role="alert"]').should('contain', 'Invalid credentials');
    cy.url().should('include', '/auth/login');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('test@example.com', 'password123');

    // Logout
    cy.get('[data-testid="logout-button"]').click();

    // Verify redirect to login
    cy.url().should('include', '/auth/login');

    // Verify token is cleared
    cy.window().then((window) => {
      const token = window.localStorage.getItem('access_token');
      expect(token).to.be.null;
    });
  });
});
```

## Best Practices

1. **Mock Dependencies**: Siempre usar spies para servicios externos
2. **Test Loading States**: Verificar que isLoading cambia correctamente
3. **Test Error Handling**: Probar casos de error y success
4. **Test Form Validation**: Validar cada campo y el form completo
5. **Isolate Tests**: Cada test debe ser independiente
6. **Clean Up**: Usar afterEach para limpiar mocks
7. **Integration Tests**: Probar flows completos con Cypress
8. **Coverage**: Apuntar a >80% coverage en código crítico
9. **Test Guards**: Verificar rutas protegidas y redirects
10. **Test Interceptors**: Verificar que headers se agregan correctamente
