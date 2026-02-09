# Angular Performance - Code Snippets Ready to Use

## Quick Copy-Paste Code Templates

### 1. Optimized Component Template

```typescript
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <h2>{{ title() }}</h2>

      @if (loading()) {
        <div class="spinner">Loading...</div>
      } @else {
        <div *ngFor="let item of items(); trackBy: trackById" class="item">
          {{ item.name }}
        </div>
      }
    </div>
  `
})
export class MyComponent {
  // Inputs
  items = input.required<Item[]>();
  title = input<string>('Default Title');

  // Outputs
  itemClicked = output<Item>();

  // State
  loading = signal(false);

  // Computed
  itemCount = computed(() => this.items().length);

  // TrackBy
  trackById(index: number, item: Item): string {
    return item.id;
  }
}

interface Item {
  id: string;
  name: string;
}
```

### 2. Virtual Scroll Template

```typescript
import { Component, signal } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-virtual-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport
      itemSize="72"
      class="h-[600px] w-full">

      <div *cdkVirtualFor="let item of items(); trackBy: trackById"
           class="flex items-center h-[72px] border-b px-4">
        <img [src]="item.avatar" class="w-12 h-12 rounded-full" alt="">
        <div class="ml-4">
          <h3 class="font-semibold">{{ item.name }}</h3>
          <p class="text-sm text-gray-600">{{ item.email }}</p>
        </div>
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class VirtualListComponent {
  items = signal<User[]>([]);

  trackById(index: number, item: User): string {
    return item.id;
  }
}
```

### 3. Lazy Image Directive (Copy-Paste Ready)

```typescript
// lazy-load-image.directive.ts
import { Directive, ElementRef, input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  src = input.required<string>();
  placeholder = input<string>('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=');

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLImageElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder());

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          this.observer?.unobserve(this.el.nativeElement);
        }
      });
    });

    this.observer.observe(this.el.nativeElement);
  }

  private loadImage(): void {
    const img = new Image();
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.src());
    };
    img.src = this.src();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

// Usage:
// <img appLazyLoad [src]="imageUrl" alt="...">
```

### 4. Debounce Decorator (Copy-Paste Ready)

```typescript
// debounce.decorator.ts
export function Debounce(delay = 300): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    let timeout: any;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => original.apply(this, args), delay);
    };

    return descriptor;
  };
}

export function Throttle(delay = 300): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    let throttled = false;

    descriptor.value = function (...args: any[]) {
      if (throttled) return;
      original.apply(this, args);
      throttled = true;
      setTimeout(() => { throttled = false; }, delay);
    };

    return descriptor;
  };
}

// Usage:
// @Debounce(300)
// onSearch(query: string): void { ... }
```

### 5. TrackBy Utilities (Copy-Paste Ready)

```typescript
// trackby.util.ts
export function trackById<T extends { id: string | number }>(index: number, item: T): string | number {
  return item.id;
}

export function trackByKey<T>(key: keyof T) {
  return (index: number, item: T): any => item[key];
}

export function trackByIndex(index: number): number {
  return index;
}

export function trackByComposite<T>(...keys: (keyof T)[]) {
  return (index: number, item: T): string => {
    return keys.map(key => String(item[key])).join('_');
  };
}

// Usage:
// trackById = trackById<User>;
// trackByEmail = trackByKey<User>('email');
// trackByUserEmail = trackByComposite<User>('id', 'email');
```

### 6. Pure Pipes (Copy-Paste Ready)

```typescript
// pure-filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pureFilter', standalone: true, pure: true })
export class PureFilterPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, filterFn: (item: T) => boolean): T[] {
    if (!items) return [];
    return items.filter(filterFn);
  }
}

// pure-sort.pipe.ts
@Pipe({ name: 'pureSort', standalone: true, pure: true })
export class PureSortPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    if (!items || items.length === 0) return [];

    return [...items].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

// Usage:
// <div *ngFor="let user of users() | pureFilter:activeFilter | pureSort:'name':'asc'">
```

### 7. Performance Monitor Service (Copy-Paste Ready)

```typescript
// performance-monitor.service.ts
import { Injectable, signal } from '@angular/core';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  metrics = signal<PerformanceMetric[]>([]);

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.addMetric({ name, duration, timestamp: Date.now() });

    if (duration > 100) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.addMetric({ name, duration, timestamp: Date.now() });
    return result;
  }

  startMeasure(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.addMetric({ name, duration, timestamp: Date.now() });
    };
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.update(current => [...current, metric]);
  }
}

// Usage:
// this.perfMonitor.measure('loadData', () => this.processData());
// await this.perfMonitor.measureAsync('fetchUsers', () => this.api.getUsers());
```

### 8. Defer Blocks Templates

```typescript
// Template 1: Viewport-based defer
@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <div class="skeleton-loader"></div>
} @loading (minimum 500ms) {
  <app-spinner />
} @error {
  <div class="error">Failed to load</div>
}

// Template 2: Interaction-based defer
@defer (on interaction) {
  <app-comments-section />
} @placeholder {
  <button>Load Comments</button>
}

// Template 3: Idle-based defer
@defer (on idle) {
  <app-sidebar-widgets />
}

// Template 4: Timer-based defer
@defer (on timer(2s)) {
  <app-footer />
}

// Template 5: Prefetching
@defer (on viewport; prefetch on idle) {
  <app-user-profile />
} @placeholder {
  <div>Loading profile...</div>
}
```

### 9. Lazy Routes Configuration

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes')
      .then(m => m.DASHBOARD_ROUTES),
    data: { preload: true }
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component')
      .then(m => m.AdminComponent),
    canActivate: [authGuard]
  }
];

// dashboard.routes.ts
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/analytics.component').then(m => m.AnalyticsComponent)
  }
];
```

### 10. Custom Preloading Strategy

```typescript
// custom-preload.strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CustomPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data?.['preload']) {
      console.log('Preloading:', route.path);
      return timer(2000).pipe(mergeMap(() => load()));
    }
    return of(null);
  }
}

// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { CustomPreloadStrategy } from './custom-preload.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(CustomPreloadStrategy))
  ]
};
```

### 11. Optimized Data Table Component

```typescript
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-optimized-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <!-- Search -->
      <input
        type="text"
        [value]="searchQuery()"
        (input)="onSearch($event)"
        placeholder="Search..."
        class="mb-4 px-4 py-2 border rounded">

      <!-- Virtual scroll table -->
      <cdk-virtual-scroll-viewport itemSize="50" class="h-[500px]">
        <table class="w-full">
          <thead class="sticky top-0 bg-white">
            <tr>
              <th (click)="sortBy('name')">Name</th>
              <th (click)="sortBy('email')">Email</th>
              <th (click)="sortBy('status')">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *cdkVirtualFor="let row of filteredData(); trackBy: trackById">
              <td>{{ row.name }}</td>
              <td>{{ row.email }}</td>
              <td>{{ row.status }}</td>
            </tr>
          </tbody>
        </table>
      </cdk-virtual-scroll-viewport>

      <p class="mt-2 text-sm text-gray-600">
        Showing {{ filteredData().length }} of {{ data().length }} rows
      </p>
    </div>
  `
})
export class OptimizedTableComponent {
  data = signal<TableRow[]>([]);
  searchQuery = signal('');
  sortColumn = signal<keyof TableRow>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  filteredData = computed(() => {
    let result = this.data();

    // Filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(row =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query)
      );
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    result = [...result].sort((a, b) => {
      if (a[col] < b[col]) return dir === 'asc' ? -1 : 1;
      if (a[col] > b[col]) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  sortBy(column: keyof TableRow): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  trackById(index: number, item: TableRow): string {
    return item.id;
  }
}

interface TableRow {
  id: string;
  name: string;
  email: string;
  status: string;
}
```

### 12. Web Worker Template

```typescript
// heavy-computation.worker.ts
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const result = processData(data);
  postMessage(result);
});

function processData(data: any[]): any[] {
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
}

// web-worker.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebWorkerService {
  private worker?: Worker;
  private messageSubject = new Subject<any>();

  initWorker(): void {
    this.worker = new Worker(new URL('./heavy-computation.worker', import.meta.url));
    this.worker.onmessage = ({ data }) => this.messageSubject.next(data);
  }

  postMessage(data: any): void {
    this.worker?.postMessage(data);
  }

  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  terminateWorker(): void {
    this.worker?.terminate();
  }
}
```

### 13. Complete Performance-Optimized Component

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { LazyLoadImageDirective } from '@shared/directives/lazy-load-image.directive';
import { PureFilterPipe } from '@shared/pipes/pure-filter.pipe';
import { trackById } from '@core/utils/trackby.util';
import { Debounce } from '@core/utils/debounce.util';

@Component({
  selector: 'app-production-ready',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    LazyLoadImageDirective,
    PureFilterPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <!-- Search with debounce -->
      <input
        type="text"
        (input)="onSearchInput($event)"
        placeholder="Search users..."
        class="search-input">

      <!-- Defer heavy analytics -->
      @defer (on viewport) {
        <app-analytics-widget [data]="analyticsData()" />
      } @placeholder {
        <div class="skeleton-analytics"></div>
      }

      <!-- Virtual scrolling with lazy images -->
      <cdk-virtual-scroll-viewport itemSize="80" class="h-[600px]">
        <div
          *cdkVirtualFor="let user of filteredUsers(); trackBy: trackById"
          class="user-card">

          <img
            appLazyLoad
            [src]="user.avatar"
            [placeholder]="placeholderImage"
            class="w-16 h-16 rounded-full"
            alt="">

          <div>
            <h3>{{ user.name }}</h3>
            <p>{{ user.email }}</p>
          </div>
        </div>
      </cdk-virtual-scroll-viewport>

      <p>{{ filteredUsers().length }} users found</p>
    </div>
  `
})
export class ProductionReadyComponent implements OnInit {
  private userService = inject(UserService);

  // State
  users = signal<User[]>([]);
  searchQuery = signal('');
  loading = signal(false);

  // Computed (auto-memoized)
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.users();

    return this.users().filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  analyticsData = computed(() => ({
    total: this.users().length,
    active: this.users().filter(u => u.active).length
  }));

  // Utilities
  trackById = trackById<User>;
  placeholderImage = 'data:image/svg+xml;base64,...';

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

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.debouncedSearch(value);
  }

  @Debounce(300)
  private debouncedSearch(query: string): void {
    this.searchQuery.set(query);
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  active: boolean;
}
```

---

## NPM Scripts for Performance

```json
{
  "scripts": {
    "build:prod": "ng build --configuration=production",
    "build:analyze": "ng build --configuration=production --stats-json && webpack-bundle-analyzer dist/app/stats.json",
    "perf:lighthouse": "lighthouse https://localhost:4200 --view",
    "perf:memory": "node --inspect-brk ./node_modules/@angular/cli/bin/ng serve",
    "bundle:size": "ng build --stats-json && webpack-bundle-analyzer dist/app/stats.json"
  }
}
```
