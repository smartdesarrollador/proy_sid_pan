# Exportación de datos en el Workspace + Backup completo

**Fecha:** 2026-06-29
**App:** `apps/frontend_workspace` (React+Vite) · `apps/backend_django`
**Plan:** `plans/implementa-todo-lo-recomendado-declarative-sedgewick.md`

## Contexto

El Workspace no tenía una forma consistente de exportar/respaldar datos. Existían exports
ad-hoc y dispares: CSV inline en Contactos/Bookmarks/Snippets/EnvVars (con un **bug de escape
CSV** real) y un export por API en Reportes. Se estandarizó y extendió todo a un patrón único
con formatos nativos del dominio, gateado por plan, más un "Backup completo" en backend.

## Bug latente encontrado (y corregido)

`FeaturesView` (`apps/rbac/views.py`) expone **las claves crudas** de `utils/plans.py`. El
frontend gateaba con claves que **no existían** en ese dict:

| Frontend usaba | En `plans.py` | Efecto |
|---|---|---|
| `contacts_export` | `contact_export` | botón **siempre deshabilitado** |
| `bookmarks_export` | `bookmark_export` | botón siempre deshabilitado |
| `snippets_export` | (no existía) | botón siempre deshabilitado |
| `projects_export` | (no existía) | botón siempre deshabilitado |

Es decir, los 4 exports inline previos **nunca** se mostraban habilitados. Se reconciliaron las
claves (frontend→backend) y se añadieron las nuevas. Ver `LL-057`.

## Cambios

### Backend
- `utils/plans.py`: nuevos flags por plan — `notes_export`, `tasks_export`, `snippets_export`,
  `calendar_export`, `project_export` (Starter+), `full_backup` (Professional+).
- Nueva app ligera `apps/exports/` (sin modelos, sin migración): `WorkspaceBackupView`
  (`GET /api/v1/app/workspace/backup/`) → ZIP de `*.json` (notes, tasks, snippets, contacts,
  bookmarks, calendar, projects) + `manifest.json`. `HasFeature('full_backup')`, `AuditMixin`
  (`action='data.export'`), aislamiento `tenant=request.tenant, user=request.user`.
- **Secretos nunca se exportan**: campos `ProjectItemField.is_encrypted` → `***ENCRYPTED***`;
  EnvVars/SSH/Vault excluidos por completo.
- `config/urls.py`: ruta `app/workspace/`.

### Frontend
- `src/lib/export.ts` (NUEVO): util compartido — `toCSV` (escape **RFC 4180**, arregla el bug),
  `toJSON`, `toVCard`, `toICS`, `toBookmarksHTML`, `toMarkdownZip` y `toCodeZip` (con **jszip**,
  lazy-loaded → chunk aparte), `downloadBlob`, `slugify`.
- `src/components/shared/ExportMenu.tsx` (NUEVO): botón/dropdown gateado (FeatureGate + fallback
  deshabilitado + permiso RBAC opcional), spinner por formato.
- Integración por sección (respeta filtros activos): Notas (MD-zip/JSON/CSV), Tareas (CSV/JSON),
  Snippets (código-zip/JSON), Contactos (vCard/CSV), Bookmarks (HTML/CSV/JSON), Calendario (ICS),
  Proyectos (JSON metadatos). Se reemplazaron los CSV inline buggy.
- **EnvVars**: se **eliminó** el export (exportaba `value` = secreto).
- Settings: nueva pestaña "Datos" → `DataTab` + hook `useWorkspaceBackup` (descarga el ZIP).

## Verificación

- Backend: `apps.exports` **5/5** tests ✓ (200 en Pro, 402 en Free, secretos enmascarados,
  aislamiento de tenant, `AuditLog` registrado).
- Frontend: `export.test.ts` + `ExportMenu.test.tsx` nuevos ✓; suite relevante **76/76** ✓;
  `npm run typecheck` ✓; `vite build` ✓ (`jszip` en chunk separado, gzip ~30KB).
- Pre-existentes ajenos: 2 tests en `auth/` (`SSOCallbackPage`, `ProtectedRoute`) fallan sin
  relación con este cambio.

## Deuda / pendientes

- Export de metadata de SSL Certs (dominio/vencimiento) — no implementado.
- Scheduling de backups automáticos / retención — futuro.
- `bookmark_export` sigue siendo Professional+ (precedente); los demás básicos son Starter+.
