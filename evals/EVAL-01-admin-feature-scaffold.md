# EVAL-01 — Andamiar una sección nueva del Admin Panel

**Skill objetivo:** `new-admin-feature`
**Tipo:** scaffold
**Qué mide:** que el agente reproduzca las convenciones del Admin Panel al crear una feature nueva, en vez de improvisar una estructura distinta.

## Prompt (pegar tal cual en una sesión NUEVA del repo)

> Crea una nueva sección "Webhooks" en el Admin Panel (`apps/frontend_admin`) para listar, crear, editar y eliminar webhooks salientes del tenant. Cada webhook tiene: nombre, URL de destino, evento (string) y estado (active/inactive). Sigue las convenciones del proyecto.

## Rúbrica (puntuar cada ítem: ✅1 / 🟡0.5 / ❌0 → total /11)

- [ ] Invocó/siguió el skill `new-admin-feature` (o reprodujo sus convenciones explícitamente).
- [ ] Creó la carpeta `src/features/webhooks/` con `types.ts`, `hooks/`, `components/`, `<X>Page.tsx`.
- [ ] Hooks con TanStack Query: `useQuery` con queryKey `['admin-webhooks']` y `staleTime` (~60_000).
- [ ] Mutaciones (`useCreate.../useUpdate.../useDelete...`) que **invalidan** `['admin-webhooks']`.
- [ ] Usa `apiClient` de `@/lib/api` y endpoints **con trailing slash** (`/admin/webhooks/`).
- [ ] Respuesta de lista leída como `{ webhooks: T[] }` → `data?.webhooks ?? []`.
- [ ] Gating con `usePermissions().hasPermission('webhooks.create'/'...update'/'...delete')`.
- [ ] Componentes con **skeleton** (`animate-pulse`) y **empty state**.
- [ ] Creó el wrapper `src/pages/WebhooksPage.tsx` (re-export) y registró la **ruta lazy** en `src/router/index.tsx`.
- [ ] Añadió el **item al Sidebar** (`src/layouts/components/Sidebar.tsx`) con icono lucide + `permission`.
- [ ] Cerró recordando/ejecutando `npm run typecheck && npm test && npm run build`.

## Señales de fallo (qué revisar si puntúa bajo → observability ligera)

- Inventó una estructura distinta (ej. todo en un archivo, sin `hooks/`) → reforzar la `description` o el cuerpo de `new-admin-feature/SKILL.md`.
- Olvidó el wrapper `src/pages/` o el item del Sidebar → resaltar esos pasos de "Wiring exacto" en el SKILL.md.
- Usó `fetch`/axios crudo en vez de `apiClient`, o URL sin trailing slash → reforzar la tabla de convenciones (relacionado: `lessons-learned` LL-001).
- No corrió typecheck/build → reforzar el paso 7 (relacionado: LL-079).

## Cómo correrlo

1. Sesión nueva de Claude Code en la raíz del repo.
2. Pegar el Prompt.
3. Marcar la rúbrica y sumar el puntaje.
4. Anotar fecha + puntaje en [`RESULTS.md`](RESULTS.md).
