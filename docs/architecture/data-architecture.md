# Arquitectura de Datos

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Diagrama de Modelos Principales](#diagrama-de-modelos-principales)
2. [Core Models](#core-models)
3. [RBAC Models](#rbac-models)
4. [Subscription Models](#subscription-models)
5. [Digital Services Models](#digital-services-models)
6. [Project Models](#project-models)
7. [Audit Models](#audit-models)
8. [Caching Strategy](#caching-strategy)
9. [File Storage](#file-storage)

---

## Diagrama de Modelos Principales

```
Tenant (1)
  ├── User (N)                      ForeignKey(Tenant)
  │     └── UserRole (N)            ForeignKey(User, Role)
  │     └── PublicProfile (1)       OneToOne(User)
  │           ├── DigitalCard (1)   OneToOne(PublicProfile)
  │           ├── LandingTemplate (1) OneToOne(PublicProfile)
  │           ├── PortfolioItem (N) ForeignKey(PublicProfile)
  │           ├── CVDocument (1)    OneToOne(PublicProfile)
  │           └── CustomDomain (1) OneToOne(PublicProfile) [Enterprise]
  │
  ├── Role (N)                      ForeignKey(Tenant, null=True para system roles)
  │     └── RolePermission (N)      ForeignKey(Role, Permission)
  │
  ├── Permission (62 globales)      Sin tenant (catálogo global)
  │
  ├── Subscription (1)              OneToOne(Tenant)
  │     └── Invoice (N)             ForeignKey(Tenant)
  │
  ├── Project (N)                   ForeignKey(Tenant)
  │     └── ProjectSection (N)      ForeignKey(Project)
  │           └── ProjectItem (N)   ForeignKey(ProjectSection)
  │                 └── ProjectItemField (N) ForeignKey(ProjectItem)
  │
  └── AuditLog (N)                  ForeignKey(Tenant)
```

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
| `plan` | CharField | `free`, `starter`, `professional`, `enterprise` |
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
| `mfa_secret` | CharField | Secreto TOTP (cifrado) |
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

62 permisos globales (sin tenant). Formato: `{resource}.{action}`.

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
| `plan` | CharField | Plan activo |
| `status` | CharField | `active`, `trialing`, `canceled`, `past_due` |
| `billing_cycle` | CharField | `monthly`, `annual` |
| `stripe_subscription_id` | CharField | ID en Stripe |
| `stripe_customer_id` | CharField | Customer ID en Stripe |
| `trial_end` | DateTimeField | Fin del trial (14 días) |
| `cancel_at_period_end` | BooleanField | Cancela al fin del período |

### Invoice

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `amount` | DecimalField | Monto |
| `currency` | CharField | `USD` default |
| `status` | CharField | `draft`, `open`, `paid`, `void` |
| `stripe_invoice_id` | CharField | ID en Stripe |
| `pdf_url` | URLField | URL del PDF de factura |

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

## Audit Models

### AuditLog

Log inmutable de auditoría. No tiene `UPDATE` ni `DELETE` habilitados via RLS.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenant` | FK → Tenant | |
| `user` | FK → User (nullable) | Actor |
| `action` | CharField | Ej: `user.create`, `role.assign`, `share.created` |
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

**Fuente**: [`prd/technical/data-models.md`](../../prd/technical/data-models.md)

**Última actualización**: 2026-02-26
