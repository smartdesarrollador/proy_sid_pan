# Background Tasks con Celery

## Celery setup

```python
# config/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

app = Celery("myapp")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# settings.py
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 300  # 5 minutos hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 240  # 4 minutos soft limit
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000  # prevenir memory leaks
CELERY_TASK_ACKS_LATE = True  # ack después de ejecutar (más seguro)
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # para tareas largas
```

## Celery task patterns

```python
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,  # exponential backoff
    retry_jitter=True,
)
def process_import(self, import_id: int) -> dict:
    """Procesar importación de datos en background."""
    try:
        import_obj = Import.objects.get(pk=import_id)
        import_obj.status = "processing"
        import_obj.save(update_fields=["status"])

        result = ImportService.process(import_obj)

        import_obj.status = "completed"
        import_obj.result = result
        import_obj.save(update_fields=["status", "result"])

        return {"status": "completed", "rows_processed": result["count"]}
    except Import.DoesNotExist:
        logger.error("Import %s not found", import_id)
        return {"status": "error", "message": "Not found"}
    except Exception as exc:
        logger.exception("Import %s failed", import_id)
        import_obj.status = "failed"
        import_obj.error = str(exc)
        import_obj.save(update_fields=["status", "error"])
        raise self.retry(exc=exc)


@shared_task
def send_notification_email(user_id: int, template: str, context: dict) -> None:
    """Fire-and-forget email task."""
    user = User.objects.get(pk=user_id)
    EmailService.send(user.email, template, context)
```

## Task queues y routing

```python
@shared_task(queue="high_priority")
def urgent_task():
    pass


@shared_task(queue="low_priority")
def batch_task():
    pass


# settings.py
CELERY_TASK_ROUTES = {
    "apps.tasks.urgent_*": {"queue": "high_priority"},
    "apps.tasks.batch_*": {"queue": "low_priority"},
    "apps.tasks.send_*": {"queue": "emails"},
}
```

## Celery beat para scheduled tasks

```python
# settings.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "cleanup-expired-tokens": {
        "task": "apps.auth.tasks.cleanup_expired_tokens",
        "schedule": crontab(hour=3, minute=0),  # diario a las 3am
    },
    "generate-daily-report": {
        "task": "apps.reports.tasks.generate_daily_report",
        "schedule": crontab(hour=6, minute=0),
    },
    "refresh-cache": {
        "task": "apps.cache.tasks.refresh_stats_cache",
        "schedule": 300.0,  # cada 5 minutos
    },
    "check-stale-items": {
        "task": "apps.items.tasks.check_stale_items",
        "schedule": crontab(hour="*/6"),  # cada 6 horas
    },
}

# Ejecutar: celery -A config beat --loglevel=info
```

## When to use background tasks vs sync

```python
# SYNC (en el request):
# - Operaciones < 200ms
# - El usuario necesita el resultado inmediatamente
# - CRUD básico, validaciones

# BACKGROUND TASK:
# - Envío de emails/notificaciones
# - Procesamiento de archivos/imports
# - Llamadas a APIs externas lentas
# - Generación de reportes
# - Operaciones batch (actualizar miles de registros)
# - Resize de imágenes
# - Cálculos pesados

class ItemViewSet(ModelViewSet):
    def perform_create(self, serializer):
        instance = serializer.save()
        # Sync: guardar en DB (rápido)
        # Async: notificación (puede fallar/demorar)
        send_notification_email.delay(
            user_id=instance.created_by_id,
            template="item_created",
            context={"item_name": instance.name},
        )
```
