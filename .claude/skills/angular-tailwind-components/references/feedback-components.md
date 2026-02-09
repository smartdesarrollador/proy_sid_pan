# Feedback Components - Alerts, Toasts, Notifications

Componentes para feedback visual al usuario: alertas, toasts, notificaciones y progress bars.

## 1. Alert Component

```typescript
// src/app/shared/components/alert/alert.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * Alert component para mensajes de feedback.
 *
 * @example
 * <app-alert variant="success" [dismissible]="true">
 *   Operation completed successfully!
 * </app-alert>
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ],
  template: `
    @if (visible) {
      <div
        [class]="alertClasses"
        role="alert"
        @slideDown
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              [class]="iconClasses"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              @switch (variant) {
                @case ('success') {
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                }
                @case ('warning') {
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                }
                @case ('danger') {
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                }
                @default {
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                }
              }
            </svg>
          </div>

          <div class="ml-3 flex-1">
            @if (title) {
              <h3 class="text-sm font-medium" [class]="titleClasses">
                {{ title }}
              </h3>
            }
            <div class="text-sm" [class]="contentClasses">
              <ng-content></ng-content>
            </div>
          </div>

          @if (dismissible) {
            <div class="ml-auto pl-3">
              <button
                type="button"
                (click)="dismiss()"
                [class]="closeButtonClasses"
                aria-label="Dismiss"
              >
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title = '';
  @Input() dismissible = false;
  @Input() visible = true;

  @Output() dismissed = new EventEmitter<void>();

  dismiss(): void {
    this.visible = false;
    this.dismissed.emit();
  }

  get alertClasses(): string {
    const base = 'rounded-lg p-4 border';
    const variants: Record<AlertVariant, string> = {
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      danger: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    };
    return `${base} ${variants[this.variant]}`;
  }

  get iconClasses(): string {
    const base = 'h-5 w-5';
    const variants: Record<AlertVariant, string> = {
      info: 'text-blue-400 dark:text-blue-300',
      success: 'text-green-400 dark:text-green-300',
      warning: 'text-yellow-400 dark:text-yellow-300',
      danger: 'text-red-400 dark:text-red-300'
    };
    return `${base} ${variants[this.variant]}`;
  }

  get titleClasses(): string {
    const variants: Record<AlertVariant, string> = {
      info: 'text-blue-800 dark:text-blue-200',
      success: 'text-green-800 dark:text-green-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
      danger: 'text-red-800 dark:text-red-200'
    };
    return variants[this.variant];
  }

  get contentClasses(): string {
    const variants: Record<AlertVariant, string> = {
      info: 'text-blue-700 dark:text-blue-300',
      success: 'text-green-700 dark:text-green-300',
      warning: 'text-yellow-700 dark:text-yellow-300',
      danger: 'text-red-700 dark:text-red-300'
    };
    return variants[this.variant];
  }

  get closeButtonClasses(): string {
    const base = 'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variants: Record<AlertVariant, string> = {
      info: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600',
      success: 'text-green-500 hover:bg-green-100 focus:ring-green-600',
      warning: 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
      danger: 'text-red-500 hover:bg-red-100 focus:ring-red-600'
    };
    return `${base} ${variants[this.variant]}`;
  }
}
```

## 2. Toast Notification Service

```typescript
// src/app/shared/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(toast: Omit<Toast, 'id'>): string {
    const id = `toast-${this.counter++}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      dismissible: true,
      ...toast
    };

    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto-dismiss después de duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.dismiss(id), newToast.duration);
    }

    return id;
  }

  success(message: string, duration = 5000): string {
    return this.show({ message, type: 'success', duration });
  }

  error(message: string, duration = 5000): string {
    return this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration = 5000): string {
    return this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration = 5000): string {
    return this.show({ message, type: 'info', duration });
  }

  dismiss(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
```

## 3. Toast Container Component

```typescript
// src/app/shared/components/toast/toast-container.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@/shared/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Contenedor de toasts. Agregar en app.component.html
 *
 * @example
 * <app-toast-container></app-toast-container>
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="getToastClasses(toast.type)"
          @slideIn
          role="alert"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                @switch (toast.type) {
                  @case ('success') {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  }
                  @case ('error') {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  }
                  @case ('warning') {
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  }
                  @default {
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  }
                }
              </svg>
            </div>

            <div class="ml-3 flex-1">
              <p class="text-sm font-medium">
                {{ toast.message }}
              </p>
            </div>

            @if (toast.dismissible) {
              <div class="ml-4 flex-shrink-0">
                <button
                  type="button"
                  (click)="toastService.dismiss(toast.id)"
                  class="inline-flex rounded-md hover:opacity-75 focus:outline-none focus:ring-2"
                >
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const base = 'rounded-lg p-4 shadow-lg border backdrop-blur-sm';
    const types: Record<string, string> = {
      success: 'bg-green-50/95 border-green-200 text-green-800 dark:bg-green-900/95 dark:border-green-800 dark:text-green-200',
      error: 'bg-red-50/95 border-red-200 text-red-800 dark:bg-red-900/95 dark:border-red-800 dark:text-red-200',
      warning: 'bg-yellow-50/95 border-yellow-200 text-yellow-800 dark:bg-yellow-900/95 dark:border-yellow-800 dark:text-yellow-200',
      info: 'bg-blue-50/95 border-blue-200 text-blue-800 dark:bg-blue-900/95 dark:border-blue-800 dark:text-blue-200'
    };
    return `${base} ${types[type]}`;
  }
}
```

### Uso de Toasts

```typescript
// En app.component.html
<app-toast-container></app-toast-container>

// En cualquier componente
import { ToastService } from '@/shared/services/toast.service';

export class MyComponent {
  toastService = inject(ToastService);

  onSave(): void {
    this.service.save().subscribe({
      next: () => {
        this.toastService.success('Saved successfully!');
      },
      error: (err) => {
        this.toastService.error('Failed to save. Please try again.');
      }
    });
  }
}
```

## 4. Progress Bar Component

```typescript
// src/app/shared/components/progress/progress.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';

/**
 * Progress bar component.
 *
 * @example
 * <app-progress [value]="75" variant="success"></app-progress>
 */
@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      @if (label) {
        <div class="flex justify-between mb-1">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ label }}
          </span>
          @if (showPercentage) {
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ value }}%
            </span>
          }
        </div>
      }

      <div
        class="w-full bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden"
        [style.height.px]="height"
        role="progressbar"
        [attr.aria-valuenow]="value"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          [class]="barClasses"
          [style.width.%]="clampedValue"
          [class.transition-all]="animated"
          [class.duration-300]="animated"
        ></div>
      </div>
    </div>
  `
})
export class ProgressComponent {
  @Input() value = 0;
  @Input() variant: ProgressVariant = 'default';
  @Input() height = 8;
  @Input() label = '';
  @Input() showPercentage = false;
  @Input() animated = true;
  @Input() striped = false;
  @Input() indeterminate = false;

  get clampedValue(): number {
    return Math.max(0, Math.min(100, this.value));
  }

  get barClasses(): string {
    const base = 'h-full rounded-full';

    const variants: Record<ProgressVariant, string> = {
      default: 'bg-blue-600 dark:bg-blue-500',
      success: 'bg-green-600 dark:bg-green-500',
      warning: 'bg-yellow-600 dark:bg-yellow-500',
      danger: 'bg-red-600 dark:bg-red-500'
    };

    const stripedClass = this.striped
      ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:1rem_100%] animate-progress-stripe'
      : '';

    const indeterminateClass = this.indeterminate
      ? 'animate-progress-indeterminate'
      : '';

    return `${base} ${variants[this.variant]} ${stripedClass} ${indeterminateClass}`;
  }
}
```

### Animaciones adicionales en tailwind.config.js

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'progress-stripe': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '1rem 0' }
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' }
        }
      },
      animation: {
        'progress-stripe': 'progress-stripe 1s linear infinite',
        'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite'
      }
    }
  }
};
```

## 5. Skeleton Loader

```typescript
// src/app/shared/components/skeleton/skeleton.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

/**
 * Skeleton loader para estados de carga.
 *
 * @example
 * <app-skeleton variant="text" [count]="3"></app-skeleton>
 * <app-skeleton variant="circular" width="40px" height="40px"></app-skeleton>
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (item of items; track $index) {
      <div
        [class]="skeletonClasses"
        [style.width]="width"
        [style.height]="height"
        aria-busy="true"
        aria-live="polite"
      ></div>
    }
  `
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width = '100%';
  @Input() height?: string;
  @Input() count = 1;

  get items(): number[] {
    return Array(this.count).fill(0);
  }

  get skeletonClasses(): string {
    const base = 'animate-pulse bg-gray-300 dark:bg-gray-700';

    const variants: Record<SkeletonVariant, string> = {
      text: 'h-4 rounded mb-2',
      circular: 'rounded-full',
      rectangular: 'rounded'
    };

    return `${base} ${variants[this.variant]}`;
  }
}
```

### Ejemplos de uso

```typescript
// Loading state para lista de usuarios
<div class="space-y-4">
  @if (loading) {
    @for (item of [1,2,3]; track item) {
      <div class="flex items-center space-x-4">
        <app-skeleton variant="circular" width="40px" height="40px"></app-skeleton>
        <div class="flex-1">
          <app-skeleton variant="text" width="60%"></app-skeleton>
          <app-skeleton variant="text" width="40%"></app-skeleton>
        </div>
      </div>
    }
  } @else {
    @for (user of users; track user.id) {
      <div class="flex items-center space-x-4">
        <img [src]="user.avatar" class="w-10 h-10 rounded-full">
        <div>
          <div>{{ user.name }}</div>
          <div class="text-sm text-gray-500">{{ user.email }}</div>
        </div>
      </div>
    }
  }
</div>
```

## 6. Notification Badge (Count)

```typescript
// src/app/shared/components/notification-badge/notification-badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge numérico para notificaciones (ej: contador de mensajes).
 */
@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block">
      <ng-content></ng-content>

      @if (count > 0) {
        <span
          [class]="badgeClasses"
          [attr.aria-label]="count + ' notifications'"
        >
          {{ displayCount }}
        </span>
      }
    </div>
  `
})
export class NotificationBadgeComponent {
  @Input() count = 0;
  @Input() max = 99;
  @Input() dot = false;

  get displayCount(): string {
    if (this.dot) return '';
    return this.count > this.max ? `${this.max}+` : this.count.toString();
  }

  get badgeClasses(): string {
    const base = 'absolute -top-1 -right-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full';
    const size = this.dot ? 'h-2 w-2' : 'h-5 min-w-[1.25rem] px-1';
    return `${base} ${size}`;
  }
}
```

### Ejemplo de uso

```typescript
<app-notification-badge [count]="unreadCount">
  <button class="relative p-2">
    <svg><!-- Bell icon --></svg>
  </button>
</app-notification-badge>
```

## Resumen

Componentes de feedback incluidos:
- **Alert**: Mensajes inline con variantes y dismiss
- **Toast**: Notificaciones temporales (servicio + componente)
- **Progress**: Barras de progreso con variantes y animaciones
- **Skeleton**: Loading placeholders
- **Notification Badge**: Contador de notificaciones

Todos con soporte de dark mode, animaciones, accessibility y TypeScript tipado.
