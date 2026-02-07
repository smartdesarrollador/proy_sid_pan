# Caching Strategies

## Cache backends configuration

```python
# settings.py

# Redis (recomendado para producción)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "KEY_PREFIX": "myapp",
        "TIMEOUT": 300,  # 5 minutos default
    },
    "sessions": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/2",
        "TIMEOUT": 86400,  # 24 horas
    },
}

# Memcached
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.memcached.PyMemcacheCache",
        "LOCATION": "127.0.0.1:11211",
    },
}

# Database cache (sin infraestructura extra, pero más lento)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "cache_table",
    },
}
# Requiere: python manage.py createcachetable

# File-based (desarrollo local)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": "/var/tmp/django_cache",
    },
}
```

## Per-view caching

```python
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from rest_framework.viewsets import ModelViewSet


class ItemViewSet(ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    # Cache list por 15 minutos
    @method_decorator(cache_page(60 * 15))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # Cache retrieve por 5 minutos
    @method_decorator(cache_page(60 * 5))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # Invalidar cache en mutaciones
    def perform_create(self, serializer):
        serializer.save()
        self._invalidate_list_cache()

    def perform_update(self, serializer):
        serializer.save()
        self._invalidate_list_cache()

    def perform_destroy(self, instance):
        instance.delete()
        self._invalidate_list_cache()

    def _invalidate_list_cache(self):
        from django.core.cache import cache
        cache.delete_pattern("views.decorators.cache.*items*")
```

## Low-level cache API

```python
from django.core.cache import cache
from typing import Any


def get_item_stats(category_id: int) -> dict[str, Any]:
    """Cache de estadísticas con invalidación manual."""
    cache_key = f"item_stats:{category_id}"
    stats = cache.get(cache_key)

    if stats is None:
        stats = Item.objects.filter(category_id=category_id).aggregate(
            total=Count("id"),
            avg_value=Avg("value"),
            max_value=Max("value"),
        )
        cache.set(cache_key, stats, timeout=600)  # 10 minutos

    return stats


def get_or_set_cached(key: str, callback, timeout: int = 300) -> Any:
    """Helper genérico para cache-aside pattern."""
    result = cache.get(key)
    if result is None:
        result = callback()
        cache.set(key, result, timeout)
    return result


# Uso
stats = get_or_set_cached(
    f"dashboard:stats:{user.pk}",
    lambda: compute_dashboard_stats(user),
    timeout=120,
)
```

## Cache key naming conventions

```python
# Patrón: {app}:{model}:{identifier}:{version}
CACHE_KEYS = {
    "item_detail": "items:detail:{pk}:v1",
    "item_list": "items:list:{page}:{filters_hash}:v1",
    "user_profile": "users:profile:{user_id}:v1",
    "category_stats": "categories:stats:{category_id}:v1",
    "global_stats": "app:stats:global:v1",
}


def make_cache_key(template: str, **kwargs) -> str:
    return template.format(**kwargs)


def make_list_cache_key(request) -> str:
    """Genera cache key único basado en query params."""
    import hashlib
    params = request.query_params.urlencode()
    params_hash = hashlib.md5(params.encode()).hexdigest()[:8]
    return f"items:list:{params_hash}"
```

## Cached properties en models

```python
from django.utils.functional import cached_property


class Item(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey("Category", on_delete=models.CASCADE)

    @cached_property
    def computed_score(self) -> float:
        """Se calcula una vez por instancia, se mantiene en memoria."""
        return self.reviews.aggregate(avg=Avg("score"))["avg"] or 0.0

    @cached_property
    def full_path(self) -> str:
        return f"{self.category.name}/{self.name}"
```

## ETags y conditional requests

```python
from django.views.decorators.http import condition
from django.utils.decorators import method_decorator
import hashlib


def item_etag(request, pk=None):
    """Genera ETag basado en última modificación."""
    if pk:
        item = Item.objects.filter(pk=pk).values_list("updated_at", flat=True).first()
        if item:
            return hashlib.md5(str(item).encode()).hexdigest()
    return None


def item_last_modified(request, pk=None):
    if pk:
        return Item.objects.filter(pk=pk).values_list("updated_at", flat=True).first()
    return None


class ItemViewSet(ModelViewSet):
    @method_decorator(condition(etag_func=item_etag, last_modified_func=item_last_modified))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
```

## Cache invalidation strategies

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache


# Strategy 1: Signal-based invalidation
@receiver([post_save, post_delete], sender=Item)
def invalidate_item_cache(sender, instance, **kwargs):
    cache.delete(f"items:detail:{instance.pk}:v1")
    cache.delete(f"categories:stats:{instance.category_id}:v1")
    cache.delete("app:stats:global:v1")


# Strategy 2: Versioned keys (no requiere invalidación explícita)
class CacheVersion:
    @staticmethod
    def get(namespace: str) -> int:
        version = cache.get(f"cache_version:{namespace}")
        if version is None:
            version = 1
            cache.set(f"cache_version:{namespace}", version, timeout=None)
        return version

    @staticmethod
    def increment(namespace: str) -> None:
        cache.incr(f"cache_version:{namespace}")


def versioned_cache_key(namespace: str, key: str) -> str:
    version = CacheVersion.get(namespace)
    return f"{namespace}:{key}:v{version}"


# Al mutar datos:
CacheVersion.increment("items")  # Todas las keys de "items" quedan obsoletas


# Strategy 3: Time-based expiry (más simple, eventual consistency)
# Simplemente usar timeouts cortos: cache.set(key, value, timeout=60)
```
