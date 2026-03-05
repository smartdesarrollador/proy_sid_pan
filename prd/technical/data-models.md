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

### Catálogo de Permisos (62 permisos)

El sistema implementa 62 permisos predefinidos organizados en 13 categorías. Estos permisos se crean en la migración inicial.

```python
# === CATÁLOGO DE PERMISOS (62 permisos en 13 categorías) ===

# Categoría: Users & Authentication (5)
Permission(codename='users.create', name='Crear Usuarios', resource='users', action='create', description='Permite crear nuevos usuarios en el tenant'),
Permission(codename='users.read', name='Ver Usuarios', resource='users', action='read', description='Permite ver información de usuarios'),
Permission(codename='users.update', name='Editar Usuarios', resource='users', action='update', description='Permite editar información de usuarios'),
Permission(codename='users.delete', name='Eliminar Usuarios', resource='users', action='delete', description='Permite eliminar usuarios del tenant'),
Permission(codename='users.invite', name='Invitar Usuarios', resource='users', action='invite', description='Permite enviar invitaciones a nuevos usuarios'),

# Categoría: Roles & Permissions (5)
Permission(codename='roles.create', name='Crear Roles', resource='roles', action='create', description='Permite crear roles personalizados'),
Permission(codename='roles.read', name='Ver Roles', resource='roles', action='read', description='Permite ver roles y sus permisos'),
Permission(codename='roles.update', name='Editar Roles', resource='roles', action='update', description='Permite editar roles personalizados'),
Permission(codename='roles.delete', name='Eliminar Roles', resource='roles', action='delete', description='Permite eliminar roles personalizados'),
Permission(codename='roles.assign', name='Asignar Roles', resource='roles', action='assign', description='Permite asignar roles a usuarios'),

# Categoría: Tasks Service (7)
Permission(codename='tasks.create', name='Crear Tareas', resource='tasks', action='create', description='Permite crear nuevas tareas'),
Permission(codename='tasks.read', name='Ver Tareas', resource='tasks', action='read', description='Permite ver tareas'),
Permission(codename='tasks.update', name='Editar Tareas', resource='tasks', action='update', description='Permite editar tareas'),
Permission(codename='tasks.delete', name='Eliminar Tareas', resource='tasks', action='delete', description='Permite eliminar tareas'),
Permission(codename='tasks.assign', name='Asignar Tareas', resource='tasks', action='assign', description='Permite asignar tareas a otros usuarios'),
Permission(codename='boards.admin', name='Gestionar Tableros Kanban', resource='boards', action='admin', description='Permite administrar tableros Kanban'),
Permission(codename='boards.reorder', name='Reordenar Tareas/Columnas', resource='boards', action='reorder', description='Permite reordenar tareas y columnas en tableros'),

# Categoría: Calendar Service (6)
Permission(codename='calendar.create', name='Crear Eventos', resource='calendar', action='create', description='Permite crear eventos de calendario'),
Permission(codename='calendar.read', name='Ver Calendario', resource='calendar', action='read', description='Permite ver calendario y eventos'),
Permission(codename='calendar.update', name='Editar Eventos', resource='calendar', action='update', description='Permite editar eventos de calendario'),
Permission(codename='calendar.delete', name='Eliminar Eventos', resource='calendar', action='delete', description='Permite eliminar eventos'),
Permission(codename='calendar.share', name='Compartir Calendario/Eventos', resource='calendar', action='share', description='Permite compartir calendario con otros usuarios'),
Permission(codename='calendar.sync', name='Sincronizar con Google/Outlook', resource='calendar', action='sync', description='Permite sincronizar calendario con servicios externos'),

# Categoría: Landing Pages (6)
Permission(codename='landing.create', name='Crear Landing Pages', resource='landing', action='create', description='Permite crear nuevas landing pages'),
Permission(codename='landing.read', name='Ver Landing Pages', resource='landing', action='read', description='Permite ver landing pages'),
Permission(codename='landing.edit', name='Editar Contenido/Secciones', resource='landing', action='edit', description='Permite editar contenido de landing pages'),
Permission(codename='landing.publish', name='Publicar Cambios en Vivo', resource='landing', action='publish', description='Permite publicar cambios de landing pages'),
Permission(codename='branding.update', name='Modificar Branding (Colores, Logos)', resource='branding', action='update', description='Permite modificar branding del tenant'),
Permission(codename='forms.manage', name='Configurar Formularios de Contacto', resource='forms', action='manage', description='Permite configurar formularios de captura de leads'),

# Categoría: Portfolio & Projects (8)
Permission(codename='projects.create', name='Crear Proyectos', resource='projects', action='create', description='Permite crear nuevos proyectos'),
Permission(codename='projects.read', name='Ver Proyectos', resource='projects', action='read', description='Permite ver proyectos'),
Permission(codename='projects.update', name='Editar Proyectos', resource='projects', action='update', description='Permite editar proyectos'),
Permission(codename='projects.delete', name='Eliminar Proyectos', resource='projects', action='delete', description='Permite eliminar proyectos'),
Permission(codename='projects.sections', name='Gestionar Secciones/Tags', resource='projects', action='sections', description='Permite gestionar secciones dentro de proyectos'),
Permission(codename='credentials.manage', name='Crear/Editar Credenciales', resource='credentials', action='manage', description='Permite crear y editar credenciales encriptadas'),
Permission(codename='credentials.reveal', name='Ver Contraseñas Encriptadas', resource='credentials', action='reveal', description='Permite revelar contraseñas encriptadas (audit logged)'),
Permission(codename='portfolio.publish', name='Publicar Items de Portfolio', resource='portfolio', action='publish', description='Permite publicar items de portfolio públicamente'),

# Categoría: Digital Services (5)
Permission(codename='digital_services.tarjeta', name='Gestionar Tarjeta Digital', resource='digital_services', action='tarjeta', description='Permite gestionar tarjeta digital pública'),
Permission(codename='digital_services.landing', name='Gestionar Landing Pública', resource='digital_services', action='landing', description='Permite gestionar landing pública del usuario'),
Permission(codename='digital_services.cv', name='Gestionar CV Digital', resource='digital_services', action='cv', description='Permite gestionar CV digital público'),
Permission(codename='digital_services.portfolio', name='Gestionar Portfolio Público', resource='digital_services', action='portfolio', description='Permite gestionar portfolio público'),
Permission(codename='public_profiles.analytics', name='Ver Analytics de Perfil Público', resource='public_profiles', action='analytics', description='Permite ver analytics de perfiles públicos'),

# Categoría: Billing & Subscriptions (4)
Permission(codename='billing.read', name='Ver Facturación', resource='billing', action='read', description='Permite ver información de facturación'),
Permission(codename='billing.manage', name='Actualizar Métodos de Pago', resource='billing', action='manage', description='Permite gestionar métodos de pago'),
Permission(codename='billing.upgrade', name='Cambiar Plan de Suscripción', resource='billing', action='upgrade', description='Permite cambiar plan de suscripción'),
Permission(codename='promotions.manage', name='Crear/Editar Códigos Promocionales', resource='promotions', action='manage', description='Permite gestionar promociones'),

# Categoría: Customers (9)
Permission(codename='customers.read', name='Ver Clientes', resource='customers', action='read', description='Permite ver información de clientes'),
Permission(codename='customers.create', name='Crear Clientes', resource='customers', action='create', description='Permite crear nuevos clientes'),
Permission(codename='customers.update', name='Editar Clientes', resource='customers', action='update', description='Permite editar información de clientes'),
Permission(codename='customers.delete', name='Eliminar Clientes', resource='customers', action='delete', description='Permite eliminar clientes'),
Permission(codename='customers.suspend', name='Suspender Clientes', resource='customers', action='suspend', description='Permite suspender cuentas de clientes'),
Permission(codename='customers.analytics', name='Ver Analytics de Clientes', resource='customers', action='analytics', description='Permite ver analytics de clientes (MRR, health score, churn)'),
Permission(codename='customers.export', name='Exportar Datos de Clientes', resource='customers', action='export', description='Permite exportar datos de clientes'),
Permission(codename='subscriptions.manage', name='Gestionar Suscripciones', resource='subscriptions', action='manage', description='Permite gestionar suscripciones (upgrades/downgrades)'),
Permission(codename='subscriptions.cancel', name='Cancelar Suscripciones', resource='subscriptions', action='cancel', description='Permite cancelar suscripciones de clientes'),

# Categoría: Analytics (2)
Permission(codename='analytics.read', name='Ver Dashboards de Analytics', resource='analytics', action='read', description='Permite ver dashboards de analytics'),
Permission(codename='analytics.export', name='Exportar Datos de Analytics', resource='analytics', action='export', description='Permite exportar datos de analytics'),

# Categoría: Settings (2)
Permission(codename='settings.read', name='Ver Configuración', resource='settings', action='read', description='Permite ver configuración del tenant'),
Permission(codename='settings.update', name='Modificar Configuración', resource='settings', action='update', description='Permite modificar configuración del tenant'),

# Categoría: Audit (2)
Permission(codename='audit.read', name='Ver Logs de Auditoría', resource='audit', action='read', description='Permite ver logs de auditoría'),
Permission(codename='audit.export', name='Exportar Trails de Auditoría', resource='audit', action='export', description='Permite exportar trails de auditoría'),

# Categoría: Dashboard (1)
Permission(codename='dashboard.read', name='Ver Dashboard', resource='dashboard', action='read', description='Permite ver dashboard principal'),

# TOTAL: 62 permisos
```

**Referencia completa**: Ver [RBAC Roles & Permissions - Sección 6](rbac-roles-permissions.md#6-catálogo-de-permisos)

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

> **Nota:** El campo de monto es `amount_cents = PositiveIntegerField()` (entero en centavos), NO `amount = DecimalField()`. La API expone `amount_cents: number` y una propiedad calculada `amount_display: str` (ej. `"$29.00"`). El Admin Panel TypeScript usa ambos campos.

```python
class Invoice(models.Model):
    """Factura generada"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)

    stripe_invoice_id = models.CharField(max_length=255, blank=True)

    amount_cents = models.PositiveIntegerField()  # en centavos (ej. 2900 = $29.00)
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

## Digital Services Models

### PublicProfile

```python
class PublicProfile(models.Model):
    """Perfil público del usuario para servicios digitales"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='public_profile')
    username = models.SlugField(unique=True, max_length=50, db_index=True)
    display_name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True)  # "Desarrollador Full Stack"
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Privacy
    is_public = models.BooleanField(default=False)

    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    og_image = models.ImageField(upload_to='og-images/', blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'public_profiles'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['is_public', 'created_at']),
        ]

    def __str__(self):
        return f"{self.display_name} (@{self.username})"
```

---

### DigitalCard

```python
class DigitalCard(models.Model):
    """Tarjeta digital de contacto"""
    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='digital_card')

    # Contact Info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)  # "Madrid, España"

    # Social Links
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Theme
    primary_color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    background_color = models.CharField(max_length=7, default='#FFFFFF')

    # QR Code
    qr_code = models.ImageField(upload_to='qr-codes/', blank=True, null=True)

    # Stats (updated by analytics)
    total_views = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'digital_cards'

    def __str__(self):
        return f"Digital Card: {self.profile.username}"
```

---

### LandingTemplate

```python
class LandingTemplate(models.Model):
    """Landing page personalizable"""
    TEMPLATE_CHOICES = [
        ('basic', 'Basic'),
        ('minimal', 'Minimal'),
        ('corporate', 'Corporate'),
        ('creative', 'Creative'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='landing')
    template_type = models.CharField(max_length=20, choices=TEMPLATE_CHOICES, default='basic')

    # Sections (stored as JSON)
    sections = models.JSONField(default=list)  # [{ type: 'hero', props: {...} }, ...]

    # Contact Form Config
    contact_email = models.EmailField(blank=True)
    enable_contact_form = models.BooleanField(default=False)

    # Custom CSS (Professional+)
    custom_css = models.TextField(blank=True)

    # Google Analytics (Professional+)
    ga_tracking_id = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'landing_templates'

    def __str__(self):
        return f"Landing: {self.profile.username}"
```

---

### PortfolioItem

```python
class PortfolioItem(models.Model):
    """Proyecto de portafolio"""
    profile = models.ForeignKey(PublicProfile, on_delete=models.CASCADE, related_name='portfolio_items')

    title = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description_short = models.CharField(max_length=200)
    description_full = models.TextField()  # Supports markdown

    # Images
    cover_image = models.ImageField(upload_to='portfolio/covers/')
    gallery_images = models.JSONField(default=list)  # [{ url: '...', caption: '...' }, ...]

    # Links
    demo_url = models.URLField(blank=True)
    repo_url = models.URLField(blank=True)
    case_study_url = models.URLField(blank=True)

    # Organization
    tags = models.JSONField(default=list)  # ['web', 'react', 'tailwind']
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    # Dates
    project_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'portfolio_items'
        ordering = ['-is_featured', '-project_date']
        indexes = [
            models.Index(fields=['profile', 'is_featured']),
            models.Index(fields=['slug']),
        ]
        unique_together = [['profile', 'slug']]

    def __str__(self):
        return f"{self.title} - {self.profile.username}"
```

---

### CVDocument

```python
class CVDocument(models.Model):
    """CV digital del usuario"""
    LANGUAGE_LEVEL_CHOICES = [
        ('native', 'Native'),
        ('fluent', 'Fluent'),
        ('intermediate', 'Intermediate'),
        ('basic', 'Basic'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='cv')

    # Summary
    professional_summary = models.TextField(max_length=500, blank=True)

    # Experience (stored as JSON for flexibility)
    experience = models.JSONField(default=list)
    # [{ company, position, start_date, end_date, responsibilities }, ...]

    # Education
    education = models.JSONField(default=list)
    # [{ institution, degree, field, start_date, end_date }, ...]

    # Skills
    skills = models.JSONField(default=list)  # ['Python', 'Django', 'React', ...]

    # Languages
    languages = models.JSONField(default=list)
    # [{ language: 'English', level: 'fluent' }, ...]

    # Certifications
    certifications = models.JSONField(default=list)
    # [{ title, issuer, date, credential_url }, ...]

    # Template & Config
    template_type = models.CharField(max_length=20, default='classic')
    show_photo = models.BooleanField(default=True)
    show_contact = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cv_documents'

    def __str__(self):
        return f"CV: {self.profile.username}"
```

---

### CustomDomain (Enterprise)

```python
class CustomDomain(models.Model):
    """Dominio personalizado para usuarios Enterprise"""
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('failed', 'Failed'),
    ]

    SSL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('renewing', 'Renewing'),
        ('failed', 'Failed'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='custom_domain')
    domain = models.CharField(max_length=255, unique=True)

    # DNS Verification
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending'
    )
    verification_token = models.CharField(max_length=64, unique=True)
    last_verification_attempt = models.DateTimeField(null=True, blank=True)

    # SSL
    ssl_status = models.CharField(
        max_length=20,
        choices=SSL_STATUS_CHOICES,
        default='pending'
    )
    ssl_cert_expires_at = models.DateTimeField(null=True, blank=True)

    # Redirect Config
    default_service = models.CharField(max_length=20, default='landing')  # landing, tarjeta, portafolio, cv

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'custom_domains'
        indexes = [
            models.Index(fields=['domain']),
            models.Index(fields=['verification_status']),
        ]

    def __str__(self):
        return f"{self.domain} → {self.profile.username}"
```

---

### ServiceAnalytics

```python
class ServiceAnalytics(models.Model):
    """Analytics agregadas por día para servicios digitales"""
    SERVICE_CHOICES = [
        ('tarjeta', 'Tarjeta Digital'),
        ('landing', 'Landing Page'),
        ('portafolio', 'Portafolio'),
        ('cv', 'CV Digital'),
    ]

    profile = models.ForeignKey(PublicProfile, on_delete=models.CASCADE, related_name='analytics')
    service = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    date = models.DateField()

    # Metrics
    page_views = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)

    # Click tracking (JSON for flexibility)
    clicks = models.JSONField(default=dict)
    # { 'linkedin': 10, 'github': 5, 'demo_project_1': 3, ... }

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'service_analytics'
        unique_together = [['profile', 'service', 'date']]
        indexes = [
            models.Index(fields=['profile', 'service', 'date']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.profile.username} - {self.service} - {self.date}"
```

---

---

## Hub Client Portal Models

Modelos nuevos requeridos por el Hub Client Portal (no existen aún en el backend).

### PaymentMethod

```python
class PaymentMethod(models.Model):
    """Método de pago del tenant"""
    TYPE_CHOICES = [
        ('card', 'Card'),
        ('bank_account', 'Bank Account'),
        ('wallet', 'Digital Wallet'),
        ('local_payment', 'Local Payment'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='payment_methods')

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_default = models.BooleanField(default=False)

    # Stripe card fields
    stripe_payment_method_id = models.CharField(max_length=255, blank=True)
    brand = models.CharField(max_length=20, blank=True)   # 'visa', 'mastercard'
    last4 = models.CharField(max_length=4, blank=True)
    exp_month = models.PositiveSmallIntegerField(null=True, blank=True)
    exp_year = models.PositiveSmallIntegerField(null=True, blank=True)

    # LATAM wallet fields (extensión para Hub)
    external_type = models.CharField(
        max_length=20, blank=True,
        choices=[
            ('paypal', 'PayPal'),
            ('mercadopago', 'MercadoPago'),
            ('yape', 'Yape'),
            ('plin', 'Plin'),
            ('nequi', 'Nequi'),
            ('daviplata', 'Daviplata'),
        ]
    )
    external_email = models.EmailField(blank=True)
    external_phone = models.CharField(max_length=20, blank=True)
    external_account_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_methods'
        indexes = [
            models.Index(fields=['tenant', 'is_default']),
        ]
```

---

### SSOToken

```python
class SSOToken(models.Model):
    """Token de corta duración para SSO entre Hub y servicios"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    service = models.CharField(max_length=50)  # 'workspace' | 'vista' | 'desktop'
    token = models.CharField(max_length=64, unique=True)
    used_at = models.DateTimeField(null=True, blank=True)  # None = no usado (single-use)
    expires_at = models.DateTimeField()                     # created_at + 60s

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sso_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
        ]
```

**Validez:** `used_at is None AND expires_at > now()`

---

### Service + TenantService

```python
class Service(models.Model):
    """Catálogo de servicios disponibles en la plataforma"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    slug = models.SlugField(unique=True)           # 'workspace', 'vista', 'desktop'
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50)         # ícono Lucide
    url_template = models.CharField(max_length=255)  # 'https://{subdomain}.workspace.app'
    min_plan = models.CharField(max_length=20, default='free')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'services'


class TenantService(models.Model):
    """Servicios adquiridos por un tenant"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('locked', 'Locked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='tenant_services')
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    acquired_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tenant_services'
        unique_together = [['tenant', 'service']]
```

---

### ReferralCode + Referral

```python
class ReferralCode(models.Model):
    """Código de referido único por tenant"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.OneToOneField('Tenant', on_delete=models.CASCADE, related_name='referral_code')
    code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referral_codes'


class Referral(models.Model):
    """Registro de referido referrer → referred"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),   # registrado, aún no activo
        ('active', 'Active'),     # suscriptor activo, crédito aplicado
        ('expired', 'Expired'),   # nunca activó suscripción
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    referrer = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='referrals_given')
    referred = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='referral_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    credit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=29.00)
    activated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referrals'
        unique_together = [['referrer', 'referred']]
```

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Architecture](architecture.md)
- [Ver API Endpoints](api-endpoints.md)

---

**Última actualización**: 2026-03-04

**Nota**: Para modelos completos con todos los campos y relaciones, consultar el archivo original en `/prd/rbac-subscription-system.md` sección 6.1.
