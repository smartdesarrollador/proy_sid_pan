# Bóveda en Sidebar Desktop (Tauri v2)

**Fecha:** 2026-06-28
**App:** `apps/frontend_sidebar_desktop`
**Tipo:** Feature — port del Vault del Workspace al sidebar desktop

---

## Resumen

Port completo de la Bóveda al `VaultPanel` del sidebar desktop, reutilizando los mismos
endpoints del backend (`/api/v1/app/vault/`). 22 archivos nuevos + 5 modificados. Sin añadir
dependencias: patrón `useState`/`apiFetch` igual que los demás paneles. Layout drill-down
`lista → detalle / formulario` para el panel angosto (200–600 px, default 320 px).

---

## Archivos modificados (5)

| Archivo | Cambio |
|---------|--------|
| `src/lib/apiFetch.ts` | Añade parámetro `path` a `buildHeaders`; inyecta `X-Vault-Token` cuando la ruta contiene `/vault/` |
| `src/types/index.ts` | Agrega `"vault"` a la unión `PanelId` |
| `src/store/settingsStore.ts` | Agrega `"vault"` a `DEFAULT_SIDEBAR_ORDER`; lógica de migración automática que inserta paneles nuevos en el orden guardado sin borrar preferencias del usuario |
| `src/components/IconStrip.tsx` | Agrega entrada `vault` con icono `ShieldCheck` (lucide) |
| `src/components/panels/PanelContainer.tsx` | Registra `VaultPanel` en `PANEL_MAP` |

## Archivos nuevos (22)

### Store efímero
- `src/store/vaultStore.ts` — `unlockToken` + `expiresAt` en Zustand **sin** `localStorage` (recarga = re-lock)

### Types
- `src/features/vault/types.ts` — `VaultItem`, `VaultItemRevealed`, `VaultStatus`, `UnlockResponse`, `SetupResponse`, `VaultItemsFilters`, tipos de petición
- `src/features/vault/itemTypes.ts` — metadata por tipo (login/api_key/secure_note/card): icono, label, campos, colores dark-theme

### Hooks (7)
| Hook | Endpoint | Notas |
|------|----------|-------|
| `useVaultStatus` | `GET /api/v1/app/vault/master-password/` | Retorna `is_configured` + `is_unlocked` |
| `useUnlockVault` | `POST /api/v1/app/vault/unlock/` | Maneja 401 (pass incorrecta) y 429 (rate-limit) |
| `useLockVault` | `POST /api/v1/app/vault/lock/` | Siempre llama `vaultStore.lock()` en `finally`, independientemente de la respuesta |
| `useVaultItems` | `GET /api/v1/app/vault/items/` | Suscribe a `unlockToken`/`expiresAt` para re-fetch automático al desbloquear; respuesta `{ items: [], count: N }` |
| `useVaultItemMutations` | reveal/create/update/delete | Llama `refetchItems()` en cada mutación exitosa |
| `useMasterPassword` | setup/change/recover | Tres operaciones: `POST`, `PUT`, `POST /recover/` |

### Componentes (6)
| Componente | Descripción |
|-----------|-------------|
| `ItemTypeBadge` | Badge compacto dark con icono + label del tipo |
| `SetupView` | Configuración inicial: input con confirmación → muestra recovery code → "Ya lo guardé → Entrar" |
| `UnlockView` | Input de contraseña + botón desbloquear + recovery inline (sin modal) |
| `ItemList` | Header (count/`+`/lock) + buscador + pills de tipo + lista compacta |
| `ItemDetail` | Drill-down: campos con toggle de visibilidad y copy; reveal automático al montar |
| `ItemForm` | Crear/editar: tipo selector + campos dinámicos por tipo + campos secret con eye+copy |

### Orquestador
- `src/components/panels/VaultPanel.tsx` — máquina de vistas: `setup → unlock → list → detail/form`; timer de expiración con `setTimeout`

---

## Decisiones de diseño

- **Sin React Router:** setup, unlock, detalle y formulario son vistas inline del mismo componente (drill-down), no rutas separadas
- **Vault token efímero:** no se persiste en `localStorage` — desconexión/recarga fuerza re-unlock (igual que el workspace)
- **X-Vault-Token en `buildHeaders`:** se lee `useVaultStore.getState()` fuera de React, aprovechando que Zustand expone `getState()` globalmente
- **Suscripción a valores primitivos:** `useVaultStore((s) => s.unlockToken)` + `useVaultStore((s) => s.expiresAt)` en vez de `s.isUnlocked` (función), para que los componentes re-rendericen cuando cambia el estado real del store

---

## Bugs encontrados y corregidos durante implementación

### Bug 1 — `settingsStore`: panel nuevo no aparecía en sidebar existente
**Síntoma:** Icono de bóveda no aparecía después de agregar `"vault"` a `DEFAULT_SIDEBAR_ORDER`.
**Causa:** `load()` hacía `{ ...DEFAULTS, ...parsed }` — si `sidebarOrder` ya estaba guardado en `localStorage`, el default nunca se aplicaba.
**Fix:** Detectar paneles de `DEFAULT_SIDEBAR_ORDER` que no estén en el orden guardado e insertarlos antes de `"profile"`. Esto aplica a cualquier panel nuevo que se agregue en el futuro.

### Bug 2 — `isUnlocked` como función en Zustand
**Síntoma:** Al desbloquear la bóveda, el sidebar se ponía blanco con `TypeError: items.map is not a function`.
**Causa raíz 1:** `useVaultStore((s) => s.isUnlocked)` devuelve la referencia a la función, que nunca cambia → el componente no re-renderizaba al cambiar `unlockToken` → `VaultPanel` no pasaba de `UnlockView` a `ItemList`.
**Causa raíz 2:** `setItems(data.results ?? data)` — el backend devuelve `{ items: [...], count: N }`, no `{ results: [...] }`. `raw.results` siempre era `undefined` → `setItems(objetoPaginado)` → `items.map` fallaba.
**Fix:** Suscribir a `unlockToken` + `expiresAt` (valores primitivos) en `useVaultItems` y `VaultPanel`; extraer items como `raw.items`.

### Bug 3 — ítems no aparecían tras crear/cargar
**Síntoma:** Ítems creados en el workspace (o desde el propio desktop) no aparecían en el desktop.
**Causa:** La clave de respuesta del endpoint de lista es `items`, no `results`. Mi guard de tipo buscaba `raw.results` → siempre `undefined` → siempre `[]`.
**Fix:** `Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []`

---

## Flujo completo verificado

1. Sin vault configurado → `SetupView` (input + confirmación + recovery code)
2. Después de setup → `UnlockView` (contraseña maestra)
3. Desbloqueo exitoso → `ItemList` (vacía si no hay ítems)
4. Crear ítem → `ItemForm` (tipo selector + campos dinámicos) → vuelve a lista con ítem
5. Click en ítem → `ItemDetail` (reveal automático + copy de campos)
6. Editar ítem → `ItemForm` con datos actuales → vuelve a detail
7. Bloquear (ícono 🔒) → `UnlockView`
8. Recargar app → `UnlockView` (token efímero no persiste)
9. ítems sincronizados con workspace (mismo backend, mismo tenant)
