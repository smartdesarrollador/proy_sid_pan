# Advanced Angular Performance Patterns

## 1. Smart Component Architecture

### Container/Presentational Pattern

```typescript
// Container Component (Smart)
@Component({
  selector: 'app-user-container',
  template: `
    <app-user-list
      [users]="users()"
      [loading]="loading()"
      (userSelected)="onUserSelected($event)"
      (loadMore)="loadMore()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserContainerComponent {
  users = signal<User[]>([]);
  loading = signal(false);

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe(users => {
      this.users.set(users);
      this.loading.set(false);
    });
  }

  onUserSelected(user: User): void {
    // Handle business logic
  }

  loadMore(): void {
    // Pagination logic
  }
}

// Presentational Component (Dumb)
@Component({
  selector: 'app-user-list',
  template: `
    <div *ngFor="let user of users(); trackBy: trackById">
      {{ user.name }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  users = input.required<User[]>();
  loading = input<boolean>(false);

  userSelected = output<User>();
  loadMore = output<void>();

  trackById = trackById<User>;
}
```

## 2. Incremental Loading Pattern

```typescript
@Component({
  selector: 'app-infinite-scroll',
  template: `
    <cdk-virtual-scroll-viewport
      itemSize="72"
      (scrolledIndexChange)="onScroll($event)">

      <div *cdkVirtualFor="let item of items(); trackBy: trackById">
        {{ item.name }}
      </div>

      @if (loading()) {
        <div class="loading-indicator">Loading...</div>
      }
    </cdk-virtual-scroll-viewport>
  `
})
export class InfiniteScrollComponent {
  items = signal<Item[]>([]);
  loading = signal(false);
  page = signal(0);
  hasMore = signal(true);

  private readonly ITEMS_PER_PAGE = 50;
  private readonly THRESHOLD = 0.8; // Load more at 80% scroll

  onScroll(index: number): void {
    const items = this.items();
    const scrollPercentage = index / items.length;

    if (
      scrollPercentage > this.THRESHOLD &&
      !this.loading() &&
      this.hasMore()
    ) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    this.loading.set(true);
    const nextPage = this.page() + 1;

    this.apiService.getItems(nextPage, this.ITEMS_PER_PAGE)
      .subscribe(newItems => {
        this.items.update(current => [...current, ...newItems]);
        this.page.set(nextPage);
        this.hasMore.set(newItems.length === this.ITEMS_PER_PAGE);
        this.loading.set(false);
      });
  }
}
```

## 3. Optimistic Updates Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class OptimisticUpdateService {
  private items = signal<Item[]>([]);

  items$ = this.items.asReadonly();

  addItem(item: Item): void {
    // 1. Optimistic update (immediate UI feedback)
    this.items.update(current => [...current, item]);

    // 2. API call in background
    this.apiService.createItem(item).subscribe({
      next: (savedItem) => {
        // 3. Replace optimistic item with server response
        this.items.update(current =>
          current.map(i => i.id === item.id ? savedItem : i)
        );
      },
      error: (error) => {
        // 4. Rollback on error
        this.items.update(current =>
          current.filter(i => i.id !== item.id)
        );
        this.showError('Failed to save item');
      }
    });
  }

  deleteItem(itemId: string): void {
    const deletedItem = this.items().find(i => i.id === itemId);

    // Optimistic delete
    this.items.update(current => current.filter(i => i.id !== itemId));

    this.apiService.deleteItem(itemId).subscribe({
      error: () => {
        // Rollback
        if (deletedItem) {
          this.items.update(current => [...current, deletedItem]);
        }
        this.showError('Failed to delete item');
      }
    });
  }
}
```

## 4. Request Deduplication Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class DeduplicatedHttpService {
  private cache = new Map<string, Observable<any>>();

  get<T>(url: string, bustCache = false): Observable<T> {
    if (bustCache) {
      this.cache.delete(url);
    }

    if (!this.cache.has(url)) {
      const request$ = this.http.get<T>(url).pipe(
        shareReplay(1), // Share result with all subscribers
        finalize(() => {
          // Remove from cache after completion
          setTimeout(() => this.cache.delete(url), 30000); // 30s TTL
        })
      );

      this.cache.set(url, request$);
    }

    return this.cache.get(url)!;
  }
}

// Usage:
// Multiple components can call getUsers() simultaneously,
// but only 1 HTTP request is made
this.deduplicatedHttp.get<User[]>('/api/users').subscribe(...);
```

## 5. Progressive Hydration Pattern

```typescript
@Component({
  selector: 'app-progressive-page',
  template: `
    <!-- Critical content loads immediately -->
    <app-header />

    <!-- Defer heavy components -->
    @defer (on viewport) {
      <app-analytics-dashboard [data]="analyticsData()" />
    } @placeholder {
      <div class="skeleton-dashboard"></div>
    }

    @defer (on idle) {
      <app-recommendations />
    }

    @defer (on interaction) {
      <app-comments-section />
    } @placeholder {
      <button>Load Comments</button>
    }

    <!-- Footer deferred by 3 seconds -->
    @defer (on timer(3s)) {
      <app-footer />
    }
  `
})
export class ProgressivePageComponent {
  // Only load critical data immediately
  analyticsData = signal<AnalyticsData | null>(null);

  constructor(private analyticsService: AnalyticsService) {
    this.loadCriticalData();
  }

  private loadCriticalData(): void {
    this.analyticsService.getSummary().subscribe(data => {
      this.analyticsData.set(data);
    });
  }
}
```

## 6. Zone Pollution Prevention

```typescript
import { Component, NgZone } from '@angular/core';

@Component({
  selector: 'app-zone-optimized',
  template: `
    <div (mousemove)="onMouseMove($event)">
      Hover me
    </div>
  `
})
export class ZoneOptimizedComponent {
  constructor(private ngZone: NgZone) {}

  onMouseMove(event: MouseEvent): void {
    // Run outside Angular zone (no change detection)
    this.ngZone.runOutsideAngular(() => {
      // Heavy computation or frequent updates
      this.updateMousePosition(event.clientX, event.clientY);
    });
  }

  private updateMousePosition(x: number, y: number): void {
    // Update DOM directly (bypassing Angular)
    const element = document.getElementById('cursor');
    if (element) {
      element.style.transform = `translate(${x}px, ${y}px)`;
    }

    // Only trigger change detection when needed
    if (this.shouldUpdate(x, y)) {
      this.ngZone.run(() => {
        // This triggers change detection
        this.position.set({ x, y });
      });
    }
  }
}
```

## 7. Memory Leak Prevention

```typescript
@Component({
  selector: 'app-leak-free',
  template: `...`
})
export class LeakFreeComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  // ✅ GOOD: Auto-unsubscribe with takeUntil
  ngOnInit(): void {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users.set(users);
      });

    // ✅ GOOD: Use signals (auto-cleanup)
    this.users = this.userService.users;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ❌ BAD: Memory leak
@Component({
  template: `...`
})
export class LeakyComponent {
  ngOnInit(): void {
    // Subscription never cleaned up
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });

    // Interval never cleared
    setInterval(() => {
      console.log('Still running after component destroyed!');
    }, 1000);
  }
}
```

## 8. Reactive Caching Strategy

```typescript
@Injectable({ providedIn: 'root' })
export class CachedDataService {
  private cache$ = new BehaviorSubject<Map<string, CacheEntry<any>>>(new Map());

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  getCached<T>(
    key: string,
    fetcher: () => Observable<T>,
    ttl = this.CACHE_TTL
  ): Observable<T> {
    const cache = this.cache$.value;
    const entry = cache.get(key);

    // Return cached data if valid
    if (entry && Date.now() - entry.timestamp < ttl) {
      return of(entry.data);
    }

    // Fetch new data
    return fetcher().pipe(
      tap(data => {
        const newCache = new Map(cache);
        newCache.set(key, {
          data,
          timestamp: Date.now()
        });
        this.cache$.next(newCache);
      })
    );
  }

  invalidate(key: string): void {
    const cache = new Map(this.cache$.value);
    cache.delete(key);
    this.cache$.next(cache);
  }

  clearAll(): void {
    this.cache$.next(new Map());
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
```

## 9. Skeleton Loading Pattern

```typescript
@Component({
  selector: 'app-user-card-skeleton',
  template: `
    <div class="animate-pulse">
      <div class="h-12 w-12 bg-gray-300 rounded-full"></div>
      <div class="h-4 bg-gray-300 rounded w-3/4 mt-2"></div>
      <div class="h-3 bg-gray-300 rounded w-1/2 mt-2"></div>
    </div>
  `,
  standalone: true
})
export class UserCardSkeletonComponent {}

@Component({
  selector: 'app-user-list',
  template: `
    @if (loading()) {
      <app-user-card-skeleton *ngFor="let _ of [].constructor(5)" />
    } @else {
      <app-user-card
        *ngFor="let user of users(); trackBy: trackById"
        [user]="user" />
    }
  `
})
export class UserListComponent {
  users = signal<User[]>([]);
  loading = signal(true);
  trackById = trackById<User>;
}
```

## 10. Background Sync Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class BackgroundSyncService {
  private syncQueue = signal<SyncTask[]>([]);
  private isSyncing = signal(false);

  constructor(private apiService: ApiService) {
    // Auto-sync every 30 seconds
    interval(30000)
      .pipe(filter(() => !this.isSyncing()))
      .subscribe(() => this.syncPendingTasks());

    // Sync when coming online
    fromEvent(window, 'online').subscribe(() => {
      this.syncPendingTasks();
    });
  }

  queueTask(task: SyncTask): void {
    this.syncQueue.update(queue => [...queue, task]);

    if (navigator.onLine) {
      this.syncPendingTasks();
    }
  }

  private async syncPendingTasks(): Promise<void> {
    const queue = this.syncQueue();
    if (queue.length === 0 || this.isSyncing()) return;

    this.isSyncing.set(true);

    for (const task of queue) {
      try {
        await firstValueFrom(this.apiService.syncTask(task));
        this.syncQueue.update(q => q.filter(t => t.id !== task.id));
      } catch (error) {
        console.error('Sync failed for task:', task.id, error);
      }
    }

    this.isSyncing.set(false);
  }
}

interface SyncTask {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}
```
