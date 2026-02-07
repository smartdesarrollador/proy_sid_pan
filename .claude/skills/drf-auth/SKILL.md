---
name: drf-auth
description: >
  Patrones y mejores prácticas para autenticación y autorización en Django REST Framework.
  Usar cuando se trabaje con JWT, login, logout, registro, permissions, tokens, roles, RBAC,
  custom user models, password reset, email verification o seguridad de endpoints en DRF.
---

# Authentication & Authorization con Django REST Framework

## 1. JWT Authentication con simplejwt

### Configuración inicial

```python
# settings.py
INSTALLED_APPS = [
    ...
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",  # para logout
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
}

from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "apps.auth.serializers.CustomTokenObtainPairSerializer",
}
```

### URLs para token endpoints

```python
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("auth/token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
]
```

### Custom claims en tokens

```python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user) -> "Token":
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role
        token["is_staff"] = user.is_staff
        return token

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "role": self.user.role,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

### Token generation manual

```python
from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# Blacklist un token (logout)
def blacklist_token(refresh_token: str) -> None:
    token = RefreshToken(refresh_token)
    token.blacklist()
```

### Verificación y decodificación

```python
from rest_framework_simplejwt.tokens import AccessToken, TokenError


def decode_token(token_str: str) -> dict | None:
    try:
        token = AccessToken(token_str)
        return {
            "user_id": token["user_id"],
            "email": token.get("email"),
            "exp": token["exp"],
        }
    except TokenError:
        return None
```

## 2. Authentication Backends

### Session vs Token vs JWT

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # JWT: stateless, para SPAs y mobile
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # Session: para browsable API y apps server-rendered
        "rest_framework.authentication.SessionAuthentication",
        # Token: simple, un token por usuario (stateful)
        "rest_framework.authentication.TokenAuthentication",
    ],
}

# Cuándo usar cada uno:
# JWT          -> SPAs, mobile apps, microservicios
# Session      -> browsable API, apps Django tradicionales
# Token (DRF)  -> APIs simples, scripts, integraciones M2M
# API Key      -> servicios externos, webhooks, integraciones third-party
```

### Custom authentication backend

```python
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class APIKeyAuthentication(BaseAuthentication):
    keyword = "X-API-Key"

    def authenticate(self, request):
        api_key = request.headers.get(self.keyword)
        if not api_key:
            return None  # pasar al siguiente backend

        try:
            key_obj = APIKey.objects.select_related("owner").get(
                key=api_key, is_active=True,
            )
        except APIKey.DoesNotExist:
            raise AuthenticationFailed("API key inválida.")

        key_obj.update_last_used()
        return (key_obj.owner, key_obj)  # (user, auth)

    def authenticate_header(self, request) -> str:
        return self.keyword
```

### Custom authentication con email

```python
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
```

```python
# settings.py
AUTHENTICATION_BACKENDS = [
    "apps.auth.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]
```

## 3. Permission Classes

### Built-in permissions y por acción

```python
from rest_framework.permissions import (
    IsAuthenticated,
    IsAdminUser,
    AllowAny,
    IsAuthenticatedOrReadOnly,
)


class ItemViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        permission_map = {
            "list": [AllowAny],
            "retrieve": [AllowAny],
            "create": [IsAuthenticated],
            "update": [IsAuthenticated, IsOwner],
            "partial_update": [IsAuthenticated, IsOwner],
            "destroy": [IsAdminUser],
        }
        permission_classes = permission_map.get(self.action, [IsAuthenticated])
        return [perm() for perm in permission_classes]
```

### Custom permission classes

```python
from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    message = "Solo el propietario puede realizar esta acción."

    def has_object_permission(self, request, view, obj) -> bool:
        return obj.created_by == request.user


class IsVerifiedUser(BasePermission):
    message = "El email debe estar verificado."

    def has_permission(self, request, view) -> bool:
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_email_verified
        )


class HasRole(BasePermission):
    """Uso: permission_classes = [HasRole.of('admin', 'editor')]"""

    allowed_roles: list[str] = []

    @classmethod
    def of(cls, *roles: str):
        return type(
            "HasRole",
            (cls,),
            {"allowed_roles": list(roles)},
        )

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in self.allowed_roles
```

### Permissions por método HTTP

```python
class ReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user and request.user.is_staff
```

### Combinación con AND/OR

```python
class ItemViewSet(viewsets.ModelViewSet):
    # AND: ambas deben cumplirse
    permission_classes = [IsAuthenticated & IsOwner]

    # OR: al menos una
    permission_classes = [IsAdminUser | IsOwner]

    # Combinación por acción
    def get_permissions(self):
        if self.action == "destroy":
            return [(IsAuthenticated & (IsAdminUser | IsOwner))()]
        return [IsAuthenticated()]
```

## 4. User Model Patterns

### Custom User con AbstractBaseUser

```python
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        USER = "user", "Usuario"
        EDITOR = "editor", "Editor"
        ADMIN = "admin", "Administrador"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
        ]

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
```

### Custom UserManager

```python
from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email: str, password: str = None, **extra) -> "User":
        if not email:
            raise ValueError("El email es obligatorio.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra) -> "User":
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_email_verified", True)
        extra.setdefault("role", "admin")
        return self.create_user(email, password, **extra)
```

```python
# settings.py
AUTH_USER_MODEL = "accounts.User"
```

### Profile model separado

```python
class Profile(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="profile",
    )
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    phone = models.CharField(max_length=20, blank=True)
    preferences = models.JSONField(default=dict)

# Crear profile automáticamente
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

## 5. Authorization Patterns

### Role-Based Access Control (RBAC)

```python
class RolePermission(BasePermission):
    role_permissions = {
        "admin": ["create", "retrieve", "update", "partial_update", "destroy", "list"],
        "editor": ["create", "retrieve", "update", "partial_update", "list"],
        "user": ["retrieve", "list"],
    }

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        user_role = getattr(request.user, "role", None)
        allowed_actions = self.role_permissions.get(user_role, [])
        return view.action in allowed_actions
```

### Group permissions

```python
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


def setup_groups():
    content_type = ContentType.objects.get_for_model(Item)

    editors, _ = Group.objects.get_or_create(name="editors")
    editors.permissions.set(
        Permission.objects.filter(
            content_type=content_type,
            codename__in=["add_item", "change_item", "view_item"],
        )
    )

    viewers, _ = Group.objects.get_or_create(name="viewers")
    viewers.permissions.set(
        Permission.objects.filter(
            content_type=content_type,
            codename="view_item",
        )
    )


class HasGroupPermission(BasePermission):
    required_groups = []

    @classmethod
    def of(cls, *groups: str):
        return type("HasGroupPermission", (cls,), {"required_groups": list(groups)})

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        user_groups = request.user.groups.values_list("name", flat=True)
        return any(g in user_groups for g in self.required_groups)

# Uso
class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasGroupPermission.of("editors", "admins")]
```

### Permissions en serializers

```python
class ItemSerializer(serializers.ModelSerializer):
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ["id", "name", "status", "can_edit", "can_delete"]

    def get_can_edit(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user:
            return False
        return obj.created_by == request.user or request.user.is_staff

    def get_can_delete(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user:
            return False
        return request.user.is_staff
```

## 6. Registration & Login Flows

### Registration endpoint

```python
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "first_name", "last_name", "password", "password_confirm"]

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        return attrs

    def create(self, validated_data: dict) -> "User":
        return User.objects.create_user(**validated_data)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {"user": RegisterSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED,
        )
```

### Email verification

```python
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode


def send_verification_email(user) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"
    # enviar email con verification_url


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request) -> Response:
        uid = request.data.get("uid")
        token = request.data.get("token")

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response(
                {"error": "Link inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Token expirado o inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        return Response({"message": "Email verificado."})
```

### Password reset

```python
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email, is_active=True)
            send_password_reset_email(user)  # misma lógica que verification
        except User.DoesNotExist:
            pass  # no revelar si el email existe

        return Response({"message": "Si el email existe, recibirás instrucciones."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response(
                {"error": "Link inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, data["token"]):
            return Response(
                {"error": "Token expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response({"message": "Contraseña actualizada."})
```

### Change password

```python
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta.")
        return value


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"message": "Contraseña actualizada."})
```

### Logout con token blacklist

```python
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Token inválido o ya expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
```

## 7. Security Best Practices

### Password validation

```python
# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Validar en serializer
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value
```

### Rate limiting en auth endpoints

```python
# settings.py
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "5/minute",
        "auth_register": "3/minute",
        "auth_password_reset": "3/hour",
    },
}


class LoginView(TokenObtainPairView):
    throttle_scope = "auth_login"


class RegisterView(generics.CreateAPIView):
    throttle_scope = "auth_register"


class PasswordResetRequestView(APIView):
    throttle_scope = "auth_password_reset"
```

### CORS configuration

```python
# settings.py
INSTALLED_APPS = [..., "corsheaders"]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # antes de CommonMiddleware
    ...
]

CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "authorization",
    "content-type",
    "x-api-key",
]
```

### JWT en HttpOnly cookies

```python
class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access = response.data.get("access")
            refresh = response.data.get("refresh")

            response.set_cookie(
                key="access_token",
                value=access,
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            )
            # No enviar tokens en body si usas cookies
            del response.data["access"]
            del response.data["refresh"]

        return response


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("access_token")
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
```

## 8. Testing Authentication

### APIClient con autenticación

```python
from rest_framework.test import APITestCase, APIClient


class AuthenticatedTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
        )
        self.client = APIClient()

    def authenticate(self, user=None):
        """Helper para autenticar en tests."""
        self.client.force_authenticate(user=user or self.user)

    def get_auth_header(self, user=None) -> dict:
        """Helper para obtener header JWT."""
        tokens = get_tokens_for_user(user or self.user)
        return {"HTTP_AUTHORIZATION": f"Bearer {tokens['access']}"}
```

### Testing permissions

```python
class ItemPermissionTest(AuthenticatedTestCase):
    def setUp(self):
        super().setUp()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="adminpass123",
            role="admin",
            is_staff=True,
        )
        self.item = Item.objects.create(
            name="Test", created_by=self.user,
        )

    def test_owner_can_update(self):
        self.authenticate(self.user)
        response = self.client.patch(
            f"/api/v1/items/{self.item.pk}/",
            {"name": "Updated"},
        )
        self.assertEqual(response.status_code, 200)

    def test_non_owner_cannot_update(self):
        other_user = User.objects.create_user(
            email="other@example.com", password="pass123",
        )
        self.authenticate(other_user)
        response = self.client.patch(
            f"/api/v1/items/{self.item.pk}/",
            {"name": "Hacked"},
        )
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_cannot_create(self):
        response = self.client.post("/api/v1/items/", {"name": "New"})
        self.assertEqual(response.status_code, 401)

    def test_admin_can_delete(self):
        self.authenticate(self.admin)
        response = self.client.delete(f"/api/v1/items/{self.item.pk}/")
        self.assertEqual(response.status_code, 204)

    def test_non_admin_cannot_delete(self):
        self.authenticate(self.user)
        response = self.client.delete(f"/api/v1/items/{self.item.pk}/")
        self.assertEqual(response.status_code, 403)
```

### Testing token flow

```python
class TokenFlowTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123",
        )

    def test_obtain_token(self):
        response = self.client.post("/api/v1/auth/token/", {
            "email": "test@example.com",
            "password": "testpass123",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_refresh_token(self):
        token_response = self.client.post("/api/v1/auth/token/", {
            "email": "test@example.com",
            "password": "testpass123",
        })
        refresh = token_response.data["refresh"]

        response = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": refresh,
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_invalid_credentials(self):
        response = self.client.post("/api/v1/auth/token/", {
            "email": "test@example.com",
            "password": "wrongpassword",
        })
        self.assertEqual(response.status_code, 401)
```

## 9. Common Patterns

### Get current user endpoint

```python
class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "is_email_verified"]
        read_only_fields = ["id", "email", "role", "is_email_verified"]


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
```

### Refresh token rotation

```python
# settings.py
SIMPLE_JWT = {
    "ROTATE_REFRESH_TOKENS": True,       # nuevo refresh en cada uso
    "BLACKLIST_AFTER_ROTATION": True,     # invalidar el anterior
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# Flow:
# 1. Login -> access + refresh_v1
# 2. Refresh con refresh_v1 -> access_new + refresh_v2 (v1 blacklisted)
# 3. Refresh con refresh_v2 -> access_new + refresh_v3 (v2 blacklisted)
# Si alguien usa refresh_v1 de nuevo -> falla (está blacklisted)
```

### Logout de todos los dispositivos

```python
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        tokens = OutstandingToken.objects.filter(user=request.user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)
        return Response({"message": "Todas las sesiones cerradas."})
```

### URLs completas de auth

```python
urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/logout-all/", LogoutAllView.as_view(), name="logout_all"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("auth/me/", CurrentUserView.as_view(), name="current_user"),
    path("auth/verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
]
```

## 10. Error Handling

### Responses de error personalizadas

```python
from rest_framework.views import exception_handler
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, NotAuthenticated


def auth_exception_handler(exc, context) -> Response | None:
    response = exception_handler(exc, context)
    if response is None:
        return None

    error_map = {
        NotAuthenticated: {
            "code": "not_authenticated",
            "message": "Credenciales de autenticación no proporcionadas.",
        },
        AuthenticationFailed: {
            "code": "authentication_failed",
            "message": "Credenciales inválidas.",
        },
        PermissionDenied: {
            "code": "permission_denied",
            "message": "No tienes permiso para realizar esta acción.",
        },
    }

    error_info = error_map.get(type(exc))
    if error_info:
        response.data = {
            "success": False,
            "error": {
                "code": error_info["code"],
                "message": error_info["message"],
                "status": response.status_code,
            },
        }

    return response
```

```python
# settings.py
REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "apps.core.exceptions.auth_exception_handler",
}
```

### Middleware para token expirado

```python
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class TokenErrorMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if isinstance(exception, (InvalidToken, TokenError)):
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": "token_expired",
                        "message": "Token expirado. Usa el refresh token.",
                    },
                },
                status=401,
            )
        return None
```
