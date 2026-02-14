# Technical Architecture

[⬅️ Volver al README](../README.md)

---

## Índice
- [System Overview](#system-overview)
- [Multi-Tenancy Architecture](#multi-tenancy-architecture)
- [SSR Architecture for Digital Services](#ssr-architecture-for-digital-services)
- [Security](#security)
- [Scalability](#scalability)
- [Tech Stack](#tech-stack)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
├───────────────────────┬─────────────────────────────────┤
│  Frontend Admin       │    Frontend Cliente             │
│  (React + Vite + TS)  │    (React + Vite + TS)          │
│  - RBAC Management    │    - Calendar, Tasks            │
│  - User Management    │    - Notifications, Files       │
│  - Billing            │    - Projects, Dashboard        │
│  - Audit Logs         │    - User Profile               │
└───────────────────────┴─────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   API Gateway / Load Balancer            │
│                    (Nginx / AWS ALB)                     │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│              Backend API (Django REST Framework)         │
├──────────────────────────────────────────────────────────┤
│  /api/v1/admin/        │  /api/v1/app/     │ /api/v1/auth/ │
│  - Tenants             │  - Calendar       │ - Login       │
│  - Users               │  - Tasks          │ - Register    │
│  - Roles               │  - Notifications  │ - Refresh     │
│  - Permissions         │  - Files          │ - MFA         │
│  - Subscriptions       │  - Projects       │               │
│  - Audit Logs          │  - Dashboard      │               │
└───────────────────────┬──────────────────────────────────┘
                        │
        ┌───────────────┴──────────────┐
        │                              │
┌───────▼────────┐             ┌──────▼───────┐
│   PostgreSQL   │             │    Redis     │
│  (Primary DB)  │             │  (Cache +    │
│  - Multi-tenant│             │   Sessions)  │
│  - RLS enabled │             │              │
└────────────────┘             └──────────────┘
        │
┌───────▼────────┐
│  File Storage  │
│  (S3 / MinIO)  │
└────────────────┘
```

---

## Multi-Tenancy Architecture

### Row-Level Security (RLS)

**Concepto**: Aislamiento de datos a nivel de base de datos usando PostgreSQL RLS policies.

**Implementación**:

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON projects
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Django Middleware**:

```python
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Extract tenant from subdomain or JWT
        tenant = self.get_tenant(request)
        
        # Set PostgreSQL session variable
        with connection.cursor() as cursor:
            cursor.execute(
                "SET LOCAL app.tenant_id = %s",
                [str(tenant.id)]
            )
        
        request.tenant = tenant
        response = self.get_response(request)
        return response
```

**Benefits**:
- ✅ Database-level isolation (prevents data leaks even with bugs)
- ✅ No need for `tenant_id` filters in every query
- ✅ Automatic enforcement by PostgreSQL
- ✅ Performance: Indexes include tenant_id as prefix

---

### Subdomain-Based Tenant Identification

**Pattern**: `{tenant-slug}.plataforma.com` → `tenant_id`

**Flow**:
1. User visits `acme.plataforma.com`
2. Middleware extracts `acme` from subdomain
3. Lookup tenant by slug: `Tenant.objects.get(slug='acme')`
4. Set `app.tenant_id` in PostgreSQL session
5. All queries auto-filter by tenant_id via RLS

**Custom Domains** (Enterprise):
- `portal.acmecorp.com` → `tenant_id` (via CNAME verification)
- Stored in `TenantDomain` model with DNS verification

---

## Security

### Authentication & Authorization

**JWT-Based Authentication**:

```
┌─────────┐                                   ┌─────────┐
│ Client  │                                   │  Server │
└────┬────┘                                   └────┬────┘
     │                                             │
     │ POST /api/v1/auth/login                    │
     │ {email, password}                          │
     ├────────────────────────────────────────────>│
     │                                             │
     │            200 OK                           │
     │ {access_token, refresh_token, user}        │
     │<────────────────────────────────────────────┤
     │                                             │
     │ GET /api/v1/app/projects                   │
     │ Authorization: Bearer {access_token}       │
     ├────────────────────────────────────────────>│
     │                                             │
     │         Validate JWT + Permissions          │
     │         Check tenant_id + RLS               │
     │                                             │
     │            200 OK                           │
     │ {projects: [...]}                          │
     │<────────────────────────────────────────────┤
```

**Token Structure**:
- **Access Token**: Short-lived (15 min), includes: `user_id`, `tenant_id`, `roles`, `permissions`
- **Refresh Token**: Long-lived (7 days), stored in DB, allows obtaining new access token

**MFA Flow**:
1. User enables MFA → Generate TOTP secret → Show QR code
2. User scans QR with authenticator app
3. User enters code to verify setup
4. Login: email/password → 200 + `mfa_required: true` → User enters TOTP code → 200 + tokens

---

### Data Encryption

| Layer | Encryption | Implementation |
|-------|-----------|----------------|
| **In Transit** | TLS 1.3 | Load balancer terminates SSL |
| **At Rest** | AES-256 | PostgreSQL encryption, S3 server-side encryption |
| **Passwords** | Argon2id | Django `make_password()` |
| **Sensitive Fields** | AES-256 | Encrypt before DB save (e.g., project item passwords) |
| **JWT Secret** | HS256 | Rotated every 90 days |

---

### RBAC Enforcement

**Backend Middleware**:

```python
@permission_required('projects.create')
def create_project(request):
    # User must have 'projects.create' permission
    # Middleware validates before function executes
    ...
```

**Feature Gates**:

```python
@require_feature('custom_roles')
def create_custom_role(request):
    # User's plan must include 'custom_roles' feature
    # Returns 402 Payment Required if not available
    ...
```

**Frontend Protected Routes**:

```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
```

---

## Scalability

### Horizontal Scaling

**Stateless API Servers**:
- No server-side sessions (JWT-based)
- Can scale to N instances behind load balancer
- Auto-scaling based on CPU/memory

**Database**:
- PostgreSQL with read replicas
- Write to primary, read from replicas
- Connection pooling (PgBouncer)

**Caching Strategy**:
- Redis for:
  - Session data (refresh tokens)
  - Feature flags cache (avoid DB queries)
  - Rate limiting counters
  - Temporary data (email verification tokens)

**File Storage**:
- S3-compatible object storage (AWS S3 / MinIO)
- CDN for static assets (CloudFront)

---

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **API Latency (p95)** | <200ms | Indexing, caching, query optimization |
| **API Latency (p99)** | <500ms | Auto-scaling, load balancing |
| **Uptime** | 99.9% | Multi-AZ deployment, health checks |
| **Concurrent Users** | 10,000+ | Horizontal scaling, Redis caching |
| **DB Queries** | <10 per request | Eager loading, select_related, prefetch_related |
| **File Upload** | 5GB (Enterprise) | Chunked upload, S3 multipart |

---

## Tech Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **API Framework** | Django REST Framework | 3.14+ | REST API endpoints |
| **Language** | Python | 3.11+ | Backend logic |
| **Database** | PostgreSQL | 15+ | Primary data store with RLS |
| **Cache** | Redis | 7+ | Sessions, cache, rate limiting |
| **Task Queue** | Celery + Redis | 5+ | Background jobs (email, billing) |
| **Authentication** | Django JWT | 2.x | JWT tokens |
| **Payment** | Stripe API | v2023+ | Billing, subscriptions |

### Frontend Admin

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React 18+ + Vite | 5+ | SPA framework + build tool |
| **UI Library** | shadcn/ui + Tailwind | Latest | Componentes + estilos |
| **State Management** | TanStack Query + Zustand | 5+ | Server state + Client state |
| **HTTP Client** | Axios / fetch + custom hooks | 1.6+ | API calls con interceptors |
| **Auth** | Custom AuthContext + JWT | - | Token handling |
| **Forms** | React Hook Form + Zod | 7.5+ | Form validation |
| **Routing** | React Router | 6.22+ | Client-side routing |
| **i18n** | react-i18next | 14+ | Internacionalización |
| **Date/Time** | date-fns + Intl API | 3.3+ | Formatting con locale |

### Frontend Cliente

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React 18+ + Vite | 5+ | SPA framework |
| **UI** | Tailwind CSS | 3.4+ | Styling |
| **State** | TanStack Query + Zustand | Latest | Reactive state |
| **HTTP** | Axios / fetch | 1.6+ | API calls |
| **Calendar UI** | FullCalendar React | 6.1+ | Calendario interactivo |
| **Drag & Drop** | dnd-kit | 6.1+ | Kanban boards |
| **Charts** | Recharts | 2.12+ | Data visualization |

---

### Internationalization (i18n)

**Backend (Django):**
- Django i18n framework con `django.utils.translation.gettext` / `gettext_lazy`
- Archivos de traducción: `locale/es/LC_MESSAGES/django.po`, `locale/en/LC_MESSAGES/django.po`
- Compilación con `django-admin compilemessages`
- Middleware: `django.middleware.locale.LocaleMiddleware`
- Detection order: 1) User preference (DB), 2) Session, 3) Accept-Language header, 4) Default (es)

**Frontend Admin/Cliente (React + Vite):**
- `react-i18next` para traducciones
- Archivos de traducción: `src/locales/{es,en}/translation.json`
- `useTranslation` hook para acceso a traducciones
- `date-fns` con locale awareness para fechas
- `Intl.NumberFormat` para monedas
- Lazy loading de namespaces por ruta

**Frontend SSR (Next.js):**
- `next-intl` para traducciones con SSR
- `app/[locale]/layout.tsx` para routing por idioma
- Server Components con traducciones pre-renderizadas
- Client Components con `useTranslations` hook

**Estrategia de Sincronización:**
1. Usuario cambia idioma en UI → Frontend actualiza localStorage
2. Frontend llama `PATCH /api/v1/users/me/preferences {"language": "en"}`
3. Backend actualiza `users.preferences.language`
4. Próximo login: Backend envía idioma en response → Frontend aplica

---

### Theming & Dark Mode

**Tailwind Dark Mode:**
- Strategy: `class` (manual toggle via clase `dark` en `<html>`)
- NO usar `media` strategy (no permite toggle manual)
- Variables CSS para colores customizables:
  ```css
  :root {
    --color-primary: 59 130 246; /* blue-500 */
    --color-bg: 255 255 255;
    --color-text: 0 0 0;
  }

  .dark {
    --color-bg: 17 24 39; /* gray-900 */
    --color-text: 255 255 255;
  }
  ```

**React + Vite Implementation:**
```typescript
// contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'auto';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Next.js Implementation:**
```typescript
// app/providers.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}

// Uso en componentes:
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // ...
}
```

---

## SSR Architecture for Digital Services

### Overview

Public profile pages (tarjeta digital, landing page, portafolio, CV digital) require Server-Side Rendering (SSR) for optimal SEO and search engine indexing. We use **Next.js App Router** to render pages on the server before sending HTML to the browser.

### Why Next.js App Router?

**Decision Rationale:**
- **Best-in-class SEO**: Next.js is industry standard for SEO-optimized React apps
- **Built-in SSR**: No additional setup required (vs Express + rendering engine)
- **React Server Components**: Stream HTML with progressive enhancement
- **Image Optimization**: Built-in next/image for Core Web Vitals
- **Metadata API**: Automatic meta tags, Open Graph, structured data
- **Developer Experience**: Fast Refresh, TypeScript, built-in routing
- **Deployment**: Vercel integration with edge functions and CDN
- **Component Reuse**: Can share UI components between Next.js and Vite apps

**Alternatives Considered:**
1. **Remix**: Great SSR framework, but smaller ecosystem than Next.js
2. **Astro**: Excellent for content sites, but limited interactivity
3. **Django Templates**: No SPA interactivity, poor DX for modern UI
4. **React + Vite SSR**: Requires manual setup (Express, routing, data fetching)

**Why NOT use the same stack for everything?**
- Next.js adds ~30% to bundle size vs Vite (not needed for internal admin panels)
- Admin and Cliente apps don't need SEO, so Vite is lighter and faster
- Next.js routing is opinionated (file-based), Vite is flexible (React Router)

### Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ GET /landing/jsmith
       ▼
┌──────────────────┐
│  Nginx (Reverse  │
│      Proxy)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      ┌─────────────┐
│  Next.js Server  │─────▶│    Redis    │
│  (App Router)    │◀─────│   (Cache)   │
└──────┬───────────┘      └─────────────┘
       │ API Call: GET /api/v1/app/public-profiles/jsmith
       ▼
┌──────────────────┐      ┌─────────────┐
│  Django Backend  │─────▶│ PostgreSQL  │
│   (REST API)     │      │             │
└──────────────────┘      └─────────────┘
```

### SSR Rendering Flow

1. **Request**: Browser requests `GET /landing/jsmith`
2. **Routing**: Nginx routes to Next.js server (SSR service on port 3000)
3. **Cache Check**: Next.js checks ISR cache for pre-rendered page
4. **Cache Hit**: If cached (revalidate: 60s), return HTML immediately
5. **Cache Miss or Stale**: If not cached or needs revalidation:
   - Next.js Server Component calls Django API: `GET /api/v1/app/public-profiles/jsmith`
   - React Server Components render on server
   - HTML generated with full content (no TransferState needed)
   - Page cached for ISR (revalidate every 60s)
   - HTML returned to browser
6. **Browser Receives**: Full HTML with content (indexable by search engines)
7. **Hydration**: React hydrates in client for interactivity

### Caching Strategy

**Cache Levels:**

1. **Redis (SSR Pages)**: TTL 5 minutes
   - Key format: `ssr:{service}:{username}:{lang}`
   - Invalidation: Django post-save hook deletes key on profile update
   - Fallback: Direct render if Redis is down (graceful degradation)

2. **CDN (Optional - Cloudflare/CloudFront)**: TTL 1 hour
   - Cache-Control header: `public, max-age=3600`
   - Purge via API when Redis cache invalidated

3. **Browser Cache**: TTL 5 minutes
   - Cache-Control: `public, max-age=300`

**Performance Targets:**
- Cache hit ratio: >80%
- TTFB (Time to First Byte): <200ms (cached), <1s (uncached)
- LCP (Largest Contentful Paint): <2.5s
- FCP (First Contentful Paint): <1.8s

### Next.js App Router Configuration

Next.js 14+ uses the App Router with built-in SSR, eliminating the need for custom Express setup.

**Project Structure**:
```
digital-services/              # Next.js app for public pages
├── app/
│   ├── [locale]/             # Internationalized routing
│   │   ├── layout.tsx        # Root layout (Server Component)
│   │   ├── page.tsx          # Landing page
│   │   ├── [username]/       # Dynamic user profiles
│   │   │   └── page.tsx      # Profile SSR page
│   ├── api/                  # API routes (if needed)
│   └── globals.css           # Tailwind imports
├── components/
│   ├── server/               # React Server Components
│   └── client/               # Client Components (with 'use client')
├── lib/
│   ├── api.ts                # API client for Django backend
│   └── metadata.ts           # SEO metadata helpers
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
└── package.json
```

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output mode
  output: 'standalone', // For Docker deployment

  // Images optimization
  images: {
    domains: ['api.example.com'], // Django media server
    formats: ['image/avif', 'image/webp'],
  },

  // i18n (next-intl)
  experimental: {
    serverActions: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Rewrites for API proxy (optional)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Django backend
      },
    ];
  },
};

module.exports = nextConfig;
```

**Server Component con SSR**:
```typescript
// app/[locale]/[username]/page.tsx (Server Component)
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/api';
import type { Metadata } from 'next';

interface Props {
  params: { username: string; locale: string };
}

// Generate metadata for SEO (runs on server)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile(params.username);

  if (!profile) return { title: 'Profile Not Found' };

  return {
    title: `${profile.display_name} | Digital Card`,
    description: profile.bio,
    openGraph: {
      title: profile.display_name,
      description: profile.bio,
      images: [profile.avatar_url],
    },
  };
}

// Server Component (SSR by default)
export default async function ProfilePage({ params }: Props) {
  const profile = await getPublicProfile(params.username);

  if (!profile) notFound();

  return (
    <div>
      <h1>{profile.display_name}</h1>
      <p>{profile.bio}</p>
      {/* Render sections from profile.config */}
    </div>
  );
}

// Static params for pre-rendering popular profiles
export async function generateStaticParams() {
  const topProfiles = await getTopProfiles(100);
  return topProfiles.map((profile) => ({
    username: profile.username,
  }));
}
```

**API Client**:
```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getPublicProfile(username: string) {
  const res = await fetch(`${API_URL}/api/digital-services/public/${username}/`, {
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  });

  if (!res.ok) return null;
  return res.json();
}
```

**Key Benefits of Next.js App Router**:
- ✅ No Express server configuration needed
- ✅ No TransferState (automatic data deduplication)
- ✅ Built-in metadata API for SEO
- ✅ Automatic code splitting
- ✅ Image optimization with next/image
- ✅ ISR (Incremental Static Regeneration) built-in
- ✅ Server Components stream HTML progressively

### Cache Invalidation (Django)

**signals.py** (Backend):
```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
import redis

redis_client = redis.Redis.from_url(settings.REDIS_URL)

@receiver(post_save, sender=PublicProfile)
def invalidate_profile_cache(sender, instance, **kwargs):
    """Invalidate SSR cache when profile is updated"""
    username = instance.username
    services = ['tarjeta', 'landing', 'portafolio', 'cv']

    for service in services:
        cache_key = f"ssr:{service}:{username}"
        redis_client.delete(cache_key)
        print(f"Invalidated cache: {cache_key}")

    # Purge CDN if configured
    if settings.CLOUDFLARE_ENABLED:
        purge_cloudflare_cache(username)

@receiver(post_save, sender=DigitalCard)
@receiver(post_save, sender=LandingTemplate)
@receiver(post_save, sender=PortfolioItem)
@receiver(post_save, sender=CVDocument)
def invalidate_service_cache(sender, instance, **kwargs):
    """Invalidate specific service cache on update"""
    profile = instance.profile if hasattr(instance, 'profile') else instance.digital_card.profile
    username = profile.username

    service_map = {
        'DigitalCard': 'tarjeta',
        'LandingTemplate': 'landing',
        'PortfolioItem': 'portafolio',
        'CVDocument': 'cv',
    }

    service = service_map.get(sender.__name__)
    if service:
        cache_key = f"ssr:{service}:{username}"
        redis_client.delete(cache_key)
```

### SEO Optimization

**Meta Tags (Server-Side):**
```typescript
// meta.service.ts
@Injectable()
export class SeoService {
  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  updateTags(data: {
    title: string;
    description: string;
    image?: string;
    url: string;
  }) {
    // Update title
    this.title.setTitle(data.title);

    // Update meta tags
    this.meta.updateTag({ name: 'description', content: data.description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:image', content: data.image || '/assets/default-og.jpg' });
    this.meta.updateTag({ property: 'og:url', content: data.url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.image || '/assets/default-og.jpg' });
  }

  addStructuredData(data: any) {
    if (isPlatformBrowser(this.platformId)) return; // Only server-side

    const script = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      ...data
    };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.text = JSON.stringify(script);
    document.head.appendChild(scriptTag);
  }
}
```

### Performance Monitoring

**Metrics to Track:**
- SSR Render Time (server-side)
- Cache Hit/Miss Ratio
- TTFB (Time to First Byte)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- Redis latency

**Monitoring Setup:**
```typescript
// monitoring.service.ts
export class MonitoringService {
  trackSSRMetrics(service: string, username: string, renderTime: number, cacheHit: boolean) {
    // Send to analytics
    analytics.track('ssr_render', {
      service,
      username,
      render_time_ms: renderTime,
      cache_hit: cacheHit,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Hosting** | AWS / DigitalOcean | Cloud infrastructure |
| **Load Balancer** | AWS ALB / Nginx | Traffic distribution |
| **Monitoring** | Sentry + CloudWatch | Error tracking, logs |
| **Logging** | ELK Stack | Centralized logs |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver API Endpoints](api-endpoints.md)
- [Ver Data Models](data-models.md)
- [Ver Implementation Timeline](implementation-timeline.md)

---

**Última actualización**: 2026-02-12
