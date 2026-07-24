# ADR-007: Almacenamiento Gestionado de Vista y Contabilización de la Cuota (`storage_gb`)

- **Estado**: Aceptado
- **Fecha**: 2026-07-23
- **Autor**: Equipo de desarrollo

---

## Contexto

La cuota de almacenamiento por plan (`storage_gb`: Free 1 GB … Professional 20 GB, editable desde
Gestión de Planes del Admin) existía y se hacía cumplir con `check_storage_limit`, pero **no reflejaba
lo que un tenant realmente consume**. `get_tenant_storage_bytes` (`utils/storage.py`) solo sumaba tres
fuentes: adjuntos de chat, logo/favicon del tenant y comprobantes Yape. En particular, **todas las
imágenes de Vista** (tarjeta, portafolio, landing, CV) se guardaban como **URLs externas**
(`URLField`/`JSONField`: `avatar_url`, `og_image_url`, `cover_image_url`, `gallery_images`), alojadas
fuera de la plataforma. Un tenant Free podía publicar una presencia web completa sin ocupar ni un byte
de su cuota — el límite que el Admin edita y el Hub muestra era, para Vista, ficticio.

Preguntas de diseño no triviales:

- **¿Cómo hacer que las imágenes de Vista cuenten?** ¿Convertir cada campo `*_url` a `ImageField`, o
  introducir un modelo de subida gestionada aparte?
- **¿Cómo mantener la cuota honesta cuando el usuario reemplaza o borra imágenes** (evitar huérfanos
  que ocupan cuota para siempre), sin borrar un archivo aún referenciado?
- **¿Dónde vive la fuente de verdad del uso**, para no recalcular ni desincronizar entre pantallas?

Ver el PRD completo: `prd/features/cuota-almacenamiento-real-vista.md`.

## Decisión

### 1. Broker de subidas `DigitalAsset`, no `ImageField` por campo

Se introduce un modelo único `DigitalAsset` (`apps/digital_services/models.py`) con un `ImageField`,
dueño `PublicProfile`, `slot` y `size` persistido. El cliente sube el archivo, el backend devuelve una
URL interna (`/media/digital_assets/…`) y esa URL se guarda en los campos `*_url`/`gallery_images`
**que no cambian de tipo**.

**Razón**: convertir cada uno de los ~5 campos de imagen de Vista a `ImageField` era invasivo
(migraciones sobre 3 modelos, multipart en cada endpoint) y **perdía** la flexibilidad de pegar una
URL externa. Con el broker, los campos siguen siendo URLs: pueden apuntar a un archivo gestionado (que
cuenta a la cuota) o a una URL externa (que no cuenta, fallback deliberado). Reutiliza el patrón ya
existente de `MessageAttachment` del chat.

### 2. La cuota se contabiliza en una única fuente de verdad

`get_tenant_storage_bytes` (`utils/storage.py`) se extiende para sumar `DigitalAsset` del tenant
(aislamiento `profile → user → tenant`). No se crean contadores nuevos: el Hub
(`CurrentSubscriptionSerializer.get_usage`) y analytics (`storage_used_gb`) heredan el total corregido
sin tocarlos. La validación de subida (`utils/uploads.py::validate_upload`, categoría `digital_asset`
con `counts_toward_storage=True`) llama a `check_storage_limit` y bloquea con **402** al exceder plan o
cuota. **SVG queda excluido** (se serviría desde `/media/` público → XSS almacenado).

**Razón**: un único punto de cálculo evita desincronías entre pantallas y deja el enforcement y el
reporte alimentados por el mismo número.

### 3. Ciclo de vida por GC basado en referencias (24 h), no "reemplazo eager"

La integridad de la cuota (que reemplazar/borrar imágenes libere espacio de verdad) se resuelve con:
(a) un signal `post_delete` que borra el binario del disco cuando se elimina la fila —incluido el
`CASCADE` de perfil/portafolio, que si no dejaría el archivo huérfano—; y (b) una tarea Celery nocturna
(`collect_orphan_digital_assets`) que borra los assets **no referenciados** con más de 24 h de
antigüedad, de los slots cuya referencia se rastrea (avatar, og_image, portfolio_cover,
portfolio_gallery).

**Razón**: el "reemplazo eager al subir" (borrar el asset anterior en el momento de subir el nuevo) es
**inseguro**: al subir el reemplazo, la nueva URL aún no está guardada y la vieja sigue referenciada;
borrarla rompería la imagen si el usuario abandona antes de guardar. El GC por referencias con ventana
de 24 h cubre uniformemente todos los casos (avatar re-subido, galería recortada, item borrado) sin ese
riesgo. Durante esas ≤24 h el huérfano sí cuenta hacia la cuota — lo cual es honesto: el archivo existe
y ocupa espacio. Ver [LL-105](../../.claude/skills/lessons-learned/references/knowledge-base.md).

### 4. El tenant de la subida sale de `request.user`, no del header

`DigitalAssetView.post` toma el tenant de `request.user.tenant`, no de `request.tenant`.

**Razón**: Vista autentica solo con `Authorization: Bearer` y **no** envía `X-Tenant-Slug`, así que
`request.tenant` (que `TenantMiddleware` resuelve solo desde ese header) vendría `None`. El mismo
descubrimiento obligó a endurecer `AuditMixin.log_action` para que resuelva el tenant con fallback a
`request.user` y omita el registro si no hay ninguno, en vez de reventar la transacción con una
`IntegrityError` (`audit_logs.tenant_id` es NOT NULL). Ver LL-105.

## Alternativas consideradas

### A. Convertir cada `*_url` de Vista a `ImageField`
- ✅ Conceptualmente directo (el campo "es" una imagen).
- ❌ Migraciones sobre ~5 campos en 3 modelos + multipart en cada endpoint de Vista.
- ❌ Pierde el fallback de URL externa que algunos clientes querrán conservar.

### B. Reemplazo eager al subir (borrar el asset anterior del mismo slot)
- ✅ Libera cuota de inmediato.
- ❌ Inseguro: la URL nueva aún no está guardada; borrar la vieja rompe la imagen si se abandona.
- ❌ No aplica a slots multi-imagen (portfolio_cover es por-item, galería es lista).

### C. Denormalizar `Tenant.storage_bytes_used` con signals desde ya
- ✅ Lectura O(1), escala a muchas fuentes.
- ❌ Innecesario con una sola fuente nueva: una agregación indexada por subida es suficiente. Se deja
  como deuda técnica para cuando se sumen más fuentes (texto de Workspace, etc.).

## Consecuencias

### Positivas
- La cuota que ve el cliente (Hub/analytics) incluye por fin las imágenes de Vista, sin tocar esas
  pantallas (heredan `get_tenant_storage_bytes`).
- Se conserva el fallback de URL externa; migrar a archivos gestionados es opt-in por subida.
- El GC + signal garantizan que reemplazar/borrar libera cuota real, sin borrar archivos en uso.
- El 402 en Vista habilita por fin la señal de upgrade que antes no se disparaba.

### Negativas / limitaciones conocidas
- **Landing y CV quedan fuera de v1**: `landing_image` (imágenes en el JSON `sections`) y `cv_photo`
  (sin campo propio) no se cablearon y están **excluidos del GC** hasta rastrear su referencia. Ver
  `BACKLOG.md` → Deuda técnica.
- Un huérfano ocupa cuota hasta ≤24 h (hasta que corre el GC) — comportamiento honesto pero puede
  inflar temporalmente el uso durante una edición intensa.
- `/media/` sigue sirviéndose **sin autenticación** (riesgo preexistente, heredado del PRD de límites
  de archivos): esta feature lo mitiga (solo tipos imagen no ejecutables, SVG prohibido) pero no lo
  cierra. Ver `BACKLOG.md`.
- El texto de Workspace (notas, snippets, tareas) sigue sin contar hacia la cuota (descartado en v1).

### Mejora futura recomendada
- Extender el colector de referencias del GC a las secciones JSON de landing y añadir foto de CV, para
  cablear esos slots.
- Denormalizar `Tenant.storage_bytes_used` si se suman más fuentes de almacenamiento.

---

Este ADR no reemplaza a ninguno previo (no existía uno de almacenamiento). Se relaciona con el PRD
`prd/features/cuota-almacenamiento-real-vista.md` y con LL-105.
