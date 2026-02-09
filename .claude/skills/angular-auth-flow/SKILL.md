---
name: angular-auth-flow
description: >
  Sistema completo de autenticación JWT para Angular standalone con Tailwind CSS.
  Usar cuando se necesite implementar login, registro, recuperación de contraseña, reset password,
  gestión de tokens JWT, auto-refresh de tokens, guards de autenticación, estado de auth con signals,
  user profile management, change password, email verification, remember me, interceptors JWT,
  manejo de sesión, o cualquier funcionalidad relacionada con autenticación segura en Angular.
  Incluye componentes estilizados con Tailwind, servicios tipados, guards funcionales, token utilities,
  y best practices de seguridad para proyectos Angular 19+ con APIs JWT.
---

# Angular Auth Flow - Sistema Completo de Autenticación JWT

Sistema de autenticación enterprise-ready para Angular standalone con JWT, Tailwind CSS y best practices de seguridad.

## Arquitectura del Sistema

```
auth-system/
├── features/auth/           # Componentes de autenticación
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── verify-email/
│   └── auth.routes.ts
├── core/
│   ├── services/
│   │   ├── auth.service.ts       # Servicio principal de auth
│   │   ├── token.service.ts      # Gestión de tokens
│   │   └── user.service.ts       # Gestión de perfil
│   ├── guards/
│   │   ├── auth.guard.ts         # Protege rutas autenticadas
│   │   └── guest.guard.ts        # Protege rutas de invitados
│   ├── interceptors/
│   │   └── jwt.interceptor.ts    # Agrega JWT a requests
│   ├── models/
│   │   └── auth.models.ts        # Interfaces tipadas
│   └── utils/
│       └── jwt.util.ts           # Utilidades JWT
└── shared/stores/
    └── auth.store.ts             # Estado global con signals
```

## 1. Interfaces y Modelos Tipados

Crear `src/app/core/models/auth.models.ts`:

```typescript
// User model
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth requests
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  avatar?: string;
}

// Auth responses
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos
  tokenType: 'Bearer';
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// JWT payload
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  exp: number; // timestamp de expiración
  iat: number; // timestamp de emisión
}
```

## 2. JWT Utilities

Crear `src/app/core/utils/jwt.util.ts`:

```typescript
import { JwtPayload } from '@core/models/auth.models';

/**
 * Decodifica un JWT sin validar la firma (solo para leer el payload)
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Verifica si un token está expirado
 * @param token - JWT token
 * @param bufferSeconds - Buffer antes de expiración (default: 60s)
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const expirationTime = payload.exp * 1000; // Convertir a milliseconds
  const now = Date.now();
  const bufferTime = bufferSeconds * 1000;

  return now >= expirationTime - bufferTime;
}

/**
 * Obtiene el tiempo restante hasta expiración en segundos
 */
export function getTokenExpirationTime(token: string): number {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const now = Date.now();
  const remaining = Math.floor((expirationTime - now) / 1000);

  return remaining > 0 ? remaining : 0;
}

/**
 * Extrae el user ID del token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.sub || null;
}
```

## 3. Token Service

Crear `src/app/core/services/token.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { isTokenExpired } from '@core/utils/jwt.util';

type StorageType = 'localStorage' | 'sessionStorage';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';

  /**
   * Guarda los tokens en storage
   */
  saveTokens(accessToken: string, refreshToken: string, rememberMe = false): void {
    const storage = this.getStorage(rememberMe);
    storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.REMEMBER_ME_KEY, String(rememberMe));
  }

  /**
   * Obtiene el access token
   */
  getAccessToken(): string | null {
    return this.getFromBothStorages(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Obtiene el refresh token
   */
  getRefreshToken(): string | null {
    return this.getFromBothStorages(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Actualiza solo el access token (usado en refresh)
   */
  updateAccessToken(accessToken: string): void {
    const rememberMe = this.isRememberMeEnabled();
    const storage = this.getStorage(rememberMe);
    storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
  }

  /**
   * Verifica si el access token es válido
   */
  isAccessTokenValid(): boolean {
    const token = this.getAccessToken();
    return token !== null && !isTokenExpired(token);
  }

  /**
   * Verifica si el refresh token es válido
   */
  isRefreshTokenValid(): boolean {
    const token = this.getRefreshToken();
    return token !== null && !isTokenExpired(token, 0); // Sin buffer
  }

  /**
   * Limpia todos los tokens
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica si "Remember Me" está habilitado
   */
  private isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  /**
   * Obtiene el storage adecuado según "Remember Me"
   */
  private getStorage(rememberMe: boolean): Storage {
    return rememberMe ? localStorage : sessionStorage;
  }

  /**
   * Busca un valor en ambos storages (prioriza localStorage)
   */
  private getFromBothStorages(key: string): string | null {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }
}
```

## 4. Auth Service

Crear `src/app/core/services/auth.service.ts`:

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, timer, switchMap, tap, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { TokenService } from './token.service';
import {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  RefreshTokenResponse,
  ApiResponse
} from '@core/models/auth.models';
import { decodeJwt, getTokenExpirationTime } from '@core/utils/jwt.util';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  // Signals para estado reactivo
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);

  // Subject para refresh token
  private refreshTokenInProgress = new BehaviorSubject<boolean>(false);
  private autoRefreshSubscription: any;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Inicializa el estado de autenticación al cargar la app
   */
  private initializeAuth(): void {
    if (this.tokenService.isAccessTokenValid()) {
      this.loadCurrentUser();
      this.startAutoRefresh();
    } else if (this.tokenService.isRefreshTokenValid()) {
      this.refreshToken().subscribe();
    } else {
      this.tokenService.clearTokens();
    }
  }

  /**
   * Login de usuario
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    this.isLoading.set(true);

    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data, credentials.rememberMe);
        }
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Registro de usuario
   */
  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    this.isLoading.set(true);

    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/register`,
      data
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data, false);
        }
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Logout de usuario
   */
  logout(): void {
    this.stopAutoRefresh();

    // Opcional: Notificar al backend
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({
          error: () => console.warn('Error notifying logout to backend')
        });
    }

    this.tokenService.clearTokens();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh del access token
   */
  refreshToken(): Observable<RefreshTokenResponse | null> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken || this.refreshTokenInProgress.value) {
      return of(null);
    }

    this.refreshTokenInProgress.next(true);

    return this.http.post<RefreshTokenResponse>(
      `${environment.apiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.tokenService.updateAccessToken(response.accessToken);
        this.refreshTokenInProgress.next(false);
        this.startAutoRefresh();
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.refreshTokenInProgress.next(false);
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Forgot password - envía email de recuperación
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    this.isLoading.set(true);

    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/forgot-password`,
      data
    ).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Reset password con token
   */
  resetPassword(data: ResetPasswordRequest): Observable<ApiResponse<{ message: string }>> {
    this.isLoading.set(true);

    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/reset-password`,
      data
    ).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Verifica email con token
   */
  verifyEmail(token: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/verify-email`,
      { token }
    );
  }

  /**
   * Reenvía email de verificación
   */
  resendVerificationEmail(): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/resend-verification`,
      {}
    );
  }

  /**
   * Carga el usuario actual desde el token
   */
  private loadCurrentUser(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) return;

    const payload = decodeJwt(token);
    if (!payload) return;

    // Cargar datos completos del usuario desde la API
    this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`)
      .subscribe({
        next: response => {
          if (response.success && response.data) {
            this.currentUser.set(response.data);
            this.isAuthenticated.set(true);
          }
        },
        error: () => {
          this.logout();
        }
      });
  }

  /**
   * Maneja el éxito de autenticación (login/register)
   */
  private handleAuthSuccess(authResponse: AuthResponse, rememberMe = false): void {
    this.tokenService.saveTokens(
      authResponse.accessToken,
      authResponse.refreshToken,
      rememberMe
    );
    this.currentUser.set(authResponse.user);
    this.isAuthenticated.set(true);
    this.startAutoRefresh();
  }

  /**
   * Inicia auto-refresh de tokens antes de expiración
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    const token = this.tokenService.getAccessToken();
    if (!token) return;

    const expiresIn = getTokenExpirationTime(token);
    // Refresh 2 minutos antes de expiración
    const refreshTime = Math.max((expiresIn - 120) * 1000, 0);

    if (refreshTime > 0) {
      this.autoRefreshSubscription = timer(refreshTime)
        .pipe(switchMap(() => this.refreshToken()))
        .subscribe();
    }
  }

  /**
   * Detiene auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }
  }
}
```

## 5. User Service (Profile Management)

Crear `src/app/core/services/user.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import {
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ApiResponse
} from '@core/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(data: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(
      `${environment.apiUrl}/user/profile`,
      data
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Actualizar usuario en AuthService
          this.authService.currentUser.set(response.data);
        }
      })
    );
  }

  /**
   * Cambia la contraseña del usuario
   */
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/user/change-password`,
      data
    );
  }

  /**
   * Sube avatar del usuario
   */
  uploadAvatar(file: File): Observable<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<ApiResponse<{ avatarUrl: string }>>(
      `${environment.apiUrl}/user/avatar`,
      formData
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            this.authService.currentUser.set({
              ...currentUser,
              avatar: response.data.avatarUrl
            });
          }
        }
      })
    );
  }

  /**
   * Elimina cuenta del usuario
   */
  deleteAccount(password: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/user/delete-account`,
      { password }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.authService.logout();
        }
      })
    );
  }
}
```

## 6. JWT Interceptor

Crear `src/app/core/interceptors/jwt.interceptor.ts`:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '@core/services/token.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Interceptor funcional que agrega JWT a todas las requests
 * y maneja refresh automático en caso de token expirado
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // Endpoints que no requieren autenticación
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublicEndpoint) {
    return next(req);
  }

  // Agregar token a la request
  const accessToken = tokenService.getAccessToken();
  if (accessToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 y tenemos refresh token, intentar refresh
      if (error.status === 401 && tokenService.isRefreshTokenValid()) {
        return authService.refreshToken().pipe(
          switchMap(response => {
            if (response) {
              // Reintentar request original con nuevo token
              const newToken = tokenService.getAccessToken();
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
```

## 7. Auth Guards

### Auth Guard (protege rutas autenticadas)

Crear `src/app/core/guards/auth.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Guard funcional que protege rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Guardar URL solicitada para redirect después de login
  const returnUrl = state.url;
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl }
  });

  return false;
};

/**
 * Guard funcional que verifica roles específicos
 */
export const roleGuard: (roles: string[]) => CanActivateFn = (allowedRoles: string[]) => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUser();

    if (!currentUser) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles.includes(currentUser.role)) {
      return true;
    }

    // Redirect a página de acceso denegado
    router.navigate(['/forbidden']);
    return false;
  };
};

/**
 * Guard funcional que verifica email verificado
 */
export const emailVerifiedGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (!currentUser) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (currentUser.emailVerified) {
    return true;
  }

  router.navigate(['/auth/verify-email']);
  return false;
};
```

### Guest Guard (protege rutas de invitados)

Crear `src/app/core/guards/guest.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Guard funcional que protege rutas solo para invitados (no autenticados)
 * Ejemplo: login, register
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Ya está autenticado, redirect a dashboard
  router.navigate(['/dashboard']);
  return false;
};
```

## 8. Componentes de Autenticación

### LoginComponent

Crear `src/app/features/auth/login/login.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get isLoading() {
    return this.authService.isLoading;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: response => {
        if (response.success) {
          // Redirect a returnUrl o dashboard
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigate([returnUrl]);
        }
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Invalid credentials. Please try again.'
        );
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['minlength']) {
      return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }

    return '';
  }
}
```

Crear `src/app/features/auth/login/login.component.html`:

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Or
        <a routerLink="/auth/register" class="font-medium text-primary hover:text-blue-700">
          create a new account
        </a>
      </p>
    </div>

    <!-- Login Form -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <p class="text-sm">{{ errorMessage() }}</p>
        </div>
      }

      <div class="space-y-4">
        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            placeholder="you@example.com"
            [class.border-red-500]="loginForm.get('email')?.touched && loginForm.get('email')?.invalid"
          />
          @if (getErrorMessage('email')) {
            <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('email') }}</p>
          }
        </div>

        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              [class.border-red-500]="loginForm.get('password')?.touched && loginForm.get('password')?.invalid"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility()"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              @if (showPassword()) {
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              } @else {
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              }
            </button>
          </div>
          @if (getErrorMessage('password')) {
            <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('password') }}</p>
          }
        </div>
      </div>

      <!-- Remember Me & Forgot Password -->
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            formControlName="rememberMe"
            class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
          />
          <label for="rememberMe" class="ml-2 block text-sm text-gray-700 cursor-pointer">
            Remember me
          </label>
        </div>

        <div class="text-sm">
          <a routerLink="/auth/forgot-password" class="font-medium text-primary hover:text-blue-700">
            Forgot password?
          </a>
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          [disabled]="isLoading()"
          class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          @if (isLoading()) {
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2">Signing in...</span>
          } @else {
            Sign in
          }
        </button>
      </div>
    </form>
  </div>
</div>
```

### RegisterComponent

Crear `src/app/features/auth/register/register.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);
  showPasswordConfirmation = signal<boolean>(false);

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      passwordConfirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  get isLoading() {
    return this.authService.isLoading;
  }

  /**
   * Validador custom de fortaleza de contraseña
   */
  private passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return passwordValid ? null : { passwordStrength: true };
  }

  /**
   * Validador custom para confirmar contraseña
   */
  private passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const passwordConfirmation = group.get('passwordConfirmation')?.value;

    return password === passwordConfirmation ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: response => {
        if (response.success) {
          this.router.navigate(['/auth/verify-email']);
        }
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Registration failed. Please try again.'
        );
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmation'): void {
    if (field === 'password') {
      this.showPassword.update(value => !value);
    } else {
      this.showPasswordConfirmation.update(value => !value);
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['minlength']) {
      return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['passwordStrength']) {
      return 'Password must contain uppercase, lowercase, number and special character';
    }

    return '';
  }

  getFormErrorMessage(): string {
    if (this.registerForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }
}
```

Ver template completo en `references/register-template.md`.

### ForgotPasswordComponent

Crear `src/app/features/auth/forgot-password/forgot-password.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotPasswordForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get isLoading() {
    return this.authService.isLoading;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
      next: response => {
        if (response.success) {
          this.successMessage.set(
            'Password reset link has been sent to your email. Please check your inbox.'
          );
          this.forgotPasswordForm.reset();
        }
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Failed to send reset email. Please try again.'
        );
      }
    });
  }
}
```

Ver template en `references/forgot-password-template.md`.

### ResetPasswordComponent

Crear `src/app/features/auth/reset-password/reset-password.component.ts`:

```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm: FormGroup;
  errorMessage = signal<string>('');
  tokenValid = signal<boolean>(true);
  showPassword = signal<boolean>(false);
  showPasswordConfirmation = signal<boolean>(false);

  private token: string = '';

  constructor() {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Obtener token de query params
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.token) {
      this.tokenValid.set(false);
      this.errorMessage.set('Invalid or missing reset token');
    }
  }

  get isLoading() {
    return this.authService.isLoading;
  }

  private passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const passwordConfirmation = group.get('passwordConfirmation')?.value;

    return password === passwordConfirmation ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.tokenValid()) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    const data = {
      token: this.token,
      ...this.resetPasswordForm.value
    };

    this.authService.resetPassword(data).subscribe({
      next: response => {
        if (response.success) {
          this.router.navigate(['/auth/login'], {
            queryParams: { message: 'Password reset successful. Please login with your new password.' }
          });
        }
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Failed to reset password. The link may have expired.'
        );
        this.tokenValid.set(false);
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmation'): void {
    if (field === 'password') {
      this.showPassword.update(value => !value);
    } else {
      this.showPasswordConfirmation.update(value => !value);
    }
  }
}
```

Ver template en `references/reset-password-template.md`.

## 9. Auth Routes

Crear `src/app/features/auth/auth.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
```

## 10. Integración en app.config.ts

Actualizar `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from '@core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
  ]
};
```

## 11. Rutas Principales

Actualizar `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard, roleGuard, emailVerifiedGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('@features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, emailVerifiedGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('@features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('@features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard(['admin', 'super-admin'])]
  },
  {
    path: 'forbidden',
    loadComponent: () => import('@shared/components/forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
```

## 12. Ejemplo de Uso en Componentes

```typescript
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="bg-white shadow-md">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="text-xl font-bold text-primary">MyApp</div>

        <div class="flex items-center space-x-4">
          @if (isAuthenticated()) {
            <span class="text-gray-700">Hello, {{ currentUser()?.firstName }}!</span>
            <a routerLink="/profile" class="text-gray-700 hover:text-primary">Profile</a>
            <button (click)="logout()" class="btn-primary">Logout</button>
          } @else {
            <a routerLink="/auth/login" class="text-gray-700 hover:text-primary">Login</a>
            <a routerLink="/auth/register" class="btn-primary">Sign Up</a>
          }
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  private authService = inject(AuthService);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  // Computed signal example
  userFullName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  logout(): void {
    this.authService.logout();
  }
}
```

## Referencias Adicionales

Para información detallada sobre temas específicos, consulta los siguientes archivos:

- **Templates de componentes adicionales**: Ver `references/component-templates.md`
- **Email Verification Component**: Ver `references/verify-email-component.md`
- **Profile Management Component**: Ver `references/profile-component.md`
- **Change Password Component**: Ver `references/change-password-component.md`
- **JWT Security Best Practices**: Ver `references/security-best-practices.md`
- **Session Management**: Ver `references/session-management.md`
- **Testing Auth Components**: Ver `references/testing-auth.md`
- **API Integration Examples**: Ver `references/api-integration.md`

## Checklist de Implementación

- [ ] Interfaces y modelos tipados creados
- [ ] JWT utilities implementadas
- [ ] TokenService con remember me
- [ ] AuthService completo con auto-refresh
- [ ] UserService para profile management
- [ ] JWT Interceptor configurado
- [ ] Auth Guards (auth, guest, role, emailVerified)
- [ ] LoginComponent con validaciones
- [ ] RegisterComponent con password strength
- [ ] ForgotPasswordComponent
- [ ] ResetPasswordComponent con token validation
- [ ] VerifyEmailComponent
- [ ] ProfileComponent con avatar upload
- [ ] ChangePasswordComponent
- [ ] Auth routes configuradas
- [ ] Guards aplicados en rutas principales
- [ ] Interceptor agregado en app.config.ts
- [ ] Signals para estado reactivo
- [ ] Error handling en todos los componentes
- [ ] Loading states implementados
- [ ] Auto-refresh de tokens funcionando
- [ ] Session timeout detection
- [ ] Remember me functionality

## Best Practices

1. **Seguridad**:
   - Nunca almacenar tokens en cookies sin httpOnly flag
   - Validar tokens en el backend siempre
   - Usar HTTPS en producción
   - Implementar rate limiting en endpoints de auth
   - Hash passwords con bcrypt (backend)

2. **UX**:
   - Mostrar loading states durante operaciones
   - Mensajes de error claros y específicos
   - Redirect automático después de login
   - Guardar returnUrl para mejor UX
   - Confirmar antes de logout

3. **Performance**:
   - Usar signals para reactividad eficiente
   - Lazy loading de componentes
   - Guards funcionales en lugar de class-based
   - Interceptores funcionales

4. **Mantenibilidad**:
   - Separar lógica de negocio en servicios
   - Interfaces tipadas para todo
   - Componentes standalone reutilizables
   - Referencias externas para detalles

## Comandos Rápidos

```bash
# Generar componentes
ng g c features/auth/login --standalone
ng g c features/auth/register --standalone
ng g c features/auth/forgot-password --standalone
ng g c features/auth/reset-password --standalone
ng g c features/auth/verify-email --standalone
ng g c features/profile/profile --standalone
ng g c features/profile/change-password --standalone

# Generar servicios
ng g s core/services/auth
ng g s core/services/token
ng g s core/services/user

# Generar guards
ng g guard core/guards/auth --functional
ng g guard core/guards/guest --functional

# Generar interceptor
ng g interceptor core/interceptors/jwt --functional
```

## Notas Importantes

- **Auto-refresh**: Los tokens se refrescan automáticamente 2 minutos antes de expiración
- **Session timeout**: Se detecta automáticamente cuando el refresh token expira
- **Remember me**: Usa localStorage para sesiones persistentes, sessionStorage para sesiones temporales
- **Error handling**: Todos los errores 401 intentan refresh automático antes de logout
- **Email verification**: Se puede reenviar email de verificación si es necesario
- **Password reset**: Los tokens de reset deben tener expiración corta (15-30 min)
