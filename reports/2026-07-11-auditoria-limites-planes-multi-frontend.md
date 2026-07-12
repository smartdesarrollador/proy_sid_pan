# Auditoría de límites de plan + corrección de "Actualizar plan" en todos los frontends

**Fecha:** 2026-07-11
**Apps:** `apps/backend_django` · `apps/frontend_admin` · `apps/frontend_next_hub` · `apps/frontend_workspace` · `apps/frontend_next_vista` (verificación, sin cambios) · `apps/frontend_sidebar_desktop`
**Origen:** el usuario pidió revisar si lo que se ofrece en cada plan (Free/Starter/Professional/
Enterprise — cantidad de usuarios, almacenamiento, etc.) es real, o solo texto de marketing sin
enforcement real detrás. La auditoría destapó una cadena de bugs relacionados que se fueron
resolviendo uno a uno en la misma sesión, terminando en una limpieza completa de "cómo un cliente
ve y actualiza su plan" en las 5 apps cliente del proyecto.

## Resumen

Doce entregas encadenadas, cada una verificada (tests y/o navegador real con Chrome DevTools) antes
de pasar a la siguiente:

1. Fix: `UserInviteView` no aplicaba el límite `max_users` del plan (Free podía invitar usuarios
   ilimitados vía el botón real "Invitar usuario").
2. Fix: `storage_gb` nunca se medía ni se aplicaba — nuevo tracking real de almacenamiento por tenant.
3. Feature: límites de plan (usuarios, storage, proyectos, roles personalizados, API calls/mes)
   editables desde "Gestión de Planes" del Admin Panel, sin deploy.
4. Fix: plan del tenant desincronizado en el Hub (Dashboard/Suscripción mostraban Free/`-` cuando
   el tenant real era Professional) + consolidación del flujo de upgrade en un solo mecanismo real
   (Yape), eliminando un flujo Stripe muerto.
5. Fix: trailing slash rompía los 5 endpoints de acción de suscripción (`current`/`upgrade`/
   `cancel`/`yape-upgrade`/`trial`) al pasar por el proxy real del Hub — invisible en tests/`curl`
   directo, solo se veía por navegador.
6. Fix: el plan Enterprise no aparecía como opción en el registro del Hub.
7. Fix: `canUpgradePlan` (Hub) no contemplaba que un tenant Professional pudiera subir a Enterprise.
8. Fix: el plan Enterprise no aparecía en la landing pública del Hub.
9. Fix: botón "Ver planes" del Workspace apuntaba a una ruta interna inexistente en vez de al Hub.
10. Fix: mismo bug de `canUpgradePlan` replicado también en el Workspace.
11. Verificación: botón "Actualizar Plan" en Vista (`frontend_next_vista`) — ya funcionaba
    correctamente en los 4 puntos donde aparece, sin cambios necesarios.
12. Feature: botón "Actualizar plan" agregado al panel Perfil del sidebar de escritorio (Tauri) —
    era el único frontend cliente que no lo tenía. Verificado por el usuario en la app instalada.

También quedó documentada deuda técnica nueva (ver última sección): `api_calls_per_month` sigue sin
medirse, el backend de Stripe queda como código muerto, y el MRR mostrado en el Admin no refleja
precios editados desde "Gestión de Planes".

---

## 1. Límite de usuarios no aplicado en el flujo real de invitación

**Síntoma:** un tenant Free (límite documentado: 5 usuarios) podía invitar usuarios ilimitados.

**Causa raíz:** `POST /admin/users/create/` sí validaba `check_plan_limit`, pero el botón real
"Invitar usuario" del Admin Panel llama a `POST /admin/users/invite/` → `UserInviteView`
(`apps/auth_app/admin_views.py`), que creaba el `User` sin ese chequeo.

**Fix:** se agregó `check_plan_limit(request.user, 'users', current_count)` antes de crear el
usuario y enviar el email de invitación. Test nuevo `test_invite_exceeds_plan_limit`.

**Lección:** [LL-047](../.claude/skills/lessons-learned/references/knowledge-base.md) — cuando un
recurso tiene dos vías de creación (create directo vs. invite), el plan-gate debe replicarse en
ambas.

## 2. `storage_gb` nunca se medía

**Síntoma:** el medidor "Almacenamiento (GB)" del Admin Panel siempre mostraba 0% de uso, sin
importar cuánto subieran los clientes; ninguna subida se bloqueaba nunca por exceder el límite.

**Causa raíz:** `storage_used_gb`/`current_gb` estaban hardcodeados a `0` en
`apps/analytics/views.py`, `apps/tenants/serializers.py` y `apps/subscriptions/serializers.py`.

**Fix:** nuevo `utils/storage.py::get_tenant_storage_bytes(tenant)` — suma adjuntos de chat (vía
`message.sender.tenant`), logo/favicon del tenant y screenshots de comprobantes Yape; excluye
contenido global de plataforma (releases, catálogo, anuncios) y campos cifrados de Bóveda/env
vars/SSH keys/SSL certs (decisión explícita del usuario: solo cuenta almacenamiento de archivos
binarios). Nueva `check_storage_limit(tenant, additional_bytes)` en `apps/rbac/permissions.py` (no
reutiliza `check_plan_limit` porque `storage_gb` no sigue la convención de nombre `max_{resource}`).
Enforcement agregado en adjuntos de chat y logo/favicon del tenant.

**Lecciones:** [LL-048](../.claude/skills/lessons-learned/references/knowledge-base.md) (límites
"continuos" en bytes no encajan en `check_plan_limit`), [LL-063](../.claude/skills/lessons-learned/references/knowledge-base.md)
(caché de tenant por slug entre tests de Django — gotcha encontrado al escribir el primer test de
`apps/tenants/`, app que no tenía tests previos).

## 3. Límites de plan editables desde el Admin

**Pregunta del usuario:** ¿se pueden hacer editables los límites de cada plan sin deploy, y qué
pasa con tenants que ya acumularon uso cuando el límite cambia?

**Diseño acordado:** subset comercial curado editable (`max_users`, `storage_gb`, `max_projects`,
`max_custom_roles`, `api_calls_per_month`) — el resto de límites técnicos y los feature flags
booleanos (`mfa`, `sso`...) siguen en código, no son decisiones que Ventas/Soporte deban tocar sin
criterio técnico. Sin grandfathering: el límite es global y en vivo por plan, igual que el
comportamiento previo — bajar un límite nunca borra datos existentes, solo bloquea creación nueva
(el enforcement ya funciona así por diseño).

**Fix:** nuevo campo `Plan.limits` (JSONField, `apps/subscriptions/models.py`) con overrides —
`{}` = usar los defaults hardcodeados de `PLAN_FEATURES`, sin necesidad de data migration.
`Plan.save()` invalida el caché Redis del límite al instante. Nuevo
`utils/plans.py::get_effective_plan_limits(plan)` combina BD + código, cacheado 5 min —
`get_plan_limit()` lo usa como único choke point, así los 9+ callers existentes
(`check_plan_limit`, `check_storage_limit`...) heredan el override sin cambios de código. Se
detectaron y corrigieron 3 puntos que leían `PLAN_FEATURES` directo, saltándose el override:
`FeaturesView`, `apps/tenants/serializers.py` y `CurrentSubscriptionSerializer`. Admin Panel:
`PlanEditModal.tsx` con 5 inputs numéricos + checkbox "Sin límite" (null = ilimitado) por campo.

**Lección:** [LL-049](../.claude/skills/lessons-learned/references/knowledge-base.md) — al agregar
una nueva fuente de override, hacer `grep` de todos los lectores directos del dict viejo; no basta
con actualizar el helper "oficial".

## 4. Plan del tenant desincronizado en el Hub + consolidación del flujo de upgrade

**Síntoma (con capturas del usuario):** el Dashboard del Hub mostraba "Plan actual"/"Facturación"
como `-`, y la página Suscripción marcaba "Free" como "Plan Actual" mientras el topbar (misma
sesión) decía "Professional".

**Causa raíz:** dos fuentes de verdad para el plan del tenant sin sincronía garantizada — el
topbar lee `Tenant.plan` (correcto), pero Dashboard/Suscripción leen `Subscription.plan` (modelo
de bookkeeping de billing) vía `/admin/subscriptions/current`. La raíz más probable:
`apps/subscriptions/signals.py::auto_create_subscription` creaba la fila `Subscription` de cada
tenant nuevo con `plan='free'` hardcodeado sin mirar `Tenant.plan` — 5 sitios con el mismo patrón
(el signal + 4 vistas). **Nunca afectó el enforcement real** (`check_plan_limit` ya usa
`Tenant.plan` directo) — fue puramente un bug de visualización, también presente en
`ClientSubscriptionSerializer` (Admin Panel, "Clientes") — tercera superficie con el mismo bug.

**Fix:** los 5 `get_or_create` ahora siembran `plan=tenant.plan`; los serializers
(`CurrentSubscriptionSerializer`, `ClientSubscriptionSerializer`) ahora leen siempre
`obj.tenant.plan` (defensa en profundidad, sin necesitar data migration de filas ya
desincronizadas).

**Segundo hallazgo, en la misma investigación:** confirmado con el **ADR-004** ("Pago Manual vía
Yape", Estado: Aceptado) que este proyecto **no tiene pasarela Stripe integrada** — el botón
"Actualizar plan" de la página Suscripción apuntaba a un flujo Stripe muerto
(`UpgradeSubscriptionView`), mientras el botón del Dashboard sí usaba el flujo Yape real pero con
un catálogo de planes estático desconectado del real (`/public/plans/`). Se consolidó todo en un
solo `UpgradePlanDrawer` (Yape) reusado por ambos entry points con datos reales de `usePlans()`; se
eliminaron `UpgradePlanModal.tsx`/`useUpgradeSubscription.ts` (Stripe, sin otros consumidores).

**Verificación en navegador real:** con una sesión inyectada (tenant Professional) se confirmó
visualmente que topbar/Dashboard/Suscripción coinciden.

**Lección:** [LL-034](../.claude/skills/lessons-learned/references/knowledge-base.md) — dos
modelos guardando el mismo hecho de negocio en columnas separadas necesitan una fuente de verdad
explícita en la lectura, no confiar en que los writers los mantengan sincronizados por disciplina.

## 5. Trailing slash rompía los endpoints reales de suscripción

**Cómo se encontró:** al probar el fix anterior en el navegador real (no solo con tests), `GET
/admin/subscriptions/current` seguía devolviendo **404** a través del proxy real, aunque
funcionaba perfecto vía `curl` directo a Django o Django test client — ninguno de los dos pasa por
el rewrite de Next.js, así que ninguno detecta este tipo de bug.

**Causa raíz:** `next.config.ts` tiene una regla catch-all que **siempre** agrega trailing slash al
reenviar `/api/*` a Django, pero `apps/subscriptions/subscription_urls.py` definía 5 rutas
(`current`, `upgrade`, `cancel`, `yape-upgrade`, `trial`) **sin** ella — las únicas 5 de todo
`/api/v1/admin/` que no seguían la convención con slash del resto del proyecto (mismo patrón ya
documentado en LL-001…004 de la KB). Las 5 estaban rotas, incluida `yape-upgrade` — el flujo de
pago real recién consolidado en el punto anterior, nunca antes probado por navegador. Pista que ya
apuntaba al problema: `useCancelSubscription.ts` ya mandaba la URL con slash — alguien ya se había
topado con este bug para `cancel` y lo había "parchado" del lado equivocado (el cliente), lo cual
con el rewrite catch-all produce doble slash en vez de arreglarlo.

**Fix:** trailing slash agregado a las 5 rutas Django (14 URLs de test actualizadas),
`useCancelSubscription.ts` corregido para volver a la convención sin slash. Tests nuevos:
`TestYapeUpgradeView`/`TestStartTrialView` (0 cobertura previa pese a ser rutas reales de
producción).

**Verificación en navegador real:** con sesión inyectada se confirmó que el Dashboard ya no
muestra `-`, y que el flujo completo de upgrade Yape (seleccionar plan, subir comprobante) llega a
Django sin 404 (respuesta 400 de validación de negocio esperada por el propio setup de prueba, no
un error de routing).

**Lección:** [LL-005](../.claude/skills/lessons-learned/references/knowledge-base.md) — un endpoint
nuevo bajo `/api/v1/admin/` sin trailing slash rompe silenciosamente por el rewrite catch-all;
verificar siempre por navegador real, no solo `curl`/test client.

## 6. Plan Enterprise ausente en el registro del Hub

**Síntoma:** el wizard de registro (`/register`, step 3 "Elige tu plan") solo ofrecía
Free/Starter/Professional.

**Causa raíz:** un filtro de una sola línea sin comentario en `RegisterPageClient.tsx`
(`allPlans.filter(p => p.id !== 'enterprise')`), presente desde el primer commit del archivo.
Confirmado como omisión accidental, no decisión de producto: el backend (`RegisterSerializer`,
`RegisterView`, `YapePaymentProofView`) ya trataba Enterprise igual que Starter/Professional en
todo el flujo, y el ADR-004 + el PRD de billing documentan explícitamente que Enterprise debía
estar en el self-signup. No existe en el código ningún concepto de "Enterprise = contactar ventas".

**Fix:** se eliminó el filtro, ahora usa `allPlans` (de `usePlans()` → `/public/plans/`) directo.

## 7. `canUpgradePlan` no contemplaba Professional → Enterprise (Hub)

**Síntoma:** encontrado al verificar en navegador el fix del punto 4 — un tenant Professional veía
la card Enterprise como "Plan inferior" (deshabilitada) en vez de "Actualizar plan".

**Causa raíz:** `usePermissions.ts` tenía `canUpgradePlan` como lista fija:
`plan === 'free' || plan === 'starter'` — no contemplaba ningún upgrade posible desde Professional.

**Fix:** se exportó `PLAN_ORDER` (ya existía, privado, en `features/subscription/plans-data.ts`) y
se reemplazó la condición por `PLAN_ORDER.indexOf(plan) < PLAN_ORDER.length - 1` ("cualquier plan
que no sea el más alto"), evitando crear una tercera copia de la lista de planes. Tests nuevos
(starter→true, professional→true). Verificado en navegador real con sesión inyectada.

## 8. Plan Enterprise ausente en la landing pública del Hub

**Síntoma:** la landing (`hub.local.test/`, sección "Planes simples y transparentes") solo mostraba
3 planes.

**A diferencia del registro, acá había 3 puntos acoplados** en `LandingPageClient.tsx`:
1. Mismo tipo de filtro explícito — eliminado.
2. El grid estaba fijo a 3 columnas (`md:grid-cols-3 max-w-5xl`) — se cambió a responsive
   (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl`), mismo patrón que
   `PlanComparisonGrid.tsx`.
3. El texto del botón (CTA) tenía un `else` catch-all pensado para Professional
   ("Probar Professional gratis 30 días") — sin una rama explícita, Enterprise hubiera heredado ese
   texto y el `trial=true` por error. Se agregó rama `enterpriseCta` = "Empezar con Enterprise"
   (mismo self-signup que los demás planes, sin trial — los trials de 30 días son exclusivos de
   Professional por diseño).

**Verificación en navegador real:** 4 cards en fila en desktop, responsive correcto en mobile
(390px, se apila a 1 columna sin overflow), botón navega a `/register?plan=enterprise` con esa
card preseleccionada.

## 9. Botón "Ver planes" del Workspace apuntaba a una ruta rota

**Síntoma (con captura del usuario):** el botón "Ver planes" del sidebar del Workspace parecía
llevar a un lugar incorrecto.

**Causa raíz:** `onClick={() => navigate('/subscription')}` — una ruta **interna** del propio
Workspace que no existe ahí (esa página vive en el Hub). Ya existía el patrón correcto resuelto en
otro componente hermano del mismo Workspace (`UpgradePrompt.tsx`), simplemente no se había
replicado en el Sidebar.

**Fix:** se agregó `const HUB_URL = import.meta.env.VITE_HUB_URL ?? 'http://localhost:5175'` (la
variable ya existía en `.env`/`.env.example`) y el botón pasó a `<a href={`${HUB_URL}/subscription`}>`.

## 10. Mismo bug de `canUpgradePlan` en el Workspace

**Encontrado de paso** en el mismo archivo del punto 9. `frontend_workspace` es una app separada
sin código compartido con el Hub, así que se definió un `PLAN_ORDER` local en `Sidebar.tsx`, mismo
criterio que el punto 7. Test que asumía el bug (`'hides upgrade CTA when plan is professional'`)
se ajustó a `plan: 'enterprise'` (el único caso real donde debe ocultarse) + test nuevo confirmando
que Professional sí muestra la caja.

## 11. Verificación en Vista (`frontend_next_vista`) — ya funcionaba, sin cambios

Se revisaron los 4 puntos donde aparece "Actualizar Plan" en Vista (sidebar, card Landing Page,
card Portfolio bloqueada vía modal, sección QR de Tarjeta Digital) — los 4 ya usaban correctamente
`NEXT_PUBLIC_HUB_URL` → `${HUB_URL}/subscription`. Verificado en navegador real con sesión
inyectada: el link del sidebar resuelve a `http://hub.local.test/subscription`, y el modal de
upgrade de una card bloqueada también. No hizo falta ningún cambio.

## 12. Botón "Actualizar plan" agregado al sidebar de escritorio (Tauri)

**Contexto:** el panel Perfil de la app de escritorio ya mostraba el badge de plan
("Professional") en la card "ORGANIZACIÓN", pero no había ninguna forma de actualizarlo desde la
app — era el único frontend cliente sin este botón. Se ubicó dentro de esa misma card, debajo del
badge de plan, mismo patrón visual que el link a `digisider.com` que ya existía ahí (ícono
`ExternalLink`, `openExternal()` vía el comando Tauri `open_url`).

**Detalles encontrados durante la implementación:**
- `VITE_HUB_URL` no estaba declarada en el `.env` local de esta app (solo en `.env.production`) —
  se agregó (`http://hub.local.test`) para que funcione en dev sin depender solo del fallback en
  código.
- La paleta de color asumida inicialmente (`text-primary-*`, la que usan las otras 3 apps) no
  existe en el `tailwind.config` de esta app — acá todo lo accionable usa `blue-*`; se corrigió a
  `text-blue-400 hover:text-blue-300`.
- Visible solo si el plan no es ya Enterprise, mismo criterio que los puntos 7 y 10 (`PLAN_ORDER`
  local, esta app tampoco comparte código con las demás).

**Verificación:** `tsc --noEmit` limpio (esta app no tiene ESLint ni tests configurados). Sin
acceso a un navegador para probar una ventana nativa Tauri — **verificado manualmente por el
usuario en la app de escritorio instalada, confirmado que funciona bien.**

---

## Verificación global

- **Backend:** suite completa de `apps/backend_django` — 719 tests (mismos 10 fallos preexistentes
  y ya documentados, sin relación: 5 de rate-limiting, 3 de `chat_assistant`, 2 de `support`), sin
  regresiones nuevas en ningún punto de la cadena.
- **Frontend Hub (`frontend_next_hub`):** 66 tests, `tsc`/`eslint` limpios en cada entrega.
- **Frontend Workspace (`frontend_workspace`):** 297/299 tests (mismos 2 fallos preexistentes ya
  documentados en BACKLOG, `ProtectedRoute`/`SSOCallbackPage`, sin relación).
- **Frontend Vista (`frontend_next_vista`):** solo verificación en navegador, sin cambios de código.
- **Frontend Desktop (`frontend_sidebar_desktop`):** `tsc --noEmit` limpio; verificación funcional
  manual por el usuario en la app instalada.
- Varios puntos de la cadena (4, 5, 6, 8, 11) se verificaron además **en navegador real con Chrome
  DevTools** (sesión inyectada cuando hacía falta autenticación), no solo con tests automatizados —
  fue precisamente así como se encontró el bug del punto 5, invisible para los tests.

---

## Deuda técnica encontrada (no corregida en esta sesión)

- **`api_calls_per_month` nunca se mide ni se aplica** — mismo hueco que tenía `storage_gb` antes
  del punto 2, pero para llamadas API/mes. Requiere un contador persistente (Redis con reset
  mensual o middleware) y decidir qué cuenta como "llamada API".
- **Backend de Stripe (`StripeClient`, `UpgradeSubscriptionView`, webhook) queda como código muerto
  intacto** tras consolidar el Hub en el flujo Yape (punto 4) — evaluar si se retoma a futuro o se
  limpia del todo.
- **`ClientSubscriptionSerializer.get_mrr` usa un `PLAN_MRR_MAP` hardcodeado**, no
  `Plan.price_monthly` real — si se edita el precio de un plan desde "Gestión de Planes" (punto 3),
  el MRR mostrado en el Admin "Clientes" no lo refleja.
- **El flujo Yape no soporta facturación anual** — la página Suscripción tiene un toggle
  Mensual/Anual, pero `YapeUpgradeStep`/`useYapeUpgrade` solo manejan el precio mensual (nunca lo
  soportaron, tampoco antes de la consolidación del punto 4).
