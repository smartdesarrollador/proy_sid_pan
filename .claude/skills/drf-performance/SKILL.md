---
name: drf-performance
description: >
  Patrones y mejores prácticas para optimizar rendimiento y escalabilidad en Django REST Framework
  con PostgreSQL. Usar cuando se trabaje con caching, query optimization, connection pooling,
  async views, pagination performance, background tasks, rate limiting, monitoring o scalability
  patterns en DRF. Incluye ejemplos de código, configuraciones y métricas before/after.
---

# Performance & Scalability en Django REST Framework con PostgreSQL

Guía completa organizada en módulos. Consultar el archivo específico según el tema.

## Índice de módulos

### [1. Caching Strategies](caching.md)
- Cache backends (Redis, Memcached, Database, File-based)
- Per-view caching con `cache_page`
- Low-level cache API (`cache.get`, `cache.set`)
- Cache key naming conventions
- Cached properties en models
- ETags y conditional requests
- Cache invalidation strategies (signals, versioned keys, time-based)

### [2. Database: Connection Pooling, Query Optimization & Indexing](database.md)
- `CONN_MAX_AGE` configuration
- PgBouncer integration y pool sizing
- N+1 query detection y solución
- `select_related()` / `prefetch_related()` / `Prefetch()` objects
- `only()` y `defer()` para campos específicos
- Query profiling y django-debug-toolbar
- Raw SQL cuando es necesario
- Tipos de indexes en PostgreSQL (B-tree, GIN, partial, hash)
- EXPLAIN ANALYZE
- Database maintenance (VACUUM, REINDEX, indexes no usados)

### [3. Async Views & Pagination](async-and-pagination.md)
- Async views con Django 4.x+ y DRF
- ASGI vs WSGI configuration
- Cuándo usar async vs sync
- Limitaciones de async en Django
- Comparativa: PageNumber vs LimitOffset vs Cursor pagination
- CursorPagination para datasets grandes
- `count()` optimization y estimated counts
- Keyset pagination pattern

### [4. Serializer Performance & API Response Optimization](serializers-and-responses.md)
- Serializers separados para list vs detail vs write
- `to_representation()` optimization (~30% más rápido)
- Evitar N+1 en nested serializers con `annotate()`
- Read-only serializers para máxima velocidad
- Response compression (gzip)
- Dynamic field selection (`?fields=id,name`)
- Sparse fieldsets con `only()` en ViewSet

### [5. Background Tasks con Celery](background-tasks.md)
- Celery setup y configuración
- Task patterns (retries, backoff, error handling)
- Task queues y routing por prioridad
- Celery beat para scheduled tasks
- Cuándo usar background tasks vs sync processing

### [6. Infrastructure: Static Files, Rate Limiting & Scalability](infrastructure.md)
- WhiteNoise para static files
- S3/Cloud storage para media
- CDN integration patterns
- DRF throttling classes (Anon, User, custom)
- Redis-based sliding window throttling
- Stateless application design
- Database read replicas y routing
- Horizontal scaling (gunicorn, docker-compose)

### [7. Monitoring, Profiling, Testing & Best Practices](testing-and-best-practices.md)
- Memory management: `iterator()`, chunking, generators
- django-silk profiling
- Slow query logging
- Request timing middleware
- Structured logging (structlog)
- Load testing con locust
- `assertNumQueries` en tests
- Performance benchmarking
- Performance & Scalability checklists
- Anti-patterns de performance

Ver también: [monitoring-and-memory.md](monitoring-and-memory.md) para detalle de monitoring y memory management.
