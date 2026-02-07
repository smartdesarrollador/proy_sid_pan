# Django REST Framework - API Documentation

Patrones y mejores prácticas para documentar APIs REST de manera profesional y automática usando OpenAPI/Swagger.

**Cuándo usar**: Documentación de APIs, OpenAPI/Swagger setup, docstrings, schema generation, API versioning docs, README writing.

---

## Contenido

Este skill está organizado en los siguientes módulos:

### 📘 [1. OpenAPI/Swagger con drf-spectacular](./openapi-spectacular.md)
- Instalación y configuración completa
- SPECTACULAR_SETTINGS
- Schema generation automático
- SwaggerUI y ReDoc
- Customización avanzada

### 📝 [2. Docstrings en Views/ViewSets](./docstrings-views.md)
- Docstrings para autodocumentation
- Formato y estructura
- extend_schema decorator
- Request/response examples
- Parámetros y query strings

### 🎨 [3. Schema Customization & Examples](./schema-customization.md)
- Custom tags y categorías
- OpenApiExample usage
- Error response documentation
- Status codes documentation
- Serializer documentation (help_text, examples)

### 📚 [4. Project Documentation](./project-docs.md)
- README.md structure
- API versioning documentation
- Authentication flows
- Testing documentation
- Inline code documentation

---

## Quick Start

### Instalación

```bash
pip install drf-spectacular
```

### Configuración básica

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'My API',
    'DESCRIPTION': 'API description',
    'VERSION': '1.0.0',
}

# urls.py
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
```

### Docstring básico

```python
from drf_spectacular.utils import extend_schema

class ArticleViewSet(ModelViewSet):
    """
    ViewSet para gestionar artículos.

    Permite operaciones CRUD sobre artículos del blog.
    """

    @extend_schema(
        summary="Listar artículos",
        description="Retorna lista paginada de artículos publicados",
        tags=['Articles']
    )
    def list(self, request):
        pass
```

---

## Ver también

- **drf-core-api**: Patrones de serializers, viewsets, routers
- **drf-testing**: Testing de APIs
- **drf-utils**: Management commands, signals, logging

---

**Última actualización**: 2026-02
**Versión**: 1.0
