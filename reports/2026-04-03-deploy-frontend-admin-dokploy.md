# Deploy frontend_admin en Dokploy — 2026-04-03

## Resumen

Deploy exitoso de `apps/frontend_admin` (React + Vite + nginx) en VPS `62.72.9.127` bajo Dokploy v0.28.8 con Traefik como reverse proxy.

- **URL**: https://admin.smartdigitaltec.com
- **Proyecto Dokploy**: `rbac-platform` / environment: `production` / servicio: `frontend-admin`
- **Contenedor**: `rbacplatform-frontendadmin-xyhgp7-admin-1`
- **Repo**: `github.com/smartdesarrollador/front_ad_sp`

---

## Stack

- React 18 + Vite 5 + TypeScript
- nginx:1.25-alpine (sirve el bundle estático)
- Docker multi-stage build: `base → builder → prod`
- Traefik (gestionado por Dokploy) para SSL y routing

---

## Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `apps/frontend_admin/docker-compose.dokploy.yml` | Creado — Compose con labels Traefik completos |
| `apps/frontend_admin/nginx/nginx.conf` | Eliminado bloque `/api/` proxy (ver Problema 2) |
| `apps/frontend_admin/Dockerfile` | Cambiado destino del COPY nginx.conf (ver Problema 3) |
| `apps/frontend_admin/src/lib/api.ts` | Fix `tenant?.slug` → `tenant?.subdomain` |
| 5 archivos de test | Agregado `is_staff: true/false` al mock `User` |

---

## Configuración en Dokploy

### Tipo de servicio
**Compose** (no Application) — permite usar `docker-compose.dokploy.yml` con labels Traefik manuales.

### Build Args (pestaña Environment → Build)
```
VITE_API_URL=https://api-rbac.smartdigitaltec.com
VITE_APP_NAME=RBAC Admin Panel
VITE_APP_VERSION=1.0.0
```

> Crítico: las variables `VITE_*` se incrustan en el bundle JS en tiempo de build. Deben configurarse como Build Args, no como variables de entorno de runtime.

### Variables de entorno (runtime)
```
ADMIN_DOMAIN=admin.smartdigitaltec.com
```

### Compose Path
```
./docker-compose.dokploy.yml
```

### Dominio
- Host: `admin.smartdigitaltec.com` | Port: `80`
- HTTPS con Let's Encrypt activado desde Dokploy

---

## Problemas encontrados y soluciones

### Problema 1 — TypeScript errors bloqueando el build

**Síntoma**: El build fallaba con errores de tipo en 5 archivos de test:
```
Property 'is_staff' does not exist on type 'User'
Property 'slug' does not exist on type 'Tenant'
```

**Causa**: El tipo `User` requiere el campo `is_staff: boolean` que no estaba en los mocks de test. El tipo `Tenant` tiene `subdomain`, no `slug`.

**Fix**:
- Agregado `is_staff: true/false` a los mocks en 5 archivos de test
- Cambiado `tenant?.slug` → `tenant?.subdomain` en `src/lib/api.ts`

---

### Problema 2 — nginx crash-loop por hostname no resolvible

**Síntoma**: El contenedor mostraba `Restarting (1) X seconds ago`. Traefik no registraba el router `rbac-admin`.

**Causa**: `nginx/nginx.conf` tenía un bloque:
```nginx
location /api/ {
    proxy_pass http://rbac_django:8000;
}
```
nginx resuelve hostnames DNS en el momento de arranque. `rbac_django` no existe en `dokploy-network` (el backend está en otra red/stack), por lo que nginx fallaba al iniciar.

**Fix**: Eliminado el bloque `/api/` completo de `nginx/nginx.conf`. No es necesario en producción porque `VITE_API_URL` ya está bakeado en el bundle JS apuntando directamente a `https://api-rbac.smartdigitaltec.com`.

```nginx
# nginx/nginx.conf final
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Problema 3 — nginx config inválida (bloque server sin wrapper http/events)

**Síntoma**: Contenedor seguía en crash-loop incluso después del fix del Problema 2. El stage `#15 COPY nginx/nginx.conf` no estaba CACHED (el nuevo archivo llegó), pero nginx seguía fallando.

**Causa**: El `Dockerfile` copiaba `nginx/nginx.conf` a `/etc/nginx/nginx.conf` — el archivo **principal** de nginx. Este archivo requiere la estructura completa con bloques `events {}` y `http {}`. Un bloque `server {}` desnudo a nivel raíz es inválido.

```dockerfile
# Antes (incorrecto)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Después (correcto)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
```

**Fix**: Cambiado el destino en el `Dockerfile` a `/etc/nginx/conf.d/default.conf`. La imagen `nginx:1.25-alpine` ya tiene el `nginx.conf` principal con `events {}` e `http {}` que incluye automáticamente todos los archivos de `conf.d/`.

**Resultado**: Contenedor arrancó estable (`Up 2 minutes`) y Traefik registró el router correctamente.

---

### Problema 4 — Traefik labels no auto-inyectados en Compose

**Síntoma**: Primer deploy exitoso en build pero Traefik devolvía 404. No aparecía `rbac-admin` en `GET /api/http/routers`.

**Causa**: Para servicios tipo **Compose**, Dokploy no inyecta automáticamente labels de Traefik (a diferencia del tipo Application). Las labels deben definirse manualmente en el `docker-compose.dokploy.yml`.

**Fix**: Labels completas en `docker-compose.dokploy.yml`:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.rbac-admin.rule=Host(`${ADMIN_DOMAIN}`)"
  - "traefik.http.routers.rbac-admin.entrypoints=websecure"
  - "traefik.http.routers.rbac-admin.service=rbac-admin"          # crítico
  - "traefik.http.routers.rbac-admin-http.rule=Host(`${ADMIN_DOMAIN}`)"
  - "traefik.http.routers.rbac-admin-http.entrypoints=web"
  - "traefik.http.routers.rbac-admin-http.middlewares=redirect-to-https@file"
  - "traefik.http.routers.rbac-admin-http.service=rbac-admin"
  - "traefik.http.services.rbac-admin.loadbalancer.server.port=80"
```

> La label `.service=rbac-admin` es crítica — sin ella Traefik ve el contenedor pero no crea el router (mismo patrón documentado en el deploy del backend).

---

### Problema 5 — Docker cache impidió aplicar fixes

**Síntoma**: Después de corregir `nginx/nginx.conf` en el repo, el deploy siguiente mostraba el stage como `CACHED` y el contenedor seguía fallando.

**Causa**: Docker BuildKit cachea capas por hash de contenido. Si el archivo en el repo no cambió (o el commit no llegó), la capa se sirve desde cache.

**Diagnóstico**: Verificar en el log si el stage aparece como `CACHED` o `DONE 0.0s`:
- `CACHED` → el archivo no cambió en el repo
- `DONE 0.0s` → se ejecutó (archivo nuevo)

**Fix**: Confirmar que el commit con el archivo modificado fue pusheado al repo antes de triggear el deploy.

---

## Seeders ejecutados en producción

```bash
python manage.py seed_permissions   # 66 permisos, 4 roles del sistema
python manage.py seed_plans         # Free / Starter / Professional / Enterprise
python manage.py loaddata apps/services/fixtures/services.json  # 3 servicios
```

---

## Verificación final

- [x] `https://admin.smartdigitaltec.com` carga con SSL
- [x] Login con superuser (`is_staff=True`) → acceso al dashboard
- [x] Sidebar completo: Clientes, Promociones, Suscripción, Facturación, Planes, Soporte, Configuración
- [x] CORS configurado en backend: `CORS_ALLOWED_ORIGINS=https://api-rbac.smartdigitaltec.com,https://admin.smartdigitaltec.com`
- [x] `https://api-rbac.smartdigitaltec.com/api/health/` → `{"status":"ok","db":true,"redis":true,"celery":true}`

---

## Pendiente opcional

- Activar **Autodeploy** en Dokploy → webhook en repo `front_ad_sp` → deploy automático en cada push a `main`
