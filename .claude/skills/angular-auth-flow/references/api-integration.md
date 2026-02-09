# API Integration - Backend Examples

Ejemplos de integración con APIs backend (Django REST Framework con JWT).

## Backend API Endpoints

### Authentication Endpoints

```python
# Django REST Framework + SimpleJWT

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer, RegisterSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    POST /api/auth/login
    Body: { email, password, rememberMe }
    """
    email = request.data.get('email')
    password = request.data.get('password')
    remember_me = request.data.get('rememberMe', False)

    user = authenticate(email=email, password=password)

    if user is None:
        return Response({
            'success': False,
            'message': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Generar tokens
    refresh = RefreshToken.for_user(user)

    # Ajustar expiración según Remember Me
    if remember_me:
        refresh.access_token.set_exp(lifetime=timedelta(minutes=15))
        refresh.set_exp(lifetime=timedelta(days=30))
    else:
        refresh.access_token.set_exp(lifetime=timedelta(minutes=15))
        refresh.set_exp(lifetime=timedelta(days=1))

    return Response({
        'success': True,
        'data': {
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'expiresIn': 900,  # 15 minutos en segundos
            'tokenType': 'Bearer',
            'user': UserSerializer(user).data
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/auth/register
    Body: { email, password, passwordConfirmation, firstName, lastName }
    """
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()

    # Enviar email de verificación
    send_verification_email(user)

    # Auto-login después de registro
    refresh = RefreshToken.for_user(user)

    return Response({
        'success': True,
        'data': {
            'accessToken': str(refresh.access_token),
            'refreshToken': str(refresh),
            'expiresIn': 900,
            'tokenType': 'Bearer',
            'user': UserSerializer(user).data
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    POST /api/auth/refresh
    Body: { refreshToken }
    """
    refresh_token = request.data.get('refreshToken')

    if not refresh_token:
        return Response({
            'success': False,
            'message': 'Refresh token required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)

        return Response({
            'accessToken': access_token,
            'expiresIn': 900
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Invalid or expired refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    POST /api/auth/logout
    Body: { refreshToken }
    """
    try:
        refresh_token = request.data.get('refreshToken')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()  # Requiere 'rest_framework_simplejwt.token_blacklist'

        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception:
        return Response({
            'success': False,
            'message': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    POST /api/auth/forgot-password
    Body: { email }
    """
    email = request.data.get('email')

    try:
        user = User.objects.get(email=email)

        # Generar token de reset
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Enviar email
        reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}&uid={uid}"
        send_password_reset_email(user, reset_url)

        return Response({
            'success': True,
            'message': 'Password reset email sent'
        })
    except User.DoesNotExist:
        # No revelar si el email existe (seguridad)
        return Response({
            'success': True,
            'message': 'If the email exists, a reset link has been sent'
        })

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    POST /api/auth/reset-password
    Body: { token, password, passwordConfirmation }
    """
    token = request.data.get('token')
    uid = request.data.get('uid')
    password = request.data.get('password')
    password_confirmation = request.data.get('passwordConfirmation')

    if password != password_confirmation:
        return Response({
            'success': False,
            'message': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)

        if not default_token_generator.check_token(user, token):
            return Response({
                'success': False,
                'message': 'Invalid or expired token'
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()

        return Response({
            'success': True,
            'message': 'Password reset successful'
        })
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'success': False,
            'message': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    POST /api/auth/verify-email
    Body: { token }
    """
    token = request.data.get('token')

    try:
        verification = EmailVerification.objects.get(token=token)

        if verification.is_expired():
            return Response({
                'success': False,
                'message': 'Verification link has expired'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = verification.user
        user.email_verified = True
        user.save()

        verification.delete()

        return Response({
            'success': True,
            'message': 'Email verified successfully'
        })
    except EmailVerification.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid verification token'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_email(request):
    """
    POST /api/auth/resend-verification
    """
    user = request.user

    if user.email_verified:
        return Response({
            'success': False,
            'message': 'Email already verified'
        }, status=status.HTTP_400_BAD_REQUEST)

    send_verification_email(user)

    return Response({
        'success': True,
        'message': 'Verification email sent'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    GET /api/auth/me
    """
    return Response({
        'success': True,
        'data': UserSerializer(request.user).data
    })
```

### User Profile Endpoints

```python
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    PUT /api/user/profile
    Body: { firstName, lastName, avatar }
    """
    user = request.user
    serializer = UpdateProfileSerializer(user, data=request.data, partial=True)

    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()

    return Response({
        'success': True,
        'data': UserSerializer(user).data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/user/change-password
    Body: { currentPassword, newPassword, newPasswordConfirmation }
    """
    user = request.user
    current_password = request.data.get('currentPassword')
    new_password = request.data.get('newPassword')
    new_password_confirmation = request.data.get('newPasswordConfirmation')

    if not user.check_password(current_password):
        return Response({
            'success': False,
            'message': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)

    if new_password != new_password_confirmation:
        return Response({
            'success': False,
            'message': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    # Invalidar todos los tokens existentes
    refresh_tokens = OutstandingToken.objects.filter(user=user)
    for token in refresh_tokens:
        BlacklistedToken.objects.get_or_create(token=token)

    return Response({
        'success': True,
        'message': 'Password changed successfully'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """
    POST /api/user/avatar
    Body: FormData with 'avatar' file
    """
    user = request.user

    if 'avatar' not in request.FILES:
        return Response({
            'success': False,
            'message': 'No file provided'
        }, status=status.HTTP_400_BAD_REQUEST)

    avatar_file = request.FILES['avatar']

    # Validar tipo de archivo
    if not avatar_file.content_type.startswith('image/'):
        return Response({
            'success': False,
            'message': 'File must be an image'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validar tamaño (max 2MB)
    if avatar_file.size > 2 * 1024 * 1024:
        return Response({
            'success': False,
            'message': 'File size must be less than 2MB'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Guardar avatar (usando storage como S3 o local)
    user.avatar = avatar_file
    user.save()

    return Response({
        'success': True,
        'data': {
            'avatarUrl': user.avatar.url
        }
    })
```

## API Response Format

### Success Response

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Ejemplo
{
  "success": true,
  "data": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Profile updated successfully"
}
```

### Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Ejemplo - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["This email is already taken"],
    "password": ["Password must be at least 8 characters"]
  }
}

// Ejemplo - Generic Error
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Django Settings

```python
# settings.py

from datetime import timedelta

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "https://app.example.com",
]

CORS_ALLOW_CREDENTIALS = True

# Security
SECURE_SSL_REDIRECT = True  # Forzar HTTPS en producción
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Email (para password reset y verification)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = env('SENDGRID_API_KEY')
DEFAULT_FROM_EMAIL = 'noreply@example.com'

# Frontend URL (para links en emails)
FRONTEND_URL = 'https://app.example.com'
```

## URL Configuration

```python
# urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/login', views.login, name='login'),
    path('auth/register', views.register, name='register'),
    path('auth/logout', views.logout, name='logout'),
    path('auth/refresh', views.refresh_token, name='refresh_token'),
    path('auth/forgot-password', views.forgot_password, name='forgot_password'),
    path('auth/reset-password', views.reset_password, name='reset_password'),
    path('auth/verify-email', views.verify_email, name='verify_email'),
    path('auth/resend-verification', views.resend_verification_email, name='resend_verification'),
    path('auth/me', views.get_current_user, name='current_user'),

    # User endpoints
    path('user/profile', views.update_profile, name='update_profile'),
    path('user/change-password', views.change_password, name='change_password'),
    path('user/avatar', views.upload_avatar, name='upload_avatar'),
]
```

## Environment Configuration

### Angular environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  requireHttps: false
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',
  requireHttps: true
};
```

### Django .env

```bash
# .env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=api.example.com,localhost

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Email
SENDGRID_API_KEY=your-sendgrid-key

# Frontend
FRONTEND_URL=https://app.example.com

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
```

## Testing API Integration

```typescript
// Mock API responses for testing
export const mockApiResponses = {
  login: {
    success: true,
    data: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 900,
      tokenType: 'Bearer' as const,
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        emailVerified: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    }
  },

  error: {
    success: false,
    message: 'Invalid credentials'
  },

  validationError: {
    success: false,
    message: 'Validation failed',
    errors: {
      email: ['This email is already taken']
    }
  }
};
```
