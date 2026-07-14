# Base de Conocimiento — Incidencias y Soluciones

Destilado accionable de `reports/`. Buscar por síntoma o por `**Tags:**` con grep antes de depurar.
Formato y reglas en `../SKILL.md`. Índice de reportes digeridos en `sources.md`.

## Tabla de contenidos

- [A. Trailing slash, proxies y routing HTTP](#a-trailing-slash-proxies-y-routing-http) — LL-001 … LL-005
- [B. Variables de entorno y build (Next.js / Dokploy)](#b-variables-de-entorno-y-build-nextjs--dokploy) — LL-010 … LL-011
- [C. Docker / contenedores / recarga](#c-docker--contenedores--recarga) — LL-020 … LL-025
- [D. Multi-tenancy, CORS y headers](#d-multi-tenancy-cors-y-headers) — LL-030 … LL-034
- [E. Seguridad y lógica de negocio](#e-seguridad-y-lógica-de-negocio) — LL-040 … LL-049, LL-096
- [F. Frontend React / Next.js (estado, SSR, tipos)](#f-frontend-react--nextjs-estado-ssr-tipos) — LL-050 … LL-059
- [G. Testing (MSW, fixtures, permisos)](#g-testing-msw-fixtures-permisos) — LL-060 … LL-063
- [H. Deploy: Dokploy / Traefik / Nginx / build](#h-deploy-dokploy--traefik--nginx--build) — LL-070 … LL-080
- [I. Tauri / Desktop en producción](#i-tauri--desktop-en-producción) — LL-090 … LL-091, LL-095, LL-097

---

## A. Trailing slash, proxies y routing HTTP

> **Patrón maestro del proyecto.** Casi cualquier 404 / 405 / 308 / 500 "doesn't end in a slash" es
> un problema de trailing slash entre el cliente, el proxy de Next.js, Nginx Proxy Manager y el
> `APPEND_SLASH` de Django. Revisar esto **primero** ante cualquier error de routing.

### LL-001 — Django APPEND_SLASH convierte POST en GET → 405 / 500
- **Síntoma:** En producción un `POST` a un endpoint sin trailing slash devuelve `405 Method Not Allowed`, o Django lanza `RuntimeError: You called this URL via POST, but the URL doesn't end in a slash and you have APPEND_SLASH set.`
- **Causa raíz:** Django responde `301/308` redirigiendo a la URL con `/`. El navegador re-emite el redirect como `GET`, perdiendo el método y el body. En dev no se nota porque el proxy de Next.js normaliza la slash; en prod el Hub llama directo a `api-rbac.digisider.com` sin ese proxy.
- **Solución:** Llamar a los endpoints DRF con trailing slash exacto que espera el `urls.py` de Django (la mayoría de `/api/v1/app/`, `/admin/`, `/public/` lo llevan). Ej. hook → `POST /public/contact/`.
- **Prevención:** Verificar el `path(...)` real en el `urls.py` correspondiente antes de escribir la URL en un hook. No asumir.
- **Casos vistos:** reCAPTCHA contacto (POST 405 en prod); SSO `sso/token/` (500 APPEND_SLASH).
- **Fuente:** `reports/2026-06-22-formulario-contacto-recaptcha.md`, `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** trailing-slash, append-slash, django, 405, 500, 308, proxy

### LL-002 — Doble slash en el proxy de Next.js → Django 404
- **Síntoma:** `GET /api/v1/public/footer/` (con slash) → 404. Sin slash funciona.
- **Causa raíz:** El rewrite de `next.config.ts` ya añade la slash en el destino: `destination: ${API_TARGET}/api/:path*/`. Si el hook manda la URL **con** slash, `path*` captura `.../footer/` y el destino agrega otra → `.../footer//` → Django no matchea.
- **Solución:** En los hooks del Hub usar la URL **sin** trailing slash (`/public/footer`); el proxy añade la correcta.
- **Prevención:** Regla del Hub: cliente sin slash, el proxy la pone. La excepción son llamadas directas a prod sin proxy (ver LL-001), que sí necesitan la slash exacta de Django. Distinguir si la petición pasa por el proxy de Next o va directa al backend.
- **Fuente:** `reports/2026-06-22-footer-administrable-hub.md`
- **Tags:** trailing-slash, nextjs-proxy, double-slash, django, 404

### LL-003 — Reglas de rewrite mixtas: auth sin slash, SSO/Google con slash
- **Síntoma:** Una sola regla de rewrite rompe algún flujo: con slash global se rompe `register` (404); sin slash global se rompe `sso/token` (500).
- **Causa raíz:** Los `urls.py` de auth en Django son inconsistentes: base auth (`login`, `register`, `logout`, `refresh-token`) **sin** slash; `sso/*` y `google/*` **con** slash.
- **Solución:** 4 reglas de rewrite en `next.config.ts`, de más específica a más general:
  ```ts
  { source: '/api/v1/auth/sso/:path*',    destination: `${API_TARGET}/api/v1/auth/sso/:path*/` }   // con slash
  { source: '/api/v1/auth/google/:path*', destination: `${API_TARGET}/api/v1/auth/google/:path*/` } // con slash
  { source: '/api/v1/auth/:path*',        destination: `${API_TARGET}/api/v1/auth/:path*` }          // sin slash
  { source: '/api/:path*',                destination: `${API_TARGET}/api/:path*/` }                 // resto con slash
  ```
  Además `skipTrailingSlashRedirect: true` para que Next no genere sus propios redirects.
- **Prevención:** Al añadir endpoints de auth, respetar la convención de slash existente o se rompe el rewrite. El orden de las reglas importa (específica → general).
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** trailing-slash, nextjs-proxy, rewrite, sso, auth, order-matters

### LL-004 — Nginx Proxy Manager elimina trailing slashes (308)
- **Síntoma:** `GET /api/v1/public/plans/` → 308 → `GET /api/v1/public/plans` → 400.
- **Causa raíz:** NPM (openresty) aplica `merge_slashes` y remueve trailing slashes antes de llegar a Next.js.
- **Solución:** `skipTrailingSlashRedirect: true` en `next.config.ts` + añadir la slash en el destino del rewrite (`${API_TARGET}/api/:path*/`). Así NPM la quita y el rewrite la re-pone hacia Django.
- **Prevención:** Asumir que cualquier proxy intermedio (NPM, CDN) puede tocar las slashes; la slash correcta hacia Django debe garantizarse en la capa más cercana al backend (el rewrite de Next).
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** trailing-slash, nginx-proxy-manager, 308, proxy

### LL-005 — Un endpoint nuevo bajo `/api/v1/admin/` sin trailing slash rompe silenciosamente por el rewrite catch-all
- **Síntoma:** Un endpoint devuelve 404 **solo** a través del navegador real (`hub.local.test` →
  Next.js → Django), pero funciona perfecto con `curl` directo a Django o con el Django test
  client — por eso pasa desapercibido en tests y en verificación rápida por `curl`. El error 404
  de Django muestra el path recibido **con** un `/` que el código fuente nunca escribió.
- **Causa raíz:** El rewrite catch-all de `next.config.ts` (regla final, `/api/:path*` →
  `${API_TARGET}/api/:path*/`) agrega trailing slash a **toda** request `/api/*` que no matchee
  antes una regla específica de `/api/v1/auth/*`. Si una vista nueva se registra en Django sin
  slash (`path('mi-endpoint', ...)`, sin la barra final), el rewrite igual le agrega una antes de
  reenviar — Django nunca la reconoce y 404ea. Pasó con 5 endpoints completos de
  `apps/subscriptions/subscription_urls.py` (`current`, `upgrade`, `cancel`, `yape-upgrade`,
  `trial`) — los únicos de todo `/api/v1/admin/` sin la convención con slash del resto del
  proyecto. Uno de los 5 (`cancel`) ya se había "parchado" del lado del cliente (mandando la URL
  con slash), lo cual con el catch-all produce **doble** slash en vez de arreglarlo — pista de que
  alguien ya se topó con el síntoma y no encontró la causa real.
- **Solución:** Agregar el trailing slash al `path(...)` de Django, **no** al cliente. Ver
  [[LL-002]]: la convención de este proyecto es "cliente sin slash, el rewrite de Next la agrega" —
  el rewrite catch-all ya es correcto, la ruta Django es la que debe seguir la convención.
- **Prevención:** Al agregar cualquier endpoint nuevo bajo `/api/v1/admin/`, `/api/v1/app/` o
  `/api/v1/public/`, terminar el `path(...)` de Django con `/`, salvo que sea explícitamente parte
  de las excepciones de auth ya documentadas (LL-003). **Verificar siempre por navegador real**
  (o al menos con el proxy de Next.js de por medio), no solo con `curl` directo a Django ni con el
  Django test client — ninguno de los dos pasa por el rewrite de Next.js, así que ninguno detecta
  este bug. Si un hook del frontend manda la URL con slash "porque si no, no funciona", es señal
  de que el endpoint Django le falta el slash — arreglarlo ahí, no perpetuar el parche del cliente.
- **Casos vistos:** además de los 5 endpoints de `subscription_urls.py`, el mismo patrón apareció en
  `apps/subscriptions/urls.py` (billing): `invoices`, `payment-methods` (list) y `webhooks` sin
  slash. Un cuarto endpoint del mismo archivo (`payment-methods/<uuid:pm_id>/`, detalle) **ya**
  tenía el slash correcto en Django, pero rompía igual porque el hook del Hub también mandaba la
  URL con `/` manual — en producción "funcionaba" solo porque Nginx Proxy Manager (LL-004) le quita
  la barra al request antes de llegar al rewrite, coincidencia que oculta el bug en vez de
  arreglarlo. Lección: la convención "cliente sin slash" (LL-002) hay que aplicarla a **todos** los
  hooks de un mismo feature, incluso a los que ya "funcionan", para no depender de que un proxy
  intermedio absorba el error.
- **Fuente:** fix "plan del tenant desincronizado" + verificación en navegador con Chrome DevTools,
  sesión 2026-07-11. También `reports/2026-07-11-hub-billing-facturas-invoice-yape.md` (mismo
  patrón en billing, sesión distinta). Ver también [[LL-034]], [[LL-096]].
- **Tags:** trailing-slash, nextjs-proxy, django, 404, browser-verification, rewrite

---

## B. Variables de entorno y build (Next.js / Dokploy)

### LL-010 — `NEXT_PUBLIC_*` vacía en producción: cadena de build-args de Dokploy
- **Síntoma:** Una variable `NEXT_PUBLIC_*` llega **vacía** al bundle del navegador en prod (p.ej. reCAPTCHA site key vacío → `executeRecaptcha` undefined → token fallback `"dev"` → `400`). Otra `NEXT_PUBLIC_*` (como `API_URL`) sí funciona.
- **Causa raíz:** En Next.js las `NEXT_PUBLIC_*` son **build-time**: se incrustan en el bundle al compilar, no en runtime. Dokploy las inyecta solo vía **build-args**, y el `docker-compose.dokploy.yml` pasa al build **únicamente** los `args` listados explícitamente. Si la var no está en esa lista, queda vacía aunque exista en el env de Dokploy.
- **Solución (cadena de 4 eslabones, todos obligatorios):**
  1. Dokploy env: definir `MI_VAR`.
  2. `docker-compose.dokploy.yml` → `build.args: MI_VAR: ${MI_VAR:-}`.
  3. `Dockerfile` → `ARG MI_VAR` + `ENV NEXT_PUBLIC_MI_VAR=${MI_VAR}` (mapear sin prefijo → con prefijo).
  4. Código → leer `process.env.NEXT_PUBLIC_MI_VAR`.
- **Prevención:** Al añadir cualquier `NEXT_PUBLIC_*` a un frontend Next desplegado en Dokploy, tocar los **tres** lugares además del env de Dokploy. Un enfoque server-side / `force-dynamic` NO sirve: la var no existe en runtime. Para depurar, un `console.log` temporal en el componente confirma si la key llega vacía o presente en la consola del navegador de prod.
- **Fuente:** `reports/2026-06-22-formulario-contacto-recaptcha.md` (ver también memoria `project_dokploy_next_public_envvars.md`)
- **Tags:** dokploy, NEXT_PUBLIC, build-time, build-args, dockerfile, env-vars, nextjs

### LL-011 — `NEXT_PUBLIC_*` cacheada en el bundle (dev)
- **Síntoma:** Cambiar `.env.local` no surte efecto; el browser sigue usando el valor viejo de una `NEXT_PUBLIC_*`.
- **Causa raíz:** Se inlinan al compilar y los chunks de Next se sirven con `Cache-Control: immutable` (1 año). `docker restart` no recompila y el browser sirve el chunk cacheado.
- **Solución:** Recrear el contenedor (no restart): `docker-compose down && docker-compose up -d`; limpiar caché del browser; opcionalmente tocar un módulo (`lib/axios.ts`) para forzar recompilación HMR.
- **Prevención:** Cambiar una `NEXT_PUBLIC_*` en dev ⇒ recrear contenedor + limpiar caché del browser. Ver también LL-021.
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** NEXT_PUBLIC, cache, docker-reload, nextjs, dev

---

## C. Docker / contenedores / recarga

### LL-020 — Django no detecta cambios en `urls.py` / módulos Python en Docker
- **Síntoma:** Se modifica `config/urls.py` (p.ej. para incluir una nueva app) pero el endpoint sigue dando 404.
- **Causa raíz:** El contenedor Django corría con la versión anterior cacheada en memoria; no recargó el módulo automáticamente.
- **Solución:** `docker-compose restart django` para recargar los módulos Python.
- **Prevención:** Tras tocar `urls.py`, settings o registro de apps, reiniciar Django antes de concluir que "el endpoint no existe".
- **Fuente:** `reports/2026-06-22-footer-administrable-hub.md`
- **Tags:** docker-reload, django, urls, 404

### LL-021 — `docker restart` NO re-lee `env_file` ni recompila
- **Síntoma:** Tras cambiar `.env` / `.env.local`, `docker restart <c>` mantiene las variables viejas.
- **Causa raíz:** `restart` reusa la configuración de creación del contenedor; el `env_file` se inyecta solo al **crear**.
- **Solución:** `docker-compose down && docker-compose up -d` para recrear con el nuevo entorno.
- **Prevención:** Cambios en variables de entorno ⇒ recrear, no reiniciar.
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** docker-reload, env-file, env-vars

### LL-022 — Dependencia Python no instalada en el contenedor
- **Síntoma:** `Error 500` en un endpoint nuevo (p.ej. `/chat/message/`) en dev; la librería (`openai`) no está en el contenedor.
- **Causa raíz:** Se agregó la dependencia a `requirements/base.txt` pero el contenedor en ejecución no se reconstruyó.
- **Solución:** Rápida en dev: `docker exec rbac_django pip install <paquete>`. Permanente: que esté en `requirements/base.txt` para los rebuilds.
- **Prevención:** Al añadir una dependencia, instalarla en el contenedor vivo **y** dejarla en requirements para el próximo build.
- **Fuente:** `reports/2026-06-20-implementacion-chat-ia.md`
- **Tags:** docker, dependencies, requirements, 500

### LL-023 — Caché `.next` corrupta (permisos root de Docker)
- **Síntoma:** Runtime error en el Hub tipo `options.factory`.
- **Causa raíz:** Caché `.next` corrupta, con archivos de propiedad root creados por Docker.
- **Solución:** `sudo rm -rf .next` + `docker restart rbac_next_hub_dev`.
- **Prevención:** Ante errores raros de build/runtime en Next dentro de Docker, sospechar de `.next` corrupta antes que del código.
- **Fuente:** `reports/2026-06-20-implementacion-chat-ia.md`
- **Tags:** nextjs, docker, cache, build-error

### LL-024 — docker-compose v1: `KeyError: 'ContainerConfig'` y contenedores huérfanos
- **Síntoma:** `docker-compose up -d <svc>` falla con `KeyError: 'ContainerConfig'`; queda un contenedor huérfano con hash prefix (`dee0916ccef4_rbac_db`) en estado Exited.
- **Causa raíz:** `docker-compose v1.29.2` lee la clave `ContainerConfig` que las versiones nuevas de Docker Engine eliminaron → incompatibilidad al recrear contenedores.
- **Solución:** Emergencia: manipular con `docker` CLI directamente (`docker network disconnect/connect`, `docker start <huérfano>`, `docker stop/rm` + `up`). Permanente: migrar a Docker Compose v2 (`docker compose` plugin). Nota: en este entorno el binario es `docker-compose` (con guión), no `docker compose`.
- **Prevención:** Evitar recrear contenedores con compose v1 cuando se pueda usar el CLI directo; planificar la migración a v2.
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** docker-compose-v1, ContainerConfig, orphan-container

### LL-025 — `ChunkLoadError` (timeout) en Next dev tras `.next` stale + borrado root-owned
- **Síntoma:** En el Hub en dev, runtime `ChunkLoadError: Loading chunk app/layout failed (timeout: http://hub.local.test/_next/static/chunks/app/layout.js)`. Next ancla el error en `app/layout.tsx` (`<Providers>`), pero no es un bug de código: el navegador pide un hash de chunk que ya no existe y cuelga hasta el timeout del proxy (nginx-proxy-manager sirve `hub.local.test` → `next dev :4000`).
- **Causa raíz:** `.next` stale / chunks desincronizados (HMR a medias, compile crasheado, o alternar webpack/turbopack) → el manifest cacheado en el browser referencia chunks inexistentes. Variante con timeout de la familia LL-023/LL-011.
- **Solución (recreate, NO restart):**
  1. `docker stop rbac_next_hub_dev && docker rm -f rbac_next_hub_dev` (si `compose down` falla con *network has active endpoints*, el contenedor sigue colgado: fórzalo).
  2. Borrar `.next` — está **root-owned** por Docker, `rm -rf` desde el host da *Permission denied* y lo deja corrupto. Usar contenedor efímero: `docker run --rm -v "$PWD":/work -w /work alpine rm -rf /work/.next` (o `docker exec rbac_next_hub_dev rm -rf .next` antes de bajarlo).
  3. `docker-compose up -d` (recrear, no `restart`: re-lee `.env.local` y fuerza compile limpio — ver LL-021).
  4. En el browser, **hard refresh** (`Ctrl+Shift+R`) para soltar el manifest viejo (chunks con `Cache-Control: immutable`, LL-011).
  5. Verificar: `curl -H "Host: hub.local.test" http://localhost/_next/static/chunks/app/layout.js` → 200.
- **Prevención:** Ante errores de chunk/build raros en Next dentro de Docker, sospechar `.next` antes que del código. Nunca `rm -rf .next` desde el host (root-owned) ni `docker restart` (no limpia): borrar vía contenedor + recrear. Si el timeout persiste con `.next` limpio, es el proxy → en nginx-proxy-manager subir `proxy_read_timeout`/`proxy_send_timeout` y `proxy_buffering off`. Ver también [[LL-023]], [[LL-011]], [[LL-021]].
- **Fuente:** sesión 2026-06-25 (depuración ChunkLoadError Hub dev)
- **Tags:** nextjs, docker, cache, chunkloaderror, webpack, nginx-proxy-manager, docker-reload, dev

### LL-026 — Pasar Django a ASGI/Daphne (Channels) activa `debug_toolbar` y rompe con `NoReverseMatch: 'djdt'`
- **Síntoma:** Tras añadir `daphne`+`channels` a `INSTALLED_APPS` (para WebSockets), `runserver` arranca como *ASGI/Daphne* y de pronto **todas** las respuestas a `/api/...` desde `127.0.0.1` devuelven 500 con `django.urls.exceptions.NoReverseMatch: 'djdt' is not a registered namespace` (traceback en render de template del toolbar). Health/JSON incluidos.
- **Causa raíz:** `debug_toolbar` estaba en `INSTALLED_APPS` + su middleware en `dev.py`, pero `config/urls.py` **nunca incluyó** `debug_toolbar.urls` → el namespace `djdt` no existe. Con WSGI el toolbar no se activaba; con Daphne/ASGI el `REMOTE_ADDR` de los requests locales queda como `127.0.0.1` (∈ `INTERNAL_IPS`) y el toolbar se activa, reventando al intentar `reverse('djdt:...')`.
- **Solución:** Registrar las URLs del toolbar bajo guard en `config/urls.py`:
  ```python
  if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
      import debug_toolbar
      urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
  ```
  Health vuelve a 200. (`daphne` debe ir **primero** en `INSTALLED_APPS`, antes de `django.contrib.staticfiles`, para proveer el runserver ASGI.)
- **Prevención:** Al introducir Channels/Daphne, revisar middlewares dev que dependan de URLs (debug_toolbar, etc.) y registrar sus namespaces. Recordar que el cambio WSGI→ASGI altera `REMOTE_ADDR`/detección de IP interna y puede activar componentes antes dormidos. Rebuild del contenedor obligatorio por deps nuevas (ver [[LL-022]], [[LL-024]] para el arranque con `docker run` cuando compose v1 falla).
- **Fuente:** sesión 2026-06-26 (Fase 3 chat Workspace: WebSockets)
- **Tags:** django, channels, daphne, asgi, websockets, debug-toolbar, djdt, noreversematch, runserver

### LL-027 — Dependencia npm nueva no resuelta en dev (Vite/Next) porque `node_modules` es un volumen del contenedor
- **Síntoma:** Tras `npm install <paquete>` en el host y usarlo en el código, el dev server (Vite/Next dentro de Docker) revienta con `[plugin:vite:import-analysis] Failed to resolve import "<paquete>" from "src/.../x.ts". Does the file exist?` (o el equivalente de Next). El `npm run build` y los tests en el host **sí** funcionan, lo que confunde.
- **Causa raíz:** Cada app de `apps/` corre en su propio contenedor con `node_modules` montado como **volumen Docker nombrado** (`- node_modules:/app/node_modules` en su `docker-compose.yml`), separado del `node_modules` del host. `npm install` en el host actualiza `package.json` + el `node_modules` del host, pero **no** el del contenedor → Vite, que corre dentro, no ve el paquete. Verificación: `docker exec <cont> ls node_modules/<paquete>/package.json` → ausente. Mismo problema que [[LL-022]] pero del lado frontend/npm.
- **Solución:** Instalar dentro del contenedor: `docker exec <cont> npm install <paquete>` y luego `docker restart <cont>` (Vite cachea deps optimizadas en `node_modules/.vite`; el restart fuerza re-optimizar). Verificar con `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/src/.../x.ts` → 200. Contenedores dev del repo: `rbac_workspace_vite` (5176), `rbac_admin_vite` (5174), `rbac_next_hub_dev` (4000), `rbac_next_vista_dev` (3004).
- **Prevención:** Al añadir una dependencia npm a una app dockerizada: instalar en el **contenedor vivo** y dejarla en `package.json` para el próximo build de imagen. No fiarse de que el typecheck/build/test del host pasen — el host y el contenedor tienen `node_modules` distintos. Ver `project_per_app_docker.md` (memoria) y [[LL-022]].
- **Fuente:** `reports/2026-06-29-export-datos-workspace.md` (jszip para export de datos)
- **Tags:** docker, npm, node_modules, volumen, vite, nextjs, dependencies, dev, failed-to-resolve

---

## D. Multi-tenancy, CORS y headers

### LL-030 — Header `X-Tenant-Slug` faltante → lista vacía silenciosa
- **Síntoma:** Un cliente nuevo (Desktop/Tauri, mobile, CLI) recibe lista vacía ("No tienes X aún") en endpoints `/api/v1/app/`, aunque el Workspace sí muestra los datos del mismo usuario/tenant. No da 401/403, da vacío.
- **Causa raíz:** `TenantMiddleware` resuelve el tenant **exclusivamente** desde el header `X-Tenant-Slug`. Sin él, `request.tenant = None` y el query filtra `filter(tenant=None, ...)` → siempre vacío. El Workspace funciona porque su axios inyecta el header por interceptor.
- **Solución:** Enviar `X-Tenant-Slug: <tenant.slug>` en todos los requests a `/api/v1/app/`. Leer el slug del store de auth (viene en el payload SSO desde `TenantSerializer`) y añadir guard `if (!accessToken || !tenantSlug) return`.
- **Prevención:** Todo cliente HTTP nuevo necesita inyectar `Authorization` + `X-Tenant-Slug`. Centralizar en un `apiClient`/interceptor para no repetirlo por pantalla. El fallo es **silencioso** (vacío, no error) → fácil de confundir con "no hay datos".
- **Fuente:** `reports/2026-03-15-bugfix-desktop-snippets.md`
- **Tags:** multi-tenant, x-tenant-slug, middleware, empty-list, silent-failure

### LL-031 — `.env` sobreescribe `CORS_ALLOWED_ORIGINS` y pierde orígenes (Tauri)
- **Síntoma:** `fetch()` desde la app desktop falla con "Failed to fetch"; preflight OPTIONS responde 403.
- **Causa raíz:** `CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[...])`. Cuando `.env` define la variable, **reemplaza por completo** el default de `base.py` (que incluía los orígenes de Tauri). Los orígenes nuevos no estaban en el `.env`.
- **Solución:** Añadir los tres orígenes de Tauri al `.env`: `https://tauri.localhost` (Windows/WebView2 prod), `tauri://localhost` (Linux/macOS), `http://localhost:1420` (dev).
- **Prevención:** Cualquier origen nuevo (app, puerto, dominio) debe agregarse al **`.env`**, no solo a `base.py`, porque `env.list()` con valor presente ignora el default. **Ojo Windows:** WebView2 envía `http://tauri.localhost` (**sin** S); `https://tauri.localhost` aplica a macOS/Linux. En producción hay que añadir `http://tauri.localhost` a `CORS_ALLOWED_ORIGINS` en Dokploy.
- **Casos vistos:** CORS bloqueando fetch en Desktop dev (snippets); CORS bloqueando la app Desktop empaquetada en prod desde origen `http://tauri.localhost` (deploy desktop).
- **Fuente:** `reports/2026-03-15-bugfix-desktop-snippets.md`, `reports/2026-04-04-deploy-desktop-produccion.md`
- **Tags:** cors, env-list-override, tauri, failed-to-fetch, 403, preflight, webview2

### LL-032 — Django rechaza `Host` con guion bajo (RFC 1034/1035)
- **Síntoma:** `400 DisallowedHost: Invalid HTTP_HOST header: 'rbac_django:8000'. The domain name provided is not valid according to RFC 1034/1035.`
- **Causa raíz:** El rewrite server-side de Next manda `Host: rbac_django:8000`. El guion bajo es inválido en hostnames; Django valida RFC **antes** de `ALLOWED_HOSTS`, así que añadirlo a la lista no ayuda.
- **Solución:** Dar al contenedor Django un network alias **sin** guiones bajos (`rbac-django`) en la red compartida, apuntar `API_TARGET=http://rbac-django:8000` y añadir `rbac-django` a `ALLOWED_HOSTS`.
- **Prevención:** Nombrar servicios/aliases de red sin guiones bajos cuando vayan a usarse como `Host` HTTP.
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** django, allowed-hosts, disallowed-host, docker-network, underscore, rfc1034

### LL-033 — `request.build_absolute_uri()` en un serializer devuelve un hostname interno de Docker → `ERR_NAME_NOT_RESOLVED` en el navegador
- **Síntoma:** Un campo `image_url` (o cualquier `FileField`/`ImageField` absolutizado en un serializer) se ve bien en el Admin Panel pero en `frontend_next_hub` la imagen no carga. Consola: `GET http://rbac-django:8000/media/... net::ERR_NAME_NOT_RESOLVED`.
- **Causa raíz:** El navegador pide `hub.local.test/api/v1/public/...` → Next.js server-side `rewrites()` (`next.config.ts`, `API_TARGET=http://rbac-django:8000`) reenvía la petición a Django **sin** preservar el `Host` original (mismo mecanismo que LL-032). Django ve `Host: rbac-django:8000` y `request.build_absolute_uri()` construye la URL de la imagen con ese hostname, que solo resuelve **dentro** de la red de Docker. El JSON llega bien al navegador (la API en sí funciona), pero el `<img src="...">` del lado del cliente intenta resolver `rbac-django` directamente y falla. El Admin Panel no lo sufre porque `rbac.local.test` (su `VITE_API_URL`) proxea el dominio **completo** a Django sin pasar por un rewrite de Next que reescriba el Host.
- **Solución:** No confiar en `request.build_absolute_uri()` para medios servidos a clientes detrás de un rewrite. Usar el helper `utils/media.py::build_media_url(field_file, request)`, que prioriza el setting `APP_BASE_URL` (dominio público real, ej. `http://rbac.local.test` en dev) y solo cae a `request.build_absolute_uri()` si no está configurado. Aplicado en `catalog`, `announcements` y `tenants` (branding). Además, corregir `APP_BASE_URL` en `.env` — no debe apuntar a `localhost:8000` si ese puerto no está mapeado al contenedor (en este entorno el puerto host es 8001; el dominio correcto es `rbac.local.test`).
- **Prevención:** Cualquier serializer nuevo con `ImageField`/`FileField` debe usar `build_media_url()`, nunca `request.build_absolute_uri()` a pelo. Si se agrega un dominio/proxy nuevo, verificar `APP_BASE_URL` en `.env` contra el puerto realmente expuesto del contenedor Django.
- **Nota Docker:** tras editar `.env`, `docker restart` no sirve (LL-021); y `docker-compose up -d --force-recreate` puede chocar con LL-024 (`KeyError: ContainerConfig` en contenedores huérfanos con hash-prefix) — usar `docker stop/rm` + `docker-compose up -d --no-deps <servicio>` para evitar que compose intente reconciliar servicios dependientes huérfanos.
- **Fuente:** sesión de implementación de `announcements` (fase 3, Hub), Jul 2026.
- **Tags:** build_absolute_uri, media-url, next-rewrites, docker-network, err_name_not_resolved, app_base_url

### LL-034 — Dos modelos, un mismo hecho de negocio (`Tenant.plan` vs `Subscription.plan`): el `get_or_create` con default hardcodeado los desincroniza en el nacimiento
- **Síntoma:** El plan de un tenant se ve distinto según la pantalla — el topbar dice "Professional"
  pero el Dashboard/página de Suscripción del Hub dicen "Free" (o `-`). No es un problema de caché
  ni de timing: las dos pantallas literalmente leen **modelos distintos**.
- **Causa raíz:** `Tenant.plan` (la fuente real, la que usa `check_plan_limit`/topbar) y
  `Subscription.plan` (bookkeeping de billing) representan el mismo hecho de negocio en dos
  columnas separadas. `apps/subscriptions/signals.py::auto_create_subscription` (dispara en cada
  `Tenant` nuevo) y **4 vistas más** creaban la fila `Subscription` con
  `Subscription.objects.get_or_create(tenant=..., defaults={'plan': 'free', ...})` —
  **hardcodeado**, sin mirar `tenant.plan`. Si el tenant nace con un plan pagado (seed, Django
  Admin, cualquier vía que no pase por un flujo de upgrade que sincronice ambos), la desincronía
  queda clavada desde el primer instante. Mismo patrón conceptual que [[LL-041]]
  ("el estado de negocio debe reflejar lo aprobado"), pero aquí el bug nace en la creación, no en
  una aprobación.
- **Solución:** (1) Los `get_or_create` siembran `defaults={'plan': tenant.plan, ...}` — cierra la
  causa hacia adelante. (2) Los serializers de lectura (`CurrentSubscriptionSerializer`,
  `ClientSubscriptionSerializer`) dejan de leer `obj.plan` (la columna de `Subscription`) y pasan a
  `obj.tenant.plan` siempre — defensa en profundidad para filas ya desincronizadas en BD existente,
  sin necesitar data migration/backfill.
- **Prevención:** Cuando dos modelos guardan el mismo hecho de negocio en columnas separadas
  (`Tenant.plan`/`Subscription.plan`, o cualquier par similar), **la lectura debe declarar
  explícitamente cuál es la fuente de verdad** y no confiar en que ambos writers los mantengan
  sincronizados por disciplina. Al revisar/tocar ese par de modelos, grep todos los
  `get_or_create`/`create` con un default hardcodeado del campo duplicado — es el punto ciego más
  común (se escribe una vez al prototipar y nadie vuelve a mirarlo).
- **Fuente:** fix "plan del tenant desincronizado en el Hub (Dashboard/Suscripción)", 2026-07-11.
  Ver también [[LL-041]], [[LL-049]].
- **Tags:** multi-tenant, data-consistency, business-logic, source-of-truth, get_or_create, signals

---

## E. Seguridad y lógica de negocio

### LL-040 — GET con efectos secundarios: link preview dispara la acción
- **Síntoma:** Cuentas/recursos se activan "solos" sin que el admin haga clic; el efecto ocurre ~minutos después de enviar un mensaje con el link (Telegram/Slack/WhatsApp/escáner de email).
- **Causa raíz:** El endpoint ejecutaba la acción en `GET`. Telegram (y otros) hacen un **GET automático a la primera URL** del mensaje para generar la vista previa → dispara la acción sin interacción humana.
- **Solución (defensa en profundidad, dos capas):**
  1. Mensajería: `disable_web_page_preview: true` en el nodo que envía el link (mitigación, no suficiente sola).
  2. Backend: patrón **GET-confirmación / POST-acción** — el `GET` solo muestra una página con `<form method="POST">`; el efecto real va en `POST`. (DRF aplica `csrf_exempt` en `APIView.as_view()` sin `SessionAuthentication`, así que el form POST funciona con `authentication_classes=[]` + `AllowAny`.)
- **Prevención:** **Toda** acción con efecto secundario (aprobar, rechazar, eliminar, activar) debe requerir POST, incluso en flujos "de un clic". Nunca confiar solo en la config de mensajería: cualquier reenvío/copia del link re-expone el problema.
- **Fuente:** `reports/2026-06-15-implementacion-pago-yape.md`
- **Tags:** security, get-side-effect, link-preview, telegram, confirm-page, defense-in-depth

### LL-041 — Bloquear el login ≠ bloquear el acceso al plan/recurso
- **Síntoma:** Un tenant veía el plan pagado activo sin que un admin aprobara el pago.
- **Causa raíz:** El registro creaba el `tenant.plan` ya en el plan pagado y la "protección" era solo `user.is_active=False`. El estado de negocio (plan) reflejaba algo no aprobado.
- **Solución:** El tenant **siempre arranca en `free`**; el plan solicitado se guarda en `Subscription.status='pending_payment'`. El plan real solo cambia tras la aprobación. El usuario entra de inmediato con Free.
- **Prevención:** El estado de negocio (`tenant.plan`, `subscription.status`) debe reflejar lo realmente aprobado. `user.is_active` es una capa de acceso independiente, no sustituye la validación de negocio. En rechazos, dejar estado **consistente** (`plan='free'`, `status='active'`), no `canceled` ambiguo.
- **Prevención de abuso:** flags anti-reuso (p.ej. `professional_trial_used`) van en `Tenant`, no en `Subscription` — si viven en la suscripción, recrearla permite abusar del beneficio.
- **Fuente:** `reports/2026-06-15-implementacion-pago-yape.md`, `reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md`
- **Tags:** security, business-logic, subscription, tenant-plan, state-consistency, anti-abuse

### LL-042 — `source=` redundante en serializer → AssertionError silencioso → fallback engañoso
- **Síntoma:** El Admin Panel mostraba clientes en trial como "Activo" con MRR $99 (datos falsos).
- **Causa raíz:** `ClientSubscriptionSerializer` tenía `plan = serializers.CharField(source='plan')` (redundante: el field ya se llama `plan`). DRF lanza `AssertionError`, capturado por el `except` de `get_subscription()`, que caía siempre al fallback hardcodeado `status:'active'`.
- **Solución:** Quitar el `source='plan'` redundante; `get_mrr()` retorna `0` cuando `status == 'trialing'`.
- **Prevención:** No poner `source=` igual al nombre del field. Cuidado con bloques `try/except` amplios alrededor de serialización: ocultan AssertionError de config y devuelven datos fallback plausibles pero falsos. Loguear la excepción en el except.
- **Fuente:** `reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md`
- **Tags:** drf, serializer, source-redundant, silent-assertion, fallback, mrr

### LL-043 — Derivar una clave de cifrado: usar Argon2 raw determinista, NO el password-hasher de Django
- **Síntoma (potencial):** Una clave derivada de una contraseña (p. ej. la KEK de la Bóveda, envelope encryption) no permite descifrar lo que se cifró con "la misma" contraseña; cada derivación da bytes distintos.
- **Causa raíz:** Los password-hashers de Django (`make_password`, `Argon2PasswordHasher`) **incrustan un salt aleatorio nuevo** en cada llamada → sirven para *verificar* (`check_password`) pero **no** para re-derivar una clave determinista. Usarlos como KDF de cifrado rompe el descifrado.
- **Solución:** Para derivar una clave de cifrado usar una KDF **determinista** con un salt almacenado: `argon2.low_level.hash_secret_raw(secret, salt, ..., type=Type.ID)` (o PBKDF2/HKDF de `cryptography`). Guardar el `salt` junto al dato. El *verificador* de la contraseña sí puede seguir usando `make_password`/`check_password` (su salt aleatorio es correcto ahí). Patrón en `apps/vault/crypto.py`.
- **Prevención:** Separar conceptualmente "verificar contraseña" (hasher con salt aleatorio) de "derivar clave" (KDF determinista con salt persistido). Nunca derivar claves de cifrado con un password-hasher de autenticación.
- **Fuente:** `reports/2026-06-27-vault-datos-protegidos-contrasena-maestra.md`
- **Tags:** seguridad, cifrado, argon2, kdf, envelope-encryption, vault, determinismo

### LL-044 — Header HTTP custom nuevo del frontend → añadirlo a `CORS_ALLOW_HEADERS` (preflight)
- **Síntoma:** Una feature nueva manda un header propio (p. ej. `X-Vault-Token`) y el navegador bloquea la llamada: *"Request header field x-vault-token is not allowed by Access-Control-Allow-Headers in preflight response"* + `net::ERR_FAILED`. Curiosamente otras llamadas de la misma feature **sí** pasan (las que no llevan el header).
- **Causa raíz:** `django-cors-headers` solo refleja en el preflight los headers de la lista **explícita** `CORS_ALLOW_HEADERS`. Como el frontend está en otro origen (`workspace.local.test` → `rbac.local.test`), cada request con un header no estándar dispara un preflight `OPTIONS` que falla si el header no está permitido.
- **Solución:** Añadir el header (en minúsculas) a `CORS_ALLOW_HEADERS` en `config/settings/base.py` (junto a `x-tenant-slug`). Reiniciar Django.
- **Prevención:** Al introducir cualquier header `X-*` propio en el `apiClient`, actualizar `CORS_ALLOW_HEADERS` en el mismo cambio. Si "unas llamadas funcionan y otras no" en una misma feature cross-origin, sospechar del header diferencial + preflight.
- **Fuente:** `reports/2026-06-27-vault-datos-protegidos-contrasena-maestra.md`
- **Tags:** cors, preflight, django-cors-headers, header-custom, cross-origin, vault

### LL-045 — Buscar en un recurso cifrado: solo el campo plano (título), nunca el ciphertext
- **Síntoma (potencial):** Al sumar un recurso con datos cifrados (p. ej. la Bóveda) a una búsqueda global, la tentación es buscar/"mostrar un snippet" del contenido — lo que exigiría descifrar y arriesgaría filtrar secretos en la respuesta de un endpoint que no requiere unlock.
- **Causa raíz:** En `VaultItem` el `title` se guarda en **texto plano** mientras que lo sensible vive en `data_ciphertext`. Mezclar ambos en el `search` (o serializar el item entero) expondría el ciphertext y/o obligaría a manejar el `X-Vault-Token` fuera de su flujo.
- **Solución:** En el agregador (`apps/search/views.py`) buscar **solo `title__icontains`** y devolver únicamente `{title, type-label}`. El `data_ciphertext` no se consulta ni se serializa nunca; el `snippet` muestra solo metadata no sensible (la etiqueta del tipo: Login/API Key/…). Así el endpoint no necesita unlock ni `X-Vault-Token`.
- **Prevención:** Para cualquier modelo con campos cifrados, tratar el ciphertext como **inalcanzable** desde features transversales (search, export, audit). Test explícito: si el término solo está en el secreto, **no** debe haber match y el secreto **no** debe aparecer en el JSON (`assertNotIn` sobre `json.dumps(body)`). Cuidado: el término sí se hace *echo* en `query`, así que asertar sobre el resto del secreto. Ver [[LL-043]].
- **Fuente:** `reports/2026-06-29-buscador-general-workspace.md`
- **Tags:** seguridad, cifrado, vault, search, ciphertext, fuga-de-datos, multi-tenant

### LL-046 — Campo fantasma: el serializer de entrada lo valida, la vista lo descarta, el modelo nunca lo tuvo
- **Síntoma:** Un campo del formulario (p. ej. "Etiquetas" en Notas) parece funcional — se puede
  escribir, se envía, no da error — pero nunca se refleja en la UI después de guardar ni tras
  recargar. Parece un bug de render en el frontend.
- **Causa raíz:** El modelo (`Note`) nunca tuvo la columna `tags`. El serializer de entrada
  (`NoteCreateUpdateSerializer`) sí validaba `tags`, pero las vistas lo descartaban explícitamente
  (`data.pop('tags', None)  # model has no tags field`) y el serializer de salida devolvía
  `SerializerMethodField` hardcodeado a `[]`. El contrato de API prometía un campo que el modelo
  nunca implementó.
- **Solución:** Verificar la cadena completa modelo → migración → serializer de salida → vista antes
  de asumir que "no aparece" es un problema de render. Implementado como `ArrayField` (mismo patrón
  que `Bookmark.tags`/`Snippet.tags`), con migración, y quitando los descartes explícitos en las
  vistas.
- **Prevención:** Si una vista tiene un comentario tipo `# model has no tags field` o similar
  descartando un campo que el serializer de entrada sí valida, es una señal de feature a medio
  implementar — no asumir que es intencional sin confirmarlo. Al depurar "el dato no se ve", probar
  primero directo en el modelo (`Model.objects.first().<campo>`) antes de tocar el frontend.
- **Fuente:** `reports/2026-07-08-notas-workspace-etiquetas-no-se-guardaban.md`
- **Tags:** drf, serializer, campo-fantasma, modelo-incompleto, arrayfield, notes, data-integrity

### LL-047 — Un recurso con dos vías de creación: el plan-gate solo se copió a una
- **Síntoma:** Un límite de plan documentado (p. ej. "Hasta 5 usuarios" en Free) parece cumplirse
  en algunas pruebas y no en otras. El endpoint "obvio" para crear el recurso sí lo bloquea con 402,
  pero el flujo que realmente usa el botón de la UI no.
- **Causa raíz:** `apps/auth_app/admin_views.py` tiene dos endpoints para "agregar un usuario al
  tenant": `UserCreateView` (`POST /admin/users/create/`) y `UserInviteView`
  (`POST /admin/users/invite/`). Solo `UserCreateView` llamaba `check_plan_limit(request.user,
  'users', current_count)` antes de crear el `User`. `UserInviteView` — el que realmente invoca el
  botón "Invitar usuario" del Admin Panel (`useInviteUser.ts` → `/admin/users/invite/`) — creaba el
  `User` directamente, sin chequeo. El límite se implementó una vez y no se replicó al segundo punto
  de entrada del mismo recurso.
- **Solución:** Agregar el mismo `check_plan_limit(request.user, 'users', current_count)` al inicio
  de `UserInviteView.post()`, antes de crear el usuario y disparar el email de invitación. Test
  `test_invite_exceeds_plan_limit` en `apps/auth_app/tests/test_admin_users.py`, mismo patrón que
  `test_create_exceeds_plan_limit` (mock de `check_plan_limit` con `side_effect=PlanLimitExceeded()`).
- **Prevención:** Cuando un recurso gateado por plan tiene más de un endpoint de creación (create
  directo, invite, import, duplicar/clonar, etc.), buscar `check_plan_limit` **por el nombre del
  recurso** (`grep "check_plan_limit(.*'users'"`) en vez de asumir que un solo endpoint representativo
  ya cubre el caso. Al auditar límites de plan, verificar también qué endpoint llama realmente la UI
  (no solo cuál "suena" a la operación) — grep en el hook del frontend (`apiClient.post('/ruta/...')`)
  antes de concluir que un límite está aplicado.
- **Fuente:** auditoría de límites de plan vs "Gestión de Planes" (Admin Panel), 2026-07-11.
- **Tags:** business-logic, plan-limit, check_plan_limit, rbac, multi-entry-point, security

### LL-048 — Límite de plan "continuo" (bytes) no encaja en `check_plan_limit` (conteo de unidades)
- **Síntoma (potencial):** Al ir a aplicar un límite de plan tipo `storage_gb` con el helper genérico
  `check_plan_limit(user, resource, current_count)`, la comparación siempre da "ilimitado" aunque el
  plan defina un número — o se tiene la tentación de renombrar el campo del plan a `max_storage` para
  que encaje, arriesgando romper todos los lugares que ya leen `storage_gb` (serializers, frontend).
- **Causa raíz:** `get_plan_limit(plan, resource)` (`utils/plans.py`) busca la clave
  `f'max_{resource}'` en `PLAN_FEATURES` — convención que **todos** los recursos contables siguen
  (`max_users`, `max_projects`, ...) salvo `storage_gb` y `api_calls_per_month`, que no tienen
  prefijo `max_` porque son límites **operacionales continuos** (bytes, llamadas/mes), no conteos de
  filas de un modelo. `check_plan_limit` además compara `current_count >= limit` (bloquea la
  N-ésima+1 unidad discreta), semántica que no aplica a "¿esta subida de X bytes me pasa del tope?".
- **Solución:** Para un recurso continuo, no reusar `check_plan_limit` — escribir un chequeo dedicado
  que lea el campo real de `PLAN_FEATURES` (`PLAN_FEATURES[plan]['storage_gb']`, no
  `get_plan_limit(plan, 'storage')`) y compare `uso_actual + adicional > límite`. Ver
  `check_storage_limit()` en `apps/rbac/permissions.py` y `get_tenant_storage_bytes()` en
  `utils/storage.py` (cómputo on-demand vía `Sum()`/`.size`, sin modelo de tracking dedicado — mismo
  criterio que Analytics: "no DB models, computed on-demand").
- **Prevención:** Antes de gatear un recurso nuevo, revisar si su clave en `PLAN_FEATURES` sigue la
  convención `max_{resource}` (conteo → `check_plan_limit`) o no (`storage_gb`,
  `api_calls_per_month` → continuo, necesita su propio chequeo). No renombrar campos de
  `PLAN_FEATURES` para forzar el encaje: rompe todos los serializers/frontends que ya leen ese nombre.
- **Fuente:** fix Bug #2 (tracking de `storage_gb`), sesión 2026-07-11. Ver también [[LL-047]].
- **Tags:** business-logic, plan-limit, check_plan_limit, storage, naming-convention, rbac

### LL-049 — Nueva fuente de override: grep todos los lectores directos del dict viejo, no confiar en "ya pasa por el helper"
- **Síntoma (potencial):** Se agrega una forma de sobreescribir un valor de configuración
  (`PLAN_FEATURES` → override en BD vía `Plan.limits`), se actualiza el helper central
  (`get_plan_limit()`), y se asume que "todo lo que lee límites de plan ya pasa por ahí". Un
  endpoint específico (`/api/v1/features/`, o un `get_usage()` de otro serializer) sigue mostrando
  el valor viejo después de que un admin edita el límite — parece que el override "no aplicó",
  pero sí aplicó, ese endpoint puntual nunca lo leyó.
- **Causa raíz:** Antes de existir un mecanismo de override, es común que varios lugares del código
  lean la fuente de config directo (`PLAN_FEATURES.get(plan, ...)`) en vez de pasar por el
  helper "oficial" (`get_plan_limit()`), porque hasta ese momento daba exactamente lo mismo. Al
  agregar el override, esos accesos directos quedan huérfanos — siguen viendo el dict de código,
  nunca la BD. En este proyecto había 3: `FeaturesView` (`apps/rbac/views.py`),
  `TenantSerializer.get_usage` (`apps/tenants/serializers.py`) y
  `CurrentSubscriptionSerializer.get_usage` (`apps/subscriptions/serializers.py`) — ninguno pasaba
  por `get_plan_limit`, los tres construían la respuesta a mano desde `PLAN_FEATURES`.
- **Solución:** `grep -rn "PLAN_FEATURES\.get(\|PLAN_FEATURES\[" apps/` (o el nombre del dict/const
  que se está reemplazando) **antes** de dar por completa una migración de "fuente hardcodeada" a
  "fuente editable + helper cacheado". Reemplazar cada lectura directa por el helper nuevo
  (`get_effective_plan_limits()`), dejando el acceso directo solo para lo que **no** es parte del
  subset editable (ej. feature flags booleanos, que siguen siendo solo de código).
- **Prevención:** Cuando el plan de implementación dice "el helper es el único choke point, los N
  callers existentes se benefician sin cambios" — verificar esa afirmación con grep del símbolo
  viejo, no asumirla por diseño. Los callers de la *función* se benefician solos; los que leen el
  *dict crudo* no.
- **Fuente:** feature "límites de plan editables desde el Admin", sesión 2026-07-11. Ver [[LL-048]].
- **Tags:** business-logic, plan-limit, refactor, cache, hidden-coupling, code-review

### LL-096 — Un evento de negocio (`Invoice`) nunca se registraba porque las dos rutas de aprobación duplicadas nunca lo escribían

> Nota: esta entrada se registró originalmente como LL-095, ID que quedó duplicado con la entrada
> del AppBar (sección I). Renumerada a LL-096 el 2026-07-13; el LL-095 "oficial" es el del AppBar.
- **Síntoma:** "Historial de facturas" en el Hub (`/billing`) siempre vacío ("No tienes facturas
  aún"), incluso para tenants que ya adquirieron un plan de pago en el registro o vía upgrade. No
  es un bug de query ni de permisos: la tabla `invoices` estaba **literalmente vacía** para
  cualquier tenant real — `Invoice.objects.create(...)` solo aparecía en tests, nunca en código de
  producción.
- **Causa raíz:** El único canal de cobro real del proyecto es Yape (pago manual, ver
  `docs/adr/004-pago-manual-yape.md`); Stripe existe en el código (webhooks, `stripe_client.py`)
  pero está desconectado de producción. La aprobación de un pago Yape tiene **dos** rutas
  duplicadas que activan `Subscription`/`Tenant`/`User.is_active` con el mismo bloque de código
  copiado: `YapeProofReviewView.patch` (panel admin, `yape_admin_views.py`) y `YapeActivateView.post`
  (links de un click enviados por Telegram, `yape_public_views.py`). Ninguna de las dos escribía un
  `Invoice` — el gap de negocio nunca se implementó, así que no había "una ruta que se olvidó
  copiar" (patrón [[LL-047]]) sino una feature que jamás existió en ningún lado. Al arreglarlo, el
  riesgo era el mismo de LL-047: implementarlo solo en la vista "obvia" (panel admin) y dejar la
  ruta realmente usada por el staff (links de Telegram, más rápida en el flujo real) sin factura.
- **Solución:** Extraer la lógica de activación a un helper compartido
  (`apps/subscriptions/services.py::activate_yape_proof(proof) -> Invoice`) que hace
  `Subscription`/`Tenant`/`User.is_active` **y** crea el `Invoice` (`status='paid'`,
  `stripe_invoice_id=f'yape_{proof.id}'` para evitar colisión con el `unique=True` sin `null=True`
  del campo, `amount_cents=int(proof.amount * 100)`, período de 30 días) en una sola
  `transaction.atomic()`. Ambas vistas de aprobación llaman al mismo helper. De regalo, esto
  también arregla `CurrentSubscriptionSerializer.get_mrr()`, que siempre daba `0` porque nunca
  existía ningún invoice `status='paid'` que contar.
- **Prevención:** Cuando se descubre que un evento de negocio (factura, notificación, auditoría)
  nunca se registra, **grep primero cuántas rutas de código llevan al mismo estado final**
  (`grep -rn "proof.status.*=.*'approved'"` en este caso) antes de escribir el fix en un solo
  lugar — si hay lógica duplicada entre un panel admin y un flujo "rápido" (webhook, link de un
  click, cron), el fix tiene que ir a un helper compartido, no a la vista que se abrió primero.
  Además: si el modelo del evento tiene un campo `unique=True` sin `null=True`
  (`stripe_invoice_id`), generar siempre un valor sintético único al crearlo manualmente — dejarlo
  en blanco colisiona en el segundo registro.
- **Fuente:** `reports/2026-07-11-hub-billing-facturas-invoice-yape.md`. Ver también [[LL-047]],
  [[LL-005]] (mismo síntoma "lista vacía" en el mismo endpoint, causa raíz distinta pero
  concurrente en esta sesión).
- **Tags:** business-logic, billing, invoice, duplicate-code, multi-entry-point, yape, transaction

---

## F. Frontend React / Next.js (estado, SSR, tipos)

### LL-050 — Hidratación SSR: `useState` inicial con `useSearchParams()` queda en `false`
- **Síntoma:** En Next.js App Router, un badge/precio condicionado a un query param (`?trial=true`) no aparece, aunque el param está en la URL.
- **Causa raíz:** `useState(isTrial && ...)` se evalúa durante el SSR, donde `useSearchParams()` devuelve params vacíos → estado inicial `false`. React preserva ese `false` en la hidratación del cliente.
- **Solución:** Inicializar `useState(false)` y setear en efecto: `useEffect(() => { if (isTrial && ...) setTrialActive(true) }, [isTrial, ...])`.
- **Prevención:** No derivar estado inicial de `useSearchParams()`/datos solo-cliente en componentes que renderizan en SSR; moverlo a `useEffect`.
- **Fuente:** `reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md`
- **Tags:** nextjs, ssr-hydration, useSearchParams, useState, app-router

### LL-051 — `useEffect(reset)` pisado por invalidación de React Query
- **Síntoma:** Un formulario admin se vacía solo al hacer una mutación lateral (p.ej. "Agregar enlace") antes de guardar.
- **Causa raíz:** `useEffect(() => { if (data) reset(data) }, [data, reset])` se re-ejecuta en cada invalidación de cache. La mutación invalida la query → refetch → el effect vuelve a `reset()` y pisa los valores no guardados.
- **Solución:** Guard con `useRef` para inicializar el form **una sola vez**:
  ```ts
  const initialized = useRef(false)
  useEffect(() => { if (data && !initialized.current) { reset(data); initialized.current = true } }, [data, reset])
  ```
- **Prevención:** Cuando un form RHF coexiste con mutaciones que invalidan su query fuente, inicializar el form una vez, no en cada cambio de `data`.
- **Fuente:** `reports/2026-06-22-footer-administrable-hub.md`
- **Tags:** react-hook-form, react-query, useEffect, reset, useRef, cache-invalidation

### LL-052 — axios con `Content-Type` fijo rompe `multipart/form-data` (415)
- **Síntoma:** Subida de archivo (`FormData`) falla con `415 Unsupported Media Type`.
- **Causa raíz:** La instancia axios define `headers: { 'Content-Type': 'application/json' }` por defecto; con `FormData` el navegador no puede calcular el `boundary`.
- **Solución:** En el request con `FormData`, sobreescribir `Content-Type: undefined` para que el navegador/axios calculen el `multipart/form-data; boundary=...`.
- **Prevención:** Para uploads, nunca forzar `Content-Type`; dejar que el navegador lo derive.
- **Fuente:** `reports/2026-06-15-implementacion-pago-yape.md`
- **Tags:** axios, multipart, form-data, content-type, 415, upload

### LL-053 — Interfaces TypeScript desincronizadas con los serializers DRF
- **Síntoma:** El front no envía/usa un campo que el backend sí devuelve (p.ej. `tenant.slug` ausente en `DesktopTenant` aunque `TenantSerializer` lo retorna) → bugs aguas abajo.
- **Causa raíz:** La interfaz TS no se actualizó cuando el serializer cambió.
- **Solución:** Añadir el campo faltante a la interfaz y propagarlo.
- **Prevención:** Al cambiar un serializer, revisar las interfaces TS que consumen ese payload. Candidato a generación de tipos desde el schema OpenAPI.
- **Fuente:** `reports/2026-03-15-bugfix-desktop-snippets.md`
- **Tags:** typescript, serializer-sync, drf, types

### LL-054 — Import default vs nombrado ("Module has no default export")
- **Síntoma:** Error TS "Module has no default export" al importar un componente.
- **Causa raíz:** El componente usa export **nombrado**, no default.
- **Solución:** `import { PlatformDownloadCard }` en vez de `import PlatformDownloadCard`.
- **Prevención:** Verificar el tipo de export antes de importar; en este proyecto predomina el export nombrado.
- **Fuente:** `reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md`
- **Tags:** typescript, import, named-export, default-export

### LL-055 — `400 Bad Request` al crear/editar por nombres de campo distintos del serializer de escritura
- **Síntoma:** Un POST/PATCH de creación falla con **400** y la UI muestra un error genérico ("Ocurrió un error. Intenta de nuevo."). En consola: `POST /api/v1/app/<recurso>/ 400`. No hay error de TypeScript: el tipo del frontend es *self-consistent* pero usa otro vocabulario que el serializer de escritura del backend. Caso real: Calendario en Workspace enviaba `start_date`/`end_date`/`all_day`/`category`, pero `CalendarEventCreateUpdateSerializer` exige `start_datetime`/`end_datetime` (required) e `is_all_day` y no tiene `category` → faltan los required → 400.
- **Causa raíz:** Desalineación de nombres entre el payload del frontend y el contrato de **escritura** del backend. Agravante frecuente: el serializer de **lectura** expone *alias* de conveniencia (p.ej. `start_date`/`end_date` además de `start_datetime`), lo que oculta el problema en el GET y hace creer que esos nombres también valen para escribir. Variante de runtime de [[LL-053]] (que sí daba error TS) y de la nota de [[LL-079]].
- **Solución:** El backend (modelo + serializer) es el esquema canónico. Mapear en la **frontera**: en `onSubmit`/el hook de mutación construir el payload con los nombres exactos del serializer de escritura (`start_datetime`, `end_datetime`, `is_all_day`, …). Si la lectura usa nombres distintos (`is_all_day` vs `all_day`, sin `category`), transformar también en el `select` del hook de query (mapear back→front) para que editar prellene bien. Los conceptos solo-frontend (p.ej. `category`) se derivan a/desde un campo real (`color`) con un mapa y su inverso.
- **Prevención:** Antes de cablear un form a un endpoint, abrir el serializer de **escritura** (no fiarse del de lectura ni del tipo TS del front) y copiar los nombres/required exactos. Probar **crear** de verdad, no solo listar. Recordar que un GET correcto no garantiza que el POST use los mismos nombres. Candidato a generar tipos desde el schema OpenAPI. Ver [[LL-053]], [[LL-079]].
- **Fuente:** sesión 2026-06-25 (bugfix crear evento Calendario Workspace)
- **Tags:** drf, serializer, field-mismatch, 400, calendar, workspace, write-contract, frontend-backend

### LL-056 — El error nativo "WebSocket … failed" no es suprimible desde JS; acotar reintentos
- **Síntoma:** La consola del navegador se llena de `WebSocket connection to 'ws://…/ws/chat/…' failed` repetido cada pocos segundos, incluso en páginas que no son el chat (la consola de una SPA **persiste** los logs entre rutas).
- **Causa raíz:** Dos cosas combinadas. (1) Ese mensaje lo emite **el navegador** al fallar `new WebSocket()`; no lo captura `try/catch`, `onerror` ni un override de `console` → no se puede silenciar desde JS. (2) `useChatSocket` reconectaba con backoff **indefinidamente** (cada ≤15 s para siempre), así que cada reintento generaba un error nuevo. En entornos sin ASGI/Daphne (o proxy que no hace upgrade WS) el socket nunca conecta → spam infinito. El chat igual funciona por el **fallback de polling**.
- **Solución:** Acotar los reintentos: `MAX_RECONNECT_ATTEMPTS = 4` en `useChatSocket.ts`; en `onclose`, si se alcanzó el tope, **no** reprogramar `connect()`. Resetear el contador a 0 en `onopen` (un corte transitorio recupera su presupuesto). El spam pasa de infinito a ~5 líneas.
- **Prevención:** Todo cliente WS con reconexión debe tener un tope de intentos (o circuit breaker), no un bucle eterno. Asumir que el "log de conexión fallida" es **inevitable** por intento; lo único controlable es **cuántos intentos**. La cura de raíz es servir el WS de verdad (ASGI/Daphne + upgrade en Traefik) — deuda "Chat Fase 3" en `BACKLOG.md`. Para WS solo necesarios en una vista, montar el hook **solo** en esa vista (no global).
- **Fuente:** `reports/2026-06-29-buscador-general-workspace.md` (cambio colateral)
- **Tags:** websocket, consola, reconexion, backoff, chat, asgi, polling-fallback, frontend

---

### LL-057 — Feature key del frontend que no existe en `plans.py` → la feature queda permanentemente deshabilitada (en silencio)
- **Síntoma:** Un `<FeatureGate feature="xxx_export">` (o `useFeatureGate().hasFeature('xxx')`) muestra **siempre** el fallback deshabilitado, incluso en planes que deberían incluir la feature. No hay error: simplemente nunca se habilita.
- **Causa raíz:** `FeaturesView` (`apps/rbac/views.py`) serializa **las claves crudas** de `PLAN_FEATURES` (`utils/plans.py`). `hasFeature(k)` hace `Boolean(data.features[k])`, así que una clave inexistente → `undefined` → `false` para todos los planes. En el Workspace había mismatch real: el front usaba `contacts_export`/`bookmarks_export`/`snippets_export`/`projects_export` mientras el back definía `contact_export`/`bookmark_export` (singular) y los otros dos **no existían**. Resultado: los 4 botones de export inline nunca se mostraban habilitados.
- **Solución:** Reconciliar la clave del front con la del back (fuente de verdad = `plans.py`) y/o **agregar** la clave a los 4 dicts de plan. Verificar con `grep "'<feature>'" utils/plans.py` que la clave existe en `free/starter/professional/enterprise` antes de gatear con ella.
- **Prevención:** El nombre del feature flag es un **contrato** front↔back sin validación en runtime. Al añadir un gate nuevo: (1) definir primero la clave en `plans.py` (los 4 planes), (2) usar **exactamente** ese string en el front. Un flag que falta no rompe ni loguea — se degrada a "deshabilitado para todos", que es fácil de no notar. Mismo espíritu que [[LL-053]] (interfaces TS desincronizadas con serializers) y [[LL-061]] (permisos no sembrados).
- **Fuente:** `reports/2026-06-29-export-datos-workspace.md`
- **Tags:** feature-gate, plans, featuregate, frontend, backend, contrato, silent-failure, export

### LL-058 — Clases Tailwind definidas como string literal fuera de `content` no se generan (aunque el className las interpole)
- **Síntoma:** Un componente aplica `className={`... ${tokens.radiusCard} ...`}` donde `tokens.radiusCard` viene de un objeto/mapa (`Record<Key, string>`) definido en otro archivo (p.ej. `rounded-3xl`). En el navegador el className del DOM sí trae el string correcto, pero `getComputedStyle` no refleja la clase — border-radius queda en `0px`/el valor por defecto. Otras clases del mismo mapa (`shadow-md`, `rounded-full`) sí funcionan, lo que hace parecer un bug intermitente.
- **Causa raíz:** El JIT de Tailwind genera CSS solo para clases que encuentra por **regex sobre los archivos listados en `content` de `tailwind.config.ts`**. El mapa de tokens vivía en `src/features/landing/types.ts`, y el `content` array solo listaba `src/pages`, `src/components` y `src/app` — nunca `src/features`. Las clases que "sí funcionaban" (`shadow-md`, `rounded-full`) coincidían por casualidad con otro literal ya presente en un archivo sí escaneado; `rounded-3xl` no aparecía en ningún otro lado y por eso faltaba en el CSS final.
- **Solución:** Agregar la carpeta del mapa de tokens al `content` de `tailwind.config.ts` (`'./src/features/**/*.{js,ts,jsx,tsx,mdx}'`) y reiniciar/recompilar el dev server.
- **Prevención:** Cualquier "mapa de tokens de diseño" (colores, radios, sombras, spacing) que viva fuera de `components`/`app`/`pages` — típicamente en `features/*/types.ts` o `lib/`— debe estar cubierto por `content`. Al crear un sistema de variantes/presets nuevo, verificar con `getComputedStyle` (no solo inspeccionar el className en el DOM) que la clase realmente tiene la regla CSS generada, sobre todo para valores "raros" (`rounded-3xl`, `py-36`) que no aparecen ya en otro lado del código escaneado.
- **Fuente:** feature "Estilos preestablecidos Landing Page", sesión 2026-07-02.
- **Tags:** tailwind, content-scanning, jit, css-purge, design-tokens, nextjs, style-preset

### LL-059 — `next/font/google` precarga cualquier fuente expuesta en un layout compartido, aunque la ruta actual no la use
- **Síntoma:** Se agrega una segunda familia tipográfica (p.ej. una serif para un preset "editorial") vía `next/font/google` en el layout raíz (`src/app/[locale]/layout.tsx`), expuesta como CSS var (`--font-playfair`) solo consumida por una clase Tailwind (`font-editorial`) usada en una sola ruta pública. La expectativa razonable es que el navegador solo descargue el `.woff2` cuando esa clase aparezca realmente en el DOM (comportamiento nativo de `@font-face` lazy-loading). Verificando con la pestaña Network en una ruta que NO usa `font-editorial` (p.ej. `/dashboard`), el archivo de la fuente nueva se descarga igual.
- **Causa raíz:** `next/font/google` añade automáticamente un `<link rel="preload">` para toda fuente referenciada en un layout, sin importar si algún descendiente la usa — Next.js no puede saber estáticamente, por-ruta, si una hoja del árbol renderiza `font-editorial`, porque el layout raíz se comparte con todas las rutas. El preload fuerza la descarga eager, no lazy, independientemente del CSS lazy-loading nativo del navegador.
- **Solución (si el costo importa):** Mover la carga de la fuente fuera del layout raíz, a un layout específico de la subruta que la usa (p.ej. `src/app/[locale]/landing/[username]/layout.tsx`), para que el preload solo se inyecte en esa rama del árbol de rutas.
- **Prevención:** Si el archivo es pequeño (~30-50KB) y tiene cache `immutable` de un año, el costo real es "una descarga extra la primera vez que el usuario visita cualquier ruta de la app, cacheada después" — evaluar si vale la pena el layout adicional o es aceptable. Si se agregan más fuentes a futuro (p. ej. Fase 3 de estilos), considerar desde el inicio un layout segmentado para rutas públicas de landing en vez del layout raíz compartido con el dashboard.
- **Fuente:** feature "Estilos preestablecidos Landing Page" Fase 2, sesión 2026-07-02.
- **Tags:** nextjs, next-font, font-preload, google-fonts, layout, performance, style-preset

### LL-092 — Ticket de soporte "no se registra" en el Hub: el POST sí funciona, pero el GET nunca lo muestra por mismatch de envelope + namespace de i18n inexistente
- **Síntoma:** En `frontend_next_hub` (`/support`), al crear un ticket el modal muestra la pantalla de éxito, pero la lista de tickets se queda en "0 / sin tickets" — parece que el ticket nunca se creó. Además, **todos** los textos de la página de Soporte se ven como claves crudas sin traducir (`support.title`, `support.newTicket`, `support.serviceStatus: support.serviceStatusOk`, etc.) en vez del texto en español.
- **Causa raíz (dos bugs independientes, ambos en el frontend):**
  1. **Envelope mismatch:** `TicketListCreateView.get` (`apps/backend_django/apps/support/views.py`) responde `{'tickets': [...]}` y `TicketDetailView.get` responde `{'ticket': {...}}`. Pero `features/support/hooks/useMyTickets.ts` leía `res.data.results ?? []` (clave `results` que el backend nunca envía) y `useTicketDetail.ts` devolvía `res.data` completo en vez de `res.data.ticket`. El ticket sí se crea (201, con `AuditLog`), pero la lista siempre cae al fallback `[]` porque busca la clave equivocada. Mismo patrón de contrato front↔back no validado que [[LL-057]].
  2. **Namespace de i18n inexistente:** Todos los componentes de `features/support/**` llamaban `useTranslation('hub')`, pero `i18n/config.ts` define `NAMESPACES` sin `'hub'` (solo `'support'`, `'profile'`, `'dashboard'`, etc., cada uno con claves **planas**, sin prefijo). Como el namespace `'hub'` no existe, i18next no encuentra nada y devuelve la propia key como texto — de ahí `support.title` literal en pantalla. El resto de features (`profile`, `dashboard`) sí usaban el namespace correcto (`useTranslation('profile')` + `t('title')` sin prefijo), por lo que el bug quedó aislado a `support`, posiblemente un refactor de namespaces que no tocó esos 7 archivos.
  3. Bug menor asociado: `TicketComment.author_name` (tipo TS del Hub) vs `author` (campo real del serializer, y el que sí usa `frontend_admin/features/support`) — rompía el render de comentarios en el detail view.
- **Solución:** `useMyTickets.ts` → `res.data.tickets ?? []`; `useTicketDetail.ts` → `res.data.ticket`; renombrar `author_name`→`author` en `types.ts` y `TicketDetailView.tsx`. En los 7 archivos de `features/support/`: `useTranslation('hub')` → `useTranslation('support')` y quitar el prefijo `support.` de cada `t('support.xxx')` → `t('xxx')` (incluyendo los mapas `STATUS_CONFIG`, `PRIORITY_CONFIG`, `CATEGORY_LABELS`). De paso se agregaron las claves faltantes `statusWaitingClient`/`statusClosed` (existían solo 3 de los 5 estados) y se completó `en.ts` con las claves de `support` que solo existían en `es.ts` (categoryField, allStatuses, noTickets, comments, etc.) — el inglés estaba con el mismo tipo de gap.
- **Prevención:** Al crear un namespace nuevo de i18n en un frontend con `react-i18next` multi-namespace, copiar el patrón exacto de un feature ya funcionando (namespace = nombre de carpeta, claves sin prefijo) en vez de asumir un namespace compartido tipo `'hub'`. Un `useTranslation(ns)` con `ns` inexistente **no rompe nada, solo muestra la key** — no hay error en consola, así que hay que revisar visualmente cada página nueva (o un test de smoke con `i18n.exists(key, {ns})`). Para el envelope: cuando el backend versiona la respuesta como `{recurso: [...]}` (singular envuelto), el hook de fetch debe leer exactamente esa clave — no asumir `results` (paginación DRF) ni `Array.isArray` como fallback silencioso, porque un fallback a `[]` enmascara el bug (parece "no se creó" en vez de "no se está leyendo bien").
- **Fuente:** captura de pantalla del usuario probando `/support` en `frontend_next_hub`, sesión 2026-07-10.
- **Tags:** frontend, nextjs, react-i18next, namespace, support, envelope, contrato-api, silent-failure, hub

### LL-093 — Soporte multi-tenant: el Admin Panel (superadmin) no veía tickets de ningún tenant cliente + mismo bug de envelope reaparece en `frontend_admin`
- **Síntoma:** Tras resolver [[LL-092]] (tickets del Hub ya visibles/traducidos), el usuario reportó que `frontend_admin` (`rbac-admin.local.test/support`) seguía mostrando "0 tickets" pese a que el Hub sí tenía 2 tickets creados. Al abrir el detalle de un ticket (una vez arreglada la visibilidad), la app crasheaba con `TypeError: Cannot read properties of undefined (reading 'length')` en `TicketDetailView.tsx`.
- **Causa raíz (dos problemas distintos):**
  1. **Decisión de arquitectura no implementada:** `TicketListCreateView.get`/`_get_ticket` (`apps/support/views.py`) siempre filtraban por `tenant=request.tenant` — el tenant resuelto del header `X-Tenant-Slug`, que para el superadmin de `frontend_admin` es **su propio tenant adjunto** (en el seed local, "Demo Empresa S.A.", con 0 tickets), no "todos los tenants". No existía ninguna vista cross-tenant: un superadmin (`is_staff=True`) que administra la plataforma nunca podía ver los tickets de ningún tenant cliente real (Empresa108, etc.). Confirmado con el usuario (ver AskUserQuestion de la sesión) que el comportamiento esperado es: **todo usuario `is_staff=True` ve los tickets de todos los tenants** en el Admin Panel, mientras que el Hub sigue 100% aislado por tenant (sin cambios ahí).
  2. **Mismo bug de envelope que LL-092, pero en `frontend_admin`:** `useTicketDetail.ts` (`apps/frontend_admin/src/features/support/hooks/`) trataba `res.data` completo como el ticket, cuando el backend responde `{'ticket': {...}}`. Nunca se había manifestado porque el tenant del superadmin tenía 0 tickets — la primera vez que hubo un ticket real que abrir (gracias al fix de #1) fue la primera vez que se ejecutó ese código, y crasheó en `ticket.comments.length` (`ticket.comments` era `undefined` porque `ticket` en realidad era `{ticket: {...}}`). `useTickets.ts` (la lista) sí leía `res.data.tickets` correctamente — el bug era solo en el detalle.
- **Solución:** (1) En `views.py`: `_is_agent()` ahora también es `True` si `user.is_staff` (agente automático, coherente con "todo staff administra soporte"); `TicketListCreateView.get`, `_get_ticket()` y `TicketExportView.get` usan `SupportTicket.objects.all()` en vez de filtrar por tenant cuando `request.user.is_staff`. El lookup de `assigned_to` se mantuvo con `tenant=request.tenant` a propósito — el "agente asignado" es del equipo propio del admin (su tenant adjunto), no del tenant del cliente que abrió el ticket. (2) En `frontend_admin`: `useTicketDetail.ts` ahora desenvuelve `res.data.ticket`. Se agregó test `test_platform_staff_sees_tickets_across_all_tenants` (helper `_create_staff_user` con rol+permisos via RBAC, no solo `is_superuser`, para probar el caso real "`is_staff` sin ser superuser").
- **Prevención:** Cuando un modelo es multi-tenant por diseño (`tenant=request.tenant` como filtro por defecto en casi toda vista), cualquier "vista de administración de la plataforma" (superadmin/staff) necesita una **bypass explícita y deliberada** de ese filtro — no ocurre solo porque el usuario tenga `is_staff`/`is_superuser`, hay que codificarlo vista por vista. Antes de dar por buena una vista "para el admin de la plataforma", verificar en el navegador con **datos reales cross-tenant** (no solo con el tenant de seed del propio superadmin, que en dev suele estar vacío) — así se hubiera detectado el crash del detalle antes de que lo reportara el usuario. Mismo patrón de bug de envelope que [[LL-092]]: si dos frontends distintos consumen el mismo endpoint, revisar **ambos** hooks de fetch, no asumir que arreglar uno basta.
- **Fuente:** sesión 2026-07-10, continuación de LL-092 — verificación end-to-end en `frontend_admin` tras exponer soporte cross-tenant.
- **Tags:** multi-tenant, rbac, is_staff, superadmin, support, envelope, contrato-api, frontend_admin, cross-tenant

### LL-094 — Mutación que falla con 403 sin manejo de error en el frontend se percibe como "se queda congelado"
- **Síntoma:** En `frontend_next_hub`, un usuario con rol **Member** (sin permisos `support.*` — ver [[LL-093]], solo el rol `Owner` los tiene en los fixtures del sistema) hace clic en "Enviar ticket" y el modal no hace nada visible: no cierra, no muestra error, el botón vuelve a su estado normal. En la consola del navegador aparece `POST .../support/tickets/ 403 (Forbidden)`. El usuario lo reporta como que la UI "se queda congelada", cuando en realidad la request sí respondió (rápido) pero `NewTicketModal.tsx` no tenía ningún `onError` en la mutación — un fallo silencioso indistinguible de un cuelgue real.
- **Causa raíz:** `useCreateTicket().mutate()` solo manejaba `onSuccess`; TanStack Query sí exponía el error (`createTicket.isError`/`error`) pero nada en el componente lo leía ni renderizaba. Cualquier 4xx/5xx del backend quedaba completamente invisible para el usuario.
- **Solución:** Se agregó `onError` al `mutate()` con un mensaje diferenciado: si `isAxiosError(error) && error.response?.status === 403` → mensaje explicando que el rol actual no tiene permiso y que solo el Owner puede crear tickets (texto exacto pedido por el usuario, traducido en `es.ts`/`en.ts` bajo `support.errorNoPermission`); cualquier otro error → mensaje genérico `support.errorGeneric`. Se renderiza en un banner rojo dentro del modal (no se cierra, el usuario puede corregir/reintentar). Nota: esto es **solo el mensaje de error**, no un cambio del modelo de permisos — el usuario decidió explícitamente no tocar el RBAC ahora (Member sigue sin poder crear tickets), solo mejorar el feedback.
- **Prevención:** Toda mutación de TanStack Query que pueda fallar por una razón *esperable* (permiso, plan, validación de negocio) necesita un `onError` explícito con mensaje accionable — nunca asumir que "onSuccess alcanza". Un fallo silencioso en un modal que no cierra ni muestra nada se reporta casi siempre como "se congela"/"no hace nada", no como "error 403", así que hay que revisar la consola en cualquier reporte de este tipo antes de asumir un bug de rendering. Este proyecto no tenía ningún patrón `onError` en mutaciones de `frontend_next_hub` (grep sin resultados) — considerar un wrapper/hook compartido si el patrón se repite en más features.
- **Fuente:** sesión 2026-07-10, reporte de usuario con captura de consola tras LL-093.
- **Tags:** frontend, nextjs, react-query, error-handling, ux, permission-denied, support, mutation

---

## G. Testing (MSW, fixtures, permisos)

### LL-060 — MSW v2: mismatch de trailing slash en handlers → ECONNREFUSED
- **Síntoma:** Tests fallan con `ECONNREFUSED 127.0.0.1:8000`; la petición sale a la red real.
- **Causa raíz:** Los handlers MSW registran URLs con trailing slash (`/auth/login/`) pero el código llama sin slash (`/auth/login`). MSW v2 hace matching **estricto**: si no coincide, no intercepta y la request va a la red. Además paths divergentes (`/auth/token/refresh/` vs `/auth/refresh-token`).
- **Solución:** Registrar ambas variantes (con y sin slash) en los handlers y corregir los paths para que coincidan con los del código. Alinear los `server.use()` override de cada test.
- **Prevención:** Mantener las URLs de los handlers MSW idénticas a las del cliente HTTP real (incluida la slash). Ver también el patrón general de trailing slash (sección A). Nota relacionada (de memoria PASO 18): MSW de `msw/node` intercepta el módulo `http` de Node, no el XHR de jsdom → fijar `axios.defaults.adapter='http'`; handlers con URL completa (`http://localhost:8000/...`); `onUnhandledRequest:'bypass'`.
- **Fuente:** `reports/varios/frontend_next_hub_deployment_issues.md`
- **Tags:** msw, testing, trailing-slash, econnrefused, handlers

### LL-061 — Permisos no sembrados / fixture incompleto → 403 inesperados
- **Síntoma:** Endpoints devuelven 403 aunque el usuario "debería" tener acceso; o tests de soporte fallan con 403 al ver recursos propios.
- **Causa raíz:** `seed_permissions` no se ejecutó (rol Owner inexistente → usuario sin roles), o el permiso usado por la vista no existe en el fixture (p.ej. `support.read`).
- **Solución:** Ejecutar `make seed-permissions` y asignar el rol; o usar un permiso que sí exista en el fixture (o `IsAuthenticated` donde aplique). Al añadir un permiso nuevo (p.ej. `knowledge_base.manage`), agregarlo al fixture `seed_permissions` para que se asigne al Owner en instalaciones nuevas.
- **Prevención:** Todo permiso referenciado en una vista debe existir en los fixtures de `seed_permissions`. Tras crear apps/roles, correr el seed antes de probar.
- **Fuente:** memoria PASO 21; `reports/2026-06-20-implementacion-chat-ia.md` (deuda `knowledge_base.manage`)
- **Tags:** rbac, permissions, seed, fixtures, 403

### LL-062 — Test con fechas hardcodeadas falla con el paso del tiempo
- **Síntoma:** Un test que pasaba empieza a fallar sin tocar el código (p.ej. `los eventos aparecen en la vista mes` no encuentra los eventos). Falla igual con o sin los cambios en curso (confirmar con `git stash`).
- **Causa raíz:** Fixtures con fechas **absolutas** (`start_date: '2026-03-10T09:00'`) contra UI que muestra el **mes/día actual** por defecto. Cuando la fecha real avanza fuera de ese mes, el componente ya no renderiza esos eventos. El test era válido solo en la ventana temporal en que se escribió.
- **Solución:** Derivar las fechas de los fixtures de `new Date()` (hoy) para que siempre caigan en el rango mostrado: `const today = new Date(); const ymd = ...; start_date: \`${ymd}T09:00\``. Alternativa: fijar el reloj con `vi.setSystemTime(new Date('...'))` en `beforeEach` + `vi.useRealTimers()` en `afterEach`.
- **Prevención:** Nunca hardcodear fechas absolutas en fixtures que se comparan contra vistas "hoy/mes actual". Antes de culpar un cambio por un test roto, correr el test con `git stash` para descartar fallo pre-existente dependiente del tiempo.
- **Fuente:** sesión 2026-06-25 (bugfix crear evento Calendario Workspace)
- **Tags:** testing, fixtures, fechas, time-dependent, vitest, flaky

### LL-063 — Test nuevo con `DatabaseError: Save with update_fields did not affect any rows`
- **Síntoma:** Un `TestCase`/`APITestCase` nuevo (primera vez que se testea esa vista) falla con
  `django.db.utils.DatabaseError: Save with update_fields did not affect any rows` en un `tenant.save(update_fields=[...])`
  que en producción funciona sin problema. El código de la vista no cambió.
- **Causa raíz:** `TenantMiddleware` (`apps/tenants/middleware.py`) resuelve `request.tenant` con un
  lookup **cacheado en Redis por slug** (`tenant:slug:{slug}`, TTL 5 min) — no es DB-por-request. Si
  el test crea un `Tenant` con un slug ya usado por otro test anterior en la misma corrida (o si Redis
  no se limpia entre tests), el middleware devuelve el objeto `Tenant` **cacheado de una transacción de
  test ya revertida** (Django envuelve cada test en una transacción que hace rollback al final). Ese
  `Tenant` cacheado apunta a un PK que ya no existe en la BD del test actual → el `UPDATE ... WHERE id=X`
  no afecta ninguna fila.
- **Solución:** En el `setUp()` de cualquier test que dispare `TenantMiddleware` (cualquier request a
  `/api/v1/admin/` o `/api/v1/app/`), usar caché en memoria y limpiarla: `@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})` en la clase +
  `cache.clear()` como primera línea de `setUp()`. Patrón ya usado en `apps/auth_app/tests/test_admin_users.py`
  y `apps/chat/tests/*.py` — replicarlo en cualquier app nueva que no tenga tests todavía.
- **Prevención:** Al escribir el primer test de una vista que depende de `request.tenant` (o de
  cualquier vista bajo el middleware de tenant), copiar el patrón `CACHES` + `cache.clear()` desde un
  test file existente en vez de partir de un `TestCase` vacío — si no, el primer fallo es confuso
  porque no menciona caché ni Redis en el traceback.
- **Fuente:** sesión 2026-07-11 (fix Bug #2 storage — primer test de `apps/tenants/`, app sin tests previos)
- **Tags:** testing, cache, redis, multi-tenant, middleware, database-error, test-isolation

---

## H. Deploy: Dokploy / Traefik / Nginx / build

> Contexto de producción: VPS con **Dokploy** + **Traefik** (no Nginx Proxy Manager, que es el de dev).
> Servicios de tipo **Compose** (no Application) → Dokploy NO inyecta labels de Traefik automáticamente.
> Las env vars de Dokploy son **runtime**, salvo lo que se declare como **build args** (lo de frontend).

### LL-070 — Traefik no crea router sin labels completos (falta `.service=`)
- **Síntoma:** El sitio devuelve `404 page not found` en texto plano (respuesta de Traefik, no de la app). El router no aparece en `GET http://localhost:8080/api/http/routers` de Traefik.
- **Causa raíz:** Para servicios **Compose**, Dokploy no auto-inyecta labels de Traefik. Con solo `traefik.enable=true` (o sin la label `...routers.<name>.service=<name>`), Traefik ve el contenedor pero **no crea el router**.
- **Solución:** Labels completas en `docker-compose.dokploy.yml` (router HTTPS + redirect HTTP→HTTPS + service con puerto). La label crítica es `traefik.http.routers.<name>.service=<name>`:
  ```yaml
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.NAME.rule=Host(`${DOMAIN}`)"
    - "traefik.http.routers.NAME.entrypoints=websecure"
    - "traefik.http.routers.NAME.service=NAME"                 # ← crítico
    - "traefik.http.routers.NAME-http.rule=Host(`${DOMAIN}`)"
    - "traefik.http.routers.NAME-http.entrypoints=web"
    - "traefik.http.routers.NAME-http.middlewares=redirect-to-https@file"
    - "traefik.http.routers.NAME-http.service=NAME"
    - "traefik.http.services.NAME.loadbalancer.server.port=PUERTO"
  ```
  Ambos (app y `dokploy-traefik`) deben estar en la red externa `dokploy-network`.
- **Prevención:** Ante un 404 de Traefik, verificar routers (`docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers`) y que exista la label `.service=`. Backend en `:8000`, frontends nginx en `:80`, Next.js en su puerto interno (3004, etc.).
- **Casos vistos:** backend (`:8000`), admin (`:80`), vista (`:3004`), workspace (`:80`) — todos el mismo patrón.
- **Fuente:** `reports/2026-04-01-deploy-backend-dokploy.md`, `reports/2026-04-03-deploy-frontend-admin-dokploy.md`, `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md`, `reports/2026-04-03-deploy-frontend-workspace-dokploy.md`
- **Tags:** dokploy, traefik, 404, labels, router, service-label, dokploy-network, deploy

### LL-071 — Django tras Traefik: redirect loop SSL + healthcheck unhealthy
- **Síntoma:** Contenedor Django `(unhealthy)`; o loop infinito de redirects HTTPS; o `400` por `ALLOWED_HOSTS` en el healthcheck.
- **Causa raíz:** Traefik termina el SSL y reenvía **HTTP** interno a Django. Con `SECURE_SSL_REDIRECT=True`, Django ve HTTP y redirige a HTTPS → loop. El healthcheck `curl` interno tampoco manda `X-Forwarded-Proto` ni `Host` válido.
- **Solución:**
  ```python
  # config/settings/prod.py
  SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
  USE_X_FORWARDED_HOST = True
  ```
  ```yaml
  # healthcheck en compose: simular request HTTPS válido
  test: ["CMD","curl","-f","-H","X-Forwarded-Proto: https","-H","Host: ${API_DOMAIN}","http://localhost:8000/api/health/"]
  ```
- **Prevención:** Cualquier app Django detrás de un proxy que termina TLS necesita `SECURE_PROXY_SSL_HEADER` + `USE_X_FORWARDED_HOST`; los healthchecks internos deben enviar `X-Forwarded-Proto: https` y un `Host` que esté en `ALLOWED_HOSTS`.
- **Fuente:** `reports/2026-04-01-deploy-backend-dokploy.md`
- **Tags:** django, traefik, ssl-redirect, proxy-ssl-header, healthcheck, allowed-hosts, deploy

### LL-072 — Build de Django falla en `collectstatic` (SECRET_KEY / dep de logging)
- **Síntoma:** El build del Dockerfile falla en `collectstatic` con `ModuleNotFoundError: No module named 'pythonjsonlogger'` y/o por falta de `SECRET_KEY`.
- **Causa raíz:** `collectstatic` corre en **build-time** e importa los settings (`prod.py`), que (a) requieren `SECRET_KEY` —pero Dokploy inyecta env vars en runtime, no en build— y (b) usan `pythonjsonlogger.jsonlogger.JsonFormatter`, que no estaba en `requirements/prod.txt`.
- **Solución:** En el `Dockerfile` (stage prod): `ARG SECRET_KEY=placeholder-...` antes del `collectstatic`; y añadir `python-json-logger==2.0.7` a `requirements/prod.txt`. (También `curl` en apt para el healthcheck.)
- **Prevención:** Todo lo que importe settings en build-time (collectstatic, migrate en build) necesita las settings importables sin env vars de runtime → proveer placeholders por `ARG` y asegurar que toda dependencia referenciada en `prod.py` (logging, etc.) esté en `prod.txt`. Ver LL-022 para deps faltantes en runtime.
- **Fuente:** `reports/2026-04-01-deploy-backend-dokploy.md`
- **Tags:** django, dockerfile, collectstatic, build-time, secret-key, python-json-logger, requirements, deploy

### LL-073 — Vars de frontend (`VITE_*` / `NEXT_PUBLIC_*`) deben ser build args en Dokploy
- **Síntoma:** En producción una URL/clave del frontend usa el **fallback de desarrollo** (p.ej. logout va a `localhost:5175`, o la API apunta a un host viejo), aunque la variable está puesta en Dokploy.
- **Causa raíz:** `VITE_*` (Vite) y `NEXT_PUBLIC_*` (Next) se **hornean en el bundle durante `npm run build`** (build-time). Si en Dokploy se definen como env vars de **runtime**, no llegan al build y el código cae al fallback hardcodeado.
- **Solución:** Declararlas como **Build Args** en Dokploy y mapearlas en el `Dockerfile` (`ARG VITE_X` + `ENV VITE_X=${VITE_X}`) y en `docker-compose.dokploy.yml` (`build.args: VITE_X: ${VITE_X:-<default-prod>}`). Poner un default de prod en el compose garantiza que funcione aunque falte la var en Dokploy.
- **Prevención:** Regla para todo frontend (Vite o Next) en Dokploy: las vars del bundle van como build args en los **tres** sitios (Dokploy build, Dockerfile ARG/ENV, compose build.args). Mismo principio que LL-010/LL-011 (NEXT_PUBLIC). Un fallback que aparece en prod casi siempre = la var no llegó al build.
- **Casos vistos:** `VITE_HUB_URL` en workspace (logout a localhost); `VITE_*` en admin; `NEXT_PUBLIC_*` en vista/hub.
- **Fuente:** `reports/2026-04-03-deploy-frontend-workspace-dokploy.md`, `reports/2026-04-03-deploy-frontend-admin-dokploy.md`, `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md`
- **Tags:** vite, next_public, build-args, dokploy, dockerfile, build-time, env-vars, deploy

### LL-074 — Nginx en contenedor SPA: quitar proxy `/api/` + destino `conf.d/default.conf`
- **Síntoma:** El contenedor del frontend (React+nginx) entra en **crash-loop** (`Restarting`), Traefik no registra su router.
- **Causa raíz (dos):** (1) `nginx.conf` tenía `location /api/ { proxy_pass http://rbac_django:8000; }`; nginx resuelve hostnames DNS al arrancar y `rbac_django` no existe en `dokploy-network` → falla al iniciar. (2) El Dockerfile copiaba el archivo a `/etc/nginx/nginx.conf` (archivo **principal**, requiere `events{}`+`http{}`); un bloque `server{}` desnudo ahí es inválido.
- **Solución:** (1) Eliminar el bloque `/api/` — en prod la URL de la API ya va bakeada en el bundle (`VITE_API_URL`/`NEXT_PUBLIC_*`) apuntando directo al dominio del backend. (2) Copiar a `/etc/nginx/conf.d/default.conf` (la imagen `nginx:alpine` ya tiene el `nginx.conf` con `events`/`http` que incluye `conf.d/*`).
- **Prevención:** En frontends estáticos servidos por nginx en Dokploy: nada de proxy `/api/` (el bundle llama directo al backend), y el `server{}` va en `conf.d/default.conf`, no en `nginx.conf`.
- **Casos vistos:** admin (crash-loop), workspace (mismo patrón).
- **Fuente:** `reports/2026-04-03-deploy-frontend-admin-dokploy.md`, `reports/2026-04-03-deploy-frontend-workspace-dokploy.md`
- **Tags:** nginx, spa, crash-loop, conf.d, proxy-pass, dns-resolve, deploy

### LL-075 — El fix no se aplica: capa Docker `CACHED` o commit sin pushear
- **Síntoma:** Tras corregir un archivo, el deploy sigue fallando igual; el log muestra el stage como `CACHED`; o `Error: Compose file not found`.
- **Causa raíz:** Docker BuildKit cachea capas por hash de contenido. Si el commit con el cambio **no se pusheó** al repo (Dokploy hace pull del remoto), el build usa la versión vieja → la capa sale `CACHED` o ni siquiera está el archivo nuevo. `git status` "ahead by N commits" = push pendiente.
- **Solución:** `git push origin main` antes de disparar el deploy. En el log: `CACHED` = el archivo no cambió en el repo; `DONE 0.0s` = se ejecutó (archivo nuevo).
- **Prevención:** Antes de redeploy en Dokploy, confirmar que el commit está **pusheado** al remoto. Si un fix "no surte efecto", revisar primero si llegó al repo, no el código.
- **Casos vistos:** admin (nginx fix CACHED), backend ("Compose file not found").
- **Fuente:** `reports/2026-04-03-deploy-frontend-admin-dokploy.md`, `reports/2026-04-01-deploy-backend-dokploy.md`
- **Tags:** docker, buildkit, cache, git-push, deploy, cached-layer

### LL-076 — Next.js build se cuelga en type-check/lint (45+ min en VPS)
- **Síntoma:** El build de Next.js queda bloqueado en "Linting and checking validity of types" 45+ minutos sin completar en el VPS.
- **Causa raíz:** `next build` corre TypeScript type-checking + ESLint completos; en un VPS con pocos recursos puede no terminar.
- **Solución:** En `next.config.ts`: `typescript.ignoreBuildErrors: true` + `eslint.ignoreDuringBuilds: true` → build de ~82s. (La validación de tipos se hace en CI/local, no en el build de prod.) Se puede matar el build colgado desde Dokploy → Deployments → Kill Build.
- **Prevención:** Para Next.js en VPS modesto, desactivar type-check/lint en el build de producción y validar tipos en otra etapa.
- **Fuente:** `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md`
- **Tags:** nextjs, build, type-check, eslint, ignoreBuildErrors, vps, deploy

### LL-077 — `NEXT_PUBLIC_API_URL` con `/api/v1` duplica el prefijo → 404
- **Síntoma:** Las llamadas van a `.../api/v1/api/v1/auth/...` → 404 (p.ej. SSO validate).
- **Causa raíz:** La var se configuró como `https://host/api/v1`, pero el código ya añade el prefijo: `BASE_URL = \`${NEXT_PUBLIC_API_URL ?? ''}/api/v1\``.
- **Solución:** Configurar `NEXT_PUBLIC_API_URL=https://host` **sin** `/api/v1`; el código lo agrega.
- **Prevención:** Antes de poner una base URL en env, revisar si el cliente HTTP ya concatena el path de versión. Documentar en la tabla de env vars qué incluye y qué no.
- **Fuente:** `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md`
- **Tags:** env-vars, api-url, double-prefix, 404, nextjs, deploy

### LL-078 — `Service.url_template` apuntando a URL de dev → SSO 502
- **Síntoma:** Abrir un servicio (Vista/Workspace) desde el Hub por SSO da `502 Bad Gateway`.
- **Causa raíz:** El registro `Service` en la BD tenía `url_template` con una URL de desarrollo (`http://workspace.local.test/...`, `http://next-vista.local.test/sso`).
- **Solución:** Actualizar por Django shell el `url_template` al dominio de producción (incluyendo el path SSO correcto: `/sso/callback`, `/es/sso`). Activar también `TenantService.status='active'` para el tenant.
- **Prevención:** Tras desplegar un servicio nuevo, revisar/actualizar `Service.url_template` en la BD de prod — los seeds suelen traer URLs de dev. Candidato a parametrizar por entorno en vez de hardcodear en el seed.
- **Casos vistos:** Vista (502), Workspace (502).
- **Fuente:** `reports/2026-04-03-deploy-frontend-next-vista-dokploy.md`, `reports/2026-04-03-deploy-frontend-workspace-dokploy.md`
- **Tags:** sso, 502, service-url-template, seed-data, dev-url, deploy

### LL-079 — Errores de TypeScript bloquean el build de producción
- **Síntoma:** El build (Vite/tsc) falla con errores de tipo: `Property 'is_staff' does not exist on type 'User'`, `Property 'slug' does not exist on type 'Tenant'`, mismatches de `zodResolver`, campos de payload incorrectos, casts de mocks en tests.
- **Causa raíz:** Mocks de test desactualizados o desajustes tipo↔código que el dev server tolera pero `tsc`/build no. Casos concretos:
  - `is_staff` faltaba en mocks de `User`.
  - **`tenant.slug` vs `tenant.subdomain`**: en Admin/Workspace el tipo `Tenant` usa `subdomain` (no `slug`) → el header `X-Tenant-Slug` se llena con `tenant.subdomain`. (Ojo: el Desktop sí usa `tenant.slug` porque su `DesktopTenant` tiene ese campo — ver LL-030/LL-053. La fuente del slug difiere por app.)
  - `z.boolean().default(false)` produce input `boolean|undefined` incompatible con `zodResolver`: quitar `.default()` del schema y poner el default en `useForm.defaultValues`.
  - Payloads con nombres de campo equivocados (`start_datetime` vs `start_date`; prioridades `'alta'/'baja'` vs `'high'/'low'`).
  - Cast de mocks: usar `as unknown as ReturnType<typeof useX>` cuando el mock no solapa con `UseQueryResult`.
- **Solución:** Corregir cada mismatch (ver casos). No deshabilitar el type-check del build salvo el caso de Next en VPS (LL-076).
- **Prevención:** Correr `npm run typecheck` y el build localmente **antes** de pushear a deploy; mantener mocks sincronizados con los tipos; recordar la inconsistencia `slug`/`subdomain` entre apps.
- **Casos vistos:** admin (5 archivos de test + api.ts), workspace (6 archivos).
- **Fuente:** `reports/2026-04-03-deploy-frontend-admin-dokploy.md`, `reports/2026-04-03-deploy-frontend-workspace-dokploy.md`
- **Tags:** typescript, build, zod, zodResolver, mocks, slug-subdomain, deploy

### LL-080 — Error CORS en el navegador que en realidad es un 502 por OOM de gunicorn
- **Síntoma:** En producción el login (u otra request a `api-rbac.<dominio>`) falla **intermitentemente** con `Access to XMLHttpRequest ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present` + `net::ERR_FAILED`. Tienta a revisar/ampliar `CORS_ALLOWED_ORIGINS`, pero el origen ya está permitido.
- **Causa raíz:** El backend devuelve un **`502 Bad Gateway`** generado por **Traefik** (no por Django), y la respuesta de error del proxy **no incluye headers CORS** → el navegador lo reporta como fallo de CORS (falso positivo). El 502 ocurre porque los workers de **gunicorn mueren por OOM**: en el log del contenedor aparece `[ERROR] Worker (pid:XXXX) was sent SIGKILL! Perhaps out of memory?` de forma recurrente. El cap de memoria del contenedor (`deploy.resources.limits.memory`) era demasiado bajo (400M) para 2 workers de Django (~175M c/u en reposo → 87%); un `POST /login` (bcrypt + queries) cruzaba el límite → SIGKILL. Agravado por **VPS sin swap** (`free -m` → `Swap: 0`) → el OOM killer actúa al instante sin colchón.
- **Solución:**
  1. Confirmar que NO es CORS: `OPTIONS` preflight responde `200` con `access-control-allow-origin`, y un `POST`/health responde 2xx-4xx **con** header CORS. Si el preflight pasa pero la request real falla → 502/OOM, no CORS.
  2. Revisar el log del backend en Dokploy → buscar `SIGKILL ... Perhaps out of memory?`.
  3. **Añadir swap** al VPS (2 GB swapfile + `vm.swappiness=10`) — fix de mayor impacto y menor riesgo.
  4. Subir el cap de memoria del contenedor con moderación según `free -m` (django 400M→512M; celery-worker 300M→384M) y añadir `--max-requests 500 --max-requests-jitter 50` a gunicorn para reciclar workers y cortar fugas.
- **Prevención:** Ante "No 'Access-Control-Allow-Origin' header" + `ERR_FAILED`, **verificar primero que el backend responde** antes de tocar la config CORS — un 502 del proxy se disfraza de error CORS. Todo VPS de producción debe tener swap. Vigilar `docker stats`: si un contenedor vive >85% de su `limits.memory`, está a un pico de morir por OOM. **Bajar el límite de otro contenedor (p.ej. n8n) NO libera RAM para el backend** — los limits de Docker son techos independientes, no un pool compartido; la RAM solo se libera cuando un contenedor *usa* menos.
- **Casos vistos:** login del Hub `digisider.com` cayendo intermitente (jun 2026).
- **Fuente:** `reports/2026-06-27-login-cors-502-oom-gunicorn.md`
- **Tags:** cors, 502, oom, gunicorn, sigkill, traefik, swap, docker-memory-limit, false-positive, deploy

---

## I. Tauri / Desktop en producción

### LL-090 — CSP de Tauri bloquea la red (API prod + IPC)
- **Síntoma:** En la app empaquetada, los `fetch` a la API de producción fallan y/o el IPC interno de Tauri no funciona.
- **Causa raíz:** `tauri.conf.json` tenía un `connect-src` restrictivo que solo permitía la URL de dev (`http://rbac.local.test`).
- **Solución:** Añadir al `connect-src` la API de prod y los orígenes internos de Tauri:
  ```json
  "security": { "csp": "default-src 'self' 'unsafe-inline'; connect-src http://rbac.local.test https://api-rbac.<dominio> http://ipc.localhost http://tauri.localhost" }
  ```
- **Prevención:** `http://ipc.localhost` debe estar **siempre** en `connect-src` (canal IPC de Tauri v2/WebView2). Al cambiar de dominio de API, actualizar el CSP. Complementa LL-031 (CORS en el backend) — son dos capas distintas (CSP en el cliente, CORS en el servidor).
- **Fuente:** `reports/2026-04-04-deploy-desktop-produccion.md`
- **Tags:** tauri, csp, connect-src, ipc-localhost, webview2, desktop, deploy

### LL-091 — Env build-time en Tauri: VITE_ para JS, build.rs+dotenvy para Rust
- **Síntoma:** En la app empaquetada, una URL queda con el valor de dev: la API (lado JS) o el Hub para el login (lado **Rust**, hardcodeado en `lib.rs`).
- **Causa raíz:** (1) Faltaba `.env.production` (solo existía `.env` de dev) → `tauri build` (release) no tenía config de prod. (2) Las vars `VITE_*` NO son accesibles desde Rust; la URL del Hub estaba hardcodeada en `lib.rs`.
- **Solución:** (1) Crear `.env.production` con `VITE_API_URL`/`VITE_HUB_URL` de prod — Vite lo toma automáticamente en `tauri build` (release). (2) Para Rust: leer la var en `build.rs` con `dotenvy` e inyectarla con `cargo:rustc-env=HUB_URL=...`, y en `lib.rs` usar `env!("HUB_URL")`. Añadir `dotenvy` a `[build-dependencies]`.
- **Prevención:** Toda URL/secreto del Desktop que use Rust debe pasar por `build.rs` (no `VITE_*`). Perfil release → `.env.production`; perfil debug → `.env`. No hardcodear URLs en `lib.rs`.
- **Fuente:** `reports/2026-04-04-deploy-desktop-produccion.md`
- **Tags:** tauri, build.rs, dotenvy, cargo-rustc-env, vite, env-production, rust, desktop, deploy

### LL-095 — El AppBar del Desktop pierde el work-area reservado tras suspender/reanudar la laptop
- **Síntoma:** Al reabrir la laptop tras suspenderla, el sidebar (Tauri AppBar) queda mal: la ventana solo asoma una tira por el borde derecho (el resto fuera de pantalla) y otras ventanas de Windows se solapan encima ignorando el hueco reservado. Solo se arregla reiniciando la app.
- **Causa raíz:** El AppBar se registra una sola vez al montar (`App.tsx` → `register_appbar`) y el subclass proc (`appbar/subclass.rs`) **solo** re-asienta la posición ante `ABN_POSCHANGED`. Suspender/reanudar NO genera esa notificación; sí emite `WM_DISPLAYCHANGE`, `WM_SETTINGCHANGE` (SPI_SETWORKAREA), `WM_DPICHANGED` y `WM_POWERBROADCAST`, ninguno manejado. Además, mientras la laptop está suspendida el message pump no corre y el shell puede des-registrar el AppBar, con lo que un mero `ABM_SETPOS` ya no reclama el work-area. `GetSystemMetrics(SM_CXSCREEN)` (píxeles del DPI primario) agrava el desajuste al cambiar resolución/escala.
- **Solución (3 capas, cada una destapó la siguiente):** (1) **Reserva del work-area:** en `subclass.rs` interceptar `WM_DISPLAYCHANGE | WM_SETTINGCHANGE | WM_DPICHANGED | WM_POWERBROADCAST` → `reassert_appbar(hwnd, width)` idempotente/auto-sanadora: `ABM_NEW` (no-op si sigue registrado, re-registra si el shell lo soltó) → `QUERYPOS` → `SETPOS` → `MoveWindow`, con rect de `monitor_rect(hwnd)` (`MonitorFromWindow`+`GetMonitorInfoW`, DPI/multi-monitor safe) en vez de `SM_CXSCREEN`. Arregla que **otras ventanas respeten** el hueco. (2) **Ventana corta:** al abrir el panel la ventana solo crecía una tira porque `MoveWindow` usaba el rect que `ABM_SETPOS` **escribe de vuelta** (el shell lo devuelve encogido tras resume). Fix en `commit_position`: geometría **determinista** (`right - width` sobre el borde aprobado por `QUERYPOS`, `width` forzado), sin leer el rect post-`SETPOS`. (3) **WebView2 blanco/congelado:** tras resume pierde su superficie de render. Un intento nativo de `hide/show + nudge + RedrawWindow` recuperó el render pero **corría carrera con el resize y dejaba la ventana corta otra vez** → descartado. Solución final: **detección de wake en React** (`useWakeReload.ts` — un `setInterval` de 2s; si el salto entre ticks > 5s, la máquina durmió) → recargar. El reload re-renderiza el DOM (arregla el blanco) y al montar re-ejecuta `register_appbar` (AppBar limpio, ancho/posición correctos). El auth sobrevive porque `authStore` rehidrata de `localStorage`. **Gotcha:** un `location.reload()` **inmediato** falla — al reanudar la red aún está resucitando y todos los módulos dan `ERR_NETWORK_CHANGED`/`ERR_NETWORK_IO_SUSPENDED` (muy visible en `tauri dev`, que sirve el frontend por Vite en `localhost:1420`; en prod el asset va embebido en `tauri://localhost` y no depende de red). Fix en dos capas: (a) antes de recargar, exigir **3 probes `fetch(HEAD)` consecutivos OK** al propio origen (`reloadWhenReady`) — un solo éxito no basta, la red "parpadea" varias veces tras resume (se observó probe OK e inmediatamente `ERR_NETWORK_CHANGED` en los módulos); (b) **script inline de auto-sanado en `index.html`** (sin dependencia de red): si `#root` sigue vacío tras ~2.5s (la app no montó porque el reload cayó en un parpadeo), `location.reload()` con backoff y contador en `sessionStorage` (máx 10) — imprescindible porque una vez que la página queda rota, ningún código de la app corre para reintentar. **(4) Ventana corta persistente tras resume (aun con reload):** el resize se hacía con `MoveWindow` crudo, **a espaldas de tao**; como la ventana es `resizable: false`, tao guarda internamente su tamaño y tras los eventos de DPI/display del resume **re-asienta el tamaño que él cree** (60px), pisando el `MoveWindow`. Fix: separar `reserve_band(hwnd, width) -> RECT` (solo `QUERYPOS`/`SETPOS`, devuelve el rect determinista) y aplicar el rect en los comandos Tauri con **`window.set_size(PhysicalSize)` + `set_position(PhysicalPosition)`** (mantiene el estado interno de tao en sync). `MoveWindow` crudo queda solo para el subclass proc nativo (sin `WebviewWindow` disponible), y el wake-reload re-sincroniza después vía el comando. **(5) LA CAUSA DEL ANCHO CORTO PERSISTENTE — bucle de retroalimentación `SETPOS`↔`WM_SETTINGCHANGE`:** nuestro propio `ABM_SETPOS` cambia el work-area → Windows difunde `WM_SETTINGCHANGE` a todas las ventanas **incluida la nuestra** → el subclass respondía con otro `reassert`/`SETPOS` → bucle infinito que **satura el hilo de UI** (visible como cascada interminable de `reserve width=60` en el log). Consecuencia: los comandos IPC (`resize_appbar` del click) **nunca llegaban a ejecutarse** — por eso el panel quedaba en tira aunque toda la lógica de resize fuera correcta. Fix: **rate-limit** en el subclass (`should_reassert()`, máx 1 reassert/segundo para los 4 mensajes broadcast) — el primer mensaje tras el resume re-aserta y el eco de nuestro propio SETPOS se ignora, matando el bucle. Diagnóstico clave que lo destapó: `eprintln!` en `reserve_band`/`apply_window_rect` mirando la terminal de `tauri dev` — el click no producía ningún log de `reserve` → el comando no corría → el problema no era el resize sino el hilo saturado. **(6) Interbloqueo con explorer:** `WM_SETTINGCHANGE` se entrega como broadcast **síncrono** (explorer espera nuestro handler) y el handler llamaba a `SHAppBarMessage` (mensaje síncrono de vuelta a explorer) → cuelgues intermitentes de segundos. Fix: el handler solo hace `PostMessageW(hwnd, WM_USER+2)` y el reassert corre al drenarse la cola, fuera del broadcast. **(7) LA INTERMITENCIA REAL — IPC del WebView2 muerto tras resume:** con algunas suspensiones el canal IPC muere en silencio: JS vivo y renderizando pero ningún `invoke()` llega a Rust (ni el `register_appbar` del reload) → **ninguna recuperación desde JS es posible**. Fix definitivo: **recrear la ventana WebView desde el lado nativo** — `WM_POWERBROADCAST` con `PBT_APMRESUMESUSPEND`(0x7)/`PBT_APMRESUMEAUTOMATIC`(0x12) (valores hardcodeados, sin la feature `Win32_System_Power`) → `recreate_window_on_resume()` en `lib.rs`: debounce 15s, espera 1.2s, `win.destroy()`, **poll hasta que el label `main` se libere** (destroy es asíncrono — reconstruir de inmediato falla con "a webview with label `main` already exists"), `WebviewWindowBuilder::from_config()`. Flag `REBUILDING` + `RunEvent::ExitRequested` → `api.prevent_exit()` (sin esto Tauri cierra el proceso al quedarse sin ventanas y la app "se cierra sola"). WebView2 nuevo = IPC nuevo; React monta fresco y re-registra el AppBar. El panel arranca cerrado tras el resume (ventana nueva) — aceptado.
- **Prevención:** Un AppBar Win32 debe re-registrarse/reposicionarse ante cambios de display/DPI/energía, no solo ante `ABN_POSCHANGED`. Nunca dimensionar la ventana con el rect de vuelta de `ABM_SETPOS` (puede encogerlo el shell tras resume): calcular la geometría uno mismo (borde del monitor + ancho pedido). Jamás llamar `SHAppBarMessage` (ni nada síncrono hacia explorer) **dentro** del handler de un broadcast — diferir con `PostMessage`; y rate-limitar cualquier respuesta a `WM_SETTINGCHANGE`, porque el propio `SETPOS` lo re-difunde (bucle → hilo de UI saturado → los `invoke` IPC no corren). Ante síntomas post-resume "raros" en Tauri/WebView2 (clicks sin efecto, comandos que no loguean), sospechar **IPC muerto** antes que lógica propia: la única recuperación es nativa (recrear la ventana o reiniciar el proceso), nunca desde JS. Al recrear ventanas Tauri: `destroy()` es asíncrono (poll del label antes de rebuild) y destruir la única ventana dispara `ExitRequested` (usar `prevent_exit` durante el hueco). Complementa el skill `tauri-native-integration/references/appbar-windows.md`.
- **Fuente:** `reports/2026-07-13-appbar-suspend-resume-desktop.md` (verificado por el usuario con ciclos reales de suspensión/reanudación)
- **Tags:** tauri, appbar, win32, suspend-resume, wm-displaychange, wm-settingchange, wm-dpichanged, wm-powerbroadcast, monitorfromwindow, dpi, desktop, feedback-loop, ui-thread, webview2-blank, wake-reload

### LL-097 — StrictMode double-mount + invokes fire-and-forget: el `unregister_appbar` del cleanup podía llegar último y dejar el AppBar desregistrado (solo dev)
- **Síntoma:** En `tauri dev`, **arranque en frío** (sin suspensión de por medio): el sidebar no reserva el work-area (otras ventanas de Windows se solapan encima) y al hacer click en un icono este se marca activo pero la ventana se queda en 60px — el panel solo asoma una tira. A simple vista idéntico a los síntomas post-resume de [[LL-095]], lo que despista hacia el AppBar nativo cuando la causa está en React.
- **Causa raíz:** `React.StrictMode` (solo dev) monta → desmonta → remonta la app, así que el efecto de `App.tsx` disparaba **tres** invokes fire-and-forget: `register_appbar` #1 → `unregister_appbar` (cleanup) → `register_appbar` #2. Los comandos síncronos de Tauri corren en un thread pool **sin garantía de orden entre invokes**; si el `unregister` se procesa último, el estado queda `registered=false` → no hay banda reservada y `resize_appbar` se vuelve **no-op silencioso** (su guard `if guard.registered` no devuelve error — el click "funciona" en JS y no pasa nada en nativo). Carrera intermitente: depende del scheduling, puede no aparecer en decenas de arranques.
- **Solución:** Quitar el `invoke("unregister_appbar")` del cleanup del efecto en `App.tsx`. El teardown real ya lo hace el lado nativo: handler `WindowEvent::Destroyed` en `lib.rs` des-registra el AppBar al cerrar/destruir la ventana. La secuencia de dev queda register → register, inocua porque `register_appbar` hace registro fresco idempotente (`ABM_REMOVE`→`ABM_NEW`).
- **Prevención:** En Tauri + StrictMode, **no emparejar setup/teardown de recursos nativos como invoke en efecto + invoke en cleanup**: el doble montaje de dev los intercala sin orden garantizado. Preferir teardown nativo (window events) o comandos idempotentes que toleren cualquier orden. Además el cleanup de React **tampoco corre en `location.reload()`** (el wake-reload de LL-095), así que ese unregister desde JS no aportaba nada en ningún flujo real. Ante síntomas "iguales a LL-095" pero en arranque frío y solo en dev, sospechar esta carrera primero.
- **Fuente:** `reports/2026-07-13-scroll-iconos-sidebar-desktop.md`
- **Tags:** tauri, strictmode, react, ipc, race-condition, invoke, appbar, dev-only, desktop, fire-and-forget
