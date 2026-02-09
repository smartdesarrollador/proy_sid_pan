# Infinite Scroll Examples

Ejemplos completos de infinite scroll con diferentes implementaciones y casos de uso.

## Tabla de Contenidos

1. [Infinite Scroll Básico](#infinite-scroll-básico)
2. [Con IntersectionObserver](#con-intersectionobserver)
3. [Feed de Redes Sociales](#feed-de-redes-sociales)
4. [Product Gallery](#product-gallery)
5. [Con Virtual Scroll](#con-virtual-scroll)
6. [Bi-Directional Scroll](#bi-directional-scroll)

---

## Infinite Scroll Básico

```typescript
import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InfiniteScrollDirective } from '@/core/directives/infinite-scroll.directive';
import { LoadMoreComponent } from '@/shared/components/load-more/load-more.component';

interface Post {
  id: number;
  title: string;
  body: string;
}

@Component({
  selector: 'app-infinite-posts',
  standalone: true,
  imports: [CommonModule, InfiniteScrollDirective, LoadMoreComponent],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Posts</h1>

      <!-- Lista de posts -->
      <div class="space-y-4">
        @for (post of posts(); track post.id) {
          <article class="p-4 bg-white rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>
            <p class="text-gray-600">{{ post.body }}</p>
          </article>
        }
      </div>

      <!-- Trigger de infinite scroll -->
      <div
        appInfiniteScroll
        [threshold]="0.8"
        [debounce]="300"
        [disabled]="!hasMore() || isLoading()"
        (scrolled)="loadMore()"
        class="h-10"
      ></div>

      <!-- Load more button alternativo -->
      <app-load-more
        [hasMore]="hasMore()"
        [isLoading]="isLoading()"
        [currentItems]="posts().length"
        [totalItems]="totalItems()"
        (onLoadMore)="loadMore()"
      />
    </div>
  `
})
export class InfinitePostsComponent implements OnInit {
  private http = inject(HttpClient);

  posts = signal<Post[]>([]);
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);
  isLoading = signal(false);
  hasMore = computed(() => this.posts().length < this.totalItems());

  ngOnInit(): void {
    this.loadMore();
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasMore()) {
      return;
    }

    this.isLoading.set(true);

    this.http.get<PaginatedResponse<Post>>('/api/posts', {
      params: {
        page: this.currentPage(),
        pageSize: this.pageSize
      }
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(response => {
      // Append nuevos posts a los existentes
      this.posts.update(current => [...current, ...response.data]);
      this.totalItems.set(response.total);
      this.currentPage.update(p => p + 1);
    });
  }
}
```

---

## Con IntersectionObserver

```typescript
import { Component, OnInit, OnDestroy, signal, inject, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-observer-scroll',
  template: `
    <div class="container mx-auto p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (item of items(); track item.id) {
          <div class="p-4 border rounded">
            <img
              [src]="item.image"
              [alt]="item.title"
              class="w-full h-48 object-cover rounded mb-2"
            />
            <h3 class="font-semibold">{{ item.title }}</h3>
          </div>
        }
      </div>

      <!-- Sentinel element -->
      <div #sentinel class="h-10 flex items-center justify-center">
        @if (isLoading()) {
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        }
      </div>

      @if (!hasMore()) {
        <p class="text-center text-gray-500 py-4">
          No hay más elementos
        </p>
      }
    </div>
  `
})
export class ObserverScrollComponent implements OnInit, OnDestroy {
  @ViewChild('sentinel') sentinel!: ElementRef;

  items = signal<any[]>([]);
  currentPage = signal(1);
  isLoading = signal(false);
  hasMore = signal(true);

  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.loadMore();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupObserver(): void {
    const options = {
      root: null, // viewport
      rootMargin: '100px', // Cargar 100px antes de llegar al final
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading() && this.hasMore()) {
          this.loadMore();
        }
      });
    }, options);

    this.observer.observe(this.sentinel.nativeElement);
  }

  loadMore(): void {
    this.isLoading.set(true);

    this.http.get('/api/items', {
      params: {
        page: this.currentPage(),
        pageSize: 12
      }
    }).subscribe(response => {
      this.items.update(current => [...current, ...response.data]);
      this.currentPage.update(p => p + 1);
      this.hasMore.set(response.hasNext);
      this.isLoading.set(false);
    });
  }
}
```

---

## Feed de Redes Sociales

```typescript
import { Component, signal } from '@angular/core';

interface FeedPost {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: Date;
}

@Component({
  selector: 'app-social-feed',
  template: `
    <div class="max-w-2xl mx-auto p-4">
      <!-- Pull to refresh indicator -->
      @if (isRefreshing()) {
        <div class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Feed posts -->
      <div class="space-y-4">
        @for (post of posts(); track post.id) {
          <article class="bg-white rounded-lg shadow p-4">
            <!-- Author -->
            <div class="flex items-center mb-3">
              <img
                [src]="post.author.avatar"
                [alt]="post.author.name"
                class="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <h3 class="font-semibold">{{ post.author.name }}</h3>
                <p class="text-sm text-gray-500">{{ post.timestamp | date:'short' }}</p>
              </div>
            </div>

            <!-- Content -->
            <p class="mb-3">{{ post.content }}</p>

            <!-- Image -->
            @if (post.image) {
              <img
                [src]="post.image"
                class="w-full rounded-lg mb-3"
              />
            }

            <!-- Actions -->
            <div class="flex items-center gap-4 text-gray-600">
              <button class="flex items-center gap-1 hover:text-blue-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                <span>{{ post.likes }}</span>
              </button>

              <button class="flex items-center gap-1 hover:text-blue-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span>{{ post.comments }}</span>
              </button>
            </div>
          </article>
        }
      </div>

      <!-- Infinite scroll trigger -->
      <div
        appInfiniteScroll
        [threshold]="0.8"
        [disabled]="!hasMore() || isLoading()"
        (scrolled)="loadMore()"
        class="py-8 flex justify-center"
      >
        @if (isLoading()) {
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        } @else if (!hasMore()) {
          <p class="text-gray-500">Has llegado al final</p>
        }
      </div>
    </div>
  `
})
export class SocialFeedComponent {
  posts = signal<FeedPost[]>([]);
  currentPage = signal(1);
  isLoading = signal(false);
  isRefreshing = signal(false);
  hasMore = signal(true);

  ngOnInit(): void {
    this.loadMore();
    this.setupPullToRefresh();
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasMore()) return;

    this.isLoading.set(true);

    this.api.getPaginated<FeedPost>('feed', {
      page: this.currentPage(),
      pageSize: 10
    }).subscribe(response => {
      this.posts.update(current => [...current, ...response.data]);
      this.currentPage.update(p => p + 1);
      this.hasMore.set(response.hasNext);
      this.isLoading.set(false);
    });
  }

  refresh(): void {
    this.isRefreshing.set(true);
    this.currentPage.set(1);
    this.hasMore.set(true);

    this.api.getPaginated<FeedPost>('feed', {
      page: 1,
      pageSize: 10
    }).subscribe(response => {
      this.posts.set(response.data);
      this.currentPage.set(2);
      this.hasMore.set(response.hasNext);
      this.isRefreshing.set(false);
    });
  }

  private setupPullToRefresh(): void {
    let startY = 0;
    let currentY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 100 && !this.isRefreshing()) {
          this.refresh();
        }
      }
    };

    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove);
  }
}
```

---

## Product Gallery

```typescript
import { Component, signal } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

@Component({
  selector: 'app-product-gallery',
  template: `
    <div class="container mx-auto p-4">
      <!-- Filters -->
      <div class="mb-6 flex gap-4">
        <select
          [(ngModel)]="selectedCategory"
          (change)="onFilterChange()"
          class="px-4 py-2 border rounded"
        >
          <option value="">Todas las categorías</option>
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>

        <select
          [(ngModel)]="sortOrder"
          (change)="onFilterChange()"
          class="px-4 py-2 border rounded"
        >
          <option value="asc">Precio: Menor a Mayor</option>
          <option value="desc">Precio: Mayor a Menor</option>
        </select>
      </div>

      <!-- Products grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        @for (product of products(); track product.id) {
          <div class="group cursor-pointer">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              <img
                [src]="product.image"
                [alt]="product.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <h3 class="font-medium text-sm mb-1 truncate">{{ product.name }}</h3>
            <p class="text-lg font-bold">\${{ product.price }}</p>
          </div>
        }
      </div>

      <!-- Loading skeleton -->
      @if (isLoading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="animate-pulse">
              <div class="aspect-square bg-gray-200 rounded-lg mb-2"></div>
              <div class="h-4 bg-gray-200 rounded mb-1"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          }
        </div>
      }

      <!-- Infinite scroll trigger -->
      <div
        appInfiniteScroll
        [threshold]="0.9"
        [disabled]="!hasMore() || isLoading()"
        (scrolled)="loadMore()"
        class="h-20"
      ></div>
    </div>
  `
})
export class ProductGalleryComponent {
  products = signal<Product[]>([]);
  currentPage = signal(1);
  isLoading = signal(false);
  hasMore = signal(true);

  selectedCategory = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  categories = ['Electronics', 'Clothing', 'Home', 'Sports'];

  ngOnInit(): void {
    this.loadMore();
  }

  loadMore(): void {
    if (this.isLoading() || !this.hasMore()) return;

    this.isLoading.set(true);

    const params = {
      page: this.currentPage(),
      pageSize: 24,
      sortBy: 'price',
      sortOrder: this.sortOrder,
      filters: {
        category: this.selectedCategory
      }
    };

    this.api.getPaginated<Product>('products', params)
      .subscribe(response => {
        this.products.update(current => [...current, ...response.data]);
        this.currentPage.update(p => p + 1);
        this.hasMore.set(response.hasNext);
        this.isLoading.set(false);
      });
  }

  onFilterChange(): void {
    // Reset cuando cambian filtros
    this.products.set([]);
    this.currentPage.set(1);
    this.hasMore.set(true);
    this.loadMore();
  }
}
```

---

## Con Virtual Scroll

```typescript
import { Component } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-virtual-infinite',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport
      itemSize="80"
      class="h-[600px] border rounded"
      (scrolledIndexChange)="onScrolledIndexChange($event)"
    >
      <div
        *cdkVirtualFor="let item of items(); trackBy: trackById"
        class="h-20 p-4 border-b hover:bg-gray-50"
      >
        <h3 class="font-medium">{{ item.title }}</h3>
        <p class="text-sm text-gray-600">{{ item.description }}</p>
      </div>

      <!-- Loading indicator -->
      @if (isLoading()) {
        <div class="p-4 flex justify-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      }
    </cdk-virtual-scroll-viewport>
  `
})
export class VirtualInfiniteComponent {
  items = signal<any[]>([]);
  currentPage = signal(1);
  isLoading = signal(false);
  hasMore = signal(true);

  ngOnInit(): void {
    this.loadMore();
  }

  onScrolledIndexChange(index: number): void {
    const threshold = this.items().length - 10;

    if (index >= threshold && !this.isLoading() && this.hasMore()) {
      this.loadMore();
    }
  }

  loadMore(): void {
    this.isLoading.set(true);

    this.api.getPaginated('items', {
      page: this.currentPage(),
      pageSize: 50
    }).subscribe(response => {
      this.items.update(current => [...current, ...response.data]);
      this.currentPage.update(p => p + 1);
      this.hasMore.set(response.hasNext);
      this.isLoading.set(false);
    });
  }

  trackById(index: number, item: any): any {
    return item.id;
  }
}
```

---

## Bi-Directional Scroll

```typescript
/**
 * Scroll infinito bidireccional (hacia arriba y abajo)
 * Útil para chat messages, timeline, etc.
 */
@Component({
  selector: 'app-bidirectional-scroll',
  template: `
    <div class="h-[600px] overflow-y-auto" #scrollContainer>
      <!-- Load previous trigger -->
      <div
        appInfiniteScroll
        [threshold]="0.1"
        [disabled]="!hasPrevious() || isLoadingPrevious()"
        (scrolled)="loadPrevious()"
        class="h-10 flex justify-center items-center"
      >
        @if (isLoadingPrevious()) {
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        }
      </div>

      <!-- Messages -->
      <div class="space-y-2 p-4">
        @for (message of messages(); track message.id) {
          <div
            class="p-3 rounded"
            [class.bg-blue-100]="message.isMine"
            [class.bg-gray-100]="!message.isMine"
          >
            {{ message.text }}
          </div>
        }
      </div>

      <!-- Load next trigger -->
      <div
        appInfiniteScroll
        [threshold]="0.9"
        [disabled]="!hasNext() || isLoadingNext()"
        (scrolled)="loadNext()"
        class="h-10 flex justify-center items-center"
      >
        @if (isLoadingNext()) {
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        }
      </div>
    </div>
  `
})
export class BidirectionalScrollComponent {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  messages = signal<Message[]>([]);
  currentPage = signal(10); // Empezar en página del medio
  isLoadingPrevious = signal(false);
  isLoadingNext = signal(false);
  hasPrevious = signal(true);
  hasNext = signal(true);

  loadPrevious(): void {
    if (this.isLoadingPrevious() || !this.hasPrevious()) return;

    const previousPage = this.currentPage() - 1;
    if (previousPage < 1) {
      this.hasPrevious.set(false);
      return;
    }

    this.isLoadingPrevious.set(true);

    this.api.getPaginated('messages', {
      page: previousPage,
      pageSize: 20
    }).subscribe(response => {
      // Prepend messages
      this.messages.update(current => [...response.data, ...current]);
      this.currentPage.set(previousPage);
      this.hasPrevious.set(response.hasPrevious);
      this.isLoadingPrevious.set(false);

      // Mantener posición de scroll
      setTimeout(() => this.adjustScrollPosition());
    });
  }

  loadNext(): void {
    if (this.isLoadingNext() || !this.hasNext()) return;

    const nextPage = this.currentPage() + 1;

    this.isLoadingNext.set(true);

    this.api.getPaginated('messages', {
      page: nextPage,
      pageSize: 20
    }).subscribe(response => {
      // Append messages
      this.messages.update(current => [...current, ...response.data]);
      this.currentPage.set(nextPage);
      this.hasNext.set(response.hasNext);
      this.isLoadingNext.set(false);
    });
  }

  private adjustScrollPosition(): void {
    // Ajustar scroll para mantener posición visual
    const container = this.scrollContainer.nativeElement;
    const previousHeight = container.scrollHeight;

    setTimeout(() => {
      const newHeight = container.scrollHeight;
      const diff = newHeight - previousHeight;
      container.scrollTop += diff;
    });
  }
}
```

---

## Best Practices

1. **Debounce scroll events** para performance
2. **IntersectionObserver** es más eficiente que scroll events
3. **Loading states** claros para UX
4. **Skeleton loaders** durante carga
5. **Error handling** con retry
6. **Reset state** cuando cambian filtros
7. **Virtual scroll** para 1000+ items
8. **Pull to refresh** en mobile
9. **End message** cuando no hay más datos
10. **Accessibility** con ARIA live regions

---

Para más ejemplos, ver `server-side-examples.md` y `advanced-patterns.md`.
