---
name: angular-error-handling
description: >
  Sistema completo de error handling para Angular standalone con Tailwind CSS.
  Usar cuando se necesite implementar Global ErrorHandler, HTTP error interceptor,
  toast/notification service, error logging, error boundaries, fallback UI, retry logic,
  error categorization, user-friendly error messages, stack trace capture, error reporting,
  o cualquier funcionalidad relacionada con manejo robusto de errores en Angular.
  Incluye ToastComponent con animaciones Tailwind, ErrorLoggingService con múltiples niveles,
  interfaces tipadas, error mapping, RxJS operators para recovery, y best practices de UX
  para proyectos Angular 19+ production-ready.
---

# Angular Error Handling - Sistema Completo de Manejo de Errores

Sistema enterprise-ready para error handling en Angular standalone con excelente UX y logging robusto.

## Arquitectura del Sistema

```
error-handling/
├── core/
│   ├── services/
│   │   ├── error-handler.service.ts      # Global ErrorHandler
│   │   ├── error-logging.service.ts      # Logging a múltiples destinos
│   │   └── toast.service.ts              # Toast notifications
│   ├── interceptors/
│   │   └── http-error.interceptor.ts     # HTTP error handling
│   ├── models/
│   │   └── error.models.ts               # Interfaces tipadas
│   └── utils/
│       ├── error-mapper.util.ts          # Error message mapping
│       └── retry.util.ts                 # Retry operators
└── shared/
    └── components/
        ├── toast/                        # Toast notification component
        ├── error-boundary/               # Error boundary component
        └── fallback-ui/                  # Fallback error pages
```

## 1. Interfaces y Modelos Tipados

Crear `src/app/core/models/error.models.ts`:

```typescript
/**
 * Error categories para clasificación
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Toast notification types
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Base error interface
 */
export interface AppError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * HTTP error specific interface
 */
export interface HttpError extends AppError {
  status: number;
  statusText: string;
  url: string;
  method: string;
  body?: any;
}

/**
 * Validation error interface
 */
export interface ValidationError extends AppError {
  field: string;
  value: any;
  constraints: Record<string, string>;
}

/**
 * Client error interface
 */
export interface ClientError extends AppError {
  componentName?: string;
  userAction?: string;
}

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  timestamp: Date;
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  error: AppError;
  userAgent: string;
  url: string;
  timestamp: Date;
  userId?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  count: number;
  delay: number;
  backoff?: boolean;
  retryableErrors?: number[];
}
```

## 2. Error Mapper Utility

Crear `src/app/core/utils/error-mapper.util.ts`:

```typescript
import { ErrorCategory } from '@core/models/error.models';

/**
 * Mapeo de errores técnicos a mensajes user-friendly
 */
export class ErrorMapper {
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    // Network Errors
    'ERR_NETWORK': 'Unable to connect to the server. Please check your internet connection.',
    'ERR_CONNECTION_REFUSED': 'Could not connect to the server. Please try again later.',
    'ERR_TIMEOUT': 'The request timed out. Please try again.',

    // HTTP Status Codes
    '400': 'The request was invalid. Please check your input.',
    '401': 'You are not authorized. Please log in.',
    '403': 'You do not have permission to access this resource.',
    '404': 'The requested resource was not found.',
    '409': 'A conflict occurred. Please refresh and try again.',
    '422': 'The data provided is invalid. Please check your input.',
    '429': 'Too many requests. Please wait a moment and try again.',
    '500': 'An internal server error occurred. Please try again later.',
    '502': 'Bad gateway. The server is temporarily unavailable.',
    '503': 'Service unavailable. Please try again later.',
    '504': 'Gateway timeout. The server took too long to respond.',

    // Validation Errors
    'REQUIRED_FIELD': 'This field is required.',
    'INVALID_EMAIL': 'Please enter a valid email address.',
    'INVALID_PASSWORD': 'Password does not meet requirements.',
    'PASSWORDS_MISMATCH': 'Passwords do not match.',
    'MIN_LENGTH': 'This field must be at least {min} characters.',
    'MAX_LENGTH': 'This field must be at most {max} characters.',

    // Default
    'DEFAULT': 'An unexpected error occurred. Please try again.'
  };

  /**
   * Obtiene mensaje user-friendly para un error
   */
  static getUserFriendlyMessage(error: any, params?: Record<string, any>): string {
    let message = this.ERROR_MESSAGES['DEFAULT'];

    // HTTP Error con status
    if (error.status) {
      message = this.ERROR_MESSAGES[error.status.toString()] || message;
    }

    // Network Error
    if (error.error?.code) {
      message = this.ERROR_MESSAGES[error.error.code] || message;
    }

    // Error code personalizado
    if (error.code) {
      message = this.ERROR_MESSAGES[error.code] || message;
    }

    // Backend error message (si es user-friendly)
    if (error.error?.message && this.isUserFriendly(error.error.message)) {
      message = error.error.message;
    }

    // Reemplazar placeholders
    if (params) {
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });
    }

    return message;
  }

  /**
   * Categoriza un error
   */
  static categorizeError(error: any): ErrorCategory {
    // Network errors
    if (error.status === 0 || error.error instanceof ProgressEvent) {
      return ErrorCategory.NETWORK;
    }

    // Validation errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return ErrorCategory.VALIDATION;
    }

    // Server errors (5xx)
    if (error.status >= 500) {
      return ErrorCategory.SERVER;
    }

    // Client errors (JavaScript errors)
    if (error instanceof Error && !error.hasOwnProperty('status')) {
      return ErrorCategory.CLIENT;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Verifica si un mensaje es user-friendly (no técnico)
   */
  private static isUserFriendly(message: string): boolean {
    const technicalPatterns = [
      /stack trace/i,
      /exception/i,
      /null pointer/i,
      /undefined/i,
      /at \w+\.\w+/,  // Stack trace pattern
      /error code:/i
    ];

    return !technicalPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Sanitiza información sensible del error antes de logging
   */
  static sanitizeError(error: any): any {
    const sanitized = { ...error };

    // Remover información sensible
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];

    const removeSensitiveData = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitiveData(obj[key]);
        }
      });

      return obj;
    };

    return removeSensitiveData(sanitized);
  }
}
```

## 3. Retry Utility con RxJS

Crear `src/app/core/utils/retry.util.ts`:

```typescript
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, tap } from 'rxjs/operators';
import { RetryConfig } from '@core/models/error.models';

/**
 * Retry operator con backoff exponencial
 */
export function retryWithBackoff<T>(config: RetryConfig) {
  const { count, delay, backoff = true, retryableErrors = [] } = config;

  return (source: Observable<T>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            // Verificar si el error es retryable
            if (retryableErrors.length > 0 && !isRetryableError(error, retryableErrors)) {
              return throwError(() => error);
            }

            // Si alcanzamos el límite de reintentos
            if (retryAttempt > count) {
              return throwError(() => error);
            }

            // Calcular delay (con o sin backoff exponencial)
            const retryDelay = backoff
              ? delay * Math.pow(2, index)
              : delay;

            console.log(
              `Retry attempt ${retryAttempt}/${count} after ${retryDelay}ms`,
              error
            );

            // Esperar antes de reintentar
            return timer(retryDelay);
          })
        )
      )
    );
}

/**
 * Verifica si un error es retryable según el código de estado
 */
function isRetryableError(error: any, retryableErrors: number[]): boolean {
  if (error.status) {
    return retryableErrors.includes(error.status);
  }

  // Network errors siempre son retryable
  if (error.status === 0 || error.error instanceof ProgressEvent) {
    return true;
  }

  return false;
}

/**
 * Retry solo para errores de red
 */
export function retryOnNetworkError(count = 3, delay = 1000) {
  return retryWithBackoff({
    count,
    delay,
    backoff: true,
    retryableErrors: [0, 408, 502, 503, 504] // Network + timeout + gateway errors
  });
}

/**
 * Retry con logging
 */
export function retryWithLogging<T>(config: RetryConfig, logger?: (message: string) => void) {
  return (source: Observable<T>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          tap(error => {
            if (logger) {
              logger(`Error occurred: ${error.message || error}`);
            }
          }),
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            if (retryAttempt > config.count) {
              if (logger) {
                logger(`Max retry attempts (${config.count}) reached. Giving up.`);
              }
              return throwError(() => error);
            }

            const retryDelay = config.backoff
              ? config.delay * Math.pow(2, index)
              : config.delay;

            if (logger) {
              logger(`Retrying in ${retryDelay}ms... (attempt ${retryAttempt}/${config.count})`);
            }

            return timer(retryDelay);
          })
        )
      )
    );
}
```

## 4. Error Logging Service

Crear `src/app/core/services/error-logging.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AppError, ErrorLogEntry, ErrorSeverity } from '@core/models/error.models';
import { ErrorMapper } from '@core/utils/error-mapper.util';

/**
 * Log destination types
 */
export enum LogDestination {
  CONSOLE = 'CONSOLE',
  API = 'API',
  THIRD_PARTY = 'THIRD_PARTY'
}

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggingService {
  private http = inject(HttpClient);
  private enabled = !environment.production || environment.enableErrorLogging;

  /**
   * Log un error con severity específico
   */
  logError(error: AppError, destinations: LogDestination[] = [LogDestination.CONSOLE]): void {
    if (!this.enabled) return;

    const logEntry = this.createLogEntry(error);

    destinations.forEach(destination => {
      switch (destination) {
        case LogDestination.CONSOLE:
          this.logToConsole(logEntry);
          break;
        case LogDestination.API:
          this.logToApi(logEntry);
          break;
        case LogDestination.THIRD_PARTY:
          this.logToThirdParty(logEntry);
          break;
      }
    });
  }

  /**
   * Log error level
   */
  error(message: string, error?: any, context?: Record<string, any>): void {
    const appError: AppError = {
      message,
      category: error ? ErrorMapper.categorizeError(error) : 'CLIENT' as any,
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      stack: error?.stack,
      context
    };

    this.logError(appError, [LogDestination.CONSOLE, LogDestination.API]);
  }

  /**
   * Log warning level
   */
  warn(message: string, context?: Record<string, any>): void {
    const appError: AppError = {
      message,
      category: 'CLIENT' as any,
      severity: ErrorSeverity.WARNING,
      timestamp: new Date(),
      context
    };

    this.logError(appError, [LogDestination.CONSOLE]);
  }

  /**
   * Log info level
   */
  info(message: string, context?: Record<string, any>): void {
    if (!environment.production) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log critical error (siempre se envía a todos los destinos)
   */
  critical(message: string, error: any, context?: Record<string, any>): void {
    const appError: AppError = {
      message,
      category: ErrorMapper.categorizeError(error),
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date(),
      stack: error?.stack,
      context
    };

    this.logError(appError, [
      LogDestination.CONSOLE,
      LogDestination.API,
      LogDestination.THIRD_PARTY
    ]);
  }

  /**
   * Crea una entrada de log completa
   */
  private createLogEntry(error: AppError): ErrorLogEntry {
    return {
      error: ErrorMapper.sanitizeError(error),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
      userId: this.getCurrentUserId()
    };
  }

  /**
   * Log a console con colores según severity
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const { error } = entry;

    const styles = {
      [ErrorSeverity.INFO]: 'color: #3b82f6',
      [ErrorSeverity.WARNING]: 'color: #f59e0b',
      [ErrorSeverity.ERROR]: 'color: #ef4444',
      [ErrorSeverity.CRITICAL]: 'color: #dc2626; font-weight: bold'
    };

    const style = styles[error.severity];

    console.group(`%c[${error.severity}] ${error.message}`, style);
    console.log('Category:', error.category);
    console.log('Timestamp:', error.timestamp);
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    if (error.context) {
      console.log('Context:', error.context);
    }
    console.log('User Agent:', entry.userAgent);
    console.log('URL:', entry.url);
    console.groupEnd();
  }

  /**
   * Log a API backend
   */
  private logToApi(entry: ErrorLogEntry): void {
    if (!environment.apiUrl) return;

    this.http.post(`${environment.apiUrl}/logging/errors`, entry).subscribe({
      error: (err) => console.error('Failed to log error to API:', err)
    });
  }

  /**
   * Log a servicio third-party (e.g., Sentry, LogRocket)
   */
  private logToThirdParty(entry: ErrorLogEntry): void {
    // Ejemplo: Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(entry.error, {
        level: entry.error.severity.toLowerCase(),
        extra: {
          context: entry.error.context,
          userAgent: entry.userAgent,
          url: entry.url
        }
      });
    }

    // Ejemplo: LogRocket
    if (typeof window !== 'undefined' && (window as any).LogRocket) {
      (window as any).LogRocket.captureException(entry.error);
    }
  }

  /**
   * Obtiene el ID del usuario actual (si está autenticado)
   */
  private getCurrentUserId(): string | undefined {
    // Obtener de AuthService o storage
    try {
      const user = localStorage.getItem('current_user');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }
}
```

## 5. Toast Service

Crear `src/app/core/services/toast.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '@core/models/error.models';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Signal para gestionar toasts de forma reactiva
  toasts = signal<Toast[]>([]);

  private readonly DEFAULT_DURATION = 5000; // 5 segundos
  private readonly MAX_TOASTS = 5;

  /**
   * Muestra un toast de éxito
   */
  success(message: string, title?: string, duration?: number): void {
    this.show(ToastType.SUCCESS, message, title, duration);
  }

  /**
   * Muestra un toast de error
   */
  error(message: string, title?: string, duration?: number): void {
    this.show(ToastType.ERROR, message, title, duration);
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(message: string, title?: string, duration?: number): void {
    this.show(ToastType.WARNING, message, title, duration);
  }

  /**
   * Muestra un toast informativo
   */
  info(message: string, title?: string, duration?: number): void {
    this.show(ToastType.INFO, message, title, duration);
  }

  /**
   * Muestra un toast genérico
   */
  show(type: ToastType, message: string, title?: string, duration?: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type,
      message,
      title,
      duration: duration || this.DEFAULT_DURATION,
      dismissible: true,
      timestamp: new Date()
    };

    // Agregar toast al array
    this.toasts.update(toasts => {
      const newToasts = [...toasts, toast];

      // Mantener solo los últimos MAX_TOASTS
      if (newToasts.length > this.MAX_TOASTS) {
        return newToasts.slice(-this.MAX_TOASTS);
      }

      return newToasts;
    });

    // Auto-dismiss después del duration
    if (toast.duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.duration);
    }
  }

  /**
   * Cierra un toast específico
   */
  dismiss(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Cierra todos los toasts
   */
  dismissAll(): void {
    this.toasts.set([]);
  }

  /**
   * Genera un ID único para el toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 6. Global Error Handler

Crear `src/app/core/services/error-handler.service.ts`:

```typescript
import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ErrorLoggingService } from './error-logging.service';
import { ToastService } from './toast.service';
import { ErrorMapper } from '@core/utils/error-mapper.util';
import { ErrorCategory, ErrorSeverity } from '@core/models/error.models';

/**
 * Global Error Handler personalizado
 * Captura todos los errores no manejados de la aplicación
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorLogger = inject(ErrorLoggingService);
  private toastService = inject(ToastService);
  private ngZone = inject(NgZone);

  handleError(error: any): void {
    // Ejecutar en NgZone para actualizar UI
    this.ngZone.run(() => {
      console.error('Global error caught:', error);

      // Categorizar el error
      const category = ErrorMapper.categorizeError(error);
      const userMessage = ErrorMapper.getUserFriendlyMessage(error);

      // Determinar severity
      const severity = this.determineSeverity(error, category);

      // Log el error
      this.errorLogger.logError({
        message: error.message || 'Unknown error',
        category,
        severity,
        timestamp: new Date(),
        stack: error.stack,
        context: {
          name: error.name,
          originalError: error
        }
      });

      // Mostrar toast al usuario (solo para errores no HTTP)
      // Los HTTP errors se manejan en el interceptor
      if (!error.status) {
        this.toastService.error(userMessage, 'Error');
      }

      // En desarrollo, re-throw para ver el error en console
      if (!this.isProduction()) {
        throw error;
      }
    });
  }

  /**
   * Determina la severidad del error
   */
  private determineSeverity(error: any, category: ErrorCategory): ErrorSeverity {
    // Errores de red generalmente son críticos
    if (category === ErrorCategory.NETWORK) {
      return ErrorSeverity.CRITICAL;
    }

    // Errores de servidor (5xx) son críticos
    if (error.status >= 500) {
      return ErrorSeverity.CRITICAL;
    }

    // Errores de validación son warnings
    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.WARNING;
    }

    // Por defecto, ERROR
    return ErrorSeverity.ERROR;
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' && (window as any).__PRODUCTION__;
  }
}
```

## 7. HTTP Error Interceptor

Crear `src/app/core/interceptors/http-error.interceptor.ts`:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { ErrorLoggingService, LogDestination } from '@core/services/error-logging.service';
import { ErrorMapper } from '@core/utils/error-mapper.util';
import { HttpError, ErrorSeverity } from '@core/models/error.models';

/**
 * Interceptor funcional para manejo de errores HTTP
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const errorLogger = inject(ErrorLoggingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Crear HttpError tipado
      const httpError: HttpError = {
        message: error.message,
        category: ErrorMapper.categorizeError(error),
        severity: determineSeverity(error.status),
        timestamp: new Date(),
        status: error.status,
        statusText: error.statusText,
        url: error.url || req.url,
        method: req.method,
        body: error.error,
        stack: error.error?.stack
      };

      // Log el error
      errorLogger.logError(httpError, [LogDestination.CONSOLE, LogDestination.API]);

      // Mostrar toast según el tipo de error
      handleHttpError(error, toastService);

      // Re-throw el error para que lo manejen los componentes si es necesario
      return throwError(() => error);
    })
  );
};

/**
 * Determina severity según status code
 */
function determineSeverity(status: number): ErrorSeverity {
  if (status === 0) return ErrorSeverity.CRITICAL; // Network error
  if (status >= 500) return ErrorSeverity.CRITICAL;
  if (status >= 400) return ErrorSeverity.ERROR;
  return ErrorSeverity.WARNING;
}

/**
 * Maneja el error HTTP y muestra toast apropiado
 */
function handleHttpError(error: HttpErrorResponse, toastService: ToastService): void {
  const userMessage = ErrorMapper.getUserFriendlyMessage(error);

  // Network errors (status 0)
  if (error.status === 0) {
    toastService.error(userMessage, 'Connection Error');
    return;
  }

  // Client errors (4xx)
  if (error.status >= 400 && error.status < 500) {
    // 401 - No mostrar toast, dejarlo al AuthService
    if (error.status === 401) {
      return;
    }

    // 403 - Forbidden
    if (error.status === 403) {
      toastService.error(userMessage, 'Access Denied');
      return;
    }

    // 404 - Not Found
    if (error.status === 404) {
      toastService.warning(userMessage, 'Not Found');
      return;
    }

    // 422 - Validation Error
    if (error.status === 422) {
      toastService.warning(userMessage, 'Validation Error');
      return;
    }

    // Otros 4xx
    toastService.error(userMessage, 'Request Error');
    return;
  }

  // Server errors (5xx)
  if (error.status >= 500) {
    toastService.error(userMessage, 'Server Error');
    return;
  }

  // Otros errores
  toastService.error(userMessage, 'Error');
}
```

## 8. Toast Component

Crear `src/app/shared/components/toast/toast.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { Toast, ToastType } from '@core/models/error.models';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);

  toasts = this.toastService.toasts;

  /**
   * Cierra un toast
   */
  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  /**
   * Obtiene las clases CSS según el tipo de toast
   */
  getToastClasses(type: ToastType): string {
    const baseClasses = 'flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 transition-all';

    const typeClasses = {
      [ToastType.SUCCESS]: 'bg-green-50 border-green-500 text-green-900',
      [ToastType.ERROR]: 'bg-red-50 border-red-500 text-red-900',
      [ToastType.WARNING]: 'bg-yellow-50 border-yellow-500 text-yellow-900',
      [ToastType.INFO]: 'bg-blue-50 border-blue-500 text-blue-900'
    };

    return `${baseClasses} ${typeClasses[type]}`;
  }

  /**
   * Obtiene el ícono según el tipo
   */
  getIcon(type: ToastType): string {
    const icons = {
      [ToastType.SUCCESS]: '✓',
      [ToastType.ERROR]: '✕',
      [ToastType.WARNING]: '⚠',
      [ToastType.INFO]: 'ℹ'
    };

    return icons[type];
  }

  /**
   * Obtiene el color del ícono
   */
  getIconColor(type: ToastType): string {
    const colors = {
      [ToastType.SUCCESS]: 'text-green-600',
      [ToastType.ERROR]: 'text-red-600',
      [ToastType.WARNING]: 'text-yellow-600',
      [ToastType.INFO]: 'text-blue-600'
    };

    return colors[type];
  }
}
```

Ver template completo en `references/toast-component.md`.

## 9. Error Boundary Component

Crear `src/app/shared/components/error-boundary/error-boundary.component.ts`:

```typescript
import { Component, Input, OnInit, ErrorHandler, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Error Boundary Component
 * Captura errores de componentes hijos y muestra UI de fallback
 */
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!hasError; else fallback">
      <ng-content></ng-content>
    </ng-container>

    <ng-template #fallback>
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div class="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 class="text-lg font-semibold text-red-900 mb-2">
          {{ fallbackTitle }}
        </h3>
        <p class="text-sm text-red-700 mb-4">
          {{ fallbackMessage }}
        </p>
        <button
          (click)="retry()"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    </ng-template>
  `
})
export class ErrorBoundaryComponent implements OnInit {
  @Input() fallbackTitle = 'Something went wrong';
  @Input() fallbackMessage = 'An error occurred while loading this section.';

  hasError = false;
  private errorHandler = inject(ErrorHandler);

  ngOnInit(): void {
    // Setup error boundary
    // Note: Angular no tiene error boundaries nativos como React
    // Esta es una implementación simplificada
  }

  retry(): void {
    this.hasError = false;
    window.location.reload();
  }
}
```

## 10. Fallback UI Component

Crear `src/app/shared/components/fallback-ui/fallback-ui.component.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Fallback UI para páginas de error crítico
 */
@Component({
  selector: 'app-fallback-ui',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fallback-ui.component.html',
  styleUrls: ['./fallback-ui.component.css']
})
export class FallbackUIComponent {
  @Input() errorCode = '500';
  @Input() title = 'Something went wrong';
  @Input() message = 'We encountered an unexpected error. Please try again later.';
  @Input() showHomeButton = true;
  @Input() showRetryButton = true;

  retry(): void {
    window.location.reload();
  }

  goHome(): void {
    window.location.href = '/';
  }
}
```

Ver template en `references/fallback-ui-component.md`.

## 11. Integración en app.config.ts

Actualizar `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { GlobalErrorHandler } from '@core/services/error-handler.service';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor])
    ),
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
};
```

## 12. Uso en app.component.ts

Actualizar `src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet></router-outlet>

    <!-- Toast Container (siempre visible) -->
    <app-toast-container></app-toast-container>
  `
})
export class AppComponent {
  title = 'my-app';
}
```

## 13. Ejemplos de Uso

### Ejemplo 1: Manejo de Error HTTP con Retry

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { retryOnNetworkError } from '@core/utils/retry.util';
import { ToastService } from '@core/services/toast.service';

@Component({...})
export class UserListComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  loadUsers(): void {
    this.http.get<User[]>('/api/users')
      .pipe(
        retryOnNetworkError(3, 1000), // Retry 3 veces con 1s de delay
        catchError(error => {
          // El error ya fue loggeado por el interceptor
          // Aquí solo manejamos UI específica del componente
          console.error('Failed to load users after retries:', error);
          return of([]); // Retornar array vacío como fallback
        })
      )
      .subscribe(users => {
        this.users = users;
      });
  }
}
```

### Ejemplo 2: Logging Manual

```typescript
import { Component, inject } from '@angular/core';
import { ErrorLoggingService } from '@core/services/error-logging.service';

@Component({...})
export class PaymentComponent {
  private errorLogger = inject(ErrorLoggingService);

  processPayment(amount: number): void {
    try {
      // Lógica de pago
      if (amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Procesar pago...

    } catch (error: any) {
      // Log el error con contexto
      this.errorLogger.error('Payment processing failed', error, {
        amount,
        userId: this.currentUser.id,
        timestamp: new Date()
      });

      // Mostrar mensaje al usuario
      this.toastService.error('Payment could not be processed. Please try again.');
    }
  }
}
```

### Ejemplo 3: Toast Notifications

```typescript
import { Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast.service';

@Component({...})
export class ProfileComponent {
  private toastService = inject(ToastService);

  saveProfile(): void {
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.toastService.success('Profile updated successfully!', 'Success');
      },
      error: () => {
        // El error ya fue manejado por el interceptor
        // Solo necesitamos confirmar al usuario que falló
        this.toastService.error('Failed to update profile', 'Error');
      }
    });
  }
}
```

## Referencias Adicionales

Para información detallada sobre componentes y casos de uso específicos, consulta:

- **Toast Component Template**: Ver `references/toast-component.md`
- **FallbackUI Component**: Ver `references/fallback-ui-component.md`
- **Error Recovery Patterns**: Ver `references/error-recovery.md`
- **Logging Strategies**: Ver `references/logging-strategies.md`
- **Testing Error Handling**: Ver `references/testing-errors.md`
- **Integration Examples**: Ver `references/integration-examples.md`

## Checklist de Implementación

- [ ] Interfaces y modelos tipados creados
- [ ] ErrorMapper utility implementado
- [ ] Retry utilities con RxJS
- [ ] ErrorLoggingService configurado
- [ ] ToastService con queue management
- [ ] GlobalErrorHandler implementado
- [ ] HTTP Error Interceptor configurado
- [ ] ToastComponent con animaciones
- [ ] ErrorBoundary component
- [ ] FallbackUI component
- [ ] Global Error Handler registrado en app.config
- [ ] HTTP Interceptor agregado en app.config
- [ ] Toast container en app.component
- [ ] Error messages mapping completo
- [ ] Logging a múltiples destinos
- [ ] Third-party integration (Sentry/LogRocket)
- [ ] Sanitización de datos sensibles
- [ ] Testing de error handling

## Best Practices

1. **Categorización**: Clasificar errores por tipo para manejo específico
2. **User Experience**: Mensajes claros y accionables para usuarios
3. **Logging**: Log completo para debugging sin información sensible
4. **Recovery**: Retry automático para errores transitorios
5. **Fallback**: UI alternativa para errores críticos
6. **Monitoring**: Integración con servicios de monitoreo
7. **Performance**: No bloquear UI durante error handling
8. **Security**: Nunca exponer stack traces a usuarios
9. **Consistency**: Manejo uniforme en toda la aplicación
10. **Testing**: Probar todos los paths de error

## Configuración de Third-Party Services

### Sentry Integration

```typescript
// main.ts
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: environment.production ? 'production' : 'development',
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'https://api.example.com'],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],
  tracesSampleRate: 1.0,
});
```

### LogRocket Integration

```typescript
// main.ts
import LogRocket from 'logrocket';

if (environment.production) {
  LogRocket.init('YOUR_APP_ID');
}
```

## Environment Configuration

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  enableErrorLogging: true,
  errorLogging: {
    console: true,
    api: true,
    sentry: false,
    logRocket: false
  }
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',
  enableErrorLogging: true,
  errorLogging: {
    console: false,
    api: true,
    sentry: true,
    logRocket: true
  }
};
```
