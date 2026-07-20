# Feature: Cupones de Descuento en el Registro (Promociones + Pago Yape)

[⬅️ Volver al README](../README.md)

---

## Índice
- [Product Overview](#product-overview)
- [Relación con el PRD de Promociones](#relación-con-el-prd-de-promociones)
- [Alcance v1](#alcance-v1)
- [Casos de Uso](#casos-de-uso)
- [User Stories](#user-stories)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Reglas de Negocio](#reglas-de-negocio)
- [Seguridad](#seguridad)
- [Plan de Implementación](#plan-de-implementación)

---

## Product Overview

Permitir que un cliente ingrese un **código de descuento (cupón)** durante el registro en el Hub
(`apps/frontend_next_hub`) y que el precio del plan se recalcule con el descuento aplicado en el
flujo de pago manual por Yape. Los cupones se gestionan desde la sección **Promociones** del Admin
Panel (`apps/frontend_admin`).

**Estado actual (verificado en el código, jul 2026):**

| Pieza | Estado |
|---|---|
| UI Promociones en Admin (`src/features/promotions/`: página, 4 hooks TanStack, modales, `types.ts`) | ✅ Existe, construida contra mocks |
| Backend de promociones (`/api/v1/admin/promotions/`) | ❌ No existe (solo el permiso `promotions.manage` en `seed_permissions.py`) |
| Pago Yape en registro (`YapePaymentStep.tsx` → `POST /api/v1/auth/yape-payment-proof`) | ✅ Funciona, sin soporte de cupones |
| Validación de monto en backend (`YapePaymentProofView`, `auth_app/views.py`) | ⚠️ Acepta el `amount` que envía el cliente sin validar contra `Plan.price_monthly` |
| Precios en el paso de pago del Hub (`PLAN_PRICES_USD` hardcodeado en `YapePaymentStep.tsx`) | ⚠️ Desincronizados del modelo `Plan` (starter: $29 hardcodeado vs $19 real) |

**Problema que resuelve:**
- No hay forma de ofrecer descuentos en el registro (campañas, partners, lanzamientos)
- La sección Promociones del Admin es una fachada sin backend
- El monto del pago Yape lo determina el cliente (vulnerabilidad) y los precios del paso de pago
  están hardcodeados y desactualizados

**Propuesta de valor:**
- Cupones administrables self-service desde la UI que ya existe en el Admin
- Descuento visible en vivo en el paso de pago del registro (precio original tachado → precio final en S/)
- Monto calculado **siempre en el servidor** — cierra la vulnerabilidad actual
- El admin ve el desglose (precio − cupón = total) al revisar cada comprobante

**Terminología:** internamente y en el Admin se usa "Promoción"; de cara al cliente (Hub) siempre
"código de descuento" o "cupón". El cupón **es** el campo `code` de la promoción (modelo único, 1:1).

---

## Relación con el PRD de Promociones

Existe [features/promotions.md](promotions.md) (2026-02-15), la spec original contra la que se
construyó la UI mock del Admin. Este PRD **la aterriza al flujo de pago real (Yape manual)** y
define el alcance v1. Donde difieran, **prevalece este documento**. Diferencias principales:

| Tema | promotions.md (viejo) | Este PRD (v1 real) |
|---|---|---|
| Flujo de pago | Checkout tipo Stripe, `original_price` enviado por el cliente | Yape manual; monto calculado server-side |
| Nombres de campos | `promo_type`, `valid_from/valid_until`, `first_payment_only` | `type`, `starts_at/expires_at`, `new_customers_only` (contrato de la UI real: `frontend_admin/src/features/promotions/types.ts`) |
| Respuesta del listado | `{ count, results }` | `{ promotions: [...] }` (lo que la UI ya espera) |
| Tipos de descuento | percentage, fixed_amount, extra_days | Solo `percentage` y `fixed_amount` en v1 |
| Reserva de usos | `tentative_uses` con expiración 15 min | `PromotionRedemption` pending → confirmed/released, atada al comprobante Yape |
| Estados | 5 estados incl. `scheduled`, tarea Celery horaria + webhooks | 4 estados (`active/paused/expired/depleted`), computados on-read, sin Celery ni webhooks |

---

## Alcance v1

**Incluye:**
- Backend completo de promociones: app Django `promotions`, CRUD admin, stats, validate público
- Integración con el registro: `promo_code` en el upload del comprobante Yape, monto server-side
- Redemption ligada al comprobante: se confirma al aprobar el pago, se libera al rechazar
- Cupón 100% de descuento → activa la cuenta directamente sin comprobante
- Wiring de la UI de Promociones del Admin al backend real
- Desglose del descuento en la revisión de comprobantes (tabla + modal + notificación Telegram)
- Input de cupón en el paso de pago del registro del Hub (i18n es/en)
- Fix colateral: precios del paso de pago desde `usePlans()` (fuente: modelo `Plan`)

**Fuera de alcance (fases posteriores):**
- Tipo `trial_extension` (existe en la UI del Admin → se oculta/deshabilita en v1)
- Cupones en el **upgrade** de plan (`YapeUpgradeStep` del Hub) — reutilizará el mismo validate
- Descuentos automáticos sin código (`auto_apply`)
- Varios códigos por campaña (tracking por canal)
- Webhooks de cambio de estado, export PDF/Excel de analytics
- Descuentos recurrentes: en el flujo Yape manual el descuento aplica **al pago en que se canjea**

---

## Casos de Uso

### CU-A: Admin crea y gestiona un cupón

**Actor:** Superadmin (permiso `promotions.manage`)

1. Accede a "Promociones" en el Admin Panel
2. Crea promoción: código `LANZAMIENTO20`, tipo porcentaje, valor 20, planes [starter, professional],
   vigencia 2026-07-20 → 2026-08-31, máx. 50 usos, 1 uso por cliente, solo clientes nuevos
3. Sistema valida (código único uppercase, fechas coherentes, valor según tipo) y la crea `active`
4. Puede pausarla/reanudarla en cualquier momento; los estados `expired` y `depleted` se computan solos

### CU-B: Cliente aplica cupón en el registro

**Actor:** Visitante registrándose con plan de pago

1. Completa pasos Cuenta → Empresa → Plan (elige Starter $19/mes) → llega al paso **Pago con Yape**
2. Abre "¿Tienes un código de descuento?", escribe `LANZAMIENTO20`, pulsa **Aplicar**
3. El Hub llama a `POST /public/promotions/validate/` → válido: muestra ~~$19~~ −20% = **$15.20**
   y el monto en soles recalculado (`15.20 × exchange_rate`)
4. Cliente paga por Yape el monto final, sube el screenshot; el submit incluye `promo_code`
5. Backend revalida el cupón, calcula el monto en servidor, crea el proof + redemption `pending`

**Alternativos:**
- 2a. Código inválido/pausado/inexistente → "Código no válido" (mensaje único, sin filtrar información)
- 2b. Expirado / agotado / no aplica al plan → mensaje específico
- 5a. El cupón se agotó entre validar y enviar → el backend rechaza con el motivo; el Hub lo muestra
  y permite quitar el cupón y pagar precio completo

### CU-C: Admin revisa comprobante con descuento

1. En "Pagos Yape → Comprobantes" (o vía links de Telegram) ve el desglose:
   `Starter $19.00 − LANZAMIENTO20 (−$3.80) = $15.20`
2. **Aprueba** → `activate_yape_proof` activa tenant/subscription, la redemption pasa a `confirmed`
   y `current_uses` se incrementa (con lock)
3. **Rechaza** → tenant queda en Free, la redemption pasa a `released` (el uso no se consume)

### CU-D: Cupón 100% — activación directa

1. Cliente aplica cupón `percentage=100` (o `fixed_amount` ≥ precio del plan)
2. Monto final = $0 → el Hub **no muestra** el paso de subir comprobante
3. El registro llama a un endpoint que revalida el cupón, activa la cuenta directamente
   (mismo efecto que `activate_yape_proof`, con Invoice de $0) y confirma la redemption
4. Cliente pasa directo al paso "¡Listo!"

---

## User Stories

### US-P1: Gestionar cupones desde el Admin

**Como** superadmin, **quiero** crear, pausar y monitorear códigos de descuento, **para** ejecutar
campañas sin soporte técnico.

**Criterios de aceptación:**
- [ ] La UI existente de Promociones opera contra el backend real (sin mocks)
- [ ] Crear valida: código `^[A-Z0-9]{3,20}$` único (se normaliza a uppercase), `starts_at < expires_at`,
      `value` 1–100 si percentage / > 0 si fixed_amount, `applicable_plans` ⊆ {starter, professional, enterprise}
- [ ] El código es inmutable tras la creación
- [ ] `max_uses` no puede reducirse por debajo de `current_uses`
- [ ] Eliminar solo si no tiene canjes registrados (cualquier redemption bloquea: una confirmada
      es historial de facturación y una pending es un pago en vuelo); si tiene, se ofrece pausar
- [ ] Stats por promoción: usos, redemptions confirmadas, descuento total otorgado, distribución por plan
- [ ] Tipo `trial_extension` oculto/deshabilitado en el modal de creación (v1)

### US-P2: Aplicar cupón en el registro

**Como** usuario nuevo con plan de pago, **quiero** ingresar un cupón en el paso de pago,
**para** pagar con descuento.

**Criterios de aceptación:**
- [ ] Campo colapsable "¿Tienes un código de descuento?" en `YapePaymentStep` con botón Aplicar y spinner
- [ ] Cupón válido → precio original tachado, línea de descuento, monto final en USD y en S/
      (recalculado con `exchange_rate` de `YapeConfig`)
- [ ] Cupón inválido → mensaje inline según motivo (ver [Reglas de Negocio](#reglas-de-negocio)); el precio no cambia
- [ ] Se puede quitar el cupón aplicado (vuelve al precio completo)
- [ ] El submit del comprobante envía `promo_code`; si la revalidación falla, el error se muestra
      y el usuario puede reintentar sin cupón
- [ ] Monto final $0 → se omite el upload y la cuenta se activa directa (paso "¡Listo!")
- [ ] Los precios del paso provienen de `usePlans()` — se elimina `PLAN_PRICES_USD` hardcodeado
- [ ] Textos en español hardcodeado, consistente con el resto del flujo de registro del Hub
      (todo `RegisterPageClient`/`YapePaymentStep` está sin i18n; migrar el registro a
      `i18n/locales/` es deuda técnica aparte)

### US-P3: Revisar comprobantes con descuento

**Como** admin, **quiero** ver qué cupón y qué descuento tiene cada comprobante, **para** verificar
que el monto pagado es correcto antes de aprobar.

**Criterios de aceptación:**
- [ ] `YapeProofsTable`: columna cupón/descuento (código + monto final; "—" si no hay cupón)
- [ ] `YapeProofModal`: desglose precio original / descuento / monto final
- [ ] Notificación de Telegram incluye el desglose
- [ ] Aprobar confirma la redemption e incrementa `current_uses` atómicamente; rechazar la libera

---

## Data Models

Nueva app Django: `apps/backend_django/apps/promotions/`. Campos alineados 1:1 con
`apps/frontend_admin/src/features/promotions/types.ts`.

### Promotion

```python
class Promotion(BaseModel):  # BaseModel: uuid pk + timestamps (core/models.py)
    code                  = models.CharField(max_length=20, unique=True, db_index=True)
    # ^[A-Z0-9]{3,20}$ — se normaliza a uppercase; inmutable tras creación
    name                  = models.CharField(max_length=100)
    description           = models.TextField(blank=True, default='')

    TYPE_CHOICES = [('percentage', 'Porcentaje'), ('fixed_amount', 'Monto fijo')]
    # 'trial_extension' reservado para fase posterior (existe en la UI, deshabilitado en v1)
    type                  = models.CharField(max_length=20, choices=TYPE_CHOICES)
    value                 = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount          = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # cap en USD para type=percentage; NULL = sin tope

    applicable_plans      = models.JSONField(default=list)   # ["starter", "professional"]
    new_customers_only    = models.BooleanField(default=True)

    starts_at             = models.DateTimeField()
    expires_at            = models.DateTimeField()
    max_uses              = models.IntegerField(null=True, blank=True)   # NULL = ilimitado
    max_uses_per_customer = models.IntegerField(default=1)
    current_uses          = models.IntegerField(default=0)   # solo redemptions CONFIRMADAS
    last_used_at          = models.DateTimeField(null=True, blank=True)

    is_paused             = models.BooleanField(default=False)
    # status expuesto por API es COMPUTADO (no columna):
    #   paused   si is_paused
    #   expired  si now > expires_at
    #   depleted si max_uses y current_uses >= max_uses
    #   active   en otro caso (incluye starts_at futuro: la validación de canje revisa starts_at)
```

### PromotionRedemption

```python
class PromotionRedemption(BaseModel):
    promotion       = models.ForeignKey(Promotion, on_delete=models.PROTECT, related_name='redemptions')
    tenant          = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='promo_redemptions')
    yape_proof      = models.OneToOneField('subscriptions.YapePaymentProof', on_delete=models.CASCADE,
                                           null=True, blank=True, related_name='redemption')
    # NULL en el caso 100% descuento (no hay comprobante)
    plan            = models.CharField(max_length=20)
    original_amount = models.DecimalField(max_digits=8, decimal_places=2)  # USD
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2)  # USD
    final_amount    = models.DecimalField(max_digits=8, decimal_places=2)  # USD

    STATUS = [('pending', 'Pending'), ('confirmed', 'Confirmed'), ('released', 'Released')]
    status          = models.CharField(max_length=10, choices=STATUS, default='pending')
    confirmed_at    = models.DateTimeField(null=True, blank=True)
```

Ciclo de vida: `pending` al subir el comprobante → `confirmed` cuando el admin aprueba
(en `activate_yape_proof`, dentro de la transacción, con `select_for_update` sobre la promoción
para incrementar `current_uses`) → `released` si el admin rechaza. En el caso 100% se crea
directamente `confirmed`.

### Cambios a modelos existentes

`YapePaymentProof` (`apps/subscriptions/models.py`) — el desglose queda accesible vía
`proof.redemption` (OneToOne inverso); **no se duplican campos**. El campo `amount` pasa a
significar siempre "monto final calculado en servidor".

---

## API Endpoints

### Admin (requieren `promotions.manage`)

#### GET /api/v1/admin/promotions/

Respuesta (contrato exacto de la UI actual — `usePromotions.ts`):

```json
{
  "promotions": [
    {
      "id": "uuid",
      "code": "LANZAMIENTO20",
      "name": "Lanzamiento Hub",
      "description": "",
      "type": "percentage",
      "value": 20,
      "max_discount": null,
      "applicable_plans": ["starter", "professional"],
      "new_customers_only": true,
      "starts_at": "2026-07-20T00:00:00Z",
      "expires_at": "2026-08-31T23:59:59Z",
      "max_uses": 50,
      "max_uses_per_customer": 1,
      "status": "active",
      "current_uses": 3,
      "last_used_at": "2026-07-22T14:00:00Z",
      "conversion_rate": 75.0,
      "total_revenue": 45.60,
      "avg_discount_amount": 3.80,
      "created_at": "2026-07-19T10:00:00Z"
    }
  ]
}
```

- `conversion_rate` = confirmadas / (confirmadas + liberadas) × 100
- `total_revenue` = Σ `final_amount` de confirmadas; `avg_discount_amount` = promedio de `discount_amount` confirmadas

#### POST /api/v1/admin/promotions/ · PATCH/DELETE /api/v1/admin/promotions/{id}/

- POST: cuerpo = `PromotionCreateRequest` de `types.ts`. 400 con detalle por campo si falla validación.
- PATCH: acepta parciales + `status: "paused" | "active"` (mapea a `is_paused`). El `code` es inmutable (400 si se intenta).
- DELETE: 409 si existe cualquier redemption (la UI ofrece pausar).

#### GET /api/v1/admin/promotions/{id}/stats/

```json
{
  "total_redemptions": 4,
  "confirmed": 3,
  "pending": 1,
  "released": 0,
  "total_discount": 11.40,
  "total_revenue": 45.60,
  "by_plan": [{ "plan": "starter", "count": 2 }, { "plan": "professional", "count": 1 }]
}
```

### Público

#### POST /api/v1/public/promotions/validate/

Sin auth. Rate limit (throttle scope propio, p. ej. 10/min por IP).

Request: `{ "code": "lanzamiento20", "plan": "starter" }` (código case-insensitive)

Respuesta 200 (válido):

```json
{
  "valid": true,
  "code": "LANZAMIENTO20",
  "type": "percentage",
  "value": 20,
  "original_price": 19.00,
  "discount_amount": 3.80,
  "final_price": 15.20,
  "exchange_rate": "3.75",
  "final_price_pen": 57.00
}
```

Respuesta 200 (inválido — siempre 200 con `valid: false`, nunca 404):

```json
{ "valid": false, "reason": "invalid" }
```

`reason` ∈ `invalid` (no existe / pausado / aún no inicia — **mensaje único**, no filtra existencia),
`expired`, `depleted`, `plan_not_applicable`.

### Cambios a endpoints existentes

#### POST /api/v1/auth/yape-payment-proof (modificado)

- Nuevo campo opcional `promo_code` (string).
- **El backend ignora el `amount` del request** y calcula:
  `original = Plan.objects.get(id=plan).price_monthly`; `final = original − descuento` (0 si sin cupón).
  Cambio aplicable **también sin cupón** — cierra la vulnerabilidad actual.
- Con `promo_code`: revalida (mismas reglas del validate + `new_customers_only` +
  `max_uses_per_customer` contra el tenant del upload token); si falla →
  400 `{ "detail": ..., "promo_reason": "<reason>" }` sin crear el proof.
- Si pasa: crea `YapePaymentProof(amount=final)` + `PromotionRedemption(status='pending')`.

#### POST /api/v1/auth/yape-activate-free (nuevo — caso 100%)

Mismo esquema de auth que el upload (`payment_upload_token`), body `{ payment_upload_token, plan, promo_code }`.
Revalida que el monto final sea exactamente $0; activa tenant/subscription (misma lógica que
`activate_yape_proof`, Invoice `amount_cents=0`), crea la redemption `confirmed` e incrementa usos.
Respuesta: `{ "message": ..., "activated": true }`.

#### GET /api/v1/admin/yape/proofs/ (modificado)

Cada proof incluye `promo`: `null` o
`{ "code", "original_amount", "discount_amount", "final_amount" }`.

#### Aprobación/rechazo (sin cambio de contrato)

`activate_yape_proof` (`subscriptions/services.py`) confirma la redemption + incrementa
`current_uses` (lock) + setea `last_used_at`, dentro de su transacción existente. El rechazo
(`YapeProofReviewView` y `YapeRejectView`) libera la redemption. El Invoice usa el monto final
(ya lo hace: `proof.amount`).

---

## Reglas de Negocio

**Orden de validación del cupón** (validate y revalidación en submit):

1. Código existe (case-insensitive, comparado en uppercase) y no está pausado → si falla: `invalid`
2. `now >= starts_at` → si falla: `invalid` (no se revela que existe pero aún no inicia)
3. `now <= expires_at` → si falla: `expired`
4. `max_uses` es NULL o `current_uses < max_uses` → si falla: `depleted`
5. `plan` ∈ `applicable_plans` → si falla: `plan_not_applicable`
6. *(solo en submit, con tenant conocido)* `new_customers_only`: el tenant no tiene redemptions
   confirmadas previas ni suscripción de pago previa
7. *(solo en submit)* redemptions del tenant sobre esta promoción (pending + confirmed) < `max_uses_per_customer`

**Cálculo del descuento** (server-side, Decimal, redondeo a 2 decimales HALF_UP):

- `percentage`: `discount = original × value/100`; si `max_discount` no es NULL, `discount = min(discount, max_discount)`
- `fixed_amount`: `discount = min(value, original)` (piso $0)
- `final = original − discount`; si `final == 0` → flujo de activación directa (CU-D)

**Concurrencia:** `current_uses` solo se incrementa al confirmar, con
`Promotion.objects.select_for_update()` dentro de la transacción de aprobación. Si al confirmar
`max_uses` ya se alcanzó (carrera entre dos aprobaciones), la aprobación del pago **procede
igualmente** (el cliente ya pagó) y se registra warning en logs — el cupo es un control de emisión,
no de aprobación.

**Estados computados:** sin tarea Celery; `status` se deriva al serializar y las validaciones de
canje evalúan las condiciones en vivo.

---

## Seguridad

- Monto **nunca** confiado del cliente: se elimina el uso del `amount` del request en
  `YapePaymentProofView` (fix de la vulnerabilidad existente, aplica con y sin cupón)
- Rate limiting en `/public/promotions/validate/` (scope DRF propio por IP) contra fuerza bruta de códigos
- Respuesta opaca para código inexistente/pausado/aún-no-vigente (un solo `reason: invalid`)
- Endpoint de activación gratuita revalida el 100% en servidor (no confía en que el Hub omitió el paso)
- Permiso `promotions.manage` (ya en seed) para todo el CRUD admin; auditoría con el patrón existente (`AuditMixin`)
- No se loguean códigos ingresados fallidos con datos del usuario (evitar PII en logs)

---

## Plan de Implementación

| Fase | Alcance | Entrega |
|---|---|---|
| 0 | Este PRD | `prd/features/promo-codes-registro.md` |
| 1 | Backend: app `promotions`, modelos, migraciones, CRUD admin + stats, tests | CRUD operativo vía Swagger |
| 2 | Backend: validate público + integración Yape (monto server-side, redemption, caso 100%, Telegram), tests | Flujo completo por API |
| 3 | Admin: conectar UI Promociones al backend real, ocultar `trial_extension`, tests | Gestión de cupones operativa |
| 4 | Admin: desglose de cupón en comprobantes (tabla + modal) + campo `promo` en la API de proofs | Revisión con desglose |
| 5 | Hub: input de cupón en `YapePaymentStep`, precios desde `usePlans()`, caso $0, i18n, tests | Registro con cupón end-to-end |
| 6 | Cierre: prueba manual E2E, `BACKLOG.md`, KB lessons-learned si aplica. Opcionales: cupones en upgrade, `trial_extension` | Feature cerrada |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [🎯 Features: Sistema de Promociones](promotions.md) (spec original — este PRD prevalece donde difieran)
- [🎯 Features: Billing & Subscriptions](billing.md)
- [🎯 Features: Hub - Portal del Cliente](hub-client-portal.md)

---

**Última actualización:** 2026-07-19
