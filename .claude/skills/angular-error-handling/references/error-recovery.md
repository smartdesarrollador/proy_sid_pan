# Error Recovery Patterns - Angular

Patrones y estrategias para recuperación de errores.

## 1. Retry Patterns

### Retry con Backoff Exponencial

```typescript
import { retry, timer } from 'rxjs';

// Retry básico
observable$.pipe(
  retry(3) // Reintentar 3 veces inmediatamente
);

// Retry con delay
observable$.pipe(
  retryWhen(errors =>
    errors.pipe(
      delay(1000), // Esperar 1 segundo entre reintentos
      take(3) // Máximo 3 reintentos
    )
  )
);

// Retry con backoff exponencial
observable$.pipe(
  retryWhen(errors =>
    errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;

        if (retryAttempt > 3) {
          return throwError(() => error);
        }

        const delay = Math.pow(2, index) * 1000; // 1s, 2s, 4s
        console.log(`Retry attempt ${retryAttempt} after ${delay}ms`);

        return timer(delay);
      })
    )
  )
);
```

### Retry Solo en Errores Específicos

```typescript
import { retryWhen, mergeMap, throwError, timer } from 'rxjs';

function retryOnSpecificErrors(retryableStatuses: number[], maxRetries = 3) {
  return (source: Observable<any>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            // Verificar si el error es retryable
            const isRetryable = retryableStatuses.includes(error.status) ||
                                error.status === 0; // Network errors

            if (!isRetryable || retryAttempt > maxRetries) {
              return throwError(() => error);
            }

            const delay = Math.pow(2, index) * 1000;
            return timer(delay);
          })
        )
      )
    );
}

// Uso
this.http.get('/api/data')
  .pipe(
    retryOnSpecificErrors([408, 502, 503, 504], 3)
  )
  .subscribe();
```

## 2. Fallback Strategies

### Fallback a Datos en Cache

```typescript
import { catchError, of } from 'rxjs';

class DataService {
  private cache = new Map<string, any>();

  getData(id: string): Observable<Data> {
    return this.http.get<Data>(`/api/data/${id}`)
      .pipe(
        tap(data => this.cache.set(id, data)), // Cachear resultado
        catchError(error => {
          console.error('API failed, using cached data', error);

          // Intentar obtener de cache
          const cached = this.cache.get(id);
          if (cached) {
            return of(cached);
          }

          // Si no hay cache, retornar valor por defecto
          return of(this.getDefaultData());
        })
      );
  }

  private getDefaultData(): Data {
    return {
      id: '',
      value: 'N/A',
      timestamp: new Date()
    };
  }
}
```

### Fallback a Servicio Alternativo

```typescript
class DataService {
  getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/primary/data')
      .pipe(
        catchError(primaryError => {
          console.warn('Primary API failed, trying backup', primaryError);

          // Intentar servicio backup
          return this.http.get<Data[]>('/api/backup/data')
            .pipe(
              catchError(backupError => {
                console.error('Backup API also failed', backupError);

                // Fallback a datos locales
                return of(this.getLocalData());
              })
            );
        })
      );
  }

  private getLocalData(): Data[] {
    const stored = localStorage.getItem('cached_data');
    return stored ? JSON.parse(stored) : [];
  }
}
```

## 3. Circuit Breaker Pattern

```typescript
import { Observable, throwError, timer, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

enum CircuitState {
  CLOSED,  // Normal operation
  OPEN,    // Failing, reject immediately
  HALF_OPEN // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;

  private readonly failureThreshold = 5;
  private readonly successThreshold = 2;
  private readonly timeout = 60000; // 1 minuto

  execute<T>(operation: Observable<T>): Observable<T> {
    // Si el circuito está abierto
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        // Intentar half-open
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        // Rechazar inmediatamente
        return throwError(() => new Error('Circuit breaker is OPEN'));
      }
    }

    return operation.pipe(
      tap(() => this.onSuccess()),
      catchError(error => {
        this.onFailure();
        return throwError(() => error);
      })
    );
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log('Circuit breaker CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.error('Circuit breaker OPEN');
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Uso
class ApiService {
  private circuitBreaker = new CircuitBreaker();

  getData(): Observable<Data> {
    return this.circuitBreaker.execute(
      this.http.get<Data>('/api/data')
    ).pipe(
      catchError(error => {
        if (error.message === 'Circuit breaker is OPEN') {
          this.toastService.warning('Service temporarily unavailable. Please try again later.');
        }
        return throwError(() => error);
      })
    );
  }
}
```

## 4. Optimistic Updates con Rollback

```typescript
class DataService {
  private data = signal<Item[]>([]);

  updateItem(id: string, updates: Partial<Item>): Observable<Item> {
    // Guardar estado anterior
    const previousData = [...this.data()];
    const itemIndex = this.data().findIndex(item => item.id === id);
    const previousItem = this.data()[itemIndex];

    // Actualización optimista
    this.data.update(items => {
      const newItems = [...items];
      newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
      return newItems;
    });

    // Mostrar feedback inmediato
    this.toastService.info('Updating...');

    // Hacer request
    return this.http.put<Item>(`/api/items/${id}`, updates)
      .pipe(
        tap(updatedItem => {
          // Actualizar con datos del servidor
          this.data.update(items => {
            const newItems = [...items];
            newItems[itemIndex] = updatedItem;
            return newItems;
          });

          this.toastService.success('Updated successfully!');
        }),
        catchError(error => {
          // Rollback en caso de error
          this.data.set(previousData);

          this.toastService.error('Update failed. Changes have been reverted.');

          return throwError(() => error);
        })
      );
  }
}
```

## 5. Graceful Degradation

```typescript
class FeatureService {
  private featureAvailable = signal(true);

  loadFeature(): Observable<FeatureData> {
    return this.http.get<FeatureData>('/api/premium-feature')
      .pipe(
        tap(() => this.featureAvailable.set(true)),
        catchError(error => {
          console.warn('Premium feature unavailable, using basic version', error);
          this.featureAvailable.set(false);

          // Retornar versión básica de la feature
          return of(this.getBasicFeatureData());
        })
      );
  }

  getBasicFeatureData(): FeatureData {
    return {
      type: 'basic',
      data: [],
      message: 'Using basic version. Upgrade for more features.'
    };
  }
}

// En el componente
@Component({
  template: `
    @if (featureService.featureAvailable()) {
      <premium-feature [data]="data"></premium-feature>
    } @else {
      <basic-feature [data]="data">
        <div class="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
          Some features are currently unavailable.
          <a href="/upgrade" class="text-blue-600 hover:underline">Upgrade now</a>
        </div>
      </basic-feature>
    }
  `
})
export class FeatureComponent {
  featureService = inject(FeatureService);
  data = signal<FeatureData | null>(null);

  ngOnInit() {
    this.featureService.loadFeature().subscribe(data => {
      this.data.set(data);
    });
  }
}
```

## 6. Timeout con Fallback

```typescript
import { timeout, catchError } from 'rxjs/operators';

class ApiService {
  getDataWithTimeout(): Observable<Data> {
    return this.http.get<Data>('/api/slow-endpoint')
      .pipe(
        timeout(5000), // 5 segundos
        catchError(error => {
          if (error.name === 'TimeoutError') {
            this.toastService.warning('Request timed out. Using cached data.');
            return of(this.getCachedData());
          }

          return throwError(() => error);
        })
      );
  }

  private getCachedData(): Data {
    const cached = sessionStorage.getItem('last_data');
    return cached ? JSON.parse(cached) : this.getDefaultData();
  }

  private getDefaultData(): Data {
    return { /* default values */ };
  }
}
```

## 7. Polling con Error Recovery

```typescript
import { interval, switchMap, catchError, retry } from 'rxjs';

class PollingService {
  startPolling(): Observable<Data> {
    return interval(5000) // Poll cada 5 segundos
      .pipe(
        switchMap(() => this.http.get<Data>('/api/status')),
        retry({
          count: 3,
          delay: 1000,
          resetOnSuccess: true
        }),
        catchError(error => {
          console.error('Polling failed after retries', error);
          this.toastService.warning('Auto-update paused. Refresh to resume.');

          // Continuar polling pero con datos por defecto
          return of(this.getDefaultData());
        })
      );
  }
}
```

## 8. Queue con Retry para Operaciones Offline

```typescript
interface QueuedOperation {
  id: string;
  operation: () => Observable<any>;
  retries: number;
  maxRetries: number;
}

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;

  enqueue(operation: () => Observable<any>, maxRetries = 3): void {
    this.queue.push({
      id: this.generateId(),
      operation,
      retries: 0,
      maxRetries
    });

    this.processQueue();
  }

  private processQueue(): void {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const item = this.queue[0];

    item.operation().subscribe({
      next: () => {
        this.queue.shift(); // Remover del queue
        this.isProcessing = false;
        this.processQueue(); // Procesar siguiente
      },
      error: (error) => {
        item.retries++;

        if (item.retries >= item.maxRetries) {
          console.error(`Operation ${item.id} failed after ${item.retries} retries`);
          this.queue.shift(); // Remover del queue
          this.toastService.error('Operation failed permanently');
        } else {
          console.warn(`Retrying operation ${item.id} (${item.retries}/${item.maxRetries})`);
          // Esperar antes de reintentar
          setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
          }, Math.pow(2, item.retries) * 1000);
          return;
        }

        this.isProcessing = false;
        this.processQueue();
      }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Uso
class DataService {
  private offlineQueue = inject(OfflineQueueService);

  saveData(data: Data): void {
    if (!navigator.onLine) {
      this.toastService.info('Offline. Operation queued.');
      this.offlineQueue.enqueue(() => this.http.post('/api/data', data));
    } else {
      this.http.post('/api/data', data).subscribe();
    }
  }
}
```

## Best Practices

1. **Retry Logic**: Usar backoff exponencial para evitar sobrecarga
2. **Circuit Breaker**: Implementar para servicios externos
3. **Fallback**: Siempre tener un plan B (cache, datos por defecto)
4. **Optimistic Updates**: Mejorar UX con feedback inmediato
5. **Graceful Degradation**: Degradar features antes que fallar completamente
6. **Timeout**: Siempre configurar timeouts en requests
7. **Queue**: Manejar operaciones offline con queue y retry
8. **User Feedback**: Informar al usuario sobre el estado y acciones de recovery
