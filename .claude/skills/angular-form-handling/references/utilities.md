# Form Utilities

Funciones de utilidad para formularios.

## Error Message Helper

```typescript
export const ERROR_MESSAGES: Record<string, (error: any) => string> = {
  required: () => 'Este campo es requerido',
  email: () => 'Email inválido',
  minlength: (error) => `Mínimo ${error.requiredLength} caracteres`,
  maxlength: (error) => `Máximo ${error.requiredLength} caracteres`,
  min: (error) => `Valor mínimo: ${error.min}`,
  max: (error) => `Valor máximo: ${error.max}`,
  pattern: () => 'Formato inválido',
  weakPassword: () => 'La contraseña debe tener mayúsculas, minúsculas, números y símbolos',
  fieldMismatch: (error) => `No coincide con ${error.field}`,
  emailTaken: () => 'Este email ya está registrado',
  usernameTaken: () => 'Este nombre de usuario no está disponible'
};

export function getFormError(control: AbstractControl | null): string {
  if (!control || !control.errors || !control.touched) return '';

  const errorKey = Object.keys(control.errors)[0];
  const errorValue = control.errors[errorKey];

  return ERROR_MESSAGES[errorKey]?.(errorValue) || 'Campo inválido';
}
```

## Form Value Transformer

```typescript
export function trimFormValues<T>(formValue: T): T {
  if (typeof formValue !== 'object' || formValue === null) {
    return formValue;
  }

  const trimmed: any = {};

  for (const key in formValue) {
    const value = formValue[key];
    trimmed[key] = typeof value === 'string' ? value.trim() : value;
  }

  return trimmed;
}
```

## Deep Form Validator

```typescript
export function validateAllFields(formGroup: FormGroup): void {
  Object.keys(formGroup.controls).forEach(key => {
    const control = formGroup.get(key);

    if (control instanceof FormGroup) {
      validateAllFields(control);
    } else if (control instanceof FormArray) {
      control.controls.forEach(c => {
        if (c instanceof FormGroup) {
          validateAllFields(c);
        } else {
          c.markAsTouched();
          c.updateValueAndValidity();
        }
      });
    } else {
      control?.markAsTouched();
      control?.updateValueAndValidity();
    }
  });
}
```

## Form Dirty Check

```typescript
export function isDirty(formGroup: FormGroup): boolean {
  return Object.keys(formGroup.controls).some(key => {
    const control = formGroup.get(key);
    return control?.dirty ?? false;
  });
}

export function hasChanges(formGroup: FormGroup, initialValue: any): boolean {
  const currentValue = formGroup.value;
  return JSON.stringify(currentValue) !== JSON.stringify(initialValue);
}
```

## Convert to FormData

```typescript
export function toFormData(data: Record<string, any>): FormData {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    const value = data[key];

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(item => formData.append(`${key}[]`, item));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  return formData;
}
```
