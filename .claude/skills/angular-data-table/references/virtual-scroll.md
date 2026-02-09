# Virtual Scrolling - Large Datasets

Implementación de virtual scrolling con Angular CDK para manejar grandes volúmenes de datos.

## 1. Setup CDK Virtual Scroll

```bash
# Instalar Angular CDK
npm install @angular/cdk
```

## 2. DataTable con Virtual Scroll

```typescript
// data-table-virtual.component.ts
import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ColumnConfig, DataTableConfig } from './data-table.types';

/**
 * DataTable con virtual scrolling para datasets grandes (>1000 items).
 *
 * @example
 * <app-data-table-virtual
 *   [data]="largeDataset"
 *   [config]="config"
 *   [itemSize]="50"
 * ></app-data-table-virtual>
 */
@Component({
  selector: 'app-data-table-virtual',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  template: `
    <div class="data-table-virtual-container">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div class="flex">
          @for (column of config.columns; track column.key) {
            <div
              [class]="getHeaderClass(column)"
              [style.width]="column.width || 'auto'"
            >
              <div class="flex items-center gap-2 px-4 py-3">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {{ column.label }}
                </span>

                @if (column.sortable) {
                  <button (click)="toggleSort(column)" class="inline-flex">
                    @if (getSortDirection(column) === 'asc') {
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                      </svg>
                    } @else if (getSortDirection(column) === 'desc') {
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                      </svg>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Virtual Scroll Viewport -->
      <cdk-virtual-scroll-viewport
        [itemSize]="itemSize"
        [style.height.px]="config.virtualScrollHeight || 600"
        class="bg-white dark:bg-gray-800"
      >
        <div
          *cdkVirtualFor="let row of sortedData(); trackBy: trackByFn"
          class="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          [style.height.px]="itemSize"
          (click)="onRowClick(row)"
        >
          @for (column of config.columns; track column.key) {
            <div
              [class]="getCellClass(column)"
              [style.width]="column.width || 'auto'"
            >
              <div class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                {{ getCellValue(row, column) }}
              </div>
            </div>
          }
        </div>
      </cdk-virtual-scroll-viewport>

      <!-- Stats -->
      <div class="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ sortedData().length }} items (Virtual scrolling enabled)
        </p>
      </div>
    </div>
  `,
  styles: [`
    .data-table-virtual-container {
      @apply bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden;
    }

    cdk-virtual-scroll-viewport {
      @apply overflow-y-auto;
    }

    cdk-virtual-scroll-viewport::ng-deep .cdk-virtual-scroll-content-wrapper {
      @apply w-full;
    }
  `]
})
export class DataTableVirtualComponent<T> {
  @Input() data: T[] = [];
  @Input() config!: DataTableConfig<T>;
  @Input() itemSize = 50; // Altura de cada fila en px

  sortStates = signal<SortState[]>([]);

  sortedData = computed(() => {
    let result = [...this.data];
    const sorts = this.sortStates();

    if (sorts.length === 0) return result;

    return result.sort((a, b) => {
      for (const sort of sorts) {
        const column = this.config.columns.find(c => c.key === sort.column);
        if (!column) continue;

        const aValue = this.getCellValue(a, column);
        const bValue = this.getCellValue(b, column);

        if (aValue === bValue) continue;

        const comparison = aValue > bValue ? 1 : -1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  });

  toggleSort(column: ColumnConfig): void {
    // ... (mismo que en DataTable normal)
  }

  getSortDirection(column: ColumnConfig): SortDirection {
    const state = this.sortStates().find(s => s.column === column.key);
    return state?.direction || null;
  }

  getCellValue(row: T, column: ColumnConfig): string {
    const value = (row as any)[column.key];
    return column.format ? column.format(value, row) : value?.toString() || '';
  }

  getHeaderClass(column: ColumnConfig): string {
    return 'flex-shrink-0';
  }

  getCellClass(column: ColumnConfig): string {
    const base = 'flex-shrink-0 flex items-center';
    const align = column.align ? `justify-${column.align}` : '';
    return `${base} ${align}`;
  }

  trackByFn(index: number, item: T): any {
    return (item as any).id || index;
  }

  onRowClick(row: T): void {
    console.log('Row clicked:', row);
  }
}
```

## 3. Buffer Configuration

```typescript
/**
 * Configuración avanzada de virtual scroll con buffer.
 */
@Component({
  template: `
    <cdk-virtual-scroll-viewport
      [itemSize]="itemSize"
      [minBufferPx]="minBufferPx"
      [maxBufferPx]="maxBufferPx"
      [style.height.px]="viewportHeight"
    >
      <!-- Contenido -->
    </cdk-virtual-scroll-viewport>
  `
})
export class DataTableVirtualComponent {
  @Input() itemSize = 50;
  @Input() viewportHeight = 600;
  @Input() minBufferPx = 500; // Buffer mínimo antes/después del viewport
  @Input() maxBufferPx = 1000; // Buffer máximo
}
```

## 4. Variable Row Height

```typescript
/**
 * Virtual scroll con altura variable de filas.
 * Usar cuando las filas tienen diferentes alturas.
 */
import { CdkVirtualScrollViewport, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { VariableSizeVirtualScrollStrategy } from './variable-size-strategy';

@Component({
  providers: [{
    provide: VIRTUAL_SCROLL_STRATEGY,
    useClass: VariableSizeVirtualScrollStrategy
  }],
  template: `
    <cdk-virtual-scroll-viewport [style.height.px]="600">
      <div
        *cdkVirtualFor="let row of data; trackBy: trackByFn"
        [style.height.px]="getRowHeight(row)"
      >
        <!-- Contenido con altura variable -->
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class DataTableVariableComponent {
  getRowHeight(row: any): number {
    // Calcular altura basada en contenido
    return row.hasDetails ? 100 : 50;
  }
}
```

## 5. Infinite Scroll

```typescript
/**
 * Virtual scroll con carga infinita de datos.
 */
@Component({
  template: `
    <cdk-virtual-scroll-viewport
      [itemSize]="itemSize"
      [style.height.px]="600"
      (scrolledIndexChange)="onScrollIndexChange($event)"
    >
      <div *cdkVirtualFor="let row of allData(); trackBy: trackByFn">
        <!-- Contenido -->
      </div>

      @if (loading()) {
        <div class="flex justify-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    </cdk-virtual-scroll-viewport>
  `
})
export class DataTableInfiniteComponent {
  private http = inject(HttpClient);

  allData = signal<any[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  hasMore = signal(true);

  onScrollIndexChange(index: number): void {
    const totalItems = this.allData().length;

    // Cargar más cuando llega al 80% del final
    if (index > totalItems * 0.8 && !this.loading() && this.hasMore()) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    this.loading.set(true);

    this.http.get<any>(`/api/data?page=${this.currentPage()}`).subscribe({
      next: (response) => {
        this.allData.update(data => [...data, ...response.data]);
        this.currentPage.update(p => p + 1);
        this.hasMore.set(response.hasMore);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
```

## 6. Performance Optimizations

```typescript
/**
 * Optimizaciones para virtual scroll con datasets muy grandes.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cdk-virtual-scroll-viewport
      [itemSize]="itemSize"
      [style.height.px]="600"
    >
      <div
        *cdkVirtualFor="let row of data; trackBy: trackByFn; templateCacheSize: 0"
        class="row"
      >
        <!-- templateCacheSize: 0 para grandes datasets -->
        {{ row.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class DataTableOptimizedComponent {
  // Usar OnPush change detection
  // Usar trackBy function eficiente
  trackByFn = (index: number, item: any) => item.id;

  // Lazy load de datos pesados
  getRowData(row: any): any {
    // Cargar datos solo cuando sea necesario
    return row._loadedData || this.loadRowData(row);
  }

  private loadRowData(row: any): any {
    // Simular carga lazy
    row._loadedData = { ...row, details: 'Loaded' };
    return row._loadedData;
  }
}
```

## 7. Scroll to Index

```typescript
/**
 * Funcionalidad para hacer scroll a un índice específico.
 */
@Component({
  template: `
    <div class="mb-4">
      <input
        type="number"
        [(ngModel)]="scrollToIndex"
        placeholder="Index to scroll"
        class="px-3 py-2 border rounded"
      />
      <button (click)="scrollTo()" class="ml-2 px-4 py-2 bg-blue-600 text-white rounded">
        Scroll to Index
      </button>
    </div>

    <cdk-virtual-scroll-viewport
      #viewport
      [itemSize]="50"
      [style.height.px]="600"
    >
      <!-- Contenido -->
    </cdk-virtual-scroll-viewport>
  `
})
export class DataTableScrollComponent {
  @ViewChild('viewport') viewport!: CdkVirtualScrollViewport;

  scrollToIndex = 0;

  scrollTo(): void {
    if (this.viewport) {
      this.viewport.scrollToIndex(this.scrollToIndex, 'smooth');
    }
  }

  scrollToTop(): void {
    this.viewport?.scrollTo({ top: 0 });
  }

  scrollToBottom(): void {
    const maxScroll = this.viewport?.measureScrollOffset('bottom');
    this.viewport?.scrollTo({ top: maxScroll });
  }
}
```

## 8. Ejemplo Completo

```typescript
// large-dataset.component.ts
@Component({
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Large Dataset ({{ data().length }} items)</h1>

      <!-- Stats -->
      <div class="mb-4 grid grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p class="text-sm text-gray-500">Total Items</p>
          <p class="text-2xl font-bold">{{ data().length }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p class="text-sm text-gray-500">Rendered Items</p>
          <p class="text-2xl font-bold">{{ renderedItems }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p class="text-sm text-gray-500">Memory Saved</p>
          <p class="text-2xl font-bold text-green-600">
            {{ ((1 - renderedItems / data().length) * 100).toFixed(1) }}%
          </p>
        </div>
      </div>

      <app-data-table-virtual
        [data]="data()"
        [config]="tableConfig"
        [itemSize]="50"
      ></app-data-table-virtual>
    </div>
  `
})
export class LargeDatasetComponent implements OnInit {
  data = signal<any[]>([]);
  renderedItems = 20; // Aproximado para viewport de 600px

  ngOnInit(): void {
    // Generar 10,000 items
    const items = Array.from({ length: 10000 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: Math.random() * 1000,
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    }));

    this.data.set(items);
  }

  tableConfig: DataTableConfig = {
    columns: [
      { key: 'id', label: 'ID', sortable: true, width: '100px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'value', label: 'Value', sortable: true, format: (v) => `$${v.toFixed(2)}` },
      { key: 'category', label: 'Category', sortable: true },
      { key: 'date', label: 'Date', sortable: true, format: (v) => v.toLocaleDateString() }
    ],
    virtualScroll: true,
    virtualScrollHeight: 600
  };
}
```

## Resumen

Virtual scrolling features incluyen:
- **CDK Virtual Scroll**: Para datasets >1000 items
- **Fixed Item Size**: Performance óptimo con altura fija
- **Variable Height**: Soporte para filas de altura variable
- **Infinite Scroll**: Carga bajo demanda
- **Scroll to Index**: Navegación programática
- **Performance**: trackBy, OnPush, template cache

Benefits:
- Renderiza solo ~20-30 items (viewport visible)
- Ahorra hasta 99% de memoria en grandes datasets
- Scroll suave y performante
- Compatible con sorting y filtering

Requiere `@angular/cdk`.
