---
name: angular-testing-patterns
description: >
  Patrones completos de testing para Angular standalone applications con Jest o Jasmine.
  Usar cuando se necesite implementar unit tests para componentes, servicios con HTTP mocking,
  testing de formularios reactivos, routing guards, pipes, directivas, interceptors,
  signals, integration tests, async testing (fakeAsync, tick), TestBed configuration,
  component harness patterns, mocking de dependencias, coverage configuration,
  o cualquier tipo de testing en Angular. Incluye ejemplos .spec.ts completos,
  testing utilities, fixtures, test data builders, AAA pattern, y best practices
  para proyectos Angular 19+ production-ready con alta cobertura.
---

# Angular Testing Patterns - Guía Completa de Testing

Guía enterprise-ready para testing de aplicaciones Angular standalone con Jest o Jasmine/Karma.

## 📊 Testing Coverage Goals

| Categoría | Coverage Target | Prioridad |
|-----------|----------------|-----------|
| Components | 80-90% | ⭐⭐⭐⭐⭐ |
| Services | 90-100% | ⭐⭐⭐⭐⭐ |
| Guards | 90-100% | ⭐⭐⭐⭐⭐ |
| Pipes | 100% | ⭐⭐⭐⭐ |
| Interceptors | 90-100% | ⭐⭐⭐⭐⭐ |
| Utilities | 100% | ⭐⭐⭐⭐ |

## Arquitectura del Sistema de Testing

```
testing-structure/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── user-card.component.ts
│   │   │   └── user-card.component.spec.ts
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   └── user.service.spec.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.guard.spec.ts
│   │   ├── pipes/
│   │   │   ├── custom.pipe.ts
│   │   │   └── custom.pipe.spec.ts
│   │   └── interceptors/
│   │       ├── jwt.interceptor.ts
│   │       └── jwt.interceptor.spec.ts
│   └── testing/
│       ├── test-utils.ts
│       ├── fixtures/
│       │   ├── user.fixtures.ts
│       │   └── api-response.fixtures.ts
│       ├── builders/
│       │   └── user.builder.ts
│       ├── mocks/
│       │   ├── mock-services.ts
│       │   └── mock-router.ts
│       └── harnesses/
│           └── custom-component.harness.ts
├── jest.config.js          # Jest configuration
├── karma.conf.js           # Karma configuration (if using Jasmine)
└── test-setup.ts           # Global test setup
```

---

## 1. Configuración de Jest (Recomendado)

### 1.1 Instalación de Jest

```bash
npm install --save-dev jest @types/jest jest-preset-angular
npm install --save-dev @testing-library/angular @testing-library/jest-dom
```

### 1.2 Configurar jest.config.js

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.module.ts',
    '!src/app/**/index.ts',
    '!src/app/main.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@testing/(.*)$': '<rootDir>/src/testing/$1'
  },
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$'
      }
    ]
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)']
};
```

### 1.3 Setup Jest

Crear `setup-jest.ts`:

```typescript
import 'jest-preset-angular/setup-jest';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock as any;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};

// Set test timeout
jest.setTimeout(10000);
```

### 1.4 Actualizar package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## 2. Testing de Componentes Standalone

### 2.1 Componente Simple con OnPush

Crear `src/app/components/user-card/user-card.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { UserCardComponent } from './user-card.component';

/**
 * ✅ AAA PATTERN: Arrange, Act, Assert
 *
 * Testing Checklist:
 * - Inputs are correctly set
 * - Outputs emit correct values
 * - DOM rendering matches data
 * - Computed signals calculate correctly
 * - Event handlers work properly
 */
describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;
  let compiled: HTMLElement;

  // ✅ ARRANGE: Setup before each test
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent] // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Bindings', () => {
    it('should accept user input', () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg'
      };

      // Act
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      // Assert
      expect(component.user()).toEqual(mockUser);
    });

    it('should render user data in template', () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg'
      };

      // Act
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      // Assert
      const nameElement = compiled.querySelector('.user-name');
      const emailElement = compiled.querySelector('.user-email');

      expect(nameElement?.textContent).toContain('John Doe');
      expect(emailElement?.textContent).toContain('john@example.com');
    });
  });

  describe('Output Events', () => {
    it('should emit userClicked event when card is clicked', () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg'
      };
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      let emittedUser: any;
      component.userClicked.subscribe((user: any) => {
        emittedUser = user;
      });

      // Act
      const cardElement = compiled.querySelector('.user-card') as HTMLElement;
      cardElement.click();
      fixture.detectChanges();

      // Assert
      expect(emittedUser).toEqual(mockUser);
    });
  });

  describe('Computed Signals', () => {
    it('should calculate full name correctly', () => {
      // Arrange
      const mockUser = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      // Act
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      // Assert
      expect(component.fullName()).toBe('John Doe');
    });
  });

  describe('DOM Queries', () => {
    it('should find elements using DebugElement', () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      };
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      // Act
      const nameDebugElement: DebugElement = fixture.debugElement.query(
        By.css('.user-name')
      );

      // Assert
      expect(nameDebugElement).toBeTruthy();
      expect(nameDebugElement.nativeElement.textContent).toContain('John Doe');
    });
  });

  describe('Change Detection', () => {
    it('should not update when input reference does not change (OnPush)', () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      };
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      const initialName = compiled.querySelector('.user-name')?.textContent;

      // Act - Mutate object (should NOT trigger change detection with OnPush)
      mockUser.name = 'Jane Doe';
      fixture.detectChanges();

      // Assert
      const updatedName = compiled.querySelector('.user-name')?.textContent;
      expect(updatedName).toBe(initialName); // OnPush won't detect mutation
    });

    it('should update when input reference changes (OnPush)', () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      };
      fixture.componentRef.setInput('user', mockUser);
      fixture.detectChanges();

      // Act - New object reference
      fixture.componentRef.setInput('user', { ...mockUser, name: 'Jane Doe' });
      fixture.detectChanges();

      // Assert
      const updatedName = compiled.querySelector('.user-name')?.textContent;
      expect(updatedName).toContain('Jane Doe');
    });
  });
});
```

### 2.2 Componente con Dependencias

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserService } from '@core/services/user.service';

describe('UserListComponent with Dependencies', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  // ✅ Create mock service
  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'deleteUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  describe('ngOnInit', () => {
    it('should load users on init', () => {
      // Arrange
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' }
      ];
      userService.getUsers.and.returnValue(of(mockUsers));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      expect(userService.getUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(mockUsers);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading users fails', () => {
      // Arrange
      const error = new Error('Network error');
      userService.getUsers.and.returnValue(throwError(() => error));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeTruthy();
      expect(component.users()).toEqual([]);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and reload list', () => {
      // Arrange
      const userId = '1';
      const remainingUsers = [
        { id: '2', name: 'User 2', email: 'user2@example.com' }
      ];

      userService.deleteUser.and.returnValue(of(void 0));
      userService.getUsers.and.returnValue(of(remainingUsers));

      // Act
      component.deleteUser(userId);
      fixture.detectChanges();

      // Assert
      expect(userService.deleteUser).toHaveBeenCalledWith(userId);
      expect(userService.getUsers).toHaveBeenCalled();
      expect(component.users()).toEqual(remainingUsers);
    });
  });
});
```

---

## 3. Testing de Servicios con HTTP

### 3.1 Service Testing con HttpClientTestingModule

Crear `src/app/core/services/user.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User } from '@core/models/user.model';

/**
 * ✅ HTTP TESTING PATTERN
 *
 * 1. Setup HttpClientTestingModule
 * 2. Inject HttpTestingController
 * 3. Make service call
 * 4. Expect HTTP request
 * 5. Flush response
 * 6. Verify afterEach
 */
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const API_URL = 'https://api.example.com/users';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // ✅ IMPORTANT: Verify no outstanding requests
  afterEach(() => {
    httpMock.verify();
  });

  describe('getUsers', () => {
    it('should fetch users via GET', () => {
      // Arrange
      const mockUsers: User[] = [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' }
      ];

      // Act
      service.getUsers().subscribe(users => {
        // Assert
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
      });

      // Expect HTTP request
      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('GET');

      // Flush response
      req.flush(mockUsers);
    });

    it('should handle 404 error', () => {
      // Arrange
      const errorMessage = 'Not Found';

      // Act
      service.getUsers().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(404);
          expect(error.statusText).toBe(errorMessage);
        }
      });

      // Flush error response
      const req = httpMock.expectOne(API_URL);
      req.flush(null, { status: 404, statusText: errorMessage });
    });

    it('should retry failed requests', () => {
      // Arrange
      const mockUsers: User[] = [
        { id: '1', name: 'User 1', email: 'user1@example.com' }
      ];

      // Act
      service.getUsersWithRetry().subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      // First request fails
      const req1 = httpMock.expectOne(API_URL);
      req1.flush(null, { status: 500, statusText: 'Server Error' });

      // Retry succeeds
      const req2 = httpMock.expectOne(API_URL);
      req2.flush(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should fetch single user', () => {
      // Arrange
      const userId = '1';
      const mockUser: User = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Act
      service.getUserById(userId).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      // Assert
      const req = httpMock.expectOne(`${API_URL}/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user via POST', () => {
      // Arrange
      const newUser = {
        name: 'New User',
        email: 'new@example.com'
      };
      const createdUser: User = {
        id: '3',
        ...newUser
      };

      // Act
      service.createUser(newUser).subscribe(user => {
        expect(user).toEqual(createdUser);
        expect(user.id).toBeDefined();
      });

      // Assert
      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      req.flush(createdUser);
    });
  });

  describe('updateUser', () => {
    it('should update user via PUT', () => {
      // Arrange
      const userId = '1';
      const updates = { name: 'Updated Name' };
      const updatedUser: User = {
        id: userId,
        name: 'Updated Name',
        email: 'user@example.com'
      };

      // Act
      service.updateUser(userId, updates).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      // Assert
      const req = httpMock.expectOne(`${API_URL}/${userId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user via DELETE', () => {
      // Arrange
      const userId = '1';

      // Act
      service.deleteUser(userId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      // Assert
      const req = httpMock.expectOne(`${API_URL}/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Request Headers', () => {
    it('should include authorization header', () => {
      // Arrange
      const token = 'fake-jwt-token';
      spyOn(localStorage, 'getItem').and.returnValue(token);

      // Act
      service.getUsers().subscribe();

      // Assert
      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush([]);
    });
  });
});
```

---

## 4. Testing de Formularios Reactivos

### 4.1 Testing Reactive Forms

Crear `src/app/components/user-form/user-form.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent - Reactive Forms', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.userForm.value).toEqual({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      });
    });

    it('should have all form controls', () => {
      expect(component.userForm.contains('firstName')).toBe(true);
      expect(component.userForm.contains('lastName')).toBe(true);
      expect(component.userForm.contains('email')).toBe(true);
      expect(component.userForm.contains('password')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.userForm.valid).toBe(false);
    });

    it('should validate required fields', () => {
      const firstNameControl = component.userForm.get('firstName');
      expect(firstNameControl?.hasError('required')).toBe(true);

      firstNameControl?.setValue('John');
      expect(firstNameControl?.hasError('required')).toBe(false);
    });

    it('should validate email format', () => {
      const emailControl = component.userForm.get('email');

      // Invalid email
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      // Valid email
      emailControl?.setValue('valid@example.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.userForm.get('password');

      // Too short
      passwordControl?.setValue('123');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      // Valid length
      passwordControl?.setValue('12345678');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('should show validation errors after touched', () => {
      const emailControl = component.userForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = compiled.querySelector('.email-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('valid email');
    });
  });

  describe('Form Submission', () => {
    it('should not submit when form is invalid', () => {
      spyOn(component.formSubmitted, 'emit');

      component.onSubmit();

      expect(component.formSubmitted.emit).not.toHaveBeenCalled();
    });

    it('should submit when form is valid', () => {
      // Arrange
      spyOn(component.formSubmitted, 'emit');

      component.userForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      // Act
      component.onSubmit();

      // Assert
      expect(component.formSubmitted.emit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
    });

    it('should disable submit button when form is invalid', () => {
      fixture.detectChanges();

      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial values', () => {
      // Arrange
      component.userForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      // Act
      component.resetForm();

      // Assert
      expect(component.userForm.value).toEqual({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      });
      expect(component.userForm.pristine).toBe(true);
      expect(component.userForm.untouched).toBe(true);
    });
  });

  describe('Dynamic Form Updates', () => {
    it('should enable/disable fields based on conditions', () => {
      const passwordControl = component.userForm.get('password');

      component.isEditMode.set(true);
      fixture.detectChanges();

      expect(passwordControl?.disabled).toBe(true);

      component.isEditMode.set(false);
      fixture.detectChanges();

      expect(passwordControl?.enabled).toBe(true);
    });
  });
});
```

---

## 5. Testing de Routing y Guards

### 5.1 Testing Guards

Crear `src/app/core/guards/auth.guard.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when user is authenticated', () => {
    // Arrange
    authService.isAuthenticated.and.returnValue(true);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/dashboard' } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    // Assert
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    // Arrange
    authService.isAuthenticated.and.returnValue(false);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/dashboard' } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    // Assert
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard' }
    });
  });
});
```

### 5.2 Testing Role-Based Guards

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '@core/services/auth.service';

describe('roleGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when user has required role', () => {
    // Arrange
    authService.hasRole.and.returnValue(true);

    const route = {
      data: { roles: ['admin'] }
    } as any as ActivatedRouteSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => roleGuard(route, null!));

    // Assert
    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith(['admin']);
  });

  it('should deny access when user lacks required role', () => {
    // Arrange
    authService.hasRole.and.returnValue(false);

    const route = {
      data: { roles: ['admin'] }
    } as any as ActivatedRouteSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => roleGuard(route, null!));

    // Assert
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });
});
```

---

## 6. Testing de Pipes

### 6.1 Pure Pipe Testing

Crear `src/app/shared/pipes/truncate.pipe.spec.ts`:

```typescript
import { TruncatePipe } from './truncate.pipe';

/**
 * ✅ PIPE TESTING: Simple and direct
 * No need for TestBed for pure pipes
 */
describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should truncate long text', () => {
    const text = 'This is a very long text that needs to be truncated';
    const result = pipe.transform(text, 20);

    expect(result).toBe('This is a very long...');
    expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
  });

  it('should not truncate short text', () => {
    const text = 'Short text';
    const result = pipe.transform(text, 20);

    expect(result).toBe('Short text');
  });

  it('should handle empty string', () => {
    const result = pipe.transform('', 10);
    expect(result).toBe('');
  });

  it('should handle null/undefined', () => {
    expect(pipe.transform(null as any, 10)).toBe('');
    expect(pipe.transform(undefined as any, 10)).toBe('');
  });

  it('should use default limit when not provided', () => {
    const text = 'A'.repeat(100);
    const result = pipe.transform(text);

    expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
  });
});
```

---

## 7. Testing de Directivas

### 7.1 Directiva Testing

Crear `src/app/shared/directives/highlight.directive.spec.ts`:

```typescript
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighlightDirective } from './highlight.directive';

/**
 * ✅ DIRECTIVE TESTING: Use test host component
 */
@Component({
  template: `
    <div appHighlight [highlightColor]="color">Test Content</div>
  `,
  standalone: true,
  imports: [HighlightDirective]
})
class TestHostComponent {
  color = 'yellow';
}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let divElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    divElement = fixture.debugElement.query(By.css('div'));
  });

  it('should create directive', () => {
    const directive = divElement.injector.get(HighlightDirective);
    expect(directive).toBeTruthy();
  });

  it('should highlight with default color on mouseenter', () => {
    // Act
    divElement.triggerEventHandler('mouseenter', null);
    fixture.detectChanges();

    // Assert
    const backgroundColor = divElement.nativeElement.style.backgroundColor;
    expect(backgroundColor).toBe('yellow');
  });

  it('should remove highlight on mouseleave', () => {
    // Arrange
    divElement.triggerEventHandler('mouseenter', null);
    fixture.detectChanges();

    // Act
    divElement.triggerEventHandler('mouseleave', null);
    fixture.detectChanges();

    // Assert
    const backgroundColor = divElement.nativeElement.style.backgroundColor;
    expect(backgroundColor).toBe('');
  });

  it('should use custom highlight color', () => {
    // Arrange
    component.color = 'red';
    fixture.detectChanges();

    // Act
    divElement.triggerEventHandler('mouseenter', null);
    fixture.detectChanges();

    // Assert
    const backgroundColor = divElement.nativeElement.style.backgroundColor;
    expect(backgroundColor).toBe('red');
  });
});
```

---

## 8. Testing de Signals

### 8.1 Testing Computed Signals

```typescript
import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { CartStore } from './cart.store';

describe('CartStore - Signals Testing', () => {
  let store: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartStore]
    });

    store = TestBed.inject(CartStore);
  });

  describe('Writable Signals', () => {
    it('should update items signal', () => {
      // Arrange
      const newItems = [
        { id: '1', name: 'Item 1', price: 10, quantity: 2 }
      ];

      // Act
      store.items.set(newItems);

      // Assert
      expect(store.items()).toEqual(newItems);
    });

    it('should add item to cart', () => {
      // Arrange
      const item = { id: '1', name: 'Item 1', price: 10, quantity: 1 };

      // Act
      store.addItem(item);

      // Assert
      expect(store.items()).toContain(item);
      expect(store.items().length).toBe(1);
    });
  });

  describe('Computed Signals', () => {
    it('should calculate total price', () => {
      // Arrange
      store.items.set([
        { id: '1', name: 'Item 1', price: 10, quantity: 2 },
        { id: '2', name: 'Item 2', price: 15, quantity: 1 }
      ]);

      // Act
      const total = store.totalPrice();

      // Assert
      expect(total).toBe(35); // (10 * 2) + (15 * 1)
    });

    it('should update computed when signal changes', () => {
      // Arrange
      store.items.set([
        { id: '1', name: 'Item 1', price: 10, quantity: 1 }
      ]);
      expect(store.totalPrice()).toBe(10);

      // Act
      store.items.update(items => [
        ...items,
        { id: '2', name: 'Item 2', price: 20, quantity: 1 }
      ]);

      // Assert
      expect(store.totalPrice()).toBe(30);
    });

    it('should memoize computed signal results', () => {
      // Arrange
      spyOn(console, 'log');
      store.items.set([
        { id: '1', name: 'Item 1', price: 10, quantity: 1 }
      ]);

      // Act - Call multiple times without changing signal
      const result1 = store.totalPriceWithLog();
      const result2 = store.totalPriceWithLog();
      const result3 = store.totalPriceWithLog();

      // Assert - Computation only runs once
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(console.log).toHaveBeenCalledTimes(1);
    });
  });

  describe('Signal Effects', () => {
    it('should trigger effect when signal changes', () => {
      // Arrange
      const effectSpy = jasmine.createSpy('effect');
      store.onItemsChange(effectSpy);

      // Act
      store.items.set([
        { id: '1', name: 'Item 1', price: 10, quantity: 1 }
      ]);

      // Allow effect to run
      TestBed.flushEffects();

      // Assert
      expect(effectSpy).toHaveBeenCalled();
    });
  });
});
```

---

## 9. Testing de Interceptors

### 9.1 HTTP Interceptor Testing

Crear `src/app/core/interceptors/jwt.interceptor.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { JwtInterceptor } from './jwt.interceptor';
import { AuthService } from '@core/services/auth.service';

describe('JwtInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: JwtInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    // Arrange
    const token = 'fake-jwt-token';
    authService.getToken.and.returnValue(token);

    // Act
    httpClient.get('/api/users').subscribe();

    // Assert
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);

    req.flush([]);
  });

  it('should not add Authorization header when token is null', () => {
    // Arrange
    authService.getToken.and.returnValue(null);

    // Act
    httpClient.get('/api/users').subscribe();

    // Assert
    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush([]);
  });

  it('should handle multiple requests', () => {
    // Arrange
    authService.getToken.and.returnValue('token-123');

    // Act
    httpClient.get('/api/users').subscribe();
    httpClient.get('/api/posts').subscribe();

    // Assert
    const req1 = httpMock.expectOne('/api/users');
    const req2 = httpMock.expectOne('/api/posts');

    expect(req1.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req2.request.headers.get('Authorization')).toBe('Bearer token-123');

    req1.flush([]);
    req2.flush([]);
  });
});
```

---

## 10. Async Testing Patterns

### 10.1 fakeAsync and tick

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { SearchComponent } from './search.component';
import { SearchService } from '@core/services/search.service';
import { of, delay } from 'rxjs';

/**
 * ✅ ASYNC TESTING PATTERNS
 *
 * - fakeAsync: Control time in tests
 * - tick(ms): Advance time by milliseconds
 * - flush(): Advance time to complete all async operations
 * - done(): Callback for async tests without fakeAsync
 */
describe('SearchComponent - Async Testing', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let searchService: jasmine.SpyObj<SearchService>;

  beforeEach(async () => {
    const searchServiceSpy = jasmine.createSpyObj('SearchService', ['search']);

    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    searchService = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;
  });

  describe('Debounced Search', () => {
    it('should debounce search input', fakeAsync(() => {
      // Arrange
      const results = ['result1', 'result2'];
      searchService.search.and.returnValue(of(results));

      // Act - Type multiple times
      component.onSearchInput('a');
      tick(100);
      component.onSearchInput('ab');
      tick(100);
      component.onSearchInput('abc');
      tick(300); // Wait for debounce

      // Assert - Service called only once
      expect(searchService.search).toHaveBeenCalledTimes(1);
      expect(searchService.search).toHaveBeenCalledWith('abc');
    }));

    it('should handle delayed API responses', fakeAsync(() => {
      // Arrange
      const results = ['result1', 'result2'];
      searchService.search.and.returnValue(
        of(results).pipe(delay(1000))
      );

      // Act
      component.search('test');

      expect(component.loading()).toBe(true);

      tick(1000); // Advance time by 1 second

      // Assert
      expect(component.loading()).toBe(false);
      expect(component.results()).toEqual(results);
    }));

    it('should handle multiple delayed operations', fakeAsync(() => {
      // Arrange
      searchService.search.and.returnValue(
        of(['results']).pipe(delay(500))
      );

      // Act
      component.search('test1');
      tick(200);
      component.search('test2');

      flush(); // Complete all pending async operations

      // Assert
      expect(searchService.search).toHaveBeenCalledTimes(2);
    }));
  });

  describe('done() callback', () => {
    it('should handle async with done callback', (done) => {
      // Arrange
      const results = ['result1'];
      searchService.search.and.returnValue(of(results));

      // Act
      component.search('test');

      // Assert
      setTimeout(() => {
        expect(component.results()).toEqual(results);
        done(); // Signal test completion
      }, 0);
    });
  });

  describe('Promise Testing', () => {
    it('should handle promise-based operations', fakeAsync(() => {
      // Arrange
      const promise = Promise.resolve(['data']);
      spyOn(component, 'fetchData').and.returnValue(promise);

      // Act
      component.loadData();
      tick(); // Resolve promise

      // Assert
      expect(component.data()).toEqual(['data']);
    }));
  });
});
```

---

## 11. Testing Utilities y Helpers

### 11.1 Test Fixtures

Crear `src/testing/fixtures/user.fixtures.ts`:

```typescript
import { User } from '@core/models/user.model';

/**
 * ✅ TEST FIXTURES: Reusable test data
 */
export const USER_FIXTURES = {
  john: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    active: true
  } as User,

  jane: {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'admin',
    active: true
  } as User,

  inactive: {
    id: '3',
    firstName: 'Inactive',
    lastName: 'User',
    email: 'inactive@example.com',
    role: 'user',
    active: false
  } as User
};

export const USER_LIST_FIXTURE: User[] = [
  USER_FIXTURES.john,
  USER_FIXTURES.jane,
  USER_FIXTURES.inactive
];
```

### 11.2 Test Builders

Crear `src/testing/builders/user.builder.ts`:

```typescript
import { User } from '@core/models/user.model';

/**
 * ✅ TEST BUILDER PATTERN: Flexible test data creation
 */
export class UserBuilder {
  private user: Partial<User> = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    active: true
  };

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withName(firstName: string, lastName: string): this {
    this.user.firstName = firstName;
    this.user.lastName = lastName;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRole(role: string): this {
    this.user.role = role;
    return this;
  }

  inactive(): this {
    this.user.active = false;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// Usage:
// const user = new UserBuilder()
//   .withId('123')
//   .withName('Jane', 'Doe')
//   .withRole('admin')
//   .build();
```

### 11.3 Mock Services

Crear `src/testing/mocks/mock-services.ts`:

```typescript
import { of, throwError } from 'rxjs';
import { User } from '@core/models/user.model';

/**
 * ✅ MOCK SERVICES: Reusable service mocks
 */
export class MockUserService {
  users: User[] = [];

  getUsers = jasmine.createSpy('getUsers').and.returnValue(of(this.users));

  getUserById = jasmine.createSpy('getUserById').and.callFake((id: string) => {
    const user = this.users.find(u => u.id === id);
    return user ? of(user) : throwError(() => new Error('Not found'));
  });

  createUser = jasmine.createSpy('createUser').and.callFake((user: Partial<User>) => {
    const newUser = { ...user, id: Math.random().toString() } as User;
    this.users.push(newUser);
    return of(newUser);
  });

  updateUser = jasmine.createSpy('updateUser').and.callFake((id: string, updates: Partial<User>) => {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      return of(this.users[index]);
    }
    return throwError(() => new Error('Not found'));
  });

  deleteUser = jasmine.createSpy('deleteUser').and.callFake((id: string) => {
    this.users = this.users.filter(u => u.id !== id);
    return of(void 0);
  });
}
```

---

## 12. Component Harness (Angular CDK Testing)

### 12.1 Creating Component Harness

Crear `src/testing/harnesses/user-card.harness.ts`:

```typescript
import { ComponentHarness } from '@angular/cdk/testing';

/**
 * ✅ COMPONENT HARNESS: Interact with components in tests
 *
 * Benefits:
 * - Abstraction layer over DOM
 * - Reusable across tests
 * - Type-safe component interaction
 */
export class UserCardHarness extends ComponentHarness {
  static hostSelector = 'app-user-card';

  private getNameElement = this.locatorFor('.user-name');
  private getEmailElement = this.locatorFor('.user-email');
  private getDeleteButton = this.locatorFor('button.delete-btn');
  private getAvatar = this.locatorFor('img.avatar');

  async getName(): Promise<string> {
    const element = await this.getNameElement();
    return element.text();
  }

  async getEmail(): Promise<string> {
    const element = await this.getEmailElement();
    return element.text();
  }

  async clickDelete(): Promise<void> {
    const button = await this.getDeleteButton();
    return button.click();
  }

  async getAvatarSrc(): Promise<string | null> {
    const img = await this.getAvatar();
    return img.getAttribute('src');
  }

  async isDeleteButtonDisabled(): Promise<boolean> {
    const button = await this.getDeleteButton();
    return button.getProperty<boolean>('disabled');
  }
}
```

### 12.2 Using Component Harness

```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';
import { UserCardHarness } from '@testing/harnesses/user-card.harness';

describe('UserCardComponent with Harness', () => {
  let fixture: ComponentFixture<UserCardComponent>;
  let harness: UserCardHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);

    // Create harness
    const loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(UserCardHarness);
  });

  it('should display user name', async () => {
    // Arrange
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    // Act
    const name = await harness.getName();

    // Assert
    expect(name).toBe('John Doe');
  });

  it('should trigger delete event', async () => {
    // Arrange
    spyOn(fixture.componentInstance.userDeleted, 'emit');

    const user = { id: '1', name: 'John', email: 'john@example.com' };
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    // Act
    await harness.clickDelete();

    // Assert
    expect(fixture.componentInstance.userDeleted.emit).toHaveBeenCalled();
  });
});
```

---

## 13. Coverage Configuration

### 13.1 Jest Coverage Configuration

```javascript
// jest.config.js (enhanced)
module.exports = {
  // ... previous config

  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.module.ts',
    '!src/app/**/index.ts',
    '!src/app/**/*.interface.ts',
    '!src/app/**/*.model.ts',
    '!src/app/**/*.enum.ts',
    '!src/app/main.ts'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Per-directory thresholds
    'src/app/core/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/app/core/guards/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },

  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],

  coverageDirectory: 'coverage'
};
```

### 13.2 Coverage Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:watch": "jest --coverage --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:changed": "jest --onlyChanged",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

---

## 14. CI/CD Integration

### 14.1 GitHub Actions Workflow

Crear `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true

      - name: Generate coverage badge
        uses: cicirello/jacoco-badge-generator@v2
        with:
          badges-directory: badges
          generate-branches-badge: true
          generate-summary: true
```

---

## 15. Best Practices Checklist

### ✅ General Testing Practices

- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] One assertion concept per test
- [ ] Clear and descriptive test names
- [ ] Use beforeEach for common setup
- [ ] Clean up after tests (afterEach)
- [ ] Test edge cases and error scenarios
- [ ] Mock external dependencies
- [ ] Avoid testing implementation details
- [ ] Test user behavior, not internal state
- [ ] Keep tests fast and independent

### ✅ Component Testing

- [ ] Test inputs and outputs
- [ ] Test DOM rendering
- [ ] Test user interactions
- [ ] Test computed signals
- [ ] Test change detection behavior
- [ ] Use OnPush strategy awareness
- [ ] Test error states and loading states
- [ ] Verify event emissions

### ✅ Service Testing

- [ ] Test all public methods
- [ ] Mock HTTP calls with HttpClientTestingModule
- [ ] Test error handling
- [ ] Test retry logic
- [ ] Verify request headers
- [ ] Test caching behavior
- [ ] Verify afterEach httpMock.verify()

### ✅ Async Testing

- [ ] Use fakeAsync for time control
- [ ] Use tick() to advance time
- [ ] Use flush() for all async ops
- [ ] Test debounce/throttle
- [ ] Test promise resolution
- [ ] Test observable streams

### ✅ Coverage Goals

- [ ] Components: 80-90%
- [ ] Services: 90-100%
- [ ] Guards: 90-100%
- [ ] Pipes: 100%
- [ ] Interceptors: 90-100%
- [ ] Utilities: 100%

---

## 16. Common Testing Anti-Patterns

### ❌ What NOT to Do

```typescript
// ❌ BAD: Testing implementation details
it('should call private method', () => {
  component['privateMethod']();
  expect(component['someInternalState']).toBe(true);
});

// ✅ GOOD: Test public behavior
it('should update user when save is clicked', () => {
  component.save();
  expect(component.user()).toEqual(updatedUser);
});

// ❌ BAD: Multiple assertions on different concepts
it('should do everything', () => {
  expect(component.name).toBe('John');
  expect(component.email).toBe('john@example.com');
  expect(component.age).toBe(30);
  expect(component.isActive).toBe(true);
});

// ✅ GOOD: One concept per test
it('should have correct name', () => {
  expect(component.name).toBe('John');
});

it('should have correct email', () => {
  expect(component.email).toBe('john@example.com');
});

// ❌ BAD: Fragile DOM selectors
const element = compiled.querySelector('div > span.class1.class2 > p:nth-child(3)');

// ✅ GOOD: Semantic selectors or test IDs
const element = compiled.querySelector('[data-testid="user-name"]');

// ❌ BAD: Not cleaning up subscriptions
it('should subscribe', () => {
  service.getData().subscribe(); // Memory leak!
});

// ✅ GOOD: Subscription handled
it('should get data', () => {
  service.getData().subscribe(data => {
    expect(data).toBeTruthy();
  });
});
```

---

Este skill proporciona una guía completa de testing para aplicaciones Angular standalone con todos los patrones, configuraciones y best practices necesarias para lograr alta cobertura y tests mantenibles.

**🎯 Resultado esperado:** Suite de tests robusta con 80%+ coverage, tests rápidos, y confianza en los deployments.
