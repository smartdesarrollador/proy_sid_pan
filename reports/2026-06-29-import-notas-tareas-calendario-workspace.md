# Importar Notas, Tareas y Calendario (Workspace)

**Fecha:** 2026-06-29
**App:** `apps/frontend_workspace` · `apps/backend_django`
**Plan:** `plans/implementa-todo-lo-recomendado-declarative-sedgewick.md`
**Relacionado:** extiende `reports/2026-06-29-import-contactos-bookmarks-workspace.md`

## Contexto

Tercera entrega de la serie export/import. Extiende el import al resto de los recursos
"productividad": **Notas** (Markdown ZIP / JSON), **Tareas** (CSV / JSON) y **Calendario** (ICS),
reusando la infra `ImportModal`/`ImportButton`/`src/lib/import.ts`. Mismo patrón: el cliente parsea
→ filas JSON → el backend **revalida cada fila** con el serializer de creación, límite de plan
parcial, `bulk_create`, `AuditMixin`. Convenciones ya fijadas: **Starter+** e **importar todo**.

## Particularidades resueltas

- **Tareas — board obligatorio**: `Task.board` es FK requerida. El import resuelve el board
  **"General"** una sola vez (`TaskBoard.objects.get_or_create(tenant, name='General')`) y lo reusa
  para todas las filas; ignora `board`/`assignee`/`parent_task` de cada fila. El límite de tareas se
  cuenta **a nivel tenant** (igual que el create individual).
- **Calendario — validación**: el serializer exige `start_datetime`/`end_datetime` y rechaza
  `end < start`; esas filas caen en `errors` sin abortar. El parser ICS emite **directamente** el
  contrato del backend (`start_datetime`/`end_datetime`/`is_all_day`), no la forma interna del
  frontend (`start_date`/`all_day`).
- **Notas — Markdown ZIP**: importar el formato rico requiere **leer** un ZIP en el cliente con
  `jszip.loadAsync`; el backend descarta `tags` (el modelo no los tiene).

## Cambios

### Backend
- `utils/plans.py`: flags `notes_import`, `tasks_import`, `calendar_import` (Starter+).
- `NotesImportView` / `TasksImportView` / `CalendarImportView` (espejo de `ContactImportView`) en
  `POST /api/v1/app/{notes,tasks,calendar}/import/` + rutas `import/`. Cap 1000 filas, éxito parcial,
  límite parcial, `bulk_create`, auditoría (`notes.import` / `tasks.import` / `calendar.import`).

### Frontend
- `src/lib/import.ts`: `parseNotesJSON`, `parseNotesZip` (jszip `loadAsync` + front-matter),
  `parseTasksCSV`, `parseTasksJSON`, `parseICS` (VEVENT → ISO, `VALUE=DATE` → all-day), helpers
  `readFileText`/`readFileArrayBuffer` y dispatchers de archivo `parseNotesFile`/`parseTasksFile`/
  `parseCalendarFile`.
- `ImportModal`: nueva prop opcional **`parseFile`** (ruta async/binaria, con estado "Procesando…")
  para soportar ZIP; la ruta de texto `parse` se mantiene → **contactos y bookmarks intactos**.
- Hooks `useImportNotes`/`useImportTasks`/`useImportEvents`; `ImportButton` en Notas, Tareas y
  Calendario (este último envuelve Import+Export en un `flex gap-2`).

## Verificación

- Backend: **17/17** tests (`apps/{notes,tasks,calendar_app}/tests/test_import.py`) — crea filas,
  gate Free → 402, límite parcial, filas inválidas, cap >1000 → 400, auditoría; **Tareas**: las
  filas caen en **un solo** board "General"; **Calendario**: `end < start` → `errors` sin abortar.
- Frontend: `import.test.ts` ampliado (round-trips **`parseICS↔toICS`**, **`parseNotesZip↔toMarkdownZip`**,
  `parseTasksCSV↔toCSV`, `parseNotesJSON`) + `ImportModal` ruta `parseFile`; suite total **251 passed**;
  `typecheck` ✓; `vite build` ✓.
- Pre-existentes ajenos: 2 tests en `auth/` (`SSOCallbackPage`, `ProtectedRoute`).

## Deuda / pendientes

- **Deduplicación/upsert** en import (hoy se importa todo) — mejora futura, transversal a todos los recursos.
- Import de Snippets/Proyectos — no priorizado (bajo valor / secretos).
