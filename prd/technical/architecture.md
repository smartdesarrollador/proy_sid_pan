# Technical Architecture

[⬅️ Volver al README](../README.md)

---

## Índice
- [System Overview](#system-overview)
- [Multi-Tenancy Architecture](#multi-tenancy-architecture)
- [Security](#security)
- [Scalability](#scalability)
- [Tech Stack](#tech-stack)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
├───────────────────────┬─────────────────────────────────┤
│  Frontend Admin       │    Frontend Cliente             │
│  (Angular 17+)        │    (Angular 17+)                │
│  - RBAC Management    │    - Calendar, Tasks            │
│  - User Management    │    - Notifications, Files       │
│  - Billing            │    - Projects, Dashboard        │
│  - Audit Logs         │    - User Profile               │
└───────────────────────┴─────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   API Gateway / Load Balancer            │
│                    (Nginx / AWS ALB)                     │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│              Backend API (Django REST Framework)         │
├──────────────────────────────────────────────────────────┤
│  /api/v1/admin/        │  /api/v1/app/     │ /api/v1/auth/ │
│  - Tenants             │  - Calendar       │ - Login       │
│  - Users               │  - Tasks          │ - Register    │
│  - Roles               │  - Notifications  │ - Refresh     │
│  - Permissions         │  - Files          │ - MFA         │
│  - Subscriptions       │  - Projects       │               │
│  - Audit Logs          │  - Dashboard      │               │
└───────────────────────┬──────────────────────────────────┘
                        │
        ┌───────────────┴──────────────┐
        │                              │
┌───────▼────────┐             ┌──────▼───────┐
│   PostgreSQL   │             │    Redis     │
│  (Primary DB)  │             │  (Cache +    │
│  - Multi-tenant│             │   Sessions)  │
│  - RLS enabled │             │              │
└────────────────┘             └──────────────┘
        │
┌───────▼────────┐
│  File Storage  │
│  (S3 / MinIO)  │
└────────────────┘
```

---

## Multi-Tenancy Architecture

### Row-Level Security (RLS)

**Concepto**: Aislamiento de datos a nivel de base de datos usando PostgreSQL RLS policies.

**Implementación**:

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON projects
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Django Middleware**:

```python
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Extract tenant from subdomain or JWT
        tenant = self.get_tenant(request)
        
        # Set PostgreSQL session variable
        with connection.cursor() as cursor:
            cursor.execute(
                "SET LOCAL app.tenant_id = %s",
                [str(tenant.id)]
            )
        
        request.tenant = tenant
        response = self.get_response(request)
        return response
```

**Benefits**:
- ✅ Database-level isolation (prevents data leaks even with bugs)
- ✅ No need for `tenant_id` filters in every query
- ✅ Automatic enforcement by PostgreSQL
- ✅ Performance: Indexes include tenant_id as prefix

---

### Subdomain-Based Tenant Identification

**Pattern**: `{tenant-slug}.plataforma.com` → `tenant_id`

**Flow**:
1. User visits `acme.plataforma.com`
2. Middleware extracts `acme` from subdomain
3. Lookup tenant by slug: `Tenant.objects.get(slug='acme')`
4. Set `app.tenant_id` in PostgreSQL session
5. All queries auto-filter by tenant_id via RLS

**Custom Domains** (Enterprise):
- `portal.acmecorp.com` → `tenant_id` (via CNAME verification)
- Stored in `TenantDomain` model with DNS verification

---

## Security

### Authentication & Authorization

**JWT-Based Authentication**:

```
┌─────────┐                                   ┌─────────┐
│ Client  │                                   │  Server │
└────┬────┘                                   └────┬────┘
     │                                             │
     │ POST /api/v1/auth/login                    │
     │ {email, password}                          │
     ├────────────────────────────────────────────>│
     │                                             │
     │            200 OK                           │
     │ {access_token, refresh_token, user}        │
     │<────────────────────────────────────────────┤
     │                                             │
     │ GET /api/v1/app/projects                   │
     │ Authorization: Bearer {access_token}       │
     ├────────────────────────────────────────────>│
     │                                             │
     │         Validate JWT + Permissions          │
     │         Check tenant_id + RLS               │
     │                                             │
     │            200 OK                           │
     │ {projects: [...]}                          │
     │<────────────────────────────────────────────┤
```

**Token Structure**:
- **Access Token**: Short-lived (15 min), includes: `user_id`, `tenant_id`, `roles`, `permissions`
- **Refresh Token**: Long-lived (7 days), stored in DB, allows obtaining new access token

**MFA Flow**:
1. User enables MFA → Generate TOTP secret → Show QR code
2. User scans QR with authenticator app
3. User enters code to verify setup
4. Login: email/password → 200 + `mfa_required: true` → User enters TOTP code → 200 + tokens

---

### Data Encryption

| Layer | Encryption | Implementation |
|-------|-----------|----------------|
| **In Transit** | TLS 1.3 | Load balancer terminates SSL |
| **At Rest** | AES-256 | PostgreSQL encryption, S3 server-side encryption |
| **Passwords** | Argon2id | Django `make_password()` |
| **Sensitive Fields** | AES-256 | Encrypt before DB save (e.g., project item passwords) |
| **JWT Secret** | HS256 | Rotated every 90 days |

---

### RBAC Enforcement

**Backend Middleware**:

```python
@permission_required('projects.create')
def create_project(request):
    # User must have 'projects.create' permission
    # Middleware validates before function executes
    ...
```

**Feature Gates**:

```python
@require_feature('custom_roles')
def create_custom_role(request):
    # User's plan must include 'custom_roles' feature
    # Returns 402 Payment Required if not available
    ...
```

**Frontend Guards**:

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'];
    return this.authService.hasPermission(requiredPermission);
  }
}
```

---

## Scalability

### Horizontal Scaling

**Stateless API Servers**:
- No server-side sessions (JWT-based)
- Can scale to N instances behind load balancer
- Auto-scaling based on CPU/memory

**Database**:
- PostgreSQL with read replicas
- Write to primary, read from replicas
- Connection pooling (PgBouncer)

**Caching Strategy**:
- Redis for:
  - Session data (refresh tokens)
  - Feature flags cache (avoid DB queries)
  - Rate limiting counters
  - Temporary data (email verification tokens)

**File Storage**:
- S3-compatible object storage (AWS S3 / MinIO)
- CDN for static assets (CloudFront)

---

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **API Latency (p95)** | <200ms | Indexing, caching, query optimization |
| **API Latency (p99)** | <500ms | Auto-scaling, load balancing |
| **Uptime** | 99.9% | Multi-AZ deployment, health checks |
| **Concurrent Users** | 10,000+ | Horizontal scaling, Redis caching |
| **DB Queries** | <10 per request | Eager loading, select_related, prefetch_related |
| **File Upload** | 5GB (Enterprise) | Chunked upload, S3 multipart |

---

## Tech Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **API Framework** | Django REST Framework | 3.14+ | REST API endpoints |
| **Language** | Python | 3.11+ | Backend logic |
| **Database** | PostgreSQL | 15+ | Primary data store with RLS |
| **Cache** | Redis | 7+ | Sessions, cache, rate limiting |
| **Task Queue** | Celery + Redis | 5+ | Background jobs (email, billing) |
| **Authentication** | Django JWT | 2.x | JWT tokens |
| **Payment** | Stripe API | v2023+ | Billing, subscriptions |

### Frontend Admin

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Angular | 17+ | SPA framework |
| **UI Library** | Angular Material + Tailwind | Latest | UI components |
| **State** | RxJS | 7+ | Reactive state management |
| **HTTP** | Angular HttpClient | - | API calls |
| **Auth** | Angular JWT | - | Token handling |

### Frontend Cliente

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Angular | 17+ | SPA framework |
| **UI** | Tailwind CSS | 3+ | Styling |
| **State** | RxJS + Signals | - | Reactive state |
| **HTTP** | Angular HttpClient | - | API calls |

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Hosting** | AWS / DigitalOcean | Cloud infrastructure |
| **Load Balancer** | AWS ALB / Nginx | Traffic distribution |
| **Monitoring** | Sentry + CloudWatch | Error tracking, logs |
| **Logging** | ELK Stack | Centralized logs |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver API Endpoints](api-endpoints.md)
- [Ver Data Models](data-models.md)
- [Ver Implementation Timeline](implementation-timeline.md)

---

**Última actualización**: 2026-02-10
