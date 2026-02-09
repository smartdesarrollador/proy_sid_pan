# Logging Strategies - Error Logging Best Practices

Estrategias completas de logging para production.

## 1. Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

class Logger {
  private currentLevel = environment.production ? LogLevel.ERROR : LogLevel.DEBUG;

  debug(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
      this.sendToBackend('ERROR', message, error, args);
    }
  }

  critical(message: string, error?: any, ...args: any[]): void {
    console.error(`[CRITICAL] ${message}`, error, ...args);
    this.sendToBackend('CRITICAL', message, error, args);
    this.sendToThirdParty('CRITICAL', message, error);
  }

  private sendToBackend(level: string, message: string, error: any, args: any[]): void {
    // Implementar envío a backend
  }

  private sendToThirdParty(level: string, message: string, error: any): void {
    // Sentry, LogRocket, etc.
  }
}
```

## 2. Structured Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  user?: {
    id: string;
    email: string;
  };
  session?: {
    id: string;
    duration: number;
  };
  environment: {
    url: string;
    userAgent: string;
    screenResolution: string;
  };
}

class StructuredLogger {
  log(entry: Partial<LogEntry>): void {
    const fullEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.level || LogLevel.INFO,
      message: entry.message || '',
      context: entry.context,
      error: entry.error,
      user: this.getCurrentUser(),
      session: this.getSessionInfo(),
      environment: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`
      }
    };

    // Log local
    this.logLocal(fullEntry);

    // Log remoto (si es ERROR o CRITICAL)
    if (fullEntry.level >= LogLevel.ERROR) {
      this.logRemote(fullEntry);
    }
  }

  private logLocal(entry: LogEntry): void {
    const color = this.getLevelColor(entry.level);
    console.log(`%c${entry.message}`, `color: ${color}`, entry);
  }

  private logRemote(entry: LogEntry): void {
    // Enviar a backend
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch(err => console.error('Failed to send log', err));
  }

  private getLevelColor(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '#6b7280',
      [LogLevel.INFO]: '#3b82f6',
      [LogLevel.WARN]: '#f59e0b',
      [LogLevel.ERROR]: '#ef4444',
      [LogLevel.CRITICAL]: '#dc2626'
    };
    return colors[level];
  }
}
```

## 3. Performance Monitoring

```typescript
class PerformanceLogger {
  private marks = new Map<string, number>();

  startMeasure(name: string): void {
    this.marks.set(name, performance.now());
  }

  endMeasure(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - start;
    this.marks.delete(name);

    this.log(name, duration);

    return duration;
  }

  private log(name: string, duration: number): void {
    const level = this.getDurationLevel(duration);

    console.log(
      `%c[PERF] ${name}: ${duration.toFixed(2)}ms`,
      `color: ${level.color}`
    );

    // Log slow operations
    if (duration > 1000) {
      this.logSlow(name, duration);
    }
  }

  private getDurationLevel(duration: number): { color: string } {
    if (duration < 100) return { color: '#10b981' }; // Fast
    if (duration < 500) return { color: '#f59e0b' }; // Medium
    return { color: '#ef4444' }; // Slow
  }

  private logSlow(name: string, duration: number): void {
    // Enviar métricas de rendimiento al backend
    fetch('/api/metrics/slow', {
      method: 'POST',
      body: JSON.stringify({ name, duration, timestamp: new Date() })
    });
  }
}

// Uso con decorator
function Measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const logger = new PerformanceLogger();

  descriptor.value = function (...args: any[]) {
    logger.startMeasure(propertyKey);
    const result = originalMethod.apply(this, args);
    logger.endMeasure(propertyKey);
    return result;
  };

  return descriptor;
}

// Uso
class DataService {
  @Measure
  loadData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }
}
```

## 4. Third-Party Integration

### Sentry Setup

```typescript
// main.ts
import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  integrations: [
    new BrowserTracing({
      tracingOrigins: ['localhost', environment.apiUrl],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],
  tracesSampleRate: environment.production ? 0.2 : 1.0,
  beforeSend(event, hint) {
    // Filtrar errores sensibles
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(value => ({
        ...value,
        stacktrace: value.stacktrace ? sanitizeStackTrace(value.stacktrace) : undefined
      }));
    }
    return event;
  }
});

// Capturar excepciones manualmente
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'payment',
      severity: 'high'
    },
    extra: {
      userId: currentUser.id,
      amount: paymentAmount
    }
  });
}
```

### LogRocket Setup

```typescript
// main.ts
import LogRocket from 'logrocket';

if (environment.production) {
  LogRocket.init(environment.logRocketAppId);

  // Identificar usuario
  LogRocket.identify(user.id, {
    name: user.name,
    email: user.email,
    subscriptionType: user.plan
  });

  // Integrar con Sentry
  LogRocket.getSessionURL(sessionURL => {
    Sentry.configureScope(scope => {
      scope.setExtra('sessionURL', sessionURL);
    });
  });
}

// Capturar eventos custom
LogRocket.track('PaymentCompleted', {
  amount: 99.99,
  currency: 'USD',
  plan: 'premium'
});
```

## 5. Log Aggregation

```typescript
class LogAggregator {
  private buffer: LogEntry[] = [];
  private readonly bufferSize = 10;
  private readonly flushInterval = 30000; // 30 segundos

  constructor() {
    this.startAutoFlush();
  }

  add(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    // Enviar batch al backend
    fetch('/api/logs/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs })
    }).catch(err => {
      console.error('Failed to flush logs', err);
      // Re-agregar al buffer
      this.buffer.push(...logs);
    });
  }

  private startAutoFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}
```

## 6. Error Tracking Dashboard

```typescript
// Backend API example
/*
GET /api/logs/errors
Response:
{
  "total": 150,
  "errors": [
    {
      "message": "Failed to load user data",
      "count": 45,
      "lastOccurred": "2024-01-15T10:30:00Z",
      "affectedUsers": 12,
      "severity": "ERROR",
      "category": "NETWORK"
    }
  ],
  "byCategory": {
    "NETWORK": 60,
    "VALIDATION": 40,
    "SERVER": 30,
    "CLIENT": 20
  }
}
*/

// Component para visualizar
@Component({
  template: `
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-red-50 p-4 rounded-lg">
        <div class="text-3xl font-bold text-red-600">{{ totalErrors }}</div>
        <div class="text-sm text-red-700">Total Errors</div>
      </div>
      <!-- Más cards de estadísticas -->
    </div>

    <div class="bg-white shadow rounded-lg">
      <table class="min-w-full">
        <thead>
          <tr class="bg-gray-50">
            <th>Error Message</th>
            <th>Count</th>
            <th>Severity</th>
            <th>Last Occurred</th>
          </tr>
        </thead>
        <tbody>
          @for (error of errors; track error.message) {
            <tr>
              <td>{{ error.message }}</td>
              <td>{{ error.count }}</td>
              <td>
                <span [class]="getSeverityClass(error.severity)">
                  {{ error.severity }}
                </span>
              </td>
              <td>{{ error.lastOccurred | date:'medium' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class ErrorDashboardComponent {}
```

## Best Practices

1. **Log Levels**: Usar niveles apropiados (DEBUG en dev, ERROR+ en prod)
2. **Structured**: JSON structured logging para facilitar parsing
3. **Sampling**: En producción, samplear logs (no enviar todo)
4. **PII**: NUNCA logear información personal sensible
5. **Batching**: Agrupar logs antes de enviar al backend
6. **Retention**: Definir política de retención de logs
7. **Monitoring**: Configurar alertas para errores críticos
8. **Context**: Incluir contexto suficiente para debugging
