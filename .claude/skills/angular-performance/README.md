# Angular Performance Skill

Skill completo de optimización de rendimiento para aplicaciones Angular standalone.

## 📁 Estructura

```
angular-performance/
├── SKILL.md                           # Skill principal con toda la documentación
├── README.md                          # Este archivo
└── references/                        # Material de referencia adicional
    ├── performance-metrics.md         # Métricas y benchmarks
    ├── advanced-patterns.md           # Patrones avanzados de optimización
    └── code-snippets.md              # Snippets listos para copiar
```

## 🚀 Contenido del Skill

### 1. Técnicas de Optimización Incluidas

- ✅ **OnPush Change Detection** - Reducción de 50-70% en ciclos de detección
- ✅ **TrackBy Functions** - Utilities genéricas reutilizables
- ✅ **Virtual Scrolling** - CDK implementation para listas grandes
- ✅ **Lazy Loading** - Directiva custom para imágenes
- ✅ **Defer Blocks** - Lazy render de componentes (Angular 17+)
- ✅ **Code Splitting** - Estrategias por rutas y features
- ✅ **Debounce/Throttle** - Decorators y utilities
- ✅ **Pure Pipes** - Pipes optimizadas con memoization
- ✅ **Computed Signals** - Memoization automática
- ✅ **Web Workers** - Procesamiento en background
- ✅ **Performance Monitoring** - Service para métricas
- ✅ **Bundle Optimization** - Configuración y análisis

### 2. Material de Referencia

#### `performance-metrics.md`
- Core Web Vitals goals
- Angular-specific metrics
- Performance budgets
- Benchmark results
- Real-world case studies

#### `advanced-patterns.md`
- Container/Presentational pattern
- Incremental loading
- Optimistic updates
- Request deduplication
- Progressive hydration
- Zone pollution prevention
- Memory leak prevention
- Reactive caching
- Skeleton loading
- Background sync

#### `code-snippets.md`
- Templates listos para copiar
- Ejemplos completos funcionales
- Configuraciones de build
- NPM scripts útiles

## 📊 Performance Impact

| Técnica | Mejora | Dificultad | Prioridad |
|---------|--------|------------|-----------|
| OnPush + Signals | 50-70% | Media | ⭐⭐⭐⭐⭐ |
| TrackBy | 30-50% | Baja | ⭐⭐⭐⭐⭐ |
| Virtual Scrolling | 80-95% | Media | ⭐⭐⭐⭐ |
| Defer Blocks | 40-60% | Baja | ⭐⭐⭐⭐⭐ |
| Lazy Loading | 35-55% | Baja | ⭐⭐⭐⭐⭐ |

## 🎯 Cuándo Usar Este Skill

Invocar cuando se necesite:

- Implementar OnPush change detection
- Optimizar listas largas con virtual scrolling
- Lazy load de imágenes o componentes
- Reducir bundle size con code splitting
- Implementar debounce/throttle en inputs
- Crear pure pipes para transformaciones costosas
- Memoizar computed signals
- Usar defer blocks para lazy rendering
- Implementar Web Workers para operaciones pesadas
- Monitorear y mejorar performance
- Optimizar builds de producción

## 💡 Quick Start

### Ejemplo 1: Componente Optimizado Básico

```typescript
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-my-component',
  changeDetection: ChangeDetectionStrategy.OnPush, // 🚀
  template: `
    <div *ngFor="let item of items(); trackBy: trackById"> // 🚀
      {{ item.name }}
    </div>
  `
})
export class MyComponent {
  items = signal<Item[]>([]);

  trackById(index: number, item: Item): string {
    return item.id;
  }
}
```

### Ejemplo 2: Virtual Scrolling

```typescript
<cdk-virtual-scroll-viewport itemSize="72">
  <div *cdkVirtualFor="let item of items(); trackBy: trackById">
    {{ item.name }}
  </div>
</cdk-virtual-scroll-viewport>
```

### Ejemplo 3: Defer Block

```typescript
@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <div class="skeleton-loader"></div>
}
```

## 📚 Referencias

Basado en las mejores prácticas de:

- [Angular Performance Guide](https://angular.dev/best-practices/runtime-performance)
- [Angular Change Detection](https://angular.dev/guide/change-detection)
- [Angular CDK Virtual Scrolling](https://material.angular.io/cdk/scrolling)
- [Angular Defer Blocks](https://angular.dev/guide/defer)
- [Web.dev Performance](https://web.dev/performance/)

## 🔧 Testing Performance

```bash
# Build con análisis de bundle
npm run build:analyze

# Performance audit con Lighthouse
npx lighthouse https://your-app.com --only-categories=performance

# Angular DevTools profiling
# Chrome DevTools > Performance + Angular DevTools extension
```

## ⚡ Performance Checklist

- [ ] OnPush en todos los componentes
- [ ] TrackBy en todos los *ngFor
- [ ] Signals en lugar de observables
- [ ] Defer blocks para componentes pesados
- [ ] Virtual scrolling para listas >100 items
- [ ] Lazy loading de rutas
- [ ] Debounce en search inputs
- [ ] Pure pipes para transformaciones
- [ ] Bundle analyzer regularmente
- [ ] Monitor Core Web Vitals

## 📝 Notas

- Todos los ejemplos usan Angular 19+ standalone components
- Compatible con Tailwind CSS
- TypeScript strict mode
- Production-ready code
- Best practices actualizadas a 2026

## 🤝 Integración con Otros Skills

Este skill se complementa bien con:

- `angular-core-setup` - Configuración inicial del proyecto
- `angular-state-management` - State management con signals
- `angular-data-table` - Tabla optimizada con virtual scroll
- `angular-error-handling` - Manejo de errores eficiente

## 📖 Cómo Usar el Skill

Simplemente menciona en tus prompts:

- "Necesito optimizar el rendimiento de mi lista de usuarios"
- "Implementa virtual scrolling en la tabla"
- "Agrega lazy loading a las imágenes"
- "Optimiza el bundle size de mi app"
- "Implementa defer blocks para componentes pesados"

Claude Code cargará automáticamente este skill y te proporcionará el código optimizado.

---

**Resultado esperado:** Aplicaciones Angular 50-70% más rápidas con mejor UX y menor costo de infraestructura.
