# Angular Testing Patterns Skill

Guía completa de testing para aplicaciones Angular standalone con Jest o Jasmine/Karma.

## 📁 Estructura

```
angular-testing-patterns/
├── SKILL.md                              # Skill principal con toda la documentación
├── README.md                             # Este archivo
└── references/                           # Material de referencia adicional
    ├── jasmine-karma-config.md           # Configuración de Jasmine + Karma
    └── advanced-testing-examples.md      # Ejemplos avanzados de testing
```

## 🚀 Contenido del Skill

### 1. Configuraciones Incluidas

- ✅ **Jest Setup** - Configuración completa con preset-angular
- ✅ **Jasmine + Karma** - Configuración alternativa tradicional
- ✅ **Coverage Thresholds** - Global y por directorio
- ✅ **CI/CD Integration** - GitHub Actions workflow
- ✅ **Path Mappings** - Aliases para imports en tests
- ✅ **Test Scripts** - npm scripts completos

### 2. Patrones de Testing Incluidos

#### Testing de Componentes
- ✅ Componentes standalone con OnPush
- ✅ Input/Output bindings
- ✅ Computed signals y memoization
- ✅ DOM rendering y queries
- ✅ Event handlers y user interactions
- ✅ Change detection behavior
- ✅ Componentes con dependencias
- ✅ Error y loading states

#### Testing de Servicios
- ✅ HTTP mocking con HttpClientTestingModule
- ✅ GET, POST, PUT, DELETE requests
- ✅ Error handling y retry logic
- ✅ Request headers verification
- ✅ Multiple concurrent requests
- ✅ Caching behavior

#### Testing de Formularios
- ✅ Reactive Forms validation
- ✅ Required fields
- ✅ Email y pattern validators
- ✅ Form submission flow
- ✅ Dynamic form updates
- ✅ Form reset
- ✅ Error messages display

#### Testing de Guards y Routing
- ✅ AuthGuard implementation
- ✅ Role-based guards
- ✅ Redirect logic
- ✅ Query params handling
- ✅ Router integration tests

#### Testing de Pipes y Directivas
- ✅ Pure pipes testing
- ✅ Transform methods
- ✅ Edge cases (null, undefined)
- ✅ Directive with test host
- ✅ DOM manipulation
- ✅ Event handlers

#### Testing de Signals
- ✅ Writable signals
- ✅ Computed signals memoization
- ✅ Signal effects
- ✅ Signal updates
- ✅ Store patterns

#### Testing de Interceptors
- ✅ JWT interceptor
- ✅ Authorization headers
- ✅ Multiple requests handling
- ✅ Token injection

#### Async Testing
- ✅ fakeAsync + tick
- ✅ flush() patterns
- ✅ done() callback
- ✅ Debounce testing
- ✅ Promise handling
- ✅ Observable streams
- ✅ Delayed responses

### 3. Testing Utilities

- ✅ **Test Fixtures** - Reusable test data
- ✅ **Test Builders** - Builder pattern for objects
- ✅ **Mock Services** - Service mocks reutilizables
- ✅ **Component Harness** - CDK testing abstraction
- ✅ **Custom Matchers** - Jasmine custom matchers

### 4. Material de Referencia

#### `jasmine-karma-config.md`
- Karma configuration completa
- Jasmine matchers reference
- Spy objects patterns
- Custom matchers creation
- Jasmine clock utilities
- Migration guide Jest ↔ Jasmine

#### `advanced-testing-examples.md`
- Integration tests
- RxJS marble testing
- Router integration tests
- LocalStorage mocking
- Window/Document mocking
- IntersectionObserver mocking
- Performance testing
- Memory leak detection
- Accessibility testing
- Visual regression setup
- Snapshot testing

## 📊 Coverage Goals

| Categoría | Target | Prioridad |
|-----------|--------|-----------|
| Components | 80-90% | ⭐⭐⭐⭐⭐ |
| Services | 90-100% | ⭐⭐⭐⭐⭐ |
| Guards | 90-100% | ⭐⭐⭐⭐⭐ |
| Pipes | 100% | ⭐⭐⭐⭐ |
| Interceptors | 90-100% | ⭐⭐⭐⭐⭐ |
| Utilities | 100% | ⭐⭐⭐⭐ |

## 🎯 Cuándo Usar Este Skill

Invocar cuando se necesite:

- Escribir unit tests para componentes standalone
- Test HTTP calls con HttpClientTestingModule
- Testing de formularios reactivos
- Testing de guards y routing
- Testing de pipes y directivas
- Integration tests entre componentes
- Testing de interceptors HTTP
- Testing de signals y computed signals
- Mocking de dependencias
- Async testing (fakeAsync, tick)
- TestBed configuration
- Component harness patterns
- Coverage configuration
- CI/CD setup para tests

## 💡 Quick Start

### Ejemplo 1: Test de Componente Básico

```typescript
describe('UserCardComponent', () => {
  let fixture: ComponentFixture<UserCardComponent>;
  let component: UserCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });

  it('should display user name', () => {
    fixture.componentRef.setInput('user', { name: 'John' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('John');
  });
});
```

### Ejemplo 2: Test de Servicio con HTTP

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch users', () => {
    const mockUsers = [{ id: '1', name: 'John' }];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

### Ejemplo 3: Async Testing

```typescript
it('should debounce search', fakeAsync(() => {
  const spy = jasmine.createSpy('search');

  component.onSearchInput('a');
  tick(100);
  component.onSearchInput('ab');
  tick(100);
  component.onSearchInput('abc');
  tick(300); // Wait for debounce

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith('abc');
}));
```

## 📚 Testing Frameworks

### Jest (Recomendado)

**Pros:**
- ⚡ Más rápido (Node-based)
- 📸 Snapshot testing built-in
- 🔄 Better watch mode
- 🎭 Auto-mocking
- 💯 Coverage built-in

**Setup:**
```bash
npm install --save-dev jest @types/jest jest-preset-angular
npm install --save-dev @testing-library/angular
```

### Jasmine + Karma (Tradicional)

**Pros:**
- 📦 Built-in con Angular CLI
- 🌐 Browser-based testing
- 🔧 No setup needed
- 📖 Más documentación

**Setup:**
Ya incluido en proyectos Angular nuevos.

## 🔧 Comandos de Testing

```bash
# Jest
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:ci           # CI mode
npm run test:changed      # Only changed files
npm run test:debug        # Debug mode

# Jasmine + Karma
ng test                   # Run tests
ng test --code-coverage   # With coverage
ng test --watch=false     # Single run
```

## ✅ Best Practices Checklist

### General
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] One assertion concept per test
- [ ] Clear and descriptive test names
- [ ] Use beforeEach for common setup
- [ ] Clean up after tests (afterEach)
- [ ] Test edge cases and errors
- [ ] Mock external dependencies
- [ ] Test behavior, not implementation
- [ ] Keep tests fast and independent

### Components
- [ ] Test inputs and outputs
- [ ] Test DOM rendering
- [ ] Test user interactions
- [ ] Test computed signals
- [ ] Test change detection
- [ ] Test loading/error states

### Services
- [ ] Test all public methods
- [ ] Mock HTTP with HttpClientTestingModule
- [ ] Test error handling
- [ ] Verify request headers
- [ ] Verify httpMock.verify() in afterEach

### Async
- [ ] Use fakeAsync for time control
- [ ] Use tick() to advance time
- [ ] Test debounce/throttle
- [ ] Test promise resolution
- [ ] Test observable streams

## 📝 AAA Pattern (Arrange, Act, Assert)

```typescript
it('should do something', () => {
  // Arrange - Setup test data
  const user = { id: '1', name: 'John' };
  fixture.componentRef.setInput('user', user);

  // Act - Perform action
  component.doSomething();
  fixture.detectChanges();

  // Assert - Verify result
  expect(component.result()).toBe(expectedValue);
});
```

## 🚫 Testing Anti-Patterns

### ❌ DON'T
- Test private methods
- Test implementation details
- Use fragile selectors
- Have flaky tests
- Share state between tests
- Test framework internals

### ✅ DO
- Test public API
- Test user behavior
- Use semantic selectors
- Have deterministic tests
- Isolate test cases
- Test your code

## 📖 Recursos Adicionales

### Documentación Oficial
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Jest Documentation](https://jestjs.io/)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Testing Library](https://testing-library.com/angular)

### Tools
- [Angular DevTools](https://angular.dev/tools/devtools)
- [Karma](https://karma-runner.github.io/)
- [Codecov](https://codecov.io/)

## 🤝 Integración con Otros Skills

Este skill se complementa bien con:

- `angular-core-setup` - Configuración inicial del proyecto
- `angular-performance` - Testing de optimizaciones
- `angular-error-handling` - Testing de error scenarios
- `angular-state-management` - Testing de signals y stores

## 📖 Cómo Usar el Skill

Simplemente menciona en tus prompts:

- "Necesito tests para este componente"
- "Cómo testear un servicio con HTTP"
- "Implementa tests para este guard"
- "Agrega tests para este formulario reactivo"
- "Configura Jest para mi proyecto Angular"

Claude Code cargará automáticamente este skill y te proporcionará los tests completos.

---

**🎯 Resultado esperado:** Suite de tests robusta con 80%+ coverage, tests rápidos, y confianza en deployments.
