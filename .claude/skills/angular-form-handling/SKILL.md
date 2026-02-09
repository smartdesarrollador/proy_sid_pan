---
name: angular-form-handling
description: >
  Formularios reactivos completos para Angular standalone con Tailwind CSS. Usar cuando se necesite
  implementar Reactive Forms tipados, BaseFormComponent genérico, custom validators síncronos/asíncronos,
  validaciones reutilizables, form controls con ControlValueAccessor, manejo de errores con mensajes,
  formularios dinámicos, form arrays, validación cross-field, multi-step forms, o integración con APIs.
  Incluye componentes estilizados con Tailwind y código plug-and-play para proyectos Angular.
---

# Angular Form Handling - Reactive Forms

Solución completa para formularios reactivos con tipado fuerte y Tailwind CSS.

## 1. BaseFormComponent Genérico

```typescript
// src/app/shared/components/base-form.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

/**
 * Componente base para formularios reactivos tipados
 * @template T - Tipo del modelo del formulario
 */
export abstract class BaseFormComponent<T> {
  protected fb = inject(FormBuilder);

  /**
   * FormGroup tipado
   */
  abstract form: FormGroup;

  /**
   * Inicializar el formulario (debe implementarse en clase hija)
   */
  protected abstract initForm(): void;

  /**
   * Obtener valor del formulario tipado
   */
  getFormValue(): T {
    return this.form.value as T;
  }

  /**
   * Verificar si el formulario es válido
   */
  isValid(): boolean {
    return this.form.valid;
  }

  /**
   * Marcar todos los campos como touched
   */
  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  /**
   * Resetear formulario
   */
  reset(value?: Partial<T>): void {
    this.form.reset(value);
  }

  /**
   * Actualizar valores parcialmente
   */
  patchValue(value: Partial<T>): void {
    this.form.patchValue(value);
  }

  /**
   * Verificar si un campo tiene error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const control = this.form.get(fieldName);
    if (!control) return false;

    if (errorType) {
      return control.hasError(errorType) && control.touched;
    }

    return control.invalid && control.touched;
  }

  /**
   * Obtener mensaje de error de un campo
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es requerido';
    if (errors['email']) return 'Email inválido';
    if (errors['minlength']) {
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['maxlength']) {
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    }
    if (errors['pattern']) return 'Formato inválido';
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;

    // Custom errors
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    if (errors['emailTaken']) return 'Este email ya está registrado';
    if (errors['weakPassword']) return 'Contraseña muy débil';

    return 'Campo inválido';
  }

  /**
   * Deshabilitar formulario
   */
  disable(): void {
    this.form.disable();
  }

  /**
   * Habilitar formulario
   */
  enable(): void {
    this.form.enable();
  }
}
```

## 2. Custom Validators

```typescript
// src/app/shared/validators/custom.validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

export class CustomValidators {
  /**
   * Validador de email mejorado
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(control.value) ? null : { email: true };
    };
  }

  /**
   * Validador de contraseña fuerte
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const hasUpperCase = /[A-Z]/.test(control.value);
      const hasLowerCase = /[a-z]/.test(control.value);
      const hasNumber = /[0-9]/.test(control.value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(control.value);
      const isLongEnough = control.value.length >= 8;

      const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecial && isLongEnough;

      return valid ? null : {
        weakPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSpecial,
          isLongEnough
        }
      };
    };
  }

  /**
   * Validador de teléfono
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      // Formato: (XXX) XXX-XXXX o XXX-XXX-XXXX
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      return phoneRegex.test(control.value) ? null : { phone: true };
    };
  }

  /**
   * Validador de URL
   */
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: true };
      }
    };
  }

  /**
   * Validador de rango numérico
   */
  static range(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) return null;

      const value = Number(control.value);
      if (isNaN(value)) return { number: true };

      if (value < min || value > max) {
        return { range: { min, max, actual: value } };
      }

      return null;
    };
  }

  /**
   * Validador de confirmación de campo (password confirmation)
   */
  static matchField(fieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;

      const matchingControl = control.parent.get(fieldName);
      if (!matchingControl) return null;

      return control.value === matchingControl.value
        ? null
        : { fieldMismatch: { field: fieldName } };
    };
  }

  /**
   * Validador asíncrono - Verificar si email existe
   */
  static emailExists(checkService: any): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(500).pipe( // Debounce 500ms
        switchMap(() => checkService.checkEmail(control.value)),
        map((exists: boolean) => exists ? { emailTaken: true } : null),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validador asíncrono - Verificar username disponible
   */
  static usernameAvailable(checkService: any): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(500).pipe(
        switchMap(() => checkService.checkUsername(control.value)),
        map((available: boolean) => available ? null : { usernameTaken: true }),
        catchError(() => of(null))
      );
    };
  }
}
```

## 3. Form Control Components

### Input Component

```typescript
// src/app/shared/components/form-input/form-input.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FormInputComponent),
    multi: true
  }],
  template: `
    <div class="form-group">
      <label
        *ngIf="label"
        [for]="id"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>

      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [class]="inputClasses"
      />

      <p *ngIf="error && touched" class="mt-1 text-sm text-red-600">
        {{ error }}
      </p>

      <p *ngIf="hint && !error" class="mt-1 text-sm text-gray-500">
        {{ hint }}
      </p>
    </div>
  `,
  styles: []
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() id = `input-${Math.random()}`;

  value = '';
  disabled = false;
  touched = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  get inputClasses(): string {
    const base = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2';

    if (this.error && this.touched) {
      return `${base} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
    }

    if (this.value && !this.error && this.touched) {
      return `${base} border-green-300 focus:ring-green-500 focus:border-green-500`;
    }

    return `${base} border-gray-300 focus:ring-primary-500 focus:border-primary-500`;
  }

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
    this.touched = true;
  }
}
```

### Select Component

```typescript
// src/app/shared/components/form-select/form-select.component.ts
@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FormSelectComponent),
    multi: true
  }],
  template: `
    <div class="form-group">
      <label *ngIf="label" [for]="id" class="block text-sm font-medium text-gray-700 mb-1">
        {{ label }}
        <span *ngIf="required" class="text-red-500">*</span>
      </label>

      <select
        [id]="id"
        [disabled]="disabled"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onTouched()"
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </option>
      </select>

      <p *ngIf="error && touched" class="mt-1 text-sm text-red-600">
        {{ error }}
      </p>
    </div>
  `
})
export class FormSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Seleccionar...';
  @Input() options: Array<{ value: any; label: string }> = [];
  @Input() required = false;
  @Input() error = '';
  @Input() id = `select-${Math.random()}`;

  value = '';
  disabled = false;
  touched = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.onChange(value);
    this.touched = true;
  }
}
```

## 4. Ejemplo Completo: Login Form

```typescript
// src/app/features/auth/login/login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseFormComponent } from '@shared/components/base-form.component';
import { FormInputComponent } from '@shared/components/form-input/form-input.component';
import { CustomValidators } from '@shared/validators/custom.validators';
import { AuthService } from '@core/services/auth.service';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
          <p class="mt-2 text-sm text-gray-600">
            O <a href="/register" class="text-primary-600 hover:text-primary-500">crear cuenta nueva</a>
          </p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <!-- Email -->
          <app-form-input
            formControlName="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            [required]="true"
            [error]="getErrorMessage('email')"
          />

          <!-- Password -->
          <app-form-input
            formControlName="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            [required]="true"
            [error]="getErrorMessage('password')"
          />

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                formControlName="rememberMe"
                class="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label for="rememberMe" class="ml-2 block text-sm text-gray-900">
                Recordarme
              </label>
            </div>

            <a href="/forgot-password" class="text-sm text-primary-600 hover:text-primary-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="form.invalid || loading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!loading">Iniciar Sesión</span>
            <span *ngIf="loading">Cargando...</span>
          </button>

          <!-- Error general -->
          <div *ngIf="submitError" class="rounded-md bg-red-50 p-4">
            <p class="text-sm text-red-800">{{ submitError }}</p>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent extends BaseFormComponent<LoginForm> implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  form!: FormGroup;
  loading = false;
  submitError = '';

  ngOnInit(): void {
    this.initForm();
  }

  protected initForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, CustomValidators.email()]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.submitError = '';

    try {
      const formValue = this.getFormValue();
      await this.authService.login(formValue.email, formValue.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.submitError = error.message || 'Error al iniciar sesión';
    } finally {
      this.loading = false;
    }
  }
}
```

## 5. Register Form con Validaciones Cross-Field

```typescript
interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

@Component({
  selector: 'app-register',
  template: `<!-- Similar a login con más campos -->`
})
export class RegisterComponent extends BaseFormComponent<RegisterForm> implements OnInit {
  protected initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, CustomValidators.email()]],
      password: ['', [Validators.required, CustomValidators.strongPassword()]],
      confirmPassword: ['', [Validators.required, CustomValidators.matchField('password')]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });

    // Validar confirmPassword cuando password cambie
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity();
    });
  }
}
```

## 6. Form Arrays - Campos Dinámicos

```typescript
import { FormArray } from '@angular/forms';

@Component({
  template: `
    <form [formGroup]="form">
      <div formArrayName="skills">
        @for (skill of skills.controls; track $index) {
          <div [formGroupName]="$index" class="flex gap-2 mb-2">
            <input formControlName="name" placeholder="Skill" class="form-input" />
            <input formControlName="level" type="number" placeholder="Nivel" class="form-input" />
            <button type="button" (click)="removeSkill($index)" class="btn-danger">Eliminar</button>
          </div>
        }
      </div>

      <button type="button" (click)="addSkill()" class="btn-primary">Agregar Skill</button>
    </form>
  `
})
export class SkillsFormComponent {
  form = this.fb.group({
    skills: this.fb.array([])
  });

  get skills(): FormArray {
    return this.form.get('skills') as FormArray;
  }

  addSkill(): void {
    const skillGroup = this.fb.group({
      name: ['', Validators.required],
      level: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    this.skills.push(skillGroup);
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }
}
```

## Referencias

- **Dynamic Forms**: Ver `references/dynamic-forms.md`
- **Multi-Step Forms**: Ver `references/multi-step-forms.md`
- **Testing Forms**: Ver `references/testing-forms.md`
- **Utility Functions**: Ver `references/utilities.md`

## Best Practices

1. **Tipado fuerte**: Interfaces para formularios
2. **Validators reutilizables**: CustomValidators class
3. **ControlValueAccessor**: Form controls custom
4. **Tailwind states**: Estilos para valid/invalid/touched
5. **Async validators**: Debounce 500ms
6. **Error messages**: Centralizados en BaseFormComponent
7. **markAllAsTouched**: Antes de submit
8. **patchValue**: Para actualizar parcialmente
