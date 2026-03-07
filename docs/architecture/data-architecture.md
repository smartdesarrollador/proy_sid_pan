# Arquitectura de Datos

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Diagrama de Modelos Principales](#diagrama-de-modelos-principales)
2. [Core Models](#core-models)
3. [RBAC Models](#rbac-models)
4. [Subscription Models](#subscription-models)
5. [Hub Client Portal Models](#hub-client-portal-models)
6. [Digital Services Models](#digital-services-models)
7. [Project Models](#project-models)
8. [Sharing Models](#sharing-models)
9. [Audit Models](#audit-models)
10. [Caching Strategy](#caching-strategy)
11. [File Storage](#file-storage)

---

## Diagrama de Modelos Principales

```
Tenant (1)
  ├── User (N)                        ForeignKey(Tenant)
  │     └── UserRole (N)              ForeignKey(User, Role)
  │     └── PublicProfile (1)         OneToOne(User)
  │           ├── DigitalCard (1)     OneToOne(PublicProfile)
  │           ├── LandingTemplate (1) OneToOne(PublicProfile)
  │           ├── PortfolioItem (N)   ForeignKey(PublicProfile)
  │           ├── CVDocument (1)      OneToOne(PublicProfile)
  │           ├── CustomDomain (1)    OneToOne(PublicProfile) [Enterprise]
  │           └── ServiceAnalytics (N) ForeignKey(PublicProfile)
  │
  ├── Role (N)                        ForeignKey(Tenant, null=True para system roles)
  │     └── RolePermission (N)        ForeignKey(Role, Permission)
  │
  ├── Permission (64 globales)        Sin tenant (catálogo global)
  │
  ├── Subscription (1)                OneToOne(Tenant)
  │     └── Invoice (N)               ForeignKey(Tenant)
  │           Invoice.amount_cents    PositiveIntegerField (centavos)
  │
  ├── PaymentMethod (N)               ForeignKey(Tenant)
  │
  ├── SSOToken (N)                    ForeignKey(User, Tenant)
  │
  ├── TenantService (N)               ForeignKey(Tenant, Service)
  │
  ├── ReferralCode (1)                OneToOne(Tenant)
  │     └── Referral (N)             ForeignKey(Tenant referrer, Tenant referred)
  │
  ├── Notification (N)                ForeignKey(Tenant)
  │
  ├── Promotion (N)                   ForeignKey(Tenant)
  │
  ├── Share (N)                       ForeignKey(Tenant, User shared_by, User shared_with)
  │
  ├── Project (N)                     ForeignKey(Tenant)
  │     └── ProjectSection (N)        ForeignKey(Project)
  │           └── ProjectItem (N)     ForeignKey(ProjectSection)
  │                 └── ProjectItemField (N) ForeignKey(ProjectItem)
  │
  └── AuditLog (N)                    ForeignKey(Tenant)

Service (catálogo global, sin tenant)
  └── TenantService (N)               ForeignKey(Service)
```

> **Nota sobre `Tenant.plan`**: Es un campo denormalizado que se actualiza via señal Django al cambiar `Subscription.plan`. La **fuente de verdad** es `Subscription.plan`. `Tenant.plan` existe para consultas rápidas sin JOIN, pero puede estar momentáneamente desincronizado si la señal falla.

---

## Core Models

### Tenant

Anchor central del sistema multi-tenant. Todos los modelos de negocio tienen FK a `Tenant`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `name` | CharField | Nombre de la organización |
| `slug` | SlugField unique | Identificador URL-safe (`acme`) |
| `subdomain` | CharField unique | Para `acme.plataforma.com` |
| `plan` | CharField | `free`, `starter`, `professional`, `enterprise` — denormalizado de `Subscription.plan` |
| `branding` | JSONField | `{logo_url, primary_color, ...}` |
| `settings` | JSONField | Configuración del tenant |

### User

Extiende `AbstractBaseUser`. Asociado a un único `Tenant`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `tenant` | FK → Tenant | Tenant al que pertenece |
| `email` | EmailField unique | Username |
| `name` | CharField | Nombre completo |
| `password` | CharField | Hash Argon2id |
| `mfa_enabled` | BooleanField | MFA activo |
| `mfa_secret` | CharField | Secreto TOTP (cifrado AES-256) |
| `email_verified` | BooleanField | Email confirmado |

---

## RBAC Models

### Role

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `tenant` | FK → Tenant (nullable) | null = system role global |
| `name` | CharField | Nombre del rol |
| `is_system_role` | BooleanField | True = no editable por tenant |
| `inherits_from` | FK → Role (self, nullable) | Herencia de permisos |

### Permission

64 permisos globales (sin tenant). Formato: `{resource}.{action}`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `codename` | CharField unique | Ej: `projects.create` |
| `resource` | CharField | Ej: `projects` |
| `action` | CharField | Ej: `create` |

### RolePermission

Many-to-many entre `Role` y `Permission` con scope condicional.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `role` | FK → Role | Rol que tiene el permiso |
| `permission` | FK → Permission | Permiso asignado |
| `scope` | CharField | `all`, `own`, `department`, `custom` |

### UserRole

Asignación de un rol a un usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | FK → User | Usuario |
| `role` | FK → Role | Rol asignado |
| `assigned_by` | FK → User | Quién asignó el rol |
| `assigned_at` | DateTimeField | Cuándo |

---

## Subscription Models

### Subscription

OneToOne con `Tenant`. Integrado con Stripe.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | OneToOne → Tenant | |
| `plan` | CharField | Plan activo — fuente de verdad (ver nota `Tenant.plan`) |
| `status` | CharField | `active`, `trialing`, `canceled`, `past_due` |
| `billing_cycle` | CharField | `monthly`, `annual` |
| `stripe_subscription_id` | CharField | ID en Stripe |
| `stripe_customer_id` | CharField | Customer ID en Stripe |
| `trial_end` | DateTimeField | Fin del trial (14 días) |
| `cancel_at_period_end` | BooleanField | Cancela al fin del período |

### Invoice

> **Corrección**: El campo de monto es `amount_cents` (`PositiveIntegerField` en centavos), NO `amount` (`DecimalField`). La API expone `amount_cents: number` y una propiedad calculada `amount_display: str` (ej. `"$29.00"`).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `amount_cents` | PositiveIntegerField | Monto en centavos (ej. 2900 = $29.00) |
| `currency` | CharField | `USD` default |
| `status` | CharField | `draft`, `open`, `paid`, `void` |
| `stripe_invoice_id` | CharField | ID en Stripe |
| `pdf_url` | URLField | URL del PDF de factura |

---

## Hub Client Portal Models

### PaymentMethod

Métodos de pago del tenant. Soporta Stripe (tarjetas) y wallets LATAM.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `type` | CharField | `card`, `bank_account`, `wallet`, `local_payment` |
| `is_default` | BooleanField | Método predeterminado |
| `stripe_payment_method_id` | CharField | ID en Stripe (tarjetas) |
| `brand` | CharField | `visa`, `mastercard` |
| `last4` | CharField | Últimos 4 dígitos |
| `exp_month`, `exp_year` | SmallIntegerField | Expiración de tarjeta |
| `external_type` | CharField | `paypal`, `mercadopago`, `yape`, `plin`, `nequi`, `daviplata` |
| `external_email` | EmailField | Para PayPal, MercadoPago |
| `external_phone` | CharField | Para Yape, Plin, Nequi, Daviplata |
| `external_account_id` | CharField | Token de billetera (cifrado AES-256) |

**8 métodos de pago soportados:**

| Tipo | Marca | Identificador | Región |
|------|-------|---------------|--------|
| Tarjeta | Visa | `visa` | Global |
| Tarjeta | Mastercard | `mastercard` | Global |
| Billetera digital | PayPal | `paypal` | Global |
| Billetera digital | MercadoPago | `mercadopago` | LATAM |
| Pago local | Yape | `yape` | Perú |
| Pago local | Plin | `plin` | Perú |
| Pago local | Nequi | `nequi` | Colombia |
| Pago local | Daviplata | `daviplata` | Colombia |

### SSOToken

Ver documentación completa en [sso-architecture.md](sso-architecture.md).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | FK → User | Usuario que solicita el token |
| `tenant` | FK → Tenant | Tenant del usuario |
| `service` | CharField | `workspace`, `vista`, `desktop` |
| `token` | CharField(64) unique | String opaco (no JWT) |
| `used_at` | DateTimeField (nullable) | Cuándo se usó; `null` = no usado |
| `expires_at` | DateTimeField | `created_at + 60s` |

**Validez**: `used_at IS NULL AND expires_at > now()`

### Service + TenantService

Catálogo de servicios de la plataforma y los adquiridos por cada tenant.

**Service** (catálogo global, sin tenant):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `slug` | SlugField unique | `workspace`, `vista`, `desktop` |
| `name` | CharField | Nombre del servicio |
| `url_template` | CharField | `https://{subdomain}.workspace.app` |
| `min_plan` | CharField | Plan mínimo requerido (`free`, `starter`, etc.) |
| `is_active` | BooleanField | Si está disponible en el catálogo |

**TenantService** (relación tenant → servicio):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `service` | FK → Service | |
| `status` | CharField | `active`, `suspended`, `locked` |
| `acquired_at` | DateTimeField | Cuándo fue adquirido |

`unique_together = [['tenant', 'service']]`

### ReferralCode + Referral

Programa de referidos: cada tenant tiene un código único. Los referidos son relaciones entre tenants.

**ReferralCode** (OneToOne con Tenant):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | OneToOne → Tenant | |
| `code` | CharField(50) unique | Código de referido |

**Referral** (tenant que refirió → tenant referido):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `referrer` | FK → Tenant | Tenant que compartió el código |
| `referred` | FK → Tenant | Tenant que se registró con el código |
| `status` | CharField | `pending`, `active`, `expired` |
| `credit_amount` | DecimalField | Crédito ganado (default $29.00 USD) |
| `activated_at` | DateTimeField (nullable) | Cuándo se activó la suscripción |

`unique_together = [['referrer', 'referred']]`

### Notification

Notificaciones in-app. Scoping de categorías por frontend:

| Categoría | Admin Panel | Hub Client Portal |
|-----------|------------|-------------------|
| `security` | ✅ | ✅ |
| `billing` | ✅ | ✅ |
| `system` | ✅ | ✅ |
| `users` | ✅ | ❌ |
| `roles` | ✅ | ❌ |
| `services` | ❌ | ✅ |

El endpoint `/api/v1/admin/notifications/` filtra categorías admin; `/api/v1/app/notifications/` filtra categorías Hub.

### Promotion

Códigos y campañas promocionales del tenant.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `code` | CharField unique | Código de descuento |
| `name` | CharField | Nombre de la campaña |
| `type` | CharField | `percentage`, `fixed_amount`, `trial_extension` |
| `value` | DecimalField | Valor del descuento |
| `max_discount` | DecimalField (nullable) | Tope máximo para descuentos porcentuales |
| `applicable_plans` | JSONField | Planes donde aplica |
| `status` | CharField | `active`, `paused`, `expired`, `depleted` |
| `current_uses` | IntegerField | Usos actuales |
| `max_uses` | IntegerField (nullable) | null = ilimitado |
| `starts_at` | DateTimeField | Inicio de vigencia |
| `expires_at` | DateTimeField (nullable) | Fin de vigencia |

---

## Digital Services Models

Modelos para los perfiles públicos con SSR. Todos parten de `PublicProfile`.

### PublicProfile

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | OneToOne → User | |
| `username` | SlugField unique | Ej: `jsmith` (slug público) |
| `display_name` | CharField | Nombre visible |
| `bio` | TextField | Descripción corta |
| `is_public` | BooleanField | Perfil visible públicamente |
| `meta_title` | CharField | Para SEO (60 chars) |
| `meta_description` | CharField | Para SEO (160 chars) |

### DigitalCard

OneToOne con `PublicProfile`. Tarjeta de contacto digital.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `email`, `phone`, `location` | CharField | Datos de contacto |
| `linkedin_url`, `twitter_url`, `github_url`, ... | URLField | Redes sociales |
| `primary_color`, `background_color` | CharField | Hex colors del tema |
| `qr_code` | ImageField | QR generado automáticamente |
| `total_views`, `unique_visitors` | IntegerField | Stats (actualizados por analytics) |

### LandingTemplate

OneToOne con `PublicProfile`. Landing page personalizable.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `template_type` | CharField | `basic`, `minimal`, `corporate`, `creative` |
| `sections` | JSONField | `[{type: 'hero', props: {...}}, ...]` |
| `contact_email` | EmailField | Para formulario de contacto |
| `custom_css` | TextField | CSS personalizado (Professional+) |
| `ga_tracking_id` | CharField | Google Analytics (Professional+) |

### PortfolioItem

Múltiples por `PublicProfile`. Items del portafolio público.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title`, `slug` | CharField | Título e identificador |
| `description_short` | CharField | 200 chars |
| `description_full` | TextField | Markdown |
| `cover_image` | ImageField | Imagen principal |
| `gallery_images` | JSONField | `[{url, caption}, ...]` |
| `tags` | JSONField | `['react', 'django', ...]` |
| `is_featured`, `order` | BooleanField, IntegerField | Orden de display |
| `demo_url`, `repo_url` | URLField | Links del proyecto |

### CVDocument

OneToOne con `PublicProfile`. CV digital.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `professional_summary` | TextField | Resumen ejecutivo |
| `experience` | JSONField | `[{company, position, start_date, ...}]` |
| `education` | JSONField | `[{institution, degree, ...}]` |
| `skills` | JSONField | `['Python', 'React', ...]` |
| `languages` | JSONField | `[{language, level}]` |
| `certifications` | JSONField | `[{title, issuer, date, url}]` |

### ServiceAnalytics

Analytics por día para servicios digitales públicos. Diferente de `analytics/` (analytics empresarial del Admin Panel que usa Redis + computed on-demand): `ServiceAnalytics` persiste en DB para histórico a largo plazo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `profile` | FK → PublicProfile | |
| `service` | CharField | `tarjeta`, `landing`, `portafolio`, `cv` |
| `date` | DateField | Día de las métricas |
| `page_views` | IntegerField | Vistas de página |
| `unique_visitors` | IntegerField | Visitantes únicos |
| `clicks` | JSONField | `{'linkedin': 10, 'github': 5, ...}` |

`unique_together = [['profile', 'service', 'date']]`

---

## Project Models

### Project → ProjectSection → ProjectItem → ProjectItemField

Jerarquía de 4 niveles para gestión de proyectos internos (no confundir con `PortfolioItem`).

| Modelo | Descripción |
|--------|-------------|
| `Project` | Proyecto con nombre, color, icon, owner, status (active/archived/paused) |
| `ProjectSection` | Agrupación dentro del proyecto (nombre, color, order) |
| `ProjectItem` | Item en una sección: tipo `credential`, `document`, `link`, `note`, `config` |
| `ProjectItemField` | Campo customizable del item: `text`, `password` (cifrado), `email`, `url`, `date` |

---

## Sharing Models

Compartición polimórfica de recursos entre usuarios del mismo tenant.

### Share

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `resource_type` | CharField | `project`, `task`, `file`, etc. (polimórfico) |
| `resource_id` | UUIDField | ID del recurso compartido |
| `shared_by` | FK → User | Quien compartió |
| `shared_with` | FK → User | Con quién se compartió |
| `permission_level` | CharField | `viewer`, `commenter`, `editor`, `admin` |
| `is_inherited` | BooleanField | True si el permiso viene del padre (ej. proyecto) |
| `notify_on_changes` | BooleanField | Notificar al usuario al cambiar |
| `expires_at` | DateTimeField (nullable) | Compartición temporal |

`unique_together = [['tenant', 'resource_type', 'resource_id', 'shared_with']]`

### SharePermission

Define la matriz de permisos específicos incluidos en cada nivel de acceso, por tipo de recurso.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `permission_level` | CharField | `viewer`, `commenter`, `editor`, `admin` |
| `resource_type` | CharField | `project`, `task`, etc. |
| `permissions` | JSONField | `{'read': true, 'create': false, 'update': true, 'delete': false, 'share': false}` |

**Matriz de permisos por nivel:**

| Nivel | Leer | Comentar | Editar | Compartir | Eliminar |
|-------|------|----------|--------|-----------|----------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Commenter** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅* |

*Solo si el owner original lo permite.

**Herencia en Share Scope**: Al compartir un grupo (proyecto, carpeta), los permisos se heredan a elementos hijo. Los permisos locales (específicos del item) sobrescriben los heredados.

---

## Audit Models

### AuditLog

Log inmutable de auditoría. No tiene `UPDATE` ni `DELETE` habilitados via RLS.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `user` | FK → User (nullable) | Actor |
| `action` | CharField | Ej: `user.create`, `sso.token_created`, `share.created` |
| `resource_type` | CharField | Ej: `user`, `project`, `role` |
| `resource_id` | UUID | ID del recurso afectado |
| `changes` | JSONField | Snapshot antes/después |
| `ip_address` | GenericIPAddressField | IP del actor |
| `timestamp` | DateTimeField auto | Inmutable |

---

## Caching Strategy

| Nivel | Tecnología | TTL | Propósito |
|-------|-----------|-----|-----------|
| **Redis (SSR Pages)** | Redis 7 | 5 minutos | Páginas renderizadas de Digital Services |
| **Redis (Feature Flags)** | Redis 7 | 1 hora | Cache de feature flags por plan (evitar DB queries) |
| **Redis (Rate Limiting)** | Redis 7 | 1 minuto (ventana) | Contadores de rate limiting por usuario/IP |
| **Redis (Refresh Tokens)** | Redis 7 | 7 días | Sesiones JWT |
| **ServiceAnalytics** | PostgreSQL | Histórico permanente | Métricas diarias por servicio digital (no en Redis) |
| **ISR (Next.js)** | Next.js built-in | 60 segundos | Pre-rendering incremental de páginas públicas |
| **CDN (Cloudflare/CloudFront)** | CDN | 1 hora | Assets estáticos, imágenes optimizadas |
| **Browser Cache** | HTTP headers | 5 minutos | Páginas públicas SSR |

### Invalidación de cache SSR

```python
# Formato de clave Redis:  ssr:{service}:{username}:{lang}
# Ejemplo:                 ssr:tarjeta:jsmith:es

@receiver(post_save, sender=PublicProfile)
def invalidate_profile_cache(sender, instance, **kwargs):
    for service in ['tarjeta', 'landing', 'portafolio', 'cv']:
        redis_client.delete(f"ssr:{service}:{instance.username}")
```

### Performance targets de cache

| Métrica | Target |
|---------|--------|
| Cache hit ratio (SSR) | > 80% |
| TTFB (cached) | < 200ms |
| TTFB (uncached) | < 1s |
| LCP (Largest Contentful Paint) | < 2.5s |

---

## File Storage

| Tipo de archivo | Storage | Organización |
|----------------|---------|-------------|
| Avatares de usuario | S3 / MinIO | `avatars/{user_id}/` |
| Imágenes de portfolio | S3 / MinIO | `portfolio/covers/{profile_slug}/` |
| Imágenes OG (SEO) | S3 / MinIO | `og-images/{profile_slug}/` |
| QR Codes | S3 / MinIO | `qr-codes/{profile_slug}/` |
| Assets estáticos (JS, CSS) | CDN | CloudFront / Cloudflare |
| Documentos (archivos del cliente) | S3 / MinIO | `files/{tenant_id}/{user_id}/` |
| PDFs de facturas | S3 / MinIO | `invoices/{tenant_id}/` |

**Upload de archivos grandes** (Enterprise): chunked upload con S3 multipart para archivos hasta 5GB.

---

**Fuente**: [`prd/technical/data-models.md`](../../prd/technical/data-models.md) + [`prd/features/hub-client-portal.md`](../../prd/features/hub-client-portal.md) + [`prd/features/sharing-collaboration.md`](../../prd/features/sharing-collaboration.md)

**Última actualización**: 2026-03-06
