# Chat en el Workspace — 3 fases (intra-tenant · cross-tenant · tiempo real)

**Fecha:** 2026-06-26
**Estado:** ✅ Implementado y verificado por el usuario (Workspace local, Docker)
**Área:** Backend Django (nueva app `apps/chat`) · Frontend Workspace (`frontend_workspace/src/features/chat`) · Config ASGI/Channels

> El chat propio **"Mensajes guardados" (self-chat)** se documenta aparte en
> [`reports/2026-06-27-chat-mensajes-guardados-self-chat.md`](2026-06-27-chat-mensajes-guardados-self-chat.md),
> ya que se construyó sobre esta base como una iteración posterior.

---

## Contexto

El usuario pidió una sección de **Chat** en `apps/frontend_workspace/` (React + Vite): una pestaña
nueva en el sidebar que permita conversar entre usuarios, crear grupos, **chatear con usuarios de
otras cuentas (tenants) si están invitados**, y **convertir mensajes en notas / contactos / snippets**.

Por ser un cambio que toca el aislamiento multi-tenant y el arranque del servidor, se acordó dividir
el trabajo en **3 fases**, avisando al usuario al cerrar cada una:

1. **Fase 1 — intra-tenant:** directos + grupos del mismo tenant, polling, convertir mensajes.
2. **Fase 2 — cross-tenant:** conexiones por email (aceptar/rechazar), grupos mixtos.
3. **Fase 3 — tiempo real:** WebSockets (Django Channels), adjuntos, typing/online, onboarding de
   emails no registrados.

**Premisa de seguridad transversal:** toda la autorización es **por membresía** (`ConversationMember`
del `request.user`), nunca solo por tenant. Se usa `IsAuthenticated` (no `HasPermission('chat.*')`,
porque esos permisos no están sembrados en los fixtures RBAC y darían 403 — mismo criterio que
`apps/support`). No existe RLS real en la BD: el aislamiento es 100% a nivel de aplicación.

---

## Arquitectura implementada

### Backend — nueva app `apps/backend_django/apps/chat/`

```
apps/chat/
├── models.py        # Conversation, ConversationMember, Message, MessageAttachment, ChatConnection
├── serializers.py   # Message/Conversation(List/Detail)/ChatConnection/ChatUser serializers
├── views.py         # APIView-based; auth por membresía
├── urls.py          # /api/v1/app/chat/...
├── consumers.py     # ChatConsumer (AsyncJsonWebsocketConsumer)
├── middleware.py    # JWTAuthMiddleware (token en query string)
├── routing.py       # websocket_urlpatterns → ws/chat/
├── realtime.py      # broadcast_message / broadcast_membership_changed (no-op sin channel layer)
├── signals.py       # post_save(User) → enlaza invitaciones por email pendientes
├── apps.py          # ready() importa signals
├── migrations/      # 0001 initial · 0002 connection+tenant nullable · 0003 attachments+invited_email · 0004 self
└── tests/           # 9 archivos de tests
```

#### Modelos (`models.py`)

| Modelo | Campos clave | Notas |
|--------|--------------|-------|
| `Conversation` | `tenant` (nullable), `type` (direct/group/self), `name`, `created_by`, `avatar_color` | `tenant=None` en hilos cross-tenant |
| `ConversationMember` | `conversation`, `user`, `role` (owner/admin/member), `last_read_at`, `joined_at` | `unique_together(conversation, user)` |
| `Message` | `conversation`, `sender`, `content`, `reply_to` (self FK), `edited_at`, `deleted_at` | soft-delete + editar |
| `MessageAttachment` | `message`, `file` (`chat_attachments/%Y/%m/`), `kind` (image/file), `original_name`, `size` | Fase 3 |
| `ChatConnection` | `requester`, `addressee` (nullable), `requester_tenant`, `addressee_tenant`, `invited_email`, `status` (pending/accepted/blocked), `responded_at` | Fase 2 + onboarding |

Helper de módulo `connected_user_ids(user)` → set de IDs con conexión `accepted` (cualquier dirección);
se usa para validar elegibilidad de directos/grupos cross-tenant.

#### Endpoints (`urls.py` → `/api/v1/app/chat/`)

```
users/                              → ChatUsersView           (usuarios del tenant para iniciar chat)
connections/                        → ConnectionListCreateView (GET agrupadas / POST invitar por email)
connections/<uuid:pk>/respond/      → ConnectionRespondView    (accept/reject/block — solo addressee)
conversations/                      → ConversationListCreateView (GET mías / POST direct|group)
conversations/<uuid:pk>/            → ConversationDetailView   (GET / PATCH renombrar / DELETE salir)
conversations/<uuid:pk>/read/       → MarkReadView
conversations/<uuid:pk>/members/    → GroupMemberView          (POST/DELETE — solo owner/admin)
messages/                           → MessageListCreateView    (GET ?conversation= / POST multipart)
messages/<uuid:pk>/convert/         → MessageConvertView       (note/contact/snippet)
```

#### Conversión de mensajes (`MessageConvertView`)

`POST messages/<id>/convert/ { target: 'note'|'contact'|'snippet' }`:
- Valida membresía en la conversación del mensaje.
- Reutiliza `_user_has_permission(user, '<target>.create')` y `check_plan_limit(user, '<recurso>', count)`
  de `apps.rbac.permissions` → **402** si excede el plan, **403** si falta el permiso.
- Crea siempre en el **tenant del que convierte** (cross-tenant safe), con auditoría (`AuditMixin`).

### Fase 3 — Tiempo real (Django Channels)

- **Dependencias** (`requirements/base.txt`): `channels==4.1.0`, `channels-redis==4.2.0`,
  `daphne==4.1.2` (requiere rebuild del contenedor django).
- **`config/settings/base.py`:** `daphne` al inicio de `DJANGO_APPS`, `channels` en third-party,
  `CHANNEL_LAYERS` con `channels_redis` apuntando a Redis **DB /3**.
- **`config/asgi.py`:** `ProtocolTypeRouter({'http': ..., 'websocket': JWTAuthMiddleware(URLRouter(...))})`.
- **Auth WS:** token JWT en query string (`ws/chat/?token=<access>`), validado con `AccessToken`.
  El middleware expone `resolve_user()` síncrono (testeable) + `database_sync_to_async`.
- **`ChatConsumer`:** se une a un group por conversación (`chat_conv_<id>`) y de presencia por usuario;
  maneja `chat_message`, `chat_typing`, `chat_presence`, `chat_membership`.
- **`realtime.py`:** las vistas REST emiten por WS tras crear mensaje / cambiar membresía. Si no hay
  channel layer (tests sin Redis), los helpers son **no-op** → la suite no requiere Channels.
- **Fallback a polling:** si el WS cae, el `refetchInterval` de TanStack Query mantiene la app
  funcional (más lento, sin tiempo real).

### Onboarding de emails no registrados (Fase 3-C)

- Invitar un email sin cuenta → `ChatConnection(addressee=None, invited_email=..., status='pending')`
  + email de registro (responde **201**, no 404).
- `signals.py`: `post_save(User)` enlaza automáticamente las invitaciones pendientes por email al
  nuevo usuario (queda `pending` para que él la acepte).

### Frontend — `apps/frontend_workspace/src/features/chat/`

- **14 hooks:** `useConversations`, `useMessages`, `useSendMessage` (soporta `FormData`),
  `useCreateConversation`, `useMarkRead`, `useConvertMessage`, `useConversationDetail`,
  `useLeaveConversation`, `useChatUsers`, `useConnections`, `useInviteConnection`,
  `useRespondConnection`, `useChatSocket`, `useSelfConversation`.
- **11 componentes:** `Avatar`, `ConversationList`, `ConversationItem`, `MessageThread`,
  `MessageBubble` (renderiza adjuntos), `MessageComposer` (input de archivo + typing), `NewChatModal`,
  `GroupInfoPanel`, `ConvertMenu`, `ConnectionsModal`, `ChatToast`.
- **Integración:** ítem "Chat" en el grupo PRODUCTIVIDAD del `Sidebar`, ruta lazy en el router,
  `pages/ChatPage.tsx` wrapper.
- **WS:** `ws.ts` deriva `ws://`/`wss://` de `VITE_API_URL`; `useChatSocket` actualiza la cache de
  TanStack Query con reconexión por backoff y baja el polling a fallback cuando está conectado.

---

## Verificación

**Backend** (`docker exec rbac_django pytest apps/chat/tests/ -q`): **44/44 al cierre de la Fase 3**
(luego 51 con los 7 del self-chat). Cobertura:
- `test_conversations` · `test_messages` · `test_convert` (Fase 1)
- `test_connections` (Fase 2)
- `test_attachments` · `test_onboarding` · `test_ws_auth` (Fase 3)

**Frontend** (`docker exec rbac_workspace_vite npx vitest run src/features/chat`): chat en verde
(`ChatPage`, `ConnectionsModal`, `MessageComposer`) · `npm run typecheck` limpio.

**Smoke WS:** conexión validada — token válido `connected: True`, token inválido `connected: False`.

**Manual:** el usuario verificó mediante capturas: invitar a otro tenant, aceptar la conexión,
mensajería en vivo, envío de imagen y convertir un mensaje del chat a nota.

---

## Incidencias resueltas

- **LL-026 — `NoReverseMatch: 'djdt'` al pasar a ASGI:** el switch a ASGI/Daphne activó
  `debug_toolbar` (REMOTE_ADDR `127.0.0.1` ∈ `INTERNAL_IPS`) y su namespace `djdt` no estaba
  registrado → health 500. Fix: registrar las URLs de `debug_toolbar` bajo guard `DEBUG` en
  `config/urls.py`. Registrado en la KB `lessons-learned`.
- **docker-compose v1.29.2 incompatible con Engine 29 (`KeyError: 'ContainerConfig'`):** se levantó
  el contenedor django manualmente con `docker run` + `docker network connect`. (Ya documentado
  como LL-024.)
- **get-or-create de directos inflado por join + `Count`:** se separó la query de candidatos de la
  de conteo de miembros para no inflar el agregado.
- **WS test `InterfaceError: connection already closed`** (`database_sync_to_async` dentro de la
  transacción de `TestCase`): se refactorizó el middleware para exponer `resolve_user()` síncrono y
  testearlo directamente.
- **Incidente git con `git stash` ajeno:** se documentó como gotcha en memoria — **no usar
  `git stash push/pop`** en este repo (hay un stash ajeno preexistente que ensucia el árbol).

---

## Deuda técnica / seguimiento (ya en BACKLOG)

- **Deploy prod (Dokploy):** producción corre **gunicorn (WSGI)**; para chat en vivo hay que servir
  Django con **daphne/uvicorn (ASGI)** y exponer el upgrade WebSocket en Traefik. Sin esto, prod cae
  al fallback de polling. Documentar con el skill `dokploy-deploy`.
- **Almacenamiento de adjuntos:** los `MessageAttachment` usan `MEDIA_ROOT` local; en prod
  (contenedor efímero) migrar a S3/volumen persistente (django-storages) si deben sobrevivir redeploys.
