# Toast Component - Templates y Estilos

Template HTML y estilos CSS completos para el Toast Component.

## HTML Template

`src/app/shared/components/toast/toast.component.html`:

```html
<div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
  @for (toast of toasts(); track toast.id) {
    <div
      [class]="getToastClasses(toast.type)"
      [@slideIn]
      role="alert"
      aria-live="polite"
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        <div
          [class]="'flex items-center justify-center w-8 h-8 rounded-full ' + getIconBgClass(toast.type)"
        >
          <span [class]="'text-xl font-bold ' + getIconColor(toast.type)">
            {{ getIcon(toast.type) }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        @if (toast.title) {
          <h4 class="text-sm font-semibold mb-1">
            {{ toast.title }}
          </h4>
        }
        <p class="text-sm">
          {{ toast.message }}
        </p>
      </div>

      <!-- Close Button -->
      @if (toast.dismissible) {
        <button
          type="button"
          (click)="dismiss(toast.id)"
          class="flex-shrink-0 ml-3 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition hover:bg-black hover:bg-opacity-10"
          [class.focus:ring-green-500]="toast.type === 'success'"
          [class.focus:ring-red-500]="toast.type === 'error'"
          [class.focus:ring-yellow-500]="toast.type === 'warning'"
          [class.focus:ring-blue-500]="toast.type === 'info'"
          aria-label="Dismiss"
        >
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      }

      <!-- Progress Bar (si tiene duration) -->
      @if (toast.duration && toast.duration > 0) {
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
          <div
            class="h-full transition-all ease-linear"
            [class.bg-green-600]="toast.type === 'success'"
            [class.bg-red-600]="toast.type === 'error'"
            [class.bg-yellow-600]="toast.type === 'warning'"
            [class.bg-blue-600]="toast.type === 'info'"
            [style.width.%]="100"
            [style.animation]="'shrink ' + toast.duration + 'ms linear'"
          ></div>
        </div>
      }
    </div>
  }
</div>
```

## CSS Styles

`src/app/shared/components/toast/toast.component.css`:

```css
/* Animaciones de entrada */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Progress bar animation */
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Toast container responsiveness */
@media (max-width: 640px) {
  :host {
    max-width: calc(100vw - 2rem);
  }
}

/* Smooth transitions */
:host ::ng-deep .toast-item {
  transition: all 0.3s ease-out;
}

/* Hover effects */
:host ::ng-deep .toast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
```

## TypeScript Component (Completo)

`src/app/shared/components/toast/toast.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '@core/services/toast.service';
import { Toast, ToastType } from '@core/models/error.models';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);

  toasts = this.toastService.toasts;
  ToastType = ToastType;

  /**
   * Cierra un toast
   */
  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  /**
   * Obtiene las clases CSS según el tipo de toast
   */
  getToastClasses(type: ToastType): string {
    const baseClasses = 'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 transition-all max-w-md overflow-hidden';

    const typeClasses = {
      [ToastType.SUCCESS]: 'bg-green-50 border-green-500 text-green-900',
      [ToastType.ERROR]: 'bg-red-50 border-red-500 text-red-900',
      [ToastType.WARNING]: 'bg-yellow-50 border-yellow-500 text-yellow-900',
      [ToastType.INFO]: 'bg-blue-50 border-blue-500 text-blue-900'
    };

    return `${baseClasses} ${typeClasses[type]}`;
  }

  /**
   * Obtiene el background del ícono
   */
  getIconBgClass(type: ToastType): string {
    const bgClasses = {
      [ToastType.SUCCESS]: 'bg-green-100',
      [ToastType.ERROR]: 'bg-red-100',
      [ToastType.WARNING]: 'bg-yellow-100',
      [ToastType.INFO]: 'bg-blue-100'
    };

    return bgClasses[type];
  }

  /**
   * Obtiene el ícono según el tipo
   */
  getIcon(type: ToastType): string {
    const icons = {
      [ToastType.SUCCESS]: '✓',
      [ToastType.ERROR]: '✕',
      [ToastType.WARNING]: '⚠',
      [ToastType.INFO]: 'ℹ'
    };

    return icons[type];
  }

  /**
   * Obtiene el color del ícono
   */
  getIconColor(type: ToastType): string {
    const colors = {
      [ToastType.SUCCESS]: 'text-green-600',
      [ToastType.ERROR]: 'text-red-600',
      [ToastType.WARNING]: 'text-yellow-600',
      [ToastType.INFO]: 'text-blue-600'
    };

    return colors[type];
  }
}
```

## Variantes de Toast (Alternativas)

### Toast Minimalista

```html
<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
  @for (toast of toasts(); track toast.id) {
    <div
      class="flex items-center gap-2 px-4 py-3 rounded-lg shadow-md"
      [class.bg-green-500]="toast.type === 'success'"
      [class.bg-red-500]="toast.type === 'error'"
      [class.bg-yellow-500]="toast.type === 'warning'"
      [class.bg-blue-500]="toast.type === 'info'"
      [@slideIn]
    >
      <span class="text-white text-sm font-medium">{{ toast.message }}</span>
      <button
        (click)="dismiss(toast.id)"
        class="text-white hover:text-gray-200 transition"
      >
        ✕
      </button>
    </div>
  }
</div>
```

### Toast con Action Button

```html
<div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
  @for (toast of toasts(); track toast.id) {
    <div [class]="getToastClasses(toast.type)" [@slideIn]>
      <!-- Icon + Content -->
      <div class="flex items-start gap-3 flex-1">
        <div class="flex-shrink-0">
          <span [class]="'text-2xl ' + getIconColor(toast.type)">
            {{ getIcon(toast.type) }}
          </span>
        </div>
        <div class="flex-1">
          @if (toast.title) {
            <h4 class="text-sm font-semibold mb-1">{{ toast.title }}</h4>
          }
          <p class="text-sm">{{ toast.message }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 mt-3">
        @if (toast.actionLabel) {
          <button
            (click)="handleAction(toast)"
            class="text-sm font-medium hover:underline"
            [class.text-green-700]="toast.type === 'success'"
            [class.text-red-700]="toast.type === 'error'"
            [class.text-yellow-700]="toast.type === 'warning'"
            [class.text-blue-700]="toast.type === 'info'"
          >
            {{ toast.actionLabel }}
          </button>
        }
        <button
          (click)="dismiss(toast.id)"
          class="text-sm text-gray-600 hover:text-gray-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  }
</div>
```

## Posicionamiento del Toast

### Bottom Right

```typescript
// toast.component.ts
@Component({
  selector: 'app-toast-container',
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-3 max-w-md">
      <!-- Toasts aquí -->
    </div>
  `
})
```

### Top Center

```typescript
@Component({
  selector: 'app-toast-container',
  template: `
    <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 max-w-md">
      <!-- Toasts aquí -->
    </div>
  `
})
```

### Bottom Left

```typescript
@Component({
  selector: 'app-toast-container',
  template: `
    <div class="fixed bottom-4 left-4 z-50 flex flex-col-reverse gap-3 max-w-md">
      <!-- Toasts aquí -->
    </div>
  `
})
```

## Uso Avanzado

### Toast con HTML Content

```typescript
interface ToastWithHtml extends Toast {
  html?: string;
}

// En el template
<div [innerHTML]="toast.html || toast.message"></div>
```

### Toast con Progress

```typescript
// ToastService
showWithProgress(message: string, promise: Promise<any>): void {
  const toast: Toast = {
    id: this.generateId(),
    type: ToastType.INFO,
    message: message,
    duration: 0, // No auto-dismiss
    dismissible: false
  };

  this.toasts.update(toasts => [...toasts, toast]);

  promise
    .then(() => {
      this.dismiss(toast.id);
      this.success('Operation completed!');
    })
    .catch(() => {
      this.dismiss(toast.id);
      this.error('Operation failed!');
    });
}

// Uso
toastService.showWithProgress('Uploading file...', uploadPromise);
```

### Toast Persistente

```typescript
// ToastService
persistent(message: string, type: ToastType = ToastType.INFO): string {
  const toast: Toast = {
    id: this.generateId(),
    type,
    message,
    duration: 0, // No auto-dismiss
    dismissible: true
  };

  this.toasts.update(toasts => [...toasts, toast]);

  return toast.id; // Retornar ID para cerrar manualmente
}

// Uso
const toastId = toastService.persistent('Processing...', ToastType.INFO);
// ... hacer operación ...
toastService.dismiss(toastId);
```

## Accessibility

```html
<!-- Agregar roles ARIA -->
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
  [class]="getToastClasses(toast.type)"
>
  <!-- Content -->
</div>

<!-- Para errores críticos -->
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <!-- Content -->
</div>
```

## Testing

```typescript
describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should display toasts from service', () => {
    toastService.success('Test message');
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(toastElements.length).toBe(1);
    expect(toastElements[0].textContent).toContain('Test message');
  });

  it('should dismiss toast on close button click', () => {
    toastService.success('Test message');
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
    closeButton.click();
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(toastElements.length).toBe(0);
  });

  it('should auto-dismiss after duration', fakeAsync(() => {
    toastService.success('Test message', undefined, 2000);
    fixture.detectChanges();

    expect(component.toasts().length).toBe(1);

    tick(2000);
    fixture.detectChanges();

    expect(component.toasts().length).toBe(0);
  }));
});
```
