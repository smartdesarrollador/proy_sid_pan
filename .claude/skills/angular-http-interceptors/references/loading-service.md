# Loading Service - Implementación Completa

Servicio para gestionar el estado global de loading con signals.

## Implementación Completa

```typescript
// src/app/core/services/loading.service.ts
import { Injectable, signal, computed } from '@angular/core';

/**
 * Servicio para gestionar el estado global de loading
 * Usa un contador para manejar múltiples requests simultáneas
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Contador de requests activas
  private loadingCount = signal<number>(0);

  // Signal público de solo lectura
  public loading = computed(() => this.loadingCount() > 0);

  // Signal para requests individuales (opcional, para debugging)
  private requests = signal<Map<string, boolean>>(new Map());

  /**
   * Incrementa el contador de loading
   * Se llama cuando inicia una request HTTP
   */
  show(): void {
    this.loadingCount.update(count => count + 1);
  }

  /**
   * Decrementa el contador de loading
   * Se llama cuando finaliza una request HTTP (éxito o error)
   */
  hide(): void {
    this.loadingCount.update(count => Math.max(0, count - 1));
  }

  /**
   * Resetea el contador a 0
   * Útil para casos de error donde el contador se desincroniza
   */
  reset(): void {
    this.loadingCount.set(0);
    this.requests.set(new Map());
  }

  /**
   * Obtiene el número de requests activas
   */
  getActiveRequestsCount(): number {
    return this.loadingCount();
  }

  /**
   * Muestra loading para una request específica
   * @param key - Identificador único de la request
   */
  showFor(key: string): void {
    this.show();
    this.requests.update(map => {
      const newMap = new Map(map);
      newMap.set(key, true);
      return newMap;
    });
  }

  /**
   * Oculta loading para una request específica
   * @param key - Identificador único de la request
   */
  hideFor(key: string): void {
    this.hide();
    this.requests.update(map => {
      const newMap = new Map(map);
      newMap.delete(key);
      return newMap;
    });
  }

  /**
   * Verifica si una request específica está loading
   * @param key - Identificador de la request
   */
  isLoadingFor(key: string): boolean {
    return this.requests().has(key);
  }

  /**
   * Obtiene información de debug
   */
  getDebugInfo(): {
    isLoading: boolean;
    activeCount: number;
    requests: string[];
  } {
    return {
      isLoading: this.loading(),
      activeCount: this.loadingCount(),
      requests: Array.from(this.requests().keys())
    };
  }
}
```

## Componente de Loading Spinner

### Loading Spinner Component

```typescript
// src/app/shared/components/loading-spinner/loading-spinner.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" [class.fullscreen]="fullscreen">
      <div class="spinner-container">
        <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
        @if (message) {
          <p class="loading-message">{{ message }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-overlay.fullscreen {
      position: fixed;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-message {
      color: white;
      font-size: 1rem;
      margin: 0;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() fullscreen = true;
  @Input() size = 48;
  @Input() message = '';
}
```

### Uso en App Component

```typescript
// src/app/app.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '@core/services/loading.service';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingSpinnerComponent],
  template: `
    <!-- Loading Spinner Global -->
    @if (isLoading()) {
      <app-loading-spinner
        [fullscreen]="true"
        [message]="'Cargando...'"
      />
    }

    <!-- Contenido de la aplicación -->
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AppComponent {
  private loadingService = inject(LoadingService);
  isLoading = this.loadingService.loading;
}
```

## Uso Manual del Loading Service

### En Componentes

```typescript
// Ejemplo 1: Loading manual
@Component({
  selector: 'app-users',
  template: `
    @if (isLoading()) {
      <div class="loading">Cargando usuarios...</div>
    }

    @if (users()) {
      <ul>
        @for (user of users(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }

    <button (click)="loadUsers()">Cargar Usuarios</button>
  `
})
export class UsersComponent {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);

  users = signal<User[]>([]);
  isLoading = this.loadingService.loading;

  loadUsers(): void {
    // El loading interceptor ya maneja esto automáticamente
    // pero puedes controlarlo manualmente si lo necesitas
    this.http.get<User[]>('/api/users').subscribe({
      next: (users) => this.users.set(users),
      error: (error) => console.error(error)
    });
  }
}
```

```typescript
// Ejemplo 2: Loading específico para una operación
@Component({
  selector: 'app-profile',
  template: `
    <button
      (click)="saveProfile()"
      [disabled]="isSaving()"
    >
      @if (isSaving()) {
        <span>Guardando...</span>
      } @else {
        <span>Guardar Perfil</span>
      }
    </button>
  `
})
export class ProfileComponent {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);

  isSaving = computed(() => this.loadingService.isLoadingFor('save-profile'));

  saveProfile(): void {
    const key = 'save-profile';

    this.loadingService.showFor(key);

    this.http.put('/api/profile', this.profileData).subscribe({
      next: () => {
        this.loadingService.hideFor(key);
        console.log('Perfil guardado');
      },
      error: () => {
        this.loadingService.hideFor(key);
        console.error('Error al guardar');
      }
    });
  }
}
```

## Loading con Diferentes Estados

### Loading State con Progress

```typescript
// src/app/core/services/loading-with-progress.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingWithProgressService {
  private state = signal<LoadingState>({
    isLoading: false
  });

  public loading = computed(() => this.state().isLoading);
  public progress = computed(() => this.state().progress);
  public message = computed(() => this.state().message);

  show(message?: string): void {
    this.state.set({
      isLoading: true,
      message,
      progress: 0
    });
  }

  hide(): void {
    this.state.set({
      isLoading: false
    });
  }

  setProgress(progress: number, message?: string): void {
    this.state.update(state => ({
      ...state,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || state.message
    }));
  }

  setMessage(message: string): void {
    this.state.update(state => ({
      ...state,
      message
    }));
  }
}
```

### Component con Progress Bar

```typescript
@Component({
  selector: 'app-upload',
  template: `
    <div class="upload-container">
      @if (isLoading()) {
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="progress()"
            ></div>
          </div>
          <p>{{ message() }} - {{ progress() }}%</p>
        </div>
      }

      <button (click)="uploadFile()">Upload File</button>
    </div>
  `
})
export class UploadComponent {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingWithProgressService);

  isLoading = this.loadingService.loading;
  progress = this.loadingService.progress;
  message = this.loadingService.message;

  uploadFile(): void {
    this.loadingService.show('Subiendo archivo...');

    const formData = new FormData();
    // ... agregar archivo

    this.http.post('/api/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round((100 * event.loaded) / event.total!);
          this.loadingService.setProgress(progress);
        } else if (event.type === HttpEventType.Response) {
          this.loadingService.hide();
        }
      },
      error: () => {
        this.loadingService.hide();
      }
    });
  }
}
```

## Loading con Skeleton Screens

```typescript
// src/app/shared/components/skeleton/skeleton.ts
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton" [class]="type">
      <div class="skeleton-shimmer"></div>
    </div>
  `,
  styles: [`
    .skeleton {
      background: #e0e0e0;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .skeleton.text {
      height: 16px;
      width: 100%;
      margin: 8px 0;
    }

    .skeleton.circle {
      border-radius: 50%;
      width: 48px;
      height: 48px;
    }

    .skeleton.rect {
      height: 200px;
      width: 100%;
    }

    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: -100%;
      height: 100%;
      width: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.5),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      to {
        left: 100%;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'text' | 'circle' | 'rect' = 'text';
}
```

Uso:

```typescript
@Component({
  template: `
    @if (isLoading()) {
      <app-skeleton type="circle" />
      <app-skeleton type="text" />
      <app-skeleton type="text" />
      <app-skeleton type="rect" />
    } @else {
      <!-- Contenido real -->
    }
  `
})
```

## Testing del Loading Service

```typescript
// loading.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService]
    });
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with loading false', () => {
    expect(service.loading()).toBe(false);
  });

  it('should show loading when show() is called', () => {
    service.show();
    expect(service.loading()).toBe(true);
  });

  it('should hide loading when hide() is called', () => {
    service.show();
    service.hide();
    expect(service.loading()).toBe(false);
  });

  it('should handle multiple show/hide correctly', () => {
    service.show(); // count = 1
    service.show(); // count = 2
    expect(service.loading()).toBe(true);

    service.hide(); // count = 1
    expect(service.loading()).toBe(true);

    service.hide(); // count = 0
    expect(service.loading()).toBe(false);
  });

  it('should not go below 0', () => {
    service.hide();
    service.hide();
    expect(service.getActiveRequestsCount()).toBe(0);
  });

  it('should reset counter', () => {
    service.show();
    service.show();
    service.reset();
    expect(service.loading()).toBe(false);
    expect(service.getActiveRequestsCount()).toBe(0);
  });

  it('should handle specific requests', () => {
    service.showFor('request-1');
    expect(service.isLoadingFor('request-1')).toBe(true);

    service.hideFor('request-1');
    expect(service.isLoadingFor('request-1')).toBe(false);
  });
});
```

## Best Practices

1. **Usar loading automático**: Dejar que el interceptor maneje el loading global
2. **Loading específico**: Usar `showFor/hideFor` para operaciones específicas
3. **Skeleton screens**: Mejor UX que spinners para contenido predecible
4. **Timeout de seguridad**: Resetear loading si una request tarda demasiado
5. **Testing**: Siempre testear estados de loading
6. **Accesibilidad**: Agregar aria-labels a los spinners
7. **Progress bars**: Usar para operaciones largas (uploads, downloads)
