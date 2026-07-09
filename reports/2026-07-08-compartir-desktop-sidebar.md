# Compartir (Notas/Contactos/Snippets + Bóveda) portado al Desktop Sidebar

**Fecha:** 2026-07-08
**Apps:** `apps/frontend_sidebar_desktop` (consulta: `apps/frontend_workspace`, `apps/backend_django`)
**Origen:** el usuario ya tenía compartir + selección múltiple en lote (Notas/Contactos/Snippets) y
compartir de ítems de Bóveda (cifrado E2E) funcionando en `frontend_workspace`, y pidió llevar ambas
funcionalidades al Desktop (Tauri), adaptadas a su contenedor mucho más angosto (~300-320px de panel
visible vs. el ancho libre de un navegador).

## Resumen

Sesión en dos partes, cada una analizada primero (consulta "cómo lo implementarías") y luego
implementada tras confirmación explícita:

1. **Compartir + selección múltiple** en Notas, Contactos y Snippets del Desktop.
2. **Compartir ítems de la Bóveda** (por ítem individual, sin selección múltiple) del Desktop.

Ambas partes reutilizan los mismos endpoints backend que ya usaba el Workspace — **cero cambios de
backend** en toda la sesión. El hallazgo arquitectónico clave, común a las dos partes: `frontend_sidebar_desktop`
no comparte código con `frontend_workspace` (no usa TanStack Query, no tiene `axios`/`apiClient`, no
existía ningún módulo de sharing) — cada pieza se reimplementó siguiendo las convenciones propias de
esta app (`useState` + `apiFetch()`, sin cache).

---

## 1. Compartir + selección múltiple (Notas, Contactos, Snippets)

**Adaptación al contenedor angosto:** un modal centrado tipo `ShareResourceModal` (max-w-md) no cabe
en el panel. Se reutilizó el patrón que la app ya tenía resuelto para Crear/Editar — un **bloque que
se expande dentro del propio panel** (mismo estilo que `NoteForm`/`ContactForm`/`SnippetForm`) — en
vez de inventar un modal flotante nuevo.

**Nuevo, compartido por los 3 paneles:**
- `src/lib/sharing.ts` — funciones planas sobre `apiFetch` (`fetchTeamDirectory`,
  `fetchResourceShares`, `createShare`, `revokeShare`), mismos endpoints que
  `useTeamDirectory`/`useCreateShare`/etc. del Workspace pero sin React Query (no hay cache, cada
  apertura del bloque vuelve a pedir datos).
- `src/components/shared/ShareBlock.tsx` — bloque inline; con 1 solo recurso se comporta como el
  Workspace (muestra "Con acceso" + revocar); con varios, oculta esa sección y corre
  `Promise.allSettled` mostrando un resumen ("3/3 compartidos" o "2/3 — 1 falló").
- `src/components/shared/BulkSelectBar.tsx` — versión compacta icon-first de la barra de acciones en
  lote ("N sel." + Compartir + Cancelar).

**Por cada panel:** tipos con `is_shared`/`shared_by_name` (el backend ya los devolvía, solo faltaba
consumirlos), badge compacto (ícono `Share2` + tooltip, sin texto para no romper el `truncate` en
filas angostas), botón "Compartir" en el grupo de acciones on-hover, botón "Seleccionar" en el
header que activa checkboxes (reemplazan el chevron de expandir) + `BulkSelectBar`.

## 2. Compartir ítems de la Bóveda (por ítem, sin selección múltiple)

**Hallazgo clave:** toda la criptografía de la Bóveda (X25519/ECDH/HKDF/Fernet, sealed-box) vive
exclusivamente en `apps/backend_django/apps/vault/crypto.py`. Ningún frontend implementa crypto en
JS — ambos son clientes REST delgados. El cliente solo envía la contraseña maestra una vez a
`/unlock/`; el servidor cachea el DEK + la clave privada bajo un `unlock_token` opaco, reenviado vía
header `X-Vault-Token` (ya manejado automáticamente por `apiFetch.ts` para cualquier path `/vault/`).
**Esto convirtió la tarea en un port de UI + REST, no un port de criptografía.**

Confirmado con el usuario antes de implementar: sin checkbox / sin selección múltiple aquí — un solo
email por ítem, igual que en el Workspace (el modelo `VaultShare` tampoco tiene niveles de permiso,
a diferencia del sharing genérico).

- `src/lib/vaultSharing.ts` (nuevo) — `fetchVaultItemShares`, `shareVaultItem`, `revokeVaultShare`
  sobre `apiFetch`; los mensajes de error del backend (`self_share`, `recipient_no_vault_key`,
  `vault_locked`) ya vienen en español listos para mostrar (`error.message`), solo se agregó el
  mensaje estándar de upgrade de plan para 402.
- `src/features/vault/components/VaultShareBlock.tsx` (nuevo) — mismo patrón visual que `ShareBlock`
  pero sin selector de permiso ni lógica bulk; "Con acceso" siempre visible.
- `src/features/vault/components/ItemDetail.tsx` — botón `Share2` junto a Editar/Eliminar en el
  header del detalle, togglea el bloque de compartir. `VaultPanel.tsx` no se tocó.

---

## Verificación

- Backend: sin cambios en ninguna de las dos partes (endpoints ya existentes, agnósticos al cliente).
- Frontend Desktop: `npx tsc --noEmit` y `npx vite build` limpios tras cada parte.
- **Prueba manual confirmada por el usuario** en el entorno real (Tauri/`npm run dev`): compartir
  individual y en lote en Notas/Contactos/Snippets, y compartir de ítems de Bóveda — funcionando
  correctamente.
- Esta app no tenía `node_modules` instalado al empezar la sesión (`npm install` se corrió una vez).

## Fuera de alcance / deuda dejada intencionalmente

- No se agregó infraestructura de testing a `frontend_sidebar_desktop` (no existía antes de esta
  sesión — ver deuda técnica nueva abajo).
- No se implementó una vista "Compartido conmigo" en el Desktop (ni para Notas/Contactos/Snippets ni
  para Bóveda) — sería un panel nuevo no pedido en ninguna de las dos partes.
- No se instaló ninguna librería de criptografía en el Desktop (no hace falta — todo el cifrado de
  Bóveda es server-side).
