---
name: drf-docs
description: |
  Django REST Framework API documentation guide using OpenAPI/Swagger with drf-spectacular. Use this skill when:
  - Setting up automatic API documentation (OpenAPI 3.0 schema generation)
  - Implementing SwaggerUI or ReDoc for interactive API docs
  - Writing docstrings for views/viewsets with @extend_schema decorator
  - Documenting request/response examples, parameters, error responses
  - Customizing OpenAPI schema (tags, categories, examples, status codes)
  - Creating project documentation (README, authentication flows, versioning)
  - Configuring SPECTACULAR_SETTINGS for production-ready docs
  - Adding inline code documentation and API usage guides
license: MIT
---

# Django REST Framework - API Documentation

Professional API documentation using OpenAPI 3.0/Swagger with automatic schema generation via drf-spectacular.

## When to Use This Skill

Invoke this skill when you need to:

**Setup Documentation**:
- Install and configure drf-spectacular for OpenAPI schema generation
- Set up SwaggerUI or ReDoc for interactive API documentation
- Configure SPECTACULAR_SETTINGS for production

**Document Endpoints**:
- Write docstrings for views/viewsets with proper formatting
- Use `@extend_schema` decorator for detailed endpoint documentation
- Document request/response examples with OpenApiExample
- Specify query parameters, path parameters, and request bodies

**Customize Schema**:
- Create custom tags and categories for endpoint organization
- Document error responses and status codes
- Add serializer field documentation (help_text, examples)
- Configure authentication and security schemes

**Project Documentation**:
- Structure comprehensive README.md files
- Document API versioning and migration guides
- Create authentication flow diagrams
- Write inline code documentation and usage examples

## How to Use This Skill

This skill is organized into specialized modules. Click on any module below to access detailed documentation:

---

## 📚 Documentation Modules

| Module | Content | Use When |
|--------|---------|----------|
| **[OpenAPI/Swagger Setup](./openapi-spectacular.md)** | Installation, configuration, SPECTACULAR_SETTINGS, SwaggerUI/ReDoc integration | Setting up automatic API documentation from scratch |
| **[Docstrings & Schema](./docstrings-views.md)** | @extend_schema decorator, docstring formatting, request/response examples, parameters | Documenting individual endpoints and ViewSets |
| **[Schema Customization](./schema-customization.md)** | Tags, categories, OpenApiExample, error responses, serializer docs | Customizing OpenAPI schema appearance and content |
| **[Project Documentation](./project-docs.md)** | README structure, versioning docs, auth flows, testing guides | Creating comprehensive project-level documentation |

---

## Quick Start Guide

### 1. Installation

```bash
pip install drf-spectacular
```

### 2. Basic Configuration

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'drf_spectacular',
]

REST_FRAMEWORK = {
    # Use drf-spectacular for automatic schema generation
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'My API',
    'DESCRIPTION': 'API description with **markdown** support',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,  # Don't include schema endpoint in docs
    'COMPONENT_SPLIT_REQUEST': True,  # Separate request/response schemas
}

# urls.py
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # OpenAPI schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # SwaggerUI (interactive docs)
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ReDoc (clean, three-panel design)
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
```

### 3. Document Your First Endpoint

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

class ArticleViewSet(ModelViewSet):
    """
    ViewSet for managing articles.

    Provides CRUD operations for blog articles with filtering and pagination.
    """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    @extend_schema(
        summary="List all articles",
        description="Returns a paginated list of published articles. Supports filtering by author and category.",
        tags=['Articles'],
        parameters=[
            OpenApiParameter(
                name='author',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by author username',
            ),
            OpenApiParameter(
                name='category',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by category slug',
            ),
        ],
        responses={
            200: ArticleSerializer(many=True),
            400: OpenApiExample(
                'Bad Request',
                value={'error': 'Invalid query parameters'},
                response_only=True,
            ),
        },
    )
    def list(self, request):
        """List articles with optional filtering."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
```

### 4. Access Your Documentation

After running `python manage.py runserver`, visit:
- **SwaggerUI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema (JSON)**: http://localhost:8000/api/schema/

---

## Documentation Best Practices

### ✅ Essential Guidelines

**Schema Configuration**:
- Use descriptive `TITLE` and `VERSION` in SPECTACULAR_SETTINGS
- Set `COMPONENT_SPLIT_REQUEST: True` for cleaner request/response schemas
- Configure `SERVE_INCLUDE_SCHEMA: False` to hide schema endpoint from docs
- Add `SERVERS` list for multiple environments (dev, staging, prod)

**Endpoint Documentation**:
- Always use `@extend_schema` decorator for CRUD operations
- Provide clear `summary` (short) and `description` (detailed) for each endpoint
- Use `tags` to organize endpoints by resource/feature
- Document all query parameters with `OpenApiParameter`
- Include request/response examples with `OpenApiExample`

**Serializer Documentation**:
- Add `help_text` to all serializer fields for field-level documentation
- Use `validators` with clear error messages
- Set appropriate `required`, `allow_null`, and `allow_blank` attributes
- Document nested serializers and relationships

**Response Documentation**:
- Document all possible status codes (200, 201, 400, 401, 403, 404, 500)
- Provide example responses for success and error cases
- Use consistent error response format across all endpoints
- Document pagination structure (count, next, previous, results)

**Security & Authentication**:
- Configure security schemes in SPECTACULAR_SETTINGS
- Document authentication requirements for each endpoint
- Specify required permissions in endpoint descriptions
- Document token refresh flows and expiration

### 📋 Quick Checklist

Before deploying your API docs:
- [ ] All endpoints have `@extend_schema` decorators
- [ ] Summary and description provided for each endpoint
- [ ] Query parameters documented with types and descriptions
- [ ] Request/response examples included for complex operations
- [ ] Error responses documented (400, 401, 403, 404, 500)
- [ ] Authentication scheme configured and documented
- [ ] Tags used for logical grouping
- [ ] Serializer fields have help_text
- [ ] Version number updated in SPECTACULAR_SETTINGS
- [ ] README includes link to API docs

### 🔗 Related Skills

- **[drf-core-api](../drf-core-api/)**: Serializers, viewsets, routers, permissions
- **[drf-testing](../drf-testing/)**: API testing patterns and best practices
- **[drf-utils](../drf-utils/)**: Management commands, signals, logging
- **[drf-auth](../drf-auth/)**: Authentication and authorization patterns

---

## Additional Resources

- **drf-spectacular Documentation**: https://drf-spectacular.readthedocs.io/
- **OpenAPI 3.0 Specification**: https://spec.openapis.org/oas/v3.0.3
- **SwaggerUI**: https://swagger.io/tools/swagger-ui/
- **ReDoc**: https://redocly.com/redoc/

---

**Last Updated**: 2026-02
**Version**: 2.0
**License**: MIT
