# Límites centralizados de archivos e imágenes por plan

**Fecha:** 2026-07-22
**Apps:** `apps/backend_django` · `apps/frontend_admin` · `apps/frontend_workspace` · `apps/frontend_sidebar_desktop` · `apps/frontend_next_vista` (analizado, descartado — sin cambios)
**Origen:** revisando el chat del Workspace, el usuario preguntó si la subida de archivos/imágenes
tenía restricciones (tipo, peso). La respuesta era **no** en la mayoría de los casos, lo que destapó
un problema general de seguridad en las subidas y motivó construir un sistema central de límites,
configurable por plan desde el Admin.
**PRD:** [`prd/features/limites-archivos-por-plan.md`](../prd/features/limites-archivos-por-plan.md)
**Estado:** Fases 1-5 implementadas y verificadas (incl. prueba en vivo con usuario cliente real).
Fase 6 (Vista) descartada por decisión de alcance. Mejora posterior: CTA de upgrade en los mensajes
de límite (ver última sección). **Aún sin commitear** al cierre del reporte.

## Resumen

El usuario pidió un sistema donde: (a) exista una lógica central en el backend que controle
restricciones y pesos de subida; (b) el peso máximo sea configurable **por plan** (Free/Starter/
Professional/Enterprise) desde `frontend_admin`; y (c) el efecto se refleje en Workspace, Vista y
Desktop.

Se ejecutó en 5 fases (más una sexta descartada), cada una planificada y verificada antes de la
siguiente:

1. **Núcleo backend** — `utils/uploads.py`: validador único (whitelist de extensiones + detección de
   tipo real por magic bytes/Pillow + tope duro por categoría + tope por plan) y 2 claves nuevas
   (`max_image_upload_mb`, `max_file_upload_mb`) en `PLAN_FEATURES`.
2. **Migrar los 7 puntos de subida** del backend al validador (4 no validaban tipo en absoluto).
3. **Exponer por API** — el Admin puede escribir las claves (`PlanLimitsSerializer`) y los clientes
   leerlas (`FeaturesView` → `GET /api/v1/features/`).
4. **Admin Panel** — 2 campos nuevos en el modal "Editar plan" de Gestión de Planes.
5. **Workspace + Desktop** — el chat lee el límite del plan desde el endpoint + atributo `accept`.
6. ~~**Vista**~~ — **descartada**: Vista no sube archivos, y su gating de feature-flags no es
   editable desde el Admin (ver última sección).

La auditoría inicial encontró que **4 de los 7 puntos de subida no validaban el tipo de archivo en
absoluto**, incluidos logo/favicon del tenant y los 2 comprobantes de pago Yape — se podía guardar un
`.exe` renombrado como logo o como comprobante. También quedó documentada deuda técnica nueva (10
tests preexistentes en rojo, un 500 en `OrganizationView`, y `/media/` servido sin autenticación) y
una lección ([LL-104](../.claude/skills/lessons-learned/references/knowledge-base.md)).

---

## Diagnóstico inicial (estado antes del trabajo)

Auditoría de los 7 puntos de subida del backend:

| # | Punto de subida | Validaba tipo | Validaba tamaño | Cuenta a storage |
|---|---|---|---|---|
| 1 | Adjunto de chat (`apps/chat/views.py`) | ❌ | ✅ 10 MB hardcoded | ✅ |
| 2 | Logo/favicon del tenant (`apps/tenants/admin_views.py`) | ❌ | ❌ | ✅ |
| 3 | Comprobante Yape upgrade (`apps/subscriptions/yape_upgrade_views.py`) | ❌ | ❌ | ✅ |
| 4 | Comprobante Yape registro (`apps/auth_app/views.py`) | ❌ | ❌ | ✅ |
| 5 | Imagen de catálogo (`apps/catalog/serializers.py`) | ✅ `ImageField` | ✅ 2 MB | n/a |
| 6 | Imagen de anuncio (`apps/announcements/serializers.py`) | ✅ `ImageField` | ✅ 2 MB | n/a |
| 7 | Release desktop (`apps/releases/serializers.py`) | ✅ whitelist ext | ✅ 500 MB | n/a |

Hallazgos clave:
- **Los casos 2, 3 y 4 asignaban el archivo directo al modelo** (`tenant.logo = request.FILES[...]`,
  `YapePaymentProof.objects.create(screenshot=...)`) sin pasar por un serializer, de modo que ni la
  validación de Pillow del `ImageField` corría. Se podía subir un `.exe` como logo del tenant.
- El `kind` del adjunto de chat se derivaba del `content_type` del cliente (`chat/views.py`), que es
  un header **falsificable**.
- El límite de peso estaba **duplicado a mano en 6 sitios del frontend**, sin relación con el plan.
- Ningún input de archivo del chat tenía `accept`.

La infraestructura de límites por plan **ya existía** (`PLAN_FEATURES` → `Plan.limits` editable →
`get_effective_plan_limits()` con cache invalidada en `Plan.save()` → `check_plan_limit`/
`check_storage_limit` + `FeaturesView`); solo faltaba enchufarle los archivos.

---

## Fase 1 — Núcleo backend

**Nuevo:** `apps/backend_django/utils/uploads.py`.

- Catálogo de 5 **categorías** como `dataclass(frozen=True)` (extensiones permitidas, clave de plan o
  tope fijo, `hard_max_mb`, `counts_toward_storage`):

  | Categoría | Tipos | Tope | Suma a storage |
  |---|---|---|---|
  | `chat_attachment` | png/jpg/jpeg/webp/gif/pdf/txt/csv/zip/docx/xlsx | `max_file_upload_mb`, hard 100 | ✅ |
  | `tenant_branding` | png/jpg/jpeg/webp/ico | `max_image_upload_mb`, hard 10 | ✅ |
  | `payment_proof` | png/jpg/jpeg/webp | 10 fijo, hard 10 | ❌ (ver Fase 2) |
  | `platform_image` | png/jpg/jpeg/webp | 2 fijo, hard 5 | ❌ |
  | `desktop_release` | exe/msi/dmg | 500 fijo, hard 500 | ❌ |

- `validate_upload(file, *, category, tenant=None)`: valida en orden extensión (la **última**, para
  que `factura.png.exe` resuelva a `.exe`), tipo real por contenido (Pillow `verify()` para imágenes,
  magic bytes para pdf/zip/ooxml/ejecutables, UTF-8 para texto), tope de tamaño y cuota. Rebobina el
  puntero (`seek(0)`). Lanza `ValidationError` (400) por tipo/tope duro, `PlanLimitExceeded` (402)
  por plan.
- **Principios de diseño:** el **peso** es palanca comercial (editable por plan); los **tipos** son
  política de seguridad (en código, no editables); el `HARD_MAX` por categoría acota siempre al plan
  (para que un override del Admin no llene el disco — `DATA_UPLOAD_MAX_MEMORY_SIZE` = 600 MB).
  **SVG excluido** de todas las categorías (XML con JS ejecutable, servido desde `/media/` público).
- Sin dependencias nuevas: Pillow ya estaba en `requirements/base.txt`.

**Claves nuevas en `PLAN_FEATURES`** (`utils/plans.py`):

| Clave | Free | Starter | Professional | Enterprise |
|---|---|---|---|---|
| `max_image_upload_mb` | 2 | 5 | 10 | 25 |
| `max_file_upload_mb` | 5 | 10 | 25 | 100 |

**Decisiones tomadas:** `tenant` obligatorio si la categoría se gatea por plan (lanza `ValueError` en
vez de saltarse el tope en silencio); Enterprise en el tope duro devuelve 400, no 402 (no invitar a
un upgrade inexistente). **Free baja de 10 a 5 MB** en chat (Starter mantiene 10, nadie que pague
pierde).

**Tests:** `core/tests/test_uploads.py`, 28 casos (extensión, doble extensión, contenido falsificado,
SVG rechazado en las 5 categorías, límite por plan, override del Admin, puntero rebobinado, cuota).

---

## Fase 2 — Migrar los 7 puntos de subida

Cada call site pasó a una única llamada `validate_upload(...)`:

- **Chat** (`apps/chat/views.py`): además, `kind` ahora se deriva del **tipo real** vía helper nuevo
  `is_image()`, no del `content_type` del cliente.
- **Logo/favicon** (`apps/tenants/admin_views.py`) y **comprobantes Yape**
  (`apps/subscriptions/yape_upgrade_views.py`, `apps/auth_app/views.py`): de no validar nada a validar
  tipo, contenido y tamaño.
- **Catálogo/anuncios** (serializers): se conservó el `ImageField`, `validate_upload` le añade
  whitelist y tamaño unificado.
- **Releases** (`apps/releases/serializers.py`): las constantes `ALLOWED_EXTENSIONS`/
  `MAX_FILE_SIZE_BYTES` se borraron de `models.py` (ya viven en el catálogo).

**Decisión:** `payment_proof` pasó a `counts_toward_storage=False` — un tenant Free con la cuota
llena (o con un screenshot de móvil de 3-8 MB, mayor que su tope de imagen de 2 MB) no debe quedar
bloqueado justo al intentar **pagar su upgrade**. El comprobante sigue sumando al total en
`utils/storage.py`; lo que no hace es impedir su propia subida.

**Defecto encontrado al probar contra el servidor vivo (no lo detectaban los tests):** con
`ValidationError({'file': 'texto'})` (string suelto), el mensaje llegaba al cliente como un genérico
`"Validation error"`. Causa: `core/exceptions.py::_get_message` solo extrae el texto de valores
**lista** (la forma de los errores de campo de DRF). Fix: pasar todos los detalles como lista
(`{'file': ['...']}`). Registrado como **[LL-104](../.claude/skills/lessons-learned/references/knowledge-base.md)**.

**Tests:** ajustados 4 archivos que usaban bytes PNG falsos (ahora rechazados con razón) → helper
compartido `core/tests/helpers.py::png_bytes()`. Nuevos tests de rechazo por tipo en logo/favicon.
Parches de `check_storage_limit` redirigidos a `apps.rbac.permissions` (el módulo de origen, ya que
`validate_upload` lo importa dentro de la función).

---

## Fase 3 — Exponer por API

Dos whitelists escritas campo por campo descartaban las claves nuevas en silencio:

- `apps/subscriptions/serializers.py::PlanLimitsSerializer` (**escritura** del Admin) — +2 campos.
- `apps/rbac/views.py::FeaturesView` dict `limits` (**lectura** de los clientes) — +2 claves,
  quitando el prefijo `max_` por convención (`image_upload_mb`, `file_upload_mb`).

**Tests:** persistencia del override (`test_plans_admin.py`), exposición en `/features/`
(`test_permissions.py`), y **ciclo completo** (PATCH del Admin → `/features/` refleja el valor).
Verificado en vivo por `curl`: PATCH enterprise `file_upload_mb=7` → endpoint devolvió 7 → restaurado.

---

## Fase 4 — Admin Panel (Gestión de Planes)

`apps/frontend_admin/src/features/plans/`: el bloque "Límites del plan" del `PlanEditModal` es
genérico (se alimenta del array `LIMIT_FIELDS`), así que bastó:

- `types.ts` — 2 claves en `PlanLimits` (requeridas: el API siempre las devuelve).
- `PlanEditModal.tsx` — 2 claves en el schema zod + 2 entradas en `LIMIT_FIELDS` ("Peso máx. imagen
  (MB)", "Peso máx. archivo (MB)").
- `PlansPage.test.tsx` — mocks + test que abre el modal y verifica los labels.

**Sin pestaña nueva:** el peso es un atributo del plan, junto a `storage_gb`, en el mismo
`Plan.limits`.

**Verificado en navegador (Chrome DevTools):** el modal muestra las 2 filas precargadas con los
defaults reales; se editó `file_upload_mb` a 8, se guardó, `Plan.limits` persistió las 7 claves
completas y `/features/` reflejó 8; restaurado a `{}`.

---

## Fase 5 — Workspace + Desktop

**Workspace** (usa TanStack Query):
- `useFeatureGate.ts` — 2 claves en el tipo `limits`.
- `ChatPage.tsx` — pasa `maxFileMb={getLimit('file_upload_mb')}` al composer.
- `MessageComposer.tsx` — prop `maxFileMb`, chequeo dinámico (`El archivo supera los ${N} MB`),
  fallback `DEFAULT_MAX_MB=10`, y `accept` con los tipos de `chat_attachment`.

**Desktop** (sin TanStack Query, usa `apiFetch`):
- **Nuevo** `src/features/plan/useUploadLimits.ts` — hook que consume `/api/v1/features/` con caché a
  nivel de módulo (una llamada por sesión), al patrón del hook de anuncios.
- `ChatPanel.tsx` + `MessageComposer.tsx` (código gemelo del Workspace) — misma prop + `accept`.

**Excluido:** `ImportModal.tsx` (Workspace) — su tope de 5 MB guarda el parseo client-side de
CSV/vcf, no es un `chat_attachment`; coincidir en 5 MB con Free es casualidad. (Corrigió el plan
original del PRD.)

**Nota de arquitectura:** el chequeo del cliente es aproximado (staleTime 5 min / caché por sesión);
el backend es siempre la autoridad y rechaza igual.

**Tests:** `MessageComposer.test.tsx` (Workspace) parametrizado — rechazo a 5 MB con mensaje
dinámico, acepta 10 MB con límite 25, fallback 10 MB, `accept` presente. Desktop sin infra de tests
(app Tauri): solo typecheck.

### Prueba en vivo (usuario cliente real, Chrome DevTools)

Con `cliente108@cliente.com` (tenant `empresa108`, Professional):

1. Login en el Hub (`hub.local.test`) → SSO → Workspace (`workspace.local.test`). ✅
2. Bajé temporalmente `professional.max_file_upload_mb` a 1 (vía shell).
3. En el chat: input con `accept` correcto ✅; archivo de 2 MB → **"El archivo supera los 1 MB"**, no
   se adjunta ✅; archivo de 0.5 MB → se adjunta sin error ✅.
4. Restauré `professional.limits = {}` (default 25 MB). ✅

El mensaje mostró "1 MB" (el valor editado, leído del endpoint), confirmando el cableado
`endpoint → useFeatureGate → ChatPage → MessageComposer` con datos reales. No se envió ningún mensaje
(solo se adjuntó), la conversación quedó intacta.

---

## Fase 6 (Vista) — descartada

Al llegar a implementarla se verificó que la premisa no se sostiene:

- **Vista no tiene subidas de archivos** — guarda `avatar_url`/`cover_image_url`/`gallery_images`
  como URLs (`apps/digital_services/models.py`). Los límites de esta feature no tienen nada que
  gatear en Vista.
- **El Admin no edita feature flags**, solo límites numéricos → migrar el gating de Vista al endpoint
  no volvería nada editable.
- **Desajuste de granularidad:** Vista gatea con ~26 claves finas (`landingTemplates`, `cvTemplates`,
  `maxProjects`…); el endpoint expone ~7 flags gruesos. Servir las 26 exigiría ampliar el backend.
- `currentPlan` de Vista **ya** viene del backend (`user.tenant_plan` → `authStore`).

El refactor de `FEATURES_BY_PLAN` (DRY con el backend) quedó como **deuda técnica opcional**.

---

## Mejora posterior — CTA de upgrade en el mensaje de límite (2026-07-23)

A pedido del usuario (viendo el mensaje con un tenant `free`): cuando un cliente supera el tope de
subida de su plan, el mensaje ahora **invita a mejorar el plan**, alineado entre backend y frontend.

- **Texto único** en los 3 puntos: `El archivo supera el límite de {N} MB de tu plan. Cambia a un
  plan superior para aumentar la capacidad.` (y el genérico `El archivo supera el límite de {N} MB.`
  cuando no hay upgrade posible).
- **Guard de Enterprise:** el CTA no se muestra a quien ya está en el plan más alto (sería un callejón
  sin salida). En backend ya estaba resuelto (`from_plan` en `_resolve_max_bytes` → Enterprise en el
  tope cae al 400 genérico, no al 402 con upgrade). En frontend se replica con una prop `canUpgrade`
  (`plan !== 'enterprise'`; con el plan aún cargando → sin CTA).
- **Alcance:** solo los mensajes gateados por plan (chat de Workspace y Desktop + 402 del backend).
  Excluidos `ImportModal` (parseo CSV, no depende del plan) y las subidas del Admin (staff).
- **Archivos:** `utils/uploads.py` (mensaje 402); Workspace `MessageComposer.tsx` + `ChatPage.tsx`
  (pasa `canUpgrade` desde `useFeatureGate().plan`); Desktop `MessageComposer.tsx` + `ChatPanel.tsx`
  (lee `authStore.tenant.plan`).
- **Verificado:** backend `test_uploads.py` (29 tests, aserción actualizada); Workspace
  `MessageComposer.test.tsx` (8 tests, incl. caso con CTA y caso Enterprise sin CTA); Desktop
  `tsc` limpio; y **en vivo** con `cliente108@cliente.com` (bajando professional a 1 MB) → mensaje
  con CTA confirmado en el navegador, plan restaurado.

---

## Verificación global

| Comprobación | Resultado |
|---|---|
| Backend `pytest` completo | 930 passed / 10 failed (los 10 preexistentes, ajenos a la feature) |
| Backend `ruff` / `mypy` (archivos tocados) | Limpio |
| `frontend_admin` test/typecheck/lint | Plans verde; typecheck limpio |
| `frontend_workspace` test/typecheck/lint | Chat verde (7 tests); typecheck/lint limpio |
| `frontend_sidebar_desktop` typecheck | Limpio (sin infra de tests) |
| Ciclo Admin→API (`curl`) | ✅ (Fase 3) |
| Admin edita límite (navegador) | ✅ (Fase 4) |
| Chat respeta límite del plan (navegador, cliente real) | ✅ (Fase 5) |

Método para descartar regresiones: se confirmó que los 10 fallos del backend son **preexistentes**
restaurando `utils/plans.py` a HEAD y reproduciéndolos idénticos; el conteo de `passed` subió de 922
(baseline) a 930 por los tests nuevos.

---

## Archivos tocados

**`apps/backend_django`** (repo propio):
- Nuevos: `utils/uploads.py`, `core/tests/test_uploads.py`, `core/tests/helpers.py`
- Modificados: `utils/plans.py`, `apps/chat/views.py`, `apps/tenants/admin_views.py`,
  `apps/subscriptions/yape_upgrade_views.py`, `apps/auth_app/views.py`,
  `apps/catalog/serializers.py`, `apps/announcements/serializers.py`,
  `apps/releases/serializers.py`, `apps/releases/models.py`, `apps/rbac/views.py`,
  `apps/subscriptions/serializers.py`, y tests de chat/tenants/subscriptions/promotions/rbac.

**`apps/frontend_admin`**: `features/plans/{types.ts, components/PlanEditModal.tsx,
__tests__/PlansPage.test.tsx}`.

**`apps/frontend_workspace`**: `hooks/useFeatureGate.ts`, `features/chat/ChatPage.tsx`,
`features/chat/components/MessageComposer.tsx`, `features/chat/__tests__/MessageComposer.test.tsx`.

**`apps/frontend_sidebar_desktop`**: nuevo `features/plan/useUploadLimits.ts`;
`components/panels/ChatPanel.tsx`, `features/chat/components/MessageComposer.tsx`.

**Repo raíz (docs):** `prd/features/limites-archivos-por-plan.md` (nuevo), `prd/README.md`,
`BACKLOG.md`, `.claude/skills/lessons-learned/references/knowledge-base.md` (LL-104).

> Nota: las apps bajo `apps/` tienen cada una su propio git y están gitignoradas por el repo raíz.
> Al cierre de este reporte **nada está commiteado**.

---

## Deuda técnica y lecciones que salieron del trabajo

Registradas en `BACKLOG.md` § Deuda técnica:

1. **10 tests del backend en rojo, preexistentes** — throttles (5, rates de test vs producción +
   falta `@override_settings` de cache), support (2, coincide con
   [LL-061](../.claude/skills/lessons-learned/references/knowledge-base.md), permisos no sembrados) y
   chat_assistant (3, 400 donde se espera 404/429, sin diagnóstico). Normalizan la suite en rojo y
   ocultan fallos nuevos.
2. **`OrganizationView` da 500 sin header `X-Tenant-Slug`** — el middleware resuelve el tenant solo
   del header; corresponde un 400 explícito como en `yape_upgrade_views.py`.
3. **`/media/` servido sin autenticación ni aislamiento por tenant** (`config/urls.py`) — riesgo de
   XSS almacenado/fuga; esta feature lo **mitiga** (prohíbe tipos ejecutables en navegador) pero no
   lo cierra. Fix real requiere Traefik/nginx + URLs del serializer.
4. **Vista duplica `FEATURES_BY_PLAN`** — refactor DRY opcional (ver Fase 6).

Lección nueva: **[LL-104](../.claude/skills/lessons-learned/references/knowledge-base.md)** —
`ValidationError({'campo': 'texto'})` con string suelto llega al cliente como genérico "Validation
error"; pasar el detalle como lista. Corolario: una validación no está verificada hasta ver la
**respuesta HTTP real** (curl/navegador), no solo la excepción en un test.
