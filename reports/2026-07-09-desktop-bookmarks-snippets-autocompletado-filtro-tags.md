# Desktop Sidebar (Bookmarks/Snippets): mismo autocompletado + filtro de tags que Notas

**Fecha:** 2026-07-09
**Apps:** `apps/frontend_sidebar_desktop`
**Origen:** el usuario pidió aplicar a Bookmarks y Snippets del Desktop Sidebar el mismo
autocompletado de tags + filtro por tag recién implementado en Notas.

## Resumen

Confirmado leyendo ambos archivos completos: misma arquitectura exacta que `NotesPanel.tsx` — todo
cargado y filtrado 100% client-side (`fetchBookmarks`/`fetchSnippets` traen todo en una sola llamada,
sin `?collection=`/`?language=`/`?search=` al backend). Se replicó el mismo patrón sin ninguna llamada
nueva al backend:

- `allTags` (`useMemo` derivado de los datos ya cargados, mismo patrón que `presentCollections`/
  `languages`).
- Fila de pills `#tag` (color teal, consistente entre los tres paneles) después de la fila de
  colección/lenguaje existente, condicionada a `allTags.length >= 2`.
- Autocompletado en `BookmarkForm`/`SnippetForm`: mismo bloque exacto que `NoteForm` (dropdown
  absolutamente posicionado, sugiere todas al enfocar, filtra por substring al escribir, clic inserta
  y deja el campo listo para el siguiente tag, cierre con clic-fuera/Escape).

**Hallazgo adicional resuelto como parte de la paridad, no como bug aparte:** `SnippetsPanel.tsx`
nunca mostraba los tags de un snippet en ningún lado (ni colapsado ni expandido), a diferencia de
Bookmarks y Notas que sí los muestran en el detalle expandido. Se agregó la misma fila de tags
(ícono `Tag` + pills `#tag`) al detalle expandido de `SnippetItem`, mismo estilo exacto que
`BookmarkItemRow` — sin esto, el nuevo filtro por tag no tendría forma visual de confirmarse en la UI
de Snippets.

No se tocó el patrón de fetch de ninguno de los dos archivos (`BookmarksPanel` ya usaba `apiFetch`;
`SnippetsPanel` sigue usando `fetch` crudo, mismo estado que tenía Notas antes de su propio fix — no
pedido ahora).

## Verificación

- `npx tsc --noEmit` limpio.
- `npx vite build` — 1676 módulos, sin errores.
- Sin infraestructura de testing en esta app (deuda ya trazada) — verificado manualmente en navegador
  real, mismo procedimiento que Notas (`vite dev` fuera de Docker + sesión sembrada en `localStorage`
  vía login real, datos de prueba con tags creados en BD):
  - **Bookmarks**: filtro por `#urgente` redujo la lista de 3 a 1 correctamente; autocompletado en
    "Nuevo bookmark" mostró las 4 sugerencias disponibles al enfocar el campo.
  - **Snippets**: filtro por `#urgente` redujo la lista de 3 a 1 correctamente; autocompletado filtró
    correctamente escribiendo "te" → sugirió `#test` y `#urgente` (ambos contienen "te" como
    substring); el detalle expandido de un snippet con tags ahora los muestra (`#urgente #util`),
    confirmando la paridad agregada.
  - Datos de prueba (2 bookmarks + 2 snippets) revertidos al terminar, junto con la contraseña
    temporal del usuario de prueba.

## Fuera de alcance

Migrar `SnippetsPanel.tsx`/`NotesPanel.tsx` de `fetch` crudo a `apiFetch` (inconsistencia ya señalada
en la auditoría original de Notas, no pedida en esta tarea).
