# Monitoring, Profiling & Memory Management

## Memory Management

### QuerySet iterator() para datasets grandes

```python
# MAL: carga todos los registros en memoria
all_items = Item.objects.all()  # si hay 1M items, carga 1M en RAM
for item in all_items:
    process(item)

# BIEN: iterator() usa server-side cursor
for item in Item.objects.all().iterator(chunk_size=2000):
    process(item)
# Procesa de 2000 en 2000, usa memoria constante


# BIEN: para operaciones batch con update
def bulk_update_status(queryset, new_status: str, batch_size: int = 1000):
    """Actualizar en batches para no lockear toda la tabla."""
    updated = 0
    while True:
        batch_ids = list(
            queryset.filter(status__ne=new_status)
            .values_list("id", flat=True)[:batch_size]
        )
        if not batch_ids:
            break
        count = queryset.filter(id__in=batch_ids).update(status=new_status)
        updated += count
    return updated
```

### Chunking large operations

```python
from itertools import islice


def batch_create(model_class, objects, batch_size=1000):
    """Crear objetos en batches."""
    objs = iter(objects)
    while True:
        batch = list(islice(objs, batch_size))
        if not batch:
            break
        model_class.objects.bulk_create(batch, batch_size=batch_size)


def batch_process(queryset, process_fn, batch_size=500):
    """Procesar queryset en batches por PK range."""
    last_pk = 0
    while True:
        batch = list(
            queryset.filter(pk__gt=last_pk).order_by("pk")[:batch_size]
        )
        if not batch:
            break
        process_fn(batch)
        last_pk = batch[-1].pk
```

### Generator patterns

```python
def stream_csv_response(queryset, fields):
    """Generar CSV sin cargar todo en memoria."""
    import csv
    import io
    from django.http import StreamingHttpResponse

    def generate():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(fields)
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)

        for obj in queryset.iterator(chunk_size=1000):
            writer.writerow([getattr(obj, f) for f in fields])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    response = StreamingHttpResponse(generate(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="export.csv"'
    return response
```

---

## Monitoring & Profiling

### django-silk setup

```python
# settings.py (solo staging/development)
if PROFILING_ENABLED:
    INSTALLED_APPS += ["silk"]
    MIDDLEWARE += ["silk.middleware.SilkyMiddleware"]
    SILKY_PYTHON_PROFILER = True
    SILKY_PYTHON_PROFILER_BINARY = True
    SILKY_MAX_RECORDED_REQUESTS = 10_000
    SILKY_MAX_RECORDED_REQUESTS_CHECK_PERCENT = 10
    SILKY_META = True  # track overhead de silk

# urls.py
urlpatterns += [path("silk/", include("silk.urls", namespace="silk"))]
```

### Slow query logging

```python
# settings.py
LOGGING = {
    "version": 1,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/slow_queries.log",
            "maxBytes": 10_485_760,  # 10MB
            "backupCount": 5,
        },
    },
    "loggers": {
        "django.db.backends": {
            "level": "DEBUG" if DEBUG else "WARNING",
            "handlers": ["file"],
        },
    },
}

# PostgreSQL: log queries > 200ms
# postgresql.conf:
# log_min_duration_statement = 200
```

### Request/Response time middleware

```python
import time
import logging

logger = logging.getLogger("performance")

SLOW_REQUEST_THRESHOLD_MS = 500


class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000

        response["X-Request-Duration-Ms"] = f"{duration_ms:.1f}"

        if duration_ms > SLOW_REQUEST_THRESHOLD_MS:
            logger.warning(
                "Slow request: %s %s %.1fms (user=%s)",
                request.method,
                request.path,
                duration_ms,
                getattr(request, "user", "anonymous"),
            )

        return response
```

### APM integration (structured logging)

```python
import structlog

logger = structlog.get_logger()


class StructuredLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration = time.monotonic() - start

        logger.info(
            "request_completed",
            method=request.method,
            path=request.path,
            status=response.status_code,
            duration_ms=round(duration * 1000, 1),
            user_id=getattr(request.user, "pk", None),
            query_count=len(connection.queries) if settings.DEBUG else None,
        )
        return response
```
