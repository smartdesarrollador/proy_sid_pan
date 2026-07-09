# Bookmarks: filtro+sugerencias de tags, fix `is_favorite`, fix `collection_id`

**Fecha:** 2026-07-09
**Apps:** `apps/backend_django` (`apps/bookmarks/`), `apps/frontend_workspace`
**Origen:** el usuario pidió revisar si Bookmarks tenía tags funcionando igual que Notas/Snippets.
La auditoría encontró tres situaciones: tags ya funcionaban end-to-end (como Snippets), `is_favorite`
era un campo fantasma (peor que el de Snippets — ni la columna existía), y de paso se encontró un
mismatch de nombre de query param en el filtro de colección. El usuario pidió arreglar las tres.

## Resumen

### 1. Tags — filtro + endpoint de sugerencias
Mismo patrón exacto ya aplicado a Notas y Snippets:
- `BookmarkTagsView` (`GET /api/v1/app/bookmarks/tags/`), mirror de `NoteTagsView`/`SnippetTagsView`.
- `useBookmarkTagSuggestions` (nuevo hook, `queryKey: ['bookmarks', 'tags']`).
- `BookmarkFilters.tsx` se mantuvo presentacional; nuevo `<select aria-label="Filtrar por
  etiqueta">` poblado desde una prop `tags`. `useBookmarks.ts` y `BookmarksPage.tsx` ya tenían la
  plumbing (`?tag=`, re-filtro client-side) desde antes — no se tocaron.

### 2. `is_favorite` — fix de campo fantasma
A diferencia de Snippets (donde la columna existía y se perdía en el serializer), en `Bookmark`
**la columna no existía en absoluto**. Se agregó `is_favorite = models.BooleanField(default=False)`
al modelo (+ migración, + ordering `-is_favorite` primero igual que Notas/Snippets + índice nuevo),
se expuso en `BookmarkSerializer.Meta.fields` y se agregó a `BookmarkCreateUpdateSerializer`. Sin
cambios de frontend — el checkbox y el payload ya estaban correctos.

### 3. Fix `collection_id` → `collection` (hallazgo aparte)
`useBookmarks.ts` mandaba `?collection_id=` pero `BookmarkListCreateView.get()` siempre leyó
`request.query_params.get('collection')` — mismatch de un nombre de parámetro, fix de una línea.

**Verificado y confirmado en logs**: tras el fix, el navegador manda correctamente
`GET /app/bookmarks/?collection=<uuid>&tag=urgente`. Sin embargo, al probar end-to-end con datos
reales, la lista seguía sin mostrar resultados pese a que la query en Django shell contra la BD sí
matcheaba — se investigó y se encontró un **segundo bug, más profundo, no pedido originalmente**:
`BookmarkSerializer.collection` es un `PrimaryKeyRelatedField` implícito (comportamiento default de
`ModelSerializer` para una FK) que devuelve el UUID crudo, mientras que el tipo del frontend
(`Bookmark.collection: BookmarkCollection | null`) y `BookmarkCard.tsx`
(`<CollectionBadge collection={bookmark.collection} />`) esperan un objeto anidado con
`{id, name, color, bookmarks_count}`. Este mismatch de forma de dato es la razón por la que el
filtro de colección (y probablemente el badge de colección en las cards) nunca funcionó realmente
del todo, incluso con el nombre de parámetro corregido. **No se tocó** — está fuera del alcance
aprobado (el usuario pidió arreglar el mismatch de nombre de parámetro, no rediseñar la
serialización de `collection`). Anotado en `BACKLOG.md` para decidir en una sesión futura.

## Verificación

- Backend: 18/18 tests de `apps/bookmarks/` (8 nuevos: `is_favorite` create/update/ordering, filtro
  por tag, 3 tests del endpoint de sugerencias). Suite completa: 675 passed, 10 fallos preexistentes
  sin relación (throttles/chat/support, ya trazados en `BACKLOG.md`).
- Frontend: `tsc` limpio; 11/11 tests de `src/features/bookmarks` (1 nuevo: `'filtra bookmarks por
  etiqueta'`); suite completa 290/292 (2 fallos preexistentes ya trazados).
- End-to-end en navegador real (tenant Empresa15):
  - Filtro de tags: seleccionar "urgente" redujo la lista correctamente, confirmado en logs
    `GET /app/bookmarks/?tag=urgente`.
  - `is_favorite`: marcado desde el modal de edición, la estrella apareció en la card y **sobrevivió
    a un reload completo**.
  - Filtro de colección: confirmado que ahora se manda `?collection=<uuid>` (antes `?collection_id=`,
    ignorado por el backend) — pero el resultado sigue vacío por el bug de forma de dato descrito
    arriba, que queda pendiente.
  - Datos de prueba (bookmarks, colección, favorito) revertidos al terminar.

## Fuera de alcance / pendiente

Ver nueva entrada en `BACKLOG.md`: `BookmarkSerializer.collection` debería devolver el objeto
anidado (o el frontend debería tratarlo como ID + usar `collection_name` para mostrar, ya que ese
campo sí existe correctamente) — decidir el enfoque antes de tocarlo.
