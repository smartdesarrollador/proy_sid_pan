# Modelo de Datos - Sistema RBAC y Suscripciones

**Documento relacionado:** `class-diagram.puml`
**PRD:** `/prd/rbac-subscription-system.md`
**Fecha:** 2026-02-09

---

## Índice

1. [Resumen del Modelo](#resumen-del-modelo)
2. [Modelos Abstractos](#modelos-abstractos)
3. [Modelos Core](#modelos-core)
4. [Modelos RBAC](#modelos-rbac)
5. [Modelos de Auditoría](#modelos-de-auditoría)
6. [Modelos de Autenticación](#modelos-de-autenticación)
7. [Modelos de Billing](#modelos-de-billing)
8. [Modelos de Notificaciones](#modelos-de-notificaciones)
9. [Modelos de Feature Flags](#modelos-de-feature-flags)
10. [Índices y Optimizaciones](#índices-y-optimizaciones)
11. [Migrations Strategy](#migrations-strategy)

---

## Resumen del Modelo

### Estadísticas

- **Total de modelos:** 24 (3 abstractos + 21 concretos)
- **Modelos multi-tenant:** 16 (heredan de TenantAwareModel)
- **Modelos auditados:** 8 (heredan de AuditedModel)
- **Enumeraciones:** 6
- **Relaciones Many-to-Many:** 3
- **Relaciones One-to-Many:** 28+

### Arquitectura de Datos

```
┌─────────────────────────────────────────────────┐
│         Abstract Base Models                     │
│  TimestampedModel → AuditedModel                 │
│  TenantAwareModel → Multi-tenant isolation       │
└─────────────────────────────────────────────────┘
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌──────────────┐           ┌──────────────┐
│  Core Models │           │ RBAC Models  │
│  - Tenant    │           │  - Role      │
│  - User      │           │  - Permission│
│  - Membership│           │  - Grant     │
└──────────────┘           └──────────────┘
        ↓                           ↓
┌──────────────┐           ┌──────────────┐
│   Billing    │           │   Audit      │
│  - Invoice   │           │  - AuditLog  │
│  - Payment   │           │  - EmailLog  │
└──────────────┘           └──────────────┘
```

---

## Modelos Abstractos

### TimestampedModel

**Propósito:** Agregar timestamps automáticos a todos los modelos

**Campos:**
- `created_at: DateTimeField(auto_now_add=True)` - Fecha de creación (inmutable)
- `updated_at: DateTimeField(auto_now=True)` - Fecha de última modificación

**Configuración:**
```python
class Meta:
    abstract = True
    ordering = ['-created_at']
```

**Hereda de:** `models.Model`
**Heredado por:** Todos los modelos del sistema

**Beneficios:**
- ✅ Tracking automático de creación/modificación
- ✅ Ordenamiento por defecto por fecha
- ✅ Útil para auditoría y debugging
- ✅ Sin overhead (no crea tabla)

---

### TenantAwareModel

**Propósito:** Aislamiento multi-tenant con RLS en PostgreSQL

**Campos:**
- `tenant: ForeignKey(Tenant, on_delete=CASCADE)` - Organización propietaria

**Managers:**
- `objects = TenantAwareManager()` - Filtra por tenant actual
- `all_tenants = models.Manager()` - Bypass para SuperAdmin

**Configuración:**
```python
class Meta:
    abstract = True
    indexes = [
        models.Index(fields=['tenant', '-created_at']),
    ]
```

**RLS Policy (PostgreSQL):**
```sql
CREATE POLICY tenant_isolation ON table_name
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Hereda de:** `TimestampedModel`
**Heredado por:** 16 modelos multi-tenant

**Validaciones:**
- ✅ Tenant ID establecido automáticamente por middleware
- ✅ Imposible acceder a datos de otro tenant (DB-level enforcement)
- ✅ SuperAdmin puede bypass con flag explícito + audit

---

### AuditedModel

**Propósito:** Tracking de quién creó/modificó registros

**Campos:**
- `created_by: ForeignKey(User, on_delete=SET_NULL, null=True)` - Usuario creador
- `updated_by: ForeignKey(User, on_delete=SET_NULL, null=True)` - Usuario que modificó

**Signals:**
```python
@receiver(pre_save, sender=AuditedModel)
def set_audit_fields(sender, instance, **kwargs):
    request = get_current_request()
    if request and request.user.is_authenticated:
        if not instance.pk:  # New record
            instance.created_by = request.user
        instance.updated_by = request.user
```

**Hereda de:** `TimestampedModel`
**Heredado por:** Modelos críticos (Role, PermissionGroup, PermissionDelegation, etc.)

---

## Modelos Core

### Tenant

**Propósito:** Representa una organización (tenant) en el sistema multi-tenant

**Campos Principales:**
```python
id: UUID (PK)
name: CharField(255)                    # "Acme Corporation"
subdomain: SlugField (unique)           # "acme" → acme.platform.com
logo: ImageField                        # S3 URL
primary_color: CharField(7)             # "#3B82F6"
settings: JSONField                     # Custom config
```

**Campos de Suscripción:**
```python
subscription_plan: CharField(50)        # "professional"
subscription_status: CharField(20)      # "active", "trial", "canceled"
trial_ends_at: DateTimeField           # 2026-02-23T00:00:00Z
subscription_current_period_end: DateTimeField
stripe_customer_id: CharField(255)      # "cus_xxxxx"
```

**Campos de Uso:**
```python
storage_used_bytes: BigIntegerField     # 1234567890 (bytes)
api_calls_this_month: IntegerField      # 5432
```

**Métodos:**
```python
def is_trial_active() -> bool:
    """Check si trial está activo"""
    return (
        self.subscription_status == 'trial' and
        self.trial_ends_at > timezone.now()
    )

def get_plan_limits() -> dict:
    """Obtener límites del plan actual"""
    plan = SubscriptionPlan.objects.get(name=self.subscription_plan)
    return plan.limits

def check_limit(resource: str) -> bool:
    """Verificar si límite de recurso fue alcanzado"""
    limits = self.get_plan_limits()
    if resource == 'users':
        return self.tenantmembership_set.filter(is_active=True).count() < limits['max_users']
    elif resource == 'storage':
        return self.storage_used_bytes < limits['max_storage_bytes']
    # etc...
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_tenant_subdomain ON tenant (subdomain);
CREATE INDEX idx_tenant_subscription_status ON tenant (subscription_status);
CREATE INDEX idx_tenant_trial_ends ON tenant (trial_ends_at) WHERE subscription_status = 'trial';
```

**Relaciones:**
- `TenantMembership` (1:N) - Usuarios miembros
- `Invoice` (1:N) - Facturas
- `PaymentMethod` (1:N) - Métodos de pago
- `AuditLog` (1:N) - Logs de auditoría
- `UsageTracking` (1:N) - Métricas de uso

---

### User

**Propósito:** Usuario del sistema (puede pertenecer a múltiples tenants)

**Campos Principales:**
```python
id: UUID (PK)
email: EmailField (unique)              # "john@example.com"
password: CharField(128)                # Hashed con bcrypt
first_name: CharField(150)              # "John"
last_name: CharField(150)               # "Doe"
is_active: BooleanField                 # True/False
is_staff: BooleanField                  # Django admin access
is_superuser: BooleanField              # SuperAdmin flag
email_verified_at: DateTimeField       # 2026-02-09T10:00:00Z
last_login: DateTimeField              # 2026-02-09T15:30:00Z
```

**Campos MFA:**
```python
mfa_enabled: BooleanField               # True/False
mfa_secret: CharField(32)               # TOTP secret (encrypted)
```

**Métodos:**
```python
def get_full_name() -> str:
    return f"{self.first_name} {self.last_name}"

def check_password(password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.verify(password, self.password)

def set_password(password: str) -> None:
    """Hash and set password"""
    self.password = bcrypt.hash(password)

def has_perm(permission: str, tenant: Tenant) -> bool:
    """Check if user has permission in tenant"""
    membership = self.tenantmembership_set.get(tenant=tenant)
    return membership.get_effective_permissions().__contains__(permission)

def get_roles(tenant: Tenant) -> QuerySet[Role]:
    """Get all roles for user in tenant"""
    membership = self.tenantmembership_set.get(tenant=tenant)
    return membership.roles.all()
```

**Validaciones:**
- Email único global (cross-tenant)
- Password policy: min 8 chars, uppercase, lowercase, digit, special char
- Email verification obligatoria antes de acceso completo
- MFA opcional (obligatorio para plan Enterprise configurable)

**Relaciones:**
- `TenantMembership` (1:N) - Membresías en organizaciones
- `RefreshToken` (1:N) - Tokens JWT
- `MFARecoveryCode` (1:N) - Códigos de recuperación
- `Session` (1:N) - Sesiones activas
- `AuditLog` (1:N) - Acciones auditadas

---

### TenantMembership

**Propósito:** Relación Many-to-Many entre User y Tenant con roles

**Campos:**
```python
id: UUID (PK)
tenant: ForeignKey(Tenant)              # Organización
user: ForeignKey(User)                  # Usuario
is_active: BooleanField                 # True si activo
invited_at: DateTimeField              # Fecha de invitación
joined_at: DateTimeField               # Fecha de aceptación
invitation_token: CharField(255)        # Token único
invitation_expires_at: DateTimeField   # 7 días desde invited_at
```

**Relaciones:**
- `roles: ManyToManyField(Role)` - Roles asignados

**Métodos:**
```python
def is_invitation_valid() -> bool:
    """Check if invitation is still valid"""
    return (
        self.joined_at is None and
        self.invitation_expires_at > timezone.now()
    )

def accept_invitation() -> None:
    """Accept invitation and activate membership"""
    self.joined_at = timezone.now()
    self.is_active = True
    self.invitation_token = None
    self.save()

def get_effective_permissions() -> set[str]:
    """Get all permissions from all roles (with inheritance)"""
    permissions = set()
    for role in self.roles.all():
        permissions.update(role.get_all_permissions().values_list('codename', flat=True))
    return permissions
```

**Constraints:**
```sql
ALTER TABLE tenant_membership ADD CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id);
CREATE INDEX idx_membership_tenant_user ON tenant_membership (tenant_id, user_id);
CREATE INDEX idx_membership_active ON tenant_membership (tenant_id, user_id) WHERE is_active = true;
```

---

## Modelos RBAC

### Role

**Propósito:** Rol que agrupa permisos (predefinido o personalizado por tenant)

**Campos:**
```python
id: UUID (PK)
tenant: ForeignKey(Tenant)              # Organización propietaria
name: CharField(100)                    # "Content Editor"
description: TextField                  # "Can create and edit content"
is_system_role: BooleanField            # True para roles predefinidos
parent_role: ForeignKey('self')         # Herencia de roles
color: CharField(7)                     # "#10B981" (UI color)
icon: CharField(50)                     # "edit" (icon name)
```

**Relaciones:**
- `permissions: ManyToManyField(Permission)` through `PermissionGrant`
- `parent_role: ForeignKey('self')` - Rol padre

**Roles Predefinidos del Sistema:**
```python
SYSTEM_ROLES = [
    {
        'name': 'SuperAdmin',
        'description': 'Platform administrator with cross-tenant access',
        'is_system_role': True,
        'permissions': ['*']  # All permissions
    },
    {
        'name': 'OrgAdmin',
        'description': 'Organization administrator',
        'is_system_role': True,
        'permissions': ['users.*', 'roles.*', 'billing.*', 'settings.*']
    },
    {
        'name': 'Manager',
        'description': 'Team manager with elevated permissions',
        'is_system_role': True,
        'parent_role': 'Member',
        'permissions': ['users.invite', 'users.view', 'approvals.*']
    },
    {
        'name': 'Member',
        'description': 'Standard organization member',
        'is_system_role': True,
        'permissions': ['content.create', 'content.read', 'content.update_own']
    },
    {
        'name': 'Guest',
        'description': 'Limited read-only access',
        'is_system_role': True,
        'permissions': ['content.read']
    }
]
```

**Métodos:**
```python
def get_all_permissions() -> QuerySet[Permission]:
    """Get all permissions including inherited"""
    permissions = set(self.permissions.all())

    # Add inherited permissions
    parent = self.parent_role
    depth = 0
    while parent and depth < 3:  # Max 3 levels
        permissions.update(parent.permissions.all())
        parent = parent.parent_role
        depth += 1

    return Permission.objects.filter(id__in=[p.id for p in permissions])

def get_inherited_permissions() -> QuerySet[Permission]:
    """Get only inherited permissions"""
    all_perms = self.get_all_permissions()
    own_perms = self.permissions.all()
    return all_perms.exclude(id__in=own_perms)

def validate_inheritance() -> bool:
    """Check for circular inheritance"""
    visited = set()
    current = self.parent_role
    while current:
        if current.id in visited:
            return False  # Circular detected
        visited.add(current.id)
        current = current.parent_role
        if len(visited) > 3:
            return False  # Too deep
    return True
```

**Validaciones:**
- Nombre único por tenant
- Roles de sistema no editables (solo asignables)
- Máximo 3 niveles de herencia
- No herencias circulares
- Máximo 50 roles personalizados por tenant (Professional plan)

---

### Permission

**Propósito:** Permiso granular sobre recurso y acción

**Campos:**
```python
id: UUID (PK)
codename: CharField(100) (unique)       # "users.create"
name: CharField(255)                    # "Create users"
resource: CharField(50)                 # "users"
action: CharField(50)                   # "create"
description: TextField                  # "Allows creating new users"
category: CharField(50)                 # "User Management"
```

**Formato de Codename:**
```
resource.action
examples:
  users.create
  users.read
  users.update
  users.delete
  content.publish
  billing.view_invoices
  roles.assign
```

**Categorías de Permisos:**
```python
PERMISSION_CATEGORIES = {
    'User Management': ['users.*', 'invitations.*'],
    'Role & Permissions': ['roles.*', 'permissions.*'],
    'Content Management': ['content.*', 'media.*'],
    'Billing': ['billing.*', 'invoices.*'],
    'Settings': ['settings.*', 'integrations.*'],
    'Audit': ['audit.*'],
}
```

**Métodos:**
```python
def get_display_name() -> str:
    """User-friendly display name"""
    return self.name

def parse_codename() -> tuple[str, str]:
    """Parse codename into resource and action"""
    resource, action = self.codename.split('.')
    return resource, action
```

**Seed de Permisos (inicialización):**
```python
INITIAL_PERMISSIONS = [
    # User Management
    ('users.create', 'Create users', 'users', 'create'),
    ('users.read', 'View users', 'users', 'read'),
    ('users.update', 'Update users', 'users', 'update'),
    ('users.delete', 'Delete users', 'users', 'delete'),
    ('users.invite', 'Invite users', 'users', 'invite'),

    # Roles & Permissions
    ('roles.create', 'Create roles', 'roles', 'create'),
    ('roles.read', 'View roles', 'roles', 'read'),
    ('roles.update', 'Update roles', 'roles', 'update'),
    ('roles.delete', 'Delete roles', 'roles', 'delete'),
    ('roles.assign', 'Assign roles to users', 'roles', 'assign'),

    # Content
    ('content.create', 'Create content', 'content', 'create'),
    ('content.read', 'View content', 'content', 'read'),
    ('content.update', 'Update any content', 'content', 'update'),
    ('content.update_own', 'Update own content', 'content', 'update_own'),
    ('content.delete', 'Delete content', 'content', 'delete'),
    ('content.publish', 'Publish content', 'content', 'publish'),

    # Billing
    ('billing.view', 'View billing info', 'billing', 'view'),
    ('billing.manage', 'Manage subscription', 'billing', 'manage'),
    ('billing.view_invoices', 'View invoices', 'billing', 'view_invoices'),

    # Settings
    ('settings.view', 'View settings', 'settings', 'view'),
    ('settings.update', 'Update settings', 'settings', 'update'),

    # Audit
    ('audit.read', 'View audit logs', 'audit', 'read'),
    ('audit.export', 'Export audit logs', 'audit', 'export'),
]
```

---

### PermissionGrant

**Propósito:** Tabla intermedia Role-Permission con scope condicional

**Campos:**
```python
id: UUID (PK)
role: ForeignKey(Role)                  # Rol que recibe permiso
permission: ForeignKey(Permission)      # Permiso otorgado
scope: CharField(20)                    # 'all', 'own', 'department', 'custom'
conditions: JSONField                   # Condiciones adicionales
```

**Scopes Disponibles:**
```python
SCOPES = {
    'all': 'No restrictions',
    'own': 'Only resources created by user',
    'department': 'Only resources in same department',
    'team': 'Only resources in same team',
    'custom': 'Custom logic defined in conditions'
}
```

**Métodos:**
```python
def validate_scope(user: User, resource: Model) -> bool:
    """Validate if user can access resource given scope"""
    if self.scope == 'all':
        return True
    elif self.scope == 'own':
        return resource.created_by_id == user.id
    elif self.scope == 'department':
        return resource.department_id == user.department_id
    elif self.scope == 'custom':
        # Evaluate conditions JSONField
        return eval_custom_conditions(self.conditions, user, resource)
    return False

def get_filtered_queryset(qs: QuerySet) -> QuerySet:
    """Apply scope filter to queryset"""
    user = get_current_user()
    if self.scope == 'all':
        return qs
    elif self.scope == 'own':
        return qs.filter(created_by=user)
    elif self.scope == 'department':
        return qs.filter(department_id=user.department_id)
    # etc...
```

**Ejemplos de Uso:**
```python
# Content Editor puede crear y editar solo su propio contenido
PermissionGrant.objects.create(
    role=content_editor_role,
    permission=Permission.objects.get(codename='content.update'),
    scope='own'
)

# Manager puede aprobar gastos de su departamento
PermissionGrant.objects.create(
    role=manager_role,
    permission=Permission.objects.get(codename='expenses.approve'),
    scope='department'
)

# Custom: Solo aprobar gastos < $5000
PermissionGrant.objects.create(
    role=junior_manager_role,
    permission=Permission.objects.get(codename='expenses.approve'),
    scope='custom',
    conditions={'max_amount': 5000}
)
```

---

### PermissionDelegation

**Propósito:** Delegación temporal de permisos entre usuarios

**Campos:**
```python
id: UUID (PK)
tenant: ForeignKey(Tenant)
delegator: ForeignKey(User)             # Usuario que delega
delegatee: ForeignKey(User)             # Usuario que recibe
start_date: DateTimeField               # Fecha de inicio
end_date: DateTimeField                 # Fecha de fin
is_active: BooleanField                 # Estado
```

**Relaciones:**
- `permissions: ManyToManyField(Permission)` - Permisos delegados

**Métodos:**
```python
def is_valid() -> bool:
    """Check if delegation is currently valid"""
    now = timezone.now()
    return (
        self.is_active and
        self.start_date <= now <= self.end_date
    )

def expire() -> None:
    """Expire delegation"""
    self.is_active = False
    self.save()

    # Create audit log
    AuditLog.objects.create(
        tenant=self.tenant,
        actor_user=self.delegator,
        action='expire_delegation',
        resource_type='permission_delegation',
        resource_id=self.id,
        changes={'delegatee': self.delegatee.email}
    )

def get_delegated_permissions() -> QuerySet[Permission]:
    """Get all delegated permissions"""
    return self.permissions.all()
```

**Cronjob de Expiración:**
```python
@shared_task
def expire_delegations():
    """Daily task to expire old delegations"""
    now = timezone.now()
    expired = PermissionDelegation.objects.filter(
        is_active=True,
        end_date__lt=now
    )

    for delegation in expired:
        delegation.expire()

        # Notify delegator and delegatee
        Notification.objects.create(
            tenant=delegation.tenant,
            user=delegation.delegator,
            type='DELEGATION_EXPIRED',
            title='Permission delegation expired',
            message=f'Your delegation to {delegation.delegatee.email} has expired.'
        )
```

---

## Modelos de Auditoría

### AuditLog

**Propósito:** Registro inmutable de todas las acciones críticas

**Campos:**
```python
id: BigAutoField (PK)                   # Auto-incrementing big integer
timestamp: DateTimeField (indexed)      # 2026-02-09T15:30:45Z
tenant: ForeignKey(Tenant)              # Organización
actor_user: ForeignKey(User)            # Usuario que realizó acción
action: CharField(50)                   # 'create_role', 'assign_role', etc.
resource_type: CharField(50)            # 'role', 'user', 'permission'
resource_id: UUID                       # ID del recurso afectado
changes: JSONField                      # Snapshot before/after
ip_address: GenericIPAddressField      # 192.168.1.100
user_agent: TextField                   # Mozilla/5.0...
session_id: UUID                        # UUID de sesión
```

**Estructura de Changes JSON:**
```json
{
  "before": {
    "name": "Content Editor",
    "permissions": ["content.create", "content.read"]
  },
  "after": {
    "name": "Content Editor",
    "permissions": ["content.create", "content.read", "content.update_own"]
  },
  "diff": {
    "permissions": {
      "added": ["content.update_own"],
      "removed": []
    }
  }
}
```

**Métodos:**
```python
def get_change_summary() -> str:
    """Human-readable change summary"""
    if self.action == 'create_role':
        return f"Created role '{self.changes['after']['name']}'"
    elif self.action == 'assign_role':
        return f"Assigned role '{self.changes['role']}' to {self.changes['user']}"
    # etc...

def get_before_value(field: str) -> any:
    """Get before value for field"""
    return self.changes.get('before', {}).get(field)

def get_after_value(field: str) -> any:
    """Get after value for field"""
    return self.changes.get('after', {}).get(field)
```

**Acciones Auditables:**
```python
AUDIT_ACTIONS = [
    # Authentication
    'login', 'logout', 'login_failed', 'password_changed', 'mfa_enabled', 'mfa_disabled',

    # Roles & Permissions
    'create_role', 'update_role', 'delete_role',
    'assign_role', 'revoke_role',
    'grant_permission', 'revoke_permission',
    'delegate_permission', 'expire_delegation',

    # Users
    'create_user', 'update_user', 'deactivate_user', 'reactivate_user',
    'invite_user', 'accept_invitation',

    # Billing
    'upgrade_plan', 'downgrade_plan', 'cancel_subscription',
    'payment_success', 'payment_failed', 'refund_issued',

    # Tenant
    'create_tenant', 'update_tenant_settings', 'suspend_tenant',

    # SuperAdmin
    'access_tenant_data', 'override_permission', 'force_password_reset',
]
```

**Constraints e Índices:**
```sql
-- Tabla inmutable (solo inserts)
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- Índices para queries comunes
CREATE INDEX idx_audit_tenant_timestamp ON audit_log (tenant_id, timestamp DESC);
CREATE INDEX idx_audit_tenant_actor_timestamp ON audit_log (tenant_id, actor_user_id, timestamp DESC);
CREATE INDEX idx_audit_tenant_action_timestamp ON audit_log (tenant_id, action, timestamp DESC);
CREATE INDEX idx_audit_timestamp ON audit_log (timestamp DESC);

-- Particionamiento por mes (para grandes volúmenes)
CREATE TABLE audit_log_2026_02 PARTITION OF audit_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

**Retención:**
- 7 años en hot storage (PostgreSQL)
- Archivar a S3 Glacier después de 2 años
- Exports periódicos para compliance

---

## Modelos de Autenticación

### RefreshToken

**Propósito:** Tokens JWT de larga duración para renovar access tokens

**Campos:**
```python
id: UUID (PK)
user: ForeignKey(User)
token: CharField(255) (unique, hashed)  # SHA-256 del token
expires_at: DateTimeField               # 7 días desde emisión
created_at: DateTimeField
revoked_at: DateTimeField               # Si fue revocado manualmente
device_info: JSONField                  # Browser, OS, device
```

**Métodos:**
```python
def is_valid() -> bool:
    """Check if token is still valid"""
    return (
        self.revoked_at is None and
        self.expires_at > timezone.now()
    )

def revoke() -> None:
    """Revoke token (logout)"""
    self.revoked_at = timezone.now()
    self.save()

def rotate() -> 'RefreshToken':
    """Rotate token (security best practice)"""
    self.revoke()
    new_token = RefreshToken.objects.create(
        user=self.user,
        token=generate_random_token(),
        expires_at=timezone.now() + timedelta(days=7),
        device_info=self.device_info
    )
    return new_token
```

**Security:**
- Token almacenado como hash SHA-256
- Rotation automática al usar
- Expiración a los 7 días
- Revocación inmediata en logout

---

### Session

**Propósito:** Tracking de sesiones activas por usuario

**Campos:**
```python
id: UUID (PK)
user: ForeignKey(User)
tenant: ForeignKey(Tenant)              # Tenant actual de la sesión
started_at: DateTimeField
last_activity_at: DateTimeField         # Updated en cada request
expires_at: DateTimeField               # Inactividad > 24h
ip_address: GenericIPAddressField
user_agent: TextField
device_type: CharField(50)              # 'desktop', 'mobile', 'tablet'
is_active: BooleanField
```

**Métodos:**
```python
def is_expired() -> bool:
    """Check if session expired due to inactivity"""
    return timezone.now() > self.expires_at

def refresh() -> None:
    """Refresh session on user activity"""
    self.last_activity_at = timezone.now()
    self.expires_at = timezone.now() + timedelta(hours=24)
    self.save()

def terminate() -> None:
    """Terminate session"""
    self.is_active = False
    self.save()
```

**Límites:**
- Máximo 5 sesiones concurrentes por usuario (configurable por plan)
- Sesiones más antiguas se cierran automáticamente al exceder límite

---

## Modelos de Billing

### SubscriptionPlan

**Propósito:** Definición de planes de suscripción disponibles

**Campos:**
```python
id: UUID (PK)
name: CharField(50) (unique)            # "professional"
display_name: CharField(100)            # "Professional"
description: TextField
price_monthly: DecimalField             # 99.00
price_annual: DecimalField              # 950.00 (10% discount)
features: JSONField                     # Lista de features
limits: JSONField                       # Límites del plan
is_active: BooleanField                 # Si está disponible
sort_order: IntegerField                # Orden en UI
```

**Estructura de Features JSON:**
```json
{
  "custom_roles": true,
  "mfa": true,
  "api_access": true,
  "custom_branding": true,
  "sso": false,
  "priority_support": true,
  "audit_logs": true,
  "webhooks": true
}
```

**Estructura de Limits JSON:**
```json
{
  "max_users": 50,
  "max_storage_bytes": 53687091200,    // 50 GB
  "max_api_calls_per_month": 100000,
  "max_custom_roles": 50,
  "session_timeout_hours": 24
}
```

**Planes Predefinidos:**
```python
PLANS = [
    {
        'name': 'free',
        'display_name': 'Free',
        'price_monthly': 0,
        'price_annual': 0,
        'limits': {
            'max_users': 5,
            'max_storage_bytes': 1073741824,  # 1 GB
            'max_api_calls_per_month': 1000,
        },
        'features': {
            'custom_roles': False,
            'mfa': False,
        }
    },
    {
        'name': 'starter',
        'display_name': 'Starter',
        'price_monthly': 29.00,
        'price_annual': 290.00,
        'limits': {
            'max_users': 10,
            'max_storage_bytes': 5368709120,  # 5 GB
            'max_api_calls_per_month': 10000,
        },
        'features': {
            'custom_roles': False,
            'mfa': True,
        }
    },
    {
        'name': 'professional',
        'display_name': 'Professional',
        'price_monthly': 99.00,
        'price_annual': 950.00,
        'limits': {
            'max_users': 50,
            'max_storage_bytes': 53687091200,  # 50 GB
            'max_api_calls_per_month': 100000,
        },
        'features': {
            'custom_roles': True,
            'mfa': True,
            'api_access': True,
            'custom_branding': True,
        }
    },
    {
        'name': 'enterprise',
        'display_name': 'Enterprise',
        'price_monthly': None,  # Custom pricing
        'price_annual': None,
        'limits': {
            'max_users': -1,  # Unlimited
            'max_storage_bytes': -1,
            'max_api_calls_per_month': -1,
        },
        'features': {
            'custom_roles': True,
            'mfa': True,
            'api_access': True,
            'custom_branding': True,
            'sso': True,
            'priority_support': True,
        }
    }
]
```

---

### Invoice

**Propósito:** Factura emitida a tenant

**Campos:**
```python
id: UUID (PK)
tenant: ForeignKey(Tenant)
invoice_number: CharField(50) (unique)  # "INV-2026-02-001234"
status: CharField(20)                   # 'draft', 'pending', 'paid', 'failed'
amount: DecimalField                    # 99.00
currency: CharField(3)                  # 'USD'
period_start: DateField                 # 2026-02-01
period_end: DateField                   # 2026-03-01
issued_at: DateTimeField
paid_at: DateTimeField
stripe_invoice_id: CharField(255)       # "in_xxxxx"
pdf_url: URLField                       # S3 URL
```

**Métodos:**
```python
def generate_pdf() -> str:
    """Generate PDF invoice and upload to S3"""
    pdf_content = render_to_string('invoices/invoice_template.html', {
        'invoice': self,
        'tenant': self.tenant,
        'line_items': self.get_line_items(),
    })

    pdf_file = weasyprint.HTML(string=pdf_content).write_pdf()

    # Upload to S3
    s3_key = f"invoices/{self.tenant.id}/{self.invoice_number}.pdf"
    s3_url = upload_to_s3(pdf_file, s3_key)

    self.pdf_url = s3_url
    self.save()

    return s3_url

def send_email() -> None:
    """Send invoice email to tenant admin"""
    admin_emails = self.tenant.tenantmembership_set.filter(
        roles__name='OrgAdmin'
    ).values_list('user__email', flat=True)

    for email in admin_emails:
        send_mail(
            subject=f'Invoice {self.invoice_number} - {self.tenant.name}',
            template='invoices/invoice_email.html',
            context={'invoice': self},
            recipient_list=[email],
            attachments=[('invoice.pdf', self.pdf_url)]
        )

def mark_as_paid() -> None:
    """Mark invoice as paid"""
    self.status = 'paid'
    self.paid_at = timezone.now()
    self.save()
```

---

### UsageTracking

**Propósito:** Tracking diario de métricas de uso por tenant

**Campos:**
```python
id: UUID (PK)
tenant: ForeignKey(Tenant)
date: DateField                         # 2026-02-09
metric_name: CharField(50)              # 'active_users', 'api_calls', 'storage_bytes'
value: BigIntegerField                  # 42
metadata: JSONField                     # Info adicional
```

**Métricas Trackeadas:**
```python
METRICS = [
    'active_users_daily',       # Usuarios que hicieron login
    'active_users_monthly',     # MAU
    'api_calls_daily',          # Llamadas API en el día
    'storage_bytes',            # Storage usado al fin del día
    'invitations_sent',         # Invitaciones enviadas
    'roles_created',            # Roles personalizados creados
]
```

**Métodos:**
```python
@staticmethod
def get_monthly_total(tenant: Tenant, metric: str) -> int:
    """Get total for metric in current month"""
    today = timezone.now().date()
    month_start = today.replace(day=1)

    return UsageTracking.objects.filter(
        tenant=tenant,
        metric_name=metric,
        date__gte=month_start,
        date__lte=today
    ).aggregate(total=Sum('value'))['total'] or 0

@staticmethod
def reset_monthly_counters():
    """Reset counters at start of month (cronjob)"""
    # Reset API calls counter on all tenants
    Tenant.objects.all().update(api_calls_this_month=0)
```

---

## Índices y Optimizaciones

### Índices Críticos

```sql
-- Tenant queries (most common)
CREATE INDEX idx_tenant_subdomain ON tenant (subdomain);
CREATE INDEX idx_tenant_subscription ON tenant (subscription_status, subscription_current_period_end);

-- User queries
CREATE INDEX idx_user_email ON user (email);
CREATE INDEX idx_user_active ON user (is_active, email);

-- Membership queries (hot path)
CREATE INDEX idx_membership_tenant_user ON tenant_membership (tenant_id, user_id);
CREATE INDEX idx_membership_active ON tenant_membership (tenant_id, is_active);

-- Role queries
CREATE INDEX idx_role_tenant_name ON role (tenant_id, name);
CREATE INDEX idx_role_system ON role (is_system_role);

-- Permission queries
CREATE INDEX idx_permission_codename ON permission (codename);
CREATE INDEX idx_permission_resource ON permission (resource);

-- Audit log queries
CREATE INDEX idx_audit_tenant_timestamp ON audit_log (tenant_id, timestamp DESC);
CREATE INDEX idx_audit_tenant_actor ON audit_log (tenant_id, actor_user_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_log (action, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_log (tenant_id, resource_type, resource_id);

-- Usage tracking
CREATE INDEX idx_usage_tenant_date_metric ON usage_tracking (tenant_id, date, metric_name);
```

### Query Optimization

**Avoid N+1 Queries:**
```python
# BAD
for membership in TenantMembership.objects.filter(tenant=tenant):
    roles = membership.roles.all()  # N queries

# GOOD
memberships = TenantMembership.objects.filter(tenant=tenant).prefetch_related('roles')
for membership in memberships:
    roles = membership.roles.all()  # 1 query
```

**Select Related for FK:**
```python
# BAD
users = User.objects.all()
for user in users:
    print(user.tenantmembership_set.first().tenant.name)  # N queries

# GOOD
memberships = TenantMembership.objects.select_related('user', 'tenant')
for membership in memberships:
    print(membership.tenant.name)  # 1 query
```

---

## Migrations Strategy

### Orden de Creación

```
1. Abstract models (no migrations)
2. Core models:
   - Tenant
   - User
3. Relationship models:
   - TenantMembership
4. RBAC models:
   - Permission (seed initial permissions)
   - Role (seed system roles)
   - PermissionGrant
   - PermissionGroup
   - PermissionDelegation
5. Auth models:
   - RefreshToken
   - MFARecoveryCode
   - Session
6. Billing models:
   - SubscriptionPlan (seed plans)
   - Invoice
   - PaymentMethod
   - UsageTracking
7. Audit models:
   - AuditLog
8. Other models:
   - Notification
   - EmailLog
   - FeatureFlag
   - TenantFeatureOverride
```

### Data Migrations

**Seed Permissions:**
```python
# migrations/000X_seed_permissions.py
def seed_permissions(apps, schema_editor):
    Permission = apps.get_model('rbac', 'Permission')

    permissions = [
        ('users.create', 'Create users', 'users', 'create', 'User Management'),
        ('users.read', 'View users', 'users', 'read', 'User Management'),
        # ... etc
    ]

    for codename, name, resource, action, category in permissions:
        Permission.objects.get_or_create(
            codename=codename,
            defaults={
                'name': name,
                'resource': resource,
                'action': action,
                'category': category
            }
        )
```

**Seed System Roles:**
```python
# migrations/000Y_seed_system_roles.py
def seed_system_roles(apps, schema_editor):
    Role = apps.get_model('rbac', 'Role')
    Permission = apps.get_model('rbac', 'Permission')

    # Create SuperAdmin role (not tenant-specific)
    superadmin = Role.objects.create(
        name='SuperAdmin',
        description='Platform administrator',
        is_system_role=True,
        tenant=None  # Global role
    )
    # Grant all permissions
    superadmin.permissions.set(Permission.objects.all())
```

---

## Referencias

- **PRD Completo:** `/prd/rbac-subscription-system.md`
- **Diagrama UML:** `class-diagram.puml`
- **Casos de Uso:** `use-case-diagram.puml`
- **API Endpoints:** Ver sección 8 del PRD

---

**Última Actualización:** 2026-02-09
**Versión:** 1.0
**Autor:** Tech Lead
