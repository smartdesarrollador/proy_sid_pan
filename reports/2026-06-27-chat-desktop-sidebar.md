# Chat en el Desktop Sidebar (Tauri v2)

**Fecha:** 2026-06-27
**Estado:** ✅ Implementado — TypeScript compila sin errores
**Área:** `apps/frontend_sidebar_desktop/src/features/chat/` · `components/panels/ChatPanel.tsx`

> Reutiliza los mismos endpoints del backend del chat ya implementado en
> [`reports/2026-06-26-chat-workspace-3-fases.md`](2026-06-26-chat-workspace-3-fases.md).
> No se tocó el backend ni el frontend_workspace.

---

## Contexto

El `ChatPanel.tsx` del desktop era un placeholder de 8 líneas. El usuario pidió implementar el chat
completo en el sidebar desktop, reutilizando los mismos endpoints de la API `/api/v1/app/chat/`, con
la restricción principal de que el contenedor es angosto (200–600 px, default 320 px).

**Decisiones de diseño clave:**

| Decisión | Razón |
|----------|-------|
| Sin `@tanstack/react-query` | Todos los paneles del desktop usan `useState` + `apiFetch`; se mantiene la consistencia |
| Layout drill-down (lista → thread) | No hay espacio para un layout side-by-side como en el workspace |
| Vistas inline para "nuevo chat" y "conexiones" | Reemplazan los modales del workspace que no caben en el panel angosto |
| Polling adaptivo | Rápido cuando el WebSocket cae, lento cuando está vivo (igual que workspace) |

---

## Arquitectura implementada

### Estructura de archivos (25 archivos nuevos)

```
apps/frontend_sidebar_desktop/src/
├── features/chat/
│   ├── types.ts              ← tipos idénticos al workspace
│   ├── utils.ts              ← helpers de tiempo y avatar (idénticos)
│   ├── ws.ts                 ← deriveWsUrl adaptado a VITE_API_URL del desktop
│   ├── hooks/
│   │   ├── useChatSocket.ts        ← WebSocket con callbacks en vez de queryClient
│   │   ├── useConversations.ts     ← GET /api/v1/app/chat/conversations/
│   │   ├── useMessages.ts          ← GET /api/v1/app/chat/messages/?conversation=...
│   │   ├── useSendMessage.ts       ← POST /api/v1/app/chat/messages/
│   │   ├── useCreateConversation.ts← POST /api/v1/app/chat/conversations/
│   │   ├── useConnections.ts       ← GET /api/v1/app/chat/connections/
│   │   ├── useChatUsers.ts         ← GET /api/v1/app/chat/users/
│   │   ├── useSelfConversation.ts  ← POST /api/v1/app/chat/conversations/self/
│   │   ├── useMarkRead.ts          ← POST /api/v1/app/chat/conversations/{id}/read/
│   │   ├── useConvertMessage.ts    ← POST /api/v1/app/chat/messages/{id}/convert/
│   │   ├── useInviteConnection.ts  ← POST /api/v1/app/chat/connections/
│   │   ├── useRespondConnection.ts ← POST /api/v1/app/chat/connections/{id}/respond/
│   │   └── useLeaveConversation.ts ← DELETE /api/v1/app/chat/conversations/{id}/
│   └── components/
│       ├── Avatar.tsx              ← igual al workspace, dark theme siempre
│       ├── ConvertMenu.tsx         ← adaptado dark: bg-[#1e1e2e], border-white/10
│       ├── ConversationItem.tsx    ← avatar 32px (workspace: 40px), dark
│       ├── ConversationList.tsx    ← sin modal de nuevo chat, botón → setView
│       ├── MessageBubble.tsx       ← max-w-[85%] (workspace: 75%), dark theme
│       ├── MessageComposer.tsx     ← con adjuntos, respuestas, dark theme
│       ├── MessageThread.tsx       ← agrupación por día + typing indicator
│       ├── NewChatView.tsx         ← NUEVO: vista inline buscar/crear conversación
│       └── ConnectionsView.tsx     ← NUEVO: vista inline gestión de conexiones
└── components/panels/
    └── ChatPanel.tsx               ← orquestador, reemplaza placeholder
```

### Máquina de vistas en ChatPanel

```
ChatView = 'list' | 'thread' | 'new-chat' | 'connections'

list ──[onSelect(id)]──► thread
list ──[onNewChat()]───► new-chat
list ──[onConnections]─► connections
thread ──[onBack()]────► list
thread ──[leave]───────► list  (+ refetch)
new-chat ──[onCreate]──► thread
connections ──[onBack]─► list
```

### Patrón de hooks (sin React Query)

En vez de `useQuery`/`useMutation`, cada hook sigue el patrón del resto del desktop:

```typescript
// Lectura
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const fetch = useCallback(async () => {
  const res = await apiFetch('/api/v1/app/chat/...')
  if (res.ok) setData(await res.json())
}, [])
useEffect(() => { fetch(); /* interval */ }, [fetch])
return { data, loading, refetch: fetch }

// Mutación
const [loading, setLoading] = useState(false)
const action = async (payload) => {
  setLoading(true)
  const res = await apiFetch('/api/v1/app/chat/...', { method: 'POST', body: ... })
  if (res.ok) onSuccess?.()
  setLoading(false)
}
```

### Adaptación del WebSocket

El workspace usa `queryClient.invalidateQueries` para propagar actualizaciones en tiempo real.
Sin React Query, `useChatSocket` recibe callbacks:

```typescript
interface ChatSocketCallbacks {
  onNewMessage: (msg: Message) => void   // append al thread + refetch lista
  onTyping:    (convId, userName) => void
  onPresence:  (userId, online) => void
  onMembership: () => void               // refetch conversaciones
}
```

El `ChatPanel` usa `useRef` para mantener referencias estables a `appendMessage` y
`refetchConversations`, evitando stale closures en los callbacks del socket sin romper
las reglas de hooks.

### Polling adaptivo (igual que workspace)

| Hook | WS activo | WS caído |
|------|-----------|----------|
| useConversations | 30 s | 5 s |
| useMessages | 20 s | 3 s |
| useConnections | 15 s | 15 s (fijo) |

Cuando el WebSocket se recupera (`connected` cambia a `true`) los intervalos se alargan
automáticamente vía `useEffect` sobre `wsConnected`.

---

## Adaptaciones visuales para panel angosto

| Elemento | Workspace | Desktop sidebar |
|----------|-----------|-----------------|
| Avatar en lista | 40 px | 32 px |
| Ancho máximo burbuja | `max-w-[75%]` | `max-w-[85%]` |
| Tema | light / dark toggle | Siempre oscuro (`bg-[#13131f]`) |
| Nuevo chat | Modal overlay | Vista inline (`view='new-chat'`) |
| Gestión conexiones | Modal overlay | Vista inline (`view='connections'`) |
| Group info panel | Panel lateral | No implementado (sin espacio) |
| Item activo | `bg-primary-900/30` | `bg-white/10` |
| Input | light / dark | `bg-white/5 border-white/10 text-gray-200` |
| Skeletons | `bg-gray-200 dark:bg-gray-700` | `bg-white/10` |
| Tamaño texto burbujas | `text-sm` | `text-xs` |
| Padding interno | `p-4` | `p-3` / `p-2.5` |

---

## Endpoints reutilizados (sin cambios en el backend)

| Método | Endpoint | Usado en |
|--------|----------|----------|
| GET | `/api/v1/app/chat/conversations/` | useConversations |
| POST | `/api/v1/app/chat/conversations/` | useCreateConversation |
| POST | `/api/v1/app/chat/conversations/self/` | useSelfConversation |
| POST | `/api/v1/app/chat/conversations/{id}/read/` | useMarkRead |
| DELETE | `/api/v1/app/chat/conversations/{id}/` | useLeaveConversation |
| GET | `/api/v1/app/chat/messages/?conversation={id}` | useMessages |
| POST | `/api/v1/app/chat/messages/` | useSendMessage |
| POST | `/api/v1/app/chat/messages/{id}/convert/` | useConvertMessage |
| GET | `/api/v1/app/chat/connections/` | useConnections |
| POST | `/api/v1/app/chat/connections/` | useInviteConnection |
| POST | `/api/v1/app/chat/connections/{id}/respond/` | useRespondConnection |
| GET | `/api/v1/app/chat/users/` | useChatUsers |
| WS | `wss://.../ws/chat/?token={accessToken}` | useChatSocket |

---

## Funcionalidades incluidas

- ✅ Lista de conversaciones (directas, grupos, cross-tenant)
- ✅ Mensajes guardados (self-chat) — botón fijo en la lista
- ✅ Thread de mensajes agrupados por día con auto-scroll
- ✅ Envío de mensajes (texto + adjuntos hasta 10 MB)
- ✅ Responder a un mensaje (reply preview en el composer)
- ✅ Indicador de escritura en tiempo real (typing indicator)
- ✅ Indicador de conexión WebSocket (Wifi/WifiOff icon)
- ✅ Botón "Actualizar mensajes" cuando el WebSocket está caído
- ✅ Crear conversación nueva (directa o grupo) — vista inline con búsqueda
- ✅ Selección múltiple de usuarios para grupos + nombre de grupo
- ✅ Salir de conversación (botón LogOut en thread header)
- ✅ Gestión de conexiones cross-tenant — vista inline
  - Invitar por email
  - Aceptar / rechazar solicitudes entrantes
  - Ver solicitudes enviadas y conexiones activas
- ✅ Convertir mensaje a Nota / Contacto / Snippet (menú "…" en hover)
- ✅ Marcado automático de leído al abrir conversación
- ✅ Reconexión automática del WebSocket con exponential backoff (1 s → 15 s)

---

## Verificación

- `npx tsc --noEmit` → sin errores
- No se añadieron dependencias al `package.json`
- El backend no fue modificado
