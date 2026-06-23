# Base de Conocimiento — Incidencias y Soluciones

Destilado accionable de `reports/`. Buscar por síntoma o por `**Tags:**` con grep antes de depurar.
Formato y reglas en `../SKILL.md`. Índice de reportes digeridos en `sources.md`.

## Tabla de contenidos

- [A. Trailing slash, proxies y routing HTTP](#a-trailing-slash-proxies-y-routing-http) — LL-001 … LL-004
- [B. Variables de entorno y build (Next.js / Dokploy)](#b-variables-de-entorno-y-build-nextjs--dokploy) — LL-010 … LL-011
- [C. Docker / contenedores / recarga](#c-docker--contenedores--recarga) — LL-020 … LL-024
- [D. Multi-tenancy, CORS y headers](#d-multi-tenancy-cors-y-headers) — LL-030 … LL-032
- [E. Seguridad y lógica de negocio](#e-seguridad-y-lógica-de-negocio) — LL-040 … LL-042
- [F. Frontend React / Next.js (estado, SSR, tipos)](#f-frontend-react--nextjs-estado-ssr-tipos) — LL-050 … LL-054
- [G. Testing (MSW, fixtures, permisos)](#g-testing-msw-fixtures-permisos) — LL-060 … LL-061
- [H. Deploy: Dokploy / Traefik / Nginx / build](#h-deploy-dokploy--traefik--nginx--build) — LL-070 … LL-079
- [I. Tauri / Desktop en producción](#i-tauri--desktop-en-producción) — LL-090 … LL-091

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
