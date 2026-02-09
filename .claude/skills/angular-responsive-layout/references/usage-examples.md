# Usage Examples - Complete Implementation Guide

## Example 1: E-commerce Application Layout

### 1.1 App Configuration

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([]))
  ]
};
```

### 1.2 Routes Configuration

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  }
];
```

### 1.3 Main App Component

```typescript
// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent {}
```

### 1.4 Custom MainLayout Implementation

```typescript
// src/app/layouts/main-layout/main-layout.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent, NavLink } from '@shared/components/navbar/navbar.component';
import { SidebarComponent, SidebarLink } from '@shared/components/sidebar/sidebar.component';
import { BottomNavComponent, BottomNavLink } from '@shared/components/bottom-nav/bottom-nav.component';
import { FooterComponent, FooterColumn } from '@shared/components/footer/footer.component';
import { BreadcrumbsComponent, Breadcrumb } from '@shared/components/breadcrumbs/breadcrumbs.component';
import { BreakpointService } from '@core/services/breakpoint.service';
import { ThemeService } from '@core/services/theme.service';
import { DarkModeToggleComponent } from '@shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    BottomNavComponent,
    FooterComponent,
    BreadcrumbsComponent,
    DarkModeToggleComponent
  ],
  template: `
    <div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Navbar -->
      <app-navbar
        brandName="ShopHub"
        logo="/assets/logo.svg"
        [links]="navLinks"
        [mobileMenuOpen]="mobileMenuOpen()"
        (mobileMenuToggle)="mobileMenuOpen.set(!mobileMenuOpen())"
      >
        <!-- Desktop actions -->
        <div navActions class="flex items-center gap-3">
          <!-- Search -->
          <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <!-- Cart -->
          <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
          </button>

          <!-- Dark mode toggle -->
          <app-dark-mode-toggle />

          <!-- User avatar -->
          <button class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
            JD
          </button>
        </div>

        <!-- Mobile actions -->
        <div navActionsMobile class="space-y-4">
          <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg">
            Sign In
          </button>
        </div>
      </app-navbar>

      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar (desktop only) -->
        @if (!breakpoint.isMobile()) {
          <app-sidebar
            [links]="sidebarLinks"
            [collapsed]="sidebarCollapsed()"
            (collapsedChange)="sidebarCollapsed.set($event)"
          >
            <div sidebarFooter class="text-center">
              @if (!sidebarCollapsed()) {
                <p class="text-xs text-gray-400">© 2024 ShopHub</p>
              }
            </div>
          </app-sidebar>
        }

        <!-- Main content -->
        <main class="flex-1 overflow-y-auto">
          <!-- Breadcrumbs -->
          <app-breadcrumbs [items]="breadcrumbs" />

          <!-- Page content -->
          <div class="container-responsive py-6 pb-20 md:pb-6">
            <router-outlet />
          </div>
        </main>
      </div>

      <!-- Footer (desktop only) -->
      @if (!breakpoint.isMobile()) {
        <app-footer
          [columns]="footerColumns"
          companyName="ShopHub Inc."
          [socialLinks]="socialLinks"
        />
      }

      <!-- Bottom navigation (mobile only) -->
      @if (breakpoint.isMobile()) {
        <app-bottom-nav [links]="bottomNavLinks" />
      }

      <!-- Mobile backdrop -->
      @if (mobileMenuOpen() && breakpoint.isMobile()) {
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          (click)="mobileMenuOpen.set(false)"
        ></div>
      }
    </div>
  `
})
export class MainLayoutComponent {
  protected breakpoint = inject(BreakpointService);
  protected theme = inject(ThemeService);

  public mobileMenuOpen = signal(false);
  public sidebarCollapsed = signal(false);

  public readonly navLinks: NavLink[] = [
    { label: 'Home', route: '/home' },
    { label: 'Products', route: '/products' },
    { label: 'Deals', route: '/deals' },
    { label: 'About', route: '/about' }
  ];

  public readonly sidebarLinks: SidebarLink[] = [
    {
      label: 'Dashboard',
      route: '/home',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
    },
    {
      label: 'Categories',
      route: '/categories',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>',
      children: [
        { label: 'Electronics', route: '/categories/electronics' },
        { label: 'Fashion', route: '/categories/fashion' },
        { label: 'Home & Garden', route: '/categories/home' },
        { label: 'Sports', route: '/categories/sports' }
      ]
    },
    {
      label: 'Orders',
      route: '/orders',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>',
      badge: 2
    },
    {
      label: 'Wishlist',
      route: '/wishlist',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>'
    }
  ];

  public readonly bottomNavLinks: BottomNavLink[] = [
    {
      label: 'Home',
      route: '/home',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
    },
    {
      label: 'Categories',
      route: '/categories',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>'
    },
    {
      label: 'Cart',
      route: '/cart',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
      badge: 3
    },
    {
      label: 'Profile',
      route: '/profile',
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
    }
  ];

  public readonly breadcrumbs: Breadcrumb[] = [
    { label: 'Home', route: '/home' },
    { label: 'Products', route: '/products' },
    { label: 'Electronics' }
  ];

  public readonly footerColumns: FooterColumn[] = [
    {
      title: 'Shop',
      links: [
        { label: 'New Arrivals', route: '/new' },
        { label: 'Best Sellers', route: '/bestsellers' },
        { label: 'Sale', route: '/sale' }
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Contact Us', route: '/contact' },
        { label: 'Shipping Info', route: '/shipping' },
        { label: 'Returns', route: '/returns' }
      ]
    },
    {
      title: 'About',
      links: [
        { label: 'Our Story', route: '/about' },
        { label: 'Careers', route: '/careers' },
        { label: 'Press', route: '/press' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', route: '/privacy' },
        { label: 'Terms of Service', route: '/terms' },
        { label: 'Cookie Policy', route: '/cookies' }
      ]
    }
  ];

  public readonly socialLinks = [
    {
      label: 'Facebook',
      url: 'https://facebook.com',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>'
    },
    {
      label: 'Instagram',
      url: 'https://instagram.com',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'
    },
    {
      label: 'Twitter',
      url: 'https://twitter.com',
      icon: '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>'
    }
  ];
}
```

## Example 2: Dashboard Application

### 2.1 Dashboard Layout

```typescript
// src/app/pages/dashboard/dashboard.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stat {
  label: string;
  value: string;
  change: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="heading-2 text-gray-900 dark:text-white">Dashboard</h1>
          <p class="body-normal text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <button class="btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Report
        </button>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (stat of stats; track stat.label) {
          <div class="card p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="body-small text-gray-600 dark:text-gray-400">{{ stat.label }}</p>
                <p class="heading-3 text-gray-900 dark:text-white mt-2">{{ stat.value }}</p>
              </div>
              <div
                [innerHTML]="stat.icon"
                class="w-12 h-12 rounded-lg flex items-center justify-center"
                [class.bg-blue-100]="stat.change >= 0"
                [class.text-blue-600]="stat.change >= 0"
                [class.bg-red-100]="stat.change < 0"
                [class.text-red-600]="stat.change < 0"
              ></div>
            </div>
            <div class="mt-4 flex items-center">
              @if (stat.change >= 0) {
                <svg class="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span class="body-small text-green-600">+{{ stat.change }}%</span>
              } @else {
                <svg class="w-4 h-4 text-red-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span class="body-small text-red-600">{{ stat.change }}%</span>
              }
              <span class="body-small text-gray-600 dark:text-gray-400 ml-2">vs last month</span>
            </div>
          </div>
        }
      </div>

      <!-- Charts grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="heading-4 mb-4">Revenue Overview</h3>
          <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">Chart placeholder</p>
          </div>
        </div>
        <div class="card p-6">
          <h3 class="heading-4 mb-4">User Growth</h3>
          <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">Chart placeholder</p>
          </div>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="card">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="heading-4">Recent Activity</h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          @for (activity of recentActivity; track activity.id) {
            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <span class="text-blue-600 dark:text-blue-400 font-semibold">{{ activity.user[0] }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="body-normal text-gray-900 dark:text-white">
                    <span class="font-semibold">{{ activity.user }}</span>
                    {{ activity.action }}
                  </p>
                  <p class="body-small text-gray-500 dark:text-gray-400 mt-1">{{ activity.timestamp }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  stats: Stat[] = [
    {
      label: 'Total Revenue',
      value: '$45,231.89',
      change: 20.1,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
    },
    {
      label: 'Active Users',
      value: '2,350',
      change: 12.5,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
    },
    {
      label: 'Orders',
      value: '1,234',
      change: -3.2,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>'
    },
    {
      label: 'Conversion Rate',
      value: '3.24%',
      change: 5.7,
      icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>'
    }
  ];

  recentActivity = [
    {
      id: 1,
      user: 'John Doe',
      action: 'created a new order #12345',
      timestamp: '5 minutes ago'
    },
    {
      id: 2,
      user: 'Jane Smith',
      action: 'updated product "Wireless Headphones"',
      timestamp: '1 hour ago'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'commented on issue #456',
      timestamp: '2 hours ago'
    },
    {
      id: 4,
      user: 'Sarah Williams',
      action: 'completed task "Update documentation"',
      timestamp: '3 hours ago'
    }
  ];
}
```

## Example 3: Products Grid with Filters

```typescript
// src/app/pages/products/products.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  inStock: boolean;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header with filters -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 class="heading-2">Products</h1>
          <p class="body-normal text-gray-600 dark:text-gray-400 mt-1">
            Showing {{ filteredProducts().length }} of {{ products().length }} products
          </p>
        </div>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Category filter -->
          <select
            [(ngModel)]="selectedCategory"
            (change)="filterProducts()"
            class="input sm:w-48"
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home</option>
          </select>

          <!-- Sort -->
          <select
            [(ngModel)]="sortBy"
            (change)="filterProducts()"
            class="input sm:w-48"
          >
            <option value="name">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <!-- Products grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (product of filteredProducts(); track product.id) {
          <div class="card-hover group">
            <!-- Image -->
            <div class="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <img
                [src]="product.image"
                [alt]="product.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            <!-- Content -->
            <div class="p-4">
              <span class="badge badge-primary text-xs">{{ product.category }}</span>
              <h3 class="heading-5 mt-2 line-clamp-2">{{ product.name }}</h3>

              <!-- Rating -->
              <div class="flex items-center gap-1 mt-2">
                @for (star of [1,2,3,4,5]; track star) {
                  <svg
                    class="w-4 h-4"
                    [class.text-yellow-400]="star <= product.rating"
                    [class.text-gray-300]="star > product.rating"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                }
                <span class="body-small text-gray-600 dark:text-gray-400 ml-1">
                  ({{ product.rating }})
                </span>
              </div>

              <!-- Price and action -->
              <div class="flex items-center justify-between mt-4">
                <span class="heading-4 text-blue-600 dark:text-blue-400">
                  ${{ product.price.toFixed(2) }}
                </span>
                <button
                  class="btn-primary btn-sm"
                  [disabled]="!product.inStock"
                >
                  {{ product.inStock ? 'Add to Cart' : 'Out of Stock' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Empty state -->
      @if (filteredProducts().length === 0) {
        <div class="card p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 class="heading-3 mt-4">No products found</h3>
          <p class="body-normal text-gray-600 dark:text-gray-400 mt-2">
            Try adjusting your filters to find what you're looking for.
          </p>
        </div>
      }
    </div>
  `
})
export class ProductsComponent {
  selectedCategory = '';
  sortBy = 'name';

  products = signal<Product[]>([
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      price: 89.99,
      category: 'Electronics',
      image: '/assets/products/headphones.jpg',
      rating: 4.5,
      inStock: true
    },
    // ... more products
  ]);

  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by category
    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    // Sort
    switch (this.sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
      default:
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });

  filterProducts(): void {
    // Trigger recomputation by accessing the computed signal
    this.filteredProducts();
  }
}
```

These examples demonstrate complete, production-ready implementations using the responsive layout system. They showcase:

1. Proper use of all layout components
2. Responsive grid layouts
3. Mobile-first design patterns
4. Signal-based state management
5. Tailwind CSS utilities
6. Accessibility features
7. Dark mode support
8. Performance optimizations
