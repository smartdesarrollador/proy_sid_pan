# Bug Fix Report — Snippets no listaba en Desktop App (Tauri)
**Fecha**: 2026-03-15
**Componente**: `apps/frontend_sidebar_desktop/`
**Severidad**: Alta — funcionalidad core del panel de snippets rota
**Estado**: ✅ Resuelto

---

## Resumen Ejecutivo

El panel de Snippets en la app de escritorio (Tauri v2 + React + Windows) mostraba
"Failed to fetch" y posteriormente "No tienes snippets aún", a pesar de que el mismo
usuario sí veía sus snippets en el Workspace (`workspace.local.test/snippets`).

Se identificaron y corrigieron **dos bugs encadenados**:

1. **CORS bloqueaba el fetch** — el origen de Tauri no estaba en `CORS_ALLOWED_ORIGINS`.
2. **`X-Tenant-Slug` header faltaba** — `TenantMiddleware` retornaba `None` como tenant, haciendo que el query filtrara contra `tenant=None` y devolviera lista vacía.

---

## Síntomas

| Síntoma | Observado |
|---------|-----------|
| Panel muestra "Failed to fetch" | Sí (primera fase) |
| Panel muestra "No tienes snippets aún" | Sí (segunda fase, tras fix de CORS) |
| Workspace lista snippets correctamente | Sí — mismo usuario y tenant |
| Backend corriendo | Sí — contenedores Docker en WSL activos |
| Login en desktop funcionaba | Sí — auth via deep link del Hub |

**Captura del estado resuelto:**

![Snippets listando correctamente](../util/capturas/Nueva%20carpeta/1.jpg)

---

## Diagnóstico — Bug 1: CORS

### Causa raíz

El archivo `.env` del backend sobreescribe completamente el valor por defecto de
`CORS_ALLOWED_ORIGINS` definido en `base.py`:

```python
# config/settings/base.py — defaults que SÍ incluyen Tauri
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tauri.localhost',   # Tauri v2 Windows (WebView2)
    'tauri://localhost',         # Tauri v2 Linux/macOS
])
```

```env
# apps/backend_django/.env — sobreescribía sin incluir origins de Tauri
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,...
```

Cuando el WebView2 de Tauri hace `fetch()` desde `https://tauri.localhost` (producción)
o `http://localhost:1420` (dev), el servidor respondía el preflight OPTIONS con 403,
lo cual el navegador reporta como `"Failed to fetch"`.

### Fix aplicado

Agregar los tres origins de Tauri al final de `CORS_ALLOWED_ORIGINS` en `.env`:

```env
CORS_ALLOWED_ORIGINS=...,https://tauri.localhost,tauri://localhost,http://localhost:1420
```

| Origin | Cuándo aplica |
|--------|--------------|
| `https://tauri.localhost` | Build de producción en Windows (WebView2) |
| `tauri://localhost` | Build en Linux / macOS |
| `http://localhost:1420` | Modo dev (`npm run tauri dev`) |

---

## Diagnóstico — Bug 2: X-Tenant-Slug faltante

### Causa raíz

`TenantMiddleware` resuelve el tenant **exclusivamente** desde el header `X-Tenant-Slug`:

```python
# apps/tenants/middleware.py
def _resolve_tenant(self, request):
    slug = request.headers.get('X-Tenant-Slug')
    return self._get_by_slug(slug) if slug else None
```

`SnippetsPanel.tsx` enviaba solo el header de autorización:

```typescript
// ANTES — faltaba X-Tenant-Slug
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${accessToken}` },
})
```

Con `request.tenant = None`, el query en la vista filtraba:

```python
CodeSnippet.objects.filter(tenant=None, user=request.user)  # → siempre vacío
```

El Workspace sí funcionaba porque su cliente HTTP (axios) incluye `X-Tenant-Slug`
en todos los requests via interceptor.

Adicionalmente, la interfaz `DesktopTenant` en el authStore no declaraba el campo
`slug`, aunque el payload del SSO sí lo incluía (viene de `TenantSerializer`):

```typescript
// ANTES — sin slug
export interface DesktopTenant {
  id: string
  name: string
  plan: string
  primaryColor?: string
  subdomain?: string
}
```

### Fix aplicado

**1. `authStore.ts` — agregar campo `slug`:**

```typescript
export interface DesktopTenant {
  id: string
  name: string
  slug: string        // ← añadido
  plan: string
  primaryColor?: string
  subdomain?: string
}
```

**2. `SnippetsPanel.tsx` — leer slug del store y enviarlo en el header:**

```typescript
const tenantSlug = useAuthStore((s) => s.tenant?.slug)

// guard: no fetchear sin tenant
if (!accessToken || !tenantSlug) return

// header añadido
const res = await fetch(url, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'X-Tenant-Slug': tenantSlug,   // ← añadido
  },
})

// dependency array actualizado
}, [accessToken, tenantSlug])
```

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `apps/backend_django/.env` | Agregar origins Tauri a `CORS_ALLOWED_ORIGINS` |
| `apps/frontend_sidebar_desktop/src/store/authStore.ts` | Agregar campo `slug` a `DesktopTenant` |
| `apps/frontend_sidebar_desktop/src/components/panels/SnippetsPanel.tsx` | Leer `tenantSlug`, enviarlo como `X-Tenant-Slug`, guard y deps |

---

## Flujo correcto post-fix

```
1. Usuario hace login en Desktop via Hub (deep link)
   └─► SSO validate devuelve { access_token, tenant: { id, name, slug, ... } }
   └─► authStore guarda tenant.slug en localStorage

2. SnippetsPanel monta con isAuthenticated=true
   └─► fetchSnippets() con:
         Authorization: Bearer <jwt>
         X-Tenant-Slug: test-company   ← nuevo

3. TenantMiddleware resuelve tenant desde header → request.tenant = <Tenant obj>

4. Vista filtra: CodeSnippet.objects.filter(tenant=<obj>, user=request.user)
   └─► Retorna { snippets: [...] }  ✅
```

---

## Lecciones aprendidas

1. **`env.list()` con override total** — cuando `.env` define `CORS_ALLOWED_ORIGINS`,
   los defaults de `base.py` son ignorados. Cualquier nuevo origen (Tauri, apps futuras)
   debe agregarse explícitamente al `.env`, no solo al `base.py`.

2. **El header `X-Tenant-Slug` es obligatorio** en todos los endpoints de `/api/v1/app/`.
   Cualquier cliente nuevo (desktop, mobile, CLI) debe incluirlo. Considerar documentarlo
   en `docs/guides/` o en el Swagger schema.

3. **Tauri WebView2 origin** — en Windows, el origen de la WebView2 en producción es
   `https://tauri.localhost`, no `http://localhost`. Diferencia crítica para CORS.

4. **Interfaces TypeScript desincronizadas con serializers** — `DesktopTenant` no tenía
   `slug` aunque `TenantSerializer` sí lo retornaba. Mantener ambos sincronizados.

---

## Acciones recomendadas

- [ ] Agregar `X-Tenant-Slug` a la documentación de la API (Swagger `@extend_schema`)
      como header requerido en endpoints `/api/v1/app/`.
- [ ] Crear un `apiClient` centralizado en el desktop app (similar al axios instance
      del Workspace) que inyecte automáticamente `Authorization` y `X-Tenant-Slug`
      en cada request, para no repetir esta lógica en cada panel.
- [ ] Agregar test de integración que verifique que un request sin `X-Tenant-Slug`
      retorna lista vacía (no 401/403 — el comportamiento silencioso puede confundir).
