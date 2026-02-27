# Backend Django REST API — Roadmap de Implementación

**Stack**: Django 4.2 · DRF 3.14 · PostgreSQL 15 · Redis 7 · Docker · Celery · JWT · Stripe
**Directorio base**: `apps/backend_django/`
**Archivos de referencia**: `prd/technical/` · `docs/diagrams/`

---

## Progreso General

| Estado | Significado |
|--------|-------------|
| ✅ Completado | Implementado y funcional |
| 🔄 En progreso | Trabajo activo |
| ⬜ Pendiente | No iniciado |

---

## PASO 1 — Docker + Estructura del Proyecto ✅

**Estado**: Completado
**Fecha**: 2026-02-27

### Lo que se creó

```
apps/backend_django/
├── docker-compose.yml          ← postgres:15, redis:7, django, celery-worker, celery-beat
├── docker-compose.prod.yml     ← nginx + gunicorn para producción
├── Dockerfile                  ← Multi-stage: builder / dev / prod
├── Makefile                    ← make dev, test, migrate, seed-data, lint, etc.
├── manage.py
├── pyproject.toml              ← ruff + mypy + pytest config
├── .gitignore
├── .env.example                ← Todas las variables requeridas
├── requirements/
│   ├── base.txt               ← Django, DRF, psycopg2, JWT, Celery, Stripe, Crypto...
│   ├── dev.txt                ← pytest, ruff, mypy, debug-toolbar, drf-spectacular
│   └── prod.txt               ← gunicorn, whitenoise, sentry-sdk
├── config/
│   ├── urls.py                ← Todas las rutas /api/v1/auth|admin|app|public|support
│   ├── celery.py              ← App Celery con autodiscover
│   ├── asgi.py / wsgi.py
│   └── settings/
│       ├── base.py            ← DRF, JWT, Redis, Celery, CORS, Stripe, Spectacular
│       ├── dev.py             ← DEBUG=True, console email, verbose logging
│       └── prod.py            ← SSL, WhiteNoise, Sentry, hardened
├── core/
│   ├── models.py              ← BaseModel (UUID PK + timestamps) abstracto
│   ├── exceptions.py          ← PlanLimitExceeded, FeatureNotAvailable, TenantNotFound...
│   ├── views.py               ← GET /api/health/ (db + redis + celery check)
│   └── management/commands/  ← Directorio para management commands futuros
├── utils/
│   ├── decorators.py          ← Stubs: @require_permission, @require_feature, @check_plan_limit
│   ├── mixins.py              ← Stub: TenantModelViewSet base
│   ├── validators.py          ← validate_password_strength, validate_hex_color, validate_subdomain
│   └── cache.py               ← cache_result decorator, invalidate_tenant_cache
├── nginx/
│   └── nginx.conf             ← Reverse proxy config para producción
└── apps/
    ├── auth_app/              ← (stub) models, views, urls, admin_urls
    ├── tenants/               ← (stub) TenantMiddleware stub
    ├── rbac/
    ├── subscriptions/
    ├── projects/
    ├── tasks/
    ├── calendar_app/
    ├── notes/
    ├── contacts/
    ├── bookmarks/
    ├── env_vars/
    ├── ssh_keys/
    ├── ssl_certs/
    ├── snippets/
    ├── forms_app/
    ├── audit/
    ├── analytics/
    ├── sharing/
    ├── digital_services/      ← (stub) urls + public_urls
    └── support/
```

### Variables de entorno requeridas
`DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `EMAIL_HOST`, `AWS_S3_BUCKET`

### Para verificar
```bash
# Copiar variables de entorno
cp apps/backend_django/.env.example apps/backend_django/.env
# Levantar servicios (no migra aún — sin modelos)
cd apps/backend_django && docker-compose up db redis
```

---

## PASO 2 — Modelos Core: Tenant y User ⬜

**Archivos de referencia**: `prd/technical/data-models.md` (sección "Core Models") · `docs/diagrams/class-diagram-core.puml`

### Qué implementar

**`apps/tenants/models.py`** — Modelo `Tenant`:
- UUID PK, name, slug (unique), subdomain (unique, max 63)
- plan: free/starter/professional/enterprise (default='free')
- branding JSONField, settings JSONField, is_active
- Meta: db_table='tenants', indexes en slug y subdomain

**`apps/auth_app/models.py`** — Modelo `User` (AbstractBaseUser + PermissionsMixin):
- UUID PK, tenant FK(Tenant, CASCADE)
- email (unique), name, avatar_url
- password Argon2id, email_verified, is_active, is_staff
- mfa_enabled, mfa_secret (blank=True)
- last_login, created_at, updated_at
- USERNAME_FIELD='email', REQUIRED_FIELDS=['name']
- Custom UserManager con create_user y create_superuser
- Meta: db_table='users', indexes en email y tenant+email

**`core/models.py`** — ya existe `BaseModel` abstracto ✅

### Comandos a ejecutar
```bash
make migrate   # python manage.py migrate
# Resultado: tablas tenants y users creadas en PostgreSQL
```

### Tests a agregar
`apps/auth_app/tests/test_models.py`: crear tenant, crear user, constraint email único

---

## PASO 3 — Modelos RBAC: Role, Permission, UserRole ⬜

**Archivos de referencia**: `prd/technical/data-models.md` (sección "RBAC Models") · `prd/technical/rbac-roles-permissions.md`

### Qué implementar

**`apps/rbac/models.py`**:

1. `Permission`: UUID PK, codename (unique, ej: 'projects.create'), name, resource, action
2. `Role`: UUID PK, tenant FK (nullable=system role), name, description, is_system_role, inherits_from FK(self)
   M2M permissions via RolePermission, unique_together=[tenant, name]
3. `RolePermission`: UUID PK, role FK, permission FK, scope (all/own/department/custom)
   unique_together=[role, permission]
4. `UserRole`: UUID PK, user FK, role FK, assigned_by FK(User nullable)
   assigned_at, expires_at nullable, unique_together=[user, role]

**`apps/rbac/fixtures/permissions.json`** — Los 62 permisos del PRD (13 categorías)
**`apps/rbac/fixtures/system_roles.json`** — 4 roles: Owner, Service Manager, Member, Viewer

### Comandos a ejecutar
```bash
make migrate
make seed-permissions   # loaddata permissions system_roles
```

---

## PASO 4 — Datos Faker / Seeds ⬜

**Dependencias**: PASO 2, PASO 3

### Qué implementar

**`core/management/commands/seed_dev_data.py`**:
- 3 Tenants: "Acme Corp" (professional), "StartupXYZ" (starter), "FreeTier Inc" (free)
- Por tenant: 1 owner + 3-5 usuarios con diferentes roles
- Password fijo: `Password123!` para pruebas
- Idempotente con `get_or_create`
- Resumen al final: N tenants, N usuarios, N roles creados

**`core/management/commands/seed_permissions.py`**: wrapper de `loaddata`

### Comandos a ejecutar
```bash
make seed-data
# Output: 3 tenants, ~15 usuarios listos para pruebas
```

---

## PASO 5 — Autenticación JWT: Register, Login, Refresh, Logout ⬜

**Archivos de referencia**: `prd/technical/api-endpoints.md` (Auth) · `docs/diagrams/sequence-diagram-auth.puml`
**Dependencias**: PASO 2, PASO 3

### Qué implementar

**`apps/auth_app/serializers.py`**:
- `RegisterSerializer`: email único, password fuerte, crea Tenant+User en transacción atómica
- `LoginSerializer`: valida credenciales, verifica email_verified
- `RefreshTokenSerializer`, `UserSerializer`

**`apps/auth_app/views.py`** (APIView):
- `POST /api/v1/auth/register` — Crear tenant+usuario, enviar email verificación
- `POST /api/v1/auth/login` — JWT + si MFA activo → mfa_required=true
- `POST /api/v1/auth/refresh` — Renovar access token
- `POST /api/v1/auth/logout` — Blacklist refresh token
- `POST /api/v1/auth/verify-email` — Verificar token de email
- `POST /api/v1/auth/forgot-password` / `reset-password`

**`apps/tenants/middleware.py`** — Implementación completa:
- Lee `X-Tenant-Slug` header
- Inyecta `request.tenant`
- `SET app.tenant_id = '{uuid}'` en sesión PostgreSQL (RLS)

### JWT config (ya en base.py)
- access_token TTL=15min, refresh TTL=7 días, rotation ON, blacklist ON

### Tests a agregar
`apps/auth_app/tests/test_auth.py`: register exitoso, email duplicado, login correcto/incorrecto, refresh, logout

---

## PASO 6 — Middleware RBAC: Permisos y Feature Gates ⬜

**Archivos de referencia**: `prd/technical/rbac-roles-permissions.md` (RBAC Enforcement)
**Dependencias**: PASO 3, PASO 5

### Qué implementar

**`apps/rbac/permissions.py`**:
- `HasPermission(BasePermission)`: verifica codename via UserRole→Role→RolePermission
- `HasFeature(BasePermission)`: verifica plan del tenant incluye feature
- `check_limit(user, resource, count)`: verifica límite del plan

**`utils/decorators.py`** — Implementación completa:
- `@require_permission('projects.create')`
- `@require_feature('custom_roles')`
- `@check_plan_limit('projects', {'free':2,'starter':10})`

**`utils/mixins.py`** — Implementación completa de `TenantModelViewSet`

**`utils/plans.py`**:
```python
PLAN_FEATURES = {
    'free': {'max_users': 5, 'max_projects': 2, 'max_notes': 10, ...},
    'starter': {...},
    'professional': {...},
    'enterprise': {'max_users': None, ...}
}
```

### Tests a agregar
Owner puede todo, Member limitado, Free recibe 402 al superar límites

---

## PASO 7 — Modelos Suscripción + Stripe ⬜

**Archivos de referencia**: `prd/features/billing.md` · `prd/technical/data-models.md` (Subscription Models)
**Dependencias**: PASO 2, PASO 6

### Qué implementar

**`apps/subscriptions/models.py`**:
- `Subscription`: tenant OneToOne, plan, status, billing_cycle, stripe_ids, trial dates, period dates, cancel_at_period_end
- `Invoice`: tenant FK, stripe_invoice_id, amount, currency, status, pdf_url, dates
- `PaymentMethod`: tenant FK, stripe_payment_method_id, type, last4, exp, is_default

**`apps/subscriptions/stripe_client.py`**: `StripeClient` con create_customer, create_subscription, cancel, invoices, payment_method

**Views**:
- `GET /api/v1/admin/subscriptions/` — Estado actual
- `POST /api/v1/admin/subscriptions/upgrade/` — Con proration
- `POST /api/v1/admin/subscriptions/cancel/`
- `GET /api/v1/admin/billing/invoices/`
- `POST /api/v1/admin/billing/webhooks/` — Events: invoice.*, customer.subscription.*

---

## PASO 8 — CRUD Usuarios y Roles (Panel Admin) ⬜

**Archivos de referencia**: `prd/technical/api-endpoints.md` (ADMIN - USUARIOS Y ROLES)
**Dependencias**: PASO 5, PASO 6

### Endpoints a implementar

**Users** (`/api/v1/admin/users/`): listar, crear, detalle/editar/desactivar, invite, suspend, roles assign/remove
**Roles** (`/api/v1/admin/roles/`): CRUD, no eliminar is_system_role=True
**Permissions** (`/api/v1/admin/permissions/`): listar los 62

### Validaciones clave
- No asignar roles de otro tenant
- No degradar al único Owner
- Permisos: `users.read`, `users.create`, `roles.assign`

---

## PASO 9 — Módulo Proyectos CRUD + Encriptación AES-256 ⬜

**Archivos de referencia**: `prd/features/projects.md` · `prd/technical/data-models.md` (Project Models)
**Dependencias**: PASO 6, PASO 11 (se integra audit log después)

### Modelos
- `Project`, `ProjectSection`, `ProjectItem`, `ProjectItemField` (con is_encrypted)
- `ProjectMember`

### Utils
- `utils/encryption.py`: `encrypt_value(text)` / `decrypt_value(cipher)` con Fernet AES-256
- Auto-encripta si `field_type='password'` en `save()`

### Endpoints
- `ProjectViewSet` con límites por plan
- Nested routers para sections → items → fields
- `POST /items/{id}/reveal-password/` → registra en AuditLog
- `PATCH /sections/reorder/`

---

## PASO 10 — Compartición y Colaboración ⬜

**Archivos de referencia**: `prd/features/sharing-collaboration.md` · `docs/diagrams/sequence-diagram-sharing.puml`
**Dependencias**: PASO 9

### Modelos
- `Share`: project FK, shared_with FK, permission_level, expires_at, is_active
- `SharePermission`: share FK, resource_type/id, is_inherited

### Lógica de herencia
- Al crear Share → crear SharePermissions heredadas para secciones e items
- Signal `post_save` en ProjectSection/Item para propagar herencia

### Feature gates
- Free: ❌ | Starter: 5/proyecto | Pro: 50 | Enterprise: ∞

---

## PASO 11 — AuditLog Inmutable ⬜

**Archivos de referencia**: `prd/technical/data-models.md` (Audit Models)
**Dependencias**: PASO 5

### Modelo
- `AuditLog`: UUID PK, tenant FK, user FK nullable, action, resource_type, resource_id, changes JSON, ip_address, user_agent, timestamp (inmutable — no update/delete)

### Utils
- `core/mixins.py`: `AuditMixin` con `log_action(request, action, resource, changes)`

### Endpoints (solo lectura)
- `GET /api/v1/admin/audit-logs/` — filtros: user, action, date_from/to
- Retención por plan: Starter 30d, Pro 90d, Enterprise 365d (Celery task)

---

## PASO 12 — Servicios Productivos: Notes, Contacts, Bookmarks ⬜

**Archivos de referencia**: `prd/features/productivity-services.md`
**Dependencias**: PASO 6

### Modelos
- `Note`: user FK, title, content, category, is_pinned, color — full-text search Pro+
- `Contact`: user FK, name, email, phone, company, group — export CSV Starter+
- `Bookmark`: user FK, url, title, tags ArrayField — export JSON Pro+

### Límites por plan
- Notes: Free(10), Starter(100), Pro(1000), Enterprise(∞)
- Contacts: Free(25), Starter(100), Pro(∞)
- Bookmarks: Free(20), Starter(100), Pro(∞)

---

## PASO 13 — Servicios DevOps: EnvVars, SSH Keys, SSL Certs, Snippets ⬜

**Archivos de referencia**: `prd/features/devops-services.md`
**Dependencias**: PASO 6

### Modelos
- `EnvVariable`: AES-256 en value, unique(user, key, environment), reveal endpoint
- `SSHKey`: clave privada encriptada, fingerprint auto-calculado SHA-256
- `SSLCertificate`: parseo PEM con cryptography.x509, alertas Celery 30/7/1 días
- `Snippet`: full-text search, tags ArrayField

### Acceso
- EnvVars: Starter+ | SSH Keys: Starter(5), Pro(∞) | SSL: Starter(10) | Snippets: Free(10)

---

## PASO 14 — Servicios Admin: Forms, Reports ⬜

**Archivos de referencia**: `prd/features/admin-services.md`
**Dependencias**: PASO 6, PASO 11

### Implementar
- `Form` / `FormSubmission`: endpoint público `POST /api/v1/public/forms/{slug}/submit/`
- `TenantReport`: summary, usage (% de límites), trends (30d comparativa)
- Cache Redis TTL 5 min
- Celery task PDF report (Enterprise) con ReportLab

---

## PASO 15 — MFA (TOTP) y Email Verification ⬜

**Archivos de referencia**: `prd/technical/architecture.md` (Auth MFA)
**Dependencias**: PASO 5

### Endpoints
- `POST /auth/mfa/enable/` — QR code + 10 recovery codes
- `POST /auth/mfa/verify-setup/` — Activar con código TOTP
- `POST /auth/mfa/validate/` — Segundo factor en login
- `POST /auth/mfa/disable/` — Requiere password actual
- `POST /auth/mfa/recovery/` — Recovery code (one-time)

### Modelos
- `MFARecoveryCode`: user FK, code hashed, is_used
- `EmailVerificationToken`: user OneToOne, token UUID, expires_at 24h
- `PasswordResetToken`: user FK, token UUID, expires_at 1h, is_used

---

## PASO 16 — Tasks y Calendar ⬜

**Archivos de referencia**: `prd/technical/data-models.md` · `prd/technical/api-endpoints.md` (Tasks, Calendar)
**Dependencias**: PASO 6

### Modelos
- `TaskBoard`, `Task` (con subtareas FK self), `TaskComment`
- `CalendarEvent` (RRULE recurrence), `EventAttendee`

### Endpoints
- Tasks CRUD + `PATCH /tasks/reorder/` (Kanban)
- Calendar CRUD + filtro `?start=&end=`
- Límites calendar: Free(50/mes), Starter(200), Pro(∞)

---

## PASO 17 — Documentación OpenAPI + Swagger UI ⬜

**Archivos de referencia**: skill `drf-docs` disponible
**Dependencias**: PASO 5 → PASO 16

### Implementar
- `drf-spectacular` ya en requirements/dev.txt y SPECTACULAR_SETTINGS en base.py ✅
- Agregar `@extend_schema` en views principales (auth, admin, projects)
- Tags ya configurados en base.py ✅
- Verificar `GET /api/docs/` carga todos los endpoints

---

## PASO 18 — Digital Services ⬜

**Archivos de referencia**: `prd/features/digital-services.md` · `docs/diagrams/class-diagram-digital-services.puml`
**Dependencias**: PASO 6

### Modelos
- `PublicProfile`, `DigitalCard`, `LandingPage`, `PortfolioItem`, `CVDocument`

### Endpoints privados
- CRUD DigitalCard, LandingPage, PortfolioItem, CVDocument
- `POST /digital-card/generate-qr/` (qrcode lib)
- `GET /cv/export-pdf/` (weasyprint, Pro+)

### Endpoints públicos (`/api/v1/public/`)
- `GET /public/profile/{username}/` · `/card/` · `/portfolio/` · `/{item_slug}/`
- `POST /public/profile/{username}/contact/`

---

## PASO 19 — Support Tickets ⬜

**Archivos de referencia**: `prd/features/support.md` · CU-026/027 · US-113..117
**Dependencias**: PASO 6, PASO 11

### Modelos
- `SupportTicket`: status open/in_progress/waiting_client/resolved/closed, priority, category
- `TicketComment`: is_internal (solo agentes ven)

### Permisos diferenciados
- Cliente: solo sus tickets, no ve comentarios internos
- Agente (CSM): todos los tickets, asignar, ver internos

---

## PASO 20 — Rate Limiting + Production Hardening ⬜

**Archivos de referencia**: `.claude/rules/security.md` · `prd/technical/architecture.md` (Seguridad)
**Dependencias**: Todos los pasos anteriores

### Implementar
- Rate limiting por endpoint: login(5/min), register(3/hr), public(60/min), user(1000/hr-Free, 10000-Starter...)
- Security headers ya en base.py ✅ — completar configuración
- Health check `/api/health/` ya implementado ✅
- Suite de tests final: `coverage run manage.py test && coverage report --min-coverage=80`
- `docker-compose.prod.yml` ya creado ✅

---

## Verificación Final

```bash
cd apps/backend_django
cp .env.example .env
# (llenar variables en .env)
docker-compose up -d
make migrate
make seed-permissions
make seed-data
make test
# Visitar: http://localhost:8000/api/docs/
```

---

## Tabla Resumen

| # | Paso | Apps | Estado | Dependencias |
|---|------|------|--------|--------------|
| 1 | Docker + Estructura | todas (esqueleto) | ✅ | — |
| 2 | Modelos Tenant + User | tenants, auth_app | ⬜ | 1 |
| 3 | Modelos RBAC + Fixtures | rbac | ⬜ | 2 |
| 4 | Seeds/Faker | core | ⬜ | 2,3 |
| 5 | Auth JWT endpoints | auth_app | ⬜ | 2,3 |
| 6 | Middleware RBAC/Gates | rbac, core | ⬜ | 3,5 |
| 7 | Subscriptions + Stripe | subscriptions | ⬜ | 2,6 |
| 8 | CRUD Usuarios/Roles Admin | auth_app, rbac | ⬜ | 5,6 |
| 9 | Proyectos + Encriptación | projects | ⬜ | 6 |
| 10 | Compartición | sharing | ⬜ | 9 |
| 11 | AuditLog | audit | ⬜ | 5 |
| 12 | Notes/Contacts/Bookmarks | notes, contacts, bookmarks | ⬜ | 6 |
| 13 | EnvVars/SSH/SSL/Snippets | env_vars, ssh_keys, ssl_certs, snippets | ⬜ | 6 |
| 14 | Forms/Reports | forms_app, analytics | ⬜ | 6,11 |
| 15 | MFA + Email | auth_app | ⬜ | 5 |
| 16 | Tasks + Calendar | tasks, calendar_app | ⬜ | 6 |
| 17 | OpenAPI/Swagger | config | ⬜ | 5..16 |
| 18 | Digital Services | digital_services | ⬜ | 6 |
| 19 | Support Tickets | support | ⬜ | 6,11 |
| 20 | Rate Limiting + Hardening | config | ⬜ | todos |
