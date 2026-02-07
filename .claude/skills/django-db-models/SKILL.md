---
name: django-db-models
description: >
  Patrones y mejores prácticas para diseño de modelos Django, optimización de queries y features
  de PostgreSQL. Usar cuando se trabaje con models, querysets, migrations, indexes, transactions,
  JSONField, ArrayField, full-text search o performance de base de datos en Django.
---

# Database & Models con Django y PostgreSQL

## 1. Model Design Patterns

### Abstract base models para campos comunes

```python
from django.db import models


class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])


class BaseModel(TimestampMixin, SoftDeleteMixin):
    """Base para todos los modelos del proyecto."""

    class Meta:
        abstract = True


class Item(BaseModel):
    name = models.CharField(max_length=255)
    # hereda created_at, updated_at, is_deleted, deleted_at
```

### Model inheritance

```python
# Abstract: no crea tabla, solo hereda campos
class BaseEntity(models.Model):
    name = models.CharField(max_length=255)

    class Meta:
        abstract = True


# Multi-table: crea tabla por modelo con JOIN implícito (evitar si es posible)
class Place(models.Model):
    name = models.CharField(max_length=255)

class Restaurant(Place):  # crea tabla con FK a Place
    cuisine = models.CharField(max_length=100)


# Proxy: misma tabla, diferente comportamiento en Python
class ArchivedItem(Item):
    class Meta:
        proxy = True

    class ArchivedManager(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(is_deleted=True)

    objects = ArchivedManager()
```

### Choices con TextChoices e IntegerChoices

```python
class Item(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        ACTIVE = "active", "Activo"
        ARCHIVED = "archived", "Archivado"

    class Priority(models.IntegerChoices):
        LOW = 1, "Baja"
        MEDIUM = 2, "Media"
        HIGH = 3, "Alta"

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    priority = models.IntegerField(
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

# Uso
item = Item(status=Item.Status.ACTIVE)
Item.objects.filter(status=Item.Status.ACTIVE)
```

### Custom managers y querysets

```python
class ItemQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_deleted=False, status=Item.Status.ACTIVE)

    def by_priority(self, priority: int):
        return self.filter(priority=priority)

    def with_related(self):
        return self.select_related("category").prefetch_related("tags")

    def recent(self, days: int = 7):
        from django.utils import timezone
        cutoff = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created_at__gte=cutoff)


class ItemManager(models.Manager):
    def get_queryset(self) -> ItemQuerySet:
        return ItemQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def recent(self, days: int = 7):
        return self.get_queryset().recent(days)


class Item(BaseModel):
    name = models.CharField(max_length=255)
    objects = ItemManager()

# Encadenamiento fluido
Item.objects.active().by_priority(3).recent(30)
```

### Meta options importantes

```python
class Item(BaseModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    category = models.ForeignKey("Category", on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "items"

        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["category", "-value"]),
            models.Index(
                fields=["status"],
                name="active_items_idx",
                condition=models.Q(is_deleted=False),  # partial index
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["code", "category"],
                name="unique_code_per_category",
            ),
            models.CheckConstraint(
                check=models.Q(value__gte=0),
                name="value_non_negative",
            ),
        ]
```

## 2. Query Optimization

### select_related vs prefetch_related

```python
# select_related: JOIN en SQL, para ForeignKey y OneToOne
items = Item.objects.select_related("category", "category__parent")

# prefetch_related: query separada + join en Python, para ManyToMany y reverse FK
items = Item.objects.prefetch_related("tags", "comments")

# Combinar ambos
items = (
    Item.objects
    .select_related("category")
    .prefetch_related("tags")
)
```

### Prefetch objects customizados

```python
from django.db.models import Prefetch

items = Item.objects.prefetch_related(
    Prefetch(
        "comments",
        queryset=Comment.objects.filter(is_approved=True).order_by("-created_at")[:5],
        to_attr="recent_comments",  # acceder como item.recent_comments (lista)
    ),
    Prefetch(
        "tags",
        queryset=Tag.objects.filter(is_active=True),
        to_attr="active_tags",
    ),
)

for item in items:
    print(item.recent_comments)  # lista, no queryset
    print(item.active_tags)
```

### only() y defer()

```python
# only(): trae SOLO los campos especificados
items = Item.objects.only("id", "name", "status")

# defer(): trae todo EXCEPTO los campos especificados
items = Item.objects.defer("description", "metadata")

# Acceder a un campo diferido genera una query extra (cuidado)
```

### annotate() y aggregate()

```python
from django.db.models import Count, Sum, Avg, Max, Min, F, Value
from django.db.models.functions import Coalesce

# aggregate: retorna un dict con el resultado
totals = Item.objects.aggregate(
    total=Count("id"),
    avg_value=Avg("value"),
    max_value=Max("value"),
)
# {"total": 150, "avg_value": 45.30, "max_value": 999.99}

# annotate: agrega campo calculado a cada objeto del queryset
categories = Category.objects.annotate(
    item_count=Count("items"),
    total_value=Coalesce(Sum("items__value"), Value(0)),
    avg_value=Avg("items__value"),
).filter(item_count__gt=0).order_by("-item_count")

for cat in categories:
    print(f"{cat.name}: {cat.item_count} items, total: {cat.total_value}")
```

### Subqueries y F() expressions

```python
from django.db.models import Subquery, OuterRef, F

# F() para referenciar campos del modelo en queries
Item.objects.filter(updated_at__gt=F("created_at"))
Item.objects.update(value=F("value") * 1.1)  # incrementar 10%

# Subquery
latest_comment = (
    Comment.objects
    .filter(item=OuterRef("pk"))
    .order_by("-created_at")
    .values("text")[:1]
)

items = Item.objects.annotate(
    latest_comment=Subquery(latest_comment),
)
```

### Q objects para queries complejas

```python
from django.db.models import Q

# OR
items = Item.objects.filter(
    Q(status="active") | Q(status="draft")
)

# AND + OR combinados
items = Item.objects.filter(
    Q(category__name="electronics") & (Q(value__gte=100) | Q(priority=3))
)

# NOT
items = Item.objects.filter(~Q(status="archived"))

# Construcción dinámica
filters = Q()
if name:
    filters &= Q(name__icontains=name)
if min_value:
    filters &= Q(value__gte=min_value)
if status_list:
    filters &= Q(status__in=status_list)

items = Item.objects.filter(filters)
```

### exists() vs count() vs len()

```python
# exists(): para saber si HAY resultados (lo más eficiente)
if Item.objects.filter(status="active").exists():
    pass  # SELECT 1 ... LIMIT 1

# count(): para saber CUÁNTOS hay (query COUNT)
total = Item.objects.filter(status="active").count()  # SELECT COUNT(*)

# len(): EVITAR, evalúa todo el queryset en memoria
total = len(Item.objects.filter(status="active"))  # carga todos los objetos

# Para verificar vacío, siempre exists() sobre count() > 0
if qs.exists():  # BIEN
    pass
if qs.count() > 0:  # MAL: más lento que exists()
    pass
```

## 3. Database Indexes

### Index types

```python
from django.contrib.postgres.indexes import (
    BTreeIndex,   # default, para =, <, >, BETWEEN, ORDER BY
    GinIndex,     # para JSONField, ArrayField, full-text search
    GistIndex,    # para rangos, geoespacial, full-text search
    HashIndex,    # solo para igualdad exacta (=)
)


class Item(models.Model):
    name = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict)
    tags = ArrayField(models.CharField(max_length=50), default=list)
    search_vector = SearchVectorField(null=True)

    class Meta:
        indexes = [
            # B-tree (default): búsquedas, rangos, ordenamiento
            BTreeIndex(fields=["name"]),

            # GIN: para JSONField y ArrayField
            GinIndex(fields=["metadata"]),
            GinIndex(fields=["tags"]),

            # GIN para full-text search
            GinIndex(fields=["search_vector"]),

            # Composite: para queries que filtran por ambos campos
            models.Index(fields=["status", "created_at"]),

            # Partial: solo indexa registros que cumplen la condición
            models.Index(
                fields=["status"],
                name="active_status_idx",
                condition=Q(is_deleted=False),
            ),
        ]
```

### db_index vs Meta.indexes

```python
# db_index: simple, un campo, B-tree
code = models.CharField(max_length=50, db_index=True)

# Meta.indexes: para composite, partial, o tipos específicos (GIN, GiST)
# Preferir Meta.indexes para mayor control
```

### Cuándo usar indexes

```
AGREGAR index cuando:
  - Campos usados frecuentemente en WHERE / filter()
  - Campos usados en ORDER BY
  - ForeignKey (Django lo crea automáticamente)
  - Campos en UniqueConstraint

NO agregar index cuando:
  - Tablas pequeñas (< 1000 filas)
  - Campos con baja cardinalidad (ej: booleanos solos)
  - Tablas con más escrituras que lecturas
  - Ya existe un composite index que cubre el campo
```

## 4. PostgreSQL-Specific Features

### JSONField

```python
class Record(models.Model):
    metadata = models.JSONField(default=dict, blank=True)

# Queries sobre JSON
Record.objects.filter(metadata__key="value")
Record.objects.filter(metadata__nested__deep="value")
Record.objects.filter(metadata__list__0="first_item")  # por índice
Record.objects.filter(metadata__has_key="important")
Record.objects.filter(metadata__has_any_keys=["a", "b"])
Record.objects.filter(metadata__has_keys=["a", "b"])  # tiene todos
Record.objects.filter(metadata__contained_by={"a": 1, "b": 2})
Record.objects.filter(metadata__contains={"status": "ok"})

# Extraer valor JSON como anotación
from django.db.models.functions import Cast
from django.db.models import TextField

Record.objects.annotate(
    config_value=Cast("metadata__config__threshold", output_field=TextField())
)
```

### ArrayField

```python
from django.contrib.postgres.fields import ArrayField


class Record(models.Model):
    tags = ArrayField(
        models.CharField(max_length=50),
        default=list,
        blank=True,
        size=20,
    )
    scores = ArrayField(
        models.IntegerField(),
        default=list,
    )

# Queries
Record.objects.filter(tags__contains=["python"])       # contiene elemento
Record.objects.filter(tags__contained_by=["a", "b"])   # subconjunto de
Record.objects.filter(tags__overlap=["python", "go"])   # intersección
Record.objects.filter(tags__len=3)                      # longitud exacta
Record.objects.filter(scores__0=100)                    # por índice
Record.objects.filter(tags__0_2=["a", "b"])             # slice [0:2]
```

### Full-text search

```python
from django.contrib.postgres.search import (
    SearchVector,
    SearchQuery,
    SearchRank,
    TrigramSimilarity,
)

# Búsqueda básica
Record.objects.annotate(
    search=SearchVector("name", "description"),
).filter(search="término búsqueda")

# Con ranking
vector = SearchVector("name", weight="A") + SearchVector("description", weight="B")
query = SearchQuery("término", config="spanish")

results = (
    Record.objects
    .annotate(search=vector, rank=SearchRank(vector, query))
    .filter(search=query)
    .order_by("-rank")
)

# SearchVectorField para performance (pre-computado)
class Record(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    search_vector = SearchVectorField(null=True)

    class Meta:
        indexes = [GinIndex(fields=["search_vector"])]

# Actualizar vector con trigger o signal
from django.contrib.postgres.search import SearchVector

Record.objects.update(
    search_vector=SearchVector("name", weight="A", config="spanish")
    + SearchVector("description", weight="B", config="spanish")
)

# Trigram similarity (requiere pg_trgm extension)
Record.objects.annotate(
    similarity=TrigramSimilarity("name", "busqueda"),
).filter(similarity__gt=0.3).order_by("-similarity")
```

### Custom constraints

```python
from django.db.models import Q, UniqueConstraint, CheckConstraint


class Record(models.Model):
    code = models.CharField(max_length=50)
    status = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField(null=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        constraints = [
            # Unique condicional (solo activos)
            UniqueConstraint(
                fields=["code"],
                condition=Q(status="active"),
                name="unique_active_code",
            ),

            # Check: end_date > start_date
            CheckConstraint(
                check=Q(end_date__gt=F("start_date")) | Q(end_date__isnull=True),
                name="valid_date_range",
            ),

            # Check: valor positivo
            CheckConstraint(
                check=Q(value__gte=0),
                name="non_negative_value",
            ),
        ]
```

## 5. Migrations Best Practices

### Data migrations seguras

```python
# python manage.py makemigrations --empty app_name -n descriptive_name

from django.db import migrations


def populate_defaults(apps, schema_editor):
    Item = apps.get_model("app_name", "Item")
    # Usar batch para evitar OOM en tablas grandes
    batch_size = 1000
    items = Item.objects.filter(status="").iterator(chunk_size=batch_size)
    to_update = []
    for item in items:
        item.status = "draft"
        to_update.append(item)
        if len(to_update) >= batch_size:
            Item.objects.bulk_update(to_update, ["status"])
            to_update = []
    if to_update:
        Item.objects.bulk_update(to_update, ["status"])


def reverse_populate(apps, schema_editor):
    pass  # noop o lógica reversa


class Migration(migrations.Migration):
    dependencies = [("app_name", "0005_previous")]

    operations = [
        migrations.RunPython(
            populate_defaults,
            reverse_populate,  # siempre proveer reversa
        ),
    ]
```

### Zero-downtime migrations

```python
# SEGURO en producción:
# - AddField con null=True o default
# - CreateModel
# - AddIndex (concurrently en PostgreSQL)
# - Data migrations

# PELIGROSO (causa locks):
# - RemoveField en tablas grandes
# - AlterField que cambia tipo
# - AddField NOT NULL sin default
# - RenameField / RenameModel

# Patrón seguro para agregar NOT NULL:
# Paso 1: AddField con null=True
# Paso 2: Data migration para llenar valores
# Paso 3: AlterField a null=False con default

# AddIndex concurrently (evita lock en tabla grande)
from django.contrib.postgres.operations import AddIndexConcurrently


class Migration(migrations.Migration):
    atomic = False  # requerido para concurrently

    operations = [
        AddIndexConcurrently(
            model_name="item",
            index=models.Index(fields=["status"], name="item_status_idx"),
        ),
    ]
```

### RunSQL para operaciones específicas de PostgreSQL

```python
class Migration(migrations.Migration):
    operations = [
        migrations.RunSQL(
            sql="CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            reverse_sql="DROP EXTENSION IF EXISTS pg_trgm;",
        ),
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_item_name_trgm
                ON app_item USING gin (name gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS idx_item_name_trgm;",
            state_operations=[],  # no afecta el estado de Django
        ),
    ]
```

### Squashing migrations

```bash
# Combinar migrations 0001 a 0010 en una sola
python manage.py squashmigrations app_name 0001 0010

# Después: eliminar el replaces=[] del archivo squashed
# y borrar las migrations originales cuando todo esté aplicado
```

## 6. Transactions & Atomicity

### transaction.atomic()

```python
from django.db import transaction


# Como decorator
@transaction.atomic
def transfer_value(source_id: int, target_id: int, amount: int) -> None:
    source = Item.objects.select_for_update().get(pk=source_id)
    target = Item.objects.select_for_update().get(pk=target_id)
    source.value = F("value") - amount
    target.value = F("value") + amount
    source.save(update_fields=["value"])
    target.save(update_fields=["value"])


# Como context manager (más granular)
def process_batch(items_data: list[dict]) -> list:
    created = []
    for data in items_data:
        try:
            with transaction.atomic():
                item = Item.objects.create(**data)
                Log.objects.create(action="created", item=item)
                created.append(item)
        except Exception:
            continue  # este item falla, los demás continúan
    return created


# Savepoints (nested atomic)
with transaction.atomic():  # savepoint
    Item.objects.create(name="A")
    try:
        with transaction.atomic():  # nested savepoint
            Item.objects.create(name="B")
            raise ValueError("rollback solo B")
    except ValueError:
        pass  # A persiste, B se revirtió
```

### select_for_update()

```python
from django.db import transaction


@transaction.atomic
def reserve_item(item_id: int) -> "Item":
    # Bloquea la fila hasta que termine la transacción
    item = Item.objects.select_for_update().get(pk=item_id)

    if item.status != "available":
        raise ValueError("Item no disponible")

    item.status = "reserved"
    item.save(update_fields=["status"])
    return item


# skip_locked: ignora filas bloqueadas (útil para job queues)
next_item = (
    Item.objects
    .select_for_update(skip_locked=True)
    .filter(status="pending")
    .first()
)

# nowait: lanza error si la fila está bloqueada
try:
    item = Item.objects.select_for_update(nowait=True).get(pk=item_id)
except DatabaseError:
    pass  # la fila está bloqueada por otra transacción
```

## 7. Performance Patterns

### bulk_create() y bulk_update()

```python
# bulk_create: insertar muchos registros en una sola query
items = [Item(name=f"Item {i}", value=i * 10) for i in range(1000)]
Item.objects.bulk_create(items, batch_size=500)

# bulk_create con ignore_conflicts
Item.objects.bulk_create(items, ignore_conflicts=True)

# bulk_create con update_conflicts (upsert)
Item.objects.bulk_create(
    items,
    update_conflicts=True,
    unique_fields=["code"],
    update_fields=["name", "value"],
)

# bulk_update
items = Item.objects.filter(status="draft")
for item in items:
    item.status = "active"
Item.objects.bulk_update(items, ["status"], batch_size=500)
```

### iterator() para datasets grandes

```python
# Sin iterator: carga todo en memoria
for item in Item.objects.all():  # OOM en tablas grandes
    process(item)

# Con iterator: procesa en chunks
for item in Item.objects.all().iterator(chunk_size=2000):
    process(item)

# Combinar con only() para reducir aún más la memoria
for item in Item.objects.only("id", "name").iterator(chunk_size=2000):
    process(item)
```

### Raw queries

```python
# Cuando el ORM no es suficiente
items = Item.objects.raw(
    """
    SELECT i.*, COUNT(c.id) as comment_count
    FROM app_item i
    LEFT JOIN app_comment c ON c.item_id = i.id
    WHERE i.status = %s
    GROUP BY i.id
    HAVING COUNT(c.id) > %s
    ORDER BY comment_count DESC
    """,
    ["active", 5],
)

# Query completamente custom con cursor
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        "SELECT status, COUNT(*) FROM app_item GROUP BY status"
    )
    results = dict(cursor.fetchall())
```

### Query debugging

```python
# Ver la SQL generada por un queryset
qs = Item.objects.filter(status="active").select_related("category")
print(qs.query)

# Contar queries en un bloque
from django.test.utils import override_settings
from django.db import connection, reset_queries

reset_queries()
# ... código ...
print(f"Queries ejecutadas: {len(connection.queries)}")

# En tests: assertNumQueries
class ItemTest(TestCase):
    def test_list_items(self):
        with self.assertNumQueries(2):  # exactamente 2 queries
            list(Item.objects.select_related("category").all())
```

## 8. Common Pitfalls

```python
# --- N+1 Query Problem ---
# MAL: cada iteración genera una query extra
for item in Item.objects.all():
    print(item.category.name)  # query por cada item

# BIEN:
for item in Item.objects.select_related("category"):
    print(item.category.name)  # una sola query con JOIN


# --- Memory con querysets grandes ---
# MAL: carga todo en memoria
all_items = list(Item.objects.all())  # OOM

# BIEN:
for item in Item.objects.iterator(chunk_size=2000):
    process(item)


# --- update() vs save() ---
# MAL: trae objeto, modifica, guarda (2 queries)
item = Item.objects.get(pk=1)
item.counter += 1
item.save()  # race condition posible

# BIEN: update directo (1 query, atómico)
Item.objects.filter(pk=1).update(counter=F("counter") + 1)


# --- Evaluar queryset múltiples veces ---
# MAL: ejecuta la query dos veces
qs = Item.objects.filter(status="active")
total = qs.count()      # query 1
items = list(qs)         # query 2

# BIEN: evaluar una vez si necesitas ambos
items = list(qs)
total = len(items)       # usa la lista ya cargada


# --- Migrations que causan downtime ---
# MAL: agregar NOT NULL sin default en tabla grande
# operations = [AddField("item", "code", CharField(max_length=50))]

# BIEN: 3 pasos
# 1. AddField con null=True
# 2. Data migration para llenar
# 3. AlterField a null=False


# --- Lazy evaluation inesperada ---
# MAL: queryset en default de función (se evalúa una vez)
def get_items(qs=Item.objects.all()):  # evaluado al importar
    return qs

# BIEN:
def get_items(qs=None):
    if qs is None:
        qs = Item.objects.all()
    return qs
```
