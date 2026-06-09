# Reporte: Problemas y Soluciones — `frontend_next_hub`

**Fecha**: 2026-06-08  
**App**: `apps/frontend_next_hub/` (Next.js 15 App Router)  
**Contexto**: Migración de `frontend_hub_client` (React + Vite, puerto 5175) a Next.js 15 App Router (puerto 4000). Incluye dockerización, configuración del proxy y pruebas de registro y SSO.

---

## 1. Tests fallando — MSW trailing slash mismatch (Fase 7)

**Síntoma**: 11 de 65 tests fallaban con `ECONNREFUSED 127.0.0.1:8000`.

**Causa raíz**: Los handlers de MSW en `test/handlers/auth.handlers.ts` registraban URLs con trailing slash (`/auth/login/`, `/auth/register/`) pero `AuthContext.tsx` llama a axios sin trailing slash (`/auth/login`, `/auth/register`). MSW v2 hace matching estricto de URL; al no coincidir, la petición llegaba a la red real (que no existe en tests) y fallaba con ECONNREFUSED.

Segundo problema: el handler usaba `/auth/token/refresh/` pero `axios.ts` llama a `/auth/refresh-token`.

**Solución**:
- `test/handlers/auth.handlers.ts`: registrar ambas variantes (con y sin slash) para cada endpoint de auth.
- Corrección del path: agregar handler para `/auth/refresh-token` además de `/auth/token/refresh/`.
- Tests individuales con `server.use()` override: cambiar todos de `/auth/login/` → `/auth/login` (4 archivos).

**Archivos modificados**:
- `test/handlers/auth.handlers.ts`
- `features/auth/hooks/__tests__/useLogin.test.ts`
- `features/auth/hooks/__tests__/useRegister.test.ts`
- `features/auth/__tests__/AuthContext.test.tsx`
- `features/auth/__tests__/LoginPageClient.test.tsx`

**Resultado**: 65/65 tests ✓, cobertura 79.7%/67%/92.6%/81.9%.

---

## 2. Archivos Docker — `docker compose` no disponible

**Síntoma**: Al ejecutar `docker compose up`, error: `docker: 'compose' is not a docker command`.

**Causa raíz**: El sistema tiene docker-compose v1.29.2 instalado como binario separado (`/usr/bin/docker-compose`), no el plugin Docker Compose v2 (`docker compose` subcomando).

**Solución**: Usar siempre `docker-compose` (con guión) en lugar de `docker compose`.

---

## 3. `docker restart` no re-lee `env_file`

**Síntoma**: Después de cambiar `.env.local`, `docker restart rbac_next_hub_dev` mantenía las variables de entorno antiguas.

**Causa raíz**: `docker restart` solo detiene y vuelve a arrancar el contenedor con la configuración original de cuando fue creado. Las variables de `env_file` se inyectan solo al crear el contenedor, no al reiniciarlo.

**Solución**: Para aplicar cambios en `.env.local` siempre usar:
```bash
docker-compose down && docker-compose up -d
```

---

## 4. `NEXT_PUBLIC_*` variables cacheadas en el bundle compilado

**Síntoma**: Aunque `.env.local` tenía `NEXT_PUBLIC_API_URL=` (vacío), el bundle en el browser seguía llamando a `http://django.local.test` (valor anterior).

**Causa raíz**: Las variables `NEXT_PUBLIC_*` se inlinan en el bundle de JavaScript en tiempo de compilación. El browser cacheaba los chunks de Next.js con headers `Cache-Control: immutable` (1 año), sirviendo el bundle antiguo con la URL hardcodeada.

**Solución**:
1. Recrear el contenedor (no solo restart) para que Next.js recompile con las variables nuevas.
2. Limpiar manualmente el caché del browser en `chrome://settings/clearBrowserData` (95.4 MB de caché).
3. Hacer un cambio trivial en `lib/axios.ts` para forzar que Next.js HMR recompile ese módulo.

**Lección**: Cambiar cualquier `NEXT_PUBLIC_*` requiere recrear el contenedor y limpiar caché del browser en desarrollo.

---

## 5. Nginx Proxy Manager elimina trailing slashes (308 redirect)

**Síntoma**: `GET /api/v1/public/plans/` devolvía 308 y luego `GET /api/v1/public/plans` devolvía 400.

**Causa raíz**: Nginx Proxy Manager (openresty) aplica `merge_slashes` y remueve trailing slashes antes de que la petición llegue a Next.js. Ejemplo:
```
Browser → GET /api/v1/public/plans/
NPM     → 308 Location: /api/v1/public/plans    (elimina slash)
Browser → GET /api/v1/public/plans
Django  → 400 (necesita slash para hacer APPEND_SLASH redirect, pero el Host era inválido)
```

**Solución**: Configurar `skipTrailingSlashRedirect: true` en `next.config.ts` para que Next.js no genere sus propios redirects de slash, y añadir la trailing slash en el destino del rewrite:
```ts
destination: `${API_TARGET}/api/:path*/`  // añade slash al proxiar
```

---

## 6. `Host: rbac_django:8000` rechazado por Django (RFC 1034/1035)

**Síntoma**: Django devolvía 400 con `DisallowedHost: Invalid HTTP_HOST header: 'rbac_django:8000'. The domain name provided is not valid according to RFC 1034/1035.`

**Causa raíz**: Cuando Next.js hace el rewrite server-side hacia `http://rbac_django:8000`, envía el header `Host: rbac_django:8000`. Django valida el host contra RFC 1034/1035 — los guiones bajos (`_`) son caracteres inválidos en nombres de dominio. Esta validación ocurre **antes** de comprobar `ALLOWED_HOSTS`, por lo que no sirve de nada añadir `rbac_django` a la lista.

**Solución**:
1. Añadir un network alias sin guiones bajos al contenedor Django en la red `global`:
   ```bash
   docker network disconnect global rbac_django
   docker network connect --alias rbac-django global rbac_django
   ```
2. Actualizar el `docker-compose.yml` del backend para que el alias sea permanente:
   ```yaml
   networks:
     default:
     global:
       aliases:
         - rbac-django
   ```
3. Cambiar `API_TARGET=http://rbac-django:8000` en `.env.local` del Hub.
4. Añadir `rbac-django` a `ALLOWED_HOSTS` en `apps/backend_django/.env`.

**Nota**: `docker network connect --alias` es la solución temporal mientras docker-compose v1 tenga el bug de `ContainerConfig` que impide recrear contenedores normalmente.

---

## 7. Bug `ContainerConfig` en docker-compose v1 al recrear contenedores

**Síntoma**: Al ejecutar `docker-compose up -d django` (para aplicar el nuevo alias de red), error:
```
KeyError: 'ContainerConfig'
```

**Causa raíz**: docker-compose v1.29.2 intenta leer la clave `ContainerConfig` del metadata de imagen de Docker. Las versiones nuevas de Docker Engine eliminaron esa clave, causando incompatibilidad con docker-compose v1 al hacer recreación de contenedores.

**Solución de emergencia**: Manipular el contenedor directamente con `docker` CLI:
```bash
docker network disconnect global rbac_django
docker network connect --alias rbac-django global rbac_django
```

Para el Hub (que no tiene este bug porque su imagen sí es compatible):
```bash
docker stop rbac_next_hub_dev && docker rm rbac_next_hub_dev
docker-compose up -d   # desde apps/frontend_next_hub/
```

**Solución permanente**: Actualizar a Docker Compose v2 (`docker compose` plugin).

---

## 8. DB container huérfano con hash prefix

**Síntoma**: Después del intento fallido de recrear contenedores con docker-compose, el contenedor de PostgreSQL quedó como `dee0916ccef4_rbac_db` (con hash prefix) y en estado `Exited`.

**Causa raíz**: docker-compose v1 intentó recrear el contenedor `rbac_db`, falló por el bug de `ContainerConfig`, y dejó el contenedor anterior en estado Exited con un nombre de hash.

**Solución**: Reiniciar manualmente el contenedor huérfano:
```bash
docker start dee0916ccef4_rbac_db
```

Django puede resolverlo con el hostname `db` siempre que esté en la red interna `backend_django_default`.

---

## 9. Regla de rewrite única rompe SSO (trailing slash mixta en Django)

**Síntoma**: `POST /api/v1/auth/sso/token/` devolvía 500 desde Django con:
```
RuntimeError: You called this URL via POST, but the URL doesn't end in a slash
and you have APPEND_SLASH set.
```

**Causa raíz**: Los URL patterns de Django auth son inconsistentes respecto a trailing slash:
- Base auth (`login`, `register`, `logout`, `refresh-token`, etc.) → **sin** trailing slash
- SSO sub-paths (`sso/token/`, `sso/validate/`) → **con** trailing slash
- Google OAuth (`google/`, `google/callback/`) → **con** trailing slash

La regla inicial del rewrite trataba todos los paths de auth igual (sin slash), rompiendo SSO.

**Evolución de la solución**:

*Intento 1 (roto)*: Una sola regla con slash para todo:
```ts
{ source: '/api/:path*', destination: `${API_TARGET}/api/:path*/` }
// Rompe: POST /auth/register → /auth/register/ → 404
```

*Intento 2 (parcialmente roto)*: Regla auth sin slash + resto con slash:
```ts
{ source: '/api/v1/auth/:path*', destination: `${API_TARGET}/api/v1/auth/:path*` }
{ source: '/api/:path*', destination: `${API_TARGET}/api/:path*/` }
// Rompe: POST /auth/sso/token → /auth/sso/token (sin slash) → 500
```

*Solución final (4 reglas ordenadas de más específica a más general)*:
```ts
// 1. SSO: con slash
{ source: '/api/v1/auth/sso/:path*',    destination: `${API_TARGET}/api/v1/auth/sso/:path*/` }
// 2. Google OAuth: con slash
{ source: '/api/v1/auth/google/:path*', destination: `${API_TARGET}/api/v1/auth/google/:path*/` }
// 3. Auth base: sin slash
{ source: '/api/v1/auth/:path*',        destination: `${API_TARGET}/api/v1/auth/:path*` }
// 4. Todo lo demás: con slash
{ source: '/api/:path*',                destination: `${API_TARGET}/api/:path*/` }
```

---

## 10. Email de verificación apuntaba a la app anterior

**Síntoma**: El email "Verify your email" contenía el link `http://localhost:5173/verify-email?token=...` — la URL del `frontend_hub_client` (React + Vite). El browser daba `ERR_CONNECTION_REFUSED`.

**Causa raíz**: `FRONTEND_URL=http://localhost:5173` en `apps/backend_django/.env` seguía apuntando al frontend anterior. Django usa esta variable para construir los links en los emails de verificación.

**Solución**:
1. Actualizar `FRONTEND_URL=http://hub.local.test` en `apps/backend_django/.env`.
2. Reiniciar Django: `docker restart rbac_django`.
3. Activar la cuenta de test manualmente vía Django shell (ya que el token enviado era con la URL vieja):
   ```bash
   docker exec rbac_django python manage.py shell -c "
   from django.contrib.auth import get_user_model
   User = get_user_model()
   user = User.objects.filter(email='test.nexthub2@empresa.com').first()
   user.email_verified = True
   user.save()
   "
   ```

---

## Resumen de cambios permanentes

| Archivo | Cambio |
|---------|--------|
| `apps/frontend_next_hub/.env.local` | `NEXT_PUBLIC_API_URL=` (vacío), `API_TARGET=http://rbac-django:8000` |
| `apps/frontend_next_hub/next.config.ts` | `skipTrailingSlashRedirect: true` + 4 reglas de rewrite |
| `apps/frontend_next_hub/lib/axios.ts` | `API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''` |
| `apps/backend_django/.env` | `ALLOWED_HOSTS` añade `hub.local.test,rbac_next_hub_dev,rbac-django` |
| `apps/backend_django/.env` | `FRONTEND_URL=http://hub.local.test` |
| `apps/backend_django/docker-compose.yml` | Network alias `rbac-django` en servicio `django` → red `global` |
| `test/handlers/auth.handlers.ts` | Handlers con y sin slash + path correcto `/auth/refresh-token` |
| 4 archivos de test | `server.use()` overrides sin trailing slash |

---

## Arquitectura del proxy final

```
Browser
  │
  ▼ GET /api/v1/public/plans/
Nginx Proxy Manager (openresty)
  │  308 → strips trailing slash
  ▼ GET /api/v1/public/plans
Next.js dev server (rbac_next_hub_dev:4000)
  │  rewrite rule 4: /api/:path*  →  añade slash
  ▼ GET http://rbac-django:8000/api/v1/public/plans/
Django (rbac_django, alias rbac-django)
  │  Host: rbac-django (válido RFC 1034/1035, en ALLOWED_HOSTS)
  ▼ 200 OK

Browser
  │
  ▼ POST /api/v1/auth/register
Nginx Proxy Manager
  │  sin slash → pasa directo
  ▼ POST /api/v1/auth/register
Next.js dev server
  │  rewrite rule 3: /api/v1/auth/:path*  →  sin slash
  ▼ POST http://rbac-django:8000/api/v1/auth/register
Django
  │  path('register', RegisterView)  →  match exacto sin slash
  ▼ 201 Created

Browser
  │
  ▼ POST /api/v1/auth/sso/token/
Nginx Proxy Manager
  │  308 → strips slash
  ▼ POST /api/v1/auth/sso/token
Next.js dev server
  │  rewrite rule 1: /api/v1/auth/sso/:path*  →  añade slash
  ▼ POST http://rbac-django:8000/api/v1/auth/sso/token/
Django
  │  path('token/', SSOTokenView)  →  match con slash
  ▼ 200 { sso_token, redirect_url }
```

---

## Flujos verificados end-to-end

- [x] Registro de nuevo tenant (4 pasos: Cuenta → Empresa → Plan → ¡Listo!)
- [x] Verificación de email + activación de cuenta
- [x] Login con credenciales (JWT)
- [x] Dashboard Hub con datos reales desde backend
- [x] SSO Hub → Workspace (token SSO generado, validado, sesión activa en Workspace)
