# Change Password Component

Componente para cambiar contraseña del usuario autenticado.

## TypeScript Component

`src/app/features/profile/change-password/change-password.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);

  changePasswordForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  showNewPasswordConfirmation = signal<boolean>(false);

  constructor() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      newPasswordConfirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador de fortaleza de contraseña
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
   * Validador de coincidencia de contraseñas
   */
  private passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const newPasswordConfirmation = group.get('newPasswordConfirmation')?.value;

    return newPassword === newPasswordConfirmation ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userService.changePassword(this.changePasswordForm.value).subscribe({
      next: response => {
        if (response.success) {
          this.successMessage.set('Password changed successfully!');
          this.changePasswordForm.reset();

          // Redirect a profile después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/profile']);
          }, 2000);
        }
        this.isLoading.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Failed to change password. Please check your current password and try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirmation'): void {
    if (field === 'current') {
      this.showCurrentPassword.update(value => !value);
    } else if (field === 'new') {
      this.showNewPassword.update(value => !value);
    } else {
      this.showNewPasswordConfirmation.update(value => !value);
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.changePasswordForm.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) {
      return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['passwordStrength']) {
      return 'Password must contain uppercase, lowercase, number and special character';
    }

    return '';
  }

  getPasswordStrength(): { strength: string; color: string; width: string } {
    const password = this.changePasswordForm.get('newPassword')?.value || '';

    if (!password) {
      return { strength: '', color: '', width: '0%' };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) {
      return { strength: 'Weak', color: 'bg-red-500', width: '33%' };
    } else if (score <= 4) {
      return { strength: 'Medium', color: 'bg-yellow-500', width: '66%' };
    } else {
      return { strength: 'Strong', color: 'bg-green-500', width: '100%' };
    }
  }
}
```

## HTML Template

`src/app/features/profile/change-password/change-password.component.html`:

```html
<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <a routerLink="/profile" class="inline-flex items-center text-sm text-primary hover:text-blue-700 mb-4">
        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </a>
      <h1 class="text-3xl font-bold text-gray-900">Change Password</h1>
      <p class="mt-1 text-sm text-gray-600">
        Update your password to keep your account secure
      </p>
    </div>

    <div class="bg-white shadow-md rounded-lg p-6">
      <!-- Success Alert -->
      @if (successMessage()) {
        <div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
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
        <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p class="text-sm">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Change Password Form -->
      <form [formGroup]="changePasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Current Password -->
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div class="relative">
            <input
              id="currentPassword"
              [type]="showCurrentPassword() ? 'text' : 'password'"
              formControlName="currentPassword"
              class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="Enter your current password"
              [class.border-red-500]="changePasswordForm.get('currentPassword')?.touched && changePasswordForm.get('currentPassword')?.invalid"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility('current')"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              @if (showCurrentPassword()) {
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
          @if (getErrorMessage('currentPassword')) {
            <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('currentPassword') }}</p>
          }
        </div>

        <!-- New Password -->
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div class="relative">
            <input
              id="newPassword"
              [type]="showNewPassword() ? 'text' : 'password'"
              formControlName="newPassword"
              class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="Enter your new password"
              [class.border-red-500]="changePasswordForm.get('newPassword')?.touched && changePasswordForm.get('newPassword')?.invalid"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility('new')"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              @if (showNewPassword()) {
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

          <!-- Password Strength Indicator -->
          @if (changePasswordForm.get('newPassword')?.value) {
            <div class="mt-2">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-600">Password strength:</span>
                <span [class]="'font-medium ' + (getPasswordStrength().strength === 'Strong' ? 'text-green-600' : getPasswordStrength().strength === 'Medium' ? 'text-yellow-600' : 'text-red-600')">
                  {{ getPasswordStrength().strength }}
                </span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  [class]="getPasswordStrength().color + ' h-full transition-all duration-300'"
                  [style.width]="getPasswordStrength().width"
                ></div>
              </div>
            </div>
          }

          @if (getErrorMessage('newPassword')) {
            <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('newPassword') }}</p>
          }
          <p class="mt-1 text-xs text-gray-500">
            Must be at least 8 characters with uppercase, lowercase, number and special character
          </p>
        </div>

        <!-- Confirm New Password -->
        <div>
          <label for="newPasswordConfirmation" class="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div class="relative">
            <input
              id="newPasswordConfirmation"
              [type]="showNewPasswordConfirmation() ? 'text' : 'password'"
              formControlName="newPasswordConfirmation"
              class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="Confirm your new password"
              [class.border-red-500]="changePasswordForm.get('newPasswordConfirmation')?.touched && changePasswordForm.get('newPasswordConfirmation')?.invalid"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility('confirmation')"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              @if (showNewPasswordConfirmation()) {
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
          @if (changePasswordForm.errors?.['passwordMismatch'] && changePasswordForm.get('newPasswordConfirmation')?.touched) {
            <p class="mt-1 text-sm text-red-600">Passwords do not match</p>
          }
        </div>

        <!-- Security Tips -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-blue-900 mb-2">Password Security Tips</h4>
          <ul class="text-xs text-blue-700 space-y-1">
            <li class="flex items-start">
              <svg class="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Use a unique password you don't use elsewhere
            </li>
            <li class="flex items-start">
              <svg class="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Avoid common words and patterns
            </li>
            <li class="flex items-start">
              <svg class="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Consider using a password manager
            </li>
          </ul>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            routerLink="/profile"
            class="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="isLoading() || changePasswordForm.invalid"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isLoading()) {
              <svg class="inline animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Changing password...
            } @else {
              Change Password
            }
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
```

## Features

- **Current Password Validation**: Requiere contraseña actual para cambiar
- **Password Strength Indicator**: Barra visual de fortaleza
- **Password Requirements**: Validación de complejidad
- **Password Match Validation**: Confirma que coincidan
- **Show/Hide Password**: Toggle visibility en todos los campos
- **Security Tips**: Consejos útiles para usuarios
- **Auto-redirect**: Redirect después de éxito
- **Error Handling**: Mensajes claros de error
