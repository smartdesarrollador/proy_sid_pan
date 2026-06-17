# Spec: rbac (`apps/backend_django/apps/rbac/`)

**Última actualización**: 2026-06-16

## Propósito

Motor de control de acceso basado en roles (RBAC) del sistema. Define permisos
atómicos (`Permission`), agrupaciones de permisos con herencia (`Role`), el
scope con el que se concede cada permiso a un rol (`RolePermission`) y la
asignación de roles a usuarios con expiración opcional (`UserRole`). También
expone las clases de permisos DRF (`HasPermission`, `HasFeature`) y el
helper `check_plan_limit` que usan el resto de apps del backend para proteger
vistas y aplicar límites de plan.

## Modelos

### `Permission` (`models.py`)
- `codename` — único, identifica el permiso (ej. `roles.read`, `users.invite`)
- `name`, `description`
- `resource`, `action` — usados para agrupar/derivar el permiso (ej. resource=`roles`, action=`read`)
- `db_table = 'permissions'`
- Índice compuesto en `(resource, action)`

### `Role` (`models.py`)
- `tenant` — FK nullable a `Tenant`; `tenant=None` indica **rol de sistema**
- `name`, `description`
- `is_system_role` — default `False`; si es `True`, el rol no se puede editar/borrar desde la API
- `inherits_from` — self-FK `SET_NULL`, nullable; permite que un rol herede los permisos de otro
- `unique_together = [['tenant', 'name']]`
- Índices en `(tenant, is_system_role)` y `(is_system_role)`

### `RolePermission` (`models.py`)
- `role` FK, `permission` FK
- `scope` — `SCOPE_CHOICES = [('all', 'All Resources'), ('own', 'Own Resources'), ('department', 'Department'), ('custom', 'Custom')]`, default `'all'`
- `unique_together = [['role', 'permission']]`

### `UserRole` (`models.py`)
- `user` — FK a `auth_app.User`
- `role` — FK a `Role`
- `assigned_by` — FK `SET_NULL` nullable (quién asignó el rol)
- `assigned_at` — `auto_now_add`
- `expires_at` — nullable; rol temporal
- `unique_together = [['user', 'role']]`
- Método `is_expired()` → `timezone.now() > self.expires_at` (si `expires_at` es `None`, nunca expira)

## Serializers

| Serializer | Qué hace | Cuándo se usa |
|---|---|---|
| `PermissionSerializer` | Expone `id, codename, name, resource, description` | Listado de permisos (`PermissionListView`) |
| `RolePermissionSerializer` | Expone el permiso asociado a un rol (`codename`/`name` via `source='permission.codename'`/`'permission.name'`) | Anidado dentro de `RoleSerializer` |
| `RoleSerializer` | Serializa un rol completo: `permissions` (nested, `source='role_permissions'`) + `user_count` (`SerializerMethodField` que cuenta `role.user_roles.filter(user__is_active=True).count()`) | Detalle/listado de roles |
| `RoleCreateUpdateSerializer` | `permission_ids` (write-only, lista de UUIDs) + `name`/`description` | Crear/editar un rol |
| `UserRoleSerializer` | `role_id` (write-only UUID) + `role_name` (read-only, `source='role.name'`) | Asignación de roles a usuario |

## Endpoints

| Método | Path | Vista | Permisos | Propósito |
|---|---|---|---|---|
| GET | `/api/v1/admin/roles/` | `RoleListView` | `HasPermission('roles.read')` | Lista roles de sistema + roles del tenant actual |
| POST | `/api/v1/admin/roles/create/` | `RoleCreateView` | `HasPermission('roles.create')` + `HasFeature('custom_roles')` | Crea un rol custom (valida `check_plan_limit`) |
| GET | `/api/v1/admin/roles/<uuid:pk>/` | `RoleDetailView` | `HasPermission('roles.read')` | Detalle de un rol |
| PATCH | `/api/v1/admin/roles/<uuid:pk>/update/` | `RoleUpdateView` | `HasPermission('roles.update')` | Edita nombre/descripción de un rol no-sistema |
| DELETE | `/api/v1/admin/roles/<uuid:pk>/delete/` | `RoleDeleteView` | `HasPermission('roles.delete')` | Borra un rol no-sistema |
| PUT | `/api/v1/admin/roles/<uuid:pk>/permissions/` | `RolePermissionsUpdateView` | `HasPermission('roles.update')` | Reemplaza el set completo de permisos de un rol |
| GET | `/api/v1/admin/permissions/` | `PermissionListView` | `HasPermission('roles.read')` | Lista todos los permisos del sistema, ordenados por `resource, codename` |
| GET | `/api/v1/features/` | `FeaturesView` | `IsAuthenticated` | Devuelve `{plan, features, limits}` del plan del tenant actual |

## Permisos y seguridad

- **`HasPermission(codename)`** (factory que retorna una subclase de `BasePermission`):
  - Superusuarios siempre pasan.
  - Cache Redis: `rbac:perm:{user.pk}:{codename}`, TTL **300s**.
  - Si no está en cache, cae a `_check_permission_in_db`:
    1. Filtra `UserRole` del usuario excluyendo roles expirados (`Q(expires_at__isnull=True) | Q(expires_at__gt=now)`)
    2. Para cada rol asignado, recolecta IDs de roles vía `_collect_role_ids(role, depth=3)` — recorre `inherits_from` recursivamente hasta 3 niveles
    3. Verifica `RolePermission.objects.filter(role_id__in=role_ids, permission__codename=codename).exists()`
  - El resultado (bool) se cachea 300s.
  - `message` custom con `code: 'permission_denied'`.

- **`HasFeature(feature)`** (factory similar):
  - Si `request.tenant` no existe (endpoints públicos/auth), retorna `True` directamente.
  - Si existe, verifica `plan_has_feature(request.tenant.plan, feature)` (`utils/plans.py`).
  - `message` custom incluye `upgrade_url: '/billing/upgrade'`.

- **`check_plan_limit(user, resource, current_count)`** (función, no permission class):
  - Si `user.tenant` no existe (AttributeError) → no-op, no bloquea.
  - Obtiene `limit = get_plan_limit(plan, resource)`.
  - Si `limit is None` → recurso ilimitado en ese plan, no bloquea.
  - Si `current_count >= limit` → lanza `PlanLimitExceeded` (HTTP 402) con mensaje en español.

## Reglas de negocio no obvias

1. **Herencia de roles limitada a 3 niveles** (`_collect_role_ids(role, depth=3)`) — previene ciclos infinitos por mala configuración de `inherits_from`.
2. **El cache de permisos no se invalida al editar un rol** — si se agrega/quita un permiso de un rol, los usuarios afectados pueden seguir viendo el comportamiento anterior hasta que expire el TTL de 300s.
3. **Roles de sistema (`is_system_role=True`) son inmutables desde la API** — `RoleUpdateView`, `RoleDeleteView` y `RolePermissionsUpdateView` rechazan la operación con 403 ("Cannot modify/delete system roles") si el rol tiene `is_system_role=True`.
4. **Aislamiento de tenant en roles**: todas las vistas de detalle/update/delete verifican `role.tenant_id != request.tenant.id` y devuelven 404 (no 403) para no filtrar la existencia del rol de otro tenant.
5. **`RolePermissionsUpdateView.put` es atómico**: valida que todos los `permission_ids` recibidos existan (400 si la cantidad no coincide con lo encontrado en DB), luego borra todos los `RolePermission` existentes del rol y crea los nuevos en una sola transacción — no hay actualización incremental.
6. **Creación de rol custom está doblemente gateada**: requiere `HasFeature('custom_roles')` (flag de plan) **y** pasar `check_plan_limit(user, 'custom_roles', count)` (límite numérico de plan) — son dos checks independientes, no redundantes.
7. **`FeaturesView` separa flags booleanos de límites operacionales** vía `_OPERATIONAL_LIMITS = {'audit_log_days', 'storage_gb', 'api_calls_per_month'}` — todo lo que no esté en ese set se trata como feature flag booleano.

## Relación con otras apps

- **`auth_app`**: `UserRole.user` apunta a `auth_app.User`. La resolución de permisos de un usuario depende enteramente de sus `UserRole` activos.
- **`tenants`**: `Role.tenant` permite scoping de roles custom por tenant; los roles de sistema (`tenant=None`) son compartidos globalmente. `HasFeature` lee `request.tenant`, poblado por `TenantMiddleware` (ver `specs/tenants.md`, pendiente).
- **`subscriptions`** (indirecto): `HasFeature` y `check_plan_limit` leen `tenant.plan`, no la tabla `Subscription` — son conceptos relacionados pero independientes (ver `specs/subscriptions.md`, pendiente).
- Prácticamente todas las demás apps del backend dependen de `HasPermission(codename)` para proteger sus vistas (ej. `customers.read`, `support.update`, `promotions.manage` — ver memoria de implementación del Admin Panel).

## Specs / docs relacionados

- [`specs/README.md`](README.md) — resumen arquitectónico transversal del flujo RBAC Engine
- `roadmaps/SPECS_ROADMAP.md` — Fase 1 de este spec
- Sin ADR específico — el diseño de herencia de roles y scopes no tuvo una decisión documentada como ADR
