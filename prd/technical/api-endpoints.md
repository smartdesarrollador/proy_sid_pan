# API Endpoints Reference

[⬅️ Volver al README](../README.md)

---

## Índice
- [Authentication Endpoints](#authentication-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [App Endpoints (Cliente)](#app-endpoints-cliente)
- [Shared Endpoints](#shared-endpoints)

---

## API Structure

```
/api/v1/
├── auth/               # Authentication (shared)
│   ├── login
│   ├── logout
│   ├── register
│   ├── refresh-token
│   ├── verify-email
│   └── reset-password
│
├── admin/              # Admin frontend endpoints
│   ├── tenants/
│   ├── users/
│   ├── roles/
│   ├── permissions/
│   ├── subscriptions/
│   └── audit-logs/
│
└── app/                # Cliente frontend endpoints
    ├── calendar/
    ├── tasks/
    ├── notifications/
    ├── files/
    ├── projects/
    ├── dashboard/
    └── shares/
```

---

## Authentication Endpoints

### POST /api/v1/auth/register

**Registro de nueva organización**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "organization_name": "Acme Corp"
}

Response 201:
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "subdomain": "acme-corp.plataforma.com"
  },
  "message": "Verification email sent"
}
```

---

### POST /api/v1/auth/login

**Login con JWT**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "totp_code": "123456"  // Optional si MFA habilitado
}

Response 200:
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["org_admin"],
    "permissions": ["users.create", "projects.read", ...]
  },
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "plan": "professional"
  }
}

Response 200 (MFA Required):
{
  "mfa_required": true,
  "mfa_token": "temp-token-for-mfa"
}
```

---

### POST /api/v1/auth/refresh-token

**Renovar access token**

```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}

Response 200:
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."  // New refresh token (rotation)
}
```

---

## Admin Endpoints

### GET /api/v1/admin/users

**Listar usuarios del tenant**

```http
GET /api/v1/admin/users?page=1&per_page=20&status=active
Authorization: Bearer {access_token}

Response 200:
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "roles": ["org_admin"],
      "status": "active",
      "created_at": "2026-01-15T10:30:00Z",
      "last_login": "2026-02-10T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45
  }
}
```

---

### POST /api/v1/admin/roles

**Crear rol personalizado**

```http
POST /api/v1/admin/roles
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Content Editor",
  "description": "Can create and edit content",
  "permissions": ["content.create", "content.edit_own", "content.read"],
  "inherits_from": "member_role_id"  // Optional
}

Response 201:
{
  "role": {
    "id": "uuid",
    "name": "Content Editor",
    "description": "Can create and edit content",
    "permissions": ["content.create", "content.edit_own", "content.read"],
    "inherited_permissions": ["basic.read", "profile.update"],
    "created_at": "2026-02-10T10:30:00Z"
  }
}
```

---

### GET /api/v1/admin/subscriptions/current

**Obtener suscripción actual**

```http
GET /api/v1/admin/subscriptions/current
Authorization: Bearer {access_token}

Response 200:
{
  "subscription": {
    "plan": "professional",
    "status": "active",
    "billing_cycle": "monthly",
    "current_period_start": "2026-02-01T00:00:00Z",
    "current_period_end": "2026-03-01T00:00:00Z",
    "cancel_at_period_end": false
  },
  "usage": {
    "users": {"current": 23, "limit": 50},
    "storage": {"current_gb": 12.5, "limit_gb": 50},
    "api_calls": {"current": 45230, "limit": 100000}
  }
}
```

---

### POST /api/v1/admin/subscriptions/upgrade

**Upgrade de plan**

```http
POST /api/v1/admin/subscriptions/upgrade
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "new_plan": "professional",
  "billing_cycle": "monthly"
}

Response 200:
{
  "subscription": {
    "plan": "professional",
    "status": "active",
    "proration": {
      "amount": 4523,
      "description": "Prorated upgrade from Starter to Professional"
    }
  },
  "invoice": {
    "id": "inv_123",
    "amount_due": 4523,
    "status": "paid"
  }
}

Response 402:
{
  "error": "payment_required",
  "message": "Payment method required for upgrade"
}
```

---

## App Endpoints (Cliente)

### GET /api/v1/app/projects

**Listar proyectos del usuario**

```http
GET /api/v1/app/projects?status=active
Authorization: Bearer {access_token}

Response 200:
{
  "projects": [
    {
      "id": "uuid",
      "name": "Sistema Autenticación",
      "description": "Credenciales y configuración",
      "color": "#3B82F6",
      "icon": "lock",
      "status": "active",
      "role": "owner",  // owner, admin, editor, viewer
      "sections_count": 5,
      "items_count": 23,
      "created_at": "2026-01-20T10:00:00Z",
      "updated_at": "2026-02-10T15:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/app/projects

**Crear proyecto**

```http
POST /api/v1/app/projects
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Sistema Autenticación",
  "description": "Credenciales y configuración",
  "color": "#3B82F6"
}

Response 201:
{
  "project": {
    "id": "uuid",
    "name": "Sistema Autenticación",
    "description": "Credenciales y configuración",
    "color": "#3B82F6",
    "status": "active",
    "role": "owner",
    "created_at": "2026-02-10T16:00:00Z"
  }
}

Response 402:
{
  "error": "payment_required",
  "message": "You've reached the project limit for your plan (Free: 2 projects). Upgrade to Starter.",
  "upgrade_url": "/billing/upgrade"
}
```

---

### GET /api/v1/app/projects/{project_id}/sections

**Listar secciones de proyecto**

```http
GET /api/v1/app/projects/{project_id}/sections
Authorization: Bearer {access_token}

Response 200:
{
  "sections": [
    {
      "id": "uuid",
      "name": "Credenciales Producción",
      "color": "#EF4444",
      "order": 0,
      "items_count": 8,
      "created_at": "2026-01-20T10:30:00Z"
    }
  ]
}
```

---

### POST /api/v1/app/shares

**Compartir elemento**

```http
POST /api/v1/app/shares
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "resource_type": "project",
  "resource_id": "uuid",
  "shared_with_user_ids": ["uuid1", "uuid2"],
  "permission_level": "editor",
  "notify": true
}

Response 201:
{
  "shares": [
    {
      "id": "uuid",
      "resource_type": "project",
      "resource_id": "uuid",
      "shared_with": {
        "id": "uuid1",
        "name": "Mike Chen",
        "email": "mike@example.com"
      },
      "permission_level": "editor",
      "shared_at": "2026-02-10T16:30:00Z"
    }
  ]
}
```

---

## Shared Endpoints

### GET /api/v1/features

**Obtener features disponibles según plan**

```http
GET /api/v1/features
Authorization: Bearer {access_token}

Response 200:
{
  "plan": "professional",
  "features": {
    "custom_roles": true,
    "mfa": true,
    "sso": false,
    "batch_operations": true,
    "webhooks": false,
    "custom_branding": true
  },
  "limits": {
    "users": 50,
    "storage_gb": 50,
    "api_calls_per_month": 100000,
    "projects": null,  // null = unlimited
    "items": null,
    "sections_per_project": null
  }
}
```

---

### GET /api/v1/audit-logs

**Obtener logs de auditoría**

```http
GET /api/v1/audit-logs?resource_type=project&action=share.created&start_date=2026-02-01&end_date=2026-02-10
Authorization: Bearer {access_token}

Response 200:
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2026-02-10T16:30:45Z",
      "actor": {
        "id": "uuid",
        "name": "Alice Smith",
        "email": "alice@example.com"
      },
      "action": "share.created",
      "resource_type": "project",
      "resource_id": "uuid",
      "changes": {
        "shared_with": "Mike Chen",
        "permission_level": "editor"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 234
  }
}
```

---

## Error Responses

### Common Error Codes

```http
400 Bad Request
{
  "error": "validation_error",
  "message": "Invalid request data",
  "details": {
    "email": ["This field is required"],
    "password": ["Password must be at least 8 characters"]
  }
}

401 Unauthorized
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}

403 Forbidden
{
  "error": "permission_denied",
  "message": "You don't have permission to perform this action",
  "required_permission": "projects.delete"
}

402 Payment Required
{
  "error": "payment_required",
  "message": "This feature requires a Professional plan",
  "upgrade_url": "/billing/upgrade"
}

429 Too Many Requests
{
  "error": "rate_limit_exceeded",
  "message": "You've exceeded the API rate limit",
  "retry_after": 60
}

500 Internal Server Error
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "request_id": "req_123abc"
}
```

---

## Digital Services Endpoints

### Public Endpoints (No Authentication Required)

**GET /{service}/{username}**

Render public page for user (Server-Side Rendering).

**Auth**: None (public)

**Params**:
- `service`: tarjeta | landing | portafolio | cv
- `username`: Public profile username

**Response**: HTML (Server-Side Rendered)

**Cache**: Redis 5min + CDN 1h

**Examples**:
```
GET /tarjeta/jsmith
GET /landing/mgarcia
GET /portafolio/alopez
GET /portafolio/alopez/mi-proyecto-web  (individual project)
GET /cv/rperez
```

---

**GET /sitemap.xml**

Generate dynamic sitemap with all public profiles.

**Auth**: None

**Response**: XML

**Cache**: 24 hours

---

**GET /robots.txt**

Generate robots.txt with configuration.

**Auth**: None

**Response**: Text

---

### Admin Endpoints - Public Profile

**POST /api/v1/app/digital-services/profile**

Create or update public profile.

**Auth**: JWT required

**Body**:
```json
{
  "username": "jsmith",
  "display_name": "Juan Smith",
  "title": "Desarrollador Full Stack",
  "bio": "Apasionado por crear aplicaciones web modernas...",
  "avatar": "base64_or_url",
  "is_public": true,
  "meta_title": "Juan Smith - Desarrollador Full Stack",
  "meta_description": "Portafolio de proyectos web y aplicaciones móviles"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "username": "jsmith",
  "display_name": "Juan Smith",
  "url": "https://domain.com/landing/jsmith",
  "created_at": "2026-02-12T10:00:00Z"
}
```

---

**GET /api/v1/app/digital-services/profile**

Get authenticated user's public profile.

**Auth**: JWT required

**Response**: `200 OK` or `404 Not Found`

---

### Admin Endpoints - Digital Card

**POST /api/v1/app/digital-services/tarjeta**

Create or update digital card.

**Auth**: JWT required

**Body**:
```json
{
  "email": "juan@example.com",
  "phone": "+34 600 123 456",
  "location": "Madrid, España",
  "linkedin_url": "https://linkedin.com/in/jsmith",
  "github_url": "https://github.com/jsmith",
  "primary_color": "#3B82F6",
  "background_color": "#FFFFFF"
}
```

**Response**: `200 OK`

---

**GET /api/v1/app/digital-services/tarjeta**

Get authenticated user's digital card.

**Auth**: JWT required

**Response**: `200 OK`

---

**POST /api/v1/app/digital-services/tarjeta/generate-qr**

Generate QR code for digital card.

**Auth**: JWT required

**Body**:
```json
{
  "size": 600,
  "include_logo": true
}
```

**Response**: `200 OK`
```json
{
  "qr_code_url": "https://domain.com/media/qr-codes/jsmith.png"
}
```

---

**GET /api/v1/app/digital-services/tarjeta/export-vcard**

Export vCard file (Starter+).

**Auth**: JWT required

**Feature Gate**: Starter+

**Response**: `200 OK` (Content-Type: text/vcard)

---

### Admin Endpoints - Landing Page

**POST /api/v1/app/digital-services/landing**

Create or update landing page.

**Auth**: JWT required

**Body**:
```json
{
  "template_type": "minimal",
  "sections": [
    {
      "type": "hero",
      "visible": true,
      "props": {
        "title": "Hola, soy Juan Smith",
        "subtitle": "Desarrollador Full Stack",
        "cta_text": "Ver proyectos",
        "cta_link": "#portfolio"
      }
    }
  ],
  "enable_contact_form": true,
  "contact_email": "juan@example.com",
  "ga_tracking_id": "GA-123456"
}
```

**Response**: `200 OK`

---

**GET /api/v1/app/digital-services/landing**

Get authenticated user's landing page.

**Auth**: JWT required

**Response**: `200 OK`

---

### Admin Endpoints - Portfolio

**GET /api/v1/app/digital-services/portafolio**

List all portfolio items for authenticated user.

**Auth**: JWT required

**Response**: `200 OK`
```json
{
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "title": "E-Commerce Platform",
      "slug": "e-commerce-platform",
      "description_short": "Plataforma de e-commerce con Django + React",
      "cover_image": "https://...",
      "is_featured": true,
      "tags": ["web", "react", "django"],
      "demo_url": "https://demo.example.com"
    }
  ]
}
```

---

**POST /api/v1/app/digital-services/portafolio**

Create new portfolio item (Professional+).

**Auth**: JWT required

**Feature Gate**: Professional+

**Body**:
```json
{
  "title": "E-Commerce Platform",
  "description_short": "Plataforma de e-commerce moderna",
  "description_full": "## Descripción\n\nPlataforma completa de e-commerce...",
  "cover_image": "base64_or_url",
  "gallery_images": [
    {"url": "https://...", "caption": "Dashboard"}
  ],
  "tags": ["web", "react", "django"],
  "demo_url": "https://demo.example.com",
  "repo_url": "https://github.com/jsmith/ecommerce",
  "project_date": "2026-01-15",
  "is_featured": false
}
```

**Response**: `201 Created`

---

**PATCH /api/v1/app/digital-services/portafolio/{id}**

Update portfolio item (owner only).

**Auth**: JWT required

**Body**: Partial update

**Response**: `200 OK`

---

**DELETE /api/v1/app/digital-services/portafolio/{id}**

Delete portfolio item (owner only).

**Auth**: JWT required

**Response**: `204 No Content`

---

### Admin Endpoints - CV Digital

**POST /api/v1/app/digital-services/cv**

Create or update CV.

**Auth**: JWT required

**Body**:
```json
{
  "professional_summary": "Desarrollador Full Stack con 5 años de experiencia...",
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "start_date": "2020-01-01",
      "end_date": "2025-12-31",
      "responsibilities": "Desarrollo de APIs REST, liderazgo técnico..."
    }
  ],
  "education": [
    {
      "institution": "Universidad de Madrid",
      "degree": "Ingeniería Informática",
      "field": "Computer Science",
      "start_date": "2015-09-01",
      "end_date": "2019-06-30"
    }
  ],
  "skills": ["Python", "Django", "React", "PostgreSQL"],
  "languages": [
    {"language": "Español", "level": "native"},
    {"language": "Inglés", "level": "fluent"}
  ],
  "template_type": "modern",
  "show_photo": true
}
```

**Response**: `200 OK`

---

**GET /api/v1/app/digital-services/cv**

Get authenticated user's CV.

**Auth**: JWT required

**Response**: `200 OK`

---

**POST /api/v1/app/digital-services/cv/export-pdf**

Generate and download CV as PDF (Professional+).

**Auth**: JWT required

**Feature Gate**: Professional+

**Response**: PDF file download

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="CV_Juan_Smith_2026-02-12.pdf"
```

---

### Admin Endpoints - Analytics

**GET /api/v1/app/digital-services/analytics/{service}**

Get analytics for specific service (Starter+).

**Auth**: JWT required

**Feature Gate**: Starter+

**Params**:
- `service`: tarjeta | landing | portafolio | cv

**Query Params**:
- `days`: 7 | 30 | 90 (default: 7)

**Response**: `200 OK`
```json
{
  "service": "landing",
  "period": "7_days",
  "total_views": 245,
  "unique_visitors": 123,
  "views_by_day": [
    {"date": "2026-02-12", "views": 35, "unique": 18},
    {"date": "2026-02-11", "views": 42, "unique": 21}
  ],
  "clicks": {
    "linkedin": 15,
    "github": 8,
    "contact_form": 3
  }
}
```

---

### Admin Endpoints - Custom Domain (Enterprise)

**POST /api/v1/app/digital-services/custom-domain**

Configure custom domain (Enterprise only).

**Auth**: JWT required

**Feature Gate**: Enterprise

**Body**:
```json
{
  "domain": "juansmith.com",
  "default_service": "landing"
}
```

**Response**: `200 OK`
```json
{
  "domain": "juansmith.com",
  "verification_status": "pending",
  "verification_token": "abc123...",
  "instructions": {
    "type": "CNAME",
    "name": "@",
    "value": "proxy.platform.com",
    "ttl": 3600
  }
}
```

---

**POST /api/v1/app/digital-services/custom-domain/verify**

Verify DNS configuration.

**Auth**: JWT required

**Response**: `200 OK`
```json
{
  "verification_status": "verified",
  "ssl_status": "pending",
  "message": "DNS configured correctly. SSL provisioning in progress..."
}
```

---

**GET /api/v1/app/digital-services/custom-domain**

Get custom domain status.

**Auth**: JWT required

**Response**: `200 OK`

---

## Rate Limiting

| Plan | Rate Limit |
|------|-----------|
| Free | 100 requests/hour |
| Starter | 1,000 requests/hour |
| Professional | 10,000 requests/hour |
| Enterprise | Unlimited |

**Headers**:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9523
X-RateLimit-Reset: 1675174800
```

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Architecture](architecture.md)
- [Ver Data Models](data-models.md)

---

**Última actualización**: 2026-02-12

**Nota**: Para documentación completa de todos los endpoints, consultar el archivo original completo en `/prd/rbac-subscription-system.md` sección 6.4.
