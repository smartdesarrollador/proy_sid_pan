# Angular API Pagination Skill

Sistema completo de paginación para Angular standalone applications con Tailwind CSS.

## Contenido

### SKILL.md Principal (2,500+ líneas)

Archivo principal con implementaciones completas:

1. **Interfaces y Modelos**
   - PaginationParams, PaginatedResponse<T>
   - PaginationState, PaginationConfig
   - PageChangeEvent, InfiniteScrollOptions

2. **Servicio de Paginación**
   - `PaginationService<T>` - Estado con signals
   - Métodos: goToPage, goToNext, goToPrevious, goToFirst, goToLast
   - Computed: currentPage, totalPages, hasNext, hasPrevious, itemRange

3. **Componente Pagination**
   - PaginationComponent standalone
   - First/Previous/Next/Last navigation
   - Page numbers con visibilidad inteligente
   - Jump to page input
   - Items range display
   - Responsive (mobile/desktop)

4. **Infinite Scroll Directive**
   - InfiniteScrollDirective con IntersectionObserver
   - Configurable threshold y debounce
   - Disable cuando está cargando

5. **Load More Component**
   - LoadMoreComponent standalone
   - Loading states
   - Items count display
   - End message cuando no hay más

6. **Page Size Selector**
   - PageSizeSelectorComponent
   - Opciones configurables (10, 25, 50, 100)
   - Disabled state

7. **Server-Side Pagination**
   - ApiWithPaginationService
   - Query params builder
   - Ejemplo completo con tabla de usuarios

8. **Client-Side Pagination**
   - PaginationUtil con helpers
   - Paginación en memoria
   - Ejemplo con productos

9. **URL Query Params Sync**
   - PaginationUrlSyncService
   - Sincronización automática con URL
   - Restore state desde URL

10. **Cache de Páginas**
    - PaginationCacheService
    - TTL configurable
    - Cache invalidation

11. **Performance Optimizations**
    - Virtual scroll con CDK
    - TrackBy functions
    - OnPush change detection

12. **Estilos CSS**
    - Pagination styles con Tailwind
    - Skeleton loaders
    - Empty states
    - Responsive utilities

### Referencias (3 archivos)

#### 1. server-side-examples.md (1,000+ líneas)
Ejemplos con diferentes backends:
- NestJS/Express
- Django REST Framework
- Laravel
- Spring Boot
- GraphQL
- Con Sorting y Filtering
- Con Search

#### 2. infinite-scroll-examples.md (800+ líneas)
Ejemplos de infinite scroll:
- Infinite Scroll Básico
- Con IntersectionObserver
- Feed de Redes Sociales
- Product Gallery
- Con Virtual Scroll
- Bi-Directional Scroll

#### 3. advanced-patterns.md (800+ líneas)
Patrones avanzados:
- Cursor-Based Pagination
- Optimistic UI Updates
- Prefetching Next Page
- Pagination con Realtime Updates
- Multi-Source Pagination
- Pagination State Management (NgRx)
- Testing Pagination

## Cuándo Usar Este Skill

Usar cuando se necesite:
- ✅ Paginación server-side con query params
- ✅ Client-side pagination en memoria
- ✅ Infinite scroll con IntersectionObserver
- ✅ Load more button pattern
- ✅ Componente pagination reutilizable
- ✅ Page size selector (10/25/50/100)
- ✅ Estado con signals
- ✅ Navegación first/previous/next/last
- ✅ Jump to page
- ✅ Total items display
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design (mobile)
- ✅ URL query params sync
- ✅ Scroll to top
- ✅ Cache de páginas
- ✅ Skeleton loaders
- ✅ Error handling
- ✅ Virtual scroll
- ✅ Integration con DataTable

## Features Clave

- 🎯 **Production-Ready**: Código listo para copiar y usar
- 🎯 **Server-Side & Client-Side**: Ambos tipos de paginación
- 🎯 **Infinite Scroll**: Con IntersectionObserver
- 🎯 **Angular 19+ Standalone**: Arquitectura moderna
- 🎯 **TypeScript Strict**: Type-safe con generics
- 🎯 **Tailwind CSS**: Estilos utilitarios
- 🎯 **Signals**: Estado reactivo moderno
- 🎯 **Best Practices**: Siguiendo Angular best practices
- 🎯 **Performance**: Optimizaciones incluidas
- 🎯 **Testing**: Ejemplos de unit y E2E tests

## Estadísticas

- **Total líneas**: 5,100+ líneas de código y documentación
- **Componentes**: 3 componentes standalone
- **Servicios**: 4 servicios especializados
- **Directivas**: 1 directiva InfiniteScroll
- **Utilidades**: PaginationUtil helper class
- **Ejemplos Backend**: 5 frameworks (NestJS, Django, Laravel, Spring, GraphQL)
- **Ejemplos Frontend**: 10+ casos de uso completos
- **Patrones Avanzados**: 7 patrones enterprise

## Inicio Rápido

1. **Leer SKILL.md** para implementaciones completas
2. **Consultar server-side-examples.md** para ejemplos con APIs
3. **Ver infinite-scroll-examples.md** para infinite scroll
4. **Revisar advanced-patterns.md** para patrones avanzados

## Componentes Principales

### 1. PaginationComponent

```typescript
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
```

### 2. InfiniteScrollDirective

```typescript
<div
  appInfiniteScroll
  [threshold]="0.8"
  [debounce]="300"
  [disabled]="!hasMore() || isLoading()"
  (scrolled)="loadMore()"
>
  <!-- contenido -->
</div>
```

### 3. LoadMoreComponent

```typescript
<app-load-more
  [hasMore]="hasMore()"
  [isLoading]="isLoading()"
  [currentItems]="items().length"
  [totalItems]="totalItems()"
  (onLoadMore)="loadMore()"
/>
```

### 4. PageSizeSelectorComponent

```typescript
<app-page-size-selector
  [pageSize]="pagination.pageSize()"
  [options]="[10, 25, 50, 100]"
  [disabled]="pagination.isLoading()"
  (pageSizeChange)="onPageSizeChange($event)"
/>
```

## Uso en Claude Code

El skill se activa automáticamente cuando menciones:
- "implementar paginación"
- "infinite scroll"
- "load more"
- "server-side pagination"
- "client-side pagination"
- "page size selector"
- Cualquier término relacionado con paginación

## Estructura de Archivos

```
angular-api-pagination/
├── SKILL.md                             # Archivo principal (2,500+ líneas)
├── README.md                            # Este archivo
└── references/
    ├── server-side-examples.md          # Ejemplos con backends
    ├── infinite-scroll-examples.md      # Ejemplos infinite scroll
    └── advanced-patterns.md             # Patrones avanzados
```

## Backends Soportados

El skill incluye ejemplos para:
- ✅ **NestJS/Express** (Node.js)
- ✅ **Django REST Framework** (Python)
- ✅ **Laravel** (PHP)
- ✅ **Spring Boot** (Java)
- ✅ **GraphQL** (Apollo Server)

## Casos de Uso

### Server-Side Pagination
- Tablas de datos con filtros
- Listas de usuarios
- Productos en e-commerce
- Posts de blog
- Comentarios

### Infinite Scroll
- Feed de redes sociales
- Timeline
- Product gallery
- Chat messages (bi-directional)
- News feed

### Client-Side Pagination
- Datos pequeños en memoria
- Resultados de búsqueda local
- Dropdown con muchas opciones
- Configuraciones

## Performance Tips

1. **Virtual Scroll** para 1000+ items
2. **OnPush** change detection
3. **TrackBy** en ngFor
4. **Debounce** en search
5. **Cache** de páginas visitadas
6. **Prefetch** next page
7. **Lazy loading** de componentes
8. **Server-side filtering** para grandes datasets

## Testing

El skill incluye ejemplos de:
- ✅ Unit tests con Jest/Jasmine
- ✅ Component tests con TestBed
- ✅ E2E tests con Playwright
- ✅ HTTP mocking con HttpTestingController
- ✅ Performance testing

## Best Practices

1. **Usar signals** para estado reactivo
2. **TrackBy functions** para performance
3. **Skeleton loaders** durante carga
4. **Empty states** cuando no hay datos
5. **Error handling** con retry
6. **URL sync** para compartir enlaces
7. **Scroll to top** al cambiar página
8. **Responsive design** mobile-first
9. **Accessibility** con ARIA
10. **Cache** estratégicamente

## Recursos Incluidos

- Componentes standalone
- Servicios tipados
- Directivas reutilizables
- Interfaces TypeScript
- Estilos Tailwind
- Ejemplos completos
- Unit tests
- E2E tests
- Best practices
- Performance tips

---

**Creado**: 2026-02-08
**Angular Version**: 19+
**TypeScript**: Strict mode
**Styling**: Tailwind CSS

El skill está **listo para usar** en proyectos Angular 19+ y proporciona soluciones completas de paginación para cualquier caso de uso! 🎉
