# RBAC Subscription Platform

SaaS multi-tenant con control de acceso basado en roles (RBAC), billing por suscripción, y servicios digitales públicos (tarjeta digital, landing page, portfolio, CV). El sistema está compuesto por un backend Django REST y cinco frontends independientes, cada uno con un propósito específico y su propio flujo de autenticación.

---

## Apps del Sistema

| App | Ruta | Tech | Puerto | Acceso |
|-----|------|------|--------|--------|
| **Backend API** | `apps/backend_django/` | Django + DRF + PostgreSQL + Redis | 8000 | — |
| **Admin Panel** | `apps/frontend_admin/` | React + Vite + TypeScript + Tailwind | 5173 | Solo staff (`is_staff=True`) |
| **Hub Client Portal** | `apps/frontend_hub_client/` | React + Vite + TypeScript + Tailwind | 5175 | Clientes (cualquier tenant) |
| **Workspace** | `apps/frontend_workspace/` | React + Vite + TypeScript + Tailwind | — | Clientes vía SSO desde Hub |
| **Vista (Digital Services)** | `apps/frontend_next_vista/` | Next.js 15 App Router + Tailwind | — | Clientes vía SSO + público sin auth |
| **Desktop** | `apps/frontend_sidebar_desktop/` | Tauri v2 + React + TypeScript | — | Clientes vía deep link del Hub |

---

## Tipos de Usuario

### Staff / Superadmin
- `user.is_staff = True`
- Accede **solo** al Admin Panel (`frontend_admin`)
- Gestiona usuarios, roles, permisos, billing, auditoría, clientes, promociones

### Cliente / Tenant
- `user.is_staff = False`, tenant activo en BD
- Accede a Hub, Workspace, Vista, Desktop
- **NUNCA** puede acceder al Admin Panel
- Su plan (`Tenant.plan`) controla qué features puede usar:
  - `free` → tarjeta digital, CV básico
  - `starter` → + landing page, analytics, QR/vCard
  - `professional` → + portfolio, MFA, CSS personalizado, webhooks
  - `enterprise` → + SSO/SAML, dominio personalizado, white-label, soporte 24/7

### Anónimo
- Sin autenticación
- Solo puede ver las vistas públicas de Vista: tarjeta, landing, portfolio, CV

---

## Arquitectura de Autenticación

### Flujo 1 — Login directo (Admin Panel y Hub)

```
POST /api/v1/auth/login { email, password }
  └─ Sin MFA: { access_token, refresh_token, user, tenant }
  └─ Con MFA: { mfa_required: true, mfa_token }
              POST /api/v1/auth/mfa/validate → tokens

Admin Panel: acepta solo si user.is_staff === true
Hub: acepta cualquier usuario con tenant activo
```

### Flujo 2 — SSO Hub → Workspace / Vista

```
Hub                          Backend                        Workspace / Vista
 │                              │                                │
 ├─ POST /auth/sso/token/ ────► │ Genera token 64 chars         │
 │  { service: "workspace" }    │ TTL: 60s, single-use          │
 │ ◄── { sso_token, redirect } ─┤                               │
 │                              │                               │
 ├─ window.location.href ──────────────────────────────────────►│
 │  redirect_url?sso_token=X    │                               │
 │                              │                               │
 │                              │ ◄── POST /auth/sso/validate/ ─┤
 │                              │     { sso_token }             │
 │                              │ ──► { tokens, user, tenant } ─┤
 │                              │    (atomic, marca used_at)    │
 │                              │                               ├─ Navega a /dashboard
```

### Flujo 3 — Deep Link Desktop (rbacdesktop://)

```
Desktop App                  Hub Client Portal              Sistema Operativo
 │                              │                                │
 ├─ Genera nonce UUID           │                               │
 ├─ open_hub_login(nonce) ─────►│                               │
 │  ?source=desktop&state=nonce │                               │
 │                              ├─ Usuario se autentica         │
 │                              ├─ buildDesktopRedirectUrl()    │
 │                              └─ rbacdesktop://auth?          │
 │                                 payload=base64&state=nonce ─►│
 │ ◄── poll_deep_link_url()                                     │
 │     cada 500ms (timeout 120s)                                │
 ├─ Valida nonce anti-CSRF      │                               │
 ├─ Decodifica payload (tokens + user + tenant)                 │
 └─ Navega al dashboard         │                               │
```

### Flujo 4 — Session Restore (Vista / Next.js)

El layout autenticado ejecuta `useSessionRestore` en cada carga:

```
1. ¿isAuthenticated en Zustand? → continúa
2. ¿refreshToken en localStorage? No → redirect Hub/login?next=vista
3. POST /auth/token/refresh/ → nuevos tokens
4. GET /auth/profile/ → user (con tenant_plan para feature gates)
5. Cookie: accessToken=...; max-age=3600 (para Server Components Next.js)
```

---

## Backend — API Endpoints Principales

```
/api/v1/auth/
  POST /login              → Autenticación JWT
  POST /register           → Crear tenant + usuario
  POST /refresh-token      → Renovar tokens
  GET  /profile            → Perfil del usuario autenticado
  POST /sso/token/         → Generar token SSO (requiere auth)
  POST /sso/validate/      → Validar token SSO (server-to-server)
  POST /mfa/enable         → Configurar TOTP
  POST /mfa/validate       → Validar código TOTP en login
  GET  /google/            → OAuth Google init

/api/v1/admin/             → Solo staff (HasPermission requerido)
  users/, roles/, permissions/, audit-logs/, billing/, clients/, promotions/

/api/v1/app/               → Usuarios autenticados (clientes)
  projects/, tasks/, calendar/, notes/, contacts/, snippets/
  digital/tarjeta/, digital/portafolio/, digital/landing/, digital/cv/
  services/, services/active/

/api/v1/public/            → Sin autenticación
  profiles/[username]/, portafolio/[username]/, landing/[username]/, cv/[username]/
```

---

## Vista (frontend_next_vista) — Rutas

### Área pública (sin auth)
```
/[locale]/tarjeta/[username]              → Tarjeta digital
/[locale]/landing/[username]             → Landing page
/[locale]/portafolio/[username]          → Portfolio grid
/[locale]/portafolio/[username]/[slug]   → Detalle de proyecto
/[locale]/cv/[username]                  → CV
```

### Área autenticada (requiere session restore)
```
/[locale]/dashboard                      → Panel principal
/[locale]/tarjeta                        → Editor tarjeta digital
/[locale]/landing                        → Builder landing page
/[locale]/portafolio                     → Gestor portfolio
/[locale]/cv                             → Editor CV
```

---

## Workspace (frontend_workspace) — Rutas

```
Públicas:  /login, /forgot-password, /reset-password, /sso/callback
Protegidas: /dashboard, /tasks, /calendar, /notes, /contacts, /bookmarks,
            /snippets, /projects, /env-vars, /ssh-keys, /ssl-certs, /forms,
            /shared, /audit, /reports, /notifications, /support, /settings
```

---

## Comandos de Desarrollo

### Backend (desde `apps/backend_django/`)
```bash
make dev             # Iniciar todos los contenedores (django+postgres+redis+celery)
make down            # Detener contenedores
make migrate         # Aplicar migraciones
make makemigrations  # Crear nuevas migraciones
make seed-permissions  # Cargar permisos y roles del sistema (ejecutar tras migrate)
make seed-data       # Generar datos de ejemplo (tenants, usuarios)
make test            # Ejecutar suite de tests (pytest)
make lint            # Ruff linter
make format          # Auto-formatear con ruff
make typecheck       # mypy
make shell           # Django shell_plus
make superuser       # Crear superusuario
```

### Frontends (desde cada directorio)
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run typecheck    # TypeScript typecheck
npm test             # Tests (Vitest)
```

---

## Estructura del Proyecto

```
.
├── apps/
│   ├── backend_django/        # API Django REST
│   │   ├── apps/              # auth_app, rbac, tenants, subscriptions, ...
│   │   ├── config/            # Settings, URLs, Celery
│   │   ├── core/              # BaseModel, AuditMixin, TenantMixin
│   │   └── utils/             # plans.py, encryption.py, cache.py
│   ├── frontend_admin/        # Admin Panel (React+Vite)
│   ├── frontend_hub_client/   # Hub Portal (React+Vite)
│   ├── frontend_workspace/    # Workspace (React+Vite)
│   ├── frontend_next_vista/   # Vista Digital (Next.js 15)
│   └── frontend_sidebar_desktop/ # Desktop (Tauri v2)
│
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   ├── api/                   # Documentación de APIs
│   ├── architecture/          # system-overview, rbac, security, multi-tenancy
│   └── ui-ux/                 # Prototipos (admin:3000, hub:3003, workspace:3001)
│
├── prd/                       # Product Requirement Documents
├── plans/                     # Planes de implementación temporales
├── reports/                   # Reportes generados
│
├── .claude/
│   ├── agents/                # 13 agentes especializados
│   ├── commands/              # create-prd, generate-report, onboard, pr-review
│   ├── hooks/                 # detect-doc-changes, sync-claude-md, task-alert
│   ├── rules/                 # agent-orchestration, code-style, security, ai-development
│   └── skills/                # 42 skills (django, drf, react, nextjs, tauri, ui)
│
├── CLAUDE.md                  # Instrucciones para Claude Code
├── AGENTS.md                  # Configuración de agentes (open standard)
└── README.md                  # Este archivo
```

---

## Documentación

- [Arquitectura del Sistema](docs/architecture/system-overview.md)
- [RBAC — Roles y Permisos](docs/architecture/rbac.md)
- [Seguridad](docs/architecture/security.md)
- [Multi-tenancy](docs/architecture/multi-tenancy.md)
- [Guía de Inicio](docs/guides/getting-started.md)
- [ADRs](docs/adr/)
- [PRDs](prd/features/)

---

## Contribuir

1. Crear rama desde `main`
2. Para features significativas: crear PRD en `prd/features/` primero
3. Seguir las reglas en `.claude/rules/`
4. Verificar que `make test && make lint` pasa antes del PR
5. Documentar decisiones arquitectónicas en `docs/adr/`
6. Nunca commitear secrets — usar `.env` (ver `.env.example`)
