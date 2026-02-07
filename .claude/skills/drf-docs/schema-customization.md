# Schema Customization & Examples

Customización avanzada de schemas, ejemplos de requests/responses, y documentación de serializers.

---

## Serializer Documentation

### help_text en Fields

```python
from rest_framework import serializers

class ArticleSerializer(serializers.ModelSerializer):
    title = serializers.CharField(
        max_length=200,
        help_text="Article title (max 200 characters)"
    )
    content = serializers.CharField(
        help_text="Full article content in Markdown format"
    )
    status = serializers.ChoiceField(
        choices=['draft', 'published'],
        default='draft',
        help_text="Publication status"
    )
    published_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="Publication date (auto-set on publish)"
    )
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        help_text="Article category ID"
    )
    tags = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of tag names",
        required=False
    )

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'status', 'published_at', 'category', 'tags']
```

### Nested Serializer Documentation

```python
class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for article author"""

    bio = serializers.CharField(
        help_text="Author biography (short description)"
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio']
        read_only_fields = ['id']

class ArticleDetailSerializer(serializers.ModelSerializer):
    """Detailed article representation with nested author"""

    author = AuthorSerializer(
        read_only=True,
        help_text="Article author details"
    )
    comments_count = serializers.IntegerField(
        read_only=True,
        help_text="Total number of comments"
    )

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'comments_count']
```

### Field Descriptions via Meta

```python
from drf_spectacular.utils import extend_schema_field

class ArticleSerializer(serializers.ModelSerializer):
    custom_field = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_custom_field(self, obj):
        """Returns custom calculated value"""
        return obj.calculate_something()

    class Meta:
        model = Article
        fields = ['id', 'title', 'custom_field']
        extra_kwargs = {
            'title': {
                'help_text': 'Article title',
                'min_length': 5,
                'max_length': 200,
            },
        }
```

---

## OpenApiExample Usage

### Basic Examples

```python
from drf_spectacular.utils import extend_schema, OpenApiExample

@extend_schema(
    summary="Create article",
    examples=[
        OpenApiExample(
            'Create Draft Article',
            description='Example of creating a draft article',
            value={
                'title': 'My First Blog Post',
                'content': 'This is the content of my article...',
                'status': 'draft',
                'category': 1,
                'tags': ['python', 'django']
            },
            request_only=True,
        ),
        OpenApiExample(
            'Create Published Article',
            description='Example of creating and publishing an article',
            value={
                'title': 'Django REST Framework Guide',
                'content': 'Complete guide to DRF...',
                'status': 'published',
                'category': 2,
                'tags': ['django', 'api', 'rest']
            },
            request_only=True,
        ),
    ]
)
def create(self, request):
    pass
```

### Response Examples

```python
@extend_schema(
    summary="Get article",
    examples=[
        OpenApiExample(
            'Success Response',
            description='Successful article retrieval',
            value={
                'id': 1,
                'title': 'My Article',
                'content': 'Article content...',
                'author': {
                    'id': 1,
                    'username': 'john_doe',
                    'email': 'john@example.com'
                },
                'status': 'published',
                'published_at': '2024-01-15T10:30:00Z',
                'created_at': '2024-01-10T08:00:00Z',
                'updated_at': '2024-01-15T10:30:00Z'
            },
            response_only=True,
            status_codes=['200']
        ),
    ]
)
def retrieve(self, request, pk=None):
    pass
```

### Multiple Examples per Endpoint

```python
@extend_schema(
    examples=[
        # Request examples
        OpenApiExample(
            'Minimal Request',
            value={'title': 'Title', 'content': 'Content'},
            request_only=True,
        ),
        OpenApiExample(
            'Complete Request',
            value={
                'title': 'Complete Article',
                'content': 'Full content...',
                'category': 1,
                'tags': ['tag1', 'tag2'],
                'featured_image': 'https://example.com/image.jpg'
            },
            request_only=True,
        ),

        # Response examples
        OpenApiExample(
            'Success 201',
            value={'id': 1, 'title': 'Created Article'},
            response_only=True,
            status_codes=['201']
        ),
    ]
)
def create(self, request):
    pass
```

---

## Error Response Documentation

### Standard Error Responses

```python
from drf_spectacular.utils import OpenApiResponse, OpenApiExample

@extend_schema(
    responses={
        200: ArticleSerializer,
        400: OpenApiResponse(
            description='Validation error',
            examples=[
                OpenApiExample(
                    'Validation Error',
                    value={
                        'title': ['This field is required.'],
                        'category': ['Invalid pk "999" - object does not exist.']
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            description='Authentication required',
            examples=[
                OpenApiExample(
                    'Not Authenticated',
                    value={'detail': 'Authentication credentials were not provided.'}
                )
            ]
        ),
        403: OpenApiResponse(
            description='Permission denied',
            examples=[
                OpenApiExample(
                    'No Permission',
                    value={'detail': 'You do not have permission to perform this action.'}
                )
            ]
        ),
        404: OpenApiResponse(
            description='Not found',
            examples=[
                OpenApiExample(
                    'Article Not Found',
                    value={'detail': 'Not found.'}
                )
            ]
        ),
    }
)
def update(self, request, pk):
    pass
```

### Custom Error Response Schema

```python
from rest_framework import serializers

class ErrorResponseSerializer(serializers.Serializer):
    """Standard error response"""
    error = serializers.CharField(help_text="Error type")
    message = serializers.CharField(help_text="Human-readable error message")
    details = serializers.DictField(
        help_text="Additional error details",
        required=False
    )

class ValidationErrorSerializer(serializers.Serializer):
    """Validation error response"""
    field_name = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of validation errors for this field"
    )

@extend_schema(
    responses={
        400: ValidationErrorSerializer,
        500: ErrorResponseSerializer,
    },
    examples=[
        OpenApiExample(
            'Validation Error Example',
            value={
                'title': ['This field is required.'],
                'email': ['Enter a valid email address.']
            },
            response_only=True,
            status_codes=['400']
        ),
        OpenApiExample(
            'Server Error Example',
            value={
                'error': 'internal_error',
                'message': 'An unexpected error occurred',
                'details': {'request_id': 'abc-123'}
            },
            response_only=True,
            status_codes=['500']
        ),
    ]
)
def create(self, request):
    pass
```

---

## Status Codes Documentation

```python
@extend_schema(
    summary="Update article",
    responses={
        200: OpenApiResponse(
            description='Article updated successfully',
            response=ArticleSerializer
        ),
        204: OpenApiResponse(
            description='Article deleted successfully (no content)'
        ),
        400: OpenApiResponse(
            description='Invalid input data'
        ),
        401: OpenApiResponse(
            description='Authentication credentials missing or invalid'
        ),
        403: OpenApiResponse(
            description='Not authorized to update this article'
        ),
        404: OpenApiResponse(
            description='Article not found'
        ),
        409: OpenApiResponse(
            description='Conflict - article is locked for editing'
        ),
        500: OpenApiResponse(
            description='Internal server error'
        ),
    }
)
def update(self, request, pk):
    pass
```

---

## Custom Tags & Categories

### Using Tags

```python
from drf_spectacular.utils import extend_schema, extend_schema_view

# Per-action tags
@extend_schema_view(
    list=extend_schema(tags=['Articles', 'Public']),
    create=extend_schema(tags=['Articles', 'Write']),
    retrieve=extend_schema(tags=['Articles', 'Public']),
    update=extend_schema(tags=['Articles', 'Write']),
    destroy=extend_schema(tags=['Articles', 'Admin']),
)
class ArticleViewSet(ModelViewSet):
    pass

# Custom action tags
@extend_schema(tags=['Articles', 'Actions', 'Moderation'])
@action(detail=True, methods=['post'])
def approve(self, request, pk=None):
    pass
```

### Tag Configuration in Settings

```python
# settings.py
SPECTACULAR_SETTINGS = {
    'TAGS': [
        {
            'name': 'Auth',
            'description': 'Authentication and authorization endpoints',
            'externalDocs': {
                'description': 'Auth Documentation',
                'url': 'https://docs.example.com/auth'
            }
        },
        {
            'name': 'Articles',
            'description': 'Article management operations'
        },
        {
            'name': 'Users',
            'description': 'User profile and settings'
        },
        {
            'name': 'Admin',
            'description': 'Administrative endpoints (requires admin role)'
        },
    ],

    # Tag sorting
    'SORT_OPERATIONS_ALPHABETICALLY': False,
    'TAGS_SORTER': 'alpha',  # 'alpha' or callable
}
```

---

## Operation IDs

```python
# Custom operation IDs
@extend_schema(
    operation_id='articles_list',
    summary="List articles"
)
def list(self, request):
    pass

# Auto-generated from method names (default)
SPECTACULAR_SETTINGS = {
    'SCHEMA_COERCE_METHOD_NAMES': {
        'list': 'list',
        'create': 'create',
        'retrieve': 'read',
        'update': 'update',
        'partial_update': 'partial_update',
        'destroy': 'delete',
    },
}

# Custom operation ID function
def custom_operation_id(name, path, method):
    """Generate operation IDs"""
    # Example: "api_v1_articles_list"
    return f"api_v1_{path.replace('/', '_')}_{method}"

SPECTACULAR_SETTINGS = {
    'OPERATION_ID_FUNCTION': 'myapp.schema.custom_operation_id',
}
```

---

## Deprecation Warnings

```python
@extend_schema(
    deprecated=True,
    summary="Old article endpoint (deprecated)",
    description="""
    **DEPRECATED**: This endpoint is deprecated and will be removed in v2.0.

    Use `/api/v2/articles/` instead.

    Removal date: 2024-12-31
    """
)
def old_list(self, request):
    pass

# Deprecation in serializer field
class ArticleSerializer(serializers.ModelSerializer):
    old_field = serializers.CharField(
        help_text="**DEPRECATED**: Use 'new_field' instead. Will be removed in v2.0",
        required=False,
        deprecated=True  # If using drf-spectacular extensions
    )
```

---

## Polymorphic Serializers

```python
from drf_spectacular.utils import extend_schema_serializer, PolymorphicProxySerializer

# Base serializer
class MediaSerializer(serializers.Serializer):
    type = serializers.CharField()
    url = serializers.URLField()

# Specific types
class ImageSerializer(MediaSerializer):
    width = serializers.IntegerField()
    height = serializers.IntegerField()

class VideoSerializer(MediaSerializer):
    duration = serializers.IntegerField()
    thumbnail = serializers.URLField()

# Document polymorphic response
@extend_schema(
    responses=PolymorphicProxySerializer(
        component_name='Media',
        serializers=[ImageSerializer, VideoSerializer],
        resource_type_field_name='type',
    )
)
def get_media(request, pk):
    pass
```

---

## Custom Schema Fields

```python
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

class CustomSerializer(serializers.Serializer):
    # Custom field type
    color = serializers.CharField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_color(self, obj):
        return obj.hex_color

    # Custom format
    phone = serializers.CharField()

    @extend_schema_field({
        'type': 'string',
        'format': 'phone',
        'pattern': r'^\+?1?\d{9,15}$',
        'example': '+1234567890'
    })
    def get_phone(self, obj):
        return obj.phone_number

    # Custom enum
    priority = serializers.CharField()

    @extend_schema_field({
        'type': 'string',
        'enum': ['low', 'medium', 'high', 'critical'],
        'description': 'Task priority level'
    })
    def get_priority(self, obj):
        return obj.priority
```

---

## Inline Serializer for One-off Schemas

```python
from drf_spectacular.utils import inline_serializer

@extend_schema(
    request=inline_serializer(
        name='LoginRequest',
        fields={
            'username': serializers.CharField(),
            'password': serializers.CharField(),
            'remember_me': serializers.BooleanField(default=False),
        }
    ),
    responses={
        200: inline_serializer(
            name='LoginResponse',
            fields={
                'access_token': serializers.CharField(),
                'refresh_token': serializers.CharField(),
                'user': UserSerializer(),
            }
        )
    }
)
def login(request):
    pass
```

---

## Extending Existing Schemas

```python
from drf_spectacular.utils import extend_schema_serializer

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'User Example',
            value={
                'username': 'john_doe',
                'email': 'john@example.com',
                'first_name': 'John',
                'last_name': 'Doe'
            }
        )
    ],
    # Exclude fields from schema
    exclude_fields=['password', 'last_login'],
)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
```

---

## External Documentation Links

```python
@extend_schema(
    summary="Create article",
    external_docs={
        'description': 'Article creation guide',
        'url': 'https://docs.example.com/guides/creating-articles'
    }
)
def create(self, request):
    pass

# In settings for entire API
SPECTACULAR_SETTINGS = {
    'EXTERNAL_DOCS': {
        'description': 'Full API Documentation',
        'url': 'https://docs.example.com',
    }
}
```

---

## Schema Preprocessing

```python
# Custom schema processor
def custom_preprocessing_hook(endpoints):
    """Modify endpoints before schema generation"""
    filtered = []
    for path, path_regex, method, callback in endpoints:
        # Skip internal endpoints
        if path.startswith('/internal/'):
            continue
        filtered.append((path, path_regex, method, callback))
    return filtered

# settings.py
SPECTACULAR_SETTINGS = {
    'PREPROCESSING_HOOKS': [
        'myapp.schema.custom_preprocessing_hook',
    ]
}
```

---

**← [Docstrings](./docstrings-views.md) | [Project Documentation](./project-docs.md) →**
