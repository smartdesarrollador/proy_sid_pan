# Token Service - Implementación Completa

Servicio completo para gestión de tokens JWT con refresh automático.

## Implementación Completa

```typescript
// src/app/core/services/token.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Interfaz para la respuesta de login/refresh
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // Tiempo de expiración en segundos
  tokenType?: string;
}

/**
 * Interfaz para el payload decodificado del JWT
 */
export interface JwtPayload {
  sub: string;      // Subject (user ID)
  email?: string;
  name?: string;
  roles?: string[];
  exp: number;      // Expiration time (timestamp)
  iat: number;      // Issued at (timestamp)
  [key: string]: any;
}

/**
 * Servicio para gestión de tokens JWT
 * Proporciona métodos para almacenar, recuperar, validar y refrescar tokens
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private http = inject(HttpClient);

  // Keys para LocalStorage
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Subject para notificar cambios en el estado de autenticación
  private tokenSubject$ = new BehaviorSubject<string | null>(this.getToken());
  public token$ = this.tokenSubject$.asObservable();

  /**
   * Obtiene el access token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el refresh token del localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Almacena el access token en localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSubject$.next(token);
  }

  /**
   * Almacena el refresh token en localStorage
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Almacena ambos tokens (access y refresh)
   */
  setTokens(authResponse: AuthResponse): void {
    this.setToken(authResponse.accessToken);
    if (authResponse.refreshToken) {
      this.setRefreshToken(authResponse.refreshToken);
    }
  }

  /**
   * Elimina el access token del localStorage
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokenSubject$.next(null);
  }

  /**
   * Elimina el refresh token del localStorage
   */
  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Elimina ambos tokens (logout)
   */
  clearTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
  }

  /**
   * Verifica si existe un token
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Decodifica el JWT token sin verificación
   * NOTA: Solo para lectura del payload, NO para validación de seguridad
   */
  decodeToken(token: string | null = null): JwtPayload | null {
    const tokenToUse = token || this.getToken();

    if (!tokenToUse) {
      return null;
    }

    try {
      const parts = tokenToUse.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decodificar la parte del payload (segunda parte)
      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }

  /**
   * Obtiene la fecha de expiración del token
   */
  getTokenExpirationDate(token: string | null = null): Date | null {
    const decoded = this.decodeToken(token);

    if (!decoded || !decoded.exp) {
      return null;
    }

    // exp está en segundos, Date necesita milisegundos
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate;
  }

  /**
   * Verifica si el token está expirado
   * @param offsetSeconds - Offset en segundos para considerar expirado antes
   */
  isTokenExpired(token: string | null = null, offsetSeconds = 0): boolean {
    const expirationDate = this.getTokenExpirationDate(token);

    if (!expirationDate) {
      return true;
    }

    // Añadir offset para renovar token antes de que expire
    const now = new Date().getTime() + (offsetSeconds * 1000);
    return expirationDate.getTime() < now;
  }

  /**
   * Obtiene el tiempo restante hasta la expiración en segundos
   */
  getTimeUntilExpiration(token: string | null = null): number {
    const expirationDate = this.getTokenExpirationDate(token);

    if (!expirationDate) {
      return 0;
    }

    const now = new Date().getTime();
    const timeUntilExp = expirationDate.getTime() - now;

    return Math.max(0, Math.floor(timeUntilExp / 1000));
  }

  /**
   * Obtiene información del usuario desde el token
   */
  getUserFromToken(): Partial<JwtPayload> | null {
    const decoded = this.decodeToken();

    if (!decoded) {
      return null;
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      roles: decoded.roles
    };
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.getUserFromToken();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUserFromToken();
    if (!user?.roles) {
      return false;
    }
    return roles.some(role => user.roles!.includes(role));
  }

  /**
   * Refresca el access token usando el refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearTokens();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.setTokens(response);
      }),
      catchError(error => {
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si el token necesita ser refrescado
   * (considera expirado si expira en menos de 5 minutos)
   */
  shouldRefreshToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Refrescar si expira en menos de 5 minutos (300 segundos)
    return this.isTokenExpired(token, 300);
  }

  /**
   * Inicializa auto-refresh del token
   * Refresca automáticamente el token antes de que expire
   */
  initAutoRefresh(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    const timeUntilRefresh = this.getTimeUntilExpiration(token) - 300; // 5 min antes

    if (timeUntilRefresh > 0) {
      setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => {
            console.log('Token refrescado automáticamente');
            this.initAutoRefresh(); // Reiniciar el timer
          },
          error: (error) => {
            console.error('Error al refrescar token:', error);
          }
        });
      }, timeUntilRefresh * 1000);
    }
  }

  /**
   * Valida el formato del token JWT
   */
  isValidTokenFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Obtiene información de debug del token
   */
  getTokenDebugInfo(): {
    hasToken: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
    timeUntilExpiration: number;
    payload: JwtPayload | null;
  } {
    const token = this.getToken();
    return {
      hasToken: !!token,
      isExpired: this.isTokenExpired(),
      expiresAt: this.getTokenExpirationDate(),
      timeUntilExpiration: this.getTimeUntilExpiration(),
      payload: this.decodeToken()
    };
  }
}
```

## Uso del Token Service

### En Auth Service

```typescript
// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { TokenService, AuthResponse } from './token.service';
import { environment } from '@env/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  /**
   * Iniciar sesión
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/login`,
      credentials
    ).pipe(
      tap(response => {
        this.tokenService.setTokens(response);
        this.tokenService.initAutoRefresh(); // Iniciar auto-refresh
      })
    );
  }

  /**
   * Registrar nuevo usuario
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/register`,
      data
    ).pipe(
      tap(response => {
        this.tokenService.setTokens(response);
        this.tokenService.initAutoRefresh();
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.tokenService.hasToken() && !this.tokenService.isTokenExpired();
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.tokenService.getUserFromToken();
  }

  /**
   * Verificar si tiene un rol
   */
  hasRole(role: string): boolean {
    return this.tokenService.hasRole(role);
  }
}
```

### En Guards

```typescript
// src/app/core/guards/auth-guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenService } from '@core/services/token.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Verificar si tiene token y no está expirado
  if (tokenService.hasToken() && !tokenService.isTokenExpired()) {
    return true;
  }

  // Redirigir a login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
```

```typescript
// src/app/core/guards/role-guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenService } from '@core/services/token.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    if (tokenService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/forbidden']);
    return false;
  };
};

// Uso en rutas:
// canActivate: [authGuard, roleGuard(['admin', 'moderator'])]
```

### En Componentes

```typescript
@Component({
  selector: 'app-profile',
  template: `
    <div class="profile">
      <h2>Perfil de Usuario</h2>
      <p>ID: {{ user()?.sub }}</p>
      <p>Email: {{ user()?.email }}</p>
      <p>Nombre: {{ user()?.name }}</p>
      <p>Roles: {{ user()?.roles?.join(', ') }}</p>

      <div class="token-info">
        <h3>Token Info</h3>
        <p>Expira en: {{ timeUntilExpiration() }}s</p>
        <p>Estado: {{ isExpired() ? 'Expirado' : 'Válido' }}</p>
      </div>

      <button (click)="refreshToken()">Refrescar Token</button>
    </div>
  `
})
export class ProfileComponent implements OnInit, OnDestroy {
  private tokenService = inject(TokenService);

  user = signal(this.tokenService.getUserFromToken());
  timeUntilExpiration = signal(0);
  isExpired = signal(false);

  private interval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.updateTokenInfo();

    // Actualizar info cada segundo
    this.interval = setInterval(() => {
      this.updateTokenInfo();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  updateTokenInfo(): void {
    this.timeUntilExpiration.set(this.tokenService.getTimeUntilExpiration());
    this.isExpired.set(this.tokenService.isTokenExpired());
  }

  refreshToken(): void {
    this.tokenService.refreshToken().subscribe({
      next: () => {
        console.log('Token refrescado');
        this.user.set(this.tokenService.getUserFromToken());
      },
      error: (error) => {
        console.error('Error al refrescar token:', error);
      }
    });
  }
}
```

## Testing del Token Service

```typescript
// token.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/core/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TokenService, AuthResponse } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let httpTesting: HttpTestingController;

  // Token JWT de ejemplo (expirado)
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TokenService
      ]
    });

    service = TestBed.inject(TokenService);
    httpTesting = TestBed.inject(HttpTestingController);

    // Limpiar localStorage antes de cada test
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setToken and getToken', () => {
    it('should store and retrieve token', () => {
      service.setToken(mockToken);
      expect(service.getToken()).toBe(mockToken);
    });

    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('should remove token from storage', () => {
      service.setToken(mockToken);
      service.removeToken();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('hasToken', () => {
    it('should return true when token exists', () => {
      service.setToken(mockToken);
      expect(service.hasToken()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(service.hasToken()).toBe(false);
    });
  });

  describe('decodeToken', () => {
    it('should decode token payload', () => {
      const payload = service.decodeToken(mockToken);
      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('1234567890');
      expect(payload?.email).toBe('john@example.com');
    });

    it('should return null for invalid token', () => {
      const payload = service.decodeToken('invalid.token');
      expect(payload).toBeNull();
    });
  });

  describe('getUserFromToken', () => {
    it('should extract user info from token', () => {
      service.setToken(mockToken);
      const user = service.getUserFromToken();
      expect(user?.sub).toBe('1234567890');
      expect(user?.email).toBe('john@example.com');
    });
  });

  describe('hasRole', () => {
    it('should return true for existing role', () => {
      service.setToken(mockToken);
      expect(service.hasRole('admin')).toBe(true);
    });

    it('should return false for non-existing role', () => {
      service.setToken(mockToken);
      expect(service.hasRole('user')).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      const refreshToken = 'refresh-token';
      service.setRefreshToken(refreshToken);

      const mockResponse: AuthResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.getToken()).toBe('new-access-token');
      });

      const req = httpTesting.expectOne(`/api/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
```
