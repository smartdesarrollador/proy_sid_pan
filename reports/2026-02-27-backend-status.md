# Reporte de Estado — Backend Django REST API
**Fecha**: 2026-02-27
**Directorio base**: `apps/backend_django/`
**Rama activa**: `feature/migrations`
**Stack**: Django 4.2 · DRF 3.14 · PostgreSQL 15 · Redis 7 · Celery · JWT (Argon2id)

---

## Resumen Ejecutivo

El backend se encuentra en fase de construcción de infraestructura core. De los 20 pasos
definidos en el roadmap, **2 están completados** (10%) y los 18 restantes están pendientes.
Los dos primeros pasos cubren la base arquitectónica completa: contenedores, configuración,
modelos fundacionales y esquema de base de datos. El proyecto no tiene deuda técnica crítica,
aunque hay bloqueantes operacionales (Docker Desktop inactivo) que impiden ejecutar tests y
aplicar migraciones.

| Métrica | Valor |
|---------|-------|
| Pasos completados | 2 / 20 (10%) |
| Apps con modelos implementados | 2 / 21 |
| Archivos Python del backend | ~110 |
| Tests escritos | 9 |
| Tests ejecutados | 0 (Docker inactivo) |
| Migraciones generadas | 2 |
| Migraciones aplicadas | 0 (Docker inactivo) |
| TODOs / FIXMEs en código | 0 |

---

## 1. Progreso del Roadmap

### ✅ PASO 1 — Docker + Estructura del Proyecto
**Completado**: ~2026-02-22

Se estableció toda la infraestructura de desarrollo y producción:

| Componente | Archivo | Estado |
|------------|---------|--------|
| Docker Compose dev | `docker-compose.yml` | ✅ postgres:15, redis:7, django, celery-worker, celery-beat |
| Docker Compose prod | `docker-compose.prod.yml` | ✅ nginx + gunicorn |
| Dockerfile | `Dockerfile` | ✅ Multi-stage: builder / dev / prod |
| Automatización | `Makefile` | ✅ dev, test, migrate, seed, lint, superuser |
| Configuración base | `config/settings/base.py` | ✅ DRF, JWT, Redis, Celery, CORS, Stripe |
| Configuración dev | `config/settings/dev.py` | ✅ DEBUG, console email, verbose logging |
| Configuración prod | `config/settings/prod.py` | ✅ SSL, WhiteNoise, Sentry |
| Rutas globales | `config/urls.py` | ✅ 21 grupos de rutas /api/v1/* |
| Modelo base | `core/models.py` | ✅ `BaseModel` (UUID PK + timestamps) |
| Excepciones | `core/exceptions.py` | ✅ 6 excepciones + handler global |
| Health check | `core/views.py` | ✅ GET /api/health/ (db + redis + celery) |
| Validators | `utils/validators.py` | ✅ password_strength, hex_color, subdomain |
| Cache | `utils/cache.py` | ✅ `cache_result` decorator, invalidate |
| Decorators | `utils/decorators.py` | ⬜ Stubs: @require_permission, @require_feature |
| Mixins | `utils/mixins.py` | ⬜ Stub: TenantModelViewSet |
| Nginx | `nginx/nginx.conf` | ✅ Reverse proxy configurado |
| 21 apps Django | `apps/*/` | ✅ Estructura creada, `models.py` vacíos |

**Dependencias clave instaladas** (`requirements/base.txt`):
- `Django==4.2.11` + `djangorestframework==3.14.0`
- `psycopg2-binary==2.9.9` · `redis==5.0.3` · `django-redis==5.4.0`
- `djangorestframework-simplejwt==5.3.1` · `django[argon2]==4.2.11`
- `cryptography==42.0.5` · `pyotp==2.9.0` · `stripe==8.9.0`
- `celery==5.3.6` · `drf-spectacular` · `Faker==23.3.0`

---

### ✅ PASO 2 — Modelos Core: Tenant y User
**Completado**: 2026-02-27

Implementación de los dos modelos fundacionales del sistema multi-tenant.

#### `apps/tenants/models.py` — Modelo `Tenant`

```
Hereda: BaseModel (UUID PK + created_at + updated_at)
Tabla:  tenants
```

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `UUIDField` (PK) | Heredado de BaseModel |
| `name` | `CharField(255)` | Nombre de la organización |
| `slug` | `SlugField` | Único, identificador URL-friendly |
| `subdomain` | `CharField(63)` | Único, validado con `validate_subdomain` |
| `plan` | `CharField` choices | free / starter / professional / enterprise |
| `branding` | `JSONField` | `{logo_url, primary_color, ...}` |
| `settings` | `JSONField` | Configuración arbitraria del tenant |
| `is_active` | `BooleanField` | Default `True` |
| `created_at` | `DateTimeField` | Heredado, `db_index=True` |
| `updated_at` | `DateTimeField` | Heredado, `auto_now=True` |

Índices: `slug`, `subdomain`.

#### `apps/auth_app/models.py` — `UserManager` + `User`

```
Hereda: AbstractBaseUser + PermissionsMixin (no BaseModel — conflicto de metaclase)
Tabla:  users
```

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `UUIDField` (PK) | Definido explícitamente |
| `tenant` | `ForeignKey(Tenant)` | CASCADE, `related_name='users'` |
| `email` | `EmailField` | Único, `USERNAME_FIELD` |
| `name` | `CharField(255)` | `REQUIRED_FIELDS` |
| `avatar_url` | `URLField` | `blank=True` |
| `password` | `CharField` | Provisto por AbstractBaseUser (Argon2id) |
| `last_login` | `DateTimeField` | Provisto por AbstractBaseUser |
| `is_superuser` | `BooleanField` | Provisto por PermissionsMixin |
| `email_verified` | `BooleanField` | Default `False` |
| `is_active` | `BooleanField` | Default `True` |
| `is_staff` | `BooleanField` | Default `False` |
| `mfa_enabled` | `BooleanField` | Default `False` |
| `mfa_secret` | `CharField(32)` | TOTP secret, `blank=True` |
| `created_at` | `DateTimeField` | `auto_now_add=True` |
| `updated_at` | `DateTimeField` | `auto_now=True` |

Índices: `email`, `(tenant, email)`.

**UserManager:**
- `create_user(email, name, password, tenant, **extra_fields)` — valida email y tenant obligatorios
- `create_superuser(email, name, password, tenant=None, **extra_fields)` — auto-crea tenant `system` si no se provee

#### Admin registrado

| Clase | Base | Funcionalidad |
|-------|------|---------------|
| `TenantAdmin` | `ModelAdmin` | list/filter/search por name, slug, plan, is_active |
| `UserAdmin` | `BaseUserAdmin` | fieldsets personalizados + add_fieldsets con tenant |

#### Migraciones generadas (pendientes de aplicar)

| Archivo | Dependencias |
|---------|-------------|
| `apps/tenants/migrations/0001_initial_tenant_model.py` | Ninguna |
| `apps/auth_app/migrations/0001_initial_user_model.py` | tenants:0001, auth:0012, contenttypes:0002 |

> **Nota**: Las migraciones fueron creadas manualmente por indisponibilidad de Docker Desktop.
> Incluyen `swappable = "AUTH_USER_MODEL"` para resolución correcta de dependencias.
> Se recomienda regenerar con `makemigrations` cuando Docker esté activo.

---

### ⬜ PASO 3 — Modelos RBAC (Pendiente)

Modelos a implementar en `apps/rbac/models.py`:
- `Permission` — codename único, resource, action
- `Role` — tenant FK (nullable para roles de sistema), inherits_from FK(self)
- `RolePermission` — scope (all/own/department/custom)
- `UserRole` — assigned_by, expires_at

Fixtures pendientes:
- `rbac/fixtures/permissions.json` — 62 permisos en 13 categorías
- `rbac/fixtures/system_roles.json` — 4 roles: Owner, Service Manager, Member, Viewer

---

### ⬜ PASOS 4–20 (Pendientes)

| Paso | Descripción | Bloqueado por |
|------|-------------|---------------|
| 4 | Seeds Faker (3 tenants, ~15 usuarios) | PASO 2, 3 |
| 5 | JWT Auth: register, login, refresh, logout, verify-email | PASO 2, 3 |
| 6 | RBAC middleware + feature gates | PASO 3, 5 |
| 7 | Subscriptions + Stripe webhooks | PASO 5, 6 |
| 8 | Admin User/Role management endpoints | PASO 5, 6 |
| 9 | Projects + cifrado en reposo | PASO 5, 6 |
| 10 | Sharing & Collaboration | PASO 5, 6 |
| 11 | Audit logging (señales Django) | PASO 5 |
| 12 | Notes, Contacts, Bookmarks | PASO 5, 6 |
| 13 | DevOps: EnvVars, SSH Keys, SSL Certs, Snippets | PASO 5, 6 |
| 14 | Forms builder + Analytics | PASO 5, 6 |
| 15 | MFA (TOTP) + Email verification | PASO 5 |
| 16 | Tasks + Calendar | PASO 5, 6 |
| 17 | OpenAPI / Swagger documentation | PASO 5–16 |
| 18 | Digital Services (landing, portfolio, CV) | PASO 5, 6 |
| 19 | Support tickets | PASO 5, 6 |
| 20 | Rate limiting + hardening producción | PASO 5–19 |

---

## 2. Cobertura de Tests

### Estado actual

| Módulo | Archivo | Tests | Estado |
|--------|---------|-------|--------|
| `apps.tenants` | `tests/test_models.py` | 4 | Escrito, no ejecutado |
| `apps.auth_app` | `tests/test_models.py` | 9 (mismo archivo) | Escrito, no ejecutado |
| Todos los demás (19 apps) | — | 0 | Sin tests |

### Tests escritos en `apps/auth_app/tests/test_models.py`

**`TenantModelTest` (4 tests):**
- `test_create_tenant` — campos y defaults
- `test_tenant_str` — representación `"Name (slug)"`
- `test_slug_unique_constraint` — IntegrityError en slug duplicado
- `test_subdomain_unique_constraint` — IntegrityError en subdomain duplicado

**`UserModelTest` (9 tests):**
- `test_create_user` — campos básicos y defaults
- `test_create_superuser` — is_staff, is_superuser, email_verified
- `test_create_superuser_auto_creates_system_tenant` — tenant system auto-creado
- `test_email_unique_constraint` — IntegrityError en email duplicado
- `test_password_is_hashed` — Argon2, `check_password()` funciona
- `test_user_belongs_to_tenant` — FK + reverse relation `tenant.users`
- `test_tenant_cascade_deletes_users` — CASCADE confirmado
- `test_create_user_requires_tenant` — ValueError sin tenant
- `test_create_user_requires_email` — ValueError con email vacío

### Cobertura estimada por módulo

| Módulo | Líneas cubiertas | Estimación |
|--------|-----------------|------------|
| `core/models.py` | Indirecta (via Tenant) | ~90% |
| `utils/validators.py` | Indirecta (via Tenant) | ~60% |
| `apps/tenants/models.py` | Directa | ~95% |
| `apps/auth_app/models.py` | Directa | ~90% |
| `core/exceptions.py` | Sin tests | 0% |
| Resto (19 apps) | Sin tests | 0% |

> **Acción requerida**: ejecutar `make test` o `python manage.py test apps.auth_app.tests.test_models -v 2`
> cuando Docker Desktop esté activo.

---

## 3. TODOs y FIXMEs

**Resultado del análisis**: No se encontraron marcadores `TODO`, `FIXME`, `HACK` o `XXX` en el código.

El código existente sigue una convención de stubs documentados con comentarios descriptivos
en lugar de marcadores informales. Las tareas pendientes están trazadas en el roadmap.

---

## 4. Deuda Técnica

### Alta prioridad

| ID | Descripción | Archivo afectado | Acción |
|----|-------------|-----------------|--------|
| TD-01 | Migraciones creadas manualmente sin ejecutar `makemigrations` | `*/migrations/0001_*.py` | Regenerar con Docker activo y verificar equivalencia |
| TD-02 | Migraciones no aplicadas (tablas `tenants` y `users` no existen en BD) | — | `docker-compose up -d && make migrate` |
| TD-03 | Tests escritos pero sin ejecutar (0% ejecución real) | `test_models.py` | Ejecutar suite completa |
| TD-04 | No existe `.env` (solo `.env.example`) | `apps/backend_django/` | `cp .env.example .env` y rellenar valores |

### Media prioridad

| ID | Descripción | Archivo afectado | Acción |
|----|-------------|-----------------|--------|
| TD-05 | `TenantMiddleware` es un stub vacío | `apps/tenants/middleware.py` | Implementar en PASO 5 |
| TD-06 | `@require_permission`, `@require_feature` son stubs | `utils/decorators.py` | Implementar en PASO 6 |
| TD-07 | `TenantModelViewSet` es un stub | `utils/mixins.py` | Implementar en PASO 6 |
| TD-08 | `validate_subdomain` no se invoca en `create_superuser` al usar `get_or_create` | `auth_app/models.py:51` | El valor `'system'` es válido; documentar limitación |
| TD-09 | 18 apps tienen `models.py`, `views.py`, `serializers.py` vacíos | `apps/*/` | Implementar según roadmap |
| TD-10 | No existe `conftest.py` ni fixtures de pytest para tests | `apps/` | Crear en PASO 3 junto con seeds |

### Baja prioridad

| ID | Descripción | Archivo afectado | Notas |
|----|-------------|-----------------|-------|
| TD-11 | `User.__str__` solo retorna email (no incluye tenant) | `auth_app/models.py:104` | Suficiente para admin; ampliar si se requiere |
| TD-12 | `mfa_secret` almacenado en plaintext | `auth_app/models.py:88` | Cifrar en PASO 15 con `cryptography` ya instalado |
| TD-13 | No hay `verbose_name` / `verbose_name_plural` en Meta | Ambos modelos | Cosmético para admin; baja urgencia |

---

## 5. Arquitectura Implementada

```
apps/backend_django/
├── config/
│   ├── settings/base.py        ← AUTH_USER_MODEL='auth_app.User', Argon2, JWT, Redis
│   ├── settings/dev.py         ← DEBUG, console email
│   ├── settings/prod.py        ← SSL, WhiteNoise, Sentry
│   ├── urls.py                 ← 21 grupos de rutas /api/v1/*
│   └── celery.py
│
├── core/
│   ├── models.py               ✅ BaseModel (UUID PK + timestamps)
│   ├── exceptions.py           ✅ 6 excepciones + custom_exception_handler
│   └── views.py                ✅ /api/health/ check
│
├── utils/
│   ├── validators.py           ✅ validate_subdomain, password_strength, hex_color
│   ├── cache.py                ✅ cache_result, invalidate_tenant_cache
│   ├── decorators.py           ⬜ Stubs
│   └── mixins.py               ⬜ Stub
│
└── apps/
    ├── tenants/
    │   ├── models.py           ✅ Tenant (plan, branding, settings, is_active)
    │   ├── admin.py            ✅ TenantAdmin
    │   ├── migrations/         ✅ 0001_initial_tenant_model
    │   └── middleware.py       ⬜ Stub (PASO 5)
    │
    ├── auth_app/
    │   ├── models.py           ✅ UserManager + User (AbstractBaseUser + PermissionsMixin)
    │   ├── admin.py            ✅ UserAdmin (BaseUserAdmin)
    │   ├── migrations/         ✅ 0001_initial_user_model (swappable=AUTH_USER_MODEL)
    │   └── tests/
    │       └── test_models.py  ✅ 9 tests (no ejecutados aún)
    │
    ├── rbac/                   ⬜ PASO 3
    ├── subscriptions/          ⬜ PASO 7
    ├── projects/               ⬜ PASO 9
    ├── audit/                  ⬜ PASO 11
    ├── notes/ contacts/
    │   bookmarks/              ⬜ PASO 12
    ├── env_vars/ ssh_keys/
    │   ssl_certs/ snippets/    ⬜ PASO 13
    ├── forms_app/ analytics/   ⬜ PASO 14
    ├── tasks/ calendar_app/    ⬜ PASO 16
    ├── digital_services/       ⬜ PASO 18
    ├── sharing/                ⬜ PASO 10
    └── support/                ⬜ PASO 19
```

---

## 6. Actividad Git Reciente

| Commit | Fecha | Descripción |
|--------|-------|-------------|
| `48b04f9` | 2026-02-27 | actualizando readme |
| `a4cbb32` | 2026-02-27 | actualizando coordinacion entre agentes y skills |
| `099d506` | 2026-02-27 | skill tauri y ui ux |
| `77dbff4` | 2026-02-26 | actualizando estructura de directorios |
| `b903483` | 2026-02-26 | skills para tauri |
| `ef6118f` | 2026-02-26 | skills de stilo |
| `3f60475` | 2026-02-26 | diagramas uml relevantes |
| `080fe8f` | 2026-02-26 | actualizando prd con prototipo desktop |
| `c43aac7` | 2026-02-25 | avance 3 prototipo desktop |
| `1e41d58` | 2026-02-25 | avance 2 prototipo desktop |

> Los últimos commits se concentran en tooling Claude (.claude/agents, skills) y prototipo de escritorio (Tauri).
> La actividad del backend (`apps/backend_django`) corresponde a la sesión de hoy (PASO 2).

---

## 7. Dependencias Externas Requeridas

| Servicio | Propósito | Configurado | Activo |
|----------|-----------|-------------|--------|
| PostgreSQL 15 | Base de datos principal | ✅ docker-compose | ❌ Docker inactivo |
| Redis 7 | Cache + broker Celery | ✅ docker-compose | ❌ Docker inactivo |
| Docker Desktop | Runtime de contenedores | ✅ compose files | ❌ No iniciado |
| Stripe | Pagos y suscripciones | ✅ settings | ⬜ PASO 7 |
| AWS S3 | Almacenamiento de archivos | ✅ django-storages | ⬜ Opcional |
| SendGrid/SMTP | Email transaccional | ✅ settings | ⬜ PASO 5 |

---

## 8. Acciones Inmediatas Recomendadas

### Bloqueantes (para continuar con PASO 3)

```bash
# 1. Iniciar Docker Desktop desde Windows
# 2. Levantar servicios
cd apps/backend_django
docker-compose up -d db redis django

# 3. Aplicar migraciones
docker-compose exec django python manage.py migrate

# 4. Verificar tablas creadas
docker-compose exec django python manage.py dbshell
# \dt tenants
# \dt users

# 5. Ejecutar tests
docker-compose exec django python manage.py test apps.auth_app.tests.test_models -v 2

# 6. (Opcional) Regenerar migraciones para validar equivalencia
docker-compose exec django python manage.py makemigrations tenants --name="initial_tenant_model"
docker-compose exec django python manage.py makemigrations auth_app --name="initial_user_model"
```

### Próximo paso (PASO 3 — Modelos RBAC)

```bash
# Una vez que Docker esté activo y PASO 2 verificado:
# Implementar apps/rbac/models.py:
#   - Permission, Role, RolePermission, UserRole
# Crear fixtures:
#   - rbac/fixtures/permissions.json (62 permisos)
#   - rbac/fixtures/system_roles.json (4 roles)
# Migrar y cargar datos:
docker-compose exec django python manage.py makemigrations rbac --name="initial_rbac_models"
docker-compose exec django python manage.py migrate
docker-compose exec django python manage.py loaddata permissions system_roles
```

---

*Generado automáticamente — 2026-02-27*
*Branch: `feature/migrations` — Proyecto: `proy_roles_permisos`*
