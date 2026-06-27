# Login en producción falla con error CORS — causa real: OOM de gunicorn (502)

**Fecha:** 2026-06-27
**Apps afectadas:** `backend_django` (infra/deploy — `docker-compose.dokploy.yml`), VPS Dokploy
**Severidad:** Alta (login del Hub `digisider.com` caía de forma intermitente en producción)

## Síntoma

Al intentar hacer login en producción del Hub (`digisider.com`), la consola del navegador mostraba:

```
Access to XMLHttpRequest at 'https://api-rbac.digisider.com/api/v1/auth/login'
from origin 'https://digisider.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

Failed to load resource: .../api/v1/auth/login:1  net::ERR_FAILED
```

El usuario sospechó (razonablemente) que faltaba algún origen en `CORS_ALLOWED_ORIGINS` del backend en Dokploy.

## Diagnóstico — NO era CORS

`CORS_ALLOWED_ORIGINS` estaba **completo y correcto**. Verificado contra producción:

| Prueba (curl contra prod) | Resultado |
|---|---|
| Preflight `OPTIONS /auth/login` (con y sin slash) | `200` + `access-control-allow-origin: https://digisider.com` ✅ |
| `POST /auth/login` credenciales inválidas | `400` **con** header CORS presente ✅ |
| `GET /api/health/` | `200` ✅ |
| `POST /auth/login` (en un intento puntual) | **`502 Bad Gateway`** ❌ |

La clave: el `502` lo genera **Traefik** (el proxy), no Django. La respuesta de error de Traefik **no lleva headers CORS**, así que el navegador lo reporta engañosamente como un fallo de CORS (`No 'Access-Control-Allow-Origin'`). Es un **falso positivo de CORS**: el origen está permitido, pero el backend no respondió.

## Causa raíz — OOM mata los workers de gunicorn

El log del contenedor `backend_django` mostró la pistola humeante, recurrente cada ~5 min:

```
[ERROR] Worker (pid:9316) was sent SIGKILL! Perhaps out of memory?
[ERROR] Worker (pid:9579) was sent SIGKILL! Perhaps out of memory?
[ERROR] Worker (pid:9815) was sent SIGKILL! Perhaps out of memory?
```

El contenedor Django tenía un límite de memoria **demasiado bajo (400M)** para 2 workers de gunicorn. Cada worker carga el proyecto completo (DRF + ~25 apps + `channels`/`daphne`), quedando en reposo a ~350M/400M (**87%**). Al entrar un `POST /login` (bcrypt + queries) el pico cruzaba 400M → el kernel mataba el worker con `SIGKILL` → cualquier request atrapada en ese instante recibía `502` de Traefik → falso error CORS en el navegador.

Diagnóstico de RAM del VPS (`free -m`) reveló dos factores que lo agravaban:
- **Solo 526 MB realmente disponibles** (sistema al 87% de sus 3.9 GB).
- **`Swap: 0`** — sin swap, el OOM killer actúa de inmediato y sin colchón (de ahí los SIGKILL duros).

`docker stats` confirmó que **tres** contenedores del backend estaban asfixiados contra su tope:

| Contenedor | Uso / Límite | % |
|---|---|---|
| django | 349.9M / 400M | 87% 🔴 |
| celery-worker | 268.5M / 300M | 89% 🔴 |
| celery-beat | 146.1M / 192M | 76% 🟡 |

## Solución aplicada

### 1. Swap de 2 GB en el VPS (el fix de mayor impacto, menor riesgo)
Sin swap el kernel mata procesos al instante. Añadido swapfile persistente + `vm.swappiness=10` (swap solo como emergencia, para no degradar latencia):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 2. Subir los caps de memoria con moderación (`docker-compose.dokploy.yml`)
No se subió a 768M (no había RAM); se ajustó a lo que el host de 526M disponibles podía respaldar, con el swap de respaldo:

- `django`: límite **400M → 512M**, reservation 200M → 256M
- `django` gunicorn: añadido **`--max-requests 500 --max-requests-jitter 50`** (recicla workers, corta fugas lentas de memoria)
- `celery-worker`: límite **300M → 384M**, reservation 128M → 160M

> Decisión clave: **bajar el límite de otro contenedor (p.ej. n8n) NO libera RAM para el backend** — los `limits.memory` de Docker son techos independientes, no un pool compartido. La RAM real solo se libera cuando un contenedor *usa* menos. Por eso la palanca correcta fue swap + caps moderados, no recortar límites ajenos.

## Verificación en producción

Tras el redeploy del stack `backenddjango`:

| Contenedor | Antes | Después |
|---|---|---|
| django | 350M / 400M (87%) 🔴 | 298M / 512M (**58%**) ✅ |
| celery-worker | 268M / 300M (89%) 🔴 | 258M / 384M (**67%**) ✅ |

- `free -m` → `Swap: 2047` activo, casi sin usar.
- Login en `digisider.com` → **entra correctamente, sin el error de CORS/`ERR_FAILED`**.
- Sin nuevas apariciones de `Worker ... was sent SIGKILL! Perhaps out of memory?` en el log.

## Lección clave

Un `502 Bad Gateway` del proxy (Traefik/Nginx) se disfraza de **error CORS** en el navegador, porque la respuesta de error del proxy no incluye `Access-Control-Allow-Origin`. Ante un "No 'Access-Control-Allow-Origin' header" + `ERR_FAILED`: **verificar primero que el backend responde** (preflight `OPTIONS` 200 con header CORS + un `POST`/health 2xx-4xx con header CORS). Si el preflight pasa pero la request real falla, sospechar 502/OOM del backend, no la config de CORS. En VPS sin swap, `SIGKILL ... Perhaps out of memory?` en gunicorn = límite de memoria del contenedor demasiado bajo.

## Deuda técnica detectada (no bloqueaba el login)

- **Chat WS roto en producción:** `GET /ws/chat/` devuelve `301` cada ~60 s. Producción corre gunicorn **WSGI** (`config.wsgi`), pero los WebSockets del chat (`apps/chat`, Channels) necesitan un servidor **ASGI** (daphne/uvicorn sobre `config.asgi`). Hoy no hay servicio ASGI en `docker-compose.dokploy.yml`, así que el chat en tiempo real nunca conecta y el cliente del Workspace reintenta indefinidamente. Pendiente de abordar.
