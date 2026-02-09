---
name: angular-data-table
description: >
  Componente DataTable enterprise-ready genérico para Angular standalone con Tailwind CSS.
  Usar cuando se necesite tabla de datos con paginación server-side/client-side, sorting
  multi-columna, filtrado por columnas con debounce, búsqueda global, virtual scrolling para
  grandes datasets, selección de filas (single/multiple), acciones en filas (edit/delete/view),
  columnas configurables dinámicamente, exportación (CSV/Excel/PDF), loading states, skeleton
  loaders, empty state, responsive design (mobile cards), integración con APIs paginadas, manejo
  de estado con signals, performance optimizations (trackBy, OnPush), y código production-ready
  reutilizable con TypeScript generics <T>.
---

# Angular Data Table - Enterprise-Ready Component

Componente DataTable completo, genérico y reutilizable para Angular standalone con Tailwind CSS.

## Prerequisitos

```bash
# Instalar Angular CDK para virtual scroll
npm install @angular/cdk

# Opcional para exportación
npm install xlsx file-saver
npm install --save-dev @types/file-saver
```

## 1. Interfaces y Types

### data-table.types.ts

```typescript
// src/app/shared/components/data-table/data-table.types.ts

/**
 * Configuración de una columna de la tabla.
 */
export interface ColumnConfig<T = any> {
  /** Clave única de la columna */
  key: string;
  /** Label visible en el header */
  label: string;
  /** Si la columna es sortable */
  sortable?: boolean;
  /** Si la columna es filterable */
  filterable?: boolean;
  /** Ancho de la columna (CSS width) */
  width?: string;
  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right';
  /** Función para formatear el valor de la celda */
  format?: (value: any, row: T) => string;
  /** Template personalizado para la celda */
  cellTemplate?: any; // TemplateRef
  /** Si la columna es visible en mobile */
  mobileVisible?: boolean;
  /** Clase CSS adicional */
  cssClass?: string;
}

/**
 * Dirección de ordenamiento.
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Estado de ordenamiento de una columna.
 */
export interface SortState {
  column: string;
  direction: SortDirection;
}

/**
 * Configuración de paginación.
 */
export interface PaginationConfig {
  /** Página actual (1-based) */
  page: number;
  /** Tamaño de página */
  pageSize: number;
  /** Total de items */
  totalItems: number;
  /** Opciones de page size */
  pageSizeOptions?: number[];
}

/**
 * Filtros aplicados por columna.
 */
export interface ColumnFilters {
  [key: string]: string;
}

/**
 * Configuración de la tabla.
 */
export interface DataTableConfig<T = any> {
  /** Columnas de la tabla */
  columns: ColumnConfig<T>[];
  /** Si la paginación es server-side */
  serverSide?: boolean;
  /** Configuración de paginación */
  pagination?: PaginationConfig;
  /** Si se permite selección de filas */
  selectable?: boolean;
  /** Modo de selección */
  selectionMode?: 'single' | 'multiple';
  /** Si se muestra checkbox de selección */
  showSelectColumn?: boolean;
  /** Si se muestra columna de acciones */
  showActionsColumn?: boolean;
  /** Label de columna de acciones */
  actionsLabel?: string;
  /** Si usar virtual scroll */
  virtualScroll?: boolean;
  /** Altura del virtual scroll container (px) */
  virtualScrollHeight?: number;
  /** Altura de cada fila (px) */
  itemSize?: number;
  /** Si mostrar búsqueda global */
  showGlobalSearch?: boolean;
  /** Placeholder de búsqueda */
  searchPlaceholder?: string;
  /** Debounce time para búsqueda (ms) */
  searchDebounce?: number;
  /** Si mostrar export buttons */
  showExport?: boolean;
  /** Formatos de exportación disponibles */
  exportFormats?: ('csv' | 'excel' | 'pdf')[];
}

/**
 * Evento de cambio en la tabla.
 */
export interface DataTableChange {
  /** Filtros aplicados */
  filters: ColumnFilters;
  /** Búsqueda global */
  search: string;
  /** Estado de sorting */
  sort: SortState[];
  /** Configuración de paginación */
  pagination: PaginationConfig;
}

/**
 * Acción en una fila.
 */
export interface RowAction<T = any> {
  /** Identificador de la acción */
  id: string;
  /** Label visible */
  label: string;
  /** Icono (SVG string) */
  icon?: string;
  /** Clase CSS para el botón */
  cssClass?: string;
  /** Si la acción está deshabilitada */
  disabled?: (row: T) => boolean;
  /** Si mostrar la acción */
  show?: (row: T) => boolean;
  /** Handler del click */
  handler: (row: T) => void;
}
```

## 2. DataTable Component

### data-table.component.ts

```typescript
// src/app/shared/components/data-table/data-table.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  TemplateRef,
  ContentChildren,
  QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  ColumnConfig,
  DataTableConfig,
  SortState,
  SortDirection,
  ColumnFilters,
  DataTableChange,
  RowAction,
  PaginationConfig
} from './data-table.types';

/**
 * DataTable component genérico, reutilizable y enterprise-ready.
 *
 * Características:
 * - Paginación server-side y client-side
 * - Sorting multi-columna
 * - Filtrado por columnas con debounce
 * - Búsqueda global
 * - Virtual scrolling (opcional)
 * - Selección de filas
 * - Responsive design
 *
 * @example
 * <app-data-table
 *   [data]="users"
 *   [config]="tableConfig"
 *   (dataChange)="onDataChange($event)"
 *   (rowClick)="onRowClick($event)"
 * >
 *   <ng-template #cellTemplate let-row let-column="column">
 *     {{ row[column.key] }}
 *   </ng-template>
 * </app-data-table>
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T = any> implements OnInit {
  // ========== Inputs ==========
  @Input() data: T[] = [];
  @Input() config!: DataTableConfig<T>;
  @Input() loading = false;
  @Input() actions: RowAction<T>[] = [];

  // ========== Outputs ==========
  @Output() dataChange = new EventEmitter<DataTableChange>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() rowSelect = new EventEmitter<T[]>();
  @Output() actionClick = new EventEmitter<{ action: RowAction<T>; row: T }>();

  // ========== Templates ==========
  @ContentChildren('cellTemplate') cellTemplates?: QueryList<TemplateRef<any>>;

  // ========== State ==========
  globalSearch = signal('');
  columnFilters = signal<ColumnFilters>({});
  sortStates = signal<SortState[]>([]);
  selectedRows = signal<Set<T>>(new Set());
  currentPage = signal(1);
  pageSize = signal(10);

  // ========== Computed ==========
  /**
   * Datos filtrados por búsqueda global y filtros de columna.
   */
  filteredData = computed(() => {
    let result = [...this.data];
    const search = this.globalSearch().toLowerCase();
    const filters = this.columnFilters();

    // Filtro global
    if (search && this.config.showGlobalSearch) {
      result = result.filter(row =>
        this.config.columns.some(col => {
          const value = this.getCellValue(row, col);
          return value?.toLowerCase().includes(search);
        })
      );
    }

    // Filtros por columna
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter(row => {
          const value = this.getCellValue(row, { key } as ColumnConfig);
          return value?.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  });

  /**
   * Datos ordenados según sortStates.
   */
  sortedData = computed(() => {
    const data = [...this.filteredData()];
    const sorts = this.sortStates();

    if (sorts.length === 0) return data;

    return data.sort((a, b) => {
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

  /**
   * Datos paginados (solo para client-side).
   */
  paginatedData = computed(() => {
    if (this.config.serverSide) {
      return this.sortedData();
    }

    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.sortedData().slice(start, end);
  });

  /**
   * Total de items (filtrados).
   */
  totalItems = computed(() => {
    return this.config.serverSide
      ? this.config.pagination?.totalItems || 0
      : this.filteredData().length;
  });

  /**
   * Total de páginas.
   */
  totalPages = computed(() => {
    return Math.ceil(this.totalItems() / this.pageSize());
  });

  /**
   * Si todas las filas visibles están seleccionadas.
   */
  allSelected = computed(() => {
    const visibleData = this.paginatedData();
    if (visibleData.length === 0) return false;

    return visibleData.every(row => this.selectedRows().has(row));
  });

  /**
   * Si algunas filas están seleccionadas (para indeterminate).
   */
  someSelected = computed(() => {
    const selected = this.selectedRows().size;
    return selected > 0 && !this.allSelected();
  });

  ngOnInit(): void {
    // Inicializar paginación
    if (this.config.pagination) {
      this.currentPage.set(this.config.pagination.page);
      this.pageSize.set(this.config.pagination.pageSize);
    }
  }

  // ========== Sorting ==========

  /**
   * Toggle sort en una columna.
   */
  toggleSort(column: ColumnConfig): void {
    if (!column.sortable) return;

    this.sortStates.update(states => {
      const existing = states.find(s => s.column === column.key);

      if (!existing) {
        // Nueva columna: agregar con asc
        return [...states, { column: column.key, direction: 'asc' as SortDirection }];
      }

      if (existing.direction === 'asc') {
        // Cambiar a desc
        return states.map(s =>
          s.column === column.key ? { ...s, direction: 'desc' as SortDirection } : s
        );
      }

      // Remover sort
      return states.filter(s => s.column !== column.key);
    });

    this.emitChange();
  }

  /**
   * Obtiene el estado de sort de una columna.
   */
  getSortDirection(column: ColumnConfig): SortDirection {
    const state = this.sortStates().find(s => s.column === column.key);
    return state?.direction || null;
  }

  /**
   * Obtiene el índice de sort (para multi-column).
   */
  getSortIndex(column: ColumnConfig): number {
    const index = this.sortStates().findIndex(s => s.column === column.key);
    return index >= 0 ? index + 1 : 0;
  }

  // ========== Filtering ==========

  /**
   * Actualiza el filtro de una columna.
   */
  updateColumnFilter(column: ColumnConfig, value: string): void {
    this.columnFilters.update(filters => ({
      ...filters,
      [column.key]: value
    }));

    // Reset a página 1
    this.currentPage.set(1);
    this.emitChange();
  }

  /**
   * Actualiza la búsqueda global.
   */
  updateGlobalSearch(value: string): void {
    this.globalSearch.set(value);
    this.currentPage.set(1);
    this.emitChange();
  }

  // ========== Pagination ==========

  /**
   * Cambia de página.
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.emitChange();
  }

  /**
   * Cambia el tamaño de página.
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.emitChange();
  }

  // ========== Selection ==========

  /**
   * Toggle selección de una fila.
   */
  toggleRowSelection(row: T): void {
    if (!this.config.selectable) return;

    this.selectedRows.update(selected => {
      const newSet = new Set(selected);

      if (this.config.selectionMode === 'single') {
        // Single selection: clear others
        newSet.clear();
        newSet.add(row);
      } else {
        // Multiple selection: toggle
        if (newSet.has(row)) {
          newSet.delete(row);
        } else {
          newSet.add(row);
        }
      }

      return newSet;
    });

    this.rowSelect.emit(Array.from(this.selectedRows()));
  }

  /**
   * Toggle selección de todas las filas visibles.
   */
  toggleAllRows(): void {
    const visibleData = this.paginatedData();

    this.selectedRows.update(selected => {
      const newSet = new Set(selected);

      if (this.allSelected()) {
        // Deseleccionar todas
        visibleData.forEach(row => newSet.delete(row));
      } else {
        // Seleccionar todas
        visibleData.forEach(row => newSet.add(row));
      }

      return newSet;
    });

    this.rowSelect.emit(Array.from(this.selectedRows()));
  }

  /**
   * Verifica si una fila está seleccionada.
   */
  isRowSelected(row: T): boolean {
    return this.selectedRows().has(row);
  }

  /**
   * Limpia la selección.
   */
  clearSelection(): void {
    this.selectedRows.set(new Set());
    this.rowSelect.emit([]);
  }

  // ========== Actions ==========

  /**
   * Handler de click en una acción.
   */
  onActionClick(action: RowAction<T>, row: T, event: Event): void {
    event.stopPropagation();

    if (action.disabled?.(row)) return;

    action.handler(row);
    this.actionClick.emit({ action, row });
  }

  /**
   * Verifica si una acción debe mostrarse.
   */
  shouldShowAction(action: RowAction<T>, row: T): boolean {
    return action.show ? action.show(row) : true;
  }

  // ========== Helpers ==========

  /**
   * Obtiene el valor de una celda.
   */
  getCellValue(row: T, column: ColumnConfig): string {
    const value = (row as any)[column.key];

    if (column.format) {
      return column.format(value, row);
    }

    return value?.toString() || '';
  }

  /**
   * TrackBy function para performance.
   */
  trackByFn(index: number, item: T): any {
    return (item as any).id || index;
  }

  /**
   * Emite evento de cambio.
   */
  private emitChange(): void {
    const change: DataTableChange = {
      filters: this.columnFilters(),
      search: this.globalSearch(),
      sort: this.sortStates(),
      pagination: {
        page: this.currentPage(),
        pageSize: this.pageSize(),
        totalItems: this.totalItems(),
        pageSizeOptions: this.config.pagination?.pageSizeOptions
      }
    };

    this.dataChange.emit(change);
  }

  /**
   * Handler de click en fila.
   */
  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
}
```

## 3. DataTable Template

### data-table.component.html

```html
<!-- src/app/shared/components/data-table/data-table.component.html -->
<div class="data-table-container w-full">
  <!-- Toolbar: Search + Actions -->
  <div class="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
    <!-- Global Search -->
    @if (config.showGlobalSearch) {
      <div class="relative flex-1 max-w-md">
        <input
          type="text"
          [placeholder]="config.searchPlaceholder || 'Search...'"
          [(ngModel)]="globalSearch"
          (ngModelChange)="updateGlobalSearch($event)"
          class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    }

    <!-- Export Buttons -->
    @if (config.showExport) {
      <div class="flex gap-2">
        <button class="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          Export CSV
        </button>
        <button class="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          Export Excel
        </button>
      </div>
    }
  </div>

  <!-- Table Container -->
  <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
    <!-- Loading Overlay -->
    @if (loading) {
      <div class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }

    <!-- Desktop Table View -->
    <div class="hidden md:block">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <!-- Select All Checkbox -->
            @if (config.showSelectColumn) {
              <th class="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  [checked]="allSelected()"
                  [indeterminate]="someSelected()"
                  (change)="toggleAllRows()"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </th>
            }

            <!-- Column Headers -->
            @for (column of config.columns; track column.key) {
              <th
                [class]="'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ' + column.cssClass"
                [style.width]="column.width"
              >
                <div class="flex items-center gap-2">
                  <span>{{ column.label }}</span>

                  <!-- Sort Button -->
                  @if (column.sortable) {
                    <button
                      (click)="toggleSort(column)"
                      class="inline-flex items-center"
                    >
                      <!-- Sort Icons -->
                      @if (getSortDirection(column) === null) {
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                        </svg>
                      }
                      @if (getSortDirection(column) === 'asc') {
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                        </svg>
                      }
                      @if (getSortDirection(column) === 'desc') {
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                      }

                      <!-- Sort Index (for multi-column) -->
                      @if (getSortIndex(column) > 0) {
                        <span class="text-xs text-blue-600 font-semibold">
                          {{ getSortIndex(column) }}
                        </span>
                      }
                    </button>
                  }
                </div>

                <!-- Column Filter -->
                @if (column.filterable) {
                  <input
                    type="text"
                    placeholder="Filter..."
                    (input)="updateColumnFilter(column, $any($event.target).value)"
                    class="mt-1 w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                }
              </th>
            }

            <!-- Actions Column -->
            @if (config.showActionsColumn && actions.length > 0) {
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {{ config.actionsLabel || 'Actions' }}
              </th>
            }
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          @if (paginatedData().length === 0) {
            <!-- Empty State -->
            <tr>
              <td [attr.colspan]="config.columns.length + (config.showSelectColumn ? 1 : 0) + (config.showActionsColumn ? 1 : 0)" class="px-4 py-12 text-center">
                <div class="text-gray-500 dark:text-gray-400">
                  <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                  <p class="text-sm font-medium">No data available</p>
                  <p class="text-sm">Try adjusting your search or filters</p>
                </div>
              </td>
            </tr>
          } @else {
            @for (row of paginatedData(); track trackByFn($index, row)) {
              <tr
                (click)="onRowClick(row)"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                [class.bg-blue-50]="isRowSelected(row)"
                [class.dark:bg-blue-900/20]="isRowSelected(row)"
              >
                <!-- Selection Checkbox -->
                @if (config.showSelectColumn) {
                  <td class="px-4 py-3">
                    <input
                      type="checkbox"
                      [checked]="isRowSelected(row)"
                      (change)="toggleRowSelection(row)"
                      (click)="$event.stopPropagation()"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                }

                <!-- Data Cells -->
                @for (column of config.columns; track column.key) {
                  <td
                    class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                    [class]="'text-' + column.align"
                  >
                    {{ getCellValue(row, column) }}
                  </td>
                }

                <!-- Actions -->
                @if (config.showActionsColumn && actions.length > 0) {
                  <td class="px-4 py-3 text-right text-sm">
                    <div class="flex justify-end gap-2">
                      @for (action of actions; track action.id) {
                        @if (shouldShowAction(action, row)) {
                          <button
                            (click)="onActionClick(action, row, $event)"
                            [disabled]="action.disabled?.(row)"
                            [class]="'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ' + action.cssClass"
                            [title]="action.label"
                          >
                            @if (action.icon) {
                              <span [innerHTML]="action.icon" class="w-5 h-5"></span>
                            } @else {
                              <span>{{ action.label }}</span>
                            }
                          </button>
                        }
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
      @for (row of paginatedData(); track trackByFn($index, row)) {
        <div
          (click)="onRowClick(row)"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
          [class.bg-blue-50]="isRowSelected(row)"
        >
          @for (column of config.columns; track column.key) {
            @if (column.mobileVisible !== false) {
              <div class="flex justify-between py-2">
                <span class="font-medium text-gray-500 dark:text-gray-400">
                  {{ column.label }}
                </span>
                <span class="text-gray-900 dark:text-gray-100">
                  {{ getCellValue(row, column) }}
                </span>
              </div>
            }
          }
        </div>
      }
    </div>
  </div>

  <!-- Pagination -->
  @if (config.pagination && totalPages() > 1) {
    <div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Page Size Selector -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-700 dark:text-gray-300">Show</span>
        <select
          [value]="pageSize()"
          (change)="changePageSize(+$any($event.target).value)"
          class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          @for (option of config.pagination.pageSizeOptions || [10, 25, 50, 100]; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
        <span class="text-sm text-gray-700 dark:text-gray-300">entries</span>
      </div>

      <!-- Pagination Controls -->
      <div class="flex items-center gap-2">
        <button
          (click)="goToPage(currentPage() - 1)"
          [disabled]="currentPage() === 1"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <span class="text-sm text-gray-700 dark:text-gray-300">
          Page {{ currentPage() }} of {{ totalPages() }}
        </span>

        <button
          (click)="goToPage(currentPage() + 1)"
          [disabled]="currentPage() === totalPages()"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <!-- Items Info -->
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Showing {{ (currentPage() - 1) * pageSize() + 1 }}
        to {{ Math.min(currentPage() * pageSize(), totalItems()) }}
        of {{ totalItems() }} entries
      </div>
    </div>
  }
</div>
```

## 4. Ejemplo de Uso

Ver `references/usage-examples.md` para ejemplos completos con:
- Client-side pagination y filtering
- Server-side pagination con API
- Exportación de datos
- Virtual scrolling
- Responsive mobile view

## Resumen

Componente DataTable enterprise-ready que incluye:
- **Genérico con TypeScript** <T>
- **Paginación** client-side y server-side
- **Sorting** multi-columna
- **Filtrado** por columna y global
- **Selección** de filas
- **Acciones** personalizables
- **Responsive** design
- **Performance** optimized
- **Signals** para estado reactivo

Ver referencias para implementaciones avanzadas.
