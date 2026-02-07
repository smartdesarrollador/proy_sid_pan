---
name: drf-testing
description: >
  Patrones y mejores prácticas para testing de APIs con Django REST Framework.
  Usar cuando se trabaje con tests, APITestCase, factories, mocking, fixtures, coverage,
  pytest-django, assertNumQueries, testing de serializers, permissions, CRUD o CI/CD en Django.
---

# Testing de APIs con Django REST Framework

## 1. Testing Fundamentals

### Estructura de archivos

```
tests/
├── __init__.py
├── conftest.py              # fixtures de pytest compartidas
├── factories.py             # Factory Boy factories
├── mixins.py                # mixins reutilizables para tests
├── test_models.py
├── test_serializers.py
├── test_views.py
├── test_permissions.py
├── test_filters.py
└── integration/
    ├── __init__.py
    └── test_workflows.py
```

### TestCase vs APITestCase vs TransactionTestCase

```python
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APITestCase

# TestCase: wraps cada test en transacción (rollback automático, rápido)
# Usar para: la mayoría de tests
class ItemModelTest(TestCase):
    pass

# APITestCase: como TestCase pero con self.client = APIClient()
# Usar para: tests de endpoints REST
class ItemAPITest(APITestCase):
    pass

# TransactionTestCase: commit real a DB, más lento
# Usar para: tests que necesitan transaction.atomic(), signals post_commit, on_commit
class ItemTransactionTest(TransactionTestCase):
    pass
```

### setUpTestData() vs setUp()

```python
class ItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        """Se ejecuta UNA VEZ para toda la clase. Datos read-only compartidos."""
        cls.category = Category.objects.create(name="General")
        cls.admin = User.objects.create_user(
            email="admin@test.com", password="admin123", role="admin",
        )

    def setUp(self):
        """Se ejecuta ANTES de cada test. Datos que pueden modificarse."""
        self.client = APIClient()
        self.item = Item.objects.create(
            name="Test Item", category=self.category, created_by=self.admin,
        )
```

### Nomenclatura de tests

```python
class ItemAPITest(APITestCase):
    # Estilo descriptivo
    def test_list_items_returns_200(self): ...
    def test_create_item_with_valid_data_returns_201(self): ...
    def test_create_item_without_name_returns_400(self): ...
    def test_unauthenticated_user_cannot_create_item(self): ...
    def test_owner_can_update_own_item(self): ...
    def test_non_owner_cannot_delete_item(self): ...

    # Estilo Given_When_Then (alternativo)
    def test_given_active_items_when_list_then_returns_only_active(self): ...
    def test_given_no_auth_when_create_then_returns_401(self): ...
```

## 2. APITestCase Patterns

### APIClient métodos principales

```python
from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class ItemCRUDTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@test.com", password="pass123",
        )
        self.client.force_authenticate(user=self.user)
        self.base_url = "/api/v1/items/"

    def test_list(self):
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data["results"], list)

    def test_create(self):
        data = {"name": "New Item", "value": "99.99"}
        response = self.client.post(self.base_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Item")

    def test_retrieve(self):
        item = Item.objects.create(name="Test", created_by=self.user)
        response = self.client.get(f"{self.base_url}{item.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], item.pk)

    def test_update_put(self):
        item = Item.objects.create(name="Old", value=10, created_by=self.user)
        data = {"name": "Updated", "value": "20.00"}
        response = self.client.put(
            f"{self.base_url}{item.pk}/", data, format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated")

    def test_update_patch(self):
        item = Item.objects.create(name="Old", value=10, created_by=self.user)
        response = self.client.patch(
            f"{self.base_url}{item.pk}/", {"name": "Patched"}, format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Patched")

    def test_delete(self):
        item = Item.objects.create(name="ToDelete", created_by=self.user)
        response = self.client.delete(f"{self.base_url}{item.pk}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Item.objects.filter(pk=item.pk).exists())
```

### Testing response structure

```python
def test_list_response_structure(self):
    Item.objects.create(name="A", value=10, created_by=self.user)

    response = self.client.get(self.base_url)
    self.assertEqual(response.status_code, 200)

    # Paginated response
    self.assertIn("count", response.data)
    self.assertIn("results", response.data)
    self.assertEqual(response.data["count"], 1)

    # Item structure
    item_data = response.data["results"][0]
    expected_keys = {"id", "name", "value", "status", "created_at"}
    self.assertEqual(set(item_data.keys()), expected_keys)


def test_create_returns_expected_fields(self):
    data = {"name": "Test", "value": "50.00"}
    response = self.client.post(self.base_url, data, format="json")

    self.assertEqual(response.status_code, 201)
    self.assertIn("id", response.data)
    self.assertNotIn("password", response.data)  # campo sensible excluido
```

### Testing sin autenticación

```python
def test_unauthenticated_list_returns_200(self):
    """Endpoints públicos no requieren auth."""
    self.client.force_authenticate(user=None)  # o usar client sin auth
    response = self.client.get(self.base_url)
    self.assertEqual(response.status_code, 200)

def test_unauthenticated_create_returns_401(self):
    self.client.force_authenticate(user=None)
    response = self.client.post(self.base_url, {"name": "X"}, format="json")
    self.assertEqual(response.status_code, 401)
```

## 3. Fixtures y Test Data

### Factory Boy

```python
# tests/factories.py
import factory
from factory.django import DjangoModelFactory
from factory import fuzzy


class UserFactory(DjangoModelFactory):
    class Meta:
        model = "accounts.User"
        skip_postgeneration_save = True

    email = factory.LazyAttribute(lambda o: f"{o.first_name.lower()}@test.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    role = "user"
    is_active = True
    is_email_verified = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        password = extracted or "defaultpass123"
        self.set_password(password)
        if create:
            self.save(update_fields=["password"])

    class Params:
        admin = factory.Trait(
            role="admin",
            is_staff=True,
        )
        editor = factory.Trait(
            role="editor",
        )


class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = "app.Category"

    name = factory.Sequence(lambda n: f"Category {n}")


class ItemFactory(DjangoModelFactory):
    class Meta:
        model = "app.Item"

    name = factory.Faker("sentence", nb_words=3)
    value = fuzzy.FuzzyDecimal(1.00, 999.99)
    status = "active"
    category = factory.SubFactory(CategoryFactory)
    created_by = factory.SubFactory(UserFactory)
```

### Uso de factories en tests

```python
class ItemAPITest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_list_returns_only_active(self):
        ItemFactory.create_batch(3, status="active", created_by=self.user)
        ItemFactory.create_batch(2, status="archived", created_by=self.user)

        response = self.client.get("/api/v1/items/")
        self.assertEqual(response.data["count"], 3)

    def test_admin_can_delete(self):
        admin = UserFactory(admin=True)  # usa Trait
        item = ItemFactory(created_by=self.user)
        self.client.force_authenticate(user=admin)

        response = self.client.delete(f"/api/v1/items/{item.pk}/")
        self.assertEqual(response.status_code, 204)
```

### conftest.py con pytest fixtures

```python
# tests/conftest.py
import pytest
from rest_framework.test import APIClient
from tests.factories import UserFactory, ItemFactory, CategoryFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def admin_user():
    return UserFactory(admin=True)


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def category():
    return CategoryFactory()


@pytest.fixture
def item(user, category):
    return ItemFactory(created_by=user, category=category)


@pytest.fixture
def items_batch(user, category):
    return ItemFactory.create_batch(5, created_by=user, category=category)
```

## 4. Testing Authentication & Permissions

### Testing JWT flow

```python
class JWTAuthTest(APITestCase):
    def setUp(self):
        self.user = UserFactory(password="testpass123")

    def test_login_returns_tokens(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email": self.user.email,
            "password": "testpass123",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_access_with_token(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email": self.user.email,
            "password": "testpass123",
        })
        token = response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.user.email)

    def test_expired_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        response = self.client.get("/api/v1/items/")
        self.assertEqual(response.status_code, 401)

    def test_refresh_token(self):
        login = self.client.post("/api/v1/auth/login/", {
            "email": self.user.email,
            "password": "testpass123",
        })
        response = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": login.data["refresh"],
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
```

### Testing permissions por rol

```python
class PermissionTest(APITestCase):
    def setUp(self):
        self.regular_user = UserFactory()
        self.editor = UserFactory(editor=True)
        self.admin = UserFactory(admin=True)
        self.item = ItemFactory(created_by=self.regular_user)
        self.url = f"/api/v1/items/{self.item.pk}/"

    def _assert_status(self, user, method, url, expected_status, data=None):
        self.client.force_authenticate(user=user)
        http_method = getattr(self.client, method)
        kwargs = {"format": "json"}
        if data:
            kwargs["data"] = data
        response = http_method(url, **kwargs)
        self.assertEqual(
            response.status_code, expected_status,
            f"{user.role} {method.upper()} {url} -> {response.status_code} "
            f"(expected {expected_status})",
        )

    def test_regular_user_can_read(self):
        self._assert_status(self.regular_user, "get", self.url, 200)

    def test_regular_user_cannot_delete(self):
        self._assert_status(self.regular_user, "delete", self.url, 403)

    def test_admin_can_delete(self):
        self._assert_status(self.admin, "delete", self.url, 204)

    def test_owner_can_update(self):
        self._assert_status(
            self.regular_user, "patch", self.url, 200,
            data={"name": "Updated"},
        )

    def test_non_owner_cannot_update(self):
        other = UserFactory()
        self._assert_status(
            other, "patch", self.url, 403,
            data={"name": "Hacked"},
        )
```

### Testing object-level permissions

```python
def test_object_permission_owner_only(self):
    owner = UserFactory()
    other = UserFactory()
    item = ItemFactory(created_by=owner)

    # Owner puede editar
    self.client.force_authenticate(user=owner)
    response = self.client.patch(
        f"/api/v1/items/{item.pk}/", {"name": "Mine"}, format="json",
    )
    self.assertEqual(response.status_code, 200)

    # Non-owner no puede
    self.client.force_authenticate(user=other)
    response = self.client.patch(
        f"/api/v1/items/{item.pk}/", {"name": "Not mine"}, format="json",
    )
    self.assertEqual(response.status_code, 403)
```

## 5. Testing CRUD Operations

### Testing list con pagination, filtering y ordering

```python
class ItemListTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/items/"

    def test_pagination_default_page_size(self):
        ItemFactory.create_batch(25, created_by=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 20)  # page_size=20
        self.assertIsNotNone(response.data["next"])

    def test_pagination_custom_page_size(self):
        ItemFactory.create_batch(15, created_by=self.user)
        response = self.client.get(self.url, {"page_size": 5})
        self.assertEqual(len(response.data["results"]), 5)

    def test_filter_by_status(self):
        ItemFactory.create_batch(3, status="active", created_by=self.user)
        ItemFactory.create_batch(2, status="draft", created_by=self.user)

        response = self.client.get(self.url, {"status": "active"})
        self.assertEqual(response.data["count"], 3)
        self.assertTrue(
            all(i["status"] == "active" for i in response.data["results"])
        )

    def test_search(self):
        ItemFactory(name="Django Tutorial", created_by=self.user)
        ItemFactory(name="Flask Guide", created_by=self.user)

        response = self.client.get(self.url, {"search": "Django"})
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Django Tutorial")

    def test_ordering(self):
        ItemFactory(name="B Item", value=20, created_by=self.user)
        ItemFactory(name="A Item", value=10, created_by=self.user)

        response = self.client.get(self.url, {"ordering": "name"})
        names = [i["name"] for i in response.data["results"]]
        self.assertEqual(names, ["A Item", "B Item"])

        response = self.client.get(self.url, {"ordering": "-value"})
        values = [i["value"] for i in response.data["results"]]
        self.assertEqual(values, sorted(values, reverse=True))

    def test_empty_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])
```

### Testing create con valid/invalid data

```python
class ItemCreateTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/items/"
        self.category = CategoryFactory()

    def test_create_valid(self):
        data = {
            "name": "New Item",
            "value": "50.00",
            "category": self.category.pk,
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Item.objects.count(), 1)
        item = Item.objects.first()
        self.assertEqual(item.name, "New Item")
        self.assertEqual(item.created_by, self.user)

    def test_create_missing_required_field(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_create_invalid_value(self):
        data = {"name": "Test", "value": "-10.00"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_create_duplicate(self):
        data = {"name": "Unique", "code": "ABC", "category": self.category.pk}
        self.client.post(self.url, data, format="json")
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, 400)

    def test_create_sets_created_by(self):
        data = {"name": "Test", "value": "10.00", "category": self.category.pk}
        response = self.client.post(self.url, data, format="json")
        item = Item.objects.get(pk=response.data["id"])
        self.assertEqual(item.created_by, self.user)
```

### Testing update (PUT vs PATCH)

```python
class ItemUpdateTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.item = ItemFactory(
            name="Original", value=100, created_by=self.user,
        )
        self.url = f"/api/v1/items/{self.item.pk}/"

    def test_partial_update_patch(self):
        response = self.client.patch(
            self.url, {"name": "Updated"}, format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.name, "Updated")
        self.assertEqual(self.item.value, 100)  # sin cambios

    def test_full_update_put(self):
        data = {
            "name": "Full Update",
            "value": "200.00",
            "category": self.item.category.pk,
        }
        response = self.client.put(self.url, data, format="json")
        self.assertEqual(response.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.name, "Full Update")

    def test_update_nonexistent_returns_404(self):
        response = self.client.patch("/api/v1/items/99999/", {"name": "X"})
        self.assertEqual(response.status_code, 404)

    def test_update_read_only_field_ignored(self):
        response = self.client.patch(
            self.url, {"created_at": "2020-01-01"}, format="json",
        )
        self.item.refresh_from_db()
        self.assertNotEqual(str(self.item.created_at.date()), "2020-01-01")
```

### Testing delete

```python
class ItemDeleteTest(APITestCase):
    def setUp(self):
        self.admin = UserFactory(admin=True)
        self.client.force_authenticate(user=self.admin)

    def test_delete_returns_204(self):
        item = ItemFactory()
        response = self.client.delete(f"/api/v1/items/{item.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Item.objects.filter(pk=item.pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete("/api/v1/items/99999/")
        self.assertEqual(response.status_code, 404)

    def test_soft_delete(self):
        """Si el endpoint usa soft delete."""
        item = ItemFactory()
        response = self.client.delete(f"/api/v1/items/{item.pk}/")
        self.assertEqual(response.status_code, 204)
        item.refresh_from_db()
        self.assertTrue(item.is_deleted)
        self.assertIsNotNone(item.deleted_at)
```

## 6. Testing Serializers

### Unit testing de serializers

```python
class ItemSerializerTest(TestCase):
    def setUp(self):
        self.user = UserFactory()
        self.category = CategoryFactory()

    def test_valid_data(self):
        data = {
            "name": "Test Item",
            "value": "50.00",
            "category": self.category.pk,
        }
        serializer = ItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_required_field(self):
        serializer = ItemSerializer(data={"value": "10.00"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_invalid_value(self):
        serializer = ItemSerializer(data={"name": "X", "value": "not_a_number"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("value", serializer.errors)
```

### Testing custom validation

```python
def test_custom_field_validation(self):
    data = {"name": "Test", "code": "invalid code!"}
    serializer = ItemSerializer(data=data)
    self.assertFalse(serializer.is_valid())
    self.assertIn("code", serializer.errors)

def test_cross_field_validation(self):
    data = {
        "name": "Test",
        "start_date": "2024-12-01",
        "end_date": "2024-01-01",  # before start
    }
    serializer = ItemSerializer(data=data)
    self.assertFalse(serializer.is_valid())
    self.assertIn("non_field_errors", serializer.errors)
```

### Testing serializer output

```python
def test_serializer_output_fields(self):
    item = ItemFactory(created_by=self.user)
    request = APIRequestFactory().get("/")
    request.user = self.user
    serializer = ItemSerializer(item, context={"request": request})

    self.assertIn("id", serializer.data)
    self.assertIn("name", serializer.data)
    self.assertIn("display_label", serializer.data)
    self.assertNotIn("is_deleted", serializer.data)  # excluido

def test_read_only_fields(self):
    data = {"name": "Test", "id": 999, "created_at": "2020-01-01"}
    serializer = ItemSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    self.assertNotIn("id", serializer.validated_data)
    self.assertNotIn("created_at", serializer.validated_data)

def test_nested_serializer_output(self):
    item = ItemFactory()
    serializer = ItemDetailSerializer(item)
    self.assertIsInstance(serializer.data["category"], dict)
    self.assertIn("name", serializer.data["category"])
```

## 7. Testing Models

### Testing model methods y properties

```python
class ItemModelTest(TestCase):
    def test_str(self):
        item = ItemFactory(name="Test Item")
        self.assertEqual(str(item), "Test Item")

    def test_soft_delete(self):
        item = ItemFactory()
        item.soft_delete()
        item.refresh_from_db()
        self.assertTrue(item.is_deleted)
        self.assertIsNotNone(item.deleted_at)

    def test_computed_property(self):
        item = ItemFactory(name="Test", code="TST")
        self.assertEqual(item.display_label, "TST - Test")
```

### Testing managers

```python
class ItemManagerTest(TestCase):
    def test_active_excludes_deleted(self):
        ItemFactory(is_deleted=False)
        ItemFactory(is_deleted=True)
        self.assertEqual(Item.objects.active().count(), 1)

    def test_recent_filters_by_days(self):
        from django.utils import timezone
        ItemFactory(created_at=timezone.now())
        ItemFactory(created_at=timezone.now() - timezone.timedelta(days=30))
        self.assertEqual(Item.objects.recent(days=7).count(), 1)
```

### Testing constraints

```python
from django.db import IntegrityError

class ItemConstraintTest(TransactionTestCase):
    def test_unique_code_per_category(self):
        category = CategoryFactory()
        ItemFactory(code="ABC", category=category)
        with self.assertRaises(IntegrityError):
            ItemFactory(code="ABC", category=category)

    def test_value_non_negative(self):
        with self.assertRaises(IntegrityError):
            Item.objects.create(name="Bad", value=-10)

    def test_unique_code_different_category_allowed(self):
        cat_a = CategoryFactory()
        cat_b = CategoryFactory()
        ItemFactory(code="ABC", category=cat_a)
        item = ItemFactory(code="ABC", category=cat_b)  # no falla
        self.assertIsNotNone(item.pk)
```

### Testing signals

```python
class ProfileSignalTest(TestCase):
    def test_profile_created_on_user_creation(self):
        user = UserFactory()
        self.assertTrue(hasattr(user, "profile"))
        self.assertIsNotNone(user.profile.pk)
```

## 8. Mocking y External Services

### Mock de servicios externos

```python
from unittest.mock import patch, MagicMock


class ExternalServiceTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    @patch("apps.services.notification.NotificationService.send")
    def test_create_item_sends_notification(self, mock_send):
        data = {"name": "New Item", "value": "50.00"}
        response = self.client.post("/api/v1/items/", data, format="json")
        self.assertEqual(response.status_code, 201)
        mock_send.assert_called_once()

    @patch("apps.services.external_api.ExternalClient.fetch")
    def test_handles_external_api_failure(self, mock_fetch):
        mock_fetch.side_effect = ConnectionError("API down")
        response = self.client.get("/api/v1/items/enriched/")
        self.assertEqual(response.status_code, 503)

    @patch("apps.services.external_api.ExternalClient.fetch")
    def test_uses_external_data(self, mock_fetch):
        mock_fetch.return_value = {"score": 95, "label": "excellent"}
        response = self.client.get("/api/v1/items/1/score/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["score"], 95)
```

### Testing email sending

```python
from django.core import mail


class EmailTest(APITestCase):
    def test_registration_sends_verification_email(self):
        data = {
            "email": "new@test.com",
            "password": "securepass123",
            "password_confirm": "securepass123",
            "first_name": "Test",
        }
        self.client.post("/api/v1/auth/register/", data, format="json")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("new@test.com", mail.outbox[0].to)
        self.assertIn("verificar", mail.outbox[0].subject.lower())

    def test_password_reset_sends_email(self):
        user = UserFactory()
        self.client.post(
            "/api/v1/auth/password-reset/",
            {"email": user.email},
            format="json",
        )
        self.assertEqual(len(mail.outbox), 1)
```

### Testing file uploads

```python
from django.core.files.uploadedfile import SimpleUploadedFile


class FileUploadTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_upload_file(self):
        file = SimpleUploadedFile(
            "test.csv",
            b"col1,col2\nval1,val2",
            content_type="text/csv",
        )
        response = self.client.post(
            "/api/v1/imports/",
            {"file": file, "name": "Test Import"},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)

    def test_reject_invalid_file_type(self):
        file = SimpleUploadedFile(
            "malware.exe",
            b"binary content",
            content_type="application/octet-stream",
        )
        response = self.client.post(
            "/api/v1/imports/",
            {"file": file, "name": "Bad"},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
```

### Mocking Celery tasks

```python
from unittest.mock import patch


class AsyncTaskTest(APITestCase):
    @patch("apps.tasks.process_import.delay")
    def test_create_triggers_async_task(self, mock_delay):
        self.client.force_authenticate(user=UserFactory())
        data = {"name": "Batch Import", "source": "file.csv"}
        response = self.client.post("/api/v1/imports/", data, format="json")
        self.assertEqual(response.status_code, 201)
        mock_delay.assert_called_once_with(response.data["id"])
```

## 9. Database Testing

### assertNumQueries

```python
class QueryOptimizationTest(TestCase):
    def test_list_items_query_count(self):
        """Verificar que no hay N+1."""
        user = UserFactory()
        category = CategoryFactory()
        ItemFactory.create_batch(10, category=category, created_by=user)

        # 1 query items + select_related(category) + 1 prefetch tags
        with self.assertNumQueries(2):
            items = list(
                Item.objects
                .select_related("category")
                .prefetch_related("tags")
            )
            for item in items:
                _ = item.category.name
                _ = list(item.tags.all())

    def test_n_plus_one_detected(self):
        """Demostrar el problema N+1."""
        ItemFactory.create_batch(10)

        # Sin optimize: 1 (items) + 10 (category por item) = 11 queries
        with self.assertNumQueries(11):
            for item in Item.objects.all():
                _ = item.category.name
```

### Testing transactions

```python
from django.db import transaction


class TransactionTest(TransactionTestCase):
    def test_atomic_rollback_on_error(self):
        initial_count = Item.objects.count()

        with self.assertRaises(ValueError):
            with transaction.atomic():
                ItemFactory(name="Will be rolled back")
                raise ValueError("Force rollback")

        self.assertEqual(Item.objects.count(), initial_count)

    def test_select_for_update(self):
        item = ItemFactory(value=100)

        with transaction.atomic():
            locked_item = Item.objects.select_for_update().get(pk=item.pk)
            locked_item.value = 50
            locked_item.save()

        item.refresh_from_db()
        self.assertEqual(item.value, 50)
```

## 10. Coverage y Quality

### pytest-django setup

```ini
# pyproject.toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.test"
python_files = ["tests.py", "test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--tb=short",
    "-v",
    "--reuse-db",
]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks integration tests",
]
```

### Coverage configuration

```ini
# pyproject.toml
[tool.coverage.run]
source = ["apps"]
omit = [
    "*/migrations/*",
    "*/tests/*",
    "*/admin.py",
    "manage.py",
    "*/wsgi.py",
    "*/asgi.py",
]

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
    "pass",
]
```

```bash
# Ejecutar con coverage
pytest --cov=apps --cov-report=html --cov-report=term-missing

# Solo un módulo
pytest tests/test_views.py --cov=apps.views -v
```

### Parametrized tests con pytest

```python
import pytest


@pytest.mark.parametrize("status_code,method,url", [
    (200, "get", "/api/v1/items/"),
    (401, "post", "/api/v1/items/"),
    (401, "delete", "/api/v1/items/1/"),
])
def test_unauthenticated_access(api_client, status_code, method, url):
    response = getattr(api_client, method)(url)
    assert response.status_code == status_code


@pytest.mark.parametrize("role,can_delete", [
    ("user", False),
    ("editor", False),
    ("admin", True),
])
def test_delete_permission_by_role(api_client, role, can_delete, item):
    user = UserFactory(role=role, is_staff=(role == "admin"))
    api_client.force_authenticate(user=user)
    response = api_client.delete(f"/api/v1/items/{item.pk}/")
    if can_delete:
        assert response.status_code == 204
    else:
        assert response.status_code == 403


@pytest.mark.parametrize("data,expected_error_field", [
    ({}, "name"),
    ({"name": ""}, "name"),
    ({"name": "X", "value": "-1"}, "value"),
    ({"name": "X", "value": "abc"}, "value"),
])
def test_create_validation_errors(auth_client, data, expected_error_field):
    response = auth_client.post("/api/v1/items/", data, format="json")
    assert response.status_code == 400
    assert expected_error_field in response.data
```

## 11. Testing Best Practices

### Mixin reutilizable para tests CRUD

```python
class CRUDTestMixin:
    """Mixin con tests CRUD genéricos."""
    base_url: str = ""
    factory_class = None
    valid_data: dict = {}

    def get_detail_url(self, pk) -> str:
        return f"{self.base_url}{pk}/"

    def test_list_authenticated(self):
        self.factory_class.create_batch(3)
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["count"], 3)

    def test_create_valid(self):
        response = self.client.post(
            self.base_url, self.valid_data, format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_create_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            self.base_url, self.valid_data, format="json",
        )
        self.assertEqual(response.status_code, 401)


class ItemCRUDTest(CRUDTestMixin, APITestCase):
    base_url = "/api/v1/items/"
    factory_class = ItemFactory
    valid_data = {"name": "Test", "value": "50.00"}

    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
```

### Testing edge cases

```python
class EdgeCaseTest(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_empty_string_name(self):
        response = self.client.post(
            "/api/v1/items/", {"name": "", "value": "10"}, format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_very_long_name(self):
        response = self.client.post(
            "/api/v1/items/", {"name": "X" * 1000, "value": "10"}, format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_special_characters_in_search(self):
        ItemFactory(name="Test (special) [chars]", created_by=self.user)
        response = self.client.get(
            "/api/v1/items/", {"search": "(special)"},
        )
        self.assertEqual(response.status_code, 200)

    def test_concurrent_updates(self):
        item = ItemFactory(value=100, created_by=self.user)
        url = f"/api/v1/items/{item.pk}/"
        self.client.patch(url, {"value": "200"}, format="json")
        self.client.patch(url, {"value": "300"}, format="json")
        item.refresh_from_db()
        self.assertEqual(item.value, 300)

    def test_zero_value(self):
        response = self.client.post(
            "/api/v1/items/", {"name": "Zero", "value": "0.00"}, format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_max_decimal_precision(self):
        response = self.client.post(
            "/api/v1/items/",
            {"name": "Precise", "value": "99999999.99"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
```

## 12. CI/CD Testing Patterns

### Settings de test

```python
# config/settings/test.py
from .base import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "test_db",
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "TEST": {
            "NAME": "test_db",
        },
    },
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # rápido
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
DEFAULT_FILE_STORAGE = "django.core.files.storage.InMemoryStorage"
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
CELERY_TASK_ALWAYS_EAGER = True
```

### CI workflow (GitHub Actions)

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        env:
          DJANGO_SETTINGS_MODULE: config.settings.test
          DB_HOST: localhost
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: pytest --cov=apps --cov-report=xml -v

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
```

### Test tagging y ejecución selectiva

```python
import pytest

@pytest.mark.slow
def test_heavy_computation(self):
    pass

@pytest.mark.integration
def test_external_api_integration(self):
    pass
```

```bash
# Ejecutar solo tests rápidos
pytest -m "not slow"

# Solo integration tests
pytest -m integration

# Parallel execution
pytest -n auto  # requiere pytest-xdist

# Solo un archivo
pytest tests/test_views.py -v

# Solo un test
pytest tests/test_views.py::ItemCRUDTest::test_create_valid -v
```
