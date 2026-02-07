# Performance Testing & Best Practices

## Performance Testing

### Load testing con locust

```python
# locustfile.py
from locust import HttpUser, task, between


class APIUser(HttpUser):
    wait_time = between(1, 3)
    host = "http://localhost:8000"

    def on_start(self):
        """Login al inicio."""
        response = self.client.post("/api/v1/auth/login/", json={
            "email": "loadtest@example.com",
            "password": "testpass123",
        })
        token = response.json()["access"]
        self.client.headers = {"Authorization": f"Bearer {token}"}

    @task(10)
    def list_items(self):
        self.client.get("/api/v1/items/")

    @task(5)
    def get_item(self):
        self.client.get("/api/v1/items/1/")

    @task(2)
    def search_items(self):
        self.client.get("/api/v1/items/?search=test")

    @task(1)
    def create_item(self):
        self.client.post("/api/v1/items/", json={
            "name": "Load Test Item",
            "value": "99.99",
        })
```

```bash
# Ejecutar locust
locust -f locustfile.py --headless -u 100 -r 10 -t 60s --host http://localhost:8000
# -u 100: 100 usuarios concurrentes
# -r 10: spawn rate (10 usuarios/segundo)
# -t 60s: duración del test
```

### assertNumQueries en tests

```python
class PerformanceTest(TestCase):
    def test_list_endpoint_query_count(self):
        """Asegurar que list no tiene N+1."""
        user = UserFactory()
        ItemFactory.create_batch(20, created_by=user)

        client = APIClient()
        client.force_authenticate(user=user)

        # Esperamos: 1 count + 1 items (con select_related) = 2 queries
        with self.assertNumQueries(2):
            response = client.get("/api/v1/items/")
            self.assertEqual(response.status_code, 200)

    def test_detail_endpoint_query_count(self):
        item = ItemFactory()
        client = APIClient()
        client.force_authenticate(user=item.created_by)

        with self.assertNumQueries(2):
            response = client.get(f"/api/v1/items/{item.pk}/")
            self.assertEqual(response.status_code, 200)
```

### Performance benchmarking

```python
import time
from django.test import TestCase


class BenchmarkTest(TestCase):
    def test_list_response_time(self):
        """Response time debe ser < 200ms con 1000 items."""
        ItemFactory.create_batch(1000)
        client = APIClient()
        client.force_authenticate(user=UserFactory())

        start = time.monotonic()
        response = client.get("/api/v1/items/")
        duration_ms = (time.monotonic() - start) * 1000

        self.assertEqual(response.status_code, 200)
        self.assertLess(duration_ms, 200, f"List took {duration_ms:.0f}ms (> 200ms)")

    def test_serializer_performance(self):
        """Serialización de 100 items debe ser < 50ms."""
        items = ItemFactory.create_batch(100)

        start = time.monotonic()
        serializer = ItemListSerializer(items, many=True)
        _ = serializer.data
        duration_ms = (time.monotonic() - start) * 1000

        self.assertLess(duration_ms, 50, f"Serialization took {duration_ms:.0f}ms")
```

---

## Best Practices Checklist

```
Performance Checklist:
□ select_related() para ForeignKey/OneToOne en list endpoints
□ prefetch_related() para ManyToMany/reverse FK
□ Serializers separados para list vs detail vs write
□ Indexes en campos usados en WHERE, ORDER BY, JOIN
□ CursorPagination para datasets > 100k filas
□ Cache para datos que cambian poco (stats, config, catálogos)
□ Background tasks para operaciones > 200ms
□ iterator() para procesar datasets grandes
□ bulk_create/bulk_update para operaciones batch
□ only()/defer() para excluir campos pesados en list

Scalability Checklist:
□ Aplicación stateless (sessions en Redis, files en S3)
□ Connection pooling (PgBouncer o CONN_MAX_AGE)
□ Redis para cache y Celery broker
□ ASGI con uvicorn para async endpoints
□ Gunicorn workers = 2*CPU + 1
□ Read replicas para queries de lectura pesadas
□ Rate limiting en todos los endpoints
□ Monitoring de response times y query counts
□ Health check endpoint para load balancer
□ Graceful shutdown en deployment

Database Performance Targets:
□ Queries por request: < 10
□ Avg query time: < 50ms
□ No queries > 500ms
□ API response time p95: < 500ms
□ API response time p99: < 1000ms
```

## Anti-patterns de performance

```python
# MAL: Count en cada request de list
class ItemViewSet(ModelViewSet):
    def list(self, request):
        items = self.get_queryset()
        total = items.count()  # COUNT(*) query separado

# BIEN: Omitir count o usar estimate (ver pagination)

# MAL: Cargar objetos completos para verificar existencia
if Item.objects.filter(code="ABC").first():
    pass
# BIEN:
if Item.objects.filter(code="ABC").exists():
    pass

# MAL: Obtener valores con objects completos
names = [item.name for item in Item.objects.all()]
# BIEN:
names = list(Item.objects.values_list("name", flat=True))

# MAL: Actualizar uno por uno
for item in items:
    item.status = "archived"
    item.save()
# BIEN:
Item.objects.filter(id__in=item_ids).update(status="archived")

# MAL: No usar transacciones para operaciones múltiples
def create_order(data):
    order = Order.objects.create(**data)
    for item_data in data["items"]:
        OrderItem.objects.create(order=order, **item_data)
# BIEN:
from django.db import transaction

@transaction.atomic
def create_order(data):
    order = Order.objects.create(**data)
    OrderItem.objects.bulk_create([
        OrderItem(order=order, **item_data)
        for item_data in data["items"]
    ])
```
