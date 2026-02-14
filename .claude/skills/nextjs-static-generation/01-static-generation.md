# Static Generation Fundamentals

En Next.js App Router, todas las rutas son estáticas por defecto a menos que se usen funciones dinámicas (cookies, headers, searchParams) o fetch con `no-store`.

## 1. Generación Estática (SSG)

La generación estática crea un archivo HTML en tiempo de construcción (`next build`) para rutas sin datos o con datos no dinámicos.

### `generateStaticParams` (Reemplazo de `getStaticPaths`)

Permite generar todas las rutas posibles de una ruta dinámica (ej. `[slug]`) durante el build.

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

// 1. Genera las rutas estáticas al compilar
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then((res) => res.json());

  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

// 2. Fetch de datos para cada página generada
async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  if (!res.ok) return undefined;
  return res.json();
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound(); // Retorna 404 estático
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### Comportamiento de Deduplicación

Si `generateStaticParams` llama a `fetch('.../posts')` y `BlogPost` llama a `fetch('.../posts/slug')`, **Next.js memoiza** las llamadas automáticamente si son la misma URL y opciones.

## 2. Manejo de Parámetros Dinámicos (`dynamicParams`)

Controla qué sucede cuando un usuario visita una ruta que NO fue generada en build time.

```typescript
// app/blog/[slug]/page.tsx

// true (default): Intenta renderizar la página bajo demanda (SSR -> SSG cache)
// false: Retorna 404 si la ruta no estaba en generateStaticParams
export const dynamicParams = true; 

export async function generateStaticParams() {
  return [{ slug: 'a' }, { slug: 'b' }];
}
```

*   `dynamicParams = true`: Útil para blogs o e-commerce grandes donde generar miles de páginas en build es lento. Generas las top 100 y el resto se generan "on-demand" al primer acceso.
*   `dynamicParams = false`: Útil para sitios pequeños o estrictamente estáticos donde una URL desconocida debe ser 404 (ej. documentación fija).

## 3. Forzar Estático (`export const dynamic`)

Si Next.js detecta funciones dinámicas (`cookies()`, `headers()`) cambiará a renderizado dinámico. Puedes forzar error si quieres garantizar estático.

```typescript
// Fuerza error en build si usas funciones dinámicas
export const dynamic = 'force-static';

// Opciones:
// 'auto' (default): Intenta estático, fallback a dinámico si es necesario.
// 'force-dynamic': SSR en cada petición (equivalente a no-store).
// 'error': Lanza error si usas funciones dinámicas.
```
