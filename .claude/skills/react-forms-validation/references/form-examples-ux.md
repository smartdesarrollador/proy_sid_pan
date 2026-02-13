# Form Examples & UX Patterns

Ejemplos completos de formularios comunes y patrones UX modernos para producción.

## 1. Login Form - Completo

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        // Server-side validation errors
        if (error.field) {
          setError(error.field, {
            type: 'manual',
            message: error.message,
          });
        } else {
          setServerError(error.message || 'Login failed');
        }
        return;
      }

      const user = await response.json();
      // Redirect or update auth context
      window.location.href = '/dashboard';
    } catch (error) {
      setServerError('Network error. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h1>Welcome Back</h1>
      <p className="subtitle">Enter your credentials to continue</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'input-error' : ''}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" className="error-message" role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={errors.password ? 'input-error' : ''}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.password && (
            <span className="error-message">{errors.password.message}</span>
          )}
        </div>

        <div className="form-field-checkbox">
          <label>
            <input type="checkbox" {...register('rememberMe')} />
            <span>Remember me for 30 days</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>

        <div className="form-footer">
          <a href="/forgot-password">Forgot password?</a>
          <span>
            Don't have an account? <a href="/register">Sign up</a>
          </span>
        </div>
      </form>
    </div>
  );
};
```

## 2. Registration Form con Confirmación

```tsx
const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const password = watch('password');

  // Password strength indicator
  const getPasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = password ? getPasswordStrength(password) : 0;

  const onSubmit = async (data: RegisterFormData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      window.location.href = '/verify-email';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>Create Account</h1>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" {...register('firstName')} />
          {errors.firstName && <span>{errors.firstName.message}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" {...register('lastName')} />
          {errors.lastName && <span>{errors.lastName.message}</span>}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />

        {/* Password strength indicator */}
        {touchedFields.password && password && (
          <div className="password-strength">
            <div className={`strength-bar strength-${passwordStrength}`}>
              <div className="strength-fill" />
            </div>
            <span className="strength-label">
              {passwordStrength <= 2 && 'Weak'}
              {passwordStrength === 3 && 'Medium'}
              {passwordStrength === 4 && 'Strong'}
              {passwordStrength === 5 && 'Very Strong'}
            </span>
          </div>
        )}

        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      </div>

      <div className="form-field-checkbox">
        <label>
          <input type="checkbox" {...register('acceptTerms')} />
          <span>
            I accept the <a href="/terms">Terms and Conditions</a> and{' '}
            <a href="/privacy">Privacy Policy</a>
          </span>
        </label>
        {errors.acceptTerms && <span>{errors.acceptTerms.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
};
```

## 3. UX Patterns - Loading States

### Button Loading State

```tsx
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const LoadingButton = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled,
  type = 'button',
}: LoadingButtonProps) => {
  return (
    <button type={type} disabled={isLoading || disabled} aria-busy={isLoading}>
      {isLoading ? (
        <>
          <span className="spinner" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Uso
<LoadingButton
  isLoading={isSubmitting}
  loadingText="Saving..."
  type="submit"
>
  Save Changes
</LoadingButton>
```

### Form Loading Overlay

```tsx
export const FormLoadingOverlay = ({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) return null;

  return (
    <div
      className="form-loading-overlay"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner-large" />
      <p>Submitting form...</p>
    </div>
  );
};

// Uso en formulario
<div className="form-container">
  <form onSubmit={handleSubmit(onSubmit)}>
    {/* form fields */}
  </form>
  <FormLoadingOverlay isLoading={isSubmitting} />
</div>
```

## 4. UX Patterns - Success & Error Feedback

### Toast Notification

```tsx
interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}

export const Toast = ({ type, message, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
      </span>
      <p>{message}</p>
      <button onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
};

// Hook para gestionar toasts
export const useToast = () => {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (type: ToastProps['type'], message: string) => {
    setToast({ type, message, onClose: () => setToast(null) });
  };

  return { toast, showToast };
};

// Uso en formulario
const MyForm = () => {
  const { toast, showToast } = useToast();

  const onSubmit = async (data) => {
    try {
      await api.save(data);
      showToast('success', 'Form saved successfully!');
    } catch (error) {
      showToast('error', 'Failed to save form. Please try again.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* fields */}
      </form>
      {toast && <Toast {...toast} />}
    </>
  );
};
```

## 5. UX Patterns - Dirty Fields & Unsaved Changes

### Unsaved Changes Warning

```tsx
export const useUnsavedChangesWarning = (isDirty: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};

// Uso
const EditProfileForm = () => {
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm();

  useUnsavedChangesWarning(isDirty);

  return <form>{/* fields */}</form>;
};
```

### Dirty Fields Indicator

```tsx
export const DirtyFieldsIndicator = ({ dirtyFields }: { dirtyFields: any }) => {
  const dirtyCount = Object.keys(dirtyFields).length;

  if (dirtyCount === 0) return null;

  return (
    <div className="dirty-indicator" role="status">
      <span className="dirty-badge">{dirtyCount}</span>
      <span>
        {dirtyCount === 1
          ? '1 unsaved change'
          : `${dirtyCount} unsaved changes`}
      </span>
    </div>
  );
};

// Uso
const {
  formState: { dirtyFields },
} = useForm();

<DirtyFieldsIndicator dirtyFields={dirtyFields} />
```

## 6. UX Patterns - Auto-save Drafts

```tsx
export const useAutoSave = (
  data: any,
  saveDraft: (data: any) => Promise<void>,
  delay = 2000
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data && Object.keys(data).length > 0) {
        setIsSaving(true);
        try {
          await saveDraft(data);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [data, saveDraft, delay]);

  return { isSaving, lastSaved };
};

// Uso
const LongForm = () => {
  const { watch } = useForm();
  const formData = watch();

  const saveDraft = async (data: any) => {
    await fetch('/api/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const { isSaving, lastSaved } = useAutoSave(formData, saveDraft);

  return (
    <div>
      <form>{/* fields */}</form>
      {isSaving && <span>Saving draft...</span>}
      {lastSaved && (
        <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
      )}
    </div>
  );
};
```

## 7. UX Patterns - Field Validation Feedback

### Real-time Validation Feedback

```tsx
interface FieldValidationProps {
  error?: FieldError;
  isValid?: boolean;
  isTouched?: boolean;
}

export const FieldValidationFeedback = ({
  error,
  isValid,
  isTouched,
}: FieldValidationProps) => {
  if (!isTouched) return null;

  if (error) {
    return (
      <div className="validation-feedback error">
        <span className="icon">❌</span>
        <span>{error.message}</span>
      </div>
    );
  }

  if (isValid) {
    return (
      <div className="validation-feedback success">
        <span className="icon">✅</span>
        <span>Looks good!</span>
      </div>
    );
  }

  return null;
};

// Uso
const {
  register,
  formState: { errors, touchedFields },
  watch,
} = useForm();

const emailValue = watch('email');
const isEmailValid = !errors.email && emailValue;

<div className="form-field">
  <input {...register('email')} />
  <FieldValidationFeedback
    error={errors.email}
    isValid={isEmailValid}
    isTouched={touchedFields.email}
  />
</div>
```

## 8. UX Patterns - Field Hints & Tooltips

```tsx
interface FieldHintProps {
  children: React.ReactNode;
  tooltip?: string;
}

export const FieldHint = ({ children, tooltip }: FieldHintProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="field-hint">
      <span className="hint-text">{children}</span>
      {tooltip && (
        <div className="tooltip-wrapper">
          <button
            type="button"
            className="tooltip-trigger"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="More information"
          >
            ℹ️
          </button>
          {showTooltip && (
            <div className="tooltip" role="tooltip">
              {tooltip}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Uso
<div className="form-field">
  <label>Password</label>
  <input type="password" {...register('password')} />
  <FieldHint tooltip="Must contain at least one uppercase, lowercase, number and special character">
    Choose a strong password
  </FieldHint>
</div>
```

## 9. Reset Form Pattern

```tsx
const EditForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitSuccessful },
  } = useForm<FormData>({
    defaultValues: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  });

  // Reset form after successful submit
  useEffect(() => {
    if (isSubmitSuccessful) {
      reset(); // Reset to default values
      // Or reset with new values:
      // reset({ name: 'New Name', email: 'new@example.com' });
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (data: FormData) => {
    await api.save(data);
  };

  const handleReset = () => {
    reset(); // Reset to default values
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <input {...register('email')} />

      <button type="submit">Save</button>
      <button type="button" onClick={handleReset} disabled={!isDirty}>
        Reset
      </button>
    </form>
  );
};
```

## Best Practices Summary

1. **Loading States**: Siempre mostrar feedback durante submit
2. **Success Feedback**: Toast o mensaje temporal después de submit exitoso
3. **Error Handling**: Mostrar errores claros del servidor
4. **Dirty Tracking**: Alertar antes de abandonar con cambios sin guardar
5. **Auto-save**: Guardar borradores en formularios largos
6. **Validation Feedback**: Iconos visuales para éxito/error
7. **Accessibility**: Labels, aria-attributes, roles y focus management
8. **Password Strength**: Indicador visual para passwords
9. **Reset Pattern**: Reset después de submit exitoso
10. **Tooltips**: Ayuda contextual para campos complejos
