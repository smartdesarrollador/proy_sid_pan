# Seguridad

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Auth Flow: JWT + MFA](#auth-flow-jwt--mfa)
2. [Auth Flow: SSO (Hub → Servicios)](#auth-flow-sso-hub--servicios)
3. [Encriptación](#encriptación)
4. [RLS como Segunda Línea de Defensa](#rls-como-segunda-línea-de-defensa)
5. [API Security](#api-security)
6. [Datos Sensibles](#datos-sensibles)
7. [Eventos de Seguridad Auditados](#eventos-de-seguridad-auditados)

---

## Auth Flow: JWT + MFA

### Tokens JWT

| Token | TTL | Contenido | Almacenamiento |
|-------|-----|-----------|----------------|
| **Access Token** | 15 minutos | `user_id`, `tenant_id`, `roles`, `permissions` | Memoria del cliente (no localStorage) |
| **Refresh Token** | 7 días | `user_id`, `tenant_id`, `jti` (JWT ID) | DB + Redis (para revocación) |

El `JWT Secret` rota cada 90 días. Algoritmo de firma: HS256.

### Flujo de autenticación

```
Cliente                                    Servidor
  │                                           │
  │  POST /api/v1/auth/login                 │
  │  {email, password}                       │
  ├──────────────────────────────────────────►│
  │                                           │  Verifica password (Argon2id)
  │                                           │  Genera access_token + refresh_token
  │  200 OK                                   │
  │  {access_token, refresh_token, user}     │
  │◄──────────────────────────────────────────┤
  │                                           │
  │  GET /api/v1/app/projects                │
  │  Authorization: Bearer {access_token}    │
  ├──────────────────────────────────────────►│
  │                                           │  Valida JWT (firma + expiración)
  │                                           │  Extrae tenant_id → SET LOCAL RLS
  │                                           │  Verifica permisos RBAC
  │  200 OK                                   │
  │◄──────────────────────────────────────────┤
```

### Flujo MFA (TOTP)

```
1. Usuario habilita MFA:
   - Backend genera secreto TOTP
   - Retorna QR code al frontend
   - Usuario escanea con app autenticadora (Google Auth, Authy)
   - Usuario ingresa código para verificar setup

2. Login con MFA habilitado:
   POST /api/v1/auth/login → 200 {mfa_required: true, temp_token}
   POST /api/v1/auth/mfa/verify {temp_token, totp_code} → 200 {access_token, refresh_token}
```

### Refresh de tokens

```
POST /api/v1/auth/refresh
{refresh_token: "..."}

→ Verifica que refresh_token existe en Redis (no revocado)
→ Genera nuevo access_token
→ 200 {access_token}
```

### Logout y revocación

```
POST /api/v1/auth/logout
Authorization: Bearer {access_token}

→ Elimina refresh_token de Redis (revocación inmediata)
→ El access_token expira naturalmente en 15 min
```

---

## Auth Flow: SSO (Hub → Servicios)

El Hub Client Portal usa tokens SSO de corta duración para autenticar usuarios en servicios destino sin credenciales adicionales. Ver diagrama completo en [sso-architecture.md](sso-architecture.md).

### Propiedades de seguridad del token SSO

| Propiedad | Valor |
|-----------|-------|
| **TTL** | 60 segundos (no renovable) |
| **Uso** | Single-use — invalidado tras primera validación |
| **Formato** | String opaco 64 chars — NO es JWT |
| **Transporte** | HTTPS únicamente; token viaja en query param |
| **Vinculación** | `user_id + tenant_id + service` |
| **Validación** | `POST /api/v1/auth/sso/validate/` — server-to-server |

### Eventos AuditLog para SSO

| Evento | `action` |
|--------|----------|
| Token generado | `sso.token_created` |
| Token validado (consumido) | `sso.token_validated` |
| Token inválido / expirado / ya usado | `sso.token_invalid` |

> El valor del token nunca se incluye en logs. Solo se registra el `id` del registro `SSOToken`.

---

## Encriptación

| Capa | Algoritmo | Implementación |
|------|-----------|----------------|
| **En tránsito** | TLS 1.3 | Load balancer termina SSL; comunicación interna via HTTPS |
| **En reposo (DB)** | AES-256 | PostgreSQL encryption + S3 server-side encryption |
| **Passwords** | Argon2id | `django.contrib.auth.hashers.Argon2PasswordHasher` |
| **Campos sensibles** | AES-256 | Cifrado en aplicación antes de guardar en DB (ej: `mfa_secret`, `ProjectItemField.value` con `is_encrypted=True`) |
| **Variables de entorno** | AES-256 | Cifradas a nivel de aplicación (feature Devops Services) |
| **JWT Secret** | HS256 | Almacenado en env var, rotación cada 90 días |

### Campos cifrados en DB

```python
# Campos que se cifran antes de persistir:
User.mfa_secret                     # Secreto TOTP
ProjectItemField.value              # Cuando is_encrypted=True (ej: passwords de credentials)
EnvVariable.value                   # Variables de entorno (DevOps Services)
SSHKey.private_key                  # Claves SSH privadas
PaymentMethod.external_account_id   # Token de billetera LATAM (PayPal, MercadoPago, etc.)
```

---

## RLS como Segunda Línea de Defensa

La RLS (Row-Level Security) de PostgreSQL actúa como **segunda línea de defensa** independiente del código Django:

- Si un bug en la aplicación omite el filtro de tenant, la RLS bloquea el acceso a nivel de DB
- La variable `app.tenant_id` se establece via `SET LOCAL` en cada request (scope de transacción)
- Las políticas RLS se aplican a todos los usuarios de DB excepto el superuser de PostgreSQL

```sql
-- El superuser de PostgreSQL bypasea RLS → no usar para queries de aplicación
-- El usuario de aplicación (app_user) tiene RLS activo

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- app_user nunca es superuser
```

Ver implementación detallada en [multi-tenancy.md](multi-tenancy.md).

---

## API Security

### Rate Limiting

| Endpoint | Límite | Ventana | Backend |
|----------|--------|---------|---------|
| `POST /auth/login` | 10 requests | 1 minuto | Redis counters |
| `POST /auth/register` | 5 requests | 1 hora | Redis counters |
| `POST /auth/mfa/verify` | 5 attempts | 15 minutos | Redis counters |
| API general (Free plan) | 100 requests | 1 minuto | Redis counters |
| API general (Starter) | 500 requests | 1 minuto | Redis counters |
| API general (Professional) | 2000 requests | 1 minuto | Redis counters |
| API general (Enterprise) | Custom SLA | — | — |

### CORS

```python
CORS_ALLOWED_ORIGINS = [
    "https://hub.plataforma.com",
    "https://admin.plataforma.com",
    "https://app.plataforma.com",       # Workspace
    "https://workspace.plataforma.com",
]
CORS_ALLOW_CREDENTIALS = True
```

Orígenes dinámicos de tenants con custom domains se validan contra la tabla `TenantDomain`.

### Validación de inputs

- Todos los inputs de usuario pasan por serializers de DRF con validación explícita
- LLM outputs sanitizados antes de renderizar en UI (prevención XSS)
- Queries parametrizadas via Django ORM (prevención SQL injection)
- Content-Type validation en endpoints de upload

### Headers de seguridad

```python
# settings.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
```

---

## Datos Sensibles

### Variables de entorno de aplicación

Los secretos de la plataforma se cargan exclusivamente desde variables de entorno (`.env` en desarrollo, secrets manager en producción):

```bash
# .env.example (nunca commitear .env real)
SECRET_KEY=
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
JWT_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Pagos LATAM
MERCADOPAGO_ACCESS_TOKEN=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

### Datos que NUNCA se loguean

- API keys y secretos
- Passwords (ni en forma hasheada)
- MFA secrets
- Tokens SSO (`sso_token` — solo se loguea el `id` del registro)
- Números de tarjetas de crédito (Stripe gestiona esto)
- Números de celular de wallets LATAM (Yape, Plin, Nequi, Daviplata)
- `PaymentMethod.external_account_id` (token cifrado de billetera)
- PII sensible (documentos de identidad)

### Retención de datos

| Tipo de dato | Retención | Notas |
|-------------|-----------|-------|
| Audit logs (Free/Starter) | 30 días | Después se archivan |
| Audit logs (Professional+) | 365 días | Cumplimiento SOC2 |
| Logs de aplicación | 90 días | ELK Stack |
| Backups de DB | 30 días | Rotación automática |

---

## Eventos de Seguridad Auditados

El `AuditLog` registra automáticamente los siguientes eventos relevantes para seguridad:

| Evento | `action` en AuditLog |
|--------|----------------------|
| Login exitoso | `auth.login` |
| Login fallido | `auth.login_failed` |
| Activación MFA | `auth.mfa_enabled` |
| Cambio de contraseña | `auth.password_changed` |
| Asignación de rol | `role.assign` |
| Revocación de rol | `role.revoke` |
| Creación de usuario | `user.create` |
| Eliminación de usuario | `user.delete` |
| Revelación de campo cifrado | `credential.reveal` (con IP y timestamp) |
| Cambio de plan | `subscription.upgrade` / `subscription.downgrade` |
| Export de datos | `data.export` |
| Token SSO generado | `sso.token_created` |
| Token SSO validado | `sso.token_validated` |
| Token SSO inválido | `sso.token_invalid` |
| Recurso compartido | `share.created` |
| Compartición revocada | `share.revoked` |
| Método de pago agregado | `billing.payment_method_added` |

---

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) — secciones Security + Authentication

**Última actualización**: 2026-03-06
