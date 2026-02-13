# Dynamic Routes Advanced

Guía completa de rutas dinámicas en Next.js App Router con TypeScript, generateStaticParams y patrones avanzados.

## Dynamic Segments - [param]

### Single Dynamic Route

```tsx
// app/blog/[slug]/page.tsx
interface BlogPostPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  const { slug } = params;

  const post = await fetch(`https://api.example.com/posts/${slug}`).then((r) => r.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

**URL Examples:**
- `/blog/hello-world` → `slug: "hello-world"`
- `/blog/nextjs-guide` → `slug: "nextjs-guide"`

### Multiple Dynamic Segments

```tsx
// app/projects/[projectId]/tasks/[taskId]/page.tsx
interface TaskPageProps {
  params: {
    projectId: string;
    taskId: string;
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { projectId, taskId } = params;

  const task = await fetch(
    `https://api.example.com/projects/${projectId}/tasks/${taskId}`
  ).then((r) => r.json());

  return (
    <div>
      <h1>Task: {task.title}</h1>
      <p>Project: {projectId}</p>
    </div>
  );
}
```

**URL Examples:**
- `/projects/123/tasks/456` → `projectId: "123"`, `taskId: "456"`
- `/projects/abc/tasks/xyz` → `projectId: "abc"`, `taskId: "xyz"`

## Catch-All Routes - [...param]

### Basic Catch-All

```tsx
// app/docs/[...slug]/page.tsx
interface DocsPageProps {
  params: { slug: string[] };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = params;

  // slug es un array
  const path = slug.join('/');

  return (
    <div>
      <h1>Documentation: {path}</h1>
      <p>Segments: {JSON.stringify(slug)}</p>
    </div>
  );
}
```

**URL Examples:**
- `/docs/intro` → `slug: ["intro"]`
- `/docs/api/authentication` → `slug: ["api", "authentication"]`
- `/docs/guides/getting-started/installation` → `slug: ["guides", "getting-started", "installation"]`

**⚠️ Importante:** NO matchea `/docs` (necesitas catch-all opcional).

### Optional Catch-All - [[...param]]

```tsx
// app/shop/[[...category]]/page.tsx
interface ShopPageProps {
  params: { category?: string[] };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { category } = params;

  if (!category) {
    return <div>All Products</div>;
  }

  const categoryPath = category.join(' > ');

  return <div>Category: {categoryPath}</div>;
}
```

**URL Examples:**
- `/shop` → `category: undefined` (⭐ Ahora matchea!)
- `/shop/electronics` → `category: ["electronics"]`
- `/shop/electronics/phones` → `category: ["electronics", "phones"]`

**Diferencia:** `[[...param]]` matchea la ruta raíz, `[...param]` NO.

## generateStaticParams - Static Generation

### Basic Usage

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  // Fetch todos los posts en build time
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  // Retornar array de params
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then((r) =>
    r.json()
  );

  return <article>{post.title}</article>;
}
```

**Resultado:**
- `next build` pre-genera HTML para todas las páginas
- `/blog/post-1`, `/blog/post-2`, etc. son estáticas
- Ultra rápido (servido desde CDN)

### Multiple Dynamic Segments

```tsx
// app/[lang]/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const languages = ['en', 'es', 'fr'];
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  // Generar combinaciones de lang x slug
  const params = [];

  for (const lang of languages) {
    for (const post of posts) {
      params.push({
        lang,
        slug: post.slug,
      });
    }
  }

  return params;
}

export default async function BlogPostPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  const { lang, slug } = params;

  const post = await fetch(`https://api.example.com/${lang}/posts/${slug}`).then((r) =>
    r.json()
  );

  return <article>{post.title}</article>;
}
```

**Resultado:** Pre-genera todas las combinaciones:
- `/en/blog/hello-world`
- `/es/blog/hello-world`
- `/fr/blog/hello-world`
- `/en/blog/nextjs-guide`
- etc.

### Nested generateStaticParams

```tsx
// app/authors/[authorId]/posts/[postId]/page.tsx

// Parent level
export async function generateStaticParams() {
  const authors = await fetch('https://api.example.com/authors').then((r) => r.json());

  return authors.map((author) => ({
    authorId: author.id.toString(),
  }));
}

// Nested level
export async function generateStaticParams({ params }: { params: { authorId: string } }) {
  const posts = await fetch(`https://api.example.com/authors/${params.authorId}/posts`).then(
    (r) => r.json()
  );

  return posts.map((post) => ({
    postId: post.id.toString(),
  }));
}

export default async function PostPage({
  params,
}: {
  params: { authorId: string; postId: string };
}) {
  const { authorId, postId } = params;

  const post = await fetch(
    `https://api.example.com/authors/${authorId}/posts/${postId}`
  ).then((r) => r.json());

  return <article>{post.title}</article>;
}
```

**Beneficio:** generateStaticParams anidados generan params jerárquicamente.

### dynamicParams - 404 para Params No Generados

```tsx
// app/blog/[slug]/page.tsx
export const dynamicParams = false; // ⚠️ Solo permitir params generados

export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then((r) =>
    r.json()
  );

  return <article>{post.title}</article>;
}
```

**Resultado:**
- `/blog/post-1` (generado) → ✅ 200 OK
- `/blog/random-slug` (NO generado) → ❌ 404 Not Found

**Cuándo usar:**
- ✅ Blog con posts fijos
- ✅ Documentation con rutas conocidas
- ✅ E-commerce con productos limitados

## Route Groups - (folder)

### Organizing Routes

```
app/
├── (marketing)/
│   ├── page.tsx           # / (Home)
│   ├── about/
│   │   └── page.tsx       # /about
│   └── pricing/
│       └── page.tsx       # /pricing
├── (shop)/
│   ├── products/
│   │   └── page.tsx       # /products
│   └── cart/
│       └── page.tsx       # /cart
└── dashboard/
    └── page.tsx           # /dashboard
```

**Importante:** `(marketing)` y `(shop)` NO afectan las URLs.

**Beneficio:** Organizar rutas sin cambiar URLs.

### Layouts por Grupo

```tsx
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>Marketing Nav</nav>
      {children}
    </div>
  );
}

// app/(shop)/layout.tsx
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>Shop Nav</nav>
      {children}
    </div>
  );
}
```

**Resultado:**
- `/about` usa MarketingLayout
- `/products` usa ShopLayout
- Layouts diferentes sin afectar URLs

### Multiple Root Layouts

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="min-h-screen flex items-center justify-center">{children}</div>
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <div className="flex">
          <Sidebar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
```

**Beneficio:** Layouts completamente diferentes (incluso <html>).

## Parallel Routes - @folder

```
app/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── @analytics/
│   │   └── page.tsx
│   └── @team/
│       └── page.tsx
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      <div>{children}</div>

      <div className="grid grid-cols-2 gap-4">
        <div>{analytics}</div>
        <div>{team}</div>
      </div>
    </div>
  );
}
```

**Beneficio:** Renderizar múltiples páginas en paralelo (cada una con su loading/error).

## Intercepting Routes - (.)folder

```
app/
├── feed/
│   └── page.tsx
├── photos/
│   ├── [id]/
│   │   └── page.tsx
│   └── (..)photos/
│       └── [id]/
│           └── page.tsx
```

```tsx
// app/feed/(..)photos/[id]/page.tsx
export default function PhotoModal({ params }: { params: { id: string } }) {
  return (
    <div className="fixed inset-0 bg-black/50">
      <div className="bg-white p-4">
        <h2>Photo {params.id} (Modal)</h2>
      </div>
    </div>
  );
}
```

**Beneficio:**
- Click desde `/feed` → Abre modal (intercepted route)
- Direct URL `/photos/123` → Abre página completa (normal route)

**Convenciones:**
- `(.)` - Mismo nivel
- `(..)` - Un nivel arriba
- `(..)(..)` - Dos niveles arriba
- `(...)` - Desde app root

## Metadata por Ruta Dinámica

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then((r) =>
    r.json()
  );

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: 'article',
      publishedTime: post.publishedAt,
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

  return <article>{post.title}</article>;
}
```

**Beneficio:** SEO optimizado por cada página dinámica.

## Validation y Error Handling

```tsx
// app/users/[id]/page.tsx
import { notFound } from 'next/navigation';
import { z } from 'zod';

const UserIdSchema = z.string().regex(/^\d+$/);

export default async function UserPage({ params }: { params: { id: string } }) {
  // Validar param
  const result = UserIdSchema.safeParse(params.id);

  if (!result.success) {
    notFound(); // 404
  }

  const userId = params.id;

  try {
    const user = await fetch(`https://api.example.com/users/${userId}`).then((r) => {
      if (!r.ok) throw new Error('User not found');
      return r.json();
    });

    return <div>{user.name}</div>;
  } catch {
    notFound(); // 404
  }
}
```

## Mejores Prácticas

### ✅ Naming Conventions
1. **Lowercase** - Siempre usar minúsculas para carpetas (`[id]`, no `[ID]`)
2. **Descriptive** - Nombres claros (`[userId]`, no `[id]` si hay ambigüedad)
3. **Singular** - Para single params (`[slug]`, no `[slugs]`)
4. **Plural** - Para catch-all (`[...segments]`)

### ✅ TypeScript
1. **Tipar params** - Interfaces específicas por ruta
2. **Validación runtime** - Zod para params user-provided
3. **Type guards** - Para error handling
4. **Strict types** - Para generateStaticParams

### ✅ Performance
1. **generateStaticParams** - Para rutas conocidas (SSG)
2. **dynamicParams: false** - Para prevenir 404s en runtime
3. **Parallel fetching** - Promise.all en loaders
4. **Suspense** - Para progressive rendering

### ✅ SEO
1. **generateMetadata** - Para dynamic metadata
2. **generateStaticParams** - Para pre-renderizar todas las páginas
3. **Sitemap.xml** - Incluir todas las rutas dinámicas
4. **Canonical URLs** - Para evitar duplicados

### ❌ Anti-Patterns

```tsx
// ❌ NO: Params sin tipar
export default function Page({ params }) {
  const id = params.id; // any
}

// ✅ SÍ: Params tipados
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id; // string
}

// ❌ NO: Validación sin error handling
export default function Page({ params }: { params: { id: string } }) {
  const user = await fetch(`/api/users/${params.id}`); // puede fallar
}

// ✅ SÍ: Try-catch + notFound
export default function Page({ params }: { params: { id: string } }) {
  try {
    const user = await fetch(`/api/users/${params.id}`);
  } catch {
    notFound();
  }
}
```

## Resumen

Dynamic Routes en Next.js App Router:
- ✅ **[param]**: Single dynamic segment
- ✅ **[...param]**: Catch-all (array de segments)
- ✅ **[[...param]]**: Optional catch-all (incluye ruta raíz)
- ✅ **generateStaticParams**: Pre-generar páginas en build (SSG)
- ✅ **dynamicParams**: Controlar params no generados
- ✅ **(folder)**: Route Groups (organizar sin afectar URLs)
- ✅ **@folder**: Parallel Routes (renderizar múltiples páginas)
- ✅ **(.)folder**: Intercepting Routes (modals, overlays)

**Patrón recomendado:** generateStaticParams + TypeScript + Validation + generateMetadata
