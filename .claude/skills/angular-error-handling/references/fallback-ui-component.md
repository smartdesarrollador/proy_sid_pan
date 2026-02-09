# Fallback UI Component - Error Pages

Componentes completos de UI para páginas de error.

## FallbackUI Component Template

`src/app/shared/components/fallback-ui/fallback-ui.component.html`:

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
  <div class="max-w-md w-full text-center">
    <!-- Error Icon/Illustration -->
    <div class="mb-8">
      @switch (errorCode) {
        @case ('404') {
          <div class="text-8xl mb-4">🔍</div>
        }
        @case ('403') {
          <div class="text-8xl mb-4">🔒</div>
        }
        @case ('500') {
          <div class="text-8xl mb-4">⚠️</div>
        }
        @case ('503') {
          <div class="text-8xl mb-4">🔧</div>
        }
        @default {
          <div class="text-8xl mb-4">❌</div>
        }
      }
    </div>

    <!-- Error Code -->
    <h1 class="text-6xl font-bold text-gray-900 mb-4">
      {{ errorCode }}
    </h1>

    <!-- Title -->
    <h2 class="text-2xl font-semibold text-gray-800 mb-3">
      {{ title }}
    </h2>

    <!-- Message -->
    <p class="text-gray-600 mb-8">
      {{ message }}
    </p>

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      @if (showHomeButton) {
        <button
          (click)="goHome()"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Go to Home
        </button>
      }

      @if (showRetryButton) {
        <button
          (click)="retry()"
          class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Try Again
        </button>
      }
    </div>

    <!-- Additional Help -->
    <div class="mt-8 pt-8 border-t border-gray-200">
      <p class="text-sm text-gray-500 mb-3">
        Need help?
      </p>
      <div class="flex justify-center gap-4 text-sm">
        <a href="/contact" class="text-primary hover:text-blue-700 transition">
          Contact Support
        </a>
        <span class="text-gray-300">|</span>
        <a href="/faq" class="text-primary hover:text-blue-700 transition">
          Visit FAQ
        </a>
      </div>
    </div>
  </div>
</div>
```

## Error 404 - Not Found

`src/app/shared/components/error-pages/not-found.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="max-w-lg w-full text-center">
        <!-- Animated 404 -->
        <div class="mb-8">
          <h1 class="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse">
            404
          </h1>
        </div>

        <!-- Message -->
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p class="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <!-- Search or Home -->
        <div class="space-y-4">
          <div class="relative">
            <input
              type="text"
              placeholder="Search for pages..."
              class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg class="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <a
            routerLink="/"
            class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Back to Home
          </a>
        </div>

        <!-- Popular Pages -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <p class="text-sm text-gray-500 mb-4">Popular pages:</p>
          <div class="flex flex-wrap justify-center gap-3">
            <a routerLink="/dashboard" class="text-sm text-blue-600 hover:text-blue-700">Dashboard</a>
            <a routerLink="/products" class="text-sm text-blue-600 hover:text-blue-700">Products</a>
            <a routerLink="/about" class="text-sm text-blue-600 hover:text-blue-700">About</a>
            <a routerLink="/contact" class="text-sm text-blue-600 hover:text-blue-700">Contact</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
```

## Error 500 - Server Error

`src/app/shared/components/error-pages/server-error.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Icon -->
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100">
            <svg class="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h1 class="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">
          Internal Server Error
        </h2>
        <p class="text-gray-600 mb-8">
          Something went wrong on our end. We're working to fix it.
        </p>

        <!-- Status -->
        <div class="bg-white border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div class="animate-pulse flex gap-1">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <div class="w-2 h-2 bg-red-500 rounded-full animation-delay-200"></div>
              <div class="w-2 h-2 bg-red-500 rounded-full animation-delay-400"></div>
            </div>
            <span>Our team has been notified</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <button
            (click)="retry()"
            class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Try Again
          </button>
          <a
            routerLink="/"
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium inline-block"
          >
            Go to Home
          </a>
        </div>

        <!-- Support Info -->
        <div class="mt-8 text-sm text-gray-500">
          Error ID: <code class="font-mono bg-gray-100 px-2 py-1 rounded">{{ errorId }}</code>
        </div>
      </div>
    </div>
  `
})
export class ServerErrorComponent {
  errorId = Math.random().toString(36).substr(2, 9);

  retry(): void {
    window.location.reload();
  }
}
```

## Error 403 - Forbidden

`src/app/shared/components/error-pages/forbidden.component.ts`:

```typescript
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-yellow-50 px-4">
      <div class="max-w-md w-full text-center">
        <!-- Lock Icon -->
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-100">
            <svg class="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h1 class="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">
          Access Denied
        </h2>
        <p class="text-gray-600 mb-8">
          You don't have permission to access this resource.
        </p>

        <!-- Info Box -->
        <div class="bg-white border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <h3 class="font-semibold text-gray-900 mb-2">
            Why am I seeing this?
          </h3>
          <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>You may not have the required permissions</li>
            <li>Your account may need to be upgraded</li>
            <li>This resource may be restricted</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <button
            (click)="goBack()"
            class="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
          >
            Go Back
          </button>
          <a
            routerLink="/"
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium inline-block"
          >
            Go to Home
          </a>
        </div>

        <!-- Contact -->
        <div class="mt-8">
          <p class="text-sm text-gray-500 mb-2">
            Need access?
          </p>
          <a
            routerLink="/contact"
            class="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
          >
            Contact Administrator
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForbiddenComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }
}
```

## Maintenance Mode

```typescript
@Component({
  selector: 'app-maintenance',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div class="max-w-md w-full text-center">
        <!-- Maintenance Icon -->
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-800">
            <svg class="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <h1 class="text-4xl font-bold text-white mb-4">
          Under Maintenance
        </h1>
        <p class="text-gray-400 mb-8">
          We're performing scheduled maintenance. We'll be back shortly!
        </p>

        <!-- Countdown (if applicable) -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8">
          <p class="text-sm text-gray-400 mb-3">Estimated time:</p>
          <div class="flex justify-center gap-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-white">{{ hours }}</div>
              <div class="text-xs text-gray-400">Hours</div>
            </div>
            <div class="text-3xl text-gray-600">:</div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">{{ minutes }}</div>
              <div class="text-xs text-gray-400">Minutes</div>
            </div>
          </div>
        </div>

        <!-- Status Updates -->
        <div class="text-sm text-gray-400">
          Follow us for updates:
          <div class="flex justify-center gap-4 mt-3">
            <a href="#" class="text-white hover:text-gray-300">Twitter</a>
            <a href="#" class="text-white hover:text-gray-300">Status Page</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MaintenanceComponent {
  hours = '02';
  minutes = '30';
}
```

## Routing Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  // ... otras rutas

  {
    path: '404',
    loadComponent: () => import('@shared/components/error-pages/not-found.component')
      .then(m => m.NotFoundComponent)
  },
  {
    path: '500',
    loadComponent: () => import('@shared/components/error-pages/server-error.component')
      .then(m => m.ServerErrorComponent)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('@shared/components/error-pages/forbidden.component')
      .then(m => m.ForbiddenComponent)
  },
  {
    path: 'maintenance',
    loadComponent: () => import('@shared/components/error-pages/maintenance.component')
      .then(m => m.MaintenanceComponent)
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
```
