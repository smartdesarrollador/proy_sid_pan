# CLAUDE.md - Project Configuration

## Project Overview

- **Name**: RBAC Subscription Platform
- **Description**: Multi-tenant SaaS with role-based access control and subscription billing
- **Language**: Python 3.11+
- **Framework**: Django REST Framework + PostgreSQL
- **Frontend**: React + Vite (Admin Panel, Hub Client Portal, Workspace), Next.js (Digital Services), Tauri v2 (Desktop)

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
POST /api/v1/auth/sso/validate/ → Validate SSO token (consumed by destination service)

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
- Frontend Admin: `apps/admin_panel/` (React + Vite)
- Frontend Client: `apps/client_panel/` (React + Vite)
- Digital Services: `apps/digital_services/` (Next.js)
- Desktop App: `apps/desktop/` (Tauri v2)
- UI Prototypes: `docs/ui-ux/`
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

**Prototipo**: `docs/ui-ux/prototype-hub-client/` | **PRD**: `prd/features/hub-client-portal.md`

### Relación Hub ↔ Admin Panel

| Responsabilidad | prototype-admin | prototype-hub-client |
|---|---|---|
| Gestionar usuarios y roles del tenant | ✅ | ❌ |
| Configurar catálogo de servicios | ✅ | ❌ |
| Ver logs de auditoría | ✅ | ❌ |
| Registro de nuevo tenant | ❌ | ✅ |
| Ver y acceder a servicios adquiridos | ❌ | ✅ |
| Gestionar propia suscripción | ❌ | ✅ |
| SSO hacia Workspace / Digital Services | ❌ | ✅ |

### Flujo SSO Hub → Servicio

```
1. POST /api/v1/auth/sso/token/  { "service": "workspace" }
   → { sso_token, expires_in: 60, redirect_url }
2. Hub redirige: https://workspace.app/?sso_token=...
3. Workspace: POST /api/v1/auth/sso/validate/  { sso_token }
   → { access_token, refresh_token, user }
4. Token invalidado tras primer uso (single-use, TTL 60s)
```

## Workflow Rules

- Always run `make test` before committing
- Follow conventional commits format
- Create PRD before implementing new features (see `prd/`)
- Document architectural decisions in `docs/adr/`
- Never commit secrets — use `.env` (see `.env.example`)
- Run `make makemigrations` + `make migrate` after any model change

## Custom Tools & Skills

- Skills: `.claude/skills/` (django-db-models, drf-auth, drf-core-api, drf-docs, drf-errors, drf-performance, drf-security, drf-testing, drf-utils, find-skills, nextjs-deployment, nextjs-routing-data, nextjs-seo-optimization, nextjs-server-components, nextjs-static-generation, react-accessibility, react-api-authentication, react-context-state, react-data-visualization, react-e2e-testing, react-error-handling, react-forms-validation, react-hooks-patterns, react-internationalization, react-performance-optimization, react-project-structure, react-router-patterns, react-suspense-streaming, react-tailwind-animations, react-tailwind-components, react-tanstack-query, react-testing-library, react-typescript-foundations, skill-creator, tauri-ipc-patterns, tauri-native-integration, tauri-project-setup, tauri-react-ui-patterns, ui-base-components, ui-design-tokens, ui-layout-system, vite-react-configuration)
- Commands: `.claude/commands/` (create-prd, generate-report, onboard, pr-review)
- Agents: `.claude/agents/` (api-documenter, billing-validator, code-reviewer, compliance-checker, database-optimizer, migration-manager, nextjs-builder, planner, react-vite-builder, researcher, security-auditor, tauri-desktop-builder, test-generator, ui-ux-designer)
- Rules: `.claude/rules/` (agent-orchestration, ai-development, code-style, security)
- Hooks: `.claude/hooks/` (detect-doc-changes.sh, sync-claude-md.sh, task-finished-alert.py)
- See `.claude/README.md` for full configuration reference
