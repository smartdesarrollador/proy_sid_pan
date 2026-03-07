# Arquitectura Frontend

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Los 5 Frontends](#los-5-frontends)
2. [Gestión de Estado](#gestión-de-estado)
3. [Internacionalización (i18n)](#internacionalización-i18n)
4. [Dark Mode](#dark-mode)
5. [Flujo SSR (Digital Services)](#flujo-ssr-digital-services)
6. [Hub → Servicios: Acceso via SSO](#hub--servicios-acceso-via-sso)

---

## Los 5 Frontends

| Frontend | Framework | Propósito | URL Pattern | Notas |
|----------|-----------|-----------|-------------|-------|
| **Hub Client Portal** | React 18 + Vite + TS | Registro, onboarding, catálogo de servicios, SSO, billing, referidos | `hub.plataforma.com` | Punto de entrada unificado; no necesita SEO |
| **Admin Panel** | React 18 + Vite + TS | RBAC, usuarios, billing, auditoría, analytics | `admin.plataforma.com` | SPA autenticado, no necesita SEO |
| **Workspace** | React 18 + Vite + TS | Servicios cliente: tareas, notas, proyectos, contactos | `app.plataforma.com` | SPA autenticado, acceso via SSO desde Hub |
| **Digital Services** | Next.js 14 App Router + TS | Perfiles públicos con SSR: tarjeta, landing, portafolio, CV | `{slug}.plataforma.com` | SSR para SEO, páginas públicas |
| **Desktop App** | Tauri v2 + React 18 + TS | Sidebar AppBar nativa Windows | App nativa (.exe) | Rust backend, Win32 AppBar API |

### Por qué 5 frontends distintos

- **Hub**: Punto de entrada unificado para clientes; gestiona registro, onboarding y acceso SSO a todos los servicios. Separado del Admin para que cada frontend tenga un propósito único y no mezcle contextos de uso
- **Admin**: No necesita SEO; Vite es más ligero para SPA de administración interna
- **Workspace**: Misma justificación que Admin; acceso exclusivo via SSO desde el Hub
- **Digital Services**: Requiere SSR para indexación por buscadores; Next.js es el estándar para React + SSR
- **Desktop**: Requiere integración con APIs nativas de Windows (AppBar Win32); Tauri permite acceso a Rust desde React

### Paquetes compartidos

Los 5 frontends comparten convenciones de Tailwind CSS y componentes base (Design Tokens), pero no comparten código en tiempo de ejecución. Ver [`prd/technical/architecture.md`](../../prd/technical/architecture.md) para detalles de tech stack.

---

## Gestión de Estado

### Hub Client Portal (React + Vite)

| Tipo de estado | Librería | Uso |
|----------------|---------|-----|
| **Server state** | TanStack Query v5 | Datos del API (servicios, suscripción, equipo, notificaciones) |
| **Client state** | React Context | UI state: tema, idioma, autenticación (sin Zustand) |
| **Form state** | React Hook Form + Zod | Formularios con validación |
| **Auth state** | AuthContext (React Context) | Token JWT, usuario actual, tenant |
| **Theme state** | ThemeContext | `'light' | 'dark'` con persistencia en localStorage |
| **Language state** | LanguageContext | `'es' | 'en'` con función `t(key)` integrada |

> El Hub no usa Zustand. Todo el estado cliente se gestiona con React Context nativo para mantener el bundle más ligero.

### Admin Panel y Workspace (React + Vite)

| Tipo de estado | Librería | Uso |
|----------------|---------|-----|
| **Server state** | TanStack Query v5 | Datos del API (usuarios, proyectos, tareas, etc.) |
| **Client state** | Zustand | UI state: sidebar abierta, filtros activos, preferencias |
| **Form state** | React Hook Form + Zod | Formularios con validación |
| **Auth state** | AuthContext (React Context) | Token JWT, usuario actual, permisos |

**Patrón recomendado**:
- TanStack Query para todo dato que viene del servidor (con `staleTime`, `gcTime`, invalidación)
- Zustand para estado UI que no necesita sincronización con servidor
- Evitar duplicar server state en Zustand

### Digital Services (Next.js App Router)

- **React Server Components** (RSC): Fetching de datos en servidor, sin estado cliente
- **Client Components** (`'use client'`): Solo para interactividad (botones, animaciones, formularios de contacto)
- **ISR (Incremental Static Regeneration)**: `revalidate: 60` para cache de páginas públicas

### Desktop App (Tauri)

- **TanStack Query**: Server state desde Django API (mismos endpoints que Workspace)
- **Estado local React**: `useState` para panel activo, ancho del panel
- **Estado Rust**: `AppBarHandle` (HWND, width) en `Mutex` global de Tauri

---

## Internacionalización (i18n)

### Hub Client Portal (LanguageContext nativo)

```
src/
└── locales/
    ├── es.js     # Objeto plano con todas las claves
    └── en.js     # Misma estructura en inglés
```

- `LanguageContext` expone `{ lang, setLang, t }` a toda la app
- `t('navbar.dashboard')` resuelve claves con notación de punto
- Idioma persistido en `localStorage('hub-lang')`; valor por defecto: `'es'`
- No requiere librerías externas de i18n

```typescript
// contexts/LanguageContext.tsx
type Lang = 'es' | 'en';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('hub-lang') as Lang) || 'es';
  });

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = lang === 'es' ? esTranslations : enTranslations;
    for (const k of keys) value = value?.[k];
    return value ?? key;
  };

  const setLang = (newLang: Lang) => {
    localStorage.setItem('hub-lang', newLang);
    setLangState(newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

### Admin Panel y Workspace (react-i18next)

```
src/
└── locales/
    ├── es/
    │   └── translation.json
    └── en/
        └── translation.json
```

- Hook `useTranslation()` en componentes
- `date-fns` con locale awareness para fechas
- `Intl.NumberFormat` para monedas
- Lazy loading de namespaces por ruta

### Digital Services (next-intl)

```
app/
└── [locale]/          # Routing internacionalizado
    ├── layout.tsx     # Server Component con locale
    └── [username]/
        └── page.tsx   # SSR con traducciones pre-renderizadas
```

- Server Components con traducciones servidas desde el servidor (no hay flash de contenido)
- `useTranslations()` hook en Client Components
- Locales soportados: `es`, `en`

### Backend (Django i18n)

- `django.utils.translation.gettext_lazy` en modelos/serializers
- Archivos: `locale/es/LC_MESSAGES/django.po` y `locale/en/LC_MESSAGES/django.po`
- `LocaleMiddleware` detecta idioma en orden: preferencia DB del usuario → session → `Accept-Language` header → default (`es`)

### Sincronización de idioma usuario

```
1. Usuario cambia idioma en UI
2. Frontend actualiza localStorage
3. Frontend llama PATCH /api/v1/users/me/preferences {"language": "en"}
4. Backend persiste en users.preferences.language
5. Próximo login: idioma viene en el JWT response → frontend aplica
```

---

## Dark Mode

### Estrategia: Tailwind CSS `class` mode

La estrategia es `class` (manual toggle via clase `dark` en `<html>`), NO `media`. Esto permite que el usuario controle el tema independientemente de la preferencia del sistema operativo.

### Variables CSS para colores

```css
:root {
  --color-primary: 59 130 246;   /* blue-500 */
  --color-bg: 255 255 255;
  --color-text: 0 0 0;
}

.dark {
  --color-bg: 17 24 39;          /* gray-900 */
  --color-text: 255 255 255;
}
```

### Hub Client Portal (ThemeContext — solo `'light' | 'dark'`)

El Hub soporta solo dos valores: `'light'` y `'dark'`. No tiene modo `'auto'` (no sigue la preferencia del sistema). Valor por defecto: `'light'`.

```typescript
// contexts/ThemeContext.tsx (Hub)
type Theme = 'light' | 'dark';   // Sin 'auto'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('hub-theme') as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('hub-theme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Admin Panel y Workspace (ThemeProvider — `'light' | 'dark' | 'auto'`)

Soporta 3 valores: `'light'`, `'dark'`, `'auto'` (sigue la preferencia del sistema operativo). Persistido en `localStorage('theme')`.

```typescript
// contexts/ThemeContext.tsx (Admin/Workspace)
type Theme = 'light' | 'dark' | 'auto';

// ... useEffect comprueba window.matchMedia si theme === 'auto'
```

### Digital Services (next-themes)

```typescript
// app/providers.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

---

## Flujo SSR (Digital Services)

```
1. Browser → GET /landing/jsmith
2. Nginx → Next.js server (port 3000)
3. Next.js verifica ISR cache (revalidate: 60s)
   ├── Cache HIT  → retorna HTML inmediatamente (TTFB <200ms)
   └── Cache MISS → Server Component llama Django API
                    → Django consulta PostgreSQL
                    → RSC renderiza HTML completo
                    → Cachea en ISR (60s)
                    → Retorna HTML al browser
4. Browser recibe HTML completo (indexable por buscadores)
5. React hidrata para interactividad
```

### Invalidación de cache

Django invalida la cache SSR automáticamente via signals cuando se actualiza el perfil:

```python
@receiver(post_save, sender=PublicProfile)
def invalidate_profile_cache(sender, instance, **kwargs):
    redis_client.delete(f"ssr:tarjeta:{instance.username}")
    redis_client.delete(f"ssr:landing:{instance.username}")
    redis_client.delete(f"ssr:portafolio:{instance.username}")
    redis_client.delete(f"ssr:cv:{instance.username}")
```

Ver detalles de caching en [data-architecture.md](data-architecture.md).

---

## Hub → Servicios: Acceso via SSO

El Hub usa tokens SSO de corta duración para autenticar al usuario en los servicios sin necesidad de credenciales adicionales. El flujo completo está documentado en [sso-architecture.md](sso-architecture.md).

**Resumen del flujo desde el frontend del Hub:**

```typescript
// Cuando el usuario hace clic en "Abrir" en un servicio
async function openService(serviceSlug: string) {
  // 1. Solicitar token SSO al backend
  const { sso_token, redirect_url } = await api.post('/auth/sso/token/', {
    service: serviceSlug
  });

  // 2. Redirigir al browser al servicio con el token
  window.location.href = redirect_url;
  // Ej: https://acme.workspace.app/?sso_token=a3f9b2c1...
}
```

El servicio destino (ej. Workspace) recibe el token via query param, lo valida contra el backend (`POST /auth/sso/validate/`) y crea la sesión local del usuario.

Ver flujo completo en [sso-architecture.md](sso-architecture.md).

---

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) + [`prd/features/hub-client-portal.md`](../../prd/features/hub-client-portal.md)

**Última actualización**: 2026-03-06
