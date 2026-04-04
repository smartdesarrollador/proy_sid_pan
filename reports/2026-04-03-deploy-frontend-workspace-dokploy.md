# Deploy: frontend_workspace en Dokploy

**Fecha:** 2026-04-03
**App:** `apps/frontend_workspace` (React + Vite + nginx)
**Dominio:** `workspace.smartdigitaltec.com`
**VPS:** `62.72.9.127` — Dokploy v0.28.8 + Traefik
**Repo:** `github.com/smartdesarrollador/front_ws_sp`
**Resultado:** ✅ Deployado y funcional con SSO desde Hub

---

## Archivos creados/modificados para el deploy

| Archivo | Acción |
|---|---|
| `Dockerfile` | Modificado — agrega `ARG/ENV VITE_HUB_URL` |
| `nginx/nginx.conf` | Sin bloque `/api/` — solo SPA routing |
| `docker-compose.dokploy.yml` | Creado — Traefik labels + build args |
| `src/lib/axios.ts` | Corregido — `tenant?.slug` → `tenant?.subdomain` |
| `src/features/calendar/components/EventModal.tsx` | Corregido — `start_datetime/end_datetime` → `start_date/end_date` |
| `src/features/ssl-certs/components/SSLCertModal.tsx` | Corregido — tipo `FormValues` con zodResolver |
| `src/features/tasks/__tests__/TasksPage.test.tsx` | Corregido — prioridades en inglés (`high/low`) |
| `src/test/a11y/tasks.a11y.test.tsx` | Corregido — cast `as unknown as ReturnType<...>` |
| `src/features/forms/__tests__/FormsPage.test.tsx` | Corregido — cast `as unknown as ReturnType<...>` |

---

## Pasos del deploy

### Paso 1 — Crear servicio en Dokploy
- Add Service → Docker Compose
- Nombre: `frontend-workspace`
- Source: GitHub → `front_ws_sp` → branch `main`
- Compose Path: `./docker-compose.dokploy.yml`

### Paso 2 — Variables de entorno en Dokploy
```
VITE_API_URL=https://api-rbac.smartdigitaltec.com
VITE_APP_NAME=Workspace
VITE_APP_VERSION=1.0.0
VITE_HUB_URL=https://hub.smartdigitaltec.com
WORKSPACE_DOMAIN=workspace.smartdigitaltec.com
```

### Paso 3 — Dominio y SSL
- Domains → Add Domain
- Host: `workspace.smartdigitaltec.com` | Port: `80`
- HTTPS → Let's Encrypt

### Paso 4 — Deploy
- Click en **Deploy**
- Build exitoso — `Docker Compose Deployed: ✅`

### Paso 5 — Configuración post-deploy en el backend

#### 5a — Activar servicio workspace para el tenant
```bash
sudo docker exec -it rbacplatform-backenddjango-pmlmat-django-1 python manage.py shell
```
```python
from apps.tenants.models import Tenant
from apps.services.models import Service, TenantService

tenant = Tenant.objects.get(subdomain='cliente1')
workspace = Service.objects.get(slug='workspace')
svc, created = TenantService.objects.get_or_create(
    tenant=tenant,
    service=workspace,
    defaults={'status': 'active'}
)
svc.status = 'active'
svc.save()
```

#### 5b — Corregir URL del servicio workspace
```python
s = Service.objects.get(slug='workspace')
s.url_template = 'https://workspace.smartdigitaltec.com/sso/callback'
s.save()
```

---

## Problemas encontrados y soluciones

### Problema 1 — TypeScript: `Property 'slug' does not exist on type 'Tenant'`
**Archivo:** `src/lib/axios.ts`
**Causa:** El tipo `Tenant` tiene `subdomain`, no `slug`.
**Solución:**
```typescript
// Antes
config.headers['X-Tenant-Slug'] = tenant?.slug
// Después
config.headers['X-Tenant-Slug'] = state.tenant?.subdomain
```

### Problema 2 — TypeScript: campos incorrectos en EventModal
**Archivo:** `src/features/calendar/components/EventModal.tsx`
**Causa:** El payload usaba `start_datetime/end_datetime` pero `CreateEventRequest` requiere `start_date/end_date`.
**Solución:**
```typescript
const payload = {
  ...rest,
  start_date,   // era: start_datetime: start_date
  end_date,     // era: end_datetime: end_date
  color: CATEGORY_COLORS[data.category],
}
```

### Problema 3 — TypeScript: zodResolver type mismatch en SSLCertModal
**Archivo:** `src/features/ssl-certs/components/SSLCertModal.tsx`
**Causa:** `z.boolean().default(false)` genera un tipo de input con `auto_renew?: boolean | undefined` en `z.infer`, incompatible con `zodResolver` que espera `boolean` requerido.
**Solución:** Eliminar `.default()` del schema y dejar el default solo en `useForm.defaultValues`:
```typescript
// Schema
auto_renew: z.boolean(),   // sin .default()

// useForm
defaultValues: { auto_renew: false }  // default aquí
```

### Problema 4 — TypeScript: valores de prioridad en español en tests
**Archivo:** `src/features/tasks/__tests__/TasksPage.test.tsx`
**Causa:** El tipo `TaskPriority = 'high' | 'medium' | 'low'` pero los mocks usaban `'alta'` y `'baja'`.
**Solución:**
```typescript
priority: 'high',  // era: 'alta'
priority: 'low',   // era: 'baja'
```

### Problema 5 — TypeScript: cast incorrecto en tests de a11y y forms
**Archivos:** `src/test/a11y/tasks.a11y.test.tsx`, `src/features/forms/__tests__/FormsPage.test.tsx`
**Causa:** Mock object no tiene suficiente overlap con `UseQueryResult` para cast directo.
**Solución:**
```typescript
} as unknown as ReturnType<typeof useTasks>)
// en vez de:
} as ReturnType<typeof useTasks>)
```

### Problema 6 — SSO redirige a `workspace.local.test` (502 Bad Gateway)
**Causa:** El modelo `Service` en la base de datos tenía `url_template = 'http://workspace.local.test/sso/callback'` (URL de desarrollo).
**Solución:** Actualizar vía Django shell:
```python
s = Service.objects.get(slug='workspace')
s.url_template = 'https://workspace.smartdigitaltec.com/sso/callback'
s.save()
```

### Problema 7 — Logout redirige a `localhost:5175/login`
**Causa:** `VITE_HUB_URL` no estaba definido en el build — el código usa `import.meta.env.VITE_HUB_URL ?? 'http://localhost:5175'` como fallback.
**Causa raíz:** La variable era runtime env var en Dokploy, pero `VITE_*` se hornean en el bundle durante `npm run build` — necesitan ser **build args** en Docker.
**Solución:** Agregar `VITE_HUB_URL` al `Dockerfile` y `docker-compose.dokploy.yml`:
```dockerfile
ARG VITE_HUB_URL
ENV VITE_HUB_URL=${VITE_HUB_URL}
```
```yaml
args:
  VITE_HUB_URL: ${VITE_HUB_URL:-https://hub.smartdigitaltec.com}
```
El valor por defecto `https://hub.smartdigitaltec.com` en el compose garantiza que funcione aunque no se ponga la variable en Dokploy.

---

## Verificación final

| Check | Resultado |
|---|---|
| Contenedor corriendo | `Up X minutes` ✅ |
| `workspace.smartdigitaltec.com` carga | ✅ |
| Hub → Abrir Workspace → SSO | Redirige a `/sso/callback` → sesión cargada ✅ |
| Workspace → Cerrar sesión | Redirige a `hub.smartdigitaltec.com/login?next=workspace` ✅ |

---

## Estado de deploys

| App | Dominio | Estado |
|---|---|---|
| Admin Panel | `admin.smartdigitaltec.com` | ✅ Deployado |
| Hub Client Portal | `hub.smartdigitaltec.com` | ✅ Deployado |
| Workspace | `workspace.smartdigitaltec.com` | ✅ Deployado |
| Vista (Next.js) | `vista.smartdigitaltec.com` | Pendiente |
| Desktop (Tauri) | — | No aplica (app de escritorio) |
