# Anuncios en Tarjetas — Sidebar Desktop

**Fecha:** 2026-07-02
**Apps:** `apps/backend_django` · `apps/frontend_sidebar_desktop`

## Contexto

El día anterior se implementaron anuncios en el Hub (`frontend_next_hub`) como modales. Esta sesión
extiende la misma feature al Desktop (`frontend_sidebar_desktop` — Tauri v2 + React) pero con un
diseño diferente: **tarjetas compactas** en el `HomePanel` en lugar de modales, ya que el sidebar
es un panel angosto y el modal hubiera interrumpido el flujo de trabajo.

Se implementó en dos pasos:

1. **Paso inicial:** un solo anuncio por `HomePanel` (endpoint existente `active/`), card con borde
   amber izquierdo e imagen pequeña inline.
2. **Paso final (esta sesión):** los 2 anuncios de mayor prioridad, nuevo endpoint lista `top/`,
   rediseño del card con imagen full-width y texto debajo.

## Decisiones de diseño

- **Imagen full-width con margen** (`px-2 pt-2`) — ocupa casi todo el ancho de la tarjeta,
  `h-24 object-cover`; texto y CTA debajo en sección separada (`px-3 pb-2.5 pt-2`).
- **Top 2 por prioridad** — el campo `priority` ya existía en el modelo; el backend ordena
  `-priority, -created_at` y corta con `[:limit]`. Máximo configurable hasta 5 via `?limit=`.
- **Nuevo endpoint `/top/`** en lugar de modificar `/active/`— el Hub usa `active/` y espera
  un objeto único o 204; cambiar la forma de respuesta hubiera roto el Hub. El nuevo endpoint
  devuelve siempre un array (vacío `[]` si no hay anuncios), sin 204.
- **Descarte independiente por ID** — `Set<string>` serializado en `localStorage` como
  `desktop-announcements-dismissed` (JSON array). Cada tarjeta se descarta por separado; si
  el admin crea un anuncio nuevo (distinto ID) reaparece aunque el anterior esté descartado.
- **Sección con label "ANUNCIOS"** — coherente con el resto de secciones del HomePanel
  (`RESUMEN DEL DÍA`, `ACCESOS RÁPIDOS`, etc.). No se muestra nada cuando el array está vacío.
- **Sin skeleton** — los anuncios son contenido secundario; si no cargaron aún simplemente
  no se muestran, sin placeholder que distraiga.
- **Fallback sin imagen** — ícono `Megaphone` sobre fondo amber suave (`bg-amber-500/15`).

## Cambios

### Backend — `apps/backend_django/apps/announcements/`

**`views.py`:**
- Nueva clase `HubAnnouncementsTopView` — query idéntica a `get_active_announcement` pero con
  `[:limit]`, caché manual `cache.set(f'announcement_top:{placement}:{limit}', items, 300)`.
  `limit` viene de `?limit=` (default 2, máx 5, mín 1), clampeo con `min/max`.
- `_invalidate_announcement_cache()` extendido para limpiar también los keys
  `announcement_top:{placement}:{limit}` (rango 1-5) en cada mutación admin —
  así create/update/delete del Admin Panel invalida inmediatamente los anuncios del Desktop.

**`hub_urls.py`:**
```
GET /api/v1/app/announcements/top/?placement=dashboard&limit=2  → HubAnnouncementsTopView
```

**Endpoints de la app `announcements` completos tras esta sesión:**
```
GET/POST          /api/v1/admin/announcements/              → CRUD staff
GET/PATCH/DELETE  /api/v1/admin/announcements/{id}/         → detalle staff
GET               /api/v1/app/announcements/active/         → único (Hub dashboard)
GET               /api/v1/app/announcements/top/            → lista top N (Desktop) ← nuevo
GET               /api/v1/public/announcements/active/      → único público (Hub home)
```

### Frontend Desktop — `apps/frontend_sidebar_desktop/`

**`src/features/announcements/useDesktopAnnouncement.ts`** (archivo nuevo, reemplazado):
- Exporta `useDesktopAnnouncements()` (plural) y tipo `DesktopAnnouncement`.
- Llama a `/api/v1/app/announcements/top/?placement=dashboard&limit=2`.
- Retorna `{ announcements, dismiss }` — `announcements` ya filtrados (sin los descartados),
  `dismiss(id)` actualiza el `Set<string>` en estado y en `localStorage`.
- `loadDismissed()` lee el Set de `localStorage` en el estado inicial (síncrono, sin
  parpadeo — misma lección aprendida del Hub modal, LL-033 área dismissal).

**`src/components/panels/HomePanel.tsx`:**
- `Megaphone` agregado a imports de lucide.
- Import de `useDesktopAnnouncements` / `DesktopAnnouncement`.
- `AnnouncementCard` rediseñado:
  - Imagen `h-24 w-full rounded-md object-cover` dentro de `px-2 pt-2` (margen visual perimetral).
  - Texto en bloque inferior: título, mensaje `line-clamp-2`, fila `ends_at` + CTA button.
  - Botón `×` en la fila del título (no flotante) para evitar solapar la imagen.
- Sección `{/* ── Anuncios ── */}` entre "Banner Servicios Digitales" y "Continuá donde lo dejaste".
  Label en mayúsculas igual al resto de secciones. Mapea `announcements[]` con `gap-2`.
- Estado simplificado: ya no hay `dismissedId` ni `showAnnouncement` — toda la lógica vive
  dentro del hook.

## Posición visual en HomePanel

```
Header (saludo + fecha)
Widget de estado (tenant + plan)
Resumen del día (eventos / tareas / alertas)
Accesos rápidos
Banner Servicios Digitales
── ANUNCIOS ──────────────────────
  ┌──────────────────────────────┐
  │ ┌────────────────────────┐   │
  │ │      imagen h-24       │   │
  │ └────────────────────────┘   │
  │  Título                   ×  │
  │  Mensaje 2 líneas            │
  │  Hasta 08 jul   Ver mas ↗   │
  └──────────────────────────────┘
  (segundo anuncio si existe)
──────────────────────────────────
Continuá donde lo dejaste
Cita motivacional
```

## Estado de tests / cobertura

| App | Tests nuevos | Suite previa | Notas |
|-----|-------------|--------------|-------|
| Backend (`announcements`) | 0 | 16 (sesión anterior) | El nuevo endpoint `top/` no tiene test propio — lógica de query es idéntica a `active/`, diferencia solo en `.first()` vs `[:limit]` |
| Desktop | 0 | — | Desktop no tiene suite de tests |

**Deuda de tests generada:**
- `HubAnnouncementsTopView` sin test — cubrir: placement filter, limit clamp (>5 → 5),
  orden por priority, caché set/hit, invalidación en admin mutate.
- `useDesktopAnnouncements` sin test — cubrir: dismiss actualiza Set, `loadDismissed`
  inicializa desde localStorage, array vacío cuando no hay anuncios activos.

## Deuda técnica / ideas para después

- **Tests `HubAnnouncementsTopView`** — reutilizar fixtures de la suite existente de
  `announcements`; añadir 4-5 casos: vacío → `[]`, limit, orden priority, caché invalidado
  tras admin PATCH.
- **`?limit=` en el cliente podría subirse a 3** si en el futuro se quiere mostrar más
  anuncios — sin cambio de backend, solo cambiar el query param en el hook.
- **Tracking de impresiones en Desktop** — igual que la deuda del Hub: no hay registro de
  cuántos usuarios desktop vieron o clickearon cada anuncio.
- **Segmentación por plan en Desktop** — el endpoint `top/` tampoco filtra por `tenant.plan`;
  si se quieren anuncios de upgrade solo para Free/Starter, habría que agregar el filtro
  (el tenant está disponible en el request via `X-Tenant-Slug`).
- **Imagen sin `alt` descriptivo** — se usa `alt=""` (decorativo); si la imagen es portadora
  de información, el admin debería poder proveer un texto alternativo (campo `image_alt` en
  el modelo).

## Resultado

El `HomePanel` del sidebar Desktop muestra los 2 anuncios activos de mayor prioridad con
`placement=dashboard` o `placement=both` como tarjetas compactas con imagen full-width. Cada
tarjeta es descartable de forma independiente; el descarte persiste en `localStorage` hasta que
aparezca un anuncio con distinto ID. El Admin Panel puede crear/activar/desactivar anuncios
y el Desktop los refleja en ≤5 min (TTL del caché), o de inmediato si el caché es invalidado
por la próxima mutación admin.
