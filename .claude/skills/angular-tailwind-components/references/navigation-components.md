# Navigation Components - Tabs, Accordion, Navbar, Sidebar, Breadcrumbs

Componentes de navegación para estructurar la UI y mejorar UX.

## 1. Tabs Component

```typescript
// src/app/shared/components/tabs/tabs.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * Tabs component con navegación por teclado.
 *
 * @example
 * <app-tabs [tabs]="tabs" [(activeTabId)]="activeTab">
 *   <div *ngFor="let tab of tabs" [attr.data-tab-id]="tab.id">
 *     Content for {{ tab.label }}
 *   </div>
 * </app-tabs>
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <!-- Tab Headers -->
      <div
        class="border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        [attr.aria-orientation]="orientation"
      >
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              [id]="'tab-' + tab.id"
              role="tab"
              [attr.aria-selected]="activeTabId === tab.id"
              [attr.aria-controls]="'panel-' + tab.id"
              [disabled]="tab.disabled"
              [class]="getTabClasses(tab)"
              (click)="selectTab(tab.id)"
              (keydown)="handleKeyDown($event, tab.id)"
              tabindex="{{activeTabId === tab.id ? 0 : -1}}"
            >
              @if (tab.icon) {
                <span [innerHTML]="tab.icon" class="mr-2"></span>
              }
              {{ tab.label }}
            </button>
          }
        </nav>
      </div>

      <!-- Tab Panels -->
      <div class="mt-4">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class TabsComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId = '';
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  @Output() activeTabIdChange = new EventEmitter<string>();
  @Output() tabChanged = new EventEmitter<string>();

  selectTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      this.activeTabId = tabId;
      this.activeTabIdChange.emit(tabId);
      this.tabChanged.emit(tabId);
    }
  }

  handleKeyDown(event: KeyboardEvent, currentTabId: string): void {
    const currentIndex = this.tabs.findIndex(t => t.id === currentTabId);
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % this.tabs.length;
        this.focusTab(this.tabs[nextIndex].id);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? this.tabs.length - 1 : currentIndex - 1;
        this.focusTab(this.tabs[nextIndex].id);
        break;
      case 'Home':
        event.preventDefault();
        this.focusTab(this.tabs[0].id);
        break;
      case 'End':
        event.preventDefault();
        this.focusTab(this.tabs[this.tabs.length - 1].id);
        break;
    }
  }

  private focusTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      this.selectTab(tabId);
      setTimeout(() => {
        document.getElementById('tab-' + tabId)?.focus();
      });
    }
  }

  getTabClasses(tab: Tab): string {
    const base = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors';
    const active = this.activeTabId === tab.id
      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300';
    const disabled = tab.disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    return `${base} ${active} ${disabled}`;
  }
}
```

### Tab Panel Component

```typescript
// src/app/shared/components/tabs/tab-panel.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tab panel component. Usar con TabsComponent.
 */
@Component({
  selector: 'app-tab-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (active) {
      <div
        [id]="'panel-' + tabId"
        role="tabpanel"
        [attr.aria-labelledby]="'tab-' + tabId"
        tabindex="0"
      >
        <ng-content></ng-content>
      </div>
    }
  `
})
export class TabPanelComponent {
  @Input() tabId = '';
  @Input() active = false;
}
```

### Ejemplo de uso

```typescript
export class MyComponent {
  tabs: Tab[] = [
    { id: 'profile', label: 'Profile', icon: '<svg>...</svg>' },
    { id: 'settings', label: 'Settings' },
    { id: 'notifications', label: 'Notifications', disabled: true }
  ];

  activeTab = 'profile';
}

// Template
<app-tabs [tabs]="tabs" [(activeTabId)]="activeTab">
  <app-tab-panel [tabId]="'profile'" [active]="activeTab === 'profile'">
    <p>Profile content...</p>
  </app-tab-panel>

  <app-tab-panel [tabId]="'settings'" [active]="activeTab === 'settings'">
    <p>Settings content...</p>
  </app-tab-panel>

  <app-tab-panel [tabId]="'notifications'" [active]="activeTab === 'notifications'">
    <p>Notifications content...</p>
  </app-tab-panel>
</app-tabs>
```

## 2. Accordion Component

```typescript
// src/app/shared/components/accordion/accordion.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  disabled?: boolean;
}

/**
 * Accordion component con múltiples items expandibles.
 *
 * @example
 * <app-accordion [items]="items" [allowMultiple]="false">
 *   <ng-template #itemContent let-item>
 *     Custom content for {{ item.title }}
 *   </ng-template>
 * </app-accordion>
 */
@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('expandCollapse', [
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
    <div class="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
      @for (item of items; track item.id) {
        <div>
          <!-- Header -->
          <button
            type="button"
            [id]="'accordion-header-' + item.id"
            [attr.aria-expanded]="isExpanded(item.id)"
            [attr.aria-controls]="'accordion-content-' + item.id"
            [disabled]="item.disabled"
            (click)="toggle(item.id)"
            class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="font-medium text-gray-900 dark:text-white">
              {{ item.title }}
            </span>

            <!-- Chevron icon -->
            <svg
              class="w-5 h-5 text-gray-500 transition-transform"
              [class.rotate-180]="isExpanded(item.id)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Content -->
          @if (isExpanded(item.id)) {
            <div
              [id]="'accordion-content-' + item.id"
              role="region"
              [attr.aria-labelledby]="'accordion-header-' + item.id"
              @expandCollapse
            >
              <div class="p-4 pt-0 text-gray-700 dark:text-gray-300">
                @if (item.content) {
                  <p>{{ item.content }}</p>
                }
                <ng-content [select]="'[data-item-id=' + item.id + ']'"></ng-content>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AccordionComponent {
  @Input() items: AccordionItem[] = [];
  @Input() allowMultiple = false;

  private expandedIds = signal<Set<string>>(new Set());

  isExpanded(itemId: string): boolean {
    return this.expandedIds().has(itemId);
  }

  toggle(itemId: string): void {
    const item = this.items.find(i => i.id === itemId);
    if (item?.disabled) return;

    this.expandedIds.update(ids => {
      const newIds = new Set(ids);

      if (newIds.has(itemId)) {
        newIds.delete(itemId);
      } else {
        if (!this.allowMultiple) {
          newIds.clear();
        }
        newIds.add(itemId);
      }

      return newIds;
    });
  }
}
```

### Ejemplo de uso

```typescript
items: AccordionItem[] = [
  { id: '1', title: 'What is Angular?', content: 'Angular is a platform...' },
  { id: '2', title: 'What is Tailwind CSS?', content: 'Tailwind is a utility-first...' },
  { id: '3', title: 'How to combine them?', disabled: true }
];

// Con contenido personalizado
<app-accordion [items]="items" [allowMultiple]="true">
  <div data-item-id="1">
    <p>Custom content for item 1</p>
  </div>
</app-accordion>
```

## 3. Navbar Component

```typescript
// src/app/shared/components/navbar/navbar.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  route?: string;
  icon?: string;
  children?: NavItem[];
}

/**
 * Responsive navbar con dropdown support.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a [routerLink]="logoRoute" class="flex-shrink-0 flex items-center">
              @if (logo) {
                <img [src]="logo" alt="Logo" class="h-8 w-auto">
              } @else {
                <span class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ brandName }}
                </span>
              }
            </a>

            <!-- Desktop menu -->
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              @for (item of items; track item.label) {
                @if (!item.children) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="border-blue-500 text-gray-900 dark:text-white"
                    [routerLinkActiveOptions]="{exact: false}"
                    class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white transition-colors"
                  >
                    @if (item.icon) {
                      <span [innerHTML]="item.icon" class="mr-1"></span>
                    }
                    {{ item.label }}
                  </a>
                }
              }
            </div>
          </div>

          <!-- Right side (actions) -->
          <div class="hidden md:flex md:items-center md:space-x-4">
            <ng-content select="[actions]"></ng-content>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center md:hidden">
            <button
              type="button"
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              aria-label="Toggle mobile menu"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (mobileMenuOpen()) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      @if (mobileMenuOpen()) {
        <div class="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div class="pt-2 pb-3 space-y-1">
            @for (item of items; track item.label) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {{ item.label }}
              </a>
            }
          </div>

          <div class="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <ng-content select="[mobile-actions]"></ng-content>
          </div>
        </div>
      }
    </nav>
  `
})
export class NavbarComponent {
  @Input() items: NavItem[] = [];
  @Input() logo?: string;
  @Input() brandName = 'MyApp';
  @Input() logoRoute = '/';

  mobileMenuOpen = signal(false);
}
```

### Ejemplo de uso

```typescript
navItems: NavItem[] = [
  { label: 'Home', route: '/home' },
  { label: 'Products', route: '/products' },
  { label: 'About', route: '/about' }
];

<app-navbar [items]="navItems" brandName="MyApp">
  <div actions class="flex items-center space-x-4">
    <button class="btn-primary">Sign In</button>
  </div>

  <div mobile-actions class="px-4">
    <button class="w-full btn-primary">Sign In</button>
  </div>
</app-navbar>
```

## 4. Sidebar Component

```typescript
// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarItem {
  label: string;
  route?: string;
  icon?: string;
  badge?: string;
  children?: SidebarItem[];
}

/**
 * Sidebar navigation con collapse/expand.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      [class]="sidebarClasses"
      [attr.aria-label]="ariaLabel"
    >
      <div class="h-full flex flex-col">
        <!-- Header -->
        @if (header) {
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <ng-content select="[header]"></ng-content>

            @if (collapsible) {
              <button
                type="button"
                (click)="toggleCollapsed()"
                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle sidebar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            }
          </div>
        }

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
          @for (item of items; track item.label) {
            <div>
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                [routerLinkActiveOptions]="{exact: false}"
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                @if (item.icon) {
                  <span [innerHTML]="item.icon" class="mr-3 flex-shrink-0 h-5 w-5"></span>
                }

                @if (!collapsed()) {
                  <span class="flex-1">{{ item.label }}</span>

                  @if (item.badge) {
                    <span class="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {{ item.badge }}
                    </span>
                  }
                }
              </a>

              @if (item.children && !collapsed()) {
                <div class="ml-8 mt-1 space-y-1">
                  @for (child of item.children; track child.label) {
                    <a
                      [routerLink]="child.route"
                      routerLinkActive="text-blue-700 dark:text-blue-400"
                      class="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {{ child.label }}
                    </a>
                  }
                </div>
              }
            </div>
          }
        </nav>

        <!-- Footer -->
        @if (footer) {
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <ng-content select="[footer]"></ng-content>
          </div>
        }
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Input() collapsible = true;
  @Input() ariaLabel = 'Sidebar navigation';

  @Output() collapsedChange = new EventEmitter<boolean>();

  collapsed = signal(false);
  header = true;
  footer = true;

  get sidebarClasses(): string {
    const base = 'flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300';
    const width = this.collapsed() ? 'w-16' : 'w-64';
    return `${base} ${width}`;
  }

  toggleCollapsed(): void {
    this.collapsed.update(val => !val);
    this.collapsedChange.emit(this.collapsed());
  }
}
```

### Ejemplo de uso

```typescript
sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: '<svg>...</svg>'
  },
  {
    label: 'Products',
    route: '/products',
    icon: '<svg>...</svg>',
    badge: '12',
    children: [
      { label: 'All Products', route: '/products/all' },
      { label: 'Categories', route: '/products/categories' }
    ]
  }
];

<app-sidebar [items]="sidebarItems">
  <div header>
    <h2 class="text-lg font-semibold">MyApp</h2>
  </div>

  <div footer>
    <button class="w-full btn-ghost">Logout</button>
  </div>
</app-sidebar>
```

## 5. Breadcrumbs Component

```typescript
// src/app/shared/components/breadcrumbs/breadcrumbs.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  label: string;
  route?: string;
  icon?: string;
}

/**
 * Breadcrumbs navigation component.
 */
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav aria-label="Breadcrumb" class="flex">
      <ol class="flex items-center space-x-2">
        @for (crumb of breadcrumbs; track $index; let isLast = $last) {
          <li class="flex items-center">
            @if (!isLast && crumb.route) {
              <a
                [routerLink]="crumb.route"
                class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                @if (crumb.icon) {
                  <span [innerHTML]="crumb.icon" class="mr-1"></span>
                }
                {{ crumb.label }}
              </a>
            } @else {
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300" aria-current="page">
                {{ crumb.label }}
              </span>
            }

            @if (!isLast) {
              <svg
                class="flex-shrink-0 h-5 w-5 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
            }
          </li>
        }
      </ol>
    </nav>
  `
})
export class BreadcrumbsComponent {
  @Input() breadcrumbs: Breadcrumb[] = [];
}
```

### Ejemplo de uso

```typescript
breadcrumbs: Breadcrumb[] = [
  { label: 'Home', route: '/' },
  { label: 'Products', route: '/products' },
  { label: 'Electronics', route: '/products/electronics' },
  { label: 'Laptop' } // Current page (no route)
];

<app-breadcrumbs [breadcrumbs]="breadcrumbs"></app-breadcrumbs>
```

## Resumen

Componentes de navegación incluidos:
- **Tabs**: Navegación por pestañas con keyboard support
- **Accordion**: Items expandibles/colapsables
- **Navbar**: Barra de navegación responsive con mobile menu
- **Sidebar**: Navegación lateral con collapse y nested items
- **Breadcrumbs**: Navegación de ruta (migas de pan)

Todos con routing de Angular, accessibility (ARIA), dark mode y responsive design.
