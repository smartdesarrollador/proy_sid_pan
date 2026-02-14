# Internationalization (i18n) SEO

Para sitios multilingües, Google necesita saber qué página servir a cada usuario.

## 1. Hreflang Tags

Evita contenido duplicado usando etiquetas `hreflang` en la metadata del `layout`.

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Configuración de idiomas alternativos
  alternates: {
    canonical: 'https://mysite.com/es',
    languages: {
      'en-US': 'https://mysite.com/en-us',
      'es-ES': 'https://mysite.com/es-es',
      'fr': 'https://mysite.com/fr',
    },
  },
  // Open Graph específico por Locale
  openGraph: {
    locale: 'es_ES',
    alternateLocale: ['en_US', 'fr_FR'],
  },
};
```

## 2. Dynamic Metadata por Locale

Ajusta títulos y descripciones según el idioma actual (`[lang]`).

```typescript
// app/[lang]/page.tsx
type Props = {
  params: { lang: 'en' | 'es' };
};

const dictionaries = {
  en: { title: 'Welcome', desc: 'Best site ever' },
  es: { title: 'Bienvenido', desc: 'El mejor sitio' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dict = dictionaries[params.lang];
  
  return {
    title: dict.title,
    description: dict.desc,
    alternates: {
      // Canonical URLs dinámicas
      canonical: `https://mysite.com/${params.lang}`,
      languages: {
        'en': 'https://mysite.com/en',
        'es': 'https://mysite.com/es',
      },
    },
  };
}
```

## 3. Estructura de URLs

Usa subdirectorios (`/es`, `/en`) en lugar de subdominios (`es.mysite.com`) o query params (`?lang=es`) para mejor autoridad de dominio (DA).

### Middleware (`middleware.ts`)

Redirecciona automáticamente al idioma preferido del usuario.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'es'];
const defaultLocale = 'en';

function getLocale(request: NextRequest) {
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ignora assets y API calls
  if (pathname.startsWith('/_next') || pathname.includes('.')) return;

  // Revisa si ya tiene locale en la URL
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirecciona a la URL con idioma
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```
