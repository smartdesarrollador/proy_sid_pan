# Feature: Límites Centralizados de Archivos e Imágenes por Plan

**Versión:** 1.0.0
**Fecha:** 2026-07-22
**Estado:** Draft
**Owner:** Product Team
**Backend:** `apps/backend_django/utils/uploads.py` (nuevo) + `utils/plans.py`
**Frontends afectados:** `frontend_admin` (gestión) · `frontend_workspace` · `frontend_sidebar_desktop` · `frontend_next_vista`

[⬅️ Volver al README](../README.md)

---

## Índice
- [Product Overview](#product-overview)
- [Estado actual (verificado en el código)](#estado-actual-verificado-en-el-código)
- [Problema que Resuelve](#problema-que-resuelve)
- [Alcance](#alcance)
- [Modelo de Límites](#modelo-de-límites)
- [API Central del Validador](#api-central-del-validador)
- [Propagación al Frontend](#propagación-al-frontend)
- [UX](#ux)
- [Seguridad](#seguridad)
- [Plan de Implementación](#plan-de-implementación)
- [Métricas de Éxito](#métricas-de-éxito)
- [Riesgos](#riesgos)
- [Fuera de Alcance](#fuera-de-alcance)

---

## Product Overview

Establecer **una única fuente de verdad en el backend** que defina qué archivos se pueden subir a la
plataforma y cuánto pueden pesar, con el peso configurable **por plan** (`free` / `starter` /
`professional` / `enterprise`) desde el Admin Panel, y que ese cambio se propague automáticamente a
los clientes que suben archivos (Workspace, Desktop) sin tocar código ni redesplegar. (Vista no sube
archivos, ver "Nota sobre Vista".)

**Este PRD no inventa el mecanismo de límites por plan: lo extiende.** La tubería ya existe y está
en producción para `storage_gb`, `max_users`, `max_projects`, etc.:

```
PLAN_FEATURES (defaults en código)          utils/plans.py
        ↓ merge
Plan.limits (JSONField editable en BD)      apps/subscriptions/models.py:241
        ↓ get_effective_plan_limits()       utils/plans.py — cache 5 min (PLAN_LIMITS_CACHE_TTL),
        ↓                                   invalidada en Plan.save() → models.py:247-250
   ┌────┴─────────────────────────┐
   │                              │
check_plan_limit /           GET /api/v1/features/    apps/rbac/views.py:35
check_storage_limit               ↓
apps/rbac/permissions.py:219   useFeatureGate()       frontend_workspace/src/hooks/useFeatureGate.ts
```

El Admin ya edita `Plan.limits` desde `frontend_admin/src/features/plans/components/PlanEditModal.tsx`
(hoy expone 5 límites: usuarios, storage, proyectos, roles custom y llamadas API/mes). Un admin
guarda el plan → `Plan.save()` invalida la cache → el backend aplica el límite nuevo en la siguiente
request. **Ese ciclo ya funciona.** Lo que falta es enchufarle los archivos.

---

## Estado actual (verificado en el código)

Auditoría de los **7 puntos de subida** del backend (jul 2026):

| # | Punto de subida | Archivo | Valida tipo | Valida tamaño | Cuenta a `storage_gb` |
|---|---|---|---|---|---|
| 1 | Adjunto de chat | `apps/chat/views.py:363-391` | ❌ ninguno | ✅ 10 MB hardcoded (`:51`) | ✅ `check_storage_limit` |
| 2 | Logo / favicon del tenant | `apps/tenants/admin_views.py:78-91` | ❌ ninguno | ❌ ninguno | ✅ `check_storage_limit` |
| 3 | Comprobante Yape (upgrade) | `apps/subscriptions/yape_upgrade_views.py:78,107-109` | ❌ ninguno | ❌ ninguno | ✅ (vía `get_tenant_storage_bytes`) |
| 4 | Comprobante Yape (registro) | `apps/auth_app/views.py:616,648-650` | ❌ ninguno | ❌ ninguno | ✅ (ídem) |
| 5 | Imagen de catálogo | `apps/catalog/serializers.py:45,50-53` | ✅ `ImageField` | ✅ 2 MB | n/a (global de plataforma) |
| 6 | Imagen de anuncio | `apps/announcements/serializers.py:34,39-41` | ✅ `ImageField` | ✅ 2 MB | n/a (global de plataforma) |
| 7 | Release desktop | `apps/releases/models.py:20-21` + `serializers.py:40-43` | ✅ whitelist ext | ✅ 500 MB | n/a (global de plataforma) |

### Hallazgos críticos

**A. Los casos 2, 3 y 4 no ejecutan ninguna validación de imagen.** Aunque los modelos declaran
`ImageField` (`apps/tenants/models.py:33-34`, `apps/subscriptions/models.py:185`), el archivo se
asigna **directo al modelo** sin pasar por un serializer:

```python
# apps/tenants/admin_views.py:86-91
tenant.logo = request.FILES['logo']
...
tenant.save(update_fields=update_fields)          # no llama full_clean() → sin Pillow

# apps/subscriptions/yape_upgrade_views.py:107-109  y  apps/auth_app/views.py:648-650
YapePaymentProof.objects.create(screenshot=screenshot, ...)   # sin serializer → sin Pillow
```

La validación de Pillow del `ImageField` solo corre vía `full_clean()` o vía un serializer DRF con
`serializers.ImageField`. Aquí no ocurre ninguna de las dos. **Hoy se puede guardar un `.exe` como
logo del tenant o como comprobante de pago Yape.**

**B. El `kind` del adjunto de chat se deriva de un header falsificable:**

```python
# apps/chat/views.py:388
kind = 'image' if (upload.content_type or '').startswith('image/') else 'file'
```

`upload.content_type` viene del header `Content-Type` del multipart, que **envía el cliente**. Un
ejecutable renombrado con `Content-Type: image/png` se guarda con `kind='image'` y
`MessageBubble.tsx:70-73` lo intenta renderizar como `<img>`.

**C. El límite de peso está duplicado a mano en 6 sitios del frontend**, sin ninguna relación con el
plan del tenant:

| Archivo | Valor |
|---|---|
| `frontend_workspace/src/features/chat/components/MessageComposer.tsx:5` | 10 MB |
| `frontend_sidebar_desktop/src/features/chat/components/MessageComposer.tsx:5` | 10 MB (código duplicado del Workspace) |
| `frontend_workspace/src/components/shared/ImportModal.tsx:31` | 5 MB |
| `frontend_admin/src/features/settings/tabs/OrganizationTab.tsx:12` | 2 MB |
| `frontend_admin/src/features/catalog/components/CatalogItemModal.tsx:103` | 2 MB |
| `frontend_admin/src/features/announcements/components/AnnouncementModal.tsx:99` | 2 MB |

**D. Ningún `<input type="file">` del chat declara `accept`** (`MessageComposer.tsx:86-93`), a
diferencia del resto del Workspace, que sí lo usa (`ProfileTab.tsx:72` → `image/*`,
`ContactsPage.tsx:206` → `.vcf,.csv`, `CalendarPage.tsx:155` → `.ics`).

---

## Problema que Resuelve

1. **Superficie de seguridad.** Cualquier tipo de archivo se acepta en 4 de los 7 puntos de subida, y
   `/media/` se sirve **sin autenticación y sin importar `DEBUG`** (`config/urls.py:118-120`). Un
   `.svg` o `.html` subido al chat queda accesible por URL desde el mismo dominio de la API → vector
   de XSS almacenado. Los comprobantes de pago —documento sensible— tampoco validan nada.

2. **Límites duplicados y desincronizados.** Seis constantes hardcodeadas en el frontend más dos en
   el backend, sin fuente común. Cambiar un límite hoy exige tocar código en 3 repos de frontend y
   redesplegar.

3. **El peso permitido no es palanca comercial.** Un tenant Free sube exactamente lo mismo que un
   Enterprise. El plan controla usuarios, proyectos y almacenamiento acumulado, pero no el tamaño
   por archivo — que es el límite que el usuario percibe en el momento de subir.

---

## Alcance

### Incluido (v1)

- Módulo central `utils/uploads.py` con el catálogo de categorías de subida y un único validador.
- 2 claves nuevas por plan (`max_image_upload_mb`, `max_file_upload_mb`) en `PLAN_FEATURES`.
- Migración de los 7 puntos de subida al validador central.
- Edición de las 2 claves desde el Admin Panel (`PlanEditModal`).
- Exposición vía `GET /api/v1/features/` y consumo dinámico en Workspace y Desktop.
- `accept` en los inputs de archivo del chat (Workspace y Desktop).

> **Nota:** la migración del gating de Vista, contemplada en un borrador inicial, se **descartó** al
> implementar (Vista no tiene subidas; ver "Plan de Implementación" y "Fuera de Alcance").

### Fuera de alcance

Ver [Fuera de Alcance](#fuera-de-alcance) al final.

---

## Modelo de Límites

### Claves nuevas en `PLAN_FEATURES` (`utils/plans.py`)

| Clave | Free | Starter | Professional | Enterprise |
|---|---|---|---|---|
| `max_image_upload_mb` | 2 | 5 | 10 | 25 |
| `max_file_upload_mb` | 5 | 10 | 25 | 100 |

Semántica idéntica al resto del módulo: **`None` = ilimitado** (acotado siempre por el `HARD_MAX` de
la categoría). Son límites **por archivo**, complementarios —no sustitutos— de `storage_gb`, que
sigue rigiendo el acumulado del tenant.

### Principio de separación (decisión de diseño central)

| Dimensión | Dónde vive | Editable desde el Admin |
|---|---|---|
| **Peso máximo por archivo** | `Plan.limits` (BD) sobre defaults de `PLAN_FEATURES` | ✅ Sí — es palanca comercial |
| **Tipos permitidos (ext + MIME)** | `utils/uploads.py`, en código | ❌ No — es política de seguridad |
| **Tope duro de infraestructura** | `HARD_MAX` por categoría en `utils/uploads.py` | ❌ No — acota siempre al plan |

**Por qué los tipos no son editables:** si un admin pudiera habilitar `.svg` o `.html` para un plan
desde un formulario, abriría XSS almacenado con dos clics, agravado por el `/media/` público. La
whitelist de tipos es una decisión de seguridad, no un atributo de producto.

**Por qué hace falta el `HARD_MAX`:** hoy `DATA_UPLOAD_MAX_MEMORY_SIZE = 600 MB`
(`config/settings/base.py:444-445`). Sin un tope duro, un admin que ponga Enterprise en 500 MB
llenaría el disco del VPS. El valor efectivo siempre es `min(límite_del_plan, HARD_MAX)`.

### Catálogo de categorías (`utils/uploads.py`)

| Categoría | Extensiones permitidas | Clave de plan | `HARD_MAX` | Puntos de subida |
|---|---|---|---|---|
| `chat_attachment` | png, jpg, jpeg, webp, gif, pdf, txt, csv, zip, docx, xlsx | `max_file_upload_mb` | 100 MB | Chat (Workspace + Desktop) |
| `tenant_branding` | png, jpg, jpeg, webp, ico | `max_image_upload_mb` | 10 MB | Logo y favicon del tenant |
| `payment_proof` | png, jpg, jpeg, webp | — (10 MB fijo, ver abajo) | 10 MB | Yape registro + Yape upgrade |
| `platform_image` | png, jpg, jpeg, webp | — (staff, 2 MB fijo) | 5 MB | Catálogo, anuncios |
| `desktop_release` | exe, msi, dmg | — (staff, 500 MB fijo) | 500 MB | Releases desktop |

**SVG queda excluido de todas las categorías**, incluida `tenant_branding`: un SVG es XML con
capacidad de ejecutar JavaScript, y se serviría desde `/media/` sin autenticación. Si en el futuro se
necesita logo vectorial, requiere sanitización previa (p. ej. `bleach`) y un ticket propio.

Las categorías `platform_image` y `desktop_release` son **globales de plataforma** (solo staff, no
cuentan al storage del tenant según `utils/storage.py`), por eso no dependen del plan: conservan sus
límites fijos actuales y se migran al validador central solo para unificar el manejo de tipos.

**`payment_proof` no se gatea por plan ni por cuota**, por una razón distinta y deliberada: con el
tope de imagen de Free en 2 MB, un screenshot de móvil (3-8 MB habituales) dejaría al tenant Free sin
poder subir el comprobante **justo en el momento de pagar su upgrade**; y con su cuota de
almacenamiento llena tampoco podría pagar el plan que le daría más espacio. Nunca se bloquea una
conversión a pago con los límites del plan que el cliente está intentando abandonar. Tope fijo de
10 MB para todos los planes, y sin comprobación de cuota — el comprobante **sí** sigue sumando al
total que calcula `utils/storage.py`, lo que no hace es impedir su propia subida.

---

## API Central del Validador

```python
# apps/backend_django/utils/uploads.py

def validate_upload(file, *, category: str, tenant=None) -> None:
    """
    Valida un archivo subido contra la política de su categoría.

    Comprueba en orden:
      1. Extensión contra la whitelist de la categoría.
      2. Tipo real por firma de bytes (magic bytes / Pillow.verify) — nunca el
         Content-Type del cliente, que es falsificable.
      3. Tope duro de la categoría (HARD_MAX).
      4. Tope del plan del tenant, si la categoría declara clave de plan.

    Raises:
        ValueError: categoría inexistente, o categoría gateada por plan sin `tenant`.
        ValidationError (400): extensión/MIME no permitido, o supera el tope duro.
        PlanLimitExceeded (402): supera el tope del plan del tenant.
    """
```

Dos detalles del contrato, ambos deliberados:

- **`tenant` es obligatorio** en las categorías con `plan_key`; olvidarlo lanza `ValueError` en vez
  de saltarse el tope del plan en silencio. Protege a los call sites de la Fase 2.
- Cuando el tope del plan **coincide** con el tope duro (Enterprise en `chat_attachment`), el rechazo
  se reporta como 400 y no como 402: invitar a un upgrade que no existe sería un callejón sin salida.

### Reutilización (no se duplica lógica existente)

| Necesidad | Función existente a reutilizar |
|---|---|
| Límite vigente del plan (override del Admin + defaults) | `get_effective_plan_limits()` — `utils/plans.py` |
| Cuota de almacenamiento acumulada del tenant | `check_storage_limit()` — `apps/rbac/permissions.py:219` |
| Bytes ya consumidos por el tenant | `get_tenant_storage_bytes()` — `utils/storage.py` |
| Excepción HTTP 402 | `PlanLimitExceeded` — `apps/rbac/permissions.py` |

`validate_upload()` **compone** estas piezas: los call sites que hoy llaman a `check_storage_limit()`
por separado pasan a hacer **una sola llamada**.

### Detección de tipo real

Sin dependencias nuevas ni cambios en el Dockerfile:

- **Imágenes**: `Pillow` (ya presente — `requirements/base.txt:41`, `Pillow==10.2.0`) con
  `Image.open(file).verify()`, que falla si el contenido no es una imagen decodificable.
- **No-imágenes** (pdf, zip, docx, csv, txt): tabla propia de **magic bytes** (~20 líneas):
  `%PDF-` para PDF, `PK\x03\x04` para zip/docx/xlsx, etc.
- Tras leer la firma, **rebobinar el puntero** (`file.seek(0)`) para no corromper el guardado.

### Ejemplo de migración (chat)

```python
# apps/chat/views.py — ANTES (líneas 366-369)
if upload and upload.size > _MAX_ATTACHMENT_BYTES:
    raise ValidationError({'file': 'El archivo supera el límite de 10 MB.'})
if upload:
    check_storage_limit(request.tenant, upload.size)

# DESPUÉS
if upload:
    validate_upload(upload, category='chat_attachment', tenant=request.tenant)
```

El `kind` del adjunto pasa a derivarse del **tipo real detectado** por el validador, no del
`content_type` del cliente (elimina el problema del hallazgo B).

---

## Propagación al Frontend

### Dos whitelists explícitas que hay que ampliar

Ambas están escritas campo por campo; si no se declaran las claves nuevas, **se descartan en
silencio**:

1. `PlanLimitsSerializer` — `apps/subscriptions/serializers.py:122-128`. Sin declarar el campo, el
   Admin lo envía y se pierde al guardar.
2. El dict `limits` de `FeaturesView` — `apps/rbac/views.py:73-79`. Se arma a mano clave por clave.

Respuesta resultante de `GET /api/v1/features/`:

```json
{
  "plan": "professional",
  "features": { "...": true },
  "limits": {
    "users": 25,
    "projects": null,
    "storage_gb": 20,
    "api_calls_per_month": 100000,
    "vault_items": null,
    "image_upload_mb": 10,
    "file_upload_mb": 25
  }
}
```

### Cambios por app

| App | Cambio |
|---|---|
| `frontend_admin` | 2 entradas en `LIMIT_FIELDS` + schema zod de `PlanEditModal.tsx:10-42`. El resto del form es genérico y no requiere cambios |
| `frontend_workspace` | `MessageComposer.tsx:5` (chat) pasa a `useFeatureGate().getLimit('file_upload_mb')`; `accept` en el input. **`ImportModal.tsx` NO** — su tope de 5 MB guarda el parseo de CSV/vcf, no es un `chat_attachment` |
| `frontend_sidebar_desktop` | `MessageComposer.tsx:5` (código gemelo) + hook nuevo `useUploadLimits` (el Desktop no usa TanStack Query) |
| ~~`frontend_next_vista`~~ | **Descartado** — Vista no tiene subidas (ver abajo) |

### Nota sobre Vista (por qué queda fuera)

Vista **no tiene ningún punto de subida de archivos**: guarda `avatar_url`, `og_image_url`,
`cover_image_url` y `gallery_images` como **URLs externas**
(`apps/digital_services/models.py:38,42,238-239`). Los límites de esta feature
(`image_upload_mb`/`file_upload_mb`) no tienen nada que gatear en Vista.

Un borrador inicial contemplaba, de paso, migrar su gating de feature flags
(`src/data/featureGates.ts`) al endpoint. Se descartó al implementar, por tres razones:
- El **Admin no edita feature flags** (solo límites numéricos), así que consumir el endpoint no
  volvería nada editable desde el Admin.
- **Desajuste de granularidad**: Vista gatea con ~26 claves finas; el endpoint expone ~7 flags
  gruesos. Servir las 26 exigiría ampliar el backend, fuera del alcance de esta feature.
- `currentPlan` de Vista **ya** proviene del backend (`user.tenant_plan` → `authStore`).

El refactor de `FEATURES_BY_PLAN` (DRY con el backend) queda como deuda técnica opcional en
`BACKLOG.md`.

### Latencia de propagación

| Capa | TTL |
|---|---|
| `get_effective_plan_limits()` | 5 min, pero **invalidada inmediatamente** en `Plan.save()` (`subscriptions/models.py:247-250`) → el backend aplica el cambio en la siguiente request |
| `useFeatureGate()` (TanStack Query) | `staleTime` 5 min → el frontend puede mostrar el valor viejo hasta 5 min |

El backend es siempre la autoridad: aunque el cliente permita elegir un archivo con el límite viejo,
el servidor lo rechaza. Aceptable para v1.

---

## UX

### Mensajes de error

Devueltos por el backend y mostrados tal cual por el cliente (no se re-escriben en cada frontend):

| Caso | HTTP | Mensaje |
|---|---|---|
| Tipo no permitido | 400 | `El tipo de archivo .exe no está permitido. Formatos aceptados: PNG, JPG, WEBP, PDF, ZIP.` |
| Supera el tope del plan | 402 | `El archivo supera el límite de 5 MB de tu plan Starter. Actualiza tu plan para subir archivos más grandes.` |
| Supera el tope duro | 400 | `El archivo supera el límite de 100 MB.` |
| Supera la cuota acumulada | 402 | (mensaje actual de `check_storage_limit`) |

El 402 por límite de plan es una **oportunidad de upgrade**: el cliente incluye un CTA hacia el Hub,
consistente con el patrón de `UpgradePrompt` ya presente en Vista y Workspace.

### Selector de archivos

Los inputs derivan su `accept` de la categoría, de modo que el diálogo del SO ya filtra los tipos
válidos y el error de tipo se vuelve un caso de borde (arrastrar y soltar, o cliente manipulado).

---

## Seguridad

- **Nunca confiar en el `content_type` del cliente.** Es un header del multipart, controlado por el
  atacante. La detección se hace por firma de bytes del contenido real.
- **Doble validación con el servidor como autoridad.** El frontend valida para dar feedback
  inmediato; el backend valida siempre, porque el cliente es manipulable.
- **Whitelist, nunca blacklist.** Se enumera lo permitido; todo lo demás se rechaza.
- **SVG y HTML prohibidos en toda categoría** (ver justificación en el Modelo de Límites).
- **El nombre original nunca se usa como ruta.** Ya se cumple: `upload_to` genera la ruta y
  `original_name` se guarda como metadato truncado a 255 (`chat/views.py:391`).
- **No loguear contenido de archivos** — regla de `.claude/rules/security.md`.

### Riesgo abierto (fuera de este PRD)

`/media/` se sirve con `django.views.static.serve` **sin autenticación y sin importar `DEBUG`**
(`config/urls.py:118-120`). Cualquiera con la URL accede al archivo, sin sesión ni aislamiento por
tenant, y la URL se filtra en el JSON del mensaje (`chat/serializers.py:38-47`). Los nombres son poco
adivinables por el `upload_to`, lo que reduce pero no elimina el riesgo. Este PRD **mitiga** el vector
(prohibiendo los tipos ejecutables en el navegador) pero **no lo cierra**. El fix —servir adjuntos
tras autenticación y validar pertenencia al tenant— requiere tocar Traefik/nginx y las URLs del
serializer, y va en su propio ticket. Registrado en `BACKLOG.md` → Deuda técnica.

---

## Plan de Implementación

| Fase | Alcance | Entregable |
|---|---|---|
| **1. Núcleo backend** | `utils/uploads.py` (catálogo + `validate_upload`) y las 2 claves nuevas en los 4 planes de `PLAN_FEATURES` | Tests unitarios del validador: extensión inválida, MIME falsificado, tope duro, tope de plan por cada plan, `seek(0)` tras leer la firma |
| **2. Migrar call sites** | Los 7 puntos de subida. Orden: chat → branding y comprobantes (hoy sin validación alguna) → catálogo/anuncios/releases | Tests de integración por endpoint; `apps/chat/tests/test_attachments.py` ampliado |
| **3. Exponer por API** | `PlanLimitsSerializer` + dict `limits` de `FeaturesView` | Test de que un override de `Plan.limits` viaja hasta `/api/v1/features/` |
| **4. Admin Panel** | `LIMIT_FIELDS` + schema zod de `PlanEditModal` | Test de que el form guarda y recarga las claves nuevas |
| **5. Workspace + Desktop** | Consumo dinámico vía `useFeatureGate()` + `accept` en los inputs | Tests de `MessageComposer` con distintos límites de plan |
| ~~**6. Vista**~~ | **Descartada** — ver abajo | — |

**Actualización (Fase 5 cerrada): la Fase 6 se descarta.** Al llegar a la implementación se
verificó que la premisa de migrar el gating de Vista no se sostiene para esta feature:
- **Vista no tiene subidas de archivos** (guarda `avatar_url`/`gallery_images` como URLs), así que
  los límites `image_upload_mb`/`file_upload_mb` —el objeto de esta feature— no tienen nada que
  gatear en Vista.
- **El Admin no edita feature flags**, solo límites numéricos; migrar el gating de Vista al endpoint
  no volvería nada editable desde el Admin.
- **Desajuste de granularidad**: Vista gatea con ~26 claves finas (`landingTemplates`, `cvTemplates`,
  `maxProjects`…), el endpoint expone ~7 flags gruesos de servicios digitales. El backend no puede
  servir las 26 sin ampliarlo, lo que excede el alcance de esta feature.
- `currentPlan` de Vista **ya** proviene del backend (`user.tenant_plan` → `authStore`).

El refactor de la tabla `FEATURES_BY_PLAN` de Vista (eliminar la duplicación con el backend) queda
como **deuda técnica opcional**, registrada en `BACKLOG.md`, no como parte de esta feature.

**Dependencias:** 2 depende de 1; 4 depende de 3; 5 depende de 3. (La antigua Fase 6 se descartó.)

**Regla del repo aplicable** (`CLAUDE.md`): `make test` antes de cada commit; si el trabajo revela
una incidencia no trivial, registrarla en el skill `lessons-learned` (`LL-0XX`).

---

## Métricas de Éxito

- **0** puntos de subida sin validación de tipo (hoy: 4 de 7).
- **0** constantes de tamaño hardcodeadas en frontends para recursos gateados por plan (hoy: 6).
- Un cambio de límite desde el Admin se refleja en Workspace y Desktop **sin desplegar**.
- Tasa de rechazos 402 por límite de archivo → señal de demanda de upgrade, medible por plan.
- Tasa de rechazos 400 por tipo no permitido → detecta intentos de subida maliciosa y falsos
  positivos de formatos legítimos que falten en la whitelist.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Un admin sube el límite de un plan por encima de lo que aguanta el VPS | `HARD_MAX` por categoría acota siempre al valor del plan; `DATA_UPLOAD_MAX_MEMORY_SIZE` como tope final |
| La whitelist rechaza un formato legítimo que los clientes ya usaban | Antes de la fase 2, revisar los `original_name` existentes en `MessageAttachment` para detectar extensiones en uso real |
| Archivos ya subidos que hoy violarían la política nueva | La validación aplica solo a subidas nuevas; los existentes se conservan. Auditoría de lo ya almacenado = ticket aparte |
| Frontend con límite viejo cacheado 5 min tras un cambio del Admin | El backend rechaza igual; el error es claro y accionable. Invalidación proactiva de la query = mejora futura |
| Pillow abre imágenes maliciosas (decompression bomb) | `verify()` no decodifica el bitmap completo; fijar además `Image.MAX_IMAGE_PIXELS` |
| _(La migración de Vista se descartó — sin riesgo de regresión asociado.)_ | — |

---

## Fuera de Alcance

- **Servir `/media/` con autenticación** y aislamiento por tenant → ticket propio (ver Seguridad).
- **Escaneo antivirus** (ClamAV u otro) de los archivos subidos.
- **Subidas reales en Vista** (reemplazar `avatar_url` / `gallery_images` por archivos gestionados).
- **Migración a almacenamiento externo** (S3 u otro object storage).
- **Cuota por usuario** — la cuota sigue siendo por tenant vía `storage_gb`.
- **Compresión o redimensionado automático** de imágenes al subir.
- **Auditoría/limpieza de los archivos ya almacenados** que no cumplirían la política nueva.

---

[⬅️ Volver al README](../README.md) ·
[Billing & Subscriptions](billing.md) ·
[Hub - Portal del Cliente](hub-client-portal.md)
