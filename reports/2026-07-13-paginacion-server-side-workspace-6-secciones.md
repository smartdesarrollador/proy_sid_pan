# Paginación server-side en Workspace — 6 secciones (Tareas, Notas, Contactos, Bookmarks, Snippets, Bóveda)

**Fecha:** 2026-07-13
**App:** `apps/backend_django` · `apps/frontend_workspace`
**Origen:** seis capturas de pantalla del usuario, una por sección, pidiendo sucesivamente
"implementa paginación con el mismo enfoque" a medida que se confirmaba cada una.

## Contexto

Las seis secciones de listado más grandes del Workspace (Tareas, Notas, Contactos, Bookmarks,
Snippets, Bóveda) traían **todos** los registros del tenant/usuario en una sola respuesta sin
paginar. El pedido fue incremental: se diseñó e implementó el patrón completo en Tareas primero,
y luego se replicó — con los ajustes que cada módulo requería — en las cinco secciones restantes,
una por turno, en el mismo estilo de trabajo (analizar → plan → aprobación → implementación →
verificación → backlog).

## El patrón común (establecido en Tareas, reutilizado 5 veces)

- **Backend**: paginación **opt-in vía la presencia del query param `page`**. Sin `page`, el
  endpoint conserva el comportamiento/shape actual exacto (compatibilidad total con cualquier otro
  consumidor que no lo mande). Con `page`: `qs.count()` para el total, `page`/`per_page` parseados
  con `try/except` + clamps (`per_page` default 20, máx 100), slice `qs[offset:offset+per_page]`,
  respuesta `{<recurso>: [...], pagination: {page, per_page, total}}`. Patrón tomado de dos vistas
  ya existentes en el repo (`audit/views.py`, `notifications/views.py`) para mantener consistencia.
- **Frontend**: hook `useX(filters, page)` (o `useX(filters, page, paginate)` cuando existe una
  vista alternativa que necesita el dataset completo — solo aplicó a Tareas/Kanban), tipo
  `XPagination` en `types.ts`, componente nuevo y genérico `components/shared/Pagination.tsx`
  (botones Anterior/Siguiente + "Página X de Y", `aria-label`, `disabled` en extremos, retorna
  `null` si `total===0`) creado una vez y reutilizado tal cual en las 6 secciones. La página
  contenedora mantiene `page` en estado sincronizado con `useSearchParams` (`?page=`), resetea a
  página 1 al cambiar cualquier filtro, y donde existía exportación (CSV/JSON/vCard/HTML/zip) se
  cambió a un fetch aparte **sin** `page` para seguir exportando todo lo filtrado, no solo la
  página visible.

## Sección por sección

### 1. Tareas — vista Kanban debía seguir sin paginar

Único módulo con una vista alternativa (`TaskKanbanView`) que necesita el tablero completo para
agrupar por estado. Se resolvió con un flag `paginate: boolean` en `useTasks(filters, page,
paginate)`: `paginate=false` en Kanban simplemente no manda `page`/`per_page`, aprovechando el
diseño opt-in — cero comportamiento especial en el backend. Esto también preservó intacto a
`useRecentActivity.ts` (widget del dashboard, otro consumidor de `/app/tasks/` que tampoco manda
`page`) — aunque se descubrió que ese hook ya estaba roto por un mismatch de shape preexistente
(`{results}` esperado vs. `{tasks}` real), anotado como deuda, no corregido (fuera de alcance).
11 tests backend, componente `Pagination.tsx` creado aquí.

### 2. Notas — fijadas siempre completas, nunca paginadas

Único módulo con una sección "especial": las notas fijadas (`is_pinned`) se muestran siempre
completas en un bloque aparte arriba de la grilla — decisión explícita del usuario de preservar
ese comportamiento sin límite. El backend devuelve, cuando hay `page`, **todas** las fijadas +
una página de no-fijadas concatenadas en un único array `notes` (el propio `Meta.ordering =
['-is_pinned', '-created_at']` ya las ordena primero). `pagination.total` refleja solo el total de
no-fijadas, para que `totalPages` sea coherente con lo que realmente pagina. 14 tests backend.

### 3. Contactos — bug de query param corregido

Bug preexistente encontrado y corregido como parte del trabajo: `useContacts.ts` mandaba
`group_id` como nombre de parámetro, pero el backend solo reconocía `group` — el filtro de grupo
nunca se aplicaba server-side, "funcionaba" solo porque el frontend refiltraba en memoria el array
completo. Inofensivo mientras el backend traía todo; se habría roto en cuanto solo llegara una
página. 11 tests backend.

### 4. Bookmarks — listado plano simple

Sin sección especial (`is_favorite` solo ordena) y sin mismatch de query params. Se encontró (no
se corrigió, se anotó como deuda técnica) un bug independiente: al combinar `search`+`collection`,
la rama de búsqueda por URL del filtro (`Bookmark.objects.filter(...)` armado desde cero para el
`OR`) no hereda el filtro de colección ya aplicado — resultados de otras colecciones se cuelan.
11 tests backend.

### 5. Snippets — primer módulo sin shape legado que preservar

Único módulo cuyo shape ya era limpio (`{'snippets': [...]}`, nunca tuvo el
`{results, count, recurso}` duplicado de los otros cuatro) — la rama sin `page` no cambió en
absoluto. De paso se corrigió un mock MSW que ya estaba desalineado del shape real desde antes de
esta tarea. 11 tests backend.

### 6. Bóveda — sin fricción de cifrado, alcance limitado a Workspace

Analizado primero, implementado después de confirmación explícita. El listado de ítems nunca
descifra nada (`VaultItemListSerializer` solo expone metadata: `id/title/item_type/favorite/
fechas`; el descifrado real solo ocurre al revelar un ítem individual), y el candado
`X-Vault-Token` (423) no aplica al listado — paginar no interactúa con el modelo de cifrado. Se
pagina solo `items` (propios); `sharedItems` (bóveda compartida) sigue sin paginar, mismo criterio
que las fijadas de Notas. Se corrigió el contador combinado del header
(`items.length + sharedItems.length` → `pagination.total + sharedItems.length`, que antes solo
contaba la página actual). **Explícitamente fuera de alcance**: `frontend_sidebar_desktop`
consume el mismo endpoint con un hook propio duplicado (`apiFetch`, no TanStack Query) — el
backend ya queda listo (opt-in) para cuando se aborde esa app por separado, sin requerir cambios
de backend en ese momento. 10 tests backend (ítems creados directo por ORM con
`data_ciphertext` dummy, ya que el listado nunca lee ese campo — evita el costo de cifrar 25 veces
por test).

## Verificación

- **Backend**: 68 tests nuevos en total (11+14+11+11+11+10), suite completa pasó de **772 → 840**
  tests a lo largo de la sesión, con los **mismos 10 fallos preexistentes y no relacionados**
  (`auth_app` throttles, `chat_assistant` sessions, `support` tickets) confirmados en cada corrida,
  nunca tocando los archivos modificados. `ruff check` y `mypy` limpios en cada módulo tocado
  (los únicos hallazgos de `mypy` fueron patrones preexistentes ajenos, tipo "Need type annotation"
  en `models.py` de Django o falsos positivos en relaciones inversas).
- **Frontend**: suite completa corrida de principio a fin desde Contactos en adelante (lección
  aprendida en la sesión de Notas: un cambio de shape del mock de Tareas se había filtrado a un
  test genérico fuera del feature, `handlers.test.ts`, y no se detectó hasta correr la suite
  completa por primera vez). Progresión: 324/326 → 328/330 → 332/334 → 336/338 → 341/343, con los
  **mismos 2 fallos preexistentes** (`ProtectedRoute.test.tsx`, `SSOCallbackPage.test.tsx`, ya
  documentados en este `BACKLOG.md` desde antes de esta sesión) en cada corrida. `eslint` y
  `tsc --noEmit` limpios en todos los archivos tocados.
- **Manual**: confirmado por el usuario en su entorno real tras probar la paginación de las 6
  secciones.

## Deuda técnica generada durante el trabajo

- **`useRecentActivity.ts` (widget "tareas recientes" del dashboard) roto** — mismatch de shape
  preexistente (`{results}` esperado vs. `{tasks}` real), no introducido ni agravado por este
  trabajo. Ver entrada en Deuda técnica.
- **`BookmarkListCreateView.get` pierde el filtro de colección al combinar `search`+`collection`**
  — bug preexistente e independiente de la paginación. Ver entrada en Deuda técnica.
- **Paginación de Bóveda en `frontend_sidebar_desktop`** — trabajo futuro opcional, backend ya
  preparado (opt-in), requiere solo un hook y un componente de paginación propios en esa app
  (Tauri separada, no comparte código con `frontend_workspace`).

## Archivos clave (patrón repetido, no exhaustivo)

- Backend: `apps/backend_django/apps/{tasks,notes,contacts,bookmarks,snippets,vault}/views.py`
  (+ `tests/test_*.py` de cada módulo).
- Frontend: `apps/frontend_workspace/src/components/shared/Pagination.tsx` (nuevo, único,
  reutilizado 6 veces), `apps/frontend_workspace/src/features/{tasks,notes,contacts,bookmarks,
  snippets,vault}/{types.ts, hooks/use*.ts, *Page.tsx, __tests__/*Page.test.tsx}`,
  `apps/frontend_workspace/src/test/handlers/*.ts` (mocks MSW).
