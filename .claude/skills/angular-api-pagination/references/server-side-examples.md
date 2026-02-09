# Server-Side Pagination Examples

Ejemplos completos de paginación server-side con diferentes APIs y casos de uso.

## Tabla de Contenidos

1. [REST API con Express/NestJS](#rest-api-con-express-nestjs)
2. [Django REST Framework](#django-rest-framework)
3. [Laravel API](#laravel-api)
4. [Spring Boot](#spring-boot)
5. [GraphQL](#graphql)
6. [Con Sorting y Filtering](#con-sorting-y-filtering)
7. [Con Search](#con-search)

---

## REST API con Express/NestJS

### Backend (NestJS)

```typescript
// users.controller.ts
@Controller('users')
export class UsersController {
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @Query('search') search?: string
  ) {
    const skip = (page - 1) * pageSize;

    // Query con paginación
    const [data, total] = await this.usersRepository.findAndCount({
      skip,
      take: pageSize,
      where: search ? { name: Like(`%${search}%`) } : {},
      order: sortBy ? { [sortBy]: sortOrder } : {}
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }
}
```

### Frontend (Angular)

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginationService } from '@/core/services/pagination.service';
import { PaginatedResponse } from '@/core/models/pagination.models';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-users',
  template: `
    <div class="container mx-auto p-4">
      <!-- Search -->
      <div class="mb-4">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          [(ngModel)]="searchTerm"
          (input)="onSearchChange()"
          class="w-full px-4 py-2 border rounded"
        />
      </div>

      <!-- Tabla de usuarios -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                (click)="onSort('name')"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Nombre
                @if (sortBy === 'name') {
                  <span>{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
                }
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            @if (pagination.isLoading()) {
              @for (_ of [1,2,3,4,5]; track $index) {
                <tr class="animate-pulse">
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded"></div></td>
                  <td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded"></div></td>
                </tr>
              }
            } @else {
              @for (user of users(); track user.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">{{ user.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ user.email }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ user.role }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
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
        (onPageChange)="onPageChange($event)"
        (onNext)="onNext()"
        (onPrevious)="onPrevious()"
      />
    </div>
  `
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  pagination = inject(PaginationService<User>);

  users = signal<User[]>([]);
  searchTerm = '';
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.pagination.setLoading(true);

    let params = new HttpParams()
      .set('page', this.pagination.currentPage())
      .set('pageSize', this.pagination.pageSize())
      .set('sortBy', this.sortBy)
      .set('sortOrder', this.sortOrder);

    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }

    this.http.get<PaginatedResponse<User>>('/api/users', { params })
      .subscribe(response => {
        this.users.set(response.data);
        this.pagination.updateFromResponse(response);
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

  onSearchChange(): void {
    // Debounce search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.goToFirst(); // Reset a primera página
      this.loadUsers();
    }, 300);
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }

    this.loadUsers();
  }

  private searchTimeout: any;
}
```

---

## Django REST Framework

### Backend (Django)

```python
# views.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import User
from .serializers import UserSerializer

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'pageSize'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'total': self.page.paginator.count,
            'page': self.page.number,
            'pageSize': self.page.paginator.per_page,
            'totalPages': self.page.paginator.num_pages,
            'hasNext': self.page.has_next(),
            'hasPrevious': self.page.has_previous()
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = User.objects.all()

        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Sorting
        sort_by = self.request.query_params.get('sortBy', 'id')
        sort_order = self.request.query_params.get('sortOrder', 'asc')

        if sort_order == 'desc':
            sort_by = f'-{sort_by}'

        queryset = queryset.order_by(sort_by)

        return queryset
```

---

## Laravel API

### Backend (Laravel)

```php
// UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $pageSize = $request->input('pageSize', 10);
        $sortBy = $request->input('sortBy', 'id');
        $sortOrder = $request->input('sortOrder', 'asc');
        $search = $request->input('search', '');

        $query = User::query();

        // Search
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Total antes de paginar
        $total = $query->count();

        // Sorting y paginación
        $data = $query
            ->orderBy($sortBy, $sortOrder)
            ->skip(($page - 1) * $pageSize)
            ->take($pageSize)
            ->get();

        $totalPages = ceil($total / $pageSize);

        return response()->json([
            'data' => $data,
            'total' => $total,
            'page' => (int) $page,
            'pageSize' => (int) $pageSize,
            'totalPages' => $totalPages,
            'hasNext' => $page < $totalPages,
            'hasPrevious' => $page > 1
        ]);
    }
}
```

---

## Spring Boot

### Backend (Spring Boot)

```java
// UserController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public Map<String, Object> getUsers(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int pageSize,
        @RequestParam(defaultValue = "id") String sortBy,
        @RequestParam(defaultValue = "asc") String sortOrder,
        @RequestParam(required = false) String search
    ) {
        Sort sort = sortOrder.equals("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, pageSize, sort);

        Page<User> pageResult = search != null && !search.isEmpty()
            ? userRepository.findByNameContaining(search, pageable)
            : userRepository.findAll(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageResult.getContent());
        response.put("total", pageResult.getTotalElements());
        response.put("page", page);
        response.put("pageSize", pageSize);
        response.put("totalPages", pageResult.getTotalPages());
        response.put("hasNext", pageResult.hasNext());
        response.put("hasPrevious", pageResult.hasPrevious());

        return response;
    }
}
```

---

## GraphQL

### Backend (Apollo Server)

```typescript
// schema.graphql
type User {
  id: ID!
  name: String!
  email: String!
}

type UserConnection {
  data: [User!]!
  total: Int!
  page: Int!
  pageSize: Int!
  totalPages: Int!
  hasNext: Boolean!
  hasPrevious: Boolean!
}

type Query {
  users(
    page: Int = 1
    pageSize: Int = 10
    sortBy: String
    sortOrder: String
    search: String
  ): UserConnection!
}

// resolvers.ts
const resolvers = {
  Query: {
    users: async (_, { page, pageSize, sortBy, sortOrder, search }) => {
      const skip = (page - 1) * pageSize;

      const where = search ? { name: { contains: search } } : {};
      const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : {};

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: pageSize,
          where,
          orderBy
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / pageSize);

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
};
```

### Frontend (Angular + Apollo)

```typescript
import { Component, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

const USERS_QUERY = gql`
  query GetUsers($page: Int!, $pageSize: Int!) {
    users(page: $page, pageSize: $pageSize) {
      data {
        id
        name
        email
      }
      total
      page
      pageSize
      totalPages
      hasNext
      hasPrevious
    }
  }
`;

@Component({
  selector: 'app-graphql-users',
  template: `<!-- similar al anterior -->`
})
export class GraphqlUsersComponent {
  private apollo = inject(Apollo);
  pagination = inject(PaginationService);

  loadUsers(): void {
    this.apollo.query({
      query: USERS_QUERY,
      variables: this.pagination.getParams()
    }).subscribe(({ data }: any) => {
      this.users.set(data.users.data);
      this.pagination.updateFromResponse(data.users);
    });
  }
}
```

---

## Con Sorting y Filtering

```typescript
import { Component, signal } from '@angular/core';

interface Filter {
  field: string;
  value: any;
}

@Component({
  selector: 'app-advanced-table',
  template: `
    <div class="container mx-auto p-4">
      <!-- Filters -->
      <div class="mb-4 grid grid-cols-3 gap-4">
        <select
          [(ngModel)]="roleFilter"
          (change)="applyFilters()"
          class="px-3 py-2 border rounded"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="user">Usuario</option>
          <option value="guest">Invitado</option>
        </select>

        <select
          [(ngModel)]="statusFilter"
          (change)="applyFilters()"
          class="px-3 py-2 border rounded"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>

        <input
          type="text"
          placeholder="Buscar..."
          [(ngModel)]="searchTerm"
          (input)="onSearchChange()"
          class="px-3 py-2 border rounded"
        />
      </div>

      <!-- Table with sorting -->
      <table class="min-w-full">
        <thead>
          <tr>
            <th
              *ngFor="let col of columns"
              (click)="col.sortable && onSort(col.field)"
              [class.cursor-pointer]="col.sortable"
              class="px-6 py-3 text-left"
            >
              {{ col.label }}
              @if (sortBy === col.field) {
                <span>{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              }
            </th>
          </tr>
        </thead>
        <tbody>
          @for (item of items(); track item.id) {
            <tr>
              <td>{{ item.name }}</td>
              <td>{{ item.role }}</td>
              <td>{{ item.status }}</td>
            </tr>
          }
        </tbody>
      </table>

      <app-pagination [data]="paginationData()" (onPageChange)="onPageChange($event)" />
    </div>
  `
})
export class AdvancedTableComponent {
  items = signal<any[]>([]);
  columns = [
    { field: 'name', label: 'Nombre', sortable: true },
    { field: 'role', label: 'Rol', sortable: true },
    { field: 'status', label: 'Estado', sortable: false }
  ];

  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  loadItems(): void {
    const params = {
      ...this.pagination.getParams(),
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.searchTerm,
      filters: {
        role: this.roleFilter,
        status: this.statusFilter
      }
    };

    this.api.getPaginated('items', params).subscribe(/* ... */);
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }

    this.loadItems();
  }

  applyFilters(): void {
    this.pagination.goToFirst();
    this.loadItems();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.goToFirst();
      this.loadItems();
    }, 300);
  }

  private searchTimeout: any;
}
```

---

## Best Practices

1. **Debounce search** para reducir requests
2. **Reset a página 1** cuando cambian filtros/search
3. **Skeleton loaders** durante carga
4. **Error handling** robusto
5. **Cache** de resultados (opcional)
6. **URL sync** para compartir estado
7. **Optimistic UI** cuando sea posible
8. **Loading states** granulares
9. **Empty states** informativos
10. **Accessibility** en tablas y controles

---

Para más patrones, ver `advanced-patterns.md`.
