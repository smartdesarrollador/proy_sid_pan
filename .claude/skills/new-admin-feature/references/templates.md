# Plantillas de código — feature del Admin Panel

Copiar y reemplazar: `<X>` (PascalCase singular, p.ej. `Webhook`), `<Xs>` (PascalCase plural),
`<x>` (kebab/lower, p.ej. `webhooks`), `<recurso>` (codename RBAC base, p.ej. `webhooks`).
Tomadas tal cual de `src/features/promotions` y `clients`.

## Tabla de contenidos
- [types.ts](#typests)
- [hook lista (useQuery)](#hook-lista-usequery)
- [hook mutación (useMutation)](#hook-mutación-usemutation)
- [Componente Table (skeleton + empty)](#componente-table-skeleton--empty)
- [Componente Badge (config exportada)](#componente-badge-config-exportada)
- [Page (default export)](#page-default-export)
- [Wrapper src/pages](#wrapper-srcpages)

## types.ts

```ts
export type <X>Status = 'active' | 'inactive'   // ajustar al dominio

export interface <X> {
  id: string
  name: string
  status: <X>Status
  created_at: string
  // ...campos del backend
}

export interface <X>CreateRequest {
  name: string
  // ...
}

export interface <X>UpdateRequest {
  id: string
  name?: string
  status?: <X>Status
}
```

## hook lista (useQuery)

`src/features/<x>/hooks/use<Xs>.ts`:
```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { <X> } from '../types'

export function use<Xs>() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-<recurso>'],
    queryFn: () =>
      apiClient.get<{ <recurso>: <X>[] }>('/admin/<recurso>/').then((r) => r.data),
    staleTime: 60_000,
  })

  return { <recurso>: data?.<recurso> ?? [], isLoading }
}
```

## hook mutación (useMutation)

`src/features/<x>/hooks/useCreate<X>.ts` (update/delete son análogos: PATCH `/admin/<recurso>/{id}/`,
DELETE `/admin/<recurso>/{id}/` → 204; todos invalidan `['admin-<recurso>']`):
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { <X>CreateRequest, <X> } from '../types'

export function useCreate<X>() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: <X>CreateRequest) =>
      apiClient.post<<X>>('/admin/<recurso>/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-<recurso>'] })
    },
  })
}
```
> Si la mutación se llama sin objeto de callbacks (`mutate(id)`), en el test el assert es
> `toHaveBeenCalledWith(id)` SIN `expect.any(Object)`.

## Componente Table (skeleton + empty)

`src/features/<x>/components/<X>Table.tsx`:
```tsx
import type { <X> } from '../types'

interface <X>TableProps {
  items: <X>[]
  isLoading: boolean
  canEdit: boolean
  onEdit: (item: <X>) => void
}

const COLUMNS = ['Nombre', 'Estado', 'Creado', 'Acciones']  // última col no vacía (a11y, LL de PASO 19)

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {COLUMNS.map((c) => (
        <td key={c} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
      ))}
    </tr>
  )
}

export function <X>Table({ items, isLoading, canEdit, onEdit }: <X>TableProps) {
  return (
    <table className="min-w-full">
      <thead><tr>{COLUMNS.map((c) => <th key={c} className="px-4 py-2 text-left">{c}</th>)}</tr></thead>
      <tbody>
        {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        {!isLoading && items.length === 0 && (
          <tr><td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-500">
            No hay registros aún
          </td></tr>
        )}
        {!isLoading && items.map((item) => (
          <tr key={item.id}>
            <td className="px-4 py-3">{item.name}</td>
            {/* ...celdas... */}
            <td className="px-4 py-3">
              {canEdit && (
                <button aria-label={`Editar ${item.name}`} onClick={() => onEdit(item)}>Editar</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Componente Badge (config exportada)

`src/features/<x>/components/<X>Badge.tsx`:
```tsx
import type { <X>Status } from '../types'

export const STATUS_BADGE_CLASSES: Record<<X>Status, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
}
export const STATUS_BADGE_LABELS: Record<<X>Status, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
}

export function <X>Badge({ status }: { status: <X>Status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}>
      {STATUS_BADGE_LABELS[status]}
    </span>
  )
}
```

## Page (default export)

`src/features/<x>/<X>Page.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { use<Xs> } from './hooks/use<Xs>'
import { useCreate<X> } from './hooks/useCreate<X>'
import { usePermissions } from '@/hooks/usePermissions'
import { <X>Table } from './components/<X>Table'
import type { <X> } from './types'

const PER_PAGE = 20

export default function <X>Page() {
  const { <recurso>, isLoading } = use<Xs>()
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('<recurso>.create')
  const canEdit = hasPermission('<recurso>.update')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editItem, setEditItem] = useState<<X> | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return <recurso>.filter((it) => !q || it.name.toLowerCase().includes(q))
  }, [<recurso>, search])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{/* Título */}</h1>
        {canCreate && (
          <button onClick={() => setEditItem(null)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        )}
      </header>
      {/* <X>Filters value={search} onChange={setSearch} */}
      <div className="card">
        <<X>Table items={paginated} isLoading={isLoading} canEdit={canEdit} onEdit={setEditItem} />
      </div>
      {/* paginación + <X>Modal cuando editItem/showModal */}
    </div>
  )
}
```

## Wrapper src/pages

`src/pages/<X>Page.tsx` (una línea):
```ts
export { default } from '@/features/<x>/<X>Page'
```
