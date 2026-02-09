# Advanced Pagination Patterns

Patrones avanzados de paginación para casos de uso complejos.

## Tabla de Contenidos

1. [Cursor-Based Pagination](#cursor-based-pagination)
2. [Optimistic UI Updates](#optimistic-ui-updates)
3. [Prefetching Next Page](#prefetching-next-page)
4. [Pagination con Realtime Updates](#pagination-con-realtime-updates)
5. [Multi-Source Pagination](#multi-source-pagination)
6. [Pagination State Management](#pagination-state-management)
7. [Testing Pagination](#testing-pagination)

---

## Cursor-Based Pagination

Mejor para feeds en tiempo real donde los IDs pueden cambiar.

```typescript
interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class CursorPaginationService {
  private cursors = signal<string[]>([]);
  private currentCursorIndex = signal(0);

  getCursorParams(limit: number = 20): CursorPaginationParams {
    const cursor = this.cursors()[this.currentCursorIndex()];
    return { cursor, limit };
  }

  updateFromResponse<T>(response: CursorPaginatedResponse<T>): void {
    if (response.nextCursor) {
      this.cursors.update(cursors => [...cursors, response.nextCursor!]);
    }
  }

  goToNext(): void {
    this.currentCursorIndex.update(i => i + 1);
  }

  goToPrevious(): void {
    this.currentCursorIndex.update(i => Math.max(0, i - 1));
  }

  reset(): void {
    this.cursors.set([]);
    this.currentCursorIndex.set(0);
  }
}

// Uso
@Component({
  template: `
    <div class="feed">
      @for (item of items(); track item.id) {
        <div>{{ item.content }}</div>
      }

      <button
        [disabled]="!hasMore()"
        (click)="loadMore()"
      >
        Load More
      </button>
    </div>
  `
})
export class CursorPaginatedFeedComponent {
  cursorPagination = inject(CursorPaginationService);
  items = signal<any[]>([]);
  hasMore = signal(true);

  loadMore(): void {
    const params = this.cursorPagination.getCursorParams(20);

    this.http.get<CursorPaginatedResponse<any>>('/api/feed', { params })
      .subscribe(response => {
        this.items.update(current => [...current, ...response.data]);
        this.hasMore.set(response.hasMore);
        this.cursorPagination.updateFromResponse(response);
      });
  }
}
```

---

## Optimistic UI Updates

Actualizar UI inmediatamente antes de confirmar con servidor.

```typescript
import { Component, signal } from '@angular/core';

interface OptimisticItem {
  id: string;
  data: any;
  isPending?: boolean;
  error?: string;
}

@Component({
  selector: 'app-optimistic-list',
  template: `
    <div class="list">
      @for (item of items(); track item.id) {
        <div
          class="item"
          [class.pending]="item.isPending"
          [class.error]="item.error"
        >
          {{ item.data.title }}

          @if (item.isPending) {
            <span class="spinner"></span>
          }

          @if (item.error) {
            <button (click)="retryItem(item)">Retry</button>
          }

          <button (click)="deleteItem(item.id)">Delete</button>
        </div>
      }

      <button (click)="addItem()">Add Item</button>

      <app-pagination [data]="paginationData()" />
    </div>
  `
})
export class OptimisticListComponent {
  items = signal<OptimisticItem[]>([]);
  private tempIdCounter = 0;

  addItem(): void {
    const tempId = `temp-${++this.tempIdCounter}`;
    const newItem: OptimisticItem = {
      id: tempId,
      data: { title: 'New Item' },
      isPending: true
    };

    // Optimistic update
    this.items.update(current => [newItem, ...current]);

    // API call
    this.http.post<any>('/api/items', newItem.data)
      .subscribe({
        next: (response) => {
          // Replace temp with real ID
          this.items.update(current =>
            current.map(item =>
              item.id === tempId
                ? { ...item, id: response.id, isPending: false }
                : item
            )
          );
        },
        error: () => {
          // Mark as error
          this.items.update(current =>
            current.map(item =>
              item.id === tempId
                ? { ...item, isPending: false, error: 'Failed to create' }
                : item
            )
          );
        }
      });
  }

  deleteItem(id: string): void {
    // Optimistic remove
    const removedItem = this.items().find(i => i.id === id);
    this.items.update(current => current.filter(i => i.id !== id));

    // API call
    this.http.delete(`/api/items/${id}`)
      .subscribe({
        error: () => {
          // Rollback on error
          if (removedItem) {
            this.items.update(current => [removedItem, ...current]);
          }
        }
      });
  }

  retryItem(item: OptimisticItem): void {
    // Retry failed operation
    this.items.update(current =>
      current.map(i =>
        i.id === item.id
          ? { ...i, isPending: true, error: undefined }
          : i
      )
    );

    this.http.post('/api/items', item.data)
      .subscribe({
        next: (response) => {
          this.items.update(current =>
            current.map(i =>
              i.id === item.id
                ? { ...i, id: response.id, isPending: false }
                : i
            )
          );
        },
        error: () => {
          this.items.update(current =>
            current.map(i =>
              i.id === item.id
                ? { ...i, isPending: false, error: 'Failed to create' }
                : i
            )
          );
        }
      });
  }
}
```

---

## Prefetching Next Page

Cargar siguiente página en background para UX fluida.

```typescript
import { Component, effect } from '@angular/core';

@Component({
  selector: 'app-prefetch-pagination'
})
export class PrefetchPaginationComponent {
  pagination = inject(PaginationService);
  private prefetchedPages = new Map<number, any[]>();

  constructor() {
    // Effect: prefetch next page cuando cambia página actual
    effect(() => {
      const current = this.pagination.currentPage();
      const next = current + 1;

      if (this.pagination.hasNext() && !this.prefetchedPages.has(next)) {
        this.prefetchPage(next);
      }
    });
  }

  private prefetchPage(page: number): void {
    this.http.get('/api/items', {
      params: {
        page,
        pageSize: this.pagination.pageSize()
      }
    }).subscribe(response => {
      this.prefetchedPages.set(page, response.data);
    });
  }

  goToNextPage(): void {
    const nextPage = this.pagination.currentPage() + 1;

    // Check if already prefetched
    if (this.prefetchedPages.has(nextPage)) {
      const data = this.prefetchedPages.get(nextPage)!;
      this.items.set(data);
      this.pagination.goToNext();
      this.prefetchedPages.delete(nextPage);
    } else {
      // Load normally
      this.loadPage(nextPage);
    }
  }
}
```

---

## Pagination con Realtime Updates

Sincronizar paginación con actualizaciones en tiempo real (WebSockets).

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

interface RealtimeUpdate {
  type: 'create' | 'update' | 'delete';
  id: string;
  data?: any;
}

@Component({
  selector: 'app-realtime-pagination'
})
export class RealtimePaginationComponent implements OnInit, OnDestroy {
  private ws$?: WebSocketSubject<RealtimeUpdate>;
  items = signal<any[]>([]);
  pagination = inject(PaginationService);

  ngOnInit(): void {
    this.loadPage(1);
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.ws$?.complete();
  }

  private setupWebSocket(): void {
    this.ws$ = webSocket('wss://api.example.com/updates');

    this.ws$.subscribe(update => {
      this.handleRealtimeUpdate(update);
    });
  }

  private handleRealtimeUpdate(update: RealtimeUpdate): void {
    switch (update.type) {
      case 'create':
        // Solo agregar si estamos en primera página
        if (this.pagination.currentPage() === 1) {
          this.items.update(current => [update.data, ...current]);
          this.pagination.updateTotalItems(this.pagination.totalItems() + 1);
        } else {
          // Mostrar notificación "Nuevos items disponibles"
          this.showNewItemsNotification();
        }
        break;

      case 'update':
        // Actualizar item si está en página actual
        this.items.update(current =>
          current.map(item =>
            item.id === update.id ? { ...item, ...update.data } : item
          )
        );
        break;

      case 'delete':
        // Remover item si está en página actual
        const wasInCurrentPage = this.items().some(i => i.id === update.id);

        if (wasInCurrentPage) {
          this.items.update(current => current.filter(i => i.id !== update.id));
          this.pagination.updateTotalItems(this.pagination.totalItems() - 1);

          // Reload si quedó vacía la página
          if (this.items().length === 0 && this.pagination.totalPages() > 0) {
            this.loadPage(this.pagination.currentPage());
          }
        }
        break;
    }
  }

  private showNewItemsNotification(): void {
    // Mostrar badge o notificación "Nuevos items"
    // Usuario puede hacer click para recargar
  }
}
```

---

## Multi-Source Pagination

Combinar resultados de múltiples fuentes.

```typescript
import { combineLatest, forkJoin } from 'rxjs';

interface MultiSourceResult<T> {
  source: string;
  data: T[];
  total: number;
}

@Component({
  selector: 'app-multi-source-search'
})
export class MultiSourceSearchComponent {
  results = signal<any[]>([]);
  sources = ['users', 'posts', 'comments'];

  searchAll(query: string): void {
    const searches = this.sources.map(source =>
      this.http.get<PaginatedResponse<any>>(`/api/${source}/search`, {
        params: { q: query, page: 1, pageSize: 5 }
      }).pipe(
        map(response => ({
          source,
          data: response.data,
          total: response.total
        }))
      )
    );

    forkJoin(searches).subscribe(results => {
      // Combinar resultados
      const combined = results.flatMap(r =>
        r.data.map(item => ({ ...item, _source: r.source }))
      );

      this.results.set(combined);
    });
  }

  loadMoreFrom(source: string): void {
    // Cargar más de una fuente específica
  }
}
```

---

## Pagination State Management

State management robusto con NgRx o Akita.

```typescript
// pagination.state.ts
import { createFeature, createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import * as PaginationActions from './pagination.actions';

export interface PaginationState<T> extends EntityState<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function createPaginationAdapter<T>(selectId: (model: T) => string) {
  return createEntityAdapter<T>({ selectId });
}

export function createPaginationReducer<T>(
  adapter: EntityAdapter<T>
) {
  const initialState: PaginationState<T> = adapter.getInitialState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    error: null
  });

  return createReducer(
    initialState,
    on(PaginationActions.loadPage, (state) => ({
      ...state,
      isLoading: true,
      error: null
    })),
    on(PaginationActions.loadPageSuccess, (state, { response }) =>
      adapter.setAll(response.data, {
        ...state,
        currentPage: response.page,
        totalItems: response.total,
        totalPages: response.totalPages,
        isLoading: false
      })
    ),
    on(PaginationActions.loadPageFailure, (state, { error }) => ({
      ...state,
      isLoading: false,
      error
    })),
    on(PaginationActions.changePageSize, (state, { pageSize }) => ({
      ...state,
      pageSize,
      currentPage: 1
    }))
  );
}

// Uso en componente
@Component({
  selector: 'app-ngrx-pagination'
})
export class NgrxPaginationComponent {
  private store = inject(Store);

  items$ = this.store.select(selectAllItems);
  isLoading$ = this.store.select(selectIsLoading);
  pagination$ = this.store.select(selectPaginationInfo);

  ngOnInit(): void {
    this.store.dispatch(PaginationActions.loadPage({ page: 1 }));
  }

  onPageChange(page: number): void {
    this.store.dispatch(PaginationActions.loadPage({ page }));
  }
}
```

---

## Testing Pagination

### Unit Tests

```typescript
import { TestBed } from '@angular/core/testing';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationService);
  });

  it('should initialize with default values', () => {
    expect(service.currentPage()).toBe(1);
    expect(service.pageSize()).toBe(10);
    expect(service.totalItems()).toBe(0);
  });

  it('should update from response', () => {
    const response = {
      data: [],
      total: 100,
      page: 2,
      pageSize: 10,
      totalPages: 10,
      hasNext: true,
      hasPrevious: true
    };

    service.updateFromResponse(response);

    expect(service.currentPage()).toBe(2);
    expect(service.totalItems()).toBe(100);
    expect(service.totalPages()).toBe(10);
    expect(service.hasNext()).toBe(true);
  });

  it('should navigate to next page', () => {
    service.updateFromResponse({
      data: [],
      total: 100,
      page: 1,
      pageSize: 10,
      totalPages: 10,
      hasNext: true,
      hasPrevious: false
    });

    service.goToNext();

    expect(service.currentPage()).toBe(2);
    expect(service.hasPrevious()).toBe(true);
  });

  it('should not go beyond last page', () => {
    service.updateFromResponse({
      data: [],
      total: 100,
      page: 10,
      pageSize: 10,
      totalPages: 10,
      hasNext: false,
      hasPrevious: true
    });

    service.goToNext();

    expect(service.currentPage()).toBe(10);
  });

  it('should calculate visible pages correctly', () => {
    service.updateFromResponse({
      data: [],
      total: 100,
      page: 5,
      pageSize: 10,
      totalPages: 10,
      hasNext: true,
      hasPrevious: true
    });

    const visible = service.visiblePages();

    expect(visible).toContain(5);
    expect(visible.length).toBeLessThanOrEqual(5);
  });
});
```

### Component Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersListComponent } from './users-list.component';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load first page on init', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/users?page=1&pageSize=10');
    expect(req.request.method).toBe('GET');

    req.flush({
      data: [{ id: 1, name: 'User 1' }],
      total: 50,
      page: 1,
      pageSize: 10,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false
    });

    expect(component.users().length).toBe(1);
    expect(component.pagination.totalPages()).toBe(5);
  });

  it('should navigate to next page', () => {
    component.ngOnInit();

    // First page
    httpMock.expectOne('/api/users?page=1&pageSize=10').flush({
      data: [{ id: 1, name: 'User 1' }],
      total: 50,
      page: 1,
      pageSize: 10,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false
    });

    // Go to next
    component.onNext();

    const req = httpMock.expectOne('/api/users?page=2&pageSize=10');
    req.flush({
      data: [{ id: 2, name: 'User 2' }],
      total: 50,
      page: 2,
      pageSize: 10,
      totalPages: 5,
      hasNext: true,
      hasPrevious: true
    });

    expect(component.pagination.currentPage()).toBe(2);
  });

  it('should handle errors', () => {
    component.ngOnInit();

    const req = httpMock.expectOne('/api/users?page=1&pageSize=10');
    req.error(new ErrorEvent('Network error'));

    expect(component.pagination.error()).toBeTruthy();
    expect(component.pagination.isLoading()).toBe(false);
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('should display first page of users', async ({ page }) => {
    await expect(page.locator('.user-item')).toHaveCount(10);
    await expect(page.locator('[aria-current="page"]')).toHaveText('1');
  });

  test('should navigate to next page', async ({ page }) => {
    await page.click('button[aria-label="Go to next page"]');

    await expect(page.locator('[aria-current="page"]')).toHaveText('2');
    await expect(page).toHaveURL(/page=2/);
  });

  test('should change page size', async ({ page }) => {
    await page.selectOption('select[name="pageSize"]', '25');

    await expect(page.locator('.user-item')).toHaveCount(25);
    await expect(page).toHaveURL(/pageSize=25/);
  });

  test('should maintain scroll position', async ({ page }) => {
    await page.click('button[aria-label="Go to next page"]');

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0); // Should scroll to top
  });

  test('infinite scroll should load more items', async ({ page }) => {
    const initialCount = await page.locator('.item').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for new items
    await page.waitForSelector(`.item:nth-child(${initialCount + 1})`);

    const newCount = await page.locator('.item').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});
```

---

## Performance Monitoring

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaginationPerformanceService {
  private metrics = {
    loadTime: [] as number[],
    renderTime: [] as number[],
    totalItems: 0
  };

  measureLoadTime<T>(fn: () => Observable<T>): Observable<T> {
    const start = performance.now();

    return fn().pipe(
      tap(() => {
        const end = performance.now();
        const duration = end - start;
        this.metrics.loadTime.push(duration);

        console.log(`Load time: ${duration.toFixed(2)}ms`);
      })
    );
  }

  measureRenderTime(callback: () => void): void {
    const start = performance.now();
    callback();

    requestAnimationFrame(() => {
      const end = performance.now();
      const duration = end - start;
      this.metrics.renderTime.push(duration);

      console.log(`Render time: ${duration.toFixed(2)}ms`);
    });
  }

  getAverageLoadTime(): number {
    const times = this.metrics.loadTime;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getMetrics() {
    return {
      avgLoadTime: this.getAverageLoadTime(),
      avgRenderTime: this.metrics.renderTime.reduce((a, b) => a + b, 0) / this.metrics.renderTime.length,
      totalRequests: this.metrics.loadTime.length
    };
  }
}
```

---

## Best Practices Summary

1. **Use cursor-based pagination** para feeds en tiempo real
2. **Implement optimistic updates** para mejor UX
3. **Prefetch next page** para navegación instantánea
4. **Handle realtime updates** correctamente
5. **Test extensively** con unit y E2E tests
6. **Monitor performance** en producción
7. **Cache strategically** para reducir requests
8. **Handle errors gracefully** con retry logic
9. **Maintain scroll position** al navegar
10. **Accessibility first** con ARIA labels

---

Para más ejemplos, consultar las referencias de server-side e infinite scroll.
