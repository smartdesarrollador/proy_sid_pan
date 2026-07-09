# Colaboración entre miembros del equipo: onboarding, badges "Compartida"/"Invitado", asistentes de Calendario

**Fecha:** 2026-07-07
**Apps:** `apps/backend_django` · `apps/frontend_next_hub` · `apps/frontend_workspace` · `apps/frontend_admin` (consulta)
**Origen:** sesión exploratoria partiendo de "¿por qué me da 404 al invitar a un compañero?" que derivó en
una revisión completa de cómo colabora un equipo dentro de un tenant (roles, notas/contactos/snippets
compartidos, calendario, chat).

## Resumen

Sesión larga con varias entregas encadenadas, cada una verificada con tests antes de pasar a la
siguiente:

1. Fix del 404 al aceptar una invitación de equipo en el Hub.
2. Badge de rol (Propietario/Miembro/etc.) en el navbar del Hub.
3. Badge "Compartida"/"Compartido" en Notas, Contactos y Snippets.
4. Mensaje claro de upgrade de plan al intentar compartir sin plan Starter+.
5. Selector rápido de compañeros de equipo al compartir (`TeamDirectoryView` nuevo).
6. Fix de desajuste Tareas/Bookmarks en el filtro de "Compartido Conmigo".
7. Calendario: los eventos ahora se ven automáticamente para los asistentes invitados + UI para invitarlos.
8. Chat: investigado, sin cambios — "Iniciar un chat" ya cubre el caso de uso.

También se documentaron 2 hallazgos importantes **sin corregir** (ver "Deuda técnica"): la
desincronización `Tenant.plan` vs `Subscription.plan`, y que las políticas RLS de Postgres nunca se
implementaron pese a que el middleware ya prepara el contexto para ellas.

---

## 1. Fix 404 en "Aceptar invitación" (Hub)

**Síntoma:** invitar a un compañero desde `/team` en el Hub generaba un correo con link a
`hub.local.test/accept-invite?token=...` que devolvía 404.

**Causa:** la página `/accept-invite` nunca se construyó en `frontend_next_hub` — solo existía en
`frontend_admin` (para invitar *staff*, no clientes). El backend (`UserInviteView`) y el endpoint
público `POST /api/v1/auth/accept-invite` ya funcionaban correctamente; faltaba la vista en el Hub.

**Fix:** 3 archivos nuevos en `frontend_next_hub`, clonando el patrón ya usado en `reset-password`:
- `features/auth/hooks/useAcceptInvite.ts`
- `features/auth/AcceptInvitePageClient.tsx`
- `app/(auth)/accept-invite/page.tsx`

Verificado en vivo contra el contenedor de dev (`rbac_next_hub_dev`): la ruta pasó de 404 a 200, y el
flujo completo (invitar → aceptar → login) se probó con una cuenta real (`cliente109@cliente.com`).

## 2. Badge de rol en el navbar del Hub

El Admin Panel ya mostraba el rol (`Owner`) junto al badge de plan; el Hub no. Se agregó reutilizando
piezas ya existentes (sin crear nada nuevo):
- `usePermissions().getRoleColor()` (ya existía, idéntico al de `frontend_admin`).
- `RoleBadge` + `getPrimaryRole()` de `features/team/` (ya usados en la tabla de Equipo).

Se agregó el badge junto al de plan ("Free"/"Professional") y debajo del email en el dropdown de
usuario (desktop + menú móvil). Resultado: "👑 Propietario" o "👤 Miembro" visibles en todo momento.

## 3. Badge "Compartida"/"Compartido" en Notas, Contactos y Snippets

El usuario preguntó cómo distinguir visualmente sus propios recursos de los compartidos por otros. Se
implementó consistentemente en las 3 apps que soportan `Share` (`apps/sharing`):

**Backend** — mismo patrón en `NoteSerializer`, `ContactSerializer`, `CodeSnippetSerializer`:
```python
is_shared = serializers.SerializerMethodField()      # obj.user_id != request.user.id
shared_by_name = serializers.SerializerMethodField()  # via shared_by_map en contexto
```
Las 3 vistas de listado (`*ListCreateView.get()`) construyen `shared_by_map` desde
`Share.objects.filter(shared_with=request.user, resource_type=...).select_related('shared_by')` y lo
pasan como contexto al serializer — una sola query extra por listado, sin N+1.

**Frontend** — badge índigo con ícono `Share2` + tooltip "Compartida por {nombre}" en `NoteCard`,
`ContactCard` y `SnippetCard`.

**Fuera de alcance (documentado, no corregido):** `NoteDetailView`/`ContactDetailView`/
`CodeSnippetDetailView` (GET/PATCH/DELETE de un recurso puntual) siguen filtrando por
`user=request.user` únicamente — no se puede abrir el detalle de un recurso compartido, solo
verlo listado con su badge. Ver deuda técnica.

## 4. Mensaje de upgrade al compartir sin plan suficiente

`sharing` es un feature Starter+ (`utils/plans.py`); en Free, `POST /app/sharing/` devuelve 402. El
mensaje genérico ("No se pudo compartir. Verifica el email.") no explicaba la causa real. Se aplicó
el mismo patrón ya usado en ~10 modales del proyecto (`NoteModal`, `TaskModal`, etc. —
`(error as {response?:{status?:number}}).response?.status === 402`) en `ShareResourceModal.tsx`:
**"Para compartir necesitas un plan superior. Actualiza tu plan para desbloquear esta función."**

## 5. Selector rápido de compañeros de equipo al compartir

**Problema:** compartir requería escribir el email a mano; el usuario pidió un select rápido para
compañeros del mismo tenant, manteniendo el input libre para compartir cross-tenant (comportamiento
confirmado como intencional en la conversación).

**Hallazgo durante la investigación:** no existía ningún endpoint que un rol **Member**/**Viewer**
pudiera usar para listar a sus compañeros — `GET /admin/users/` y `/app/team/` (`UserListView`) exigen
el permiso RBAC `users.read`, que solo tienen Owner/Service Manager (confirmado en vivo con
`force_authenticate` como Member → 403).

**Fix:** nuevo endpoint mínimo `GET /api/v1/app/team/directory/` (`TeamDirectoryView`,
`apps/auth_app/admin_views.py`) — `permission_classes = [IsAuthenticated]` (sin exigir `users.read`),
devuelve solo `id/name/email` de compañeros activos del tenant, excluyendo al solicitante. Reutilizado
en:
- `ShareResourceModal.tsx` (Notas/Contactos/Snippets) vía nuevo hook `useTeamDirectory`.
- `EventModal.tsx` (Calendario, ver sección 7) para invitar asistentes.

## 6. Fix del desajuste Tareas/Bookmarks en "Compartido Conmigo"

El filtro de tipo de recurso en `SharedWithMePage.tsx` ofrecía "Tareas" y "Bookmarks", pero
`Share.RESOURCE_TYPES` (backend) nunca incluyó esos dos tipos — esas opciones siempre devolvían vacío
y no había forma de compartir tareas/bookmarks en primer lugar. Se quitaron del filtro y de los mapeos
de ícono/ruta en `SharedItemCard.tsx`, dejando un comentario apuntando a `Share.RESOURCE_TYPES` como
fuente de verdad.

De paso se corrigió el docstring del modelo `Share`, que decía *"between users within the same
tenant"* cuando el código (`shared_with` se resuelve por email sin filtro de tenant) permite compartir
cross-tenant a propósito.

## 7. Calendario: visibilidad automática para asistentes + UI de invitar

**Pregunta del usuario:** ¿un evento de calendario se ve automáticamente entre el equipo, o hay que
compartirlo?

**Hallazgo:** los eventos eran 100% privados — `CalendarEventListCreateView.get()` filtraba solo por
`tenant=request.tenant, user=request.user`, sin excepción. Ya existía un sistema de **Attendees**
(`EventAttendeeListView`/`POST .../attendees/`) pero estaba desconectado: agregar a alguien como
asistente no lo hacía aparecer en su calendario.

**Fix backend:**
- El listado ahora incluye `Q(user=request.user) | Q(attendees__user=request.user)`.
- Nuevo helper de solo-lectura `_get_visible_event()` para que un asistente pueda abrir el detalle —
  **sin tocar** `_get_event()` (owner-only), así que editar/eliminar sigue restringido al dueño
  (verificado con test dedicado: un asistente que intenta PATCH/DELETE recibe 404).
- `CalendarEventSerializer` expone `is_attendee`/`organizer_name`.

**Fix frontend:**
- Badge "Invitado" (ícono `Users`, índigo) en `EventCard`, con tooltip "Invitado por {organizador}".
- Para eventos donde soy asistente: se ocultan los botones Editar/Eliminar y la card deja de ser
  clickeable (evita el flujo roto de editar algo que el backend rechazaría).
- Nueva sección **"Asistentes"** en `EventModal.tsx` (solo al editar un evento existente): lista de
  asistentes con su estado (Invitado/Aceptó/Rechazó/Tal vez) + botón para quitarlos, y un select
  "Invitar del equipo…" reutilizando `useTeamDirectory` (mismo hook de la sección 5).
- 3 hooks nuevos: `useEventAttendees`, `useAddAttendee`, `useRemoveAttendee`.

## 8. Chat — investigado, sin cambios

Se pidió el mismo selector de equipo en el modal "Conexiones" del Chat. Investigando se confirmó que
**ya existe** en otro lugar: el botón "+" ("Iniciar un chat") abre `NewChatModal.tsx`, que ya lista
compañeros del tenant vía `useChatUsers()` → `GET /app/chat/users/` (`ChatUsersView`, mismo filtro que
`TeamDirectoryView`), con buscador y un click para iniciar el chat — sin escribir ningún email. El
modal "Conexiones" es una feature aparte y deliberada para conectar con gente de **otra cuenta/tenant**
(`ConnectionListCreateView.post()`, busca el email globalmente sin filtro de tenant). Se confirmó con
el usuario que no hacía falta duplicar el selector ahí — no se tocó código.

---

## Verificación

- Backend: suites de `auth_app` (17/17), `notes` (13/13), `contacts` (10/10), `snippets` (9/9),
  `calendar_app` (14/14) — todas en verde, incluyendo los tests nuevos de cada fix.
- Frontend (`frontend_workspace`): suite completa **266/268** (los 2 fallos son preexistentes de
  `SSOCallbackPage`/`ProtectedRoute`, sin relación — ver deuda técnica ya registrada).
- Frontend (`frontend_next_hub`): `npm run typecheck` limpio; ruta `/accept-invite` verificada en vivo.
- `manage.py check` sin issues en todos los pasos.

---

## Deuda técnica encontrada (no corregida en esta sesión)

- **`Tenant.plan` vs `Subscription.plan` pueden desincronizarse**: son dos campos distintos que
  distintas pantallas leen indistintamente (Admin Panel "Usuarios" usa `Tenant.plan`, badge "Plan" y
  barra de uso del Hub usan `Subscription.plan`). Todos los flujos de negocio reales (upgrade, Yape,
  trial) los actualizan juntos correctamente — la causa más probable de la divergencia observada
  (tenant `Empresa15`) es `seed_faker_data.py::_seed_subscriptions` usando `get_or_create` con
  `defaults` que no se reaplican si la `Subscription` ya existía de una corrida anterior del seed.
- **RLS de Postgres nunca implementado**: `TenantMiddleware` ejecuta `SET app.tenant_id` en cada
  request (para políticas RLS), pero no existe ningún `CREATE POLICY`/`ENABLE ROW LEVEL SECURITY` en
  las migraciones. El aislamiento real hoy depende 100% de que cada vista recuerde filtrar por
  `tenant=request.tenant`.
- **`/team` (Hub) con i18n roto**: la página muestra literalmente `team.title`, `team.subtitle`,
  `team.members` en vez de texto traducido — faltan esas keys en el namespace `hub` de i18next.
- **Detalle de recursos compartidos no accesible**: `NoteDetailView`/`ContactDetailView`/
  `CodeSnippetDetailView` siguen siendo owner-only; un recurso compartido se ve en el listado con su
  badge pero no se puede abrir individualmente (a diferencia de Calendario, donde sí se resolvió con
  `_get_visible_event`). Aplicar el mismo patrón si se necesita a futuro.
