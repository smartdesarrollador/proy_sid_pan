# Importar Contactos y Bookmarks (Workspace)

**Fecha:** 2026-06-29
**App:** `apps/frontend_workspace` · `apps/backend_django`
**Plan:** `plans/implementa-todo-lo-recomendado-declarative-sedgewick.md`
**Relacionado:** complementa `reports/2026-06-29-export-datos-workspace.md`

## Contexto

El Workspace ya tenía export; faltaba el inverso: **importar** contactos (vCard/CSV de
Google/Outlook) y marcadores (HTML del navegador, CSV, JSON). A diferencia del export (solo lectura),
importar **escribe**, así que el diseño prioriza validación en backend, límites de plan, errores
parciales y seguridad.

**Decisiones:** gating **Starter+** (`contact_import`/`bookmark_import`); **importar todo** sin
deduplicar (el límite de plan igual corta). **Arquitectura:** el archivo se parsea en el **cliente**
(reusando los formatos de `export.ts`) y se envían filas JSON; el **backend revalida cada fila** con
el serializer de creación existente.

## Cambios

### Backend
- `utils/plans.py`: flags `contact_import`, `bookmark_import` (False en Free, True en Starter+).
- `apps/contacts/views.py` → `ContactImportView(AuditMixin, APIView)` y
  `apps/bookmarks/views.py` → `BookmarkImportView` en `POST /api/v1/app/{contacts,bookmarks}/import/`:
  - `permission_classes = [HasPermission('<r>.create'), HasFeature('<r>_import')]`.
  - Valida cada fila con `ContactCreateUpdateSerializer`/`BookmarkCreateUpdateSerializer`; filas
    inválidas → `errors:[{index, errors}]` **sin abortar** el lote.
  - **Límite parcial**: crea hasta `max(0, limit - current)` (resto → `skipped` motivo `plan_limit`),
    en vez de abortar con 402. `bulk_create` para el insert.
  - Cap de **1000 filas** (400 si excede). `AuditMixin` (`action='contacts.import'`/`bookmarks.import'`).
  - Respuesta `{ created, skipped, errors }`.
- URLs `import/` en `apps/contacts/urls.py` y `apps/bookmarks/urls.py`.
- **Seguridad**: aislamiento por tenant; longitudes/URL/email acotados por el serializer; cap de filas.

### Frontend
- `src/lib/import.ts` (NUEVO): inversos de `export.ts` — `parseCSV` (RFC 4180), `parseVCard`,
  `parseContactsCSV`, `parseBookmarksHTML` (DOMParser), `parseBookmarksCSV`, `parseBookmarksJSON`, y
  dispatchers `parseContacts`/`parseBookmarks` (por extensión/contenido).
- `src/components/shared/ImportModal.tsx` (NUEVO, genérico `<T>`): selector de archivo
  (`FileReader.readAsText`, cap 5 MB) → preview (tabla, primeras 10 filas) → confirmar → resumen
  `{ created, skipped, errors }`. Reusa `useFocusTrap`.
- `src/components/shared/ImportButton.tsx` (NUEVO): botón gateado (FeatureGate + fallback + permiso
  opcional) que abre el modal vía `renderModal`.
- Hooks `useImportContacts`/`useImportBookmarks` (POST `import/`, invalidan `['contacts'|'bookmarks']`
  + `['dashboard-summary']`).
- Integración: `ImportButton` en el header de `ContactsPage` (vCard/CSV) y `BookmarksPage`
  (HTML/CSV/JSON), junto al `ExportMenu`.

## Verificación

- Backend: **12/12** tests (`apps/contacts/tests/test_import.py`, `apps/bookmarks/tests/test_import.py`)
  — crea filas, gate Free → 402, límite parcial (Starter 100 → 100 created + N skipped), filas
  inválidas reportadas, cap >1000 → 400, `AuditLog`.
- Frontend: `import.test.ts` (10) + `ImportModal.test.tsx` (4) nuevos ✓ (incluye round-trip
  export→import del CSV/vCard/HTML); suite total **245 passed**; `typecheck` ✓; `vite build` ✓.
- Pre-existentes ajenos: 2 tests en `auth/` (`SSOCallbackPage`, `ProtectedRoute`) sin relación.

## Deuda / pendientes

- Import de **Notas/Tareas/Calendario** (Markdown/CSV/ICS) — no implementado.
- **Deduplicación/upsert** (por email/URL) — hoy se importa todo; mejora futura.
- El backup completo (`/app/workspace/backup/`) sigue siendo portabilidad, **no restore**
  (excluye secretos).
