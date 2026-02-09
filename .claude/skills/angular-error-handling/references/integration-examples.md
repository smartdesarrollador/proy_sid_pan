# Integration Examples - Error Handling en Acción

Ejemplos completos de integración del sistema de error handling.

## 1. Setup Completo de la Aplicación

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Setup third-party error tracking
if (environment.production) {
  setupSentry();
  setupLogRocket();
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));

function setupSentry() {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: 'production',
    tracesSampleRate: 0.2
  });
}

function setupLogRocket() {
  LogRocket.init(environment.logRocketAppId);
}
```

```typescript
// app.config.ts
import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { GlobalErrorHandler } from '@core/services/error-handler.service';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
```

## 2. Ejemplo: E-Commerce Checkout

```typescript
@Component({
  selector: 'app-checkout',
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">Checkout</h2>

      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else if (error()) {
        <app-fallback-ui
          errorCode="500"
          title="Checkout Error"
          [message]="error()"
          [showHomeButton]="false"
          (retry)="loadCart()"
        ></app-fallback-ui>
      } @else {
        <form [formGroup]="checkoutForm" (ngSubmit)="processPayment()">
          <!-- Form fields -->

          <button
            type="submit"
            [disabled]="checkoutForm.invalid || isProcessing()"
            class="btn-primary w-full"
          >
            @if (isProcessing()) {
              Processing...
            } @else {
              Complete Purchase
            }
          </button>
        </form>
      }
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private errorLogger = inject(ErrorLoggingService);
  private router = inject(Router);

  checkoutForm = this.fb.group({
    cardNumber: ['', [Validators.required]],
    cvv: ['', [Validators.required]],
    expiryDate: ['', [Validators.required]]
  });

  isLoading = signal(false);
  isProcessing = signal(false);
  error = signal<string | null>(null);
  cart = signal<CartItem[]>([]);

  ngOnInit() {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.cartService.getCart()
      .pipe(
        retryOnNetworkError(3, 1000),
        catchError(error => {
          this.errorLogger.error('Failed to load cart', error);
          this.error.set('Unable to load your cart. Please try again.');
          return of([]);
        })
      )
      .subscribe(cart => {
        this.cart.set(cart);
        this.isLoading.set(false);
      });
  }

  processPayment(): void {
    if (this.checkoutForm.invalid) return;

    this.isProcessing.set(true);

    const paymentData = {
      ...this.checkoutForm.value,
      amount: this.getTotalAmount(),
      items: this.cart()
    };

    this.paymentService.processPayment(paymentData)
      .pipe(
        catchError(error => {
          this.errorLogger.error('Payment processing failed', error, {
            amount: paymentData.amount,
            itemCount: this.cart().length
          });

          // Mostrar error específico según el tipo
          if (error.status === 402) {
            this.toastService.error('Payment declined. Please check your card details.', 'Payment Failed');
          } else if (error.status === 422) {
            this.toastService.error('Invalid payment information. Please verify your details.', 'Validation Error');
          } else {
            this.toastService.error('Payment could not be processed. Please try again.', 'Error');
          }

          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.toastService.success('Payment successful!', 'Success');
          this.router.navigate(['/order-confirmation', response.orderId]);
        },
        error: () => {
          this.isProcessing.set(false);
        }
      });
  }

  private getTotalAmount(): number {
    return this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

## 3. Ejemplo: File Upload con Progress

```typescript
@Component({
  selector: 'app-file-upload',
  template: `
    <div class="max-w-md mx-auto p-6">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          (change)="onFileSelected($event)"
          #fileInput
          class="hidden"
        />

        <button
          (click)="fileInput.click()"
          [disabled]="isUploading()"
          class="btn-primary"
        >
          Select File
        </button>

        @if (isUploading()) {
          <div class="mt-4">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div
                class="bg-primary h-2.5 rounded-full transition-all"
                [style.width.%]="uploadProgress()"
              ></div>
            </div>
            <p class="text-sm text-gray-600 mt-2">
              Uploading... {{ uploadProgress() }}%
            </p>
          </div>
        }

        @if (error()) {
          <div class="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {{ error() }}
          </div>
        }
      </div>
    </div>
  `
})
export class FileUploadComponent {
  private uploadService = inject(FileUploadService);
  private toastService = inject(ToastService);
  private errorLogger = inject(ErrorLoggingService);

  isUploading = signal(false);
  uploadProgress = signal(0);
  error = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validar tamaño
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.error.set('File size must be less than 10MB');
      return;
    }

    this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.error.set(null);

    this.uploadService.upload(file)
      .pipe(
        tap(event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((100 * event.loaded) / event.total);
            this.uploadProgress.set(progress);
          }
        }),
        retryWhen(errors =>
          errors.pipe(
            mergeMap((error, index) => {
              // Solo retry en network errors
              if (error.status === 0 && index < 2) {
                this.toastService.info(`Retrying upload... (${index + 1}/2)`);
                return timer(2000);
              }
              return throwError(() => error);
            })
          )
        ),
        catchError(error => {
          this.errorLogger.error('File upload failed', error, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          });

          if (error.status === 413) {
            this.error.set('File is too large');
          } else if (error.status === 415) {
            this.error.set('File type not supported');
          } else {
            this.error.set('Upload failed. Please try again.');
          }

          return throwError(() => error);
        })
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            this.toastService.success('File uploaded successfully!');
            this.isUploading.set(false);
          }
        },
        error: () => {
          this.isUploading.set(false);
        }
      });
  }
}
```

## 4. Ejemplo: Real-time Data Dashboard

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Dashboard</h1>

        @if (connectionStatus() === 'connected') {
          <span class="flex items-center gap-2 text-green-600">
            <span class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
            Live
          </span>
        } @else if (connectionStatus() === 'reconnecting') {
          <span class="flex items-center gap-2 text-yellow-600">
            <span class="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></span>
            Reconnecting...
          </span>
        } @else {
          <span class="flex items-center gap-2 text-red-600">
            <span class="w-2 h-2 bg-red-600 rounded-full"></span>
            Disconnected
          </span>
        }
      </div>

      <!-- Dashboard content -->
      <div class="grid grid-cols-3 gap-6">
        @for (metric of metrics(); track metric.id) {
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-gray-500 text-sm">{{ metric.label }}</h3>
            <p class="text-3xl font-bold mt-2">{{ metric.value }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dataService = inject(RealTimeDataService);
  private toastService = inject(ToastService);
  private errorLogger = inject(ErrorLoggingService);

  metrics = signal<Metric[]>([]);
  connectionStatus = signal<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  private subscription?: Subscription;
  private retryCount = 0;
  private maxRetries = 5;

  ngOnInit() {
    this.startPolling();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private startPolling(): void {
    this.subscription = interval(5000) // Poll cada 5 segundos
      .pipe(
        switchMap(() => this.dataService.getMetrics()),
        tap(() => {
          this.connectionStatus.set('connected');
          this.retryCount = 0;
        }),
        retry({
          delay: (error, retryCount) => {
            this.retryCount = retryCount;

            if (retryCount >= this.maxRetries) {
              this.connectionStatus.set('disconnected');
              this.toastService.error('Unable to connect to server', 'Connection Lost');
              this.errorLogger.error('Dashboard polling failed permanently', error);
              return throwError(() => error);
            }

            this.connectionStatus.set('reconnecting');
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

            this.toastService.info(`Reconnecting in ${delay / 1000}s...`);

            return timer(delay);
          }
        }),
        catchError(error => {
          this.errorLogger.critical('Dashboard connection failed', error);
          return of([]);
        })
      )
      .subscribe(metrics => {
        this.metrics.set(metrics);
      });
  }
}
```

## 5. Offline Queue Implementation

```typescript
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private queue: QueuedRequest[] = [];
  private readonly STORAGE_KEY = 'offline_queue';

  constructor() {
    this.loadQueue();
    this.setupOnlineListener();
  }

  enqueue(request: QueuedRequest): void {
    this.queue.push(request);
    this.saveQueue();
    this.toastService.info('Request queued for when you're back online');
  }

  private setupOnlineListener(): void {
    fromEvent(window, 'online').subscribe(() => {
      this.toastService.success('Back online! Processing queued requests...');
      this.processQueue();
    });

    fromEvent(window, 'offline').subscribe(() => {
      this.toastService.warning('You're offline. Changes will be synced when connection is restored.');
    });
  }

  private processQueue(): void {
    const requests = [...this.queue];
    this.queue = [];

    requests.forEach(req => {
      this.http.request(req.method, req.url, { body: req.data })
        .pipe(
          catchError(error => {
            this.queue.push(req); // Re-queue if failed
            return throwError(() => error);
          })
        )
        .subscribe({
          next: () => {
            this.toastService.success(`Synced: ${req.description}`);
          },
          error: () => {
            this.toastService.error(`Failed to sync: ${req.description}`);
          }
        });
    });

    this.saveQueue();
  }

  private saveQueue(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }

  private loadQueue(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    this.queue = stored ? JSON.parse(stored) : [];
  }
}
```

## Best Practices Resumen

1. **Retry Strategy**: Usar backoff exponencial con límite
2. **User Feedback**: Siempre informar al usuario del estado
3. **Logging**: Log todos los errores críticos con contexto
4. **Fallback UI**: Tener UI alternativa para errores
5. **Offline Support**: Implementar queue para operaciones offline
6. **Progress Indication**: Mostrar progreso en operaciones largas
7. **Error Recovery**: Permitir al usuario reintentar
8. **Monitoring**: Integrar con servicios de monitoreo en producción
