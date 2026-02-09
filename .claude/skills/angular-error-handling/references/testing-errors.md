# Testing Error Handling

Guía completa para testing de error handling en Angular.

## 1. Testing Global ErrorHandler

```typescript
describe('GlobalErrorHandler', () => {
  let errorHandler: GlobalErrorHandler;
  let errorLogger: jasmine.SpyObj<ErrorLoggingService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const errorLoggerSpy = jasmine.createSpyObj('ErrorLoggingService', ['logError']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: ErrorLoggingService, useValue: errorLoggerSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
    errorLogger = TestBed.inject(ErrorLoggingService) as jasmine.SpyObj<ErrorLoggingService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  it('should handle error and log it', () => {
    const error = new Error('Test error');

    errorHandler.handleError(error);

    expect(errorLogger.logError).toHaveBeenCalled();
    expect(toastService.error).toHaveBeenCalled();
  });

  it('should categorize network errors correctly', () => {
    const networkError = { status: 0, message: 'Network error' };

    errorHandler.handleError(networkError);

    const loggedError = errorLogger.logError.calls.mostRecent().args[0];
    expect(loggedError.category).toBe(ErrorCategory.NETWORK);
  });
});
```

## 2. Testing HTTP Error Interceptor

```typescript
describe('httpErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['error', 'warning']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show toast on 404 error', () => {
    httpClient.get('/api/data').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(toastService.warning).toHaveBeenCalled();
  });

  it('should show toast on 500 error', () => {
    httpClient.get('/api/data').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(toastService.error).toHaveBeenCalled();
  });

  it('should handle network error', () => {
    httpClient.get('/api/data').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/data');
    req.error(new ProgressEvent('Network error'), { status: 0 });

    expect(toastService.error).toHaveBeenCalledWith(
      jasmine.stringContaining('connect'),
      'Connection Error'
    );
  });
});
```

## 3. Testing ToastService

```typescript
describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should add toast to queue', () => {
    service.success('Test message');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.toasts()[0].type).toBe(ToastType.SUCCESS);
  });

  it('should auto-dismiss toast after duration', fakeAsync(() => {
    service.success('Test message', undefined, 2000);

    expect(service.toasts().length).toBe(1);

    tick(2000);

    expect(service.toasts().length).toBe(0);
  }));

  it('should limit max toasts', () => {
    for (let i = 0; i < 10; i++) {
      service.info(`Message ${i}`);
    }

    expect(service.toasts().length).toBeLessThanOrEqual(5);
  });

  it('should dismiss specific toast', () => {
    service.success('Message 1');
    service.error('Message 2');

    const firstToastId = service.toasts()[0].id;
    service.dismiss(firstToastId);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Message 2');
  });
});
```

## 4. Testing Retry Logic

```typescript
describe('retryWithBackoff', () => {
  it('should retry failed requests with backoff', fakeAsync(() => {
    let callCount = 0;
    const observable = defer(() => {
      callCount++;
      if (callCount < 3) {
        return throwError(() => new Error('Fail'));
      }
      return of('Success');
    });

    observable.pipe(
      retryWithBackoff({ count: 3, delay: 1000, backoff: true })
    ).subscribe();

    tick(1000); // First retry after 1s
    tick(2000); // Second retry after 2s
    tick(4000); // Third retry after 4s

    expect(callCount).toBe(3);
  }));

  it('should not retry more than max count', fakeAsync(() => {
    let callCount = 0;
    const observable = defer(() => {
      callCount++;
      return throwError(() => new Error('Fail'));
    });

    observable.pipe(
      retryWithBackoff({ count: 2, delay: 1000 })
    ).subscribe({
      error: () => {}
    });

    tick(5000);

    expect(callCount).toBe(3); // Original + 2 retries
  }));
});
```

## 5. Testing ErrorMapper

```typescript
describe('ErrorMapper', () => {
  it('should return user-friendly message for 404', () => {
    const error = { status: 404 };
    const message = ErrorMapper.getUserFriendlyMessage(error);

    expect(message).toContain('not found');
  });

  it('should categorize network errors', () => {
    const error = { status: 0 };
    const category = ErrorMapper.categorizeError(error);

    expect(category).toBe(ErrorCategory.NETWORK);
  });

  it('should sanitize sensitive data', () => {
    const error = {
      password: 'secret123',
      apiKey: 'key-abc',
      data: {
        token: 'token-xyz'
      }
    };

    const sanitized = ErrorMapper.sanitizeError(error);

    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.data.token).toBe('[REDACTED]');
  });
});
```

## 6. Testing Error Components

### Toast Component

```typescript
describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should display toasts from service', () => {
    toastService.success('Test success');
    toastService.error('Test error');
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(toastElements.length).toBe(2);
  });

  it('should remove toast on dismiss', () => {
    toastService.success('Test message');
    fixture.detectChanges();

    const dismissBtn = fixture.nativeElement.querySelector('[aria-label="Dismiss"]');
    dismissBtn.click();
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(toastElements.length).toBe(0);
  });
});
```

### FallbackUI Component

```typescript
describe('FallbackUIComponent', () => {
  let component: FallbackUIComponent;
  let fixture: ComponentFixture<FallbackUIComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FallbackUIComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FallbackUIComponent);
    component = fixture.componentInstance;
  });

  it('should display error code', () => {
    component.errorCode = '404';
    fixture.detectChanges();

    const errorCode = fixture.nativeElement.querySelector('h1');
    expect(errorCode.textContent).toContain('404');
  });

  it('should reload on retry', () => {
    spyOn(window.location, 'reload');

    component.retry();

    expect(window.location.reload).toHaveBeenCalled();
  });
});
```

## 7. E2E Error Testing

```typescript
// Cypress E2E tests
describe('Error Handling', () => {
  it('should show toast on network error', () => {
    cy.intercept('GET', '/api/data', {
      forceNetworkError: true
    }).as('getData');

    cy.visit('/dashboard');

    cy.get('[role="alert"]').should('contain', 'connection');
  });

  it('should show 404 page for invalid route', () => {
    cy.visit('/invalid-page');

    cy.contains('404').should('be.visible');
    cy.contains('not found').should('be.visible');
  });

  it('should retry failed request', () => {
    let attempts = 0;

    cy.intercept('GET', '/api/data', (req) => {
      attempts++;
      if (attempts < 3) {
        req.reply({ statusCode: 500 });
      } else {
        req.reply({ data: [] });
      }
    }).as('getData');

    cy.visit('/dashboard');

    cy.wait('@getData');
    cy.wait('@getData');
    cy.wait('@getData');

    cy.get('[data-testid="data-list"]').should('exist');
  });
});
```

## Best Practices

1. **Mock Services**: Siempre usar mocks para servicios externos
2. **Error Scenarios**: Probar todos los códigos de error HTTP
3. **Timeout**: Usar fakeAsync para testear delays y timeouts
4. **UI Feedback**: Verificar que se muestre feedback al usuario
5. **Recovery**: Testear lógica de recuperación y retry
6. **Sanitization**: Verificar que datos sensibles se sanitizan
7. **E2E**: Incluir tests end-to-end para flows críticos
8. **Coverage**: Apuntar a >80% coverage en error handling
