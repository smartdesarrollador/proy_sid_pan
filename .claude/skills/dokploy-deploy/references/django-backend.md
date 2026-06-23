# Deploy — Backend Django (`api-rbac`)

Repo `back_dj_sp` · puerto interno `8000` · Gunicorn + postgres + redis + celery-worker + celery-beat.
Fuente: `reports/2026-04-01-deploy-backend-dokploy.md`. Incidencias: LL-070, LL-071, LL-072, LL-075.

## Tabla de contenidos
- [1. docker-compose.dokploy.yml](#1-docker-composedokployyml)
- [2. Cambios en Dockerfile (stage prod)](#2-cambios-en-dockerfile-stage-prod)
- [3. Cambios en config/settings/prod.py](#3-cambios-en-configsettingsprodpy)
- [4. Variables de entorno (Dokploy → Environment)](#4-variables-de-entorno-dokploy--environment)
- [5. Dominio y SSL](#5-dominio-y-ssl)
- [6. Post-deploy (ejecutar una vez)](#6-post-deploy-ejecutar-una-vez)

## 1. docker-compose.dokploy.yml

Diferencias clave vs `docker-compose.prod.yml` (que usa red `global` + Nginx): red **`dokploy-network`**
externa, **sin servicio nginx**, servicio `migrate` dedicado (migrations + collectstatic en runtime),
volúmenes nombrados (persisten entre redeploys), y **labels de Traefik completos** en el servicio
`django`. Esqueleto (adaptar `${API_DOMAIN}`):

```yaml
services:
  django:
    build: { context: ., dockerfile: Dockerfile, target: prod }
    env_file: [.env]            # Dokploy inyecta las env vars
    networks: [default, dokploy-network]
    depends_on: [db, redis]
    healthcheck:
      test: ["CMD","curl","-f","-H","X-Forwarded-Proto: https","-H","Host: ${API_DOMAIN}","http://localhost:8000/api/health/"]
      interval: 30s
      timeout: 5s
      retries: 3
    labels:
      - "traefik.enable=true"
      # router HTTPS
      - "traefik.http.routers.rbac-api.rule=Host(`${API_DOMAIN}`)"
      - "traefik.http.routers.rbac-api.entrypoints=websecure"
      - "traefik.http.routers.rbac-api.service=rbac-api"                 # ← crítico (LL-070)
      # redirect HTTP→HTTPS
      - "traefik.http.routers.rbac-api-http.rule=Host(`${API_DOMAIN}`)"
      - "traefik.http.routers.rbac-api-http.entrypoints=web"
      - "traefik.http.routers.rbac-api-http.middlewares=redirect-to-https@file"
      - "traefik.http.routers.rbac-api-http.service=rbac-api"
      # service
      - "traefik.http.services.rbac-api.loadbalancer.server.port=8000"
  db:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    networks: [default]
  redis:
    image: redis:7-alpine
    networks: [default]
  celery-worker:
    build: { context: ., dockerfile: Dockerfile, target: prod }
    command: celery -A config worker -l info
    env_file: [.env]
    networks: [default]
    depends_on: [redis, db]
  celery-beat:
    build: { context: ., dockerfile: Dockerfile, target: prod }
    command: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    env_file: [.env]
    networks: [default]
    depends_on: [redis, db]
  migrate:
    build: { context: ., dockerfile: Dockerfile, target: prod }
    command: sh -c "python manage.py migrate && python manage.py collectstatic --noinput"
    env_file: [.env]
    networks: [default]
    depends_on: [db]
    restart: "no"

networks:
  dokploy-network: { external: true }
volumes:
  pgdata:
```

## 2. Cambios en Dockerfile (stage prod)

- Añadir `curl` al `apt-get install` (lo usa el healthcheck).
- Añadir `ARG SECRET_KEY=placeholder-build-only` **antes** del `collectstatic`. `collectstatic` importa
  `prod.py` en build-time y Django exige `SECRET_KEY`, pero Dokploy inyecta env vars en runtime → sin el
  ARG el build falla. (LL-072)

```dockerfile
# stage prod
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
ARG SECRET_KEY=placeholder-build-only
RUN SECRET_KEY=$SECRET_KEY python manage.py collectstatic --noinput
```

> Toda dependencia referenciada por `prod.py` debe estar en `requirements/prod.txt`. El logging usa
> `pythonjsonlogger.jsonlogger.JsonFormatter` → `python-json-logger==2.0.7` debe estar en `prod.txt`,
> o `collectstatic` falla con `ModuleNotFoundError`. (LL-072)

## 3. Cambios en config/settings/prod.py

Traefik termina el SSL y reenvía HTTP interno → sin esto, `SECURE_SSL_REDIRECT=True` causa loop
infinito de redirects y el healthcheck queda `unhealthy`. (LL-071)

```python
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
```

## 4. Variables de entorno (Dokploy → Environment)

Todas **runtime** (el backend no hornea nada en build salvo el placeholder de SECRET_KEY). Generar
secretos con: `python3 -c "import secrets;print(secrets.token_urlsafe(50))"` y la clave de cifrado con
`python3 -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"`.

```env
SECRET_KEY=<token_urlsafe(50)>
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.prod
ALLOWED_HOSTS=api-rbac.<dominio>
API_DOMAIN=api-rbac.<dominio>
DATABASE_URL=postgresql://rbac_user:<pwd>@db:5432/rbac_db
POSTGRES_DB=rbac_db
POSTGRES_USER=rbac_user
POSTGRES_PASSWORD=<pwd>
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
ENCRYPTION_KEY=<Fernet key>
# CORS: AÑADIR cada dominio de frontend desplegado (admin, hub, workspace, vista) + http://tauri.localhost (Desktop)
CORS_ALLOWED_ORIGINS=https://admin.<dominio>,https://hub.<dominio>,https://workspace.<dominio>,https://view.<dominio>,http://tauri.localhost
FRONTEND_URL=https://hub.<dominio>          # usado en links de emails (verificación, etc.)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<...>
EMAIL_HOST_PASSWORD=<app password>
DEFAULT_FROM_EMAIL=noreply@<dominio>
```

> `env.list('CORS_ALLOWED_ORIGINS', ...)` **reemplaza** el default de `base.py` → cualquier origen nuevo
> debe estar aquí explícitamente. Origen de Desktop Windows: `http://tauri.localhost` (sin S). (LL-031)

## 5. Dominio y SSL

1. DNS (Hostinger u otro): registro `A` `api-rbac` → IP del VPS.
2. Dokploy → Domains → Add Domain: Host `api-rbac.<dominio>`, **Container Port `8000`**, HTTPS ON,
   Certificate Provider **Let's Encrypt**.

## 6. Post-deploy (ejecutar una vez)

Dokploy → servicio backend → **Open Terminal** (contenedor `django`):

```bash
python manage.py seed_permissions   # permisos + roles del sistema (sin esto → 403 en todo, LL-061)
python manage.py seed_plans         # Free / Starter / Professional / Enterprise
python manage.py loaddata apps/services/fixtures/services.json   # catálogo de servicios
python manage.py createsuperuser    # admin (is_staff=True para entrar al Admin Panel)
# Cargar KB del chat si aplica:
python manage.py loaddata apps/chat_assistant/fixtures/initial_knowledge.json
```

El `migrate` corre solo (servicio dedicado). Celery Beat registra `CELERY_BEAT_SCHEDULE` en la BD al
arrancar (usa `DatabaseScheduler`).

Verificar: `GET https://api-rbac.<dominio>/api/health/` → `{"status":"ok","db":true,"redis":true,"celery":true}`.
