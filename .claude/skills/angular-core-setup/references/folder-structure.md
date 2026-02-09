# Estructura de Carpetas Detallada

Guía completa sobre la organización de archivos y carpetas en proyectos Angular standalone.

## Estructura Completa del Proyecto

```
my-angular-app/
├── .angular/                    # Cache de Angular (gitignored)
├── .vscode/                     # Configuración de VS Code
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── dist/                        # Build output (gitignored)
├── node_modules/                # Dependencias (gitignored)
├── public/                      # Assets estáticos
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── core/               # Singleton services, guards, interceptors
│   │   ├── shared/             # Componentes, pipes, directivas compartidas
│   │   ├── features/           # Módulos de funcionalidad
│   │   ├── layout/             # Layouts de la aplicación
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/                 # Imágenes, iconos, fonts
│   ├── environments/           # Variables de entorno
│   ├── styles/                 # Estilos globales
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── .editorconfig
├── .eslintignore
├── .gitignore
├── .prettierrc.json
├── .prettierignore
├── angular.json
├── package.json
├── README.md
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

## /src/app/core/

Módulo core contiene servicios singleton, guards, interceptors, y modelos globales.

```
core/
├── guards/
│   ├── auth-guard.ts              # Guard de autenticación
│   ├── admin-guard.ts             # Guard para admin
│   └── unsaved-changes-guard.ts  # Guard para cambios sin guardar
├── interceptors/
│   ├── http-interceptor.ts        # Interceptor HTTP global
│   ├── auth-interceptor.ts        # Agregar tokens a requests
│   ├── error-interceptor.ts       # Manejo global de errores
│   └── loading-interceptor.ts     # Loading state
├── services/
│   ├── auth.service.ts            # Servicio de autenticación
│   ├── api.service.ts             # Servicio HTTP base
│   ├── storage.service.ts         # LocalStorage/SessionStorage
│   ├── notification.service.ts    # Notificaciones/Toasts
│   ├── theme.service.ts           # Dark/Light theme
│   └── websocket.service.ts       # WebSocket connection
├── models/
│   ├── user.model.ts              # Modelo de usuario
│   ├── api-response.model.ts      # Response types
│   └── pagination.model.ts        # Pagination types
├── constants/
│   ├── api-endpoints.ts           # URLs de API
│   ├── storage-keys.ts            # Keys de storage
│   └── app-constants.ts           # Constantes globales
└── utils/
    ├── validators.ts              # Validadores custom
    ├── date-utils.ts              # Utilidades de fecha
    └── string-utils.ts            # Utilidades de string
```

### Ejemplo de Guard

```typescript
// core/guards/auth-guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

### Ejemplo de Interceptor

```typescript
// core/interceptors/auth-interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

## /src/app/shared/

Componentes, pipes, directivas y utilidades compartidas entre features.

```
shared/
├── components/
│   ├── button/
│   │   ├── button.ts
│   │   ├── button.html
│   │   └── button.css
│   ├── card/
│   ├── modal/
│   ├── table/
│   ├── pagination/
│   ├── loading-spinner/
│   ├── error-message/
│   └── confirm-dialog/
├── directives/
│   ├── highlight.directive.ts
│   ├── tooltip.directive.ts
│   ├── click-outside.directive.ts
│   └── auto-focus.directive.ts
├── pipes/
│   ├── format-date.pipe.ts
│   ├── truncate.pipe.ts
│   ├── safe-html.pipe.ts
│   └── filter.pipe.ts
└── utils/
    ├── form-utils.ts
    ├── array-utils.ts
    └── object-utils.ts
```

### Ejemplo de Componente Shared

```typescript
// shared/components/button/button.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrls: ['./button.css']
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() clicked = new EventEmitter<void>();

  get classes(): string {
    const baseClasses = 'btn';
    const variantClass = `btn-${this.variant}`;
    const sizeClass = `btn-${this.size}`;
    return `${baseClasses} ${variantClass} ${sizeClass}`;
  }

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
```

### Ejemplo de Directiva

```typescript
// shared/directives/highlight.directive.ts
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  @Input() appHighlight = 'yellow';

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.appHighlight);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('');
  }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
```

### Ejemplo de Pipe

```typescript
// shared/pipes/truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50, trail = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
```

## /src/app/features/

Módulos de funcionalidad, cada uno con sus propios componentes, servicios y rutas.

```
features/
├── home/
│   ├── home.ts
│   ├── home.html
│   ├── home.css
│   └── home.routes.ts
├── auth/
│   ├── login/
│   │   ├── login.ts
│   │   ├── login.html
│   │   └── login.css
│   ├── register/
│   │   ├── register.ts
│   │   ├── register.html
│   │   └── register.css
│   ├── forgot-password/
│   ├── auth.service.ts          # Servicio específico de auth
│   └── auth.routes.ts           # Rutas del módulo auth
├── dashboard/
│   ├── components/
│   │   ├── stats-card/
│   │   └── chart/
│   ├── dashboard.ts
│   ├── dashboard.html
│   ├── dashboard.css
│   ├── dashboard.service.ts
│   └── dashboard.routes.ts
└── users/
    ├── user-list/
    ├── user-detail/
    ├── user-form/
    ├── users.service.ts
    └── users.routes.ts
```

### Ejemplo de Feature con Rutas

```typescript
// features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  }
];
```

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/auth.routes').then(m => m.authRoutes)
  }
];
```

### Feature con Layout Propio

```
features/
└── admin/
    ├── admin-layout/
    │   ├── admin-layout.ts
    │   ├── admin-layout.html
    │   └── admin-layout.css
    ├── users-management/
    ├── settings/
    └── admin.routes.ts
```

```typescript
// features/admin/admin.routes.ts
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./users-management/users-management').then(m => m.UsersManagementComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent)
      }
    ]
  }
];
```

## /src/app/layout/

Layouts reutilizables de la aplicación.

```
layout/
├── main-layout/
│   ├── main-layout.ts
│   ├── main-layout.html
│   └── main-layout.css
│   └── components/
│       ├── header/
│       ├── footer/
│       └── sidebar/
└── auth-layout/
    ├── auth-layout.ts
    ├── auth-layout.html
    └── auth-layout.css
```

### Ejemplo de Layout

```typescript
// layout/main-layout/main-layout.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    SidebarComponent
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent {}
```

```html
<!-- layout/main-layout/main-layout.html -->
<div class="min-h-screen flex flex-col">
  <app-header></app-header>

  <div class="flex flex-1">
    <app-sidebar></app-sidebar>

    <main class="flex-1 p-6 bg-gray-50">
      <router-outlet></router-outlet>
    </main>
  </div>

  <app-footer></app-footer>
</div>
```

## /src/environments/

Variables de entorno por ambiente.

```
environments/
├── environment.ts              # Base environment
├── environment.development.ts  # Development
├── environment.staging.ts      # Staging (opcional)
└── environment.prod.ts         # Production
```

## /src/assets/

Assets estáticos.

```
assets/
├── images/
│   ├── logo.svg
│   ├── banner.jpg
│   └── placeholder.png
├── icons/
│   ├── icon-user.svg
│   └── icon-settings.svg
├── fonts/
│   ├── custom-font.woff2
│   └── custom-font.woff
└── data/
    └── mock-data.json
```

## /src/styles/

Estilos globales y utilities.

```
styles/
├── _variables.css       # CSS variables
├── _utilities.css       # Utility classes
├── _components.css      # Global component styles
└── _typography.css      # Typography styles
```

```css
/* styles/_variables.css */
:root {
  --color-primary: #1976d2;
  --color-secondary: #424242;
  --spacing-unit: 0.25rem;
  --border-radius: 0.375rem;
}
```

## Convenciones de Naming

### Archivos de Componentes

```
✅ Correcto (sin sufijo .component):
- home.ts
- user-list.ts
- admin-dashboard.ts

❌ Incorrecto (antiguo estilo):
- home.component.ts
- user-list.component.ts
```

### Archivos de Servicios

```
✅ Correcto:
- auth.service.ts
- api.service.ts
- storage.service.ts
```

### Archivos de Guards

```
✅ Correcto:
- auth-guard.ts
- admin-guard.ts

❌ Incorrecto:
- auth.guard.ts (antiguo estilo)
```

### Archivos de Interceptors

```
✅ Correcto:
- http-interceptor.ts
- auth-interceptor.ts
```

## Best Practices

1. **Feature-based organization**: Organizar por features, no por tipo de archivo
2. **Lazy loading**: Cargar features bajo demanda
3. **Shared vs Core**: Shared = reutilizable, Core = singleton
4. **Barrel exports**: Usar index.ts para exports limpios
5. **Standalone components**: Todo debe ser standalone
6. **Naming conventions**: Sin sufijos .component en archivos
7. **Path aliases**: Usar @core, @shared, @features
8. **One component per file**: Un componente por archivo

## Anti-Patterns a Evitar

❌ **No organizar por tipo de archivo**:
```
app/
├── components/    # Todos los componentes aquí
├── services/      # Todos los servicios aquí
└── pipes/         # Todos los pipes aquí
```

❌ **No usar carpeta "helpers" genérica**:
```
app/
└── helpers/       # Muy genérico
    ├── utils.ts
    └── functions.ts
```

❌ **No mezclar concerns**:
```
features/
└── users/
    ├── user.ts
    └── product.ts  # ❌ Product no pertenece a users
```

## Barrel Exports (index.ts)

Simplificar imports con barrel exports:

```typescript
// shared/components/index.ts
export * from './button/button';
export * from './card/card';
export * from './modal/modal';

// Uso:
import { ButtonComponent, CardComponent, ModalComponent } from '@shared/components';
```
