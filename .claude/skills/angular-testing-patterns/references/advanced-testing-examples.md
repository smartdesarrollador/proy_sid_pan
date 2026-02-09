# Advanced Testing Examples

## Integration Tests

### Testing Component Integration

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserListContainerComponent } from './user-list-container.component';
import { UserCardComponent } from '../user-card/user-card.component';
import { UserService } from '@core/services/user.service';

/**
 * INTEGRATION TEST: Test multiple components working together
 */
describe('UserListContainerComponent Integration', () => {
  let fixture: ComponentFixture<UserListContainerComponent>;
  let httpMock: HttpTestingController;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserListContainerComponent,
        UserCardComponent
      ],
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListContainerComponent);
    compiled = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load and display users', () => {
    // Arrange
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' }
    ];

    // Act - Trigger ngOnInit
    fixture.detectChanges();

    // Expect HTTP call
    const req = httpMock.expectOne('/api/users');
    req.flush(mockUsers);
    fixture.detectChanges();

    // Assert - Check UserCard components are rendered
    const userCards = compiled.querySelectorAll('app-user-card');
    expect(userCards.length).toBe(2);

    const firstCard = userCards[0];
    expect(firstCard.textContent).toContain('User 1');
    expect(firstCard.textContent).toContain('user1@example.com');
  });

  it('should handle user deletion flow', () => {
    // Arrange
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' }
    ];

    fixture.detectChanges();

    const req1 = httpMock.expectOne('/api/users');
    req1.flush(mockUsers);
    fixture.detectChanges();

    // Act - Click delete on first user card
    const deleteButton = compiled.querySelector('.delete-btn') as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    // Handle delete API call
    const deleteReq = httpMock.expectOne('/api/users/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    // Handle reload API call
    const reloadReq = httpMock.expectOne('/api/users');
    reloadReq.flush([mockUsers[1]]);
    fixture.detectChanges();

    // Assert - Only one card remains
    const userCards = compiled.querySelectorAll('app-user-card');
    expect(userCards.length).toBe(1);
    expect(userCards[0].textContent).toContain('User 2');
  });
});
```

### Testing Form Submission Flow

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CreateUserComponent } from './create-user.component';

describe('CreateUserComponent Integration', () => {
  let fixture: ComponentFixture<CreateUserComponent>;
  let httpMock: HttpTestingController;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateUserComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'users', component: class {} }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUserComponent);
    compiled = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should complete full form submission flow', () => {
    // Arrange - Fill form
    const firstNameInput = compiled.querySelector('[name="firstName"]') as HTMLInputElement;
    const lastNameInput = compiled.querySelector('[name="lastName"]') as HTMLInputElement;
    const emailInput = compiled.querySelector('[name="email"]') as HTMLInputElement;
    const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Act - Fill form fields
    firstNameInput.value = 'John';
    firstNameInput.dispatchEvent(new Event('input'));

    lastNameInput.value = 'Doe';
    lastNameInput.dispatchEvent(new Event('input'));

    emailInput.value = 'john@example.com';
    emailInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    // Submit form
    submitButton.click();
    fixture.detectChanges();

    // Assert - HTTP POST called
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });

    // Flush success response
    req.flush({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
    fixture.detectChanges();

    // Assert - Success message displayed
    const successMessage = compiled.querySelector('.success-message');
    expect(successMessage).toBeTruthy();
    expect(successMessage?.textContent).toContain('User created successfully');
  });
});
```

## Testing RxJS Operators

### Testing with Marble Testing

```typescript
import { TestScheduler } from 'rxjs/testing';
import { debounceTime, map, switchMap } from 'rxjs/operators';

describe('RxJS Operators with Marble Testing', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should debounce values', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input$ = cold('a-b-c---|');
      const expected = '-----c---|';

      const result$ = input$.pipe(debounceTime(50, scheduler));

      expectObservable(result$).toBe(expected);
    });
  });

  it('should map values', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input$ = cold('a-b-c|', {
        a: 1,
        b: 2,
        c: 3
      });

      const expected = 'a-b-c|';
      const expectedValues = {
        a: 2,
        b: 4,
        c: 6
      };

      const result$ = input$.pipe(map(x => x * 2));

      expectObservable(result$).toBe(expected, expectedValues);
    });
  });

  it('should switchMap to inner observable', () => {
    scheduler.run(({ cold, hot, expectObservable }) => {
      const input$ = hot('a--b--c|');
      const inner$ = cold('  x-y|');
      const expected = '   x-y-x-y-x-y|';

      const result$ = input$.pipe(
        switchMap(() => inner$)
      );

      expectObservable(result$).toBe(expected);
    });
  });
});
```

### Testing Complex Observable Chains

```typescript
import { of, throwError, timer } from 'rxjs';
import { catchError, retry, switchMap } from 'rxjs/operators';

describe('Complex Observable Chains', () => {
  let service: DataService;

  beforeEach(() => {
    service = new DataService();
  });

  it('should retry failed requests', (done) => {
    // Arrange
    let attempts = 0;
    spyOn(service, 'fetchData').and.callFake(() => {
      attempts++;
      if (attempts < 3) {
        return throwError(() => new Error('Failed'));
      }
      return of(['data']);
    });

    // Act
    service.fetchData()
      .pipe(
        retry(2),
        catchError(() => of([]))
      )
      .subscribe(data => {
        // Assert
        expect(attempts).toBe(3);
        expect(data).toEqual(['data']);
        done();
      });
  });

  it('should handle race conditions with switchMap', fakeAsync(() => {
    // Arrange
    const results: string[] = [];
    spyOn(service, 'search').and.callFake((query: string) => {
      return of(`Results for ${query}`).pipe(
        delay(query === 'first' ? 1000 : 100)
      );
    });

    // Act - Simulate rapid searches
    service.search('first').pipe(
      switchMap(() => service.search('second'))
    ).subscribe(result => {
      results.push(result);
    });

    tick(1100);

    // Assert - Only second result received (first cancelled)
    expect(results).toEqual(['Results for second']);
  }));
});
```

## Testing with Real Router

### Router Integration Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';

@Component({ template: 'Home', standalone: true })
class HomeComponent {}

@Component({ template: 'About', standalone: true })
class AboutComponent {}

describe('Router Integration', () => {
  let router: Router;
  let location: Location;
  let fixture: ComponentFixture<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: HomeComponent },
          { path: 'about', component: AboutComponent }
        ])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(HomeComponent);
  });

  it('should navigate to about page', fakeAsync(() => {
    // Act
    router.navigate(['/about']);
    tick();

    // Assert
    expect(location.path()).toBe('/about');
  }));

  it('should navigate with query params', fakeAsync(() => {
    // Act
    router.navigate(['/about'], { queryParams: { id: '123' } });
    tick();

    // Assert
    expect(location.path()).toBe('/about?id=123');
  }));
});
```

## Testing LocalStorage and SessionStorage

```typescript
describe('Storage Testing', () => {
  let storage: StorageService;

  beforeEach(() => {
    // Mock localStorage
    let store: { [key: string]: string } = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] || null;
    });

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete store[key];
    });

    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });

    storage = new StorageService();
  });

  it('should save to localStorage', () => {
    storage.set('key', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value');
  });

  it('should get from localStorage', () => {
    localStorage.setItem('key', 'value');
    const result = storage.get('key');
    expect(result).toBe('value');
  });

  it('should remove from localStorage', () => {
    storage.remove('key');
    expect(localStorage.removeItem).toHaveBeenCalledWith('key');
  });
});
```

## Testing Window and Document

```typescript
describe('Window and Document Testing', () => {
  let originalWidth: number;

  beforeEach(() => {
    originalWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth
    });
  });

  it('should detect mobile viewport', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    const service = new ViewportService();
    expect(service.isMobile()).toBe(true);
  });

  it('should handle window resize', () => {
    const service = new ViewportService();
    spyOn(service, 'onResize');

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    expect(service.onResize).toHaveBeenCalled();
  });

  it('should scroll to top', () => {
    spyOn(window, 'scrollTo');

    const service = new ScrollService();
    service.scrollToTop();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
```

## Testing with IntersectionObserver

```typescript
describe('IntersectionObserver Testing', () => {
  let mockIntersectionObserver: jasmine.SpyObj<IntersectionObserver>;

  beforeEach(() => {
    mockIntersectionObserver = jasmine.createSpyObj('IntersectionObserver', [
      'observe',
      'unobserve',
      'disconnect'
    ]);

    // Mock IntersectionObserver constructor
    spyOn(window as any, 'IntersectionObserver').and.returnValue(
      mockIntersectionObserver
    );
  });

  it('should observe element', () => {
    const directive = new LazyLoadDirective(elementRef, renderer);
    directive.ngOnInit();

    expect(window.IntersectionObserver).toHaveBeenCalled();
    expect(mockIntersectionObserver.observe).toHaveBeenCalled();
  });

  it('should load image when entering viewport', () => {
    let callback: IntersectionObserverCallback;

    (window.IntersectionObserver as any).and.callFake(
      (cb: IntersectionObserverCallback) => {
        callback = cb;
        return mockIntersectionObserver;
      }
    );

    const directive = new LazyLoadDirective(elementRef, renderer);
    directive.ngOnInit();

    // Simulate intersection
    callback!(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      mockIntersectionObserver
    );

    expect(mockIntersectionObserver.unobserve).toHaveBeenCalled();
  });
});
```

## Performance Testing

```typescript
describe('Performance Testing', () => {
  it('should render large list in acceptable time', () => {
    const start = performance.now();

    const fixture = TestBed.createComponent(LargeListComponent);
    fixture.componentInstance.items.set(
      Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    );
    fixture.detectChanges();

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // Should render in < 1 second
  });

  it('should handle rapid updates efficiently', fakeAsync(() => {
    const fixture = TestBed.createComponent(SearchComponent);
    const start = performance.now();

    // Simulate 100 rapid updates
    for (let i = 0; i < 100; i++) {
      fixture.componentInstance.onInput(`query${i}`);
      tick(10);
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  }));
});
```

## Memory Leak Detection

```typescript
describe('Memory Leak Detection', () => {
  it('should clean up subscriptions', () => {
    const component = new MyComponent(service);
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnInit();
    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should unsubscribe from observables', () => {
    const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);

    const component = new MyComponent(service);
    component['subscription'] = subscription;

    component.ngOnDestroy();

    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('should disconnect observers', () => {
    const observer = jasmine.createSpyObj('Observer', ['disconnect']);

    const directive = new MyDirective(elementRef);
    directive['observer'] = observer;

    directive.ngOnDestroy();

    expect(observer.disconnect).toHaveBeenCalled();
  });
});
```

## Accessibility Testing

```typescript
describe('Accessibility Testing', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should have proper ARIA attributes', () => {
    const button = compiled.querySelector('button');

    expect(button?.getAttribute('aria-label')).toBeTruthy();
    expect(button?.getAttribute('role')).toBe('button');
  });

  it('should be keyboard accessible', () => {
    const button = compiled.querySelector('button') as HTMLButtonElement;
    spyOn(fixture.componentInstance.clicked, 'emit');

    // Simulate Enter key
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    button.dispatchEvent(event);

    expect(fixture.componentInstance.clicked.emit).toHaveBeenCalled();
  });

  it('should have proper focus management', () => {
    const modal = compiled.querySelector('.modal') as HTMLElement;

    fixture.componentInstance.open();
    fixture.detectChanges();

    // First focusable element should receive focus
    const firstInput = modal.querySelector('input') as HTMLInputElement;
    expect(document.activeElement).toBe(firstInput);
  });

  it('should trap focus within modal', () => {
    fixture.componentInstance.open();
    fixture.detectChanges();

    const modal = compiled.querySelector('.modal') as HTMLElement;
    const focusableElements = modal.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    lastElement.focus();

    // Tab from last element
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    lastElement.dispatchEvent(tabEvent);

    fixture.detectChanges();

    // Focus should return to first element
    expect(document.activeElement).toBe(focusableElements[0]);
  });
});
```

## Visual Regression Testing Setup

```typescript
/**
 * Visual Regression Testing with Playwright or Cypress
 */

// Example with Playwright
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('button should match screenshot', async ({ page }) => {
    await page.goto('http://localhost:4200/components/button');

    const button = page.locator('app-button');

    await expect(button).toHaveScreenshot('button-default.png');
  });

  test('button hover state', async ({ page }) => {
    await page.goto('http://localhost:4200/components/button');

    const button = page.locator('app-button button');
    await button.hover();

    await expect(button).toHaveScreenshot('button-hover.png');
  });
});
```

## Snapshot Testing (Jest)

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';

describe('UserCardComponent Snapshot', () => {
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
  });

  it('should match snapshot', () => {
    fixture.componentRef.setInput('user', {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'avatar.jpg'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement).toMatchSnapshot();
  });

  it('should match snapshot in loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(fixture.nativeElement).toMatchSnapshot();
  });
});
```
