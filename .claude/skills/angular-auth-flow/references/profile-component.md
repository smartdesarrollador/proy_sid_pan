# Profile Management Component

Componente completo para gestión de perfil de usuario con avatar upload.

## TypeScript Component

`src/app/features/profile/profile.component.ts`:

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  profileForm: FormGroup;
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  isUploadingAvatar = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  constructor() {
    const currentUser = this.authService.currentUser();

    this.profileForm = this.fb.group({
      firstName: [currentUser?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [currentUser?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [{ value: currentUser?.email || '', disabled: true }] // Email no editable
    });
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  /**
   * Actualiza el perfil del usuario
   */
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: response => {
        if (response.success) {
          this.successMessage.set('Profile updated successfully!');
        }
        this.isLoading.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Failed to update profile. Please try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Maneja la selección de archivo de avatar
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select an image file');
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.errorMessage.set('Image size must be less than 2MB');
      return;
    }

    this.selectedFile.set(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Sube el avatar
   */
  uploadAvatar(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploadingAvatar.set(true);
    this.errorMessage.set('');

    this.userService.uploadAvatar(file).subscribe({
      next: response => {
        if (response.success) {
          this.successMessage.set('Avatar uploaded successfully!');
          this.selectedFile.set(null);
          this.previewUrl.set(null);
        }
        this.isUploadingAvatar.set(false);
      },
      error: error => {
        this.errorMessage.set(
          error.error?.message || 'Failed to upload avatar. Please try again.'
        );
        this.isUploadingAvatar.set(false);
      }
    });
  }

  /**
   * Cancela la selección de avatar
   */
  cancelAvatarSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['minlength']) {
      return `Must be at least ${field.errors['minlength'].requiredLength} characters`;
    }

    return '';
  }
}
```

## HTML Template

`src/app/features/profile/profile.component.html`:

```html
<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
      <p class="mt-1 text-sm text-gray-600">
        Manage your account information and preferences
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <div class="bg-white shadow-md rounded-lg p-6">
          <!-- Avatar Section -->
          <div class="text-center mb-6">
            <div class="relative inline-block">
              <img
                [src]="previewUrl() || currentUser()?.avatar || 'https://ui-avatars.com/api/?name=' + currentUser()?.firstName + '+' + currentUser()?.lastName"
                [alt]="currentUser()?.firstName"
                class="w-24 h-24 rounded-full mx-auto border-4 border-gray-200 object-cover"
              />
              @if (isUploadingAvatar()) {
                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              }
            </div>

            <h3 class="mt-4 text-xl font-semibold text-gray-900">
              {{ currentUser()?.firstName }} {{ currentUser()?.lastName }}
            </h3>
            <p class="text-sm text-gray-600">{{ currentUser()?.email }}</p>
            <p class="text-xs text-gray-500 mt-1 capitalize">{{ currentUser()?.role }}</p>
          </div>

          <!-- Avatar Upload -->
          @if (!selectedFile()) {
            <div class="mt-4">
              <label for="avatar-upload" class="btn-primary w-full text-center cursor-pointer block py-2 px-4 rounded-lg">
                Change Avatar
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                class="hidden"
              />
              <p class="mt-2 text-xs text-gray-500 text-center">
                JPG, PNG or GIF (max. 2MB)
              </p>
            </div>
          } @else {
            <div class="mt-4 space-y-2">
              <button
                (click)="uploadAvatar()"
                [disabled]="isUploadingAvatar()"
                class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isUploadingAvatar()) {
                  <svg class="inline animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                } @else {
                  Upload Avatar
                }
              </button>
              <button
                (click)="cancelAvatarSelection()"
                [disabled]="isUploadingAvatar()"
                class="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          }

          <!-- Quick Links -->
          <div class="mt-8 border-t pt-6 space-y-2">
            <a routerLink="/profile/change-password" class="block text-sm text-gray-700 hover:text-primary transition">
              Change Password
            </a>
            <a routerLink="/profile/security" class="block text-sm text-gray-700 hover:text-primary transition">
              Security Settings
            </a>
            <a routerLink="/profile/preferences" class="block text-sm text-gray-700 hover:text-primary transition">
              Preferences
            </a>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2">
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Personal Information
          </h2>

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

          <!-- Profile Form -->
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  [class.border-red-500]="profileForm.get('firstName')?.touched && profileForm.get('firstName')?.invalid"
                />
                @if (getErrorMessage('firstName')) {
                  <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('firstName') }}</p>
                }
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  [class.border-red-500]="profileForm.get('lastName')?.touched && profileForm.get('lastName')?.invalid"
                />
                @if (getErrorMessage('lastName')) {
                  <p class="mt-1 text-sm text-red-600">{{ getErrorMessage('lastName') }}</p>
                }
              </div>
            </div>

            <!-- Email (Read-only) -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <!-- Account Info (Read-only) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Account Created
                </label>
                <p class="text-sm text-gray-600">
                  {{ currentUser()?.createdAt | date:'mediumDate' }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Email Status
                </label>
                @if (currentUser()?.emailVerified) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Verified
                  </span>
                } @else {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Not Verified
                  </span>
                }
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end pt-4 border-t">
              <button
                type="submit"
                [disabled]="isLoading() || profileForm.invalid"
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isLoading()) {
                  <svg class="inline animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                } @else {
                  Save Changes
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Features

- **Avatar Upload**: Con preview, validación de tipo y tamaño
- **Profile Update**: Edición de nombre y apellido
- **Email Read-only**: Email no editable por seguridad
- **Status Badges**: Muestra estado de verificación de email
- **Quick Links**: Navegación a otras configuraciones
- **Responsive**: Diseño adaptable mobile/desktop
- **Loading States**: Feedback visual durante operaciones
- **Error Handling**: Mensajes claros de error/éxito
