# Dynamic Forms

Generación de formularios desde configuración JSON.

## Form Config Interface

```typescript
export interface FieldConfig {
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  validators?: any[];
  options?: Array<{ value: any; label: string }>;
  hint?: string;
}

export interface FormConfig {
  fields: FieldConfig[];
}
```

## Dynamic Form Component

```typescript
@Component({
  selector: 'app-dynamic-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      @for (field of config.fields; track field.name) {
        <div [ngSwitch]="field.type" class="mb-4">
          <!-- Text Input -->
          <app-form-input
            *ngSwitchCase="'text'"
            [formControlName]="field.name"
            [label]="field.label"
            [placeholder]="field.placeholder"
            [required]="field.required"
            [error]="getError(field.name)"
          />

          <!-- Select -->
          <app-form-select
            *ngSwitchCase="'select'"
            [formControlName]="field.name"
            [label]="field.label"
            [options]="field.options || []"
            [required]="field.required"
            [error]="getError(field.name)"
          />

          <!-- Textarea -->
          <textarea
            *ngSwitchCase="'textarea'"
            [formControlName]="field.name"
            [placeholder]="field.placeholder"
            class="form-textarea"
          ></textarea>
        </div>
      }

      <button type="submit" [disabled]="form.invalid" class="btn-primary">
        Submit
      </button>
    </form>
  `
})
export class DynamicFormComponent implements OnInit {
  @Input() config!: FormConfig;
  @Output() formSubmit = new EventEmitter<any>();

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const group: any = {};

    this.config.fields.forEach(field => {
      const validators = field.validators || [];
      if (field.required) {
        validators.push(Validators.required);
      }

      group[field.name] = ['', validators];
    });

    this.form = this.fb.group(group);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    }
  }

  getError(fieldName: string): string {
    // Implementation
    return '';
  }
}
```

## Usage Example

```typescript
const formConfig: FormConfig = {
  fields: [
    {
      type: 'text',
      name: 'name',
      label: 'Full Name',
      required: true
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email',
      required: true,
      validators: [CustomValidators.email()]
    },
    {
      type: 'select',
      name: 'country',
      label: 'Country',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'mx', label: 'Mexico' }
      ]
    }
  ]
};

// Component
<app-dynamic-form [config]="formConfig" (formSubmit)="handleSubmit($event)" />
```
