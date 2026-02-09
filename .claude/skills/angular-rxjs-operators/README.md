# Angular RxJS Operators Skill

Guía completa de RxJS operators para Angular standalone applications con ejemplos prácticos del mundo real.

## 📁 Estructura

```
angular-rxjs-operators/
├── SKILL.md                    # Skill principal con todos los operators
├── README.md                   # Este archivo
└── references/
    └── advanced-patterns.md    # Patrones avanzados y custom operators
```

## 🚀 Contenido del Skill

### 1. Operators de Transformación

- ✅ **map** - Transform each value
- ✅ **switchMap** - Cancel previous, start new (search, navigation)
- ✅ **mergeMap** - Process all concurrently (bulk operations)
- ✅ **concatMap** - Process sequentially (ordered workflows)
- ✅ **exhaustMap** - Ignore new until complete (button debouncing)

**Comparison Table Incluida:**
| Operator | Concurrency | Order | Cancellation | Best For |
|----------|-------------|-------|--------------|----------|
| switchMap | Latest only | No | Yes | Search, navigation |
| mergeMap | All parallel | No | No | Bulk operations |
| concatMap | Sequential | Yes | No | Ordered workflows |
| exhaustMap | First only | No | No | Button clicks |

### 2. Operators de Filtrado

- ✅ **filter** - Conditional filtering
- ✅ **debounceTime** - Wait for pause (search inputs)
- ✅ **throttleTime** - Limit rate (scroll, resize events)
- ✅ **distinctUntilChanged** - Ignore duplicates
- ✅ **take, takeUntil** - Limit emissions

### 3. Operators de Combinación

- ✅ **combineLatest** - Wait for all, emit on any change
- ✅ **forkJoin** - Wait for all to complete (parallel requests)
- ✅ **merge** - Combine multiple streams
- ✅ **zip** - Pair values by index
- ✅ **withLatestFrom** - Include latest from another stream

### 4. Operators de Error Handling

- ✅ **catchError** - Handle errors and continue
- ✅ **retry** - Retry on failure
- ✅ **retryWhen** - Retry with custom logic
- ✅ **Custom retryBackoff** - Exponential backoff implementation

### 5. Operators de Utilidad

- ✅ **tap** - Side effects without modifying stream
- ✅ **delay** - Delay emissions
- ✅ **takeUntil** - Unsubscribe pattern
- ✅ **shareReplay** - Cache observable results
- ✅ **finalize** - Cleanup logic

### 6. Patrones Prácticos del Mundo Real

#### Search Typeahead (Completo)
```typescript
searchTerms$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  filter(term => term.length >= 2),
  switchMap(term => this.search(term)),
  catchError(() => of([]))
).subscribe(results => this.results.set(results));
```

#### Form Auto-Save
```typescript
form.valueChanges.pipe(
  debounceTime(2000),
  filter(() => form.valid),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  switchMap(value => this.save(value))
).subscribe();
```

#### Polling with Pause/Resume
```typescript
interval(5000).pipe(
  withLatestFrom(pause$),
  filter(([_, isPaused]) => !isPaused),
  switchMap(() => this.fetchData())
).subscribe();
```

#### Cancellable HTTP Requests
```typescript
this.http.get('/api/data').pipe(
  takeUntil(this.cancelRequest$)
).subscribe();
```

### 7. Integration con Signals

#### toSignal - Observable → Signal
```typescript
user = toSignal(
  this.userService.currentUser$,
  { initialValue: null }
);
```

#### toObservable - Signal → Observable
```typescript
searchResults$ = toObservable(this.searchQuery).pipe(
  debounceTime(300),
  switchMap(query => this.search(query))
);
```

### 8. Custom Operators

- ✅ **retryBackoff** - Exponential backoff retry
- ✅ **debug** - Enhanced logging
- ✅ **cacheWithTTL** - Cache with time-to-live

### 9. Advanced Patterns

- ✅ Infinite scroll
- ✅ Request queue with concurrency limit
- ✅ Optimistic updates
- ✅ Multi-source data sync
- ✅ Smart prefetching
- ✅ Undo/Redo pattern
- ✅ Rate limiting
- ✅ Progressive data loading
- ✅ WebSocket with auto-reconnect

## 📊 Operator Categories Overview

| Categoría | Operators | Use Cases |
|-----------|-----------|-----------|
| **Transformación** | map, switchMap, mergeMap, concatMap | API calls, data transformation |
| **Filtrado** | filter, debounceTime, throttleTime | Search, events, deduplication |
| **Combinación** | combineLatest, forkJoin, merge, zip | Multiple sources, parallel requests |
| **Error Handling** | catchError, retry, retryWhen | API failures, recovery |
| **Utilidad** | tap, delay, shareReplay, finalize | Debugging, caching, cleanup |

## 🎯 Cuándo Usar Este Skill

Invocar cuando se necesite:

- Implementar search typeahead
- Auto-save de formularios
- Cancelación de HTTP requests
- Polling de datos
- Retry logic con backoff
- Combinación de múltiples streams
- Error recovery patterns
- Debounce/throttle para eventos
- Custom operators
- Integration signals ↔ observables
- Memory leak prevention (takeUntil)
- Optimistic updates
- Request queueing

## 💡 Quick Examples

### Search Typeahead
```typescript
@Component({
  selector: 'app-search'
})
export class SearchComponent {
  private searchTerms$ = new Subject<string>();

  results = toSignal(
    this.searchTerms$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchService.search(term))
    ),
    { initialValue: [] }
  );

  onSearch(term: string): void {
    this.searchTerms$.next(term);
  }
}
```

### Parallel Requests
```typescript
loadDashboard(): Observable<Dashboard> {
  return forkJoin({
    user: this.http.get('/api/user'),
    stats: this.http.get('/api/stats'),
    notifications: this.http.get('/api/notifications')
  });
}
```

### Error Handling with Retry
```typescript
this.http.get('/api/data').pipe(
  retry(3),
  catchError(error => {
    console.error('Failed after 3 retries:', error);
    return of(null);
  })
).subscribe();
```

## 📚 Diagramas de Marble

### switchMap
```
source:     --a-----b--c----|
switchMap:  --A-----B--C----|
              |cancel|cancel
```

### mergeMap
```
source:    --1--2--3--|
mergeMap:  --A--B--C--|
             |  |  |
             all run in parallel
```

### concatMap
```
source:     --1--2--3--|
concatMap:  --A---B---C--|
              wait wait
```

### debounceTime
```
source:         --a-b-c----d-e---|
debounce(300):  --------c------e-|
                  wait   wait
```

## 🚫 Common Anti-Patterns

### ❌ DON'T
```typescript
// Memory leak - no unsubscribe
this.service.getData().subscribe();

// Multiple subscriptions to same source
this.http.get('/api/data').subscribe();
this.http.get('/api/data').subscribe(); // 2nd HTTP call!

// Using nested subscribe (callback hell)
this.service1.get().subscribe(data1 => {
  this.service2.get(data1).subscribe(data2 => {
    // ❌ Hard to read and maintain
  });
});
```

### ✅ DO
```typescript
// Auto-unsubscribe with takeUntil
this.service.getData().pipe(
  takeUntil(this.destroy$)
).subscribe();

// Share single HTTP call
const data$ = this.http.get('/api/data').pipe(shareReplay(1));
data$.subscribe(); // Same HTTP call
data$.subscribe(); // Uses cached result

// Use operators instead of nested subscribe
this.service1.get().pipe(
  switchMap(data1 => this.service2.get(data1))
).subscribe(data2 => {
  // ✅ Clean and readable
});
```

## ✅ Best Practices Checklist

### Observable Management
- [ ] Use takeUntil for cleanup
- [ ] Use takeUntilDestroyed (Angular 16+)
- [ ] Avoid nested subscribes
- [ ] Use shareReplay for expensive operations
- [ ] Complete subjects in ngOnDestroy

### Operator Selection
- [ ] Use switchMap for search/navigation
- [ ] Use mergeMap for parallel operations
- [ ] Use concatMap for sequential workflows
- [ ] Use exhaustMap for button clicks
- [ ] Add debounce to search inputs
- [ ] Add throttle to scroll/resize events

### Error Handling
- [ ] Always handle errors with catchError
- [ ] Add retry logic for flaky endpoints
- [ ] Log errors for debugging
- [ ] Provide user feedback on errors
- [ ] Use fallback values when appropriate

### Performance
- [ ] Avoid creating observables in loops
- [ ] Use shareReplay for caching
- [ ] Implement proper unsubscription
- [ ] Use take(1) for one-time operations
- [ ] Consider memory leaks

## 🔧 NPM Packages

```bash
# RxJS (included with Angular)
npm install rxjs

# Angular RxJS interop (for toSignal, toObservable)
# Included in @angular/core >= 16
```

## 📖 Recursos

### Documentación Oficial
- [RxJS Official Docs](https://rxjs.dev/)
- [Angular RxJS Integration](https://angular.dev/guide/rx)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [Marble Diagrams](https://rxmarbles.com/)

### Tools
- [RxJS Visualizer](https://rxviz.com/)
- [RxJS Playground](https://thinkrx.io/)

## 🤝 Integración con Otros Skills

Este skill se complementa bien con:

- `angular-state-management` - Signals + RxJS patterns
- `angular-http-interceptors` - HTTP + operators
- `angular-error-handling` - Error recovery con operators
- `angular-testing-patterns` - Testing observables

## 📖 Cómo Usar el Skill

Simplemente menciona en tus prompts:

- "Necesito implementar search typeahead"
- "Cómo cancelar HTTP requests con RxJS"
- "Implementa auto-save con debounce"
- "Quiero hacer polling con pausar/reanudar"
- "Necesito retry logic con backoff exponencial"
- "Cómo combinar múltiples observables"
- "Implementa optimistic updates"

Claude Code cargará automáticamente este skill y te proporcionará la implementación completa.

---

**🎯 Resultado esperado:** Dominio completo de RxJS operators y patrones reactivos para Angular standalone 🚀
