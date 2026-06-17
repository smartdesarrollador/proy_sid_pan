# Spec: auth_app (`apps/backend_django/apps/auth_app/`)

**Última actualización**: 2026-06-16

## Propósito

Gestiona usuarios, autenticación (JWT + Google OAuth), MFA (TOTP + recovery
codes), registro de tenants nuevos, invitaciones, SSO Hub→servicio y la
administración de usuarios/roles de un tenant. Es el punto de entrada de
identidad para todo el sistema — todos los demás módulos dependen de `User` y
del JWT que aquí se emite.

## Modelos

### `User` (`models.py`)
- Hereda `AbstractBaseUser` + `PermissionsMixin` (no `BaseModel`, para evitar conflicto de metaclase)
- `id` — UUIDField explícito (no autoincrement)
- `tenant` — FK `CASCADE` **obligatorio** (`UserManager.create_user` lanza `ValueError` si `tenant is None`)
- `email` (único, `USERNAME_FIELD`), `name` (`REQUIRED_FIELDS`)
- `avatar_url`, `email_verified`, `is_active`, `is_staff`
- `mfa_enabled`, `mfa_secret` (TOTP secret en claro — protegido solo por seguridad de la DB)
- Índices en `email` y `(tenant, email)`
- `UserManager.create_superuser`: si no se pasa `tenant`, crea/recupera el tenant `'system'` (slug `system`, plan `enterprise`) — permite `make superuser` sin setup previo

### `MFARecoveryCode` (`models.py`)
- `user` FK `CASCADE`, `code_hash` (hasheado con `make_password`, no texto plano), `is_used`

### `SSOToken` (`models.py`)
- `user` FK, `tenant` FK, `service` (slug), `token` (64 chars, único, indexado), `used_at`, `expires_at`
- Single-use, TTL 60s (impuesto por la vista, no por el modelo)
- Índices en `token` y `(expires_at, used_at)`

## Tokens efímeros en Redis (`tokens.py`)

Todos generados con `secrets.token_urlsafe(32)`, almacenados en `cache` (Redis)
con TTL, y **delete-on-read** (single-use real, no solo por expiración):

| Función | TTL | Propósito |
|---|---|---|
| `create_email_verification_token` / `verify_email_token` | 24h (86400s) | Verificar email en registro/invitación |
| `create_password_reset_token` / `verify_password_reset_token` | 1h (3600s) | Reset de contraseña |
| `create_mfa_session_token` / `verify_mfa_session_token` | 10min (600s) | Sesión intermedia entre login y validación MFA |
| `create_payment_upload_token` / `verify_payment_upload_token` | 30min (1800s) | Identificar tenant al subir comprobante Yape sin JWT completo |

`TenantRefreshToken` (subclase de `RefreshToken` de simplejwt) inyecta los
claims `tenant_id`, `name`, `email` en el JWT — todo JWT del sistema lleva el
tenant embebido.

## Serializers

| Serializer | Qué hace | Cuándo se usa |
|---|---|---|
| `TenantSerializer` | `logo_url`/`favicon_url` normalizados a URL absoluta (`APP_BASE_URL` o `request.build_absolute_uri`) | Toda respuesta que incluye `tenant` |
| `UserSerializer` | Agrega `roles`, `permissions` (flatten de `UserRole→Role→RolePermission`), `tenant_plan` | Toda respuesta que incluye `user` |
| `RegisterSerializer` | Valida email único + fuerza de password; `.save()` crea Tenant+User+Role Owner+ReferralCode (ver Reglas no obvias) | `POST /register` |
| `LoginSerializer` | `authenticate()` + valida `is_active` y `email_verified` | `POST /login` |
| `VerifyEmailSerializer`, `ForgotPasswordSerializer`, `ResetPasswordSerializer`, `AcceptInviteSerializer`, `LogoutSerializer` | Validación de payload simple | Sus endpoints homónimos |
| `AdminUserListSerializer` / `AdminUserCreateSerializer` / `AdminUserUpdateSerializer` | CRUD de usuarios admin; `AdminUserCreateSerializer.create()` usa `self.context['request'].tenant` | Vistas admin de usuarios |
| `InviteUserSerializer`, `UserRoleAssignSerializer` | Payload de invitación / asignación de rol | `UserInviteView`, `UserRoleAssignView` |
| `MFAVerifySetupSerializer`, `MFAValidateSerializer`, `MFADisableSerializer`, `MFARecoverySerializer` | Payloads de los distintos pasos de MFA | Vistas MFA |
| `SSOTokenRequestSerializer`, `SSOValidateRequestSerializer` | `service` slug / `sso_token` | Vistas SSO |

## Endpoints

### Públicos (`/api/v1/auth/`, `urls.py`)

| Método | Path | Vista | Auth |
|---|---|---|---|
| GET | `profile/` | `ProfileView` | `IsAuthenticated` |
| POST | `register` | `RegisterView` | `AllowAny` (throttle `RegisterRateThrottle`) |
| POST | `login` | `LoginView` | `AllowAny` (throttle `LoginRateThrottle`) |
| POST | `refresh-token` | `RefreshTokenView` | `AllowAny` |
| POST | `logout` | `LogoutView` | `IsAuthenticated` |
| POST | `verify-email` | `VerifyEmailView` | `AllowAny` |
| POST | `resend-verification` | `ResendVerificationView` | `AllowAny` (throttle) |
| POST | `accept-invite` | `AcceptInviteView` | `AllowAny` |
| POST | `forgot-password` | `ForgotPasswordView` | `AllowAny` (throttle) |
| POST | `reset-password` | `ResetPasswordView` | `AllowAny` (throttle) |
| POST | `mfa/enable` | `MFAEnableView` | `IsAuthenticated` |
| POST | `mfa/verify-setup` | `MFAVerifySetupView` | `IsAuthenticated` |
| POST | `mfa/validate` | `MFAValidateView` | `AllowAny` (throttle `MFARateThrottle`) |
| POST | `mfa/disable` | `MFADisableView` | `IsAuthenticated` |
| POST | `mfa/recovery` | `MFARecoveryView` | `AllowAny` (throttle) |
| POST | `sso/token/` | `SSOTokenView` | `IsAuthenticated` |
| POST | `sso/validate/` | `SSOValidateView` | `AllowAny` (server-to-server) |
| GET | `google/` | `GoogleOAuthInitView` | `AllowAny`, solo `?next=hub` |
| GET | `google/callback/` | `GoogleOAuthCallbackView` | `AllowAny` |
| POST | `yape-payment-proof` | `YapePaymentProofView` | `AllowAny` (vía `payment_upload_token`) |

### Admin (`/api/v1/admin/users/`, `admin_urls.py`)

| Método | Path | Vista | Permiso |
|---|---|---|---|
| GET | `` | `UserListView` | `HasPermission('users.read')` |
| POST | `create/` | `UserCreateView` | `HasPermission('users.create')` (+ `check_plan_limit`) |
| POST | `invite/` | `UserInviteView` | `HasPermission('users.invite')` |
| GET | `<uuid:pk>/` | `UserDetailView` | `HasPermission('users.read')` |
| PATCH | `<uuid:pk>/update/` | `UserUpdateView` | `HasPermission('users.update')` |
| POST | `<uuid:pk>/suspend/` | `UserSuspendView` | `HasPermission('users.update')` |
| POST | `<uuid:pk>/roles/` | `UserRoleAssignView` | `HasPermission('roles.assign')` |
| DELETE | `<uuid:pk>/roles/<role_pk>/` | `UserRoleRemoveView` | `HasPermission('roles.assign')` |

### Hub team alias (`/api/v1/app/team/`, `team_urls.py`)
Reutiliza las mismas vistas (`UserListView`, `UserInviteView`, `UserSuspendView`) bajo otro prefijo — no hay lógica nueva, solo otro punto de entrada para el Hub Client Portal.

## Permisos y seguridad

- Vistas admin protegidas con `HasPermission(codename)` del módulo `rbac` (ver [`specs/rbac.md`](rbac.md)).
- `LoginView`, `RegisterView`, `MFAValidateView`, `ForgotPasswordView`, `ResetPasswordView`, `ResendVerificationView`, `MFARecoveryView` tienen throttles dedicados (`utils/throttles.py`) — mitigación de fuerza bruta/spam.
- `SSOValidateView` no requiere auth — la seguridad es el token opaco de 64 chars + `select_for_update()` + transacción atómica + invalidación single-use.
- `YapePaymentProofView` no requiere JWT — usa `payment_upload_token` (Redis, 30min, single-use) para identificar el tenant sin exponer un endpoint autenticado a un usuario que aún no puede loguear (su cuenta está activa pero el pago está pendiente).
- Todas las acciones SSO (`token_created`, `token_validated`, `token_invalid`) se auditan en `AuditLog` con IP y user-agent — ver módulo `audit`.

## Reglas de negocio no obvias

1. **`RegisterSerializer.save()` es una operación multi-paso atómica** (`@transaction.atomic`): crea `Tenant` (siempre con `plan='free'` inicialmente, sin importar el plan elegido), crea el `User`, en `DEBUG=True` auto-verifica el email, si el plan elegido es pagado actualiza la `Subscription` (creada por signal) a `status='pending_payment'` y limpia el trial, asigna el rol de sistema `Owner` (si existe en fixtures), crea un `ReferralCode` para el tenant, y si vino un `ref_code` válido crea un `Referral` pendiente — **todo o nada falla silenciosamente en partes no críticas** (ej. `Role.DoesNotExist` se ignora con `pass`, igual que errores al procesar el referral).
2. **El tenant queda en `plan='free'` aunque el usuario eligió un plan pagado** — el upgrade real solo ocurre cuando un admin aprueba el `YapePaymentProof` (ver `specs/subscriptions.md`) o se completa un pago Stripe. Ver [ADR-004](../docs/adr/004-pago-manual-yape.md).
3. **El webhook de N8N en registro se dispara en un thread separado** (`threading.Thread(daemon=True)`), sin bloquear la respuesta HTTP ni reintentar si falla (excepción silenciada con `except Exception: pass`).
4. **`LoginView` bifurca según `mfa_enabled`**: si está activo, no devuelve JWT directamente — devuelve `{mfa_required: True, mfa_token}` (token de sesión de 10 min) que el cliente debe validar en `mfa/validate` o `mfa/recovery`.
5. **`LoginSerializer` rechaza login si `email_verified=False`** con un mensaje especial `'email_not_verified'` (no genérico) — permite al frontend mostrar un flujo de reenvío de verificación en vez de un error de credenciales.
6. **MFA setup es de dos pasos**: `MFAEnableView` genera el secret y lo guarda temporalmente en cache (`mfa_setup:{user_id}`, 10 min) sin persistirlo en el modelo; solo `MFAVerifySetupView` (tras validar el primer TOTP) persiste `mfa_secret`/`mfa_enabled=True` en `User` y genera 10 recovery codes de un solo uso (`secrets.token_hex(8)`, hasheados con `make_password`, devueltos en texto plano una sola vez).
7. **Recovery codes se invalidan completamente al deshabilitar MFA** (`MFADisableView` borra todos los `MFARecoveryCode` del usuario) y al re-generar el setup (`MFAVerifySetupView` borra los anteriores antes de crear los nuevos).
8. **`UserSuspendView` y `UserRoleRemoveView` protegen al último Owner activo** del tenant — no se puede suspender ni quitar el rol `Owner` (sistema) si `_count_active_owners(tenant) <= 1`, para evitar tenants sin administrador.
9. **`UserInviteView` crea el usuario con `is_active=False` y password aleatoria** (`uuid4().hex`, nunca comunicada) — la cuenta solo se activa cuando el invitado usa `accept-invite` para establecer su propia contraseña.
10. **`AcceptInviteView` reutiliza el token de verificación de email** (`verify_email_token`, no un token separado) y exige `User.is_active=False` — un mismo mecanismo de token sirve tanto para verificar email en registro normal como para activar invitaciones.
11. **`SSOTokenView` valida tres condiciones antes de emitir el token**: tenant activo (`tenant.is_active`), servicio existente y activo (`Service.is_active`), y que el tenant lo tenga adquirido con `TenantService.status == 'active'` — devuelve 403/404 específicos para cada caso.
12. **`SSOValidateView` maneja la expiración eliminando el token** (no solo marcándolo usado) — un token expirado se borra de la tabla tras loguear el motivo en `AuditLog`, evitando acumulación de tokens vencidos.
13. **`GoogleOAuthInitView` solo acepta `?next=hub`** — el Admin Panel (staff) no soporta login con Google, solo el Hub Client Portal.

## Relación con otras apps

- **`rbac`**: `UserRole`/`Role` definen los permisos efectivos de cada `User` (ver [`specs/rbac.md`](rbac.md)). `check_plan_limit(user, 'users', count)` se invoca en `UserCreateView` antes de crear un usuario nuevo.
- **`tenants`**: `User.tenant` FK obligatoria; `RegisterSerializer` crea el `Tenant` inicial; `TenantSerializer` se reutiliza en casi toda respuesta de auth.
- **`subscriptions`**: el registro con plan pagado deja la `Subscription` en `pending_payment` (ver `specs/subscriptions.md`); `YapePaymentProofView` crea el `YapePaymentProof` inicial que luego se aprueba/rechaza desde ese módulo.
- **`audit`**: `AuditLog` registra cada evento SSO (creación, validación, invalidación de token).
- **`services`**: `SSOTokenView` consulta `Service`/`TenantService` para construir la `redirect_url` y validar que el servicio esté adquirido y activo.
- **`referrals`**: el registro crea un `ReferralCode` propio y, si se pasó `ref_code`, un `Referral` pendiente vinculado al tenant referente.

## Specs / docs relacionados

- [`docs/adr/004-pago-manual-yape.md`](../docs/adr/004-pago-manual-yape.md) — por qué el registro con plan pagado deja el tenant en `pending_payment`
- [`specs/subscriptions.md`](subscriptions.md) — flujo completo de aprobación/rechazo de pago
- [`specs/rbac.md`](rbac.md) — motor de permisos consumido por las vistas admin de usuarios
- [`specs/README.md`](README.md) — resumen arquitectónico transversal
