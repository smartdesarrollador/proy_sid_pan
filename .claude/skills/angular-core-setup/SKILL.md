---
name: angular-core-setup
description: >
  Configuración inicial completa de proyectos Angular standalone con Tailwind CSS.
  Usar cuando se necesite inicializar un nuevo proyecto Angular desde cero, configurar
  Tailwind CSS con optimizaciones, establecer estructura de carpetas (features, core, shared),
  configurar environments, TypeScript strict mode, ESLint/Prettier, path aliases, HttpClient
  standalone, routing base, o variables de entorno tipadas. Incluye archivos de configuración
  completos, ejemplos funcionales y best practices de Angular 19+.
---

# Angular Core Setup - Configuración Inicial Completa

Guía paso a paso para configurar un proyecto Angular standalone con Tailwind CSS y best practices.

## 1. Crear Proyecto Angular Standalone

```bash
# Crear nuevo proyecto con standalone components (default desde Angular 17+)
ng new my-angular-app --routing --style=css --strict

# Navegar al proyecto
cd my-angular-app
```

**Flags importantes:**
- `--routing`: Genera configuración de routing
- `--style=css`: Usa CSS (lo cambiaremos a Tailwind)
- `--strict`: Habilita TypeScript strict mode

## 2. Instalar y Configurar Tailwind CSS

```bash
# Instalar Tailwind CSS y dependencias
npm install -D tailwindcss postcss autoprefixer

# Generar archivos de configuración
npx tailwindcss init
```

Crear archivo `.postcssrc.json`:

```json
{
  "plugins": {
    "tailwindcss": {},
    "autoprefixer": {}
  }
}
```

Actualizar `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#82b1ff',
      },
    },
  },
  plugins: [],
}
```

Actualizar `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities con @apply */
@layer components {
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition;
  }

  .card {
    @apply bg-white shadow-md rounded-lg p-6;
  }
}
```

## 3. Estructura de Carpetas Best Practices

Crear la siguiente estructura (sin sufijos en componentes):

```
src/
├── app/
│   ├── core/                    # Servicios singleton, guards, interceptors
│   │   ├── guards/
│   │   │   └── auth-guard.ts
│   │   ├── interceptors/
│   │   │   └── http-interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── api.service.ts
│   │   └── models/
│   │       └── user.model.ts
│   │
│   ├── shared/                  # Componentes, directivas, pipes reutilizables
│   │   ├── components/
│   │   │   ├── button/
│   │   │   │   ├── button.ts
│   │   │   │   ├── button.html
│   │   │   │   └── button.css
│   │   │   └── navbar/
│   │   ├── directives/
│   │   │   └── highlight.directive.ts
│   │   ├── pipes/
│   │   │   └── format-date.pipe.ts
│   │   └── utils/
│   │       └── validators.ts
│   │
│   ├── features/                # Módulos de funcionalidad
│   │   ├── home/
│   │   │   ├── home.ts
│   │   │   ├── home.html
│   │   │   ├── home.css
│   │   │   └── home.routes.ts
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── auth.routes.ts
│   │   └── dashboard/
│   │       ├── dashboard.ts
│   │       └── dashboard.routes.ts
│   │
│   ├── layout/                  # Layouts de la aplicación
│   │   ├── main-layout/
│   │   └── auth-layout/
│   │
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.css
│   ├── app.config.ts           # Configuración de la app
│   └── app.routes.ts           # Rutas principales
│
├── assets/
│   ├── images/
│   └── icons/
│
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
│
└── styles.css
```

Ejecutar comandos para generar estructura:

```bash
# Core
mkdir -p src/app/core/{guards,interceptors,services,models}

# Shared
mkdir -p src/app/shared/{components,directives,pipes,utils}

# Features
mkdir -p src/app/features/{home,auth,dashboard}

# Layout
mkdir -p src/app/layout/{main-layout,auth-layout}
```

## 4. Configurar Path Aliases

Actualizar `tsconfig.json` para incluir path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@layout/*": ["src/app/layout/*"],
      "@env/*": ["src/environments/*"]
    }
  }
}
```

Uso en imports:

```typescript
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/components/button/button';
```

## 5. Configurar Environments Tipados

Crear `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiKey: '',
  features: {
    enableAnalytics: false,
    enableLogging: true,
  },
};

export type Environment = typeof environment;
```

Crear `src/environments/environment.development.ts`:

```typescript
import { Environment } from './environment';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiKey: 'dev-key-12345',
  features: {
    enableAnalytics: false,
    enableLogging: true,
  },
};
```

Actualizar `angular.json` para usar environments:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod.ts"
      }
    ]
  }
}
```

Ver configuración completa en `references/angular-json.md`.

## 6. Configurar HttpClient Standalone

Actualizar `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { httpInterceptor } from '@core/interceptors/http-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([httpInterceptor])
    ),
  ]
};
```

Crear interceptor funcional en `src/app/core/interceptors/http-interceptor.ts`:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl;

  // Agregar base URL si es necesario
  const apiReq = req.clone({
    url: req.url.startsWith('http') ? req.url : `${apiUrl}/${req.url}`,
    setHeaders: {
      'Content-Type': 'application/json',
    },
  });

  return next(apiReq);
};
```

## 7. Configurar Routing Base

Actualizar `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('@features/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
```

Crear guard funcional en `src/app/core/guards/auth-guard.ts`:

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
```

## 8. Configurar TypeScript Strict Mode

Actualizar `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitAny": true
  }
}
```

Ver configuración completa en `references/typescript-config.md`.

## 9. Configurar ESLint y Prettier

```bash
# Instalar ESLint para Angular
ng add @angular-eslint/schematics

# Instalar Prettier
npm install -D prettier eslint-config-prettier

# Crear archivos de configuración
touch .prettierrc.json .prettierignore
```

Crear `.prettierrc.json`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "auto",
  "arrowParens": "avoid",
  "bracketSpacing": true
}
```

Crear `.prettierignore`:

```
dist
node_modules
coverage
.angular
```

Ver configuración completa de ESLint en `references/eslint-prettier.md`.

## 10. NPM Scripts Útiles

Actualizar `package.json`:

```json
{
  "scripts": {
    "start": "ng serve",
    "start:dev": "ng serve --configuration development",
    "build": "ng build",
    "build:prod": "ng build --configuration production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:coverage": "ng test --code-coverage",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier --write \"src/**/*.{ts,html,css,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,css,scss,json}\"",
    "analyze": "ng build --stats-json && webpack-bundle-analyzer dist/my-angular-app/stats.json"
  }
}
```

## 11. Ejemplo de Componente Standalone

Crear `src/app/features/home/home.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  title = 'Welcome to Angular!';

  features = [
    { name: 'TypeScript', icon: '🔷' },
    { name: 'Standalone Components', icon: '⚡' },
    { name: 'Tailwind CSS', icon: '🎨' },
  ];
}
```

Crear `src/app/features/home/home.html`:

```html
<div class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-primary mb-6">{{ title }}</h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    @for (feature of features; track feature.name) {
      <div class="card hover:shadow-lg transition">
        <div class="text-4xl mb-4">{{ feature.icon }}</div>
        <h3 class="text-xl font-semibold">{{ feature.name }}</h3>
      </div>
    }
  </div>

  <button class="btn-primary mt-8" routerLink="/dashboard">
    Go to Dashboard
  </button>
</div>
```

## 12. Servicio HTTP de Ejemplo

Crear `src/app/core/services/api.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  get<T>(endpoint: string, params?: Record<string, string>): Observable<ApiResponse<T>> {
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
    return this.http.get<ApiResponse<T>>(endpoint, { params: httpParams });
  }

  post<T>(endpoint: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(endpoint, body);
  }

  put<T>(endpoint: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(endpoint, body);
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(endpoint);
  }
}
```

## Checklist Final

- [ ] Proyecto Angular creado con `--strict`
- [ ] Tailwind CSS instalado y configurado
- [ ] Estructura de carpetas (core, shared, features, layout) creada
- [ ] Path aliases configurados en `tsconfig.json`
- [ ] Environments tipados creados
- [ ] HttpClient standalone configurado
- [ ] Routing base con lazy loading configurado
- [ ] Guards y interceptors funcionales creados
- [ ] TypeScript strict mode habilitado
- [ ] ESLint y Prettier configurados
- [ ] NPM scripts útiles agregados
- [ ] Ejemplo de componente standalone creado

## Referencias Adicionales

- **Configuración completa de angular.json**: Ver `references/angular-json.md`
- **Configuración detallada de Tailwind**: Ver `references/tailwind-config.md`
- **Configuración de TypeScript**: Ver `references/typescript-config.md`
- **Configuración de ESLint/Prettier**: Ver `references/eslint-prettier.md`
- **Estructura de carpetas detallada**: Ver `references/folder-structure.md`

## Best Practices

1. **Componentes standalone**: Usar standalone components para todo (default desde Angular 17+)
2. **Lazy loading**: Cargar features con `loadComponent` y `loadChildren`
3. **Guards funcionales**: Usar `CanActivateFn` en lugar de class-based guards
4. **Interceptors funcionales**: Usar `HttpInterceptorFn`
5. **Inject function**: Usar `inject()` en lugar de constructor injection cuando sea posible
6. **Control flow**: Usar nueva sintaxis `@if`, `@for`, `@switch` (Angular 17+)
7. **Signals**: Considerar usar signals para state management (Angular 16+)
8. **Naming**: Sin sufijos en componentes/servicios en nombres de archivo

## Comandos Rápidos

```bash
# Generar componente standalone
ng g c features/example --standalone

# Generar servicio
ng g s core/services/example

# Generar guard funcional
ng g guard core/guards/example --functional

# Generar interceptor funcional
ng g interceptor core/interceptors/example --functional

# Generar pipe
ng g pipe shared/pipes/example --standalone

# Iniciar servidor de desarrollo
npm run start:dev

# Build de producción
npm run build:prod

# Formatear código
npm run format

# Linter
npm run lint:fix
```
