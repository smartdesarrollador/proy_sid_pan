# Deploy Backend Django en Dokploy — Reporte

**Fecha**: 2026-04-01  
**VPS**: 62.72.9.127 (Ubuntu)  
**Dokploy**: v0.28.8  
**Repo**: `smartdesarrollador/back_dj_sp`  
**URL final**: `https://api-rbac.smartdigitaltec.com`

---

## Resultado final

```json
GET /api/health/
{
  "status": "ok",
  "db": true,
  "redis": true,
  "celery": true
}
```

Todos los servicios corriendo: Django, PostgreSQL, Redis, Celery Worker, Celery Beat.

---

## Archivos creados/modificados

| Archivo | Cambio |
|---|---|
| `apps/backend_django/docker-compose.dokploy.yml` | NUEVO — compose para Dokploy |
| `apps/backend_django/Dockerfile` | `curl` en stage prod + `ARG SECRET_KEY` para collectstatic |
| `apps/backend_django/config/settings/prod.py` | `SECURE_PROXY_SSL_HEADER` + `USE_X_FORWARDED_HOST` |
| `apps/backend_django/requirements/prod.txt` | `python-json-logger==2.0.7` añadido |

---

## Paso a paso del proceso

### Paso 1 — Preparar archivos para Dokploy

**Contexto**: el `docker-compose.prod.yml` original usaba red `global` + Nginx. En Dokploy el proxy es Traefik y la red externa es `dokploy-network`.

**Acciones**:

1. Crear `docker-compose.dokploy.yml` con:
   - Red `dokploy-network` (externa)
   - Sin servicio nginx
   - Servicio `migrate` dedicado (corre migrations + collectstatic en runtime)
   - Volúmenes Docker nombrados (persisten entre redeploys)
   - Variable `${API_DOMAIN}` para el dominio en labels de Traefik

2. Modificar `Dockerfile` — stage `prod`:
   - Añadir `curl` a apt-get (necesario para el healthcheck)
   - Añadir `ARG SECRET_KEY=placeholder-...` antes de `collectstatic` — sin esto el build falla porque Django necesita SECRET_KEY al importar settings, y en Dokploy las env vars se inyectan en runtime, no en build-time

3. Modificar `config/settings/prod.py`:
   - Añadir `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`
   - Añadir `USE_X_FORWARDED_HOST = True`
   - Sin esto, `SECURE_SSL_REDIRECT = True` causa loop infinito porque Traefik termina SSL y reenvía HTTP interno a Django

---

### Paso 2 — Crear proyecto en Dokploy

En `http://62.72.9.127:3000` → **Create Project** → nombre: `rbac-platform`.

---

### Paso 3 — Conectar GitHub

Menú lateral → **Git** → **GitHub** → **Create GitHub App** → instalar en cuenta `smartdesarrollador` → seleccionar repo `back_dj_sp` → **Install & Authorize**.

Resultado: GitHub App `Dokploy-2026-04-01-epspdn` conectada.

---

### Paso 4 — Crear servicio Docker Compose

Dentro del proyecto → **Create Service** → **Compose** → nombre: `backend-django`.

En la pestaña **General**:
- GitHub Account: `Dokploy-2026-04-01-epspdn`
- Repository: `back_dj_sp`
- Branch: `main`
- Compose Path: `docker-compose.dokploy.yml`
- Trigger Type: `On Push`

---

### Paso 5 — Variables de entorno

En la pestaña **Environment**, pegar:

```env
SECRET_KEY=<generado con: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=api-rbac.smartdigitaltec.com
DJANGO_SETTINGS_MODULE=config.settings.prod
API_DOMAIN=api-rbac.smartdigitaltec.com

POSTGRES_DB=rbac_db
POSTGRES_USER=rbac_user
POSTGRES_PASSWORD=<password segura>
DATABASE_URL=postgresql://rbac_user:<password>@db:5432/rbac_db

REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

JWT_SECRET=<mismo valor que SECRET_KEY o diferente>
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

ENCRYPTION_KEY=<generado con: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">

CORS_ALLOWED_ORIGINS=https://api-rbac.smartdigitaltec.com

APP_BASE_URL=https://api-rbac.smartdigitaltec.com
FRONTEND_URL=http://...
FRONTEND_ADMIN_URL=http://...
FRONTEND_HUB_URL=http://...

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@plataforma.com

SENTRY_DSN=
```

---

### Paso 6 — Dominio y SSL

En Hostinger DNS: crear registro `A` → `api-rbac` → `62.72.9.127` (TTL: 14400).

En Dokploy → pestaña **Domains** → **Add Domain**:
- Service Name: `django`
- Host: `api-rbac.smartdigitaltec.com`
- Container Port: `8000`
- HTTPS: ON
- Certificate Provider: **Let's Encrypt**

---

### Paso 7 — Deploy inicial

Click **Deploy** → ver logs en pestaña **Deployments**.

---

## Errores encontrados y soluciones

### Error 1 — Compose file not found

**Síntoma**: `Error: Compose file not found` en el primer deploy.

**Causa**: el commit con `docker-compose.dokploy.yml` nunca se había pusheado a GitHub. El `git status` mostraba "ahead by 1 commit" pero el push pendiente.

**Solución**: `git push origin main`.

---

### Error 2 — ModuleNotFoundError: pythonjsonlogger

**Síntoma**:
```
ModuleNotFoundError: No module named 'pythonjsonlogger'
ValueError: Unable to configure formatter 'json'
process "/bin/sh -c SECRET_KEY=... python manage.py collectstatic" exit code: 1
```

**Causa**: `prod.py` usa `pythonjsonlogger.jsonlogger.JsonFormatter` para el logging, pero `python-json-logger` no estaba en `requirements/prod.txt`. El `collectstatic` en build-time importa Django settings (incluido prod.py) y falla.

**Solución**: añadir `python-json-logger==2.0.7` a `requirements/prod.txt`.

---

### Error 3 — 404 page not found (Traefik)

**Síntoma**: `https://api-rbac.smartdigitaltec.com/api/health/` devuelve `404 page not found` en texto plano (respuesta de Traefik, no de Django).

**Causa raíz** (identificada tras diagnóstico exhaustivo):

El contenedor Django solo tenía `traefik.enable=true` como label de Traefik. Sin reglas de router (`Host(...)`, entrypoints, service), Traefik ve el contenedor pero **no crea ningún router**.

Esto se confirmó con:
```bash
# Verificar routers registrados en Traefik
sudo docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers 2>&1 | grep -o '"name":"[^"]*"'
# Solo mostraba: acme-http@internal, api@internal, dashboard@internal, dokploy-router-app@file

# Verificar labels en el contenedor vía Docker API
sudo docker exec dokploy-traefik sh -c "curl -s --unix-socket /var/run/docker.sock \
  'http://localhost/containers/rbacplatform-backenddjango-pmlmat-django-1/json' | grep -c traefik"
# Resultado: 1 (solo traefik.enable=true)
```

**Causa secundaria** (en intentos anteriores): cuando se incluyeron labels de Traefik, el router `rbac-api` no tenía `traefik.http.routers.rbac-api.service=rbac-api` → Traefik no sabía a qué service enrutar.

**Proceso de diagnóstico**:
```bash
# 1. Ver contenedores running
sudo docker ps --filter "name=rbacplatform" --format "table {{.Names}}\t{{.Status}}"

# 2. Ver labels del contenedor
sudo docker inspect rbacplatform-backenddjango-pmlmat-django-1 \
  --format '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep traefik

# 3. Ver redes del contenedor
sudo docker inspect rbacplatform-backenddjango-pmlmat-django-1 \
  --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'

# 4. Verificar que ambos (Traefik + Django) están en dokploy-network
sudo docker network inspect dokploy-network --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}'

# 5. Ver routers registrados en Traefik
sudo docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers

# 6. Ver raw data completo de Traefik
sudo docker exec dokploy-traefik wget -qO- http://localhost:8080/api/rawdata

# 7. Verificar acceso al Docker socket desde Traefik
sudo docker exec dokploy-traefik sh -c "curl -s --unix-socket /var/run/docker.sock \
  http://localhost/containers/json | grep -o '\"Names\":\[\"[^\"]*\"\]'"

# 8. Contar ocurrencias de "traefik" en el JSON del contenedor
sudo docker exec dokploy-traefik sh -c "curl -s --unix-socket /var/run/docker.sock \
  'http://localhost/containers/rbacplatform-backenddjango-pmlmat-django-1/json' | grep -c traefik"
```

**Solución final** — labels completos en `docker-compose.dokploy.yml`:
```yaml
labels:
  - "traefik.enable=true"
  # HTTPS router
  - "traefik.http.routers.rbac-api.rule=Host(`api-rbac.smartdigitaltec.com`)"
  - "traefik.http.routers.rbac-api.entrypoints=websecure"
  - "traefik.http.routers.rbac-api.service=rbac-api"           # ← crítico
  # HTTP → HTTPS redirect
  - "traefik.http.routers.rbac-api-http.rule=Host(`api-rbac.smartdigitaltec.com`)"
  - "traefik.http.routers.rbac-api-http.entrypoints=web"
  - "traefik.http.routers.rbac-api-http.middlewares=redirect-to-https@file"
  - "traefik.http.routers.rbac-api-http.service=rbac-api"
  # Backend
  - "traefik.http.services.rbac-api.loadbalancer.server.port=8000"
```

---

### Error 4 — Healthcheck unhealthy

**Síntoma**: contenedor Django en estado `(unhealthy)`.

**Causa**: `SECURE_SSL_REDIRECT = True` hace que Django redirija `http://localhost:8000/api/health/` a HTTPS. El healthcheck hacía curl sin header `X-Forwarded-Proto` → Django veía HTTP → redirigía → curl seguía el redirect pero no podía conectar por HTTPS en puerto 8000. También faltaba el header `Host` → Django rechazaba con 400 por `ALLOWED_HOSTS`.

**Solución**:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f",
         "-H", "X-Forwarded-Proto: https",
         "-H", "Host: api-rbac.smartdigitaltec.com",
         "http://localhost:8000/api/health/"]
```

---

## Arquitectura Traefik en Dokploy

```
Internet
   │
   ▼
Traefik (dokploy-traefik)
├── Entrypoint web :80  → redirect-to-https@file middleware
└── Entrypoint websecure :443 (TLS global via letsencrypt)
       │
       └── Router rbac-api → Service rbac-api → Django :8000
```

**Configuración Traefik** (`/etc/dokploy/traefik/traefik.yml`):
- Providers: Docker + Swarm + File
- `exposedByDefault: false` → containers necesitan `traefik.enable=true`
- `network: dokploy-network` → red por defecto para backend
- CertResolver: `letsencrypt` con httpChallenge en port 80
- API insecure en port 8080 (acceso interno)

**Middlewares** (`/etc/dokploy/traefik/dynamic/middlewares.yml`):
```yaml
http:
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
```

---

## Comandos post-deploy (ejecutar una vez)

En Dokploy → **Open Terminal** → contenedor `django`:

```bash
python manage.py seed_permissions   # Cargar permisos y roles del sistema
python manage.py createsuperuser    # Crear usuario admin
python manage.py seed_data          # Datos de desarrollo (opcional)
```

---

## Estado final de servicios

| Servicio | Imagen | Estado |
|---|---|---|
| django | Python 3.11 + Gunicorn | Running |
| db | postgres:16-alpine | Healthy |
| redis | redis:7-alpine | Running |
| celery-worker | Python 3.11 | Running |
| celery-beat | Python 3.11 | Running |
| migrate | Python 3.11 | Exited (OK) |
| dokploy-traefik | traefik:v3.6.7 | Running |
