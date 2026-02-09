# Multi-Step Forms

Formularios de múltiples pasos con navegación.

## Multi-Step Form Service

```typescript
@Injectable()
export class MultiStepFormService {
  private currentStep = signal(0);
  private formData = signal<any>({});

  readonly step = this.currentStep.asReadonly();
  readonly data = this.formData.asReadonly();

  nextStep(): void {
    this.currentStep.update(s => s + 1);
  }

  previousStep(): void {
    this.currentStep.update(s => Math.max(0, s - 1));
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
  }

  saveStepData(stepData: any): void {
    this.formData.update(data => ({ ...data, ...stepData }));
  }

  reset(): void {
    this.currentStep.set(0);
    this.formData.set({});
  }
}
```

## Multi-Step Form Component

```typescript
@Component({
  selector: 'app-multi-step-form',
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex justify-between mb-2">
          @for (step of steps; track $index; let i = $index) {
            <div
              class="flex-1 text-center"
              [class.text-primary-600]="i <= currentStep()"
              [class.text-gray-400]="i > currentStep()"
            >
              <div
                class="w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2"
                [class.border-primary-600]="i <= currentStep()"
                [class.bg-primary-600]="i <= currentStep()"
                [class.text-white]="i <= currentStep()"
              >
                {{ i + 1 }}
              </div>
              <p class="text-xs mt-2">{{ step.title }}</p>
            </div>
          }
        </div>
        <div class="h-2 bg-gray-200 rounded">
          <div
            class="h-2 bg-primary-600 rounded transition-all duration-300"
            [style.width.%]="progress"
          ></div>
        </div>
      </div>

      <!-- Step Content -->
      <div [ngSwitch]="currentStep()">
        <app-step-one *ngSwitchCase="0" (next)="handleStepOne($event)" />
        <app-step-two *ngSwitchCase="1" (next)="handleStepTwo($event)" (back)="previous()" />
        <app-step-three *ngSwitchCase="2" (submit)="handleSubmit($event)" (back)="previous()" />
      </div>
    </div>
  `
})
export class MultiStepFormComponent {
  private formService = inject(MultiStepFormService);

  currentStep = this.formService.step;

  steps = [
    { title: 'Información Personal' },
    { title: 'Dirección' },
    { title: 'Confirmación' }
  ];

  get progress(): number {
    return ((this.currentStep() + 1) / this.steps.length) * 100;
  }

  handleStepOne(data: any): void {
    this.formService.saveStepData(data);
    this.formService.nextStep();
  }

  handleStepTwo(data: any): void {
    this.formService.saveStepData(data);
    this.formService.nextStep();
  }

  handleSubmit(data: any): void {
    this.formService.saveStepData(data);
    const finalData = this.formService.data();
    console.log('Form submitted:', finalData);
    // Submit to API
  }

  previous(): void {
    this.formService.previousStep();
  }
}
```

## Step Component Example

```typescript
@Component({
  selector: 'app-step-one',
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <h2 class="text-2xl font-bold mb-6">Información Personal</h2>

      <app-form-input
        formControlName="firstName"
        label="Nombre"
        [required]="true"
        [error]="getError('firstName')"
      />

      <app-form-input
        formControlName="lastName"
        label="Apellido"
        [required]="true"
        [error]="getError('lastName')"
      />

      <button type="submit" [disabled]="form.invalid" class="btn-primary">
        Siguiente
      </button>
    </form>
  `
})
export class StepOneComponent extends BaseFormComponent<any> {
  @Output() next = new EventEmitter<any>();

  protected initForm(): void {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.next.emit(this.form.value);
    }
  }
}
```
