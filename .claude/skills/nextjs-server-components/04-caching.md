# Caching & Memoization

Next.js App Router implementa varias capas de caché para optimizar el rendimiento y reducir las llamadas a servidor/DB.

## 1. Fetch Cache (`fetch`)

Next.js "monkey-patches" `fetch()` para añadirle caching automático.

```tsx
// Cache: 'force-cache' (default) -> SSG (Static Site Generation)
// Se cachea indefinidamente hasta revalidate o nueva build.
const res = await fetch('https://api.example.com/data');

// Cache: 'no-store' -> SSR (Server-Side Rendering)
// Se hace request fresco en cada visita.
const res = await fetch('https://api.example.com/data', { cache: 'no-store' });

// Cache: Tiempo de vida (ISR - Incremental Static Regeneration)
// Se cachea por 60 segundos.
const res = await fetch('https://api.example.com/data', { next: { revalidate: 60 } });
```

### Tags (`next: { tags: [...] }`)

Asigna etiquetas para invalidad caché selectivamente.

```tsx
// Fetch con tag
fetch('https://...', { next: { tags: ['posts'] } });

// Invalidate (Server Action)
revalidateTag('posts');
```

## 2. Request Memoization (Deduplicación)

Si haces el mismo `fetch` varias veces en el mismo render (ej. Layout + Page + Component), Next.js solo hace **una** llamada real.

```tsx
// app/layout.tsx
const user = await getUser(); // Fetch 1 (Real)

// app/page.tsx
const user = await getUser(); // Fetch 1 (Memoized, 0 cost)

// components/Header.tsx
const user = await getUser(); // Fetch 1 (Memoized, 0 cost)
```

## 3. React Cache (`cache`)

Para funciones que **NO usan fetch** (ej. DB calls directas), usa `react-cache` para memoizar el resultado durante la request.

```typescript
import { cache } from 'react';
import { db } from '@/lib/db';

export const getUser = cache(async (id: string) => {
  console.log('Fetching user from DB...');
  return db.user.findUnique({ where: { id } });
});
```

Si llamas a `getUser('1')` cinco veces en la misma request, solo verás un log de "Fetching user from DB...".

## 4. unstable_cache (Data Cache para DB/ORM)

Permite cachear operaciones costosas (no fetch) en la **Data Cache** de Next.js.

```typescript
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

const getCachedUser = unstable_cache(
  async (id) => db.user.findUnique({ where: { id } }),
  ['users-by-id'], // Key parts
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['users'],
  }
);
```

### Estrategia Recomendada

1.  **Prefer `fetch`**: Es lo más simple.
2.  **Use `React.cache`**: Para DB queries que se repiten en el mismo render tree.
3.  **Use `unstable_cache`**: Para DB queries pesadas que quieres persistir entre requests (como SSG/ISR).
