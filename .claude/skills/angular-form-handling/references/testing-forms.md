# Testing Forms

Testing de formularios reactivos con Jasmine.

## Setup

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
```

## Test Form Validation

```typescript
it('should create form with required fields', () => {
  expect(component.form.get('email')).toBeTruthy();
  expect(component.form.get('password')).toBeTruthy();
});

it('should invalidate empty email', () => {
  const email = component.form.get('email');
  email?.setValue('');
  expect(email?.hasError('required')).toBe(true);
});

it('should invalidate incorrect email format', () => {
  const email = component.form.get('email');
  email?.setValue('invalid-email');
  expect(email?.hasError('email')).toBe(true);
});

it('should validate correct email', () => {
  const email = component.form.get('email');
  email?.setValue('test@example.com');
  expect(email?.valid).toBe(true);
});

it('should validate password min length', () => {
  const password = component.form.get('password');
  password?.setValue('123');
  expect(password?.hasError('minlength')).toBe(true);
});
```

## Test Custom Validators

```typescript
it('should validate strong password', () => {
  const password = component.form.get('password');
  password?.setValue('weak');
  expect(password?.hasError('weakPassword')).toBe(true);

  password?.setValue('Strong123!');
  expect(password?.valid).toBe(true);
});

it('should validate password match', () => {
  component.form.patchValue({
    password: 'Test123!',
    confirmPassword: 'Test123!'
  });
  expect(component.form.get('confirmPassword')?.valid).toBe(true);

  component.form.patchValue({
    confirmPassword: 'Different123!'
  });
  expect(component.form.get('confirmPassword')?.hasError('fieldMismatch')).toBe(true);
});
```

## Test Form Submission

```typescript
it('should not submit invalid form', () => {
  spyOn(component, 'onSubmit');
  component.form.patchValue({ email: '', password: '' });

  const button = fixture.nativeElement.querySelector('button[type="submit"]');
  button.click();

  expect(component.onSubmit).not.toHaveBeenCalled();
});

it('should submit valid form', async () => {
  component.form.patchValue({
    email: 'test@example.com',
    password: 'password123'
  });

  await component.onSubmit();

  expect(component.loading).toBe(false);
});
```

## Test Error Messages

```typescript
it('should display error message for touched invalid field', () => {
  const email = component.form.get('email');
  email?.setValue('');
  email?.markAsTouched();
  fixture.detectChanges();

  const errorMessage = component.getErrorMessage('email');
  expect(errorMessage).toBe('Este campo es requerido');
});
```

## Test Async Validators

```typescript
it('should validate email availability asynchronously', fakeAsync(() => {
  const emailService = TestBed.inject(EmailCheckService);
  spyOn(emailService, 'checkEmail').and.returnValue(of(false));

  const email = component.form.get('email');
  email?.setValue('test@example.com');

  tick(500); // Debounce

  expect(email?.valid).toBe(true);
}));
```
