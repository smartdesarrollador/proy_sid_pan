# Notas (Workspace): las etiquetas nunca se guardaban — campo fantasma en el backend

**Fecha:** 2026-07-08
**Apps:** `apps/backend_django` (`apps/notes/`), `apps/frontend_workspace`
**Origen:** el usuario reportó, con dos capturas de `workspace.local.test/notes`, que junto a la
categoría de cada nota (p. ej. "Trabajo") no aparecía la etiqueta correspondiente, pidiendo que se
mostrara "al costado" para identificar rápido qué etiqueta tiene cada nota.

## Resumen

Lo que parecía un ajuste visual (mover el render de `tags` junto al badge de categoría) resultó ser
un bug de fondo: **el modelo `Note` nunca tuvo columna `tags`**. El formulario de creación/edición
(`NoteModal.tsx`) siempre tuvo un campo "Etiquetas" funcional en apariencia, pero el backend lo
descartaba silenciosamente en cada `POST`/`PATCH`, y `NoteSerializer.get_tags()` devolvía `[]`
siempre. Resultado: cualquier etiqueta que un usuario escribiera se perdía sin error visible.

## Diagnóstico

1. Primer pedido del usuario ("que aparezca la etiqueta junto a la categoría") se resolvió moviendo
   el render de `note.tags` desde una fila separada a la misma fila que `CategoryBadge`, dentro del
   footer de `NoteCard.tsx`. Cambio correcto pero insuficiente.
2. El usuario volvió a reportar con otra captura: seguía sin verse ninguna etiqueta, solo la
   categoría. La sospecha inicial (datos de las notas de prueba simplemente vacíos) se descartó
   revisando el modelo directamente:
   ```
   docker exec rbac_django python manage.py shell -c "Note.objects.filter(title='nota 2').first().tags"
   → AttributeError: 'Note' object has no attribute 'tags'
   ```
3. Confirmado en `apps/notes/views.py`: tanto `NoteListCreateView.post()` como
   `NoteDetailView.patch()` tenían `data.pop('tags', None)  # model has no tags field` /
   `if field == 'tags': continue  # model has no tags field` — descarte explícito, no accidental.
   `NoteSerializer.get_tags()` estaba hardcodeado a `return []`.

## Causa raíz

El campo "Etiquetas" del formulario (`NoteCreateUpdateSerializer.tags`) siempre existió en el
contrato de API, pero el modelo (`apps/notes/models.py`) nunca implementó el campo — probablemente
quedó pendiente de una iteración anterior. El resultado es un **campo fantasma**: el frontend lo
presenta como funcional, el serializer de entrada lo valida, pero nunca llega a persistirse ni a
volver en la respuesta.

## Solución

Se implementó tags igual que `Bookmark.tags` (patrón ya existente en el proyecto):

- `apps/notes/models.py`: `tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)`.
- Migración `0002_note_tags.py` (`makemigrations` + `migrate`).
- `apps/notes/serializers.py`: se quitó el `SerializerMethodField` hardcodeado; `tags` ahora es un
  campo real del `ModelSerializer` (DRF mapea `ArrayField` → `ListField` automáticamente).
- `apps/notes/views.py`: se quitaron los 3 puntos donde `tags` se descartaba explícitamente (create,
  update, import masivo).
- `apps/frontend_workspace/.../NoteCard.tsx`: los tags (`#tag`) ahora renderizan en la misma fila que
  `CategoryBadge`, con tope de 3 + indicador `+N`, en vez de una fila separada arriba del footer.

Verificado end-to-end: creación de nota con tags vía shell (persisten y serializan bien), y en
navegador real (Chrome DevTools MCP) editando una nota existente del tenant Empresa15 → las
etiquetas aparecen inmediatamente junto a "Trabajo" tras guardar y sobreviven a un reload.

## Resultado

- Backend: 13/13 tests de `apps/notes/` ✓. Suite completa: 652 passed, 10 failed —
  las 10 fallas son pre-existentes y no relacionadas (`auth_app` throttles, `chat_assistant`,
  `support`; no tocan `notes`).
- Frontend: 13/13 tests de `NotesPage` ✓.
- Confirmado visualmente en `workspace.local.test/notes`.

## Lección

Ver `LL-046` en la KB de lecciones aprendidas — un campo que el formulario expone y el serializer de
entrada valida no garantiza que el modelo lo persista; hay que verificar la cadena completa
(modelo → migración → serializer de salida → vista) cuando un dato "no aparece", no asumir que es
solo un problema de render.
