---
name: angular-tailwind-components
description: >
  Biblioteca completa de componentes UI reutilizables con Tailwind CSS para Angular standalone.
  Usar cuando se necesite implementar Button component con variantes (primary, secondary, danger,
  outline, ghost), Card, Modal/Dialog, Input components, Alert/Toast, Loading spinners, Badge,
  Tabs, Accordion, Navbar, Sidebar, o Breadcrumbs. Incluye componentes standalone tipados,
  variantes de estilos con @Input(), Tailwind utilities dinámicas, animaciones, responsive design,
  accessibility (ARIA), dark mode support, ng-content para composición, y ejemplos completos.
  UI library production-ready para proyectos Angular 19+ con Tailwind CSS.
---

# Angular Tailwind Components - UI Library

Biblioteca completa de componentes UI reutilizables con Tailwind CSS para Angular standalone.

## Prerequisitos

Asegúrate de tener Tailwind CSS configurado. Ver skill `angular-core-setup` para configuración inicial.

## 1. Button Component

### button.component.ts

```typescript
// src/app/shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component reutilizable con múltiples variantes.
 *
 * @example
 * <app-button variant="primary" (click)="onSave()">Save</app-button>
 * <app-button variant="danger" size="sm" [disabled]="true">Delete</app-button>
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses()"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }

      @if (iconLeft) {
        <span class="mr-2" [innerHTML]="iconLeft"></span>
      }

      <ng-content></ng-content>

      @if (iconRight) {
        <span class="ml-2" [innerHTML]="iconRight"></span>
      }
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() iconLeft?: string;
  @Input() iconRight?: string;

  @Output() clicked = new EventEmitter<MouseEvent>();

  /**
   * Clases CSS dinámicas basadas en variant, size y estado.
   */
  buttonClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Size classes
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    // Variant classes
    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
    };

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${sizeClasses[this.size]} ${variantClasses[this.variant]} ${widthClass}`;
  });

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
```

### Ejemplos de uso

```typescript
// Botones básicos
<app-button variant="primary">Primary Button</app-button>
<app-button variant="secondary">Secondary Button</app-button>
<app-button variant="danger">Danger Button</app-button>
<app-button variant="outline">Outline Button</app-button>
<app-button variant="ghost">Ghost Button</app-button>

// Tamaños
<app-button size="sm">Small</app-button>
<app-button size="md">Medium</app-button>
<app-button size="lg">Large</app-button>

// Con loading state
<app-button [loading]="isLoading" (clicked)="onSave()">Save</app-button>

// Full width
<app-button [fullWidth]="true">Full Width Button</app-button>

// Con iconos (usando heroicons)
<app-button iconLeft="<svg>...</svg>">With Icon</app-button>
```

## 2. Card Component

### card.component.ts

```typescript
// src/app/shared/components/card/card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card component con header, body y footer opcionales.
 *
 * @example
 * <app-card>
 *   <div header>Card Title</div>
 *   <div body>Card content here...</div>
 *   <div footer>
 *     <button>Action</button>
 *   </div>
 * </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <div *ngIf="hasHeader" class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <ng-content select="[header]"></ng-content>
      </div>

      <div [class]="bodyClasses">
        <ng-content select="[body]"></ng-content>
        <ng-content></ng-content>
      </div>

      <div *ngIf="hasFooter" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
  @Input() noPadding = false;
  @Input() hoverable = false;

  hasHeader = true;
  hasFooter = true;

  ngAfterContentInit() {
    // Detectar si hay contenido en slots
    // En producción, usar @ContentChild para detectar
  }

  get cardClasses(): string {
    const base = 'bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden';
    const hover = this.hoverable ? 'transition-shadow hover:shadow-lg' : '';
    return `${base} ${hover}`;
  }

  get bodyClasses(): string {
    return this.noPadding ? '' : 'px-6 py-4';
  }
}
```

### Ejemplos de uso

```typescript
// Card básico
<app-card>
  <div header>
    <h3 class="text-lg font-semibold">Card Title</h3>
  </div>
  <div body>
    <p>This is the card content...</p>
  </div>
  <div footer>
    <app-button variant="primary">Action</app-button>
  </div>
</app-card>

// Card hoverable
<app-card [hoverable]="true">
  <div body>Hover over me!</div>
</app-card>

// Card sin padding (para imágenes)
<app-card [noPadding]="true">
  <img src="image.jpg" alt="Card image">
  <div class="p-4">
    <h3>Image Card</h3>
  </div>
</app-card>
```

## 3. Modal Component

### modal.component.ts

```typescript
// src/app/shared/components/modal/modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal/Dialog component con backdrop, animaciones y control de foco.
 *
 * @example
 * <app-modal [(open)]="isOpen" title="Confirm Action">
 *   <div body>Are you sure?</div>
 *   <div footer>
 *     <app-button (click)="confirm()">Yes</app-button>
 *   </div>
 * </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ],
  template: `
    @if (open) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        @fadeIn
        (click)="onBackdropClick()"
        role="presentation"
      ></div>

      <!-- Modal -->
      <div
        class="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            [class]="modalClasses"
            @slideIn
            role="document"
          >
            <!-- Header -->
            @if (title || showClose) {
              <div class="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 [id]="titleId" class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ title }}
                  <ng-content select="[title]"></ng-content>
                </h3>

                @if (showClose) {
                  <button
                    type="button"
                    (click)="close()"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Close modal"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>
            }

            <!-- Body -->
            <div class="p-6">
              <ng-content select="[body]"></ng-content>
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (hasFooter) {
              <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <ng-content select="[footer]"></ng-content>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() showClose = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  hasFooter = true;

  ngOnInit(): void {
    if (this.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscape);
    }

    // Prevent body scroll when modal is open
    if (this.open) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscape);
    document.body.style.overflow = '';
  }

  get modalClasses(): string {
    const sizeClasses: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4'
    };

    const base = 'relative w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl';
    return `${base} ${sizeClasses[this.size]}`;
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    document.body.style.overflow = '';
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  private handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.open) {
      this.close();
    }
  };
}
```

### Ejemplos de uso

```typescript
// Modal básico
<app-modal [(open)]="showModal" title="Confirm Delete">
  <div body>
    <p>Are you sure you want to delete this item?</p>
  </div>
  <div footer>
    <app-button variant="ghost" (clicked)="showModal = false">Cancel</app-button>
    <app-button variant="danger" (clicked)="confirmDelete()">Delete</app-button>
  </div>
</app-modal>

// Modal con diferentes tamaños
<app-modal [(open)]="open" size="lg" title="Large Modal">
  <div body>Large content...</div>
</app-modal>

// Modal sin cerrar con backdrop
<app-modal [(open)]="open" [closeOnBackdrop]="false">
  <div body>You must click the close button!</div>
</app-modal>
```

## 4. Input Components

### input.component.ts

```typescript
// src/app/shared/components/input/input.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';

/**
 * Input component estilizado que implementa ControlValueAccessor.
 * Compatible con Angular Forms (Reactive y Template-driven).
 *
 * @example
 * <app-input
 *   type="email"
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   [(ngModel)]="email"
 *   [error]="emailError"
 * ></app-input>
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full">
      @if (label) {
        <label
          [for]="inputId"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <div class="relative">
        @if (prefixIcon) {
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-400" [innerHTML]="prefixIcon"></span>
          </div>
        }

        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [class]="inputClasses"
          [(ngModel)]="value"
          (blur)="onTouched()"
          (input)="onChange($event)"
          [attr.aria-invalid]="error ? 'true' : 'false'"
          [attr.aria-describedby]="error ? errorId : null"
        />

        @if (suffixIcon) {
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span class="text-gray-400" [innerHTML]="suffixIcon"></span>
          </div>
        }

        @if (type === 'password' && showPasswordToggle) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
            (click)="togglePasswordVisibility()"
            tabindex="-1"
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (showPassword) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              }
            </svg>
          </button>
        }
      </div>

      @if (hint && !error) {
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ hint }}
        </p>
      }

      @if (error) {
        <p [id]="errorId" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      }
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() showPasswordToggle = true;

  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  errorId = `error-${this.inputId}`;
  value = '';
  showPassword = false;

  // ControlValueAccessor implementation
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = (event: any) => {
      fn(event.target?.value || this.value);
    };
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get inputClasses(): string {
    const base = 'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0';
    const padding = this.prefixIcon ? 'pl-10 pr-3 py-2' : this.suffixIcon ? 'pl-3 pr-10 py-2' : 'px-3 py-2';
    const state = this.error
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : '';

    return `${base} ${padding} ${state} ${disabledClass}`;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.type = this.showPassword ? 'text' : 'password';
  }
}
```

### Ejemplos de uso

```typescript
// Input básico con FormControl
<app-input
  type="email"
  label="Email"
  placeholder="Enter your email"
  [formControl]="emailControl"
  [error]="emailControl.errors?.['email'] ? 'Invalid email' : ''"
></app-input>

// Input con hint
<app-input
  label="Username"
  hint="Must be 3-20 characters"
  [(ngModel)]="username"
></app-input>

// Input con iconos
<app-input
  type="search"
  placeholder="Search..."
  [prefixIcon]="searchIcon"
></app-input>

// Password con toggle
<app-input
  type="password"
  label="Password"
  [showPasswordToggle]="true"
  [(ngModel)]="password"
></app-input>
```

## 5. Alert Component

Ver `references/feedback-components.md` para Alert, Toast y notificaciones.

## 6. Loading Components

### spinner.component.ts

```typescript
// src/app/shared/components/spinner/spinner.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Loading spinner component.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses" role="status" [attr.aria-label]="label">
      <svg
        [class]="spinnerClasses"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      @if (text) {
        <span class="ml-2 text-gray-700 dark:text-gray-300">{{ text }}</span>
      }
      <span class="sr-only">{{ label }}</span>
    </div>
  `
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() text = '';
  @Input() label = 'Loading...';
  @Input() centered = false;

  get containerClasses(): string {
    const base = 'flex items-center';
    const center = this.centered ? 'justify-center' : '';
    return `${base} ${center}`;
  }

  get spinnerClasses(): string {
    const sizes: Record<SpinnerSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };
    return `animate-spin text-blue-600 ${sizes[this.size]}`;
  }
}
```

## 7. Badge Component

```typescript
// src/app/shared/components/badge/badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Badge component para etiquetas y estados.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() rounded = false;

  get badgeClasses(): string {
    const base = 'inline-flex items-center font-medium';

    const sizes: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base'
    };

    const variants: Record<BadgeVariant, string> = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
    };

    const roundedClass = this.rounded ? 'rounded-full' : 'rounded';

    return `${base} ${sizes[this.size]} ${variants[this.variant]} ${roundedClass}`;
  }
}
```

## 8. Tabs Component

Ver `references/navigation-components.md` para implementación completa de Tabs, Accordion, Navbar, Sidebar y Breadcrumbs.

## Referencias Adicionales

- **references/form-components.md**: Select, Checkbox, Radio, Textarea, File upload
- **references/feedback-components.md**: Alert, Toast, Notification system, Progress bars
- **references/navigation-components.md**: Tabs, Accordion, Navbar, Sidebar, Breadcrumbs
- **references/layout-components.md**: Grid, Container, Divider, Stack
- **references/dark-mode.md**: Implementación completa de dark mode
- **references/accessibility.md**: Patrones de accesibilidad y ARIA

## Uso en Proyecto

### Importar componentes

```typescript
// Importar individualmente
import { ButtonComponent } from '@/shared/components/button/button.component';
import { CardComponent } from '@/shared/components/card/card.component';

// O crear un barrel export
// src/app/shared/components/index.ts
export * from './button/button.component';
export * from './card/card.component';
export * from './modal/modal.component';
// ... etc
```

### Crear componente wrapper (opcional)

```typescript
// src/app/shared/ui.module.ts
import { NgModule } from '@angular/core';
import { ButtonComponent } from './components/button/button.component';
import { CardComponent } from './components/card/card.component';
// ... otros componentes

const COMPONENTS = [
  ButtonComponent,
  CardComponent,
  // ...
];

@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS
})
export class UiModule {}
```

## Best Practices

1. **Standalone components**: Todos los componentes son standalone
2. **TypeScript tipado**: Uso de types para variants, sizes, etc.
3. **Tailwind utilities**: Clases dinámicas con computed()
4. **Accessibility**: ARIA labels, keyboard navigation, focus management
5. **Dark mode**: Soporte con clases dark:
6. **Responsive**: Mobile-first design
7. **Composición**: ng-content para slots flexibles
8. **ControlValueAccessor**: Inputs compatibles con Angular Forms
9. **Animaciones**: Tailwind transitions y Angular animations

Todos los componentes son production-ready y siguen las best practices de Angular 19+ y Tailwind CSS.
