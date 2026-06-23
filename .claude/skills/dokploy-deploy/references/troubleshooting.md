# Troubleshooting — Deploy en Dokploy

Síntoma → causa → fix. La columna LL enlaza a la entrada completa en
`lessons-learned/references/knowledge-base.md`. Antes de depurar, hacer grep ahí por el síntoma.

| Síntoma | Causa raíz | Fix | LL |
|---------|-----------|-----|----|
| `404 page not found` en texto plano (no es la app) | Faltan labels Traefik o la label `...routers.<NAME>.service=<NAME>` → Traefik no crea el router | Labels completas en `docker-compose.dokploy.yml` (router HTTPS + redirect + service). Verificar con `docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers` | LL-070 |
| Contenedor Django `(unhealthy)` / loop de redirects HTTPS | Traefik reenvía HTTP interno; `SECURE_SSL_REDIRECT` redirige en bucle; healthcheck sin `X-Forwarded-Proto`/`Host` | `SECURE_PROXY_SSL_HEADER`+`USE_X_FORWARDED_HOST` en `prod.py`; healthcheck con headers `X-Forwarded-Proto: https` y `Host` válido | LL-071 |
| Build falla en `collectstatic` (`ModuleNotFoundError` / falta SECRET_KEY) | `collectstatic` importa settings en build-time | `ARG SECRET_KEY=placeholder` antes del collectstatic; dep de logging (`python-json-logger`) en `prod.txt` | LL-072 |
| En prod aparece un fallback de **dev** (logout a localhost, API vieja, site key vacío) | `VITE_*`/`NEXT_PUBLIC_*` puestas como runtime, no llegaron al build | Build args en los 3 sitios: Dokploy (Build) + Dockerfile `ARG`/`ENV` + compose `build.args` (con default prod) | LL-010, LL-073 |
| Frontend nginx en **crash-loop** (`Restarting`) | (1) bloque `location /api/` con `proxy_pass` a un host inexistente en `dokploy-network`; (2) nginx.conf copiado a `/etc/nginx/nginx.conf` (requiere `events`/`http`) | Quitar el bloque `/api/`; copiar a `/etc/nginx/conf.d/default.conf` | LL-074 |
| "Corregí el archivo pero el deploy sigue igual" / stage `CACHED` / `Compose file not found` | Commit no pusheado al remoto (Dokploy hace pull) o capa Docker cacheada | `git push` antes de redeployar. Log: `CACHED`=no cambió; `DONE 0.0s`=ejecutó | LL-075 |
| Build de Next.js colgado 45+ min en "checking validity of types" | `next build` corre tsc+eslint completos en VPS modesto | `ignoreBuildErrors: true` + `ignoreDuringBuilds: true` en `next.config.ts`; matar con Kill Build | LL-076 |
| Llamadas a `.../api/v1/api/v1/...` → 404 | `NEXT_PUBLIC_API_URL` incluía `/api/v1` y el código ya lo añade | Var = `https://host` sin `/api/v1` | LL-077 |
| SSO desde Hub a un servicio → `502 Bad Gateway` | `Service.url_template` en BD apunta a URL de dev | Actualizar `url_template` a la URL de prod por Django shell; activar `TenantService.status='active'` | LL-078 |
| El build (Vite/tsc) falla con errores de tipo | Mocks/tipos desactualizados que el dev server tolera | Correr `npm run typecheck` + `build` local antes de pushear; ver casos (is_staff, slug/subdomain, zodResolver, payload, casts) | LL-079 |
| CORS "blocked" / "No 'Access-Control-Allow-Origin'" en un frontend o Desktop | El dominio/origen no está en `CORS_ALLOWED_ORIGINS` del backend (`env.list` reemplaza el default) | Añadir el origen en Dokploy → backend → Environment. Desktop Windows = `http://tauri.localhost` (sin S) | LL-031 |
| 403 en todos los endpoints tras desplegar | `seed_permissions` no se ejecutó (rol Owner inexistente) | Correr `python manage.py seed_permissions` en el contenedor | LL-061 |
| `400 DisallowedHost` con guion bajo en el Host | nombre de servicio/alias con `_` (inválido RFC 1034/1035) | Usar alias de red sin guion bajo + añadir a `ALLOWED_HOSTS` | LL-032 |

## Flujo de diagnóstico rápido para un 404 de Traefik

```bash
# 1. ¿El contenedor corre?
sudo docker ps --filter "name=<proyecto>" --format "table {{.Names}}\t{{.Status}}"
# 2. ¿Tiene labels Traefik? (debe haber rule/entrypoints/service)
sudo docker inspect <contenedor> --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep traefik
# 3. ¿Está en dokploy-network?
sudo docker network inspect dokploy-network --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}'
# 4. ¿Traefik registró el router?
sudo docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers | grep -o '"name":"[^"]*"'
```

Si el contenedor corre, tiene labels y está en la red pero el router NO aparece → casi siempre falta la
label `...service=<NAME>` (LL-070). Si el router aparece pero da 502 → la app no escucha en el puerto del
`loadbalancer.server.port` declarado.
