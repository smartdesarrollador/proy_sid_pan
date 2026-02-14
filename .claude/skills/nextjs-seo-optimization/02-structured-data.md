# Structured Data (JSON-LD)

Los datos estructurados (schemas) permiten a Google entender el contenido (Artículos, Productos, Carrusel, etc.).

## 1. Implementación Básica

Crea un componente `script` para inyectar JSON-LD.

```typescript
// components/JsonLd.tsx
import Script from 'next/script';

export const JsonLd = ({ data }: { data: Record<string, any> }) => (
  <script
    key="json-ld"
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
```

## 2. Tipos Fuertes con `schema-dts`

Usa `npm install -D schema-dts` para tipar correctamente los objetos de esquema.

```typescript
// app/products/[slug]/page.tsx
import { JsonLd } from '@/components/JsonLd';
import type { WithContext, Product } from 'schema-dts';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  const jsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brandName,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  return (
    <section>
      <h1>{product.name}</h1>
      {/* Componentes visuales aquí */}
      
      {/* Inyecta JSON-LD invisible al usuario pero visible para Google */}
      <JsonLd data={jsonLd} />
    </section>
  );
}
```

## 3. Schemas Comunes

### BreadcrumbList (Migas de Pan)
Ayuda a Google a entender la jerarquía del sitio.

```typescript
const breadcrumb: WithContext<BreadcrumbList> = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://mysite.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://mysite.com/blog',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Post Title',
      item: `https://mysite.com/blog/${slug}`,
    },
  ],
};
```

### Article (Blog Post)

```typescript
const article: WithContext<Article> = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting', // O 'NewsArticle'
  headline: post.title,
  image: [post.coverImage],
  datePublished: post.publishedAt,
  dateModified: post.updatedAt,
  author: [{
      '@type': 'Person',
      name: post.author.name,
      url: post.author.profileUrl,
  }],
};
```
