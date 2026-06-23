# Deploy — Frontends Next.js 15 (Hub, Vista)

Vista repo `front_nx_vs_sp` (puerto interno `3004`), Hub (puerto Node, p.ej. `3000`). Server de Next
(no estático). Fuente: `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md` +
`reports/varios/frontend_next_hub_deployment_issues.md`. Incidencias: LL-070, LL-073, LL-076, LL-077, LL-078, LL-002/003.

## Tabla de contenidos
- [1. Build args (NEXT_PUBLIC_*)](#1-build-args-next_public_)
- [2. next.config.ts (build rápido + proxy)](#2-nextconfigts-build-rápido--proxy)
- [3. docker-compose.dokploy.yml](#3-docker-composedokployyml)
- [4. Variables en Dokploy](#4-variables-en-dokploy)
- [5. Dominio y SSL](#5-dominio-y-ssl)
- [6. Post-deploy (SSO)](#6-post-deploy-sso)

## 1. Build args (NEXT_PUBLIC_*)

`NEXT_PUBLIC_*` se incrustan en el bundle en build-time. En Dokploy van como **Build Args** + mapeo en
Dockerfile (`ARG`+`ENV`) + `compose.build.args`. Si quedan como runtime → llegan **vacías** al bundle
(p.ej. site key de reCAPTCHA vacío). (LL-010, LL-073)

- `NEXT_PUBLIC_API_URL` = `https://api-rbac.<dominio>` **SIN `/api/v1`** — el código añade `/api/v1`;
  ponerlo duplica el prefijo → `.../api/v1/api/v1/...` → 404. (LL-077)
- Vista: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_HUB_URL`. Hub: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, etc.

Dockerfile (mapear cada var sin prefijo → con prefijo si el build arg viene sin él; o directo):
```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# reCAPTCHA (Hub): el arg llega sin prefijo y se expone con prefijo
ARG RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${RECAPTCHA_SITE_KEY}
RUN npm run build
```

## 2. next.config.ts (build rápido + proxy)

- **Build se cuelga 45+ min** en "Linting and checking validity of types" en el VPS → desactivar en el
  build de prod (validar tipos en local/CI). Reduce el build a ~80s. (LL-076)
  ```ts
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  ```
  (Se puede matar un build colgado: Dokploy → Deployments → Kill Build.)
- Quitar `{ hostname: 'localhost' }` de `images.remotePatterns` para prod.
- **Proxy/rewrites** (solo afecta llamadas que pasan por el server de Next): respetar las 4 reglas
  ordenadas de slash (SSO/Google con slash, auth base sin slash, resto con slash) + `skipTrailingSlashRedirect:
  true`. Ver LL-002, LL-003. En prod muchas llamadas van directas al backend (sin proxy), donde manda la
  slash exacta de Django (LL-001).

## 3. docker-compose.dokploy.yml

`NAME` = `rbac-hub` / `rbac-vista`. Puerto del service = puerto interno de Next (Vista `3004`, Hub `3000`).

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-https://api-rbac.<dominio>}
        NEXT_PUBLIC_HUB_URL: ${NEXT_PUBLIC_HUB_URL:-https://hub.<dominio>}
        # Hub: RECAPTCHA_SITE_KEY: ${RECAPTCHA_SITE_KEY:-}
    networks: [dokploy-network]
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.NAME.rule=Host(`${VISTA_DOMAIN}`)"
      - "traefik.http.routers.NAME.entrypoints=websecure"
      - "traefik.http.routers.NAME.service=NAME"                # ← crítico (LL-070)
      - "traefik.http.routers.NAME-http.rule=Host(`${VISTA_DOMAIN}`)"
      - "traefik.http.routers.NAME-http.entrypoints=web"
      - "traefik.http.routers.NAME-http.middlewares=redirect-to-https@file"
      - "traefik.http.routers.NAME-http.service=NAME"
      - "traefik.http.services.NAME.loadbalancer.server.port=3004"   # ajustar al puerto real
networks:
  dokploy-network: { external: true }
```

## 4. Variables en Dokploy

- **Build Args**: todas las `NEXT_PUBLIC_*` (+ `RECAPTCHA_SITE_KEY` para Hub).
- **Runtime**: `VISTA_DOMAIN` / `HUB_DOMAIN` (para labels Traefik).

## 5. Dominio y SSL

Dokploy → Domains: Host `view.<dominio>` / `hub.<dominio>`, **Container Port = puerto interno de Next**
(Vista `3004`), HTTPS Let's Encrypt.

## 6. Post-deploy (SSO)

- Añadir el dominio a `CORS_ALLOWED_ORIGINS` del backend.
- **Vista** (SSO): corregir `Service.url_template` (trae URL de dev → 502) y activar `TenantService` (LL-078):
  ```python
  s = Service.objects.get(slug='vista')
  s.url_template = 'https://view.<dominio>/es/sso'; s.save()   # incluye el path SSO real
  ```
- Verificar: Hub → abrir el servicio → redirige a `/sso...?sso_token=...` → dashboard cargado.
  Confirmar que ningún valor del bundle quedó en su fallback de dev (LL-073).
