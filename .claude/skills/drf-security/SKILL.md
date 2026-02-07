# Django REST Framework Security - Complete Guide

Patrones y mejores prácticas para asegurar APIs REST con Django REST Framework, cubriendo las vulnerabilidades OWASP Top 10 y técnicas de hardening aplicables a cualquier proyecto.

**Cuándo usar**: Implementación de seguridad, auditorías de código, hardening de APIs, prevención de vulnerabilidades, configuración de producción, pentesting, security reviews.

---

## 1. CORS Configuration

### Setup de django-cors-headers

```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    # ...
]
```

### CORS_ALLOWED_ORIGINS vs CORS_ALLOW_ALL_ORIGINS

```python
# ❌ INSEGURO - Permite cualquier origen (solo para desarrollo local)
CORS_ALLOW_ALL_ORIGINS = True

# ✅ SEGURO - Whitelist explícita de orígenes permitidos
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
    "https://admin.example.com",
]

# Para desarrollo local
if DEBUG:
    CORS_ALLOWED_ORIGINS += [
        "http://localhost:3000",
        "http://localhost:8080",
    ]
```

### CORS_ALLOW_CREDENTIALS

```python
# Para requests con cookies/auth headers
CORS_ALLOW_CREDENTIALS = True

# ⚠️ IMPORTANTE: No uses CORS_ALLOW_ALL_ORIGINS con CORS_ALLOW_CREDENTIALS
# Es una vulnerabilidad de seguridad
```

### Configuración avanzada de CORS

```python
# Control granular de métodos y headers
CORS_ALLOWED_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Headers expuestos al cliente
CORS_EXPOSE_HEADERS = [
    'Content-Length',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
]

# Cache de preflight requests (segundos)
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours
```

### Wildcard domains (usar con precaución)

```python
# ❌ Evitar en producción
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://\w+\.example\.com$",
]

# ✅ Mejor: Lista explícita
CORS_ALLOWED_ORIGINS = [
    "https://app1.example.com",
    "https://app2.example.com",
]
```

---

## 2. SQL Injection Prevention

### Django ORM - Parametrized queries (seguro por defecto)

```python
# ✅ SEGURO - Django ORM usa prepared statements
User.objects.filter(username=user_input)
User.objects.raw(
    "SELECT * FROM auth_user WHERE username = %s",
    [user_input]  # Parámetros seguros
)
```

### Uso INSEGURO de raw() y extra()

```python
# ❌ VULNERABLE a SQL injection
username = request.GET.get('username')
User.objects.raw(f"SELECT * FROM auth_user WHERE username = '{username}'")

# ❌ VULNERABLE
User.objects.extra(
    where=[f"username = '{username}'"]
)
```

### Uso SEGURO de raw() y extra()

```python
# ✅ SEGURO - Usando parámetros
username = request.GET.get('username')
User.objects.raw(
    "SELECT * FROM auth_user WHERE username = %s",
    [username]
)

# ✅ SEGURO - Parámetros en extra()
User.objects.extra(
    where=["username = %s"],
    params=[username]
)
```

### Cursor.execute() seguro

```python
from django.db import connection

# ❌ VULNERABLE
def get_user_insecure(user_id):
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
        return cursor.fetchone()

# ✅ SEGURO
def get_user_secure(user_id):
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM users WHERE id = %s",
            [user_id]
        )
        return cursor.fetchone()
```

### ORM Best Practices

```python
# ✅ Siempre usa Q objects para queries dinámicas
from django.db.models import Q

filters = Q()
if username:
    filters &= Q(username__icontains=username)
if email:
    filters &= Q(email__icontains=email)

User.objects.filter(filters)

# ✅ Usa F expressions para operaciones en DB
from django.db.models import F
Product.objects.filter(price__gt=F('cost') * 1.5)
```

---

## 3. Authentication Security

### Password Hashing

```python
# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',  # Recomendado
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',  # Default de Django
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Instalar: pip install argon2-cffi
```

### Strong Password Validation

```python
# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,  # Incrementar de 8 a 12
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

### Custom Password Validator

```python
# validators.py
from django.core.exceptions import ValidationError
import re

class ComplexityValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain uppercase letter")
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain lowercase letter")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain special character")

    def get_help_text(self):
        return "Password must contain uppercase, lowercase, digit, and special character"

# settings.py
AUTH_PASSWORD_VALIDATORS = [
    # ...
    {
        'NAME': 'myapp.validators.ComplexityValidator',
    },
]
```

### Password Reset Security

```python
# settings.py
# Token expiration (1 hour)
PASSWORD_RESET_TIMEOUT = 3600

# views.py
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

class PasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # ✅ No revelar si el usuario existe
            return Response(
                {"message": "If email exists, reset link was sent"},
                status=status.HTTP_200_OK
            )

        # Generate secure token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Send email with token (implementar)
        send_reset_email(user, uid, token)

        return Response(
            {"message": "If email exists, reset link was sent"},
            status=status.HTTP_200_OK
        )
```

### Account Lockout After Failed Attempts

```python
# models.py
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def increment_failed_attempts(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            # Lock for 30 minutes
            self.locked_until = timezone.now() + timedelta(minutes=30)
        self.save()

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save()

# views.py
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = User.objects.get(username=username)

            if user.is_locked():
                return Response(
                    {"error": "Account temporarily locked"},
                    status=status.HTTP_423_LOCKED
                )

            user = authenticate(username=username, password=password)
            if user:
                user.reset_failed_attempts()
                # Generate tokens...
                return Response({"token": "..."})
            else:
                User.objects.get(username=username).increment_failed_attempts()
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except User.DoesNotExist:
            # Prevent username enumeration
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )
```

### Two-Factor Authentication Pattern

```python
# models.py
import pyotp

class User(AbstractUser):
    otp_secret = models.CharField(max_length=32, blank=True)
    otp_enabled = models.BooleanField(default=False)

    def generate_otp_secret(self):
        self.otp_secret = pyotp.random_base32()
        self.save()
        return self.otp_secret

    def verify_otp(self, token):
        if not self.otp_enabled or not self.otp_secret:
            return False
        totp = pyotp.TOTP(self.otp_secret)
        return totp.verify(token, valid_window=1)

# views.py
class Enable2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        secret = user.generate_otp_secret()

        # Generate QR code URI
        totp = pyotp.TOTP(secret)
        qr_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="MyApp"
        )

        return Response({"qr_uri": qr_uri, "secret": secret})

class Verify2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        user = request.user

        if user.verify_otp(token):
            user.otp_enabled = True
            user.save()
            return Response({"message": "2FA enabled"})

        return Response(
            {"error": "Invalid token"},
            status=status.HTTP_400_BAD_REQUEST
        )
```

---

## 4. JWT Security

### Token Signing Algorithms

```python
# settings.py
# ✅ SEGURO - Asymmetric algorithm para public APIs
SIMPLE_JWT = {
    'ALGORITHM': 'RS256',  # Requires public/private key pair
    'SIGNING_KEY': PRIVATE_KEY,
    'VERIFYING_KEY': PUBLIC_KEY,
}

# ✅ Aceptable para internal APIs
SIMPLE_JWT = {
    'ALGORITHM': 'HS256',  # Symmetric, secret key based
    'SIGNING_KEY': SECRET_KEY,
}

# ❌ NUNCA uses 'none' algorithm
```

### Secret Key Management

```python
# ❌ INSEGURO
SIMPLE_JWT = {
    'SIGNING_KEY': 'my-secret-key-123',
}

# ✅ SEGURO - Load from environment
import os
from pathlib import Path

SIMPLE_JWT = {
    'SIGNING_KEY': os.environ.get('JWT_SECRET_KEY'),
    # For RS256
    'ALGORITHM': 'RS256',
    'SIGNING_KEY': Path('/etc/secrets/jwt_private.pem').read_text(),
    'VERIFYING_KEY': Path('/etc/secrets/jwt_public.pem').read_text(),
}
```

### Token Expiration Times

```python
from datetime import timedelta

SIMPLE_JWT = {
    # Access token: 15 minutes
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    # Refresh token: 7 days
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    # Sliding token: extends on use
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
```

### Refresh Token Rotation

```python
SIMPLE_JWT = {
    # ✅ Rotate refresh tokens on use
    'ROTATE_REFRESH_TOKENS': True,
    # ✅ Blacklist old refresh tokens
    'BLACKLIST_AFTER_ROTATION': True,
}

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ...
    'rest_framework_simplejwt.token_blacklist',
]

# Run migrations
# python manage.py migrate token_blacklist
```

### Token Blacklisting

```python
# views.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            # Blacklist the token
            token.blacklist()

            return Response({"message": "Logged out successfully"})
        except Exception as e:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )
```

### Token Payload Security

```python
# ❌ INSEGURO - No incluir datos sensibles en payload
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['password_hash'] = user.password  # ❌ NUNCA
    refresh['ssn'] = user.ssn  # ❌ NUNCA
    refresh['credit_card'] = user.credit_card  # ❌ NUNCA
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# ✅ SEGURO - Solo datos no sensibles
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # Solo user_id está incluido por defecto
    # Opcionalmente agregar claims públicos
    refresh['email'] = user.email  # OK si es necesario
    refresh['role'] = user.role  # OK
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
```

### JTI (JWT ID) for Token Tracking

```python
SIMPLE_JWT = {
    # ✅ Enable JTI claim para tracking único
    'JTI_CLAIM': 'jti',
}

# Custom token
from rest_framework_simplejwt.tokens import Token
import uuid

class TrackedToken(Token):
    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token['jti'] = str(uuid.uuid4())
        token['user_id'] = user.id
        token['issued_at'] = timezone.now().isoformat()
        return token
```

---

## 5. Rate Limiting

### Throttling Classes Configuration

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    }
}
```

### Per-User and Per-IP Rate Limits

```python
# throttling.py
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class BurstRateThrottle(UserRateThrottle):
    scope = 'burst'

class SustainedRateThrottle(UserRateThrottle):
    scope = 'sustained'

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',
        'user': '100/minute',
        'burst': '60/minute',
        'sustained': '1000/day',
    }
}

# views.py
class MyAPIView(APIView):
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]
```

### Different Limits Per Endpoint

```python
# throttling.py
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'

class PasswordResetThrottle(AnonRateThrottle):
    scope = 'password_reset'

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'login': '5/hour',  # Strict para login
        'register': '3/hour',  # Strict para registro
        'password_reset': '3/hour',  # Strict para reset
    }
}

# views.py
class LoginView(APIView):
    throttle_classes = [LoginRateThrottle]

class RegisterView(APIView):
    throttle_classes = [RegisterRateThrottle]

class PasswordResetView(APIView):
    throttle_classes = [PasswordResetThrottle]
```

### Redis-Based Throttling for Distributed Systems

```python
# throttling.py
from rest_framework.throttling import SimpleRateThrottle
from django.core.cache import cache
import time

class RedisRateThrottle(SimpleRateThrottle):
    cache = cache  # Uses CACHES['default'] from settings
    scope = 'redis_throttle'

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)

        return f'throttle_{self.scope}_{ident}'

# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'redis_throttle': '100/minute',
    }
}
```

### Rate Limit Headers

```python
# middleware.py
class RateLimitHeaderMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add rate limit headers
        if hasattr(request, 'throttle_wait'):
            response['X-RateLimit-Limit'] = request.throttle_limit
            response['X-RateLimit-Remaining'] = request.throttle_remaining
            response['X-RateLimit-Reset'] = request.throttle_reset

        return response

# settings.py
MIDDLEWARE = [
    # ...
    'myapp.middleware.RateLimitHeaderMiddleware',
]
```

### Brute Force Protection on Login

```python
# throttling.py
from rest_framework.throttling import SimpleRateThrottle
from django.core.cache import cache

class LoginAttemptThrottle(SimpleRateThrottle):
    scope = 'login_attempt'

    def get_cache_key(self, request, view):
        # Throttle por username + IP
        username = request.data.get('username', '')
        ip = self.get_ident(request)
        return f'login_attempt_{username}_{ip}'

    def allow_request(self, request, view):
        if request.method != 'POST':
            return True

        cache_key = self.get_cache_key(request, view)
        attempts = cache.get(cache_key, 0)

        if attempts >= 5:
            # Block for 30 minutes after 5 failed attempts
            return False

        return super().allow_request(request, view)

# views.py
class LoginView(APIView):
    throttle_classes = [LoginAttemptThrottle]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user:
            # Reset throttle on successful login
            cache_key = f'login_attempt_{username}_{self.get_client_ip(request)}'
            cache.delete(cache_key)
            # ...
        else:
            # Increment failed attempts
            cache_key = f'login_attempt_{username}_{self.get_client_ip(request)}'
            attempts = cache.get(cache_key, 0)
            cache.set(cache_key, attempts + 1, timeout=1800)  # 30 min
            # ...
```

---

## 6. HTTPS & SSL/TLS

### HTTPS Redirect

```python
# settings.py
# ✅ Force HTTPS in production
SECURE_SSL_REDIRECT = True

# Development: Allow HTTP
if DEBUG:
    SECURE_SSL_REDIRECT = False
```

### Proxy SSL Header Configuration

```python
# settings.py
# For apps behind load balancers (AWS ELB, nginx, etc.)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

### HTTP Strict Transport Security (HSTS)

```python
# settings.py
# ✅ Enable HSTS
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Development: Disable HSTS
if DEBUG:
    SECURE_HSTS_SECONDS = 0
```

### Complete HTTPS Settings

```python
# settings.py - Production configuration
if not DEBUG:
    # Force HTTPS
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Proxy configuration
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

---

## 7. Security Headers

### Django Security Middleware

```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',  # First
    # ...
]

# Security header settings
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'  # or 'SAMEORIGIN'
```

### Content Security Policy (CSP)

```python
# Install: pip install django-csp

# settings.py
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',
    # ...
]

# CSP Configuration
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://cdn.example.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_CONNECT_SRC = ("'self'", "https://api.example.com")
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

# Report violations
CSP_REPORT_URI = '/csp-report/'
CSP_REPORT_ONLY = False  # Set True for testing
```

### Custom Security Headers Middleware

```python
# middleware.py
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'

        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'

        # X-XSS-Protection (legacy, but still useful)
        response['X-XSS-Protection'] = '1; mode=block'

        # Referrer-Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy (formerly Feature-Policy)
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'accelerometer=()'
        )

        return response

# settings.py
MIDDLEWARE = [
    'myapp.middleware.SecurityHeadersMiddleware',
    # ...
]
```

### django-security Package

```python
# Install: pip install django-security

# settings.py
INSTALLED_APPS = [
    'security',
    # ...
]

MIDDLEWARE = [
    'security.middleware.DoNotTrackMiddleware',
    'security.middleware.ContentNoSniff',
    'security.middleware.XssProtectMiddleware',
    'security.middleware.XFrameOptionsMiddleware',
    # ...
]
```

---

## 8. CSRF Protection

### CSRF Configuration

```python
# settings.py
# ✅ CSRF tokens seguros
CSRF_COOKIE_SECURE = True  # HTTPS only
CSRF_COOKIE_HTTPONLY = True  # No JavaScript access
CSRF_COOKIE_SAMESITE = 'Strict'  # or 'Lax'
CSRF_USE_SESSIONS = False  # Use cookie-based CSRF
CSRF_COOKIE_AGE = 31449600  # 1 year

# Development
if DEBUG:
    CSRF_COOKIE_SECURE = False
```

### CSRF with APIs

```python
# views.py
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# ❌ EVITAR - csrf_exempt en endpoints sensibles
@method_decorator(csrf_exempt, name='dispatch')
class UnsafeAPIView(APIView):
    pass

# ✅ MEJOR - Usa token authentication + CSRF
class SafeAPIView(APIView):
    authentication_classes = [SessionAuthentication]
    # CSRF enabled por defecto

# ✅ Para public endpoints (read-only)
@method_decorator(csrf_exempt, name='dispatch')
class PublicReadOnlyView(APIView):
    def get(self, request):
        # OK para GET público
        pass
```

### CSRF con JWT Authentication

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# JWT no requiere CSRF protection porque no usa cookies
# Pero si usas SessionAuthentication + JWT, necesitas CSRF
```

### Double Submit Cookies Pattern

```python
# views.py
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view

@api_view(['GET'])
def csrf_token_view(request):
    """
    Endpoint para obtener CSRF token para SPAs
    """
    csrf_token = get_token(request)
    return Response({'csrf_token': csrf_token})

# Frontend debe incluir token en headers
# X-CSRFToken: <token-value>
```

### When to Use/Skip CSRF in APIs

```python
"""
✅ USA CSRF:
- Session-based authentication
- Cookie-based authentication
- Hybrid authentication (session + token)
- Endpoints que modifican datos (POST, PUT, DELETE)

❌ SKIP CSRF (con csrf_exempt):
- Pure JWT/token authentication (no cookies)
- Public read-only endpoints
- Webhooks de third-party services
- API-to-API communication sin browser
"""

# Example: Public webhook
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_endpoint(request):
    # Verify webhook signature instead of CSRF
    signature = request.headers.get('X-Webhook-Signature')
    if not verify_webhook_signature(request.body, signature):
        return Response(status=403)
    # Process webhook...
```

---

## 9. Input Validation & Sanitization

### Serializer Validation

```python
# serializers.py
from rest_framework import serializers
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_username(self, value):
        # ✅ Validación estricta
        if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', value):
            raise serializers.ValidationError(
                "Username must be 3-20 alphanumeric characters"
            )
        return value

    def validate_email(self, value):
        # ✅ Normalizar email
        value = value.lower().strip()
        return value

    def validate(self, data):
        # ✅ Cross-field validation
        if data.get('password') == data.get('username'):
            raise serializers.ValidationError(
                "Password cannot be the same as username"
            )
        return data
```

### File Upload Validation

```python
# serializers.py
from django.core.validators import FileExtensionValidator
import magic

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'pdf']
            )
        ]
    )

    def validate_file(self, value):
        # ✅ Validate file size (5MB limit)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 5MB")

        # ✅ Validate MIME type (not just extension)
        mime = magic.from_buffer(value.read(1024), mime=True)
        value.seek(0)  # Reset file pointer

        allowed_mimes = [
            'image/jpeg',
            'image/png',
            'application/pdf'
        ]

        if mime not in allowed_mimes:
            raise serializers.ValidationError(
                f"Invalid file type: {mime}"
            )

        return value
```

### Filename Sanitization

```python
# utils.py
import os
import uuid
import re

def sanitize_filename(filename):
    """
    ✅ Sanitize filename para prevenir path traversal
    """
    # Remove path components
    filename = os.path.basename(filename)

    # Remove dangerous characters
    filename = re.sub(r'[^\w\s\.-]', '', filename)

    # Prevent ../ attacks
    filename = filename.replace('..', '')

    # Prevent null bytes
    filename = filename.replace('\x00', '')

    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]

    return f"{name}{ext}"

def generate_safe_filename(original_filename):
    """
    ✅ Generate unique, safe filename
    """
    ext = os.path.splitext(original_filename)[1].lower()
    safe_name = f"{uuid.uuid4()}{ext}"
    return safe_name

# views.py
class FileUploadView(APIView):
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        safe_filename = generate_safe_filename(uploaded_file.name)

        # Save file with safe name
        # ...
```

### Dangerous File Extensions Blocking

```python
# validators.py
from django.core.exceptions import ValidationError

DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js',
    'jar', 'msi', 'dll', 'sh', 'php', 'py', 'rb', 'pl',
]

def validate_not_dangerous_file(value):
    ext = value.name.split('.')[-1].lower()
    if ext in DANGEROUS_EXTENSIONS:
        raise ValidationError(
            f"File type '{ext}' is not allowed for security reasons"
        )

# serializers.py
class SafeFileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(
        validators=[validate_not_dangerous_file]
    )
```

### Path Traversal Prevention

```python
# ❌ VULNERABLE
def download_file(request, filename):
    file_path = os.path.join('/uploads/', filename)
    # filename = "../../../etc/passwd" = VULNERABLE
    return FileResponse(open(file_path, 'rb'))

# ✅ SEGURO
def download_file_secure(request, filename):
    # Sanitize filename
    safe_filename = os.path.basename(filename)
    file_path = os.path.join('/uploads/', safe_filename)

    # Verify path is within allowed directory
    real_path = os.path.realpath(file_path)
    if not real_path.startswith(os.path.realpath('/uploads/')):
        return Response(status=403)

    if not os.path.exists(real_path):
        return Response(status=404)

    return FileResponse(open(real_path, 'rb'))
```

### HTML Escaping

```python
# Django auto-escapes en templates, pero en APIs:
from django.utils.html import escape

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content', 'author']

    def validate_content(self, value):
        # ✅ Escape HTML si permites contenido user-generated
        return escape(value)

# O usa bleach para sanitizar HTML
import bleach

def validate_content(self, value):
    # Allow safe tags only
    allowed_tags = ['p', 'b', 'i', 'u', 'em', 'strong', 'a']
    allowed_attrs = {'a': ['href', 'title']}

    clean_content = bleach.clean(
        value,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True
    )
    return clean_content
```

---

## 10. XSS Prevention

### Django Auto-Escaping

```python
# templates.html
<!-- ✅ Auto-escaped por defecto -->
<div>{{ user_input }}</div>

<!-- ❌ PELIGROSO - bypass auto-escape -->
<div>{{ user_input|safe }}</div>

<!-- ✅ Si necesitas HTML, sanitiza primero -->
<div>{{ user_input|bleach }}</div>
```

### JSONResponse and XSS

```python
# views.py
from django.http import JsonResponse

# ✅ SEGURO - JSONResponse sets correct Content-Type
def api_view(request):
    user_input = request.GET.get('q', '')
    return JsonResponse({
        'query': user_input,  # Auto-escaped in JSON
        'results': []
    })

# ❌ VULNERABLE - HTML response with user input
def vulnerable_view(request):
    user_input = request.GET.get('q', '')
    html = f"<div>Results for: {user_input}</div>"
    return HttpResponse(html)  # XSS vulnerability

# ✅ SEGURO - Escape user input
from django.utils.html import escape

def safe_view(request):
    user_input = request.GET.get('q', '')
    html = f"<div>Results for: {escape(user_input)}</div>"
    return HttpResponse(html)
```

### Sanitizing User Input in APIs

```python
# serializers.py
import bleach

class PostSerializer(serializers.ModelSerializer):
    content = serializers.CharField()

    class Meta:
        model = Post
        fields = ['title', 'content']

    def validate_content(self, value):
        # ✅ Sanitize HTML content
        clean = bleach.clean(
            value,
            tags=['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
            attributes={'a': ['href', 'title']},
            protocols=['http', 'https', 'mailto'],
            strip=True
        )
        return clean
```

### Correct Content-Type Headers

```python
# middleware.py
class ContentTypeSecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # ✅ Ensure JSON responses have correct Content-Type
        if hasattr(response, 'data') and isinstance(response.data, dict):
            response['Content-Type'] = 'application/json'

        # ✅ Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'

        return response
```

### URL Validation

```python
# validators.py
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from urllib.parse import urlparse

def validate_safe_url(url):
    """
    ✅ Validate URL is safe (no javascript:, data:, etc.)
    """
    validator = URLValidator(schemes=['http', 'https'])

    try:
        validator(url)
    except ValidationError:
        raise ValidationError("Invalid URL")

    parsed = urlparse(url)

    # Prevent javascript: and data: URLs
    if parsed.scheme not in ['http', 'https']:
        raise ValidationError(
            f"URL scheme '{parsed.scheme}' is not allowed"
        )

    return url

# serializers.py
class LinkSerializer(serializers.Serializer):
    url = serializers.URLField(validators=[validate_safe_url])
```

### Escape Data in Responses

```python
# serializers.py
from django.utils.html import escape

class SafeUserSerializer(serializers.ModelSerializer):
    bio = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['username', 'bio']

    def get_bio(self, obj):
        # ✅ Escape HTML si el dato viene de user input
        return escape(obj.bio)
```

---

## 11. Authorization & Access Control

### Principle of Least Privilege

```python
# permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    ✅ Solo el owner puede editar
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for owner
        return obj.owner == request.user

# views.py
class PostDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
```

### Object-Level Permissions

```python
# permissions.py
class CanEditDocument(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # ✅ Check object-level permission
        if request.method in permissions.SAFE_METHODS:
            return obj.is_public or request.user in obj.viewers.all()

        return request.user in obj.editors.all()

# views.py
class DocumentDetailView(RetrieveUpdateAPIView):
    queryset = Document.objects.all()
    permission_classes = [IsAuthenticated, CanEditDocument]

    def get_queryset(self):
        # ✅ Filter queryset by user access
        user = self.request.user
        return Document.objects.filter(
            Q(is_public=True) |
            Q(owner=user) |
            Q(viewers=user) |
            Q(editors=user)
        ).distinct()
```

### Horizontal Privilege Escalation Prevention

```python
# ❌ VULNERABLE - User can access other users' data
class UserProfileView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # URL: /api/users/123/profile/
    # User A can access User B's profile

# ✅ SEGURO - Only own profile
class UserProfileView(RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Always return authenticated user's profile
        return self.request.user

# ✅ ALTERNATIVA - Verificar ownership
class UserDataView(RetrieveAPIView):
    queryset = UserData.objects.all()

    def get_object(self):
        obj = super().get_object()
        if obj.user != self.request.user:
            raise PermissionDenied("Cannot access other user's data")
        return obj
```

### Vertical Privilege Escalation Prevention

```python
# permissions.py
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        # ✅ Only admins can access
        return request.user and request.user.is_staff

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

# views.py
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperUser]

# ❌ VULNERABLE - Not checking role
class DeleteUserView(DestroyAPIView):
    queryset = User.objects.all()
    # Any authenticated user can delete any user!

# ✅ SEGURO - Role check
class DeleteUserView(DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]

    def perform_destroy(self, instance):
        if instance.is_superuser and not self.request.user.is_superuser:
            raise PermissionDenied("Cannot delete superuser")
        instance.delete()
```

### IDOR Prevention

```python
# ❌ VULNERABLE - Insecure Direct Object Reference
# URL: /api/orders/12345/
# Attacker can enumerate: 12344, 12346, etc.

# ✅ SEGURO - Use UUIDs instead of sequential IDs
# models.py
import uuid
from django.db import models

class Order(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # ...

# URL: /api/orders/550e8400-e29b-41d4-a716-446655440000/
# Imposible de enumerar

# ✅ TAMBIÉN: Verificar ownership
class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        # ✅ Filter by authenticated user
        return Order.objects.filter(user=self.request.user)
```

### UUID vs Sequential IDs

```python
# models.py
import uuid

# ❌ Sequential IDs (predecibles)
class Document(models.Model):
    id = models.AutoField(primary_key=True)  # 1, 2, 3, 4...

# ✅ UUIDs (impredecibles)
class Document(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

# ✅ Hybrid: Sequential internal + UUID public
class Document(models.Model):
    id = models.AutoField(primary_key=True)
    public_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

# serializers.py
class DocumentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='public_id', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'content']  # Expone public_id como 'id'
```

### Authorization Checks on Every Endpoint

```python
# ❌ VULNERABLE - Missing permission check
class UpdatePostView(UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    # Anyone can update any post!

# ✅ SEGURO - Permission check
class UpdatePostView(UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        # ✅ Additional filter by user
        return Post.objects.filter(author=self.request.user)

# ✅ MEJOR - Check in perform_update
class UpdatePostView(UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        # ✅ Verify ownership before update
        if serializer.instance.author != self.request.user:
            raise PermissionDenied("Cannot edit other user's post")
        serializer.save()
```

---

## 12. Session Security

### Secure Session Cookies

```python
# settings.py
# ✅ Secure session configuration
SESSION_COOKIE_SECURE = True  # HTTPS only
SESSION_COOKIE_HTTPONLY = True  # No JavaScript access
SESSION_COOKIE_SAMESITE = 'Strict'  # CSRF protection
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_SAVE_EVERY_REQUEST = False  # Performance

# Development
if DEBUG:
    SESSION_COOKIE_SECURE = False
```

### Session Timeout

```python
# settings.py
# Session expires after 30 minutes of inactivity
SESSION_COOKIE_AGE = 1800

# Custom middleware for absolute timeout
# middleware.py
from django.utils import timezone
from datetime import timedelta

class SessionTimeoutMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Check last activity
            last_activity = request.session.get('last_activity')

            if last_activity:
                last_activity = timezone.datetime.fromisoformat(last_activity)
                if timezone.now() - last_activity > timedelta(minutes=30):
                    # Session expired
                    request.session.flush()
                    return HttpResponse("Session expired", status=401)

            # Update last activity
            request.session['last_activity'] = timezone.now().isoformat()

        return self.get_response(request)
```

### Secure Session Storage

```python
# settings.py
# ✅ Use database sessions (more secure than file-based)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# ✅ O cache-based para performance
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ✅ Hybrid: cache + database
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
```

### Session Fixation Prevention

```python
# Django previene session fixation automáticamente
# Al hacer login, se crea nueva session

# views.py
from django.contrib.auth import login

def login_view(request):
    user = authenticate(username=username, password=password)
    if user:
        # ✅ login() cycles the session key
        login(request, user)
        # Nueva session key asignada
```

---

## 13. API Key Security

### Secure API Key Generation

```python
# models.py
import secrets
import hashlib

class APIKey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    key_hash = models.CharField(max_length=64, unique=True)
    prefix = models.CharField(max_length=8)
    created = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    @staticmethod
    def generate_key():
        """Generate secure random API key"""
        key = secrets.token_urlsafe(32)
        return f"sk_{key}"

    @classmethod
    def create_key(cls, user):
        """Create new API key for user"""
        key = cls.generate_key()

        # Store hash, not plain key
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        prefix = key[:8]

        api_key = cls.objects.create(
            user=user,
            key_hash=key_hash,
            prefix=prefix
        )

        # ⚠️ Return plain key ONLY ONCE
        return key, api_key

    @classmethod
    def validate_key(cls, key):
        """Validate API key"""
        key_hash = hashlib.sha256(key.encode()).hexdigest()

        try:
            api_key = cls.objects.get(key_hash=key_hash, is_active=True)
            api_key.last_used = timezone.now()
            api_key.save(update_fields=['last_used'])
            return api_key
        except cls.DoesNotExist:
            return None
```

### API Key Authentication

```python
# authentication.py
from rest_framework import authentication
from rest_framework import exceptions

class APIKeyAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        api_key = request.META.get('HTTP_X_API_KEY')

        if not api_key:
            return None

        api_key_obj = APIKey.validate_key(api_key)

        if not api_key_obj:
            raise exceptions.AuthenticationFailed('Invalid API key')

        return (api_key_obj.user, api_key_obj)

# views.py
class ProtectedAPIView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAuthenticated]
```

### API Key Rotation

```python
# views.py
class RotateAPIKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_key_id = request.data.get('key_id')

        try:
            old_key = APIKey.objects.get(
                id=old_key_id,
                user=request.user,
                is_active=True
            )

            # Deactivate old key
            old_key.is_active = False
            old_key.save()

            # Generate new key
            new_key, api_key_obj = APIKey.create_key(request.user)

            return Response({
                'api_key': new_key,  # Show only once
                'key_id': api_key_obj.id,
                'prefix': api_key_obj.prefix,
            })

        except APIKey.DoesNotExist:
            return Response(
                {'error': 'API key not found'},
                status=404
            )
```

### API Key Permissions and Scopes

```python
# models.py
class APIKey(models.Model):
    # ...
    scopes = models.JSONField(default=list)

    def has_scope(self, scope):
        return scope in self.scopes

# permissions.py
class HasAPIKeyScope(permissions.BasePermission):
    def has_permission(self, request, view):
        if not hasattr(request, 'auth'):
            return False

        if not isinstance(request.auth, APIKey):
            return True  # Not API key auth, skip

        required_scope = getattr(view, 'required_scope', None)
        if not required_scope:
            return True

        return request.auth.has_scope(required_scope)

# views.py
class ReadDataView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAuthenticated, HasAPIKeyScope]
    required_scope = 'read:data'

class WriteDataView(APIView):
    authentication_classes = [APIKeyAuthentication]
    permission_classes = [IsAuthenticated, HasAPIKeyScope]
    required_scope = 'write:data'
```

### Revoking API Keys

```python
# views.py
class RevokeAPIKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, key_id):
        try:
            api_key = APIKey.objects.get(
                id=key_id,
                user=request.user
            )
            api_key.is_active = False
            api_key.save()

            return Response({'message': 'API key revoked'})
        except APIKey.DoesNotExist:
            return Response(
                {'error': 'API key not found'},
                status=404
            )

class ListAPIKeysView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = APIKeySerializer

    def get_queryset(self):
        # ✅ Only show user's own keys
        # ✅ Never return key_hash
        return APIKey.objects.filter(
            user=self.request.user
        ).values('id', 'prefix', 'created', 'last_used', 'is_active')
```

---

## 14. Sensitive Data Protection

### Avoid Logging Sensitive Data

```python
# ❌ INSEGURO - Logging sensitive data
import logging
logger = logging.getLogger(__name__)

def process_payment(request):
    credit_card = request.data.get('credit_card')
    logger.info(f"Processing payment: {credit_card}")  # ❌ NUNCA

# ✅ SEGURO - Mask sensitive data
def process_payment(request):
    credit_card = request.data.get('credit_card')
    masked = f"****-****-****-{credit_card[-4:]}"
    logger.info(f"Processing payment: {masked}")
```

### Masking Sensitive Fields in Logs

```python
# utils.py
def mask_sensitive_data(data, fields=['password', 'ssn', 'credit_card']):
    """Mask sensitive fields in dict"""
    if not isinstance(data, dict):
        return data

    masked = data.copy()
    for field in fields:
        if field in masked:
            value = str(masked[field])
            if len(value) > 4:
                masked[field] = f"****{value[-4:]}"
            else:
                masked[field] = "****"

    return masked

# logging.py
import logging

class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        # Redact sensitive patterns
        message = record.getMessage()

        # Credit card numbers
        message = re.sub(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', '****-****-****-****', message)

        # SSN
        message = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '***-**-****', message)

        # Email (partial)
        message = re.sub(r'\b([a-zA-Z0-9._%+-]+)@', r'****@', message)

        record.msg = message
        return True

# settings.py
LOGGING = {
    'version': 1,
    'filters': {
        'sensitive_data': {
            '()': 'myapp.logging.SensitiveDataFilter',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'app.log',
            'filters': ['sensitive_data'],
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### PII Handling

```python
# serializers.py
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone']
        extra_kwargs = {
            'phone': {'write_only': True},  # ✅ No exponer en GET
        }

# ✅ Serializer para admin vs public
class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']  # Solo datos públicos

class UserPrivateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'address']

# views.py
class UserDetailView(RetrieveAPIView):
    def get_serializer_class(self):
        if self.request.user == self.get_object():
            return UserPrivateSerializer  # Own profile
        return UserPublicSerializer  # Other users
```

### Encryption at Rest

```python
# Install: pip install django-fernet-fields

# models.py
from fernet_fields import EncryptedTextField, EncryptedCharField

class Patient(models.Model):
    name = models.CharField(max_length=100)
    ssn = EncryptedCharField(max_length=11)  # ✅ Encrypted in DB
    medical_history = EncryptedTextField()

    class Meta:
        db_table = 'patients'

# settings.py
# Generate key: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEYS = [
    os.environ.get('FERNET_KEY'),
]
```

### Environment Variables for Secrets

```python
# ❌ INSEGURO - Hardcoded secrets
# settings.py
SECRET_KEY = 'django-insecure-hardcoded-key'
DATABASE_PASSWORD = 'mypassword123'

# ✅ SEGURO - Environment variables
import os
from pathlib import Path

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY environment variable not set")

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

### .env Files and .gitignore

```bash
# .env.example (commit to repo)
DJANGO_SECRET_KEY=your-secret-key-here
DB_NAME=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# .env (NOT in repo, add to .gitignore)
DJANGO_SECRET_KEY=actual-production-key-xyz123
DB_NAME=production_db
DB_USER=prod_user
DB_PASSWORD=secure-password-xyz
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

```python
# .gitignore
.env
.env.local
.env.production
*.env
secrets/
```

```python
# settings.py
from pathlib import Path
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
```

### Secrets Management

```python
# AWS Secrets Manager
import boto3
from botocore.exceptions import ClientError
import json

def get_secret(secret_name):
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name='us-east-1'
    )

    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except ClientError as e:
        raise e

# settings.py
if not DEBUG:
    secrets = get_secret('production/django')
    SECRET_KEY = secrets['SECRET_KEY']
    DATABASES['default']['PASSWORD'] = secrets['DB_PASSWORD']
```

---

## 15. File Upload Security

### Comprehensive File Upload Validation

```python
# validators.py
from django.core.exceptions import ValidationError
import magic
import os

def validate_file_upload(file):
    """Comprehensive file upload validation"""

    # 1. ✅ File size (10MB limit)
    max_size = 10 * 1024 * 1024
    if file.size > max_size:
        raise ValidationError(f"File size exceeds {max_size} bytes")

    # 2. ✅ File extension
    allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
    ext = os.path.splitext(file.name)[1][1:].lower()
    if ext not in allowed_extensions:
        raise ValidationError(f"File extension '{ext}' not allowed")

    # 3. ✅ MIME type validation (not just extension)
    mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)

    allowed_mimes = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'application/pdf': ['pdf'],
        'application/msword': ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    }

    if mime not in allowed_mimes:
        raise ValidationError(f"MIME type '{mime}' not allowed")

    # 4. ✅ Verify extension matches MIME type
    if ext not in allowed_mimes[mime]:
        raise ValidationError(
            f"File extension '{ext}' does not match MIME type '{mime}'"
        )

    return file

# serializers.py
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(validators=[validate_file_upload])
```

### Virus Scanning Integration

```python
# Install: pip install pyclamd

# utils.py
import pyclamd

def scan_file_for_viruses(file):
    """Scan file for viruses using ClamAV"""
    try:
        cd = pyclamd.ClamdUnixSocket()

        # Test connection
        if not cd.ping():
            raise Exception("ClamAV not running")

        # Scan file
        file.seek(0)
        result = cd.scan_stream(file.read())
        file.seek(0)

        if result:
            # Virus found
            return False, result

        return True, None

    except Exception as e:
        # Log error, but don't block upload in case of scanner failure
        logger.error(f"Virus scan failed: {e}")
        # In production, you might want to block uploads if scanner fails
        return True, None

# views.py
class SecureFileUploadView(APIView):
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']

        # ✅ Scan for viruses
        is_safe, virus_info = scan_file_for_viruses(uploaded_file)
        if not is_safe:
            return Response(
                {'error': 'File contains malware'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save file...
```

### Storage Location Outside MEDIA_ROOT

```python
# settings.py
import os

# ✅ User uploads go to separate directory
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
UPLOAD_ROOT = os.path.join(BASE_DIR, 'uploads')  # Separate from MEDIA_ROOT

# ✅ Use custom storage
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# views.py
def save_uploaded_file(uploaded_file):
    # ✅ Save outside web root
    upload_path = os.path.join(settings.UPLOAD_ROOT, 'user_uploads')
    os.makedirs(upload_path, exist_ok=True)

    safe_filename = generate_safe_filename(uploaded_file.name)
    file_path = os.path.join(upload_path, safe_filename)

    with open(file_path, 'wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    return file_path
```

### Randomized Filenames

```python
# utils.py
import uuid
import os

def generate_random_filename(original_filename):
    """Generate random filename preserving extension"""
    ext = os.path.splitext(original_filename)[1].lower()
    random_name = f"{uuid.uuid4()}{ext}"
    return random_name

# With timestamp
from django.utils import timezone

def generate_timestamped_filename(original_filename):
    """Generate filename with timestamp"""
    ext = os.path.splitext(original_filename)[1].lower()
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    random_suffix = uuid.uuid4().hex[:8]
    return f"{timestamp}_{random_suffix}{ext}"

# models.py
def upload_to(instance, filename):
    """Custom upload_to function"""
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('uploads', str(instance.user.id), new_filename)

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to=upload_to)
    original_filename = models.CharField(max_length=255)
```

### Image Processing Security

```python
# Install: pip install Pillow

# utils.py
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

def sanitize_image(image_file):
    """
    Re-encode image to strip metadata and potential exploits
    """
    try:
        # Open and verify image
        img = Image.open(image_file)
        img.verify()

        # Re-open (verify() closes the image)
        image_file.seek(0)
        img = Image.open(image_file)

        # Convert to RGB if necessary
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')

        # Re-encode image
        output = BytesIO()
        img.save(output, format='JPEG', quality=85)
        output.seek(0)

        # Create new InMemoryUploadedFile
        sanitized = InMemoryUploadedFile(
            output,
            'ImageField',
            f"{uuid.uuid4()}.jpg",
            'image/jpeg',
            output.getbuffer().nbytes,
            None
        )

        return sanitized

    except Exception as e:
        raise ValidationError(f"Invalid image: {e}")

# views.py
class ImageUploadView(APIView):
    def post(self, request):
        image = request.FILES.get('image')

        # ✅ Sanitize image
        safe_image = sanitize_image(image)

        # Save safe_image...
```

### Serving Uploaded Files Safely

```python
# ❌ INSEGURO - Direct file serving
# urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# Expone TODOS los archivos

# ✅ SEGURO - Controlled file serving
# views.py
from django.http import FileResponse, Http404
import os

class DownloadFileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        try:
            file_obj = UploadedFile.objects.get(id=file_id)

            # ✅ Check permissions
            if file_obj.user != request.user:
                raise PermissionDenied()

            # ✅ Serve file securely
            file_path = file_obj.file.path

            if not os.path.exists(file_path):
                raise Http404()

            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/octet-stream'
            )
            response['Content-Disposition'] = f'attachment; filename="{file_obj.original_filename}"'

            return response

        except UploadedFile.DoesNotExist:
            raise Http404()

# ✅ MEJOR - Use X-Sendfile (nginx/Apache)
def download_file_xsendfile(request, file_id):
    file_obj = get_object_or_404(UploadedFile, id=file_id)

    # Check permissions...

    response = HttpResponse()
    response['Content-Type'] = 'application/octet-stream'
    response['X-Accel-Redirect'] = f'/protected/{file_obj.file.name}'
    response['Content-Disposition'] = f'attachment; filename="{file_obj.original_filename}"'
    return response

# nginx.conf
# location /protected/ {
#     internal;
#     alias /path/to/uploads/;
# }
```

---

## 16. Dependency Security

### pip-audit for Vulnerabilities

```bash
# Install pip-audit
pip install pip-audit

# Run vulnerability scan
pip-audit

# Check specific requirements file
pip-audit -r requirements.txt

# Output as JSON
pip-audit --format json > vulnerabilities.json

# Fix vulnerabilities automatically
pip-audit --fix
```

### safety check Integration

```bash
# Install safety
pip install safety

# Check for known vulnerabilities
safety check

# Check with detailed output
safety check --full-report

# Check requirements file
safety check -r requirements.txt

# Generate JSON report
safety check --json
```

### CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install pip-audit safety
          pip install -r requirements.txt

      - name: Run pip-audit
        run: pip-audit --desc

      - name: Run safety check
        run: safety check --full-report

      - name: Run Bandit security linter
        run: |
          pip install bandit
          bandit -r src/
```

### Requirements.txt Version Pinning

```txt
# ❌ INSEGURO - No version pinning
Django
djangorestframework
psycopg2

# ⚠️ PARCIAL - Solo major version
Django>=4.0
djangorestframework>=3.14

# ✅ SEGURO - Exact version pinning
Django==4.2.7
djangorestframework==3.14.0
psycopg2-binary==2.9.9
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1

# ✅ MEJOR - With hashes (pip freeze)
Django==4.2.7 \
    --hash=sha256:8e0f1c2c2786b5c0e39fe1afce24c926040fad47c8ea8ad30aaf1188df29fc41
```

```bash
# Generate pinned requirements with hashes
pip freeze > requirements.txt

# Or use pip-compile (pip-tools)
pip install pip-tools
pip-compile requirements.in
# Generates requirements.txt with pinned versions
```

### Dependabot/Renovate Setup

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "your-team"
    labels:
      - "dependencies"
      - "security"

    # Auto-merge minor and patch updates
    allow:
      - dependency-type: "all"

    # Ignore major version updates (manual review)
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

### CVE Monitoring

```python
# Custom management command
# management/commands/check_vulnerabilities.py
from django.core.management.base import BaseCommand
import subprocess
import json

class Command(BaseCommand):
    help = 'Check for security vulnerabilities'

    def handle(self, *args, **options):
        # Run pip-audit
        result = subprocess.run(
            ['pip-audit', '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            vulnerabilities = json.loads(result.stdout)

            self.stdout.write(
                self.style.ERROR(
                    f"Found {len(vulnerabilities)} vulnerabilities"
                )
            )

            for vuln in vulnerabilities:
                self.stdout.write(
                    f"- {vuln['name']}: {vuln['vulnerability']}"
                )

            # Send alert (email, Slack, etc.)
            send_security_alert(vulnerabilities)
        else:
            self.stdout.write(
                self.style.SUCCESS("No vulnerabilities found")
            )

# Run daily via cron
# 0 9 * * * cd /app && python manage.py check_vulnerabilities
```

---

## 17. Logging & Monitoring

### Security Event Logging

```python
# logging.py
import logging

security_logger = logging.getLogger('security')

def log_security_event(event_type, user, details, ip_address, severity='INFO'):
    """Log security-related events"""
    security_logger.log(
        getattr(logging, severity),
        f"[SECURITY] {event_type}",
        extra={
            'event_type': event_type,
            'user': str(user),
            'details': details,
            'ip_address': ip_address,
            'timestamp': timezone.now().isoformat(),
        }
    )

# views.py
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        ip_address = get_client_ip(request)

        user = authenticate(username=username, password=password)

        if user:
            log_security_event(
                'LOGIN_SUCCESS',
                user,
                {'method': 'password'},
                ip_address,
                'INFO'
            )
        else:
            log_security_event(
                'LOGIN_FAILED',
                username,
                {'reason': 'invalid_credentials'},
                ip_address,
                'WARNING'
            )
```

### Failed Login Attempts Tracking

```python
# models.py
class FailedLoginAttempt(models.Model):
    username = models.CharField(max_length=150)
    ip_address = models.GenericIPAddressField()
    attempted_at = models.DateTimeField(auto_now_add=True)
    user_agent = models.TextField()

    class Meta:
        indexes = [
            models.Index(fields=['username', 'attempted_at']),
            models.Index(fields=['ip_address', 'attempted_at']),
        ]

# utils.py
from datetime import timedelta
from django.utils import timezone

def track_failed_login(username, ip_address, user_agent):
    """Track failed login attempt"""
    FailedLoginAttempt.objects.create(
        username=username,
        ip_address=ip_address,
        user_agent=user_agent
    )

def get_recent_failed_attempts(username=None, ip_address=None, minutes=30):
    """Get recent failed attempts"""
    since = timezone.now() - timedelta(minutes=minutes)
    qs = FailedLoginAttempt.objects.filter(attempted_at__gte=since)

    if username:
        qs = qs.filter(username=username)
    if ip_address:
        qs = qs.filter(ip_address=ip_address)

    return qs.count()

# views.py
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        ip_address = get_client_ip(request)

        # Check for brute force
        recent_attempts = get_recent_failed_attempts(
            username=username,
            ip_address=ip_address
        )

        if recent_attempts >= 5:
            return Response(
                {'error': 'Too many failed attempts. Try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        user = authenticate(username=username, password=password)

        if not user:
            track_failed_login(
                username,
                ip_address,
                request.META.get('HTTP_USER_AGENT', '')
            )
            # ...
```

### Suspicious Activity Detection

```python
# signals.py
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.dispatch import receiver

@receiver(user_logged_in)
def detect_suspicious_login(sender, request, user, **kwargs):
    """Detect suspicious login patterns"""
    ip_address = get_client_ip(request)

    # Check if login from new location
    previous_ips = LoginHistory.objects.filter(
        user=user
    ).values_list('ip_address', flat=True).distinct()

    if ip_address not in previous_ips:
        # New location - send alert
        send_security_notification(
            user,
            f"New login from IP: {ip_address}"
        )

    # Save login history
    LoginHistory.objects.create(
        user=user,
        ip_address=ip_address,
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        login_at=timezone.now()
    )

# Detect multiple logins from different IPs
from datetime import timedelta

def detect_concurrent_logins(user, current_ip):
    """Detect logins from multiple IPs simultaneously"""
    recent_logins = LoginHistory.objects.filter(
        user=user,
        login_at__gte=timezone.now() - timedelta(minutes=5)
    ).exclude(ip_address=current_ip)

    if recent_logins.exists():
        # Possible account compromise
        send_security_alert(
            user,
            "Multiple concurrent logins detected"
        )
```

### Log Injection Prevention

```python
# ❌ VULNERABLE to log injection
def log_user_action(username, action):
    logger.info(f"User {username} performed {action}")
    # username = "admin\nFAKE LOG: Unauthorized access"
    # Result:
    # User admin
    # FAKE LOG: Unauthorized access performed login

# ✅ SEGURO - Sanitize input
import re

def sanitize_log_input(value):
    """Remove newlines and control characters"""
    if not isinstance(value, str):
        value = str(value)
    # Remove newlines and control characters
    return re.sub(r'[\n\r\t\x00-\x1f]', '', value)

def log_user_action(username, action):
    safe_username = sanitize_log_input(username)
    safe_action = sanitize_log_input(action)
    logger.info(f"User {safe_username} performed {safe_action}")

# ✅ MEJOR - Use structured logging
import structlog

logger = structlog.get_logger()

def log_user_action(username, action):
    logger.info(
        "user_action",
        username=username,  # Automatically escaped
        action=action
    )
```

### Centralized Logging

```python
# settings.py - Centralized logging with JSON format
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/security.log',
            'maxBytes': 10485760,
            'backupCount': 20,
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
        'security': {
            'handlers': ['security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
```

### SIEM Integration

```python
# siem.py
import requests
import json

def send_to_siem(event_type, severity, details):
    """Send security event to SIEM (Splunk, ELK, etc.)"""
    siem_endpoint = settings.SIEM_ENDPOINT
    siem_token = settings.SIEM_TOKEN

    event = {
        'timestamp': timezone.now().isoformat(),
        'event_type': event_type,
        'severity': severity,
        'application': 'django_api',
        'environment': settings.ENVIRONMENT,
        'details': details,
    }

    try:
        response = requests.post(
            siem_endpoint,
            json=event,
            headers={'Authorization': f'Bearer {siem_token}'},
            timeout=5
        )
        response.raise_for_status()
    except Exception as e:
        # Log but don't fail the request
        logger.error(f"Failed to send event to SIEM: {e}")

# Usage
def handle_security_event(event_type, severity, details):
    # Log locally
    log_security_event(event_type, severity, details)

    # Send to SIEM
    send_to_siem(event_type, severity, details)
```

---

## 18. Error Handling Security

### Never Expose Stack Traces

```python
# settings.py
# ❌ INSEGURO - DEBUG en producción
DEBUG = True  # Expone stack traces, settings, SQL queries

# ✅ SEGURO - DEBUG = False en producción
DEBUG = False

# Custom error handlers
HANDLER_400 = 'myapp.views.handler400'
HANDLER_403 = 'myapp.views.handler403'
HANDLER_404 = 'myapp.views.handler404'
HANDLER_500 = 'myapp.views.handler500'

# views.py
def handler500(request):
    """Custom 500 error handler"""
    return JsonResponse(
        {
            'error': 'Internal server error',
            'message': 'An unexpected error occurred. Please try again later.'
        },
        status=500
    )
```

### Custom Error Pages

```python
# views.py
from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    """Custom exception handler para DRF"""

    # Call DRF's default handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize response
        custom_response = {
            'error': response.data,
            'status_code': response.status_code,
        }

        # ✅ No incluir stack trace
        # ✅ No incluir detalles internos

        response.data = custom_response
    else:
        # Unhandled exception
        if settings.DEBUG:
            # En desarrollo, mostrar detalles
            raise exc
        else:
            # ✅ En producción, respuesta genérica
            return Response(
                {
                    'error': 'Internal server error',
                    'message': 'An unexpected error occurred.'
                },
                status=500
            )

    return response

# settings.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'myapp.views.custom_exception_handler'
}
```

### Generic Error Messages

```python
# ❌ INSEGURO - Revela información del sistema
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': 'User does not exist'},  # ❌ Username enumeration
                status=400
            )

        # ...

# ✅ SEGURO - Mensaje genérico
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {'error': 'Invalid credentials'},  # ✅ Generic message
                status=401
            )

        # ...
```

### Detailed Logging Internally

```python
# views.py
import logging
logger = logging.getLogger(__name__)

class PaymentView(APIView):
    def post(self, request):
        try:
            # Process payment
            result = process_payment(request.data)
            return Response({'status': 'success'})

        except PaymentError as e:
            # ✅ Log detailed error internally
            logger.error(
                f"Payment failed for user {request.user.id}",
                extra={
                    'user_id': request.user.id,
                    'error_type': type(e).__name__,
                    'error_message': str(e),
                    'payment_data': mask_sensitive_data(request.data)
                },
                exc_info=True  # Include stack trace in logs
            )

            # ✅ Return generic message to client
            return Response(
                {'error': 'Payment processing failed'},
                status=400
            )

        except Exception as e:
            # ✅ Log unexpected errors
            logger.exception(
                f"Unexpected error in payment processing",
                extra={'user_id': request.user.id}
            )

            # ✅ Generic error to client
            return Response(
                {'error': 'An unexpected error occurred'},
                status=500
            )
```

### Avoid Information Disclosure

```python
# ❌ INSEGURO - Revela estructura del sistema
{
    "error": "Database connection failed: Connection refused on host 'db.internal.company.com:5432'",
    "traceback": "File '/app/views.py', line 42, in get_data\n..."
}

# ✅ SEGURO - Sin detalles internos
{
    "error": "Service temporarily unavailable",
    "message": "Please try again later"
}

# Example implementation
# exceptions.py
class SafeAPIException(Exception):
    """Base exception con mensaje seguro para cliente"""

    def __init__(self, internal_message, client_message=None):
        self.internal_message = internal_message
        self.client_message = client_message or "An error occurred"
        super().__init__(self.internal_message)

# views.py
try:
    result = database.query(sql)
except DatabaseError as e:
    # Log internal error
    logger.error(f"Database error: {e}", exc_info=True)

    # Raise safe exception
    raise SafeAPIException(
        internal_message=f"DB query failed: {e}",
        client_message="Unable to retrieve data at this time"
    )
```

---

## 19. Database Security

### Database User Permissions

```sql
-- ❌ INSEGURO - Usuario con permisos de superuser
CREATE USER django_app WITH SUPERUSER PASSWORD 'password';

-- ✅ SEGURO - Usuario con mínimos permisos
CREATE USER django_app WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE mydb TO django_app;
GRANT USAGE ON SCHEMA public TO django_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO django_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO django_app;

-- ✅ Para READ-ONLY replica
CREATE USER django_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE mydb TO django_readonly;
GRANT USAGE ON SCHEMA public TO django_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO django_readonly;
```

```python
# settings.py - Multiple database users
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'django_app',  # Read/write
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        # ...
    },
    'readonly': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'django_readonly',  # Read-only
        'PASSWORD': os.environ.get('DB_READONLY_PASSWORD'),
        # ...
    }
}
```

### Connection Encryption

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydb',
        'USER': 'django_app',
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': 'db.example.com',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',  # ✅ Force SSL
            # For AWS RDS
            'sslrootcert': '/path/to/rds-ca-cert.pem',
        },
    }
}
```

### Database Credential Rotation

```python
# utils.py
import boto3

def rotate_database_credentials():
    """Rotate database credentials"""
    # 1. Create new credentials
    new_password = generate_secure_password()

    # 2. Update database
    execute_sql(f"ALTER USER django_app WITH PASSWORD '{new_password}'")

    # 3. Update secrets manager
    client = boto3.client('secretsmanager')
    client.update_secret(
        SecretId='production/db-password',
        SecretString=new_password
    )

    # 4. Restart application (deployment)
    trigger_deployment()

# Lambda for automatic rotation (AWS)
def lambda_handler(event, context):
    rotate_database_credentials()
```

### Backup Encryption

```bash
# PostgreSQL encrypted backup
pg_dump mydb | gpg --encrypt --recipient admin@example.com > backup.sql.gpg

# Decrypt backup
gpg --decrypt backup.sql.gpg | psql mydb

# AWS RDS - Encrypted snapshots
aws rds create-db-snapshot \
    --db-instance-identifier mydb \
    --db-snapshot-identifier mydb-snapshot-$(date +%Y%m%d) \
    --kms-key-id arn:aws:kms:region:account:key/key-id
```

---

## 20. Security Testing

### OWASP Top 10 Checklist

```markdown
# OWASP Top 10 Security Checklist

## A01:2021 - Broken Access Control
- [ ] Object-level authorization en todos los endpoints
- [ ] No exponer IDs secuenciales (usar UUIDs)
- [ ] Validar ownership en cada operación
- [ ] Rate limiting implementado
- [ ] CORS configurado correctamente

## A02:2021 - Cryptographic Failures
- [ ] Passwords hasheados con Argon2/PBKDF2
- [ ] HTTPS forzado (SECURE_SSL_REDIRECT=True)
- [ ] Secrets en environment variables, no en código
- [ ] Datos sensibles encriptados at rest
- [ ] TLS 1.2+ para todas las conexiones

## A03:2021 - Injection
- [ ] Usar Django ORM (no raw SQL)
- [ ] Parametrized queries en raw SQL
- [ ] Input validation en serializers
- [ ] HTML escaping habilitado
- [ ] No usar eval() o exec()

## A04:2021 - Insecure Design
- [ ] Authentication requerida por defecto
- [ ] Principle of least privilege
- [ ] Security requirements documentados
- [ ] Threat modeling completado

## A05:2021 - Security Misconfiguration
- [ ] DEBUG = False en producción
- [ ] SECRET_KEY único y seguro
- [ ] ALLOWED_HOSTS configurado
- [ ] Security headers implementados
- [ ] Default passwords cambiados
- [ ] Admin panel protegido

## A06:2021 - Vulnerable Components
- [ ] Dependencies actualizadas
- [ ] pip-audit ejecutado regularmente
- [ ] safety check en CI/CD
- [ ] No usar versiones deprecadas

## A07:2021 - Identification and Authentication Failures
- [ ] Multi-factor authentication disponible
- [ ] Account lockout después de fallos
- [ ] Password complexity enforced
- [ ] Session timeout configurado
- [ ] Secure password reset

## A08:2021 - Software and Data Integrity Failures
- [ ] Code signing
- [ ] Dependency verification
- [ ] CI/CD pipeline secured
- [ ] No deserialización insegura

## A09:2021 - Security Logging and Monitoring
- [ ] Security events logged
- [ ] Failed login attempts tracked
- [ ] Logs no contienen datos sensibles
- [ ] Alertas configuradas
- [ ] Log retention policy

## A10:2021 - Server-Side Request Forgery (SSRF)
- [ ] Validar URLs de input
- [ ] Whitelist de dominios permitidos
- [ ] No permitir requests a IPs privadas
- [ ] Timeout en external requests
```

### Penetration Testing Patterns

```python
# tests/security/test_authentication.py
from django.test import TestCase
from rest_framework.test import APIClient

class AuthenticationSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_brute_force_protection(self):
        """Test que rate limiting previene brute force"""
        for i in range(10):
            response = self.client.post('/api/login/', {
                'username': 'test',
                'password': 'wrong'
            })

        # Después de 5 intentos, debe estar bloqueado
        self.assertEqual(response.status_code, 429)

    def test_sql_injection_username(self):
        """Test prevención de SQL injection en username"""
        payloads = [
            "admin' OR '1'='1",
            "admin'--",
            "admin' /*",
            "' UNION SELECT * FROM users--",
        ]

        for payload in payloads:
            response = self.client.post('/api/login/', {
                'username': payload,
                'password': 'test'
            })
            self.assertNotEqual(response.status_code, 200)

    def test_jwt_token_expiration(self):
        """Test que tokens JWT expiran"""
        # Login
        response = self.client.post('/api/login/', {
            'username': 'test',
            'password': 'correct'
        })
        token = response.data['access']

        # Wait for expiration (or mock time)
        with mock.patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.now() + timedelta(hours=2)

            # Token should be expired
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            response = self.client.get('/api/protected/')
            self.assertEqual(response.status_code, 401)

# tests/security/test_authorization.py
class AuthorizationSecurityTests(TestCase):
    def test_horizontal_privilege_escalation(self):
        """Test que usuarios no pueden acceder datos de otros usuarios"""
        user1 = User.objects.create_user('user1', password='pass1')
        user2 = User.objects.create_user('user2', password='pass2')

        # user1 crea documento
        self.client.force_authenticate(user=user1)
        response = self.client.post('/api/documents/', {'content': 'secret'})
        doc_id = response.data['id']

        # user2 intenta acceder
        self.client.force_authenticate(user=user2)
        response = self.client.get(f'/api/documents/{doc_id}/')
        self.assertEqual(response.status_code, 403)

    def test_idor_with_uuid(self):
        """Test que UUIDs previenen IDOR"""
        user = User.objects.create_user('user', password='pass')
        self.client.force_authenticate(user=user)

        # Try sequential IDs
        for i in range(1, 100):
            response = self.client.get(f'/api/documents/{i}/')
            self.assertEqual(response.status_code, 404)

# tests/security/test_xss.py
class XSSSecurityTests(TestCase):
    def test_xss_in_user_input(self):
        """Test que XSS payload es escapado"""
        xss_payloads = [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:alert(1)',
            '<svg/onload=alert(1)>',
        ]

        for payload in xss_payloads:
            response = self.client.post('/api/comments/', {
                'content': payload
            })

            # Verify payload is escaped
            self.assertNotIn('<script>', response.data['content'])
            self.assertNotIn('onerror=', response.data['content'])
```

### Security Unit Tests

```python
# tests/security/test_inputs.py
class InputValidationTests(TestCase):
    def test_file_upload_size_limit(self):
        """Test file size limit enforced"""
        # Create large file (>10MB)
        large_file = SimpleUploadedFile(
            "large.jpg",
            b"0" * (11 * 1024 * 1024)
        )

        response = self.client.post('/api/upload/', {
            'file': large_file
        })
        self.assertEqual(response.status_code, 400)

    def test_file_upload_mime_validation(self):
        """Test MIME type validation"""
        # Fake image (actually PHP file)
        fake_image = SimpleUploadedFile(
            "shell.jpg",
            b"<?php system($_GET['cmd']); ?>"
        )

        response = self.client.post('/api/upload/', {
            'file': fake_image
        })
        self.assertEqual(response.status_code, 400)

    def test_path_traversal_prevention(self):
        """Test path traversal blocked"""
        payloads = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32',
            'foo/../../etc/passwd',
        ]

        for payload in payloads:
            response = self.client.get(f'/api/files/{payload}/')
            self.assertNotEqual(response.status_code, 200)

# tests/security/test_sessions.py
class SessionSecurityTests(TestCase):
    def test_session_fixation(self):
        """Test session fixation prevention"""
        # Get initial session
        response = self.client.get('/api/status/')
        initial_session = self.client.session.session_key

        # Login
        self.client.post('/api/login/', {
            'username': 'test',
            'password': 'pass'
        })

        # Session key should be different
        new_session = self.client.session.session_key
        self.assertNotEqual(initial_session, new_session)

    def test_session_cookie_flags(self):
        """Test session cookie has secure flags"""
        response = self.client.get('/api/status/')

        cookie = response.cookies.get(settings.SESSION_COOKIE_NAME)
        self.assertTrue(cookie['secure'])
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['samesite'], 'Strict')
```

### Security Regression Testing

```python
# tests/security/test_regressions.py
class SecurityRegressionTests(TestCase):
    """Tests para vulnerabilidades previamente encontradas"""

    def test_CVE_2023_XXXX_fixed(self):
        """Verify CVE-2023-XXXX is fixed"""
        # Test específico para vulnerabilidad conocida
        pass

    def test_password_reset_token_reuse(self):
        """Regression: password reset tokens can only be used once"""
        user = User.objects.create_user('test', email='test@example.com')

        # Generate reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Use token once
        response = self.client.post('/api/password-reset-confirm/', {
            'uid': uid,
            'token': token,
            'new_password': 'newpass123'
        })
        self.assertEqual(response.status_code, 200)

        # Try to reuse token
        response = self.client.post('/api/password-reset-confirm/', {
            'uid': uid,
            'token': token,
            'new_password': 'anotherpass'
        })
        self.assertEqual(response.status_code, 400)
```

---

## 21. Production Hardening

### Production Settings Checklist

```python
# settings/production.py
import os

# ✅ Security settings
DEBUG = False
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY or len(SECRET_KEY) < 50:
    raise ValueError("DJANGO_SECRET_KEY must be set and at least 50 characters")

# ✅ Allowed hosts
ALLOWED_HOSTS = [
    'api.example.com',
    'www.example.com',
]

# ✅ HTTPS enforcement
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ✅ HSTS
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ✅ Cookies
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# ✅ Security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# ✅ Database
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# ✅ Caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': os.environ.get('REDIS_PASSWORD'),
        }
    }
}
```

### Disable Unused Features

```python
# settings/production.py

# ✅ Disable browsable API
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        # Remove BrowsableAPIRenderer in production
    ],
}

# ✅ Disable Django admin if not needed
# Comment out:
# path('admin/', admin.site.urls),

# ✅ Remove debug toolbar
INSTALLED_APPS = [
    # Remove 'debug_toolbar',
]

# ✅ Disable unnecessary middleware
MIDDLEWARE = [
    # Keep only required middleware
]
```

### Remove Development Tools

```python
# requirements/production.txt
# ❌ No incluir en producción:
# django-debug-toolbar
# ipython
# jupyter
# django-extensions

# ✅ Solo production dependencies
Django==4.2.7
djangorestframework==3.14.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
whitenoise==6.6.0
sentry-sdk==1.38.0
```

### Secure Admin Panel

```python
# urls.py
from django.contrib import admin
from django.urls import path
import os

# ✅ Change admin URL
admin_url = os.environ.get('ADMIN_URL', 'admin')

urlpatterns = [
    path(f'{admin_url}/', admin.site.urls),  # /secret-admin-panel/
    # ...
]

# settings.py
# ✅ Restrict admin access by IP
ADMIN_ALLOWED_IPS = os.environ.get('ADMIN_ALLOWED_IPS', '').split(',')

# middleware.py
class AdminIPRestrictionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        admin_url = os.environ.get('ADMIN_URL', 'admin')

        if request.path.startswith(f'/{admin_url}/'):
            ip = get_client_ip(request)
            if ip not in settings.ADMIN_ALLOWED_IPS:
                return HttpResponseForbidden("Access denied")

        return self.get_response(request)
```

### Server Hardening Checklist

```bash
# System hardening checklist

# ✅ 1. Update system packages
apt update && apt upgrade -y

# ✅ 2. Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp  # SSH
ufw allow 443/tcp  # HTTPS
ufw enable

# ✅ 3. Disable root SSH login
# /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no

# ✅ 4. Install fail2ban
apt install fail2ban
systemctl enable fail2ban

# ✅ 5. Configure automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# ✅ 6. Set up proper file permissions
chmod 600 /etc/django/.env
chown django:django /var/www/app

# ✅ 7. Run as non-root user
useradd -m -s /bin/bash django
su - django

# ✅ 8. Configure PostgreSQL
# /etc/postgresql/*/main/pg_hba.conf
# hostssl all all 0.0.0.0/0 md5

# ✅ 9. Set up SSL certificates (Let's Encrypt)
certbot --nginx -d api.example.com

# ✅ 10. Configure nginx security headers
# /etc/nginx/sites-available/default
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

---

## 22. Compliance & Standards

### GDPR Considerations

```python
# models.py
from django.db import models

class User(AbstractUser):
    # ✅ Consent tracking
    gdpr_consent = models.BooleanField(default=False)
    gdpr_consent_date = models.DateTimeField(null=True, blank=True)
    marketing_consent = models.BooleanField(default=False)

    # ✅ Data subject rights
    data_export_requested = models.BooleanField(default=False)
    data_deletion_requested = models.BooleanField(default=False)
    deletion_scheduled_date = models.DateTimeField(null=True, blank=True)

# views.py
class GDPRDataExportView(APIView):
    """Export user data per GDPR Article 15"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Collect all user data
        data = {
            'personal_info': {
                'username': user.username,
                'email': user.email,
                'created_at': user.date_joined.isoformat(),
            },
            'posts': list(user.posts.values()),
            'comments': list(user.comments.values()),
            # ... all related data
        }

        # Generate JSON export
        filename = f"user_data_{user.id}_{timezone.now().strftime('%Y%m%d')}.json"

        return Response(data, headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        })

class GDPRDataDeletionView(APIView):
    """Request data deletion per GDPR Article 17"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Schedule deletion (30 days grace period)
        user.data_deletion_requested = True
        user.deletion_scheduled_date = timezone.now() + timedelta(days=30)
        user.save()

        # Send confirmation email
        send_deletion_confirmation(user)

        return Response({
            'message': 'Data deletion scheduled',
            'scheduled_date': user.deletion_scheduled_date.isoformat()
        })
```

### Data Retention Policies

```python
# management/commands/cleanup_old_data.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Clean up old data per retention policy'

    def handle(self, *args, **options):
        # Delete old sessions (>90 days)
        cutoff_date = timezone.now() - timedelta(days=90)
        Session.objects.filter(expire_date__lt=cutoff_date).delete()

        # Delete old logs (>1 year)
        old_logs = timezone.now() - timedelta(days=365)
        AuditLog.objects.filter(created_at__lt=old_logs).delete()

        # Delete inactive users (>2 years, no consent)
        inactive_cutoff = timezone.now() - timedelta(days=730)
        User.objects.filter(
            last_login__lt=inactive_cutoff,
            gdpr_consent=False
        ).delete()

        self.stdout.write(self.style.SUCCESS('Cleanup completed'))

# Crontab: Run daily
# 0 2 * * * cd /app && python manage.py cleanup_old_data
```

### Right to Deletion Implementation

```python
# tasks.py (Celery)
from celery import shared_task

@shared_task
def process_scheduled_deletions():
    """Process scheduled user deletions"""
    users_to_delete = User.objects.filter(
        data_deletion_requested=True,
        deletion_scheduled_date__lte=timezone.now()
    )

    for user in users_to_delete:
        # Anonymize instead of hard delete (preserve referential integrity)
        anonymize_user(user)

        # Or hard delete
        # user.delete()

        # Send confirmation
        send_deletion_complete_email(user.email)

def anonymize_user(user):
    """Anonymize user data"""
    user.username = f"deleted_{uuid.uuid4().hex[:8]}"
    user.email = f"deleted_{uuid.uuid4().hex}@deleted.local"
    user.first_name = "Deleted"
    user.last_name = "User"
    user.is_active = False
    user.save()

    # Anonymize related data
    user.profile.bio = "[deleted]"
    user.profile.save()
```

### Audit Trails

```python
# models.py
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]

# middleware.py
class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log modifying operations
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if request.user.is_authenticated:
                AuditLog.objects.create(
                    user=request.user,
                    action=f"{request.method} {request.path}",
                    resource_type=self.get_resource_type(request),
                    resource_id=self.get_resource_id(request),
                    ip_address=get_client_ip(request),
                )

        return response
```

---

## Security Quick Reference

### Essential Settings for Production

```python
# settings/production.py - Copy-paste essentials
DEBUG = False
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
ALLOWED_HOSTS = ['your-domain.com']

# HTTPS
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Cookies
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True

# Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Password hashers
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]
```

### Common Vulnerabilities Quick Check

```python
# ❌ Vulnerable patterns to avoid:
User.objects.raw(f"SELECT * FROM users WHERE id = {user_id}")
eval(user_input)
exec(user_input)
__import__(user_input)
open(user_input)
Response(f"<html>{user_content}</html>")

# ✅ Secure alternatives:
User.objects.raw("SELECT * FROM users WHERE id = %s", [user_id])
# Don't use eval/exec with user input
# Whitelist imports
# Sanitize file paths
escape(user_content)
```

---

## Referencias

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Django Security**: https://docs.djangoproject.com/en/stable/topics/security/
- **DRF Security**: https://www.django-rest-framework.org/topics/security/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework

---

**Última actualización**: 2026-02
**Versión**: 1.0
