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
| 21 | SSO: SSOToken + /sso/token/ + /sso/validate/ | auth_app | ⬜ | 2, 5, 22 |
| 22 | Services: Service + TenantService + catálogo | services (nueva) | ⬜ | 2, 6 |
| 23 | Referrals: ReferralCode + Referral + endpoint | referrals (nueva) | ⬜ | 2, 5, 22 |
| 24 | PaymentMethod LATAM + CRUD completo | subscriptions | ⬜ | 7, 6 |
| 25 | Hub Notifications: nueva categoría + endpoint | notifications | ⬜ | 2, apps existente |
| 26 | Permisos Hub: fixtures 62→64, roles update | rbac | ⬜ | 3, 23 |
| 27 | Register Hub: ReferralCode + TenantService auto | auth_app, tenants | ⬜ | 5, 22, 23 |
| 28 | OpenAPI Hub + tests cobertura + seed update | config, todos | ⬜ | 21–27 |

---

## PASO 21 — SSO: SSOToken + Endpoints ⬜

**Estado**: Pendiente
**App**: `apps/auth_app/` (modelos) + `apps/auth_app/sso_views.py` + `apps/auth_app/sso_urls.py`
**Dependencias**: PASO 2, PASO 5, PASO 22 (TenantService.status check)
**Archivos de referencia**: `docs/diagrams/sequence-diagram-sso.puml` · `docs/architecture/sso-architecture.md`

### Modelo — `SSOToken` en `apps/auth_app/models.py`

```python
class SSOToken(BaseModel):
    user = FK(User, CASCADE)
    tenant = FK(Tenant, CASCADE)
    service = CharField(50)   # 'workspace' | 'vista' | 'desktop'
    token = CharField(64, unique=True, db_index=True)  # secrets.token_hex(32), NO JWT
    used_at = DateTimeField(null=True, blank=True)
    expires_at = DateTimeField(db_index=True)          # created_at + 60s

    class Meta:
        db_table = 'sso_tokens'
        indexes = [Index(fields=['token']), Index(fields=['expires_at'])]
```

### Endpoints

**`POST /api/v1/auth/sso/token/`** (`IsAuthenticated`)
- Valida: tenant activo, TenantService.status=='active', plan >= service.min_plan
- Genera: `token = secrets.token_hex(32)` (64 chars), `expires_at = now() + timedelta(seconds=60)`
- INSERT SSOToken, INSERT AuditLog (`sso.token_created`, sin loguear token value)
- Response: `{ sso_token, expires_in: 60, redirect_url }`
- Errors: 403 si sin acceso, 404 si servicio no existe

**`POST /api/v1/auth/sso/validate/`** (sin auth — server-to-server)
- `SELECT ... FOR UPDATE` para atomicidad
- Verifica: `used_at IS NULL`, `expires_at > now()`
- UPDATE `used_at = now()` (single-use)
- Genera JWT access+refresh para el servicio destino
- INSERT AuditLog (`sso.token_validated`)
- Errors: 400 si used/expired, 404 si no existe; INSERT AuditLog (`sso.token_invalid`)

### Celery Task

`apps/auth_app/tasks.py` — `cleanup_expired_sso_tokens()` (periódica cada 5 min):
- DELETE tokens expirados sin usar (`expires_at < now()`)
- DELETE tokens usados con antigüedad > 1h (`used_at < now() - 1h`)

### Tests
`apps/auth_app/tests/test_sso.py`: happy path, token expirado, token ya usado, tenant suspendido, concurrency (doble validación simultánea)

---

## PASO 22 — Services & Catálogo ⬜

**Estado**: Pendiente
**App**: `apps/services/` (nueva)
**Dependencias**: PASO 2 (Tenant), PASO 6 (RBAC)
**Archivos de referencia**: `docs/diagrams/class-diagram-core.puml` (paquete Hub Services)

### Modelos — `apps/services/models.py`

```python
class Service(BaseModel):
    slug = SlugField(unique=True)            # 'workspace', 'vista', 'desktop'
    name = CharField(100)
    description = TextField(blank=True)
    icon = CharField(50)                     # nombre Lucide
    url_template = CharField(255)            # 'https://{subdomain}.workspace.app'
    min_plan = CharField(20, default='free') # free|starter|professional|enterprise
    is_active = BooleanField(default=True)

class TenantService(BaseModel):
    tenant = FK(Tenant, CASCADE)
    service = FK(Service, CASCADE)
    status = CharField(20, default='active')  # active|suspended|locked
    acquired_at = DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = [['tenant', 'service']]
```

### Fixture — `apps/services/fixtures/services.json`
3 servicios base: workspace (min_plan='free'), vista (min_plan='free'), desktop (min_plan='free')

### Endpoints (`IsAuthenticated`)

`GET /api/v1/app/services/` — Todos los servicios con campo `available` (plan check) y `status` si tiene TenantService
`GET /api/v1/app/services/active/` — Solo TenantService.status=='active' del tenant

### Signal
`post_save` en Tenant → crear TenantService para todos los Service con `min_plan='free'` automáticamente

### Tests
`apps/services/tests/test_services.py`: catálogo, filtro por plan, acceso suspendido

---

## PASO 23 — Referrals ⬜

**Estado**: Pendiente
**App**: `apps/referrals/` (nueva)
**Dependencias**: PASO 2 (Tenant), PASO 5 (register), PASO 22 (se activa desde signal)
**Archivos de referencia**: `prd/features/hub-client-portal.md`

### Modelos — `apps/referrals/models.py`

```python
class ReferralCode(BaseModel):
    tenant = OneToOneField(Tenant, CASCADE)
    code = CharField(50, unique=True, db_index=True)  # "REF-ACME-1A2B"

class Referral(BaseModel):
    referrer = FK(Tenant, CASCADE, related_name='given_referrals')
    referred = FK(Tenant, CASCADE, related_name='received_referrals')
    status = CharField(20, default='pending')  # pending|active|expired
    credit_amount = DecimalField(10,2, default=Decimal('29.00'))
    activated_at = DateTimeField(null=True)
    class Meta:
        unique_together = [['referrer', 'referred']]
```

### Lógica de generación de código
`ReferralCode.generate_code(tenant)` → slugify(name)[:8].upper() + '-' + uuid[:4].upper()

### Endpoint

`GET /api/v1/app/referrals/` (`HasPermission('referrals.read')`)
Response: `{ code, referral_url, stats: {referred, credits_earned, available_credits}, referrals: [...] }`

### Integración con Register
En `POST /api/v1/auth/register/`, aceptar parámetro opcional `ref_code`:
- Buscar ReferralCode por código → crear Referral(referrer=..., referred=nuevo_tenant, status='pending')
- Error silencioso si código inválido (no rompe el registro)

### Celery Task
`activate_pending_referrals()` (diaria):
- Busca Referral status='pending' con referred.subscription.status='active' y antigüedad > 7d
- Cambia a status='active', guarda activated_at
- Aplica crédito a próxima factura del referrer (campo `credit_balance` en Subscription)

### Tests
Registro con ref code válido/inválido, activación tras 7 días activos

---

## PASO 24 — PaymentMethod LATAM + CRUD Completo ⬜

**Estado**: Pendiente
**App**: `apps/subscriptions/` (extend modelos de PASO 7)
**Dependencias**: PASO 7, PASO 6
**Archivos de referencia**: `prd/features/billing.md` · prototipo billing tab

### Extensión del modelo `PaymentMethod` (PASO 7 añadió campos Stripe básicos)

Nuevos campos:
```python
external_type = CharField(20, blank=True)   # paypal|mercadopago|yape|plin|nequi|daviplata
external_email = EmailField(blank=True)     # PayPal, MercadoPago
external_phone = CharField(20, blank=True)  # Yape, Plin, Nequi, Daviplata
external_account_id = TextField(blank=True) # AES-256 cifrado (via utils/encryption.py)
```

### Endpoints (`/api/v1/admin/billing/payment-methods/`)

| Método | Endpoint | Permisos |
|--------|----------|----------|
| GET | `/admin/billing/payment-methods/` | `billing.read` |
| POST | `/admin/billing/payment-methods/` | `billing.manage` |
| PATCH | `/admin/billing/payment-methods/{id}/` | `billing.manage` |
| DELETE | `/admin/billing/payment-methods/{id}/` | `billing.manage` |

Lógica POST:
- Tipo `card` → Stripe API para tokenizar y guardar
- Tipos LATAM → almacenar `external_account_id` cifrado con AES-256
- Si `is_default=True` → UPDATE SET is_default=False para los demás del tenant
- No permitir DELETE del único método si hay suscripción activa

### Tests
CRUD completo, set-default logic, cifrado de datos sensibles, error al eliminar único método activo

---

## PASO 25 — Hub Notifications ⬜

**Estado**: Pendiente
**App**: `apps/notifications/` (extend app existente)
**Dependencias**: PASO 2 (Tenant), apps/notifications (existente del Admin Panel)
**Archivos de referencia**: `docs/diagrams/class-diagram-core.puml` (Notification model)

### Cambio en Modelo `Notification`
Agregar choice `'services'` al campo `category`:
```python
CATEGORY_CHOICES = [
    ('security', 'Seguridad'),
    ('billing', 'Facturación'),
    ('system', 'Sistema'),
    ('users', 'Usuarios'),
    ('roles', 'Roles'),
    ('services', 'Servicios'),   # NUEVA — solo Hub
]
```
Migración requerida.

### Endpoint Hub (nuevo)

`GET /api/v1/app/notifications/` (`IsAuthenticated`)
- Filtra: `category__in=['billing','security','services','system']` (excluye `users`, `roles`)
- Paginado: 20/página
- Ordena: `-created_at`

`POST /api/v1/app/notifications/{id}/read/` (`IsAuthenticated`)
`POST /api/v1/app/notifications/read-all/` (`IsAuthenticated`)

### Auto-notificaciones via Signals
- Trial vence en 7 días → notificación category='billing'
- Nueva factura disponible → notificación category='billing'
- Servicio suspendido → notificación category='services'

### Diferencias con endpoint Admin
- `/api/v1/admin/notifications/` → categorías: security, users, billing, system, roles
- `/api/v1/app/notifications/` → categorías: billing, security, services, system

### Tests
Filtros por categoría, marcar leídas, que usuarios no ven notificaciones de otros tenants (RLS)

---

## PASO 26 — Permisos Hub + Update Fixtures ⬜

**Estado**: Pendiente
**App**: `apps/rbac/` (actualizar fixtures PASO 3)
**Dependencias**: PASO 3 (fixtures de permisos), PASO 23 (referrals app)

### Nuevos permisos a agregar

```json
{ "codename": "referrals.read",   "name": "Ver Referidos",      "resource": "referrals", "action": "read" },
{ "codename": "referrals.manage", "name": "Gestionar Referidos", "resource": "referrals", "action": "manage" }
```

Esto eleva el total de 62 → **64 permisos**, 13 → **15 categorías**.

### Fixtures a actualizar

`apps/rbac/fixtures/permissions.json` — Agregar 2 nuevos permisos
`apps/rbac/fixtures/system_roles.json` — Asignar `referrals.read` + `referrals.manage` al rol Owner y Admin

### Comando
```bash
make seed-permissions   # recarga fixtures con los 64 permisos
```

### Verificación de permisos en endpoints Hub

Revisar que todos los endpoints del Hub tienen el decorador/clase de permiso correcto:
- `/app/services/` → `IsAuthenticated`
- `/auth/sso/token/` → `IsAuthenticated` + tenant check
- `/auth/sso/validate/` → Sin auth (server-to-server)
- `/app/referrals/` → `HasPermission('referrals.read')`
- `/app/notifications/` → `IsAuthenticated`
- `/admin/billing/payment-methods/` → `HasPermission('billing.manage')`

---

## PASO 27 — Integración Register Hub + Team Hub View ⬜

**Estado**: Pendiente
**App**: `apps/auth_app/` + `apps/tenants/`
**Dependencias**: PASO 5 (register), PASO 22 (Service signal), PASO 23 (ReferralCode)
**Archivos de referencia**: prototipo register/ (4 pasos) y team/

### Actualización del flujo de registro

`POST /api/v1/auth/register/` — Extender transacción atómica existente:

```python
# Pasos adicionales en la transacción:
# 5. CREATE ReferralCode(tenant=tenant, code=generate_code(tenant))
# 6. CREATE TenantService para cada Service con min_plan='free' (automático via signal)
# 7. Si ref_code en request.data:
#       code = ReferralCode.objects.get(code=ref_code)
#       Referral.objects.create(referrer=code.tenant, referred=tenant, status='pending')

# Parámetro nuevo en RegisterSerializer:
ref_code = serializers.CharField(required=False, allow_blank=True)
plan = serializers.CharField(required=False, default='free')  # ya planificado en PASO 5
```

### Endpoint Hub Team (vista limitada)

`GET /api/v1/app/team/` (`HasPermission('users.read')`) — Alias para `/admin/users/` pero sin acceso a roles avanzados
`POST /api/v1/app/team/invite/` (`HasPermission('users.invite')`) — Invitar con role basic (member/admin)
`POST /api/v1/app/team/{id}/suspend/` (`HasPermission('users.update')`)

*Nota*: Estos endpoints pueden ser reutilizaciones de `/admin/users/` con el mismo ViewSet — no código nuevo.

### Tests Integration
Test end-to-end del flujo Hub:
1. Registro con ref_code → ReferralCode creado + Referral pending
2. Login → JWT
3. GET /app/services/ → servicios disponibles
4. POST /auth/sso/token/ → token generado
5. POST /auth/sso/validate/ → JWT para Workspace
6. GET /app/referrals/ → stats

---

## PASO 28 — OpenAPI Hub + Tests de Cobertura Final ⬜

**Estado**: Pendiente
**App**: `config/` + todos los apps Hub
**Dependencias**: PASO 21–27, PASO 17 (OpenAPI base)

### OpenAPI / drf-spectacular

Agregar `@extend_schema` en las vistas Hub:
```python
# sso_views.py
@extend_schema(tags=['Hub - SSO'], summary='Genera token SSO de corta duración (TTL 60s)')
class SSOTokenView(APIView): ...

@extend_schema(tags=['Hub - SSO'], summary='Valida y consume token SSO (server-to-server)')
class SSOValidateView(APIView): ...

# services/views.py
@extend_schema(tags=['Hub - Servicios'])

# referrals/views.py
@extend_schema(tags=['Hub - Referrals'])

# notifications/hub_views.py
@extend_schema(tags=['Hub - Notificaciones'])
```

Agregar tags en `SPECTACULAR_SETTINGS` (base.py):
```python
'Hub - SSO', 'Hub - Servicios', 'Hub - Referrals', 'Hub - Notificaciones'
```

### Suite de tests final Hub
```bash
make test                                # todos los tests
# Objetivo: >80% coverage en apps Hub (services, referrals, sso, notifications hub)
pytest apps/services/ apps/referrals/ --cov=. --cov-report=term-missing
```

### Seed data — actualizar `seed_dev_data.py`
- Agregar `ReferralCode` para cada tenant seedeado
- Agregar `TenantService` con workspace+vista para cada tenant
- Agregar 3 `SSOToken` expirados + 1 válido para pruebas
- Agregar 2 `Referral` (1 pending, 1 active) entre los tenants de prueba

---

## Verificación Final Hub — Pasos 21–28

```bash
cd apps/backend_django
make migrate          # aplica migrations de services, referrals, sso_tokens, payment_method LATAM
make seed-permissions # recarga 64 permisos
make seed-data        # incluye ReferralCode + TenantService + SSOToken de prueba
make test             # suite completa
# Visitar: http://localhost:8000/api/docs/ → verificar tags Hub SSO, Servicios, Referrals, Notificaciones
```

### Orden de ejecución recomendado

```
PASO 22 (Services) → PASO 26 (Permisos) → PASO 21 (SSO)
      ↓                                          ↓
PASO 23 (Referrals) ← PASO 27 (Register) ← PASO 24 (Payments)
      ↓
PASO 25 (Notifications) → PASO 28 (OpenAPI + Tests)
```
