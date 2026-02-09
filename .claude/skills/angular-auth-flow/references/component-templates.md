# Component Templates - Angular Auth Flow

Templates HTML completos para los componentes de autenticación.

## Register Template

`src/app/features/auth/register/register.component.html`:

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Already have an account?
        <a routerLink="/auth/login" class="font-medium text-primary hover:text-blue-700">
          Sign in
        </a>
      </p>
    </div>

    <!-- Register Form -->
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <p class="text-sm">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Form Errors -->
      @if (getFormErrorMessage()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <p class="text-sm">{{ getFormErrorMessage() }}</p>
        </div>
      }

      <div class="space-y-4">
        <!-- First Name & Last Name -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              formControlName="firstName"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="John"
              [class.border-red-500]="registerForm.get('firstName')?.touched && registerForm.get('firstName')?.invalid"
            />
            @if (getErrorMessage('firstName')) {
              <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('firstName') }}</p>
            }
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              formControlName="lastName"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="Doe"
              [class.border-red-500]="registerForm.get('lastName')?.touched && registerForm.get('lastName')?.invalid"
            />
            @if (getErrorMessage('lastName')) {
              <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('lastName') }}</p>
            }
          </div>
        </div>

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
            [class.border-red-500]="registerForm.get('email')?.touched && registerForm.get('email')?.invalid"
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
              [class.border-red-500]="registerForm.get('password')?.touched && registerForm.get('password')?.invalid"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility('password')"
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
          <p class="mt-1 text-xs text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, number and special character
          </p>
        </div>

        <!-- Password Confirmation Field -->
        <div>
          <label for="passwordConfirmation" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div class="relative">
            <input
              id="passwordConfirmation"
              [type]="showPasswordConfirmation() ? 'text' : 'password'"
              formControlName="passwordConfirmation"
              class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              [class.border-red-500]="registerForm.get('passwordConfirmation')?.touched && registerForm.get('passwordConfirmation')?.invalid"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility('confirmation')"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              @if (showPasswordConfirmation()) {
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
          @if (getErrorMessage('passwordConfirmation')) {
            <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('passwordConfirmation') }}</p>
          }
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div class="text-sm text-gray-600">
        By signing up, you agree to our
        <a href="/terms" class="font-medium text-primary hover:text-blue-700">Terms of Service</a>
        and
        <a href="/privacy" class="font-medium text-primary hover:text-blue-700">Privacy Policy</a>
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
            <span class="ml-2">Creating account...</span>
          } @else {
            Create account
          }
        </button>
      </div>
    </form>
  </div>
</div>
```

## Forgot Password Template

`src/app/features/auth/forgot-password/forgot-password.component.html`:

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-extrabold text-gray-900">
        Forgot your password?
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    <!-- Forgot Password Form -->
    <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
      <!-- Success Alert -->
      @if (successMessage()) {
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" role="alert">
          <div class="flex">
            <svg class="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm">{{ successMessage() }}</p>
          </div>
        </div>
      }

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
            [class.border-red-500]="forgotPasswordForm.get('email')?.touched && forgotPasswordForm.get('email')?.invalid"
          />
          @if (forgotPasswordForm.get('email')?.touched && forgotPasswordForm.get('email')?.errors?.['required']) {
            <p class="mt-1 text-sm text-red-600">Email is required</p>
          }
          @if (forgotPasswordForm.get('email')?.touched && forgotPasswordForm.get('email')?.errors?.['email']) {
            <p class="mt-1 text-sm text-red-600">Invalid email format</p>
          }
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          [disabled]="isLoading() || successMessage()"
          class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          @if (isLoading()) {
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2">Sending...</span>
          } @else {
            Send reset link
          }
        </button>
      </div>

      <!-- Back to Login -->
      <div class="text-center">
        <a routerLink="/auth/login" class="text-sm font-medium text-primary hover:text-blue-700">
          Back to login
        </a>
      </div>
    </form>
  </div>
</div>
```

## Reset Password Template

`src/app/features/auth/reset-password/reset-password.component.html`:

```html
<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-extrabold text-gray-900">
        Reset your password
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Enter your new password below.
      </p>
    </div>

    @if (!tokenValid()) {
      <!-- Invalid Token -->
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
        <p class="text-sm font-medium">{{ errorMessage() }}</p>
        <p class="mt-2 text-sm">
          Please request a new password reset link.
        </p>
        <div class="mt-4">
          <a routerLink="/auth/forgot-password" class="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-800">
            Request new link
            <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    } @else {
      <!-- Reset Password Form -->
      <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <p class="text-sm">{{ errorMessage() }}</p>
          </div>
        }

        <div class="space-y-4">
          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div class="relative">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="••••••••"
                [class.border-red-500]="resetPasswordForm.get('password')?.touched && resetPasswordForm.get('password')?.invalid"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility('password')"
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
            @if (resetPasswordForm.get('password')?.touched && resetPasswordForm.get('password')?.errors?.['required']) {
              <p class="mt-1 text-sm text-red-600">Password is required</p>
            }
            @if (resetPasswordForm.get('password')?.touched && resetPasswordForm.get('password')?.errors?.['minlength']) {
              <p class="mt-1 text-sm text-red-600">Password must be at least 8 characters</p>
            }
            <p class="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <!-- Password Confirmation Field -->
          <div>
            <label for="passwordConfirmation" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div class="relative">
              <input
                id="passwordConfirmation"
                [type]="showPasswordConfirmation() ? 'text' : 'password'"
                formControlName="passwordConfirmation"
                class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="••••••••"
                [class.border-red-500]="resetPasswordForm.get('passwordConfirmation')?.touched && resetPasswordForm.get('passwordConfirmation')?.invalid"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility('confirmation')"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                @if (showPasswordConfirmation()) {
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
            @if (resetPasswordForm.errors?.['passwordMismatch'] && resetPasswordForm.get('passwordConfirmation')?.touched) {
              <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
            }
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
              <span class="ml-2">Resetting password...</span>
            } @else {
              Reset password
            }
          </button>
        </div>

        <!-- Back to Login -->
        <div class="text-center">
          <a routerLink="/auth/login" class="text-sm font-medium text-primary hover:text-blue-700">
            Back to login
          </a>
        </div>
      </form>
    }
  </div>
</div>
```
