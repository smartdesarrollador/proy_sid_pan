# Metadata & SEO

Guía completa de metadata, SEO y optimización para motores de búsqueda en Next.js App Router con TypeScript.

## Static Metadata

### Basic Metadata

```tsx
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about our company and mission',
};

export default function AboutPage() {
  return <div>About Us Content</div>;
}
```

**HTML Output:**
```html
<head>
  <title>About Us</title>
  <meta name="description" content="Learn more about our company and mission" />
</head>
```

### Complete Metadata Object

```tsx
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home - My App',
  description: 'Welcome to My App, the best platform for...',
  keywords: ['nextjs', 'react', 'typescript', 'app'],
  authors: [{ name: 'Your Name', url: 'https://yoursite.com' }],
  creator: 'Your Name',
  publisher: 'Your Company',
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Home - My App',
    description: 'Welcome to My App',
    url: 'https://myapp.com',
    siteName: 'My App',
    images: [
      {
        url: 'https://myapp.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'My App Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Home - My App',
    description: 'Welcome to My App',
    images: ['https://myapp.com/twitter-image.jpg'],
    creator: '@yourusername',
  },
};

export default function HomePage() {
  return <div>Home Content</div>;
}
```

## Dynamic Metadata

### generateMetadata Function

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  // Fetch post data
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 60 },
  }).then((r) => r.json());

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then((r) =>
    r.json()
  );

  return <article>{post.content}</article>;
}
```

### Metadata con Search Params

```tsx
// app/search/page.tsx
import type { Metadata } from 'next';

interface SearchPageProps {
  searchParams: { q?: string; category?: string };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q || 'all products';
  const category = searchParams.category;

  return {
    title: `Search Results for "${query}"${category ? ` in ${category}` : ''}`,
    description: `Find ${query} on our platform`,
    robots: {
      index: false, // No indexar páginas de búsqueda
    },
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return <div>Search Results</div>;
}
```

## Template Metadata - Layout Herencia

### Root Layout Metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://myapp.com'),
  title: {
    template: '%s | My App',
    default: 'My App - Best Platform',
  },
  description: 'Default description',
  openGraph: {
    siteName: 'My App',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Child Page Metadata

```tsx
// app/blog/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog', // Resultado: "Blog | My App"
  description: 'Read our latest articles',
};

export default function BlogPage() {
  return <div>Blog Content</div>;
}
```

**HTML Output:**
```html
<title>Blog | My App</title>
```

## Open Graph (Social Sharing)

### Complete Open Graph

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await fetch(`https://api.example.com/products/${params.id}`).then((r) =>
    r.json()
  );

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      url: `https://myapp.com/products/${params.id}`,
      siteName: 'My App',
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'en_US',
      type: 'website',
      // Para productos
      // type: 'product',
      // price: {
      //   amount: product.price,
      //   currency: 'USD',
      // },
    },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`).then((r) =>
    r.json()
  );

  return <div>{product.name}</div>;
}
```

### Article Metadata

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then((r) =>
    r.json()
  );

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      section: post.category,
      tags: post.tags,
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}
```

## Twitter Cards

```tsx
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  twitter: {
    card: 'summary_large_image',
    site: '@myapp',
    creator: '@yourusername',
    title: 'Home - My App',
    description: 'Welcome to My App',
    images: ['https://myapp.com/twitter-image.jpg'],
  },
};
```

**Card Types:**
- `summary` - Imagen pequeña (1:1)
- `summary_large_image` - Imagen grande (2:1)
- `app` - App install card
- `player` - Video/audio player

## JSON-LD Structured Data

```tsx
// app/products/[id]/page.tsx
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`).then((r) =>
    r.json()
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://myapp.com/products/${params.id}`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

### Article JSON-LD

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then((r) =>
    r.json()
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://myapp.com/authors/${post.author.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'My App',
      logo: {
        '@type': 'ImageObject',
        url: 'https://myapp.com/logo.png',
      },
    },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

## Sitemap.xml

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch posts
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  const postUrls = posts.map((post) => ({
    url: `https://myapp.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://myapp.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://myapp.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...postUrls,
  ];
}
```

**URL:** `https://myapp.com/sitemap.xml`

## Robots.txt

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/private/'],
      },
    ],
    sitemap: 'https://myapp.com/sitemap.xml',
  };
}
```

**URL:** `https://myapp.com/robots.txt`

**Output:**
```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

User-Agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: https://myapp.com/sitemap.xml
```

## Canonical URLs

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: 'Product Name',
    alternates: {
      canonical: `https://myapp.com/products/${params.id}`,
    },
  };
}
```

**HTML Output:**
```html
<link rel="canonical" href="https://myapp.com/products/123" />
```

## Alternate Languages (i18n)

```tsx
// app/[lang]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  return {
    title: 'Home',
    alternates: {
      canonical: `https://myapp.com/${params.lang}`,
      languages: {
        'en-US': 'https://myapp.com/en',
        'es-ES': 'https://myapp.com/es',
        'fr-FR': 'https://myapp.com/fr',
      },
    },
  };
}
```

**HTML Output:**
```html
<link rel="canonical" href="https://myapp.com/en" />
<link rel="alternate" hreflang="en-US" href="https://myapp.com/en" />
<link rel="alternate" hreflang="es-ES" href="https://myapp.com/es" />
<link rel="alternate" hreflang="fr-FR" href="https://myapp.com/fr" />
```

## Icons & Favicon

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
};
```

## Verification (Google, Bing, etc.)

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
    other: {
      me: ['my-email@example.com', 'https://mywebsite.com'],
    },
  },
};
```

**HTML Output:**
```html
<meta name="google-site-verification" content="google-site-verification-code" />
```

## Mejores Prácticas

### ✅ SEO Essentials
1. **Title tags** - Max 60 caracteres, incluir keywords
2. **Meta descriptions** - Max 160 caracteres, call-to-action
3. **Open Graph** - Para social sharing (Facebook, LinkedIn)
4. **Twitter Cards** - Para Twitter sharing
5. **Canonical URLs** - Para evitar duplicate content
6. **Sitemap.xml** - Para indexación completa
7. **Robots.txt** - Para controlar crawling
8. **Structured Data** - JSON-LD para rich results

### ✅ Performance
1. **metadataBase** - Definir en root layout (URLs absolutas)
2. **Template title** - Evitar repetición con `%s | My App`
3. **Static metadata** - Cuando sea posible (mejor performance)
4. **Dynamic metadata** - Solo para páginas dinámicas
5. **Image optimization** - Usar next/image para OG images

### ✅ Accessibility
1. **Alt text** - En todas las imágenes (incluidas OG images)
2. **Descriptive titles** - Claros y específicos
3. **Language tags** - `<html lang="en">`
4. **Semantic HTML** - Usar tags apropiados

### ✅ Mobile
1. **Viewport meta tag** - Incluido por Next.js automáticamente
2. **Responsive images** - OG images con múltiples tamaños
3. **Mobile-friendly** - Responsive design

### ❌ Anti-Patterns

```tsx
// ❌ NO: Títulos genéricos
export const metadata = {
  title: 'Page',
  description: 'A page',
};

// ✅ SÍ: Títulos descriptivos
export const metadata = {
  title: 'Blog - Latest Articles on Web Development',
  description: 'Read our latest articles about React, Next.js, and TypeScript',
};

// ❌ NO: Metadata hardcodeado en páginas dinámicas
export const metadata = {
  title: 'Product',
};

// ✅ SÍ: generateMetadata para páginas dinámicas
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  return { title: product.name };
}

// ❌ NO: URLs relativas en OG images
openGraph: {
  images: ['/og-image.jpg'], // ❌ Relativa
}

// ✅ SÍ: URLs absolutas
openGraph: {
  images: ['https://myapp.com/og-image.jpg'], // ✅ Absoluta
}
```

## Resumen

Metadata y SEO en Next.js App Router:
- ✅ **Static metadata**: Para páginas estáticas
- ✅ **generateMetadata**: Para páginas dinámicas
- ✅ **Template title**: `%s | My App` para herencia
- ✅ **Open Graph**: Para social sharing
- ✅ **Twitter Cards**: Para Twitter sharing
- ✅ **JSON-LD**: Para structured data (rich results)
- ✅ **Sitemap.xml**: Para indexación completa
- ✅ **Robots.txt**: Para controlar crawling
- ✅ **Canonical URLs**: Para evitar duplicados

**Patrón recomendado:** generateMetadata + Open Graph + JSON-LD + Sitemap
