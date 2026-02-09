---
name: angular-rxjs-operators
description: >
  Guía completa de RxJS operators para Angular standalone applications.
  Usar cuando se necesite implementar operators de transformación (map, switchMap, mergeMap, concatMap),
  filtrado (filter, debounceTime, throttleTime, distinctUntilChanged), combinación (combineLatest,
  forkJoin, merge, zip), error handling (catchError, retry, retryWhen), utilities (tap, delay, take,
  takeUntil), cancelación de requests, search typeahead, auto-save forms, polling, retry logic,
  error recovery, unsubscription patterns, custom operators, integration con signals (toSignal, toObservable),
  o cualquier patrón avanzado de RxJS. Incluye ejemplos prácticos del mundo real, comparaciones,
  best practices, anti-patterns, y código production-ready para proyectos Angular 19+.
---

# Angular RxJS Operators - Guía Completa

Referencia enterprise-ready de RxJS operators para Angular standalone con ejemplos prácticos del mundo real.

## 📊 RxJS Operators Overview

| Categoría | Operators | Use Cases |
|-----------|-----------|-----------|
| Transformación | map, switchMap, mergeMap, concatMap, exhaustMap | API calls, data transformation |
| Filtrado | filter, debounceTime, throttleTime, distinctUntilChanged, take | Search, events, deduplication |
| Combinación | combineLatest, forkJoin, merge, zip, withLatestFrom | Multiple sources, parallel requests |
| Error Handling | catchError, retry, retryWhen | API failures, recovery |
| Utilidad | tap, delay, timeout, shareReplay, finalize | Debugging, caching, cleanup |

## Arquitectura de Ejemplos

```
rxjs-patterns/
├── services/
│   ├── search.service.ts              # Typeahead search
│   ├── auto-save.service.ts           # Form auto-save
│   ├── polling.service.ts             # Data polling
│   └── http-retry.service.ts          # Retry logic
├── operators/
│   ├── custom/
│   │   ├── retry-backoff.operator.ts
│   │   └── debug.operator.ts
│   └── patterns/
│       ├── takeUntilDestroyed.ts
│       └── switchMapWithCancelation.ts
└── components/
    ├── search/                        # Search typeahead
    ├── form-auto-save/                # Auto-save form
    └── data-polling/                  # Polling example
```

---

## 1. Operators de Transformación

### 1.1 map - Transform Values

```typescript
import { Component, signal } from '@angular/core';
import { map } from 'rxjs/operators';
import { UserService } from '@core/services/user.service';

/**
 * ✅ MAP: Transform each value emitted by source
 *
 * Diagram:
 * source:  --1--2--3--4--|
 * map(x2): --2--4--6--8--|
 *
 * Use cases:
 * - Transform API response data
 * - Extract specific properties
 * - Format display values
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <div *ngFor="let name of userNames()">{{ name }}</div>
  `
})
export class UserListComponent {
  userNames = signal<string[]>([]);

  constructor(private userService: UserService) {
    // ✅ Extract names from user objects
    this.userService.getUsers()
      .pipe(
        map(users => users.map(u => u.name))
      )
      .subscribe(names => {
        this.userNames.set(names);
      });
  }
}

// Example: Complex transformation
export class DataTransformService {
  transformApiData(data: RawApiData): Observable<DisplayData> {
    return this.http.get<RawApiData>('/api/data').pipe(
      map(raw => ({
        // Transform to display format
        id: raw.id,
        title: raw.name.toUpperCase(),
        subtitle: `${raw.category} - ${raw.subcategory}`,
        price: `$${raw.price.toFixed(2)}`,
        available: raw.stock > 0,
        imageUrl: raw.images[0]?.url || '/default.jpg'
      }))
    );
  }
}
```

### 1.2 switchMap - Cancel Previous, Start New

```typescript
import { Component, signal } from '@angular/core';
import { switchMap, debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * ✅ SWITCHMAP: Cancel previous observable when new value arrives
 *
 * Diagram:
 * source:     --a-----b--c----|
 * switchMap:  --A-----B--C----|
 *               |cancel|cancel
 *
 * Use cases:
 * - Search typeahead (cancel old searches)
 * - Latest data fetch
 * - Navigation requests
 *
 * ⚠️ WARNING: Cancels in-flight requests!
 */
@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input
      type="text"
      (input)="onSearchInput($event)"
      placeholder="Search users...">

    <div *ngFor="let result of searchResults()">
      {{ result.name }}
    </div>
  `
})
export class SearchComponent {
  private searchTerms$ = new Subject<string>();
  searchResults = signal<User[]>([]);

  constructor(private searchService: SearchService) {
    // ✅ Perfect for search: cancels old searches automatically
    this.searchTerms$.pipe(
      debounceTime(300),        // Wait for user to stop typing
      distinctUntilChanged(),   // Ignore if same as previous
      switchMap(term => {
        // Previous search is cancelled here
        return this.searchService.search(term);
      })
    ).subscribe(results => {
      this.searchResults.set(results);
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerms$.next(value);
  }
}
```

### 1.3 mergeMap (flatMap) - Process All Concurrently

```typescript
import { mergeMap, toArray } from 'rxjs/operators';
import { from } from 'rxjs';

/**
 * ✅ MERGEMAP: Process all observables concurrently
 *
 * Diagram:
 * source:    --1--2--3--|
 * mergeMap:  --A--B--C--|
 *              |  |  |
 *              all run in parallel
 *
 * Use cases:
 * - Multiple parallel API calls
 * - Process array items independently
 * - Bulk operations
 *
 * ⚠️ WARNING: No order guarantee, all run concurrently!
 */
export class BulkOperationService {
  // ✅ Upload multiple files in parallel
  uploadMultipleFiles(files: File[]): Observable<UploadResult[]> {
    return from(files).pipe(
      mergeMap(file => {
        // All uploads run in parallel
        return this.uploadFile(file);
      }),
      toArray() // Collect all results
    );
  }

  // ✅ Delete multiple users concurrently
  deleteUsers(userIds: string[]): Observable<void> {
    return from(userIds).pipe(
      mergeMap(id => this.http.delete(`/api/users/${id}`)),
      toArray(),
      map(() => void 0)
    );
  }

  // ⚠️ Limit concurrency with mergeMap(fn, concurrent)
  uploadWithConcurrencyLimit(files: File[]): Observable<UploadResult[]> {
    return from(files).pipe(
      mergeMap(
        file => this.uploadFile(file),
        3 // Max 3 concurrent uploads
      ),
      toArray()
    );
  }
}
```

### 1.4 concatMap - Process Sequentially

```typescript
import { concatMap } from 'rxjs/operators';
import { from } from 'rxjs';

/**
 * ✅ CONCATMAP: Process observables one by one in order
 *
 * Diagram:
 * source:     --1--2--3--|
 * concatMap:  --A---B---C--|
 *               wait wait
 *
 * Use cases:
 * - Sequential API calls
 * - Order-dependent operations
 * - Queue processing
 *
 * ✅ BENEFIT: Maintains order, waits for completion
 */
export class SequentialOperationService {
  // ✅ Create users one by one (order matters)
  createUsersInOrder(users: NewUser[]): Observable<User[]> {
    return from(users).pipe(
      concatMap(user => {
        // Wait for previous to complete before next
        return this.http.post<User>('/api/users', user);
      }),
      toArray()
    );
  }

  // ✅ Multi-step workflow (each step depends on previous)
  completeOnboardingFlow(userId: string): Observable<OnboardingResult> {
    return this.createProfile(userId).pipe(
      concatMap(profile => this.uploadAvatar(profile.id)),
      concatMap(avatar => this.sendWelcomeEmail(userId)),
      concatMap(() => this.markOnboardingComplete(userId))
    );
  }

  // Example: Sequential file processing
  processFilesSequentially(files: File[]): Observable<ProcessedFile[]> {
    return from(files).pipe(
      concatMap(file => {
        // Each file waits for previous to finish
        return this.processFile(file);
      }),
      toArray()
    );
  }
}
```

### 1.5 exhaustMap - Ignore New Until Current Completes

```typescript
import { exhaustMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * ✅ EXHAUSTMAP: Ignore new values while current observable is active
 *
 * Diagram:
 * source:      --1--2--3--4--|
 * exhaustMap:  --A--(ignore 2,3)--D--|
 *
 * Use cases:
 * - Login/submit buttons (prevent double-submit)
 * - Rate limiting
 * - Prevent duplicate requests
 */
@Component({
  selector: 'app-login-form',
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="email" placeholder="Email">
      <input [(ngModel)]="password" type="password">
      <button type="submit" [disabled]="isLoading()">
        {{ isLoading() ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  `
})
export class LoginFormComponent {
  private submitSubject$ = new Subject<void>();
  isLoading = signal(false);

  email = '';
  password = '';

  constructor(private authService: AuthService) {
    // ✅ Ignore rapid clicks while login in progress
    this.submitSubject$.pipe(
      exhaustMap(() => {
        this.isLoading.set(true);
        return this.authService.login(this.email, this.password).pipe(
          finalize(() => this.isLoading.set(false))
        );
      })
    ).subscribe({
      next: (user) => console.log('Logged in:', user),
      error: (err) => console.error('Login failed:', err)
    });
  }

  onSubmit(): void {
    // Rapid clicks are ignored while request is in flight
    this.submitSubject$.next();
  }
}
```

### 1.6 Comparison: switchMap vs mergeMap vs concatMap

```typescript
/**
 * 📊 COMPARISON TABLE
 *
 * | Operator    | Concurrency | Order | Cancellation | Use Case |
 * |-------------|-------------|-------|--------------|----------|
 * | switchMap   | Latest only | No    | Yes (previous) | Search, navigation |
 * | mergeMap    | All parallel | No   | No           | Bulk operations |
 * | concatMap   | Sequential  | Yes   | No           | Ordered workflows |
 * | exhaustMap  | First only  | No    | No           | Button debouncing |
 */

// Example: Search typeahead
searchTerm$.pipe(
  switchMap(term => this.search(term)) // ✅ Cancel old searches
);

// Example: Upload multiple files
from(files).pipe(
  mergeMap(file => this.upload(file)) // ✅ Upload all in parallel
);

// Example: Multi-step checkout
checkout$.pipe(
  concatMap(cart => this.createOrder(cart)),
  concatMap(order => this.processPayment(order)),
  concatMap(payment => this.sendConfirmation(payment))
); // ✅ Each step waits for previous

// Example: Save button
saveClick$.pipe(
  exhaustMap(() => this.save()) // ✅ Ignore clicks while saving
);
```

---

## 2. Operators de Filtrado

### 2.1 filter - Conditional Filtering

```typescript
import { filter } from 'rxjs/operators';

/**
 * ✅ FILTER: Only emit values that pass predicate
 *
 * Diagram:
 * source:         --1--2--3--4--5--|
 * filter(x > 2):  --------3--4--5--|
 */
export class FilterExamplesService {
  // ✅ Filter out null/undefined
  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      filter(users => users !== null && users !== undefined),
      filter(users => users.length > 0),
      map(users => users.filter(u => u.active))
    );
  }

  // ✅ Filter events by type
  handleKeyboardEvents(): void {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter(event => event.key === 'Enter'),
      filter(event => !event.shiftKey) // Ignore Shift+Enter
    ).subscribe(() => {
      console.log('Enter pressed');
    });
  }

  // ✅ Filter by user permission
  getAdminData(): Observable<AdminData> {
    return this.authService.currentUser$.pipe(
      filter(user => user !== null),
      filter(user => user.role === 'admin'),
      switchMap(user => this.http.get<AdminData>('/api/admin/data'))
    );
  }
}
```

### 2.2 debounceTime - Wait for Pause

```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

/**
 * ✅ DEBOUNCETIME: Wait for specified time of silence
 *
 * Diagram:
 * source:         --a-b-c----d-e---|
 * debounce(300):  --------c------e-|
 *                   wait   wait
 *
 * Use cases:
 * - Search inputs
 * - Form auto-save
 * - API calls triggered by user input
 */
@Component({
  selector: 'app-search-input',
  template: `
    <input #searchInput type="text" placeholder="Search...">
    <div *ngIf="isSearching()">Searching...</div>
    <div *ngFor="let result of results()">{{ result }}</div>
  `
})
export class SearchInputComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isSearching = signal(false);
  results = signal<string[]>([]);

  ngAfterViewInit(): void {
    // ✅ Perfect for search: wait 300ms after user stops typing
    fromEvent(this.searchInput.nativeElement, 'input').pipe(
      debounceTime(300),                    // Wait for 300ms pause
      map(event => (event.target as HTMLInputElement).value),
      distinctUntilChanged(),               // Ignore duplicate values
      filter(query => query.length >= 3),  // Min 3 characters
      tap(() => this.isSearching.set(true)),
      switchMap(query => this.searchService.search(query)),
      tap(() => this.isSearching.set(false))
    ).subscribe(results => {
      this.results.set(results);
    });
  }
}

// Example: Form auto-save
@Component({
  selector: 'app-auto-save-form'
})
export class AutoSaveFormComponent {
  form = new FormGroup({
    title: new FormControl(''),
    content: new FormControl('')
  });

  constructor(private documentService: DocumentService) {
    // ✅ Auto-save 2 seconds after user stops typing
    this.form.valueChanges.pipe(
      debounceTime(2000),          // Wait 2s after last change
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      filter(value => this.form.valid),
      switchMap(value => this.documentService.autosave(value)),
      tap(() => console.log('✅ Auto-saved'))
    ).subscribe();
  }
}
```

### 2.3 throttleTime - Limit Rate

```typescript
import { throttleTime } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

/**
 * ✅ THROTTLETIME: Emit first value, then ignore for duration
 *
 * Diagram:
 * source:          --a-b-c-d-e-f-g--|
 * throttle(300):   --a-----d-----g--|
 *                     ignore  ignore
 *
 * Use cases:
 * - Scroll events
 * - Resize events
 * - Mouse move tracking
 */
@Component({
  selector: 'app-scroll-tracker'
})
export class ScrollTrackerComponent implements OnInit {
  scrollPosition = signal(0);

  ngOnInit(): void {
    // ✅ Update scroll position max once per 100ms
    fromEvent(window, 'scroll').pipe(
      throttleTime(100, undefined, {
        leading: true,    // Emit immediately on first event
        trailing: true    // Emit last event after throttle period
      }),
      map(() => window.scrollY)
    ).subscribe(position => {
      this.scrollPosition.set(position);
    });
  }
}

// Example: Button click rate limiting
@Component({
  selector: 'app-rate-limited-button'
})
export class RateLimitedButtonComponent {
  private clicks$ = new Subject<void>();

  constructor() {
    // ✅ Max one click per second
    this.clicks$.pipe(
      throttleTime(1000),
      tap(() => console.log('Button clicked'))
    ).subscribe(() => {
      this.performAction();
    });
  }

  onClick(): void {
    this.clicks$.next();
  }

  performAction(): void {
    // Action logic here
  }
}
```

### 2.4 distinctUntilChanged - Ignore Duplicates

```typescript
import { distinctUntilChanged, distinctUntilKeyChanged } from 'rxjs/operators';

/**
 * ✅ DISTINCTUNTILCHANGED: Only emit when value changes
 *
 * Diagram:
 * source:       --1--2--2--3--3--3--4--|
 * distinct:     --1--2-----3--------4--|
 */
export class DistinctExamplesService {
  // ✅ Avoid duplicate API calls
  getUserData(userId$: Observable<string>): Observable<User> {
    return userId$.pipe(
      distinctUntilChanged(), // Only fetch when userId actually changes
      switchMap(id => this.http.get<User>(`/api/users/${id}`))
    );
  }

  // ✅ Track only actual changes in form
  trackFormChanges(form: FormGroup): void {
    form.valueChanges.pipe(
      distinctUntilChanged((a, b) => {
        // Custom comparison
        return JSON.stringify(a) === JSON.stringify(b);
      })
    ).subscribe(value => {
      console.log('Form actually changed:', value);
    });
  }

  // ✅ Distinct by specific property
  trackUserRole(user$: Observable<User>): Observable<string> {
    return user$.pipe(
      distinctUntilKeyChanged('role'), // Only emit when role changes
      map(user => user.role)
    );
  }
}
```

---

## 3. Operators de Combinación

### 3.1 combineLatest - Wait for All, Emit on Any Change

```typescript
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * ✅ COMBINELATEST: Combine latest values from multiple observables
 *
 * Diagram:
 * stream1:     --a-----b--c----|
 * stream2:     ----1-2-----3---|
 * combined:    ----a1-b2-b3-c3-|
 *
 * Use cases:
 * - Combine multiple data sources
 * - Dependent form fields
 * - Filter combinations
 */
@Component({
  selector: 'app-user-dashboard'
})
export class UserDashboardComponent {
  // ✅ Combine user, settings, and notifications
  viewModel$ = combineLatest([
    this.userService.currentUser$,
    this.settingsService.settings$,
    this.notificationService.unreadCount$
  ]).pipe(
    map(([user, settings, unreadCount]) => ({
      userName: user.name,
      theme: settings.theme,
      hasNotifications: unreadCount > 0,
      unreadCount
    }))
  );

  // Convert to signal for template
  viewModel = toSignal(this.viewModel$, {
    initialValue: {
      userName: '',
      theme: 'light',
      hasNotifications: false,
      unreadCount: 0
    }
  });
}

// Example: Advanced filtering
@Component({
  selector: 'app-product-list'
})
export class ProductListComponent {
  categoryFilter$ = new BehaviorSubject<string>('all');
  priceFilter$ = new BehaviorSubject<{ min: number; max: number }>({ min: 0, max: 1000 });
  searchQuery$ = new BehaviorSubject<string>('');

  // ✅ Combine all filters and re-fetch when any changes
  filteredProducts$ = combineLatest([
    this.categoryFilter$,
    this.priceFilter$,
    this.searchQuery$
  ]).pipe(
    debounceTime(300),
    switchMap(([category, price, query]) => {
      return this.productService.search({
        category: category !== 'all' ? category : undefined,
        minPrice: price.min,
        maxPrice: price.max,
        query: query || undefined
      });
    })
  );

  products = toSignal(this.filteredProducts$, { initialValue: [] });
}
```

### 3.2 forkJoin - Wait for All to Complete

```typescript
import { forkJoin } from 'rxjs';

/**
 * ✅ FORKJOIN: Wait for all observables to complete, emit last values
 *
 * Diagram:
 * stream1:  --a--b--c|
 * stream2:  --1--2---|
 * stream3:  --x--y--z|
 * forkJoin: ---------[c,2,z]|
 *
 * Use cases:
 * - Parallel API requests (all must succeed)
 * - Initial data loading
 * - Batch operations
 *
 * ⚠️ WARNING: If any stream errors, entire forkJoin errors!
 */
export class DataLoadingService {
  // ✅ Load multiple data sources in parallel
  loadDashboardData(): Observable<DashboardData> {
    return forkJoin({
      user: this.http.get<User>('/api/user'),
      stats: this.http.get<Stats>('/api/stats'),
      notifications: this.http.get<Notification[]>('/api/notifications'),
      recentActivity: this.http.get<Activity[]>('/api/activity')
    }).pipe(
      map(({ user, stats, notifications, recentActivity }) => ({
        userName: user.name,
        totalSales: stats.totalSales,
        unreadNotifications: notifications.filter(n => !n.read).length,
        lastActivity: recentActivity[0]
      }))
    );
  }

  // ✅ Array syntax
  loadUserData(userId: string): Observable<[User, Post[], Comment[]]> {
    return forkJoin([
      this.http.get<User>(`/api/users/${userId}`),
      this.http.get<Post[]>(`/api/users/${userId}/posts`),
      this.http.get<Comment[]>(`/api/users/${userId}/comments`)
    ]);
  }

  // ✅ Error handling with forkJoin
  loadDataWithErrorHandling(): Observable<DashboardData> {
    return forkJoin({
      user: this.http.get<User>('/api/user').pipe(
        catchError(() => of({ id: '', name: 'Guest' } as User))
      ),
      stats: this.http.get<Stats>('/api/stats').pipe(
        catchError(() => of({ totalSales: 0 } as Stats))
      )
    });
  }
}
```

### 3.3 merge - Combine Multiple Streams

```typescript
import { merge } from 'rxjs';

/**
 * ✅ MERGE: Combine multiple observables into one
 *
 * Diagram:
 * stream1:  --a--b--c----|
 * stream2:  ---1--2--3---|
 * merged:   --a1-b2-c3---|
 *
 * Use cases:
 * - Multiple event sources
 * - Combine different triggers
 * - Union of streams
 */
@Component({
  selector: 'app-notification-manager'
})
export class NotificationManagerComponent {
  private manualRefresh$ = new Subject<void>();
  private autoRefresh$ = interval(30000); // Every 30 seconds

  // ✅ Merge manual and automatic refresh triggers
  notifications$ = merge(
    this.manualRefresh$,
    this.autoRefresh$
  ).pipe(
    startWith(void 0), // Load immediately
    switchMap(() => this.notificationService.getNotifications())
  );

  refresh(): void {
    this.manualRefresh$.next();
  }
}

// Example: Multiple search sources
export class MultiSearchService {
  searchAll(query: string): Observable<SearchResult> {
    return merge(
      this.searchUsers(query).pipe(map(r => ({ type: 'user', data: r }))),
      this.searchPosts(query).pipe(map(r => ({ type: 'post', data: r }))),
      this.searchComments(query).pipe(map(r => ({ type: 'comment', data: r })))
    );
  }
}
```

### 3.4 zip - Pair Values by Index

```typescript
import { zip } from 'rxjs';

/**
 * ✅ ZIP: Pair values by index (1st with 1st, 2nd with 2nd, etc.)
 *
 * Diagram:
 * stream1:  --a--b--c----|
 * stream2:  ---1--2--3---|
 * zipped:   ---[a,1]-[b,2]-[c,3]|
 *
 * Use cases:
 * - Pair related data
 * - Process items together
 * - Synchronized streams
 */
export class ZipExampleService {
  // ✅ Upload files with metadata
  uploadFilesWithMetadata(
    files: File[],
    metadata: FileMetadata[]
  ): Observable<UploadResult[]> {
    return zip(
      from(files),
      from(metadata)
    ).pipe(
      mergeMap(([file, meta]) => {
        return this.uploadFile(file, meta);
      }),
      toArray()
    );
  }

  // Example: Process pairs
  processPairs(): void {
    const numbers$ = of(1, 2, 3);
    const letters$ = of('a', 'b', 'c');

    zip(numbers$, letters$).subscribe(([num, letter]) => {
      console.log(`${num}${letter}`); // 1a, 2b, 3c
    });
  }
}
```

---

## 4. Operators de Error Handling

### 4.1 catchError - Handle Errors

```typescript
import { catchError } from 'rxjs/operators';
import { of, throwError, EMPTY } from 'rxjs';

/**
 * ✅ CATCHERROR: Handle errors and continue stream
 *
 * Use cases:
 * - Error recovery
 * - Fallback values
 * - Error logging
 */
export class ErrorHandlingService {
  // ✅ Return fallback value on error
  getUserWithFallback(userId: string): Observable<User> {
    return this.http.get<User>(`/api/users/${userId}`).pipe(
      catchError(error => {
        console.error('Failed to load user:', error);
        // Return default user
        return of({ id: userId, name: 'Unknown User' } as User);
      })
    );
  }

  // ✅ Re-throw error after logging
  getUserWithLogging(userId: string): Observable<User> {
    return this.http.get<User>(`/api/users/${userId}`).pipe(
      catchError(error => {
        console.error('API Error:', error);
        this.errorLogger.log(error);
        // Re-throw to propagate error
        return throwError(() => error);
      })
    );
  }

  // ✅ Complete stream silently on error
  loadOptionalData(): Observable<OptionalData> {
    return this.http.get<OptionalData>('/api/optional').pipe(
      catchError(() => EMPTY) // Complete without emitting
    );
  }

  // ✅ Try alternative endpoint on failure
  getUserWithFallbackEndpoint(userId: string): Observable<User> {
    return this.http.get<User>(`/api/v2/users/${userId}`).pipe(
      catchError(() => {
        // Try v1 API as fallback
        return this.http.get<User>(`/api/v1/users/${userId}`);
      })
    );
  }
}
```

### 4.2 retry - Retry on Failure

```typescript
import { retry, retryWhen, delay, take, tap } from 'rxjs/operators';

/**
 * ✅ RETRY: Retry failed observable N times
 *
 * Use cases:
 * - Network failures
 * - Transient errors
 * - Unreliable endpoints
 */
export class RetryService {
  // ✅ Simple retry 3 times
  getUserWithRetry(userId: string): Observable<User> {
    return this.http.get<User>(`/api/users/${userId}`).pipe(
      retry(3), // Retry up to 3 times on failure
      catchError(error => {
        console.error('Failed after 3 retries:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ Retry with exponential backoff
  getUserWithBackoff(userId: string): Observable<User> {
    return this.http.get<User>(`/api/users/${userId}`).pipe(
      retryWhen(errors =>
        errors.pipe(
          scan((retryCount, error) => {
            if (retryCount >= 3) {
              throw error; // Max retries reached
            }
            console.log(`Retry attempt ${retryCount + 1}`);
            return retryCount + 1;
          }, 0),
          delayWhen(retryCount => {
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = Math.pow(2, retryCount) * 1000;
            return timer(delayMs);
          })
        )
      )
    );
  }

  // ✅ Retry only on specific errors
  getUserWithConditionalRetry(userId: string): Observable<User> {
    return this.http.get<User>(`/api/users/${userId}`).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            // Only retry on 5xx server errors
            if (error.status >= 500 && error.status < 600 && index < 3) {
              return of(error).pipe(delay(1000));
            }
            // Don't retry 4xx client errors
            return throwError(() => error);
          })
        )
      )
    );
  }
}
```

### 4.3 Custom Retry with Backoff Operator

```typescript
import { Observable, timer, throwError } from 'rxjs';
import { mergeMap, finalize } from 'rxjs/operators';

/**
 * ✅ CUSTOM OPERATOR: Retry with exponential backoff
 */
export function retryBackoff(config: {
  maxRetries: number;
  initialDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}) {
  const {
    maxRetries,
    initialDelay,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = config;

  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            if (retryAttempt > maxRetries) {
              return throwError(() => error);
            }

            const delay = Math.min(
              initialDelay * Math.pow(backoffMultiplier, index),
              maxDelay
            );

            console.log(
              `Retry attempt ${retryAttempt}/${maxRetries} after ${delay}ms`
            );

            return timer(delay);
          }),
          finalize(() => console.log('Retry sequence complete'))
        )
      )
    );
}

// Usage:
this.http.get<User>('/api/user').pipe(
  retryBackoff({
    maxRetries: 5,
    initialDelay: 1000,     // 1s
    maxDelay: 30000,        // 30s max
    backoffMultiplier: 2    // 1s, 2s, 4s, 8s, 16s
  })
).subscribe();
```

---

## 5. Operators de Utilidad

### 5.1 tap (do) - Side Effects

```typescript
import { tap } from 'rxjs/operators';

/**
 * ✅ TAP: Perform side effects without modifying stream
 *
 * Use cases:
 * - Logging
 * - Debugging
 * - Analytics tracking
 * - Side effects
 */
export class TapExamplesService {
  // ✅ Logging pipeline
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      tap(users => console.log('Received users:', users.length)),
      tap({
        next: users => this.analytics.track('users_loaded', { count: users.length }),
        error: error => console.error('Error loading users:', error),
        complete: () => console.log('Request complete')
      }),
      map(users => users.filter(u => u.active))
    );
  }

  // ✅ Update loading state
  fetchData(): Observable<Data> {
    return this.http.get<Data>('/api/data').pipe(
      tap(() => this.loadingService.setLoading(true)),
      tap(data => this.cache.set('data', data)),
      finalize(() => this.loadingService.setLoading(false))
    );
  }

  // ✅ Debugging
  searchUsers(query: string): Observable<User[]> {
    return of(query).pipe(
      tap(q => console.log('1. Input query:', q)),
      debounceTime(300),
      tap(q => console.log('2. After debounce:', q)),
      switchMap(q => this.http.get<User[]>(`/api/search?q=${q}`)),
      tap(results => console.log('3. Results:', results))
    );
  }
}
```

### 5.2 delay - Delay Emissions

```typescript
import { delay, delayWhen } from 'rxjs/operators';
import { timer } from 'rxjs';

/**
 * ✅ DELAY: Delay all emissions by specified time
 */
export class DelayExamplesService {
  // ✅ Simple delay
  showNotificationDelayed(message: string): Observable<void> {
    return of(message).pipe(
      delay(3000), // Delay 3 seconds
      tap(msg => this.toastService.show(msg)),
      map(() => void 0)
    );
  }

  // ✅ Dynamic delay based on value
  processWithDynamicDelay(items: Item[]): Observable<Item> {
    return from(items).pipe(
      delayWhen(item => {
        // Delay based on item priority
        const delayMs = item.priority === 'high' ? 0 : 1000;
        return timer(delayMs);
      })
    );
  }
}
```

### 5.3 takeUntil - Unsubscribe Pattern

```typescript
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * ✅ TAKEUNTIL: Complete when notifier emits
 *
 * Use cases:
 * - Component cleanup
 * - Memory leak prevention
 * - Conditional cancellation
 */
@Component({
  selector: 'app-data-component'
})
export class DataComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // ✅ PATTERN: takeUntil for automatic cleanup
    this.dataService.getData().pipe(
      takeUntil(this.destroy$) // Auto-unsubscribe on destroy
    ).subscribe(data => {
      console.log('Data:', data);
    });

    // Multiple subscriptions
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => console.log('Tick'));

    this.userService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => console.log('User:', user));
  }

  ngOnDestroy(): void {
    // ✅ Trigger all takeUntil completions
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ✅ Angular 16+: takeUntilDestroyed
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-modern-component'
})
export class ModernComponent {
  // ✅ Simpler with takeUntilDestroyed
  constructor(private dataService: DataService) {
    this.dataService.getData().pipe(
      takeUntilDestroyed() // Auto-cleanup, no ngOnDestroy needed!
    ).subscribe(data => console.log(data));
  }
}
```

### 5.4 shareReplay - Cache Observable

```typescript
import { shareReplay } from 'rxjs/operators';

/**
 * ✅ SHAREREPLAY: Share observable and replay last N values
 *
 * Use cases:
 * - Cache HTTP requests
 * - Share expensive computations
 * - Multiple subscriptions to same source
 */
export class CachingService {
  // ✅ Cache user data
  private userCache$?: Observable<User>;

  getCurrentUser(): Observable<User> {
    if (!this.userCache$) {
      this.userCache$ = this.http.get<User>('/api/user').pipe(
        shareReplay({
          bufferSize: 1,     // Cache last value
          refCount: false    // Keep alive even with 0 subscribers
        })
      );
    }
    return this.userCache$;
  }

  // ✅ Cache with expiration
  getCachedData(): Observable<Data> {
    return this.http.get<Data>('/api/data').pipe(
      shareReplay({
        bufferSize: 1,
        refCount: true,      // Unsubscribe when no subscribers
        windowTime: 300000   // 5 minutes cache
      })
    );
  }
}
```

---

## 6. Patrones Prácticos del Mundo Real

### 6.1 Search Typeahead (Complete Implementation)

```typescript
@Component({
  selector: 'app-search-typeahead',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <input
        type="text"
        [(ngModel)]="searchQuery"
        (ngModelChange)="onSearchChange($event)"
        placeholder="Search users..."
        class="search-input">

      @if (isSearching()) {
        <div class="spinner">Searching...</div>
      }

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (results().length > 0) {
        <ul class="results-list">
          @for (result of results(); track result.id) {
            <li (click)="selectResult(result)">
              {{ result.name }} - {{ result.email }}
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class SearchTypeaheadComponent implements OnDestroy {
  searchQuery = '';
  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  isSearching = signal(false);
  results = signal<SearchResult[]>([]);
  error = signal<string | null>(null);

  resultSelected = output<SearchResult>();

  constructor(private searchService: SearchService) {
    // ✅ Complete search typeahead implementation
    this.searchSubject$.pipe(
      // Reset state
      tap(() => {
        this.error.set(null);
        this.results.set([]);
      }),
      // Wait for user to stop typing
      debounceTime(300),
      // Ignore empty queries
      filter(query => query.trim().length >= 2),
      // Avoid duplicate searches
      distinctUntilChanged(),
      // Set loading state
      tap(() => this.isSearching.set(true)),
      // Cancel previous search, start new one
      switchMap(query =>
        this.searchService.search(query).pipe(
          // Handle errors without breaking stream
          catchError(error => {
            this.error.set('Search failed. Please try again.');
            console.error('Search error:', error);
            return of([]);
          })
        )
      ),
      // Clear loading state
      tap(() => this.isSearching.set(false)),
      // Cleanup
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.results.set(results);
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject$.next(query);
  }

  selectResult(result: SearchResult): void {
    this.resultSelected.emit(result);
    this.searchQuery = '';
    this.results.set([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 6.2 Form Auto-Save

```typescript
@Component({
  selector: 'app-auto-save-document',
  template: `
    <form [formGroup]="documentForm">
      <input formControlName="title" placeholder="Title">
      <textarea formControlName="content" placeholder="Content"></textarea>

      @if (saveStatus() === 'saving') {
        <span class="status">💾 Saving...</span>
      } @else if (saveStatus() === 'saved') {
        <span class="status">✅ Saved</span>
      } @else if (saveStatus() === 'error') {
        <span class="status">❌ Save failed</span>
      }
    </form>
  `
})
export class AutoSaveDocumentComponent implements OnInit, OnDestroy {
  documentForm = new FormGroup({
    title: new FormControl(''),
    content: new FormControl('')
  });

  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  private destroy$ = new Subject<void>();

  constructor(
    private documentService: DocumentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const documentId = this.route.snapshot.params['id'];

    // ✅ Auto-save implementation
    this.documentForm.valueChanges.pipe(
      // Wait 2 seconds after last change
      debounceTime(2000),
      // Only save if form is valid
      filter(() => this.documentForm.valid),
      // Avoid saving identical values
      distinctUntilChanged((a, b) =>
        JSON.stringify(a) === JSON.stringify(b)
      ),
      // Set saving status
      tap(() => this.saveStatus.set('saving')),
      // Cancel previous save, start new one
      switchMap(formValue =>
        this.documentService.update(documentId, formValue).pipe(
          // Handle save success
          tap(() => {
            this.saveStatus.set('saved');
            // Reset status after 2 seconds
            timer(2000).pipe(take(1)).subscribe(() => {
              this.saveStatus.set('idle');
            });
          }),
          // Handle save error
          catchError(error => {
            this.saveStatus.set('error');
            console.error('Auto-save failed:', error);
            return EMPTY;
          })
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 6.3 Polling with Pause/Resume

```typescript
@Component({
  selector: 'app-data-polling'
})
export class DataPollingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private pause$ = new BehaviorSubject<boolean>(false);

  data = signal<LiveData | null>(null);
  isPaused = signal(false);

  ngOnInit(): void {
    // ✅ Polling with pause capability
    interval(5000).pipe(
      // Only poll when not paused
      withLatestFrom(this.pause$),
      filter(([_, isPaused]) => !isPaused),
      // Cancel previous request if still running
      switchMap(() =>
        this.dataService.getLiveData().pipe(
          catchError(error => {
            console.error('Polling error:', error);
            return of(null);
          })
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (data) {
        this.data.set(data);
      }
    });
  }

  pausePolling(): void {
    this.pause$.next(true);
    this.isPaused.set(true);
  }

  resumePolling(): void {
    this.pause$.next(false);
    this.isPaused.set(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 7. Integration con Signals

### 7.1 toSignal - Observable to Signal

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * ✅ TOSIGNAL: Convert Observable to Signal
 */
@Component({
  selector: 'app-signal-integration'
})
export class SignalIntegrationComponent {
  // ✅ Convert user observable to signal
  user = toSignal(
    this.userService.currentUser$,
    { initialValue: null }
  );

  // ✅ With error handling
  data = toSignal(
    this.dataService.getData().pipe(
      catchError(() => of(null))
    ),
    { initialValue: null }
  );

  // ✅ Computed from signal
  userName = computed(() => {
    const user = this.user();
    return user ? user.name : 'Guest';
  });
}
```

### 7.2 toObservable - Signal to Observable

```typescript
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * ✅ TOOBSERVABLE: Convert Signal to Observable
 */
@Component({
  selector: 'app-observable-integration'
})
export class ObservableIntegrationComponent {
  searchQuery = signal('');

  // ✅ Convert signal to observable for RxJS operators
  searchResults$ = toObservable(this.searchQuery).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    filter(query => query.length >= 2),
    switchMap(query => this.searchService.search(query))
  );

  results = toSignal(this.searchResults$, { initialValue: [] });
}
```

---

Este skill proporciona una guía completa de RxJS operators con ejemplos prácticos y patrones del mundo real para aplicaciones Angular standalone.

**🎯 Resultado esperado:** Dominio completo de RxJS operators y patrones reactivos en Angular 🚀
