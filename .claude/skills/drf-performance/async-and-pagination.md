# Async Views & Pagination Best Practices

## Async Views (Django 4.x+)

### Async views con Django

```python
import httpx
from django.http import JsonResponse


# Async function-based view
async def external_data_view(request):
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return JsonResponse(response.json())


# Async con DRF (DRF 3.14+)
from adrf.viewsets import ModelViewSet as AsyncModelViewSet


class AsyncItemViewSet(AsyncModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    async def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        items = [item async for item in queryset]
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
```

### ASGI vs WSGI configuration

```python
# asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
application = get_asgi_application()

# Deployment con uvicorn (ASGI)
# uvicorn config.asgi:application --workers 4 --host 0.0.0.0 --port 8000

# Deployment con gunicorn + uvicorn workers
# gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker --workers 4
```

### Cuándo usar async vs sync

```python
# USAR ASYNC cuando:
# - Múltiples llamadas HTTP externas en paralelo
# - WebSocket connections
# - Long-polling endpoints
# - Endpoints que esperan I/O externo

import asyncio
import httpx


async def fetch_enriched_data(request, pk):
    """Múltiples APIs externas en paralelo."""
    item = await Item.objects.aget(pk=pk)

    async with httpx.AsyncClient() as client:
        score_task = client.get(f"https://scoring-api.com/items/{pk}")
        reviews_task = client.get(f"https://reviews-api.com/items/{pk}")
        score_resp, reviews_resp = await asyncio.gather(score_task, reviews_task)

    return JsonResponse({
        "item": item.name,
        "score": score_resp.json(),
        "reviews": reviews_resp.json(),
    })


# USAR SYNC cuando:
# - CRUD básico con ORM
# - Operaciones CPU-bound
# - La mayoría de endpoints DRF estándar
# - Lógica que depende de libs sync-only
```

### Limitations de async en Django

```python
# 1. ORM: usar métodos async del ORM (Django 4.1+):
item = await Item.objects.aget(pk=1)
items = [item async for item in Item.objects.filter(status="active")]
exists = await Item.objects.filter(pk=1).aexists()
count = await Item.objects.acount()
await Item.objects.acreate(name="New Item")

# 2. Si necesitas código sync dentro de async view:
from asgiref.sync import sync_to_async

@sync_to_async
def compute_heavy_stats():
    return Item.objects.annotate(...).aggregate(...)

async def stats_view(request):
    stats = await compute_heavy_stats()
    return JsonResponse(stats)

# 3. Si necesitas código async dentro de sync view:
from asgiref.sync import async_to_sync

def sync_view(request):
    result = async_to_sync(fetch_external_data)()
    return JsonResponse(result)
```

---

## Pagination Best Practices

### Comparativa de tipos de pagination

```
┌─────────────────────┬──────────┬──────────────┬──────────────────┐
│ Tipo                │ Performance│ Random access│ Ideal para       │
├─────────────────────┼──────────┼──────────────┼──────────────────┤
│ PageNumberPagination│ O(n)     │ Sí           │ UI con páginas   │
│ LimitOffsetPagination│ O(n)    │ Sí           │ APIs flexibles   │
│ CursorPagination    │ O(1)     │ No           │ Datasets grandes │
└─────────────────────┴──────────┴──────────────┴──────────────────┘

# PageNumber y LimitOffset usan OFFSET que es lento en páginas altas:
# SELECT * FROM items ORDER BY id OFFSET 100000 LIMIT 20;  → escanea 100020 filas

# CursorPagination usa WHERE clause:
# SELECT * FROM items WHERE id > 100000 ORDER BY id LIMIT 20;  → escanea 20 filas
```

### CursorPagination para datasets grandes

```python
from rest_framework.pagination import CursorPagination


class ItemCursorPagination(CursorPagination):
    page_size = 50
    ordering = "-created_at"  # DEBE ser un campo con index y valores únicos
    cursor_query_param = "cursor"
    page_size_query_param = "page_size"
    max_page_size = 200


class LargeDatasetViewSet(ModelViewSet):
    pagination_class = ItemCursorPagination
    queryset = Item.objects.all()
```

### count() optimization en pagination

```python
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class OptimizedPageNumberPagination(PageNumberPagination):
    page_size = 20
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
            # Omitir count en datasets grandes (ahorra un COUNT(*) query)
        })


# O usar count estimado para tablas grandes
class EstimatedCountPagination(PageNumberPagination):
    def get_count(self, queryset):
        """Usa estimate para tablas > 100k filas."""
        if not queryset.query.where:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT reltuples::bigint FROM pg_class WHERE relname = %s",
                    [queryset.model._meta.db_table],
                )
                estimate = cursor.fetchone()[0]
                if estimate > 100_000:
                    return estimate
        return queryset.count()
```

### Keyset pagination pattern

```python
class KeysetPagination:
    """Pagination manual basada en keyset para máximo rendimiento."""

    def __init__(self, page_size: int = 50):
        self.page_size = page_size

    def paginate(self, queryset, request):
        after_id = request.query_params.get("after")
        before_id = request.query_params.get("before")

        if after_id:
            queryset = queryset.filter(id__gt=after_id)
        elif before_id:
            queryset = queryset.filter(id__lt=before_id).order_by("-id")

        items = list(queryset[:self.page_size + 1])
        has_more = len(items) > self.page_size
        items = items[:self.page_size]

        if before_id:
            items.reverse()

        return {
            "results": items,
            "has_more": has_more,
            "next_cursor": items[-1].id if items and has_more else None,
        }
```
