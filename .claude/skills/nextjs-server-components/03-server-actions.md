# Server Actions & Mutaciones

Server Actions son **funciones asíncronas** que se ejecutan en el servidor, invocadas desde componentes (Server o Client). Eliminan la necesidad de crear rutas API (`/api/submit`) para envío de formularios simple.

## 1. Configuración de 'use server'

### Inline (Dentro de Server Components)

```tsx
// app/page.tsx
export default function Page() {
  async function create(formData: FormData) {
    'use server'; // 👈 Directiva Mágica
    const name = formData.get('name');
    await db.user.create({ data: { name } });
  }

  return (
    <form action={create}>
      <input type="text" name="name" />
      <button type="submit">Crear</button>
    </form>
  );
}
```

### Server Actions Separados (Recomendado)

Crea un archivo dedicado (`actions.ts`) y márcalo con `'use server'` arriba.

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  todo: z.string().min(1),
});

export async function createTodo(prevState: any, formData: FormData) {
  // Validación Zod
  const validatedFields = schema.safeParse({
    todo: formData.get('todo'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Mutación DB
  await db.todo.create({
    data: {
      title: validatedFields.data.todo,
    },
  });

  // Revalidación de Caché (Refresca la UI)
  revalidatePath('/');
  
  return { message: 'Todo creado exitosamente' };
}
```

## 2. Uso en Client Components (`useFormState`)

Para manejar validaciones, feedback visual y estados de carga (`pending`), usa hooks como `useFormState` y `useFormStatus` (paquete `react-dom`).

```tsx
'use client'; // Necesario para hooks

import { useFormState } from 'react-dom';
import { createTodo } from '@/app/actions';

const initialState = {
  message: '',
  errors: null,
};

export function AddTodoForm() {
  const [state, formAction] = useFormState(createTodo, initialState);

  return (
    <form action={formAction}>
      <label htmlFor="todo">Tarea</label>
      <input type="text" id="todo" name="todo" required />
      
      {state.errors?.todo && <p className="error">{state.errors.todo}</p>}
      
      <SubmitButton />
      
      <p aria-live="polite" className="sr-only">
        {state.message}
      </p>
    </form>
  );
}
```

### Pending UI (`useFormStatus`)

Hook especial para saber si el formulario padre está enviando datos.

```tsx
'use client';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Añadir'}
    </button>
  );
}
```

## 3. Revalidación (`revalidatePath` / `revalidateTag`)

Después de una mutación, debes decirle a Next.js qué caché limpiar.

*   `revalidatePath('/todos')`: Purga la caché de una ruta específica.
*   `revalidateTag('collection')`: Purga caché basado en tags asociados a `fetch`.
*   `redirect('/new-page')`: Redirige al usuario (útil tras login/create).
