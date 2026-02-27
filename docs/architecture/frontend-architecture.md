# Arquitectura Frontend

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Los 4 Frontends](#los-4-frontends)
2. [Gestión de Estado](#gestión-de-estado)
3. [Internacionalización (i18n)](#internacionalización-i18n)
4. [Dark Mode](#dark-mode)
5. [Flujo SSR (Digital Services)](#flujo-ssr-digital-services)

---

## Los 4 Frontends

| Frontend | Framework | Propósito | URL Pattern | Notas |
|----------|-----------|-----------|-------------|-------|
| **Admin Panel** | React 18 + Vite + TS | RBAC, usuarios, billing, auditoría, analytics | `admin.plataforma.com` | SPA autenticado, no necesita SEO |
| **Client Panel** | React 18 + Vite + TS | Servicios cliente: tareas, notas, proyectos, contactos | `app.plataforma.com` | SPA autenticado, no necesita SEO |
| **Digital Services** | Next.js 14 App Router + TS | Perfiles públicos con SSR: tarjeta, landing, portafolio, CV | `{slug}.plataforma.com` | SSR para SEO, páginas públicas |
| **Desktop App** | Tauri v2 + React 18 + TS | Sidebar AppBar nativa Windows | App nativa (.exe) | Rust backend, Win32 AppBar API |

### Por qué 4 frontends distintos

- **Admin y Client**: No necesitan SEO, Vite es más ligero y flexible que Next.js para SPAs internas
- **Digital Services**: Requiere SSR para indexación por buscadores; Next.js es el estándar para React + SSR
- **Desktop**: Requiere integración con APIs nativas de Windows (AppBar Win32); Tauri permite acceso a Rust desde React

### Paquetes compartidos

Los 4 frontends comparten convenciones de Tailwind CSS y componentes base (Design Tokens), pero no comparten código en tiempo de ejecución. Ver [`prd/technical/architecture.md`](../../prd/technical/architecture.md) para detalles de tech stack.

---

## Gestión de Estado

### Admin Panel y Client Panel (React + Vite)

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

- **TanStack Query**: Server state desde Django API (mismos endpoints que Client Panel)
- **Estado local React**: `useState` para panel activo, ancho del panel
- **Estado Rust**: `AppBarHandle` (HWND, width) en `Mutex` global de Tauri

---

## Internacionalización (i18n)

### Admin Panel y Client Panel (react-i18next)

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

### ThemeProvider (React + Vite)

El tema se persiste en `localStorage` y soporta 3 valores: `'light'`, `'dark'`, `'auto'` (sigue la preferencia del sistema).

```typescript
// contexts/ThemeContext.tsx
type Theme = 'light' | 'dark' | 'auto';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'auto';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light';
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

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) + [`prd/features/desktop-app.md`](../../prd/features/desktop-app.md)

**Última actualización**: 2026-02-26
