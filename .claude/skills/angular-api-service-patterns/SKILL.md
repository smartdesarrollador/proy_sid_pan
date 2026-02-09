---
name: angular-api-service-patterns
description: >
  Patrones reutilizables para servicios API REST en Angular standalone. Usar cuando se necesite
  implementar BaseApiService genérico con CRUD, servicios específicos tipados, manejo de observables
  con RxJS, query strings tipados, error handling, cache strategies, response wrappers genéricos
  (ApiResponse<T>, PaginatedResponse<T>), o utility functions para URLs. Código plug-and-play con
  TypeScript generics, interfaces tipadas, y best practices de RxJS para proyectos Angular.
---

# Angular API Service Patterns

Patrones genéricos y reutilizables para servicios de API REST con TypeScript y RxJS.

## Quick Start

### 1. Interfaces Base

```typescript
// src/app/core/models/api.model.ts

/**
 * Wrapper genérico para respuestas de API
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parámetros de query genéricos
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

/**
 * Opciones de request
 */
export interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number;
  useLoading?: boolean;
  showError?: boolean;
}
```

## 2. Base API Service Genérico

```typescript
// src/app/core/services/base-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay, take } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResponse, QueryParams } from '@core/models/api.model';

/**
 * Servicio base genérico para operaciones CRUD en APIs REST
 * @template T - Tipo del modelo de datos
 */
@Injectable()
export abstract class BaseApiService<T> {
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiUrl;

  /**
   * Endpoint específico del recurso (ej: 'users', 'products')
   * Debe ser definido por las clases que extienden BaseApiService
   */
  protected abstract endpoint: string;

  /**
   * Cache en memoria para requests
   */
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly DEFAULT_CACHE_TTL = 300000; // 5 minutos

  /**
   * Construye la URL completa del recurso
   */
  protected getUrl(path?: string): string {
    const url = `${this.baseUrl}/${this.endpoint}`;
    return path ? `${url}/${path}` : url;
  }

  /**
   * Convierte objeto a HttpParams
   */
  protected buildParams(params?: QueryParams | Record<string, any>): HttpParams {
    if (!params) return new HttpParams();

    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Para objetos anidados (como filters)
          Object.keys(value).forEach(nestedKey => {
            if (value[nestedKey] !== null && value[nestedKey] !== undefined) {
              httpParams = httpParams.append(`${key}[${nestedKey}]`, String(value[nestedKey]));
            }
          });
        } else {
          httpParams = httpParams.append(key, String(value));
        }
      }
    });

    return httpParams;
  }

  /**
   * Verifica si el cache es válido
   */
  private isCacheValid(key: string, ttl: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < ttl;
  }

  /**
   * Obtiene datos del cache
   */
  private getFromCache<R>(key: string, ttl: number): R | null {
    if (this.isCacheValid(key, ttl)) {
      return this.cache.get(key)!.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Guarda en cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Limpia el cache
   */
  protected clearCache(): void {
    this.cache.clear();
  }

  /**
   * GET - Obtener lista de recursos
   */
  getAll(params?: QueryParams): Observable<T[]> {
    const cacheKey = `${this.endpoint}_all_${JSON.stringify(params || {})}`;
    const cached = this.getFromCache<T[]>(cacheKey, this.DEFAULT_CACHE_TTL);

    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<T[]>>(this.getUrl(), { params: httpParams }).pipe(
      map(response => response.data),
      tap(data => this.setCache(cacheKey, data)),
      shareReplay(1),
      catchError(this.handleError)
    );
  }

  /**
   * GET - Obtener lista paginada
   */
  getPaginated(params?: QueryParams): Observable<PaginatedResponse<T>> {
    const httpParams = this.buildParams(params);

    return this.http.get<PaginatedResponse<T>>(this.getUrl(), { params: httpParams }).pipe(
      shareReplay(1),
      catchError(this.handleError)
    );
  }

  /**
   * GET - Obtener un recurso por ID
   */
  getById(id: string | number): Observable<T> {
    const cacheKey = `${this.endpoint}_${id}`;
    const cached = this.getFromCache<T>(cacheKey, this.DEFAULT_CACHE_TTL);

    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    return this.http.get<ApiResponse<T>>(this.getUrl(String(id))).pipe(
      map(response => response.data),
      tap(data => this.setCache(cacheKey, data)),
      catchError(this.handleError)
    );
  }

  /**
   * POST - Crear nuevo recurso
   */
  create(data: Partial<T>): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.getUrl(), data).pipe(
      map(response => response.data),
      tap(() => this.clearCache()), // Invalidar cache al crear
      catchError(this.handleError)
    );
  }

  /**
   * PUT - Actualizar recurso completo
   */
  update(id: string | number, data: Partial<T>): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.getUrl(String(id)), data).pipe(
      map(response => response.data),
      tap(() => {
        this.clearCache(); // Invalidar cache al actualizar
      }),
      catchError(this.handleError)
    );
  }

  /**
   * PATCH - Actualización parcial
   */
  patch(id: string | number, data: Partial<T>): Observable<T> {
    return this.http.patch<ApiResponse<T>>(this.getUrl(String(id)), data).pipe(
      map(response => response.data),
      tap(() => this.clearCache()),
      catchError(this.handleError)
    );
  }

  /**
   * DELETE - Eliminar recurso
   */
  delete(id: string | number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(this.getUrl(String(id))).pipe(
      map(() => undefined),
      tap(() => this.clearCache()),
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores centralizado
   */
  protected handleError(error: any): Observable<never> {
    console.error(`API Error [${error.status}]:`, error);
    return throwError(() => ({
      code: error.status || 'UNKNOWN',
      message: error.error?.message || error.message || 'Error desconocido',
      details: error.error
    }));
  }
}
```

## 3. Servicios Específicos

### User Service

```typescript
// src/app/core/models/user.model.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive';
  search?: string;
}
```

```typescript
// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '@core/models/user.model';
import { QueryParams } from '@core/models/api.model';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService<User> {
  protected override endpoint = 'users';

  /**
   * Método específico: Obtener usuarios por rol
   */
  getUsersByRole(role: string): Observable<User[]> {
    return this.getAll({ filters: { role } });
  }

  /**
   * Método específico: Buscar usuarios
   */
  searchUsers(query: string, params?: QueryParams): Observable<User[]> {
    return this.getAll({ ...params, search: query });
  }

  /**
   * Método específico: Cambiar estado de usuario
   */
  toggleStatus(id: number): Observable<User> {
    return this.http.post<{ success: boolean; data: User }>(
      this.getUrl(`${id}/toggle-status`),
      {}
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Método específico: Obtener perfil del usuario actual
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<{ success: boolean; data: User }>(
      this.getUrl('me')
    ).pipe(
      map(response => response.data)
    );
  }
}
```

### Product Service

```typescript
// src/app/core/models/product.model.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  featured: boolean;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
}
```

```typescript
// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { Product, ProductFilters } from '@core/models/product.model';
import { PaginatedResponse } from '@core/models/api.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseApiService<Product> {
  protected override endpoint = 'products';

  /**
   * Obtener productos destacados
   */
  getFeatured(limit = 10): Observable<Product[]> {
    return this.getAll({
      filters: { featured: true },
      pageSize: limit
    });
  }

  /**
   * Buscar productos con filtros
   */
  searchProducts(filters: ProductFilters, page = 1, pageSize = 20): Observable<PaginatedResponse<Product>> {
    return this.getPaginated({
      page,
      pageSize,
      filters
    });
  }

  /**
   * Obtener productos por categoría
   */
  getByCategory(category: string): Observable<Product[]> {
    return this.getAll({ filters: { category } });
  }
}
```

## 4. Uso en Componentes

```typescript
// src/app/features/users/users.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/user.model';
import { QueryParams } from '@core/models/api.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="users-container">
      <!-- Filtros -->
      <div class="filters">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          (input)="onSearch($event)"
        />
        <select (change)="onRoleFilter($event)">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      <!-- Lista de usuarios -->
      @if (loading()) {
        <p>Cargando usuarios...</p>
      }

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (users().length > 0) {
        <ul class="users-list">
          @for (user of users(); track user.id) {
            <li class="user-card">
              <h3>{{ user.name }}</h3>
              <p>{{ user.email }}</p>
              <span class="badge">{{ user.role }}</span>
              <div class="actions">
                <button (click)="editUser(user)">Editar</button>
                <button (click)="deleteUser(user.id)">Eliminar</button>
              </div>
            </li>
          }
        </ul>
      }

      <!-- Paginación -->
      <div class="pagination">
        <button
          (click)="previousPage()"
          [disabled]="currentPage() === 1"
        >
          Anterior
        </button>
        <span>Página {{ currentPage() }}</span>
        <button (click)="nextPage()">Siguiente</button>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);

  private params: QueryParams = {
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getAll(this.params).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.params = { ...this.params, search: query, page: 1 };
    this.currentPage.set(1);
    this.loadUsers();
  }

  onRoleFilter(event: Event): void {
    const role = (event.target as HTMLSelectElement).value;
    this.params = {
      ...this.params,
      filters: role ? { role } : undefined,
      page: 1
    };
    this.currentPage.set(1);
    this.loadUsers();
  }

  editUser(user: User): void {
    // Implementar edición
    console.log('Edit user:', user);
  }

  deleteUser(id: number): void {
    if (!confirm('¿Eliminar usuario?')) return;

    this.userService.delete(id).subscribe({
      next: () => {
        this.users.update(users => users.filter(u => u.id !== id));
      },
      error: (err) => {
        this.error.set(err.message);
      }
    });
  }

  nextPage(): void {
    this.currentPage.update(page => page + 1);
    this.params = { ...this.params, page: this.currentPage() };
    this.loadUsers();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      this.params = { ...this.params, page: this.currentPage() };
      this.loadUsers();
    }
  }
}
```

## 5. RxJS Best Practices

```typescript
// Ejemplo: Servicio con operadores RxJS optimizados
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, shareReplay, distinctUntilChanged, debounceTime, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OptimizedUserService {
  private http = inject(HttpClient);
  private usersSubject = new BehaviorSubject<User[]>([]);

  // Observable público
  users$ = this.usersSubject.asObservable();

  /**
   * Cargar usuarios con shareReplay para compartir resultado
   */
  loadUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users').pipe(
      tap(users => this.usersSubject.next(users)),
      shareReplay({ bufferSize: 1, refCount: true }), // Cache compartido
      catchError(error => {
        console.error(error);
        return of([]);
      })
    );
  }

  /**
   * Búsqueda con debounce y switchMap
   */
  searchUsers(searchTerm$: Observable<string>): Observable<User[]> {
    return searchTerm$.pipe(
      debounceTime(300),              // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged(),         // Solo emitir si el valor cambió
      switchMap(term =>               // Cancelar búsquedas anteriores
        this.http.get<User[]>('/api/users', {
          params: { search: term }
        })
      ),
      catchError(() => of([]))
    );
  }
}
```

## Referencias Completas

- **Cache Strategies**: Ver `references/cache-strategies.md`
- **Utility Functions**: Ver `references/utility-functions.md`
- **Advanced Patterns**: Ver `references/advanced-patterns.md`
- **Testing**: Ver `references/testing-services.md`

## Checklist

- [ ] Crear BaseApiService genérico
- [ ] Definir interfaces (ApiResponse, PaginatedResponse, QueryParams)
- [ ] Implementar servicios específicos (UserService, ProductService)
- [ ] Agregar cache con Map
- [ ] Implementar buildParams para query strings
- [ ] Usar RxJS operators (map, catchError, shareReplay)
- [ ] Crear modelos e interfaces tipadas
- [ ] Testear CRUD operations
- [ ] Implementar error handling
- [ ] Agregar utility functions

## Best Practices

1. **Generics**: Usar `<T>` para servicios reutilizables
2. **Cache**: Implementar cache con TTL
3. **RxJS**: shareReplay, take, debounceTime, switchMap
4. **Tipado**: Interfaces estrictas para requests/responses
5. **Error handling**: Centralizado en BaseApiService
6. **Inmutabilidad**: No mutar datos, retornar nuevos objetos
7. **Cleanup**: Unsubscribe en OnDestroy o usar async pipe
