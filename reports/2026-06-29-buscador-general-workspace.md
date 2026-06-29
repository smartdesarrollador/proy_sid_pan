# Buscador General (Workspace)

**Fecha:** 2026-06-29
**Apps:** `apps/backend_django` (nueva app `search`) · `apps/frontend_workspace`
**Tipo:** Feature — búsqueda global agregada multi-sección

---

## Resumen

Buscador general en el Workspace: una pestaña **"Buscar"** (icono lupa) en el grupo `GENERAL`
del sidebar abre la página `/search`, donde un único término consulta a la vez **9 tipos de
recurso** y devuelve resultados agrupados por sección, con resaltado del término y filtros
avanzados (por tipo y rango de fechas).

Arquitectura elegida: **agregador en backend** (`GET /api/v1/app/search/`) en vez de fan-out
de N peticiones desde el cliente. Motivos: aislamiento multi-tenant y feature-gating en un solo
punto, shape de respuesta uniforme, soporte para buscar mensajes de chat (que no tenían endpoint
de búsqueda), y base limpia para "filtros avanzados".

Tipos cubiertos: `notes`, `tasks`, `events`, `contacts`, `bookmarks`, `snippets`, `projects`,
`vault`, `messages` (chat).

---

## Backend

### Archivos nuevos
| Archivo | Contenido |
|---------|-----------|
| `apps/search/__init__.py` | — |
| `apps/search/apps.py` | `SearchConfig` |
| `apps/search/views.py` | `GlobalSearchView` + searchers por tipo + helpers |
| `apps/search/urls.py` | Ruta raíz → `GlobalSearchView` |
| `apps/search/tests/test_search.py` | 12 tests |

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `config/settings/base.py` | `'apps.search'` en `LOCAL_APPS` |
| `config/urls.py` | `path('search/', include('apps.search.urls'))` dentro de `/api/v1/app/` |

### Endpoint
`GET /api/v1/app/search/`
- Params: `q` (obligatorio, **mín. 2 chars** → 400 `invalid_query`), `types` (CSV opcional),
  `date_from`/`date_to` (filtran `created_at`), `limit` (def. 5, máx 20 por tipo).
- Respuesta: `{ query, total, groups: [{ type, label, count, results: [{ type, id, title, snippet, url, created_at }] }] }`.
- Permission: `IsAuthenticated`.

### Aislamiento por tipo (mismo scoping que cada feature)
| type | Modelo | Scoping | Campos buscados | URL |
|------|--------|---------|-----------------|-----|
| notes | `Note` | tenant + user | title, content | `/notes` |
| tasks | `Task` | tenant | title, description | `/tasks` |
| events | `CalendarEvent` | tenant + user | title, description, location | `/calendar` |
| contacts | `Contact` | tenant + user | first_name, last_name, email, company, notes | `/contacts` |
| bookmarks | `Bookmark` | tenant + user | title, url, description | `/bookmarks` |
| snippets | `CodeSnippet` | tenant + user | title, description, code | `/snippets` |
| projects | `Project` | tenant | name, description | `/projects` |
| vault | `VaultItem` | tenant + user | **solo `title`** | `/vault` |
| messages | `chat.Message` | membresía de conversación + `deleted_at IS NULL` | content | `/chat?conversation=<id>` |

### Notas de seguridad
- **Chat:** los mensajes se filtran por `conversation__members__user=request.user`; nunca se
  exponen mensajes de conversaciones ajenas ni borrados.
- **Bóveda:** se busca y se devuelve **únicamente el `title`** (texto plano en BD). El campo
  cifrado `data_ciphertext` no se consulta ni se serializa, por lo que no se filtra ningún dato
  sensible aunque la consulta coincida con el contenido cifrado. El `snippet` muestra solo la
  etiqueta no sensible del tipo (Login / API Key / Nota segura / Tarjeta). No requiere
  `X-Vault-Token`.

---

## Frontend

### Archivos nuevos
- `src/hooks/useDebouncedValue.ts` — debounce genérico (300 ms).
- `src/features/search/types.ts` — tipos + `TYPE_LABELS`, `TYPE_ICONS`, `ALL_TYPES`, `EMPTY_FILTERS`.
- `src/features/search/hooks/useGlobalSearch.ts` — TanStack Query, queryKey `['global-search', q, filters]`, `enabled` con `q.length >= 2`, `staleTime 30s`.
- `src/features/search/components/SearchInput.tsx` — input con lupa + botón limpiar (autofocus).
- `src/features/search/components/AdvancedFilters.tsx` — panel colapsable: chips de tipo (multi-select) + rango de fechas.
- `src/features/search/components/ResultGroup.tsx` — encabezado de sección con label + count.
- `src/features/search/components/ResultItem.tsx` — título + snippet con `<mark>` resaltado; navega a `item.url`.
- `src/features/search/SearchPage.tsx` — orquesta input + filtros + resultados; estados hint/loading/empty/error; sincroniza `q` con `?q=` en la URL.
- `src/pages/SearchPage.tsx` — re-export (convención del repo).
- `src/features/search/__tests__/SearchPage.test.tsx` — 5 tests.

### Archivos modificados
- `src/router/index.tsx` — ruta lazy `path: 'search'`.
- `src/layouts/components/Sidebar.tsx` — item "Buscar" (icono `Search`) en grupo `GENERAL`.

---

## Cambio colateral: spam de consola del chat

Durante las pruebas en navegador aparecían errores repetidos de `useChatSocket.ts` (WebSocket a
`/ws/chat/` que no conecta en entornos sin ASGI → reconexión infinita con backoff). Se acotó:

- `src/features/chat/hooks/useChatSocket.ts` — `MAX_RECONNECT_ATTEMPTS = 4`: tras 4 reintentos se
  deja de reconectar y se confía en el fallback de polling. El contador se resetea en cada
  conexión exitosa (`onopen`).

> Nota: la línea nativa *"WebSocket connection … failed"* la emite el navegador por cada intento
> y no es suprimible desde JS; lo único controlable es el número de intentos. La causa raíz
> (servir el backend sobre ASGI/Daphne) sigue como deuda en el BACKLOG (Chat Fase 3).

---

## Verificación

- **Backend:** `apps.search` → **12/12 tests OK**, incluyendo aislamiento cross-tenant,
  aislamiento de membresía de chat, exclusión de mensajes borrados, y que la Bóveda no busca ni
  expone el ciphertext.
- **Frontend:** `npm run typecheck` ✓ · tests de search **5/5** ✓ · `npm run build` ✓
  (2946 módulos). Tests del chat **16/16** ✓ tras el ajuste de reconexión.
- Suite frontend completa: 215/217 (2 fallos **pre-existentes** en `ProtectedRoute` y
  `SSOCallbackPage`, sin relación; ya registrados en BACKLOG).

> El build local `npm run build` falla por permisos al borrar `dist/` (propiedad de `root` de un
> build previo en contenedor); se verificó con `--outDir` temporal → build limpio.

---

## Pendiente (Fase 2)

- Incluir env-vars, ssh-keys, ssl-certs y forms respetando su feature-gating.
- Si crece el volumen, migrar de `icontains` a Postgres full-text (`SearchVector`/`SearchRank`).
- Opcional: command palette ⌘K reutilizando el mismo hook/endpoint.
