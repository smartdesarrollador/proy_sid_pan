# Notas: filtro de búsqueda por etiqueta

**Fecha:** 2026-07-08
**Apps:** `apps/backend_django` (`apps/notes/`), `apps/frontend_workspace`
**Origen:** siguiendo la implementación de tags normalizados + sugerencias (misma sesión), el
usuario pidió poder filtrar la lista de notas por una etiqueta específica, igual que ya se puede
filtrar por categoría.

## Resumen

Se replicó el patrón `?tag=` + `tags__contains=[tag]` que ya existía en `bookmarks` y `snippets`
para su propio campo `tags` — sin inventar un patrón nuevo.

### Backend
- `NoteListCreateView.get()`: nuevo query param `tag`, `qs.filter(tags__contains=[tag])`, agregado
  al `@extend_schema(parameters=[...])` y al docstring de endpoints. Sin migración.
- Tests nuevos: `test_filter_notes_by_tag` (dos notas con tags disjuntos, filtra correctamente),
  `test_filter_notes_by_tag_no_match_returns_empty`.

### Frontend
- `NoteFiltersState` gana `tag: string`; `useNotes.ts` lo envía como query param (el `queryKey`
  ya incluía el objeto `filters` completo, así que el cache-busting fue automático).
- `NoteFilters.tsx` se mantuvo puramente presentacional (no llama hooks — sigue la convención ya
  establecida en ese archivo, toda la data-fetching vive en `NotesPage.tsx`); nuevo `<select
  aria-label="Filtrar por etiqueta">` poblado dinámicamente desde la prop `tags` (a diferencia de
  `CATEGORY_OPTIONS`, que es un const estático — el vocabulario de tags es dato de runtime).
- `NotesPage.tsx` llama `useNoteTagSuggestions()` (hook ya existente de la sesión de
  normalización+sugerencias) y pasa el resultado como prop `tags` a `NoteFilters`; se agregó el
  check de tag al predicado de re-filtrado client-side existente, mismo idioma que ya usa
  `BookmarksPage.tsx` para su propio filtro de tag.

## Verificación

- Backend: 21/21 tests de `apps/notes/` (2 nuevos).
- Frontend: `tsc` limpio; 22/22 tests de `src/features/notes` (1 nuevo: `'filtra notas por
  etiqueta'`); suite completa 288/290 (2 fallos preexistentes ya trazados en `BACKLOG.md`,
  `ProtectedRoute.test.tsx` + `SSOCallbackPage.test.tsx`).
- End-to-end en navegador real (tenant Empresa15): el select "Todas las etiquetas" se puebla con
  las opciones reales del backend (`personal`, `test`, `urgente`); al seleccionar "urgente" la
  lista se reduce a la única nota con ese tag, el contador pasa de "5 notas" a "1 notas", y la
  sección "Notas fijadas" desaparece correctamente al no quedar ninguna con ese tag. Confirmado en
  los logs del backend que se manda `GET /api/v1/app/notes/?tag=urgente` — filtro real server-side,
  no solo client-side. Datos de prueba revertidos al terminar.

## Fuera de alcance

No se tocó `bookmarks`/`snippets` (solo fueron la fuente del patrón replicado); no se rediseñó la
doble filtración server-side + client-side ya existente para `search`/`category`/`pinned_only`
(se mantuvo la misma arquitectura para el nuevo filtro de tag, por consistencia).
