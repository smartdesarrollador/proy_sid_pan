# Arquitectura SSO: Hub → Servicios

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Diagrama de Secuencia](#diagrama-de-secuencia)
3. [Modelo SSOToken](#modelo-ssotoken)
4. [Endpoints SSO](#endpoints-sso)
5. [Propiedades de Seguridad](#propiedades-de-seguridad)
6. [Catálogo de Servicios](#catálogo-de-servicios)
7. [Eventos Auditados](#eventos-auditados)

---

## Descripción General

El Hub Client Portal actúa como punto de entrada unificado. Cuando un usuario autenticado en el Hub hace clic en "Abrir" sobre un servicio adquirido, el sistema genera un **token SSO de corta duración** que permite al usuario autenticarse en el servicio destino sin introducir credenciales nuevamente.

**Características clave**:
- TTL: 60 segundos (no renovable)
- Uso único: el token se invalida tras la primera validación exitosa
- String opaco de 64 caracteres — NO es un JWT
- Vinculado a `user_id + tenant_id + service`

---

## Diagrama de Secuencia

```
Hub Client Portal          Backend API              Servicio Destino
       │                       │                          │
       │  1. POST /auth/sso/token/                        │
       │  { "service": "workspace" }                      │
       │──────────────────────►│                          │
       │                       │  Genera token opaco      │
       │                       │  (64 chars, TTL 60s)     │
       │  { sso_token, expires_in: 60,                    │
       │    redirect_url }      │                          │
       │◄──────────────────────│                          │
       │                       │                          │
       │  2. Redirige browser:                            │
       │  GET https://workspace.app/?sso_token=...        │
       │────────────────────────────────────────────────► │
       │                       │                          │
       │                       │  3. POST /auth/sso/validate/
       │                       │◄─────────────────────────│
       │                       │  { "sso_token": "..." }  │
       │                       │                          │
       │                       │  Verifica:               │
       │                       │  - token existe en DB    │
       │                       │  - used_at IS NULL       │
       │                       │  - expires_at > now()    │
       │                       │  Marca used_at = now()   │
       │                       │                          │
       │                       │  { access_token,         │
       │                       │    refresh_token, user } │
       │                       │──────────────────────────►
       │                       │                          │
       │                                    4. Usuario autenticado en Workspace
       │                                       (acceso_token + refresh_token)
```

> **Nota CORS:** El paso 3 (`/auth/sso/validate/`) es una llamada **server-to-server** desde el servicio destino hacia el backend. No pasa por el browser del usuario, por lo que no requiere configuración CORS adicional para ese endpoint.

---

## Modelo SSOToken

```python
class SSOToken(models.Model):
    """Token de corta duración para SSO entre Hub y servicios"""
    id         = UUIDField(primary_key=True)
    user       = FK → User
    tenant     = FK → Tenant
    service    = CharField(50)      # 'workspace' | 'vista' | 'desktop'
    token      = CharField(64, unique=True)  # string opaco, NO JWT
    used_at    = DateTimeField(null=True)    # None = no usado aún
    expires_at = DateTimeField()             # created_at + 60 segundos
    created_at = DateTimeField(auto_now_add=True)
```

**Validez de token**: `used_at IS NULL AND expires_at > now()`

**Al validar**: `UPDATE sso_tokens SET used_at = now() WHERE token = ?`

**Limpieza**: Celery task periódica elimina tokens expirados con `expires_at < now() - 1h`.

Ver definición completa en [`prd/technical/data-models.md`](../../prd/technical/data-models.md) — sección SSOToken.

---

## Endpoints SSO

### POST `/api/v1/auth/sso/token/`

Genera un token SSO para acceder a un servicio. Requiere usuario autenticado con tenant activo.

**Request:**
```json
POST /api/v1/auth/sso/token/
Authorization: Bearer {access_token}

{
  "service": "workspace"
}
```

**Response 200:**
```json
{
  "sso_token": "a3f9b2c1d4e5...",
  "expires_in": 60,
  "redirect_url": "https://acme.workspace.app/?sso_token=a3f9b2c1d4e5..."
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| `401` | Usuario no autenticado |
| `403` | Tenant suspendido o sin acceso al servicio |
| `404` | Servicio `service` no existe en el catálogo |

---

### POST `/api/v1/auth/sso/validate/`

Valida y consume un token SSO. Llamada server-to-server (servicio destino → backend).

**Request:**
```json
POST /api/v1/auth/sso/validate/
Content-Type: application/json

{
  "sso_token": "a3f9b2c1d4e5..."
}
```

**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "Juan García",
    "email": "juan@acme.com",
    "tenant_id": "uuid",
    "roles": ["owner"],
    "permissions": ["projects.create", "tasks.read", "..."]
  }
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| `400` | Token inválido, expirado o ya utilizado |
| `404` | Token no encontrado |

---

## Propiedades de Seguridad

| Propiedad | Valor |
|-----------|-------|
| **TTL** | 60 segundos |
| **Uso** | Único (single-use) — invalidado tras primera validación |
| **Formato** | String opaco de 64 caracteres (hex random) — NO es JWT |
| **Almacenamiento** | Tabla `sso_tokens` en PostgreSQL (no en Redis) |
| **Vinculación** | `user_id + tenant_id + service` |
| **Transport** | HTTPS únicamente (no HTTP) |
| **Auditoría** | `sso.token_created` y `sso.token_validated` en AuditLog |
| **Limpieza** | Tokens expirados eliminados por Celery task periódica |
| **Logs** | Token NO se loguea en ningún nivel de log (solo su `id`) |

---

## Catálogo de Servicios

El catálogo define qué servicios existen en la plataforma y en qué planes están disponibles.

### Modelo Service

```python
class Service(models.Model):
    """Catálogo de servicios disponibles en la plataforma"""
    id           = UUIDField(primary_key=True)
    slug         = SlugField(unique=True)       # 'workspace', 'vista', 'desktop'
    name         = CharField(100)
    description  = TextField()
    icon         = CharField(50)                # nombre de ícono Lucide
    url_template = CharField(255)               # 'https://{subdomain}.workspace.app'
    min_plan     = CharField(20, default='free')
    is_active    = BooleanField(default=True)
    created_at   = DateTimeField(auto_now_add=True)
```

### Modelo TenantService

Registra qué servicios ha adquirido cada tenant:

```python
class TenantService(models.Model):
    """Servicios adquiridos por un tenant"""
    id          = UUIDField(primary_key=True)
    tenant      = FK → Tenant
    service     = FK → Service
    status      = CharField  # 'active' | 'suspended' | 'locked'
    acquired_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['tenant', 'service']]
```

### Endpoints del Catálogo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/app/services/` | Catálogo completo de servicios disponibles para el tenant (según su plan) |
| `GET` | `/api/v1/app/services/active/` | Solo servicios adquiridos y activos del tenant |

**Diferencia entre endpoints:**
- `/services/` incluye servicios no adquiridos con `available: false` (para mostrar CTAs de upgrade)
- `/services/active/` solo retorna los que el tenant puede acceder via SSO ahora mismo

---

## Eventos Auditados

El AuditLog registra automáticamente los siguientes eventos SSO:

| Evento | `action` en AuditLog | Datos en `changes` |
|--------|---------------------|-------------------|
| Token SSO generado | `sso.token_created` | `{service, expires_at}` (sin el token) |
| Token SSO validado | `sso.token_validated` | `{service, used_at}` |
| Token SSO inválido/expirado | `sso.token_invalid` | `{reason: 'expired'|'used'|'not_found'}` |

> **Importante**: El valor del token (`sso_token`) nunca se incluye en los logs de auditoría ni en los logs de aplicación. Solo se registra el `id` del registro `SSOToken`.

---

**Fuente**: [`prd/features/hub-client-portal.md`](../../prd/features/hub-client-portal.md) — sección 7

**Última actualización**: 2026-03-06
