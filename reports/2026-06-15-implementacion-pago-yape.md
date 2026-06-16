# Implementación de pago manual con Yape + Verificación vía IA/Telegram
**Fecha**: 2026-06-15
**Componente**: `apps/backend_django/apps/subscriptions/`, `apps/backend_django/apps/auth_app/`, `apps/frontend_next_hub/`, `workflows/yape-payment-verification.json`
**Severidad**: Alta — afectaba la integridad del modelo de suscripciones (clientes con plan pagado sin pagar)
**Estado**: ✅ Resuelto y verificado en producción

---

## Resumen Ejecutivo

Se implementó un flujo de pago manual vía Yape (billetera digital peruana) para tenants
que se registran con un plan pagado (Starter / Professional / Enterprise), sin necesidad
de integrar una pasarela de pago automatizada. El flujo combina:

- Subida de comprobante (screenshot) desde el Hub Client Portal
- Verificación asistida por IA (OpenAI Vision) sobre el comprobante
- Notificación a un grupo de Telegram con botones de aprobación/rechazo
- Activación o rechazo de la suscripción mediante endpoints públicos de un solo clic

Durante la implementación se detectaron y corrigieron **dos bugs de lógica de negocio**
y **un bug de seguridad** que permitían que un tenant accediera al plan pagado sin que
un administrador lo aprobara.

---

## Arquitectura del flujo

```
1. Usuario se registra en el Hub con plan Starter/Professional/Enterprise
   POST /api/v1/auth/register
   └─► tenant.plan = 'free'           (siempre arranca en Free)
   └─► subscription.plan = plan       (se guarda el plan solicitado)
   └─► subscription.status = 'pending_payment'
   └─► user.is_active = True          (puede ingresar de inmediato con Free)

2. Hub muestra instrucciones de pago (número Yape + titular, vía YapeConfig en DB)
   Usuario paga por Yape y sube el comprobante:
   POST /api/v1/auth/yape-payment-proof   (multipart/form-data)
   └─► Crea YapePaymentProof(status='pending', admin_token=<random>)
   └─► Dispara webhook hacia n8n

3. n8n (workflows/yape-payment-verification.json):
   Webhook → Extraer Datos → OpenAI Vision (análisis del comprobante)
           → Formatear Mensaje → Enviar Foto + Botones a Telegram

4. Admin revisa en Telegram:
   ✅ APROBAR CUENTA → GET confirmación → POST confirma
      └─► subscription.plan = proof.plan, status = 'active'
      └─► tenant.plan = proof.plan
      └─► email "¡Tu cuenta ha sido activada!"
   ❌ RECHAZAR PAGO → GET confirmación → POST confirma
      └─► subscription.plan = 'free', status = 'active'
      └─► tenant.plan se mantiene en 'free'
      └─► email informando que continúa con plan Free
```

---

## Problema 1 — Plan pagado se activaba sin aprobación del admin

### Síntoma
Tras registrarse con plan Starter y subir el comprobante (sin que el admin hiciera clic
en ningún botón), el usuario ya veía el plan Starter activo en el Hub.

### Causa raíz
`RegisterSerializer.save()` creaba el tenant directamente con `plan=plan` (el plan pagado
solicitado) y solo bloqueaba el login con `user.is_active=False`. El plan del tenant
quedaba en Starter desde el registro — la "protección" dependía únicamente de impedir el
login, no de mantener el plan en Free.

```python
# ANTES
tenant = Tenant.objects.create(..., plan=plan)   # plan pagado desde el inicio
...
if plan in ('starter', 'professional', 'enterprise'):
    Subscription.objects.filter(tenant=tenant).update(plan=plan, status='unpaid', ...)
    user.is_active = False
    user.save(update_fields=['is_active'])
```

### Fix aplicado
`apps/auth_app/serializers.py` — `RegisterSerializer.save()`:

```python
# DESPUÉS
tenant = Tenant.objects.create(..., plan='free')   # siempre Free hasta aprobación
...
if plan in ('starter', 'professional', 'enterprise'):
    Subscription.objects.filter(tenant=tenant).update(
        plan=plan,                  # se guarda el plan solicitado
        status='pending_payment',   # nuevo estado
        trial_start=None,
        trial_end=None,
    )
    # user.is_active ya no se desactiva — accede con Free de inmediato
```

`apps/subscriptions/models.py` — se agregó el estado `pending_payment`:

```python
STATUS_CHOICES = [
    ('trialing',        'Trialing'),
    ('active',          'Active'),
    ('past_due',        'Past Due'),
    ('canceled',        'Canceled'),
    ('unpaid',          'Unpaid'),
    ('pending_payment', 'Pending Payment'),   # ← nuevo
]
```

Migración `0007_alter_subscription_status_alter_yapeconfig_id.py` (solo documenta el
cambio de choices; no altera el esquema de la tabla).

---

## Problema 2 — Rechazo dejaba la cuenta en estado inconsistente

### Síntoma
Al rechazar un comprobante, `subscription.status` pasaba a `'canceled'`, pero
`tenant.plan` nunca había sido tocado por la lógica de rechazo, generando estados
ambiguos según el orden de operaciones.

### Fix aplicado
`apps/subscriptions/yape_public_views.py` (`YapeRejectView`) y
`apps/subscriptions/yape_admin_views.py` (`YapeProofReviewView`, rama `rejected`):

```python
# DESPUÉS — estado consistente: activo en Free
subscription.plan   = 'free'
subscription.status = 'active'
subscription.save(update_fields=['plan', 'status', 'updated_at'])
tenant.plan = 'free'
tenant.save(update_fields=['plan', 'updated_at'])
```

El correo de rechazo se actualizó para aclarar que la cuenta sigue activa en Free:

```
"Tu cuenta continúa activa con el plan Free. Si deseas intentarlo de nuevo o
tienes dudas, contáctanos respondiendo este email."
```

---

## Problema 3 (seguridad) — Telegram activaba la cuenta sin clic del admin

### Síntoma
Incluso después de corregir los problemas 1 y 2, las cuentas se activaban solas:
llegaba el correo "¡Tu cuenta ha sido activada!" ~2 minutos después del registro,
sin que el admin hubiera presionado "APROBAR CUENTA".

**Evidencia** (capturas adjuntas en el reporte original):
- Mensaje de Telegram con botones `✅ APROBAR CUENTA` / `❌ RECHAZAR PAGO` como links Markdown
- Email "¡Tu cuenta ha sido activada!" recibido 2 minutos después del email de verificación,
  sin interacción del admin
- Plan "Professional" ya activo en el Admin Panel sin revisión

### Causa raíz
El nodo `Enviar Acciones Telegram` del workflow n8n enviaba el mensaje con
`"disable_web_page_preview": false`. Telegram, al recibir un mensaje con un link,
**hace un GET automático a la primera URL para generar la vista previa**. Como
`YapeActivateView.get()` ejecutaba la activación completa en el método GET, la sola
vista previa de Telegram disparaba la aprobación — sin que nadie hiciera clic.

```json
// workflows/yape-payment-verification.json — nodo "Enviar Acciones Telegram"
{
  "chat_id": "-5572398047",
  "text": "...",
  "parse_mode": "Markdown",
  "disable_web_page_preview": false   // ← Telegram fetcheaba el link automáticamente
}
```

### Fix aplicado (dos capas)

**1. n8n — evitar que Telegram haga fetch del link:**
```json
"disable_web_page_preview": true
```

**2. Backend — patrón GET-confirmación / POST-acción (defensa en profundidad):**
Cualquier bot, crawler o cliente que vuelva a hacer un GET (link preview, escáner de
seguridad, etc.) ya no ejecuta ninguna acción. `apps/subscriptions/yape_public_views.py`:

```python
class YapeActivateView(APIView):
    def get(self, request, token):
        # Solo muestra página de confirmación con botón <form method="POST">
        ...
    def post(self, request, token):
        # Aquí se ejecuta la activación real
        ...

class YapeRejectView(APIView):
    def get(self, request, token):
        # Solo muestra página de confirmación con botón <form method="POST">
        ...
    def post(self, request, token):
        # Aquí se ejecuta el rechazo real
        ...
```

DRF aplica `csrf_exempt` automáticamente en `APIView.as_view()` cuando no hay
`SessionAuthentication`, por lo que el formulario POST funciona sin token CSRF
explícito (las vistas usan `authentication_classes = []` + `AllowAny`).

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `apps/backend_django/apps/subscriptions/models.py` | Nuevo estado `pending_payment` en `STATUS_CHOICES` |
| `apps/backend_django/apps/subscriptions/migrations/0007_*.py` | Migración generada por el cambio de choices |
| `apps/backend_django/apps/auth_app/serializers.py` | `RegisterSerializer.save()`: tenant arranca en Free, no desactiva al usuario |
| `apps/backend_django/apps/auth_app/tests/test_hub_flow.py` | Test actualizado: valida `tenant.plan='free'` + `subscription.status='pending_payment'` tras registro con plan pagado |
| `apps/backend_django/apps/subscriptions/yape_public_views.py` | Patrón GET-confirmación/POST-acción en `YapeActivateView` y `YapeRejectView`; rechazo deja estado consistente en Free |
| `apps/backend_django/apps/subscriptions/yape_admin_views.py` | Rama `rejected` de `YapeProofReviewView` alineada con la misma lógica |
| `workflows/yape-payment-verification.json` | `disable_web_page_preview: true` en nodo Telegram |
| `apps/frontend_next_hub/features/auth/hooks/useUploadYapeProof.ts` | Fix 415: `Content-Type: undefined` para que axios detecte `multipart/form-data` |

---

## Lecciones aprendidas

1. **Bloquear el login no es lo mismo que bloquear el acceso al plan.** El estado del
   `tenant.plan` debe reflejar la realidad aprobada; `user.is_active` es una capa
   independiente y no sustituye la validación de negocio.

2. **Endpoints de un solo clic vía GET son peligrosos.** Cualquier sistema que genere
   vistas previas de links (Telegram, Slack, WhatsApp, escáneres de seguridad de
   email) puede disparar un GET no intencional. Las acciones con efectos secundarios
   (aprobar, rechazar, eliminar) **siempre deben requerir POST**, incluso en flujos de
   "un clic" — usando una página de confirmación intermedia.

3. **`disable_web_page_preview` no es suficiente por sí solo** — es una mitigación a
   nivel de mensajería, pero la defensa real debe estar en el backend (GET seguro,
   POST con efecto). Cualquier otro canal de distribución del link (copiar y pegar en
   otro chat, reenviar por email, etc.) podría volver a exponer el problema si solo se
   confía en la configuración de Telegram.

4. **axios con `Content-Type` fijo en la instancia rompe `multipart/form-data`.**
   Cuando un cliente HTTP define `headers: { 'Content-Type': 'application/json' }`
   como default de la instancia, hay que sobreescribirlo explícitamente a `undefined`
   en requests con `FormData` para que el navegador/axios calculen el boundary
   correcto.

---

## Verificación post-fix

- [x] Registro con plan Starter → Hub muestra plan **Free**, usuario puede ingresar de inmediato
- [x] Comprobante subido → aparece en Telegram con análisis IA y botones
- [x] Vista previa de Telegram ya no activa la cuenta automáticamente
- [x] Clic en "✅ APROBAR CUENTA" → página de confirmación → clic en botón → cuenta activada con el plan correcto + email
- [x] Clic en "❌ RECHAZAR PAGO" → página de confirmación → clic en botón → cuenta permanece en Free + email explicativo
- [x] `make test` → 180 tests pasan (5 fallos preexistentes de throttling, no relacionados)

---

## Acciones recomendadas

- [ ] Agregar expiración (TTL) a los `admin_token` de `YapePaymentProof` para que los
      links de Telegram no queden vigentes indefinidamente.
- [ ] Mostrar en el Admin Panel un aviso visible de tenants en estado `pending_payment`
      con más de N días sin revisión.
- [ ] Considerar agregar autenticación básica (ej. un secreto compartido en query param
      o header) a los endpoints `yape-payment/activate/` y `yape-payment/reject/` además
      del `admin_token`, como capa adicional ante fuerza bruta del token.
