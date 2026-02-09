# Advanced Responsive Patterns

## 1. Mobile Drawer with Animation

```typescript
// mobile-drawer.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-mobile-drawer',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      state('closed', style({
        transform: 'translateX(-100%)'
      })),
      state('open', style({
        transform: 'translateX(0)'
      })),
      transition('closed <=> open', animate('300ms ease-in-out'))
    ]),
    trigger('backdrop', [
      state('void', style({
        opacity: 0
      })),
      state('*', style({
        opacity: 1
      })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div
        @backdrop
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        (click)="close.emit()"
      ></div>

      <!-- Drawer -->
      <aside
        @slideIn
        class="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold">Menu</h2>
          <button
            (click)="close.emit()"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-4">
          <ng-content></ng-content>
        </div>
      </aside>
    }
  `
})
export class MobileDrawerComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
}
```

## 2. Responsive Table Pattern

```typescript
// responsive-table.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointService } from '@core/services/breakpoint.service';

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  hidden?: 'mobile' | 'tablet';
}

@Component({
  selector: 'app-responsive-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (breakpoint.isMobile()) {
      <!-- Mobile: Card view -->
      <div class="space-y-4">
        @for (item of data; track item[trackBy]) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            @for (column of visibleColumns(); track column.key) {
              <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span class="font-medium text-gray-600 dark:text-gray-400">{{ column.label }}</span>
                <span class="text-gray-900 dark:text-white">{{ item[column.key] }}</span>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <!-- Desktop: Table view -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              @for (column of visibleColumns(); track column.key) {
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ column.label }}
                </th>
              }
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            @for (item of data; track item[trackBy]) {
              <tr>
                @for (column of visibleColumns(); track column.key) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ item[column.key] }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class ResponsiveTableComponent<T extends Record<string, any>> {
  protected breakpoint = inject(BreakpointService);

  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() trackBy: keyof T = 'id' as keyof T;

  visibleColumns = computed(() => {
    const isMobile = this.breakpoint.isMobile();
    const isTablet = this.breakpoint.isTablet();

    return this.columns.filter(col => {
      if (col.hidden === 'mobile' && isMobile) return false;
      if (col.hidden === 'tablet' && isTablet) return false;
      return true;
    });
  });
}
```

## 3. Responsive Modal with Position

```typescript
// responsive-modal.component.ts
import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointService } from '@core/services/breakpoint.service';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-responsive-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        (click)="onBackdropClick()"
      ></div>

      <!-- Modal -->
      <div
        [class]="modalClasses()"
        class="fixed z-50 bg-white dark:bg-gray-800 shadow-xl transition-all"
      >
        <!-- Header -->
        @if (title) {
          <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
            <button
              (click)="close.emit()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }

        <!-- Content -->
        <div class="p-4 sm:p-6 overflow-y-auto" [style.max-height]="maxContentHeight()">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <ng-content select="[modalFooter]"></ng-content>
        </div>
      </div>
    }
  `
})
export class ResponsiveModalComponent {
  private breakpoint = inject(BreakpointService);

  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: ModalSize = 'md';
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();

  modalClasses = computed(() => {
    const isMobile = this.breakpoint.isMobile();

    if (isMobile) {
      // Mobile: Full screen from bottom
      return 'bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh]';
    }

    // Desktop: Centered with size
    const sizeClasses: Record<ModalSize, string> = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    };

    return `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl ${sizeClasses[this.size]} w-full`;
  });

  maxContentHeight = computed(() => {
    return this.breakpoint.isMobile() ? 'calc(90vh - 200px)' : 'calc(90vh - 160px)';
  });

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close.emit();
    }
  }
}
```

## 4. Adaptive Navigation Tabs

```typescript
// adaptive-tabs.component.ts
import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointService } from '@core/services/breakpoint.service';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-adaptive-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (breakpoint.isMobile()) {
      <!-- Mobile: Dropdown select -->
      <div class="relative">
        <select
          [value]="activeTab()"
          (change)="selectTab($any($event.target).value)"
          class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none cursor-pointer"
        >
          @for (tab of tabs; track tab.id) {
            <option [value]="tab.id">{{ tab.label }}</option>
          }
        </select>
        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    } @else {
      <!-- Desktop: Tab buttons -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex space-x-8" aria-label="Tabs">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="selectTab(tab.id)"
              [class.border-blue-500]="activeTab() === tab.id"
              [class.text-blue-600]="activeTab() === tab.id"
              [class.border-transparent]="activeTab() !== tab.id"
              [class.text-gray-500]="activeTab() !== tab.id"
              class="border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-blue-600 hover:border-blue-300 whitespace-nowrap"
            >
              @if (tab.icon) {
                <span [innerHTML]="tab.icon" class="inline-block w-5 h-5 mr-2"></span>
              }
              {{ tab.label }}
            </button>
          }
        </nav>
      </div>
    }

    <!-- Tab content -->
    <div class="mt-6">
      <ng-content [select]="'[tab-' + activeTab() + ']'"></ng-content>
    </div>
  `
})
export class AdaptiveTabsComponent {
  protected breakpoint = inject(BreakpointService);

  @Input() tabs: Tab[] = [];
  public activeTab = signal<string>('');

  ngOnInit(): void {
    if (this.tabs.length > 0 && !this.activeTab()) {
      this.activeTab.set(this.tabs[0].id);
    }
  }

  selectTab(id: string): void {
    this.activeTab.set(id);
  }
}
```

## 5. Responsive Form Layout

```typescript
// responsive-form.component.ts
@Component({
  selector: 'app-responsive-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
      <!-- Single column on mobile, two columns on desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name
          </label>
          <input
            type="text"
            formControlName="firstName"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name
          </label>
          <input
            type="text"
            formControlName="lastName"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Full width fields -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          formControlName="email"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Actions: Stack on mobile, inline on desktop -->
      <div class="flex flex-col sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors order-2 sm:order-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 sm:order-2"
        >
          Submit
        </button>
      </div>
    </form>
  `
})
export class ResponsiveFormComponent {
  form = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl('')
  });

  onSubmit(): void {
    console.log(this.form.value);
  }
}
```

## 6. Progressive Image Loading

```typescript
// progressive-image.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progressive-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative overflow-hidden" [class]="containerClass">
      <!-- Blur placeholder -->
      @if (!loaded() && placeholder) {
        <img
          [src]="placeholder"
          [alt]="alt"
          class="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
        />
      }

      <!-- Loading skeleton -->
      @if (!loaded() && !placeholder) {
        <div class="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      }

      <!-- Main image -->
      <img
        [src]="src"
        [alt]="alt"
        [loading]="lazy ? 'lazy' : 'eager'"
        (load)="onLoad()"
        [class.opacity-0]="!loaded()"
        [class.opacity-100]="loaded()"
        class="relative w-full h-full object-cover transition-opacity duration-500"
      />
    </div>
  `
})
export class ProgressiveImageComponent {
  @Input() src!: string;
  @Input() placeholder?: string; // Low-res placeholder
  @Input() alt!: string;
  @Input() lazy = true;
  @Input() containerClass = 'aspect-video';

  protected loaded = signal(false);

  onLoad(): void {
    this.loaded.set(true);
  }
}
```

## 7. Scroll-to-Top Button

```typescript
// scroll-to-top.component.ts
import { Component, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, throttleTime } from 'rxjs';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible()) {
      <button
        (click)="scrollToTop()"
        class="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110"
        aria-label="Scroll to top"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    }
  `
})
export class ScrollToTopComponent {
  private destroyRef = inject(DestroyRef);
  protected isVisible = signal(false);

  constructor() {
    fromEvent(window, 'scroll')
      .pipe(
        throttleTime(200),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isVisible.set(window.scrollY > 300);
      });
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
```

## 8. Responsive Video Player

```typescript
// responsive-video.component.ts
@Component({
  selector: 'app-responsive-video',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative" [class]="aspectRatioClass">
      <video
        [src]="src"
        [poster]="poster"
        [controls]="controls"
        [autoplay]="autoplay"
        [muted]="muted"
        [loop]="loop"
        class="absolute inset-0 w-full h-full object-cover rounded-lg"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  `
})
export class ResponsiveVideoComponent {
  @Input() src!: string;
  @Input() poster?: string;
  @Input() aspectRatio: '16/9' | '4/3' | '1/1' = '16/9';
  @Input() controls = true;
  @Input() autoplay = false;
  @Input() muted = false;
  @Input() loop = false;

  get aspectRatioClass(): string {
    const ratios = {
      '16/9': 'aspect-video',
      '4/3': 'aspect-4/3',
      '1/1': 'aspect-square'
    };
    return ratios[this.aspectRatio];
  }
}
```

## Best Practices Summary

1. **Performance:**
   - Use `OnPush` change detection
   - Lazy load images and components
   - Debounce/throttle resize events
   - Use `trackBy` in `@for` loops

2. **Accessibility:**
   - Semantic HTML elements
   - ARIA labels and roles
   - Keyboard navigation support
   - Focus management

3. **Mobile-First:**
   - Start with mobile styles
   - Progressive enhancement
   - Touch-friendly targets (min 44x44px)
   - Test on real devices

4. **Code Quality:**
   - Type-safe components with generics
   - Reusable, configurable components
   - Proper separation of concerns
   - Consistent naming conventions
