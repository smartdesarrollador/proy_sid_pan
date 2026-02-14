# Next.js & Form Errors

Next.js App Router y Forms tienen mecanismos específicos.

## 1. Next.js Error Boundaries (`error.tsx`)

Manejan errores de renderizado en Server/Client Components. **DEBEN** ser Client Components (`'use client'`).

`app/dashboard/error.tsx`:

```tsx
'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js Page Error:', error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p>{error.message}</p>
      <button
        className="btn btn-primary"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );
}
```

### `global-error.tsx`

Captura errores en `RootLayout`. Reemplaza el `<html>` completo.

```tsx
'use client';
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong globally!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

## 2. Errores en Server Actions (Validation)

Nunca confíes en el input del usuario. Valida con **Zod** y retorna errores estructurados.

**Action (`actions.ts`):**

```typescript
'use server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function createAccount(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get('email') });
  
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors, // Retorna estructura segura
    };
  }

  try {
      await db.user.create({ data: parsed.data });
      return { message: 'Cuenta creada' };
  } catch (e) {
      if (e.code === 'P2002') return { message: 'Email ya existe.' };
      return { message: 'Error de servidor.' };
  }
}
```

**Client (`SignUpForm.tsx`):**

```tsx
'use client';
import { useFormState } from 'react-dom';
import { createAccount } from '@/app/actions';

export function SignUpForm() {
    // Estado inicial: message: '', errors: {}
    const [state, formAction] = useFormState(createAccount, { message: '', errors: {} });

    return (
        <form action={formAction}>
            <input name="email" type="email" />
            {state.errors?.email && <p className="text-red-500">{state.errors.email}</p>}
            
            {state.message && <div role="alert">{state.message}</div>}
            
            <button type="submit">Sign Up</button>
        </form>
    );
}
```

## 3. Validación de Formularios (React Hook Form + Zod)

Para validación en cliente (Client-side validation) antes de enviar a servidor.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  age: z.number().min(18, 'Debes ser mayor de edad'),
});

export const AgeCheck = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <p>{errors.age.message}</p>}
      <button>Check</button>
    </form>
  );
};
```
