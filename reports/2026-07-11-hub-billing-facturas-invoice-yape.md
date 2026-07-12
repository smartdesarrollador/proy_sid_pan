# Hub Billing: "Historial de facturas" vacío — trailing slash + `Invoice` nunca generado

**Fecha:** 2026-07-11
**Apps:** `apps/backend_django` (`apps/subscriptions/`), `apps/frontend_next_hub`
**Origen:** el usuario pidió investigar, a partir de capturas de pantalla, si al adquirir un plan de
pago (en el registro o vía upgrade) se listaba el recibo en la sección de Facturación del Hub.
Las capturas mostraban `/billing` con "No tienes métodos de pago guardados" y "No tienes facturas
aún", y el flujo de registro mostrando selección de un plan de pago (Starter $19/mes).

## Diagnóstico

Investigación (2 agentes `researcher`/`Explore` en paralelo + verificación directa de código)
encontró **dos causas independientes**, ambas confirmadas contra el código real:

### 1. Bug de routing (mismo patrón que [[LL-005]])

`apps/backend_django/apps/subscriptions/urls.py` registraba `invoices`, `payment-methods` (list) y
`webhooks` **sin** `/` final, mientras el resto del proyecto sigue esa convención. El rewrite
catch-all de Next.js (`apps/frontend_next_hub/next.config.ts`, regla `/api/:path*` →
`${API_TARGET}/api/:path*/`) siempre añade una `/` al reenviar hacia Django. Los 5 hooks del Hub
(`useInvoices.ts`, `usePaymentMethods.ts`, `useAddPaymentMethod.ts`, `useDeletePaymentMethod.ts`,
`useSetDefaultMethod.ts`) ya mandaban la URL con `/` manual desde el cliente → doble slash → 404
silencioso (TanStack Query sin manejo de error se ve igual que "lista vacía"). Un cuarto endpoint
(`payment-methods/<id>/`, detalle, que ya tenía slash en Django) sufría el mismo problema en dev
por el mismo motivo — en producción "funcionaba" solo porque Nginx Proxy Manager le quita la barra
al request antes de llegar al rewrite (coincidencia, no diseño — ver [[LL-004]]).

### 2. Gap de negocio: nunca se creaba un `Invoice`

El único canal de cobro real del proyecto es Yape (pago manual, ver
`docs/adr/004-pago-manual-yape.md`); Stripe existe en el código (`stripe_client.py`, webhooks) pero
está desconectado de producción. `grep -rn "Invoice.objects.create" apps/` solo devolvía resultados
en archivos de test — ningún camino de producción escribía la tabla `invoices`.

Los dos puntos donde se aprueba un pago Yape actualizaban `Subscription`/`Tenant`/`User.is_active`
con un bloque de código **duplicado**, pero ninguno tocaba `Invoice`:
- `YapeProofReviewView.patch` (`yape_admin_views.py`) — panel admin.
- `YapeActivateView.post` (`yape_public_views.py`) — links de un click enviados por Telegram
  (probablemente el flujo más usado por el staff en la práctica).

Además, `InvoiceSerializer` no exponía los campos `number`/`amount` que el frontend
(`features/billing/types.ts`, `InvoiceRow.tsx`) ya consumía sin fallback — en cuanto existiera un
invoice real, `invoice.amount.toFixed(2)` (con `amount` `undefined`) habría lanzado un `TypeError`
que rompe el render completo del componente, no solo la celda.

## Solución

- `apps/backend_django/apps/subscriptions/urls.py`: trailing slash agregado a `invoices/`,
  `payment-methods/`, `webhooks/`.
- 5 hooks del Hub: removida la barra final manual (convención [[LL-002]]: "cliente sin slash, el
  rewrite la agrega").
- Nuevo `apps/backend_django/apps/subscriptions/services.py::activate_yape_proof(proof) -> Invoice`:
  helper compartido que activa `Subscription`/`Tenant`/`User.is_active` **y** crea el `Invoice`
  (`stripe_invoice_id=f'yape_{proof.id}'` para no colisionar con el `unique=True` sin `null=True`
  del campo, `amount_cents=int(proof.amount * 100)`, `currency='usd'`, `status='paid'`, período de
  30 días) en una sola `transaction.atomic()`.
- `YapeProofReviewView.patch` y `YapeActivateView.post` refactorizados para llamar al helper
  compartido, eliminando la duplicación de código preexistente entre ambos.
- `InvoiceSerializer`: agregados campos aditivos `number` (formato `INV-YYYYMM-XXXXXXXX`) y
  `amount` (en unidades, no centavos) para alinear con el contrato que el frontend ya esperaba.
- Tests actualizados en el mismo cambio: `apps/subscriptions/tests/test_views.py` (URLs con slash),
  `test/handlers/billing.handlers.ts` y `useBilling.test.ts` (URLs sin slash).

**Fuera de alcance, decisión deliberada:** `YapeRejectView.post` tiene el mismo tipo de duplicación
en su rama de rechazo, pero no genera invoice (no debe) y no fue pedido — se dejó igual. Tampoco se
tocó la reconciliación completa Stripe vs Yape (deuda ya trackeada en `BACKLOG.md`).

## Verificación

- Backend: 43/43 tests de `apps/subscriptions/` pasan. 5 fallos preexistentes en
  `auth_app/test_throttles.py` (rate-limiting), sin relación — no se tocó `auth_app`.
- Frontend: 66/66 tests de `frontend_next_hub` pasan (incluye 4 de billing actualizados).
- End-to-end en Django shell: se simuló la aprobación de un `YapePaymentProof` de plan Starter
  ($29) y se confirmó la creación correcta del `Invoice` (2900 cents, usd, `paid`, período de 30
  días) y la activación de `Subscription`/`Tenant`.
- Verificación por navegador real (no solo `curl`/test client, exigencia explícita de LL-005):
  `hub.local.test/api/v1/admin/billing/invoices` vía el proxy real de Next.js pasó de 404 a 401
  (ruta encontrada, solo falta auth) tras el fix. Hubo que reiniciar `rbac_django` porque Daphne
  (ASGI) no recarga `urls.py` automáticamente (ver [[LL-020]]) — antes del restart el fix parecía no
  aplicarse.
- Confirmado manualmente por el usuario en el navegador.

## Lección

Se registró **[[LL-095]]** en la sección E (Seguridad y lógica de negocio) de la KB: un evento de
negocio (`Invoice`) puede no registrarse nunca porque las rutas de aprobación estaban duplicadas y
ninguna lo escribía — mismo tipo de riesgo que [[LL-047]] (recurso con dos vías de entrada), pero
aquí la feature nunca existió en absoluto, no se "olvidó copiar" a una segunda vía. También se
amplió **[[LL-005]]** con un "Casos vistos" nuevo (esta misma sesión, endpoints de billing) y la
nota de que un proxy intermedio (Nginx Proxy Manager) puede ocultar un bug de doble-slash en
producción aunque siga presente en dev.
