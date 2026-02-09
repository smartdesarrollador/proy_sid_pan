---
name: angular-api-pagination
description: >
  Sistema completo de paginación para Angular standalone con Tailwind CSS.
  Usar cuando se necesite implementar paginación server-side con query params, client-side pagination,
  infinite scroll con IntersectionObserver, load more button, componente pagination reutilizable,
  page size selector (10/25/50/100), estado con signals, navegación first/previous/next/last,
  jump to page, total items display, loading states, empty states, responsive design (mobile),
  URL query params sync, scroll to top, cache de páginas, skeleton loaders, error handling,
  virtual scroll alternativa, o integración con DataTable/listas. Incluye PaginationComponent standalone,
  InfiniteScrollDirective, PaginationService, interfaces tipadas (PaginationParams, PaginatedResponse<T>),
  ejemplos con APIs REST, performance optimizations, y best practices para proyectos Angular 19+ production-ready.
---

# Angular API Pagination - Sistema Completo

Sistema enterprise-ready de paginación para Angular standalone con server-side, client-side, infinite scroll y best practices.

## Arquitectura del Sistema

```
pagination-system/
├── core/
│   ├── services/
│   │   ├── pagination.service.ts          # Estado de paginación con signals
│   │   └── pagination-cache.service.ts    # Cache de páginas visitadas
│   ├── directives/
│   │   └── infinite-scroll.directive.ts   # Infinite scroll con IntersectionObserver
│   ├── models/
│   │   └── pagination.models.ts           # Interfaces tipadas
│   └── utils/
│       └── pagination.util.ts             # Utilidades de paginación
├── shared/
│   ├── components/
│   │   ├── pagination/                    # Componente pagination clásico
│   │   ├── load-more/                     # Botón "Load More"
│   │   ├── page-size-selector/            # Selector de items por página
│   │   └── pagination-skeleton/           # Skeleton loader
│   └── styles/
│       └── pagination.scss                # Estilos Tailwind
└── examples/
    ├── server-side-pagination.example.ts  # Ejemplo con API REST
    ├── client-side-pagination.example.ts  # Ejemplo con datos en memoria
    └── infinite-scroll.example.ts         # Ejemplo infinite scroll
```

## Tabla de Contenidos

1. [Interfaces y Modelos](#1-interfaces-y-modelos-tipados)
2. [Servicio de Paginación](#2-servicio-de-paginación)
3. [Componente Pagination](#3-componente-pagination)
4. [Infinite Scroll Directive](#4-infinite-scroll-directive)
5. [Load More Component](#5-load-more-component)
6. [Page Size Selector](#6-page-size-selector)
7. [Server-Side Pagination](#7-server-side-pagination)
8. [Client-Side Pagination](#8-client-side-pagination)
9. [URL Query Params Sync](#9-url-query-params-sync)
10. [Cache de Páginas](#10-cache-de-páginas)
11. [Performance Optimizations](#11-performance-optimizations)
12. [Estilos CSS](#12-estilos-css)

---

## 1. Interfaces y Modelos Tipados

Crear `src/app/core/models/pagination.models.ts`:

```typescript
/**
 * Parámetros de paginación para requests
 */
export interface PaginationParams {
  page: number;        // Número de página (1-indexed)
  pageSize: number;    // Items por página
  sortBy?: string;     // Campo para ordenar
  sortOrder?: 'asc' | 'desc';
  search?: string;     // Búsqueda global
  filters?: Record<string, any>; // Filtros adicionales
}

/**
 * Respuesta paginada genérica del servidor
 */
export interface PaginatedResponse<T> {
  data: T[];           // Items de la página actual
  total: number;       // Total de items
  page: number;        // Página actual
  pageSize: number;    // Items por página
  totalPages: number;  // Total de páginas
  hasNext: boolean;    // Hay siguiente página
  hasPrevious: boolean; // Hay página anterior
}

/**
 * Estado de paginación interno
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Configuración de paginación
 */
export interface PaginationConfig {
  pageSize: number;
  pageSizeOptions: number[];
  showFirstLast: boolean;
  showPageInfo: boolean;
  showJumpToPage: boolean;
  maxVisiblePages: number;
}

/**
 * Evento de cambio de página
 */
export interface PageChangeEvent {
  page: number;
  pageSize: number;
  previousPage: number;
}

/**
 * Opciones de infinite scroll
 */
export interface InfiniteScrollOptions {
  threshold: number;        // Umbral de intersección (0-1)
  rootMargin: string;       // Margen del root
  debounceTime: number;     // Debounce en ms
  scrollContainer?: string; // Selector del contenedor
}
```

---

## 2. Servicio de Paginación

Crear `src/app/core/services/pagination.service.ts`:

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { PaginationState, PaginationParams, PaginatedResponse } from '@/core/models/pagination.models';

/**
 * Servicio genérico para manejar estado de paginación con signals
 */
@Injectable()
export class PaginationService<T = any> {
  // Estado interno con signals
  private state = signal<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    isLoading: false,
    error: null
  });

  // Computed signals públicos
  currentPage = computed(() => this.state().currentPage);
  pageSize = computed(() => this.state().pageSize);
  totalItems = computed(() => this.state().totalItems);
  totalPages = computed(() => this.state().totalPages);
  hasNext = computed(() => this.state().hasNext);
  hasPrevious = computed(() => this.state().hasPrevious);
  isLoading = computed(() => this.state().isLoading);
  error = computed(() => this.state().error);

  // Computed: rango de items mostrados
  itemRange = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const total = this.totalItems();

    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);

    return { start, end, total };
  });

  // Computed: páginas visibles para navegación
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(current - half, 1);
    let end = Math.min(start + maxVisible - 1, total);

    if (end - start < maxVisible - 1) {
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  /**
   * Actualiza el estado con respuesta paginada del servidor
   */
  updateFromResponse(response: PaginatedResponse<T>): void {
    this.state.update(state => ({
      ...state,
      currentPage: response.page,
      pageSize: response.pageSize,
      totalItems: response.total,
      totalPages: response.totalPages,
      hasNext: response.hasNext,
      hasPrevious: response.hasPrevious,
      isLoading: false,
      error: null
    }));
  }

  /**
   * Establece estado de carga
   */
  setLoading(loading: boolean): void {
    this.state.update(state => ({ ...state, isLoading: loading }));
  }

  /**
   * Establece error
   */
  setError(error: string): void {
    this.state.update(state => ({
      ...state,
      error,
      isLoading: false
    }));
  }

  /**
   * Cambia a una página específica
   */
  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total) {
      return;
    }

    this.state.update(state => ({
      ...state,
      currentPage: page,
      hasPrevious: page > 1,
      hasNext: page < total
    }));
  }

  /**
   * Navega a la primera página
   */
  goToFirst(): void {
    this.goToPage(1);
  }

  /**
   * Navega a la última página
   */
  goToLast(): void {
    this.goToPage(this.totalPages());
  }

  /**
   * Navega a la página siguiente
   */
  goToNext(): void {
    if (this.hasNext()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Navega a la página anterior
   */
  goToPrevious(): void {
    if (this.hasPrevious()) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Cambia el tamaño de página
   */
  changePageSize(pageSize: number): void {
    this.state.update(state => ({
      ...state,
      pageSize,
      currentPage: 1, // Reset a primera página
      totalPages: Math.ceil(state.totalItems / pageSize)
    }));
  }

  /**
   * Resetea el estado de paginación
   */
  reset(): void {
    this.state.set({
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
      isLoading: false,
      error: null
    });
  }

  /**
   * Obtiene parámetros actuales para request
   */
  getParams(): PaginationParams {
    return {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
  }
}
```

---

## 3. Componente Pagination

Crear `src/app/shared/components/pagination/pagination.component.ts`:

```typescript
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Componente de paginación reutilizable con navegación completa
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      role="navigation"
      aria-label="Pagination navigation"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200"
    >
      <!-- Info de items (mobile top, desktop left) -->
      <div class="text-sm text-gray-700 order-2 sm:order-1">
        Mostrando
        <span class="font-medium">{{ itemRange().start }}</span>
        a
        <span class="font-medium">{{ itemRange().end }}</span>
        de
        <span class="font-medium">{{ data().totalItems }}</span>
        resultados
      </div>

      <!-- Controles de paginación (mobile bottom, desktop right) -->
      <div class="flex items-center gap-2 order-1 sm:order-2">
        @if (showFirstLast()) {
          <!-- First page -->
          <button
            type="button"
            [disabled]="!data().hasPrevious || isLoading()"
            (click)="onFirst.emit()"
            [attr.aria-label]="'Go to first page'"
            class="pagination-btn"
            [class.pagination-btn-disabled]="!data().hasPrevious || isLoading()"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z" clip-rule="evenodd" />
            </svg>
          </button>
        }

        <!-- Previous page -->
        <button
          type="button"
          [disabled]="!data().hasPrevious || isLoading()"
          (click)="onPrevious.emit()"
          [attr.aria-label]="'Go to previous page'"
          class="pagination-btn"
          [class.pagination-btn-disabled]="!data().hasPrevious || isLoading()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Page numbers -->
        <div class="hidden sm:flex items-center gap-1">
          @for (page of visiblePages(); track page) {
            <button
              type="button"
              (click)="onPageChange.emit(page)"
              [disabled]="isLoading()"
              [attr.aria-label]="'Go to page ' + page"
              [attr.aria-current]="page === data().currentPage ? 'page' : null"
              class="pagination-page-btn"
              [class.pagination-page-btn-active]="page === data().currentPage"
              [class.pagination-btn-disabled]="isLoading()"
            >
              {{ page }}
            </button>
          }
        </div>

        <!-- Current page indicator (mobile only) -->
        <div class="sm:hidden px-3 py-2 text-sm font-medium text-gray-700">
          {{ data().currentPage }} / {{ data().totalPages }}
        </div>

        <!-- Next page -->
        <button
          type="button"
          [disabled]="!data().hasNext || isLoading()"
          (click)="onNext.emit()"
          [attr.aria-label]="'Go to next page'"
          class="pagination-btn"
          [class.pagination-btn-disabled]="!data().hasNext || isLoading()"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
          </svg>
        </button>

        @if (showFirstLast()) {
          <!-- Last page -->
          <button
            type="button"
            [disabled]="!data().hasNext || isLoading()"
            (click)="onLast.emit()"
            [attr.aria-label]="'Go to last page'"
            class="pagination-btn"
            [class.pagination-btn-disabled]="!data().hasNext || isLoading()"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.21 14.77a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02zm-6 0a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
            </svg>
          </button>
        }

        @if (showJumpToPage()) {
          <!-- Jump to page -->
          <div class="ml-2 flex items-center gap-2">
            <label for="jump-to-page" class="text-sm text-gray-700 whitespace-nowrap">
              Ir a:
            </label>
            <input
              id="jump-to-page"
              type="number"
              [min]="1"
              [max]="data().totalPages"
              [value]="data().currentPage"
              (keydown.enter)="jumpToPage($event)"
              [disabled]="isLoading()"
              class="jump-input"
            />
          </div>
        }
      </div>
    </nav>
  `,
  styles: [`
    /* Botón base de paginación */
    .pagination-btn {
      @apply relative inline-flex items-center px-2 py-2 text-gray-400 bg-white border border-gray-300 rounded-md;
      @apply hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500;
      @apply transition-colors duration-200;
    }

    .pagination-btn:not(.pagination-btn-disabled):hover {
      @apply text-gray-500 bg-gray-50;
    }

    .pagination-btn-disabled {
      @apply opacity-50 cursor-not-allowed;
    }

    /* Botones de número de página */
    .pagination-page-btn {
      @apply relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md;
      @apply hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500;
      @apply transition-colors duration-200;
    }

    .pagination-page-btn-active {
      @apply bg-blue-600 text-white border-blue-600;
      @apply hover:bg-blue-700;
    }

    /* Input jump to page */
    .jump-input {
      @apply w-16 px-2 py-1 text-sm border border-gray-300 rounded-md;
      @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
    }

    .jump-input:disabled {
      @apply opacity-50 cursor-not-allowed;
    }

    /* Remove spinner de number input */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="number"] {
      -moz-appearance: textfield;
    }
  `]
})
export class PaginationComponent {
  // Inputs
  data = input.required<PaginationData>();
  isLoading = input<boolean>(false);
  showFirstLast = input<boolean>(true);
  showJumpToPage = input<boolean>(false);
  maxVisiblePages = input<number>(5);

  // Outputs
  onPageChange = output<number>();
  onNext = output<void>();
  onPrevious = output<void>();
  onFirst = output<void>();
  onLast = output<void>();

  // Computed: rango de items
  itemRange = computed(() => {
    const d = this.data();
    const start = (d.currentPage - 1) * d.pageSize + 1;
    const end = Math.min(d.currentPage * d.pageSize, d.totalItems);
    return { start, end };
  });

  // Computed: páginas visibles
  visiblePages = computed(() => {
    const current = this.data().currentPage;
    const total = this.data().totalPages;
    const maxVisible = this.maxVisiblePages();

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(current - half, 1);
    let end = Math.min(start + maxVisible - 1, total);

    if (end - start < maxVisible - 1) {
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  /**
   * Maneja el evento de "jump to page"
   */
  jumpToPage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);

    if (!isNaN(page) && page >= 1 && page <= this.data().totalPages) {
      this.onPageChange.emit(page);
    } else {
      // Reset al valor actual si es inválido
      input.value = this.data().currentPage.toString();
    }
  }
}
```

---

## 4. Infinite Scroll Directive

Crear `src/app/core/directives/infinite-scroll.directive.ts`:

```typescript
import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  output,
  input,
  inject
} from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

/**
 * Directiva para infinite scroll usando IntersectionObserver
 *
 * @example
 * <div
 *   appInfiniteScroll
 *   [threshold]="0.8"
 *   [debounce]="300"
 *   (scrolled)="loadMore()"
 * >
 *   <!-- contenido -->
 * </div>
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  // Inputs
  threshold = input<number>(0.8); // Umbral de intersección (0-1)
  rootMargin = input<string>('0px'); // Margen del root
  debounce = input<number>(300); // Debounce en ms
  disabled = input<boolean>(false); // Deshabilitar scroll

  // Output
  scrolled = output<void>();

  private observer?: IntersectionObserver;
  private scrollSubject = new Subject<void>();

  ngOnInit(): void {
    // Setup debounce
    this.scrollSubject
      .pipe(debounceTime(this.debounce()))
      .subscribe(() => {
        if (!this.disabled()) {
          this.scrolled.emit();
        }
      });

    // Setup IntersectionObserver
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.scrollSubject.next();
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: this.rootMargin(),
        threshold: this.threshold()
      }
    );

    // Observar el elemento
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.scrollSubject.complete();
  }
}
```

---

## 5. Load More Component

Crear `src/app/shared/components/load-more/load-more.component.ts`:

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente "Load More" para paginación incremental
 */
@Component({
  selector: 'app-load-more',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center gap-4 py-8">
      @if (isLoading()) {
        <!-- Loading state -->
        <div class="flex items-center gap-2 text-gray-600">
          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ loadingText() }}</span>
        </div>
      } @else if (hasMore()) {
        <!-- Load more button -->
        <button
          type="button"
          (click)="onLoadMore.emit()"
          class="load-more-btn"
        >
          {{ buttonText() }}
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <!-- Items info -->
        @if (showItemsInfo()) {
          <p class="text-sm text-gray-600">
            Mostrando {{ currentItems() }} de {{ totalItems() }} resultados
          </p>
        }
      } @else {
        <!-- No more items -->
        <p class="text-sm text-gray-500">
          {{ endMessage() }}
        </p>
      }
    </div>
  `,
  styles: [`
    .load-more-btn {
      @apply inline-flex items-center px-6 py-3 bg-white border-2 border-gray-300 rounded-lg;
      @apply text-sm font-medium text-gray-700;
      @apply hover:bg-gray-50 hover:border-gray-400;
      @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
      @apply transition-all duration-200;
    }

    .load-more-btn:hover svg {
      @apply transform translate-y-0.5;
    }
  `]
})
export class LoadMoreComponent {
  // Inputs
  hasMore = input<boolean>(true);
  isLoading = input<boolean>(false);
  currentItems = input<number>(0);
  totalItems = input<number>(0);
  showItemsInfo = input<boolean>(true);
  buttonText = input<string>('Cargar más');
  loadingText = input<string>('Cargando...');
  endMessage = input<string>('No hay más resultados');

  // Output
  onLoadMore = output<void>();
}
```

---

## 6. Page Size Selector

Crear `src/app/shared/components/page-size-selector/page-size-selector.component.ts`:

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Selector de items por página
 */
@Component({
  selector: 'app-page-size-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center gap-2">
      <label [for]="id" class="text-sm text-gray-700 whitespace-nowrap">
        {{ label() }}
      </label>
      <select
        [id]="id"
        [value]="pageSize()"
        (change)="onChange($event)"
        [disabled]="disabled()"
        class="page-size-select"
      >
        @for (option of options(); track option) {
          <option [value]="option">{{ option }}</option>
        }
      </select>
    </div>
  `,
  styles: [`
    .page-size-select {
      @apply px-3 py-2 text-sm border border-gray-300 rounded-md;
      @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
      @apply bg-white;
    }

    .page-size-select:disabled {
      @apply opacity-50 cursor-not-allowed bg-gray-100;
    }
  `]
})
export class PageSizeSelectorComponent {
  // Inputs
  pageSize = input<number>(10);
  options = input<number[]>([10, 25, 50, 100]);
  label = input<string>('Mostrar:');
  disabled = input<boolean>(false);
  id = `page-size-${Math.random().toString(36).substr(2, 9)}`;

  // Output
  pageSizeChange = output<number>();

  onChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageSizeChange.emit(newSize);
  }
}
```

---

## 7. Server-Side Pagination

### 7.1 API Service con Paginación

Crear `src/app/core/services/api-with-pagination.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginationParams, PaginatedResponse } from '@/core/models/pagination.models';
import { environment } from '@/environments/environment';

/**
 * Servicio base para APIs con paginación
 */
@Injectable({ providedIn: 'root' })
export class ApiWithPaginationService {
  private http = inject(HttpClient);

  /**
   * GET request con paginación
   */
  getPaginated<T>(
    endpoint: string,
    params: PaginationParams
  ): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }

    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<T>>(
      `${environment.apiUrl}/${endpoint}`,
      { params: httpParams }
    );
  }
}
```

### 7.2 Ejemplo Completo con Server-Side Pagination

```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '@/shared/components/pagination/pagination.component';
import { PageSizeSelectorComponent } from '@/shared/components/page-size-selector/page-size-selector.component';
import { PaginationService } from '@/core/services/pagination.service';
import { ApiWithPaginationService } from '@/core/services/api-with-pagination.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent, PageSizeSelectorComponent],
  providers: [PaginationService],
  template: `
    <div class="container mx-auto p-4">
      <div class="bg-white rounded-lg shadow">
        <!-- Header con page size selector -->
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-xl font-semibold">Usuarios</h2>

          <app-page-size-selector
            [pageSize]="pagination.pageSize()"
            [options]="[10, 25, 50, 100]"
            [disabled]="pagination.isLoading()"
            (pageSizeChange)="onPageSizeChange($event)"
          />
        </div>

        <!-- Lista de usuarios -->
        <div class="divide-y divide-gray-200">
          @if (pagination.isLoading()) {
            <!-- Skeleton loader -->
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="p-4 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            }
          } @else if (pagination.error()) {
            <!-- Error state -->
            <div class="p-8 text-center">
              <p class="text-red-600">{{ pagination.error() }}</p>
              <button
                (click)="loadUsers()"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          } @else if (users().length === 0) {
            <!-- Empty state -->
            <div class="p-8 text-center text-gray-500">
              No se encontraron usuarios
            </div>
          } @else {
            <!-- User list -->
            @for (user of users(); track user.id) {
              <div class="p-4 hover:bg-gray-50">
                <h3 class="font-medium text-gray-900">{{ user.name }}</h3>
                <p class="text-sm text-gray-600">{{ user.email }}</p>
              </div>
            }
          }
        </div>

        <!-- Pagination -->
        @if (!pagination.error() && pagination.totalPages() > 0) {
          <app-pagination
            [data]="{
              currentPage: pagination.currentPage(),
              totalPages: pagination.totalPages(),
              pageSize: pagination.pageSize(),
              totalItems: pagination.totalItems(),
              hasNext: pagination.hasNext(),
              hasPrevious: pagination.hasPrevious()
            }"
            [isLoading]="pagination.isLoading()"
            [showFirstLast]="true"
            [showJumpToPage]="true"
            (onPageChange)="onPageChange($event)"
            (onNext)="onNext()"
            (onPrevious)="onPrevious()"
            (onFirst)="onFirst()"
            (onLast)="onLast()"
          />
        }
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit {
  private api = inject(ApiWithPaginationService);
  pagination = inject(PaginationService<User>);

  users = signal<User[]>([]);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.pagination.setLoading(true);

    this.api.getPaginated<User>('users', this.pagination.getParams())
      .pipe(
        catchError(error => {
          this.pagination.setError('Error al cargar usuarios');
          return of(null);
        }),
        finalize(() => {
          // Scroll to top al cambiar de página
          window.scrollTo({ top: 0, behavior: 'smooth' });
        })
      )
      .subscribe(response => {
        if (response) {
          this.users.set(response.data);
          this.pagination.updateFromResponse(response);
        }
      });
  }

  onPageChange(page: number): void {
    this.pagination.goToPage(page);
    this.loadUsers();
  }

  onNext(): void {
    this.pagination.goToNext();
    this.loadUsers();
  }

  onPrevious(): void {
    this.pagination.goToPrevious();
    this.loadUsers();
  }

  onFirst(): void {
    this.pagination.goToFirst();
    this.loadUsers();
  }

  onLast(): void {
    this.pagination.goToLast();
    this.loadUsers();
  }

  onPageSizeChange(pageSize: number): void {
    this.pagination.changePageSize(pageSize);
    this.loadUsers();
  }
}
```

---

## 8. Client-Side Pagination

Crear `src/app/core/utils/pagination.util.ts`:

```typescript
/**
 * Utilidades para paginación client-side
 */
export class PaginationUtil {

  /**
   * Pagina un array en memoria
   */
  static paginateArray<T>(
    items: T[],
    page: number,
    pageSize: number
  ): T[] {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }

  /**
   * Calcula total de páginas
   */
  static calculateTotalPages(totalItems: number, pageSize: number): number {
    return Math.ceil(totalItems / pageSize);
  }

  /**
   * Valida número de página
   */
  static isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
  }

  /**
   * Crea respuesta paginada desde array
   */
  static createPaginatedResponse<T>(
    allItems: T[],
    page: number,
    pageSize: number
  ): import('@/core/models/pagination.models').PaginatedResponse<T> {
    const total = allItems.length;
    const totalPages = this.calculateTotalPages(total, pageSize);
    const data = this.paginateArray(allItems, page, pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }
}
```

### Ejemplo Client-Side Pagination

```typescript
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '@/shared/components/pagination/pagination.component';
import { PaginationUtil } from '@/core/utils/pagination.util';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="container mx-auto p-4">
      <!-- Products grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        @for (product of paginatedProducts(); track product.id) {
          <div class="p-4 border rounded">
            <h3 class="font-medium">{{ product.name }}</h3>
            <p class="text-gray-600">\${{ product.price }}</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      <app-pagination
        [data]="paginationData()"
        (onPageChange)="currentPage.set($event)"
        (onNext)="currentPage.update(p => p + 1)"
        (onPrevious)="currentPage.update(p => p - 1)"
      />
    </div>
  `
})
export class ProductsListComponent implements OnInit {
  // Todos los productos (en memoria)
  allProducts = signal<Product[]>([]);

  // Estado de paginación
  currentPage = signal(1);
  pageSize = signal(10);

  // Computed: productos paginados
  paginatedProducts = computed(() => {
    return PaginationUtil.paginateArray(
      this.allProducts(),
      this.currentPage(),
      this.pageSize()
    );
  });

  // Computed: datos de paginación
  paginationData = computed(() => {
    const response = PaginationUtil.createPaginatedResponse(
      this.allProducts(),
      this.currentPage(),
      this.pageSize()
    );

    return {
      currentPage: response.page,
      totalPages: response.totalPages,
      pageSize: response.pageSize,
      totalItems: response.total,
      hasNext: response.hasNext,
      hasPrevious: response.hasPrevious
    };
  });

  ngOnInit(): void {
    // Simular carga de datos
    const mockProducts: Product[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 10
    }));

    this.allProducts.set(mockProducts);
  }
}
```

---

## 9. URL Query Params Sync

Crear `src/app/core/services/pagination-url-sync.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PaginationParams } from '@/core/models/pagination.models';

/**
 * Servicio para sincronizar paginación con URL query params
 */
@Injectable({ providedIn: 'root' })
export class PaginationUrlSyncService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * Lee parámetros de paginación desde URL
   */
  readFromUrl(): Partial<PaginationParams> {
    const params = this.route.snapshot.queryParams;

    return {
      page: params['page'] ? parseInt(params['page'], 10) : 1,
      pageSize: params['pageSize'] ? parseInt(params['pageSize'], 10) : 10,
      sortBy: params['sortBy'],
      sortOrder: params['sortOrder'],
      search: params['search']
    };
  }

  /**
   * Actualiza URL con parámetros de paginación
   */
  updateUrl(params: Partial<PaginationParams>): void {
    const queryParams: any = {};

    if (params.page && params.page !== 1) {
      queryParams.page = params.page;
    }

    if (params.pageSize && params.pageSize !== 10) {
      queryParams.pageSize = params.pageSize;
    }

    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
    }

    if (params.sortOrder) {
      queryParams.sortOrder = params.sortOrder;
    }

    if (params.search) {
      queryParams.search = params.search;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  /**
   * Limpia parámetros de URL
   */
  clearUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }
}
```

### Uso con URL Sync

```typescript
@Component({
  selector: 'app-users-with-url-sync',
  template: `<!-- ... -->`
})
export class UsersWithUrlSyncComponent implements OnInit {
  private urlSync = inject(PaginationUrlSyncService);
  pagination = inject(PaginationService);

  ngOnInit(): void {
    // Leer parámetros desde URL
    const urlParams = this.urlSync.readFromUrl();

    if (urlParams.page) {
      this.pagination.goToPage(urlParams.page);
    }

    if (urlParams.pageSize) {
      this.pagination.changePageSize(urlParams.pageSize);
    }

    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.pagination.goToPage(page);
    this.urlSync.updateUrl(this.pagination.getParams());
    this.loadUsers();
  }
}
```

---

## 10. Cache de Páginas

Crear `src/app/core/services/pagination-cache.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { PaginatedResponse } from '@/core/models/pagination.models';

interface CacheEntry<T> {
  data: PaginatedResponse<T>;
  timestamp: number;
}

/**
 * Servicio para cachear páginas visitadas
 */
@Injectable({ providedIn: 'root' })
export class PaginationCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Genera clave de cache
   */
  private getCacheKey(endpoint: string, page: number, pageSize: number): string {
    return `${endpoint}:${page}:${pageSize}`;
  }

  /**
   * Obtiene datos del cache
   */
  get<T>(
    endpoint: string,
    page: number,
    pageSize: number
  ): PaginatedResponse<T> | null {
    const key = this.getCacheKey(endpoint, page, pageSize);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si el cache expiró
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Guarda datos en cache
   */
  set<T>(
    endpoint: string,
    page: number,
    pageSize: number,
    data: PaginatedResponse<T>
  ): void {
    const key = this.getCacheKey(endpoint, page, pageSize);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalida cache de un endpoint
   */
  invalidate(endpoint: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(endpoint + ':')) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
  }
}
```

---

## 11. Performance Optimizations

### 11.1 Virtual Scroll Alternative

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

/**
 * Alternativa con Virtual Scroll para grandes datasets
 */
@Component({
  selector: 'app-virtual-scroll-list',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport
      [itemSize]="50"
      class="h-[600px] border rounded"
    >
      <div
        *cdkVirtualFor="let item of items"
        class="h-[50px] p-4 border-b hover:bg-gray-50"
      >
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class VirtualScrollListComponent {
  items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));
}
```

### 11.2 TrackBy Functions

```typescript
/**
 * TrackBy function para listas paginadas
 */
trackByItemId(index: number, item: any): any {
  return item.id || index;
}

// Uso en template
// @for (item of items(); track trackByItemId($index, item))
```

### 11.3 OnPush Change Detection

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-optimized-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class OptimizedListComponent {
  // Usar signals para cambios automáticos con OnPush
}
```

---

## 12. Estilos CSS

Crear `src/styles/pagination.scss`:

```scss
/* ============================================
   PAGINATION STYLES
   ============================================ */

/* Pagination container */
.pagination-container {
  @apply flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200;

  @screen sm {
    @apply px-6;
  }
}

/* Pagination info text */
.pagination-info {
  @apply text-sm text-gray-700;

  .font-medium {
    @apply font-medium;
  }
}

/* Pagination buttons base */
.pagination-btn-base {
  @apply relative inline-flex items-center px-2 py-2;
  @apply text-sm font-medium;
  @apply border border-gray-300 bg-white;
  @apply hover:bg-gray-50;
  @apply focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500;
  @apply transition-colors duration-200;
}

/* Disabled state */
.pagination-btn-disabled {
  @apply opacity-50 cursor-not-allowed;
  @apply hover:bg-white;
}

/* Page number buttons */
.pagination-page-number {
  @apply pagination-btn-base px-4;

  &.active {
    @apply bg-blue-600 text-white border-blue-600;
    @apply hover:bg-blue-700;
  }
}

/* Mobile pagination */
@media (max-width: 640px) {
  .pagination-desktop-only {
    @apply hidden;
  }

  .pagination-mobile-info {
    @apply block text-sm text-gray-700;
  }
}

/* ============================================
   LOAD MORE STYLES
   ============================================ */

.load-more-container {
  @apply flex flex-col items-center gap-4 py-8;
}

.load-more-btn {
  @apply inline-flex items-center px-6 py-3;
  @apply bg-white border-2 border-gray-300 rounded-lg;
  @apply text-sm font-medium text-gray-700;
  @apply hover:bg-gray-50 hover:border-gray-400;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-all duration-200;

  svg {
    @apply ml-2 w-5 h-5;
    @apply transition-transform duration-200;
  }

  &:hover svg {
    @apply transform translate-y-0.5;
  }
}

/* ============================================
   SKELETON LOADERS
   ============================================ */

.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

.skeleton-line {
  @apply h-4 skeleton;
}

.skeleton-text {
  @apply h-3 skeleton;
}

.skeleton-avatar {
  @apply h-10 w-10 rounded-full skeleton;
}

/* ============================================
   EMPTY STATES
   ============================================ */

.empty-state {
  @apply p-8 text-center;

  .empty-icon {
    @apply mx-auto h-12 w-12 text-gray-400;
  }

  .empty-title {
    @apply mt-4 text-lg font-medium text-gray-900;
  }

  .empty-description {
    @apply mt-2 text-sm text-gray-500;
  }
}

/* ============================================
   RESPONSIVE UTILITIES
   ============================================ */

/* Hide on mobile */
.hide-mobile {
  @apply hidden;

  @screen sm {
    @apply block;
  }
}

/* Show only on mobile */
.show-mobile {
  @apply block;

  @screen sm {
    @apply hidden;
  }
}
```

---

## 13. Ejemplos Completos

Ver archivos de referencia:
- `references/server-side-examples.md` - Ejemplos con APIs REST
- `references/infinite-scroll-examples.md` - Ejemplos infinite scroll
- `references/advanced-patterns.md` - Patrones avanzados

---

## Best Practices Summary

1. **Usar signals** para estado reactivo y OnPush
2. **TrackBy functions** en ngFor para performance
3. **Skeleton loaders** durante carga
4. **Empty states** cuando no hay datos
5. **Error handling** robusto con retry
6. **Cache** para páginas visitadas (opcional)
7. **URL sync** para compartir enlaces
8. **Scroll to top** al cambiar página
9. **Responsive design** mobile-first
10. **Accessibility** con ARIA labels

---

## Performance Tips

- **Virtual Scroll** para 1000+ items
- **OnPush** change detection
- **TrackBy** en listas
- **Debounce** en infinite scroll
- **Cache** de páginas visitadas
- **Lazy loading** de componentes
- **Server-side pagination** para grandes datasets

---

**Nota**: Este skill proporciona código production-ready para aplicaciones Angular 19+ standalone. Todos los componentes están diseñados para ser reutilizables y extensibles. Ajustar según las necesidades del proyecto.
