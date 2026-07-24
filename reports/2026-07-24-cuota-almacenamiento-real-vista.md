# Cuota de almacenamiento real por tenant (Vista + chat) y mejoras de UX de límite

**Fecha:** 2026-07-24
**Apps:** `apps/backend_django` · `apps/frontend_next_vista` · `apps/frontend_next_hub` · `apps/frontend_admin` · `apps/frontend_workspace` · `apps/frontend_sidebar_desktop`
**Origen:** dos capturas del usuario (Admin → *Editar plan: Free* con "Almacenamiento (GB) = 1", y el
Dashboard del Hub). Pregunta inicial: *"¿realmente se respeta la cantidad de almacenamiento que se
gestiona en el Admin? Si Free = 1 GB, ¿cada tenant tiene solo 1 GB para todo lo que almacena en Hub,
Workspace, Vista y Desktop juntas?"*
**PRD:** [`prd/features/cuota-almacenamiento-real-vista.md`](../prd/features/cuota-almacenamiento-real-vista.md)
**ADR:** [`docs/adr/007-almacenamiento-gestionado-cuota.md`](../docs/adr/007-almacenamiento-gestionado-cuota.md)
**Lección:** [LL-105](../.claude/skills/lessons-learned/references/knowledge-base.md) (`request.tenant` None sin `X-Tenant-Slug` → `AuditMixin` envenena la transacción)
**Estado:** Implementado, verificado en vivo por el usuario y **commiteado**.

## Resumen

La investigación inicial reveló que la cuota `storage_gb` del plan **existía y se hacía cumplir**
(`check_storage_limit`), pero `get_tenant_storage_bytes` (`utils/storage.py`) solo sumaba tres
fuentes: adjuntos de chat, logo/favicon del tenant y comprobantes Yape. En particular, **todas las
imágenes de Vista** (tarjeta, portafolio, landing, CV) se guardaban como **URLs externas**
(`URLField`/`JSONField`), alojadas fuera de la plataforma, por lo que **no ocupaban ni un byte** de la
cuota. Conclusión: el límite que el Admin edita y el Hub muestra era, para Vista, ficticio. Además la
cuota es **por tenant**, no por usuario.

Se construyó la feature en **6 fases** (cada una planificada, implementada y verificada antes de la
siguiente), y luego se añadieron **4 mejoras** surgidas de la prueba en vivo del usuario.

## Fase 1 — Núcleo backend y contabilización

- Modelo **`DigitalAsset`** (`apps/digital_services/models.py`): broker de subidas con `ImageField` +
  `size` persistido + `slot` (avatar, og_image, portfolio_cover, portfolio_gallery, cv_photo,
  landing_image) + FK a `PublicProfile`. Migración `0024_digitalasset` (aditiva).
- Categoría **`digital_asset`** en `UPLOAD_CATEGORIES` (`utils/uploads.py`): `counts_toward_storage=True`,
  gateada por `max_image_upload_mb`, `hard_max_mb=10`, **SVG excluido** (XSS vía `/media/` público).
- **`get_tenant_storage_bytes()`** extendida para sumar `DigitalAsset` del tenant (agregación indexada,
  aislamiento `profile → user → tenant`). Corrige de una vez el indicador del Hub y el de analytics,
  que ya heredan de esa función.
- Tests: contabilización con aislamiento entre tenants + bloqueo 402 por plan/cuota.

## Fase 2 — Endpoints de subida/borrado

- `POST/GET/DELETE /api/v1/app/digital/assets/` (`DigitalAssetView`, `DigitalAssetDetailView`):
  subir valida (tipo real Pillow + tope de plan + cuota → **402**), crea el asset y cuenta hacia
  `storage_gb`; borrar libera cuota. **Aislamiento por dueño** (`asset.profile.user_id`), auditado.
- Tests de integración: subir cuenta, 402 por cuota/plan, 400 por tipo/slot, borrar libera, aislamiento.

## Fase 3 — Ciclo de vida e integridad de cuota

- Signal **`post_delete`** en `DigitalAsset` (`apps/digital_services/signals.py`, cableado en
  `apps.py::ready()`): borra el binario del disco al eliminar la fila — incluido el `CASCADE` de
  perfil/portafolio, que si no dejaría el archivo huérfano.
- Tarea Celery nocturna **`collect_orphan_digital_assets`** (`tasks.py` + `CELERY_BEAT_SCHEDULE`):
  recolector de huérfanos por **referencias**, con ventana de **24 h**, para los slots cableados.
- **Decisión de diseño**: se descartó el "reemplazo eager al subir" (inseguro: borraría un asset
  recién subido que aún no se guardó) en favor del GC por referencias. Ver ADR-007 y LL-105.

## Fase 4 — Frontend de Vista (subida real)

- Hook **`useUploadImage`** (multipart, sin forzar Content-Type — gotcha de axios/FormData).
- `ImageUploadField` extendido: `<input type="file">` real + **fallback de URL externa** + manejo de
  **402** con banner y CTA "Mejorar plan".
- Cableado en Tarjeta (avatar + campo **OG nuevo**) y Portafolio (cover + galería) pasando el `slot`.
- **Alcance enfocado**: Landing y CV se difirieron (requieren backend extra: escanear secciones JSON
  del GC / campo de foto de CV).

### Bug crítico encontrado y corregido en esta fase (LL-105)

Vista autentica **solo con `Authorization: Bearer`** y **no envía `X-Tenant-Slug`**, así que
`request.tenant` (que `TenantMiddleware` resuelve solo desde ese header) vendría **`None`**. Los tests
de la Fase 2 lo enmascararon porque enviaban el header. Dos correcciones:
- `DigitalAssetView.post` toma el tenant de `request.user.tenant`, no de `request.tenant`.
- **`AuditMixin.log_action`** (`core/mixins.py`) resuelve el tenant con fallback a `request.user` y
  **omite** el registro si no hay ninguno, en vez de reventar la transacción con una `IntegrityError`
  (`audit_logs.tenant_id` es NOT NULL) que el `try/except` tragaba pero que **envenenaba la
  transacción**. Endurece el audit para toda la app.

## Fase 5 — Indicador de uso en el Hub

- El backend ya exponía todo (`GET /admin/subscriptions/current/` → `usage.storage {current_gb, limit_gb}`),
  y la página de Suscripción ya tenía una barra (`UsageMeters`). El hueco era el **Dashboard**.
- Nuevo **`StorageUsageBar`** en el Dashboard (reutiliza `useCurrentSubscription`, sin request extra):
  barra con umbrales de color, badge "Límite alcanzado", CTA de upgrade, "Ilimitado" para Enterprise,
  dark mode e i18n. Pulido de `UsageMeters` (dark mode).

## Fase 6 — QA y cierre

- **Revisión de seguridad** (inline): aislamiento de subida/borrado/listado + validación de contenido;
  sin hallazgos nuevos (el único real, LL-105, ya cerrado en Fase 4).
- **Documentación API**: `@extend_schema` enriquecido en el endpoint de subida (request multipart +
  responses 201/400/402), consistente con los otros endpoints de upload del repo.
- **ADR-007** (broker vs ImageField-por-campo, GC vs eager, fuente única de cuota, tenant desde
  `request.user`) y registro en `BACKLOG.md` de la deuda diferida.

## Mejoras posteriores (surgidas de la prueba en vivo del usuario)

1. **Display en MB** (`features/subscription/formatStorage.ts`, Hub): unos pocos MB redondeaban a
   "0.0 GB" con la barra ya movida. Ahora muestra MB cuando el uso es < 1 GB (`38 MB`, `5.1 MB`),
   tanto en `StorageUsageBar` como en `UsageMeters`.

2. **Decimales en Almacenamiento (GB) del Admin**: el campo era entero (`IntegerField` + input sin
   `step`). Se pasó a `FloatField` (redondeo a 2 decimales en `validate_storage_gb`) y `step="0.01"`
   **solo** en ese campo del `PlanEditModal`. Ahora se puede poner `0.03 GB` (≈ 30 MB) para pruebas o
   planes finos. `FloatField` y **no** `DecimalField`: `Plan.limits` es un `JSONField` y `Decimal` no
   es serializable con el encoder por defecto.

3. **Avisos de límite de UX** (dos piezas, elegidas por el usuario):
   - **Mensaje de bloqueo al subir**: el chat de **Workspace** (`ChatPage.handleSend`) fallaba en
     silencio ante el 402 de cuota (no tenía `onError`). Ahora muestra el mensaje del backend vía el
     `ChatToast` existente. Mismo arreglo en el chat del **Desktop** (`useSendMessage` extrae el
     `error.message` del backend, `ChatPanel` lo muestra). Vista ya lo tenía desde la Fase 4.
   - **Franja proactiva en el Hub** (`StorageLimitBanner`, montada en `AppLayoutClient`): al **≥80%**
     advierte ("Estás cerca del límite…"), al **100%** marca "lleno", con CTA a Suscripción,
     descartable por sesión, dark mode e i18n (es/en).

4. **Eliminar adjuntos del chat** (para liberar espacio a demanda):
   - Backend: `DELETE /api/v1/app/chat/messages/<id>/` (`MessageDetailView`) → **soft-delete** del
     mensaje (marca `deleted_at`, respetando el tombstone "Mensaje eliminado" ya existente en el
     modelo/serializer), pero **borra de verdad sus adjuntos** para liberar la cuota. Solo el
     remitente; ajenos → 404. Auditado. Signal `post_delete` en `MessageAttachment` borra el binario
     del disco (mismo detalle que `DigitalAsset`).
   - Frontend (Workspace + Desktop): opción **"Eliminar mensaje"** en el menú "⋮" existente del
     mensaje, **solo en mensajes propios**, con confirmación. Hooks `useDeleteMessage`.

## Decisiones de diseño clave

- **Broker `DigitalAsset`** en vez de convertir cada `*_url` a `ImageField`: menos invasivo, conserva
  el fallback de URL externa (las URLs externas **no** cuentan a la cuota; solo los archivos gestionados).
- **GC por referencias (24 h)** en vez de reemplazo eager: seguro y uniforme (ver ADR-007 y LL-105).
- **`get_tenant_storage_bytes` como única fuente de verdad**: Hub y analytics heredan el total corregido.
- **Tenant desde `request.user`** en endpoints de clientes que no mandan `X-Tenant-Slug` (Vista).
- **Soft-delete** en el borrado de mensajes de chat (coherente con el `deleted_at`/tombstone existente),
  pero borrado real de adjuntos para liberar cuota.
- **`FloatField` (no Decimal)** para `storage_gb`, por el `JSONField` de `Plan.limits`.

## Verificación

- **Backend**: `digital_services` + `audit` (91 tests), `chat` (61, incl. 2 de borrado),
  `subscriptions/test_plans_admin` (10, incl. decimal), `core/tests/test_uploads`. Ruff limpio en los
  archivos tocados. Schema OpenAPI compila. Nota: 10 fallos de la suite backend completa son
  **preexistentes** (throttle/rate-limit + flakes de cache por orden), ajenos a esta feature.
- **Vista**: 64 tests (Jest+RTL+MSW); tsc/eslint limpios (1 error tsc preexistente en `WelcomeBanner`).
- **Hub**: 88 tests (Vitest+RTL); tsc/eslint **0 errores**.
- **Workspace**: 22 tests de chat; tsc/eslint **0 errores**.
- **Desktop**: tsc **0 errores** (su ESLint está roto repo-wide por config legacy de ESLint v9 —
  preexistente; app Tauri, no runtime-verificable en esta sesión).
- **Prueba en vivo del usuario**: Admin con Free a 0.03 GB (30 MB); el Hub mostró "31 MB / 31 MB" con
  barra roja y franja de "límite alcanzado"; el chat de Workspace mostró el toast del 402 al bloquear;
  y el borrado de adjuntos liberó espacio. Todo confirmado por el usuario.

## Deuda técnica / follow-ups (registrados en `BACKLOG.md`)

- Subidas de **Landing** (imágenes en el JSON `sections`) y **CV** (foto): requieren extender el
  colector de referencias del GC / un campo de foto de CV. Hoy `landing_image`/`cv_photo` están
  excluidos del GC.
- **Contabilizar texto de Workspace** (notas, snippets, tareas) hacia la cuota — descartado en v1.
- **Denormalizar `Tenant.storage_bytes_used`** si se suman más fuentes de almacenamiento.
- **Backfill** de las URLs externas de Vista existentes a assets gestionados.
- **Sync realtime del borrado** de mensajes de chat en grupos (hoy los demás lo ven al refrescar).
- Heredado: **servir `/media/` con autenticación** y aislamiento por tenant.

## Archivos principales tocados

- Backend: `apps/digital_services/{models,views,urls,signals,tasks}.py` + migración `0024`,
  `utils/{uploads,storage}.py`, `core/mixins.py`, `apps/subscriptions/serializers.py`,
  `apps/chat/{views,urls,signals}.py`, `config/settings/base.py`.
- Frontend Vista: `hooks/useUploadImage.ts`, `features/portfolio/components/ImageUploadField.tsx`,
  `features/tarjeta/{components/CardEditor.tsx, hooks/useSaveCard.ts}`, `ProjectModal.tsx`.
- Frontend Hub: `features/subscription/{formatStorage.ts, components/StorageUsageBar.tsx,
  StorageLimitBanner.tsx, UsageMeters.tsx}`, `features/app/AppLayoutClient.tsx`, `i18n/locales/*`.
- Frontend Admin: `features/plans/components/PlanEditModal.tsx`.
- Frontend Workspace / Desktop: `features/chat/*` (composer error 402, menú de borrar, hooks).
- Docs: `prd/features/cuota-almacenamiento-real-vista.md`, `docs/adr/007-...md`, `BACKLOG.md`,
  `lessons-learned` (LL-105).
