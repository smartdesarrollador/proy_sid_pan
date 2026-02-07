# Project Documentation

README structure, API versioning docs, authentication flows, testing documentation, y inline code documentation.

---

## README.md Structure

### Complete README Template

```markdown
# Project Name

Brief description of what this API does.

[![Build Status](https://github.com/user/repo/workflows/CI/badge.svg)](https://github.com/user/repo/actions)
[![Coverage](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/user/repo)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Django Version](https://img.shields.io/badge/django-4.2+-green.svg)](https://www.djangoproject.com/)

## Features

- ✅ RESTful API with Django REST Framework
- ✅ JWT Authentication
- ✅ PostgreSQL database
- ✅ OpenAPI/Swagger documentation
- ✅ Celery for background tasks
- ✅ Docker support
- ✅ Comprehensive test coverage

## Requirements

- Python 3.11+
- PostgreSQL 14+
- Redis 7+ (for caching and Celery)
- Docker & Docker Compose (optional)

## Installation

### Local Setup

1. Clone the repository
```bash
git clone https://github.com/user/repo.git
cd repo
```

2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations
```bash
python manage.py migrate
```

6. Create superuser
```bash
python manage.py createsuperuser
```

7. Run development server
```bash
python manage.py runserver
```

### Docker Setup

```bash
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEBUG` | Debug mode | `False` | No |
| `SECRET_KEY` | Django secret key | - | Yes |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | - | Yes |
| `JWT_SECRET_KEY` | JWT signing key | - | Yes |
| `CELERY_BROKER_URL` | Celery broker URL | - | Yes |
| `EMAIL_HOST` | SMTP host | - | No |
| `EMAIL_PORT` | SMTP port | `587` | No |

See `.env.example` for complete list.

## API Documentation

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Logout

### Articles
- `GET /api/articles/` - List articles
- `POST /api/articles/` - Create article
- `GET /api/articles/{id}/` - Get article detail
- `PUT /api/articles/{id}/` - Update article
- `DELETE /api/articles/{id}/` - Delete article

See [API Documentation](./docs/api.md) for complete endpoint reference.

## Authentication

This API uses JWT (JSON Web Tokens) for authentication.

### Getting Tokens

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Using Tokens

Include the access token in the Authorization header:

```bash
curl -X GET http://localhost:8000/api/articles/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

## Development

### Running Tests

```bash
# All tests
python manage.py test

# With coverage
coverage run --source='.' manage.py test
coverage report
coverage html

# Specific test
python manage.py test myapp.tests.test_api
```

### Code Quality

```bash
# Linting
ruff check .

# Formatting
ruff format .

# Type checking
mypy .
```

### Database Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migrations
python manage.py showmigrations
```

### Celery

```bash
# Start worker
celery -A config worker -l info

# Start beat scheduler
celery -A config beat -l info

# Flower monitoring
celery -A config flower
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Project Structure

```
project/
├── config/              # Project configuration
│   ├── settings/        # Settings per environment
│   ├── urls.py
│   └── wsgi.py
├── apps/                # Django apps
│   ├── articles/
│   ├── users/
│   └── core/
├── docs/                # Documentation
├── tests/               # Tests
├── requirements/        # Dependencies
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── docker/              # Docker configuration
├── .env.example         # Environment variables template
├── docker-compose.yml
├── Dockerfile
└── manage.py
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## Support

- Documentation: https://docs.example.com
- Issues: https://github.com/user/repo/issues
- Email: support@example.com
```

---

## API Versioning Documentation

### Version Changes Documentation

```markdown
# API Changelog

## Version 2.0.0 (2024-03-01)

### Breaking Changes

- **REMOVED**: `/api/v1/old-endpoint/` - Use `/api/v2/new-endpoint/` instead
- **CHANGED**: Article response format - `author` field now returns full object instead of ID
- **CHANGED**: Pagination - Default page size changed from 20 to 50

### New Features

- Added `/api/v2/articles/bulk-create/` endpoint
- Added filtering by multiple categories
- Added support for nested comments

### Deprecated

- `/api/v2/articles/export/` - Use `/api/v2/exports/articles/` instead (removal: 2024-09-01)

## Version 1.0.0 (2024-01-01)

Initial release.

### Features

- Basic CRUD operations for articles
- JWT authentication
- User management
```

### Migration Guide

```markdown
# Migration Guide: v1 to v2

## Overview

Version 2.0 introduces several breaking changes. Follow this guide to migrate your client application.

## Breaking Changes

### 1. Article Response Format

**v1:**
```json
{
  "id": 1,
  "title": "Article",
  "author": 5
}
```

**v2:**
```json
{
  "id": 1,
  "title": "Article",
  "author": {
    "id": 5,
    "username": "john",
    "email": "john@example.com"
  }
}
```

**Migration:**
Update your client code to handle nested author object.

### 2. Authentication Headers

**v1:**
```
Authorization: Token abc123
```

**v2:**
```
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
```

**Migration:**
Switch from Token authentication to JWT. Update your auth flow.

### 3. Error Response Format

**v1:**
```json
{
  "error": "Validation failed"
}
```

**v2:**
```json
{
  "error_code": "validation_error",
  "message": "Validation failed",
  "details": {
    "field": ["Error message"]
  }
}
```

**Migration:**
Update error handling to parse new format.

## Deprecated Endpoints

| v1 Endpoint | v2 Replacement | Removal Date |
|-------------|----------------|--------------|
| `/api/v1/old/` | `/api/v2/new/` | 2024-09-01 |

## Testing Your Migration

Use our migration test suite:

```bash
python manage.py test tests.migration_v1_to_v2
```

## Support

Questions? Open an issue or contact support@example.com
```

---

## Authentication Documentation

### Authentication Flow Documentation

```markdown
# Authentication Guide

## Overview

This API uses JWT (JSON Web Tokens) for authentication. Tokens are obtained via login and must be included in subsequent requests.

## Registration Flow

### 1. Register New User

```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

### 2. Verify Email (if enabled)

```http
POST /api/auth/verify-email/
Content-Type: application/json

{
  "token": "abc123def456"
}
```

## Login Flow

### 1. Login

```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi...",
  "user": {
    "id": 1,
    "username": "johndoe"
  }
}
```

### 2. Store Tokens

Store both tokens securely:
- `access`: Short-lived (15 min), used for API requests
- `refresh`: Long-lived (7 days), used to get new access tokens

### 3. Make Authenticated Requests

```http
GET /api/articles/
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
```

### 4. Refresh Access Token

When access token expires (401 response):

```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1Qi..."
}
```

## Logout Flow

```http
POST /api/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1Qi...
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1Qi..."
}
```

This blacklists the refresh token.

## Password Reset Flow

### 1. Request Reset

```http
POST /api/auth/password-reset/
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If email exists, reset link was sent"
}
```

### 2. Reset Password

```http
POST /api/auth/password-reset-confirm/
Content-Type: application/json

{
  "token": "abc123",
  "password": "NewSecurePass123!"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Token Expired
```json
{
  "detail": "Token is expired",
  "code": "token_not_valid"
}
```

## Best Practices

1. **Store tokens securely** - Use httpOnly cookies or secure storage
2. **Refresh proactively** - Refresh before expiration
3. **Handle 401 errors** - Auto-refresh and retry
4. **Logout on security events** - Clear tokens immediately

## Code Examples

### JavaScript (Fetch API)

```javascript
// Login
async function login(username, password) {
  const response = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();

  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);

  return data;
}

// Make authenticated request
async function getArticles() {
  const token = localStorage.getItem('access_token');
  const response = await fetch('/api/articles/', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Refresh token
async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  const response = await fetch('/api/auth/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  const data = await response.json();

  localStorage.setItem('access_token', data.access);
  return data.access;
}
```

### Python (requests)

```python
import requests

class APIClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None

    def login(self, username, password):
        response = requests.post(
            f'{self.base_url}/auth/login/',
            json={'username': username, 'password': password}
        )
        data = response.json()
        self.access_token = data['access']
        self.refresh_token = data['refresh']
        return data

    def get(self, endpoint):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        response = requests.get(f'{self.base_url}{endpoint}', headers=headers)

        if response.status_code == 401:
            self.refresh()
            return self.get(endpoint)

        return response.json()

    def refresh(self):
        response = requests.post(
            f'{self.base_url}/auth/refresh/',
            json={'refresh': self.refresh_token}
        )
        self.access_token = response.json()['access']
```
```

---

## Testing Documentation

```markdown
# Testing Guide

## Overview

This project uses Django's testing framework with pytest for unit and integration tests.

## Running Tests

```bash
# All tests
python manage.py test

# Specific app
python manage.py test apps.articles

# Specific test file
python manage.py test apps.articles.tests.test_api

# Specific test class
python manage.py test apps.articles.tests.test_api.ArticleAPITest

# Specific test method
python manage.py test apps.articles.tests.test_api.ArticleAPITest.test_create_article

# With pytest
pytest

# With coverage
pytest --cov=apps --cov-report=html
```

## Test Structure

```
tests/
├── unit/
│   ├── test_models.py
│   ├── test_serializers.py
│   └── test_utils.py
├── integration/
│   ├── test_api.py
│   └── test_workflows.py
└── e2e/
    └── test_user_flows.py
```

## Writing Tests

### Model Tests

```python
from django.test import TestCase
from apps.articles.models import Article

class ArticleModelTest(TestCase):
    def test_create_article(self):
        article = Article.objects.create(title="Test")
        self.assertEqual(article.title, "Test")
```

### API Tests

```python
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class ArticleAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='test',
            password='pass'
        )
        self.client.force_authenticate(user=self.user)

    def test_list_articles(self):
        response = self.client.get('/api/articles/')
        self.assertEqual(response.status_code, 200)
```

## Coverage Requirements

- Minimum coverage: 80%
- Critical paths: 100%

## Continuous Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Nightly builds

See `.github/workflows/ci.yml` for CI configuration.
```

---

## Inline Code Documentation

### Model Documentation

```python
from django.db import models

class Article(models.Model):
    """
    Article model representing blog posts.

    Attributes:
        title (str): Article title (max 200 chars)
        slug (str): URL-friendly identifier, auto-generated from title
        content (str): Full article content in Markdown
        author (User): Article author (FK to User)
        status (str): Publication status ('draft' or 'published')
        published_at (datetime): Publication timestamp (null if draft)
        created_at (datetime): Creation timestamp
        updated_at (datetime): Last update timestamp

    Methods:
        publish(): Publish the article (sets status and published_at)
        unpublish(): Revert to draft
        get_reading_time(): Calculate estimated reading time in minutes
    """

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def publish(self):
        """
        Publish the article.

        Sets status to 'published' and records publication timestamp.
        Raises ValueError if article is already published.
        """
        if self.status == 'published':
            raise ValueError("Article is already published")

        self.status = 'published'
        self.published_at = timezone.now()
        self.save()

    def get_reading_time(self):
        """
        Calculate estimated reading time.

        Assumes average reading speed of 200 words per minute.

        Returns:
            int: Estimated reading time in minutes
        """
        word_count = len(self.content.split())
        return max(1, word_count // 200)
```

### Complex Query Documentation

```python
def get_featured_articles(category=None, limit=10):
    """
    Get featured articles for homepage.

    Retrieves published articles with high engagement, ordered by relevance.
    Uses denormalized engagement_score field for performance.

    Algorithm:
    1. Filter: published status, published_at not null
    2. Optional: filter by category
    3. Annotate: engagement score (views * 0.1 + comments * 0.3 + shares * 0.6)
    4. Order: by engagement score descending
    5. Select related: author, category (optimize queries)
    6. Limit: top N results

    Args:
        category (Category, optional): Filter by category. Defaults to None.
        limit (int, optional): Max results to return. Defaults to 10.

    Returns:
        QuerySet[Article]: Ordered queryset of featured articles

    Example:
        >>> featured = get_featured_articles(category=tech_category, limit=5)
        >>> for article in featured:
        ...     print(article.title, article.engagement_score)
    """
    from django.db.models import F, FloatField, ExpressionWrapper

    queryset = Article.objects.filter(
        status='published',
        published_at__isnull=False
    )

    if category:
        queryset = queryset.filter(category=category)

    # Calculate engagement score
    queryset = queryset.annotate(
        engagement_score=ExpressionWrapper(
            F('views_count') * 0.1 +
            F('comments_count') * 0.3 +
            F('shares_count') * 0.6,
            output_field=FloatField()
        )
    )

    return queryset.select_related(
        'author', 'category'
    ).order_by('-engagement_score')[:limit]
```

### Business Logic Documentation

```python
def process_payment(order, payment_method):
    """
    Process payment for order.

    Complex workflow with multiple steps and error handling.

    Workflow:
    1. Validate order (status, amount, items)
    2. Reserve inventory
    3. Create payment intent with payment gateway
    4. If successful:
       - Update order status
       - Send confirmation email
       - Trigger fulfillment
    5. If failed:
       - Release inventory
       - Log error
       - Notify admins

    Args:
        order (Order): Order to process
        payment_method (str): Payment method ('card', 'paypal', etc)

    Returns:
        dict: Payment result with keys:
            - success (bool): Whether payment succeeded
            - transaction_id (str): Payment gateway transaction ID
            - message (str): Status message

    Raises:
        ValidationError: If order validation fails
        PaymentError: If payment processing fails

    Side Effects:
        - Updates order.status
        - Creates Transaction record
        - Sends email to customer
        - Logs to payment_audit table

    Example:
        >>> result = process_payment(order, 'card')
        >>> if result['success']:
        ...     print(f"Payment successful: {result['transaction_id']}")
    """
    # Implementation...
```

---

**← [Schema Customization](./schema-customization.md)**
