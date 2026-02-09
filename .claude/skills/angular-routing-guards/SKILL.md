---
name: angular-routing-guards
description: >
  Guards y routing avanzado para Angular standalone applications. Usar cuando se necesite
  implementar AuthGuard funcional, RoleGuard con permisos, canActivate/canDeactivate guards,
  route resolvers genéricos (BaseResolver<T>), lazy loading de componentes standalone,
  preloading strategies personalizadas, guards para cambios no guardados, redirect logic con
  returnUrl, validación de parámetros de ruta, o configuración de rutas con metadata (roles,
  permissions). Incluye functional guards con inject(), integration con AuthService, guards
  tipados, custom preloading strategies, y ejemplos completos con best practices de Angular 19+.
---

# Angular Routing Guards - Functional Guards & Advanced Routing

Patrones modernos de routing, guards funcionales y resolvers para Angular standalone.

## 1. Functional Guards Básicos

### AuthGuard - Protección de rutas autenticadas

```typescript
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger rutas autenticadas.
 * Redirige a /login si el usuario no está autenticado.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Guardar URL de retorno para redirigir después del login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
```

### RoleGuard - Autorización basada en roles

```typescript
// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para verificar roles/permisos.
 * Lee roles requeridos desde route.data['roles'].
 *
 * @example
 * { path: 'admin', canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // Sin roles requeridos
  }

  const userRoles = authService.getUserRoles();
  const hasRole = requiredRoles.some(role => userRoles.includes(role));

  if (!hasRole) {
    console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};

/**
 * Guard para verificar permisos específicos (más granular que roles).
 */
export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as string[] | undefined;

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const userPermissions = authService.getUserPermissions();
  const hasAllPermissions = requiredPermissions.every(perm =>
    userPermissions.includes(perm)
  );

  if (!hasAllPermissions) {
    console.warn(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};
```

## 2. CanDeactivate Guard - Cambios No Guardados

### Interface para componentes

```typescript
// src/app/core/guards/can-deactivate.interface.ts
import { Observable } from 'rxjs';

/**
 * Interface que deben implementar los componentes que usan canDeactivateGuard.
 */
export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}
```

### Guard funcional

```typescript
// src/app/core/guards/can-deactivate.guard.ts
import { CanDeactivateFn } from '@angular/router';
import { CanComponentDeactivate } from './can-deactivate.interface';
import { inject } from '@angular/core';

/**
 * Guard para prevenir pérdida de cambios no guardados.
 * El componente debe implementar CanComponentDeactivate.
 */
export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
```

### Ejemplo de uso en componente

```typescript
// src/app/features/users/user-form.component.ts
import { Component, signal } from '@angular/core';
import { CanComponentDeactivate } from '@/core/guards/can-deactivate.interface';

@Component({
  selector: 'app-user-form',
  standalone: true,
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="formData.name" (input)="hasChanges.set(true)">
      <button type="submit">Save</button>
    </form>
  `
})
export class UserFormComponent implements CanComponentDeactivate {
  hasChanges = signal(false);
  formData = { name: '' };

  canDeactivate(): boolean {
    if (this.hasChanges()) {
      return confirm('You have unsaved changes. Do you really want to leave?');
    }
    return true;
  }

  onSubmit(): void {
    // Save logic...
    this.hasChanges.set(false);
  }
}
```

## 3. Route Resolvers - Pre-carga de Datos

### BaseResolver Genérico

```typescript
// src/app/core/resolvers/base.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';

/**
 * Factory para crear resolvers genéricos reutilizables.
 *
 * @example
 * export const userResolver = createResolver<User>(
 *   (route) => inject(UserService).getUser(route.params['id'])
 * );
 */
export function createResolver<T>(
  resolveFn: (route: ActivatedRouteSnapshot) => Observable<T>
): ResolveFn<T | null> {
  return (route, state) => {
    const router = inject(Router);

    return resolveFn(route).pipe(
      catchError(error => {
        console.error('Resolver error:', error);
        router.navigate(['/error']);
        return of(null);
      })
    );
  };
}
```

### Resolvers específicos

```typescript
// src/app/core/resolvers/user.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { User } from '@/shared/models/user.model';

/**
 * Resolver para cargar un usuario por ID antes de activar la ruta.
 */
export const userResolver: ResolveFn<User | null> = (route, state) => {
  const userService = inject(UserService);
  const userId = route.params['id'];

  if (!userId) {
    return null;
  }

  return userService.getUser(userId);
};

/**
 * Resolver para cargar lista de usuarios.
 */
export const usersResolver: ResolveFn<User[]> = (route, state) => {
  const userService = inject(UserService);
  return userService.getUsers();
};
```

### Uso en componente

```typescript
// src/app/features/users/user-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '@/shared/models/user.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `
    <div *ngIf="user">
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    </div>
  `
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  user: User | null = null;

  ngOnInit(): void {
    // Los datos ya están cargados gracias al resolver
    this.user = this.route.snapshot.data['user'];
  }
}
```

## 4. Guards Avanzados

### Validación de parámetros de ruta

```typescript
// src/app/core/guards/validate-params.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

/**
 * Guard para validar parámetros de ruta antes de activar.
 *
 * @example
 * data: { paramValidation: { id: /^\d+$/ } } // Solo números
 */
export const validateParamsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const validation = route.data['paramValidation'] as Record<string, RegExp> | undefined;

  if (!validation) {
    return true;
  }

  for (const [param, regex] of Object.entries(validation)) {
    const value = route.params[param];

    if (!value || !regex.test(value)) {
      console.warn(`Invalid parameter: ${param} = ${value}`);
      router.navigate(['/not-found']);
      return false;
    }
  }

  return true;
};
```

### Guard para verificar datos antes de salir

```typescript
// src/app/core/guards/data-saved.guard.ts
import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable, of } from 'rxjs';

export interface HasUnsavedData {
  hasUnsavedData(): boolean;
  saveData(): Observable<boolean>;
}

/**
 * Guard que verifica si hay datos sin guardar y ofrece guardarlos.
 */
export const dataSavedGuard: CanDeactivateFn<HasUnsavedData> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  if (!component.hasUnsavedData || !component.hasUnsavedData()) {
    return true;
  }

  const shouldSave = confirm('You have unsaved data. Do you want to save before leaving?');

  if (shouldSave) {
    return component.saveData();
  }

  return confirm('Are you sure you want to discard your changes?');
};
```

## 5. Lazy Loading Standalone

### Lazy loading de componentes standalone

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Lazy load standalone component
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component')
      .then(m => m.HomeComponent)
  },

  // Lazy load feature module routes (standalone)
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes')
      .then(m => m.USERS_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'] }
  },

  // Lazy load con guard y resolver
  {
    path: 'profile/:id',
    loadComponent: () => import('./features/profile/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [authGuard],
    resolve: {
      user: userResolver
    }
  }
];
```

### Feature routes (users.routes.ts)

```typescript
// src/app/features/users/users.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from '@/core/guards/role.guard';
import { canDeactivateGuard } from '@/core/guards/can-deactivate.guard';
import { usersResolver, userResolver } from '@/core/resolvers/user.resolver';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list.component')
      .then(m => m.UsersListComponent),
    resolve: {
      users: usersResolver
    }
  },
  {
    path: 'create',
    loadComponent: () => import('./user-form.component')
      .then(m => m.UserFormComponent),
    canActivate: [roleGuard],
    canDeactivate: [canDeactivateGuard],
    data: { roles: ['admin'] }
  },
  {
    path: ':id',
    loadComponent: () => import('./user-detail.component')
      .then(m => m.UserDetailComponent),
    resolve: {
      user: userResolver
    }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./user-form.component')
      .then(m => m.UserFormComponent),
    canActivate: [roleGuard],
    canDeactivate: [canDeactivateGuard],
    resolve: {
      user: userResolver
    },
    data: { roles: ['admin', 'manager'] }
  }
];
```

## 6. Custom Preloading Strategy

### Preloading basado en prioridad

```typescript
// src/app/core/strategies/custom-preload.strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Estrategia de preloading personalizada basada en prioridad.
 *
 * Prioridades:
 * - high: Preload inmediatamente
 * - medium: Preload después de 2s
 * - low: Preload después de 5s
 * - false/undefined: No preload
 *
 * @example
 * data: { preload: 'high' }
 */
@Injectable({ providedIn: 'root' })
export class CustomPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const preloadConfig = route.data?.['preload'];

    if (!preloadConfig) {
      return of(null);
    }

    const delay = this.getDelay(preloadConfig);

    console.log(`Preloading route: ${route.path} with delay: ${delay}ms`);

    return timer(delay).pipe(
      mergeMap(() => load())
    );
  }

  private getDelay(priority: string | boolean): number {
    if (priority === true || priority === 'high') {
      return 0; // Inmediato
    }
    if (priority === 'medium') {
      return 2000; // 2 segundos
    }
    if (priority === 'low') {
      return 5000; // 5 segundos
    }
    return 0;
  }
}
```

### Preloading condicional

```typescript
// src/app/core/strategies/network-aware-preload.strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Estrategia que solo precarga en conexiones rápidas (4g, wifi).
 */
@Injectable({ providedIn: 'root' })
export class NetworkAwarePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const shouldPreload = route.data?.['preload'];

    if (!shouldPreload) {
      return of(null);
    }

    // Check network connection (si está disponible)
    const connection = (navigator as any).connection;

    if (connection) {
      const effectiveType = connection.effectiveType;

      // Solo precargar en 4g o mejor
      if (effectiveType === '4g' || effectiveType === 'wifi') {
        console.log(`Preloading ${route.path} on ${effectiveType}`);
        return load();
      }

      console.log(`Skipping preload for ${route.path} on ${effectiveType}`);
      return of(null);
    }

    // Si no hay API de network, precargar normalmente
    return load();
  }
}
```

## 7. Configuración Completa de Routing

### app.config.ts con preloading

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { CustomPreloadStrategy } from './core/strategies/custom-preload.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(CustomPreloadStrategy)
    )
  ]
};
```

### app.routes.ts completo con metadata

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/role.guard';
import { validateParamsGuard } from './core/guards/validate-params.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component')
      .then(m => m.HomeComponent),
    data: {
      title: 'Home',
      preload: 'high' // Preload inmediato
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component')
      .then(m => m.LoginComponent),
    data: {
      title: 'Login',
      preload: 'high'
    }
  },

  // Protected routes
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: {
      title: 'Dashboard',
      preload: 'medium',
      breadcrumb: 'Dashboard'
    }
  },

  // Admin routes con roles
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['admin'],
      title: 'Admin',
      preload: 'low',
      breadcrumb: 'Administration'
    }
  },

  // Users con permisos específicos
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes')
      .then(m => m.USERS_ROUTES),
    canActivate: [authGuard, permissionGuard],
    data: {
      permissions: ['users.read'],
      title: 'Users',
      preload: 'medium'
    }
  },

  // Ruta con validación de parámetros
  {
    path: 'posts/:id',
    loadComponent: () => import('./features/posts/post-detail.component')
      .then(m => m.PostDetailComponent),
    canActivate: [validateParamsGuard],
    data: {
      paramValidation: {
        id: /^\d+$/ // Solo números
      },
      preload: false
    }
  },

  // Fallback routes
  {
    path: 'forbidden',
    loadComponent: () => import('./shared/components/forbidden.component')
      .then(m => m.ForbiddenComponent),
    data: { title: 'Access Denied' }
  },
  {
    path: 'not-found',
    loadComponent: () => import('./shared/components/not-found.component')
      .then(m => m.NotFoundComponent),
    data: { title: 'Not Found' }
  },
  {
    path: '**',
    redirectTo: '/not-found'
  }
];
```

## 8. Integration con AuthService

Ver `references/auth-integration.md` para la implementación completa del AuthService y state management.

## 9. Ejemplos de Uso Completos

### Ruta protegida con múltiples guards

```typescript
{
  path: 'sensitive-data',
  loadComponent: () => import('./features/sensitive/sensitive.component')
    .then(m => m.SensitiveComponent),
  canActivate: [authGuard, roleGuard, permissionGuard],
  canDeactivate: [canDeactivateGuard],
  data: {
    roles: ['admin', 'auditor'],
    permissions: ['sensitive.read'],
    preload: false,
    title: 'Sensitive Data'
  }
}
```

### Formulario con protección de cambios

```typescript
{
  path: 'invoice/create',
  loadComponent: () => import('./features/invoices/invoice-form.component')
    .then(m => m.InvoiceFormComponent),
  canActivate: [authGuard, permissionGuard],
  canDeactivate: [canDeactivateGuard, dataSavedGuard],
  data: {
    permissions: ['invoices.create'],
    title: 'Create Invoice'
  }
}
```

### Ruta con resolver y guards

```typescript
{
  path: 'projects/:id/edit',
  loadComponent: () => import('./features/projects/project-form.component')
    .then(m => m.ProjectFormComponent),
  canActivate: [authGuard, roleGuard],
  canDeactivate: [canDeactivateGuard],
  resolve: {
    project: projectResolver,
    categories: categoriesResolver
  },
  data: {
    roles: ['manager', 'admin'],
    title: 'Edit Project'
  }
}
```

## 10. Best Practices

### Orden de guards
Guards se ejecutan en el orden declarado en el array:
```typescript
canActivate: [authGuard, roleGuard, permissionGuard]
// 1. Verifica autenticación
// 2. Verifica roles
// 3. Verifica permisos específicos
```

### returnUrl en redirects
```typescript
if (!isAuthenticated) {
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
}
```

### Manejo en LoginComponent
```typescript
ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    this.returnUrl = params['returnUrl'] || '/dashboard';
  });
}

onLogin(): void {
  this.authService.login(credentials).subscribe(() => {
    this.router.navigateByUrl(this.returnUrl);
  });
}
```

### Metadata tipada
```typescript
// Define interfaces para route data
interface RouteData {
  roles?: string[];
  permissions?: string[];
  title?: string;
  preload?: 'high' | 'medium' | 'low' | boolean;
  breadcrumb?: string;
}

// Usa type assertion
const roles = route.data['roles'] as string[] | undefined;
```

### Testing guards
```typescript
// Ver references/testing.md para ejemplos de testing
```

## Resumen de Implementación

1. **Crear guards funcionales** con `inject()` para servicios
2. **Usar metadata en routes** (`data: { roles, permissions, preload }`)
3. **Implementar resolvers** para pre-carga de datos
4. **Configurar lazy loading** con `loadComponent` / `loadChildren`
5. **Agregar preloading strategy** personalizada
6. **Proteger formularios** con `canDeactivate`
7. **Validar parámetros** antes de activar rutas
8. **Manejar redirects** con `returnUrl` en queryParams
9. **Ordenar guards** correctamente (auth → role → permission)
10. **Tipar metadata** para type safety

Todos los guards son funcionales (CanActivateFn), standalone-compatible, y usan `inject()` para dependency injection.
