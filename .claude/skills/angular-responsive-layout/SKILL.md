---
name: angular-responsive-layout
description: >
  Sistema completo de layouts responsive para Angular standalone con Tailwind CSS.
  Usar cuando se necesite implementar MainLayoutComponent (header, sidebar, content, footer),
  NavbarComponent responsive (desktop/mobile), SidebarComponent con collapse/expand,
  BottomNavComponent para mobile, BreakpointService con signals (isMobile, isTablet, isDesktop),
  HamburgerMenuComponent animado, ResponsiveDirective para mostrar/ocultar por breakpoint,
  Grid layouts (dashboard, cards, lists), Mobile drawer con backdrop, Sticky header/footer,
  Responsive typography, Container utilities, Breadcrumbs responsive, Footer responsive,
  o cualquier funcionalidad relacionada con diseño responsive mobile-first. Incluye componentes
  standalone con Tailwind, breakpoint detection service, responsive utilities, animaciones,
  dark mode support, accessibility (ARIA), y ejemplos de layouts completos (dashboard, landing, admin)
  para proyectos Angular 19+ production-ready.
---

# Angular Responsive Layout - Complete Layout System

Sistema completo de layouts responsive con diseño mobile-first para Angular standalone y Tailwind CSS.

## Prerequisitos

Asegúrate de tener Tailwind CSS configurado. Ver skill `angular-core-setup` para configuración inicial.

**Breakpoints personalizados en `tailwind.config.js`:**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',   // mobile
      'md': '768px',   // tablet
      'lg': '1024px',  // desktop
      'xl': '1280px',  // large desktop
      '2xl': '1536px'  // extra large
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    }
  }
}
```

## 1. BreakpointService - Detección de Viewport con Signals

### breakpoint.service.ts

```typescript
// src/app/core/services/breakpoint.service.ts
import { Injectable, signal, computed, effect, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, debounceTime, startWith } from 'rxjs';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

/**
 * Service para detección de breakpoints responsive con signals.
 *
 * @example
 * constructor(private breakpoint: BreakpointService) {
 *   effect(() => {
 *     if (this.breakpoint.isMobile()) {
 *       console.log('Mobile view');
 *     }
 *   });
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  private destroyRef = inject(DestroyRef);

  // Breakpoint configuration matching Tailwind defaults
  private readonly breakpoints: BreakpointConfig = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };

  // Current window width (signal)
  public readonly width = signal<number>(this.getWindowWidth());

  // Current breakpoint (computed signal)
  public readonly currentBreakpoint = computed<Breakpoint>(() => {
    const w = this.width();
    if (w >= this.breakpoints['2xl']) return '2xl';
    if (w >= this.breakpoints.xl) return 'xl';
    if (w >= this.breakpoints.lg) return 'lg';
    if (w >= this.breakpoints.md) return 'md';
    if (w >= this.breakpoints.sm) return 'sm';
    return 'xs';
  });

  // Convenience computed signals
  public readonly isMobile = computed(() => {
    const bp = this.currentBreakpoint();
    return bp === 'xs' || bp === 'sm';
  });

  public readonly isTablet = computed(() => this.currentBreakpoint() === 'md');

  public readonly isDesktop = computed(() => {
    const bp = this.currentBreakpoint();
    return bp === 'lg' || bp === 'xl' || bp === '2xl';
  });

  public readonly isLargeDesktop = computed(() => {
    const bp = this.currentBreakpoint();
    return bp === 'xl' || bp === '2xl';
  });

  // Orientation signals
  public readonly isLandscape = signal<boolean>(this.checkLandscape());
  public readonly isPortrait = computed(() => !this.isLandscape());

  constructor() {
    this.setupResizeListener();
  }

  /**
   * Setup resize listener con debounce para performance.
   */
  private setupResizeListener(): void {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(150),
        startWith(null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.width.set(this.getWindowWidth());
        this.isLandscape.set(this.checkLandscape());
      });
  }

  private getWindowWidth(): number {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  }

  private checkLandscape(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false;
  }

  /**
   * Check if current breakpoint is >= specified breakpoint.
   */
  public isBreakpointOrLarger(breakpoint: Breakpoint): boolean {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = order.indexOf(this.currentBreakpoint());
    const targetIndex = order.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  }

  /**
   * Check if current breakpoint is <= specified breakpoint.
   */
  public isBreakpointOrSmaller(breakpoint: Breakpoint): boolean {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = order.indexOf(this.currentBreakpoint());
    const targetIndex = order.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  }
}
```

## 2. ResponsiveDirective - Show/Hide por Breakpoint

### responsive.directive.ts

```typescript
// src/app/shared/directives/responsive.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { BreakpointService, Breakpoint } from '@core/services/breakpoint.service';

/**
 * Directiva para mostrar/ocultar elementos basado en breakpoints.
 *
 * @example
 * <!-- Mostrar solo en mobile -->
 * <div *appResponsive="'mobile'">Mobile only</div>
 *
 * <!-- Mostrar solo en desktop -->
 * <div *appResponsive="'desktop'">Desktop only</div>
 *
 * <!-- Mostrar en tablet y desktop -->
 * <div *appResponsive="['tablet', 'desktop']">Tablet & Desktop</div>
 */
@Directive({
  selector: '[appResponsive]',
  standalone: true
})
export class ResponsiveDirective {
  private breakpointService = inject(BreakpointService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  @Input() set appResponsive(condition: 'mobile' | 'tablet' | 'desktop' | Breakpoint | Array<'mobile' | 'tablet' | 'desktop' | Breakpoint>) {
    effect(() => {
      const shouldShow = this.checkCondition(condition);

      if (shouldShow && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!shouldShow && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  private checkCondition(condition: 'mobile' | 'tablet' | 'desktop' | Breakpoint | Array<'mobile' | 'tablet' | 'desktop' | Breakpoint>): boolean {
    const conditions = Array.isArray(condition) ? condition : [condition];

    return conditions.some(cond => {
      switch (cond) {
        case 'mobile':
          return this.breakpointService.isMobile();
        case 'tablet':
          return this.breakpointService.isTablet();
        case 'desktop':
          return this.breakpointService.isDesktop();
        default:
          return this.breakpointService.currentBreakpoint() === cond;
      }
    });
  }
}
```

## 3. HamburgerMenuComponent - Animated Menu Icon

### hamburger-menu.component.ts

```typescript
// src/app/shared/components/hamburger-menu/hamburger-menu.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Hamburger menu icon animado con Tailwind.
 *
 * @example
 * <app-hamburger-menu
 *   [isOpen]="menuOpen"
 *   (toggle)="menuOpen = !menuOpen"
 * />
 */
@Component({
  selector: 'app-hamburger-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [attr.aria-label]="isOpen ? 'Close menu' : 'Open menu'"
      [attr.aria-expanded]="isOpen"
      (click)="toggle.emit()"
      class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
    >
      <span class="sr-only">{{ isOpen ? 'Close menu' : 'Open menu' }}</span>

      <!-- Hamburger icon -->
      <div class="w-6 h-5 flex flex-col justify-between">
        <!-- Top line -->
        <span
          class="block h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out"
          [class.rotate-45]="isOpen"
          [class.translate-y-2]="isOpen"
        ></span>

        <!-- Middle line -->
        <span
          class="block h-0.5 w-6 bg-current transition-all duration-300 ease-in-out"
          [class.opacity-0]="isOpen"
        ></span>

        <!-- Bottom line -->
        <span
          class="block h-0.5 w-6 bg-current transform transition-all duration-300 ease-in-out"
          [class.-rotate-45]="isOpen"
          [class.-translate-y-2]="isOpen"
        ></span>
      </div>
    </button>
  `
})
export class HamburgerMenuComponent {
  @Input() isOpen = false;
  @Output() toggle = new EventEmitter<void>();
}
```

## 4. NavbarComponent - Responsive Navigation

### navbar.component.ts

```typescript
// src/app/shared/components/navbar/navbar.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HamburgerMenuComponent } from '../hamburger-menu/hamburger-menu.component';

export interface NavLink {
  label: string;
  route: string;
  icon?: string;
}

/**
 * Navbar responsive con menú mobile drawer.
 *
 * @example
 * <app-navbar
 *   [links]="navLinks"
 *   [mobileMenuOpen]="mobileMenuOpen()"
 *   (mobileMenuToggle)="mobileMenuOpen.set(!mobileMenuOpen())"
 * />
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HamburgerMenuComponent],
  template: `
    <nav class="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center">
            <a [routerLink]="homeRoute" class="flex-shrink-0 flex items-center">
              @if (logo) {
                <img [src]="logo" [alt]="brandName" class="h-8 w-auto" />
              }
              <span class="ml-2 text-xl font-bold text-gray-900 dark:text-white">{{ brandName }}</span>
            </a>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex md:items-center md:space-x-4">
            @for (link of links; track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                [routerLinkActiveOptions]="{ exact: link.route === homeRoute }"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                @if (link.icon) {
                  <span [innerHTML]="link.icon" class="inline-block w-5 h-5 mr-1"></span>
                }
                {{ link.label }}
              </a>
            }

            <!-- User actions slot -->
            <ng-content select="[navActions]"></ng-content>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center md:hidden">
            <app-hamburger-menu
              [isOpen]="mobileMenuOpen"
              (toggle)="mobileMenuToggle.emit()"
            />
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      @if (mobileMenuOpen) {
        <div class="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div class="px-2 pt-2 pb-3 space-y-1">
            @for (link of links; track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                [routerLinkActiveOptions]="{ exact: link.route === homeRoute }"
                (click)="mobileMenuToggle.emit()"
                class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                @if (link.icon) {
                  <span [innerHTML]="link.icon" class="inline-block w-5 h-5 mr-2"></span>
                }
                {{ link.label }}
              </a>
            }

            <!-- Mobile user actions -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <ng-content select="[navActionsMobile]"></ng-content>
            </div>
          </div>
        </div>
      }
    </nav>
  `
})
export class NavbarComponent {
  @Input() brandName = 'MyApp';
  @Input() logo?: string;
  @Input() homeRoute = '/';
  @Input() links: NavLink[] = [];
  @Input() mobileMenuOpen = false;

  @Output() mobileMenuToggle = new EventEmitter<void>();
}
```

## 5. SidebarComponent - Collapsible Sidebar

### sidebar.component.ts

```typescript
// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarLink {
  label: string;
  route: string;
  icon?: string;
  badge?: string | number;
  children?: SidebarLink[];
}

/**
 * Sidebar collapsible con soporte para nested links.
 *
 * @example
 * <app-sidebar
 *   [links]="sidebarLinks"
 *   [collapsed]="sidebarCollapsed()"
 *   (collapsedChange)="sidebarCollapsed.set($event)"
 * />
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      [class]="sidebarClasses()"
      class="bg-gray-900 dark:bg-gray-950 text-white transition-all duration-300 ease-in-out flex flex-col h-full"
    >
      <!-- Toggle button -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        @if (!collapsed) {
          <h2 class="text-lg font-semibold">Menu</h2>
        }
        <button
          type="button"
          (click)="toggleCollapsed()"
          class="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          [attr.aria-label]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <!-- Chevron icon -->
          <svg class="w-5 h-5 transition-transform duration-300" [class.rotate-180]="collapsed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Navigation links -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-2">
        @for (link of links; track link.route) {
          <div>
            <!-- Main link -->
            <a
              [routerLink]="link.route"
              routerLinkActive="bg-blue-600 text-white"
              [routerLinkActiveOptions]="{ exact: false }"
              [class]="linkClasses()"
              [attr.title]="collapsed ? link.label : null"
            >
              @if (link.icon) {
                <span [innerHTML]="link.icon" class="w-5 h-5 flex-shrink-0"></span>
              }

              @if (!collapsed) {
                <span class="flex-1">{{ link.label }}</span>

                @if (link.badge) {
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                    {{ link.badge }}
                  </span>
                }

                @if (link.children && link.children.length > 0) {
                  <svg class="w-4 h-4 transition-transform" [class.rotate-90]="expandedLinks().includes(link.route)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                }
              }
            </a>

            <!-- Children links (when expanded) -->
            @if (!collapsed && link.children && expandedLinks().includes(link.route)) {
              <div class="ml-6 mt-2 space-y-1">
                @for (child of link.children; track child.route) {
                  <a
                    [routerLink]="child.route"
                    routerLinkActive="bg-blue-600 text-white"
                    [class]="linkClasses()"
                  >
                    @if (child.icon) {
                      <span [innerHTML]="child.icon" class="w-4 h-4 flex-shrink-0"></span>
                    }
                    <span>{{ child.label }}</span>
                  </a>
                }
              </div>
            }
          </div>
        }
      </nav>

      <!-- Footer content slot -->
      <div class="p-4 border-t border-gray-700">
        <ng-content select="[sidebarFooter]"></ng-content>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() links: SidebarLink[] = [];
  @Input() collapsed = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  // Expanded link routes
  public readonly expandedLinks = signal<string[]>([]);

  public readonly sidebarClasses = computed(() => {
    return this.collapsed ? 'w-20' : 'w-64';
  });

  public linkClasses(): string {
    return `
      flex items-center gap-3 px-3 py-2 rounded-lg
      text-gray-300 hover:bg-gray-800 hover:text-white
      transition-all duration-200 font-medium
      ${this.collapsed ? 'justify-center' : ''}
    `.trim();
  }

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }

  toggleExpanded(route: string): void {
    const current = this.expandedLinks();
    if (current.includes(route)) {
      this.expandedLinks.set(current.filter(r => r !== route));
    } else {
      this.expandedLinks.set([...current, route]);
    }
  }
}
```

## 6. BottomNavComponent - Mobile Bottom Navigation

### bottom-nav.component.ts

```typescript
// src/app/shared/components/bottom-nav/bottom-nav.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface BottomNavLink {
  label: string;
  route: string;
  icon: string;
  badge?: string | number;
}

/**
 * Bottom navigation bar para mobile (iOS/Android style).
 *
 * @example
 * <app-bottom-nav [links]="bottomNavLinks" />
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
      <div class="flex justify-around items-center h-16">
        @for (link of links; track link.route) {
          <a
            [routerLink]="link.route"
            routerLinkActive="text-blue-600 dark:text-blue-400"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative"
          >
            <!-- Icon -->
            <div class="relative">
              <span [innerHTML]="link.icon" class="w-6 h-6"></span>

              <!-- Badge -->
              @if (link.badge) {
                <span class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white min-w-[1.25rem] text-center">
                  {{ link.badge }}
                </span>
              }
            </div>

            <!-- Label -->
            <span class="text-xs mt-1 font-medium">{{ link.label }}</span>
          </a>
        }
      </div>
    </nav>
  `
})
export class BottomNavComponent {
  @Input() links: BottomNavLink[] = [];
}
```

## 7. BreadcrumbsComponent - Responsive Breadcrumbs

### breadcrumbs.component.ts

```typescript
// src/app/shared/components/breadcrumbs/breadcrumbs.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  label: string;
  route?: string;
}

/**
 * Breadcrumbs responsive con truncate en mobile.
 *
 * @example
 * <app-breadcrumbs [items]="breadcrumbs" />
 */
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav aria-label="Breadcrumb" class="py-3 px-4 bg-gray-50 dark:bg-gray-900">
      <ol class="flex items-center space-x-2 text-sm overflow-x-auto">
        @for (item of items; track $index; let isLast = $last) {
          <li class="flex items-center">
            @if (!isLast && item.route) {
              <a
                [routerLink]="item.route"
                class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
              >
                {{ item.label }}
              </a>
            } @else {
              <span class="text-gray-900 dark:text-white font-medium whitespace-nowrap truncate max-w-[200px] sm:max-w-none">
                {{ item.label }}
              </span>
            }

            @if (!isLast) {
              <!-- Separator -->
              <svg class="w-4 h-4 mx-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            }
          </li>
        }
      </ol>
    </nav>
  `
})
export class BreadcrumbsComponent {
  @Input() items: Breadcrumb[] = [];
}
```

## 8. FooterComponent - Responsive Footer

### footer.component.ts

```typescript
// src/app/shared/components/footer/footer.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface FooterLink {
  label: string;
  route: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/**
 * Footer responsive con columnas que se apilan en mobile.
 *
 * @example
 * <app-footer
 *   [columns]="footerColumns"
 *   companyName="MyCompany"
 *   [socialLinks]="socialLinks"
 * />
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-gray-900 dark:bg-gray-950 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Footer columns -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          @for (column of columns; track column.title) {
            <div>
              <h3 class="text-lg font-semibold mb-4">{{ column.title }}</h3>
              <ul class="space-y-2">
                @for (link of column.links; track link.route) {
                  <li>
                    <a
                      [routerLink]="link.route"
                      class="text-gray-400 hover:text-white transition-colors"
                    >
                      {{ link.label }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <!-- Social links -->
        @if (socialLinks && socialLinks.length > 0) {
          <div class="flex justify-center space-x-6 mb-8 pb-8 border-b border-gray-700">
            @for (social of socialLinks; track social.url) {
              <a
                [href]="social.url"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="social.label"
                class="text-gray-400 hover:text-white transition-colors"
              >
                <span [innerHTML]="social.icon" class="w-6 h-6"></span>
              </a>
            }
          </div>
        }

        <!-- Copyright -->
        <div class="text-center text-gray-400 text-sm">
          <p>&copy; {{ currentYear }} {{ companyName }}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  @Input() columns: FooterColumn[] = [];
  @Input() companyName = 'MyCompany';
  @Input() socialLinks: Array<{ label: string; url: string; icon: string }> = [];

  public readonly currentYear = new Date().getFullYear();
}
```

## 9. MainLayoutComponent - Complete Layout Structure

### main-layout.component.ts

```typescript
// src/app/layouts/main-layout/main-layout.component.ts
import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent, NavLink } from '@shared/components/navbar/navbar.component';
import { SidebarComponent, SidebarLink } from '@shared/components/sidebar/sidebar.component';
import { BottomNavComponent, BottomNavLink } from '@shared/components/bottom-nav/bottom-nav.component';
import { FooterComponent, FooterColumn } from '@shared/components/footer/footer.component';
import { BreakpointService } from '@core/services/breakpoint.service';

/**
 * Main layout con navbar, sidebar, content y footer responsive.
 *
 * Layout adapts:
 * - Mobile: Navbar con drawer + BottomNav + sin sidebar
 * - Tablet: Navbar + sidebar collapsible + sin BottomNav
 * - Desktop: Navbar + sidebar expandido + sin BottomNav
 *
 * @example
 * // En routes:
 * {
 *   path: '',
 *   component: MainLayoutComponent,
 *   children: [
 *     { path: 'dashboard', component: DashboardComponent },
 *     { path: 'profile', component: ProfileComponent }
 *   ]
 * }
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    BottomNavComponent,
    FooterComponent
  ],
  template: `
    <div class="flex flex-col min-h-screen">
      <!-- Navbar -->
      <app-navbar
        [brandName]="brandName"
        [logo]="logo"
        [links]="navLinks"
        [mobileMenuOpen]="mobileMenuOpen()"
        (mobileMenuToggle)="mobileMenuOpen.set(!mobileMenuOpen())"
      >
        <!-- Desktop user actions -->
        <div navActions class="flex items-center gap-2">
          <ng-content select="[navbarActions]"></ng-content>
        </div>

        <!-- Mobile user actions -->
        <div navActionsMobile>
          <ng-content select="[navbarActionsMobile]"></ng-content>
        </div>
      </app-navbar>

      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar (desktop/tablet only) -->
        @if (!breakpoint.isMobile()) {
          <app-sidebar
            [links]="sidebarLinks"
            [collapsed]="sidebarCollapsed()"
            (collapsedChange)="sidebarCollapsed.set($event)"
          >
            <div sidebarFooter>
              <ng-content select="[sidebarFooter]"></ng-content>
            </div>
          </app-sidebar>
        }

        <!-- Main content -->
        <main
          [class]="mainContentClasses()"
          class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900"
        >
          <!-- Content container -->
          <div class="container-responsive py-6">
            <router-outlet />
          </div>
        </main>
      </div>

      <!-- Footer -->
      <app-footer
        [columns]="footerColumns"
        [companyName]="companyName"
        [socialLinks]="socialLinks"
      />

      <!-- Bottom navigation (mobile only) -->
      @if (breakpoint.isMobile()) {
        <app-bottom-nav [links]="bottomNavLinks" />
      }

      <!-- Mobile backdrop (when drawer is open) -->
      @if (mobileMenuOpen() && breakpoint.isMobile()) {
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
          (click)="mobileMenuOpen.set(false)"
        ></div>
      }
    </div>
  `,
  styles: [`
    /* Responsive container utility */
    :host ::ng-deep .container-responsive {
      @apply px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto;
    }
  `]
})
export class MainLayoutComponent {
  protected breakpoint = inject(BreakpointService);

  // Layout state
  public readonly mobileMenuOpen = signal(false);
  public readonly sidebarCollapsed = signal(false);

  // Configuration
  @Input() brandName = 'MyApp';
  @Input() logo?: string;
  @Input() companyName = 'MyCompany';

  // Navigation links
  public readonly navLinks: NavLink[] = [
    { label: 'Home', route: '/' },
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Products', route: '/products' },
    { label: 'About', route: '/about' }
  ];

  public readonly sidebarLinks: SidebarLink[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
    },
    {
      label: 'Analytics',
      route: '/analytics',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
      badge: 3
    },
    {
      label: 'Settings',
      route: '/settings',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
      children: [
        { label: 'Profile', route: '/settings/profile' },
        { label: 'Security', route: '/settings/security' },
        { label: 'Notifications', route: '/settings/notifications' }
      ]
    }
  ];

  public readonly bottomNavLinks: BottomNavLink[] = [
    {
      label: 'Home',
      route: '/',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
    },
    {
      label: 'Search',
      route: '/search',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>'
    },
    {
      label: 'Notifications',
      route: '/notifications',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>',
      badge: 5
    },
    {
      label: 'Profile',
      route: '/profile',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
    }
  ];

  public readonly footerColumns: FooterColumn[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', route: '/features' },
        { label: 'Pricing', route: '/pricing' },
        { label: 'Security', route: '/security' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', route: '/about' },
        { label: 'Blog', route: '/blog' },
        { label: 'Careers', route: '/careers' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', route: '/docs' },
        { label: 'API', route: '/api' },
        { label: 'Support', route: '/support' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', route: '/privacy' },
        { label: 'Terms', route: '/terms' },
        { label: 'Cookie Policy', route: '/cookies' }
      ]
    }
  ];

  public readonly socialLinks = [
    {
      label: 'Twitter',
      url: 'https://twitter.com',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>'
    },
    {
      label: 'GitHub',
      url: 'https://github.com',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" /></svg>'
    },
    {
      label: 'LinkedIn',
      url: 'https://linkedin.com',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    }
  ];

  public readonly mainContentClasses = computed(() => {
    const isMobile = this.breakpoint.isMobile();
    return isMobile ? 'pb-16' : ''; // Padding para el bottom nav en mobile
  });
}
```

## 10. Responsive Grid Layouts

### Grid Layout Examples

```typescript
// Dashboard Grid Layout
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats; track stat.label) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">{{ stat.value }}</p>
              </div>
              <div [innerHTML]="stat.icon" class="w-12 h-12 text-blue-500"></div>
            </div>
            <p class="text-sm mt-4" [class.text-green-600]="stat.change > 0" [class.text-red-600]="stat.change < 0">
              {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}% from last month
            </p>
          </div>
        }
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Revenue Chart</h3>
          <!-- Chart component here -->
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">User Growth</h3>
          <!-- Chart component here -->
        </div>
      </div>

      <!-- Table Grid (full width) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Recent Orders</h3>
          <!-- Table component here -->
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  stats = [
    { label: 'Total Revenue', value: '$45,231', change: 12.5, icon: '...' },
    { label: 'New Users', value: '2,345', change: 8.2, icon: '...' },
    { label: 'Orders', value: '1,234', change: -3.1, icon: '...' },
    { label: 'Conversion', value: '3.2%', change: 5.7, icon: '...' }
  ];
}
```

```typescript
// Cards Grid Layout
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      @for (product of products; track product.id) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
          <!-- Product image -->
          <div class="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
            <img [src]="product.image" [alt]="product.name" class="object-cover w-full h-48">
          </div>

          <!-- Product info -->
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 dark:text-white truncate">{{ product.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{{ product.description }}</p>
            <div class="flex items-center justify-between mt-4">
              <span class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ product.price }}</span>
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductsComponent {
  products = [
    { id: 1, name: 'Product 1', description: 'Lorem ipsum...', price: '$29.99', image: '...' },
    // ...
  ];
}
```

## 11. Responsive Typography

### Typography Utilities (Tailwind)

```css
/* Add to global styles or component */

/* Responsive headings */
.heading-1 {
  @apply text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold;
}

.heading-2 {
  @apply text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold;
}

.heading-3 {
  @apply text-xl sm:text-2xl lg:text-3xl font-semibold;
}

.heading-4 {
  @apply text-lg sm:text-xl lg:text-2xl font-semibold;
}

/* Responsive body text */
.body-large {
  @apply text-base sm:text-lg lg:text-xl;
}

.body-normal {
  @apply text-sm sm:text-base;
}

.body-small {
  @apply text-xs sm:text-sm;
}

/* Responsive line clamp */
.line-clamp-responsive {
  @apply line-clamp-3 sm:line-clamp-4 lg:line-clamp-none;
}
```

## 12. Container & Spacing Utilities

### Container Component

```typescript
// src/app/shared/components/container/container.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Responsive container con diferentes tamaños máximos.
 *
 * @example
 * <app-container size="lg">
 *   <p>Content here...</p>
 * </app-container>
 */
@Component({
  selector: 'app-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()" class="mx-auto px-4 sm:px-6 lg:px-8">
      <ng-content></ng-content>
    </div>
  `
})
export class ContainerComponent {
  @Input() size: ContainerSize = 'xl';
  @Input() noPadding = false;

  containerClasses(): string {
    const sizeClasses: Record<ContainerSize, string> = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full'
    };

    const padding = this.noPadding ? '' : 'px-4 sm:px-6 lg:px-8';
    return `mx-auto ${sizeClasses[this.size]} ${padding}`;
  }
}
```

### Responsive Spacing Utilities

```css
/* Add to tailwind config or global styles */

/* Responsive section spacing */
.section-spacing {
  @apply py-8 sm:py-12 lg:py-16 xl:py-20;
}

.section-spacing-sm {
  @apply py-4 sm:py-6 lg:py-8;
}

.section-spacing-lg {
  @apply py-12 sm:py-16 lg:py-24 xl:py-32;
}

/* Responsive gap utilities */
.gap-responsive {
  @apply gap-4 sm:gap-6 lg:gap-8;
}

.gap-responsive-sm {
  @apply gap-2 sm:gap-3 lg:gap-4;
}

.gap-responsive-lg {
  @apply gap-6 sm:gap-8 lg:gap-12;
}
```

## 13. Responsive Images & Media

### Responsive Image Component

```typescript
// src/app/shared/components/responsive-image/responsive-image.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AspectRatio = '1/1' | '4/3' | '16/9' | '21/9';

/**
 * Responsive image component con aspect ratio y lazy loading.
 *
 * @example
 * <app-responsive-image
 *   src="image.jpg"
 *   alt="Description"
 *   aspectRatio="16/9"
 * />
 */
@Component({
  selector: 'app-responsive-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()">
      <img
        [src]="src"
        [alt]="alt"
        [loading]="lazy ? 'lazy' : 'eager'"
        [class]="imageClasses()"
        class="absolute inset-0 w-full h-full"
      />
    </div>
  `
})
export class ResponsiveImageComponent {
  @Input() src!: string;
  @Input() alt!: string;
  @Input() aspectRatio: AspectRatio = '16/9';
  @Input() objectFit: 'cover' | 'contain' | 'fill' = 'cover';
  @Input() lazy = true;
  @Input() rounded = false;

  containerClasses(): string {
    const aspectClasses: Record<AspectRatio, string> = {
      '1/1': 'aspect-square',
      '4/3': 'aspect-4/3',
      '16/9': 'aspect-video',
      '21/9': 'aspect-21/9'
    };

    const roundedClass = this.rounded ? 'rounded-lg overflow-hidden' : '';
    return `relative ${aspectClasses[this.aspectRatio]} ${roundedClass}`;
  }

  imageClasses(): string {
    const fitClasses = {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill'
    };

    return fitClasses[this.objectFit];
  }
}
```

## 14. Sticky Header Pattern

```typescript
// Sticky header con scroll detection
@Component({
  selector: 'app-sticky-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header
      class="sticky top-0 z-50 transition-all duration-300"
      [class.shadow-md]="isScrolled()"
      [class.bg-white]="isScrolled()"
      [class.bg-transparent]="!isScrolled()"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class StickyHeaderComponent {
  public readonly isScrolled = signal(false);
  private destroyRef = inject(DestroyRef);

  constructor() {
    fromEvent(window, 'scroll')
      .pipe(
        throttleTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isScrolled.set(window.scrollY > 50);
      });
  }
}
```

## 15. Complete Layout Examples

### Example 1: Dashboard Layout

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];
```

### Example 2: Landing Page Layout

```typescript
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, ContainerComponent],
  template: `
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div class="text-center">
          <h1 class="heading-1 mb-6">Welcome to MyApp</h1>
          <p class="body-large mb-8 max-w-2xl mx-auto">
            Build amazing products with our platform
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started
            </button>
            <button class="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section-spacing bg-gray-50 dark:bg-gray-900">
      <app-container size="lg">
        <h2 class="heading-2 text-center mb-12">Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-responsive">
          @for (feature of features; track feature.title) {
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div [innerHTML]="feature.icon" class="w-12 h-12 text-blue-600 mb-4"></div>
              <h3 class="heading-4 mb-2">{{ feature.title }}</h3>
              <p class="body-normal text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
            </div>
          }
        </div>
      </app-container>
    </section>

    <!-- CTA Section -->
    <section class="section-spacing bg-blue-600 text-white">
      <app-container size="md">
        <div class="text-center">
          <h2 class="heading-2 mb-4">Ready to get started?</h2>
          <p class="body-large mb-8">Join thousands of satisfied customers today.</p>
          <button class="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Start Free Trial
          </button>
        </div>
      </app-container>
    </section>
  `
})
export class LandingComponent {
  features = [
    { title: 'Fast', description: 'Lightning fast performance', icon: '...' },
    { title: 'Secure', description: 'Enterprise-grade security', icon: '...' },
    { title: 'Scalable', description: 'Grows with your business', icon: '...' }
  ];
}
```

### Example 3: Admin Layout with Sidebar

```typescript
// Already covered in MainLayoutComponent above
// Use MainLayoutComponent as the parent route component
```

## 16. Dark Mode Toggle (Optional Integration)

```typescript
// src/app/core/services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public readonly isDarkMode = signal(this.getInitialTheme());

  constructor() {
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  toggle(): void {
    this.isDarkMode.set(!this.isDarkMode());
  }
}
```

```typescript
// Dark mode toggle button component
@Component({
  selector: 'app-dark-mode-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="themeService.toggle()"
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      @if (themeService.isDarkMode()) {
        <!-- Sun icon -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      } @else {
        <!-- Moon icon -->
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      }
    </button>
  `
})
export class DarkModeToggleComponent {
  constructor(public themeService: ThemeService) {}
}
```

## Best Practices

### Mobile-First Approach

1. **Start with mobile styles, add larger breakpoints progressively:**
   ```html
   <!-- Mobile first: base class is for mobile -->
   <div class="text-sm md:text-base lg:text-lg">
     Responsive text
   </div>
   ```

2. **Use appropriate breakpoints:**
   - `sm:` (640px) - Large phones, small tablets
   - `md:` (768px) - Tablets
   - `lg:` (1024px) - Desktops
   - `xl:` (1280px) - Large desktops
   - `2xl:` (1536px) - Extra large screens

3. **Test on real devices:**
   - Use Chrome DevTools device emulation
   - Test on actual phones/tablets
   - Check landscape orientation

### Performance

1. **Lazy load images:**
   ```html
   <img loading="lazy" src="image.jpg" alt="Description">
   ```

2. **Use debounce for resize events:**
   ```typescript
   fromEvent(window, 'resize').pipe(debounceTime(150))
   ```

3. **Minimize layout shifts:**
   - Use aspect-ratio for images/videos
   - Reserve space for dynamic content
   - Use skeleton loaders

### Accessibility

1. **ARIA labels for icon-only buttons:**
   ```html
   <button aria-label="Open menu">
     <svg>...</svg>
   </button>
   ```

2. **Keyboard navigation:**
   - Ensure all interactive elements are keyboard accessible
   - Test with Tab, Enter, Escape keys
   - Implement focus trapping in modals

3. **Screen reader support:**
   - Use semantic HTML (`<nav>`, `<main>`, `<aside>`)
   - Provide text alternatives for icons
   - Use aria-live for dynamic updates

### Code Organization

1. **Component structure:**
   ```
   src/app/
   ├── core/
   │   └── services/
   │       └── breakpoint.service.ts
   ├── shared/
   │   ├── components/
   │   │   ├── navbar/
   │   │   ├── sidebar/
   │   │   ├── footer/
   │   │   └── ...
   │   └── directives/
   │       └── responsive.directive.ts
   └── layouts/
       └── main-layout/
           └── main-layout.component.ts
   ```

2. **Reusability:**
   - Create generic, configurable components
   - Use `@Input()` for customization
   - Provide content projection slots with `<ng-content>`

3. **Type safety:**
   - Define interfaces for link types, navigation items
   - Use TypeScript generics where appropriate
   - Avoid `any` types

## Common Patterns

### Pattern 1: Hide/Show based on breakpoint

```html
<!-- Show only on mobile -->
<div class="block md:hidden">Mobile content</div>

<!-- Show only on desktop -->
<div class="hidden md:block">Desktop content</div>

<!-- Using directive -->
<div *appResponsive="'mobile'">Mobile only</div>
<div *appResponsive="'desktop'">Desktop only</div>
```

### Pattern 2: Responsive Grid

```html
<!-- 1 column mobile, 2 tablet, 3 desktop, 4 large desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Grid items -->
</div>
```

### Pattern 3: Conditional Rendering with Signals

```typescript
// In component
isMobile = this.breakpointService.isMobile();

// In template
@if (isMobile()) {
  <app-mobile-view />
} @else {
  <app-desktop-view />
}
```

### Pattern 4: Responsive Padding/Margin

```html
<div class="p-4 sm:p-6 lg:p-8">
  <!-- Padding increases with screen size -->
</div>

<div class="mt-4 sm:mt-6 lg:mt-8">
  <!-- Margin increases with screen size -->
</div>
```

## Troubleshooting

### Issue: Sidebar not collapsing on mobile
**Solution:** Check BreakpointService is properly injected and signals are being used correctly in template.

### Issue: Bottom nav overlapping content
**Solution:** Add padding-bottom to main content area when mobile detected:
```typescript
mainContentClasses = computed(() => {
  return this.breakpoint.isMobile() ? 'pb-16' : '';
});
```

### Issue: Navbar mobile menu not closing after navigation
**Solution:** Emit close event on link click:
```html
<a (click)="mobileMenuToggle.emit()">Link</a>
```

### Issue: Responsive utilities not applying
**Solution:** Ensure Tailwind CSS is properly configured and purge/content paths include all component files.

---

## Summary

Este skill proporciona un sistema completo de layouts responsive para Angular standalone:

- **BreakpointService** - Detección reactiva de viewport con signals
- **ResponsiveDirective** - Show/hide condicional por breakpoint
- **HamburgerMenuComponent** - Menú animado para mobile
- **NavbarComponent** - Navegación responsive con mobile drawer
- **SidebarComponent** - Sidebar collapsible con nested links
- **BottomNavComponent** - Navegación inferior estilo mobile app
- **BreadcrumbsComponent** - Breadcrumbs responsive
- **FooterComponent** - Footer multi-columna responsive
- **MainLayoutComponent** - Layout completo adaptativo
- **Grid layouts** - Ejemplos de dashboards, cards, lists
- **Typography & spacing** - Utilities responsive
- **Images & media** - Componentes responsive
- **Dark mode** - Integración opcional
- **Best practices** - Mobile-first, performance, a11y

Usa estos componentes como base y personaliza según las necesidades específicas de tu proyecto.
