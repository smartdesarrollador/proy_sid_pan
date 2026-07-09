# Snippets: fix de campos fantasma `is_favorite` / `usage_count`

**Fecha:** 2026-07-08
**Apps:** `apps/backend_django` (`apps/snippets/`)
**Origen:** hallazgo de la auditoría de tags de Snippets de la misma sesión (ver
[reports/2026-07-08-snippets-filtro-y-sugerencias-tags.md](2026-07-08-snippets-filtro-y-sugerencias-tags.md)):
`is_favorite` (checkbox "Marcar como favorito" en `SnippetModal.tsx`, ícono de estrella en
`SnippetCard.tsx`) y `usage_count` existían en el frontend (`types.ts`) pero no en absoluto en el
modelo/serializers del backend — mismo patrón de "campo fantasma" que tenía `tags` en Notas
([[LL-046]]). El usuario pidió arreglarlo.

## Diagnóstico

Confirmado por auditoría previa (grep sin resultados de `is_favorite`/`usage_count` en todo
`apps/backend_django/apps/snippets/`): el checkbox del modal se enviaba en cada create/update
(`SnippetModal.tsx` línea 92-94), pero como el campo no existía en `CodeSnippetCreateUpdateSerializer`,
DRF lo descartaba silenciosamente (comportamiento por defecto de un serializer plano ante claves no
reconocidas — no hay ningún `# no field` explícito como tenía Notas, aquí simplemente nunca se
declaró el campo). El check nunca fallaba, nunca se veía error, pero tampoco persistía nada.

## Solución

- `apps/backend_django/apps/snippets/models.py`: `is_favorite = models.BooleanField(default=False)`,
  `usage_count = models.PositiveIntegerField(default=0)`. Además, ordering pasó de `['-created_at']`
  a `['-is_favorite', '-created_at']` (mismo patrón que `is_pinned` en Notas — los favoritos suben al
  principio de la lista, coherente con el propósito de marcar algo como favorito) + índice
  `['tenant', 'user', 'is_favorite']`. Migración `0002_...` generada y aplicada.
- `apps/backend_django/apps/snippets/serializers.py`: `is_favorite`/`usage_count` agregados a
  `CodeSnippetSerializer.Meta.fields`; `usage_count` además en `read_only_fields` (nunca se declaró
  en `CreateSnippetRequest`/`UpdateSnippetRequest` del frontend — no es client-settable, es un
  contador de servidor). `CodeSnippetCreateUpdateSerializer` gana
  `is_favorite = serializers.BooleanField(required=False, default=False)` — mismo patrón exacto que
  `is_pinned` en `NoteCreateUpdateSerializer`.
- No se tocó `views.py`: tanto create (`CodeSnippet.objects.create(..., **serializer.validated_data)`)
  como update (`for field, value in serializer.validated_data.items(): setattr(...)`) ya expanden
  todo `validated_data` genéricamente — `is_favorite` fluye automáticamente una vez declarado en el
  serializer, sin cambios adicionales.
- **Fuera de alcance, decisión deliberada:** no se implementó lógica de incremento de `usage_count`
  (ej. al copiar código) — el frontend nunca lo mostraba ni lo incrementaba, así que el campo queda
  como contador real en `0` por defecto, listo para que una feature futura decida cómo incrementarlo
  (la idea "más usados" ya estaba anotada en `BACKLOG.md` como pendiente de decisión de diseño, no se
  inventó ese comportamiento sin confirmar con el usuario). Tampoco se agregó un endpoint dedicado de
  toggle (`SnippetFavoriteView` al estilo `NotePinView`) — el frontend solo alterna el favorito desde
  el checkbox del modal de edición (la estrella en `SnippetCard.tsx` es de solo lectura, sin
  `onClick`), así que el fix mínimo (campo real + serializer) es suficiente para lo que la UI actual
  dispara.

## Verificación

- Backend: 14/14 tests de `apps/snippets/` (4 nuevos: create con `is_favorite=True`, toggle vía
  PATCH, `usage_count` de solo lectura en create incluso si se envía un valor, orden favoritos-primero).
  Suite completa: 668 passed, 10 fallos preexistentes sin relación (throttles/chat/support, ya
  trazados en `BACKLOG.md`).
- End-to-end en navegador real (tenant Empresa15): se marcó "snippet 1" como favorito desde el modal
  de edición, apareció la estrella junto al badge de lenguaje en la card, y **sobrevivió a un
  reload completo de la página** (antes del fix se hubiera perdido silenciosamente). Revertido al
  terminar.

## Lección

No se creó una entrada nueva en la KB — este es el mismo patrón exacto que [[LL-046]] (campo que el
frontend expone y el input serializer podría validar, pero el modelo nunca lo implementó), solo que
aquí el descarte era implícito (campo nunca declarado) en vez de explícito (`# model has no tags
field`). Vale la pena, en una futura pasada, hacer el mismo grep de auditoría
(`is_favorite|usage_count|<campo sospechoso>` en el backend de cada app) en otras features que tengan
checkboxes/contadores en el frontend, ya que este patrón lleva dos apariciones (Notas, Snippets) en el
mismo proyecto.
