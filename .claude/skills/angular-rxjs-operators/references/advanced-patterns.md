# Advanced RxJS Patterns

## Custom Operators

### 1. Retry with Exponential Backoff

```typescript
import { Observable, timer, throwError } from 'rxjs';
import { mergeMap, finalize, tap } from 'rxjs/operators';

export interface RetryBackoffConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export function retryWithBackoff<T>(config: RetryBackoffConfig) {
  const {
    maxRetries,
    initialDelay,
    maxDelay = 30000,
    backoffMultiplier = 2,
    shouldRetry = () => true
  } = config;

  return (source: Observable<T>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            // Check if should retry
            if (!shouldRetry(error) || retryAttempt > maxRetries) {
              return throwError(() => error);
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
              initialDelay * Math.pow(backoffMultiplier, index),
              maxDelay
            );

            console.log(
              `[Retry ${retryAttempt}/${maxRetries}] Retrying after ${delay}ms...`
            );

            return timer(delay);
          }),
          finalize(() => console.log('[Retry] Sequence complete'))
        )
      )
    );
}

// Usage:
this.http.get('/api/data').pipe(
  retryWithBackoff({
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    shouldRetry: (error) => error.status >= 500
  })
).subscribe();
```

### 2. Debug Operator

```typescript
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export function debug<T>(tag: string) {
  return (source: Observable<T>) =>
    source.pipe(
      tap({
        next: value => console.log(`[${tag}] Next:`, value),
        error: error => console.error(`[${tag}] Error:`, error),
        complete: () => console.log(`[${tag}] Complete`)
      })
    );
}

// Usage:
this.http.get('/api/users').pipe(
  debug('HTTP GET'),
  map(users => users.filter(u => u.active)),
  debug('After filter')
).subscribe();
```

### 3. Cache Operator with TTL

```typescript
import { Observable, of, timer } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export function cacheWithTTL<T>(ttl: number) {
  let cache: CacheEntry<T> | null = null;

  return (source: Observable<T>) =>
    new Observable<T>(observer => {
      const now = Date.now();

      // Check if cache is valid
      if (cache && now - cache.timestamp < ttl) {
        observer.next(cache.value);
        observer.complete();
        return;
      }

      // Fetch fresh data
      return source.pipe(
        tap(value => {
          cache = { value, timestamp: Date.now() };
        })
      ).subscribe(observer);
    });
}

// Usage:
this.http.get<User[]>('/api/users').pipe(
  cacheWithTTL(60000) // Cache for 60 seconds
).subscribe();
```

## Complex Real-World Patterns

### 4. Infinite Scroll

```typescript
@Component({
  selector: 'app-infinite-scroll'
})
export class InfiniteScrollComponent implements OnInit {
  private pageNumber$ = new BehaviorSubject<number>(1);
  private scrollEnd$ = new Subject<void>();

  items = signal<Item[]>([]);
  hasMore = signal(true);
  loading = signal(false);

  ngOnInit(): void {
    // Load more when reaching end
    this.scrollEnd$.pipe(
      filter(() => this.hasMore() && !this.loading()),
      tap(() => this.pageNumber$.next(this.pageNumber$.value + 1))
    ).subscribe();

    // Fetch pages
    this.pageNumber$.pipe(
      tap(() => this.loading.set(true)),
      switchMap(page =>
        this.itemService.getItems(page, 20).pipe(
          catchError(() => of({ items: [], hasMore: false }))
        )
      ),
      tap(() => this.loading.set(false))
    ).subscribe(response => {
      this.items.update(current => [...current, ...response.items]);
      this.hasMore.set(response.hasMore);
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 100) {
      this.scrollEnd$.next();
    }
  }
}
```

### 5. Request Queue with Concurrency Limit

```typescript
export class RequestQueueService {
  private queue$ = new Subject<QueuedRequest>();
  private results$ = new Subject<any>();

  constructor() {
    // Process queue with max 3 concurrent requests
    this.queue$.pipe(
      mergeMap(
        request => this.executeRequest(request),
        3 // Max concurrency
      )
    ).subscribe(result => {
      this.results$.next(result);
    });
  }

  enqueue<T>(request: Observable<T>): Observable<T> {
    const id = Math.random().toString(36);

    return new Observable<T>(observer => {
      // Listen for result
      const subscription = this.results$.pipe(
        filter(result => result.id === id),
        take(1)
      ).subscribe({
        next: result => observer.next(result.data),
        error: error => observer.error(error),
        complete: () => observer.complete()
      });

      // Add to queue
      this.queue$.next({ id, request });

      return () => subscription.unsubscribe();
    });
  }

  private executeRequest(queuedRequest: QueuedRequest): Observable<any> {
    return queuedRequest.request.pipe(
      map(data => ({ id: queuedRequest.id, data })),
      catchError(error => of({ id: queuedRequest.id, error }))
    );
  }
}
```

### 6. Optimistic Update Pattern

```typescript
export class OptimisticUpdateService {
  private items$ = new BehaviorSubject<Item[]>([]);

  items = toSignal(this.items$, { initialValue: [] });

  updateItem(id: string, updates: Partial<Item>): Observable<Item> {
    // 1. Optimistic update (immediate UI feedback)
    const currentItems = this.items$.value;
    const optimisticItems = currentItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.items$.next(optimisticItems);

    // 2. API call
    return this.http.patch<Item>(`/api/items/${id}`, updates).pipe(
      tap(updatedItem => {
        // 3. Replace optimistic with real data
        const items = this.items$.value.map(item =>
          item.id === id ? updatedItem : item
        );
        this.items$.next(items);
      }),
      catchError(error => {
        // 4. Rollback on error
        this.items$.next(currentItems);
        return throwError(() => error);
      })
    );
  }

  deleteItem(id: string): Observable<void> {
    const currentItems = this.items$.value;

    // Optimistic delete
    this.items$.next(currentItems.filter(item => item.id !== id));

    return this.http.delete<void>(`/api/items/${id}`).pipe(
      catchError(error => {
        // Rollback
        this.items$.next(currentItems);
        return throwError(() => error);
      })
    );
  }
}
```

### 7. Multi-Source Data Sync

```typescript
export class MultiSourceSyncService {
  private localChanges$ = new Subject<Change>();
  private serverUpdates$ = new Subject<Change>();

  // Merge local and server changes
  allChanges$ = merge(
    this.localChanges$.pipe(
      map(change => ({ ...change, source: 'local' }))
    ),
    this.serverUpdates$.pipe(
      map(change => ({ ...change, source: 'server' }))
    )
  ).pipe(
    // Resolve conflicts (server wins)
    scan((state, change) => {
      if (change.source === 'server') {
        return { ...state, ...change.data };
      }
      // Only apply local if not overridden by server
      return state;
    }, {} as State),
    shareReplay(1)
  );

  applyLocalChange(change: Change): void {
    this.localChanges$.next(change);

    // Sync to server
    this.http.post('/api/sync', change).pipe(
      catchError(error => {
        console.error('Sync failed:', error);
        return EMPTY;
      })
    ).subscribe();
  }

  listenToServerUpdates(): void {
    // WebSocket or polling
    this.websocket.onMessage$.subscribe(update => {
      this.serverUpdates$.next(update);
    });
  }
}
```

### 8. Smart Prefetching

```typescript
export class PrefetchService {
  private cache = new Map<string, Observable<any>>();

  getData(id: string): Observable<Data> {
    if (!this.cache.has(id)) {
      const data$ = this.http.get<Data>(`/api/data/${id}`).pipe(
        shareReplay(1)
      );
      this.cache.set(id, data$);
    }
    return this.cache.get(id)!;
  }

  prefetchNext(currentId: string, nextIds: string[]): void {
    // Prefetch next items when current is loaded
    this.getData(currentId).pipe(
      delay(500), // Small delay to not interfere with current
      switchMap(() => {
        // Prefetch in background
        return forkJoin(
          nextIds.map(id => this.getData(id).pipe(
            catchError(() => EMPTY)
          ))
        );
      })
    ).subscribe();
  }
}
```

### 9. Undo/Redo Pattern

```typescript
interface Action {
  type: string;
  payload: any;
  timestamp: number;
}

export class UndoRedoService {
  private actions$ = new Subject<Action>();
  private undo$ = new Subject<void>();
  private redo$ = new Subject<void>();

  private history: Action[] = [];
  private currentIndex = -1;

  constructor() {
    // Record actions
    this.actions$.subscribe(action => {
      // Remove any actions after current index
      this.history = this.history.slice(0, this.currentIndex + 1);
      // Add new action
      this.history.push(action);
      this.currentIndex++;
    });

    // Handle undo
    this.undo$.pipe(
      filter(() => this.currentIndex > 0)
    ).subscribe(() => {
      this.currentIndex--;
      const action = this.history[this.currentIndex];
      this.revertAction(action);
    });

    // Handle redo
    this.redo$.pipe(
      filter(() => this.currentIndex < this.history.length - 1)
    ).subscribe(() => {
      this.currentIndex++;
      const action = this.history[this.currentIndex];
      this.applyAction(action);
    });
  }

  recordAction(action: Action): void {
    this.actions$.next(action);
  }

  undo(): void {
    this.undo$.next();
  }

  redo(): void {
    this.redo$.next();
  }

  private applyAction(action: Action): void {
    // Implementation
  }

  private revertAction(action: Action): void {
    // Implementation
  }
}
```

### 10. Rate Limiting with Token Bucket

```typescript
export class RateLimiterService {
  private tokens$ = new BehaviorSubject<number>(10); // Max 10 tokens
  private refillInterval$ = interval(1000); // Refill 1 token per second

  constructor() {
    // Refill tokens
    this.refillInterval$.subscribe(() => {
      const current = this.tokens$.value;
      if (current < 10) {
        this.tokens$.next(current + 1);
      }
    });
  }

  executeWithRateLimit<T>(request: Observable<T>): Observable<T> {
    return this.tokens$.pipe(
      first(tokens => tokens > 0),
      tap(() => {
        // Consume token
        this.tokens$.next(this.tokens$.value - 1);
      }),
      switchMap(() => request)
    );
  }
}

// Usage:
this.rateLimiter.executeWithRateLimit(
  this.http.get('/api/data')
).subscribe();
```

### 11. Progressive Data Loading

```typescript
export class ProgressiveLoadService {
  loadDataProgressively(): Observable<ProgressiveData> {
    return concat(
      // 1. Load essential data immediately
      this.http.get<EssentialData>('/api/essential').pipe(
        map(data => ({ essential: data, additional: null, extra: null }))
      ),
      // 2. Load additional data after 500ms
      this.http.get<AdditionalData>('/api/additional').pipe(
        delay(500),
        map(data => ({ essential: null, additional: data, extra: null }))
      ),
      // 3. Load extra data after 1000ms
      this.http.get<ExtraData>('/api/extra').pipe(
        delay(1000),
        map(data => ({ essential: null, additional: null, extra: data }))
      )
    ).pipe(
      scan((acc, curr) => ({ ...acc, ...curr })),
      shareReplay(1)
    );
  }
}
```

### 12. Cancellable HTTP Requests

```typescript
export class CancellableRequestService {
  private cancelRequests$ = new Subject<string>();

  makeRequest<T>(id: string, url: string): Observable<T> {
    return this.http.get<T>(url).pipe(
      takeUntil(
        this.cancelRequests$.pipe(
          filter(cancelId => cancelId === id)
        )
      )
    );
  }

  cancelRequest(id: string): void {
    this.cancelRequests$.next(id);
  }

  cancelAllRequests(): void {
    this.cancelRequests$.next('*');
  }
}
```

### 13. WebSocket with Auto-Reconnect

```typescript
export class WebSocketService {
  private socket$?: Observable<any>;
  private reconnect$ = new Subject<void>();

  connect(url: string): Observable<any> {
    if (!this.socket$) {
      this.socket$ = concat(
        of(null), // Initial connection
        this.reconnect$ // Reconnection triggers
      ).pipe(
        switchMap(() => this.createWebSocket(url)),
        retryWhen(errors =>
          errors.pipe(
            tap(error => console.error('WebSocket error:', error)),
            delay(5000) // Wait 5s before reconnect
          )
        ),
        shareReplay(1)
      );
    }
    return this.socket$;
  }

  private createWebSocket(url: string): Observable<any> {
    return new Observable(observer => {
      const ws = new WebSocket(url);

      ws.onmessage = event => observer.next(JSON.parse(event.data));
      ws.onerror = error => observer.error(error);
      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        this.reconnect$.next();
      };

      return () => ws.close();
    });
  }
}
```
