# Serializer Performance & API Response Optimization

## Serializer Performance

### Serializer optimization techniques

```python
# 1. Usar serializers separados para list vs detail
class ItemListSerializer(serializers.ModelSerializer):
    """Serializer ligero para list endpoints."""
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Item
        fields = ["id", "name", "status", "category_name"]


class ItemDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para retrieve."""
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Item
        fields = "__all__"


# 2. Usar get_serializer_class() en el ViewSet
class ItemViewSet(ModelViewSet):
    def get_serializer_class(self):
        if self.action == "list":
            return ItemListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return ItemWriteSerializer
        return ItemDetailSerializer
```

### to_representation() optimization

```python
class ItemListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "status", "value", "category_id"]

    def to_representation(self, instance):
        """Override para evitar overhead de fields individuales."""
        return {
            "id": instance.id,
            "name": instance.name,
            "status": instance.status,
            "value": str(instance.value),
            "category_id": instance.category_id,
        }
        # ~30% más rápido que el to_representation() default en listas grandes
```

### Avoid N+1 en nested serializers

```python
# MAL: N+1 por cada SerializerMethodField que accede a relaciones
class ItemSerializer(serializers.ModelSerializer):
    tags_count = serializers.SerializerMethodField()

    def get_tags_count(self, obj):
        return obj.tags.count()  # 1 query por item!

# BIEN: annotate en el queryset
class ItemViewSet(ModelViewSet):
    def get_queryset(self):
        return Item.objects.annotate(
            tags_count=Count("tags"),
            reviews_avg=Avg("reviews__score"),
        )


class ItemSerializer(serializers.ModelSerializer):
    tags_count = serializers.IntegerField(read_only=True)
    reviews_avg = serializers.FloatField(read_only=True)

    class Meta:
        model = Item
        fields = ["id", "name", "tags_count", "reviews_avg"]
```

### Read-only serializers para list endpoints

```python
# Para endpoints que solo leen, evitar overhead de validación
class ItemReadOnlySerializer(serializers.Serializer):
    """Serializer sin model binding, máxima velocidad."""
    id = serializers.IntegerField()
    name = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()

    # No tiene Meta.model, no tiene create/update
    # ~20% más rápido que ModelSerializer para lecturas
```

---

## API Response Optimization

### Response compression

```python
# settings.py
MIDDLEWARE = [
    "django.middleware.gzip.GZipMiddleware",  # primero en la lista
    # ...
]
```

### Field selection patterns

```python
from rest_framework import serializers


class DynamicFieldsSerializer(serializers.ModelSerializer):
    """Serializer que permite seleccionar campos via query param.
    GET /api/items/?fields=id,name,status
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            fields_param = request.query_params.get("fields")
            if fields_param:
                allowed = set(fields_param.split(","))
                existing = set(self.fields)
                for field_name in existing - allowed:
                    self.fields.pop(field_name)


class ItemSerializer(DynamicFieldsSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "status", "value", "description", "category", "created_at"]

# GET /api/items/?fields=id,name → {"id": 1, "name": "Item 1"}
```

### Sparse fieldsets con ViewSet

```python
class ItemViewSet(ModelViewSet):
    def get_queryset(self):
        qs = Item.objects.all()
        fields_param = self.request.query_params.get("fields")
        if fields_param and self.action == "list":
            fields = [f.strip() for f in fields_param.split(",")]
            db_fields = [f for f in fields if hasattr(Item, f)]
            if db_fields:
                qs = qs.only(*db_fields)
        return qs
```
