# Session Management - JWT Authentication

Estrategias y patrones para gestión de sesiones con JWT.

## 1. Token Refresh Strategy

### Automatic Token Refresh

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly REFRESH_BUFFER = 120; // 2 minutos antes de expiración
  private autoRefreshSubscription?: Subscription;

  /**
   * Inicia auto-refresh basado en token expiration time
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    const token = this.tokenService.getAccessToken();
    if (!token) return;

    const expiresIn = getTokenExpirationTime(token);
    const refreshTime = Math.max((expiresIn - this.REFRESH_BUFFER) * 1000, 0);

    if (refreshTime > 0) {
      console.log(`Token will refresh in ${refreshTime / 1000} seconds`);

      this.autoRefreshSubscription = timer(refreshTime)
        .pipe(
          switchMap(() => this.refreshToken()),
          tap(response => {
            if (response) {
              console.log('Token auto-refreshed successfully');
            }
          }),
          catchError(error => {
            console.error('Auto-refresh failed:', error);
            this.logout();
            return of(null);
          })
        )
        .subscribe();
    }
  }

  /**
   * Detiene auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = undefined;
    }
  }
}
```

### Manual Refresh on Demand

```typescript
/**
 * Refresh token cuando sea necesario
 */
refreshToken(): Observable<RefreshTokenResponse | null> {
  const refreshToken = this.tokenService.getRefreshToken();

  if (!refreshToken || this.refreshTokenInProgress.value) {
    return of(null);
  }

  this.refreshTokenInProgress.next(true);

  return this.http.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
    .pipe(
      tap(response => {
        this.tokenService.updateAccessToken(response.accessToken);
        this.refreshTokenInProgress.next(false);
        this.startAutoRefresh(); // Reiniciar timer
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.refreshTokenInProgress.next(false);
        this.logout(); // Refresh falló, logout
        return of(null);
      })
    );
}
```

### Prevent Concurrent Refresh Requests

```typescript
private refreshTokenInProgress = new BehaviorSubject<boolean>(false);
private refreshTokenSubject = new BehaviorSubject<string | null>(null);

refreshToken(): Observable<RefreshTokenResponse | null> {
  const refreshToken = this.tokenService.getRefreshToken();

  if (!refreshToken) {
    return of(null);
  }

  // Si ya hay un refresh en progreso, esperar a que termine
  if (this.refreshTokenInProgress.value) {
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(() => of({ accessToken: this.tokenService.getAccessToken()! }))
    );
  }

  this.refreshTokenInProgress.next(true);

  return this.http.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
    .pipe(
      tap(response => {
        this.tokenService.updateAccessToken(response.accessToken);
        this.refreshTokenSubject.next(response.accessToken);
        this.refreshTokenInProgress.next(false);
        this.startAutoRefresh();
      }),
      catchError(error => {
        this.refreshTokenInProgress.next(false);
        this.logout();
        return of(null);
      })
    );
}
```

## 2. Session Timeout Detection

### Idle Timeout

```typescript
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService {
  private readonly IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  private readonly WARNING_BEFORE = 2 * 60 * 1000; // Advertir 2 min antes

  private idleTimer?: number;
  private warningTimer?: number;
  private lastActivity = Date.now();

  // Observable para mostrar warning modal
  showWarning$ = new Subject<number>(); // segundos restantes

  constructor() {
    this.setupActivityListeners();
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

    merge(...events.map(event => fromEvent(document, event)))
      .pipe(
        throttleTime(1000),
        tap(() => this.onActivity())
      )
      .subscribe();
  }

  private onActivity(): void {
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  private resetTimers(): void {
    this.clearTimers();

    // Timer para warning
    this.warningTimer = window.setTimeout(() => {
      this.showWarningModal();
    }, this.IDLE_TIMEOUT - this.WARNING_BEFORE);

    // Timer para logout
    this.idleTimer = window.setTimeout(() => {
      this.handleIdleTimeout();
    }, this.IDLE_TIMEOUT);
  }

  private showWarningModal(): void {
    let remaining = this.WARNING_BEFORE / 1000;

    const countdown = interval(1000).pipe(
      take(remaining),
      tap(() => {
        this.showWarning$.next(--remaining);
      })
    ).subscribe({
      complete: () => {
        if (remaining === 0) {
          this.handleIdleTimeout();
        }
      }
    });
  }

  private handleIdleTimeout(): void {
    this.clearTimers();
    // Emitir evento para que AuthService maneje el logout
    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { reason: 'idle_timeout' }
    });
  }

  private clearTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
  }

  startMonitoring(): void {
    this.resetTimers();
  }

  stopMonitoring(): void {
    this.clearTimers();
  }
}
```

### Absolute Timeout

```typescript
@Injectable({ providedIn: 'root' })
export class AbsoluteTimeoutService {
  private readonly MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas
  private sessionStartTime?: number;
  private timeoutId?: number;

  startSession(): void {
    this.sessionStartTime = Date.now();

    this.timeoutId = window.setTimeout(() => {
      this.handleAbsoluteTimeout();
    }, this.MAX_SESSION_DURATION);
  }

  private handleAbsoluteTimeout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { reason: 'max_session_duration' }
    });
  }

  getRemainingTime(): number {
    if (!this.sessionStartTime) return 0;

    const elapsed = Date.now() - this.sessionStartTime;
    const remaining = this.MAX_SESSION_DURATION - elapsed;

    return Math.max(remaining, 0);
  }

  endSession(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.sessionStartTime = undefined;
  }
}
```

## 3. Multi-Tab Synchronization

### BroadcastChannel API

```typescript
@Injectable({ providedIn: 'root' })
export class MultiTabSyncService {
  private channel = new BroadcastChannel('auth_channel');

  constructor(private authService: AuthService) {
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    this.channel.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'login':
          // Otra tab hizo login, actualizar estado
          this.authService.loadCurrentUser();
          break;

        case 'logout':
          // Otra tab hizo logout, limpiar estado local
          this.authService.clearLocalState();
          this.router.navigate(['/auth/login']);
          break;

        case 'token_refresh':
          // Token se refrescó en otra tab
          this.authService.loadCurrentUser();
          break;
      }
    });
  }

  broadcastLogin(): void {
    this.channel.postMessage({ type: 'login' });
  }

  broadcastLogout(): void {
    this.channel.postMessage({ type: 'logout' });
  }

  broadcastTokenRefresh(): void {
    this.channel.postMessage({ type: 'token_refresh' });
  }
}
```

### Storage Event (Fallback)

```typescript
@Injectable({ providedIn: 'root' })
export class StorageSyncService {
  constructor(private authService: AuthService) {
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter(event => event.key === 'auth_event'),
        tap(event => {
          const data = event.newValue ? JSON.parse(event.newValue) : null;
          this.handleAuthEvent(data);
        })
      )
      .subscribe();
  }

  private handleAuthEvent(data: any): void {
    if (!data) return;

    switch (data.type) {
      case 'login':
        this.authService.loadCurrentUser();
        break;

      case 'logout':
        this.authService.clearLocalState();
        this.router.navigate(['/auth/login']);
        break;
    }
  }

  emitAuthEvent(type: 'login' | 'logout'): void {
    const data = { type, timestamp: Date.now() };
    localStorage.setItem('auth_event', JSON.stringify(data));

    // Limpiar después de propagar
    setTimeout(() => {
      localStorage.removeItem('auth_event');
    }, 100);
  }
}
```

## 4. Remember Me Implementation

### Storage Strategy

```typescript
class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';

  /**
   * Guarda tokens según "Remember Me"
   * - true: localStorage (persiste después de cerrar browser)
   * - false: sessionStorage (se borra al cerrar tab)
   */
  saveTokens(accessToken: string, refreshToken: string, rememberMe = false): void {
    const storage = this.getStorage(rememberMe);
    storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);

    // Guardar preferencia en localStorage (siempre persiste)
    localStorage.setItem(this.REMEMBER_ME_KEY, String(rememberMe));
  }

  /**
   * Obtiene tokens de ambos storages (para soportar cambio de preferencia)
   */
  getAccessToken(): string | null {
    return this.getFromBothStorages(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.getFromBothStorages(this.REFRESH_TOKEN_KEY);
  }

  private isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  private getStorage(rememberMe: boolean): Storage {
    return rememberMe ? localStorage : sessionStorage;
  }

  private getFromBothStorages(key: string): string | null {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
```

### Extended Refresh Token Expiry

```typescript
// Backend implementation:
/*
def create_tokens(user, remember_me=False):
    access_token_expires = timedelta(minutes=15)

    # Refresh token expiry según Remember Me
    if remember_me:
        refresh_token_expires = timedelta(days=30)  # 30 días
    else:
        refresh_token_expires = timedelta(days=1)   # 1 día

    access_token = create_access_token(user, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(user, expires_delta=refresh_token_expires)

    return access_token, refresh_token
*/
```

## 5. Session Recovery

### Restore Session on App Load

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService implements OnInit {
  constructor() {
    this.initializeAuth();
  }

  /**
   * Restaura sesión al cargar la app
   */
  private initializeAuth(): void {
    // 1. Verificar si hay access token válido
    if (this.tokenService.isAccessTokenValid()) {
      this.loadCurrentUser();
      this.startAutoRefresh();
      return;
    }

    // 2. Si access token expiró, intentar refresh
    if (this.tokenService.isRefreshTokenValid()) {
      this.refreshToken().subscribe({
        next: (response) => {
          if (response) {
            this.loadCurrentUser();
          }
        },
        error: () => {
          // Refresh falló, limpiar todo
          this.tokenService.clearTokens();
        }
      });
      return;
    }

    // 3. No hay sesión válida
    this.tokenService.clearTokens();
  }

  private loadCurrentUser(): void {
    this.http.get<ApiResponse<User>>('/auth/me').subscribe({
      next: (response) => {
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
}
```

## 6. Device Management

### Track Active Sessions

```typescript
interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location?: string;
  ipAddress?: string;
  lastActive: string;
  isCurrent: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionManagementService {
  /**
   * Obtiene todas las sesiones activas del usuario
   */
  getActiveSessions(): Observable<ApiResponse<DeviceSession[]>> {
    return this.http.get<ApiResponse<DeviceSession[]>>('/user/sessions');
  }

  /**
   * Revoca una sesión específica
   */
  revokeSession(sessionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`/user/sessions/${sessionId}`);
  }

  /**
   * Revoca todas las sesiones excepto la actual
   */
  revokeAllOtherSessions(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>('/user/sessions/revoke-all', {});
  }
}
```

## Session Management Best Practices

1. **Token Expiry**: Access token corto (15 min), refresh token largo (7-30 días)
2. **Auto-Refresh**: 2 minutos antes de expiración
3. **Idle Timeout**: 15 minutos de inactividad
4. **Absolute Timeout**: 8 horas máximo
5. **Remember Me**: Diferentes expiraciones según preferencia
6. **Multi-Tab Sync**: BroadcastChannel o Storage events
7. **Session Recovery**: Restaurar en app initialization
8. **Device Tracking**: Permitir revocar sesiones remotas
9. **Security**: HTTPS, secure storage, audit logging
10. **UX**: Advertencias antes de timeout, mensajes claros
