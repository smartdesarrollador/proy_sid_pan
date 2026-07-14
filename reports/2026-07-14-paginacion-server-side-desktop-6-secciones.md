# Paginación server-side en el sidebar Desktop — 6 secciones (Tareas, Notas, Bookmarks, Contactos, Snippets, Bóveda)

**Fecha:** 2026-07-14
**App:** `apps/frontend_sidebar_desktop` (backend sin cambios)
**Origen:** seis capturas de pantalla del usuario, una por sección, pidiendo sucesivamente
"implementa paginación con el mismo enfoque" a medida que se confirmaba cada una — misma
dinámica que el trabajo análogo del día anterior en `frontend_workspace`
(ver [reports/2026-07-13-paginacion-server-side-workspace-6-secciones.md](2026-07-13-paginacion-server-side-workspace-6-secciones.md)).

## Contexto

El backend ya quedó 100% listo desde la sesión de Workspace (2026-07-13): los seis endpoints
(`tasks`, `notes`, `contacts`, `bookmarks`, `snippets`, `vault`) soportan paginación opt-in vía
`?page=`, con tests completos en cada módulo. El trabajo de esta sesión fue **exclusivamente
frontend**, en la app Tauri del sidebar (`frontend_sidebar_desktop`), que no comparte código con
`frontend_workspace` y que además **no usa TanStack Query** (a diferencia del Workspace) — corre
sobre `useState`/`useEffect`/`useCallback` a mano con un helper HTTP propio (`apiFetch`, con
refresh automático de token en 401).

## El patrón común (establecido en Tareas, reutilizado 5 veces)

- **Decisión de arquitectura explícita** (confirmada con el usuario antes de empezar): no
  introducir TanStack Query en el paquete desktop solo para esto — replicar la convención ya
  existente del proyecto (hooks custom por feature, como ya hacían `useVaultItems.ts`/
  `useGlobalSearch.ts`), evitando una dependencia nueva y cambios en `main.tsx`.
- **Hook de listado** `useX({ filtro1, filtro2, search, page, perPage })` por sección, con
  `AbortController` para cancelar requests obsoletos, mandando **siempre** `page`/`per_page`
  (el backend responde el shape legado sin `pagination` si se omite `page`).
- **Hook de mutaciones** `useXMutations(onMutated)` — `create`/`update`/`remove` (y `togglePin` en
  Notas) vía `apiFetch`, cada uno dispara `onMutated()` tras éxito; el panel decide qué refetchear.
- **Componente `Pagination.tsx`** — creado una única vez en Tareas (inicialmente en
  `features/tasks/components/`), promovido a `src/components/shared/Pagination.tsx` en cuanto
  Notas lo necesitó como segundo consumidor, y reutilizado tal cual en las 4 secciones restantes
  (sexto consumidor: Bóveda). Controlado (`page`/`perPage`/`total`/`onPageChange`), no renderiza
  nada si `total===0` o si cabe todo en una sola página.
- **Debounce del buscador** con `useDebouncedValue` (350ms, hook ya existente en
  `features/search/`), ausente en todos los paneles antes de esta migración.
- **`hasActiveFilters`** — bandera introducida a partir de Notas: con filtrado server-side, "no
  hay elementos" y "sin resultados de un filtro" devuelven ambos un array vacío, así que hizo
  falta distinguirlos explícitamente en vez de comparar dos arrays como antes (client-side).
- Reset a página 1 al cambiar cualquier filtro, reset de scroll al cambiar de página, y
  auto-fallback a página 1 si la página actual queda vacía (por ejemplo, al borrar el último ítem
  de la última página).

## Sección por sección

### 1. Tareas — patrón base

Primera migración, definió el patrón completo: `useTasks`/`useTaskMutations`/
`useTaskStatusCounts` (4 requests paralelas `per_page=1`, uno por status — viable porque
`status` es un enum fijo de solo 4 valores) y el componente `Pagination.tsx` original. También se
aprovechó para migrar `TasksPanel.tsx` de `fetch` nativo con headers manuales a `apiFetch`.

### 2. Notas — fijadas siempre completas, nunca paginadas

Igual que en Workspace: el backend devuelve todas las notas fijadas (`is_pinned`) completas +
una página de no-fijadas en el mismo array `notes`. `pagination.total` refleja solo el total de
no-fijadas. Se agregaron fórmulas explícitas: `pinnedCount` (contando `is_pinned` sobre la
respuesta actual, que siempre trae el set completo de fijadas), `headerCount = pinnedCount +
pagination.total`, y el auto-fallback de página vacía basado en la porción **no-fijada** de la
respuesta (no en `notes.length`, que nunca es 0 si hay fijadas). Categorías y tags dejaron de
derivarse del array cargado — categorías usan el `notes_count` ya calculado por `/categories/`
(cero requests extra), tags migraron a consumir `/tags/` (endpoint existente pero no usado hasta
ahora). Se promovió `Pagination.tsx` a `components/shared/` en este paso.

### 3. Bookmarks — listado plano simple

Sin sección especial (`is_favorite` solo ordena, no separa la paginación). Colecciones migradas a
`bookmarks_count` server-side, tags a `/tags/`. Se preservó intacta la feature "Pegar URL"
(detección de URL en el portapapeles) y `CollectionManager`, ninguna dependiente del array
paginado.

### 4. Contactos — el más simple de los "planos"

Grupo es un FK único (no un array de tags como notes/bookmarks), así que solo hay un filtro de
agrupación. Confirmado que este panel no tiene UI de gestión de grupos (a diferencia de
Notas/Bookmarks) — fuera de alcance, no se agregó. Selección múltiple + compartir en bloque
(`BulkSelectBar`/`ShareBlock`) pasó a operar sobre la página cargada, mismo criterio que las demás
secciones.

### 5. Snippets — el único panel que aún usaba `fetch` nativo

A diferencia de las cuatro secciones anteriores (que ya usaban `apiFetch`), `SnippetsPanel.tsx`
seguía con `fetch` nativo + headers de auth manuales — incluyendo varios `console.log` de debug,
uno de los cuales imprimía los primeros 20 caracteres del access token. Se migró a `apiFetch`
como parte de esta tarea (mismo salto que tuvo Tareas) y se eliminaron todos los logs de debug.
**Decisión de diseño consultada con el usuario**: `language` es un enum fijo de 14 valores sin
endpoint de "presencia" (a diferencia de categorías/grupos/tags, que sí tienen conteo o endpoint
dedicado). En vez de replicar el patrón de N requests paralelas de Tareas (ahí viable con 4
valores), se optó por **mostrar siempre las 14 pills de lenguaje** sin filtrar por presencia —
cero requests extra, a costa de un cambio de UX menor (antes solo se mostraban los lenguajes
realmente usados).

### 6. Bóveda — la migración más simple de las seis

Dos razones estructurales ya existentes en el código lo permitieron: (1) el hook de mutaciones
(`useVaultItemMutations.ts`) ya estaba extraído y ya seguía el patrón correcto (`onMutated`-like),
sin requerir ningún cambio; (2) `VaultPanel.tsx` ya resolvía el refetch tras crear/editar/eliminar
con un patrón de "remount por `key`" (`<ItemList key={refetchKey} .../>`), que resetea todo el
estado local — incluida la nueva página — sin lógica adicional. Solo se tocaron `types.ts`
(tipos de paginación), `useVaultItems.ts` (agregar `page`/`per_page`/`AbortController`) e
`ItemList.tsx` (debounce, `Pagination`, `hasActiveFilters`). El listado nunca descifra contenido
(`VaultItemListSerializer` solo expone metadata), así que paginar no interactúa con el candado
`X-Vault-Token`. Cierra el ítem de "Ideas de feature" que había quedado pendiente explícitamente
en el reporte de Workspace del día anterior.

## Verificación

- **Backend**: sin cambios — ya validado con 68 tests nuevos en la sesión de Workspace
  (2026-07-13), reutilizados tal cual por este trabajo.
- **Frontend**: `frontend_sidebar_desktop` **no tiene infraestructura de testing** (sin `vitest`,
  deuda ya registrada en el Backlog desde 2026-07-08). Verificación por sección: `npx tsc --noEmit`
  y `npx vite build` limpios tras cada uno de los 6 paneles, sin warnings nuevos.
- **Manual**: **confirmado por el usuario en su entorno real** tras probar las 6 secciones
  ("ya probé y todo está bien").

## Deuda técnica / decisiones a revisar generadas durante el trabajo

- **Pills de lenguaje de Snippets ya no reflejan uso real**: se muestran las 14 siempre, en vez de
  solo las presentes en los datos del usuario (como sí ocurre con categorías/grupos/tags en
  notes/bookmarks/contacts, que tienen conteo server-side). Si se agrega un endpoint de "lenguajes
  presentes" en el backend, se puede revertir a filtrar por presencia sin tocar el resto del
  patrón.
- Ninguna otra deuda nueva — a diferencia de la sesión de Workspace (que encontró bugs reales en
  Contactos y Bookmarks), el backend ya llegó validado y sin sorpresas a esta sesión.

## Archivos clave (patrón repetido, no exhaustivo)

- `apps/frontend_sidebar_desktop/src/lib/apiFetch.ts` (helper HTTP centralizado, ya existente,
  reutilizado/generalizado a Snippets en esta sesión).
- `apps/frontend_sidebar_desktop/src/components/shared/Pagination.tsx` (nuevo, único, promovido
  desde `features/tasks/components/`, reutilizado 6 veces).
- `apps/frontend_sidebar_desktop/src/features/{tasks,notes,bookmarks,contacts,snippets,vault}/`
  (`types.ts`, `hooks/use*.ts`) y los paneles correspondientes en
  `src/components/panels/{Tasks,Notes,Bookmarks,Contacts,Snippets,Vault}Panel.tsx` (Bóveda vive en
  `src/features/vault/components/ItemList.tsx`, no en un panel directo).
- `apps/frontend_sidebar_desktop/src/features/search/hooks/useDebouncedValue.ts` (ya existente,
  reutilizado en las 6 secciones).
