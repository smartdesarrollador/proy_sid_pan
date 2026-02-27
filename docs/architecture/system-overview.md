# Arquitectura del Sistema

[Volver al README del proyecto](../../CLAUDE.md)

---

## Tabla de Contenidos

1. [Diagrama General](#diagrama-general)
2. [Las 4 Aplicaciones](#las-4-aplicaciones)
3. [Tech Stack Resumen](#tech-stack-resumen)
4. [Documentos de Arquitectura](#documentos-de-arquitectura)

---

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Clientes                                   │
├─────────────────┬──────────────────┬──────────────┬─────────────────┤
│  Admin Panel    │  Client Panel    │  Digital     │  Desktop App    │
│  React + Vite   │  React + Vite    │  Services    │  Tauri v2       │
│  admin.app.com  │  app.app.com     │  Next.js     │  Windows AppBar │
│                 │                  │  *.app.com   │                 │
└────────┬────────┴────────┬─────────┴──────┬───────┴────────┬────────┘
         │                 │                 │                │
         └─────────────────┴─────────────────┴────────────────┘
                                    │ HTTPS / REST API
                                    │
         ┌──────────────────────────▼───────────────────────────┐
         │              API Gateway / Load Balancer              │
         │                   (Nginx / AWS ALB)                   │
         └──────────────────────────┬───────────────────────────┘
                                    │
         ┌──────────────────────────▼───────────────────────────┐
         │           Backend API (Django REST Framework)         │
         ├──────────────────────────────────────────────────────┤
         │  /api/v1/admin/    /api/v1/app/     /api/v1/auth/    │
         │  - Tenants         - Calendar       - Login           │
         │  - Users           - Tasks          - Register        │
         │  - Roles           - Files          - Refresh         │
         │  - Permissions     - Projects       - MFA             │
         │  - Subscriptions   - Dashboard                        │
         │  - Audit Logs      - Notes/Contacts                   │
         │  - Digital Svcs    - Bookmarks/Snippets               │
         └────────────────────────┬─────────────────────────────┘
                                  │
              ┌───────────────────┼──────────────────┐
              │                   │                  │
    ┌─────────▼──────┐   ┌────────▼───────┐  ┌──────▼───────┐
    │   PostgreSQL   │   │     Redis      │  │  S3 / MinIO  │
    │  (Primary DB)  │   │  Cache +       │  │  (Files +    │
    │  RLS enabled   │   │  Sessions +    │  │   Avatars)   │
    │  Multi-tenant  │   │  Rate Limits   │  │              │
    └────────────────┘   └────────────────┘  └──────────────┘
```

---

## Las 4 Aplicaciones

| App | Framework | Propósito | URL Pattern | Notas |
|-----|-----------|-----------|-------------|-------|
| **Admin Panel** | React 18 + Vite + TS | RBAC, usuarios, billing, auditoría | `admin.plataforma.com` | SPA, no necesita SEO |
| **Client Panel** | React 18 + Vite + TS | Servicios del cliente: tareas, notas, contactos, proyectos | `app.plataforma.com` | SPA, autenticado |
| **Digital Services** | Next.js 14 App Router | Perfiles públicos con SSR: tarjeta digital, landing, portafolio, CV | `{slug}.plataforma.com/{username}` | SSR para SEO, público |
| **Desktop App** | Tauri v2 + React + TS | Sidebar AppBar nativa Windows, acceso rápido a servicios | App nativa (Windows) | Consume mismos endpoints que Client Panel |

### Responsabilidades por app

**Admin Panel** — para administradores del tenant:
- Gestión de usuarios e invitaciones
- Configuración de roles y permisos (RBAC)
- Gestión de suscripción y billing (Stripe)
- Visualización de logs de auditoría
- Analytics de negocio (MRR, churn, health scores)
- Configuración del tenant (branding, settings)

**Client Panel** — para usuarios finales autenticados:
- Calendario y gestión de eventos
- Tareas con tableros Kanban
- Portafolio y proyectos con secciones e items
- Notas, contactos, bookmarks, snippets
- Archivos y documentos
- Variables de entorno, claves SSH, certificados SSL
- Configuración del perfil público (digital services)

**Digital Services** — páginas públicas con SSR:
- Tarjeta digital de contacto (`/tarjeta/{username}`)
- Landing page personalizable (`/landing/{username}`)
- Portafolio de proyectos (`/portafolio/{username}`)
- CV digital con export PDF (`/cv/{username}`)
- ISR cache: revalidación cada 60s, cache Redis 5min

**Desktop App** — sidebar nativa Windows:
- AppBar Win32 anclada al borde derecho de pantalla
- 8 paneles funcionales: Tasks, Notes, Contacts, Bookmarks, Snippets, Projects, Shared, Reports
- 6 paneles placeholder: Home, Files, Chat, Alerts, Profile, Settings
- No requiere tablas adicionales en DB

---

## Tech Stack Resumen

### Backend

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| API Framework | Django REST Framework | 3.14+ | Endpoints REST |
| Lenguaje | Python | 3.11+ | Lógica de negocio |
| Base de datos | PostgreSQL | 15+ | DB principal con RLS |
| Cache / Sessions | Redis | 7+ | Cache, sesiones, rate limiting |
| Task Queue | Celery + Redis | 5+ | Jobs asíncronos (email, billing) |
| Auth | Django JWT | 2.x | Tokens JWT |
| Pagos | Stripe API | v2023+ | Billing, suscripciones |

### Frontends

| Componente | Admin/Client | Digital Services | Desktop |
|------------|-------------|-----------------|---------|
| Framework | React 18 + Vite | Next.js 14 App Router | Tauri v2 + React 18 |
| Lenguaje | TypeScript | TypeScript | TypeScript + Rust |
| Estilos | Tailwind CSS | Tailwind CSS | Tailwind CSS |
| UI Components | shadcn/ui | shadcn/ui | lucide-react |
| State | TanStack Query + Zustand | React Server Components | TanStack Query |
| Forms | React Hook Form + Zod | React Hook Form + Zod | React Hook Form |
| Routing | React Router 6 | Next.js App Router | Panel-based (no routing) |
| i18n | react-i18next | next-intl | react-i18next |
| HTTP | Axios + custom hooks | fetch nativo | Tauri invoke + fetch |

### Infraestructura

| Componente | Tecnología |
|------------|-----------|
| CI/CD | GitHub Actions |
| Hosting | AWS / DigitalOcean |
| Load Balancer | AWS ALB / Nginx |
| Monitoring | Sentry + CloudWatch |
| Logging | ELK Stack |
| File Storage | AWS S3 / MinIO |
| CDN | CloudFront / Cloudflare |

---

## Documentos de Arquitectura

| Documento | Contenido |
|-----------|-----------|
| [multi-tenancy.md](multi-tenancy.md) | Estrategia subdomain-based, RLS PostgreSQL, Django Middleware |
| [rbac.md](rbac.md) | 10 roles, 62 permisos, 3 tipos de scope, herencia, middleware DRF |
| [frontend-architecture.md](frontend-architecture.md) | 4 frontends, estado, i18n, dark mode |
| [data-architecture.md](data-architecture.md) | Modelos principales, caching, storage |
| [security.md](security.md) | Auth JWT + MFA, encriptación, RLS, API security |
| [infrastructure.md](infrastructure.md) | Deployment, CI/CD, monitoring, performance targets |

---

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) + [`prd/README.md`](../../prd/README.md)

**Última actualización**: 2026-02-26
