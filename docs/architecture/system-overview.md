# Arquitectura del Sistema

[Volver al README del proyecto](../../CLAUDE.md)

---

## Tabla de Contenidos

1. [Diagrama General](#diagrama-general)
2. [Las 5 Aplicaciones](#las-5-aplicaciones)
3. [Tech Stack Resumen](#tech-stack-resumen)
4. [Documentos de Arquitectura](#documentos-de-arquitectura)

---

## Diagrama General

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  Clientes                                     │
├──────────────┬──────────────────┬──────────────┬──────────────┬──────────────┤
│  Hub Client  │  Admin Panel     │  Workspace   │  Digital     │  Desktop App │
│  React+Vite  │  React + Vite    │  React+Vite  │  Services    │  Tauri v2    │
│  hub.app.com │  admin.app.com   │  app.app.com │  Next.js     │  Windows     │
│              │                  │  ◄─── SSO ───│  *.app.com   │  AppBar      │
└──────┬───────┴────────┬─────────┴──────┬───────┴──────┬───────┴──────┬───────┘
       │                │                │              │              │
       └────────────────┴────────────────┴──────────────┴──────────────┘
                                         │ HTTPS / REST API
                                         │
        ┌────────────────────────────────▼──────────────────────────────┐
        │               API Gateway / Load Balancer                      │
        │                    (Nginx / AWS ALB)                           │
        └────────────────────────────┬──────────────────────────────────┘
                                     │
        ┌────────────────────────────▼──────────────────────────────────┐
        │            Backend API (Django REST Framework)                 │
        ├───────────────────────────────────────────────────────────────┤
        │  /api/v1/admin/    /api/v1/app/     /api/v1/auth/             │
        │  - Tenants         - Calendar       - Login                    │
        │  - Users           - Tasks          - Register                 │
        │  - Roles           - Files          - Refresh                  │
        │  - Permissions     - Projects       - MFA                      │
        │  - Subscriptions   - Dashboard      - SSO Token/Validate       │
        │  - Audit Logs      - Notes/Contacts                            │
        │  - Digital Svcs    - Bookmarks/Snippets                        │
        │  - Services        - Notifications (Hub)                       │
        └───────────────────────────┬───────────────────────────────────┘
                                    │
             ┌──────────────────────┼──────────────────┐
             │                      │                  │
   ┌─────────▼──────┐   ┌───────────▼───────┐  ┌──────▼───────┐
   │   PostgreSQL   │   │      Redis         │  │  S3 / MinIO  │
   │  (Primary DB)  │   │  Cache +           │  │  (Files +    │
   │  RLS enabled   │   │  Sessions +        │  │   Avatars)   │
   │  Multi-tenant  │   │  Rate Limits       │  │              │
   └────────────────┘   └───────────────────┘  └──────────────┘
```

---

## Las 5 Aplicaciones

| App | Framework | Propósito | URL Pattern | Notas |
|-----|-----------|-----------|-------------|-------|
| **Hub Client Portal** | React 18 + Vite + TS | Registro, onboarding, catálogo de servicios, SSO, billing LATAM, referidos | `hub.plataforma.com` | Punto de entrada unificado para tenants |
| **Admin Panel** | React 18 + Vite + TS | RBAC, usuarios, billing, auditoría | `admin.plataforma.com` | SPA, no necesita SEO |
| **Workspace** | React 18 + Vite + TS | Servicios del cliente: tareas, notas, contactos, proyectos | `app.plataforma.com` | SPA, autenticado, acceso via SSO desde Hub |
| **Digital Services** | Next.js 14 App Router | Perfiles públicos con SSR: tarjeta digital, landing, portafolio, CV | `{slug}.plataforma.com/{username}` | SSR para SEO, público |
| **Desktop App** | Tauri v2 + React + TS | Sidebar AppBar nativa Windows, acceso rápido a servicios | App nativa (Windows) | Consume mismos endpoints que Workspace |

### Responsabilidades por app

**Hub Client Portal** — punto de entrada unificado:
- Registro de nuevo tenant y onboarding multi-paso (stepper 4 pasos)
- Catálogo de servicios adquiridos y disponibles (upgrade)
- SSO de corta duración hacia Workspace, Digital Services y Desktop
- Gestión propia de suscripción y billing (Stripe + métodos LATAM)
- Centro de notificaciones (categorías: billing, security, services, system)
- Gestión básica del equipo (invitar/suspender miembros)
- Programa de referidos (código único, créditos, historial)

**Admin Panel** — para administradores del tenant:
- Gestión avanzada de usuarios e invitaciones (RBAC completo)
- Configuración de roles y permisos
- Gestión del catálogo de servicios de la plataforma
- Visualización de logs de auditoría
- Analytics de negocio (MRR, churn, health scores)
- Configuración del tenant (branding, settings)

**Workspace** — para usuarios finales autenticados:
- Calendario y gestión de eventos
- Tareas con tableros Kanban
- Portafolio y proyectos con secciones e items
- Notas, contactos, bookmarks, snippets
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

| Componente | Hub | Admin/Workspace | Digital Services | Desktop |
|------------|-----|-----------------|-----------------|---------|
| Framework | React 18 + Vite | React 18 + Vite | Next.js 14 App Router | Tauri v2 + React 18 |
| Lenguaje | TypeScript | TypeScript | TypeScript | TypeScript + Rust |
| Estilos | Tailwind CSS | Tailwind CSS | Tailwind CSS | Tailwind CSS |
| State | TanStack Query + React Context | TanStack Query + Zustand | React Server Components | TanStack Query |
| Forms | React Hook Form + Zod | React Hook Form + Zod | React Hook Form + Zod | React Hook Form |
| Routing | React Router 6 | React Router 6 | Next.js App Router | Panel-based (no routing) |
| i18n | LanguageContext nativo | react-i18next | next-intl | react-i18next |
| Dark Mode | ThemeContext (`'light'|'dark'`) | ThemeContext (`'light'|'dark'|'auto'`) | next-themes | ThemeContext |
| HTTP | Axios + custom hooks | Axios + custom hooks | fetch nativo | Tauri invoke + fetch |

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
| [multi-tenancy.md](multi-tenancy.md) | Estrategia subdomain-based, RLS PostgreSQL, Django Middleware, registro de nuevo tenant |
| [rbac.md](rbac.md) | 10 roles, 64 permisos, 3 tipos de scope, herencia, mapeo por frontend |
| [frontend-architecture.md](frontend-architecture.md) | 5 frontends, estado, i18n, dark mode, SSO desde Hub |
| [data-architecture.md](data-architecture.md) | Modelos principales + nuevos (SSO, Services, Referrals, Share, Promotions), caching, storage |
| [security.md](security.md) | Auth JWT + MFA + SSO, encriptación, RLS, API security, pagos LATAM |
| [infrastructure.md](infrastructure.md) | Deployment, CI/CD, monitoring, performance targets, pagos LATAM |
| [sso-architecture.md](sso-architecture.md) | Flujo SSO Hub → Servicios, SSOToken, catálogo de servicios |

---

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) + [`prd/features/hub-client-portal.md`](../../prd/features/hub-client-portal.md)

**Última actualización**: 2026-03-06
