# AuthService Integration con Guards

Implementación completa de AuthService para integración con routing guards.

## AuthService Base

```typescript
// src/app/core/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '@/environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // State management con signals
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  // Computed signals
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly userRoles = computed(() => this.userSignal()?.roles ?? []);
  readonly userPermissions = computed(() => this.userSignal()?.permissions ?? []);

  constructor() {
    // Cargar usuario desde localStorage al iniciar
    this.loadUserFromStorage();
  }

  /**
   * Login del usuario y almacenamiento de token.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response.user, response.token);
          this.saveToStorage(response.user, response.token);
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  /**
   * Logout del usuario y limpieza de estado.
   */
  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Limpiar de todas formas
        this.clearAuthData();
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Refresh del token de autenticación.
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setAuthData(response.user, response.token);
          this.saveToStorage(response.user, response.token);
        })
      );
  }

  /**
   * Verifica si el usuario está autenticado (para guards).
   */
  isAuthenticatedSync(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Obtiene roles del usuario (para roleGuard).
   */
  getUserRoles(): string[] {
    return this.userRoles();
  }

  /**
   * Obtiene permisos del usuario (para permissionGuard).
   */
  getUserPermissions(): string[] {
    return this.userPermissions();
  }

  /**
   * Verifica si el usuario tiene un rol específico.
   */
  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  /**
   * Verifica si el usuario tiene un permiso específico.
   */
  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados.
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados.
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(perm => this.hasPermission(perm));
  }

  /**
   * Obtiene el token actual (para interceptors).
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Obtiene el usuario actual.
   */
  getCurrentUser(): User | null {
    return this.userSignal();
  }

  // ========== Private methods ==========

  private setAuthData(user: User, token: string): void {
    this.userSignal.set(user);
    this.tokenSignal.set(token);
  }

  private clearAuthData(): void {
    this.userSignal.set(null);
    this.tokenSignal.set(null);
    this.clearStorage();
  }

  private saveToStorage(user: User, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }

  private loadUserFromStorage(): void {
    try {
      const userJson = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (userJson && token) {
        const user = JSON.parse(userJson) as User;
        this.setAuthData(user, token);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}
```

## AuthStore (State Management Avanzado)

```typescript
// src/app/core/stores/auth.store.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService, User } from '../services/auth.service';

/**
 * Store centralizado para estado de autenticación.
 * Wrapper sobre AuthService con estado reactivo adicional.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private authService = inject(AuthService);

  // Loading states
  readonly isLoggingIn = signal(false);
  readonly isLoggingOut = signal(false);

  // Exposed signals from AuthService
  readonly user = this.authService.user;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly userRoles = this.authService.userRoles;

  // Computed user info
  readonly userDisplayName = computed(() => {
    const user = this.user();
    return user ? user.name : 'Guest';
  });

  readonly isAdmin = computed(() => {
    return this.userRoles().includes('admin');
  });

  readonly canManageUsers = computed(() => {
    return this.authService.hasAnyRole(['admin', 'manager']);
  });

  // Actions
  login(credentials: { email: string; password: string }) {
    this.isLoggingIn.set(true);

    return this.authService.login(credentials).pipe(
      tap(() => this.isLoggingIn.set(false)),
      catchError(error => {
        this.isLoggingIn.set(false);
        throw error;
      })
    );
  }

  logout() {
    this.isLoggingOut.set(true);
    this.authService.logout();
    // AuthService ya maneja el navigate y cleanup
  }
}
```

## Guard Usage con AuthService

```typescript
// src/app/core/guards/auth.guard.ts (actualizado)
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Usar computed signal
  if (!authStore.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
```

## Login Component Integration

```typescript
// src/app/features/auth/login.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthStore } from '@/core/stores/auth.store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          @if (errorMessage()) {
            <div class="bg-red-50 text-red-800 p-3 rounded">
              {{ errorMessage() }}
            </div>
          }

          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                formControlName="email"
                type="email"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                formControlName="password"
                type="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || authStore.isLoggingIn()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              @if (authStore.isLoggingIn()) {
                <span>Signing in...</span>
              } @else {
                <span>Sign in</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);

  loginForm!: FormGroup;
  errorMessage = signal<string | null>(null);
  private returnUrl = '/dashboard';

  ngOnInit(): void {
    // Inicializar formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Obtener returnUrl de query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/dashboard';
    });

    // Si ya está autenticado, redirigir
    if (this.authStore.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage.set(null);

    this.authStore.login(this.loginForm.value).subscribe({
      next: () => {
        // Redirigir a returnUrl después del login exitoso
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage.set(error.error?.message || 'Login failed. Please try again.');
      }
    });
  }
}
```

## Navbar Component con Auth State

```typescript
// src/app/shared/components/navbar.component.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '@/core/stores/auth.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <a routerLink="/" class="text-white font-bold text-xl">MyApp</a>

            @if (authStore.isAuthenticated()) {
              <div class="ml-10 flex items-baseline space-x-4">
                <a routerLink="/dashboard" class="text-gray-300 hover:text-white px-3 py-2">
                  Dashboard
                </a>

                @if (authStore.canManageUsers()) {
                  <a routerLink="/users" class="text-gray-300 hover:text-white px-3 py-2">
                    Users
                  </a>
                }

                @if (authStore.isAdmin()) {
                  <a routerLink="/admin" class="text-gray-300 hover:text-white px-3 py-2">
                    Admin
                  </a>
                }
              </div>
            }
          </div>

          <div>
            @if (authStore.isAuthenticated()) {
              <div class="flex items-center space-x-4">
                <span class="text-gray-300">{{ authStore.userDisplayName() }}</span>
                <button
                  (click)="onLogout()"
                  class="text-gray-300 hover:text-white px-3 py-2"
                >
                  Logout
                </button>
              </div>
            } @else {
              <a routerLink="/login" class="text-gray-300 hover:text-white px-3 py-2">
                Login
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  readonly authStore = inject(AuthStore);
  private router = inject(Router);

  onLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authStore.logout();
    }
  }
}
```

## Role-based UI Rendering

```typescript
// src/app/shared/directives/has-role.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthStore } from '@/core/stores/auth.store';

/**
 * Directive para mostrar/ocultar elementos según roles.
 *
 * @example
 * <div *appHasRole="'admin'">Admin only content</div>
 * <div *appHasRole="['admin', 'manager']">Admin or manager content</div>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole: string | string[] = [];

  private authStore = inject(AuthStore);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const requiredRoles = Array.isArray(this.appHasRole)
      ? this.appHasRole
      : [this.appHasRole];

    const hasRole = requiredRoles.some(role =>
      this.authStore.userRoles().includes(role)
    );

    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

## Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com/api',
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token'
};
```

## Summary

Esta integración proporciona:

1. **AuthService** completo con signals para estado reactivo
2. **AuthStore** para state management centralizado
3. **LoginComponent** con manejo de returnUrl
4. **Guards** integrados con AuthService/AuthStore
5. **Navbar** reactivo a cambios de autenticación
6. **Directive** para renderizado condicional basado en roles
7. **Environment** configuration para diferentes entornos

Todos los componentes son standalone, usan signals para reactividad, y siguen best practices de Angular 19+.
