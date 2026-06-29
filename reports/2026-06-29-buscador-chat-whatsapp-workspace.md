# Buscador de Chat estilo WhatsApp (Workspace)

**Fecha:** 2026-06-29
**Apps:** `apps/backend_django` (app `chat`) · `apps/frontend_workspace`
**Tipo:** Feature / fix — búsqueda de conversaciones + mensajes dentro del Chat

---

## Resumen

El buscador de la sección Chat solo filtraba **nombres** de conversaciones ya cargadas y **no
buscaba mensajes** (no existía endpoint ni lógica). Se implementó una búsqueda estilo WhatsApp:
al escribir en el buscador del chat, la lista se transforma en resultados **agrupados** en dos
secciones — **"Chats"** (coincidencias por nombre) y **"Mensajes"** (coincidencias por contenido
en todas las conversaciones del usuario). Clic en cualquier resultado abre la conversación.

Decisión de alcance (confirmada con el usuario): solo Workspace; clic abre la conversación en su
última página (sin salto/scroll al mensaje exacto — eso quedaría como mejora futura por requerir
paginación bidireccional en el backend).

---

## Backend (`apps/chat`)

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `apps/chat/views.py` | Nueva `ChatSearchView` + helpers `_conversation_display_name` y `_chat_snippet` |
| `apps/chat/urls.py` | `path('search/', ChatSearchView.as_view(), name='chat-search')` |
| `apps/chat/tests/test_search.py` | **NUEVO** — 5 tests |

### Endpoint
`GET /api/v1/app/chat/search/?q=<término>`
- `q` < 2 chars → `{ query, messages: [] }` (sin error, para no romper la UX al teclear).
- Busca `content__icontains` en `Message`, scopeado por `conversation__members__user=request.user`,
  excluye `deleted_at` no nulo, ordena por `-created_at`, límite **50**.
- Resuelve `conversation_name` con la misma lógica que `ConversationListSerializer.get_display_name`
  (directo → nombre del otro miembro; grupo → `name`; self → "Mensajes guardados").
- Respuesta: `{ query, messages: [{ message_id, conversation_id, conversation_name, snippet, sender_name, created_at }] }`.

### Seguridad
- Aislamiento por **membresía**: nunca devuelve mensajes de conversaciones donde el usuario no es
  miembro. Excluye mensajes borrados. Mismo principio que el buscador general (`messages`).

---

## Frontend (`apps/frontend_workspace/src/features/chat`)

### Archivos nuevos
- `hooks/useChatSearch.ts` — TanStack Query, queryKey `['chat-search', q]`, `enabled` con `q.length >= 2`, `staleTime 15s`.
- `components/MessageSearchResult.tsx` — avatar de la conversación + nombre + `remitente: snippet` con resaltado `<mark>`; clic → `onSelect(conversation_id)`.

### Archivos modificados
- `types.ts` — `ChatMessageSearchResult`, `ChatSearchResponse`.
- `components/ConversationList.tsx` — debounce (`useDebouncedValue`, 300 ms) + `useChatSearch`. Al
  buscar (≥2 chars) renderiza secciones **"Chats"** (filtro de nombre client-side sobre conversaciones
  cargadas) y **"Mensajes"** (resultados del backend), con estados "Buscando…" y "Sin resultados".
  Sin término: lista normal con "Mensajes guardados" fijado. Placeholder → "Buscar chats o mensajes".

### Comportamiento (paridad WhatsApp)
- Nombres: instantáneo (client-side sobre lo cargado).
- Mensajes: backend con debounce.
- Clic en resultado de mensaje → `handleSelect` abre la conversación (ya estaba en `ChatPage`); el
  mensaje pertenece a una conversación del usuario, así que está en la lista cargada y el thread carga.

---

## Verificación

- **Backend:** `apps.chat.tests.test_search` → **5/5 OK** (match de contenido + nombre de
  conversación, aislamiento por membresía, exclusión de borrados, min length, nombre de grupo).
- **Frontend:** `npm run typecheck` ✓ · tests del chat **16/16** ✓ · `npm run build` ✓
  (verificado con `--outDir` temporal por el tema de permisos de `dist/`).

---

## Pendiente / mejora futura

- **Saltar y resaltar el mensaje exacto** al hacer clic en un resultado de mensaje (no solo abrir la
  conversación). Requiere soporte backend de "cargar contexto alrededor de un mensaje" (paginación
  bidireccional desde un `message_id`), ya que hoy la carga es por cursor `before` hacia atrás.
- Portar el mismo buscador al **ChatPanel del sidebar desktop** (Tauri) si se desea paridad.
