# Metadata API & Open Graph (Next.js 14+)

En el App Router, la API de `metadata` reemplaza a `next/head`. Permite configurar tags SEO de forma type-safe, tanto estática como dinámica.

## 1. Metadata Estática (`layout.tsx`)

Define valores base como el título por defecto, template y canonical URL en tu layout raíz.

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Template para páginas hijas: "Page Title | My Site Name"
  title: {
    default: 'My Site Name | Best Products Online',
    template: '%s | My Site Name',
  },
  description: 'La mejor tienda online de productos tecnológicos.',
  
  // Canonical URL (Self-referencing)
  alternates: {
    canonical: './',
  },

  // Open Graph Base
  openGraph: {
    title: 'My Site Name',
    description: 'La mejor tienda online.',
    url: 'https://mysite.com',
    siteName: 'My Site Name',
    images: [
      {
        url: 'https://mysite.com/og-default.png',
        width: 1200,
        height: 630,
        alt: 'My Site Brand',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },

  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'My Site Name',
    description: 'La mejor tienda online.',
    creator: '@mysitehandle',
    images: ['https://mysite.com/twitter-image.png'],
  },

  // Meta tags adicionales
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

## 2. Metadata Dinámica (`page.tsx`)

Usa `generateMetadata` para páginas que dependen de params (slugs, IDs).

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Fetch data una vez (Next.js deduplica requests automáticamente)
async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json();
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Leer params
  const slug = params.slug;
  
  // Fetch data
  const post = await getPost(slug);
 
  // Opcional: Extender metadata del layout padre (ej. imágenes previas)
  const previousImages = (await parent).openGraph?.images || [];
 
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      // Prioriza la imagen del post, fallback a las del padre
      images: [post.coverImage, ...previousImages],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const post = await getPost(params.slug);
  return <article><h1>{post.title}</h1></article>;
}
```
