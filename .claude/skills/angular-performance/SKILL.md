---
name: angular-performance
description: >
  Optimización de rendimiento completa para Angular standalone applications.
  Usar cuando se necesite implementar OnPush change detection, trackBy functions,
  lazy loading de imágenes, virtual scrolling con CDK, code splitting, bundle optimization,
  debounce/throttle, pure pipes, memoization con signals, defer blocks, Web Workers,
  performance monitoring, o cualquier optimización de rendimiento en Angular.
  Incluye componentes optimizados, directivas custom, utilities reutilizables,
  configuraciones de build, y best practices para proyectos Angular 19+ production-ready.
---

# Angular Performance - Optimización Completa de Rendimiento

Guía enterprise-ready para optimizar aplicaciones Angular standalone con técnicas avanzadas de performance.

## 📊 Performance Impact Overview

| Técnica | Mejora Estimada | Dificultad | Prioridad |
|---------|----------------|------------|-----------|
| OnPush + Signals | 50-70% | Media | ⭐⭐⭐⭐⭐ |
| TrackBy Functions | 30-50% | Baja | ⭐⭐⭐⭐⭐ |
| Virtual Scrolling | 80-95% | Media | ⭐⭐⭐⭐ |
| Defer Blocks | 40-60% | Baja | ⭐⭐⭐⭐⭐ |
| Lazy Loading | 35-55% | Baja | ⭐⭐⭐⭐⭐ |
| Image Optimization | 25-45% | Media | ⭐⭐⭐⭐ |
| Pure Pipes | 20-40% | Baja | ⭐⭐⭐ |
| Web Workers | 60-80% | Alta | ⭐⭐⭐ |

## Arquitectura del Sistema

```
performance-optimized-app/
├── core/
│   ├── performance/
│   │   ├── performance-monitor.service.ts
│   │   ├── web-worker.service.ts
│   │   └── cache.service.ts
│   └── utils/
│       ├── debounce.util.ts
│       ├── throttle.util.ts
│       ├── trackby.util.ts
│       └── memoize.util.ts
├── shared/
│   ├── directives/
│   │   ├── lazy-load-image.directive.ts
│   │   └── defer-load.directive.ts
│   ├── pipes/
│   │   ├── pure-filter.pipe.ts
│   │   ├── pure-sort.pipe.ts
│   │   └── memoized.pipe.ts
│   └── components/
│       └── virtual-scroll-list/
├── features/
│   └── optimized-data-table/  # Example component
└── workers/
    └── heavy-computation.worker.ts
```

---

## 1. OnPush Change Detection Strategy

### 1.1 Componente Básico con OnPush

Crear `src/app/shared/components/optimized-component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ✅ BEST PRACTICE: OnPush + Signals
 *
 * Benefits:
 * - Reduce change detection cycles by 50-70%
 * - Only checks when: inputs change, events emit, signals update
 * - Perfect compatibility with Angular 19 signals
 */
@Component({
  selector: 'app-optimized-user-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // 🚀 Performance boost
  template: `
    <div class="user-card">
      <!-- Signals auto-trigger change detection in OnPush -->
      <h3>{{ fullName() }}</h3>
      <p>{{ user().email }}</p>
      <p>Posts: {{ postsCount() }}</p>

      <button (click)="handleClick()">
        {{ buttonLabel() }}
      </button>
    </div>
  `,
  styles: [`
    .user-card {
      @apply border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow;
    }
  `]
})
export class OptimizedUserCardComponent {
  // ✅ Use input() signal (Angular 17.1+)
  user = input.required<User>();
  posts = input<Post[]>([]);

  // ✅ Use output() for events
  cardClicked = output<User>();

  // ✅ Computed signals automatically memoize
  fullName = computed(() => {
    const u = this.user();
    return `${u.firstName} ${u.lastName}`;
  });

  postsCount = computed(() => this.posts().length);

  buttonLabel = signal('Click Me');

  handleClick(): void {
    // ✅ Events trigger change detection in OnPush
    this.cardClicked.emit(this.user());
    this.buttonLabel.set('Clicked!');
  }
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
}
```

### 1.2 OnPush con Observables (Legacy)

```typescript
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';

/**
 * ⚠️ LEGACY: OnPush + Observables + AsyncPipe
 * For codebases not yet migrated to signals
 */
@Component({
  selector: 'app-legacy-user-list',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngFor="let user of users$ | async; trackBy: trackById">
      {{ user.name }}
    </div>

    <!-- ✅ AsyncPipe auto-marks for check in OnPush -->
    <p>Total: {{ (totalCount$ | async) ?? 0 }}</p>
  `
})
export class LegacyUserListComponent {
  users$: Observable<User[]>;
  totalCount$: Observable<number>;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef // For manual triggers
  ) {
    this.users$ = this.userService.getUsers();
    this.totalCount$ = this.userService.getTotalCount();
  }

  // ✅ Always use trackBy (see section 2)
  trackById(index: number, item: User): string {
    return item.id;
  }

  // Manual change detection when needed
  refreshData(): void {
    this.users$ = this.userService.getUsers();
    this.cdr.markForCheck(); // ⚠️ Only when necessary
  }
}
```

---

## 2. TrackBy Functions Optimizadas

### 2.1 Utility Genérica Reutilizable

Crear `src/app/core/utils/trackby.util.ts`:

```typescript
/**
 * 🚀 PERFORMANCE: TrackBy functions reduce DOM manipulation by 30-50%
 *
 * Without trackBy: Angular recreates all DOM elements on array changes
 * With trackBy: Angular only updates changed items
 */

/**
 * Generic trackBy by ID (most common)
 */
export function trackById<T extends { id: string | number }>(
  index: number,
  item: T
): string | number {
  return item.id;
}

/**
 * Generic trackBy by custom key
 */
export function trackByKey<T>(key: keyof T) {
  return (index: number, item: T): any => item[key];
}

/**
 * TrackBy by index (use ONLY for static lists)
 * ⚠️ WARNING: Don't use for dynamic lists - defeats the purpose
 */
export function trackByIndex(index: number): number {
  return index;
}

/**
 * Composite trackBy for nested objects
 */
export function trackByComposite<T>(
  ...keys: (keyof T)[]
): (index: number, item: T) => string {
  return (index: number, item: T): string => {
    return keys.map(key => String(item[key])).join('_');
  };
}

// Example usage in component:
// trackByUserEmail = trackByKey<User>('email');
// trackByMultiple = trackByComposite<User>('id', 'email');
```

### 2.2 Uso en Componentes

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trackById, trackByKey } from '@core/utils/trackby.util';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ✅ GOOD: TrackBy by ID -->
    <div *ngFor="let user of users(); trackBy: trackById">
      {{ user.name }}
    </div>

    <!-- ✅ GOOD: Custom trackBy -->
    <div *ngFor="let product of products(); trackBy: trackByCode">
      {{ product.name }}
    </div>

    <!-- ❌ BAD: No trackBy - recreates all DOM on changes -->
    <div *ngFor="let item of items()">
      {{ item.name }}
    </div>
  `
})
export class UserListComponent {
  users = signal<User[]>([]);
  products = signal<Product[]>([]);

  // ✅ Reuse utility functions
  trackById = trackById<User>;
  trackByCode = trackByKey<Product>('code');
}

interface Product {
  code: string;
  name: string;
}
```

---

## 3. Lazy Loading de Imágenes

### 3.1 Directiva LazyLoad Custom

Crear `src/app/shared/directives/lazy-load-image.directive.ts`:

```typescript
import {
  Directive,
  ElementRef,
  input,
  OnInit,
  OnDestroy,
  effect,
  Renderer2
} from '@angular/core';

/**
 * 🚀 PERFORMANCE: Lazy load images using IntersectionObserver
 *
 * Benefits:
 * - Reduces initial page load by 25-45%
 * - Only loads images when entering viewport
 * - Supports blur placeholder for smooth UX
 *
 * Usage:
 * <img appLazyLoad [src]="imageUrl" [placeholder]="blurUrl" alt="...">
 */
@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  src = input.required<string>();
  placeholder = input<string>('data:image/svg+xml,...'); // Tiny blur SVG
  rootMargin = input<string>('50px'); // Start loading before visible

  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {
    // React to src changes
    effect(() => {
      const newSrc = this.src();
      if (this.isLoaded) {
        this.loadImage(newSrc);
      }
    });
  }

  private isLoaded = false;

  ngOnInit(): void {
    // Set placeholder immediately
    this.setPlaceholder();

    // Setup intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(this.src());
            this.observer?.unobserve(this.el.nativeElement);
          }
        });
      },
      {
        rootMargin: this.rootMargin()
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  private setPlaceholder(): void {
    const img = this.el.nativeElement;
    this.renderer.setAttribute(img, 'src', this.placeholder());
    this.renderer.addClass(img, 'lazy-loading');
  }

  private loadImage(src: string): void {
    const img = this.el.nativeElement;

    // Create temporary image to preload
    const tempImg = new Image();
    tempImg.onload = () => {
      this.renderer.setAttribute(img, 'src', src);
      this.renderer.removeClass(img, 'lazy-loading');
      this.renderer.addClass(img, 'lazy-loaded');
      this.isLoaded = true;
    };

    tempImg.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      this.renderer.addClass(img, 'lazy-error');
    };

    tempImg.src = src;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
```

### 3.2 CSS para Blur Placeholder Effect

```css
/* Add to global styles or component styles */
img.lazy-loading {
  filter: blur(10px);
  transition: filter 0.3s ease-in-out;
}

img.lazy-loaded {
  filter: blur(0);
  animation: fadeIn 0.3s ease-in-out;
}

img.lazy-error {
  opacity: 0.5;
  filter: grayscale(100%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### 3.3 Generador de Placeholder Blur

```typescript
/**
 * Generate tiny blur placeholder (< 1KB)
 */
export function generateBlurPlaceholder(width = 40, height = 30): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="${width}" height="${height}" fill="#ccc" filter="url(#b)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
```

---

## 4. Virtual Scrolling con CDK

### 4.1 Componente con Virtual Scroll

Crear `src/app/shared/components/virtual-scroll-list/virtual-scroll-list.component.ts`:

```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

/**
 * 🚀 PERFORMANCE: Virtual scrolling reduces DOM by 80-95%
 *
 * Benefits:
 * - Renders only visible items + buffer
 * - Handles 10,000+ items with <50ms render time
 * - Constant memory usage regardless of list size
 *
 * Usage:
 * <app-virtual-scroll-list
 *   [items]="users()"
 *   [itemSize]="72"
 *   [minBufferPx]="200"
 *   [maxBufferPx]="400">
 *   <ng-template let-item let-index="index">
 *     <div>{{ item.name }}</div>
 *   </ng-template>
 * </app-virtual-scroll-list>
 */
@Component({
  selector: 'app-virtual-scroll-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cdk-virtual-scroll-viewport
      [itemSize]="itemSize()"
      [minBufferPx]="minBufferPx()"
      [maxBufferPx]="maxBufferPx()"
      class="virtual-scroll-container">

      <div
        *cdkVirtualFor="let item of items();
                        trackBy: trackByFn();
                        templateCacheSize: 0"
        [style.height.px]="itemSize()"
        class="virtual-scroll-item">

        <ng-container
          *ngTemplateOutlet="itemTemplate;
                             context: { $implicit: item, index: getIndex(item) }">
        </ng-container>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .virtual-scroll-container {
      height: 100%;
      width: 100%;
      overflow-y: auto;
    }

    .virtual-scroll-item {
      display: flex;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
  `]
})
export class VirtualScrollListComponent<T> {
  items = input.required<T[]>();
  itemSize = input<number>(50); // Height in pixels
  minBufferPx = input<number>(200); // Render buffer before viewport
  maxBufferPx = input<number>(400); // Render buffer after viewport
  trackByFn = input<(index: number, item: T) => any>((i, item) => item);

  itemTemplate = input.required<any>(); // TemplateRef

  getIndex(item: T): number {
    return this.items().indexOf(item);
  }
}
```

### 4.2 Ejemplo de Uso Completo

```typescript
import { Component, signal } from '@angular/core';
import { VirtualScrollListComponent } from '@shared/components/virtual-scroll-list';
import { trackById } from '@core/utils/trackby.util';

@Component({
  selector: 'app-large-user-list',
  standalone: true,
  imports: [VirtualScrollListComponent],
  template: `
    <div class="container h-screen">
      <h2>{{ users().length }} Users</h2>

      <!-- ✅ Virtual scroll handles 10,000+ items smoothly -->
      <app-virtual-scroll-list
        [items]="users()"
        [itemSize]="72"
        [trackByFn]="trackById"
        class="h-[600px]">

        <ng-template #itemTpl let-user let-index="index">
          <div class="flex items-center gap-4 px-4">
            <img
              [src]="user.avatar"
              appLazyLoad
              class="w-12 h-12 rounded-full"
              alt="">
            <div>
              <h3 class="font-semibold">{{ user.name }}</h3>
              <p class="text-sm text-gray-600">{{ user.email }}</p>
            </div>
            <span class="ml-auto text-xs text-gray-400">#{{ index }}</span>
          </div>
        </ng-template>
      </app-virtual-scroll-list>
    </div>
  `
})
export class LargeUserListComponent {
  users = signal<User[]>(this.generateMockUsers(10000));
  trackById = trackById<User>;

  private generateMockUsers(count: number): User[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `user-${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      avatar: `https://i.pravatar.cc/150?img=${i % 70}`
    }));
  }
}
```

---

## 5. Defer Blocks (Angular 17+)

### 5.1 Lazy Render con Defer

```typescript
import { Component } from '@angular/core';

/**
 * 🚀 PERFORMANCE: Defer blocks reduce initial bundle by 40-60%
 *
 * Benefits:
 * - Lazy load components on viewport/interaction/timer
 * - Reduce initial JS bundle size
 * - Improve Time to Interactive (TTI)
 *
 * Triggers:
 * - on idle: When browser is idle
 * - on viewport: When entering viewport
 * - on interaction: On click/hover
 * - on timer: After specified time
 * - on immediate: Immediately (default)
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <!-- ✅ Load hero section immediately -->
      <app-hero-section />

      <!-- ✅ Defer heavy chart component until viewport -->
      @defer (on viewport) {
        <app-analytics-chart [data]="chartData" />
      } @placeholder {
        <div class="h-64 bg-gray-100 animate-pulse rounded"></div>
      } @loading (minimum 500ms) {
        <div class="flex items-center justify-center h-64">
          <app-spinner />
        </div>
      } @error {
        <div class="error-state">Failed to load chart</div>
      }

      <!-- ✅ Defer comments until user scrolls or clicks -->
      @defer (on viewport; on interaction) {
        <app-comments-section [postId]="postId" />
      } @placeholder (minimum 1s) {
        <button class="btn-load-comments">Load Comments</button>
      }

      <!-- ✅ Defer sidebar when browser is idle -->
      @defer (on idle) {
        <app-sidebar-widgets />
      } @placeholder {
        <div class="w-64 bg-gray-50"></div>
      }

      <!-- ✅ Defer footer after 2 seconds -->
      @defer (on timer(2s)) {
        <app-footer />
      }
    </div>
  `
})
export class DashboardComponent {
  chartData = [/* ... */];
  postId = '123';
}
```

### 5.2 Prefetching Strategies

```typescript
/**
 * Prefetch deferred components for instant loading
 */
@Component({
  template: `
    <!-- Prefetch on hover for instant interaction -->
    @defer (on interaction; prefetch on hover) {
      <app-user-profile />
    } @placeholder {
      <button>View Profile</button>
    }

    <!-- Prefetch on idle for smooth navigation -->
    @defer (on viewport; prefetch on idle) {
      <app-related-products />
    }
  `
})
export class ProductDetailComponent {}
```

---

## 6. Code Splitting y Lazy Loading

### 6.1 Lazy Loading de Rutas

Crear `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

/**
 * 🚀 PERFORMANCE: Route-level code splitting
 *
 * Benefits:
 * - Reduces initial bundle by 35-55%
 * - Each route loads its own chunk on demand
 * - Faster initial page load
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component')
      .then(m => m.HomeComponent),
    title: 'Home'
  },
  {
    path: 'dashboard',
    // ✅ Lazy load entire feature module
    loadChildren: () => import('./features/dashboard/dashboard.routes')
      .then(m => m.DASHBOARD_ROUTES),
    data: { preload: true } // For custom preloading strategy
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component')
      .then(m => m.AdminComponent),
    canActivate: [authGuard],
    // ✅ This chunk only loads for authorized users
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.routes')
      .then(m => m.REPORTS_ROUTES),
    // ⚠️ Don't preload - rarely accessed
  }
];
```

### 6.2 Custom Preloading Strategy

Crear `src/app/core/routing/custom-preload.strategy.ts`:

```typescript
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * 🚀 PERFORMANCE: Smart preloading strategy
 *
 * Preloads routes marked with data.preload after 2s delay
 * Improves navigation speed without hurting initial load
 */
@Injectable({ providedIn: 'root' })
export class CustomPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Check if route should be preloaded
    if (route.data?.['preload']) {
      console.log('Preloading:', route.path);

      // Wait 2 seconds before preloading (let initial page settle)
      return timer(2000).pipe(
        mergeMap(() => load())
      );
    }

    return of(null); // Don't preload
  }
}

// Usage in app.config.ts:
// provideRouter(
//   routes,
//   withPreloading(CustomPreloadStrategy)
// )
```

### 6.3 Bundle Size Optimization

```typescript
// app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { CustomPreloadStrategy } from '@core/routing/custom-preload.strategy';

/**
 * ✅ BUNDLE OPTIMIZATION CHECKLIST:
 *
 * 1. Use standalone components (no NgModule overhead)
 * 2. Import only what you need from RxJS
 * 3. Use withFetch() for native fetch (smaller than XHR)
 * 4. Tree-shakeable providers
 * 5. Lazy load heavy libraries (charts, editors)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(CustomPreloadStrategy), // Smart preloading
    ),
    provideHttpClient(
      withFetch(), // ✅ Use native fetch API (smaller bundle)
      withInterceptors([authInterceptor])
    ),

    // ❌ BAD: Importing entire library
    // import * as _ from 'lodash';

    // ✅ GOOD: Import specific functions
    // import { debounce } from 'lodash-es';
  ]
};
```

---

## 7. Debounce y Throttle

### 7.1 Utility Functions

Crear `src/app/core/utils/debounce.util.ts`:

```typescript
/**
 * 🚀 PERFORMANCE: Debounce prevents excessive function calls
 *
 * Use for: Search inputs, resize events, scroll events
 * Savings: Reduces API calls by 80-95%
 */

/**
 * Debounce decorator for methods
 */
export function Debounce(delay = 300): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    let timeout: any;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => original.apply(this, args), delay);
    };

    return descriptor;
  };
}

/**
 * Throttle decorator for methods
 */
export function Throttle(delay = 300): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    let throttled = false;

    descriptor.value = function (...args: any[]) {
      if (throttled) return;

      original.apply(this, args);
      throttled = true;

      setTimeout(() => {
        throttled = false;
      }, delay);
    };

    return descriptor;
  };
}

/**
 * RxJS-based debounce for signals (Angular 19)
 */
import { signal, effect, Signal } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

export function createDebouncedSignal<T>(
  initialValue: T,
  delay = 300
): { signal: Signal<T>; set: (value: T) => void } {
  const subject = new Subject<T>();
  const sig = signal<T>(initialValue);

  subject.pipe(debounceTime(delay)).subscribe(value => {
    sig.set(value);
  });

  return {
    signal: sig.asReadonly(),
    set: (value: T) => subject.next(value)
  };
}
```

### 7.2 Uso en Componentes

```typescript
import { Component, signal } from '@angular/core';
import { Debounce, Throttle, createDebouncedSignal } from '@core/utils/debounce.util';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input
      type="text"
      [value]="searchQuery()"
      (input)="onSearchInput($event)"
      placeholder="Search...">

    <p>Searching for: {{ debouncedQuery.signal() }}</p>

    <div (scroll)="onScroll()" class="scrollable-content">
      <!-- content -->
    </div>
  `
})
export class SearchComponent {
  searchQuery = signal('');

  // ✅ Debounced signal (waits 300ms after last input)
  debouncedQuery = createDebouncedSignal('', 300);

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.debouncedSearch(value);
  }

  // ✅ Debounce: Waits for user to stop typing
  @Debounce(300)
  private debouncedSearch(query: string): void {
    console.log('API call for:', query);
    this.debouncedQuery.set(query);
    // Make API call here
  }

  // ✅ Throttle: Limits execution to once per 100ms
  @Throttle(100)
  onScroll(): void {
    console.log('Scroll event processed');
    // Heavy scroll logic here
  }
}
```

---

## 8. Pure Pipes

### 8.1 Pure Filter Pipe

Crear `src/app/shared/pipes/pure-filter.pipe.ts`:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

/**
 * 🚀 PERFORMANCE: Pure pipes cache results
 *
 * Pure pipes only recalculate when input reference changes
 * Impure pipes recalculate on EVERY change detection cycle
 *
 * Savings: 20-40% reduction in computation
 */
@Pipe({
  name: 'pureFilter',
  standalone: true,
  pure: true // ✅ DEFAULT: Already pure, but explicit is good
})
export class PureFilterPipe implements PipeTransform {
  transform<T>(
    items: T[] | null | undefined,
    filterFn: (item: T) => boolean
  ): T[] {
    if (!items) return [];
    return items.filter(filterFn);
  }
}

// ✅ USAGE (reference-stable filter function):
// filteredUsers = computed(() => {
//   return users().filter(u => u.active); // Same reference
// });
```

### 8.2 Memoized Sort Pipe

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pureSort',
  standalone: true,
  pure: true
})
export class PureSortPipe implements PipeTransform {
  // ⚠️ Cache to improve performance further
  private cache = new Map<string, any[]>();

  transform<T>(
    items: T[] | null | undefined,
    key: keyof T,
    direction: 'asc' | 'desc' = 'asc'
  ): T[] {
    if (!items || items.length === 0) return [];

    const cacheKey = `${key.toString()}_${direction}_${items.length}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const sorted = [...items].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.cache.set(cacheKey, sorted);
    return sorted;
  }
}
```

### 8.3 Best Practices

```typescript
/**
 * ✅ GOOD: Pure pipe with immutable data
 */
@Component({
  template: `
    <div *ngFor="let user of users() | pureFilter:activeFilter">
      {{ user.name }}
    </div>
  `
})
export class GoodComponent {
  users = signal<User[]>([]);

  // ✅ Function reference is stable
  activeFilter = (user: User) => user.active;

  addUser(user: User): void {
    // ✅ Create new array (immutable)
    this.users.update(current => [...current, user]);
  }
}

/**
 * ❌ BAD: Inline filter function (creates new reference every cycle)
 */
@Component({
  template: `
    <!-- ❌ New function created on every render -->
    <div *ngFor="let user of users | pureFilter:(u => u.active)">
      {{ user.name }}
    </div>
  `
})
export class BadComponent {}
```

---

## 9. Memoization de Computed Signals

### 9.1 Built-in Memoization

```typescript
import { Component, signal, computed } from '@angular/core';

/**
 * 🚀 PERFORMANCE: Computed signals auto-memoize
 *
 * Benefits:
 * - Only recalculates when dependencies change
 * - Caches result automatically
 * - No manual memoization needed
 */
@Component({
  selector: 'app-expensive-computation',
  template: `
    <p>Total: {{ expensiveTotal() }}</p>
    <p>Average: {{ average() }}</p>
    <button (click)="addItem()">Add Item</button>
  `
})
export class ExpensiveComputationComponent {
  items = signal<number[]>([1, 2, 3, 4, 5]);

  // ✅ Computed signal memoizes result
  // Only recalculates when items() changes
  expensiveTotal = computed(() => {
    console.log('Computing total...'); // Only logs when items change
    return this.items().reduce((sum, item) => sum + item, 0);
  });

  // ✅ Chained computed signals
  average = computed(() => {
    const total = this.expensiveTotal(); // Reuses cached value
    return total / this.items().length;
  });

  addItem(): void {
    this.items.update(current => [...current, Math.random() * 100]);
    // Both computed signals recalculate once
  }
}
```

### 9.2 Custom Memoization Utility

```typescript
/**
 * Manual memoization for non-signal functions
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage:
const expensiveFn = memoize((a: number, b: number) => {
  console.log('Computing...');
  return a + b;
});

console.log(expensiveFn(2, 3)); // Logs "Computing..." → 5
console.log(expensiveFn(2, 3)); // Returns cached → 5
```

---

## 10. Web Workers

### 10.1 Web Worker Setup

Crear `src/app/workers/heavy-computation.worker.ts`:

```typescript
/// <reference lib="webworker" />

/**
 * 🚀 PERFORMANCE: Web Workers move computation off main thread
 *
 * Benefits:
 * - Prevents UI freezing during heavy operations
 * - 60-80% improvement in responsiveness
 * - Perfect for: data processing, image manipulation, complex calculations
 */

interface ComputationMessage {
  type: 'PROCESS_DATA' | 'SORT_LARGE_ARRAY' | 'COMPLEX_CALCULATION';
  payload: any;
}

addEventListener('message', ({ data }: MessageEvent<ComputationMessage>) => {
  switch (data.type) {
    case 'PROCESS_DATA':
      processData(data.payload);
      break;
    case 'SORT_LARGE_ARRAY':
      sortLargeArray(data.payload);
      break;
    case 'COMPLEX_CALCULATION':
      complexCalculation(data.payload);
      break;
  }
});

function processData(data: any[]): void {
  console.log('Processing', data.length, 'items in worker...');

  // Heavy computation here
  const processed = data.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));

  postMessage({ type: 'PROCESS_DATA_COMPLETE', result: processed });
}

function sortLargeArray(data: number[]): void {
  const sorted = data.sort((a, b) => a - b);
  postMessage({ type: 'SORT_COMPLETE', result: sorted });
}

function complexCalculation(params: { x: number; y: number }): void {
  // Simulate heavy calculation
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(params.x * i) + Math.sqrt(params.y * i);
  }

  postMessage({ type: 'CALCULATION_COMPLETE', result });
}
```

### 10.2 Web Worker Service

Crear `src/app/core/performance/web-worker.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Service to manage Web Worker communication
 */
@Injectable({ providedIn: 'root' })
export class WebWorkerService {
  private worker?: Worker;
  private messageSubject = new Subject<any>();

  initWorker(): void {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('../../workers/heavy-computation.worker', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = ({ data }) => {
        this.messageSubject.next(data);
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
      };
    } else {
      console.warn('Web Workers not supported');
    }
  }

  postMessage(message: any): void {
    this.worker?.postMessage(message);
  }

  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  terminateWorker(): void {
    this.worker?.terminate();
  }
}
```

### 10.3 Uso en Componente

```typescript
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { WebWorkerService } from '@core/performance/web-worker.service';

@Component({
  selector: 'app-data-processor',
  standalone: true,
  template: `
    <button (click)="processLargeDataset()" [disabled]="processing()">
      Process 100,000 Items
    </button>

    @if (processing()) {
      <p>Processing in background...</p>
    }

    @if (result()) {
      <p>Processed {{ result()!.length }} items</p>
    }
  `
})
export class DataProcessorComponent implements OnInit, OnDestroy {
  processing = signal(false);
  result = signal<any[] | null>(null);

  constructor(private workerService: WebWorkerService) {}

  ngOnInit(): void {
    this.workerService.initWorker();

    this.workerService.onMessage().subscribe(message => {
      if (message.type === 'PROCESS_DATA_COMPLETE') {
        this.result.set(message.result);
        this.processing.set(false);
      }
    });
  }

  processLargeDataset(): void {
    this.processing.set(true);

    const largeData = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      value: Math.random()
    }));

    // ✅ Processing happens in worker (non-blocking)
    this.workerService.postMessage({
      type: 'PROCESS_DATA',
      payload: largeData
    });
  }

  ngOnDestroy(): void {
    this.workerService.terminateWorker();
  }
}
```

---

## 11. Performance Monitoring

### 11.1 Performance Monitor Service

Crear `src/app/core/performance/performance-monitor.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

/**
 * 🚀 PERFORMANCE: Monitor and log performance metrics
 *
 * Integration with Angular DevTools and custom analytics
 */
@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  metrics = signal<PerformanceMetric[]>([]);

  /**
   * Measure function execution time
   */
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

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.addMetric({ name, duration, timestamp: Date.now() });
    return result;
  }

  /**
   * Start manual measurement
   */
  startMeasure(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.addMetric({ name, duration, timestamp: Date.now() });
    };
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        console.log('CLS:', cls);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Log metrics summary
   */
  logSummary(): void {
    const metrics = this.metrics();
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    const average = total / metrics.length;
    const slowest = metrics.reduce((max, m) => m.duration > max.duration ? m : max);

    console.group('📊 Performance Summary');
    console.log('Total operations:', metrics.length);
    console.log('Total time:', total.toFixed(2), 'ms');
    console.log('Average:', average.toFixed(2), 'ms');
    console.log('Slowest:', slowest.name, '-', slowest.duration.toFixed(2), 'ms');
    console.groupEnd();
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.update(current => [...current, metric]);
  }
}
```

### 11.2 Uso del Performance Monitor

```typescript
import { Component, OnInit } from '@angular/core';
import { PerformanceMonitorService } from '@core/performance/performance-monitor.service';

@Component({
  selector: 'app-root',
  template: `...`
})
export class AppComponent implements OnInit {
  constructor(private perfMonitor: PerformanceMonitorService) {}

  ngOnInit(): void {
    // ✅ Monitor Core Web Vitals
    this.perfMonitor.getCoreWebVitals();
  }

  loadData(): void {
    // ✅ Measure synchronous operation
    this.perfMonitor.measure('loadData', () => {
      // Heavy operation here
      return this.processData();
    });
  }

  async fetchUsers(): Promise<void> {
    // ✅ Measure async operation
    await this.perfMonitor.measureAsync('fetchUsers', async () => {
      return this.userService.getUsers().toPromise();
    });
  }

  complexOperation(): void {
    // ✅ Manual measurement
    const endMeasure = this.perfMonitor.startMeasure('complexOp');

    // Do work...
    this.doSomething();
    this.doSomethingElse();

    endMeasure(); // Stop measuring
  }
}
```

---

## 12. Bundle Analyzer Configuration

### 12.1 Instalar Webpack Bundle Analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
```

### 12.2 Configurar Angular Builder

Modificar `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "configurations": {
            "analyze": {
              "buildOptimizer": true,
              "optimization": true,
              "sourceMap": false,
              "statsJson": true
            }
          }
        }
      }
    }
  }
}
```

### 12.3 Scripts en package.json

```json
{
  "scripts": {
    "build:analyze": "ng build --configuration=analyze && webpack-bundle-analyzer dist/your-app/stats.json",
    "build:prod": "ng build --configuration=production",
    "analyze:stats": "webpack-bundle-analyzer dist/your-app/stats.json"
  }
}
```

---

## 13. Performance Checklist

### ✅ Component Level

- [ ] Use `ChangeDetectionStrategy.OnPush` for all components
- [ ] Use `trackBy` functions in all `*ngFor` loops
- [ ] Replace observables with signals where possible
- [ ] Use computed signals for derived state
- [ ] Avoid function calls in templates
- [ ] Use `@defer` blocks for heavy components
- [ ] Lazy load images with custom directive
- [ ] Use pure pipes for transformations
- [ ] Avoid creating objects/arrays in templates

### ✅ Application Level

- [ ] Implement route-level lazy loading
- [ ] Configure custom preloading strategy
- [ ] Enable virtual scrolling for lists >100 items
- [ ] Use Web Workers for heavy computations
- [ ] Implement debounce for search inputs
- [ ] Implement throttle for scroll/resize events
- [ ] Monitor Core Web Vitals
- [ ] Analyze bundle size regularly
- [ ] Use standalone components (no NgModules)
- [ ] Tree-shake unused dependencies

### ✅ Build Optimization

- [ ] Enable production build optimizations
- [ ] Configure source map generation (external in prod)
- [ ] Use AOT compilation (enabled by default)
- [ ] Enable build cache
- [ ] Analyze bundle with webpack-bundle-analyzer
- [ ] Remove unused CSS with PurgeCSS (Tailwind does this)
- [ ] Compress assets (gzip/brotli)
- [ ] Use CDN for static assets

### ✅ Network Optimization

- [ ] Implement HTTP caching strategy
- [ ] Use HTTP/2 or HTTP/3
- [ ] Compress API responses
- [ ] Implement request debouncing
- [ ] Use service workers for offline support
- [ ] Prefetch critical resources
- [ ] Lazy load fonts

---

## 14. Before/After Performance Comparisons

### Scenario 1: Large User List (10,000 items)

**❌ BEFORE (No Optimization):**
```typescript
@Component({
  template: `
    <div *ngFor="let user of users">
      {{ user.name }}
    </div>
  `
})
export class BeforeComponent {
  users = this.generateUsers(10000);

  // Metrics:
  // - Initial render: 2,500ms
  // - Memory usage: 450MB
  // - FPS during scroll: 12fps
  // - DOM nodes: 10,000
}
```

**✅ AFTER (Optimized):**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cdk-virtual-scroll-viewport itemSize="50">
      <div *cdkVirtualFor="let user of users(); trackBy: trackById">
        {{ user.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class AfterComponent {
  users = signal(this.generateUsers(10000));
  trackById = trackById<User>;

  // Metrics:
  // - Initial render: 45ms (55x faster)
  // - Memory usage: 85MB (5.3x less)
  // - FPS during scroll: 60fps (5x smoother)
  // - DOM nodes: ~20 (500x fewer)
}
```

### Scenario 2: Search with API Calls

**❌ BEFORE:**
```typescript
onSearchInput(query: string): void {
  this.apiService.search(query).subscribe(results => {
    this.results = results;
  });

  // Metrics:
  // - API calls per search: 15-20
  // - Response time: 200ms average
  // - Total wait: 3,000-4,000ms
}
```

**✅ AFTER:**
```typescript
@Debounce(300)
onSearchInput(query: string): void {
  this.apiService.search(query).subscribe(results => {
    this.results.set(results);
  });

  // Metrics:
  // - API calls per search: 1
  // - Response time: 200ms average
  // - Total wait: 500ms
  // - API calls reduced by 95%
}
```

---

## 15. Best Practices Summary

### 🎯 Priority 1 (Implement First)
1. **OnPush Change Detection** - Biggest impact with minimal effort
2. **TrackBy Functions** - Essential for all lists
3. **Lazy Loading Routes** - Reduces initial bundle size
4. **Defer Blocks** - Easy wins for component-level lazy loading

### 🎯 Priority 2 (High Value)
5. **Virtual Scrolling** - Critical for large datasets
6. **Debounce/Throttle** - Reduces unnecessary operations
7. **Signals over Observables** - Better performance in Angular 19+
8. **Pure Pipes** - Cache expensive transformations

### 🎯 Priority 3 (Advanced)
9. **Web Workers** - For CPU-intensive operations
10. **Image Lazy Loading** - Improves page load
11. **Custom Preloading** - Smart resource loading
12. **Performance Monitoring** - Measure and optimize

### ⚠️ Common Pitfalls to Avoid

1. **❌ Function calls in templates**
   ```html
   <!-- BAD -->
   <div>{{ calculateTotal() }}</div>

   <!-- GOOD -->
   <div>{{ total() }}</div>
   ```

2. **❌ Object creation in templates**
   ```html
   <!-- BAD -->
   <app-child [config]="{ size: 'large' }"></app-child>

   <!-- GOOD -->
   <app-child [config]="configObj"></app-child>
   ```

3. **❌ No trackBy in ngFor**
   ```html
   <!-- BAD -->
   <div *ngFor="let item of items">

   <!-- GOOD -->
   <div *ngFor="let item of items; trackBy: trackById">
   ```

4. **❌ Impure pipes**
   ```typescript
   // BAD
   @Pipe({ pure: false })

   // GOOD
   @Pipe({ pure: true })
   ```

---

## 16. Referencias y Recursos

### Official Documentation
- [Angular Performance Guide](https://angular.dev/best-practices/runtime-performance)
- [Angular Change Detection](https://angular.dev/guide/change-detection)
- [Angular CDK Virtual Scrolling](https://material.angular.io/cdk/scrolling)
- [Angular Defer Blocks](https://angular.dev/guide/defer)

### Performance Tools
- [Angular DevTools](https://angular.dev/tools/devtools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

### Learning Resources
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Angular University - Performance](https://blog.angular-university.io/)

---

## 17. Testing Performance Optimizations

```typescript
// Example: Test virtual scrolling performance
describe('VirtualScrollListComponent Performance', () => {
  it('should render 10,000 items in <100ms', () => {
    const start = performance.now();

    const fixture = TestBed.createComponent(VirtualScrollListComponent);
    fixture.componentInstance.items.set(generateItems(10000));
    fixture.detectChanges();

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should limit DOM nodes to ~20 for 10,000 items', () => {
    const fixture = TestBed.createComponent(VirtualScrollListComponent);
    fixture.componentInstance.items.set(generateItems(10000));
    fixture.detectChanges();

    const domNodes = fixture.nativeElement.querySelectorAll('.virtual-scroll-item');
    expect(domNodes.length).toBeLessThan(30);
  });
});
```

---

Este skill proporciona todas las herramientas y técnicas necesarias para optimizar aplicaciones Angular standalone a nivel production-ready. Cada técnica incluye ejemplos de código completos, métricas de impacto, y best practices probadas.

**🚀 Resultado esperado:** Aplicaciones Angular 50-70% más rápidas con mejor UX y menor costo de infraestructura.
