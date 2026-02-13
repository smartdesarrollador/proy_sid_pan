---
name: react-forms-validation
description: >
  Guía completa de formularios y validación en React con TypeScript, react-hook-form y schemas de validación.
  Usar cuando se necesite: controlled vs uncontrolled components, react-hook-form con tipos, validación con Zod/Yup,
  campos comunes tipados (Input, Select, Checkbox, File), validación en tiempo real, manejo de errores, formularios
  complejos (arrays dinámicos, nested objects, conditional fields), submit handling, UX patterns modernos.
  Enfoque en performance, type safety y patrones de producción.
---

# React Forms & Validation - Guía Completa con TypeScript

Guía completa de formularios en React con react-hook-form, Zod/Yup, type safety y patrones UX modernos.

## 1. Controlled vs Uncontrolled Components

### Controlled Components

```tsx
// ✅ Controlled: React controla el estado del input
const ControlledInput = () => {
  const [value, setValue] = useState('');

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

// Pros:
// ✅ Control total sobre el valor
// ✅ Validación inmediata
// ✅ Fácil formatear valores (uppercase, máscaras)
// ✅ Habilitar/deshabilitar submit dinámicamente

// Contras:
// ❌ Re-render en cada keystroke
// ❌ Más código boilerplate
// ❌ Puede ser lento en formularios grandes
```

### Uncontrolled Components

```tsx
// ✅ Uncontrolled: DOM controla el estado del input
const UncontrolledInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Value:', inputRef.current?.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={inputRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
};

// Pros:
// ✅ Menos re-renders (mejor performance)
// ✅ Menos código boilerplate
// ✅ Integración fácil con librerías nativas

// Contras:
// ❌ Menos control sobre el valor
// ❌ Validación solo al submit
// ❌ Difícil acceder al valor en tiempo real
```

### Cuándo Usar Cada Uno

```tsx
// ✅ Usar Controlled cuando:
// - Necesitas validación en tiempo real
// - Formatear valores mientras se escribe
// - Deshabilitar submit según estado del form
// - Sincronizar valores entre múltiples campos
// - Formularios pequeños (< 10 campos)

// ✅ Usar Uncontrolled cuando:
// - Formularios grandes (> 20 campos)
// - Performance es crítica
// - Validación solo al submit es suficiente
// - Integración con librerías no-React
// - Formularios simples sin interdependencias

// ✅ Usar React Hook Form (híbrido):
// - Lo mejor de ambos mundos
// - Uncontrolled por defecto (performance)
// - Controlled cuando sea necesario (validación)
```

## 2. React Hook Form Setup - Type Safety

### Instalación

```bash
npm install react-hook-form @hookform/resolvers zod
# o con yup: npm install yup
```

### Setup Básico con TypeScript

```tsx
import { useForm, SubmitHandler } from 'react-hook-form';

// 1. Definir tipos del formulario
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginForm = () => {
  // 2. Inicializar useForm con tipos
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // 3. Handler tipado con SubmitHandler
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    console.log('Form data:', data);
    // API call
    await api.login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
        />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Opciones Avanzadas de useForm

```tsx
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting, isDirty, isValid, touchedFields },
  watch,
  setValue,
  getValues,
  reset,
  trigger,
  control,
} = useForm<FormData>({
  defaultValues: {},
  mode: 'onBlur', // onBlur | onChange | onSubmit | onTouched | all
  reValidateMode: 'onChange', // onChange | onBlur | onSubmit
  criteriaMode: 'all', // firstError | all
  shouldFocusError: true,
  shouldUnregister: false,
  shouldUseNativeValidation: false,
  delayError: 500, // ms delay para mostrar errores
});

// watch: Observar valores de campos
const emailValue = watch('email');
const allValues = watch(); // Todos los valores

// setValue: Actualizar valor programáticamente
setValue('email', 'test@example.com', {
  shouldValidate: true,
  shouldDirty: true,
  shouldTouch: true,
});

// getValues: Obtener valores sin suscribirse
const currentEmail = getValues('email');

// reset: Resetear formulario
reset(); // Default values
reset({ email: 'new@example.com' }); // Custom values

// trigger: Validar manualmente
await trigger('email'); // Campo específico
await trigger(['email', 'password']); // Múltiples campos
await trigger(); // Todo el formulario
```

## 3. Validación con Zod - Schema Tipado

### Schema Básico de Zod

```tsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Definir schema de Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  rememberMe: z.boolean().optional(),
});

// 2. Inferir tipos de TypeScript desde el schema
type LoginFormData = z.infer<typeof loginSchema>;

// 3. Usar resolver en useForm
const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    // data es 100% tipado y validado
    await api.login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <input type="checkbox" {...register('rememberMe')} />

      <button type="submit" disabled={isSubmitting}>
        Login
      </button>
    </form>
  );
};
```

### Validaciones Custom con Zod

```tsx
// Validaciones avanzadas
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore allowed'),

    email: z.string().email('Invalid email').toLowerCase(),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    confirmPassword: z.string(),

    age: z
      .number({ invalid_type_error: 'Age must be a number' })
      .int('Age must be an integer')
      .min(18, 'You must be at least 18 years old')
      .max(120, 'Invalid age'),

    website: z.string().url('Invalid URL').optional().or(z.literal('')),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .optional(),

    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // Campo donde mostrar el error
  });

type RegisterFormData = z.infer<typeof registerSchema>;
```

### Validaciones Async con Zod

```tsx
// Validación async (ej: verificar si username existe)
const usernameSchema = z.string().refine(
  async (username) => {
    // Simular llamada a API
    const response = await fetch(`/api/check-username?username=${username}`);
    const data = await response.json();
    return data.available;
  },
  {
    message: 'Username is already taken',
  }
);

// Schema con validación async
const registerSchemaAsync = z.object({
  username: z
    .string()
    .min(3)
    .refine(
      async (username) => {
        const available = await checkUsernameAvailability(username);
        return available;
      },
      { message: 'Username is already taken' }
    ),
  email: z.string().email(),
});
```

### Mensajes en Español

```tsx
// Custom error map para mensajes en español
import { z } from 'zod';

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'Debe ser un texto' };
    }
    if (issue.expected === 'number') {
      return { message: 'Debe ser un número' };
    }
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return { message: `Mínimo ${issue.minimum} caracteres` };
    }
    if (issue.type === 'number') {
      return { message: `Debe ser mayor o igual a ${issue.minimum}` };
    }
  }
  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return { message: `Máximo ${issue.maximum} caracteres` };
    }
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

// O definir mensajes custom directamente
const schemaEspanol = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  edad: z.number().min(18, 'Debes ser mayor de 18 años'),
});
```

## 4. Validación con Yup - Alternativa a Zod

### Setup con Yup

```tsx
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// Schema de Yup
const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: yup.boolean(),
});

// Inferir tipos
type LoginFormData = yup.InferType<typeof loginSchema>;

// Usar en useForm
const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
  resolver: yupResolver(loginSchema),
});
```

### Validaciones Avanzadas con Yup

```tsx
const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Minimum 3 characters')
    .max(20, 'Maximum 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore'),

  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email')
    .lowercase(),

  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'One uppercase letter required')
    .matches(/[a-z]/, 'One lowercase letter required')
    .matches(/[0-9]/, 'One number required')
    .matches(/[^A-Za-z0-9]/, 'One special character required'),

  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),

  age: yup
    .number()
    .typeError('Age must be a number')
    .required('Age is required')
    .min(18, 'Must be at least 18')
    .max(120, 'Invalid age'),

  website: yup.string().url('Invalid URL').nullable(),

  acceptTerms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms'),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;
```

### Zod vs Yup - Comparación

```tsx
// ✅ Zod Pros:
// - TypeScript-first (mejor inferencia de tipos)
// - Más moderno y mantenido
// - Mejor performance
// - Composición de schemas más flexible
// - Validación de tipos en runtime + compile time

// ✅ Yup Pros:
// - Más maduro (más años en producción)
// - Documentación más extensa
// - Ecosystem más grande
// - Sintaxis más familiar (similar a Joi)

// Recomendación: Usar Zod para proyectos nuevos (2026+)
```

## 5. Campos Comunes Tipados

### Input Text

```tsx
interface TextInputProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
}

export const TextInput = ({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  required,
}: TextInputProps) => {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={error ? 'input-error' : ''}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error.message}
        </span>
      )}
    </div>
  );
};

// Uso
<TextInput
  name="email"
  label="Email"
  type="email"
  register={register}
  error={errors.email}
  required
/>
```

### Select

```tsx
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
}

export const Select = ({
  name,
  label,
  options,
  register,
  error,
  required,
  placeholder = 'Select an option',
}: SelectProps) => {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        className={error ? 'select-error' : ''}
        aria-invalid={error ? 'true' : 'false'}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
};

// Uso
<Select
  name="country"
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'mx', label: 'Mexico' },
    { value: 'ca', label: 'Canada' },
  ]}
  register={register}
  error={errors.country}
  required
/>
```

### Checkbox

```tsx
interface CheckboxProps {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  error?: FieldError;
}

export const Checkbox = ({ name, label, register, error }: CheckboxProps) => {
  return (
    <div className="form-field-checkbox">
      <label>
        <input type="checkbox" {...register(name)} />
        <span>{label}</span>
      </label>
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
};

// Checkbox Group
interface CheckboxGroupProps {
  name: string;
  label: string;
  options: SelectOption[];
  register: UseFormRegister<any>;
  error?: FieldError;
}

export const CheckboxGroup = ({
  name,
  label,
  options,
  register,
  error,
}: CheckboxGroupProps) => {
  return (
    <div className="form-field">
      <fieldset>
        <legend>{label}</legend>
        {options.map((option) => (
          <label key={option.value}>
            <input type="checkbox" value={option.value} {...register(name)} />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
};
```

### Radio Group

```tsx
interface RadioGroupProps {
  name: string;
  label: string;
  options: SelectOption[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
}

export const RadioGroup = ({
  name,
  label,
  options,
  register,
  error,
  required,
}: RadioGroupProps) => {
  return (
    <div className="form-field">
      <fieldset>
        <legend>
          {label}
          {required && <span className="required">*</span>}
        </legend>
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" value={option.value} {...register(name)} />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
};
```

### Textarea

```tsx
interface TextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  maxLength?: number;
}

export const Textarea = ({
  name,
  label,
  placeholder,
  rows = 4,
  register,
  error,
  required,
  maxLength,
}: TextareaProps) => {
  const { ref, ...registerProps } = register(name);
  const [charCount, setCharCount] = useState(0);

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        {...registerProps}
        ref={(e) => {
          ref(e);
          if (e) {
            setCharCount(e.value.length);
          }
        }}
        onChange={(e) => {
          registerProps.onChange(e);
          setCharCount(e.target.value.length);
        }}
        className={error ? 'textarea-error' : ''}
      />
      {maxLength && (
        <span className="char-count">
          {charCount} / {maxLength}
        </span>
      )}
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
};
```

### File Upload

```tsx
interface FileUploadProps {
  name: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  maxSize?: number; // en MB
}

export const FileUpload = ({
  name,
  label,
  accept,
  multiple,
  register,
  error,
  required,
  maxSize = 5,
}: FileUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        alert(`File size must be less than ${maxSize}MB`);
        e.target.value = '';
        return;
      }

      // Preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        type="file"
        accept={accept}
        multiple={multiple}
        {...register(name)}
        onChange={(e) => {
          register(name).onChange(e);
          handleFileChange(e);
        }}
      />
      <span className="file-hint">Max size: {maxSize}MB</span>
      {preview && (
        <div className="file-preview">
          <img src={preview} alt="Preview" />
        </div>
      )}
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
};

// Validar file en schema Zod
const profileSchema = z.object({
  avatar: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Image is required')
    .refine((files) => files[0]?.size <= 5 * 1024 * 1024, 'Max file size is 5MB')
    .refine(
      (files) => ['image/jpeg', 'image/png', 'image/webp'].includes(files[0]?.type),
      'Only .jpg, .png and .webp formats are supported'
    ),
});
```

Ver `references/field-components.md` para componentes más avanzados.
Ver `references/form-examples.md` para ejemplos completos de formularios.
Ver `references/ux-patterns.md` para patrones UX avanzados.

## Resumen de Best Practices

1. **Type Safety**: Usar Zod para inferir tipos automáticamente
2. **Performance**: React Hook Form es uncontrolled por defecto (menos re-renders)
3. **Validation Mode**: Usar `onBlur` para balance entre UX y performance
4. **Error Messages**: Mostrar errores claros y en el idioma del usuario
5. **Accessibility**: Usar labels, aria-attributes y semántica correcta
6. **Loading States**: Deshabilitar botones durante submit
7. **Default Values**: Siempre proporcionar valores por defecto
8. **Reset Form**: Limpiar formulario después de submit exitoso
9. **Custom Components**: Crear componentes reutilizables para campos
10. **Testing**: Testear validaciones, submit y error handling

## Reglas de Oro

1. ✅ **Usar Zod** para schemas tipados (TypeScript-first)
2. ✅ **defaultValues** siempre para evitar undefined errors
3. ✅ **mode: 'onBlur'** para mejor UX/performance balance
4. ✅ **Deshabilitar submit** durante isSubmitting
5. ✅ **Reset form** después de submit exitoso
6. ✅ **Mensajes claros** de error en el idioma del usuario
7. ✅ **Accessibility** con labels, aria-attributes y roles
8. ✅ **Componentes reutilizables** para DRY
9. ⚠️ **No usar watch()** en exceso (causa re-renders)
10. ⚠️ **No validar onChange** a menos que sea necesario
