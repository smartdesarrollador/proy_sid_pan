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

**Última actualización**: 2026-02-10

**Nota**: Para documentación completa de todos los endpoints, consultar el archivo original completo en `/prd/rbac-subscription-system.md` sección 6.4.
