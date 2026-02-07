---
name: drf-core-api
description: >
  Patrones y mejores prácticas para desarrollar APIs REST con Django REST Framework y PostgreSQL.
  Usar cuando se trabaje con serializers, viewsets, routers, permissions, filtering, pagination
  o response patterns en DRF. Incluye ejemplos de código listos para copiar.
---

# Core API Development con Django REST Framework

## 1. Serializers Patterns

### Serializer básico vs ModelSerializer

```python
from rest_framework import serializers

# Serializer básico: control total sobre los campos
class ItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    value = serializers.DecimalField(max_digits=10, decimal_places=2)

    def create(self, validated_data: dict) -> "Item":
        return Item.objects.create(**validated_data)

    def update(self, instance: "Item", validated_data: dict) -> "Item":
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


# ModelSerializer: genera campos automáticamente desde el modelo
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "value", "created_at"]
        read_only_fields = ["id", "created_at"]
```

### Nested serializers y relaciones

```python
class DetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detail
        fields = ["id", "description", "quantity"]


class ParentSerializer(serializers.ModelSerializer):
    details = DetailSerializer(many=True, read_only=True)
    detail_ids = serializers.PrimaryKeyRelatedField(
        queryset=Detail.objects.all(),
        many=True,
        write_only=True,
        source="details",
    )

    class Meta:
        model = Parent
        fields = ["id", "name", "details", "detail_ids"]
```

### Custom fields y validaciones

```python
class EntrySerializer(serializers.ModelSerializer):
    display_label = serializers.SerializerMethodField()

    class Meta:
        model = Entry
        fields = ["id", "name", "code", "status", "display_label"]

    def get_display_label(self, obj: "Entry") -> str:
        return f"{obj.code} - {obj.name}"

    def validate_code(self, value: str) -> str:
        if not value.isalnum():
            raise serializers.ValidationError("El código debe ser alfanumérico.")
        return value.upper()

    def validate(self, attrs: dict) -> dict:
        if attrs.get("start_date") and attrs.get("end_date"):
            if attrs["start_date"] >= attrs["end_date"]:
                raise serializers.ValidationError(
                    "start_date debe ser anterior a end_date."
                )
        return attrs
```

### create() y update() customizados

```python
class CompositeSerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True)

    class Meta:
        model = Composite
        fields = ["id", "title", "items"]

    def create(self, validated_data: dict) -> "Composite":
        items_data = validated_data.pop("items")
        composite = Composite.objects.create(**validated_data)
        for item_data in items_data:
            Item.objects.create(composite=composite, **item_data)
        return composite

    def update(self, instance: "Composite", validated_data: dict) -> "Composite":
        items_data = validated_data.pop("items", None)
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                Item.objects.create(composite=instance, **item_data)
        return instance
```

## 2. ViewSets y Views

### ModelViewSet: CRUD completo

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            qs = qs.select_related("category").prefetch_related("tags")
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ItemListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return ItemWriteSerializer
        return ItemDetailSerializer
```

### GenericViewSet con mixins

```python
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin


class ReadOnlyItemViewSet(
    ListModelMixin,
    RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
```

### Custom actions con @action

```python
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    # POST /items/{pk}/activate/
    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        item = self.get_object()
        item.is_active = True
        item.save(update_fields=["is_active"])
        return Response({"status": "activated"})

    # GET /items/summary/
    @action(detail=False, methods=["get"])
    def summary(self, request):
        total = self.get_queryset().count()
        active = self.get_queryset().filter(is_active=True).count()
        return Response({"total": total, "active": active})

    # Action con serializer propio
    @action(detail=True, methods=["post"], serializer_class=StatusSerializer)
    def change_status(self, request, pk=None):
        item = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item.status = serializer.validated_data["status"]
        item.save(update_fields=["status"])
        return Response(ItemSerializer(item).data)
```

### APIView para casos especiales

```python
from rest_framework.views import APIView


class StatsView(APIView):
    def get(self, request) -> Response:
        stats = {
            "total_items": Item.objects.count(),
            "total_active": Item.objects.filter(is_active=True).count(),
        }
        return Response(stats, status=status.HTTP_200_OK)
```

## 3. Routers y URL Patterns

### DefaultRouter vs SimpleRouter

```python
from rest_framework.routers import DefaultRouter, SimpleRouter

router = DefaultRouter()  # incluye API root view browsable
router.register(r"items", ItemViewSet, basename="item")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("api/v1/", include(router.urls)),
]
```

### Nested routes con drf-nested-routers

```python
from rest_framework_nested import routers

router = routers.DefaultRouter()
router.register(r"parents", ParentViewSet, basename="parent")

children_router = routers.NestedDefaultRouter(router, r"parents", lookup="parent")
children_router.register(r"children", ChildViewSet, basename="parent-children")

urlpatterns = [
    path("api/v1/", include(router.urls)),
    path("api/v1/", include(children_router.urls)),
]


class ChildViewSet(viewsets.ModelViewSet):
    serializer_class = ChildSerializer

    def get_queryset(self):
        return Child.objects.filter(parent_id=self.kwargs["parent_pk"])

    def perform_create(self, serializer):
        serializer.save(parent_id=self.kwargs["parent_pk"])
```

### API versioning

```python
# urls.py
urlpatterns = [
    path("api/v1/", include("apps.api.v1.urls")),
    path("api/v2/", include("apps.api.v2.urls")),
]

# settings.py
REST_FRAMEWORK = {
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "ALLOWED_VERSIONS": ["v1", "v2"],
    "DEFAULT_VERSION": "v1",
}
```

## 4. Permissions y Authentication

### Permission classes built-in y por acción

```python
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny


class ItemViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action in ["create"]:
            return [IsAuthenticated()]
        return [IsAdminUser()]
```

### Custom permission classes

```python
from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        return obj.created_by == request.user


class HasAPIKey(BasePermission):
    def has_permission(self, request, view) -> bool:
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return False
        return APIKey.objects.filter(key=api_key, is_active=True).exists()
```

### Combinación de permisos

```python
class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated & IsOwner]       # AND
    permission_classes = [IsAuthenticated | HasAPIKey]      # OR
```

## 5. Filtering, Pagination y Ordering

### django-filter integration

```python
import django_filters


class ItemFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr="icontains")
    min_value = django_filters.NumberFilter(field_name="value", lookup_expr="gte")
    max_value = django_filters.NumberFilter(field_name="value", lookup_expr="lte")
    created_after = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")

    class Meta:
        model = Item
        fields = ["status", "category", "is_active"]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filterset_class = ItemFilter
    search_fields = ["name", "description", "code"]
    ordering_fields = ["name", "value", "created_at"]
    ordering = ["-created_at"]
```

### Pagination

```python
from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class FlexiblePagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


class ItemViewSet(viewsets.ModelViewSet):
    pagination_class = StandardPagination
```

## 6. Response Patterns

### Envelope renderer

```python
from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response")
        envelope = {
            "success": response.status_code < 400,
            "data": data if response.status_code < 400 else None,
            "error": data if response.status_code >= 400 else None,
        }
        return super().render(envelope, accepted_media_type, renderer_context)
```

### Custom exception handler

```python
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context) -> Response | None:
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "success": False,
            "error": {"code": response.status_code, "detail": response.data},
            "data": None,
        }
    return response
```

### Status codes - referencia rápida

```
200 OK            -> GET exitoso, PUT/PATCH exitoso
201 Created       -> POST exitoso (recurso creado)
204 No Content    -> DELETE exitoso
400 Bad Request   -> Validación fallida
401 Unauthorized  -> No autenticado
403 Forbidden     -> Sin permisos
404 Not Found     -> Recurso no existe
409 Conflict      -> Conflicto de estado (duplicado, etc.)
```

## 7. Anti-patterns a Evitar

```python
# MAL: Queries N+1
queryset = Item.objects.all()
# BIEN:
queryset = Item.objects.select_related("category").prefetch_related("tags")

# MAL: Lógica de negocio en el serializer
class ItemSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        send_email(validated_data["name"])  # no pertenece aquí
        return super().create(validated_data)

# BIEN: Lógica en el ViewSet o service layer
class ItemViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        instance = serializer.save()
        NotificationService.notify_created(instance)

# MAL: Un solo serializer para todo
# BIEN: Serializers separados por acción (List, Detail, Write)

# MAL: .filter() sin índices
# BIEN: db_index=True en campos frecuentemente consultados
class Item(models.Model):
    code = models.CharField(max_length=50, db_index=True)
    status = models.CharField(max_length=20, db_index=True)

    class Meta:
        indexes = [models.Index(fields=["status", "created_at"])]
```

## Configuración base recomendada

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "100/hour", "user": "1000/hour"},
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
}
```
