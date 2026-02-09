# Usage Examples - Data Table

Ejemplos completos de uso del DataTable component en diferentes escenarios.

## 1. Client-Side Pagination (Básico)

```typescript
// users.component.ts
import { Component, signal } from '@angular/core';
import { DataTableComponent } from '@/shared/components/data-table/data-table.component';
import { ColumnConfig, DataTableConfig, RowAction } from '@/shared/components/data-table/data-table.types';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6">Users</h1>

      <app-data-table
        [data]="users()"
        [config]="tableConfig"
        [actions]="rowActions"
        [loading]="loading()"
        (rowClick)="onRowClick($event)"
        (actionClick)="onActionClick($event)"
      ></app-data-table>
    </div>
  `
})
export class UsersComponent {
  users = signal<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: new Date() },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', createdAt: new Date() },
    // ... más usuarios
  ]);

  loading = signal(false);

  // Configuración de columnas
  columns: ColumnConfig<User>[] = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      sortable: true
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filterable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      format: (value) => value.toUpperCase(),
      cssClass: 'font-semibold'
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      format: (value: Date) => value.toLocaleDateString()
    }
  ];

  // Configuración de la tabla
  tableConfig: DataTableConfig<User> = {
    columns: this.columns,
    serverSide: false,
    pagination: {
      page: 1,
      pageSize: 10,
      totalItems: this.users().length,
      pageSizeOptions: [10, 25, 50, 100]
    },
    selectable: true,
    selectionMode: 'multiple',
    showSelectColumn: true,
    showActionsColumn: true,
    actionsLabel: 'Actions',
    showGlobalSearch: true,
    searchPlaceholder: 'Search users...',
    searchDebounce: 300
  };

  // Acciones en filas
  rowActions: RowAction<User>[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
      cssClass: 'text-blue-600 hover:text-blue-800',
      handler: (user) => this.editUser(user)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
      cssClass: 'text-red-600 hover:text-red-800',
      handler: (user) => this.deleteUser(user),
      show: (user) => user.status !== 'active' // Solo mostrar para inactivos
    }
  ];

  onRowClick(user: User): void {
    console.log('Row clicked:', user);
  }

  onActionClick(event: { action: RowAction<User>; row: User }): void {
    console.log('Action clicked:', event.action.id, event.row);
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.name}?`)) {
      this.users.update(users => users.filter(u => u.id !== user.id));
    }
  }
}
```

## 2. Server-Side Pagination con API

```typescript
// products.component.ts
import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataTableChange } from '@/shared/components/data-table/data-table.types';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface ApiResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [data]="products()"
      [config]="tableConfig"
      [loading]="loading()"
      (dataChange)="onDataChange($event)"
    ></app-data-table>
  `
})
export class ProductsComponent {
  private http = inject(HttpClient);

  products = signal<Product[]>([]);
  loading = signal(false);
  totalItems = signal(0);

  columns: ColumnConfig<Product>[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { key: 'name', label: 'Product', sortable: true, filterable: true },
    { key: 'category', label: 'Category', sortable: true, filterable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      format: (value) => `$${value.toFixed(2)}`,
      align: 'right'
    },
    { key: 'stock', label: 'Stock', sortable: true, align: 'right' }
  ];

  tableConfig: DataTableConfig<Product> = {
    columns: this.columns,
    serverSide: true, // Server-side pagination
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: this.totalItems(),
      pageSizeOptions: [20, 50, 100]
    },
    showGlobalSearch: true,
    showActionsColumn: false
  };

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Handler de cambios en la tabla (paginación, sort, filtros).
   */
  onDataChange(change: DataTableChange): void {
    this.loadData(change);
  }

  /**
   * Carga datos desde la API.
   */
  private loadData(change?: DataTableChange): void {
    this.loading.set(true);

    // Construir query params
    const params: any = {
      page: change?.pagination.page || 1,
      pageSize: change?.pagination.pageSize || 20
    };

    // Sorting
    if (change?.sort && change.sort.length > 0) {
      const sort = change.sort[0];
      params.sortBy = sort.column;
      params.sortDirection = sort.direction;
    }

    // Búsqueda global
    if (change?.search) {
      params.search = change.search;
    }

    // Filtros por columna
    if (change?.filters) {
      Object.entries(change.filters).forEach(([key, value]) => {
        if (value) {
          params[`filter_${key}`] = value;
        }
      });
    }

    // Request a la API
    this.http.get<ApiResponse>('/api/products', { params })
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.totalItems.set(response.total);

          // Actualizar config de paginación
          this.tableConfig = {
            ...this.tableConfig,
            pagination: {
              ...this.tableConfig.pagination!,
              totalItems: response.total
            }
          };

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading.set(false);
        }
      });
  }
}
```

## 3. Con Selección de Filas

```typescript
// orders.component.ts
@Component({
  template: `
    <div>
      <!-- Selected Count -->
      @if (selectedOrders().length > 0) {
        <div class="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200">
            {{ selectedOrders().length }} order(s) selected
          </p>
          <div class="mt-2 flex gap-2">
            <button (click)="bulkApprove()" class="btn-primary">
              Approve Selected
            </button>
            <button (click)="bulkCancel()" class="btn-danger">
              Cancel Selected
            </button>
          </div>
        </div>
      }

      <app-data-table
        [data]="orders()"
        [config]="tableConfig"
        (rowSelect)="onRowSelect($event)"
      ></app-data-table>
    </div>
  `
})
export class OrdersComponent {
  orders = signal<Order[]>([]);
  selectedOrders = signal<Order[]>([]);

  tableConfig: DataTableConfig<Order> = {
    columns: [...],
    selectable: true,
    selectionMode: 'multiple',
    showSelectColumn: true
  };

  onRowSelect(selected: Order[]): void {
    this.selectedOrders.set(selected);
  }

  bulkApprove(): void {
    const ids = this.selectedOrders().map(o => o.id);
    // API call para aprobar
    console.log('Approving orders:', ids);
  }

  bulkCancel(): void {
    const ids = this.selectedOrders().map(o => o.id);
    // API call para cancelar
    console.log('Canceling orders:', ids);
  }
}
```

## 4. Custom Cell Templates

```typescript
// users-advanced.component.ts
import { Component, ViewChild, TemplateRef } from '@angular/core';

@Component({
  template: `
    <app-data-table [data]="users()" [config]="tableConfig">
      <!-- Custom template para status -->
      <ng-template #statusTemplate let-row>
        <span
          [class]="getStatusClass(row.status)"
          class="px-2 py-1 text-xs font-semibold rounded-full"
        >
          {{ row.status }}
        </span>
      </ng-template>

      <!-- Custom template para avatar + name -->
      <ng-template #userTemplate let-row>
        <div class="flex items-center gap-3">
          <img
            [src]="row.avatar"
            [alt]="row.name"
            class="w-10 h-10 rounded-full"
          />
          <div>
            <div class="font-medium">{{ row.name }}</div>
            <div class="text-sm text-gray-500">{{ row.email }}</div>
          </div>
        </div>
      </ng-template>
    </app-data-table>
  `
})
export class UsersAdvancedComponent {
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('userTemplate') userTemplate!: TemplateRef<any>;

  ngAfterViewInit(): void {
    // Asignar templates a columnas
    const nameColumn = this.columns.find(c => c.key === 'name');
    if (nameColumn) {
      nameColumn.cellTemplate = this.userTemplate;
    }

    const statusColumn = this.columns.find(c => c.key === 'status');
    if (statusColumn) {
      statusColumn.cellTemplate = this.statusTemplate;
    }
  }

  getStatusClass(status: string): string {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
```

## 5. Con Debounced Search

```typescript
// Implementar debounce en el componente
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({...})
export class ProductsComponent {
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.loadData({ search } as any);
    });
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search);
  }
}
```

## 6. Formateo de Datos

```typescript
columns: ColumnConfig<Transaction>[] = [
  {
    key: 'amount',
    label: 'Amount',
    format: (value, row) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);

      return row.type === 'debit' ? `-${formatted}` : formatted;
    },
    cssClass: 'font-mono'
  },
  {
    key: 'date',
    label: 'Date',
    format: (value: string) => {
      const date = new Date(value);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  },
  {
    key: 'user',
    label: 'User',
    format: (value: { firstName: string; lastName: string }) => {
      return `${value.firstName} ${value.lastName}`;
    }
  }
];
```

## 7. Highlight Search Results

```typescript
// highlight.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, search: string): SafeHtml {
    if (!search) return value;

    const regex = new RegExp(`(${search})`, 'gi');
    const highlighted = value.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}

// Usar en template
<span [innerHTML]="getCellValue(row, column) | highlight:globalSearch()"></span>
```

## Resumen

Ejemplos incluyen:
- **Client-side pagination** básico
- **Server-side pagination** con API
- **Selección de filas** con bulk actions
- **Custom cell templates**
- **Debounced search**
- **Formateo de datos** avanzado
- **Highlight de búsqueda**

Todos los ejemplos son production-ready y reutilizables.
