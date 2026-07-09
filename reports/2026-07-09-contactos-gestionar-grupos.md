# Contactos: modal "Gestionar grupos"

**Fecha:** 2026-07-09
**Apps:** `apps/backend_django` (`apps/contacts/`), `apps/frontend_workspace`
**Origen:** el usuario reportó (con captura) que el `<select>` "Grupo" del formulario de contacto
solo mostraba "Sin grupo". Auditoría previa confirmó que el backend de `ContactGroup` estaba
completo y funcionaba, pero **nunca existió UI para crear un grupo** (0 registros en las 15 tenants
de la BD de dev, incluyendo tenants con la feature habilitada). Se implementó el modal "Gestionar
grupos" acordado con el usuario, en la misma página de Contactos.

## Resumen

### Backend
- `ContactGroupSerializer` ganó `contacts_count` (`SerializerMethodField`, `obj.contacts.count()`) —
  antes no existía en el endpoint de listado, aunque el tipo del frontend ya lo declaraba. Necesario
  para poder avisar "estos contactos quedarán sin grupo" antes de borrar. Sin migración.
- `ContactGroupListCreateView`/`ContactGroupDetailView` ya funcionaban (create/list/delete) — no se
  tocaron.
- Tests nuevos: create success, list con `contacts_count` correcto, delete success, delete-nulls-FK
  (`on_delete=SET_NULL` verificado explícitamente), 402 en plan free para POST.

### Frontend
- `useCreateContactGroup`/`useDeleteContactGroup` (nuevos hooks, mirror de
  `useCreateContact`/`useDeleteContact`).
- `ManageGroupsModal.tsx` (nuevo, sin precedente en el repo — ni Bookmarks tiene un "gestionar
  colecciones" para copiar): shell de modal igual a `ContactModal.tsx`, confirmación de borrado
  in-place estilo `RoleCard.tsx` (admin panel), selector de color con swatches igual a
  `ProjectModal.tsx`. Formulario de creación con estado local simple (sin RHF/zod, un solo campo).
- Botón "Gestionar grupos" en el header de `ContactsPage.tsx`, gateado con el mismo `FeatureGate`
  que ya usan Importar/Exportar (`feature="contact_groups"`).
- **Fix adicional descubierto al verificar end-to-end**: `useCreateContact`/`useUpdateContact`/
  `useDeleteContact` solo invalidaban `['contacts']`, no `['contact-groups']` — el contador de
  "X contactos" en el modal quedaba desactualizado tras asignar/quitar un contacto de un grupo. Se
  agregó la invalidación cruzada en los tres hooks (no era parte del plan original, pero directamente
  necesario para que la feature recién construida mostrara datos correctos).
- **Fix de layout descubierto al verificar visualmente**: la fila de confirmación de borrado
  ("¿Confirmar?" + botones) se superponía con el nombre/color del grupo cuando el texto de aviso era
  largo (con contactos afectados). Se reestructuró `GroupRow` para que la confirmación caiga en una
  fila propia debajo, en vez de compartir una sola fila `justify-between`.

## Verificación

- Backend: 17/17 tests de `apps/contacts/` (5 nuevos).
- Frontend: `tsc` limpio; 18/18 tests (`ManageGroupsModal.test.tsx` nuevo con 5 casos +
  `ContactsPage.test.tsx` con 1 nuevo); suite completa 296/298 (2 fallos preexistentes ya
  trazados en `BACKLOG.md`).
- Backend completo: 680 passed, 10 fallos preexistentes sin relación.
- End-to-end en navegador real (tenant Empresa15, plan professional): creado grupo "VIP" con color
  morado desde el modal → apareció de inmediato en el `<select>` de "Grupo" del formulario de
  contacto (el bug original reportado) → asignado a un contacto existente → el badge "VIP" apareció
  en la card → reabierto "Gestionar grupos" y confirmado que el contador pasó de "0 contactos" a
  "1 contactos" (gracias al fix de invalidación) → eliminado el grupo con el aviso "1 contactos
  quedarán sin grupo" → confirmado → el contacto perdió la asignación y el badge desapareció de la
  card, verificando el `on_delete=SET_NULL`.

## Fuera de alcance

El mismo gap en Bookmarks (`BookmarkCollection` sin UI de gestión, ver reporte de la sesión
anterior) — hallazgo análogo, no pedido en esta tarea.
