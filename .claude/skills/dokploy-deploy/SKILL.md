---
name: dokploy-deploy
description: >
  Guía de despliegue de las apps del proyecto RBAC Subscription Platform en el VPS con Dokploy +
  Traefik. Usar cuando se quiera desplegar, redeployar o configurar en producción cualquiera de:
  backend Django (api-rbac), Admin Panel (React+Vite/nginx), Workspace (React+Vite/nginx),
  Hub (Next.js) o Vista (Next.js); o cuando se prepare el docker-compose.dokploy.yml, los labels de
  Traefik, los build args, el Dockerfile de producción, el dominio/SSL Let's Encrypt, o los pasos
  post-deploy (seed_permissions, Service.url_template, CORS, migrate). Triggers: "desplegar/deploy a
  Dokploy", "subir a producción", "configurar Traefik", "404 de Traefik", "build args en Dokploy",
  "el contenedor no arranca / crash-loop", "nueva app en Dokploy", "redeploy". La Desktop (Tauri) NO
  se despliega aquí — es app de escritorio (ver skill/lessons-learned para su build de producción).
---

# Dokploy Deploy — Despliegue del proyecto en VPS

## Contexto de la infraestructura

- **VPS** con **Dokploy** (panel) + **Traefik** (reverse proxy, termina TLS con Let's Encrypt).
  NO es Nginx Proxy Manager (ese es el de desarrollo local).
- Cada app vive en **su propio repo de GitHub** (el monorepo local `apps/X` se publica a repos
  separados: `back_dj_sp`, `front_ad_sp`, `front_ws_sp`, `front_nx_vs_sp`, hub, etc.). Dokploy hace
  `pull` del remoto y build con **trigger On Push**.
- Los servicios se crean en Dokploy como tipo **Compose** (no Application). **Consecuencia crítica:**
  con Compose, Dokploy **NO inyecta labels de Traefik automáticamente** — hay que escribirlos a mano
  en `docker-compose.dokploy.yml`.
- Red externa compartida: **`dokploy-network`** (la app y `dokploy-traefik` deben estar ahí).
- Env vars de Dokploy son **runtime**, EXCEPTO lo que se declare como **build args** (todo lo que va
  al bundle de un frontend: `VITE_*`, `NEXT_PUBLIC_*`).

Esta guía complementa la base de incidencias: ver `lessons-learned/references/knowledge-base.md`
sección **H** (LL-070…LL-079) e **I** (LL-090…LL-091). Citar el LL-0XX correspondiente al resolver.

## Qué tipo de app es (elige la referencia)

| App | Repo | Stack | Puerto interno | Sirve con | Referencia |
|-----|------|-------|----------------|-----------|------------|
| Backend `api-rbac` | `back_dj_sp` | Django + Gunicorn (+ postgres/redis/celery) | `8000` | Gunicorn | [django-backend.md](references/django-backend.md) |
| Admin Panel | `front_ad_sp` | React + Vite | `80` | nginx | [vite-spa.md](references/vite-spa.md) |
| Workspace | `front_ws_sp` | React + Vite | `80` | nginx | [vite-spa.md](references/vite-spa.md) |
| Hub | (hub repo) | Next.js 15 | puerto Node (p.ej. `3000`) | server Next | [nextjs.md](references/nextjs.md) |
| Vista | `front_nx_vs_sp` | Next.js 15 | `3004` | server Next | [nextjs.md](references/nextjs.md) |

**Leer la referencia del tipo de app ANTES de tocar archivos** — cada una trae la plantilla exacta de
`docker-compose.dokploy.yml`, el Dockerfile de prod y los gotchas propios. Para diagnosticar fallos
ver [troubleshooting.md](references/troubleshooting.md).

## Workflow de despliegue (8 pasos)

```
1. Identificar tipo de app → leer su referencia
2. Preparar el repo: crear/ajustar docker-compose.dokploy.yml + Dockerfile prod + (settings/nginx)
3. git commit + PUSH al remoto del repo de esa app   ← imprescindible (Dokploy hace pull)
4. En Dokploy: crear servicio Compose (o abrir el existente) → GitHub repo + branch + Compose Path
5. Configurar variables: runtime (Environment) y BUILD ARGS (todo VITE_*/NEXT_PUBLIC_*)
6. Dominio + SSL: DNS A-record → Dokploy Domains → Host + Container Port + HTTPS Let's Encrypt
7. Deploy → vigilar Deployments (logs). Verificar router en Traefik si da 404.
8. Post-deploy: seeds / Service.url_template / CORS / activar TenantService / verificación final
```

Claude no puede operar la UI de Dokploy: prepara los archivos del repo y entrega al usuario los pasos
exactos de UI + los comandos de shell post-deploy a ejecutar en la terminal del contenedor.

## Reglas de oro (de los 5 deploys previos)

1. **Labels de Traefik completos o no hay router.** Para Compose hay que poner el router HTTPS, el
   redirect HTTP→HTTPS y el service, incluyendo la label crítica
   `traefik.http.routers.<NAME>.service=<NAME>`. Sin ella, Traefik ve el contenedor pero da **404**
   en texto plano (es respuesta de Traefik, no de la app). → LL-070.
2. **Vars del bundle = build args, no runtime.** `VITE_*` y `NEXT_PUBLIC_*` se hornean en `npm run
   build`. Deben ir en **tres** sitios: Dokploy (Build Args) + `Dockerfile` (`ARG`+`ENV`) +
   `docker-compose.dokploy.yml` (`build.args`, con default de prod). Si en prod aparece un fallback
   de dev, la var no llegó al build. → LL-010, LL-011, LL-073.
3. **"El fix no se aplica" = commit sin pushear o capa Docker `CACHED`.** Dokploy buildea el remoto.
   Antes de redeployar, confirmar `git push`. En el log: `CACHED` = no cambió en el repo;
   `DONE 0.0s` = se ejecutó. → LL-075.
4. **Trailing slash y `/api/v1`.** El frontend en prod llama directo al backend; respetar la slash
   exacta de Django y NO duplicar `/api/v1` en la base URL (el código ya lo añade). → LL-001, LL-077.
5. **Post-deploy SIEMPRE.** Tras el primer deploy del backend: `seed_permissions`, `createsuperuser`,
   `seed_plans`, fixtures de servicios. Tras desplegar un servicio (Vista/Workspace): corregir
   `Service.url_template` en la BD (trae URL de dev → SSO 502) y activar `TenantService`. Añadir el
   nuevo dominio a `CORS_ALLOWED_ORIGINS` del backend. → LL-061, LL-078, LL-031.

## Checklist de verificación final

- [ ] `https://<dominio>/` carga con candado SSL (Let's Encrypt emitido).
- [ ] Router visible en Traefik: `docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers` (debe listar `<NAME>@docker`).
- [ ] Backend: `GET https://api-rbac.<dominio>/api/health/` → `{"status":"ok","db":true,"redis":true,"celery":true}`.
- [ ] CORS: el dominio del frontend está en `CORS_ALLOWED_ORIGINS` del backend (Dokploy → backend → Environment).
- [ ] Para servicios con SSO (Vista/Workspace): `Service.url_template` apunta a la URL de prod y `TenantService.status='active'`.
- [ ] Login funciona (Admin requiere `is_staff=True`; Hub/servicios cualquier tenant activo).

## Comandos útiles de diagnóstico (Traefik / contenedores)

```bash
# Routers registrados en Traefik (si tu router no está, faltan labels → LL-070)
sudo docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers | grep -o '"name":"[^"]*"'
# Labels Traefik del contenedor
sudo docker inspect <contenedor> --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep traefik
# Redes del contenedor (debe incluir dokploy-network)
sudo docker inspect <contenedor> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
# Abrir shell de Django en prod (post-deploy)
sudo docker exec -it <contenedor-django> python manage.py shell
```
