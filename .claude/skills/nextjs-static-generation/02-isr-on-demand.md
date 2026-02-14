# ISR & On-Demand Revalidation

La generación estática es genial, pero a veces necesitas actualizaciones frescas sin reconstruir todo el sitio. ISR (Incremental Static Regeneration) e Is On-Demand Revalidation resuelven esto.

## 1. ISR (Revalidación por Tiempo)

Permite **actualizar páginas estáticas** después de un período de tiempo definido.

```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  const data = await fetch('https://api.example.com/metrics', {
    next: { revalidate: 60 }, // Revalida cada 60 segundos
  }).then((res) => res.json());

  return (
    <div>
      <p>Última actualización: {new Date().toLocaleTimeString()}</p>
      <MetricsChart data={data} />
    </div>
  );
}
```

*   **Comportamiento**:
    1.  Request 1 (0s): Devuelve versión cacheada vieja (si existe). Inicia rebuild en background si pasó > 60s.
    2.  Request 2 (5s): Devuelve versión vieja (todavía no lista la nueva).
    3.  Request 3 (62s): Devuelve versión nueva.

## 2. On-Demand Revalidation (Revalidación Manual)

Mucho más eficiente que ISR por tiempo. Actualiza **instantáneamente** cuando ocurre un evento (ej. guardar en CMS, Webhook de Stripe).

### `revalidatePath`

Purga toda la caché asociada a una ruta específica.

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.post.create({ ... });
  revalidatePath('/blog'); // Refresca la lista de posts inmediatamente
}
```

### `revalidateTag` (Lo más potente)

Permite invalidar un grupo de fetches a través de múltiples rutas con una sola etiqueta.

**1. Etiquetar Fetch:**

```typescript
// app/blog/[slug]/page.tsx
async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { tags: ['posts', `post-${slug}`] },
  });
  return res.json();
}
```

**2. Invalidar Etiqueta (API Route/Action):**

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const tag = request.nextUrl.searchParams.get('tag');
  revalidateTag(tag); // Invalida todas las páginas que dependen de este tag
  return Response.json({ revalidated: true, now: Date.now() });
}
```

**Uso:** Llama a `POST /api/revalidate?tag=posts` cuando edites un post en tu CMS.

## 3. Stale-While-Revalidate

Tanto ISR como On-Demand usan la estrategia **stale-while-revalidate**.

1.  Usuario pide página `/blog/1`.
2.  Next.js sirve **instantáneamente** la versión vieja (stale) de la caché.
3.  Next.js revalida en background (fetch nuevo datos, re-renderiza HTML).
4.  Si tiene éxito, actualiza la caché para la siguiente petición.
5.  Si falla, sigue sirviendo la vieja (resiliencia).
