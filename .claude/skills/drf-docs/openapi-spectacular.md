# OpenAPI/Swagger con drf-spectacular

Configuración completa de OpenAPI/Swagger usando drf-spectacular para generar documentación interactiva automática.

---

## Instalación

```bash
pip install drf-spectacular
```

---

## Configuración Básica

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'drf_spectacular',
]

REST_FRAMEWORK = {
    # Usar AutoSchema de spectacular
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

---

## SPECTACULAR_SETTINGS

### Configuración Completa

```python
# settings.py
SPECTACULAR_SETTINGS = {
    # Información general
    'TITLE': 'My API',
    'DESCRIPTION': 'Comprehensive API for managing resources',
    'VERSION': '1.0.0',
    'TERMS_OF_SERVICE': 'https://example.com/terms/',
    'CONTACT': {
        'name': 'API Support',
        'url': 'https://example.com/support/',
        'email': 'support@example.com',
    },
    'LICENSE': {
        'name': 'BSD License',
        'url': 'https://opensource.org/licenses/BSD-3-Clause',
    },

    # External docs
    'EXTERNAL_DOCS': {
        'description': 'Full Documentation',
        'url': 'https://docs.example.com',
    },

    # Servers (para múltiples ambientes)
    'SERVERS': [
        {'url': 'https://api.example.com', 'description': 'Production'},
        {'url': 'https://staging-api.example.com', 'description': 'Staging'},
        {'url': 'http://localhost:8000', 'description': 'Development'},
    ],

    # Schema generation
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },

    # Component split
    'COMPONENT_SPLIT_REQUEST': True,
    'COMPONENT_SPLIT_PATCH': True,

    # Enum handling
    'ENUM_NAME_OVERRIDES': {
        'ValidationErrorEnum': 'drf_spectacular.types.ErrorEnum',
    },

    # Authentication
    'SECURITY': [
        {
            'bearerAuth': [],
        }
    ],

    # Tags
    'TAGS': [
        {'name': 'Auth', 'description': 'Authentication endpoints'},
        {'name': 'Users', 'description': 'User management'},
        {'name': 'Articles', 'description': 'Article CRUD operations'},
    ],

    # Schema customization
    'SCHEMA_PATH_PREFIX': '/api/v[0-9]',
    'SCHEMA_COERCE_PATH_PK': True,
    'SCHEMA_COERCE_METHOD_NAMES': {
        'list': 'list',
        'create': 'create',
        'retrieve': 'retrieve',
        'update': 'update',
        'partial_update': 'partial_update',
        'destroy': 'destroy',
    },

    # Postprocessing
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
    ],

    # Disable warnings
    'DISABLE_ERRORS_AND_WARNINGS': False,
}
```

### Configuración Minimalista (para empezar)

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'My API',
    'DESCRIPTION': 'API Documentation',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
```

---

## URLs Configuration

```python
# urls.py
from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

urlpatterns = [
    # OpenAPI schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ReDoc UI
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Your API endpoints
    path('api/', include('myapp.urls')),
]
```

---

## Schema Generation

### Generar Schema Estático

```bash
# Generate OpenAPI schema to file
python manage.py spectacular --file schema.yml

# Generate with custom settings
python manage.py spectacular --color --file schema.yml --format openapi-json

# Validate schema
python manage.py spectacular --validate
```

### Usar Schema en CI/CD

```yaml
# .github/workflows/docs.yml
name: Generate API Docs

on: [push]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate OpenAPI Schema
        run: |
          pip install -r requirements.txt
          python manage.py spectacular --file openapi.yml
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

---

## SwaggerUI Customization

### Custom Swagger Settings

```python
SPECTACULAR_SETTINGS = {
    'SWAGGER_UI_SETTINGS': {
        # Layout
        'deepLinking': True,
        'displayOperationId': True,
        'defaultModelsExpandDepth': 2,
        'defaultModelExpandDepth': 2,
        'docExpansion': 'list',  # 'list', 'full', 'none'
        'filter': True,
        'showExtensions': True,
        'showCommonExtensions': True,

        # Auth
        'persistAuthorization': True,

        # UI
        'displayRequestDuration': True,
        'tryItOutEnabled': True,

        # Syntax highlighting
        'syntaxHighlight.theme': 'monokai',
    },
    'SWAGGER_UI_DIST': 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@latest',
    'SWAGGER_UI_FAVICON_HREF': '/static/favicon.ico',
}
```

### Custom Swagger Template

```python
# views.py
from drf_spectacular.views import SpectacularSwaggerView

class CustomSwaggerView(SpectacularSwaggerView):
    template_name = 'myapp/swagger_ui.html'

# templates/myapp/swagger_ui.html
"""
<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@latest/swagger-ui.css">
    <style>
        body { margin: 0; }
        .topbar { display: none; }  /* Hide Swagger topbar */
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@latest/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: "{{ schema_url }}",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
        })
    </script>
</body>
</html>
"""
```

---

## ReDoc Customization

```python
SPECTACULAR_SETTINGS = {
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
        'hideHostname': False,
        'expandResponses': '200,201',
        'pathInMiddlePanel': True,
        'nativeScrollbars': True,
        'theme': {
            'colors': {
                'primary': {
                    'main': '#6EC5AB'
                }
            },
            'typography': {
                'fontSize': '15px',
                'fontFamily': 'Roboto, sans-serif',
            }
        }
    },
}
```

---

## Authentication Documentation

### Bearer Token (JWT)

```python
SPECTACULAR_SETTINGS = {
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'bearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
    'SECURITY': [{'bearerAuth': []}],
}
```

### API Key

```python
SPECTACULAR_SETTINGS = {
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'ApiKeyAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-API-Key'
            }
        }
    },
    'SECURITY': [{'ApiKeyAuth': []}],
}
```

### Multiple Auth Methods

```python
SPECTACULAR_SETTINGS = {
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'bearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            },
            'cookieAuth': {
                'type': 'apiKey',
                'in': 'cookie',
                'name': 'sessionid',
            },
            'ApiKeyAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-API-Key'
            }
        }
    },
    'SECURITY': [
        {'bearerAuth': []},
        {'cookieAuth': []},
        {'ApiKeyAuth': []},
    ],
}
```

---

## Versioning Support

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
}

SPECTACULAR_SETTINGS = {
    'SCHEMA_PATH_PREFIX': '/api/v[0-9]',
    'VERSION': '1.0.0',
}

# urls.py
urlpatterns = [
    # Separate schema per version
    path('api/v1/schema/', SpectacularAPIView.as_view(api_version='v1'), name='schema-v1'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema-v1'), name='docs-v1'),

    path('api/v2/schema/', SpectacularAPIView.as_view(api_version='v2'), name='schema-v2'),
    path('api/v2/docs/', SpectacularSwaggerView.as_view(url_name='schema-v2'), name='docs-v2'),
]
```

---

## Advanced Schema Customization

### Custom Schema Generator

```python
# schema.py
from drf_spectacular.openapi import AutoSchema

class CustomAutoSchema(AutoSchema):
    def get_operation_id(self, path, method):
        """Customize operation IDs"""
        return f"{method.lower()}_{path.replace('/', '_')}"

    def get_tags(self):
        """Custom tag logic"""
        if 'admin' in self.path:
            return ['Admin']
        return super().get_tags()

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'myapp.schema.CustomAutoSchema',
}
```

### Postprocessing Hook

```python
# hooks.py
def custom_postprocessing_hook(result, generator, request, public):
    """Custom postprocessing of schema"""
    # Add custom x-properties
    result['x-api-id'] = 'my-api'
    result['x-organization'] = 'My Company'

    # Modify operations
    for path, methods in result['paths'].items():
        for method, operation in methods.items():
            # Add rate limit info
            operation['x-rate-limit'] = '100/hour'

    return result

# settings.py
SPECTACULAR_SETTINGS = {
    'POSTPROCESSING_HOOKS': [
        'myapp.hooks.custom_postprocessing_hook',
    ],
}
```

---

## Common Issues & Solutions

### Issue: Missing Endpoints

```python
# Solution: Check if AutoSchema is set
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

### Issue: Wrong Response Schema

```python
# Solution: Use extend_schema with explicit serializer
from drf_spectacular.utils import extend_schema

@extend_schema(responses=MySerializer)
def my_view(request):
    pass
```

### Issue: Authentication Not Showing

```python
# Solution: Ensure SECURITY is defined
SPECTACULAR_SETTINGS = {
    'SECURITY': [{'bearerAuth': []}],
}
```

---

## Testing Schema Generation

```python
# tests/test_schema.py
from django.test import TestCase
from django.urls import reverse

class SchemaTests(TestCase):
    def test_schema_generation(self):
        """Test schema endpoint returns valid OpenAPI spec"""
        response = self.client.get(reverse('schema'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.oai.openapi')

        # Parse schema
        schema = response.json()
        self.assertIn('openapi', schema)
        self.assertIn('info', schema)
        self.assertIn('paths', schema)

    def test_swagger_ui_loads(self):
        """Test Swagger UI is accessible"""
        response = self.client.get(reverse('swagger-ui'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'swagger-ui')
```

---

**Ver**: [Docstrings en Views](./docstrings-views.md) →
