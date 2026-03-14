# Incidente: Creación de Snippets fallaba con 500 (IntegrityError)

**Fecha:** 2026-03-14
**Severidad:** Alta
**Estado:** Resuelto
**Entorno:** `workspace.local.test` → `rbac.local.test`

---

## Síntoma

Al intentar crear un snippet desde el Workspace (`POST /api/v1/app/snippets/`), el backend devolvía HTTP 500 con el error:

```
IntegrityError: null value in column "tenant_id" of relation "snippets"
violates not-null constraint
```

La UI mostraba "Ocurrió un error. Intenta de nuevo." y el snippet nunca aparecía en la lista.

Adicionalmente, aunque el snippet se creara correctamente en la base de datos, la lista seguía mostrando "No hay snippets" (contador en 0).

---

## Causa raíz — Cadena de 5 bugs encadenados

### Bug 1 — Permisos `snippets.*` ausentes en seed
**Archivo:** `apps/rbac/management/commands/seed_permissions.py`
Los permisos `snippets.read`, `snippets.create`, `snippets.update`, `snippets.delete` no existían en el fixture de permisos, por lo que cualquier request a `/app/snippets/` devolvía **403**.

### Bug 2 — Vista usaba `request.user.has_perm()` en vez de RBAC custom
**Archivo:** `apps/snippets/views.py`
Los métodos POST, PATCH y DELETE usaban `request.user.has_perm('snippets.create')` (Django auth estándar), que siempre fallaba porque los permisos están en el sistema RBAC custom, no en `auth_permissions`. Se debía usar `_user_has_permission(request.user, 'snippets.create')`.

### Bug 3 — SSO validate no retornaba `tenant` en la respuesta
**Archivo:** `apps/auth_app/sso_views.py`
El endpoint `POST /api/v1/auth/sso/validate/` retornaba `{ access_token, refresh_token, user }` pero omitía `tenant`. El workspace frontend esperaba `data.tenant` para persistirlo en `localStorage`, por lo que `ws-authTenant` nunca se guardaba.

### Bug 4 — `AuthContext.tsx` no manejaba `localStorage` corrupto
**Archivo:** `apps/frontend_workspace/src/features/auth/AuthContext.tsx`
Al restaurar sesión, el código hacía:
```typescript
if (savedTenant) setTenant(JSON.parse(savedTenant) as Tenant)
```
Si `ws-authTenant` contenía el string `"undefined"` (resultado de `JSON.stringify(undefined)`), `JSON.parse("undefined")` lanzaba un `SyntaxError` silencioso. `setTenant` nunca se llamaba → `state.tenant = null`.

Con `state.tenant = null`, el interceptor de axios en `axios.ts` no añadía el header `X-Tenant-Slug`:
```typescript
if (state.tenant?.slug) {
  config.headers['X-Tenant-Slug'] = state.tenant.slug  // nunca se ejecutaba
}
```
Sin ese header, el `TenantMiddleware` del backend resolvía `request.tenant = None`, causando el `IntegrityError` al intentar insertar el snippet.

### Bug 5 — `RefreshTokenView` no retornaba `user` ni `tenant`
**Archivo:** `apps/backend_django/apps/auth_app/views.py`
Al refrescar el token, la respuesta solo incluía `{ access_token, refresh_token }`. Esto impedía recuperar el tenant desde el backend cuando el localStorage estaba vacío o corrupto.

### Bug 6 — `useSnippets.ts` leía campo incorrecto de la respuesta
**Archivo:** `apps/frontend_workspace/src/features/snippets/hooks/useSnippets.ts`
El hook declaraba `interface SnippetsResponse { results: CodeSnippet[]; count: number }` y hacía `select: (data) => ({ snippets: data.results, total: data.count })`.
El backend devuelve `{ snippets: [] }`, por lo que `data.results` era `undefined` → la lista siempre mostraba 0 elementos aunque el POST 201 hubiera funcionado.

---

## Soluciones aplicadas

### Fix 1 — seed_permissions (sesión anterior ✅)
Añadidos los 4 permisos `snippets.*` al comando de seed y ejecutado `make seed-permissions`.

### Fix 2 — snippets/views.py (sesión anterior ✅)
```python
# Antes
if not request.user.has_perm('snippets.create'):

# Después
if not _user_has_permission(request.user, 'snippets.create'):
```

### Fix 3 — sso_views.py (sesión anterior ✅)
```python
return Response({
    'access_token': ...,
    'refresh_token': ...,
    'user': UserSerializer(user).data,
    'tenant': TenantSerializer(tenant).data,  # añadido
})
```

### Fix 4 — AuthContext.tsx ✅
```typescript
// Antes
if (savedTenant) setTenant(JSON.parse(savedTenant) as Tenant)

// Después
try {
  if (savedUser) setUser(JSON.parse(savedUser) as User)
} catch {
  localStorage.removeItem('ws-authUser')
}
try {
  if (savedTenant) setTenant(JSON.parse(savedTenant) as Tenant)
} catch {
  localStorage.removeItem('ws-authTenant')
}
// Sobreescribir con los datos frescos del refresh response
if (data.user) setUser(data.user)
if (data.tenant) setTenant(data.tenant)
if (data.user) localStorage.setItem('ws-authUser', JSON.stringify(data.user))
if (data.tenant) localStorage.setItem('ws-authTenant', JSON.stringify(data.tenant))
```

### Fix 5 — RefreshTokenView ✅
```python
def post(self, request):
    ...
    refresh = RefreshToken(raw_token)
    user = User.objects.select_related('tenant').get(pk=refresh['user_id'])
    return Response({
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': UserSerializer(user).data,      # añadido
        'tenant': TenantSerializer(user.tenant).data,  # añadido
    })
```

### Fix 6 — useSnippets.ts ✅
```typescript
// Antes
interface SnippetsResponse {
  results: CodeSnippet[]
  count: number
}
select: (data) => ({ snippets: data.results, total: data.count })

// Después
interface SnippetsResponse {
  snippets: CodeSnippet[]
}
select: (data) => ({ snippets: data.snippets, total: data.snippets.length })
```

### Fix 7 — test_sso.py ✅
Añadido assertion para prevenir regresión:
```python
self.assertIn('tenant', data)
self.assertIn('slug', data['tenant'])
```

---

## Diagnóstico en producción (pasos manuales)

Para detectar este problema en cualquier entorno:

1. Abrir DevTools → Application → Local Storage → `ws-authTenant`
2. Si el valor es `null`, `"undefined"` o ausente → el tenant no se está propagando
3. Verificar que el request a `/api/v1/app/snippets/` incluye el header `X-Tenant-Slug`
4. En el backend, verificar `request.tenant` en la vista antes de `objects.create()`

---

## Corrección de emergencia (sin redespliegue)

Si el localStorage está corrupto en una sesión activa, ejecutar en la consola del browser:

```javascript
// 1. Obtener el slug del tenant desde el JWT (campo name en el payload)
// 2. Inyectar el tenant manualmente
localStorage.setItem('ws-authTenant', JSON.stringify({
  id: "<tenant_uuid>",
  name: "<Tenant Name>",
  slug: "<tenant-slug>",
  subdomain: "<tenant-slug>",
  plan: "free",
  is_active: true
}))
// 3. Recargar la página
location.reload()
```

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/rbac/management/commands/seed_permissions.py` | Añadidos permisos `snippets.*` |
| `apps/backend_django/apps/snippets/views.py` | `_user_has_permission()` en POST/PATCH/DELETE |
| `apps/backend_django/apps/auth_app/sso_views.py` | Retorna `tenant` en validate response |
| `apps/backend_django/apps/auth_app/views.py` | `RefreshTokenView` retorna `user` + `tenant` |
| `apps/backend_django/apps/auth_app/tests/test_sso.py` | `assertIn('tenant', data)` en happy path |
| `apps/frontend_workspace/src/features/auth/AuthContext.tsx` | `try/catch` en `JSON.parse` + actualizar store desde refresh response |
| `apps/frontend_workspace/src/features/snippets/hooks/useSnippets.ts` | `SnippetsResponse.snippets` en vez de `.results` |
