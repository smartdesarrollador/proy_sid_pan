# Diagramas de Secuencia - Referencia

**Documentos relacionados:**
- `auth-sequence-diagram.puml`
- `billing-sequence-diagram.puml`
**PRD:** `/prd/rbac-subscription-system.md`
**Fecha:** 2026-02-09

---

## Índice

1. [Diagramas de Autenticación](#diagramas-de-autenticación)
2. [Diagramas de Billing](#diagramas-de-billing)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Patrones de Diseño](#patrones-de-diseño)
5. [Security Considerations](#security-considerations)
6. [Performance Optimizations](#performance-optimizations)

---

## Diagramas de Autenticación

### 1. Login Básico con JWT

**Flujo:** Usuario → Frontend → API → Database → Usuario

**Pasos Principales:**
1. Usuario ingresa email y password
2. Frontend envía POST /api/v1/auth/login
3. API verifica rate limit (Redis)
4. AuthService valida credenciales (bcrypt)
5. Genera access token (15 min) y refresh token (7 días)
6. Guarda refresh token en DB (hashed)
7. Registra evento en audit log
8. Retorna tokens al frontend
9. Frontend guarda en localStorage
10. Redirige a dashboard

**Casos de Error:**
- **Password incorrecto:**
  - Incrementa contador de intentos fallidos (Redis)
  - Después de 5 intentos: lockout de 15 minutos
  - Registra en audit log (action: 'login_failed')

- **Cuenta bloqueada:**
  - Responde 429 Too Many Requests
  - Usuario debe esperar 15 minutos o contactar soporte

**Security Features:**
- Rate limiting: 100 req/min por IP
- Password hashing: bcrypt cost 12
- Token rotation en refresh
- Audit log inmutable de todos los intentos

**Endpoints:**
```
POST /api/v1/auth/login
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "subdomain": "acme"
  },
  "permissions": ["users.read", "users.create", ...]
}

Response 401 (Invalid credentials):
{
  "error": "invalid_credentials",
  "message": "Email or password is incorrect"
}

Response 429 (Account locked):
{
  "error": "account_locked",
  "message": "Too many failed attempts. Try again in 15 minutes.",
  "retry_after": 900
}
```

---

### 2. Request Protegido con Access Token

**Flujo:** Usuario → Frontend → Interceptor → API → Middleware → Database

**Pasos Principales:**
1. Usuario navega a página protegida (ej: /users)
2. Frontend intercepta request
3. Obtiene access_token de localStorage
4. Agrega header: Authorization: Bearer {token}
5. API middleware valida JWT signature
6. Decodifica claims (user_id, tenant_id, roles)
7. Busca permisos en cache (Redis, TTL 5min)
8. Si cache miss, consulta DB y cachea
9. Establece contexto: request.user, request.tenant
10. Valida permiso requerido (@require_permission)
11. Ejecuta query con RLS enforcement
12. Retorna datos filtrados por tenant

**Casos de Error:**
- **Token expirado:**
  - API retorna 401 con error: "token_expired"
  - Frontend ejecuta automáticamente refresh token flow
  - Retry del request original con nuevo token

- **Token inválido (firma incorrecta):**
  - API retorna 401 con error: "invalid_token"
  - Frontend cierra sesión y redirige a login

- **Sin permisos:**
  - API retorna 403 Forbidden
  - Frontend muestra mensaje "No autorizado"

**Cache Strategy:**
```python
# Redis key structure
key = f"permissions:{user_id}:{tenant_id}"
ttl = 300  # 5 minutos

# Cache hit -> No DB query
# Cache miss -> Query + set cache
```

**RLS Enforcement:**
```sql
-- PostgreSQL establece contexto
SET LOCAL app.tenant_id = 'uuid-tenant';

-- Todas las queries automáticamente filtran
SELECT * FROM users WHERE tenant_id = current_setting('app.tenant_id')::uuid;
```

---

### 3. Refresh Token

**Flujo:** Frontend → API → Database → Frontend

**Pasos Principales:**
1. Frontend detecta access_token expirado (401 response)
2. Obtiene refresh_token de localStorage
3. Envía POST /api/v1/auth/refresh {refresh_token}
4. API valida refresh token:
   - Hash con SHA-256
   - Busca en DB
   - Verifica no revocado
   - Verifica no expirado (< 7 días)
5. Genera nuevo access_token (15 min)
6. **Token Rotation:** Genera nuevo refresh_token
7. Revoca refresh_token anterior (UPDATE revoked_at)
8. Guarda nuevo refresh_token en DB
9. Retorna ambos tokens
10. Frontend actualiza localStorage
11. Retry del request original

**Token Rotation (Security Best Practice):**
- Previene replay attacks
- Si token antiguo se reutiliza → detectar compromiso
- Implementación:
  ```python
  old_token.revoked_at = timezone.now()
  old_token.save()

  new_token = RefreshToken.objects.create(
      user=user,
      token=generate_secure_token(),
      expires_at=timezone.now() + timedelta(days=7)
  )
  ```

**Endpoints:**
```
POST /api/v1/auth/refresh
Request:
{
  "refresh_token": "eyJhbGci..."
}

Response 200:
{
  "access_token": "eyJhbGci...",  // Nuevo
  "refresh_token": "eyJhbGci...", // Nuevo (rotated)
  "token_type": "Bearer",
  "expires_in": 900
}

Response 401 (Invalid/expired):
{
  "error": "invalid_refresh_token",
  "message": "Please login again"
}
```

---

### 4. Login con MFA (TOTP)

**Flujo:** Usuario → Frontend → API → Redis → Usuario (TOTP) → API → Database

**Pasos Principales:**

**Fase 1 - Email/Password:**
1. Usuario ingresa email y password
2. API valida credenciales
3. Detecta user.mfa_enabled = true
4. NO emite tokens todavía
5. Genera session_token temporal
6. Guarda en Redis: mfa_pending:{session_token} = {user_id}, TTL 5min
7. Retorna {mfa_required: true, session_token}
8. Frontend muestra input de código TOTP

**Fase 2 - Código TOTP:**
9. Usuario abre Google Authenticator
10. Ingresa código de 6 dígitos (renovado cada 30s)
11. Frontend envía POST /api/v1/auth/mfa/verify {session_token, totp_code}
12. API obtiene user_id desde Redis
13. Obtiene mfa_secret del usuario (encrypted)
14. Verifica código con pyotp.TOTP(secret).verify(code)
15. Si correcto:
    - Elimina mfa_pending de Redis
    - Genera access_token y refresh_token
    - Registra audit log (action: 'login_mfa')
    - Retorna tokens
16. Frontend guarda tokens y redirige

**Casos de Error:**
- **Código incorrecto:**
  - Incrementa contador: mfa_attempts:{session_token}
  - Máximo 3 intentos
  - Después de 3: eliminar sesión, volver a login

- **Session expirada (>5 min):**
  - Redis no tiene mfa_pending
  - Usuario debe reiniciar login completo

**TOTP Algorithm:**
```python
import pyotp

# Setup (una vez)
secret = pyotp.random_base32()  # "JBSWY3DPEHPK3PXP"
totp = pyotp.TOTP(secret)
qr_code = totp.provisioning_uri(
    name=user.email,
    issuer_name="MyApp"
)

# Verificación (cada login)
code_from_user = "123456"
is_valid = totp.verify(code_from_user, valid_window=1)
# valid_window=1 acepta código anterior/siguiente (60s total)
```

**Endpoints:**
```
POST /api/v1/auth/login (con MFA)
Response 200:
{
  "mfa_required": true,
  "session_token": "temp_session_xxx"
}

POST /api/v1/auth/mfa/verify
Request:
{
  "session_token": "temp_session_xxx",
  "totp_code": "123456"
}

Response 200:
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "user": {...}
}

Response 401 (Invalid code):
{
  "error": "invalid_totp",
  "message": "Invalid code",
  "remaining_attempts": 2
}
```

---

### 5. Logout

**Flujo:** Usuario → Frontend → API → Database → Redis

**Pasos Principales:**
1. Usuario hace click en "Logout"
2. Frontend envía POST /api/v1/auth/logout {refresh_token}
3. API revoca refresh_token (UPDATE revoked_at = NOW())
4. Cierra todas las sesiones activas del usuario
5. Elimina cache de permisos (Redis)
6. Registra audit log (action: 'logout')
7. Retorna 200 OK
8. Frontend limpia localStorage y sessionStorage
9. Frontend limpia estado de authService (signals)
10. Redirige a /login

**Logout Remoto (desde otra sesión):**
- Usuario puede ver sesiones activas en Settings
- Click "Revoke" en sesión específica
- Revoca solo ese refresh_token
- Sesión remota es deslogueada en próximo request

---

## Diagramas de Billing

### 1. Upgrade de Plan con Proration

**Flujo:** Admin → Frontend → API → Stripe → Database → Email

**Pasos Principales:**

**Fase 1 - Preview:**
1. Admin hace click "Upgrade to Professional"
2. Frontend obtiene planes disponibles (GET /api/v1/billing/plans)
3. Muestra comparación de planes y features
4. Admin confirma upgrade
5. Frontend solicita cálculo de proration (POST /api/v1/billing/upgrade)
6. API calcula:
   ```
   Días restantes: 19/28 del mes
   Starter restante (refund): -$29 * (19/28) = -$19.68
   Pro prorrateado: $99 * (19/28) = $67.18
   Total a cobrar HOY: $47.50
   Próxima factura (completa): $99.00 el 2026-02-28
   ```
7. Frontend muestra desglose: "Se cobrará $47.50 hoy"

**Fase 2 - Pago:**
8. Admin confirma pago
9. Frontend envía POST /api/v1/billing/confirm-upgrade
10. API inicia transacción DB
11. API carga con Stripe:
    ```python
    stripe.Charge.create(
        customer=tenant.stripe_customer_id,
        amount=4750,  # cents
        currency='usd',
        description='Upgrade to Professional'
    )
    ```
12. Si pago exitoso:
    - UPDATE tenant SET subscription_plan = 'professional'
    - INSERT invoice (amount: 47.50, status: 'paid')
    - INSERT audit_log (action: 'upgrade_plan')
    - DELETE cache de features (invalidar inmediatamente)
    - COMMIT transaction
13. API retorna 200 OK
14. Frontend recarga features disponibles
15. Usuario ve features Pro desbloqueadas inmediatamente

**Fase 3 - Email Asíncrono:**
16. Celery task: send_upgrade_email.delay()
17. Genera PDF de invoice
18. Sube a S3
19. Envía email con adjunto
20. Registra en email_log

**Casos de Error:**
- **Tarjeta declinada:**
  - Stripe retorna PaymentError: card_declined
  - ROLLBACK transaction (no cambiar plan)
  - Retornar 402 Payment Required
  - Frontend muestra: "Actualizar método de pago"

- **No tiene método de pago:**
  - Retornar 400 Bad Request
  - Frontend redirige a /billing/payment-methods

**Proration Formula:**
```python
from decimal import Decimal
from datetime import datetime, timedelta

def calculate_proration(tenant, new_plan):
    today = datetime.now().date()
    period_end = tenant.subscription_current_period_end.date()
    period_start = period_end - timedelta(days=28)  # Asumiendo mensual

    days_total = (period_end - period_start).days
    days_remaining = (period_end - today).days

    current_plan_price = get_plan_price(tenant.subscription_plan)
    new_plan_price = get_plan_price(new_plan)

    # Refund prorrateado del plan actual
    current_refund = Decimal(current_plan_price) * Decimal(days_remaining) / Decimal(days_total)

    # Cargo prorrateado del nuevo plan
    new_charge = Decimal(new_plan_price) * Decimal(days_remaining) / Decimal(days_total)

    # Total a cobrar hoy
    total_today = new_charge - current_refund

    return {
        'current_refund': -current_refund,
        'new_charge': new_charge,
        'total_today': total_today,
        'next_invoice': new_plan_price,
        'days_remaining': days_remaining
    }
```

---

### 2. Renovación Automática (Cronjob)

**Flujo:** Celery (Cronjob) → Database → Stripe → Email

**Trigger:** Cronjob ejecuta diariamente a las 00:00 UTC

**Pasos Principales:**
1. Celery ejecuta `process_subscription_renewals.delay()`
2. Query: Tenants con `subscription_current_period_end = TODAY()`
3. Para cada tenant:
   ```python
   for tenant in tenants_to_renew:
       plan_price = get_plan_price(tenant.subscription_plan)

       try:
           # Intentar cobro
           charge = stripe.Charge.create(
               customer=tenant.stripe_customer_id,
               amount=plan_price * 100,  # cents
               description=f"Subscription renewal - {month}"
           )

           # Éxito
           tenant.subscription_current_period_end += timedelta(days=30)
           create_invoice(tenant, charge, status='paid')
           send_email('renewal_success')

       except stripe.error.CardError as e:
           # Fallo
           create_invoice(tenant, status='failed')
           schedule_retry(tenant, days=3)  # Reintento en 3 días
           send_email('payment_failed')
   ```

4. Genera reporte diario:
   ```
   Date: 2026-02-09
   Successful renewals: 142
   Failed renewals: 8
   Total revenue: $13,464.00
   ```

**Retry Strategy:**
- **Intento 1:** +3 días (día 3)
- **Intento 2:** +7 días más (día 10 total)
- **Intento 3:** +14 días más (día 24 total)
- **Si falla 3 veces:** Suspender servicio

---

### 3. Reintento de Pago Fallido

**Flujo:** Celery (Scheduled) → Database → Stripe (múltiples métodos) → Email

**Trigger:** Celery task programado: `retry_payment.apply_async(countdown=259200)` (3 días)

**Pasos Principales:**
1. Task se ejecuta en día programado
2. Obtiene tenant y última factura fallida
3. Obtiene todos los métodos de pago del tenant (ordenados por default)
4. Intenta cobrar con cada método:
   ```python
   for payment_method in tenant.payment_methods.all():
       try:
           charge = stripe.Charge.create(
               customer=tenant.stripe_customer_id,
               source=payment_method.stripe_id,
               amount=invoice.amount * 100
           )
           # Éxito con método alternativo
           invoice.status = 'paid'
           tenant.subscription_status = 'active'
           send_email('payment_recovered')
           return  # Terminar loop

       except stripe.error.CardError:
           continue  # Probar siguiente método

   # Si todos fallan
   if attempts >= 3:
       tenant.subscription_status = 'suspended'
       send_email('service_suspended')
   else:
       schedule_next_retry(tenant, days=7)
   ```

**Estado del Tenant por Intento:**
- **Intento 1 fallido (día 3):** subscription_status = 'past_due'
- **Intento 2 fallido (día 10):** subscription_status = 'past_due'
- **Intento 3 fallido (día 24):** subscription_status = 'suspended'

**Email Templates:**
- **Intento 1:** "Payment Failed - Please update payment method"
- **Intento 2:** "Payment Failed Again - Service at risk"
- **Intento 3 (suspensión):** "Service Suspended - Update payment to restore"

---

### 4. Webhook de Stripe

**Flujo:** Stripe → Webhook Handler → Database → (opcional) Email

**Events Escuchados:**
1. `invoice.payment_succeeded`
2. `invoice.payment_failed`
3. `customer.subscription.deleted`
4. `customer.subscription.updated`
5. `payment_method.attached`
6. `payment_method.detached`

**Pasos Principales:**
1. Stripe envía POST /api/v1/webhooks/stripe
2. Request incluye header: `Stripe-Signature`
3. Webhook handler verifica firma:
   ```python
   try:
       event = stripe.Webhook.construct_event(
           payload=request.body,
           sig_header=request.META['HTTP_STRIPE_SIGNATURE'],
           secret=settings.STRIPE_WEBHOOK_SECRET
       )
   except ValueError:
       return HttpResponse(status=400)  # Invalid payload
   except stripe.error.SignatureVerificationError:
       return HttpResponse(status=401)  # Invalid signature
   ```

4. Procesa evento según tipo:
   ```python
   if event.type == 'invoice.payment_succeeded':
       tenant = get_tenant_by_stripe_customer(event.data.object.customer)
       invoice = update_or_create_invoice(event.data.object, status='paid')
       tenant.subscription_status = 'active'
       tenant.subscription_current_period_end = event.data.object.period_end

   elif event.type == 'invoice.payment_failed':
       invoice = update_or_create_invoice(event.data.object, status='failed')
       schedule_retry_payment(tenant)

   elif event.type == 'customer.subscription.deleted':
       tenant.subscription_status = 'canceled'
       send_email('subscription_canceled')
   ```

5. Retorna 200 OK (Stripe reintenta si falla)

**Security:**
- Firma HMAC SHA-256 verifica autenticidad
- Secret webhook único por environment
- Logs de webhooks sospechosos (firma inválida)

**Idempotency:**
- Stripe puede enviar duplicados
- Usar `event.id` como idempotency key
- Check if already processed antes de ejecutar

---

### 5. Cancelación de Suscripción

**Flujo:** Admin → Frontend → API → Stripe → Database → Email

**Pasos Principales:**
1. Admin hace click "Cancel Subscription"
2. Frontend muestra modal de confirmación:
   - "¿Estás seguro?"
   - "Tendrás acceso hasta 2026-02-28"
   - "¿Por qué cancelas?" (dropdown + textarea)
3. Admin confirma y opcionalmente da feedback
4. Frontend envía POST /api/v1/billing/cancel
5. API:
   ```python
   # NO cancelar inmediatamente
   tenant.subscription_status = 'canceled'
   tenant.will_cancel_at = tenant.subscription_current_period_end

   # Cancelar en Stripe al fin del período
   stripe.Subscription.delete(
       subscription_id,
       at_period_end=True  # Importante!
   )

   # Guardar feedback para analytics
   save_cancellation_feedback(tenant, reason, feedback)
   ```

6. Retorna 200 OK {will_cancel_at: "2026-02-28"}
7. Frontend muestra: "Cancelación programada. Acceso hasta Feb 28."
8. Email de confirmación enviado

**Al llegar fecha de cancelación (cronjob):**
```python
# Ejecuta diariamente
tenants_to_downgrade = Tenant.objects.filter(
    will_cancel_at__lte=today()
)

for tenant in tenants_to_downgrade:
    tenant.subscription_plan = 'free'
    tenant.subscription_status = 'active'  # Free plan
    tenant.will_cancel_at = None

    # Deshabilitar features Pro
    invalidate_features_cache(tenant)

    # Aplicar límites de plan Free
    enforce_plan_limits(tenant)

    # Opcional: Soft delete de datos excedentes
    if tenant.users.count() > 5:
        send_email('exceeds_free_plan_limits')
```

**Feedback Analytics:**
- Razones comunes: "Too expensive", "Missing features", "Switching to competitor"
- Dashboard para Product Manager
- Identificar patrones de churn

---

## Componentes del Sistema

### Frontend (Angular)

**Responsabilidades:**
- Captura input del usuario
- Validaciones básicas (formato email, password policy)
- Almacena tokens en localStorage
- Intercepta requests HTTP para agregar Authorization header
- Detecta token expirado y ejecuta refresh automático
- Maneja estados de UI (loading, error, success)
- Redirige según estado de autenticación

**Key Services:**
```typescript
AuthService {
  login(email, password): Observable<AuthResponse>
  logout(): void
  refreshToken(): Observable<TokenResponse>
  hasPermission(permission: string): boolean
}

AuthInterceptor {
  intercept(request): Observable<HttpEvent> {
    // Add Authorization header
    // Handle 401 with refresh
  }
}

BillingService {
  getPlans(): Observable<Plan[]>
  calculateUpgrade(plan): Observable<UpgradePreview>
  confirmUpgrade(plan): Observable<void>
  cancelSubscription(reason): Observable<void>
}
```

---

### Backend (Django)

**Componentes:**

**1. Auth Middleware:**
```python
class AuthMiddleware:
    def __call__(self, request):
        token = request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY)
            request.user = User.objects.get(id=payload['user_id'])
            request.tenant = Tenant.objects.get(id=payload['tenant_id'])
            request.permissions = get_cached_permissions(user, tenant)
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'token_expired'}, status=401)
        except Exception:
            return JsonResponse({'error': 'invalid_token'}, status=401)
```

**2. Auth Service:**
```python
class AuthService:
    def authenticate(self, email, password):
        user = User.objects.get(email=email)
        if not bcrypt.verify(password, user.password):
            raise InvalidCredentials

        access_token = generate_jwt(user, exp_minutes=15)
        refresh_token = generate_jwt(user, exp_days=7)

        RefreshToken.objects.create(user=user, token_hash=hash(refresh_token))

        return access_token, refresh_token
```

**3. Billing Service:**
```python
class BillingService:
    def upgrade_plan(self, tenant, new_plan):
        proration = self.calculate_proration(tenant, new_plan)

        charge = stripe.Charge.create(
            customer=tenant.stripe_customer_id,
            amount=int(proration['total_today'] * 100),
            currency='usd'
        )

        with transaction.atomic():
            tenant.subscription_plan = new_plan
            tenant.save()

            Invoice.objects.create(
                tenant=tenant,
                amount=proration['total_today'],
                status='paid',
                stripe_charge_id=charge.id
            )
```

---

### Database (PostgreSQL)

**Key Tables:**
- `user` - Usuarios con MFA
- `tenant` - Organizaciones con suscripción
- `refresh_token` - Tokens JWT (hashed)
- `audit_log` - Eventos inmutables (particionado por mes)
- `invoice` - Facturas
- `payment_method` - Tarjetas (solo Stripe token)

**RLS Policies:**
```sql
CREATE POLICY tenant_isolation ON users
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### Cache (Redis)

**Keys:**
```
permissions:{user_id}:{tenant_id} -> List[str]  TTL 300s
failed_attempts:{email} -> int  TTL 3600s
lockout:{email} -> bool  TTL 900s
mfa_pending:{session_token} -> {user_id}  TTL 300s
features:{tenant_id} -> Dict  TTL 300s
```

---

### External Services

**Stripe:**
- Cargos (charges)
- Customers
- Payment Methods
- Webhooks

**Email:**
- SendGrid / AWS SES
- Templates: login, mfa, upgrade, renewal, cancellation

**Storage (S3):**
- Invoice PDFs
- User uploads

---

## Patrones de Diseño

### 1. Token Rotation (Security)

**Problema:** Refresh tokens de larga duración son vulnerable a replay attacks.

**Solución:** Rotar refresh token en cada uso.
```python
def refresh_access_token(old_refresh_token):
    # Verify old token
    token_record = RefreshToken.objects.get(token_hash=hash(old_refresh_token))

    # Revoke old
    token_record.revoked_at = timezone.now()
    token_record.save()

    # Create new
    new_refresh = RefreshToken.objects.create(
        user=token_record.user,
        token=generate_secure_token(),
        expires_at=timezone.now() + timedelta(days=7)
    )

    new_access = generate_jwt(token_record.user, exp_minutes=15)

    return new_access, new_refresh.token
```

---

### 2. Proration Calculation

**Problema:** Cambios de plan a mitad de período deben ser justos.

**Solución:** Cálculo proporcional al segundo.
```python
def calculate_proration(current_plan_price, new_plan_price, days_remaining, days_total):
    ratio = Decimal(days_remaining) / Decimal(days_total)

    current_refund = Decimal(current_plan_price) * ratio
    new_charge = Decimal(new_plan_price) * ratio

    return new_charge - current_refund
```

---

### 3. Retry with Exponential Backoff

**Problema:** Pagos pueden fallar temporalmente (fondos insuficientes, límite diario).

**Solución:** Reintentos espaciados (días 3, 10, 24).
```python
RETRY_SCHEDULE = [3, 7, 14]  # días después de intento anterior

def schedule_retry(tenant, attempt_number):
    if attempt_number >= len(RETRY_SCHEDULE):
        suspend_tenant(tenant)
        return

    days_until_retry = RETRY_SCHEDULE[attempt_number]

    retry_payment.apply_async(
        args=[tenant.id],
        countdown=days_until_retry * 86400  # seconds
    )
```

---

### 4. Idempotency

**Problema:** Webhooks pueden llegar duplicados, requests pueden reintentar.

**Solución:** Idempotency keys.
```python
def process_webhook(event):
    # Check if already processed
    if WebhookEvent.objects.filter(stripe_event_id=event.id).exists():
        return  # Already processed, skip

    # Process
    handle_event(event)

    # Mark as processed
    WebhookEvent.objects.create(stripe_event_id=event.id)
```

---

## Security Considerations

### Authentication
- ✅ Passwords hashed with bcrypt (cost 12)
- ✅ JWT tokens with short expiry (15 min)
- ✅ Refresh token rotation
- ✅ Rate limiting (100 req/min)
- ✅ Account lockout (5 attempts, 15 min)
- ✅ MFA with TOTP (optional, enforced for Enterprise)
- ✅ Audit log of all auth events

### Authorization
- ✅ Row-Level Security (RLS) in PostgreSQL
- ✅ Permission caching with short TTL (5 min)
- ✅ Middleware validation on every request
- ✅ Decorator-based permission checks
- ✅ Frontend también valida (defense in depth)

### Payment Security
- ✅ PCI-compliant (Stripe Elements, no card data stored)
- ✅ Webhook signature verification (HMAC SHA-256)
- ✅ HTTPS obligatorio (TLS 1.3)
- ✅ Stripe tokens, no raw card data

### Data Protection
- ✅ Multi-tenant isolation with RLS
- ✅ Audit log inmutable (7 years retention)
- ✅ Sensitive data encrypted at rest (AES-256)
- ✅ GDPR compliance (data export, right to be forgotten)

---

## Performance Optimizations

### Caching
- **Permissions:** Redis, TTL 5 min
- **Plans:** Redis, TTL 1 hour
- **Features:** Redis, TTL 5 min
- **Webhook events:** Check DB para idempotency

### Database
- **Indexes:** Compuestos con tenant_id prefijo
- **Connection Pooling:** PgBouncer (min 10, max 50)
- **RLS:** Indexed queries, no full table scans
- **Partitioning:** audit_log por mes

### API
- **Pagination:** Default 25, max 100 per page
- **Async Tasks:** Celery para emails, PDFs, webhooks
- **Rate Limiting:** Redis-backed, per IP/user

### Frontend
- **Token refresh:** Automático, transparente
- **Lazy loading:** Módulos Angular
- **Debounce:** Búsquedas, autocomplete

---

## Referencias

- **PRD:** `/prd/rbac-subscription-system.md`
- **Casos de Uso:** `use-case-diagram.puml`
- **Modelo de Datos:** `class-diagram.puml`
- **Stripe Docs:** https://stripe.com/docs/api
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725

---

**Última Actualización:** 2026-02-09
**Versión:** 1.0
**Autor:** Tech Lead
