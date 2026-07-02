# Modal de Anuncios/Promociones (Hub)

**Fecha:** 2026-07-01
**Apps:** `apps/backend_django` · `apps/frontend_admin` · `apps/frontend_next_hub`

## Contexto

El cliente quería poder anunciar promociones, ofertas y publicidad de sus servicios digitales
mediante un modal visible en dos puntos del Hub Client Portal: la home pública (visitantes sin
sesión) y el dashboard autenticado (justo al loguearse). El contenido debía ser 100% administrable
desde el Admin Panel — crear, editar, activar/desactivar cuando convenga, sin tocar código ni
requerir deploy.

Se implementó en 3 fases (backend → Admin Panel → Hub), clonando el patrón ya validado de la
feature hermana `catalog` (ver `reports/2026-07-01-catalogo-servicios-dinamico.md`), y se resolvieron
2 bugs encontrados en pruebas manuales tras el despliegue en dev.

## Decisiones de diseño

- **Nueva app `apps/announcements/`**, separada de `promotions` (esa es para códigos de descuento
  de facturación/planes — dominio distinto) y de `catalog` (esa es el catálogo de servicios propios).
- **Staff-only en admin (`is_staff`, sin permisos RBAC nuevos)** — igual que `catalog`, porque es
  contenido de plataforma gestionado solo por staff, no una acción tenant-scoped. El Admin Panel ya
  restringe el acceso completo a `is_staff=True` vía `ProtectedRoute`.
  - **Tres tiers de lectura**: público (`AllowAny`, home), autenticado (`IsAuthenticated`, dashboard)
  y admin (staff, CRUD) — cada uno devuelve el **anuncio activo de mayor prioridad** para su
  `placement` (`home` / `dashboard` / `both`), no una lista.
- **Ventana de vigencia opcional** (`starts_at`/`ends_at`) + **caché Redis de 5 min** en las vistas
  "active" (mismo TTL que el caché del backend), con **invalidación explícita** en cada mutación
  admin — el usuario espera que activar/desactivar tenga efecto inmediato, no esperar el TTL.
- **Descarte permanente por `localStorage`** (`hub-announcement-dismissed-<id>`), sin modelo de
  "leído por usuario" en backend — mantiene el alcance chico. Al ser `localStorage` del mismo
  dominio (`hub.local.test`), un anuncio `placement="both"` comparte el mismo `id` en Home y
  Dashboard: cerrarlo en una página lo descarta también en la otra (comportamiento deseado, evita
  repetir la misma campaña dos veces al mismo visitante).

## Cambios

### Backend — nueva app `apps/announcements/`

- **`models.py`**: `Announcement(BaseModel)` — `title`, `message`, `image` (ImageField
  `upload_to='announcements/'`), `cta_text`/`cta_url`, `placement` (home/dashboard/both, default
  both), `is_active`, `starts_at`/`ends_at`, `priority`.
- **`serializers.py`**: `AnnouncementSerializer` (lectura) + `AnnouncementWriteSerializer`
  (escritura, valida imagen ≤2 MB, limpia imagen anterior en PATCH).
- **`views.py`**: `AdminAnnouncementListCreateView`/`AdminAnnouncementDetailView` (staff, CRUD
  completo, invalidan caché tras mutar) + `PublicActiveAnnouncementView` (`AllowAny`) +
  `HubActiveAnnouncementView` (`IsAuthenticated`) — ambas cacheadas 5 min vía
  `get_active_announcement()` con `@cache_result`.
- **`admin_urls.py`** / **`public_urls.py`** / **`hub_urls.py`** + migración `0001_initial` aplicada.
- Registrado en `LOCAL_APPS` y en los 3 tiers de `config/urls.py`.

**Endpoints resultantes:**
```
GET/POST  /api/v1/admin/announcements/               → CRUD (staff)
GET/PATCH/DELETE /api/v1/admin/announcements/{id}/    → detalle (staff)
GET       /api/v1/app/announcements/active/?placement=dashboard   → autenticado
GET       /api/v1/public/announcements/active/?placement=home     → sin auth
```

### Admin Panel — `apps/frontend_admin/src/features/announcements/`

- Clon 1:1 del patrón de `catalog`: `types.ts`, hooks (`useAnnouncements`, `useCreateAnnouncement`,
  `useUpdateAnnouncement`, `useDeleteAnnouncement`) con FormData multipart para la imagen.
- **`AnnouncementCard.tsx`**: grid card con imagen, badges de placement/activo, botón toggle
  play/pause (patrón de `PromotionCard`), confirmación inline al eliminar.
- **`AnnouncementModal.tsx`**: react-hook-form + zod, upload de imagen con preview y validación
  2 MB, fechas opcionales con `superRefine` (`ends_at > starts_at`), `role="dialog"` + `useFocusTrap`.
- **`AnnouncementsPage.tsx`**: header con conteo, skeleton, empty state, grid, modal.
- Sidebar: ítem "Anuncios" (icono `Megaphone`) en grupo Gestión, `permission: null`.
- 5 tests nuevos (render, empty state, toggle+confirm, crear abre modal, borrar con confirmación).
- `npm run typecheck` ✓ · `npm test` (5/5 nuevos, 124/136 total — 12 fallos pre-existentes en
  auth/MSW no relacionados) ✓ · `npm run build` ✓

### Hub — `apps/frontend_next_hub/features/announcements/`

- **`hooks/useHomeAnnouncement.ts`** (público, `publicClient`) y
  **`hooks/useDashboardAnnouncement.ts`** (autenticado, `apiClient`, `enabled: isAuthenticated`) —
  ambos con `staleTime: 5min`, `204 → null`, `.catch(() => null)` (un anuncio nunca debe romper la
  página).
- **`hooks/useAnnouncementDismissal.ts`**: descarte por `id` en `localStorage`, lectura **síncrona**
  durante el render (no en `useEffect`) para no parpadear un frame visible antes de ocultarse.
- **`components/AnnouncementModal.tsx`**: presentacional, responsive (`max-w-md` móvil →
  `sm:max-w-lg` → `md:max-w-2xl` escritorio, imagen/título/CTA escalados por breakpoint,
  `max-h-[90vh] overflow-y-auto`). CTA abre en pestaña nueva y también descarta el modal.
- Contenedores `HomeAnnouncementModal`/`DashboardAnnouncementModal`, montados en `app/page.tsx` y
  `features/dashboard/DashboardPageClient.tsx` respectivamente.
- `npm run typecheck` ✓ · `npm test` (65/65, sin regresiones) ✓ · `npm run build` ✓ (dentro del
  contenedor Docker — el build en host falló por permisos root heredadas de `.next/`, ajeno al código).

### Fix de bug — `image_url` apuntaba a un hostname interno de Docker (LL-033)

**Síntoma:** el anuncio se creaba bien en el Admin, pero la imagen no cargaba en el Hub —
consola: `GET http://rbac-django:8000/media/... net::ERR_NAME_NOT_RESOLVED`.

**Causa raíz:** el `rewrites()` server-side de Next.js (`next.config.ts`, `API_TARGET=http://rbac-django:8000`)
reenvía las peticiones del navegador a Django sin preservar el `Host` original. Django construía
`image_url` con `request.build_absolute_uri()`, que usa ese `Host` interno — solo resuelve dentro de
la red de Docker, no desde el navegador. El Admin Panel no lo sufría porque su dominio
(`rbac.local.test`) proxea completo a Django sin ese rewrite intermedio.

**Fix:**
- Nuevo `apps/backend_django/utils/media.py::build_media_url()` — prioriza el setting
  `APP_BASE_URL` (dominio público real) sobre `request.build_absolute_uri()`.
- Aplicado en `announcements`, `catalog` (mismo bug, mismo patrón, corregido de paso) y consolidado
  en `tenants` (branding), que ya tenía una versión duplicada de la misma lógica.
- Corregido `APP_BASE_URL` en `.env` local: de `http://localhost:8000` (puerto no mapeado del
  contenedor) a `http://rbac.local.test`.
- Registrada la lección **LL-033** en `.claude/skills/lessons-learned/references/knowledge-base.md`
  (incluye nota de que `docker-compose up -d --force-recreate` chocó con el bug conocido LL-024 de
  contenedores huérfanos — se resolvió con `docker stop/rm` + `up --no-deps`).

### Fix de bug — parpadeo del modal por descarte compartido (ver sección Hub arriba)

Detectado en prueba manual: un anuncio `placement="both"` comparte `id` entre Home y Dashboard
(mismo dominio, mismo `localStorage`). El chequeo de descarte corría en un `useEffect` (después del
primer render), así que el modal se pintaba visible un frame antes de ocultarse cuando ya estaba
descartado. Se movió la lectura de `localStorage` a ser síncrona durante el render.

## Estado de tests / cobertura

| App | Tests nuevos | Suite completa | Fallos pre-existentes (no relacionados) |
|-----|--------------|-----------------|------------------------------------------|
| Backend (`announcements`) | 16 | 599 | 10 (throttling, chat_assistant, support) |
| Admin Panel | 5 | 136 | 12 (auth/MSW) |
| Hub | 0 nuevos (cubierto por verificación manual + suite existente) | 65 | 0 |

No hay tests automatizados de Vitest/Playwright para el flujo del modal en el Hub (solo
verificación manual end-to-end); si el flujo crece en complejidad valdría la pena agregar un test
de `useAnnouncementDismissal` (localStorage compartido) y de las dos vistas contenedoras.

## Deuda técnica / ideas para después

- **Sin tracking de impresiones/clics** — no hay forma de medir efectividad de una campaña
  (cuántos la vieron, cuántos hicieron click en el CTA). Sería un contador incremental simple, sin
  tabla de eventos pesada.
- **Un solo anuncio activo por `placement`** (se resuelve por `priority` + `created_at`) — el campo
  `priority` ya está listo por si se quiere rotar varios en el futuro (ej. carrusel de anuncios).
- **Sin segmentación por plan del tenant** — todo tenant autenticado ve el mismo anuncio de
  dashboard; podría filtrarse por `tenant.plan` para ofertas de upgrade dirigidas.
- **`catalog` no tenía tests** antes de este trabajo y sigue sin tenerlos (fuera de alcance de esta
  feature, pero el fix de `image_url` sí lo tocó — sería buen candidato para una pasada de tests
  aparte).
- **Warning de ESLint `no-img-element`** en `AnnouncementModal.tsx` (Hub) — decisión consciente de
  usar `<img>` plano en vez de `next/image` porque `next.config.ts` no tiene el dominio de medios de
  producción en `images.remotePatterns`; si se agrega ese dominio en el futuro, migrar a `next/image`
  para mejor LCP.

## Resultado

El staff puede crear/editar/activar/desactivar anuncios desde `/announcements` en el Admin Panel
(imagen, mensaje, CTA, placement, ventana de vigencia, prioridad) y estos se reflejan de inmediato
como modal en la home pública y el dashboard del Hub, con descarte persistente por visitante y
diseño responsive (móvil → escritorio). De paso se corrigió un bug de URLs de medios rotas que
también afectaba al catálogo de servicios ya existente.
