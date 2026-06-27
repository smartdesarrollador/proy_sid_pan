# Chat propio — "Mensajes guardados" (self-chat)

**Fecha:** 2026-06-27
**Estado:** ✅ Implementado y verificado por el usuario (Workspace local)
**Área:** Backend Django (`apps/chat`) · Frontend Workspace (`frontend_workspace/src/features/chat`)

---

## Contexto

El chat del Workspace (entregado en 3 fases: intra-tenant, cross-tenant y tiempo real) ya permitía
conversaciones directas, grupos y conexiones entre cuentas. Faltaba un caso de uso frecuente: poder
**guardarse mensajes a uno mismo** — links, notas rápidas, imágenes — estilo *Telegram "Saved
Messages"* / *WhatsApp "Tú"*.

**Decisión de diseño** (acordada con el usuario): **NO** invitarse a la propia cuenta. Las
`ChatConnection` modelan dos usuarios distintos y un chat directo exige exactamente un "otro" miembro.
En su lugar se crea un **hilo propio dedicado** (`type='self'`) con **un solo participante**, expuesto
como una entrada fija llamada **"Mensajes guardados"** arriba de la lista de chats. Reutiliza toda la
infraestructura existente (mensajes, adjuntos, convertir a nota/contacto/snippet, WebSocket, polling).

---

## Arquitectura implementada

### Backend — `apps/backend_django/apps/chat/`

**Modelo (`models.py`)**
- Se añadió `('self', 'Self')` a `Conversation.TYPE_CHOICES`.
- Migración `0004_alter_conversation_type` (AlterField de choices, no-op de esquema).
- El hilo self es `type='self'`, `tenant=request.tenant`, con **un único** `ConversationMember`
  (el usuario, role `owner`).

**Serializer (`serializers.py` — `ConversationListSerializer`)**
- `get_display_name` → rama `if obj.type == 'self': return 'Mensajes guardados'`.
- `get_display_avatar` → `{'type': 'self', 'name': 'Mensajes guardados', 'color': obj.avatar_color}`.
- `get_other_user_id` ya devolvía `None` para todo lo que no fuera `direct` (incluye self) — sin cambios.

**Vista (`views.py` — `SelfConversationView`)**
- `POST /api/v1/app/chat/conversations/self/` con **get-or-create idempotente**:

```python
existing = (
    Conversation.objects.filter(
        type='self', tenant=request.tenant, members__user=request.user
    ).order_by('created_at').first()
)
if existing:
    return Response(ConversationDetailSerializer(...).data, status=200)

with transaction.atomic():
    conv = Conversation.objects.create(
        tenant=request.tenant, type='self', created_by=request.user,
    )
    ConversationMember.objects.create(conversation=conv, user=request.user, role='owner')
```

- Devuelve `201` la primera vez y `200` en llamadas posteriores (mismo `id`).
- `IsAuthenticated` + auditoría (`chat.conversation.create`, `{'type': 'self'}`).

**URL (`urls.py`)**
- `conversations/self/` registrada **antes** del matcher `conversations/<uuid:pk>/` para que la
  palabra `self` no caiga en el patrón UUID.

El resto funciona sin cambios: `_get_membership` reconoce al usuario como miembro → puede enviar,
listar, marcar leído y convertir mensajes; el `ChatConsumer` ya se suscribe a todas las conversaciones
del usuario, así que el self-chat también recibe eventos en tiempo real.

### Frontend — `apps/frontend_workspace/src/features/chat/`

| Archivo | Cambio |
|---------|--------|
| `types.ts` | `ConversationType += 'self'`; `DisplayAvatar.type += 'self'` |
| `components/Avatar.tsx` | Nuevo prop `isSelf` → renderiza icono `Bookmark` (lucide) en vez de iniciales |
| `components/ConversationItem.tsx` | Pasa `isSelf={display_avatar.type === 'self'}` |
| `components/ConversationList.tsx` | **Entrada fija "Mensajes guardados"** (icono Bookmark) siempre arriba; el hilo self se excluye de la lista normal para no duplicarse; resalta activo cuando corresponde |
| `hooks/useSelfConversation.ts` (nuevo) | `useMutation` → `POST /app/chat/conversations/self/`, invalida `['chat-conversations']` |
| `ChatPage.tsx` | `handleOpenSelfChat` → `selfConversation.mutate()` → `setActiveId(conv.id)`; `isSelf` en el avatar del header |

El hilo abierto muestra "Mensajes guardados" + icono Bookmark tanto en la lista como en el header,
derivado del `display_name`/`display_avatar` que ya provee el serializer.

---

## Verificación

**Backend** (`docker exec rbac_django pytest apps/chat/tests/ -q`): **51 passed**
- `test_self_chat.py` (7 nuevos): creación, **get-or-create idempotente** (no duplica), un solo
  miembro, cada usuario tiene su propio self-chat, enviar/listar mensajes, **aislamiento** (otro
  usuario recibe 404), convertir mensaje propio a nota, aparición en la lista con
  `display_name == 'Mensajes guardados'`.

**Frontend**
- `docker exec rbac_workspace_vite npm run typecheck` → limpio.
- `docker exec rbac_workspace_vite npx vitest run src/features/chat` → **16 passed**
  (1 nuevo en `ChatPage.test`: la entrada fija "Mensajes guardados" se renderiza y dispara la
  mutación al hacer clic).

**Manual** (Workspace local, `cliente107@cliente.com`, Empresa_107, plan professional)
- "Mensajes guardados" aparece fijado arriba de la lista de chats con icono Bookmark.
- Se guardaron varios mensajes propios (texto y un link) y persisten tras recargar.

---

## Decisiones y notas

- **Por qué un `type` dedicado y no auto-invitación:** mantiene la semántica de `ChatConnection`
  (dos usuarios) intacta y evita un chat directo "degenerado" de un solo miembro que rompería
  `get_display_name`/`_other_member`. El branch `type='self'` es explícito y aislado.
- **Idempotencia:** clave para que la entrada fija de la UI pueda llamar al endpoint en cada clic sin
  crear hilos duplicados.
- **Reuso total:** adjuntos (10 MB), convertir a nota/contacto/snippet y WebSocket funcionan sin
  código adicional porque toda la autorización es por membresía y el consumer ya cubre el hilo.

---

## Seguimiento

Sin deuda técnica nueva. Aplica el mismo follow-up ya registrado de la Fase 3 del chat
(deploy ASGI en Dokploy y almacenamiento de adjuntos en producción) — no exclusivo del self-chat.
