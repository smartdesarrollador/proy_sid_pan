# Vista (Digital Services) Frontend — Roadmap de Implementación

**Stack**: Next.js 15 · TypeScript · Tailwind CSS · TanStack Query v5 · Zustand · next-i18next · @dnd-kit
**Directorio base**: `apps/frontend_next_vista/`
**Prototipo de referencia**: `docs/ui-ux/prototype-vista/` (puerto 5174, 4 servicios, datos mock)
**PRD**: `prd/features/digital-services.md` (v1.0.0)
**API backend**: `apps/backend_django/apps/digital_services/` (modelos + endpoints disponibles)
**Referencia de arquitectura**: `docs/architecture/system-overview.md` · `docs/architecture/sso-architecture.md` · `docs/architecture/frontend-architecture.md`

---

## Progreso General

| Estado | Significado |
|--------|-------------|
| ✅ Completado | Implementado y funcional |
| 🔄 En progreso | Trabajo activo |
| ⬜ Pendiente | No iniciado |

---

## Integración API

> Los endpoints públicos son renderizados **server-side** en Next.js (RSC + `fetch` nativo con ISR).
> Los endpoints autenticados son consumidos desde **Client Components** con TanStack Query.
> El backend está en **`apps/backend_django/`** (Django REST Framework).
>
> - **Base URL local**: `http://localhost:8000/api/v1/` (variable `NEXT_PUBLIC_API_URL`)
> - **Documentación de la API**: `http://localhost:8000/api/docs/` (Swagger UI)
> - **Auth**: JWT Bearer (`Authorization: Bearer <accessToken>`)
> - **SSO Entrada**: `POST /api/v1/auth/sso/validate/ { sso_token }` → `{ access_token, refresh_token, user }`
> - **Refresh automático**: interceptor Axios → `POST /api/v1/auth/token/refresh/`
> - **Páginas públicas**: `AllowAny` · verifican `is_public=True` en el backend

### Endpoints por Feature

| Feature | Método | Endpoint |
|---------|--------|----------|
| SSO Validación | POST | `/auth/sso/validate/` |
| Token Refresh | POST | `/auth/token/refresh/` |
| Perfil (CRUD) | GET / POST | `/app/digital/profile/` |
| Tarjeta Digital | GET / POST | `/app/digital/tarjeta/` |
| Tarjeta QR | POST | `/app/digital/tarjeta/qr/` |
| Landing Page | GET / POST | `/app/digital/landing/` |
| Portfolio (lista) | GET / POST | `/app/digital/portafolio/` |
| Portfolio (detalle) | PATCH / DELETE | `/app/digital/portafolio/{uuid}/` |
| CV Digital | GET / POST | `/app/digital/cv/` |
| CV Export PDF | GET | `/app/digital/cv/export/` |
| Analytics | GET | `/app/digital/analytics/{service}/` |
| Dominio Custom | GET / POST | `/app/digital/custom-domain/` |
| Verificar Dominio | POST | `/app/digital/custom-domain/verify/` |
| **Público** — Perfil + Tarjeta | GET | `/public/profiles/{username}/` |
| **Público** — Landing | GET | `/public/landing/{username}/` |
| **Público** — Portfolio | GET | `/public/portafolio/{username}/` |
| **Público** — Portfolio ítem | GET | `/public/portafolio/{username}/{slug}/` |
| **Público** — CV | GET | `/public/cv/{username}/` |

### Feature Gates por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Tarjeta Digital | ✅ | ✅ | ✅ | ✅ |
| Tarjeta QR Code | ✅ | ✅ | ✅ | ✅ |
| Tarjeta colores custom | ✅ | ✅ | ✅ | ✅ |
| vCard Export | ❌ | ✅ | ✅ | ✅ |
| Analytics Tarjeta | ❌ | ✅ 7d | ✅ 30d | ✅ 365d |
| Landing Page | ❌ | ✅ 3 tpls | ✅ ∞ | ✅ ∞ |
| Landing CSS Custom | ❌ | ❌ | ✅ | ✅ |
| Landing SEO | ❌ | ❌ | ✅ | ✅ |
| Portfolio | ❌ | ❌ | ✅ | ✅ |
| Portfolio imágenes | ❌ | ❌ | 10 | ∞ |
| CV (templates) | ✅ Classic | ✅ 2 tpls | ✅ 3 tpls | ✅ 3 tpls |
| CV PDF Export | ❌ | ✅ | ✅ | ✅ |
| CV múltiples versiones | ❌ | ❌ | ✅ 5 | ✅ ∞ |
| Dominio Personalizado | ❌ | ❌ | ✅ | ✅ |
| White Label | ❌ | ❌ | ❌ | ✅ |

---

## FASE 1 — Infraestructura Base

---

## PASO 1 — Scaffold Next.js 14 + Estructura Base ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/package.json` · `docs/ui-ux/prototype-vista/src/App.jsx`
**Dependencias**: ninguna
**Skills**: `nextjs-routing-data` · `vite-react-configuration`
**Agente**: `nextjs-builder`

### Qué implementar

```
apps/frontend_next_vista/
├── app/
│   ├── layout.tsx                  # Root layout (ThemeProvider, i18n, QueryClientProvider)
│   ├── page.tsx                    # Landing pública marketing (/)
│   ├── globals.css                 # Tailwind base + tokens CSS
│   ├── not-found.tsx               # Página 404 global
│   └── error.tsx                   # Error boundary global
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── shared/                 # Componentes reutilizables (Badge, Button, Card...)
│   ├── lib/
│   │   └── api.ts                  # Instancia axios + interceptores base
│   ├── types/
│   │   └── index.ts                # Tipos globales TypeScript
│   └── utils/
│       └── cn.ts                   # clsx + tailwind-merge helper
├── .env.local.example              # Variables de entorno de ejemplo
├── .env.local                      # Variables de entorno locales (gitignored)
├── next.config.ts                  # Configuración Next.js (images, env, rewrites)
├── tailwind.config.ts              # Config Tailwind con tokens del proyecto
├── tsconfig.json                   # TypeScript strict mode
├── eslint.config.mjs               # ESLint con next/core-web-vitals
└── package.json
```

### Dependencias a instalar

```bash
npx create-next-app@latest frontend_next_vista \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack

cd apps/frontend_next_vista
npm install axios @tanstack/react-query zustand next-i18next \
  lucide-react clsx tailwind-merge
npm install -D @types/node prettier
```

### Variables de entorno (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3004
NEXT_PUBLIC_HUB_URL=http://localhost:3003
```

### Configuración next.config.ts

```typescript
const config: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'localhost' }, { hostname: '*.s3.amazonaws.com' }],
  },
  experimental: { typedRoutes: true },
};
```

### Script de desarrollo

```bash
npm run dev   # puerto 3004 (para no colisionar con otros frontends)
```

### Verificación

- [ ] `npm run dev` levanta en `http://localhost:3004` sin errores
- [ ] `npm run build` compila sin errores TypeScript
- [ ] `npm run lint` pasa sin errores
- [ ] Tailwind aplica estilos correctamente
- [ ] Path alias `@/` funciona en imports

---

## PASO 2 — API Client + Auth Store + Middleware ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/contexts/AuthContext.jsx` · `docs/architecture/sso-architecture.md`
**Dependencias**: PASO 1
**Skills**: `react-api-fetch-patterns` · `react-context-state` · `drf-auth`
**Agente**: `nextjs-builder`

### Qué implementar

```
src/
├── lib/
│   ├── api.ts                      # Instancia axios + interceptores JWT + refresh
│   └── queryClient.ts              # Configuración TanStack Query global
├── store/
│   └── authStore.ts                # Zustand: user, tokens, plan, isAuthenticated
├── types/
│   └── auth.ts                     # User, TokenResponse, SSOValidateResponse, Plan
├── hooks/
│   └── useAuth.ts                  # Hook que expone el authStore
app/
├── (auth)/
│   └── sso/
│       └── page.tsx                # Página SSO: ?sso_token= → valida → redirige
middleware.ts                       # Protege rutas /dashboard/** sin token JWT
```

### Flujo SSO (Hub → Vista)

```
1. Hub: POST /api/v1/auth/sso/token/ { service: "vista" }
   → { sso_token, expires_in: 60, redirect_url }
2. Hub redirige: http://localhost:3004/sso?sso_token=abc123
3. Vista /sso page: POST /api/v1/auth/sso/validate/ { sso_token }
   → { access_token, refresh_token, user }
4. authStore.setAuth(tokens, user)
5. redirect → /dashboard
6. sso_token invalidado (single-use, TTL 60s)
```

### authStore (Zustand)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  currentPlan: Plan;        // 'free' | 'starter' | 'professional' | 'enterprise'
  setAuth(tokens: TokenResponse, user: User): void;
  clearAuth(): void;
  setUser(user: User): void;
}
```

### Interceptores Axios

- Request: añade `Authorization: Bearer {accessToken}` si hay token
- Response 401: intenta `POST /auth/token/refresh/` con `refresh_token`
  - Si ok → actualiza tokens en store + reintentar request original
  - Si falla → `clearAuth()` + redirect a Hub URL (`NEXT_PUBLIC_HUB_URL`)

### middleware.ts

```typescript
// Protege /dashboard y todas sus subrutas
// Si no hay cookie `accessToken` → redirect a NEXT_PUBLIC_HUB_URL
export const config = { matcher: ['/dashboard/:path*'] };
```

### Verificación

- [ ] Acceder a `/sso?sso_token=test` muestra loading spinner → redirige
- [ ] Sin token, `/dashboard` redirige al Hub URL
- [ ] Refresh automático funciona (simular 401 en dev)
- [ ] `clearAuth()` borra tokens y redirige

---

## PASO 3 — Shell: Layout, Navbar, Sidebar, ThemeProvider, i18n ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/shared/` · `docs/ui-ux/prototype-vista/src/contexts/ThemeContext.jsx`
**Dependencias**: PASO 2
**Skills**: `ui-layout-system` · `ui-design-tokens` · `react-internationalization`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── (authenticated)/
│   ├── layout.tsx                  # Layout autenticado: Navbar + Sidebar + main
│   └── dashboard/
│       └── page.tsx                # Dashboard stub (se completa en PASO 9)
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # Fixed top h-16: logo, user avatar, plan badge, dark mode, logout
│   │   ├── Sidebar.tsx             # Fixed left w-64: nav links por servicio + upgrade CTA
│   │   └── MobileOverlay.tsx       # Overlay para sidebar en mobile
│   └── shared/
│       ├── FeatureGate.tsx         # Wrapper que muestra UpgradePrompt si plan insuficiente
│       ├── UpgradePrompt.tsx       # Card "Requiere plan X" con CTA al Hub
│       ├── PlanBadge.tsx           # Badge free/starter/professional/enterprise
│       └── LoadingSpinner.tsx      # Spinner reutilizable
├── hooks/
│   ├── useFeatureGate.ts           # Evalúa si el plan actual incluye un feature
│   └── useTheme.ts                 # dark/light mode con localStorage
├── providers/
│   ├── QueryProvider.tsx           # TanStack Query + ReactQueryDevtools
│   └── ThemeProvider.tsx           # Clase `dark` en <html>, persiste en localStorage
├── i18n/
│   ├── es.json                     # Traducciones español (idioma principal)
│   └── en.json                     # Traducciones inglés
```

### Sidebar — Navegación

```
Dashboard          → /dashboard
─────────────────
Tarjeta Digital    → /dashboard/tarjeta       [todos los planes]
Landing Page       → /dashboard/landing       [starter+ | lock icon si free]
Portfolio          → /dashboard/portfolio     [professional+ | lock icon]
CV Digital         → /dashboard/cv           [todos los planes]
─────────────────
Analytics          → /dashboard/analytics     [starter+ | lock icon si free]
─────────────────
Dominio Custom     → /dashboard/dominio       [professional+ | lock icon]
─────────────────
[Upgrade CTA]      → NEXT_PUBLIC_HUB_URL/subscription   [si no es enterprise]
```

### useFeatureGate

```typescript
// Usa el plan del authStore para evaluar sin llamada API
// (el plan viene en el token JWT o en el usuario del SSO)
const { canAccess, requiredPlan } = useFeatureGate('landing_page');
```

### Tokens de diseño (tailwind.config.ts)

```typescript
// Replicar paleta del prototipo-vista:
// primary-600: #2563eb, grays idénticos al admin panel
// Compatibilidad con dark mode: class strategy
```

### Verificación

- [ ] Navbar muestra nombre, email y plan badge del usuario
- [ ] Sidebar filtra items según plan (lock icon en features bloqueadas)
- [ ] Dark mode toggle persiste en localStorage
- [ ] i18n cambia textos ES ↔ EN
- [ ] Layout responsive: sidebar colapsable en mobile
- [ ] `npm run typecheck` sin errores

---

## FASE 2 — Páginas Públicas SSR / ISR

> Todas las rutas públicas son **React Server Components** (RSC).
> Usan `fetch` nativo con `{ next: { revalidate: 60 } }` para ISR.
> El backend debe devolver 404 si `is_public=False` → Next.js muestra `not-found.tsx`.

---

## PASO 4 — Tarjeta Digital Pública `/tarjeta/[username]` ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/public/PublicCardViewer.jsx` · `apps/backend_django/apps/digital_services/public_views.py`
**Dependencias**: PASO 1
**Skills**: `nextjs-server-components` · `nextjs-seo-optimization`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── tarjeta/
│   └── [username]/
│       ├── page.tsx                # RSC: fetch /public/profiles/{username}/ + render
│       ├── not-found.tsx           # 404 personalizada con CTA al Hub
│       └── loading.tsx             # Skeleton de la tarjeta
src/
├── components/
│   └── tarjeta/
│       ├── PublicCardView.tsx      # Tarjeta pública: avatar, nombre, redes, contacto, QR
│       ├── CardContactButton.tsx   # Botones de contacto (email, tel, whatsapp)
│       ├── SocialLinksGrid.tsx     # Grid de enlaces sociales con iconos lucide
│       └── VCardDownload.tsx       # Botón descarga .vcf (plan-gated: starter+)
```

### generateMetadata (SEO)

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const profile = await getPublicProfile(params.username);
  return {
    title: `${profile.display_name} — Tarjeta Digital`,
    description: profile.bio,
    openGraph: {
      title: profile.display_name,
      description: profile.bio,
      images: [{ url: profile.avatar_url ?? '/og-default.png' }],
      type: 'profile',
    },
    twitter: { card: 'summary', title: profile.display_name },
    alternates: { canonical: `/tarjeta/${params.username}` },
  };
}
```

### ISR + Data Fetching

```typescript
// ISR: revalida cada 60 segundos
const data = await fetch(
  `${process.env.API_URL}/public/profiles/${username}/`,
  { next: { revalidate: 60 } }
);
if (!data.ok) notFound();
```

### Diseño del componente (referencia prototipo)

- Avatar circular (120px), nombre y título
- Bio o descripción breve
- Grid 2×3 de enlaces sociales (linkedin, twitter, github, instagram, facebook, website)
- Botones de contacto: email, teléfono, WhatsApp
- Código QR (imagen desde `qr_code_url` del backend)
- Colores de fondo y primario según `primary_color` y `background_color` del perfil
- Botón "Guardar contacto" descarga `.vcf` (client component, solo starter+)

### Verificación

- [ ] `/tarjeta/johnsmith` renderiza la tarjeta correctamente (SSR)
- [ ] `curl http://localhost:3004/tarjeta/johnsmith` devuelve HTML completo con `<meta og:title>`
- [ ] Perfil inexistente → 404 personalizada
- [ ] Perfil con `is_public=False` → 404
- [ ] ISR: segunda petición usa caché, revalida a los 60s
- [ ] QR code se muestra correctamente
- [ ] `npm run build && npm run start` funciona correctamente

---

## PASO 5 — Landing Page Pública `/landing/[username]` ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/public/PublicLandingViewer.jsx`
**Dependencias**: PASO 1
**Skills**: `nextjs-server-components` · `nextjs-seo-optimization`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── landing/
│   └── [username]/
│       ├── page.tsx                # RSC: fetch /public/landing/{username}/ + render
│       ├── not-found.tsx
│       └── loading.tsx
src/
├── components/
│   └── landing/
│       ├── PublicLandingView.tsx   # Orquestador: itera sections[] y renderiza bloques
│       ├── sections/
│       │   ├── HeroSection.tsx     # Hero con foto, título, subtítulo, CTA
│       │   ├── AboutSection.tsx    # Texto de descripción + imagen lateral
│       │   ├── ServicesSection.tsx # Grid de cards de servicios/habilidades
│       │   ├── ContactSection.tsx  # Formulario de contacto o email visible
│       │   ├── TestimonialsSection.tsx # Cards de testimonios
│       │   └── StatsSection.tsx    # Contador de métricas (años exp, proyectos, etc.)
│       └── ContactFormClient.tsx   # Client component: form de contacto (plan: starter+)
```

### Render de secciones dinámico

```typescript
// sections es JSON array del backend: [{type: 'hero', props: {...}}, ...]
const SECTION_MAP: Record<string, ComponentType> = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  contact: ContactSection,
  testimonials: TestimonialsSection,
  stats: StatsSection,
};

// En page.tsx (RSC):
{landing.sections.map((section, i) => {
  const Section = SECTION_MAP[section.type];
  return Section ? <Section key={i} {...section.props} /> : null;
})}
```

### generateMetadata

```typescript
// Usa meta_title, meta_description, og_image_url del LandingTemplate
// + fallback a display_name del PublicProfile
```

### Verificación

- [ ] `/landing/johnsmith` renderiza todas las secciones del JSON
- [ ] Sección desconocida se ignora silenciosamente (sin crash)
- [ ] Formulario de contacto requiere plan starter+
- [ ] `<meta og:image>` se incluye correctamente en SSR
- [ ] ISR 60s funciona (verificar con `Cache-Control` header)

---

## PASO 6 — Portfolio Público `/portafolio/[username]` ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/public/PublicPortfolioViewer.jsx`
**Dependencias**: PASO 1
**Skills**: `nextjs-server-components` · `nextjs-static-generation`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── portafolio/
│   └── [username]/
│       ├── page.tsx                # RSC: lista de proyectos con filtro por tags
│       ├── [slug]/
│       │   ├── page.tsx            # RSC: detalle del proyecto
│       │   └── not-found.tsx
│       ├── not-found.tsx
│       └── loading.tsx
src/
├── components/
│   └── portfolio/
│       ├── PublicPortfolioGrid.tsx  # Grid masonry de proyectos (Client Component para filtros)
│       ├── PortfolioCard.tsx        # Card: cover image, título, tags, links
│       ├── PortfolioDetail.tsx      # Detalle: galería imágenes, descripción completa, links
│       ├── TagFilter.tsx            # Filtro por tags (client component, estado local)
│       └── ImageGallery.tsx         # Galería lightbox de imágenes del proyecto
```

### generateStaticParams (opcional)

```typescript
// Para ISR en build: pre-render los portfolios más visitados
// En producción se puede configurar con revalidate: 60
```

### generateMetadata por proyecto

```typescript
// /portafolio/johnsmith → "Portfolio de John Smith"
// /portafolio/johnsmith/proyecto-web → "Proyecto Web — Portfolio de John Smith"
```

### Verificación

- [ ] `/portafolio/johnsmith` muestra la galería de proyectos
- [ ] Filtro por tags funciona sin navegación (estado client-side)
- [ ] `/portafolio/johnsmith/proyecto-web` muestra el detalle completo
- [ ] Imágenes optimizadas con `next/image` (lazy load, blur placeholder)
- [ ] `is_featured=true` destaca la card visualmente
- [ ] Proyecto inexistente → 404 personalizada

---

## PASO 7 — CV Digital Público `/cv/[username]` ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/public/PublicCVViewer.jsx`
**Dependencias**: PASO 1
**Skills**: `nextjs-server-components` · `nextjs-seo-optimization`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── cv/
│   └── [username]/
│       ├── page.tsx                # RSC: fetch /public/cv/{username}/ + render template
│       ├── not-found.tsx
│       └── loading.tsx
src/
├── components/
│   └── cv/
│       ├── templates/
│       │   ├── ClassicTemplate.tsx  # Layout clásico: sidebar izq + contenido der
│       │   ├── ModernTemplate.tsx   # Layout moderno: header grande + secciones fluidas
│       │   └── MinimalTemplate.tsx  # Layout minimalista: tipografía limpia, sin colores
│       ├── sections/
│       │   ├── CVExperienceSection.tsx   # Timeline de experiencia laboral
│       │   ├── CVEducationSection.tsx    # Lista de educación/certificaciones
│       │   ├── CVSkillsSection.tsx       # Barras o badges de habilidades
│       │   ├── CVLanguagesSection.tsx    # Idiomas con nivel
│       │   └── CVContactSection.tsx      # Email, teléfono, LinkedIn
│       └── PrintButton.tsx         # Botón "Descargar PDF" (Client Component)
```

### Selección de template

```typescript
const TEMPLATE_MAP = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
};
const Template = TEMPLATE_MAP[cv.template_type] ?? ClassicTemplate;
```

### PDF Export (client-side)

```typescript
// PrintButton.tsx (Client Component)
// Usa window.print() con @media print CSS para generar PDF limpio
// Alternativa: llamar GET /app/digital/cv/export/ (server-side weasyprint)
// → requiere autenticación → solo desde panel autenticado
```

### generateMetadata

```typescript
// title: `CV de {display_name}`
// description: professional_summary (150 chars max)
// robots: { index: true, follow: true }  // CVs públicos indexables
```

### Verificación

- [ ] `/cv/johnsmith` renderiza el template `classic` correctamente
- [ ] Cambio a template `modern` se refleja con otro diseño visual
- [ ] PDF via `window.print()` genera un documento limpio (testear en Chrome)
- [ ] `show_photo=false` oculta la foto del CV
- [ ] `show_contact=false` oculta los datos de contacto
- [ ] SSR funciona: `curl` devuelve HTML completo con contenido del CV

---

## FASE 3 — Autenticación SSO

---

## PASO 8 — SSO: Validación Token + Sesión JWT + Rutas Protegidas ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/architecture/sso-architecture.md` · `docs/ui-ux/prototype-vista/src/contexts/AuthContext.jsx`
**Dependencias**: PASO 2, PASO 3
**Skills**: `react-api-authentication` · `drf-auth`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── (auth)/
│   └── sso/
│       └── page.tsx                # Client Component: valida sso_token → redirige
src/
├── components/
│   └── auth/
│       ├── SSOCallbackPage.tsx     # UI: spinner + mensaje durante validación
│       └── AuthError.tsx           # Mensaje de error con CTA volver al Hub
├── hooks/
│   └── useSSO.ts                   # Hook: extrae sso_token, llama API, guarda en store
```

### Flujo completo PASO 8

```
GET /sso?sso_token=abc123
  ↓ SSOCallbackPage monta
  ↓ useSSO extrae token de searchParams
  ↓ POST /auth/sso/validate/ { sso_token: "abc123" }
  ↓ OK → authStore.setAuth(access_token, refresh_token, user)
  ↓ middleware.ts lee cookie → ✅ acceso permitido
  ↓ router.push('/dashboard')

  ERROR 401/422 →
  ↓ clearAuth()
  ↓ mostrar AuthError con link al Hub
```

### Persistencia de sesión (cookies httpOnly alternativo)

```typescript
// Opción A: localStorage + Zustand persist (más simple, usado en prototipo)
// Opción B: cookies httpOnly via route handler (más seguro)
// → Implementar Opción A para MVP, documentar migración a B
```

### middleware.ts (protección de rutas)

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
    ?? request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    const hubUrl = process.env.NEXT_PUBLIC_HUB_URL ?? 'http://localhost:3003';
    return NextResponse.redirect(new URL(hubUrl));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };
```

### Verificación

- [ ] Acceder a `/sso?sso_token=valid_token` → redirige a `/dashboard`
- [ ] Token inválido → muestra error + link al Hub
- [ ] Token expirado (>60s) → mismo error
- [ ] `/dashboard` sin sesión → redirige al Hub
- [ ] Refresh token funciona automáticamente (interceptor Axios)
- [ ] Logout: `authStore.clearAuth()` → redirige al Hub

---

## FASE 4 — Panel Autenticado

---

## PASO 9 — Dashboard de Servicios ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/dashboard/ServiceDashboard.jsx`
**Dependencias**: PASO 3, PASO 8
**Skills**: `react-hooks-patterns` · `ui-base-components`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── page.tsx                # Client Component: grid de 4 servicios
src/
├── components/
│   └── dashboard/
│       ├── ServiceGrid.tsx         # Grid 2×2 de ServiceCard
│       ├── ServiceCard.tsx         # Card: icon, nombre, descripción, plan badge, CTA
│       ├── WelcomeBanner.tsx       # Banner de bienvenida con nombre de usuario y plan
│       └── QuickStats.tsx          # Resumen rápido: servicios activos, vistas totales
├── hooks/
│   └── useServiceStatus.ts         # Query: GET /app/digital/profile/ (saber si está configurado)
```

### Lógica de ServiceCard

```typescript
// Si el plan no incluye el servicio → overlay con UpgradePrompt
// Si el plan incluye el servicio pero no está configurado → CTA "Configurar"
// Si está configurado → CTA "Editar" + badge "Publicado" / "Borrador"
// Servicios: tarjeta, landing, portafolio, cv
```

### Verificación

- [ ] Dashboard muestra 4 cards de servicios
- [ ] Plan Free: Landing y Portfolio muestran lock + UpgradePrompt
- [ ] Plan Starter: Landing disponible, Portfolio bloqueado
- [ ] Plan Professional: todos disponibles
- [ ] WelcomeBanner muestra nombre y plan del usuario autenticado
- [ ] Cada CTA navega a la ruta correcta del dashboard

---

## PASO 10 — Editor Tarjeta Digital (Autenticado) ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/tarjeta/TarjetaDigital.jsx` · `docs/ui-ux/prototype-vista/src/components/tarjeta/CardEditor.jsx` · `docs/ui-ux/prototype-vista/src/components/tarjeta/CardPreview.jsx`
**Dependencias**: PASO 9
**Skills**: `react-forms-validation` · `react-tanstack-query`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── tarjeta/
            └── page.tsx            # Layout de 3 tabs: Preview / Editor / Analytics
src/
├── features/
│   └── tarjeta/
│       ├── types.ts                # DigitalCard, CardForm, QRResponse
│       ├── hooks/
│       │   ├── useDigitalCard.ts   # GET /app/digital/tarjeta/
│       │   ├── useSaveCard.ts      # POST /app/digital/tarjeta/ (upsert)
│       │   └── useGenerateQR.ts    # POST /app/digital/tarjeta/qr/
│       └── components/
│           ├── TarjetaPage.tsx     # Tab controller: preview | editor | analytics
│           ├── CardPreview.tsx     # Vista previa idéntica a la pública
│           ├── CardEditor.tsx      # Formulario RHF+zod: profile + social links + colors
│           └── QRDisplay.tsx       # Muestra QR + botón copiar URL pública
```

### Formulario (react-hook-form + zod)

```typescript
// Campos: display_name, title, bio, avatar_url
// Contacto: email, phone, location
// Redes: linkedin, twitter, github, instagram, facebook, website
// Tema: primary_color (color picker), background_color
// Visibilidad: is_public (toggle)
```

### Verificación

- [ ] Tab Preview muestra la tarjeta con datos reales del backend
- [ ] Tab Editor: guardar cambios llama POST y actualiza la preview
- [ ] QR se genera y muestra correctamente al guardar
- [ ] URL pública copiable al clipboard
- [ ] `is_public=false` muestra badge "Borrador" en la preview
- [ ] Formulario valida con zod antes de enviar

---

## PASO 11 — Constructor Landing Page (Autenticado) ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/landing/LandingPage.jsx` · `docs/ui-ux/prototype-vista/src/components/landing/SectionBuilder.jsx`
**Dependencias**: PASO 9
**Skills**: `react-forms-validation` · `react-tanstack-query`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── landing/
            └── page.tsx
src/
├── features/
│   └── landing/
│       ├── types.ts                # LandingTemplate, Section, SectionType
│       ├── hooks/
│       │   ├── useLandingTemplate.ts   # GET /app/digital/landing/
│       │   └── useSaveLanding.ts       # POST /app/digital/landing/
│       └── components/
│           ├── LandingEditorPage.tsx   # 3 tabs: Templates | Constructor | Preview
│           ├── TemplateSelector.tsx    # Grid de plantillas (basic, minimal, corporate, creative)
│           ├── SectionBuilder.tsx      # Lista de secciones activas + DnD para reordenar
│           ├── SectionEditor.tsx       # Formulario de edición de sección seleccionada
│           ├── SectionPicker.tsx       # Modal para añadir nueva sección al builder
│           └── LandingPreview.tsx      # Preview en iframe o componentes inline
```

### Lógica de secciones (DnD con @dnd-kit)

```typescript
// sections: Array<{ type: SectionType, props: Record<string, unknown> }>
// Drag & drop para reordenar → actualiza el JSON → POST al guardar
// Sección activa se resalta → SectionEditor muestra sus campos
// Plan free: solo plantilla basic disponible (resto con lock)
```

### Plan gates

```typescript
// template_type: solo 3 plantillas en starter, todas en professional+
// custom_css: solo professional+ (textarea oculta en otros planes)
// ga_tracking_id: solo professional+
```

### Verificación

- [ ] Selector de plantillas muestra lock en las no disponibles para el plan
- [ ] DnD reordena secciones correctamente
- [ ] Añadir nueva sección desde SectionPicker funciona
- [ ] Editar props de una sección actualiza la preview en tiempo real
- [ ] Guardar llama POST con el JSON correcto
- [ ] Plan free solo puede usar plantilla "basic"

---

## PASO 12 — Gestión Portfolio (Autenticado) ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/portafolio/Portafolio.jsx`
**Dependencias**: PASO 9
**Skills**: `react-forms-validation` · `react-tanstack-query`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── portfolio/
            └── page.tsx
src/
├── features/
│   └── portfolio/
│       ├── types.ts                # PortfolioItem, PortfolioForm
│       ├── hooks/
│       │   ├── usePortfolioItems.ts    # GET /app/digital/portafolio/
│       │   ├── useCreateItem.ts        # POST /app/digital/portafolio/
│       │   ├── useUpdateItem.ts        # PATCH /app/digital/portafolio/{uuid}/
│       │   └── useDeleteItem.ts        # DELETE /app/digital/portafolio/{uuid}/
│       └── components/
│           ├── PortfolioPage.tsx        # Grid de proyectos + botón "Añadir"
│           ├── ProjectCard.tsx          # Card: cover, título, tags, featured, acciones
│           ├── ProjectModal.tsx         # Modal CRUD: RHF+zod (create + edit)
│           ├── ImageUploadField.tsx     # Campo de imagen con preview (URL por ahora)
│           └── TagInput.tsx             # Input de tags con chips
```

### Plan gates

```typescript
// Plan professional: ∞ proyectos, hasta 10 imágenes por proyecto
// Plan enterprise: ∞ proyectos, ∞ imágenes
// Plan free/starter: feature bloqueada → UpgradePrompt
```

### Verificación

- [ ] Crear proyecto → aparece en el grid
- [ ] Editar proyecto → modal pre-relleno con datos actuales
- [ ] Eliminar proyecto → confirmación inline → DELETE API
- [ ] `is_featured=true` mueve el proyecto al inicio del grid
- [ ] Plan free/starter: toda la página muestra UpgradePrompt
- [ ] Plan professional: límite de 10 imágenes por galería

---

## PASO 13 — Editor CV Digital (Autenticado) ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/cv/CVDigital.jsx`
**Dependencias**: PASO 9
**Skills**: `react-forms-validation` · `react-tanstack-query`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── cv/
            └── page.tsx
src/
├── features/
│   └── cv/
│       ├── types.ts                # CVDocument, CVForm, WorkExperience, Education, Skill
│       ├── hooks/
│       │   ├── useCVDocument.ts    # GET /app/digital/cv/
│       │   ├── useSaveCV.ts        # POST /app/digital/cv/
│       │   └── useExportCV.ts      # GET /app/digital/cv/export/ → descarga PDF
│       └── components/
│           ├── CVEditorPage.tsx    # 2 tabs: Editor | Preview
│           ├── CVEditor.tsx        # Formulario secciones: summary, exp, edu, skills, langs
│           ├── ExperienceList.tsx  # Lista editable de experiencias (add/edit/delete inline)
│           ├── EducationList.tsx   # Lista editable de educación
│           ├── SkillsEditor.tsx    # Tags de habilidades con nivel
│           ├── TemplateSelector.tsx # Selector de plantilla (classic/modern/minimal)
│           └── ExportPDFButton.tsx # Botón descarga PDF (requiere starter+)
```

### Estructura de datos JSON (secciones)

```typescript
// experience: [{company, role, start_date, end_date, description, is_current}]
// education: [{institution, degree, field, start_date, end_date}]
// skills: [{name, level: 'basic'|'intermediate'|'advanced'|'expert'}]
// languages: [{language, level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'|'native'}]
// certifications: [{name, issuer, date, url}]
```

### Plan gates

```typescript
// classic template: todos los planes (free+)
// modern template: starter+
// minimal template: professional+
// PDF export: starter+ (llama GET /app/digital/cv/export/)
// Múltiples versiones de CV: professional+ (hasta 5), enterprise (∞)
```

### Verificación

- [ ] Editor guarda cada sección correctamente al hacer POST
- [ ] Preview cambia al seleccionar diferente template
- [ ] Plan free: solo template `classic`, sin botón PDF
- [ ] Plan starter: 2 templates, botón PDF funcional
- [ ] PDF export descarga el archivo correctamente
- [ ] Añadir/editar/eliminar experiencias funciona inline

---

## FASE 5 — Funcionalidades Avanzadas

---

## PASO 14 — Analytics de Servicios (Plan-Gated) ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `docs/ui-ux/prototype-vista/src/components/tarjeta/CardAnalytics.jsx`
**Dependencias**: PASO 10, PASO 11, PASO 12, PASO 13
**Skills**: `react-data-visualization` · `react-tanstack-query`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── analytics/
            └── page.tsx
src/
├── features/
│   └── analytics/
│       ├── types.ts                # ServiceAnalytics, AnalyticsData, TimeRange
│       ├── hooks/
│       │   └── useServiceAnalytics.ts  # GET /app/digital/analytics/{service}/
│       └── components/
│           ├── AnalyticsPage.tsx    # Tabs por servicio (tarjeta, landing, portafolio, cv)
│           ├── AnalyticsOverview.tsx # KPIs: total vistas, vistas únicas, compartidos
│           ├── ViewsChart.tsx       # Recharts: LineChart de vistas por día
│           └── TopReferrers.tsx     # Lista de referrers principales
```

### Plan gates y ventana de tiempo

```typescript
// Free: FeatureGate → UpgradePrompt (analytics completamente bloqueado)
// Starter: datos de los últimos 7 días
// Professional: datos de los últimos 30 días
// Enterprise: datos de los últimos 365 días
```

### Verificación

- [ ] Plan free → UpgradePrompt ocupa toda la página
- [ ] Plan starter → LineChart muestra últimos 7 días
- [ ] Tab selector cambia entre tarjeta / landing / portafolio / cv
- [ ] `npm run typecheck` sin errores con recharts types

---

## PASO 15 — Dominio Personalizado (Enterprise) ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `apps/backend_django/apps/digital_services/models.py` (CustomDomain)
**Dependencias**: PASO 9
**Skills**: `react-forms-validation` · `react-tanstack-query`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
└── (authenticated)/
    └── dashboard/
        └── dominio/
            └── page.tsx
src/
├── features/
│   └── domain/
│       ├── types.ts                # CustomDomain, DomainStatus, VerificationStatus
│       ├── hooks/
│       │   ├── useCustomDomain.ts  # GET /app/digital/custom-domain/
│       │   ├── useSaveDomain.ts    # POST /app/digital/custom-domain/
│       │   └── useVerifyDomain.ts  # POST /app/digital/custom-domain/verify/
│       └── components/
│           ├── DomainPage.tsx      # UI principal: formulario + estado de verificación
│           ├── DomainForm.tsx      # Input de dominio + botón guardar
│           ├── DNSInstructions.tsx # Pasos para configurar CNAME/A record
│           └── VerificationStatus.tsx # Badge: pending/verified/failed + último intento
```

### Plan gates

```typescript
// Plan free/starter: UpgradePrompt "Requiere Plan Professional o superior"
// Plan professional/enterprise: acceso completo
```

### Verificación

- [ ] Plan free/starter → UpgradePrompt
- [ ] Guardar dominio → muestra instrucciones DNS
- [ ] Verificar dominio → badge cambia a verified/failed según respuesta
- [ ] `ssl_status` muestra estado del certificado SSL

---

## PASO 16 — SEO Avanzado: Sitemap, robots.txt, JSON-LD ⬜

**Estado**: ⬜ Pendiente
**Archivos de referencia**: `prd/features/digital-services.md` (sección SEO Strategy)
**Dependencias**: PASO 4, PASO 5, PASO 6, PASO 7
**Skills**: `nextjs-seo-optimization`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── sitemap.ts                      # Sitemap dinámico (Next.js MetadataRoute.Sitemap)
├── robots.ts                       # robots.txt (MetadataRoute.Robots)
└── (public-pages)/
    └── [service]/[username]/
        └── structured-data.ts      # JSON-LD helpers por tipo de página
src/
├── lib/
│   └── seo.ts                      # Helpers: buildOpenGraph, buildTwitterCard, buildJsonLd
```

### Sitemap dinámico

```typescript
// app/sitemap.ts
// Llama /public/profiles/ con paginación → genera URLs para todos los usernames
// Genera entradas para /tarjeta/{username}, /landing/{username},
//   /portafolio/{username}, /cv/{username}
// changeFrequency: 'weekly', priority: 0.8
```

### JSON-LD por tipo de página

```typescript
// Tarjeta → Person schema (nombre, título, email, sedes sociales)
// Landing → WebPage schema
// Portfolio → ItemList schema (lista de CreativeWork)
// CV → Person schema extendido (educación, experiencia)
```

### robots.ts

```typescript
// Permite todos los bots en rutas públicas
// Bloquea /dashboard/** de indexación
// Apunta al sitemap
```

### Verificación

- [ ] `GET /sitemap.xml` devuelve XML válido con al menos un usuario
- [ ] `GET /robots.txt` bloquea `/dashboard`
- [ ] `<script type="application/ld+json">` presente en páginas públicas SSR
- [ ] Lighthouse SEO score > 90 en página pública
- [ ] `npm run build` compila el sitemap sin errores

---

## FASE 6 — Calidad y Producción

---

## PASO 17 — Testing: Jest + RTL + Playwright E2E ⬜

**Estado**: ⬜ Pendiente
**Dependencias**: PASOes 4–16
**Skills**: `react-testing-library` · `react-e2e-testing` · `drf-testing`
**Agente**: `test-generator`

### Qué implementar

```
src/
├── __tests__/
│   ├── components/
│   │   ├── tarjeta/
│   │   │   ├── PublicCardView.test.tsx     # Renderiza datos del perfil correctamente
│   │   │   └── CardEditor.test.tsx          # Formulario RHF + submit
│   │   ├── landing/
│   │   │   └── PublicLandingView.test.tsx  # Renderiza secciones del JSON
│   │   ├── portfolio/
│   │   │   └── PortfolioCard.test.tsx      # Card con datos mock
│   │   └── cv/
│   │       └── ClassicTemplate.test.tsx    # Template renderiza campos del CV
│   ├── hooks/
│   │   ├── useFeatureGate.test.ts          # Plan gates correctos por feature
│   │   └── useSSO.test.ts                  # Flujo SSO: éxito y error
│   └── pages/
│       ├── tarjeta-page.test.tsx           # SSR meta tags (con fetch mock)
│       └── dashboard.test.tsx              # Grid de servicios según plan
e2e/
├── sso-flow.spec.ts                # Playwright: SSO login → dashboard
├── public-tarjeta.spec.ts          # Playwright: GET /tarjeta/testuser → elementos clave
└── public-cv.spec.ts               # Playwright: GET /cv/testuser → print PDF
```

### Setup

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom msw @playwright/test
```

### Comandos

```bash
npm run test          # Jest (unit + integración)
npm run test:coverage # Con umbral 65% lines
npm run e2e           # Playwright E2E
npm run e2e:ui        # Playwright UI mode
```

### Verificación

- [ ] `npm run test` pasa sin errores (mínimo 15 test files)
- [ ] Coverage lines ≥ 65%
- [ ] `npm run e2e` flujo SSO completo funciona
- [ ] Playwright testa las 4 rutas públicas principales

---

## PASO 18 — Performance, Accesibilidad y Configuración de Producción ⬜

**Estado**: ⬜ Pendiente
**Dependencias**: PASO 17
**Skills**: `react-performance-optimization` · `react-accessibility` · `nextjs-deployment`
**Agente**: `nextjs-builder`

### Qué implementar

```
app/
├── _components/                    # Componentes de layout global optimizados
next.config.ts                      # Producción: output standalone, headers, compression
src/
├── test/
│   └── a11y/                       # Tests axe para páginas públicas y dashboard
└── components/
    └── shared/
        └── OptimizedImage.tsx      # Wrapper de next/image con blur placeholder
```

### Optimizaciones next.config.ts

```typescript
const config: NextConfig = {
  output: 'standalone',             // Para Docker deployment
  compress: true,
  poweredByHeader: false,
  headers: async () => [            // Security headers
    { source: '/(.*)', headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]},
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};
```

### Tests de accesibilidad (jest-axe)

```typescript
// a11y/PublicCardView.a11y.test.tsx
// a11y/Dashboard.a11y.test.tsx
// a11y/CVClassicTemplate.a11y.test.tsx
// Reglas desactivadas: color-contrast (igual que admin panel)
```

### Lighthouse targets (páginas públicas)

| Categoría | Target |
|-----------|--------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 90 |
| SEO | ≥ 95 |

### Comandos finales

```bash
npm run build           # Build de producción
npm run start           # Servidor de producción en :3004
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
npm run test            # Todos los tests
```

### Dockerfile (standalone)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3004
CMD ["node", "server.js"]
```

### Verificación

- [ ] Lighthouse Performance ≥ 90 en `/tarjeta/testuser`
- [ ] Lighthouse SEO ≥ 95 en páginas públicas
- [ ] `npm run test` incluye tests a11y con 0 violaciones
- [ ] `npm run build` con `output: 'standalone'` genera `.next/standalone/`
- [ ] Headers de seguridad presentes en respuestas HTTP
- [ ] `npm run typecheck` sin errores

---

## Tabla Resumen de PASOes

| PASO | Nombre | Estado | Dependencias | Agente |
|------|--------|--------|--------------|--------|
| 1 | Scaffold Next.js 14 + Estructura Base | ⬜ | — | `nextjs-builder` |
| 2 | API Client + Auth Store + Middleware | ⬜ | 1 | `nextjs-builder` |
| 3 | Shell: Layout, Navbar, Sidebar, i18n | ⬜ | 2 | `nextjs-builder` |
| 4 | Tarjeta Digital Pública (SSR) | ⬜ | 1 | `nextjs-builder` |
| 5 | Landing Page Pública (SSR) | ⬜ | 1 | `nextjs-builder` |
| 6 | Portfolio Público (SSR + ISR) | ⬜ | 1 | `nextjs-builder` |
| 7 | CV Digital Público (SSR) | ⬜ | 1 | `nextjs-builder` |
| 8 | SSO: Validación Token + Rutas Protegidas | ⬜ | 2, 3 | `nextjs-builder` |
| 9 | Dashboard de Servicios | ⬜ | 3, 8 | `nextjs-builder` |
| 10 | Editor Tarjeta Digital (Autenticado) | ⬜ | 9 | `nextjs-builder` |
| 11 | Constructor Landing Page (Autenticado) | ⬜ | 9 | `nextjs-builder` |
| 12 | Gestión Portfolio (Autenticado) | ⬜ | 9 | `nextjs-builder` |
| 13 | Editor CV Digital (Autenticado) | ⬜ | 9 | `nextjs-builder` |
| 14 | Analytics de Servicios (Plan-Gated) | ⬜ | 10, 11, 12, 13 | `nextjs-builder` |
| 15 | Dominio Personalizado (Enterprise) | ⬜ | 9 | `nextjs-builder` |
| 16 | SEO Avanzado: Sitemap + JSON-LD | ⬜ | 4, 5, 6, 7 | `nextjs-builder` |
| 17 | Testing: Jest + RTL + Playwright E2E | ⬜ | 4–16 | `test-generator` |
| 18 | Performance, A11y y Configuración Prod | ⬜ | 17 | `nextjs-builder` |

---

## Verificación Final del Proyecto

```bash
cd apps/frontend_next_vista

# Calidad del código
npm run typecheck          # Sin errores TypeScript
npm run lint               # Sin errores ESLint

# Tests
npm run test               # ≥ 15 test files, todos pasando
npm run test:coverage      # lines ≥ 65%
npm run e2e                # Playwright E2E (requiere servidor en :3004 y backend en :8000)

# Build de producción
npm run build              # Sin errores de compilación
npm run start              # Servidor en :3004

# Verificaciones SSR (páginas públicas)
curl -s http://localhost:3004/tarjeta/testuser | grep '<meta property="og:title">'
curl -s http://localhost:3004/sitemap.xml | head -20
curl -s http://localhost:3004/robots.txt

# Lighthouse (desde Chrome DevTools o npx lighthouse)
npx lighthouse http://localhost:3004/tarjeta/testuser --only-categories=performance,accessibility,seo
```

### Checklist de Rutas

| Ruta | Tipo | Auth | Descripción |
|------|------|------|-------------|
| `/` | SSG | No | Landing marketing del servicio |
| `/tarjeta/[username]` | ISR | No | Tarjeta digital pública |
| `/landing/[username]` | ISR | No | Landing page pública |
| `/portafolio/[username]` | ISR | No | Portfolio público |
| `/portafolio/[username]/[slug]` | ISR | No | Proyecto individual |
| `/cv/[username]` | ISR | No | CV digital público |
| `/sso` | Client | Transición | Validación SSO token |
| `/dashboard` | Client | JWT | Dashboard de servicios |
| `/dashboard/tarjeta` | Client | JWT | Editor tarjeta |
| `/dashboard/landing` | Client | JWT | Constructor landing |
| `/dashboard/portfolio` | Client | JWT | CRUD portfolio |
| `/dashboard/cv` | Client | JWT | Editor CV |
| `/dashboard/analytics` | Client | JWT | Analytics (starter+) |
| `/dashboard/dominio` | Client | JWT | Dominio custom (pro+) |
| `/sitemap.xml` | Dynamic | No | Sitemap SEO |
| `/robots.txt` | Static | No | Directivas robots |
