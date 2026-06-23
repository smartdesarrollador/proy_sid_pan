# Deploy — Frontends React + Vite + nginx (Admin Panel, Workspace)

Repos `front_ad_sp` (Admin) y `front_ws_sp` (Workspace) · puerto interno `80` · bundle estático servido
por nginx. Fuentes: `reports/2026-04-03-deploy-frontend-admin-dokploy.md`,
`reports/2026-04-03-deploy-frontend-workspace-dokploy.md`. Incidencias: LL-070, LL-073, LL-074, LL-075, LL-079.

## Tabla de contenidos
- [1. Build args (lo más importante)](#1-build-args-lo-más-importante)
- [2. Dockerfile (multi-stage + ARG/ENV)](#2-dockerfile-multi-stage--argenv)
- [3. nginx.conf (SPA, sin proxy /api/)](#3-nginxconf-spa-sin-proxy-api)
- [4. docker-compose.dokploy.yml](#4-docker-composedokployyml)
- [5. Variables en Dokploy](#5-variables-en-dokploy)
- [6. Dominio, SSL y errores de build TS](#6-dominio-ssl-y-errores-de-build-ts)
- [7. Post-deploy](#7-post-deploy)

## 1. Build args (lo más importante)

Las `VITE_*` se **hornean en el bundle** durante `npm run build`. En Dokploy deben configurarse como
**Build Args** (no runtime) y mapearse en Dockerfile + compose. Si quedan como runtime, el código cae al
fallback de dev (p.ej. logout va a `localhost:5175`). (LL-073)

Vars típicas: `VITE_API_URL` (sin `/api/v1`, el código lo añade — LL-077), `VITE_APP_NAME`,
`VITE_APP_VERSION`, y en Workspace `VITE_HUB_URL`.

## 2. Dockerfile (multi-stage + ARG/ENV)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Cada VITE_* del bundle: declarar ARG y exponerla como ENV antes de "npm run build"
ARG VITE_API_URL
ARG VITE_HUB_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_HUB_URL=${VITE_HUB_URL}
RUN npm run build

FROM nginx:1.25-alpine AS prod
# IMPORTANTE: destino conf.d/default.conf, NO /etc/nginx/nginx.conf (LL-074)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 3. nginx.conf (SPA, sin proxy /api/)

- **Quitar** cualquier bloque `location /api/ { proxy_pass http://rbac_django:8000; }`: nginx resuelve
  hostnames al arrancar y `rbac_django` no existe en `dokploy-network` → crash-loop. En prod el bundle
  llama directo al backend vía `VITE_API_URL`. (LL-074)
- El archivo va a `conf.d/default.conf` → es un bloque `server {}` (NO lleva `events{}`/`http{}`).

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }   # SPA routing
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y; add_header Cache-Control "public, immutable";
    }
}
```

## 4. docker-compose.dokploy.yml

`NAME` = `rbac-admin` o `rbac-workspace`. Puerto del service = **80**.

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: prod
      args:                                  # default de prod garantiza build aunque falte en Dokploy
        VITE_API_URL: ${VITE_API_URL:-https://api-rbac.<dominio>}
        VITE_HUB_URL: ${VITE_HUB_URL:-https://hub.<dominio>}
    networks: [dokploy-network]
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.NAME.rule=Host(`${ADMIN_DOMAIN}`)"
      - "traefik.http.routers.NAME.entrypoints=websecure"
      - "traefik.http.routers.NAME.service=NAME"                # ← crítico (LL-070)
      - "traefik.http.routers.NAME-http.rule=Host(`${ADMIN_DOMAIN}`)"
      - "traefik.http.routers.NAME-http.entrypoints=web"
      - "traefik.http.routers.NAME-http.middlewares=redirect-to-https@file"
      - "traefik.http.routers.NAME-http.service=NAME"
      - "traefik.http.services.NAME.loadbalancer.server.port=80"
networks:
  dokploy-network: { external: true }
```

## 5. Variables en Dokploy

- Pestaña **Environment → Build** (Build Args): `VITE_API_URL`, `VITE_APP_NAME`, `VITE_APP_VERSION`,
  `VITE_HUB_URL` (Workspace).
- Pestaña **Environment** (runtime): `ADMIN_DOMAIN` / `WORKSPACE_DOMAIN` (para los labels Traefik).

## 6. Dominio, SSL y errores de build TS

- Dokploy → Domains: Host `admin.<dominio>` / `workspace.<dominio>`, **Container Port `80`**, HTTPS
  Let's Encrypt.
- **El build de prod corre `tsc` y falla con errores que el dev server tolera** (LL-079). Correr
  `npm run typecheck` y `npm run build` **localmente antes de pushear**. Casos recurrentes:
  - `is_staff` faltante en mocks de `User` → añadirlo.
  - `tenant.slug` no existe: el tipo `Tenant` usa **`subdomain`** → `X-Tenant-Slug` = `tenant.subdomain`
    (en Admin/Workspace). (Ojo: el Desktop sí usa `tenant.slug`.)
  - `z.boolean().default(false)` rompe `zodResolver`: quitar `.default()` del schema, poner el default en
    `useForm.defaultValues`.
  - Payload con campos equivocados (`start_datetime` vs `start_date`; prioridad `'alta'` vs `'high'`).
  - Cast de mocks: `as unknown as ReturnType<typeof useX>`.

## 7. Post-deploy

- Añadir el dominio del frontend a `CORS_ALLOWED_ORIGINS` del **backend** (Dokploy → backend → Environment).
- **Workspace** (tiene SSO): corregir `Service.url_template` y activar `TenantService` (LL-078):
  ```python
  # docker exec -it <django> python manage.py shell
  from apps.services.models import Service, TenantService
  from apps.tenants.models import Tenant
  s = Service.objects.get(slug='workspace')
  s.url_template = 'https://workspace.<dominio>/sso/callback'; s.save()
  t = Tenant.objects.get(subdomain='<tenant>')
  ts,_ = TenantService.objects.get_or_create(tenant=t, service=s, defaults={'status':'active'})
  ts.status='active'; ts.save()
  ```
- Admin Panel: login con superuser (`is_staff=True`) → dashboard. Verificar SSL + router en Traefik.
