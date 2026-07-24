# Feature: Almacenamiento Real por Tenant — Subidas Gestionadas en Vista

**Versión:** 1.0.0
**Fecha:** 2026-07-23
**Estado:** Draft
**Owner:** Product Team
**Backend:** `apps/backend_django/apps/digital_services/` + `utils/storage.py` + `utils/uploads.py`
**Frontends afectados:** `frontend_next_vista` (subidas) · `frontend_next_hub` (indicador de uso) · `frontend_admin` (sin cambios — ya edita `storage_gb`)

[⬅️ Volver al README](../README.md)

---

## Índice
- [Product Overview](#product-overview)
- [Estado actual (verificado en el código)](#estado-actual-verificado-en-el-código)
- [Problema que Resuelve](#problema-que-resuelve)
- [Decisión de diseño: broker de subidas vs. campos ImageField](#decisión-de-diseño-broker-de-subidas-vs-campos-imagefield)
- [Alcance](#alcance)
- [Modelo de datos](#modelo-de-datos)
- [API](#api)
- [Ciclo de vida y integridad de la cuota](#ciclo-de-vida-y-integridad-de-la-cuota)
- [Contabilización y rendimiento](#contabilización-y-rendimiento)
- [Frontend](#frontend)
- [Seguridad](#seguridad)
- [Plan de Implementación (fases)](#plan-de-implementación-fases)
- [Métricas de Éxito](#métricas-de-éxito)
- [Riesgos](#riesgos)
- [Fuera de Alcance](#fuera-de-alcance)

---

## Product Overview

Hacer que la cuota de almacenamiento del plan (`storage_gb`, editable desde el Admin — Free = 1 GB) **refleje de verdad lo que consume un tenant en Vista**. Hoy Vista guarda todas sus imágenes (avatar, portada de portafolio, galería, imagen OG, foto de CV) como **URLs externas** (`URLField`/`JSONField`), por lo que **no ocupan ni un byte de la cuota** y un tenant Free puede publicar una presencia web completa sin acercarse jamás al límite que promete el Admin y el Hub.

Esta feature introduce **subidas reales gestionadas** en Vista: el cliente sube el archivo, el backend lo valida (`validate_upload`), lo almacena, lo hace contar hacia `storage_gb` y **bloquea con 402** cuando la subida haría superar la cuota del tenant.

**Este PRD es el follow-up explícito** del ticket [Límites Centralizados de Archivos por Plan](limites-archivos-por-plan.md), que dejó "Subidas reales en Vista" fuera de alcance (ver su sección *Fuera de Alcance*, punto 3). La tubería de cuota ya existe y está en producción:

```
validate_upload(file, category=…, counts_toward_storage=True)      utils/uploads.py:266-269
        ↓
check_storage_limit(tenant, file.size)                             apps/rbac/permissions.py:219
        ↓  compara contra
get_tenant_storage_bytes(tenant)  ──►  storage_gb del plan          utils/storage.py:12
                                        (get_effective_plan_limits, override del Admin)
```

Lo único que le falta a Vista es **producir archivos reales** y **enchufarlos a `get_tenant_storage_bytes()`**.

---

## Estado actual (verificado en el código)

**1. `get_tenant_storage_bytes()` (`utils/storage.py:12-29`) solo suma 3 fuentes:**

| Fuente | Modelo | App origen |
|---|---|---|
| Adjuntos de chat | `MessageAttachment.size` | Chat (Hub/Admin) |
| Logo + favicon del tenant | `tenant.logo`, `tenant.favicon` | Branding (Admin) |
| Comprobantes de pago Yape | `YapePaymentProof.screenshot` | Billing (Hub) |

**Ninguna proviene de Vista ni de Workspace.**

**2. Todas las imágenes de Vista son referencias externas, no archivos gestionados:**

| Campo | Modelo | Tipo |
|---|---|---|
| `avatar_url` | `PublicProfile` (`digital_services/models.py:38`) | `URLField` |
| `og_image_url` | `PublicProfile` (`:42`) | `URLField` |
| `cover_image_url` | `PortfolioItem` (`:238`) | `URLField` |
| `gallery_images` | `PortfolioItem` (`:239`) | `JSONField` (lista de URLs) |
| foto de CV | render desde `avatar_url` del perfil | — |

No existe **ningún** `FileField`/`ImageField` en `digital_services`, ni ningún `request.FILES` en sus vistas (auditado jul 2026).

**3. La cuota ya se muestra al cliente, con el número incompleto de hoy:**
- Hub / detalle de tenant: `TenantDetailSerializer.get_usage()` → `storage.current_gb` / `limit_gb` (`apps/tenants/serializers.py:122-137`).
- Analytics: `storage_used_gb` (`apps/analytics/views.py:66`).

Ambos consumen `get_tenant_storage_bytes()`: **extenderla una sola vez corrige los dos indicadores a la vez.**

---

## Problema que Resuelve

1. **La promesa comercial no se cumple.** El Admin edita "Almacenamiento (GB)" por plan y el Hub muestra ese límite, pero para Vista el número es ficticio: el consumo real de imágenes vive en servidores externos y nunca se contabiliza. El límite no gatea lo que el usuario percibe como "mi almacenamiento".

2. **Dependencia de hosting externo frágil.** Las imágenes de Vista dependen de URLs de terceros (Imgur, Cloudinary, drives públicos…): enlaces que se rompen, sin control de tipo/peso, sin garantía de disponibilidad de las páginas públicas que son la cara del cliente.

3. **Sin palanca de upgrade.** Como Vista no consume cuota, nunca dispara el 402 que invita a subir de plan. Se pierde la señal comercial que sí tienen chat y branding.

---

## Decisión de diseño: broker de subidas vs. campos ImageField

Se evaluaron dos formas de que Vista suba archivos reales:

| Opción | Descripción | Veredicto |
|---|---|---|
| **A. Convertir cada `*_url` a `ImageField`** | Cambiar `avatar_url`, `og_image_url`, `cover_image_url` a `ImageField` y `gallery_images` a modelo hijo con `ImageField` | ❌ Invasivo: migraciones sobre ~5 campos en 3 modelos, multipart en cada endpoint de Vista, y **se pierde** la flexibilidad de pegar una URL externa (que algunos clientes querrán conservar) |
| **B. Broker de subidas (`DigitalAsset`)** ✅ | Un modelo único con `ImageField`. El cliente sube → recibe una URL interna servida desde `/media/` → esa URL se guarda en los campos `*_url`/`gallery_images` **que no cambian de tipo** | ✅ Mínimo cambio de esquema, reutiliza el patrón del chat (`MessageAttachment`), conserva el fallback de URL externa, un único punto de contabilización |

**Se adopta la opción B.** Es el patrón "media library": los campos de Vista siguen siendo URLs; la diferencia es que ahora pueden apuntar a un archivo **propio** (que cuenta a la cuota) o, si el cliente lo prefiere, a una URL externa (que no cuenta). El origen se distingue porque las URLs propias las emite el backend bajo `/media/digital_assets/…`.

---

## Alcance

### Incluido (v1)

- Modelo `DigitalAsset` (`ImageField` + `size` + dueño + `slot`) y su migración.
- Categoría de subida `digital_asset` en `UPLOAD_CATEGORIES` con `counts_toward_storage=True` y `plan_key='max_image_upload_mb'`.
- Endpoint de subida y de borrado de assets de Vista.
- Extensión de `get_tenant_storage_bytes()` para sumar `DigitalAsset` del tenant.
- **Bloqueo duro 402** cuando la subida superaría `storage_gb` (ya lo hace `validate_upload`; aquí solo se enchufa Vista).
- Gestión de ciclo de vida (reemplazo, borrado, huérfanos) para que la cuota liberada sea real.
- UI de subida en las 4 features de Vista (tarjeta, portafolio, landing, cv) + fallback de URL externa.
- Indicador de uso de almacenamiento en el Hub (barra + aviso al acercarse al límite).

### No incluido (v1)

- Contabilizar **texto** de Workspace (notas, snippets, tareas). Descartado en la consulta de diseño: el texto rara vez mueve la aguja del GB frente a una imagen. Queda como deuda técnica opcional.
- Migración/backfill de las URLs externas ya existentes. Ver [Fuera de Alcance](#fuera-de-alcance).

---

## Modelo de datos

```python
# apps/digital_services/models.py
class DigitalAsset(BaseModel):
    """
    Imagen subida por el usuario para sus páginas públicas de Vista.
    Cuenta hacia storage_gb del tenant (utils/storage.py).
    """
    SLOT_CHOICES = [
        ('avatar', 'Avatar'),
        ('og_image', 'OG Image'),
        ('portfolio_cover', 'Portada de portafolio'),
        ('portfolio_gallery', 'Galería de portafolio'),
        ('cv_photo', 'Foto de CV'),
        ('landing_image', 'Imagen de landing'),
    ]
    profile = models.ForeignKey(
        PublicProfile, on_delete=models.CASCADE, related_name='assets'
    )
    slot = models.CharField(max_length=20, choices=SLOT_CHOICES)
    file = models.ImageField(upload_to='digital_assets/%Y/%m/')
    size = models.PositiveIntegerField()          # bytes — se guarda para no leer el disco al agregar
    original_name = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'digital_assets'
        indexes = [
            models.Index(fields=['profile', 'slot']),
        ]
```

Notas:
- `profile → user → tenant` da la cadena de aislamiento (mismo patrón que `MessageAttachment.message__sender__tenant`).
- `size` se persiste (no se lee del `ImageField` en cada agregación) para que la suma de cuota sea una sola query.
- `on_delete=CASCADE` borra las **filas** al eliminar el perfil, pero **no** el archivo del disco → ver ciclo de vida.

### Categoría de subida (`utils/uploads.py`)

```python
'digital_asset': UploadCategory(
    extensions=frozenset({'.png', '.jpg', '.jpeg', '.webp', '.gif'}),
    plan_key='max_image_upload_mb',   # Free 2 MB · Starter 5 · Pro 10 · Enterprise 25
    hard_max_mb=10,
    counts_toward_storage=True,
),
```

Reutiliza el peso-por-imagen ya existente por plan; **SVG excluido** (misma política de seguridad que el resto del catálogo — XSS vía `/media/` público).

---

## API

Bajo `/api/v1/app/digital/` (router existente en `digital_services/urls.py`):

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/digital/assets/` | Multipart `{ file, slot }`. Valida con `validate_upload(category='digital_asset', tenant=request.tenant)`. Crea `DigitalAsset`. Devuelve `{ id, url, size, slot }`. **402** si supera cuota o peso de plan; **400** si tipo/contenido inválido |
| `DELETE` | `/digital/assets/<uuid:pk>/` | Borra el asset del propio perfil (libera cuota). Solo el dueño |
| `GET` | `/digital/assets/` | Lista los assets del perfil (para una futura "biblioteca") — opcional en v1 |

El `url` devuelto se guarda en el campo correspondiente (`avatar_url`, `cover_image_url`, o se agrega a `gallery_images`) mediante los endpoints de Vista **que ya existen** (`PublicProfileView`, `PortfolioDetailView`, etc.). No cambian de contrato: siguen recibiendo un string URL.

---

## Ciclo de vida y integridad de la cuota

**Este es el punto que hace que la cuota sea honesta.** Si los archivos reemplazados quedan como huérfanos, la cuota se llena de basura y el bloqueo 402 castiga al cliente por espacio que ya no usa. Estrategia por tipo de slot:

1. **Slots de una sola imagen** (`avatar`, `og_image`, `portfolio_cover`, `cv_photo`): al subir uno nuevo para un slot ocupado, el backend **borra el `DigitalAsset` anterior** de ese `(profile, slot)` en la misma transacción. Reemplazar nunca acumula.

2. **Slots multi-imagen** (`portfolio_gallery`, `landing_image`): el endpoint de guardado de Vista recibe la lista final deseada; el backend **diffea** contra los assets existentes de ese perfil/slot y borra los que ya no se referencian.

3. **Borrado en cascada** (eliminar un `PortfolioItem` o el `PublicProfile`): señal `post_delete` sobre `DigitalAsset` que borra el archivo físico (`instance.file.delete(save=False)`), porque el `CASCADE` solo elimina la fila.

4. **GC de huérfanos** (red de seguridad): tarea Celery nocturna que borra `DigitalAsset` sin referencia en ningún campo, con `created_at` > 24 h (evita cortar una subida en curso aún no asociada). `apps/digital_services/tasks.py`.

Cada borrado libera cuota automáticamente porque `get_tenant_storage_bytes()` recalcula desde la BD.

---

## Contabilización y rendimiento

Extensión mínima de la fuente de verdad:

```python
# utils/storage.py — get_tenant_storage_bytes()
from apps.digital_services.models import DigitalAsset
total += DigitalAsset.objects.filter(
    profile__user__tenant=tenant
).aggregate(total=Sum('size'))['total'] or 0
```

- Es **una** query agregada más, sobre índice `(profile, slot)` y filtro por tenant. `get_tenant_storage_bytes()` se llama en cada subida (`check_storage_limit`) y en los indicadores de uso; una agregación adicional es aceptable para v1.
- **Escalabilidad futura (no v1):** si más adelante se suman más fuentes (texto de Workspace, más apps), conviene **denormalizar** un contador `Tenant.storage_bytes_used` mantenido por signals + recálculo nocturno, y que `check_storage_limit` lea el contador cacheado. Se deja anotado en `BACKLOG.md`; no se implementa aquí porque con una sola fuente nueva no se justifica.

---

## Frontend

### `frontend_next_vista` — subidas reales

En cada feature, reemplazar el input "pegar URL" por un componente de subida (con fallback a URL externa):

| Feature | Slot(s) | Ubicación aprox. |
|---|---|---|
| Tarjeta | `avatar` | editor de tarjeta |
| Perfil / SEO | `og_image` | ajustes de perfil |
| Portafolio | `portfolio_cover`, `portfolio_gallery` | editor de item |
| Landing | `landing_image` | builder de secciones |
| CV | `cv_photo` | editor de CV |

- Hook de subida multipart (patrón `react-api-fetch-patterns` / axios), con progreso.
- Manejo de **402** → `UpgradePrompt` con CTA al Hub (patrón ya usado en Vista/Workspace).
- Manejo de **400** → mensaje del backend (tipo/peso).
- El input declara `accept="image/png,image/jpeg,image/webp,image/gif"`.

### `frontend_next_hub` — indicador de uso

- Barra de almacenamiento usado/límite, consumiendo `usage.storage` (`current_gb`/`limit_gb`) que **ya expone** el backend.
- Aviso visual al 80 % y 95 %; estado "lleno" con CTA de upgrade.
- Enterprise (`limit_gb = null`) → "Ilimitado", sin barra.

### `frontend_admin` — sin cambios

Ya edita `storage_gb` por plan (captura de la consulta). El override viaja por `Plan.limits` → `get_effective_plan_limits` y aplica sin desplegar.

---

## Seguridad

- **Aislamiento por tenant:** un usuario solo sube/borra assets de **su** `PublicProfile`; el endpoint filtra por `request.user.public_profile`. Nunca por `pk` sin comprobar dueño.
- **Tipo real por contenido:** lo garantiza `validate_upload` (Pillow `verify()`), nunca el `content_type` del cliente. **SVG prohibido.**
- **`/media/` sigue siendo público** (`config/urls.py`): las páginas de Vista son públicas por diseño, así que servir estas imágenes sin auth es coherente — pero **prohibir ejecutables/SVG** evita el vector XSS. El endurecimiento general de `/media/` sigue en su ticket propio (heredado del PRD de límites).
- **No confiar en el `size` del cliente:** se toma de `file.size` en el servidor.
- Auditar subidas/borrados con `AuditMixin` en los endpoints nuevos.

---

## Plan de Implementación (fases)

Desarrollo en **6 fases** para cubrir todo lo conversado (subidas reales + contabilización + bloqueo 402 + que la cuota liberada sea real + visibilidad + QA):

| Fase | Alcance | Entregable / tests | Depende de |
|---|---|---|---|
| **1 · Núcleo backend + contabilización** | Modelo `DigitalAsset` + migración; categoría `digital_asset` en `utils/uploads.py`; extender `get_tenant_storage_bytes()` | Tests: la suma incluye assets; `validate_upload` bloquea 402 al superar `storage_gb`; 400 por tipo | — |
| **2 · Endpoints de subida/borrado** | `POST /digital/assets/`, `DELETE /digital/assets/<pk>/`, (opcional `GET`); aislamiento por dueño; `AuditMixin` | Tests de integración: subir cuenta; borrar libera; un tenant no accede a assets de otro (aislamiento) | 1 |
| **3 · Ciclo de vida / integridad de cuota** | Reemplazo en slots únicos; diff en galería/landing; `post_delete` borra archivo físico; GC Celery nocturno | Tests: reemplazar no acumula; borrar item libera; GC elimina huérfanos > 24 h | 2 |
| **4 · Frontend Vista (subidas)** | Componente de subida + fallback URL en tarjeta, perfil/OG, portafolio (cover+galería), landing, cv; manejo 402/400 | Tests de componente con distintos límites de plan; e2e de subir→publicar | 2 |
| **5 · Hub (visibilidad de uso)** | Barra de almacenamiento usado/límite; avisos 80/95 %; estado "lleno"→upgrade; Enterprise ilimitado | Test de render con uso bajo/alto/ilimitado | 1 |
| **6 · QA + cierre** | `security-auditor` (aislamiento de assets), `migration-manager` (revisar migración), `api-documenter` (endpoints nuevos); actualizar `BACKLOG.md` y `lessons-learned` si surge algo no trivial | `make test` verde; ADR si el broker cambia una decisión previa | 3, 4, 5 |

**Paralelizables** (respetando `agent-orchestration`): Fase 4 y Fase 5 pueden ir en paralelo una vez cerrada la 2. La 3 va **sola** tras la 2 (toca borrado/GC, riesgo de datos). La 6 al final.

**Regla del repo:** `make makemigrations` + `make migrate` tras el modelo; `make test` antes de cada commit.

---

## Métricas de Éxito

- El `storage.current_gb` que ve el cliente en el Hub **incluye** las imágenes de Vista (hoy: 0 % de ellas).
- **0** imágenes de Vista alojadas fuera de la plataforma para clientes que usen el nuevo flujo (fallback externo sigue disponible por elección).
- Un tenant Free que suba imágenes de Vista recibe **402** al superar 1 GB (hoy: nunca).
- Reemplazar una imagen **no** deja huérfanos (verificado por el GC = 0 asets sin referencia > 24 h en estado estable).
- Tasa de 402 por cuota en Vista → señal de demanda de upgrade, medible por plan.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Huérfanos que llenan la cuota con basura | Reemplazo transaccional + diff + `post_delete` + GC nocturno (Fase 3) |
| `get_tenant_storage_bytes()` se vuelve lento al añadir fuentes | v1 añade una sola agregación indexada; denormalización anotada como escalado futuro |
| Clientes con imágenes externas actuales dejan de "verse contadas" | Comportamiento esperado: lo externo no cuenta. Backfill = ticket aparte, opcional |
| `/media/` público sirve las imágenes sin auth | Aceptable: las páginas de Vista son públicas; se mitiga prohibiendo tipos ejecutables/SVG |
| Race entre dos subidas concurrentes que juntas superan la cuota | Heredado de `check_storage_limit` (read-then-check). Se acota el margen al peso-por-imagen (≤ tope de plan). Bloqueo atómico = mejora futura |

---

## Fuera de Alcance

- **Contabilizar texto de Workspace** (notas, snippets, tareas) hacia la cuota — deuda técnica opcional.
- **Backfill de URLs externas existentes** a assets gestionados.
- **Denormalizar `Tenant.storage_bytes_used`** con signals (solo se justifica al sumar más fuentes).
- **Servir `/media/` con autenticación** y aislamiento por tenant — ticket heredado del PRD de límites.
- **Escaneo antivirus**, **redimensionado/compresión automática** y **migración a S3/object storage**.
- **Cuota por usuario** — la cuota sigue siendo **por tenant** vía `storage_gb`.

---

[⬅️ Volver al README](../README.md) ·
[Límites de Archivos por Plan](limites-archivos-por-plan.md) ·
[Digital Services (Vista)](digital-services.md) ·
[Billing & Subscriptions](billing.md)
