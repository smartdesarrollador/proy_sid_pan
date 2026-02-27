# Multi-Tenancy

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Estrategia de Aislamiento](#estrategia-de-aislamiento)
2. [Subdomain-Based Tenant Identification](#subdomain-based-tenant-identification)
3. [PostgreSQL Row-Level Security (RLS)](#postgresql-row-level-security-rls)
4. [Django Middleware de Tenant](#django-middleware-de-tenant)
5. [Custom Domains (Enterprise)](#custom-domains-enterprise)
6. [Modelo de Datos](#modelo-de-datos)

---

## Estrategia de Aislamiento

El sistema implementa **aislamiento completo de datos por tenant** usando dos capas complementarias:

1. **Capa de aplicación**: Django Middleware extrae el tenant de cada request y lo adjunta al contexto
2. **Capa de base de datos**: PostgreSQL RLS filtra automáticamente todas las queries por `tenant_id`

El doble aislamiento garantiza que un bug en la capa de aplicación no pueda filtrar datos entre tenants.

---

## Subdomain-Based Tenant Identification

**Patrón**: `{tenant-slug}.plataforma.com` → `tenant_id`

**Flujo**:

```
1. Usuario visita  acme.plataforma.com
2. Middleware extrae "acme" del subdominio
3. Lookup:  Tenant.objects.get(slug='acme')
4. SET LOCAL app.tenant_id = '{tenant_uuid}'  (sesión PostgreSQL)
5. Todas las queries filtran automáticamente por tenant_id via RLS
```

**Identificación del tenant** (orden de prioridad en el middleware):
1. Subdominio del host (`acme.plataforma.com`)
2. Claim `tenant_id` dentro del JWT (para requests API directas)
3. Error 404 si no se puede resolver el tenant

---

## PostgreSQL Row-Level Security (RLS)

### Habilitar RLS en tablas multi-tenant

```sql
-- Habilitar RLS en todas las tablas con datos de tenant
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- (aplicar a todas las tablas con columna tenant_id)
```

### Políticas de aislamiento

```sql
-- Política genérica de tenant isolation
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON projects
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON tasks
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Configuración de sesión

El middleware usa `SET LOCAL` para que el `tenant_id` aplique solo a la transacción actual (no persiste a otras conexiones del pool):

```sql
SET LOCAL app.tenant_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Beneficios de RLS

- Aislamiento a nivel de base de datos: protege incluso ante bugs en la aplicación
- No requiere añadir `WHERE tenant_id = ?` en cada query de Django
- PostgreSQL aplica la política antes de ejecutar cualquier SELECT/INSERT/UPDATE/DELETE
- Los índices incluyen `tenant_id` como prefijo para performance

---

## Django Middleware de Tenant

```python
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Extraer tenant del subdominio o del JWT
        tenant = self.get_tenant(request)

        # Configurar variable de sesión PostgreSQL
        with connection.cursor() as cursor:
            cursor.execute(
                "SET LOCAL app.tenant_id = %s",
                [str(tenant.id)]
            )

        request.tenant = tenant
        response = self.get_response(request)
        return response

    def get_tenant(self, request):
        host = request.get_host()
        subdomain = host.split('.')[0]
        return Tenant.objects.get(slug=subdomain)
```

**Orden en `MIDDLEWARE` de Django**:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'apps.tenants.middleware.TenantMiddleware',  # antes de AuthenticationMiddleware
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # ...
]
```

---

## Custom Domains (Enterprise)

Los tenants del plan Enterprise pueden usar dominios propios via CNAME:

```
portal.acmecorp.com  →  CNAME  →  acme.plataforma.com
```

**Flujo de verificación**:
1. Tenant registra dominio en el panel de admin
2. Sistema genera un token de verificación DNS (`TXT _plataforma-verify`)
3. Tenant crea el registro TXT en su DNS
4. Background job verifica el registro cada 15 minutos
5. Una vez verificado: Nginx acepta el dominio y lo mapea al tenant

**Modelo**: Ver [`CustomDomain`](../../prd/technical/data-models.md) en data-models.md

---

## Modelo de Datos

El modelo `Tenant` es el anchor de todo el sistema:

```python
class Tenant(models.Model):
    id        = UUIDField(primary_key=True)
    name      = CharField(max_length=255)
    slug      = SlugField(unique=True)       # usado en subdomain
    subdomain = CharField(max_length=63, unique=True)
    plan      = CharField(choices=['free','starter','professional','enterprise'])
    branding  = JSONField()  # {logo_url, primary_color, ...}
    settings  = JSONField()
```

Todas las tablas con datos de negocio tienen `tenant_id` como FK a `Tenant`. Ver [data-architecture.md](data-architecture.md) para el diagrama completo de modelos.

---

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) — sección Multi-Tenancy

**Última actualización**: 2026-02-26
