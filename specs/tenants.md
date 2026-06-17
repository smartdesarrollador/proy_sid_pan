# Spec: tenants (`apps/backend_django/apps/tenants/`)

**Última actualización**: 2026-06-16

## Propósito

Define la organización raíz del sistema multi-tenant (`Tenant`) y resuelve,
en cada request, a qué tenant pertenece la operación actual
(`TenantMiddleware`). También expone la gestión de tenants desde el Admin
Panel (listado/suspensión de clientes) y la edición de branding propio
(`OrganizationView`) usada por cada cliente para personalizar su instancia.

## Modelos

### `Tenant` (`models.py`)
- Hereda `BaseModel` (UUID PK, `created_at`, `updated_at`)
- `name` — `CharField`
- `slug` — `SlugField`, único
- `subdomain` — `CharField(max_length=63)`, único, validado por `utils.validators.validate_subdomain`
- `plan` — `PLAN_CHOICES`: `free | starter | professional | enterprise`, default `'free'`
- `branding` — `JSONField` (ej. `{primary_color: '#...'}`)
- `settings` — `JSONField` genérico
- `logo`, `favicon` — `ImageField`, nullable
- `is_active` — bool, default `True`
- `db_table = 'tenants'`; índices en `slug` y `subdomain`

## Middleware: `TenantMiddleware` (`middleware.py`)

Resuelve `request.tenant` en **cada** request:

1. Si el path empieza con uno de `_PUBLIC_PATH_PREFIXES` (`/api/v1/auth/`,
   `/api/health/`, `/api/schema/`, `/api/docs/`, `/api/redoc/`, `/admin/`),
   no resuelve tenant — `request.tenant = None`.
2. Lee el header `X-Tenant-Slug`. Si no está presente, `request.tenant = None`.
3. Si está presente, busca primero en cache Redis (`tenant:slug:{slug}`, TTL
   **300s**); si no está cacheado, consulta `Tenant.objects.get(slug=slug,
   is_active=True)` y cachea el resultado. Si el tenant no existe o está
   inactivo, `Tenant.DoesNotExist` → `request.tenant = None` (sin levantar
   error, simplemente no resuelve).
4. Si se resolvió un tenant, intenta `SET app.tenant_id = %s` en la conexión
   Postgres activa (para Row-Level Security) — envuelto en `try/except` que
   silencia cualquier excepción (`pass`): **el RLS no está garantizado**, es
   un control de respaldo, no la fuente de verdad del aislamiento.

## Serializers

| Serializer | Qué hace | Cuándo se usa |
|---|---|---|
| `ClientUserSerializer` | `id, name, email, is_active, roles` (roles via `user.user_roles.values_list('role__name')`) | Anidado en `ClientListSerializer.recent_users` |
| `ClientSubscriptionSerializer` | Normaliza `status` (`trialing→trial`, `canceled→cancelled`), agrega `plan_name` y `mrr` desde mapas estáticos (`PLAN_NAME_MAP`, `PLAN_MRR_MAP`) | Anidado en `ClientListSerializer.subscription` |
| `ClientListSerializer` | Serializa un tenant para el Admin Panel: `primary_color` (de `branding`), `admin_email` (Owner activo del tenant, o primer usuario activo como fallback), `subscription` (con fallback hardcodeado si `tenant.subscription` no existe — `Exception` genérica, no `RelatedObjectDoesNotExist` específico), `usage` (lee límites de `utils.plans.PLAN_FEATURES`, `storage`/`api_calls` siempre en `0` — no hay tracking real aún), `recent_users` (últimos 5 por `created_at`) | `ClientListView`, `SuspendClientView` |
| `OrganizationSerializer` | `logo_url`/`favicon_url` normalizados a URL absoluta (mismo patrón `_abs` que `auth_app.TenantSerializer`: prioriza URL ya absoluta de storage externo → `APP_BASE_URL` → `request.build_absolute_uri`); `subdomain` es `read_only` | `OrganizationView` |

## Endpoints

| Método | Path | Vista | Permisos | Propósito |
|---|---|---|---|---|
| GET | `/api/v1/admin/clients/` | `ClientListView` | `HasPermission('customers.read')` | Lista todos los tenants excepto el propio, con subscription/usage/recent_users |
| POST | `/api/v1/admin/clients/<uuid:pk>/suspend/` | `SuspendClientView` | `HasPermission('customers.suspend')` | Activa/suspende un tenant (`{active: bool}` en el body) |
| GET, PATCH | `/api/v1/admin/organization/` | `OrganizationView` | `IsAuthenticated` | Lee/edita el branding del tenant propio (`name`, `logo`, `favicon`, `primary_color`) |

`ClientListView`/`SuspendClientView` se montan vía `admin_urls.py`;
`OrganizationView` vía `organization_urls.py` — ambos incluidos bajo el
prefijo admin en `config/urls.py`.

## Permisos y seguridad

- `ClientListView`/`SuspendClientView` usan `HasPermission(codename)` del
  módulo `rbac` (ver [`specs/rbac.md`](rbac.md)) — codenames `customers.read`
  y `customers.suspend` (no `tenants.*`, pese a operar sobre el modelo
  `Tenant`).
- `OrganizationView` solo exige `IsAuthenticated` — cualquier usuario
  autenticado del tenant puede ver/editar el branding propio, no solo
  Owners/Admins (no hay `HasPermission` adicional en esta vista).
- `SuspendClientView` bloquea explícitamente que un staff suspenda su propio
  tenant (`tenant.id == request.tenant.id` → 403) — protección contra
  auto-bloqueo accidental del panel admin.
- El aislamiento real entre tenants depende de filtrar por `tenant` en cada
  queryset de cada app — el `SET app.tenant_id` para RLS en Postgres es
  best-effort y se silencia si falla.

## Reglas de negocio no obvias

1. **Las rutas públicas (`auth`, `health`, `schema`, `docs`, `redoc`, `admin`)
   nunca resuelven tenant**, incluso si llevan el header `X-Tenant-Slug` —
   evita dependencias circulares (login necesita poder ejecutarse sin tenant
   resuelto todavía).
2. **El cache de tenant por slug (5 min) no se invalida al suspender un
   tenant** (`SuspendClientView` solo hace `tenant.save(update_fields=
   ['is_active'])`) — un tenant recién suspendido puede seguir resolviendo
   como activo en otros requests hasta que expire el TTL de Redis.
3. **`SET app.tenant_id` para RLS es best-effort, no garantizado** — el
   `except Exception: pass` en `_set_rls_context` significa que si la
   sentencia falla (ej. conexión en mal estado, falta de superusuario para
   `SET`), el request continúa normalmente sin RLS activo y sin error visible.
4. **No se puede autosuspender el propio tenant** desde `SuspendClientView`
   — devuelve 403 explícito comparando `tenant.id == request.tenant.id`.
5. **`logo_url`/`favicon_url` se normalizan igual que en `auth_app`**: si el
   storage devuelve URL absoluta (S3, CDN) se usa tal cual; si no, se prefija
   con `settings.APP_BASE_URL` (para forzar HTTPS en producción cuando
   Traefik no reenvía `X-Forwarded-Proto` correctamente); como último recurso
   se usa `request.build_absolute_uri`.
6. **`ClientListSerializer.get_subscription` usa un `except Exception`
   genérico** (no `Subscription.DoesNotExist` específico) para el fallback
   cuando el tenant no tiene `Subscription` creada — devuelve un dict
   hardcodeado con `status='active'` basado únicamente en `tenant.plan`.
7. **`usage.storage`/`usage.api_calls` están hardcodeados en `0`** en
   `ClientListSerializer` — no hay tracking real de almacenamiento ni de
   llamadas API todavía; solo `usage.users` refleja un conteo real
   (`obj.users.count()`).
8. **`admin_email` prioriza al Owner de sistema activo**, y solo si no existe
   cae al primer usuario activo del tenant (`obj.users.filter(is_active=True)
   .first()`) — puede no coincidir con quien registró originalmente el
   tenant si el Owner fue removido o suspendido.

## Relación con otras apps

- **`subscriptions`**: `Tenant` no tiene FK directa a `Subscription`, pero
  `ClientListSerializer` accede a `tenant.subscription` (related name del
  `OneToOneField` en `Subscription.tenant`, ver [`specs/subscriptions.md`](subscriptions.md)).
  `tenant.plan` es el campo que de hecho leen `HasFeature`/`check_plan_limit`
  del RBAC engine, no `Subscription.plan` — ver nota en `specs/subscriptions.md`
  regla #7.
- **`rbac`**: `Role.tenant` permite scoping de roles custom por tenant (ver
  [`specs/rbac.md`](rbac.md)); `ClientListSerializer.get_admin_email` consulta
  `UserRole`/`Role` para encontrar al Owner de sistema del tenant.
- **`auth_app`**: `User.tenant` FK obligatoria — todo usuario pertenece a
  exactamente un tenant (ver [`specs/auth.md`](auth.md)); `RegisterSerializer`
  es quien crea el `Tenant` inicial en el flujo de registro.
- **`utils.plans`**: `PLAN_FEATURES` es la fuente de límites (`max_users`,
  `storage_gb`, `api_calls_per_month`) que `ClientListSerializer.get_usage`
  lee para construir la sección `usage` del Admin Panel.

## Specs / docs relacionados

- [`specs/auth.md`](auth.md) — quién crea el `Tenant` (registro) y cómo se
  propaga `tenant.plan` a las respuestas de auth
- [`specs/subscriptions.md`](subscriptions.md) — relación `Subscription.tenant`,
  por qué `tenant.plan` y `Subscription.plan` son campos independientes
- [`specs/rbac.md`](rbac.md) — `Role.tenant`, `HasFeature`/`check_plan_limit`
  leyendo `tenant.plan`
- [`specs/README.md`](README.md) — resumen arquitectónico transversal (incluye
  nota crítica sobre RLS no garantizado)
