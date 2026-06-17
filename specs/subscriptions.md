# Spec: subscriptions (`apps/backend_django/apps/subscriptions/`)

**Última actualización**: 2026-06-16

## Propósito

Gestiona el ciclo de vida de la suscripción de cada tenant: el plan activo, el
estado de facturación, los métodos de pago (tarjeta vía Stripe o métodos LATAM
manuales como Yape), las facturas, y el catálogo de planes mostrado en el
checkout. Incluye un flujo de pago manual completo (Yape) con aprobación vía
panel admin o vía links de un-click enviados por Telegram.

## Modelos

### `Subscription` (`models.py`)
- `tenant` — `OneToOneField` a `Tenant`, `CASCADE`
- `plan` — `PLAN_CHOICES` (de `tenants.models`), default `'free'`
- `status` — `STATUS_CHOICES`: `trialing`, `active`, `past_due`, `canceled`, `unpaid`, **`pending_payment`**
- `billing_cycle` — `monthly` | `annual`
- `stripe_subscription_id`, `stripe_customer_id`
- `trial_start`, `trial_end`
- `current_period_start`, `current_period_end`
- `cancel_at_period_end` — bool, default `False`
- `credit_balance` — `Decimal`, default `0.00`
- Índice en `(tenant, status)`

### `Invoice` (`models.py`)
- `tenant` FK `CASCADE`
- `stripe_invoice_id` — único
- `amount_cents` — entero positivo (Stripe usa centavos)
- `currency` (default `usd`), `status` (`INVOICE_STATUS`: draft/open/paid/void/uncollectible)
- `pdf_url`, `period_start/end`, `invoice_date`, `due_date`, `paid_at`
- Propiedad `amount_display` → `f"${cents/100:.2f}"`

### `PaymentMethod` (`models.py`)
- `tenant` FK `CASCADE`
- `stripe_payment_method_id` — único, nullable (solo si `type='card'`)
- `type` — `'card'` | `'external'`
- Campos de tarjeta: `brand`, `last4`, `exp_month`, `exp_year`
- `is_default` — bool
- Campos LATAM: `external_type` (`paypal|mercadopago|yape|plin|nequi|daviplata`), `external_email`, `external_phone`, `external_account_id` (texto, AES-256 encriptado)
- **`save()` override**: si `is_default=True`, desmarca cualquier otro método del mismo tenant; si `external_account_id` no empieza con `'gAAAAA'` (prefijo de Fernet/AES), lo encripta vía `utils.encryption.encrypt_value` antes de guardar

### `YapePaymentProof` (`models.py`)
- `subscription` FK `CASCADE`
- `screenshot` — `ImageField`
- `plan`, `amount`
- `status` — `YAPE_PROOF_STATUS`: `pending` | `approved` | `rejected`
- `admin_token` — único, indexado, 64 chars — credencial de los links de Telegram
- `reviewed_at`
- Índice nombrado `yape_proof_status_idx` en `status`

### `YapeConfig` (`models.py`)
- Singleton (no hereda `BaseModel`, PK entero estándar): `phone`, `holder_name`, `is_enabled`, `exchange_rate` (default `3.75`), `instructions_note`
- `YapeConfig.get()` (classmethod) → `get_or_create(id=1)`, único punto de acceso

### `Plan` (`models.py`)
- PK = `id` (CharField, `choices=PLAN_CHOICES`) — **inmutable**: free/starter/professional/enterprise
- `display_name`, `description`, `price_monthly`, `price_annual`, `popular`, `highlights` (JSONField `[{label, included}]`)
- Metadata de presentación editable por admins sin tocar código; ordenado por `price_monthly`

## Serializers

| Serializer | Qué hace | Cuándo se usa |
|---|---|---|
| `SubscriptionSerializer` | Read-only, todos los campos del modelo | Respuesta tras upgrade/cancel |
| `CurrentSubscriptionSerializer` | Agrega `usage` (users/storage/services vs límites del plan), `plan_display`, `mrr` (último invoice pagado / 100) | `GET /subscriptions/current` |
| `InvoiceSerializer` | Read-only + `amount_display` | Listado de facturas |
| `PaymentMethodSerializer` | Read-only; **excluye `external_account_id`** intencionalmente (sensible, write-only) | Listado/detalle de métodos de pago |
| `PaymentMethodCreateSerializer` | Valida XOR entre `stripe_payment_method_id` (tarjeta) y `external_type` (LATAM) — error si ambos o ninguno | Alta de método de pago |
| `PaymentMethodUpdateSerializer` | `is_default`, `external_email/phone/account_id` opcionales | PATCH de método de pago |
| `PlanSerializer` / `PlanUpdateSerializer` | Serializa/actualiza metadata de catálogo | Vistas de planes |
| `UpgradeSerializer` | Valida `new_plan != current_plan` (lee `request.tenant.plan`) | `POST /subscriptions/upgrade` |

## `StripeClient` (`stripe_client.py`)

Wrapper stateless sobre el SDK de Stripe (`stripe.api_key` seteado en `__init__`):

| Método | Propósito |
|---|---|
| `create_customer(tenant)` | Crea customer en Stripe con metadata `tenant_id`/`tenant_slug` |
| `create_subscription(customer_id, price_id, trial_days=14)` | Crea suscripción nueva, expande `latest_invoice.payment_intent` |
| `upgrade_subscription(stripe_sub_id, new_price_id)` | Modifica el price del primer item, `proration_behavior='create_prorations'` |
| `cancel_subscription(stripe_sub_id, at_period_end=True)` | Cancela (por defecto al fin del período) |
| `list_invoices(customer_id, limit=20)` | Lista facturas de Stripe |
| `attach_payment_method` / `set_default_payment_method` | Asocia tarjeta al customer |
| `construct_webhook_event(payload, sig_header)` | Verifica firma HMAC del webhook |
| `get_price_id(plan, billing_cycle)` | Lee `settings.STRIPE_PLAN_PRICES[plan][billing_cycle]` |

## Endpoints

| Método | Path | Vista | Permisos | Propósito |
|---|---|---|---|---|
| GET | `/api/v1/admin/subscriptions/current` | `CurrentSubscriptionView` | `IsAuthenticated` | Suscripción actual del tenant (la crea con `get_or_create` si no existe) |
| POST | `/api/v1/admin/subscriptions/upgrade` | `UpgradeSubscriptionView` | `HasPermission('subscriptions.manage')` | Cambia de plan (crea o modifica suscripción Stripe) |
| POST | `/api/v1/admin/subscriptions/cancel` | `CancelSubscriptionView` | `HasPermission('subscriptions.cancel')` | Cancela al fin del período actual |
| GET | `/api/v1/admin/billing/invoices` | `InvoiceListView` | `IsAuthenticated` | Lista facturas (`?refresh=true` sincroniza desde Stripe) |
| GET, POST | `/api/v1/admin/billing/payment-methods` | `PaymentMethodListView` | GET: `IsAuthenticated`; POST: `HasPermission('billing.manage')` | Lista / crea método de pago (tarjeta o LATAM) |
| PATCH, DELETE | `/api/v1/admin/billing/payment-methods/<pm_id>/` | `PaymentMethodDetailView` | `HasPermission('billing.manage')` | Edita / borra método de pago |
| POST | `/api/v1/admin/billing/webhooks` | `WebhookView` | `AllowAny`, sin auth (firma HMAC), `csrf_exempt` | Recibe eventos Stripe |
| GET, PATCH | `/api/v1/admin/billing/plans/`, `/plans/<plan_id>/` | `AdminPlanListView`, `AdminPlanDetailView` | `HasPermission('subscriptions.manage')` | CRUD de metadata de catálogo |
| GET | `/api/v1/public/plans/` | `PlansView` | `AllowAny` | Catálogo público de planes |
| GET, PATCH | `/api/v1/admin/yape/config/` | `YapeConfigView` | `IsAuthenticated` + chequeo manual `is_staff` | Config de Yape (teléfono, tasa de cambio) |
| GET | `/api/v1/admin/yape/proofs/` | `YapeProofListView` | `IsAuthenticated` + chequeo manual `is_staff` | Lista paginada de comprobantes con filtros + KPIs |
| PATCH | `/api/v1/admin/yape/proofs/<uuid:proof_id>/review/` | `YapeProofReviewView` | `IsAuthenticated` + chequeo manual `is_staff` | Aprueba/rechaza un comprobante desde el panel |
| GET, POST | `/api/v1/public/yape-payment/activate/<token>/` | `YapeActivateView` | `AllowAny`, sin auth | Página de confirmación + aprobación vía link de Telegram |
| GET, POST | `/api/v1/public/yape-payment/reject/<token>/` | `YapeRejectView` | `AllowAny`, sin auth | Página de confirmación + rechazo vía link de Telegram |
| GET | `/api/v1/public/yape-payment/config/` | `YapeConfigPublicView` | `AllowAny` | Datos públicos de Yape (Hub los muestra en el checkout) |

## Permisos y seguridad

- Vistas admin estándar (subscriptions/billing/plans) usan `HasPermission(codename)` del módulo `rbac` — ver [`specs/rbac.md`](rbac.md).
- **Las vistas Yape admin (`yape_admin_views.py`) NO usan `HasPermission`** — verifican `request.user.is_staff` manualmente en cada método (`_check_staff` / chequeo inline). Es una inconsistencia respecto al resto del backend, documentada tal cual está en el código (no es un bug a corregir en este spec).
- `WebhookView` no autentica usuario — la seguridad es la verificación de firma HMAC de Stripe (`construct_webhook_event`, responde 400 si la firma no es válida).
- `YapeActivateView`/`YapeRejectView` tampoco autentican usuario — la seguridad es el `admin_token` opaco (64 chars) embebido en la URL, enviado solo por Telegram al staff.

## Reglas de negocio no obvias

1. **`WebhookView` siempre responde 200**, incluso si el procesamiento interno de un evento lanza una excepción (capturada y logueada) — evita que Stripe reintente indefinidamente el mismo webhook.
2. **`UpgradeSubscriptionView` sin suscripción Stripe previa crea todo desde cero con `trial_days=0`** — a diferencia de `StripeClient.create_subscription` que por defecto da 14 días de trial; el upgrade manual desde el panel no otorga trial.
3. **`PaymentMethodDetailView.delete` bloquea borrar el único método de pago** si `Subscription.status` está en `active`/`trialing`/`past_due` (HTTP 400 `last_payment_method`).
4. **El flujo de aprobación Yape está duplicado en dos vistas** (`YapeActivateView.post` vía Telegram y `YapeProofReviewView.patch` vía panel admin) — ambas ejecutan la misma secuencia transaccional: `subscription.status='active'`, limpian `trial_start`/`trial_end`, `tenant.is_active=True`, reactivan **todos** los `User` del tenant, marcan el proof como `approved`/`rejected`, y envían el mismo email. No está extraído a un service compartido. Ver [ADR-004](../docs/adr/004-pago-manual-yape.md) para el contexto del diseño con doble entrada.
5. **`YapePaymentProof.admin_token` se persiste en DB (no Redis)** — los links de aprobación/rechazo por Telegram deben seguir funcionando días después del envío, a diferencia de los tokens efímeros de `auth_app` (ver `specs/auth.md`, pendiente).
6. **`_already_processed` da idempotencia solo a nivel de UI**: un segundo click en un link ya procesado muestra una página informativa en vez de re-ejecutar la acción — no hay `select_for_update()` ni lock transaccional explícito contra una doble aprobación concurrente exacta (carrera teórica de baja probabilidad dado que requiere dos requests simultáneos sobre el mismo token).
7. **`Plan.id` (catálogo) ≠ `Subscription.plan` ≠ `Tenant.plan`**: son tres campos relacionados pero independientes. `tenant.plan` es la fuente que leen `HasFeature`/`check_plan_limit` del módulo `rbac` (no `Subscription.plan` directamente), aunque ambos se actualizan juntos en cada flujo de cambio de plan (upgrade, webhook, aprobación/rechazo Yape).
8. **`PaymentMethod.save()` auto-detecta si `external_account_id` ya está encriptado** verificando el prefijo `'gAAAAA'` (propio de Fernet) — evita doble encriptación en updates parciales.

## Relación con otras apps

- **`tenants`**: `Subscription.tenant` / `Invoice.tenant` / `PaymentMethod.tenant` — FKs `CASCADE`. `tenant.plan` es el campo que lee el RBAC engine para feature gating (ver [`specs/rbac.md`](rbac.md)).
- **`rbac`**: `HasPermission('subscriptions.manage'|'subscriptions.cancel'|'billing.manage')` protegen las vistas admin estándar (no las de Yape, ver arriba).
- **`auth_app`**: `User.tenant` se usa para reactivar usuarios (`User.objects.filter(tenant=tenant).update(is_active=True)`) tras aprobar un pago Yape. El flujo de registro con plan pagado (en `auth_app`) es el que originalmente crea el `Subscription` en estado `pending_payment` y el `YapePaymentProof` — ver `specs/auth.md` (Fase 3 del roadmap, pendiente).
- **`services`** (`apps.services.models.TenantService`): `CurrentSubscriptionSerializer.get_usage` cuenta servicios activos del tenant para mostrar el uso vs límite del plan.

## Specs / docs relacionados

- [`docs/adr/004-pago-manual-yape.md`](../docs/adr/004-pago-manual-yape.md) — decisión arquitectónica del flujo de pago manual
- [`reports/2026-06-15-implementacion-pago-yape.md`](../reports/2026-06-15-implementacion-pago-yape.md) — qué se implementó y cómo
- [`prd/features/billing.md`](../prd/features/billing.md) — PRD de billing
- [`specs/rbac.md`](rbac.md) — feature gates y permisos consumidos desde aquí
- [`specs/README.md`](README.md) — resumen arquitectónico transversal
