# Infrastructure: Static Files, Rate Limiting & Scalability

## Static Files & Media

### WhiteNoise para static files

```python
# settings.py
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # después de SecurityMiddleware
    # ...
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
# WhiteNoise sirve archivos con gzip/brotli y cache headers agresivos
# ~10x más rápido que Django default static serving
```

### S3/Cloud storage para media

```python
# settings.py
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_STORAGE_BUCKET_NAME = "myapp-media"
AWS_S3_REGION_NAME = "us-east-1"
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
AWS_DEFAULT_ACL = "private"
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",  # 1 día
}
AWS_QUERYSTRING_AUTH = True  # signed URLs para archivos privados
AWS_QUERYSTRING_EXPIRE = 3600  # URLs válidas por 1 hora
```

### CDN integration patterns

```python
# settings.py con CloudFront o similar
STATIC_URL = "https://cdn.myapp.com/static/"
MEDIA_URL = "https://cdn.myapp.com/media/"

# Cache headers en responses
from django.views.decorators.cache import cache_control


@cache_control(max_age=3600, public=True)
def public_api_view(request):
    pass


@cache_control(max_age=0, no_cache=True, no_store=True, must_revalidate=True)
def private_api_view(request):
    pass
```

---

## Rate Limiting & Throttling

### DRF throttling classes

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "burst": "60/minute",
        "sustained": "1000/day",
        "uploads": "20/hour",
    },
}
```

### Custom throttle classes

```python
from rest_framework.throttling import UserRateThrottle, SimpleRateThrottle


class BurstRateThrottle(UserRateThrottle):
    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    scope = "sustained"


class UploadRateThrottle(UserRateThrottle):
    scope = "uploads"


# Per-endpoint throttling
class ItemViewSet(ModelViewSet):
    def get_throttles(self):
        if self.action in ["create", "update", "partial_update"]:
            return [BurstRateThrottle(), SustainedRateThrottle()]
        if self.action == "upload":
            return [UploadRateThrottle()]
        return []


# Throttle por IP para endpoints sensibles
class LoginRateThrottle(SimpleRateThrottle):
    scope = "login"
    rate = "5/minute"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginView(APIView):
    throttle_classes = [LoginRateThrottle]
```

### Redis-based throttling para alta concurrencia

```python
from rest_framework.throttling import BaseThrottle
from django.core.cache import cache
import time


class SlidingWindowThrottle(BaseThrottle):
    """Sliding window rate limiter usando Redis sorted sets."""
    rate = 100  # requests
    window = 60  # segundos

    def allow_request(self, request, view):
        key = f"throttle:{self.get_ident(request)}"
        now = time.time()
        window_start = now - self.window

        pipe = cache.client.get_client().pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window)
        results = pipe.execute()

        request_count = results[2]
        return request_count <= self.rate

    def wait(self):
        return self.window
```

---

## Scalability Patterns

### Stateless application design

```python
# 1. Sessions en cache (no en local filesystem)
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "sessions"

# 2. File storage en cloud (no en disco local)
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"

# 3. Cache compartido (Redis, no LocMemCache)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://redis:6379/1",
    },
}

# 4. Celery broker compartido
CELERY_BROKER_URL = "redis://redis:6379/0"
```

### Database read replicas

```python
# settings.py
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "myapp_db",
        "HOST": "primary-db.example.com",
    },
    "replica": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "myapp_db",
        "HOST": "replica-db.example.com",
    },
}


class PrimaryReplicaRouter:
    def db_for_read(self, model, **hints):
        return "replica"

    def db_for_write(self, model, **hints):
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return db == "default"


DATABASE_ROUTERS = ["config.routers.PrimaryReplicaRouter"]

# Override manual cuando necesitas leer de primary (consistency)
item = Item.objects.using("default").get(pk=pk)
```

### Horizontal scaling considerations

```python
# gunicorn.conf.py
import multiprocessing

# Workers = (2 * CPU cores) + 1
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"  # para ASGI
bind = "0.0.0.0:8000"
max_requests = 1000  # restart worker después de N requests (prevenir memory leaks)
max_requests_jitter = 50
timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"
```

```yaml
# docker-compose.yml - ejemplo multi-servicio
services:
  web:
    build: .
    command: gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker
    deploy:
      replicas: 3
    depends_on:
      - db
      - redis

  celery-worker:
    build: .
    command: celery -A config worker --loglevel=info --concurrency=4
    deploy:
      replicas: 2

  celery-beat:
    build: .
    command: celery -A config beat --loglevel=info
    deploy:
      replicas: 1  # siempre 1

  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
```
