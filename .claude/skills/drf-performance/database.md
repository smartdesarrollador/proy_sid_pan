# Database: Connection Pooling, Query Optimization & Indexing

## Connection Pooling

### CONN_MAX_AGE configuration

```python
# settings.py
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "myapp_db",
        "USER": "myapp",
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": "localhost",
        "PORT": "5432",
        # Tiempo en segundos que una conexión se mantiene abierta
        # 0 = cerrar después de cada request (default)
        # None = mantener abierta indefinidamente
        # 600 = mantener 10 minutos
        "CONN_MAX_AGE": 600,
        "CONN_HEALTH_CHECKS": True,  # Django 4.1+ verifica conexiones stale
    },
}
```

### PgBouncer integration

```ini
# pgbouncer.ini
[databases]
myapp_db = host=localhost port=5432 dbname=myapp_db

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Transaction pooling: recomendado para Django
pool_mode = transaction

# Pool sizing
default_pool_size = 20
max_client_conn = 100
min_pool_size = 5

# Timeouts
server_idle_timeout = 600
client_idle_timeout = 0
```

```python
# settings.py - conectar a PgBouncer en lugar de PostgreSQL directo
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "myapp_db",
        "USER": "myapp",
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": "127.0.0.1",
        "PORT": "6432",  # Puerto de PgBouncer
        # IMPORTANTE: con PgBouncer en transaction mode, usar 0
        "CONN_MAX_AGE": 0,
        "OPTIONS": {
            "options": "-c statement_timeout=30000",
        },
    },
}
```

### Connection pool sizing guidelines

```
# Fórmula base para pool size:
# pool_size = (num_workers * 2) + num_background_tasks + buffer

# Ejemplo con gunicorn:
# - 4 workers gunicorn, 2 celery workers, buffer de 4
# pool_size = (4 * 2) + 2 + 4 = 14 → redondear a 20

# PostgreSQL max_connections:
# max_connections = pool_size * num_app_servers + superuser_reserved
# Ejemplo: 20 * 3 servers + 3 reserved = 63

# Verificar conexiones activas:
# SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

---

## Query Optimization

### N+1 query detection y solución

```python
# PROBLEMA: N+1 queries
items = Item.objects.all()
for item in items:
    print(item.category.name)  # query adicional por item!

# SOLUCIÓN con select_related (ForeignKey, OneToOne → JOIN)
items = Item.objects.select_related("category", "created_by").all()
for item in items:
    print(item.category.name)  # sin query adicional

# SOLUCIÓN con prefetch_related (ManyToMany, reverse FK → 2 queries)
items = Item.objects.prefetch_related("tags", "reviews").all()
for item in items:
    print(list(item.tags.all()))  # sin query adicional
```

### Prefetch objects customizados

```python
from django.db.models import Prefetch

items = Item.objects.prefetch_related(
    Prefetch(
        "reviews",
        queryset=Review.objects.filter(is_approved=True).select_related("author"),
        to_attr="approved_reviews",
    ),
    Prefetch(
        "tags",
        queryset=Tag.objects.filter(is_active=True),
        to_attr="active_tags",
    ),
)

# En el ViewSet
class ItemViewSet(ModelViewSet):
    def get_queryset(self):
        qs = Item.objects.all()

        if self.action == "list":
            qs = qs.select_related("category").prefetch_related(
                Prefetch(
                    "reviews",
                    queryset=Review.objects.only("id", "score", "item_id"),
                ),
            )
        elif self.action == "retrieve":
            qs = qs.select_related(
                "category", "created_by",
            ).prefetch_related(
                "tags",
                Prefetch(
                    "reviews",
                    queryset=Review.objects.select_related("author")
                        .order_by("-created_at")[:10],
                    to_attr="recent_reviews",
                ),
            )
        return qs
```

### only() y defer() para campos específicos

```python
# only(): carga SOLO los campos especificados
items = Item.objects.only("id", "name", "status")

# defer(): carga TODO excepto los campos especificados
items = Item.objects.defer("description", "metadata")

# Útil para campos grandes que no se necesitan en list
class ItemViewSet(ModelViewSet):
    def get_queryset(self):
        if self.action == "list":
            return Item.objects.defer("description", "metadata", "raw_data")
        return Item.objects.all()
```

### Query profiling

```python
from django.db import connection, reset_queries
import logging

logger = logging.getLogger(__name__)


class SlowQueryLogMiddleware:
    SLOW_QUERY_THRESHOLD_MS = 100

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        reset_queries()
        response = self.get_response(request)

        if settings.DEBUG:
            for query in connection.queries:
                time_ms = float(query["time"]) * 1000
                if time_ms > self.SLOW_QUERY_THRESHOLD_MS:
                    logger.warning(
                        "Slow query (%.1fms): %s", time_ms, query["sql"][:500]
                    )

            total_time = sum(float(q["time"]) for q in connection.queries)
            query_count = len(connection.queries)
            if query_count > 10:
                logger.warning(
                    "%s %s: %d queries in %.1fms",
                    request.method, request.path, query_count, total_time * 1000,
                )

        return response
```

### django-debug-toolbar setup

```python
# settings.py (solo development)
if DEBUG:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")
    INTERNAL_IPS = ["127.0.0.1"]

    DEBUG_TOOLBAR_CONFIG = {
        "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
        "SQL_WARNING_THRESHOLD": 100,  # ms
    }
```

### Raw SQL cuando es necesario

```python
from django.db import connection


def get_aggregated_report(start_date, end_date):
    """Raw SQL para queries complejas que el ORM no puede optimizar."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                c.name AS category,
                COUNT(i.id) AS total_items,
                AVG(i.value) AS avg_value,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY i.value) AS median_value
            FROM items i
            JOIN categories c ON i.category_id = c.id
            WHERE i.created_at BETWEEN %s AND %s
              AND i.is_deleted = FALSE
            GROUP BY c.name
            ORDER BY total_items DESC
            """,
            [start_date, end_date],
        )
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
```

---

## Indexing & Database Performance

### Tipos de indexes en PostgreSQL

```python
from django.contrib.postgres.indexes import (
    BTreeIndex, GinIndex, GistIndex, HashIndex,
)


class Item(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20)
    metadata = models.JSONField(default=dict)
    tags = ArrayField(models.CharField(max_length=50), default=list)
    search_vector = SearchVectorField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            # B-tree: default, ideal para =, <, >, BETWEEN, ORDER BY
            BTreeIndex(fields=["status", "-created_at"], name="idx_status_date"),

            # GIN: ideal para full-text search, JSONField, ArrayField
            GinIndex(fields=["search_vector"], name="idx_fts"),
            GinIndex(fields=["metadata"], name="idx_metadata"),
            GinIndex(fields=["tags"], name="idx_tags"),

            # Partial index: solo indexar subset relevante
            BTreeIndex(
                fields=["created_at"],
                name="idx_recent_active",
                condition=models.Q(status="active", is_deleted=False),
            ),

            # Hash: solo para equality lookups (=)
            HashIndex(fields=["code"], name="idx_code_hash"),
        ]
```

### Database indexes strategy (models)

```python
class Item(models.Model):
    name = models.CharField(max_length=255, db_index=True)  # simple index
    code = models.CharField(max_length=50, unique=True)      # unique index
    status = models.CharField(max_length=20, db_index=True)
    category = models.ForeignKey("Category", on_delete=models.CASCADE)  # auto-indexed
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"], name="idx_status_created"),
            models.Index(fields=["-created_at"], name="idx_created_desc"),
            models.Index(
                fields=["status"],
                name="idx_active_items",
                condition=models.Q(is_deleted=False),
            ),
            GinIndex(fields=["metadata"], name="idx_metadata_gin"),
            GinIndex(fields=["search_vector"], name="idx_search_vector"),
        ]
```

### EXPLAIN ANALYZE

```python
from django.db import connection


def explain_query(queryset) -> str:
    """Obtener plan de ejecución de un queryset."""
    sql, params = queryset.query.sql_with_params()
    with connection.cursor() as cursor:
        cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) {sql}", params)
        return "\n".join(row[0] for row in cursor.fetchall())


# Uso en debug/testing:
qs = Item.objects.filter(status="active").order_by("-created_at")[:20]
print(explain_query(qs))

# Si ves "Seq Scan" en tablas grandes → falta un index
# Si ves "Bitmap Heap Scan" → el index se usa parcialmente
# "Index Scan" o "Index Only Scan" → óptimo
```

### Database maintenance

```sql
-- Verificar bloat de tablas e indexes
SELECT
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- Verificar indexes no usados
SELECT
    indexrelname AS index_name,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- VACUUM y ANALYZE
VACUUM ANALYZE items;

-- Reindex si es necesario
REINDEX INDEX CONCURRENTLY idx_status_date;
```
