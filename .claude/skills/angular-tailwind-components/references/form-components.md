# Form Components - Select, Checkbox, Radio, Textarea

Componentes de formulario avanzados con ControlValueAccessor y validaciones.

## 1. Select/Dropdown Component

```typescript
// src/app/shared/components/select/select.component.ts
import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * Select/Dropdown component personalizado con búsqueda.
 *
 * @example
 * <app-select
 *   [options]="countries"
 *   placeholder="Select a country"
 *   [formControl]="countryControl"
 * ></app-select>
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative" #dropdownContainer>
      @if (label) {
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <!-- Trigger button -->
      <button
        type="button"
        [disabled]="disabled"
        (click)="toggleDropdown()"
        (keydown)="handleKeyDown($event)"
        [class]="buttonClasses"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-labelledby]="label"
      >
        <span class="block truncate">
          @if (selectedOption()) {
            @if (selectedOption()!.icon) {
              <span [innerHTML]="selectedOption()!.icon" class="inline-block mr-2"></span>
            }
            {{ selectedOption()!.label }}
          } @else {
            <span class="text-gray-400">{{ placeholder }}</span>
          }
        </span>

        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </span>
      </button>

      <!-- Dropdown panel -->
      @if (isOpen()) {
        <div
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          role="listbox"
        >
          @if (searchable) {
            <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="filterOptions()"
                placeholder="Search..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          }

          @for (option of filteredOptions(); track option.value) {
            <div
              [class]="getOptionClasses(option)"
              (click)="selectOption(option)"
              [attr.role]="'option'"
              [attr.aria-selected]="isSelected(option)"
            >
              @if (option.icon) {
                <span [innerHTML]="option.icon" class="mr-2"></span>
              }
              <span class="block truncate">{{ option.label }}</span>

              @if (isSelected(option)) {
                <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </span>
              }
            </div>
          } @empty {
            <div class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No options found
            </div>
          }
        </div>
      }

      @if (error) {
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      }
    </div>
  `
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() searchable = false;

  value: any = null;
  isOpen = signal(false);
  searchQuery = '';
  filteredOptions = signal<SelectOption[]>([]);

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit(): void {
    this.filteredOptions.set(this.options);
  }

  get selectedOption(): () => SelectOption | undefined {
    return () => this.options.find(opt => opt.value === this.value);
  }

  get buttonClasses(): string {
    const base = 'relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
    const state = this.error
      ? 'border-red-300 text-red-900'
      : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed' : '';
    return `${base} ${state} ${disabledClass}`;
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen.update(val => !val);
    }
  }

  selectOption(option: SelectOption): void {
    if (!option.disabled) {
      this.value = option.value;
      this.onChange(this.value);
      this.isOpen.set(false);
      this.searchQuery = '';
      this.filteredOptions.set(this.options);
    }
  }

  filterOptions(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredOptions.set(
      this.options.filter(opt =>
        opt.label.toLowerCase().includes(query)
      )
    );
  }

  isSelected(option: SelectOption): boolean {
    return option.value === this.value;
  }

  getOptionClasses(option: SelectOption): string {
    const base = 'relative cursor-pointer select-none py-2 pl-3 pr-9';
    const selected = this.isSelected(option)
      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300'
      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700';
    const disabled = option.disabled ? 'opacity-50 cursor-not-allowed' : '';
    return `${base} ${selected} ${disabled}`;
  }

  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;
      case 'Escape':
        this.isOpen.set(false);
        break;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
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
}
```

## 2. Checkbox Component

```typescript
// src/app/shared/components/checkbox/checkbox.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Checkbox component estilizado.
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex items-start">
      <div class="flex items-center h-5">
        <input
          [id]="inputId"
          type="checkbox"
          [checked]="checked"
          [disabled]="disabled"
          (change)="onCheckboxChange($event)"
          (blur)="onTouched()"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      @if (label || description) {
        <div class="ml-3">
          <label
            [for]="inputId"
            class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {{ label }}
            @if (required) {
              <span class="text-red-500">*</span>
            }
          </label>

          @if (description) {
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ description }}
            </p>
          }
        </div>
      }
    </div>

    @if (error) {
      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    }
  `
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() description = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;

  inputId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  checked = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChange(this.checked);
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
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
}
```

## 3. Radio Group Component

```typescript
// src/app/shared/components/radio-group/radio-group.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface RadioOption {
  value: any;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Radio group component.
 */
@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true
    }
  ],
  template: `
    <div>
      @if (label) {
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <div [class]="containerClasses" role="radiogroup" [attr.aria-labelledby]="label">
        @for (option of options; track option.value) {
          <div [class]="itemClasses">
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  [id]="'radio-' + groupName + '-' + option.value"
                  [name]="groupName"
                  type="radio"
                  [value]="option.value"
                  [checked]="isSelected(option)"
                  [disabled]="disabled || option.disabled"
                  (change)="selectOption(option)"
                  (blur)="onTouched()"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div class="ml-3">
                <label
                  [for]="'radio-' + groupName + '-' + option.value"
                  class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {{ option.label }}
                </label>

                @if (option.description) {
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ option.description }}
                  </p>
                }
              </div>
            </div>
          </div>
        }
      </div>

      @if (error) {
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      }
    </div>
  `
})
export class RadioGroupComponent implements ControlValueAccessor {
  @Input() options: RadioOption[] = [];
  @Input() label = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';
  @Input() groupName = `radio-group-${Math.random().toString(36).substr(2, 9)}`;

  value: any = null;

  onChange: any = () => {};
  onTouched: any = () => {};

  get containerClasses(): string {
    return this.layout === 'horizontal'
      ? 'flex flex-wrap gap-4'
      : 'space-y-3';
  }

  get itemClasses(): string {
    return this.layout === 'horizontal'
      ? ''
      : '';
  }

  isSelected(option: RadioOption): boolean {
    return option.value === this.value;
  }

  selectOption(option: RadioOption): void {
    if (!this.disabled && !option.disabled) {
      this.value = option.value;
      this.onChange(this.value);
    }
  }

  writeValue(value: any): void {
    this.value = value;
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
}
```

## 4. Textarea Component

```typescript
// src/app/shared/components/textarea/textarea.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

/**
 * Textarea component con contador de caracteres.
 */
@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  template: `
    <div>
      @if (label) {
        <label
          [for]="inputId"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <textarea
        [id]="inputId"
        [rows]="rows"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [maxlength]="maxLength || undefined"
        [class]="textareaClasses"
        [(ngModel)]="value"
        (blur)="onTouched()"
        (input)="onChange($event)"
        [attr.aria-invalid]="error ? 'true' : 'false'"
      ></textarea>

      <div class="flex justify-between mt-1">
        <div>
          @if (hint && !error) {
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ hint }}
            </p>
          }

          @if (error) {
            <p class="text-sm text-red-600 dark:text-red-400">
              {{ error }}
            </p>
          }
        </div>

        @if (maxLength) {
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ value.length }} / {{ maxLength }}
          </p>
        }
      </div>
    </div>
  `
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() rows = 4;
  @Input() maxLength?: number;

  inputId = `textarea-${Math.random().toString(36).substr(2, 9)}`;
  value = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  get textareaClasses(): string {
    const base = 'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 px-3 py-2 resize-y';
    const state = this.error
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : '';

    return `${base} ${state} ${disabledClass}`;
  }

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = (event: any) => {
      fn(event.target?.value || this.value);
    };
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

## 5. Toggle/Switch Component

```typescript
// src/app/shared/components/toggle/toggle.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Toggle/Switch component.
 */
@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex items-center justify-between">
      @if (label || description) {
        <div class="flex-1 mr-4">
          @if (label) {
            <label
              [for]="inputId"
              class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {{ label }}
              @if (required) {
                <span class="text-red-500">*</span>
              }
            </label>
          }

          @if (description) {
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ description }}
            </p>
          }
        </div>
      }

      <button
        type="button"
        [id]="inputId"
        role="switch"
        [attr.aria-checked]="checked"
        [disabled]="disabled"
        (click)="toggle()"
        (blur)="onTouched()"
        [class]="buttonClasses"
      >
        <span
          [class]="thumbClasses"
          aria-hidden="true"
        ></span>
      </button>
    </div>
  `
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() description = '';
  @Input() disabled = false;
  @Input() required = false;

  inputId = `toggle-${Math.random().toString(36).substr(2, 9)}`;
  checked = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  get buttonClasses(): string {
    const base = 'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    const bg = this.checked
      ? 'bg-blue-600'
      : 'bg-gray-200 dark:bg-gray-700';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${base} ${bg} ${disabledClass}`;
  }

  get thumbClasses(): string {
    const base = 'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out';
    const translate = this.checked ? 'translate-x-5' : 'translate-x-0';

    return `${base} ${translate}`;
  }

  toggle(): void {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.onChange(this.checked);
    }
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
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
}
```

## Ejemplos de Uso en Formularios

```typescript
// Reactive Form
export class MyFormComponent {
  form = this.fb.group({
    country: [''],
    acceptTerms: [false, Validators.requiredTrue],
    gender: [''],
    bio: ['', [Validators.maxLength(500)]],
    notifications: [true]
  });

  countries: SelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'mx', label: 'Mexico' },
    { value: 'ca', label: 'Canada' }
  ];

  genderOptions: RadioOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];
}

// Template
<form [formGroup]="form">
  <app-select
    label="Country"
    [options]="countries"
    formControlName="country"
    [searchable]="true"
  ></app-select>

  <app-checkbox
    label="Accept Terms and Conditions"
    formControlName="acceptTerms"
    [required]="true"
  ></app-checkbox>

  <app-radio-group
    label="Gender"
    [options]="genderOptions"
    formControlName="gender"
  ></app-radio-group>

  <app-textarea
    label="Bio"
    formControlName="bio"
    [maxLength]="500"
  ></app-textarea>

  <app-toggle
    label="Enable Notifications"
    description="Receive email notifications"
    formControlName="notifications"
  ></app-toggle>
</form>
```

## Resumen

Componentes de formulario incluidos:
- **Select**: Dropdown personalizado con búsqueda
- **Checkbox**: Checkbox estilizado con label y description
- **Radio Group**: Grupo de radio buttons
- **Textarea**: Textarea con contador de caracteres
- **Toggle**: Switch/toggle button

Todos implementan `ControlValueAccessor` para compatibilidad con Angular Forms (Reactive y Template-driven), incluyen validaciones visuales, dark mode y accessibility.
