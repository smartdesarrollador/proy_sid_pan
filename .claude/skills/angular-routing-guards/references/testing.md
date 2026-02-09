# Testing Guards y Resolvers en Angular

Guía completa para testing de guards funcionales, resolvers y routing en Angular.

## Setup de Testing

```typescript
// src/app/core/guards/auth.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    // Create spies
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticatedSync']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Create mock route and state
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/protected' } as RouterStateSnapshot;
  });

  it('should allow access when user is authenticated', () => {
    authService.isAuthenticatedSync.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    authService.isAuthenticatedSync.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/protected' } }
    );
  });
});
```

## Testing RoleGuard

```typescript
// src/app/core/guards/role.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserRoles']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    route = {
      data: {}
    } as any;
    state = { url: '/admin' } as RouterStateSnapshot;
  });

  it('should allow access when no roles required', () => {
    route.data = {}; // No roles data

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    route.data = { roles: ['admin'] };
    authService.getUserRoles.and.returnValue(['admin', 'user']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access when user lacks required role', () => {
    route.data = { roles: ['admin'] };
    authService.getUserRoles.and.returnValue(['user']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should allow access when user has any of multiple required roles', () => {
    route.data = { roles: ['admin', 'manager'] };
    authService.getUserRoles.and.returnValue(['manager']);

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(true);
  });
});
```

## Testing CanDeactivate Guard

```typescript
// src/app/core/guards/can-deactivate.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { canDeactivateGuard } from './can-deactivate.guard';
import { CanComponentDeactivate } from './can-deactivate.interface';
import { of } from 'rxjs';

describe('canDeactivateGuard', () => {
  let component: jasmine.SpyObj<CanComponentDeactivate>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    component = jasmine.createSpyObj('CanComponentDeactivate', ['canDeactivate']);
  });

  it('should allow navigation when component allows it', (done) => {
    component.canDeactivate.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      canDeactivateGuard(component, {} as any, {} as any, {} as any)
    );

    expect(result).toBe(true);
    done();
  });

  it('should prevent navigation when component prevents it', (done) => {
    component.canDeactivate.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      canDeactivateGuard(component, {} as any, {} as any, {} as any)
    );

    expect(result).toBe(false);
    done();
  });

  it('should handle Observable return value', (done) => {
    component.canDeactivate.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(() =>
      canDeactivateGuard(component, {} as any, {} as any, {} as any)
    ) as any;

    result.subscribe((value: boolean) => {
      expect(value).toBe(true);
      done();
    });
  });

  it('should handle Promise return value', async () => {
    component.canDeactivate.and.returnValue(Promise.resolve(true));

    const result = TestBed.runInInjectionContext(() =>
      canDeactivateGuard(component, {} as any, {} as any, {} as any)
    ) as Promise<boolean>;

    const value = await result;
    expect(value).toBe(true);
  });

  it('should return true when component has no canDeactivate method', () => {
    const componentWithoutMethod = {} as CanComponentDeactivate;

    const result = TestBed.runInInjectionContext(() =>
      canDeactivateGuard(componentWithoutMethod, {} as any, {} as any, {} as any)
    );

    expect(result).toBe(true);
  });
});
```

## Testing Resolvers

```typescript
// src/app/core/resolvers/user.resolver.spec.ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { userResolver } from './user.resolver';
import { UserService } from '../services/user.service';
import { User } from '@/shared/models/user.model';

describe('userResolver', () => {
  let userService: jasmine.SpyObj<UserService>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    roles: ['user'],
    permissions: []
  };

  beforeEach(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser']);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    });

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;

    route = {
      params: {}
    } as any;
    state = {} as RouterStateSnapshot;
  });

  it('should resolve user when id is present', (done) => {
    route.params = { id: '1' };
    userService.getUser.and.returnValue(of(mockUser));

    const result = TestBed.runInInjectionContext(() =>
      userResolver(route, state)
    ) as any;

    result.subscribe((user: User | null) => {
      expect(user).toEqual(mockUser);
      expect(userService.getUser).toHaveBeenCalledWith('1');
      done();
    });
  });

  it('should return null when id is not present', () => {
    route.params = {};

    const result = TestBed.runInInjectionContext(() =>
      userResolver(route, state)
    );

    expect(result).toBeNull();
    expect(userService.getUser).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', (done) => {
    route.params = { id: '1' };
    userService.getUser.and.returnValue(
      throwError(() => new Error('User not found'))
    );

    const result = TestBed.runInInjectionContext(() =>
      userResolver(route, state)
    ) as any;

    result.subscribe((user: User | null) => {
      expect(user).toBeNull();
      done();
    });
  });
});
```

## Testing Custom Preloading Strategy

```typescript
// src/app/core/strategies/custom-preload.strategy.spec.ts
import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { of } from 'rxjs';
import { CustomPreloadStrategy } from './custom-preload.strategy';

describe('CustomPreloadStrategy', () => {
  let strategy: CustomPreloadStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomPreloadStrategy]
    });

    strategy = TestBed.inject(CustomPreloadStrategy);
  });

  it('should not preload when preload is false', (done) => {
    const route: Route = {
      path: 'test',
      data: { preload: false }
    };
    const load = jasmine.createSpy('load').and.returnValue(of(null));

    strategy.preload(route, load).subscribe(() => {
      expect(load).not.toHaveBeenCalled();
      done();
    });
  });

  it('should preload immediately when priority is high', (done) => {
    const route: Route = {
      path: 'test',
      data: { preload: 'high' }
    };
    const load = jasmine.createSpy('load').and.returnValue(of(null));

    const startTime = Date.now();

    strategy.preload(route, load).subscribe(() => {
      const elapsed = Date.now() - startTime;
      expect(load).toHaveBeenCalled();
      expect(elapsed).toBeLessThan(100); // Nearly immediate
      done();
    });
  });

  it('should preload with delay when priority is medium', (done) => {
    const route: Route = {
      path: 'test',
      data: { preload: 'medium' }
    };
    const load = jasmine.createSpy('load').and.returnValue(of(null));

    const startTime = Date.now();

    strategy.preload(route, load).subscribe(() => {
      const elapsed = Date.now() - startTime;
      expect(load).toHaveBeenCalled();
      expect(elapsed).toBeGreaterThanOrEqual(1900); // ~2 seconds
      done();
    });
  }, 3000);

  it('should not preload when no preload data is present', (done) => {
    const route: Route = {
      path: 'test',
      data: {}
    };
    const load = jasmine.createSpy('load').and.returnValue(of(null));

    strategy.preload(route, load).subscribe(() => {
      expect(load).not.toHaveBeenCalled();
      done();
    });
  });
});
```

## Integration Testing con RouterTestingHarness

```typescript
// src/app/features/users/users-routing.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './users.routes';
import { AuthService } from '@/core/services/auth.service';
import { UserService } from '@/core/services/user.service';
import { of } from 'rxjs';

describe('Users Routing Integration', () => {
  let harness: RouterTestingHarness;
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticatedSync',
      'getUserRoles'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'getUser'
    ]);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should navigate to users list when authenticated', async () => {
    authService.isAuthenticatedSync.and.returnValue(true);
    authService.getUserRoles.and.returnValue(['admin']);
    userService.getUsers.and.returnValue(of([]));

    harness = await RouterTestingHarness.create('/users');

    expect(harness.routeNativeElement?.tagName).toBe('APP-USERS-LIST');
  });

  it('should redirect to login when not authenticated', async () => {
    authService.isAuthenticatedSync.and.returnValue(false);

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    harness = await RouterTestingHarness.create('/users');

    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      jasmine.objectContaining({
        queryParams: { returnUrl: '/users' }
      })
    );
  });

  it('should block access to create page without admin role', async () => {
    authService.isAuthenticatedSync.and.returnValue(true);
    authService.getUserRoles.and.returnValue(['user']); // Not admin

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    harness = await RouterTestingHarness.create('/users/create');

    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });
});
```

## Testing con Mock Router

```typescript
// src/app/features/auth/login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthStore } from '@/core/stores/auth.store';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authStore: jasmine.SpyObj<AuthStore>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authStoreSpy = jasmine.createSpyObj('AuthStore', ['login'], {
      isLoggingIn: jasmine.createSpy().and.returnValue(false),
      isAuthenticated: jasmine.createSpy().and.returnValue(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    activatedRoute = {
      queryParams: of({ returnUrl: '/dashboard' })
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    authStore = TestBed.inject(AuthStore) as jasmine.SpyObj<AuthStore>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: ''
    });
  });

  it('should set returnUrl from query params', () => {
    expect(component['returnUrl']).toBe('/dashboard');
  });

  it('should login successfully and navigate to returnUrl', () => {
    authStore.login.and.returnValue(of({} as any));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(authStore.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should handle login error', () => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authStore.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: ''
    });

    component.onSubmit();

    expect(authStore.login).not.toHaveBeenCalled();
  });
});
```

## E2E Testing con Playwright

```typescript
// e2e/guards.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Route Guards', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should preserve returnUrl after redirect', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*returnUrl=%2Fdashboard/);
  });

  test('should allow access to protected route after login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should block admin routes for non-admin users', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to access admin route
    await page.goto('/admin');
    await expect(page).toHaveURL('/forbidden');
  });

  test('should prompt before leaving unsaved changes', async ({ page }) => {
    // Setup dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss();
    });

    await page.goto('/users/create');
    await page.fill('input[name="name"]', 'Test User');

    // Try to navigate away
    await page.click('a[href="/dashboard"]');

    // Should still be on form page
    await expect(page).toHaveURL('/users/create');
  });
});
```

## Best Practices para Testing

### 1. Mock de Servicios
Siempre usa spies para servicios en tests unitarios:
```typescript
const authServiceSpy = jasmine.createSpyObj('AuthService', ['method1', 'method2']);
```

### 2. TestBed.runInInjectionContext
Para functional guards, usa `runInInjectionContext`:
```typescript
const result = TestBed.runInInjectionContext(() => authGuard(route, state));
```

### 3. Async Testing
Usa `done()` callback o `async/await` para tests asíncronos:
```typescript
it('should resolve data', (done) => {
  resolver(route, state).subscribe(data => {
    expect(data).toBeDefined();
    done();
  });
});
```

### 4. Coverage
Apunta a >80% de coverage en guards y resolvers:
```bash
ng test --code-coverage
```

### 5. Integration vs Unit
- **Unit tests**: Guards individuales, servicios aislados
- **Integration tests**: RouterTestingHarness para flujos completos
- **E2E tests**: Playwright para user flows reales

## Summary

Esta guía proporciona:
- Tests unitarios para guards funcionales
- Tests de resolvers con manejo de errores
- Integration testing con RouterTestingHarness
- E2E testing con Playwright
- Mocking de servicios y router
- Best practices de testing en Angular

Todos los tests usan Jasmine/Karma (default de Angular) y están actualizados para Angular 19+.
