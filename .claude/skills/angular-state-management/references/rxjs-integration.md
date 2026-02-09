# RxJS Integration

Integración de Signals con RxJS Observables.

## toSignal() - Observable a Signal

```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({})
export class TimerComponent {
  // Observable
  timer$ = interval(1000);

  // Convertir a Signal
  timer = toSignal(this.timer$, { initialValue: 0 });

  // Usar en template
  // {{ timer() }}
}
```

## toObservable() - Signal a Observable

```typescript
import { toObservable } from '@angular/core/rxjs-interop';
import { signal } from '@angular/core';

@Component({})
export class SearchComponent {
  searchTerm = signal('');

  // Convertir signal a observable
  searchTerm$ = toObservable(this.searchTerm);

  results$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.searchService.search(term))
  );
}
```

## Hybrid Store (Signals + RxJS)

```typescript
@Injectable({ providedIn: 'root' })
export class HybridStore {
  // BehaviorSubject para Observable
  private state$ = new BehaviorSubject<User[]>([]);

  // Convertir a Signal
  users = toSignal(this.state$, { initialValue: [] });

  // Observable público
  users$ = this.state$.asObservable();

  // Método que actualiza ambos
  setUsers(users: User[]): void {
    this.state$.next(users);
  }
}
```

## Sincronización Bidireccional

```typescript
@Injectable({ providedIn: 'root' })
export class SyncStore {
  // Signal
  private count = signal(0);

  // Observable desde Signal
  count$ = toObservable(this.count);

  // Signal desde Observable (circular)
  countFromObservable = toSignal(
    this.count$.pipe(map(n => n * 2)),
    { initialValue: 0 }
  );

  increment(): void {
    this.count.update(n => n + 1);
  }
}
```
