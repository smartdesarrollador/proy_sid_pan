# Data Models (Django)

[⬅️ Volver al README](../README.md)

---

## Índice
- [Core Models](#core-models)
- [RBAC Models](#rbac-models)
- [Subscription Models](#subscription-models)
- [Project Models](#project-models)
- [Audit Models](#audit-models)

---

## Core Models

### Tenant

```python
class Tenant(models.Model):
    """Organización/tenant en sistema multi-tenant"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    subdomain = models.CharField(max_length=63, unique=True)
    
    # Subscription
    plan = models.CharField(
        max_length=20,
        choices=[
            ('free', 'Free'),
            ('starter', 'Starter'),
            ('professional', 'Professional'),
            ('enterprise', 'Enterprise'),
        ],
        default='free'
    )
    
    # Settings
    branding = models.JSONField(default=dict)  # {logo_url, primary_color, etc.}
    settings = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenants'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['subdomain']),
        ]
```

---

### User

```python
class User(AbstractBaseUser, PermissionsMixin):
    """Usuario del sistema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    
    # Profile
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    avatar_url = models.URLField(blank=True)
    
    # Auth
    password = models.CharField(max_length=128)  # Hashed with Argon2id
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    
    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True)
    
    # Metadata
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Django required fields
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['tenant', 'email']),
            models.Index(fields=['tenant', 'is_active']),
        ]
```

---

## RBAC Models

### Role

```python
class Role(models.Model):
    """Rol con permisos asociados"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, null=True, blank=True)
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # System roles (predefined, no tenant)
    is_system_role = models.BooleanField(default=False)
    
    # Hierarchy
    inherits_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'roles'
        unique_together = [['tenant', 'name']]
```

---

### Permission

```python
class Permission(models.Model):
    """Permiso granular (resource.action)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    codename = models.CharField(max_length=100, unique=True)  # e.g., 'projects.create'
    name = models.CharField(max_length=255)  # Human-readable
    description = models.TextField(blank=True)
    
    # Categorization
    resource = models.CharField(max_length=50)  # 'projects', 'users', 'tasks'
    action = models.CharField(max_length=50)    # 'create', 'read', 'update', 'delete'
    
    class Meta:
        db_table = 'permissions'
```

---

### RolePermission

```python
class RolePermission(models.Model):
    """Many-to-many con scope condicional"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    role = models.ForeignKey('Role', related_name='role_permissions', on_delete=models.CASCADE)
    permission = models.ForeignKey('Permission', on_delete=models.CASCADE)
    
    # Conditional scope
    scope = models.CharField(
        max_length=20,
        choices=[
            ('all', 'All'),
            ('own', 'Own'),
            ('department', 'Department'),
            ('custom', 'Custom'),
        ],
        default='all'
    )
    
    class Meta:
        db_table = 'role_permissions'
        unique_together = [['role', 'permission']]
```

---

### UserRole

```python
class UserRole(models.Model):
    """Asignación de rol a usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey('User', related_name='user_roles', on_delete=models.CASCADE)
    role = models.ForeignKey('Role', on_delete=models.CASCADE)
    
    assigned_by = models.ForeignKey('User', related_name='+', on_delete=models.SET_NULL, null=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_roles'
        unique_together = [['user', 'role']]
```

---

## Subscription Models

### Subscription

```python
class Subscription(models.Model):
    """Suscripción de tenant"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.OneToOneField('Tenant', on_delete=models.CASCADE)
    
    plan = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('trialing', 'Trialing'),
            ('canceled', 'Canceled'),
            ('past_due', 'Past Due'),
        ]
    )
    
    billing_cycle = models.CharField(
        max_length=10,
        choices=[('monthly', 'Monthly'), ('annual', 'Annual')]
    )
    
    # Stripe
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    
    # Dates
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
```

---

### Invoice

```python
class Invoice(models.Model):
    """Factura generada"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    
    stripe_invoice_id = models.CharField(max_length=255, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('open', 'Open'),
            ('paid', 'Paid'),
            ('void', 'Void'),
        ]
    )
    
    pdf_url = models.URLField(blank=True)
    
    # Dates
    invoice_date = models.DateTimeField()
    due_date = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'invoices'
        indexes = [
            models.Index(fields=['tenant', 'status']),
        ]
```

---

## Project Models

### Project

```python
class Project(models.Model):
    """Proyecto de portafolio"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, default='folder')
    
    owner = models.ForeignKey('User', related_name='owned_projects', on_delete=models.PROTECT)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('archived', 'Archived'), ('paused', 'Paused')],
        default='active'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
```

---

### ProjectSection

```python
class ProjectSection(models.Model):
    """Sección dentro de proyecto"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey('Project', related_name='sections', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default='#6B7280')
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_sections'
        ordering = ['order', 'created_at']
        unique_together = [['project', 'name']]
```

---

### ProjectItem

```python
class ProjectItem(models.Model):
    """Item dentro de sección"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    section = models.ForeignKey('ProjectSection', related_name='items', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    item_type = models.CharField(
        max_length=50,
        choices=[
            ('credential', 'Credential'),
            ('document', 'Document'),
            ('link', 'Link'),
            ('note', 'Note'),
            ('config', 'Configuration'),
        ]
    )
    order = models.IntegerField(default=0)
    
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_items'
        ordering = ['order', 'created_at']
```

---

### ProjectItemField

```python
class ProjectItemField(models.Model):
    """Campo customizable de item"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    item = models.ForeignKey('ProjectItem', related_name='fields', on_delete=models.CASCADE)
    
    field_name = models.CharField(max_length=100)
    field_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Text'),
            ('password', 'Password'),
            ('email', 'Email'),
            ('url', 'URL'),
            ('date', 'Date'),
            ('textarea', 'Textarea'),
        ]
    )
    
    value = models.TextField()  # Encrypted for password fields
    is_encrypted = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'project_item_fields'
        unique_together = [['item', 'field_name']]
```

---

## Audit Models

### AuditLog

```python
class AuditLog(models.Model):
    """Log inmutable de auditoría"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    
    # Actor
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    
    # Action
    action = models.CharField(max_length=100)  # 'user.create', 'role.assign', 'share.created'
    
    # Resource
    resource_type = models.CharField(max_length=50)
    resource_id = models.UUIDField()
    
    # Changes
    changes = models.JSONField(default=dict)
    
    # Context
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['tenant', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]
```

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Architecture](architecture.md)
- [Ver API Endpoints](api-endpoints.md)

---

**Última actualización**: 2026-02-10

**Nota**: Para modelos completos con todos los campos y relaciones, consultar el archivo original en `/prd/rbac-subscription-system.md` sección 6.1.
