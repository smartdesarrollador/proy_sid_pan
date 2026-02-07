# Docstrings en Views/ViewSets

Cómo escribir docstrings efectivos y usar `extend_schema` para generar documentación automática de endpoints.

---

## Docstrings para ViewSets

### Formato Básico

```python
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema

class ArticleViewSet(ModelViewSet):
    """
    ViewSet para gestionar artículos del blog.

    Proporciona operaciones CRUD completas para artículos:
    - Listar artículos publicados
    - Crear nuevos artículos
    - Obtener detalle de un artículo
    - Actualizar artículos existentes
    - Eliminar artículos

    Todos los endpoints requieren autenticación excepto 'list' y 'retrieve'.
    """
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
```

### Documentar Acciones Específicas

```python
class ArticleViewSet(ModelViewSet):
    """ViewSet de artículos"""

    @extend_schema(
        summary="Listar artículos",
        description="""
        Retorna una lista paginada de artículos publicados.

        Los artículos están ordenados por fecha de publicación (más recientes primero).
        Soporta filtrado por categoría, autor y búsqueda por texto.
        """,
        tags=['Articles']
    )
    def list(self, request):
        """Lista todos los artículos publicados"""
        return super().list(request)

    @extend_schema(
        summary="Crear artículo",
        description="Crea un nuevo artículo. Requiere permisos de autor.",
        tags=['Articles']
    )
    def create(self, request):
        """Crea un nuevo artículo"""
        return super().create(request)

    @extend_schema(
        summary="Obtener artículo",
        description="Retorna el detalle completo de un artículo específico.",
        tags=['Articles']
    )
    def retrieve(self, request, pk=None):
        """Obtiene un artículo por ID"""
        return super().retrieve(request, pk)

    @extend_schema(
        summary="Actualizar artículo",
        description="Actualiza todos los campos de un artículo. Solo el autor puede actualizar.",
        tags=['Articles']
    )
    def update(self, request, pk=None):
        """Actualiza un artículo completo"""
        return super().update(request, pk)

    @extend_schema(
        summary="Actualizar parcialmente artículo",
        description="Actualiza campos específicos de un artículo.",
        tags=['Articles']
    )
    def partial_update(self, request, pk=None):
        """Actualiza campos específicos de un artículo"""
        return super().partial_update(request, pk)

    @extend_schema(
        summary="Eliminar artículo",
        description="Elimina un artículo permanentemente. Solo el autor o admin puede eliminar.",
        tags=['Articles']
    )
    def destroy(self, request, pk=None):
        """Elimina un artículo"""
        return super().destroy(request, pk)
```

---

## Docstrings para APIView

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

class UserStatsAPIView(APIView):
    """
    API para estadísticas de usuario.

    Retorna métricas agregadas sobre la actividad del usuario actual.
    """

    @extend_schema(
        summary="Obtener estadísticas del usuario",
        description="""
        Retorna estadísticas del usuario autenticado:
        - Total de posts publicados
        - Total de comentarios
        - Followers count
        - Engagement rate

        Requiere autenticación.
        """,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'posts_count': {'type': 'integer'},
                    'comments_count': {'type': 'integer'},
                    'followers_count': {'type': 'integer'},
                    'engagement_rate': {'type': 'number'},
                }
            }
        },
        tags=['Users', 'Stats']
    )
    def get(self, request):
        """Obtiene estadísticas del usuario actual"""
        user = request.user
        stats = {
            'posts_count': user.posts.count(),
            'comments_count': user.comments.count(),
            'followers_count': user.followers.count(),
            'engagement_rate': user.calculate_engagement_rate(),
        }
        return Response(stats)
```

---

## extend_schema Decorator

### Parámetros Básicos

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

class ArticleViewSet(ModelViewSet):
    @extend_schema(
        # Identificación
        operation_id='list_articles',
        summary="Listar artículos",
        description="Retorna lista paginada de artículos",

        # Categorización
        tags=['Articles', 'Public'],

        # Deprecation
        deprecated=False,

        # Request body
        request=ArticleSerializer,

        # Response
        responses={
            200: ArticleSerializer(many=True),
            400: OpenApiTypes.OBJECT,
        },

        # Parameters
        parameters=[
            OpenApiParameter(
                name='category',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Filter by category',
                required=False,
            ),
        ],
    )
    def list(self, request):
        pass
```

### Request Body Documentation

```python
@extend_schema(
    request=ArticleSerializer,
    responses={201: ArticleSerializer},
    summary="Crear artículo",
    description="Crea un nuevo artículo con título, contenido y categoría"
)
def create(self, request):
    pass

# Multiple possible request bodies
from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

@extend_schema(
    request=inline_serializer(
        name='CreateArticle',
        fields={
            'title': serializers.CharField(),
            'content': serializers.CharField(),
            'category_id': serializers.IntegerField(),
            'tags': serializers.ListField(child=serializers.CharField()),
        }
    )
)
def create(self, request):
    pass
```

### Response Documentation

```python
from drf_spectacular.utils import extend_schema, OpenApiResponse

@extend_schema(
    responses={
        200: ArticleSerializer,
        201: ArticleSerializer,
        400: OpenApiResponse(
            description='Validation error',
            response={
                'type': 'object',
                'properties': {
                    'field_name': {
                        'type': 'array',
                        'items': {'type': 'string'}
                    }
                }
            }
        ),
        404: OpenApiResponse(description='Article not found'),
        500: OpenApiResponse(description='Internal server error'),
    }
)
def update(self, request, pk):
    pass

# Different responses por status code
@extend_schema(
    responses={
        (200, 'application/json'): ArticleSerializer,
        (200, 'text/csv'): OpenApiTypes.BINARY,
    }
)
def export(self, request):
    pass
```

---

## Documentar Query Parameters

```python
from drf_spectacular.utils import OpenApiParameter

@extend_schema(
    parameters=[
        OpenApiParameter(
            name='search',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Search in title and content',
            required=False,
        ),
        OpenApiParameter(
            name='category',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Filter by category slug',
            required=False,
        ),
        OpenApiParameter(
            name='author_id',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Filter by author ID',
            required=False,
        ),
        OpenApiParameter(
            name='published_after',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description='Filter articles published after date (YYYY-MM-DD)',
            required=False,
        ),
        OpenApiParameter(
            name='ordering',
            type=str,
            location=OpenApiParameter.QUERY,
            description='Order by field (prefix with - for descending)',
            enum=['created_at', '-created_at', 'title', '-title'],
            required=False,
        ),
        OpenApiParameter(
            name='page',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Page number',
            required=False,
        ),
        OpenApiParameter(
            name='page_size',
            type=int,
            location=OpenApiParameter.QUERY,
            description='Number of results per page',
            required=False,
        ),
    ],
    summary="Listar artículos con filtros"
)
def list(self, request):
    pass
```

---

## Documentar Path Parameters

```python
@extend_schema(
    parameters=[
        OpenApiParameter(
            name='id',
            type=OpenApiTypes.UUID,
            location=OpenApiParameter.PATH,
            description='Article UUID',
            required=True,
        ),
    ],
    summary="Obtener artículo por ID"
)
def retrieve(self, request, pk=None):
    pass

# Custom path parameter
@extend_schema(
    parameters=[
        OpenApiParameter(
            name='slug',
            type=str,
            location=OpenApiParameter.PATH,
            description='Article slug (URL-friendly identifier)',
            required=True,
        ),
    ]
)
@action(detail=False, methods=['get'], url_path='by-slug/(?P<slug>[^/.]+)')
def by_slug(self, request, slug=None):
    """Get article by slug"""
    article = get_object_or_404(Article, slug=slug)
    serializer = self.get_serializer(article)
    return Response(serializer.data)
```

---

## Documentar Custom Actions

```python
from rest_framework.decorators import action

class ArticleViewSet(ModelViewSet):
    @extend_schema(
        summary="Publicar artículo",
        description="Cambia el estado del artículo a publicado",
        request=None,
        responses={
            200: ArticleSerializer,
            400: OpenApiResponse(description='Article already published'),
        },
        tags=['Articles']
    )
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publica un artículo en borrador"""
        article = self.get_object()
        article.publish()
        serializer = self.get_serializer(article)
        return Response(serializer.data)

    @extend_schema(
        summary="Artículos relacionados",
        description="Retorna artículos similares basados en tags y categoría",
        responses={200: ArticleSerializer(many=True)},
        tags=['Articles']
    )
    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Obtiene artículos relacionados"""
        article = self.get_object()
        related = article.get_related_articles()
        serializer = self.get_serializer(related, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Buscar artículos",
        description="Búsqueda full-text en artículos",
        parameters=[
            OpenApiParameter('q', str, description='Search query', required=True),
        ],
        responses={200: ArticleSerializer(many=True)},
        tags=['Articles', 'Search']
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Búsqueda de artículos"""
        query = request.query_params.get('q', '')
        articles = Article.objects.search(query)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
```

---

## Exclude Endpoints from Schema

```python
from drf_spectacular.utils import extend_schema

class InternalAPIView(APIView):
    @extend_schema(exclude=True)
    def get(self, request):
        """Internal endpoint - not documented"""
        pass

# Exclude entire viewset
@extend_schema(exclude=True)
class InternalViewSet(ModelViewSet):
    """Not included in API documentation"""
    pass
```

---

## File Upload Documentation

```python
from drf_spectacular.utils import extend_schema, inline_serializer

@extend_schema(
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'file': {
                    'type': 'string',
                    'format': 'binary',
                    'description': 'Image file (max 5MB, jpg/png)'
                },
                'title': {
                    'type': 'string',
                    'description': 'Image title'
                },
            },
            'required': ['file']
        }
    },
    responses={
        201: ImageSerializer,
        400: OpenApiResponse(description='Invalid file'),
    },
    summary="Upload image"
)
def upload_image(self, request):
    pass
```

---

## Pagination Documentation

```python
# Pagination automáticamente documentada si usas DRF pagination

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# Custom pagination parameters
@extend_schema(
    parameters=[
        OpenApiParameter('page', int, description='Page number'),
        OpenApiParameter('page_size', int, description='Results per page (max 100)'),
    ]
)
def list(self, request):
    pass
```

---

## Authentication Documentation

```python
from drf_spectacular.utils import extend_schema_view

@extend_schema_view(
    list=extend_schema(
        summary="List articles (public)",
        auth=[],  # Override - no auth required
    ),
    create=extend_schema(
        summary="Create article (authenticated)",
        # Uses default auth from settings
    ),
)
class ArticleViewSet(ModelViewSet):
    pass

# Document specific auth method
@extend_schema(
    auth=[
        {
            'bearerAuth': []
        }
    ],
    summary="Protected endpoint"
)
def protected_view(request):
    pass
```

---

## Inline Documentation Tips

### DO ✅

```python
@extend_schema(
    summary="Create user account",
    description="""
    Register a new user account.

    Requirements:
    - Email must be unique
    - Password must be at least 8 characters
    - Username must be 3-20 alphanumeric characters

    Returns the created user with JWT tokens.
    """,
)
def register(request):
    pass
```

### DON'T ❌

```python
# Bad: Too vague
@extend_schema(summary="User registration")
def register(request):
    pass

# Bad: No description
@extend_schema(summary="Register")
def register(request):
    pass

# Bad: Information in code, not in docs
def register(request):
    """Register user"""
    # Email must be unique (NOT DOCUMENTED)
    pass
```

---

**← [OpenAPI/Swagger](./openapi-spectacular.md) | [Schema Customization](./schema-customization.md) →**
