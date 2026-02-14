# Sitemaps & Robots

Next.js App Router simplifica la generación de `robots.txt` y sitemaps.

## 1. Robots.txt (`app/robots.ts`)

Controla qué partes del sitio pueden rastrear los bots. Se ubica en `app/robots.ts` (TypeScript nativo).

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/admin/', '/api/'], // Bloquea rutas sensibles
    },
    // Referencia al sitemap completo
    sitemap: 'https://acme.com/sitemap.xml',
    // O múltiples sitemaps: ['https://acme.com/sitemap_index.xml']
  };
}
```

## 2. Sitemap (`app/sitemap.ts`)

Genera dinámicamente `/sitemap.xml`.

### Sitemap Estático + Dinámico

```typescript
import { MetadataRoute } from 'next';

const BASE_URL = 'https://acme.com';

// Fetch de todas las rutas dinámicas (posts, productos)
async function getBlogPosts() {
  const posts = await fetch(`${BASE_URL}/api/posts`).then((res) => res.json());
  return posts.map((post: any) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Rutas estáticas principales
  const staticRoutes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Rutas dinámicas
  const dynamicRoutes = await getBlogPosts();

  return [...staticRoutes, ...dynamicRoutes];
}
```

### Multi Sitemap (Apps gigantes)

Si tienes >50k URLs, debes dividir el sitemap.

1.  Crea `sitemap.ts` (Index Sitemap).
2.  Usa `generateSitemaps` para crear `sitemap/[id].xml`.

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export async function generateSitemaps() {
  // Retorna IDs para sitemap/0.xml, sitemap/1.xml...
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const start = id * 50000;
  const end = start + 50000;
  const products = await getProductsRange(start, end);
  
  return products.map((product) => ({
    url: `https://acme.com/product/${product.id}`,
    lastModified: product.date,
  }));
}
```
