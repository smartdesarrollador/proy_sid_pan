# Verify Email Component

Componente para verificación de email con token.

## TypeScript Component

`src/app/features/auth/verify-email/verify-email.component.ts`:

```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  verificationStatus = signal<'pending' | 'verifying' | 'success' | 'error'>('pending');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isResending = signal<boolean>(false');
  resendSuccess = signal<boolean>(false);

  private token: string | null = null;

  ngOnInit(): void {
    // Obtener token de query params si existe
    this.token = this.route.snapshot.queryParams['token'];

    if (this.token) {
      this.verifyEmail(this.token);
    }
  }

  /**
   * Verifica el email con el token
   */
  private verifyEmail(token: string): void {
    this.verificationStatus.set('verifying');

    this.authService.verifyEmail(token).subscribe({
      next: response => {
        if (response.success) {
          this.verificationStatus.set('success');
          this.successMessage.set('Your email has been successfully verified!');

          // Redirect a login después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        }
      },
      error: error => {
        this.verificationStatus.set('error');
        this.errorMessage.set(
          error.error?.message || 'Verification failed. The link may have expired.'
        );
      }
    });
  }

  /**
   * Reenvía el email de verificación
   */
  resendVerificationEmail(): void {
    this.isResending.set(true);
    this.errorMessage.set('');
    this.resendSuccess.set(false);

    this.authService.resendVerificationEmail().subscribe({
      next: response => {
        if (response.success) {
          this.resendSuccess.set(true);
          this.successMessage.set('Verification email has been sent. Please check your inbox.');
        }
        this.isResending.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Failed to resend verification email. Please try again.'
        );
        this.isResending.set(false);
      }
    });
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }
}
```

## HTML Template

`src/app/features/auth/verify-email/verify-email.component.html`:

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Verifying State -->
    @if (verificationStatus() === 'verifying') {
      <div class="text-center">
        <svg class="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 class="mt-6 text-2xl font-bold text-gray-900">
          Verifying your email...
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Please wait while we verify your email address.
        </p>
      </div>
    }

    <!-- Success State -->
    @if (verificationStatus() === 'success') {
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900">
          Email Verified!
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ successMessage() }}
        </p>
        <p class="mt-4 text-sm text-gray-500">
          Redirecting to login...
        </p>
        <div class="mt-6">
          <a routerLink="/auth/login" class="btn-primary inline-block">
            Go to Login
          </a>
        </div>
      </div>
    }

    <!-- Error State -->
    @if (verificationStatus() === 'error') {
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900">
          Verification Failed
        </h2>
        <div class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p class="text-sm">{{ errorMessage() }}</p>
        </div>

        @if (isAuthenticated()) {
          <div class="mt-6">
            <button
              (click)="resendVerificationEmail()"
              [disabled]="isResending()"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isResending()) {
                <svg class="inline animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              } @else {
                Resend verification email
              }
            </button>
          </div>
        } @else {
          <div class="mt-6">
            <a routerLink="/auth/login" class="btn-primary inline-block">
              Go to Login
            </a>
          </div>
        }
      </div>
    }

    <!-- Pending State (no token in URL) -->
    @if (verificationStatus() === 'pending') {
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
          <svg class="h-10 w-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="mt-6 text-2xl font-bold text-gray-900">
          Verify your email
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          We've sent a verification link to your email address.
        </p>
        <p class="mt-1 text-sm text-gray-600">
          Please check your inbox and click the link to verify your account.
        </p>

        @if (resendSuccess()) {
          <div class="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p class="text-sm">{{ successMessage() }}</p>
          </div>
        }

        @if (errorMessage()) {
          <div class="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p class="text-sm">{{ errorMessage() }}</p>
          </div>
        }

        @if (isAuthenticated()) {
          <div class="mt-6 space-y-4">
            <p class="text-sm text-gray-500">
              Didn't receive the email?
            </p>
            <button
              (click)="resendVerificationEmail()"
              [disabled]="isResending() || resendSuccess()"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isResending()) {
                <svg class="inline animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              } @else {
                Resend verification email
              }
            </button>
          </div>
        }

        <div class="mt-8">
          <a routerLink="/dashboard" class="text-sm font-medium text-primary hover:text-blue-700">
            Continue to dashboard
          </a>
        </div>
      </div>
    }
  </div>
</div>
```

## CSS Styles

`src/app/features/auth/verify-email/verify-email.component.css`:

```css
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:host {
  animation: fadeIn 0.3s ease-out;
}
```

## Uso

1. **Con token en URL**: Usuario hace clic en link de email con `?token=xxx`
   - Verifica automáticamente al cargar
   - Muestra success o error
   - Redirect automático a login

2. **Sin token**: Usuario accede directamente
   - Muestra instrucciones
   - Permite reenviar email (si está autenticado)
   - Link para continuar a dashboard

3. **Resend email**:
   - Solo disponible si usuario está autenticado
   - Previene spam con cooldown visual
   - Muestra confirmación
