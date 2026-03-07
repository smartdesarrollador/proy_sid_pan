# RBAC: Roles, Permisos y Scopes

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Los 10 Roles Organizacionales](#los-10-roles-organizacionales)
3. [Herencia de Roles](#herencia-de-roles)
4. [64 Permisos por Categoría](#64-permisos-por-categoría)
5. [3 Tipos de Scope](#3-tipos-de-scope)
6. [Resolución de Conflictos](#resolución-de-conflictos)
7. [Middleware de Autorización en DRF](#middleware-de-autorización-en-drf)
8. [Mapeo de Permisos por Frontend](#mapeo-de-permisos-por-frontend)

---

## Resumen del Sistema

| Aspecto | Valor |
|---------|-------|
| Roles predefinidos | 10 (organizacionales) |
| Permisos granulares | 64 en 14 categorías |
| Tipos de scope | 3 (organizational, project, share) |
| Roles de proyecto | 4 (Owner, Admin, Editor, Viewer) |
| Niveles de share | 4 (Viewer, Commenter, Editor, Admin) |

Referencia completa: [`prd/technical/rbac-roles-permissions.md`](../../prd/technical/rbac-roles-permissions.md)

---

## Los 10 Roles Organizacionales

Los roles organizacionales aplican a **todo el tenant** (tenant-wide). Un usuario tiene exactamente 1 rol organizacional.

### System Roles (no editables)

| ID | Nombre | Permisos aprox. | Hereda de | Descripción |
|----|--------|-----------------|-----------|-------------|
| 1 | **Owner** | ~60 | — | Control total del tenant: usuarios, billing, configuración, todos los servicios |
| 2 | **Service Manager** | ~40 | Member | Supervisa todos los proyectos y servicios; no gestiona billing ni tenant settings |
| 3 | **Member** | ~20 | Viewer | Acceso estándar: CRUD en sus propios recursos, proyectos, tareas, notas |
| 4 | **Viewer** | ~8 | — | Solo lectura en dashboard y recursos compartidos explícitamente |

### Service-Specific Roles (editables por tenant)

| ID | Nombre | Permisos aprox. | Hereda de | Descripción |
|----|--------|-----------------|-----------|-------------|
| 5 | **Landing Manager** | ~25 | Member | Gestiona landing pages: crear, editar, publicar, configurar formularios |
| 6 | **Portfolio Admin** | ~22 | Member | Gestiona todos los proyectos del tenant, publica items de portfolio |
| 7 | **Task Coordinator** | ~18 | Member | Gestiona tableros Kanban, asigna tareas, sincroniza calendarios |
| 8 | **Content Editor** | ~15 | Member | Edita contenido de landing pages pero NO puede publicar |

### Customer/Billing Roles (editables por tenant)

| ID | Nombre | Permisos aprox. | Hereda de | Descripción |
|----|--------|-----------------|-----------|-------------|
| 9 | **Customer Success Manager** | ~18 | — | Gestiona clientes, suscripciones, analytics de clientes, exportación |
| 10 | **Billing Manager** | ~14 | — | Gestiona billing, métodos de pago, upgrades, códigos promocionales |

---

## Herencia de Roles

```
Owner
  (sin herencia - máximo nivel)

Service Manager
  └─ hereda de Member

Member
  └─ hereda de Viewer

Landing Manager
  └─ hereda de Member (+ permisos de landing)

Portfolio Admin
  └─ hereda de Member (+ permisos de proyectos/portfolio)

Task Coordinator
  └─ hereda de Member (+ permisos de tasks/calendar admin)

Content Editor
  └─ hereda de Member (+ landing.read, landing.edit, sin landing.publish)

Customer Success Manager
  └─ (independiente, enfocado en customers/subscriptions)

Billing Manager
  └─ (independiente, enfocado en billing/promotions)
```

La herencia se define en el modelo `Role.inherits_from` (FK a sí mismo). Los permisos efectivos son la unión del rol propio + todos los roles ancestro.

---

## 64 Permisos por Categoría

| Categoría | Cantidad | Permisos clave |
|-----------|----------|----------------|
| **Users & Auth** | 5 | `users.create`, `users.read`, `users.update`, `users.delete`, `users.invite` |
| **Roles & Permissions** | 5 | `roles.create`, `roles.read`, `roles.update`, `roles.delete`, `roles.assign` |
| **Tasks Service** | 7 | `tasks.create/read/update/delete/assign`, `boards.admin`, `boards.reorder` |
| **Calendar Service** | 6 | `calendar.create/read/update/delete/share/sync` |
| **Landing Pages** | 6 | `landing.create/read/edit/publish`, `branding.update`, `forms.manage` |
| **Portfolio & Projects** | 8 | `projects.create/read/update/delete/sections`, `credentials.manage/reveal`, `portfolio.publish` |
| **Digital Services** | 5 | `digital_services.tarjeta/landing/cv/portfolio`, `public_profiles.analytics` |
| **Billing & Subscriptions** | 4 | `billing.read/manage/upgrade`, `promotions.manage` |
| **Customers** | 9 | `customers.create/read/update/delete/suspend/analytics/export`, `subscriptions.manage/cancel` |
| **Analytics** | 2 | `analytics.read`, `analytics.export` |
| **Settings** | 2 | `settings.read`, `settings.update` |
| **Audit** | 2 | `audit.read`, `audit.export` |
| **Dashboard** | 1 | `dashboard.read` |
| **Referrals** | 2 | `referrals.read`, `referrals.manage` |
| **Total** | **64** | |

Los permisos se expresan como `{resource}.{action}` (ej: `projects.create`). Ver catálogo completo en [`prd/technical/data-models.md`](../../prd/technical/data-models.md) — sección Catálogo de Permisos.

**Permisos nuevos de Referrals** (categoría 14):
- `referrals.read` — Ver programa de referidos, historial y créditos
- `referrals.manage` — Gestionar códigos de referido

---

## 3 Tipos de Scope

```
┌─────────────────────────────────────────────────────────────┐
│                      JERARQUÍA DE SCOPE                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. ORGANIZATIONAL SCOPE (Tenant-Wide)                       │
│     • 10 roles predefinidos                                  │
│     • Aplica a TODOS los recursos del tenant                │
│     • 1 rol por usuario                                      │
│                                                               │
│  2. PROJECT SCOPE (Project-Specific)                         │
│     • 4 roles: Owner, Admin, Editor, Viewer                  │
│     • Aplica solo dentro de un proyecto específico           │
│     • Un usuario puede tener roles distintos en c/proyecto   │
│                                                               │
│  3. SHARE SCOPE (Item-Specific)                              │
│     • 4 niveles: Viewer, Commenter, Editor, Admin            │
│     • Aplica solo a elementos compartidos individualmente    │
│     • Puede tener fecha de expiración                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Roles de Proyecto (Project Scope)

| Rol | CRUD Items | Gestionar Colabs | Eliminar Proyecto |
|-----|-----------|-----------------|-------------------|
| **Owner** | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ❌ |
| **Editor** | ✅ | ❌ | ❌ |
| **Viewer** | Solo lectura | ❌ | ❌ |

### Niveles de Share (Share Scope)

| Nivel | Ver | Comentar | Editar | Gestionar Permisos | Eliminar |
|-------|-----|----------|--------|-------------------|----------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Commenter** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅* |

*Solo si el owner original lo permite.

### Elementos compartibles

Proyectos, secciones de proyecto, items de proyecto, tareas, eventos de calendario, archivos, documentos, notas.

### Herencia en Share Scope

Al compartir un grupo (proyecto, carpeta), los permisos se heredan a elementos hijo. Los permisos locales (específicos del item) sobrescriben los heredados.

---

## Resolución de Conflictos

Cuando un usuario tiene múltiples niveles de acceso a un recurso, se aplica el **más permisivo**:

```
Organizational Scope  →  Project Scope  →  Share Scope (inherited)  →  Share Scope (local)
```

Excepción: los permisos locales de Share Scope sobrescriben los heredados (no acumulan).

Referencia: [`prd/technical/role-scoping.md`](../../prd/technical/role-scoping.md) — sección Precedencia.

---

## Middleware de Autorización en DRF

### Verificación de permiso granular

```python
@permission_required('projects.create')
def create_project(request):
    # Requiere permiso 'projects.create' en el rol del usuario
    # El middleware valida antes de ejecutar la función
    ...
```

### Feature gates por plan

```python
@require_feature('custom_roles')
def create_custom_role(request):
    # Requiere que el plan del tenant incluya 'custom_roles'
    # Retorna 402 Payment Required si el plan no lo incluye
    ...
```

### Protected Routes (Frontend)

```typescript
// components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }
  return <>{children}</>;
}
```

### Scope condicional en permisos

El modelo `RolePermission` soporta scope condicional para controlar si el permiso aplica a `all` (todos los recursos del tenant) u `own` (solo recursos propios del usuario):

```python
# RolePermission.scope choices:
# 'all'        → aplica a todos los recursos
# 'own'        → aplica solo a recursos creados por el usuario
# 'department' → aplica a recursos del departamento
# 'custom'     → condición personalizada
```

---

## Mapeo de Permisos por Frontend

Los endpoints `/api/v1/admin/*` son accesibles por el **Owner del tenant** para gestionar su propio tenant — no son exclusivos de una plataforma de administración global. El prefijo `admin/` indica "operaciones de administración del tenant", no "platform superadmin".

### Admin Panel (`admin.plataforma.com`)

Permisos avanzados de gestión del tenant:

| Vista | Permisos requeridos |
|-------|---------------------|
| Usuarios | `users.read`, `users.create`, `users.update`, `users.delete`, `users.invite` |
| Roles | `roles.read`, `roles.create`, `roles.update`, `roles.delete`, `roles.assign` |
| Permisos | `roles.read` |
| Suscripción | `billing.read`, `billing.upgrade` |
| Facturación | `billing.read`, `billing.manage` |
| Clientes | `customers.read`, `customers.suspend`, `customers.analytics` |
| Auditoría | `audit.read`, `audit.export` |
| Analytics | `analytics.read`, `analytics.export` |
| Promociones | `promotions.manage` |
| Soporte | `IsAuthenticated` |
| Dashboard | `dashboard.read` |

### Hub Client Portal (`hub.plataforma.com`)

Operaciones del cliente sobre su propio tenant:

| Vista Hub | Permisos requeridos | Quién tiene acceso |
|-----------|---------------------|--------------------|
| Dashboard | `dashboard.read` | Todos |
| Suscripción (ver) | `billing.read` | Owner + Admin |
| Upgrade plan | `billing.upgrade` | Owner |
| Métodos de pago | `billing.manage` | Owner |
| Equipo (ver) | `users.read` | Owner + Admin |
| Equipo (invitar) | `users.invite` | Owner + Admin |
| Equipo (editar) | `users.update` | Owner + Admin |
| Equipo (eliminar) | `users.delete` | Owner |
| Equipo (roles) | `roles.assign` | Owner + Admin |
| Referidos | `referrals.read` | Owner + Admin |
| Soporte | Solo `IsAuthenticated` | Todos |
| Notificaciones | Solo `IsAuthenticated` | Todos |
| Servicios (SSO) | Solo `IsAuthenticated` + tenant activo | Todos |

### Workspace (`app.plataforma.com`)

Permisos de productividad para usuarios del tenant:

| Área | Permisos requeridos |
|------|---------------------|
| Proyectos | `projects.create/read/update/delete` |
| Credenciales | `credentials.manage`, `credentials.reveal` |
| Tareas | `tasks.create/read/update/delete/assign`, `boards.admin` |
| Calendario | `calendar.create/read/update/delete/share/sync` |
| Digital Services | `digital_services.tarjeta/landing/cv/portfolio` |
| Analytics de perfil | `public_profiles.analytics` |
| Compartir | Requiere ser owner/admin del recurso |

### Desktop App

Mismos permisos que Workspace. Consume los mismos endpoints de `/api/v1/app/*`.

---

**Fuente**: [`prd/technical/rbac-roles-permissions.md`](../../prd/technical/rbac-roles-permissions.md) + [`prd/features/hub-client-portal.md`](../../prd/features/hub-client-portal.md) — sección 15

**Última actualización**: 2026-03-06
