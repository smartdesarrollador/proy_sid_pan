# Advanced Routing Patterns

Patrones avanzados de routing, guards dinámicos y casos de uso especiales.

## Guards Compuestos y Dinámicos

### Factory para crear guards dinámicos

```typescript
// src/app/core/guards/guard-factory.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Factory para crear guards de permisos dinámicamente.
 * Útil cuando necesitas múltiples guards similares con diferentes permisos.
 */
export function createPermissionGuard(requiredPermission: string): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.hasPermission(requiredPermission)) {
      console.warn(`Missing permission: ${requiredPermission}`);
      router.navigate(['/forbidden'], {
        queryParams: { reason: 'insufficient-permissions' }
      });
      return false;
    }

    return true;
  };
}

// Uso en routes
export const canEditUsers = createPermissionGuard('users.edit');
export const canDeleteUsers = createPermissionGuard('users.delete');
export const canViewReports = createPermissionGuard('reports.view');
```

### Guard con múltiples condiciones

```typescript
// src/app/core/guards/composite.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FeatureFlagService } from '../services/feature-flag.service';

/**
 * Guard compuesto que verifica múltiples condiciones:
 * - Autenticación
 * - Roles
 * - Feature flags
 * - Horario de acceso
 */
export const compositeGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const featureFlagService = inject(FeatureFlagService);
  const router = inject(Router);

  // 1. Verificar autenticación
  if (!authService.isAuthenticatedSync()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // 2. Verificar roles
  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    router.navigate(['/forbidden']);
    return false;
  }

  // 3. Verificar feature flag
  const featureFlag = route.data['featureFlag'] as string | undefined;
  if (featureFlag && !featureFlagService.isEnabled(featureFlag)) {
    router.navigate(['/not-found']); // Feature no disponible
    return false;
  }

  // 4. Verificar horario de acceso (ejemplo: solo horario de oficina)
  const requiresBusinessHours = route.data['businessHoursOnly'] as boolean | undefined;
  if (requiresBusinessHours && !isBusinessHours()) {
    router.navigate(['/unavailable'], {
      queryParams: { reason: 'outside-business-hours' }
    });
    return false;
  }

  return true;
};

function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  // Lunes a Viernes, 9am-5pm
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
```

## Guards Asíncronos

### Guard con verificación API asíncrona

```typescript
// src/app/core/guards/async-permission.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard asíncrono que verifica permisos contra el servidor.
 * Útil cuando los permisos no están en el token JWT.
 */
export const asyncPermissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const resource = route.data['resource'] as string;
  const action = route.data['action'] as string;

  return permissionService.checkPermission(resource, action).pipe(
    map(hasPermission => {
      if (!hasPermission) {
        router.navigate(['/forbidden']);
        return false;
      }
      return true;
    }),
    catchError(error => {
      console.error('Permission check failed:', error);
      router.navigate(['/error']);
      return of(false);
    })
  );
};

// Uso en routes
{
  path: 'documents/:id/edit',
  loadComponent: () => import('./document-edit.component'),
  canActivate: [asyncPermissionGuard],
  data: {
    resource: 'documents',
    action: 'edit'
  }
}
```

### Guard con timeout

```typescript
// src/app/core/guards/timeout-guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { timeout, catchError, of, map } from 'rxjs';
import { ApiService } from '../services/api.service';

/**
 * Guard que verifica disponibilidad del servicio con timeout.
 */
export const serviceAvailableGuard: CanActivateFn = (route, state) => {
  const apiService = inject(ApiService);
  const router = inject(Router);

  return apiService.healthCheck().pipe(
    timeout(3000), // 3 segundos máximo
    map(() => true),
    catchError(error => {
      console.error('Service unavailable:', error);
      router.navigate(['/maintenance']);
      return of(false);
    })
  );
};
```

## Resolvers Avanzados

### Resolver con cache

```typescript
// src/app/core/resolvers/cached-data.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataService } from '../services/data.service';

/**
 * Resolver con cache en memoria.
 * Evita cargar datos repetidamente en navegación frecuente.
 */
const cache = new Map<string, any>();

export const cachedDataResolver: ResolveFn<any> = (route, state) => {
  const dataService = inject(DataService);
  const cacheKey = route.params['id'];

  // Verificar cache
  if (cache.has(cacheKey)) {
    console.log('Returning cached data for:', cacheKey);
    return of(cache.get(cacheKey));
  }

  // Cargar y cachear
  return dataService.getData(cacheKey).pipe(
    tap(data => cache.set(cacheKey, data))
  );
};

// Limpiar cache cuando sea necesario
export function clearResolverCache(): void {
  cache.clear();
}
```

### Resolver paralelo (múltiples fuentes)

```typescript
// src/app/core/resolvers/parallel-data.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { ProjectService } from '../services/project.service';
import { TeamService } from '../services/team.service';

interface DashboardData {
  user: any;
  projects: any[];
  team: any;
}

/**
 * Resolver que carga múltiples fuentes en paralelo.
 * Más eficiente que múltiples resolvers secuenciales.
 */
export const dashboardDataResolver: ResolveFn<DashboardData> = (route, state) => {
  const userService = inject(UserService);
  const projectService = inject(ProjectService);
  const teamService = inject(TeamService);

  const userId = route.params['userId'];

  return forkJoin({
    user: userService.getUser(userId),
    projects: projectService.getUserProjects(userId),
    team: teamService.getUserTeam(userId)
  });
};

// Uso en componente
ngOnInit(): void {
  const data = this.route.snapshot.data['dashboardData'] as DashboardData;
  this.user = data.user;
  this.projects = data.projects;
  this.team = data.team;
}
```

### Resolver condicional

```typescript
// src/app/core/resolvers/conditional.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';

/**
 * Resolver que carga datos diferentes según el rol del usuario.
 */
export const conditionalDataResolver: ResolveFn<any> = (route, state) => {
  const authService = inject(AuthService);
  const dataService = inject(DataService);

  const isAdmin = authService.hasRole('admin');

  if (isAdmin) {
    // Cargar datos completos para admin
    return dataService.getDetailedData(route.params['id']);
  } else {
    // Cargar datos resumidos para usuarios normales
    return dataService.getSummaryData(route.params['id']);
  }
};
```

## Preloading Strategies Avanzadas

### Preloading basado en ancho de banda

```typescript
// src/app/core/strategies/bandwidth-aware-preload.strategy.ts
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Preloading inteligente basado en:
 * - Tipo de conexión (4g, 3g, wifi)
 * - Data saver mode
 * - Battery status
 */
@Injectable({ providedIn: 'root' })
export class BandwidthAwarePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const shouldPreload = route.data?.['preload'];

    if (!shouldPreload) {
      return of(null);
    }

    // Check connection
    const connection = (navigator as any).connection;
    const saveData = connection?.saveData;
    const effectiveType = connection?.effectiveType;

    // No preload si data saver está activo
    if (saveData) {
      console.log(`Data saver enabled, skipping preload: ${route.path}`);
      return of(null);
    }

    // No preload en conexiones lentas
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
      console.log(`Slow connection (${effectiveType}), skipping preload: ${route.path}`);
      return of(null);
    }

    // Check battery
    const battery = (navigator as any).getBattery?.();

    if (battery) {
      battery.then((batteryManager: any) => {
        // No preload si batería baja y no está cargando
        if (batteryManager.level < 0.2 && !batteryManager.charging) {
          console.log('Low battery, skipping preload:', route.path);
          return of(null);
        }
      });
    }

    console.log(`Preloading: ${route.path}`);
    return load();
  }
}
```

### Preloading on-demand (hover)

```typescript
// src/app/core/strategies/hover-preload.strategy.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Service para precargar rutas cuando el usuario hace hover
 * sobre un link por más de 200ms.
 */
@Injectable({ providedIn: 'root' })
export class HoverPreloadService {
  constructor(private router: Router) {}

  initHoverPreload(): void {
    fromEvent(document, 'mouseover')
      .pipe(debounceTime(200))
      .subscribe((event: Event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a[routerLink]');

        if (link) {
          const routerLink = link.getAttribute('routerLink');
          if (routerLink) {
            this.preloadRoute(routerLink);
          }
        }
      });
  }

  private preloadRoute(path: string): void {
    console.log('Preloading on hover:', path);
    // Trigger route loading via router config
    const config = this.router.config;
    const route = config.find(r => r.path === path.replace('/', ''));

    if (route?.loadChildren) {
      (route.loadChildren as any)().then(() => {
        console.log('Preloaded:', path);
      });
    }
  }
}

// Inicializar en app.component.ts
export class AppComponent implements OnInit {
  private hoverPreloadService = inject(HoverPreloadService);

  ngOnInit(): void {
    this.hoverPreloadService.initHoverPreload();
  }
}
```

## Guards con Side Effects

### Guard con logging y analytics

```typescript
// src/app/core/guards/analytics.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Guard que registra navegación para analytics.
 * Siempre retorna true, solo ejecuta side effects.
 */
export const analyticsGuard: CanActivateFn = (route, state) => {
  const analytics = inject(AnalyticsService);

  // Log page view
  analytics.trackPageView({
    path: state.url,
    title: route.data['title'] || state.url,
    timestamp: new Date()
  });

  // Log user properties si están en route data
  if (route.data['analytics']) {
    analytics.trackEvent('route_access', route.data['analytics']);
  }

  return true; // Siempre permite el acceso
};

// Uso combinado con otros guards
{
  path: 'products/:id',
  loadComponent: () => import('./product-detail.component'),
  canActivate: [authGuard, analyticsGuard], // Analytics después de auth
  data: {
    title: 'Product Details',
    analytics: {
      category: 'ecommerce',
      action: 'view_product'
    }
  }
}
```

### Guard con prefetch de datos

```typescript
// src/app/core/guards/prefetch.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CacheService } from '../services/cache.service';
import { ApiService } from '../services/api.service';

/**
 * Guard que prefetch datos en background sin bloquear navegación.
 */
export const prefetchGuard: CanActivateFn = (route, state) => {
  const cacheService = inject(CacheService);
  const apiService = inject(ApiService);

  // Prefetch data asíncronamente (no bloquea navegación)
  const prefetchConfig = route.data['prefetch'] as string[] | undefined;

  if (prefetchConfig) {
    prefetchConfig.forEach(endpoint => {
      apiService.get(endpoint).subscribe({
        next: data => cacheService.set(endpoint, data),
        error: err => console.warn(`Prefetch failed for ${endpoint}:`, err)
      });
    });
  }

  return true; // No bloquea navegación
};
```

## Casos de Uso Especiales

### A/B Testing con routing

```typescript
// src/app/core/guards/ab-test.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AbTestService } from '../services/ab-test.service';

/**
 * Guard que redirige usuarios a diferentes versiones según A/B test.
 */
export const abTestGuard: CanActivateFn = (route, state) => {
  const abTestService = inject(AbTestService);
  const router = inject(Router);

  const testName = route.data['abTest'] as string;
  const variant = abTestService.getVariant(testName);

  if (variant === 'B') {
    // Redirigir a variante B
    const alternateRoute = route.data['alternateRoute'] as string;
    router.navigate([alternateRoute], { skipLocationChange: true });
    return false;
  }

  return true; // Mostrar variante A (default)
};

// Configuración
{
  path: 'checkout',
  loadComponent: () => import('./checkout-a.component'),
  canActivate: [abTestGuard],
  data: {
    abTest: 'checkout-flow',
    alternateRoute: '/checkout-b'
  }
},
{
  path: 'checkout-b',
  loadComponent: () => import('./checkout-b.component')
}
```

### Maintenance mode guard

```typescript
// src/app/core/guards/maintenance.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ConfigService } from '../services/config.service';

/**
 * Guard que bloquea acceso durante mantenimiento,
 * excepto para admins.
 */
export const maintenanceGuard: CanActivateFn = (route, state) => {
  const config = inject(ConfigService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const isMaintenanceMode = config.get('maintenanceMode');
  const isAdmin = authService.hasRole('admin');

  if (isMaintenanceMode && !isAdmin) {
    router.navigate(['/maintenance']);
    return false;
  }

  return true;
};

// Aplicar globalmente en app.routes.ts
export const routes: Routes = [
  // Páginas públicas sin guard
  { path: 'maintenance', component: MaintenanceComponent },

  // Todas las demás rutas
  {
    path: '',
    canActivateChild: [maintenanceGuard], // Aplica a todas las child routes
    children: [
      // ... todas tus rutas
    ]
  }
];
```

## Route Reuse Strategy

```typescript
// src/app/core/strategies/custom-reuse.strategy.ts
import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Injectable } from '@angular/core';

/**
 * Estrategia personalizada para reutilizar componentes.
 * Útil para mantener estado en tabs o listas con scroll.
 */
@Injectable()
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private handlers: Map<string, DetachedRouteHandle> = new Map();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Detach si route.data['reuseRoute'] es true
    return route.data['reuseRoute'] === true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (handle) {
      const key = this.getRouteKey(route);
      this.handlers.set(key, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const key = this.getRouteKey(route);
    return this.handlers.has(key);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const key = this.getRouteKey(route);
    return this.handlers.get(key) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Default behavior
    return future.routeConfig === curr.routeConfig;
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    return route.pathFromRoot
      .map(r => r.routeConfig?.path)
      .filter(p => p)
      .join('/');
  }
}

// Configurar en app.config.ts
providers: [
  { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy }
]

// Uso en routes
{
  path: 'products',
  component: ProductListComponent,
  data: { reuseRoute: true } // Mantener estado al navegar away/back
}
```

## Summary

Estos patrones avanzados incluyen:

1. **Guards dinámicos** con factories
2. **Guards compuestos** con múltiples verificaciones
3. **Guards asíncronos** con API calls
4. **Resolvers con cache** para optimización
5. **Resolvers paralelos** con forkJoin
6. **Preloading inteligente** basado en condiciones de red
7. **Hover preloading** para UX mejorada
8. **Guards con analytics** y side effects
9. **A/B testing** con routing
10. **Route reuse strategy** para mantener estado

Todos los patrones son production-ready y siguen best practices de Angular 19+.
