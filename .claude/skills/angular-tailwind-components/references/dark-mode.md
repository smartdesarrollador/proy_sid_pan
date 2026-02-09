# Dark Mode Implementation

Implementación completa de dark mode para toda la biblioteca de componentes.

## 1. Configuración Inicial

### tailwind.config.js

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Habilitar dark mode con class strategy
  darkMode: 'class',

  content: [
    "./src/**/*.{html,ts}",
  ],

  theme: {
    extend: {
      colors: {
        // Custom dark mode colors
        dark: {
          bg: '#0f172a',        // slate-900
          surface: '#1e293b',   // slate-800
          border: '#334155',    // slate-700
          text: '#f1f5f9',      // slate-100
          'text-muted': '#94a3b8' // slate-400
        }
      }
    },
  },

  plugins: [],
}
```

## 2. Theme Service

```typescript
// src/app/core/services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

/**
 * Service para gestionar el tema de la aplicación (light/dark mode).
 *
 * Características:
 * - Persistencia en localStorage
 * - Detección automática del sistema
 * - Observación de cambios del sistema
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'theme-preference';

  // Theme preference: 'light', 'dark', or 'auto'
  themePreference = signal<Theme>(this.loadThemePreference());

  // Actual theme being applied: 'light' or 'dark'
  activeTheme = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    // Apply theme when it changes
    effect(() => {
      const theme = this.activeTheme();
      this.applyTheme(theme);
    });

    // Update theme when preference changes
    effect(() => {
      const preference = this.themePreference();
      const theme = this.resolveTheme(preference);
      this.activeTheme.set(theme);
      localStorage.setItem(this.STORAGE_KEY, preference);
    });

    // Listen to system theme changes
    this.watchSystemTheme();
  }

  /**
   * Set theme preference (light, dark, or auto).
   */
  setTheme(theme: Theme): void {
    this.themePreference.set(theme);
  }

  /**
   * Toggle between light and dark.
   */
  toggleTheme(): void {
    const current = this.activeTheme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  /**
   * Check if dark mode is active.
   */
  isDark(): boolean {
    return this.activeTheme() === 'dark';
  }

  // ========== Private methods ==========

  private loadThemePreference(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    return stored || 'auto';
  }

  private getInitialTheme(): 'light' | 'dark' {
    return this.resolveTheme(this.themePreference());
  }

  private resolveTheme(preference: Theme): 'light' | 'dark' {
    if (preference === 'auto') {
      return this.getSystemTheme();
    }
    return preference;
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private watchSystemTheme(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      if (this.themePreference() === 'auto') {
        const theme = e.matches ? 'dark' : 'light';
        this.activeTheme.set(theme);
      }
    });
  }
}
```

## 3. Theme Switcher Component

```typescript
// src/app/shared/components/theme-switcher/theme-switcher.component.ts
import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '@/core/services/theme.service';

/**
 * Theme switcher component con dropdown.
 *
 * @example
 * <app-theme-switcher></app-theme-switcher>
 * <app-theme-switcher variant="icon-only"></app-theme-switcher>
 */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      @if (variant === 'dropdown') {
        <!-- Dropdown version -->
        <button
          type="button"
          (click)="isOpen = !isOpen"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if (themeService.isDark()) {
              <!-- Moon icon -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            } @else {
              <!-- Sun icon -->
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            }
          </svg>
          {{ getThemeLabel(themeService.themePreference()) }}
        </button>

        @if (isOpen) {
          <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            @for (option of themeOptions; track option.value) {
              <button
                type="button"
                (click)="selectTheme(option.value)"
                [class]="getOptionClasses(option.value)"
              >
                <span [innerHTML]="option.icon" class="mr-3"></span>
                <span>{{ option.label }}</span>

                @if (themeService.themePreference() === option.value) {
                  <svg class="ml-auto w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                }
              </button>
            }
          </div>
        }
      } @else {
        <!-- Icon-only toggle version -->
        <button
          type="button"
          (click)="themeService.toggleTheme()"
          class="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-label="Toggle theme"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if (themeService.isDark()) {
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            } @else {
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            }
          </svg>
        </button>
      }
    </div>
  `
})
export class ThemeSwitcherComponent {
  @Input() variant: 'dropdown' | 'icon-only' = 'icon-only';

  themeService = inject(ThemeService);
  isOpen = false;

  themeOptions = [
    {
      value: 'light' as Theme,
      label: 'Light',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
    },
    {
      value: 'dark' as Theme,
      label: 'Dark',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>'
    },
    {
      value: 'auto' as Theme,
      label: 'System',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>'
    }
  ];

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.isOpen = false;
  }

  getThemeLabel(theme: Theme): string {
    return this.themeOptions.find(opt => opt.value === theme)?.label || 'Theme';
  }

  getOptionClasses(theme: Theme): string {
    const base = 'w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
    const selected = this.themeService.themePreference() === theme
      ? 'bg-gray-50 dark:bg-gray-700/50'
      : '';
    return `${base} ${selected}`;
  }
}
```

## 4. Uso en App Component

```typescript
// src/app/app.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { ThemeSwitcherComponent } from './shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ThemeSwitcherComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                MyApp
              </h1>
            </div>

            <div class="flex items-center">
              <app-theme-switcher variant="dropdown"></app-theme-switcher>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    // Theme service se inicializa automáticamente
    console.log('Current theme:', this.themeService.activeTheme());
  }
}
```

## 5. Patrones de Dark Mode en Componentes

### Colores adaptables

```html
<!-- Background colors -->
<div class="bg-white dark:bg-gray-800">Content</div>
<div class="bg-gray-50 dark:bg-gray-900">Light background</div>

<!-- Text colors -->
<h1 class="text-gray-900 dark:text-white">Heading</h1>
<p class="text-gray-700 dark:text-gray-300">Body text</p>
<span class="text-gray-500 dark:text-gray-400">Muted text</span>

<!-- Border colors -->
<div class="border border-gray-200 dark:border-gray-700">Bordered</div>

<!-- Hover states -->
<button class="hover:bg-gray-100 dark:hover:bg-gray-700">
  Hover me
</button>

<!-- Focus ring -->
<input class="focus:ring-blue-500 dark:focus:ring-blue-400">
```

### Componentes con dark mode

Todos los componentes de la biblioteca ya incluyen soporte de dark mode. Ejemplos:

```typescript
// Button component
class="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"

// Card component
class="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"

// Input component
class="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"

// Modal backdrop
class="bg-black/50 dark:bg-black/70 backdrop-blur-sm"
```

## 6. Testing Dark Mode

```typescript
// src/app/core/services/theme.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    localStorage.clear();
  });

  it('should default to auto theme', () => {
    expect(service.themePreference()).toBe('auto');
  });

  it('should set theme preference', () => {
    service.setTheme('dark');
    expect(service.themePreference()).toBe('dark');
    expect(service.activeTheme()).toBe('dark');
  });

  it('should toggle theme', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.themePreference()).toBe('dark');
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('should apply dark class to document', () => {
    service.setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

## 7. Preveniendo Flash de Tema Incorrecto

Para evitar el "flash" de tema incorrecto al cargar la página, agregar script en `index.html`:

```html
<!-- src/index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MyApp</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">

  <!-- Prevent theme flash -->
  <script>
    (function() {
      const theme = localStorage.getItem('theme-preference');

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto mode - check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    })();
  </script>
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

## 8. Imágenes Adaptables a Dark Mode

```typescript
// src/app/shared/components/adaptive-image/adaptive-image.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@/core/services/theme.service';

/**
 * Image component que cambia según el tema.
 */
@Component({
  selector: 'app-adaptive-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      [src]="currentSrc()"
      [alt]="alt"
      [class]="customClass"
    />
  `
})
export class AdaptiveImageComponent {
  @Input() lightSrc = '';
  @Input() darkSrc = '';
  @Input() alt = '';
  @Input() customClass = '';

  private themeService = inject(ThemeService);

  currentSrc(): string {
    return this.themeService.isDark() ? this.darkSrc : this.lightSrc;
  }
}

// Uso
<app-adaptive-image
  lightSrc="/assets/logo-light.svg"
  darkSrc="/assets/logo-dark.svg"
  alt="Company logo"
  customClass="h-8"
></app-adaptive-image>
```

## 9. Colores Personalizados para Dark Mode

```javascript
// tailwind.config.js - Extended dark colors
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode primary colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // Dark mode specific colors
        'dark-primary': {
          400: '#60a5fa',  // Más claro que primary-500 para dark mode
          500: '#3b82f6',
          600: '#2563eb',
        }
      }
    }
  }
}

// Uso en componentes
<button class="bg-primary-600 dark:bg-dark-primary-500">
  Button
</button>
```

## 10. Best Practices

### ✅ DO:
- Usar `dark:` prefix en todas las clases de Tailwind
- Testear todos los componentes en ambos temas
- Mantener suficiente contraste en dark mode (WCAG AA)
- Persistir preferencia del usuario
- Proveer toggle accesible del tema

### ❌ DON'T:
- Forzar un tema sin opción del usuario
- Olvidar hover/focus states en dark mode
- Usar colores hardcodeados (usar CSS variables o Tailwind)
- Ignorar imágenes/iconos que necesitan versión dark

## Resumen

Dark mode implementation completa incluye:
- **ThemeService**: Gestión centralizada de tema con signals
- **ThemeSwitcherComponent**: UI para cambiar tema
- **Auto-detection**: Detección del tema del sistema
- **Persistencia**: Guardado en localStorage
- **Prevention de flash**: Script en index.html
- **Colores adaptables**: Todos los componentes con soporte dark
- **Testing**: Tests unitarios del servicio
- **Best practices**: Patrones y recomendaciones

Todos los componentes de la biblioteca ya incluyen clases `dark:` para soporte completo de dark mode.
