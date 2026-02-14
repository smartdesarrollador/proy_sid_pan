# Streaming & Suspense Patterns

Next.js Server Components soportan **Streaming SSR**, permitiendo enviar contenido HTML al navegador en chunks a medida que se renderiza. Esto mejora el **TTFB** (Time To First Byte) y **LCP**.

## 1. Renderizado Progresivo (`Suspense`)

Un componente asíncrono (`async Server Component`) o que haga `fetch` lento pausará el renderizado. Envuelve estas partes en `<Suspense>` para mostrar un fallback inmediato.

```tsx
import { Suspense } from 'react';
import Posts from './Posts'; // Async Server Component
import SkeletonPosts from './SkeletonPosts';

export default function Feed() {
  return (
    <section>
      <h2>Noticias Recientes</h2>
      {/* 
        El Feed NO bloquea el resto de la página. 
        Muestra Skeleton hasta que Posts termine de cargar.
      */}
      <Suspense fallback={<SkeletonPosts />}>
        <Posts />
      </Suspense>
    </section>
  );
}
```

### Casos de Uso
1.  **Dashboard Widgets**: Carga métricas en paralelo, mostrando skeleton individualmente.
2.  **Product Reviews**: Carga los comentarios lentamente mientras el Producto principal ya es visible.
3.  **Search Results**: Muestra filtro y skeleton mientras busca.

## 2. Loading UI (`loading.tsx`)

Next.js crea automáticamente un boundary de Suspense alrededor de `page.tsx`.

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="spinner">Cargando Dashboard...</div>;
}

// app/dashboard/page.tsx (Lento, async)
export default async function Dashboard() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return <h1>Dashboard Listo!</h1>;
}
```

El usuario ve el Spinner **inmediatamente** al navegar a `/dashboard`, y luego ve el contenido final.

## 3. Manejo de Errores en RSC (`error.tsx`)

Si un Server Component falla (error de red, DB), usa un **Error Boundary** (`error.tsx`) para mostrar una UI fallback amigable.

**Nota Importante**: `error.tsx` **DEBE** ser un Client Component (`'use client'`).

```tsx
// app/dashboard/error.tsx
'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Loguear error a servicio de monitoreo (Sentry, etc)
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>¡Ups! Algo salió mal cargar el Dashboard.</h2>
      <button onClick={() => reset()}>
        Intentar de nuevo
      </button>
    </div>
  );
}
```

### Try/Catch en Server Actions

Para Server Actions, el manejo de errores es diferente. Debes retornar un objeto de error serializable, ya que `error.tsx` no captura errores de acciones directamente (solo de render).

```typescript
// actions.ts
'use server';

export async function submitForm() {
  try {
    await db.save();
  } catch (e) {
    return { error: 'Error al guardar.' };
  }
}
```
