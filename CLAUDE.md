# CLAUDE.md - Project Configuration

## Project Overview

- **Name**: RBAC Subscription Platform
- **Description**: Multi-tenant SaaS with role-based access control and subscription billing
- **Language**: Python 3.11+
- **Framework**: Django REST Framework + PostgreSQL
- **Frontend**: React + Vite (`frontend_admin`, `frontend_workspace`), Next.js 15 App Router (`frontend_next_hub`, `frontend_next_vista`), Tauri v2 (`frontend_sidebar_desktop`)

## Backend Development — `apps/backend_django/`

All backend work happens inside `apps/backend_django/`. Run commands from there.

```bash
# Docker (preferred)
make dev             # Start all containers (django + postgres + redis + celery)
make down            # Stop all containers
make build           # Rebuild Docker images
make logs            # Tail container logs

# Database
make migrate         # Apply migrations
make makemigrations  # Create new migrations
make seed-permissions  # Load permissions and system roles fixtures
make seed-data       # Generate dev seed data (tenants, users)
make superuser       # Create Django superuser

# Quality
make test            # Run test suite (pytest)
make lint            # Run ruff linter
make format          # Auto-format code with ruff
make typecheck       # Run mypy type checker

# Utils
make shell           # Open Django shell_plus
make clean           # Remove containers, volumes and cache files
```

## Backend Source Layout

```
apps/backend_django/
├── apps/                   # Django applications
│   ├── auth_app/           # Authentication, JWT, MFA, registration
│   ├── rbac/               # Roles, permissions, RBAC engine
│   ├── tenants/            # Multi-tenancy (tenant isolation)
│   ├── subscriptions/      # Plans, billing, Stripe integration
│   ├── audit/              # Immutable audit log (AuditMixin)
│   ├── projects/           # Projects, sections, items, fields
│   ├── tasks/              # Task management
│   ├── calendar_app/       # Calendar events
│   ├── notes/              # Notes (pinned, categories)
│   ├── contacts/           # Contacts and contact groups
│   ├── bookmarks/          # Bookmarks and collections
│   ├── env_vars/           # Encrypted environment variables
│   ├── ssh_keys/           # SSH key management (AES encrypted)
│   ├── ssl_certs/          # SSL certificate tracking
│   ├── snippets/           # Code snippets
│   ├── forms_app/          # Forms and form responses
│   ├── analytics/          # Reports and analytics (Redis cache)
│   ├── digital_services/   # Digital/public services (Next.js)
│   ├── sharing/            # Share items between users
│   ├── support/            # Support tickets
│   ├── notifications/      # In-app notifications (bell, alerts)
│   └── promotions/         # Discount codes and promotional campaigns
├── config/
│   ├── settings/           # base.py, dev.py, prod.py
│   ├── urls.py             # Root URL configuration
│   ├── celery.py           # Celery configuration
│   └── wsgi.py / asgi.py
├── core/                   # Shared base classes
│   ├── models.py           # BaseModel (uuid pk, timestamps)
│   ├── mixins.py           # AuditMixin, TenantMixin
│   ├── exceptions.py       # Custom exception handlers
│   └── views.py            # health_check, etc.
├── utils/                  # Shared utilities
│   ├── plans.py            # Plan limits + check_plan_limit()
│   ├── encryption.py       # AES encryption helpers
│   ├── mixins.py           # Queryset mixins
│   ├── cache.py            # Redis cache helpers
│   ├── decorators.py       # Reusable decorators
│   └── validators.py       # Common validators
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── Makefile
├── manage.py
├── docker-compose.yml
└── pyproject.toml
```

## API Layout

```
/api/v1/auth/         → Authentication (login, register, MFA, SSO)
/api/v1/admin/        → Admin panel (users, roles, billing, audit, promotions)
/api/v1/app/          → App endpoints (projects, tasks, calendar, notes, services…)
/api/v1/public/       → Public endpoints (no auth required)
/api/v1/support/      → Support tickets
/api/v1/features/     → Plan features (FeaturesView)
/api/health/          → Health check
/api/docs/            → Swagger UI
/api/redoc/           → ReDoc

# SSO endpoints (Hub → services)
POST /api/v1/auth/sso/token/    → Generate short-lived SSO token (TTL 60s, single-use)
POST /api/v1/auth/sso/validate/ → Validate SSO token → { access_token, refresh_token, user, tenant }

# Hub-specific endpoints
GET  /api/v1/app/services/        → Service catalog available for tenant
GET  /api/v1/app/services/active/ → Active (acquired) services for tenant
```

## Code Style

- Use type hints for all function signatures
- Prefer Pydantic / DRF Serializers over raw dicts
- Use `select_related` / `prefetch_related` to avoid N+1 queries
- Keep views under 50 lines; move business logic to services or managers
- Follow ruff formatting rules (see `pyproject.toml`)
- See `.claude/rules/` for detailed rules

## Key Patterns

- **Plan gating**: `check_plan_limit(user, 'feature_key', current_count)` → raises 402 if over limit
- **Feature permissions**: `HasFeature('feature_key')` permission class on views
- **Audit logging**: Use `AuditMixin` on views that mutate data
- **Encryption**: `save()` auto-encrypts sensitive fields; `is_encrypted=False` triggers re-encrypt on PATCH
- **Analytics**: No DB models — computed on-demand with Redis cache (5 min TTL)
- **Celery tasks**: `apps/{app}/tasks.py` for async/periodic jobs

## Architecture

- See `docs/architecture/system-overview.md` for system design
- See `docs/adr/` for Architecture Decision Records
- See `docs/api/` for API documentation
- See `docs/diagrams/` for architecture diagrams
- See `prd/` for Product Requirements Documents

## File Boundaries

- Backend source: `apps/backend_django/`
- Frontend Admin: `apps/frontend_admin/` (React + Vite, puerto 5173)
- Hub Client Portal: `apps/frontend_next_hub/` (Next.js 15 App Router, puerto 4000)
- Workspace: `apps/frontend_workspace/` (React + Vite)
- Vista / Digital Services: `apps/frontend_next_vista/` (Next.js App Router)
- Desktop App: `apps/frontend_sidebar_desktop/` (Tauri v2 + React)
- UI Prototypes: `docs/ui-ux/` (prototypes con datos mock)
  - `docs/ui-ux/prototype-admin/`      → Admin Panel prototype (puerto 3000)
  - `docs/ui-ux/prototype-hub-client/` → Hub Client Portal prototype (puerto 3003)
  - `docs/ui-ux/prototype-workspace/`  → Workspace (productividad) prototype (puerto 3001)
  - `docs/ui-ux/prototype-vista/`      → Vista prototype
- Documentation: `docs/`
- Plans / specs: `plans/`, `prd/`

## Hub Client Portal

El Hub es el punto de entrada unificado para todos los clientes (tenants). Gestiona:
- Registro de nuevo tenant y onboarding
- Catálogo de servicios activos y disponibles (upgrade)
- SSO de corta duración hacia servicios (Workspace, Digital Services, Desktop)
- Gestión propia de suscripción y billing
- Notificaciones y soporte al cliente

**App real**: `apps/frontend_next_hub/` | **Prototipo**: `docs/ui-ux/prototype-hub-client/` | **PRD**: `prd/features/hub-client-portal.md`

### Relación Hub ↔ Admin Panel

| Responsabilidad | prototype-admin | prototype-hub-client |
|---|---|---|
| Gestionar usuarios y roles del tenant | ✅ | ❌ |
| Configurar catálogo de servicios | ✅ | ❌ |
| Ver logs de auditoría | ✅ | ❌ |
| Registro de nuevo tenant | ❌ | ✅ |
| Ver y acceder a servicios adquiridos | ❌ | ✅ |
| Gestionar propia suscripción | ❌ | ✅ |
| SSO hacia Workspace / Vista | ❌ | ✅ |

### Flujo SSO Hub → Servicio

```
1. POST /api/v1/auth/sso/token/  { "service": "workspace" | "vista" }
   → { sso_token, expires_in: 60, redirect_url }
   Hook: apps/frontend_next_hub/src/features/services/hooks/useSSO.ts
   Botón: apps/frontend_next_hub/src/features/services/components/SSOLaunchButton.tsx

2. Hub redirige: window.location.href = data.redirect_url

3. Servicio valida token:
   POST /api/v1/auth/sso/validate/  { sso_token }
   → { access_token, refresh_token, user, tenant }
   Token invalidado tras el primer uso (single-use, TTL 60s)

4. Sesión local por servicio:
   - Workspace (/sso/callback):  ws-refreshToken, ws-authUser, ws-authTenant en localStorage
   - Vista (/[locale]/sso):      refreshToken en localStorage + accessToken en cookie (max-age 3600)
```

**Backend SSO (ya implementado):**
- `SSOTokenView` (`apps/backend_django/apps/auth_app/sso_views.py`): valida tenant activo + `TenantService.status == 'active'`, genera `secrets.token_hex(32)`, TTL 60s
- `SSOValidateView`: `select_for_update()` + `atomic()`, marca `used_at`, audita en `AuditLog`
- `SSOToken` model en `apps/auth_app/models.py`, migration `0004_ssotoken`

## Arquitectura de Frontends

| App | Ruta | Framework | Puerto dev | Auth storage |
|-----|------|-----------|-----------|--------------|
| Admin Panel | `apps/frontend_admin/` | React + Vite | 5173 | `authUser`, `authTenant` en localStorage |
| Hub Client Portal | `apps/frontend_next_hub/` | Next.js 15 App Router | 4000 | `hub-accessToken`, `hub-refreshToken`, `hub-authUser`, `hub-authTenant` en localStorage |
| Workspace | `apps/frontend_workspace/` | React + Vite | — | `ws-refreshToken`, `ws-authUser`, `ws-authTenant` (prefijo `ws-`) |
| Vista | `apps/frontend_next_vista/` | Next.js App Router | — | `refreshToken` en localStorage + `accessToken` en cookie |
| Desktop | `apps/frontend_sidebar_desktop/` | Tauri v2 + React | — | — |

### Dominios (local vs producción)

Local usa hosts `*.local.test` (mapeados a 127.0.0.1); producción usa Traefik/Dokploy bajo `digisider.com`.

| App | Local | Producción | Variable Traefik (Dokploy) |
|-----|-------|------------|------------------------------|
| Backend Django (API) | `http://rbac.local.test` | `https://api-rbac.digisider.com` | hardcoded en `docker-compose.dokploy.yml` |
| Hub Client Portal | `http://hub.local.test` (o `localhost:5175`) | `https://digisider.com` (dominio raíz, ya NO `hub.digisider.com`) | `HUB_DOMAIN` |
| Admin Panel | `http://rbac-admin.local.test` (o `localhost:5173`) | `https://${ADMIN_DOMAIN}` (`admin.digisider.com`) | `ADMIN_DOMAIN` |
| Workspace | `http://workspace.local.test` | `https://${WORKSPACE_DOMAIN}` | `WORKSPACE_DOMAIN` |
| Vista | `http://next-vista.local.test` | `https://${VISTA_DOMAIN}` | `VISTA_DOMAIN` |
| Desktop (Tauri) | `VITE_API_URL=http://rbac.local.test` | `VITE_API_URL=https://api-rbac.digisider.com`, `VITE_HUB_URL=https://digisider.com` | — (no se despliega vía Dokploy) |

**Notas**:
- Los hosts `*.local.test` deben estar en `CORS_ALLOWED_ORIGINS` / `ALLOWED_HOSTS` de `apps/backend_django/.env`.
- `ADMIN_DOMAIN`, `WORKSPACE_DOMAIN`, `VISTA_DOMAIN`, `HUB_DOMAIN` se configuran en la pestaña **Environment** de cada app en Dokploy (no hardcodeados en el repo, salvo el `.env.example` de cada app como referencia).
- El Hub migró de subdominio propio (`hub.digisider.com`) al dominio raíz (`digisider.com`) — ver `apps/frontend_next_hub/.env.example`.

### Vista — Features del área autenticada (`frontend_next_vista`)

- `tarjeta` — editor de tarjeta digital + vista pública `/tarjeta/[username]`
- `portafolio` — grid de proyectos + vista pública `/portafolio/[username]`
- `landing` — builder de landing page + vista pública `/landing/[username]`
- `cv` — CV/resume con templates + vista pública `/cv/[username]`
- i18n via `next-intl` con `[locale]` en App Router
- Dashboard en `/(authenticated)/dashboard`
- Session restore: `useSessionRestore` hook en authenticated layout

## Tipos de Usuario y Control de Acceso

### Quién puede acceder a qué

| Tipo de usuario | Condición en BD | Apps accesibles | Apps bloqueadas |
|----------------|-----------------|-----------------|-----------------|
| **Superadmin / Staff** | `user.is_staff = True` | Admin Panel (`frontend_admin`) | Hub, Workspace, Vista (no aplica, son para clientes) |
| **Cliente / Tenant** | `user.is_staff = False`, tenant activo | Hub Client, Workspace, Vista, Desktop | Admin Panel |
| **Anónimo** | Sin autenticación | Vistas públicas de Vista únicamente | Todo lo demás |

**Restricción crítica**: Los clientes (`is_staff=False`) NO pueden acceder al Admin Panel en ningún caso. El `ProtectedRoute` de `frontend_admin` verifica `user.is_staff === true` y redirige a `/login` si no se cumple. Intentar loguear a un cliente en el Admin Panel resulta en un error de acceso.

**Plan del tenant vs RBAC (conceptos separados)**:
- `Tenant.plan` (free/starter/professional/enterprise) → controla **qué features de producto** puede usar el cliente (landing page, portfolio, MFA, etc.)
- **Roles RBAC** (Owner, Editor, Viewer, roles custom) → controlan **qué acciones** puede hacer el usuario dentro del Workspace (crear proyectos, gestionar contactos, etc.)
- El plan se lee de `user.tenant_plan` en el `UserSerializer` → propagado a `authStore.currentPlan` en todos los frontends de clientes

### Vistas públicas (sin autenticación)

Solo en `frontend_next_vista`:
- `/[locale]/tarjeta/[username]` — Tarjeta digital pública
- `/[locale]/landing/[username]` — Landing page pública
- `/[locale]/portafolio/[username]` — Portfolio público
- `/[locale]/portafolio/[username]/[slug]` — Detalle de proyecto
- `/[locale]/cv/[username]` — CV público

---

## Arquitectura de Autenticación

### Flujo 1: Login directo (Admin Panel + Hub)

```
POST /api/v1/auth/login { email, password }
  → Si MFA desactivado: { access_token, refresh_token, user, tenant }
  → Si MFA activado:    { mfa_required: true, mfa_token }

POST /api/v1/auth/mfa/validate { mfa_token, totp_code }
  → { access_token, refresh_token, user, tenant }

Admin Panel verifica: user.is_staff === true → accede al dashboard
Hub verifica: cualquier usuario autenticado con tenant activo
```

**Registro**: `POST /api/v1/auth/register` crea Tenant + User simultáneamente. Envía email de verificación. Usuario debe verificar email antes de poder loguear.

**Invitación**: Admin invita usuario → email con link → `POST /api/v1/auth/accept-invite` activa cuenta y establece contraseña.

### Flujo 2: SSO Hub → Workspace / Vista

```
1. Hub: POST /api/v1/auth/sso/token/ { service: "workspace" | "vista" }
   → { sso_token, redirect_url, expires_in: 60 }
   Genera: secrets.token_hex(32) → 64 chars opaco, TTL 60s, single-use

2. Browser: window.location.href = redirect_url
   Workspace: /sso/callback?sso_token=<token>
   Vista:     /[locale]/sso?sso_token=<token>

3. Destino: POST /api/v1/auth/sso/validate/ { sso_token }
   → { access_token, refresh_token, user, tenant }
   Validación: select_for_update() + atomic() → marca used_at → AuditLog

4. Almacenamiento por servicio:
   Workspace → ws-refreshToken, ws-authUser, ws-authTenant en localStorage
   Vista     → refreshToken en localStorage + accessToken en cookie (max-age 3600)
```

**Validaciones del SSO token**: tenant activo, TenantService.status=='active', token no expirado, token no usado. Error 410 si expirado o ya usado.

**Archivos clave**:
- `apps/backend_django/apps/auth_app/sso_views.py` — SSOTokenView, SSOValidateView
- `apps/frontend_next_hub/src/features/services/hooks/useSSO.ts`
- `apps/frontend_next_hub/src/features/services/components/SSOLaunchButton.tsx`
- `apps/frontend_workspace/src/features/auth/SSOCallbackPage.tsx`
- `apps/frontend_next_vista/src/app/[locale]/(auth)/sso/page.tsx`

### Flujo 3: Deep Link Desktop (rbacdesktop://)

```
1. Desktop genera nonce UUID → guarda en localStorage: "desktop-auth-state"
2. Tauri: invoke('open_hub_login', { stateNonce }) → abre webview del Hub con
   ?source=desktop&state=<nonce>

3. Usuario se autentica en Hub (login normal)

4. Hub detecta source=desktop en URL params → construye deep link:
   rbacdesktop://auth?payload=<base64(JSON { access_token, refresh_token, user, tenant })>&state=<nonce>

5. Desktop: pollea invoke('poll_deep_link_url') cada 500ms (timeout: 120s)
   → Valida state nonce (anti-CSRF)
   → Decodifica payload base64 → extrae tokens + user + tenant
   → Almacena en Zustand + localStorage
   → Navega al dashboard autenticado
```

**Archivos clave**:
- `apps/frontend_sidebar_desktop/src/features/auth/useDesktopAuth.ts`
- `apps/frontend_next_hub/src/features/auth/LoginPage.tsx` (buildDesktopRedirectUrl)

### Session Restore (Vista / Next.js)

El hook `useSessionRestore` se ejecuta en el layout autenticado (`/(authenticated)/layout.tsx`):

```
1. Si isAuthenticated en Zustand → no hace nada
2. Si no hay refreshToken en localStorage → redirect a Hub: HUB_URL/login?next=vista
3. POST /api/v1/auth/token/refresh/ { refresh_token }
   → { access_token, refresh_token }
4. GET /api/v1/auth/profile/ → { user, tenant }
   Setea user en Zustand (incluye tenant_plan)
5. Cookie: accessToken=<token>; path=/; max-age=3600 (para SSR en Next.js)
```

---

## Planes y Feature Gates

### Límites de recursos por plan (backend — `utils/plans.py`)

| Recurso | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| max_users | 5 | 10 | 25 | ∞ |
| max_projects | 2 | 10 | ∞ | ∞ |
| max_contacts | 25 | 100 | ∞ | ∞ |
| max_custom_roles | 0 | 3 | 10 | ∞ |
| max_ssh_keys | 0 | 5 | ∞ | ∞ |
| storage_gb | 1 | 5 | 20 | ∞ |
| api_calls_per_month | 1,000 | 10,000 | 100,000 | ∞ |
| audit_log_days | 7 | 30 | 365 | 2,555 |

Features de backend por plan: `mfa` (professional+), `sso` (enterprise), `webhooks` (professional+), `custom_domain` (enterprise), `audit_logs` (professional+), `sharing` (starter+), `analytics` (starter+)

### Features digitales por plan (frontend — `featureGates.ts` en Vista)

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| digitalCard | ✓ | ✓ | ✓ | ✓ |
| digitalCardQR / VCard | ✗ | ✓ | ✓ | ✓ |
| landingPage | ✗ | ✓ | ✓ | ✓ |
| landingCustomCSS | ✗ | ✗ | ✓ | ✓ |
| portfolio | ✗ | ✗ | ✓ | ✓ |
| cv | ✓ | ✓ | ✓ | ✓ |
| cvPDFExport | ✗ | ✓ | ✓ | ✓ |
| customDomain | ✗ | ✗ | ✗ | ✓ |
| whiteLabel | ✗ | ✗ | ✗ | ✓ |

**Verificación frontend**: `useFeatureGate('portfolio').canAccess` → boolean basado en `authStore.currentPlan`
**Verificación backend**: `check_plan_limit(user, 'feature_key', current_count)` → 402 si supera límite
**`tenant_plan`** se propaga desde `UserSerializer.get_tenant_plan()` → `user.tenant.plan` → todos los auth responses

### Almacenamiento de Auth por App

| App | localStorage keys | Cookie | Acceso |
|-----|------------------|--------|--------|
| `frontend_admin` | `refreshToken`, `authUser`, `authTenant` | — | Solo `is_staff=True` |
| `frontend_next_hub` | `hub-accessToken`, `hub-refreshToken`, `hub-authUser`, `hub-authTenant` | — | Cualquier tenant |
| `frontend_workspace` | `ws-refreshToken`, `ws-authUser`, `ws-authTenant` | — | Via SSO o login directo |
| `frontend_next_vista` | `refreshToken` | `accessToken` (max-age 3600) | Via SSO o session restore |
| `frontend_sidebar_desktop` | localStorage via Tauri store | — | Via deep link del Hub |

---

## Workflow Rules

- Always run `make test` before committing
- Follow conventional commits format
- Create PRD before implementing new features (see `prd/`)
- Document architectural decisions in `docs/adr/`
- Los ADR son inmutables: si una decisión cambia con el tiempo, no se edita el ADR
  existente — se crea uno nuevo (ej. `005-...md`) y se actualiza el `Estado` del ADR
  anterior a `Reemplazado por ADR-00X`
- Never commit secrets — use `.env` (see `.env.example`)
- Run `make makemigrations` + `make migrate` after any model change
- Al completar una funcionalidad o corregir un bug, actualizar `BACKLOG.md`:
  - Mover pendientes resueltos fuera de la lista
  - Agregar nueva deuda técnica o ideas de feature que hayan surgido durante el trabajo,
    citando el reporte de origen si existe
- Tras resolver un problema **no trivial** (causa raíz no obvia, o probable que reaparezca),
  destilar la lección en el skill `lessons-learned` (entrada `LL-0XX` en
  `.claude/skills/lessons-learned/references/knowledge-base.md`), además del reporte en
  `reports/` y de `BACKLOG.md`. Antes de depurar, consultar primero esa KB (puede que ya esté resuelto)
- Si el cambio tocó el **harness** (skills, hooks, reglas o este `CLAUDE.md`), correr la suite de
  `evals/` y revisar `evals/observations/runs.md` antes de dar por cerrado

## Sistema de conocimiento del proyecto

Además de los skills genéricos de framework, este repo tiene una capa propia de **conocimiento +
medición del agente**. Usarla activamente:

**Skills específicos del proyecto** (distintos de los `drf-*`/`react-*`/`tauri-*` genéricos):
- `lessons-learned` — KB de incidencias del proyecto (síntoma → causa raíz → solución → prevención,
  entradas `LL-001…LL-091` en 9 secciones). **CONSULTAR** (grep en `references/knowledge-base.md`) antes
  de depurar un bug; **REGISTRAR** una entrada nueva tras resolver algo no trivial.
- `dokploy-deploy` — desplegar/redeployar las apps en el VPS (Dokploy + Traefik).
- `new-admin-feature` — andamiar una sección nueva del Admin Panel con las convenciones del repo.

**Capa de medición** (¿el harness mejora?):
- `evals/` — 5 tareas-patrón con rúbrica + `RESULTS.md` (línea base/comparación). Correr tras tocar el harness.
- `evals/observations/runs.md` — traza automática por sesión (qué skills/tools usó, si consultó la KB,
  si corrió tests); generada por el hook `observability-run-log.py`.

**Guías**: `docs/guides/project-skills.md` y `docs/guides/evals-y-observability.md`.

## Custom Tools & Skills

- Skills: `.claude/skills/` (django-db-models, dokploy-deploy, drf-auth, drf-core-api, drf-docs, drf-errors, drf-performance, drf-security, drf-testing, drf-utils, find-skills, lessons-learned, new-admin-feature, nextjs-deployment, nextjs-routing-data, nextjs-seo-optimization, nextjs-server-components, nextjs-static-generation, react-accessibility, react-api-authentication, react-context-state, react-data-visualization, react-e2e-testing, react-error-handling, react-forms-validation, react-hooks-patterns, react-internationalization, react-performance-optimization, react-project-structure, react-router-patterns, react-suspense-streaming, react-tailwind-animations, react-tailwind-components, react-tanstack-query, react-testing-library, react-typescript-foundations, skill-creator, tauri-ipc-patterns, tauri-native-integration, tauri-project-setup, tauri-react-ui-patterns, ui-base-components, ui-design-tokens, ui-layout-system, update-backlog, vite-react-configuration)
- Commands: `.claude/commands/` (create-prd, generate-report, onboard, pr-review)
- Agents: `.claude/agents/` (api-documenter, billing-validator, code-reviewer, compliance-checker, database-optimizer, migration-manager, nextjs-builder, planner, react-vite-builder, researcher, security-auditor, tauri-desktop-builder, test-generator, ui-ux-designer)
- Rules: `.claude/rules/` (agent-orchestration, ai-development, code-style, security)
- Hooks: `.claude/hooks/` (detect-doc-changes.sh, lessons-learned-consult.sh, sync-claude-md.sh, observability-run-log.py, task-finished-alert.py)
- See `.claude/README.md` for full configuration reference
