# Catálogo de Servicios Dinámico

**Fecha:** 2026-07-01
**Apps:** `apps/backend_django` · `apps/frontend_admin` · `apps/frontend_next_hub` · `apps/frontend_sidebar_desktop`

## Contexto

Los servicios mostrados en el desktop sidebar y en la landing del Hub estaban hardcodeados
(arrays estáticos `SERVICES` y `LANDING_SERVICES`). El objetivo fue crear un catálogo
administrable desde el Admin Panel, con soporte de imagen/ícono, ordenamiento, estado
activo/inactivo y filtrado por app destino (`target_apps`), consumible desde cualquier
aplicación presente o futura.

## Decisiones de diseño

- **Nueva app `apps/catalog/` separada** de `digital_services` (que maneja servicios SaaS
  de plataforma como workspace/vista) y de `apps/services/` — conceptualmente es marketing/publicidad.
- **Staff-only en admin, `AllowAny` en público**: los endpoints de gestión verifican
  `request.user.is_staff` (no RBAC de tenant). La lectura es pública porque los servicios
  son contenido de marketing, no datos de tenant.
- **`target_apps` como `JSONField`** (`['desktop', 'mobile', 'web']`): permite filtrar con
  `?app=desktop` en el endpoint público mediante `target_apps__contains=[app]`. Escala a
  nuevas apps futuras sin migrations.
- **`image_url` como SerializerMethodField** con `request.build_absolute_uri` → URL absoluta
  lista para usar desde cualquier origen.
- **Desktop conserva su diseño propio**: el `ServicesPanel` ya tenía un diseño cuidado con
  `openExternal`, banner para plan free y CTA dinámico ("Quiero esto" / "Más información").
  Solo se reemplazó el origen de los datos, no el UI.

## Cambios

### Backend — nueva app `apps/catalog/`

- **`models.py`**: `CatalogItem(BaseModel)` — `name`, `short_description`, `description`,
  `image` (ImageField `upload_to='catalog/'`), `icon_color`, `category`, `link_url`,
  `badge_text`, `target_apps` (JSONField), `is_active`, `order`.
- **`serializers.py`**: `CatalogItemSerializer` (lectura, con `image_url` computed) +
  `CatalogItemWriteSerializer` (escritura, valida imagen ≤2 MB, limpia imagen anterior en PATCH).
- **`views.py`**: 4 vistas:
  - `PublicCatalogListView` — `AllowAny`, solo activos, filtra `?app=`, sin paginación.
  - `AdminCatalogListCreateView` — staff, multipart/form-data.
  - `AdminCatalogDetailView` — staff, GET/PATCH/DELETE; DELETE borra archivo del disco.
  - `AdminCatalogReorderView` — staff, actualiza solo `order`.
- **`admin_urls.py`** + **`public_urls.py`** + migración `0001_initial` aplicada.
- **`config/settings/base.py`**: `'apps.catalog'` en `LOCAL_APPS`.
- **`config/urls.py`**: rutas en `/api/v1/admin/catalog/` y `/api/v1/public/catalog/`.

**Endpoints resultantes:**
```
GET    /api/v1/public/catalog/              → activos (filtrable ?app=desktop|mobile|web)
GET    /api/v1/admin/catalog/               → todos (staff)
POST   /api/v1/admin/catalog/               → crear (multipart)
GET    /api/v1/admin/catalog/{id}/          → detalle (staff)
PATCH  /api/v1/admin/catalog/{id}/          → editar (multipart)
DELETE /api/v1/admin/catalog/{id}/          → eliminar + borra imagen
POST   /api/v1/admin/catalog/{id}/reorder/  → cambiar orden
```

### Admin Panel — `apps/frontend_admin/src/features/catalog/`

- **`types.ts`**: `TargetApp`, `CatalogItem`, `CatalogItemCreateRequest`, `CatalogItemUpdateRequest`.
- **Hooks**: `useCatalogItems`, `useCreateCatalogItem`, `useUpdateCatalogItem`,
  `useDeleteCatalogItem` — queryKey `['admin-catalog']`, staleTime 60s, FormData con
  `target_apps` como `JSON.stringify(array)`.
- **`CatalogItemCard.tsx`**: imagen o color fallback, badge, chips de target_apps
  (Monitor/Smartphone/Globe), estado activo/inactivo, confirm inline al eliminar.
- **`CatalogItemModal.tsx`**: image upload con preview local (`URL.createObjectURL`), color
  picker, nombre, descripción corta/larga, categoría, badge, link_url, checkboxes
  `target_apps`, `is_active`, orden. react-hook-form + zod.
- **`CatalogPage.tsx`**: grid 2-col, skeleton 4 cards, empty state con icono Layers.
- **`src/pages/CatalogPage.tsx`**: re-export para lazy routing.
- **Sidebar**: ítem "Catálogo" (icono `Layers`) en grupo Gestión, después de Promociones.
  `permission: null` — accesible a todo staff.
- **Router**: ruta `catalog` con lazy import.
- **i18n**: `"catalog": "Catálogo"` (es) / `"Catalog"` (en) en `sidebar.json`.
- `npm run typecheck` ✓ · `npm run build` ✓

### Hub — `apps/frontend_next_hub/features/landing/LandingPageClient.tsx`

- Eliminado array `LANDING_SERVICES` estático (5 servicios hardcodeados).
- Agregado hook `useLandingCatalog()` con `fetch` a `/api/v1/public/catalog/?app=web` +
  `useState`/`useEffect` (componente es `'use client'`).
- Sección "Otros servicios" se renderiza solo si `catalogItems.length > 0`.
- Cada item muestra imagen (`<img>`) o div de color fallback, nombre, descripción corta,
  badge y link "Más información".

### Desktop — `apps/frontend_sidebar_desktop/src/components/panels/ServicesPanel.tsx`

- Eliminado array `SERVICES` estático con los 5 servicios hardcodeados y los imports de
  iconos Lucide específicos.
- Agregado hook `useCatalogItems()` con `apiFetch('/api/v1/public/catalog/?app=desktop')`.
- Conservado íntegramente el diseño: header, banner de plan free con Sparkles, CTA dinámico
  ("Quiero esto" / "Más información" según plan), footer con link a digisider.com.
- Skeleton de 3 cards durante carga, estado de error con `AlertCircle`, estado vacío.
- Imagen del item o `icon_color` como fallback (div coloreado), badge si existe.
- El icono del panel en `IconStrip` es `Sparkles` (venía del pull — no se modificó).

## Resultado

Los servicios digitales se gestionan ahora desde el Admin Panel (crear, editar, eliminar,
reordenar, subir imagen, activar/desactivar, asignar a apps destino) y se reflejan
automáticamente en el Hub landing y el Desktop sin redeploy. Se puede ampliar a mobile u
otras apps futuras agregando `'mobile'` al `target_apps` de cada item.
