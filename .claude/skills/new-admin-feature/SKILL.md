---
name: new-admin-feature
description: >
  Andamiar una nueva sección/feature del Admin Panel (`apps/frontend_admin`, React + Vite + TanStack
  Query + Tailwind) siguiendo las convenciones ya establecidas en sus ~20 features (PASOS 5-21:
  usuarios, roles, clientes, promociones, soporte, etc.). Usar cuando se pida "crear/agregar una
  sección/página/módulo en el Admin Panel", "nueva feature de administración", "agrega X al panel de
  admin", "scaffold de una vista admin", o cuando haya que crear la carpeta del recurso en `src/features/` con sus
  tipos, hooks de TanStack Query, componentes (tabla/modal/badge), página, wrapper de `src/pages/`,
  ruta lazy en el router, item del Sidebar y tests. Reproduce las convenciones exactas del proyecto
  (queryKey `['admin-X']`, `apiClient`, trailing slash, gating con `hasPermission`, skeleton/empty
  states) y evita los gotchas de test recurrentes. NO aplica a Hub/Workspace/Vista (otros frontends).
---

# New Admin Feature — Scaffold de una sección del Admin Panel

Genera una feature nueva en `apps/frontend_admin/src/features/<X>/` idéntica en estructura y
convenciones a las existentes (mirar `promotions`, `clients`, `support` como referencia canónica).

## Anatomía de una feature (lo que se crea)

```
src/features/<x>/
├── types.ts                       # tipos del recurso + request types
├── hooks/
│   ├── use<Xs>.ts                 # useQuery lista
│   ├── useCreate<X>.ts            # useMutation crear
│   ├── useUpdate<X>.ts            # useMutation editar
│   └── useDelete<X>.ts            # useMutation eliminar (si aplica)
├── components/
│   ├── <X>Table.tsx  (o <X>Card)  # skeleton 5 filas animate-pulse + empty state
│   ├── <X>Filters.tsx             # búsqueda + selects
│   ├── <X>Modal.tsx               # react-hook-form + zod
│   └── <X>Badge.tsx               # config de colores/labels EXPORTADA
├── <X>Page.tsx                    # default export; filtros + paginación + gating
└── __tests__/<X>Page.test.tsx
src/pages/<X>Page.tsx              # wrapper: export { default } from '@/features/<x>/<X>Page'
```

Más wiring: `src/router/index.tsx` (ruta lazy) y `src/layouts/components/Sidebar.tsx` (item del menú).

## Workflow (seguir en orden)

1. **Definir el recurso y los permisos backend.** Confirmar los codenames RBAC reales que gobiernan la
   feature (`<recurso>.read/create/update/delete/...`). Deben existir en el fixture `seed_permissions`
   del backend, o el gating fallará / dará 403 (ver `lessons-learned` LL-061). Si no existen, marcarlo
   como dependencia backend.
2. **Crear los archivos de la feature** usando las plantillas exactas en
   [references/templates.md](references/templates.md). Reemplazar `<X>`/`<x>`/`<recurso>` y los campos.
3. **Crear el wrapper** `src/pages/<X>Page.tsx` (una línea de re-export).
4. **Registrar la ruta lazy** en `src/router/index.tsx` (importar desde `@/pages/<X>Page`).
5. **Añadir el item al Sidebar** en `src/layouts/components/Sidebar.tsx` (grupo + icono lucide +
   `permission`). Añadir la clave i18n del label si el grupo usa `t('menu.x')`.
6. **Escribir el test** de la página con la plantilla y el catálogo de gotchas en
   [references/testing.md](references/testing.md).
7. **Verificar**: `npm run typecheck` && `npm test` && `npm run build` (los tres deben pasar; el build
   corre `tsc` y no perdona — ver `lessons-learned` LL-079).

## Convenciones obligatorias (de las features existentes)

| Tema | Convención |
|------|-----------|
| Cliente HTTP | `import { apiClient } from '@/lib/api'`. Ya inyecta `Authorization` + `X-Tenant-Slug` por interceptor — la feature NO los maneja. |
| Endpoints | `/admin/<recurso>/` **con trailing slash** (LL-001). El `apiClient` ya antepone `/api/v1`. |
| queryKey | Lista: `['admin-<recurso>']`. Detalle: `['admin-<recurso>', id]`. Las mutaciones invalidan esa key. |
| staleTime | Listas mutables: `60_000`. Catálogos casi estáticos (permisos, planes): `5 * 60_000`. |
| Respuesta lista | El backend devuelve `{ <recurso>: T[] }` → `data?.<recurso> ?? []`. |
| Gating | `const { hasPermission } = usePermissions()` → `canCreate = hasPermission('<recurso>.create')`, etc. Pasar `canX` como props a los componentes para mostrar/ocultar botones. |
| Loading | Skeleton con `<tr className="animate-pulse">` (×5) en tablas; `animate-pulse` en cards. |
| Empty state | `!isLoading && items.length === 0` → mensaje + icono lucide. |
| Filtros/paginación | En la Page con `useState` + `useMemo` (filtrado en frontend). `PER_PAGE` constante (15-20). |
| Modales | `react-hook-form` + `zod` + `role="dialog" aria-modal="true" aria-labelledby` + `useFocusTrap`. Zod v4: `z.number({ error: '...' })` (NO `invalid_type_error`). |
| Badges | Exportar los `Record<Status, string>` de clases/labels desde el componente (reutilizables en tests y otras vistas). |
| Page export | `export default function <X>Page()`. El router carga vía `@/pages/<X>Page` → `{ Component: m.default }`. |

## Wiring exacto

**Router** (`src/router/index.tsx`) — añadir dentro del array de children del `AppLayout`:
```tsx
{
  path: '<x>',
  lazy: () => import('@/pages/<X>Page').then((m) => ({ Component: m.default })),
},
```

**Sidebar** (`src/layouts/components/Sidebar.tsx`) — añadir el item al grupo adecuado
(`main` / `management` / `Administración` / `system`). Importar el icono de `lucide-react`:
```tsx
{ label: t('menu.<x>'), to: '/<x>', icon: <IconLucide>, permission: '<recurso>.read' },
// permission: null si la sección no se restringe por RBAC
```

**i18n** — si el grupo usa `t('menu.<x>')`, añadir la clave en los locales (es/en). Si no, usar el
label literal como hacen varias secciones de los grupos `Administración`/`system`.

## Antes de terminar

- Correr typecheck + test + build (paso 7). No omitir: el build de prod usa `tsc` estricto.
- Si surgió un bug no trivial durante el scaffold, registrarlo en el skill `lessons-learned`.
- Patrones DRF del lado backend (permisos, serializers, trailing slash): ver skill `api-endpoint-conventions`
  si existe, o la sección A/G de `lessons-learned/references/knowledge-base.md`.
